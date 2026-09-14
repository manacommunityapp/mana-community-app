import { useState, useEffect } from "react";
import { X, Loader2, Timer, Trophy, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import {
  tournamentService,
  type RaceResult,
} from "../../../services/sports/tournamentService";

interface RaceResultsViewProps {
  matchId: number;
  onClose: () => void;
}

const MEDAL = ["", "\u{1F947}", "\u{1F948}", "\u{1F949}"];
const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  FINISHED: { label: "FIN", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  DNF: { label: "DNF", cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  DNS: { label: "DNS", cls: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400" },
  DQ: { label: "DQ", cls: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
};

export function RaceResultsView({ matchId, onClose }: RaceResultsViewProps) {
  const [results, setResults] = useState<RaceResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeHeat, setActiveHeat] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    tournamentService
      .getRaceResults(matchId)
      .then(setResults)
      .catch(() => setError("Could not load race results."))
      .finally(() => setLoading(false));
  }, [matchId]);

  const heats = [...new Set(results.filter((r) => r.heatNumber).map((r) => r.heatNumber!))].sort(
    (a, b) => a - b
  );

  const displayed =
    activeHeat !== null
      ? results.filter((r) => r.heatNumber === activeHeat)
      : results;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 max-w-sm text-center" onClick={(e) => e.stopPropagation()}>
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <p className="text-sm text-slate-700 dark:text-slate-200 font-semibold">{error}</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition">Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start justify-center p-2 sm:p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg my-4" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-3 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-2">
            <Timer className="w-5 h-5 text-white" />
            <div>
              <div className="text-sm font-bold text-white">Race Results</div>
              <div className="text-[10px] text-cyan-200">{results.length} participants</div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg transition">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {/* Heat Tabs */}
          {heats.length > 1 && (
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              <button
                onClick={() => setActiveHeat(null)}
                className={`px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap transition ${
                  activeHeat === null
                    ? "bg-cyan-600 text-white shadow"
                    : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                }`}
              >
                Overall
              </button>
              {heats.map((h) => (
                <button
                  key={h}
                  onClick={() => setActiveHeat(h)}
                  className={`px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap transition ${
                    activeHeat === h
                      ? "bg-cyan-600 text-white shadow"
                      : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  Heat {h}
                </button>
              ))}
            </div>
          )}

          {/* Results Table */}
          {displayed.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">No results available.</div>
          ) : (
            <div className="space-y-1">
              {displayed.map((r) => {
                const rank = activeHeat !== null ? r.heatRank : r.overallRank;
                const badge = STATUS_BADGE[r.raceStatus] || STATUS_BADGE.FINISHED;
                const isExpanded = expandedId === r.id;

                return (
                  <div key={r.id}>
                    <div
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800/50 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition"
                      onClick={() => setExpandedId(isExpanded ? null : r.id)}
                    >
                      {/* Rank / Medal */}
                      <div className="w-8 text-center shrink-0">
                        {rank && rank <= 3 ? (
                          <span className="text-lg">{MEDAL[rank]}</span>
                        ) : (
                          <span className="text-xs font-bold text-slate-400">{rank || "-"}</span>
                        )}
                      </div>

                      {/* Player */}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-slate-800 dark:text-white truncate">
                          {r.playerName}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                          {r.teamName || "Individual"}
                          {r.laneNumber ? ` · Lane ${r.laneNumber}` : ""}
                        </div>
                      </div>

                      {/* Time & Status */}
                      <div className="text-right shrink-0 flex items-center gap-2">
                        <div>
                          <div className="text-sm font-bold text-slate-800 dark:text-white">
                            {r.raceStatus === "FINISHED" ? r.formattedTime || "-" : ""}
                          </div>
                          {r.isPersonalBest && (
                            <div className="text-[8px] font-bold text-emerald-500 uppercase">PB</div>
                          )}
                        </div>
                        {r.raceStatus !== "FINISHED" && (
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${badge.cls}`}>
                            {badge.label}
                          </span>
                        )}
                        {r.splitTimes && r.splitTimes.length > 0 && (
                          isExpanded ? <ChevronUp className="w-3 h-3 text-slate-400" /> : <ChevronDown className="w-3 h-3 text-slate-400" />
                        )}
                      </div>
                    </div>

                    {/* Split Times */}
                    {isExpanded && r.splitTimes && r.splitTimes.length > 0 && (
                      <div className="ml-10 mr-3 mt-1 mb-2 px-3 py-2 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
                        <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Split Times</div>
                        <div className="flex flex-wrap gap-2">
                          {r.splitTimes.map((split, idx) => (
                            <div key={idx} className="bg-white dark:bg-slate-800 px-2 py-1 rounded text-xs border border-slate-200 dark:border-slate-600">
                              <span className="text-slate-400 text-[9px]">Lap {idx + 1}: </span>
                              <span className="font-bold text-slate-700 dark:text-white">{split}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
