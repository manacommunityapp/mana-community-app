import { useState, useEffect, useCallback } from "react";
import { Trophy, RefreshCw, ChevronDown, Save, X, Eye } from "lucide-react";
import { tournamentService, type ConfigInfo, type MatchResultRequestData, type MatchDetailData } from "../../../../services/tournamentService";
import { showError, showSuccess } from "../../../../utils/ToastUtils";

interface MatchRow {
  id: number;
  round: string;
  matchNumber: number;
  teamAName: string;
  teamBName: string;
  teamAId: number | null;
  teamBId: number | null;
  scheduledAt: string;
  status: string;
  scoreTeamA?: string;
  scoreTeamB?: string;
  winnerTeamId?: number;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  SCHEDULED:  { bg: "bg-blue-50",    text: "text-blue-700",   label: "Scheduled" },
  PUBLISHED:  { bg: "bg-teal-50",    text: "text-teal-700",   label: "Published" },
  LIVE:       { bg: "bg-green-50",   text: "text-green-700",  label: "Live" },
  COMPLETED:  { bg: "bg-violet-50",  text: "text-violet-700", label: "Completed" },
  DRAFT:      { bg: "bg-slate-100",  text: "text-slate-600",  label: "Draft" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] || { bg: "bg-gray-100", text: "text-gray-600", label: status };
  return <span className={`${s.bg} ${s.text} px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide`}>{s.label}</span>;
}

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "TBD";
  try {
    return new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: true });
  } catch { return iso; }
}

function MatchDetailModal({ matchId, onClose }: { matchId: number; onClose: () => void }) {
  const [detail, setDetail] = useState<MatchDetailData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    tournamentService.getMatchDetail(matchId)
      .then(setDetail)
      .catch(() => showError("Failed to load match detail"))
      .finally(() => setLoading(false));
  }, [matchId]);

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-800">Match Detail</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
        {loading ? (
          <div className="py-8 text-center"><RefreshCw className="w-5 h-5 animate-spin text-indigo-400 mx-auto" /></div>
        ) : !detail ? (
          <p className="text-xs text-slate-500 text-center py-4">No detail available.</p>
        ) : (
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">{detail.roundName?.replace(/_/g, " ")} · Match {detail.matchNumber}</span>
              <StatusBadge status={detail.status} />
            </div>
            <div className="flex items-center gap-4 py-3 justify-center">
              <div className="text-right">
                <div className="text-sm font-bold" style={{ color: detail.teamA?.color || "#334155" }}>{detail.teamA?.name || "TBD"}</div>
                <div className="text-lg font-bold text-slate-800 mt-1">{detail.scoreTeamA ?? "—"}</div>
              </div>
              <span className="text-slate-300 font-bold text-sm">vs</span>
              <div className="text-left">
                <div className="text-sm font-bold" style={{ color: detail.teamB?.color || "#334155" }}>{detail.teamB?.name || "TBD"}</div>
                <div className="text-lg font-bold text-slate-800 mt-1">{detail.scoreTeamB ?? "—"}</div>
              </div>
            </div>
            {detail.winnerName && (
              <div className="text-center py-2 bg-green-50 rounded-lg">
                <span className="text-green-700 font-semibold">Winner: {detail.winnerName}</span>
                {detail.winMargin && <span className="text-green-600 ml-1">({detail.winMargin})</span>}
              </div>
            )}
            {detail.matchSummary && (
              <p className="text-slate-600 bg-slate-50 rounded-lg p-3">{detail.matchSummary}</p>
            )}
            {detail.venueName && <p className="text-slate-500">Venue: {detail.venueName}{detail.courtName ? ` · ${detail.courtName}` : ""}</p>}
            {detail.umpires && <p className="text-slate-500">Umpires: {detail.umpires}</p>}
            {detail.manOfMatch && <p className="text-slate-500">Man of Match: {detail.manOfMatch.name} ({detail.manOfMatch.teamName})</p>}

            {detail.innings && detail.innings.length > 0 && (
              <div className="space-y-2 pt-2">
                <h4 className="font-semibold text-slate-700">Innings</h4>
                {detail.innings.map((inn, idx) => (
                  <div key={idx} className="bg-slate-50 rounded-lg p-3">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium text-slate-700">{inn.battingTeamName}</span>
                      <span className="font-bold text-slate-800">{inn.totalRuns}/{inn.totalWickets} ({inn.totalOvers} ov)</span>
                    </div>
                    <div className="text-[10px] text-slate-500">RR: {inn.runRate} · Extras: {inn.extras}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function ResultsAdminTab() {
  const [configs, setConfigs] = useState<ConfigInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConfigId, setSelectedConfigId] = useState<number | null>(null);
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");
  const [editingMatch, setEditingMatch] = useState<number | null>(null);
  const [scoreA, setScoreA] = useState("");
  const [scoreB, setScoreB] = useState("");
  const [winnerId, setWinnerId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [viewingMatchId, setViewingMatchId] = useState<number | null>(null);

  const fetchConfigs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await tournamentService.getConfigs();
      setConfigs(data);
      if (data.length > 0 && !selectedConfigId) {
        setSelectedConfigId(data[0].id);
      }
    } catch {
      showError("Failed to load tournaments");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchConfigs(); }, [fetchConfigs]);

  const fetchMatches = useCallback(async (configId: number) => {
    setLoadingMatches(true);
    try {
      const data = await tournamentService.getMatchesByConfigId(configId);
      setMatches(data);
    } catch {
      showError("Failed to load matches");
    } finally {
      setLoadingMatches(false);
    }
  }, []);

  useEffect(() => {
    if (selectedConfigId) fetchMatches(selectedConfigId);
  }, [selectedConfigId, fetchMatches]);

  const handleSaveResult = async (match: MatchRow) => {
    if (!scoreA && !scoreB) { showError("Enter at least one score"); return; }
    setSaving(true);
    try {
      const data: MatchResultRequestData = {
        matchId: match.id,
        scoreTeamA: scoreA || undefined,
        scoreTeamB: scoreB || undefined,
        winnerTeamId: winnerId,
      };
      await tournamentService.recordResult(data);
      showSuccess("Result saved");
      setEditingMatch(null);
      setScoreA(""); setScoreB(""); setWinnerId(null);
      if (selectedConfigId) fetchMatches(selectedConfigId);
    } catch (e: any) {
      showError(e?.message || "Failed to save result");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (m: MatchRow) => {
    setEditingMatch(m.id);
    setScoreA(m.scoreTeamA || "");
    setScoreB(m.scoreTeamB || "");
    setWinnerId(m.winnerTeamId || null);
  };

  const filtered = matches.filter(m => {
    if (filter === "pending") return m.status !== "COMPLETED" && m.status !== "BYE" && m.status !== "CANCELLED";
    if (filter === "completed") return m.status === "COMPLETED";
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" />
        <span className="ml-2 text-sm text-slate-500">Loading…</span>
      </div>
    );
  }

  if (configs.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm text-center max-w-xl mx-auto my-8 space-y-4">
        <div className="w-14 h-14 bg-violet-50 text-violet-600 rounded-xl flex items-center justify-center mx-auto">
          <Trophy className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-slate-800">No Tournaments</h3>
        <p className="text-xs text-slate-500">Create a tournament and generate matches to start entering results.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <select
            value={selectedConfigId || ""}
            onChange={e => setSelectedConfigId(Number(e.target.value))}
            className="appearance-none bg-white border border-slate-200 rounded-lg pl-3 pr-8 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 cursor-pointer"
          >
            {configs.map(c => (
              <option key={c.id} value={c.id}>{c.tournamentName} ({c.status})</option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        <div className="flex rounded-lg border border-slate-200 overflow-hidden text-[11px] font-medium">
          {(["all", "pending", "completed"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 capitalize transition-colors cursor-pointer ${filter === f ? "bg-indigo-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}
            >
              {f}
            </button>
          ))}
        </div>

        <span className="text-[11px] text-slate-400 ml-auto">{filtered.length} match{filtered.length !== 1 ? "es" : ""}</span>
      </div>

      {loadingMatches ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
          <span className="ml-2 text-xs text-slate-500">Loading matches…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400">
          {filter !== "all" ? "No matches in this filter." : "No matches yet."}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(m => {
            const isEditing = editingMatch === m.id;
            const canEdit = m.status !== "BYE" && m.status !== "CANCELLED" && m.status !== "DRAFT";

            return (
              <div key={m.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[10px] font-medium text-indigo-500">{(m.round || "").replace(/_/g, " ")} · #{m.matchNumber}</span>
                  <span className="text-[10px] text-slate-400">{formatDateTime(m.scheduledAt)}</span>
                  <StatusBadge status={m.status} />
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-800 flex-1 text-right truncate">{m.teamAName || "TBD"}</span>
                      {isEditing ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={scoreA}
                            onChange={e => setScoreA(e.target.value)}
                            placeholder="0"
                            className="w-14 text-center rounded-lg py-1.5 text-sm font-bold border-2 border-indigo-200 focus:border-indigo-500 outline-none"
                          />
                          <span className="text-sm font-bold text-slate-300">–</span>
                          <input
                            type="text"
                            value={scoreB}
                            onChange={e => setScoreB(e.target.value)}
                            placeholder="0"
                            className="w-14 text-center rounded-lg py-1.5 text-sm font-bold border-2 border-indigo-200 focus:border-indigo-500 outline-none"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-slate-700 w-14 text-center">
                            {m.scoreTeamA ?? "—"}
                          </span>
                          <span className="text-sm font-bold text-slate-300">–</span>
                          <span className="text-sm font-bold text-slate-700 w-14 text-center">
                            {m.scoreTeamB ?? "—"}
                          </span>
                        </div>
                      )}
                      <span className="text-sm font-semibold text-slate-800 flex-1 truncate">{m.teamBName || "TBD"}</span>
                    </div>

                    {isEditing && m.teamAId && m.teamBId && (
                      <div className="flex items-center gap-2 mt-2 justify-center">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wide">Winner:</span>
                        <button
                          onClick={() => setWinnerId(m.teamAId)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${winnerId === m.teamAId ? "bg-green-100 text-green-700 ring-1 ring-green-300" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                        >
                          {m.teamAName}
                        </button>
                        <button
                          onClick={() => setWinnerId(m.teamBId)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${winnerId === m.teamBId ? "bg-green-100 text-green-700 ring-1 ring-green-300" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                        >
                          {m.teamBName}
                        </button>
                        <button
                          onClick={() => setWinnerId(null)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${winnerId === null ? "bg-amber-100 text-amber-700 ring-1 ring-amber-300" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                        >
                          Draw
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => handleSaveResult(m)}
                          disabled={saving}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                        >
                          <Save className="w-3 h-3" /> {saving ? "…" : "Save"}
                        </button>
                        <button
                          onClick={() => { setEditingMatch(null); setScoreA(""); setScoreB(""); setWinnerId(null); }}
                          className="px-2 py-1.5 rounded-lg text-xs text-slate-500 hover:bg-slate-100 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        {m.status === "COMPLETED" && (
                          <button
                            onClick={() => setViewingMatchId(m.id)}
                            className="p-1.5 rounded-lg text-indigo-500 hover:bg-indigo-50 cursor-pointer"
                            title="View detail"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canEdit && (
                          <button
                            onClick={() => startEdit(m)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer"
                          >
                            {m.status === "COMPLETED" ? "Update" : "Enter Result"}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {viewingMatchId && (
        <MatchDetailModal matchId={viewingMatchId} onClose={() => setViewingMatchId(null)} />
      )}
    </div>
  );
}
