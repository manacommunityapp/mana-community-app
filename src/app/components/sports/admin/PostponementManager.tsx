import { useState, useCallback } from "react";
import {
  CloudRain, Clock, MapPin, AlertTriangle, Loader2, X, CheckCircle2,
  Calendar, ArrowRight, Shield, ChevronDown, ChevronRight, Eye,
  RefreshCw, Send, Undo2, Play,
} from "lucide-react";
import { tournamentStageService } from "../../../../services/sports/tournamentStageService";
import { showSuccess, showError, showWarning } from "../../../../utils/ToastUtils";
import { confirmAction } from "../../../../utils/AlertUtils";
import type {
  PostponementReason,
  PostponementScope,
  MatchPostponement,
  ScheduleImpactAnalysis,
  ReserveDay,
} from "../../../../types/tournamentStage";

// ─── Constants ──────────────────────────────────────────────────────────────

const POSTPONEMENT_REASONS: { value: PostponementReason; label: string; icon: typeof CloudRain }[] = [
  { value: "RAIN", label: "Rain / Bad Weather", icon: CloudRain },
  { value: "VENUE_UNAVAILABLE", label: "Venue Unavailable", icon: MapPin },
  { value: "COURT_MAINTENANCE", label: "Court Maintenance", icon: MapPin },
  { value: "FLOODING", label: "Flooding / Waterlogging", icon: CloudRain },
  { value: "REFEREE_UNAVAILABLE", label: "Referee Unavailable", icon: Shield },
  { value: "PLAYER_INJURY", label: "Player / Team Injury", icon: AlertTriangle },
  { value: "TEAM_REQUEST", label: "Team Requests Postponement", icon: Clock },
  { value: "LOCAL_RESTRICTIONS", label: "Local Permissions / Restrictions", icon: Shield },
  { value: "POWER_FAILURE", label: "Power Failure / Technical Issues", icon: AlertTriangle },
  { value: "ORGANIZER_DECISION", label: "Organizer Decision", icon: Shield },
  { value: "PREVIOUS_MATCH_OVERTIME", label: "Previous Match Overtime", icon: Clock },
  { value: "PUBLIC_HOLIDAY", label: "Public Holiday / Local Event", icon: Calendar },
  { value: "TRANSPORT_DISRUPTION", label: "Transport / Access Disruption", icon: AlertTriangle },
  { value: "SAFETY_CONCERNS", label: "Safety Concerns", icon: AlertTriangle },
  { value: "INSUFFICIENT_LIGHT", label: "Insufficient Light / Visibility", icon: CloudRain },
  { value: "OTHER", label: "Other", icon: AlertTriangle },
];

const SCOPE_OPTIONS: { value: PostponementScope; label: string; description: string }[] = [
  { value: "SINGLE_MATCH", label: "Single Match", description: "Postpone only this match" },
  { value: "MULTIPLE_MATCHES", label: "Multiple Matches", description: "Select multiple matches to postpone" },
  { value: "ENTIRE_ROUND", label: "Entire Round", description: "Postpone all matches in this round" },
  { value: "ENTIRE_STAGE", label: "Entire Stage", description: "Postpone the complete stage" },
];

// ─── Impact Preview ─────────────────────────────────────────────────────────

function ImpactPreview({ impact }: { impact: ScheduleImpactAnalysis }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 space-y-3">
      <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
        <AlertTriangle className="w-4 h-4 text-amber-500" />
        Reschedule Impact Preview
      </div>

      {/* Proposed Change */}
      <div className="bg-indigo-50 rounded-lg p-3">
        <div className="text-[8px] text-indigo-600 font-semibold uppercase tracking-wider mb-1">Proposed Change</div>
        <div className="text-[10px] text-indigo-800">
          Match #{impact.proposedChange.matchId}: {impact.proposedChange.field}{" "}
          <span className="line-through text-slate-500">{impact.proposedChange.currentValue}</span>
          <ArrowRight className="w-3 h-3 inline mx-1" />
          <span className="font-bold">{impact.proposedChange.proposedValue}</span>
        </div>
      </div>

      {/* Affected Items */}
      {impact.affectedItems.length > 0 && (
        <div>
          <div className="text-[9px] font-semibold text-slate-700 mb-1">Affected Matches</div>
          <div className="space-y-1">
            {impact.affectedItems.map(item => (
              <div
                key={item.matchId}
                className={`rounded-lg p-2 text-[9px] flex items-center justify-between ${
                  item.impactType === "REQUIRES_REVIEW" ? "bg-amber-50 text-amber-800" :
                  item.impactType === "AUTO_ADJUSTABLE" ? "bg-blue-50 text-blue-800" :
                  "bg-slate-50 text-slate-600"
                }`}
              >
                <div>
                  <span className="font-semibold">{item.matchName}</span>
                  <span className="mx-1">·</span>
                  <span>{item.reason}</span>
                </div>
                <span className="text-[8px] font-bold uppercase tracking-wider">
                  {item.impactType.replace(/_/g, " ")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Conflicts */}
      {impact.conflicts.length > 0 && (
        <div>
          <div className="text-[9px] font-semibold text-red-700 mb-1">Conflicts Detected</div>
          <div className="space-y-1">
            {impact.conflicts.map((c, i) => (
              <div
                key={i}
                className={`rounded-lg p-2 text-[9px] flex items-start gap-2 ${
                  c.severity === "ERROR" ? "bg-red-50 text-red-800" : "bg-amber-50 text-amber-800"
                }`}
              >
                <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">{c.type.replace(/_/g, " ")}:</span> {c.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Verdict */}
      <div className={`rounded-lg p-2 text-[10px] font-semibold text-center ${
        impact.canAutoApply ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
      }`}>
        {impact.canAutoApply
          ? "Changes can be auto-applied without downstream conflicts"
          : "Manual review required — resolve conflicts before applying"
        }
      </div>
    </div>
  );
}

// ─── Postpone Match Modal ───────────────────────────────────────────────────

export function PostponeMatchModal({
  matchId,
  matchName,
  originalDate,
  reserveDays,
  onClose,
  onPostponed,
}: {
  matchId: number;
  matchName: string;
  originalDate: string;
  reserveDays: ReserveDay[];
  onClose: () => void;
  onPostponed: () => void;
}) {
  const [reason, setReason] = useState<PostponementReason>("RAIN");
  const [description, setDescription] = useState("");
  const [proposedDate, setProposedDate] = useState("");
  const [proposedTime, setProposedTime] = useState("");
  const [selectedReserveDay, setSelectedReserveDay] = useState<number | null>(null);
  const [impact, setImpact] = useState<ScheduleImpactAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingImpact, setCheckingImpact] = useState(false);

  const handleCheckImpact = async () => {
    if (!proposedDate) {
      showWarning("Select a proposed date to check impact");
      return;
    }
    setCheckingImpact(true);
    try {
      const newStartAt = proposedTime ? `${proposedDate}T${proposedTime}` : `${proposedDate}T00:00:00`;
      const result = await tournamentStageService.getScheduleImpact(matchId, { newStartAt });
      setImpact(result);
    } catch (e: any) {
      showError(e?.message || "Failed to check impact");
    } finally {
      setCheckingImpact(false);
    }
  };

  const handlePostpone = async () => {
    if (!description.trim()) {
      showWarning("Please provide a reason description");
      return;
    }
    const confirmed = await confirmAction(
      "Postpone Match",
      `Postpone "${matchName}"? A new schedule version will be created.`
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      const proposedStartAt = proposedDate
        ? (proposedTime ? `${proposedDate}T${proposedTime}` : `${proposedDate}T00:00:00`)
        : undefined;
      await tournamentStageService.postponeMatch(matchId, {
        reasonCode: reason,
        reasonDescription: description.trim(),
        proposedStartAt,
        reserveDayId: selectedReserveDay ?? undefined,
      });
      showSuccess(`"${matchName}" postponed successfully`);
      onPostponed();
    } catch (e: any) {
      showError(e?.message || "Failed to postpone match");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CloudRain className="w-5 h-5 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-800">Postpone Match</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg cursor-pointer">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Match Info */}
        <div className="bg-slate-50 rounded-xl p-3">
          <div className="text-[10px] font-semibold text-slate-800">{matchName}</div>
          <div className="text-[9px] text-slate-500 flex items-center gap-1 mt-0.5">
            <Calendar className="w-2.5 h-2.5" />
            Original: {new Date(originalDate).toLocaleString("en-IN", {
              day: "2-digit", month: "short", year: "numeric",
              hour: "2-digit", minute: "2-digit", hour12: true,
            })}
          </div>
        </div>

        {/* Reason */}
        <div>
          <label className="text-[10px] font-semibold text-slate-600 block mb-1">Reason</label>
          <select
            value={reason}
            onChange={e => setReason(e.target.value as PostponementReason)}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none"
          >
            {POSTPONEMENT_REASONS.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] font-semibold text-slate-600 block mb-1">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Describe the reason for postponement…"
            rows={2}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none resize-none"
          />
        </div>

        {/* Rescheduling Options */}
        <div className="border-t border-slate-100 pt-3 space-y-3">
          <div className="text-[10px] font-semibold text-slate-700">Rescheduling Options</div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[9px] font-semibold text-slate-600 block mb-0.5">Proposed Date</label>
              <input
                type="date"
                value={proposedDate}
                onChange={e => setProposedDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none"
              />
            </div>
            <div>
              <label className="text-[9px] font-semibold text-slate-600 block mb-0.5">Proposed Time</label>
              <input
                type="time"
                value={proposedTime}
                onChange={e => setProposedTime(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none"
              />
            </div>
          </div>

          {/* Reserve Day Selection */}
          {reserveDays.length > 0 && (
            <div>
              <label className="text-[9px] font-semibold text-slate-600 block mb-0.5">Use Reserve Day</label>
              <select
                value={selectedReserveDay ?? ""}
                onChange={e => setSelectedReserveDay(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none"
              >
                <option value="">— Select reserve day —</option>
                {reserveDays
                  .filter(rd => rd.status === "AVAILABLE")
                  .map(rd => (
                    <option key={rd.id} value={rd.id}>
                      {new Date(rd.reserveDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                      {rd.venueName && ` · ${rd.venueName}`}
                      {rd.startTime && ` · ${rd.startTime}`}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Check Impact */}
          <button
            onClick={handleCheckImpact}
            disabled={checkingImpact || !proposedDate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 disabled:opacity-50 cursor-pointer"
          >
            {checkingImpact ? <Loader2 className="w-3 h-3 animate-spin" /> : <Eye className="w-3 h-3" />}
            Check Impact
          </button>
        </div>

        {/* Impact Preview */}
        {impact && <ImpactPreview impact={impact} />}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer">
            Cancel
          </button>
          <button
            onClick={handlePostpone}
            disabled={loading}
            className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl shadow-sm hover:shadow-md disabled:opacity-50 cursor-pointer"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Postpone Match"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Reserve Day Manager ────────────────────────────────────────────────────

export function ReserveDayManager({
  configId,
  reserveDays,
  onRefresh,
}: {
  configId: number;
  reserveDays: ReserveDay[];
  onRefresh: () => void;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [addDate, setAddDate] = useState("");
  const [addStart, setAddStart] = useState("09:00");
  const [addEnd, setAddEnd] = useState("18:00");
  const [addType, setAddType] = useState<"TOURNAMENT_WIDE" | "STAGE_SPECIFIC" | "MATCH_SPECIFIC">("TOURNAMENT_WIDE");
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!addDate) {
      showWarning("Select a date for the reserve day");
      return;
    }
    setSaving(true);
    try {
      await tournamentStageService.createReserveDay({
        tournamentConfigId: configId,
        reserveDate: addDate,
        startTime: addStart,
        endTime: addEnd,
        reserveType: addType,
      });
      showSuccess("Reserve day added");
      setShowAdd(false);
      setAddDate("");
      onRefresh();
    } catch (e: any) {
      showError(e?.message || "Failed to add reserve day");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-bold text-slate-800">Reserve Days</span>
          <span className="text-[9px] text-slate-400">{reserveDays.length} configured</span>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 cursor-pointer"
        >
          + Add Reserve Day
        </button>
      </div>

      {showAdd && (
        <div className="bg-white rounded-xl border border-slate-200 p-3 space-y-2">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div>
              <label className="text-[9px] font-semibold text-slate-600 block mb-0.5">Date</label>
              <input type="date" value={addDate} onChange={e => setAddDate(e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg outline-none" />
            </div>
            <div>
              <label className="text-[9px] font-semibold text-slate-600 block mb-0.5">Start</label>
              <input type="time" value={addStart} onChange={e => setAddStart(e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg outline-none" />
            </div>
            <div>
              <label className="text-[9px] font-semibold text-slate-600 block mb-0.5">End</label>
              <input type="time" value={addEnd} onChange={e => setAddEnd(e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg outline-none" />
            </div>
            <div>
              <label className="text-[9px] font-semibold text-slate-600 block mb-0.5">Type</label>
              <select value={addType} onChange={e => setAddType(e.target.value as any)}
                className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg outline-none">
                <option value="TOURNAMENT_WIDE">Tournament-wide</option>
                <option value="STAGE_SPECIFIC">Stage-specific</option>
                <option value="MATCH_SPECIFIC">Match-specific</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowAdd(false)} className="px-3 py-1 text-[10px] text-slate-500 hover:bg-slate-50 rounded-lg cursor-pointer">Cancel</button>
            <button onClick={handleAdd} disabled={saving}
              className="px-3 py-1 text-[10px] font-bold text-white bg-indigo-600 rounded-lg disabled:opacity-50 cursor-pointer">
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
            </button>
          </div>
        </div>
      )}

      {reserveDays.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm divide-y divide-slate-50">
          {reserveDays.map(rd => (
            <div key={rd.id} className="flex items-center justify-between p-3">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${
                  rd.status === "AVAILABLE" ? "bg-emerald-400" :
                  rd.status === "ACTIVATED" ? "bg-amber-400" :
                  rd.status === "USED" ? "bg-violet-400" :
                  "bg-slate-300"
                }`} />
                <div>
                  <div className="text-[10px] font-semibold text-slate-800">
                    {new Date(rd.reserveDate).toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}
                  </div>
                  <div className="text-[9px] text-slate-500">
                    {rd.startTime} – {rd.endTime}
                    {rd.venueName && ` · ${rd.venueName}`}
                    {rd.courtName && ` · ${rd.courtName}`}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                  rd.status === "AVAILABLE" ? "bg-emerald-50 text-emerald-700" :
                  rd.status === "ACTIVATED" ? "bg-amber-50 text-amber-700" :
                  rd.status === "USED" ? "bg-violet-50 text-violet-700" :
                  "bg-slate-100 text-slate-500"
                }`}>
                  {rd.status}
                </span>
                <span className="text-[8px] text-slate-400 uppercase tracking-wider">
                  {rd.reserveType.replace(/_/g, " ")}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
