import { useState, useEffect, useCallback } from "react";
import { CalendarIcon, ChevronDown, ChevronRight, Clock, MapPin, RefreshCw, ExternalLink } from "lucide-react";
import { Link } from "react-router";
import { tournamentService, type ConfigInfo } from "../../../../services/tournamentService";
import { showError } from "../../../../utils/ToastUtils";

interface MatchRow {
  id: number;
  round: string;
  matchNumber: number;
  teamAName: string;
  teamBName: string;
  scheduledAt: string;
  status: string;
  scoreTeamA?: string;
  scoreTeamB?: string;
  venueName?: string;
  courtName?: string;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  DRAFT:     { bg: "bg-slate-100", text: "text-slate-600", label: "Draft" },
  ACTIVE:    { bg: "bg-blue-50",   text: "text-blue-700",  label: "Active" },
  LIVE:      { bg: "bg-green-50",  text: "text-green-700", label: "Live" },
  COMPLETED: { bg: "bg-violet-50", text: "text-violet-700", label: "Completed" },
  CANCELLED: { bg: "bg-red-50",    text: "text-red-600",   label: "Cancelled" },
  SCHEDULED: { bg: "bg-indigo-50", text: "text-indigo-700", label: "Scheduled" },
  PUBLISHED: { bg: "bg-teal-50",   text: "text-teal-700",  label: "Published" },
  BYE:       { bg: "bg-gray-50",   text: "text-gray-500",  label: "Bye" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] || { bg: "bg-gray-100", text: "text-gray-600", label: status };
  return <span className={`${s.bg} ${s.text} px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide`}>{s.label}</span>;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return iso; }
}

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "TBD";
  try {
    return new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: true });
  } catch { return iso; }
}

export function ScheduleAdminTab() {
  const [configs, setConfigs] = useState<ConfigInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [matches, setMatches] = useState<Record<number, MatchRow[]>>({});
  const [loadingMatches, setLoadingMatches] = useState<number | null>(null);

  const fetchConfigs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await tournamentService.getConfigs();
      setConfigs(data);
    } catch (e: any) {
      showError("Failed to load tournament configs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchConfigs(); }, [fetchConfigs]);

  const toggleExpand = async (configId: number) => {
    if (expandedId === configId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(configId);
    if (!matches[configId]) {
      setLoadingMatches(configId);
      try {
        const data = await tournamentService.getMatchesByConfigId(configId);
        setMatches(prev => ({ ...prev, [configId]: data }));
      } catch {
        showError("Failed to load matches");
      } finally {
        setLoadingMatches(null);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" />
        <span className="ml-2 text-sm text-slate-500">Loading schedules…</span>
      </div>
    );
  }

  if (configs.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm text-center max-w-xl mx-auto my-8 space-y-4">
        <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mx-auto">
          <CalendarIcon className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-slate-800">No Tournament Schedules Yet</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Create a tournament configuration and generate match fixtures from the Sports Schedule page.
        </p>
        <Link
          to="/sports/schedule"
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-bold rounded-xl shadow-sm transition-all hover:shadow-md cursor-pointer"
        >
          <ExternalLink className="w-3.5 h-3.5" /> Open Schedule Builder
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-slate-500">{configs.length} tournament schedule{configs.length !== 1 ? "s" : ""}</p>
        <div className="flex items-center gap-2">
          <Link
            to="/sports/schedule"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Schedule Builder
          </Link>
          <button onClick={fetchConfigs} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {configs.map(cfg => {
        const isExpanded = expandedId === cfg.id;
        const cfgMatches = matches[cfg.id] || [];
        const isLoadingThis = loadingMatches === cfg.id;

        return (
          <div key={cfg.id} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <button
              className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-50/50 transition-colors cursor-pointer"
              onClick={() => toggleExpand(cfg.id)}
            >
              <div className="flex-shrink-0 text-slate-400">
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-800 truncate">{cfg.tournamentName}</span>
                  <StatusBadge status={cfg.status} />
                </div>
                <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
                  <span>{cfg.tournamentType?.replace(/_/g, " ")}</span>
                  <span>·</span>
                  <span>{cfg.totalTeams} teams</span>
                  {cfg.numberOfGroups && cfg.numberOfGroups > 0 && (
                    <>
                      <span>·</span>
                      <span>{cfg.numberOfGroups} groups</span>
                    </>
                  )}
                  <span>·</span>
                  <span>{formatDate(cfg.startDate)} – {formatDate(cfg.endDate)}</span>
                </div>
              </div>
              <div className="flex-shrink-0 text-right">
                <div className="text-[10px] text-slate-400 uppercase tracking-wide">Event #{cfg.eventId}</div>
              </div>
            </button>

            {isExpanded && (
              <div className="border-t border-slate-100 bg-slate-50/40">
                {isLoadingThis ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                    <span className="ml-2 text-xs text-slate-500">Loading matches…</span>
                  </div>
                ) : cfgMatches.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400">
                    No matches generated yet.
                    <Link to="/sports/schedule" className="text-indigo-600 font-medium ml-1 hover:underline">Generate fixtures →</Link>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-100">
                          <th className="px-4 py-2 text-left font-medium">#</th>
                          <th className="px-4 py-2 text-left font-medium">Round</th>
                          <th className="px-4 py-2 text-left font-medium">Match</th>
                          <th className="px-4 py-2 text-left font-medium">Schedule</th>
                          <th className="px-4 py-2 text-left font-medium">Venue</th>
                          <th className="px-4 py-2 text-left font-medium">Score</th>
                          <th className="px-4 py-2 text-left font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cfgMatches.map((m, i) => (
                          <tr key={m.id} className={`border-b border-slate-50 ${i % 2 === 0 ? "bg-white/60" : ""}`}>
                            <td className="px-4 py-2.5 text-slate-400">{m.matchNumber || i + 1}</td>
                            <td className="px-4 py-2.5 text-slate-600 font-medium">
                              {(m.round || "").replace(/_/g, " ")}
                            </td>
                            <td className="px-4 py-2.5">
                              <span className="font-medium text-slate-800">{m.teamAName || "TBD"}</span>
                              <span className="mx-1.5 text-slate-300">vs</span>
                              <span className="font-medium text-slate-800">{m.teamBName || "TBD"}</span>
                            </td>
                            <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">
                              <Clock className="w-3 h-3 inline-block mr-1 -mt-0.5" />
                              {formatDateTime(m.scheduledAt)}
                            </td>
                            <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">
                              {m.venueName ? (
                                <><MapPin className="w-3 h-3 inline-block mr-1 -mt-0.5" />{m.venueName}{m.courtName ? ` · ${m.courtName}` : ""}</>
                              ) : "—"}
                            </td>
                            <td className="px-4 py-2.5 font-mono text-slate-700">
                              {m.status === "COMPLETED" && m.scoreTeamA != null ? `${m.scoreTeamA} – ${m.scoreTeamB}` : "—"}
                            </td>
                            <td className="px-4 py-2.5">
                              <StatusBadge status={m.status} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="px-4 py-2 text-[10px] text-slate-400 text-right border-t border-slate-100">
                      {cfgMatches.length} match{cfgMatches.length !== 1 ? "es" : ""}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
