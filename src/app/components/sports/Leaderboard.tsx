import { useState, useEffect } from "react";
import { Loader2, Trophy } from "lucide-react";
import { tournamentService, type PlayerStatsData, type ConfigInfo } from "../../../services/tournamentService";

const LEADERBOARD_TABS = ["runs", "wickets", "mvp"] as const;
type LeaderboardType = typeof LEADERBOARD_TABS[number];

const TAB_CONFIG: Record<LeaderboardType, { label: string; capLabel: string; capColor: string; capBg: string; statKey: keyof PlayerStatsData; statLabel: string }> = {
  runs: { label: "Top Run Scorers", capLabel: "Orange Cap", capColor: "#ea580c", capBg: "rgba(234,88,12,0.08)", statKey: "totalRuns", statLabel: "Runs" },
  wickets: { label: "Top Wicket Takers", capLabel: "Purple Cap", capColor: "#7c3aed", capBg: "rgba(124,58,237,0.08)", statKey: "totalWickets", statLabel: "Wickets" },
  mvp: { label: "Most Valuable Players", capLabel: "MVP", capColor: "#ca8a04", capBg: "rgba(202,138,4,0.08)", statKey: "manOfMatchCount", statLabel: "MoM Awards" },
};

export function Leaderboard() {
  const [configs, setConfigs] = useState<ConfigInfo[]>([]);
  const [selectedConfigId, setSelectedConfigId] = useState<number | null>(null);
  const [activeType, setActiveType] = useState<LeaderboardType>("runs");
  const [stats, setStats] = useState<PlayerStatsData[]>([]);
  const [loading, setLoading] = useState(false);
  const [configsLoading, setConfigsLoading] = useState(true);

  useEffect(() => {
    setConfigsLoading(true);
    tournamentService.getConfigs()
      .then((cfgs) => {
        setConfigs(cfgs);
        if (cfgs.length > 0) setSelectedConfigId(cfgs[0].id);
      })
      .catch(() => {})
      .finally(() => setConfigsLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedConfigId) return;
    setLoading(true);
    tournamentService.getLeaderboard(selectedConfigId, activeType)
      .then(setStats)
      .catch(() => setStats([]))
      .finally(() => setLoading(false));
  }, [selectedConfigId, activeType]);

  const cfg = TAB_CONFIG[activeType];

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
                  <th className="text-left py-2 sm:py-3 px-1.5 sm:px-2 font-semibold">Player</th>
                  <th className="text-left py-2 sm:py-3 px-1.5 sm:px-2 font-semibold hidden sm:table-cell">Team</th>
                  <th className="text-right py-2 sm:py-3 px-1.5 sm:px-2 font-semibold">M</th>
                  <th className="text-right py-2 sm:py-3 px-1.5 sm:px-2 font-semibold">{cfg.statLabel}</th>
                  {activeType === "runs" && (
                    <>
                      <th className="text-right py-2 sm:py-3 px-1.5 sm:px-2 font-semibold">Avg</th>
                      <th className="text-right py-2 sm:py-3 px-1.5 sm:px-2 font-semibold">SR</th>
                    </>
                  )}
                  {activeType === "wickets" && (
                    <>
                      <th className="text-right py-2 sm:py-3 px-1.5 sm:px-2 font-semibold">Econ</th>
                    </>
                  )}
                  {activeType === "mvp" && (
                    <>
                      <th className="text-right py-2 sm:py-3 px-1.5 sm:px-2 font-semibold">Runs</th>
                      <th className="text-right py-2 sm:py-3 px-1.5 sm:px-2 font-semibold">Wkts</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {stats.map((player, i) => (
                  <tr
                    key={player.playerId}
                    className={`border-b border-slate-50 hover:bg-slate-50 transition ${i === 0 ? "bg-yellow-50/40" : ""}`}
                  >
                    <td className="py-2 sm:py-2.5 pl-2.5 sm:pl-4 pr-1 sm:pr-2">
                      {i === 0 ? (
                        <span
                          className="inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full text-[9px] sm:text-[10px] font-bold text-white"
                          style={{ backgroundColor: cfg.capColor }}
                        >
                          1
                        </span>
                      ) : (
                        <span className="text-slate-400 font-semibold">{i + 1}</span>
                      )}
                    </td>
                    <td className="py-2 sm:py-2.5 px-1.5 sm:px-2 font-semibold text-slate-800">{player.playerName}</td>
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
