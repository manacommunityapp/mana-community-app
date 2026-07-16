import { useState, useEffect, useMemo } from "react";
import { Loader2, Trophy, X, ArrowUpDown, ChevronUp, ChevronDown } from "lucide-react";
import { tournamentService, type PlayerStatsData, type ConfigInfo } from "../../../services/tournamentService";
import { toast } from "sonner";

const LEADERBOARD_TABS = ["runs", "wickets", "mvp"] as const;
type LeaderboardType = typeof LEADERBOARD_TABS[number];

const TAB_CONFIG: Record<LeaderboardType, { label: string; capLabel: string; capColor: string; capBg: string; statKey: keyof PlayerStatsData; statLabel: string }> = {
  runs: { label: "Top Run Scorers", capLabel: "Orange Cap", capColor: "#ea580c", capBg: "rgba(234,88,12,0.08)", statKey: "totalRuns", statLabel: "Runs" },
  wickets: { label: "Top Wicket Takers", capLabel: "Purple Cap", capColor: "#7c3aed", capBg: "rgba(124,58,237,0.08)", statKey: "totalWickets", statLabel: "Wickets" },
  mvp: { label: "Most Valuable Players", capLabel: "MVP", capColor: "#ca8a04", capBg: "rgba(202,138,4,0.08)", statKey: "manOfMatchCount", statLabel: "MoM Awards" },
};

type SortField = "playerName" | "matchesPlayed" | "totalRuns" | "totalWickets" | "battingAverage" | "strikeRate" | "economyRate" | "manOfMatchCount";

function PlayerStatsModal({ playerId, playerName, onClose }: { playerId: number; playerName: string; onClose: () => void }) {
  const [stats, setStats] = useState<PlayerStatsData[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    tournamentService.getPlayerStats(playerId)
      .then(setStats)
      .catch(() => toast.error("Failed to load player stats"))
      .finally(() => setLoading(false));
  }, [playerId]);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4" onClick={onClose}>
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-[95vw] sm:max-w-md max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 sm:px-5 sm:py-4 flex items-center justify-between z-10 rounded-t-xl sm:rounded-t-2xl">
          <div>
            <div className="text-sm sm:text-base font-bold text-white">{playerName}</div>
            <div className="text-[10px] sm:text-xs text-indigo-200">Career Statistics</div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg transition">
            <X className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </button>
        </div>

        <div className="p-3 sm:p-5">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
            </div>
          ) : !stats || stats.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">No stats available for this player.</div>
          ) : (
            <div className="space-y-4">
              {stats.map((s, idx) => {
                const batting = [
                  { label: "Matches", value: s.matchesPlayed },
                  { label: "Runs", value: s.totalRuns },
                  { label: "Average", value: s.battingAverage },
                  { label: "Strike Rate", value: s.strikeRate },
                ];
                const bowling = [
                  { label: "Wickets", value: s.totalWickets },
                  { label: "Economy", value: s.economyRate },
                ];
                const awards = [
                  { label: "MoM Awards", value: s.manOfMatchCount },
                ];
                return (
                  <div key={idx} className="space-y-3">
                    {stats.length > 1 && (
                      <div className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        {s.teamName}
                      </div>
                    )}
                    <div className="bg-slate-50 rounded-xl border border-slate-100 p-3 sm:p-4">
                      <div className="text-[9px] sm:text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Batting</div>
                      <div className="grid grid-cols-2 gap-2 sm:gap-3">
                        {batting.map(({ label, value }) => (
                          <div key={label}>
                            <div className="text-lg sm:text-xl font-extrabold text-slate-800">{value}</div>
                            <div className="text-[9px] sm:text-[10px] text-slate-500">{label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-purple-50 rounded-xl border border-purple-100 p-3 sm:p-4">
                        <div className="text-[9px] sm:text-[10px] font-semibold text-purple-400 uppercase tracking-wider mb-2">Bowling</div>
                        {bowling.map(({ label, value }) => (
                          <div key={label} className="mb-1 last:mb-0">
                            <div className="text-lg sm:text-xl font-extrabold text-slate-800">{value}</div>
                            <div className="text-[9px] sm:text-[10px] text-slate-500">{label}</div>
                          </div>
                        ))}
                      </div>
                      <div className="bg-amber-50 rounded-xl border border-amber-100 p-3 sm:p-4">
                        <div className="text-[9px] sm:text-[10px] font-semibold text-amber-400 uppercase tracking-wider mb-2">Awards</div>
                        {awards.map(({ label, value }) => (
                          <div key={label}>
                            <div className="text-lg sm:text-xl font-extrabold text-slate-800">{value}</div>
                            <div className="text-[9px] sm:text-[10px] text-slate-500">{label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
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

export function Leaderboard() {
  const [configs, setConfigs] = useState<ConfigInfo[]>([]);
  const [selectedConfigId, setSelectedConfigId] = useState<number | null>(null);
  const [activeType, setActiveType] = useState<LeaderboardType>("runs");
  const [stats, setStats] = useState<PlayerStatsData[]>([]);
  const [loading, setLoading] = useState(false);
  const [configsLoading, setConfigsLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState<{ id: number; name: string } | null>(null);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    setConfigsLoading(true);
    tournamentService.getConfigs()
      .then((cfgs) => {
        setConfigs(cfgs);
        if (cfgs.length > 0) setSelectedConfigId(cfgs[0].id);
      })
      .catch(() => toast.error("Failed to load tournaments"))
      .finally(() => setConfigsLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedConfigId) return;
    setLoading(true);
    setSortField(null);
    tournamentService.getLeaderboard(selectedConfigId, activeType)
      .then(setStats)
      .catch(() => {
        setStats([]);
        toast.error("Failed to load leaderboard");
      })
      .finally(() => setLoading(false));
  }, [selectedConfigId, activeType]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(prev => prev === "desc" ? "asc" : "desc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const sortedStats = useMemo(() => {
    if (!sortField) return stats;
    return [...stats].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      const numA = typeof aVal === "string" ? parseFloat(aVal) || 0 : (aVal as number);
      const numB = typeof bVal === "string" ? parseFloat(bVal) || 0 : (bVal as number);
      if (typeof aVal === "string" && isNaN(parseFloat(aVal))) {
        return sortDir === "asc"
          ? String(aVal).localeCompare(String(bVal))
          : String(bVal).localeCompare(String(aVal));
      }
      return sortDir === "asc" ? numA - numB : numB - numA;
    });
  }, [stats, sortField, sortDir]);

  const cfg = TAB_CONFIG[activeType];

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-300 ml-0.5" />;
    return sortDir === "desc"
      ? <ChevronDown className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-indigo-500 ml-0.5" />
      : <ChevronUp className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-indigo-500 ml-0.5" />;
  };

  if (configsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (configs.length === 0) {
    return (
      <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-8 border border-slate-100 shadow-sm text-center">
        <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-slate-300 mx-auto mb-2 sm:mb-3" />
        <h4 className="text-[11px] sm:text-sm font-bold text-slate-700">No Tournaments Found</h4>
        <p className="text-[9px] sm:text-xs text-slate-500 mt-1">Create a tournament configuration to see leaderboards.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Tournament Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
        <select
          value={selectedConfigId ?? ""}
          onChange={(e) => setSelectedConfigId(Number(e.target.value))}
          className="border border-slate-200 rounded-lg sm:rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-sm text-slate-700 bg-white outline-none focus:border-indigo-500 w-full sm:w-auto sm:min-w-[200px]"
        >
          {configs.map((c) => (
            <option key={c.id} value={c.id}>{c.tournamentName}</option>
          ))}
        </select>

        {/* Type Tabs */}
        <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-100 rounded-lg sm:rounded-xl p-0.5 sm:p-1">
          {LEADERBOARD_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveType(tab)}
              className={`px-2 sm:px-3 py-1 sm:py-1.5 text-[9px] sm:text-xs font-semibold rounded-md sm:rounded-lg transition active:scale-[0.96] ${
                activeType === tab
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {TAB_CONFIG[tab].label.split(" ").slice(1).join(" ")}
            </button>
          ))}
        </div>
      </div>

      {/* Cap Badge */}
      <div
        className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl border"
        style={{ backgroundColor: cfg.capBg, borderColor: `${cfg.capColor}30`, color: cfg.capColor }}
      >
        <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        <span className="text-[10px] sm:text-sm font-bold">{cfg.capLabel}</span>
        {stats.length > 0 && (
          <span className="text-[10px] sm:text-sm font-semibold">— {stats[0].playerName}</span>
        )}
      </div>

      {/* Leaderboard Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
        </div>
      ) : stats.length === 0 ? (
        <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-8 border border-slate-100 shadow-sm text-center">
          <p className="text-[10px] sm:text-sm text-slate-500">No stats available yet. Record match results to populate the leaderboard.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[10px] sm:text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500">
                  <th className="text-left py-2 sm:py-3 pl-2.5 sm:pl-4 pr-1 sm:pr-2 font-semibold w-6 sm:w-8">#</th>
                  <th className="text-left py-2 sm:py-3 px-1.5 sm:px-2 font-semibold">
                    <button onClick={() => handleSort("playerName")} className="inline-flex items-center cursor-pointer hover:text-slate-700">
                      Player <SortIcon field="playerName" />
                    </button>
                  </th>
                  <th className="text-left py-2 sm:py-3 px-1.5 sm:px-2 font-semibold hidden sm:table-cell">Team</th>
                  <th className="text-right py-2 sm:py-3 px-1.5 sm:px-2 font-semibold">
                    <button onClick={() => handleSort("matchesPlayed")} className="inline-flex items-center cursor-pointer hover:text-slate-700 ml-auto">
                      M <SortIcon field="matchesPlayed" />
                    </button>
                  </th>
                  <th className="text-right py-2 sm:py-3 px-1.5 sm:px-2 font-semibold">
                    <button onClick={() => handleSort(cfg.statKey as SortField)} className="inline-flex items-center cursor-pointer hover:text-slate-700 ml-auto">
                      {cfg.statLabel} <SortIcon field={cfg.statKey as SortField} />
                    </button>
                  </th>
                  {activeType === "runs" && (
                    <>
                      <th className="text-right py-2 sm:py-3 px-1.5 sm:px-2 font-semibold">
                        <button onClick={() => handleSort("battingAverage")} className="inline-flex items-center cursor-pointer hover:text-slate-700 ml-auto">
                          Avg <SortIcon field="battingAverage" />
                        </button>
                      </th>
                      <th className="text-right py-2 sm:py-3 px-1.5 sm:px-2 font-semibold">
                        <button onClick={() => handleSort("strikeRate")} className="inline-flex items-center cursor-pointer hover:text-slate-700 ml-auto">
                          SR <SortIcon field="strikeRate" />
                        </button>
                      </th>
                    </>
                  )}
                  {activeType === "wickets" && (
                    <th className="text-right py-2 sm:py-3 px-1.5 sm:px-2 font-semibold">
                      <button onClick={() => handleSort("economyRate")} className="inline-flex items-center cursor-pointer hover:text-slate-700 ml-auto">
                        Econ <SortIcon field="economyRate" />
                      </button>
                    </th>
                  )}
                  {activeType === "mvp" && (
                    <>
                      <th className="text-right py-2 sm:py-3 px-1.5 sm:px-2 font-semibold">
                        <button onClick={() => handleSort("totalRuns")} className="inline-flex items-center cursor-pointer hover:text-slate-700 ml-auto">
                          Runs <SortIcon field="totalRuns" />
                        </button>
                      </th>
                      <th className="text-right py-2 sm:py-3 px-1.5 sm:px-2 font-semibold">
                        <button onClick={() => handleSort("totalWickets")} className="inline-flex items-center cursor-pointer hover:text-slate-700 ml-auto">
                          Wkts <SortIcon field="totalWickets" />
                        </button>
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {sortedStats.map((player, i) => {
                  const rank = sortField ? i + 1 : i + 1;
                  const isTop = !sortField && i === 0;
                  return (
                    <tr
                      key={player.playerId}
                      className={`border-b border-slate-50 hover:bg-slate-50 transition cursor-pointer ${isTop ? "bg-yellow-50/40" : ""}`}
                      onClick={() => setSelectedPlayer({ id: player.playerId, name: player.playerName })}
                    >
                      <td className="py-2 sm:py-2.5 pl-2.5 sm:pl-4 pr-1 sm:pr-2">
                        {isTop ? (
                          <span
                            className="inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full text-[9px] sm:text-[10px] font-bold text-white"
                            style={{ backgroundColor: cfg.capColor }}
                          >
                            1
                          </span>
                        ) : (
                          <span className="text-slate-400 font-semibold">{rank}</span>
                        )}
                      </td>
                      <td className="py-2 sm:py-2.5 px-1.5 sm:px-2 font-semibold text-indigo-700 hover:text-indigo-900 transition">
                        {player.playerName}
                      </td>
                      <td className="py-2 sm:py-2.5 px-1.5 sm:px-2 text-slate-500 hidden sm:table-cell">{player.teamName}</td>
                      <td className="text-right py-2 sm:py-2.5 px-1.5 sm:px-2 text-slate-500">{player.matchesPlayed}</td>
                      <td className="text-right py-2 sm:py-2.5 px-1.5 sm:px-2 font-bold text-slate-800">
                        {String(player[cfg.statKey])}
                      </td>
                      {activeType === "runs" && (
                        <>
                          <td className="text-right py-2 sm:py-2.5 px-1.5 sm:px-2 text-slate-500">{player.battingAverage}</td>
                          <td className="text-right py-2 sm:py-2.5 px-1.5 sm:px-2 text-slate-500">{player.strikeRate}</td>
                        </>
                      )}
                      {activeType === "wickets" && (
                        <td className="text-right py-2 sm:py-2.5 px-1.5 sm:px-2 text-slate-500">{player.economyRate}</td>
                      )}
                      {activeType === "mvp" && (
                        <>
                          <td className="text-right py-2 sm:py-2.5 px-1.5 sm:px-2 text-slate-500">{player.totalRuns}</td>
                          <td className="text-right py-2 sm:py-2.5 px-1.5 sm:px-2 text-slate-500">{player.totalWickets}</td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-3 py-2 sm:px-4 sm:py-2.5 bg-slate-50 border-t border-slate-100 text-[9px] sm:text-[10px] text-slate-400">
            Click any player to view detailed career stats
          </div>
        </div>
      )}

      {/* Player Stats Modal */}
      {selectedPlayer && (
        <PlayerStatsModal
          playerId={selectedPlayer.id}
          playerName={selectedPlayer.name}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </div>
  );
}
