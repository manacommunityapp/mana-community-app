import { useState, useEffect } from "react";
import { Loader2, Trophy, X } from "lucide-react";
import {
  tournamentService,
  type GenericLeaderboardEntry,
  type ConfigInfo,
} from "../../../services/sports/tournamentService";
import { isCricketSport } from "./utils/sportScoringConstants";
import { toast } from "sonner";

const CATEGORY_LABELS: Record<string, string> = {
  goals: "Top Scorers",
  assists: "Assists",
  cards: "Cards",
  points: "Top Point Scorers",
  three_pointers: "3-Pointers",
  rebounds: "Rebounds",
  aces: "Aces",
  blocks: "Blocks",
};

const RANK_STYLES: Record<number, string> = {
  1: "bg-gradient-to-r from-amber-400 to-yellow-300 text-amber-900",
  2: "bg-gradient-to-r from-slate-300 to-gray-200 text-slate-700",
  3: "bg-gradient-to-r from-orange-300 to-amber-200 text-orange-800",
};

export function GenericLeaderboard() {
  const [configs, setConfigs] = useState<ConfigInfo[]>([]);
  const [selectedConfigId, setSelectedConfigId] = useState<number | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [entries, setEntries] = useState<GenericLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [configsLoading, setConfigsLoading] = useState(true);

  useEffect(() => {
    setConfigsLoading(true);
    tournamentService
      .getConfigs()
      .then((cfgs) => {
        const nonCricket = cfgs.filter((c) => !isCricketSport(c.tournamentName));
        setConfigs(nonCricket);
        if (nonCricket.length > 0) setSelectedConfigId(nonCricket[0].id);
      })
      .catch(() => toast.error("Failed to load tournaments"))
      .finally(() => setConfigsLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedConfigId) return;
    tournamentService
      .getGenericLeaderboardCategories(selectedConfigId)
      .then((cats) => {
        setCategories(cats);
        if (cats.length > 0) setActiveCategory(cats[0]);
      })
      .catch(() => setCategories(["points"]));
  }, [selectedConfigId]);

  useEffect(() => {
    if (!selectedConfigId || !activeCategory) return;
    setLoading(true);
    tournamentService
      .getGenericLeaderboard(selectedConfigId, activeCategory)
      .then(setEntries)
      .catch(() => {
        setEntries([]);
        toast.error("Failed to load leaderboard");
      })
      .finally(() => setLoading(false));
  }, [selectedConfigId, activeCategory]);

  if (configsLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-7 h-7 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (configs.length === 0) {
    return (
      <div className="text-center py-12 text-sm text-slate-500">
        No tournaments available for leaderboard.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tournament Selector */}
      <div className="flex flex-wrap gap-2 items-center">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Tournament
        </label>
        <select
          value={selectedConfigId ?? ""}
          onChange={(e) => setSelectedConfigId(Number(e.target.value))}
          className="text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 focus:ring-2 focus:ring-indigo-300 outline-none"
        >
          {configs.map((c) => (
            <option key={c.id} value={c.id}>
              {c.tournamentName}
            </option>
          ))}
        </select>
      </div>

      {/* Category Tabs */}
      {categories.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap transition ${
                activeCategory === cat
                  ? "bg-indigo-600 text-white shadow"
                  : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
              }`}
            >
              {CATEGORY_LABELS[cat] || cat}
            </button>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-2">
        <Trophy className="w-5 h-5 text-amber-500" />
        <h3 className="text-base font-bold text-slate-800 dark:text-white">
          {CATEGORY_LABELS[activeCategory] || activeCategory}
        </h3>
      </div>

      {/* Leaderboard Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-8 text-xs text-slate-500">
          No data available yet. Play some matches first!
        </div>
      ) : (
        <div className="space-y-1.5">
          {entries.map((entry) => {
            const isTop3 = entry.rank <= 3;
            return (
              <div
                key={entry.playerId}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition ${
                  isTop3
                    ? "border-transparent shadow-sm"
                    : "border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800"
                }`}
                style={
                  isTop3
                    ? undefined
                    : undefined
                }
              >
                {/* Rank Badge */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0 ${
                    RANK_STYLES[entry.rank] || "bg-slate-100 dark:bg-slate-700 text-slate-500"
                  }`}
                >
                  {entry.rank}
                </div>

                {/* Player Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-slate-800 dark:text-white truncate">
                    {entry.playerName}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    {entry.teamName} · {entry.matchesPlayed} match{entry.matchesPlayed !== 1 ? "es" : ""}
                  </div>
                </div>

                {/* Stat Value */}
                <div className="text-right shrink-0">
                  <div className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400">
                    {entry.value}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
