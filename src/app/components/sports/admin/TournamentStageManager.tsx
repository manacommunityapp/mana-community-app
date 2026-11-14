import { useState, useEffect, useCallback } from "react";
import {
  Layers, Plus, ChevronDown, ChevronRight, RefreshCw, Settings,
  Play, CheckCircle2, Send, Clock, AlertTriangle, Trophy, Trash2,
  Eye, Edit3, Shield, BarChart3, Calendar, Zap, ArrowRight,
  Loader2, X, ChevronUp,
} from "lucide-react";
import { tournamentStageService } from "../../../../services/sports/tournamentStageService";
import { tournamentService, type ConfigInfo } from "../../../../services/sports/tournamentService";
import { showSuccess, showError, showWarning, showInfo } from "../../../../utils/ToastUtils";
import { confirmAction } from "../../../../utils/AlertUtils";
import type {
  TournamentStage,
  StageType,
  StageStatus,
  SchedulingMode,
  TournamentScheduleDashboard,
  StageScheduleSummary,
} from "../../../../types/tournamentStage";

// ─── Constants ──────────────────────────────────────────────────────────────

const STAGE_TYPE_OPTIONS: { value: StageType; label: string }[] = [
  { value: "GROUP_STAGE", label: "Group Stage" },
  { value: "ROUND_OF_16", label: "Round of 16" },
  { value: "QUARTER_FINAL", label: "Quarter-finals" },
  { value: "SEMI_FINAL", label: "Semi-finals" },
  { value: "THIRD_PLACE", label: "Third-place Match" },
  { value: "FINAL", label: "Final" },
  { value: "LEAGUE_MATCH", label: "League Match" },
  { value: "SWISS_ROUND", label: "Swiss Round" },
  { value: "ELIMINATOR", label: "Eliminator" },
  { value: "QUALIFIER", label: "Qualifier" },
  { value: "SUPER_FINAL", label: "Super Final" },
];

const SCHEDULING_MODE_OPTIONS: { value: SchedulingMode; label: string; description: string }[] = [
  { value: "FULL_UPFRONT", label: "Full Schedule", description: "Generate everything upfront, publish stage-wise" },
  { value: "STAGE_WISE", label: "Stage-wise", description: "Generate each stage independently" },
  { value: "HYBRID", label: "Hybrid (Recommended)", description: "Early stages upfront, later stages dynamically" },
];

const STAGE_STATUS_STYLES: Record<StageStatus, { bg: string; text: string; icon: typeof Clock }> = {
  NOT_GENERATED: { bg: "bg-slate-100", text: "text-slate-600", icon: Clock },
  DRAFT: { bg: "bg-amber-50", text: "text-amber-700", icon: Edit3 },
  VALIDATED: { bg: "bg-blue-50", text: "text-blue-700", icon: Shield },
  APPROVED: { bg: "bg-indigo-50", text: "text-indigo-700", icon: CheckCircle2 },
  PUBLISHED: { bg: "bg-emerald-50", text: "text-emerald-700", icon: Send },
  COMPLETED: { bg: "bg-violet-50", text: "text-violet-700", icon: Trophy },
  CANCELLED: { bg: "bg-red-50", text: "text-red-600", icon: X },
};

function StageStatusBadge({ status }: { status: StageStatus }) {
  const style = STAGE_STATUS_STYLES[status] || STAGE_STATUS_STYLES.NOT_GENERATED;
  const Icon = style.icon;
  const label = status.replace(/_/g, " ");
  return (
    <span className={`${style.bg} ${style.text} inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wide`}>
      <Icon className="w-2.5 h-2.5" />
      {label}
    </span>
  );
}

function PublicationBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    UNPUBLISHED: "bg-slate-100 text-slate-500",
    PUBLISHED: "bg-emerald-50 text-emerald-700",
    UPDATED: "bg-blue-50 text-blue-700",
    WITHDRAWN: "bg-red-50 text-red-600",
  };
  return (
    <span className={`${styles[status] || "bg-slate-100 text-slate-500"} px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider`}>
      {status}
    </span>
  );
}

// ─── Add Stage Modal ────────────────────────────────────────────────────────

function AddStageModal({
  configId,
  existingStages,
  onClose,
  onCreated,
}: {
  configId: number;
  existingStages: TournamentStage[];
  onClose: () => void;
  onCreated: (s: TournamentStage) => void;
}) {
  const [stageName, setStageName] = useState("");
  const [stageType, setStageType] = useState<StageType>("GROUP_STAGE");
  const [stageOrder, setStageOrder] = useState(existingStages.length + 1);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [saving, setSaving] = useState(false);

  const handleNameChange = (val: string) => {
    setStageName(val);
    const lower = val.toLowerCase();
    if (lower.includes("quarter")) setStageType("QUARTER_FINAL");
    else if (lower.includes("semi")) setStageType("SEMI_FINAL");
    else if (lower.includes("super final")) setStageType("SUPER_FINAL");
    else if (lower.includes("final") && !lower.includes("semi") && !lower.includes("quarter")) setStageType("FINAL");
    else if (lower.includes("16") || lower.includes("sixteen")) setStageType("ROUND_OF_16");
    else if (lower.includes("32") || lower.includes("thirty")) setStageType("ROUND_OF_32");
    else if (lower.includes("64") || lower.includes("sixty")) setStageType("ROUND_OF_64");
    else if (lower.includes("third") || lower.includes("3rd")) setStageType("THIRD_PLACE");
    else if (lower.includes("league")) setStageType("LEAGUE_MATCH");
    else if (lower.includes("swiss")) setStageType("SWISS_ROUND");
    else if (lower.includes("eliminator")) setStageType("ELIMINATOR");
    else if (lower.includes("qualifier")) setStageType("QUALIFIER");
    else if (lower.includes("group")) setStageType("GROUP_STAGE");
  };

  const handleSave = async () => {
    if (!stageName.trim()) {
      showWarning("Stage name is required");
      return;
    }
    setSaving(true);
    try {
      const created = await tournamentStageService.createStage({
        tournamentConfigId: configId,
        stageName: stageName.trim(),
        stageType,
        stageOrder,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      showSuccess(`Stage "${created.stageName}" created`);
      onCreated(created);
    } catch (e: any) {
      showError(e?.message || "Failed to create stage");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">Add Tournament Stage</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg cursor-pointer"><X className="w-4 h-4 text-slate-400" /></button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-semibold text-slate-600 block mb-1">Stage Name</label>
            <input
              value={stageName}
              onChange={e => handleNameChange(e.target.value)}
              placeholder="e.g. Group Stage, Quarter-finals"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] font-semibold text-slate-600 block mb-1">Stage Type</label>
            <select
              value={stageType}
              onChange={e => setStageType(e.target.value as StageType)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none"
            >
              {STAGE_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-slate-600 block mb-1">Stage Order</label>
            <input
              type="number"
              min={1}
              value={stageOrder}
              onChange={e => setStageOrder(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold text-slate-600 block mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-slate-600 block mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer">Cancel</button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl shadow-sm hover:shadow-md disabled:opacity-50 cursor-pointer"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Add Stage"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Stage Row ──────────────────────────────────────────────────────────────

function StageRow({
  stage,
  isExpanded,
  onToggle,
  onAction,
  actionLoading,
}: {
  stage: TournamentStage;
  isExpanded: boolean;
  onToggle: () => void;
  onAction: (action: string, stageId: number) => void;
  actionLoading: string | null;
}) {
  const canGenerate = stage.stageStatus === "NOT_GENERATED";
  const canValidate = stage.stageStatus === "DRAFT";
  const canApprove = stage.stageStatus === "VALIDATED";
  const canPublish = stage.stageStatus === "APPROVED" || stage.stageStatus === "VALIDATED";
  const canDelete = stage.stageStatus === "NOT_GENERATED" || stage.stageStatus === "DRAFT";
  const isLoading = (a: string) => actionLoading === `${a}-${stage.id}`;

  return (
    <div className="border border-slate-100 rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center gap-3 p-3 text-left hover:bg-slate-50/50 transition-colors cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex-shrink-0 text-slate-400">
          {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </div>
        <div className="flex-shrink-0 w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px] font-bold">
          {stage.stageOrder}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold text-slate-800 truncate">{stage.stageName}</span>
            <StageStatusBadge status={stage.stageStatus} />
            <PublicationBadge status={stage.publicationStatus} />
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-[9px] text-slate-500">
            <span>{stage.stageType.replace(/_/g, " ")}</span>
            {stage.matchCount > 0 && (
              <span>{stage.completedMatchCount}/{stage.matchCount} matches</span>
            )}
            {stage.startDate && (
              <span className="flex items-center gap-0.5">
                <Calendar className="w-2.5 h-2.5" />
                {new Date(stage.startDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
              </span>
            )}
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-3 pt-1 border-t border-slate-50 space-y-3">
          {/* Stage Actions */}
          <div className="flex flex-wrap gap-2">
            {canGenerate && (
              <button
                onClick={() => onAction("generate", stage.id)}
                disabled={!!actionLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 disabled:opacity-50 cursor-pointer"
              >
                {isLoading("generate") ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                Generate
              </button>
            )}
            {canValidate && (
              <button
                onClick={() => onAction("validate", stage.id)}
                disabled={!!actionLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 disabled:opacity-50 cursor-pointer"
              >
                {isLoading("validate") ? <Loader2 className="w-3 h-3 animate-spin" /> : <Shield className="w-3 h-3" />}
                Validate
              </button>
            )}
            {canApprove && (
              <button
                onClick={() => onAction("approve", stage.id)}
                disabled={!!actionLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 disabled:opacity-50 cursor-pointer"
              >
                {isLoading("approve") ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                Approve
              </button>
            )}
            {canPublish && (
              <button
                onClick={() => onAction("publish", stage.id)}
                disabled={!!actionLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 disabled:opacity-50 cursor-pointer"
              >
                {isLoading("publish") ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                Publish
              </button>
            )}
            <button
              onClick={() => onAction("preview", stage.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              <Eye className="w-3 h-3" /> Preview
            </button>
            {canDelete && (
              <button
                onClick={() => onAction("delete", stage.id)}
                disabled={!!actionLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold bg-red-50 text-red-600 rounded-lg hover:bg-red-100 disabled:opacity-50 cursor-pointer"
              >
                {isLoading("delete") ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                Delete
              </button>
            )}
          </div>

          {/* Stage Details */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="bg-slate-50 rounded-lg p-2">
              <div className="text-[8px] text-slate-500 uppercase tracking-wider">Matches</div>
              <div className="text-xs font-bold text-slate-800">{stage.matchCount}</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-2">
              <div className="text-[8px] text-slate-500 uppercase tracking-wider">Completed</div>
              <div className="text-xs font-bold text-emerald-600">{stage.completedMatchCount}</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-2">
              <div className="text-[8px] text-slate-500 uppercase tracking-wider">Mode</div>
              <div className="text-xs font-bold text-slate-800">{stage.schedulingMode.replace(/_/g, " ")}</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-2">
              <div className="text-[8px] text-slate-500 uppercase tracking-wider">Version</div>
              <div className="text-xs font-bold text-slate-800">{stage.publishedVersionId ? `v${stage.publishedVersionId}` : "—"}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Scheduling Mode Selector ───────────────────────────────────────────────

function SchedulingModeSelector({
  value,
  onChange,
}: {
  value: SchedulingMode;
  onChange: (m: SchedulingMode) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
      {SCHEDULING_MODE_OPTIONS.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
            value === opt.value
              ? "border-indigo-500 bg-indigo-50/50 shadow-sm"
              : "border-slate-100 hover:border-slate-200 bg-white"
          }`}
        >
          <div className="text-[10px] font-bold text-slate-800">{opt.label}</div>
          <div className="text-[9px] text-slate-500 mt-0.5">{opt.description}</div>
        </button>
      ))}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function TournamentStageManager({ configId }: { configId: number }) {
  const [stages, setStages] = useState<TournamentStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [schedulingMode, setSchedulingMode] = useState<SchedulingMode>("HYBRID");
  const [isAdvancing, setIsAdvancing] = useState(false);

  const handleAdvanceQualification = async () => {
    const confirmed = await confirmAction(
      "Advance Qualification",
      "Seed qualified teams from Group Standings into knockout playoff bracket matches?"
    );
    if (!confirmed) return;
    setIsAdvancing(true);
    try {
      const res = await tournamentStageService.advanceQualification(configId);
      showSuccess(res.message || `Successfully seeded ${res.seededMatchCount} knockout matches!`);
      fetchStages();
    } catch (e: any) {
      showError(e?.message || "Failed to advance qualification");
    } finally {
      setIsAdvancing(false);
    }
  };

  const fetchStages = useCallback(async () => {
    setLoading(true);
    try {
      const data = await tournamentStageService.getStages(configId);
      setStages(data);
    } catch {
      showError("Failed to load tournament stages");
    } finally {
      setLoading(false);
    }
  }, [configId]);

  useEffect(() => { fetchStages(); }, [fetchStages]);

  const handleStageAction = async (action: string, stageId: number) => {
    const key = `${action}-${stageId}`;
    setActionLoading(key);
    try {
      switch (action) {
        case "generate": {
          const result = await tournamentStageService.generateStageSchedule(stageId, { schedulingMode });
          if (result.matchCount > 0) {
            showSuccess(`Generated and linked ${result.matchCount} match${result.matchCount === 1 ? "" : "es"}`);
          } else {
            showWarning(result.conflicts && result.conflicts.length > 0
              ? result.conflicts[0]
              : "No matches found to link to this stage.");
          }
          if (result.conflicts && result.conflicts.length > 0 && result.matchCount > 0) {
            showWarning(`${result.conflicts.length} scheduling notice(s)`);
          }
          break;
        }
        case "validate": {
          const result = await tournamentStageService.validateStageSchedule(stageId);
          if (result.valid) {
            showSuccess("Schedule validated successfully");
          } else {
            showWarning(`Validation found ${result.errors.length} error(s)`);
          }
          break;
        }
        case "approve": {
          await tournamentStageService.approveStageSchedule(stageId);
          showSuccess("Stage schedule approved");
          break;
        }
        case "publish": {
          const confirmed = await confirmAction(
            "Publish Stage",
            "Publishing will make this stage's fixtures visible to all participants. Continue?"
          );
          if (!confirmed) return;
          await tournamentStageService.publishStage(stageId);
          showSuccess("Stage published successfully");
          break;
        }
        case "delete": {
          const confirmed = await confirmAction(
            "Delete Stage",
            "This will permanently delete this stage and all its generated fixtures. This cannot be undone."
          );
          if (!confirmed) return;
          await tournamentStageService.deleteStage(stageId);
          showSuccess("Stage deleted");
          break;
        }
        case "preview": {
          showInfo("Preview will open in a new panel");
          break;
        }
      }
      fetchStages();
    } catch (e: any) {
      showError(e?.message || `Failed to ${action} stage`);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
        <span className="text-[10px] ml-2 text-slate-500">Loading stages…</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-800">Tournament Stages</h3>
            <p className="text-[9px] text-slate-500">{stages.length} stage{stages.length !== 1 ? "s" : ""} configured</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchStages}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl shadow-sm hover:shadow-md cursor-pointer"
          >
            <Plus className="w-3 h-3" /> Add Stage
          </button>
        </div>
      </div>

      {/* Scheduling Mode */}
      <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm space-y-2">
        <div className="flex items-center gap-2 mb-2">
          <Settings className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-[10px] font-semibold text-slate-700">Scheduling Mode</span>
        </div>
        <SchedulingModeSelector value={schedulingMode} onChange={setSchedulingMode} />
      </div>

      {/* Automatic Qualification from Group Standings */}
      {stages.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-50/90 to-purple-50/90 rounded-xl border border-indigo-100/90 p-3.5 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-800">Automatic Next-Stage Qualification</div>
              <div className="text-[9px] text-slate-500">Seed top qualifying teams from group points table into knockout playoff bracket matches.</div>
            </div>
          </div>
          <button
            onClick={handleAdvanceQualification}
            disabled={isAdvancing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shrink-0 disabled:opacity-50 cursor-pointer transition shadow-xs"
          >
            {isAdvancing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
            Advance to Knockouts
          </button>
        </div>
      )}

      {/* Stages List */}
      {stages.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center space-y-3">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mx-auto">
            <Layers className="w-6 h-6" />
          </div>
          <h4 className="text-xs font-bold text-slate-800">No Stages Configured</h4>
          <p className="text-[10px] text-slate-500 max-w-sm mx-auto">
            Add tournament stages to configure your tournament progression (Group Stage → Quarter-finals → Semi-finals → Final).
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-[10px] font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl shadow-sm hover:shadow-md cursor-pointer"
          >
            <Plus className="w-3 h-3" /> Add First Stage
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm divide-y divide-slate-50">
          {/* Stage progression flow */}
          <div className="p-3 flex items-center gap-1 overflow-x-auto">
            {stages
              .sort((a, b) => a.stageOrder - b.stageOrder)
              .map((s, i) => (
                <div key={s.id} className="flex items-center gap-1 flex-shrink-0">
                  <div
                    className={`px-2 py-1 rounded-lg text-[8px] font-bold uppercase tracking-wider cursor-pointer transition-all ${
                      expandedId === s.id
                        ? "bg-indigo-100 text-indigo-700 ring-1 ring-indigo-300"
                        : s.stageStatus === "COMPLETED"
                        ? "bg-emerald-50 text-emerald-600"
                        : s.stageStatus === "PUBLISHED"
                        ? "bg-blue-50 text-blue-600"
                        : "bg-slate-50 text-slate-500"
                    }`}
                    onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                  >
                    {s.stageName}
                  </div>
                  {i < stages.length - 1 && (
                    <ArrowRight className="w-3 h-3 text-slate-300 flex-shrink-0" />
                  )}
                </div>
              ))}
          </div>

          {/* Stage rows */}
          <div className="p-2 space-y-2">
            {stages
              .sort((a, b) => a.stageOrder - b.stageOrder)
              .map(stage => (
                <StageRow
                  key={stage.id}
                  stage={stage}
                  isExpanded={expandedId === stage.id}
                  onToggle={() => setExpandedId(expandedId === stage.id ? null : stage.id)}
                  onAction={handleStageAction}
                  actionLoading={actionLoading}
                />
              ))}
          </div>
        </div>
      )}

      {/* Publish All Approved Stages */}
      {stages.some(s => s.stageStatus === "APPROVED") && (
        <div className="flex justify-end">
          <button
            onClick={async () => {
              const approvedIds = stages.filter(s => s.stageStatus === "APPROVED").map(s => s.id);
              const confirmed = await confirmAction(
                "Publish All Approved Stages",
                `This will publish ${approvedIds.length} approved stage(s). Continue?`
              );
              if (!confirmed) return;
              setActionLoading("publish-all");
              try {
                await tournamentStageService.publishMultipleStages(configId, approvedIds);
                showSuccess(`Published ${approvedIds.length} stage(s)`);
                fetchStages();
              } catch (e: any) {
                showError(e?.message || "Failed to publish stages");
              } finally {
                setActionLoading(null);
              }
            }}
            disabled={!!actionLoading}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-[10px] font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl shadow-sm hover:shadow-md disabled:opacity-50 cursor-pointer"
          >
            {actionLoading === "publish-all" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Publish All Approved Stages
          </button>
        </div>
      )}

      {/* Add Stage Modal */}
      {showAddModal && (
        <AddStageModal
          configId={configId}
          existingStages={stages}
          onClose={() => setShowAddModal(false)}
          onCreated={(s) => {
            setStages(prev => [...prev, s]);
            setShowAddModal(false);
          }}
        />
      )}
    </div>
  );
}
