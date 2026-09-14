import { useState, useEffect } from "react";
import { X, Loader2, Trophy, ChevronDown, ChevronUp } from "lucide-react";
import {
  tournamentService,
  type GenericMatchState,
  type PlayerMatchStats,
} from "../../../services/sports/tournamentService";
import { PERIOD_LABELS } from "./utils/sportScoringConstants";

interface GenericMatchDetailViewProps {
  matchId: number;
  onClose: () => void;
}

const EVENT_ICONS: Record<string, string> = {
  GOAL: "⚽",
  PENALTY_GOAL: "⚽",
  OWN_GOAL: "⚽",
  YELLOW_CARD: "🟨",
  RED_CARD: "🟥",
  SUBSTITUTION: "🔄",
  POINT: "⭐",
  ACE: "💨",
  THREE_POINTER: "🏀",
  TWO_POINTER: "🏀",
  FREE_THROW: "🏀",
  FOUL: "⚠️",
  TIMEOUT: "⏸️",
  SERVICE_ERROR: "❌",
  DOUBLE_FAULT: "❌",
  KILL: "💥",
  BLOCK: "🛡️",
};

const isSetBased = (sport: string) =>
  ["BADMINTON", "VOLLEYBALL", "TENNIS", "TABLE_TENNIS"].includes(sport);

export function GenericMatchDetailView({
  matchId,
  onClose,
}: GenericMatchDetailViewProps) {
  const [state, setState] = useState<GenericMatchState | null>(null);
  const [playerStats, setPlayerStats] = useState<PlayerMatchStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTimeline, setShowTimeline] = useState(true);
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    Promise.all([
      tournamentService.getGenericMatchState(matchId),
      tournamentService.getGenericPlayerStats(matchId).catch(() => []),
    ])
      .then(([matchState, stats]) => {
        setState(matchState);
        setPlayerStats(stats);
      })
      .catch(() => setError("Failed to load match details"))
      .finally(() => setLoading(false));
  }, [matchId]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (error || !state) {
    return (
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 max-w-sm text-center"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-sm text-slate-700 dark:text-slate-200 font-semibold">
            {error || "Match data unavailable"}
          </p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const sportType = state.sportType || "BADMINTON";
  const periodLabels = PERIOD_LABELS[sportType] || [];
  const winnerA = state.scoreTeamA > state.scoreTeamB;
  const winnerB = state.scoreTeamB > state.scoreTeamA;
  const isDraw = state.scoreTeamA === state.scoreTeamB;

  // For football-like sports, separate goals from cards
  const goalEvents = state.recentEvents.filter(
    (e) =>
      e.eventType === "GOAL" ||
      e.eventType === "PENALTY_GOAL" ||
      e.eventType === "OWN_GOAL"
  );
  const cardEvents = state.recentEvents.filter(
    (e) => e.eventType === "YELLOW_CARD" || e.eventType === "RED_CARD"
  );

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[95vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Match Details
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-semibold">
              {sportType.replace(/_/g, " ")}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        {/* Match header / Final score */}
        <div className="px-4 py-6 bg-gradient-to-b from-slate-50 to-white dark:from-slate-800 dark:to-slate-900">
          <div className="flex items-center justify-between gap-3">
            {/* Team A */}
            <div className="flex-1 text-center">
              <div
                className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center text-white text-sm font-bold shadow-md"
                style={{
                  backgroundColor: state.teamAColor || "#6366f1",
                }}
              >
                {state.teamAName.slice(0, 2).toUpperCase()}
              </div>
              <p
                className={`text-xs font-bold truncate ${
                  winnerA
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-slate-800 dark:text-slate-100"
                }`}
              >
                {state.teamAName}
              </p>
              {winnerA && (
                <span className="text-[9px] text-emerald-500 font-bold">
                  WINNER
                </span>
              )}
            </div>

            {/* Score */}
            <div className="text-center px-4">
              <div className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">
                {state.scoreTeamA}
                <span className="text-slate-300 dark:text-slate-600 mx-2">
                  -
                </span>
                {state.scoreTeamB}
              </div>
              {isSetBased(sportType) && (
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Sets: {state.periodsWonA} - {state.periodsWonB}
                </div>
              )}
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                {state.status === "COMPLETED" ? "Full Time" : state.status}
              </p>
            </div>

            {/* Team B */}
            <div className="flex-1 text-center">
              <div
                className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center text-white text-sm font-bold shadow-md"
                style={{
                  backgroundColor: state.teamBColor || "#f97316",
                }}
              >
                {state.teamBName.slice(0, 2).toUpperCase()}
              </div>
              <p
                className={`text-xs font-bold truncate ${
                  winnerB
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-slate-800 dark:text-slate-100"
                }`}
              >
                {state.teamBName}
              </p>
              {winnerB && (
                <span className="text-[9px] text-emerald-500 font-bold">
                  WINNER
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Period-by-period scores table */}
        {state.periods.length > 0 && (
          <div className="px-4 pb-4">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                    <th className="text-left py-2 font-semibold">Team</th>
                    {state.periods.map((p) => (
                      <th
                        key={p.periodNumber}
                        className="text-center py-2 font-semibold px-2"
                      >
                        {p.periodLabel}
                      </th>
                    ))}
                    <th className="text-center py-2 font-bold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <td
                      className="py-2 font-semibold"
                      style={{ color: state.teamAColor || "#6366f1" }}
                    >
                      {state.teamAName}
                    </td>
                    {state.periods.map((p) => (
                      <td
                        key={p.periodNumber}
                        className={`text-center py-2 font-mono ${
                          p.scoreTeamA > p.scoreTeamB
                            ? "text-emerald-600 dark:text-emerald-400 font-bold"
                            : "text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        {p.scoreTeamA}
                      </td>
                    ))}
                    <td
                      className={`text-center py-2 font-bold ${
                        winnerA
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-slate-800 dark:text-slate-100"
                      }`}
                    >
                      {state.scoreTeamA}
                    </td>
                  </tr>
                  <tr>
                    <td
                      className="py-2 font-semibold"
                      style={{ color: state.teamBColor || "#f97316" }}
                    >
                      {state.teamBName}
                    </td>
                    {state.periods.map((p) => (
                      <td
                        key={p.periodNumber}
                        className={`text-center py-2 font-mono ${
                          p.scoreTeamB > p.scoreTeamA
                            ? "text-emerald-600 dark:text-emerald-400 font-bold"
                            : "text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        {p.scoreTeamB}
                      </td>
                    ))}
                    <td
                      className={`text-center py-2 font-bold ${
                        winnerB
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-slate-800 dark:text-slate-100"
                      }`}
                    >
                      {state.scoreTeamB}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Goal scorers for football/soccer */}
        {(sportType === "FOOTBALL" || sportType === "SOCCER") &&
          goalEvents.length > 0 && (
            <div className="px-4 pb-4">
              <h3 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Goals
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  {goalEvents
                    .filter((e) => e.teamId === state.teamAId)
                    .map((e) => (
                      <div
                        key={e.id}
                        className="text-xs text-slate-700 dark:text-slate-200"
                      >
                        <span className="mr-1">
                          {EVENT_ICONS[e.eventType] || "⚽"}
                        </span>
                        {e.playerName || "Unknown"}
                        {e.matchMinute != null && (
                          <span className="text-slate-400 ml-1">
                            {e.matchMinute}'
                          </span>
                        )}
                        {e.eventType === "OWN_GOAL" && (
                          <span className="text-orange-500 text-[10px] ml-1">
                            (OG)
                          </span>
                        )}
                        {e.eventType === "PENALTY_GOAL" && (
                          <span className="text-slate-400 text-[10px] ml-1">
                            (P)
                          </span>
                        )}
                      </div>
                    ))}
                </div>
                <div className="space-y-1 text-right">
                  {goalEvents
                    .filter((e) => e.teamId === state.teamBId)
                    .map((e) => (
                      <div
                        key={e.id}
                        className="text-xs text-slate-700 dark:text-slate-200"
                      >
                        {e.matchMinute != null && (
                          <span className="text-slate-400 mr-1">
                            {e.matchMinute}'
                          </span>
                        )}
                        {e.playerName || "Unknown"}
                        {e.eventType === "OWN_GOAL" && (
                          <span className="text-orange-500 text-[10px] ml-1">
                            (OG)
                          </span>
                        )}
                        {e.eventType === "PENALTY_GOAL" && (
                          <span className="text-slate-400 text-[10px] ml-1">
                            (P)
                          </span>
                        )}
                        <span className="ml-1">
                          {EVENT_ICONS[e.eventType] || "⚽"}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

        {/* Cards for football/soccer */}
        {(sportType === "FOOTBALL" || sportType === "SOCCER") &&
          cardEvents.length > 0 && (
            <div className="px-4 pb-4">
              <h3 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Cards
              </h3>
              <div className="flex flex-wrap gap-2">
                {cardEvents.map((e) => (
                  <span
                    key={e.id}
                    className={`inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-md font-semibold ${
                      e.eventType === "YELLOW_CARD"
                        ? "bg-yellow-50 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                        : "bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                    }`}
                  >
                    {EVENT_ICONS[e.eventType]}{" "}
                    {e.playerName || "Unknown"} ({e.teamName})
                    {e.matchMinute != null && ` ${e.matchMinute}'`}
                  </span>
                ))}
              </div>
            </div>
          )}

        {/* Event timeline */}
        <div className="px-4 pb-2">
          <button
            onClick={() => setShowTimeline(!showTimeline)}
            className="w-full flex items-center justify-between py-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider"
          >
            Event Timeline ({state.recentEvents.length})
            {showTimeline ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
        {showTimeline && (
          <div className="px-4 pb-4">
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {state.recentEvents.length === 0 && (
                <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-3">
                  No events recorded
                </p>
              )}
              {state.recentEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="flex items-center gap-2.5 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg"
                >
                  <span className="text-sm flex-shrink-0">
                    {EVENT_ICONS[evt.eventType] || "•"}
                  </span>
                  <div
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor:
                        evt.teamId === state.teamAId
                          ? state.teamAColor || "#6366f1"
                          : state.teamBColor || "#f97316",
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                      {evt.teamName}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 ml-1.5">
                      {evt.eventType.replace(/_/g, " ")}
                      {evt.playerName && ` - ${evt.playerName}`}
                      {evt.pointsAwarded > 0 && ` (+${evt.pointsAwarded})`}
                    </span>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    {evt.matchMinute != null && (
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">
                        {evt.matchMinute}'
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Player stats */}
        {playerStats.length > 0 && (
          <>
            <div className="px-4 pb-2">
              <button
                onClick={() => setShowStats(!showStats)}
                className="w-full flex items-center justify-between py-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider"
              >
                Player Statistics ({playerStats.length})
                {showStats ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
            {showStats && (
              <div className="px-4 pb-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                        <th className="text-left py-2 font-semibold">Player</th>
                        <th className="text-left py-2 font-semibold">Team</th>
                        {playerStats[0]?.stats &&
                          Object.keys(playerStats[0].stats).map((key) => (
                            <th
                              key={key}
                              className="text-center py-2 font-semibold px-2"
                            >
                              {key
                                .replace(/([A-Z])/g, " $1")
                                .replace(/^./, (s) => s.toUpperCase())
                                .trim()}
                            </th>
                          ))}
                      </tr>
                    </thead>
                    <tbody>
                      {playerStats.map((ps) => (
                        <tr
                          key={ps.playerId}
                          className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                          <td className="py-1.5 font-semibold text-slate-800 dark:text-slate-100">
                            {ps.playerName}
                          </td>
                          <td className="py-1.5 text-slate-500 dark:text-slate-400">
                            {ps.teamName}
                          </td>
                          {Object.values(ps.stats).map((val, i) => (
                            <td
                              key={i}
                              className="text-center py-1.5 text-slate-600 dark:text-slate-300 font-mono"
                            >
                              {String(val)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
