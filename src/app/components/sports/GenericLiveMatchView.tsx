import { useState, useEffect, useRef } from "react";
import { X, Loader2, Wifi, WifiOff, AlertTriangle } from "lucide-react";
import {
  tournamentService,
  type GenericMatchState,
} from "../../../services/sports/tournamentService";
import { stompClient } from "../../../services/chat/stompClient";
import { PERIOD_LABELS } from "./utils/sportScoringConstants";

interface GenericLiveMatchViewProps {
  matchId: number;
  onClose: () => void;
}

const isSetBased = (sport: string) =>
  ["BADMINTON", "VOLLEYBALL", "TENNIS", "TABLE_TENNIS"].includes(sport);

export function GenericLiveMatchView({
  matchId,
  onClose,
}: GenericLiveMatchViewProps) {
  const [state, setState] = useState<GenericMatchState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [wsDisconnectedAt, setWsDisconnectedAt] = useState<Date | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    tournamentService
      .getGenericMatchState(matchId)
      .then(setState)
      .catch(() => setError("Could not load live match data. Please try again."))
      .finally(() => setLoading(false));

    const unsub = stompClient.subscribe(
      `/topic/match/${matchId}/generic-state`,
      (body) => {
        setState(body as GenericMatchState);
        setWsConnected(true);
        setWsDisconnectedAt(null);
      }
    );

    const unsubConnect = stompClient.onConnect(() => {
      setWsConnected(true);
      setWsDisconnectedAt(null);
    });

    const unsubDisconnect = stompClient.onDisconnect(() => {
      setWsConnected(false);
      setWsDisconnectedAt(new Date());
    });

    reconnectTimer.current = setInterval(async () => {
      if (!wsConnected) {
        try {
          const s = await tournamentService.getGenericMatchState(matchId);
          setState(s);
        } catch {
          /* silent fallback poll */
        }
      }
    }, 10000);

    return () => {
      unsub();
      unsubConnect();
      unsubDisconnect();
      if (reconnectTimer.current) clearInterval(reconnectTimer.current);
    };
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
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
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
  const currentPeriodLabel =
    periodLabels[state.currentPeriod - 1] || `Period ${state.currentPeriod}`;
  const isCompleted = state.status === "COMPLETED";

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {sportType.replace(/_/g, " ")} - Live
            </h2>
            {!isCompleted && (
              <span className="flex items-center gap-1 text-[10px] font-semibold">
                {wsConnected ? (
                  <>
                    <Wifi className="w-3 h-3 text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400">
                      Live
                    </span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3 h-3 text-amber-500" />
                    <span className="text-amber-600 dark:text-amber-400">
                      Reconnecting...
                    </span>
                  </>
                )}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        {/* Big scoreboard */}
        <div className="px-4 py-6">
          <div className="flex items-center justify-between gap-3">
            {/* Team A */}
            <div className="flex-1 text-center">
              <div
                className="w-14 h-14 rounded-full mx-auto mb-2 flex items-center justify-center text-white text-sm font-bold shadow-lg"
                style={{
                  backgroundColor: state.teamAColor || "#6366f1",
                }}
              >
                {state.teamAName.slice(0, 2).toUpperCase()}
              </div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                {state.teamAName}
              </p>
            </div>

            {/* Score */}
            <div className="text-center px-4">
              <div className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">
                {state.scoreTeamA}
                <span className="text-slate-300 dark:text-slate-600 mx-2">
                  :
                </span>
                {state.scoreTeamB}
              </div>
              {!isCompleted && (
                <p className="text-xs text-red-500 font-semibold mt-1 animate-pulse">
                  {currentPeriodLabel}
                </p>
              )}
              {isCompleted && (
                <p className="text-xs text-emerald-600 font-semibold mt-1">
                  Full Time
                </p>
              )}
            </div>

            {/* Team B */}
            <div className="flex-1 text-center">
              <div
                className="w-14 h-14 rounded-full mx-auto mb-2 flex items-center justify-center text-white text-sm font-bold shadow-lg"
                style={{
                  backgroundColor: state.teamBColor || "#f97316",
                }}
              >
                {state.teamBName.slice(0, 2).toUpperCase()}
              </div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                {state.teamBName}
              </p>
            </div>
          </div>

          {/* Set-based visual indicators */}
          {isSetBased(sportType) && (
            <div className="flex items-center justify-center gap-4 mt-4">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mr-1">
                  {state.teamAName.slice(0, 3)}
                </span>
                {Array.from(
                  {
                    length:
                      state.scoringConfig?.periodsToWin ||
                      Math.max(state.periodsWonA, state.periodsWonB, 2),
                  },
                  (_, i) => (
                    <div
                      key={i}
                      className={`w-3 h-3 rounded-full border-2 transition-all ${
                        i < state.periodsWonA
                          ? "border-transparent"
                          : "border-slate-300 dark:border-slate-600"
                      }`}
                      style={
                        i < state.periodsWonA
                          ? {
                              backgroundColor: state.teamAColor || "#6366f1",
                            }
                          : {}
                      }
                    />
                  )
                )}
              </div>
              <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
              <div className="flex items-center gap-1.5">
                {Array.from(
                  {
                    length:
                      state.scoringConfig?.periodsToWin ||
                      Math.max(state.periodsWonA, state.periodsWonB, 2),
                  },
                  (_, i) => (
                    <div
                      key={i}
                      className={`w-3 h-3 rounded-full border-2 transition-all ${
                        i < state.periodsWonB
                          ? "border-transparent"
                          : "border-slate-300 dark:border-slate-600"
                      }`}
                      style={
                        i < state.periodsWonB
                          ? {
                              backgroundColor: state.teamBColor || "#f97316",
                            }
                          : {}
                      }
                    />
                  )
                )}
                <span className="text-[10px] text-slate-500 dark:text-slate-400 ml-1">
                  {state.teamBName.slice(0, 3)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Period scores */}
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
                        className={`text-center py-2 font-semibold px-2 ${
                          p.periodNumber === state.currentPeriod && !isCompleted
                            ? "text-indigo-600 dark:text-indigo-400"
                            : ""
                        }`}
                      >
                        {p.periodLabel}
                      </th>
                    ))}
                    <th className="text-center py-2 font-bold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-2 font-semibold text-slate-800 dark:text-slate-100">
                      {state.teamAName}
                    </td>
                    {state.periods.map((p) => (
                      <td
                        key={p.periodNumber}
                        className="text-center py-2 text-slate-600 dark:text-slate-300 font-mono"
                      >
                        {p.scoreTeamA}
                      </td>
                    ))}
                    <td className="text-center py-2 font-bold text-slate-800 dark:text-slate-100">
                      {state.scoreTeamA}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 font-semibold text-slate-800 dark:text-slate-100">
                      {state.teamBName}
                    </td>
                    {state.periods.map((p) => (
                      <td
                        key={p.periodNumber}
                        className="text-center py-2 text-slate-600 dark:text-slate-300 font-mono"
                      >
                        {p.scoreTeamB}
                      </td>
                    ))}
                    <td className="text-center py-2 font-bold text-slate-800 dark:text-slate-100">
                      {state.scoreTeamB}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Recent events feed */}
        <div className="px-4 pb-4">
          <h3 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Match Events
          </h3>
          <div className="space-y-1.5 max-h-60 overflow-y-auto">
            {state.recentEvents.length === 0 && (
              <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-4">
                Waiting for events...
              </p>
            )}
            {state.recentEvents.map((evt) => (
              <div
                key={evt.id}
                className="flex items-center gap-2.5 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg"
              >
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
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
                  {evt.timestamp && (
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                      {new Date(evt.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
