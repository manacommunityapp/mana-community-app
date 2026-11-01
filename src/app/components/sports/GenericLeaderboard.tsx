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
        const nonCricket = cfgs.filter((config) => !isCricketSport(config.eventName || config.tournamentName));
        setConfigs(nonCricket);
        if (nonCricket.length > 0) setSelectedConfigId(nonCricket[0].id);
      })
      .catch(() => toast.error("Failed to load tournaments"))
      .finally(() => setConfigsLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedConfigId) return;
    setCategories([]);
    setEntries([]);
    tournamentService
      .getGenericLeaderboardCategories(selectedConfigId)
      .then((cats) => {
        setCategories(cats);
        if (cats.length > 0) setActiveCategory(cats[0]);
      })
      .catch(() => {
        setCategories([]);
        setActiveCategory("");
        toast.error("Failed to load leaderboard categories");
      });
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
      <div className="flex min-h-48 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50">
        <Loader2 className="w-7 h-7 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (configs.length === 0) {
    return (
      <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-5 py-8 text-center text-sm text-slate-500">
        No tournaments available for leaderboard.
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 space-y-4 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm sm:rounded-3xl sm:p-5 lg:p-6">
      {/* Tournament Selector */}
      <div className="flex w-full flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <div>
          <p className="m-0 text-[10px] font-bold uppercase tracking-[0.14em] text-indigo-600">Multi-sport standings</p>
          <h3 className="mt-1 text-sm font-extrabold text-slate-900">Player leaderboard</h3>
        </div>
        <select
          value={selectedConfigId ?? ""}
          onChange={(e) => {
            setActiveCategory("");
            setSelectedConfigId(Number(e.target.value));
          }}
          aria-label="Select tournament for multi-sport leaderboard"
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none transition hover:border-indigo-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 sm:w-auto sm:min-w-[240px]"
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
        <div className="flex gap-1.5 overflow-x-auto rounded-xl border border-slate-100 bg-slate-50 p-2 pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap transition ${
                activeCategory === cat
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20"
                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-indigo-50 hover:text-indigo-700"
              }`}
            >
              {CATEGORY_LABELS[cat] || cat}
            </button>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white px-3 py-2.5">
        <Trophy className="h-4 w-4 text-amber-500" />
        <h3 className="text-sm font-bold text-slate-800 dark:text-white">
          {CATEGORY_LABELS[activeCategory] || activeCategory}
        </h3>
      </div>

      {/* Leaderboard Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
        </div>
      ) : entries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-12 text-center text-sm text-slate-500">
          No data available yet. Play some matches first!
        </div>
      ) : (
        <div className="space-y-2 rounded-2xl border border-slate-200/80 bg-slate-50 p-2">
          {entries.map((entry) => {
            const isTop3 = entry.rank <= 3;
            return (
              <div
                key={entry.playerId}
                className={`flex items-center gap-3 rounded-xl border px-3 py-3 transition hover:-translate-y-0.5 hover:shadow-sm ${
                  isTop3
                    ? "border-amber-200 bg-amber-50/70 shadow-sm"
                    : "border-slate-200/80 bg-white"
                }`}
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
                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
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
