import { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  Loader2,
  AlertTriangle,
  Maximize2,
  Minimize2,
  RefreshCw,
  Trophy,
  Activity,
  Clock,
  Info,
} from "lucide-react";
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const reconnectTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchState = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const data = await tournamentService.getGenericMatchState(matchId);
      setState(data);
      setLastUpdated(new Date());
      setError(null);
    } catch {
      if (!state) {
        setError("Could not load live match data. Please try again.");
      }
    } finally {
      setLoading(false);
      if (isManual) setIsRefreshing(false);
    }
  }, [matchId, state]);

  useEffect(() => {
    fetchState(false);

    const unsub = stompClient.subscribe(
      `/topic/match/${matchId}/generic-state`,
      (body) => {
        setState(body as GenericMatchState);
        setLastUpdated(new Date());
        setError(null);
      }
    );

    const unsubConnect = stompClient.onConnect(() => {
      fetchState(false);
    });

    reconnectTimer.current = setInterval(() => {
      fetchState(false);
    }, 5000);

    return () => {
      unsub();
      unsubConnect();
      if (reconnectTimer.current) clearInterval(reconnectTimer.current);
    };
  }, [matchId, fetchState]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 text-white p-6 rounded-2xl shadow-2xl flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
          <p className="text-sm font-medium text-slate-300">Loading live match...</p>
        </div>
      </div>
    );
  }

  if (error || !state) {
    return (
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 max-w-sm text-center border border-slate-200 dark:border-slate-800"
          onClick={(e) => e.stopPropagation()}
        >
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <p className="text-sm text-slate-700 dark:text-slate-200 font-semibold">
            {error || "Match data unavailable"}
          </p>
          <div className="mt-4 flex gap-2 justify-center">
            <button
              onClick={() => fetchState(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </button>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const sportType = state.sportType || "BADMINTON";
  const periodLabels = PERIOD_LABELS[sportType] || [];
  const currentPeriodLabel =
    periodLabels[state.currentPeriod - 1] || `Period ${state.currentPeriod}`;
  const isCompleted = state.status === "COMPLETED";
  const periodsToWin = state.scoringConfig?.periodsToWin || Math.max(state.periodsWonA, state.periodsWonB, 2);

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4"
      onClick={onClose}
    >
      <div
        className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col transition-all duration-200 ${
          isFullscreen
            ? "fixed inset-0 w-screen h-screen z-50 rounded-none"
            : "w-full max-w-[96vw] sm:max-w-2xl lg:max-w-3xl h-[85vh] max-h-[92vh] rounded-2xl overflow-hidden"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="bg-slate-950 px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between text-white border-b border-slate-800/80 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <h2 className="text-xs sm:text-sm font-bold tracking-wide uppercase">
              {sportType.replace(/_/g, " ")}
            </h2>

            {!isCompleted && (
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/15 border border-red-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[10px] font-extrabold text-red-400 tracking-wider">LIVE</span>
              </div>
            )}

            {isCompleted && (
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30">
                <Trophy className="w-3 h-3 text-emerald-400" />
                <span className="text-[10px] font-extrabold text-emerald-400 tracking-wider">FINISHED</span>
              </div>
            )}

            <span className="hidden sm:inline text-xs text-slate-400">
              Match #{state.matchId}
            </span>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => fetchState(true)}
              disabled={isRefreshing}
              className="p-1.5 sm:p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              title={`Last updated ${lastUpdated.toLocaleTimeString()} — Click to refresh`}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-indigo-400" : ""}`} />
            </button>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 sm:p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 text-slate-400 hover:text-white hover:bg-red-500/20 hover:text-red-400 rounded-lg transition ml-1"
              title="Close Live View"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Hero Scoreboard (Centered, Spacious) */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white px-4 sm:px-8 py-5 sm:py-6 border-b border-slate-700/60 shrink-0">
          <div className="flex items-center justify-between gap-3 sm:gap-6">
            {/* Team / Player A */}
            <div className="flex-1 text-center">
              <div
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full mx-auto mb-2 flex items-center justify-center text-white text-base sm:text-lg font-extrabold shadow-lg border-2 border-white/20 transition-transform hover:scale-105"
                style={{
                  backgroundColor: state.teamAColor || "#6366f1",
                }}
              >
                {state.teamAName.slice(0, 2).toUpperCase()}
              </div>
              <p className="text-xs sm:text-sm font-bold text-white truncate max-w-[130px] sm:max-w-[180px] mx-auto">
                {state.teamAName}
              </p>
              {isSetBased(sportType) && (
                <div className="text-[11px] text-indigo-300 font-semibold mt-0.5">
                  Sets: {state.periodsWonA}
                </div>
              )}
            </div>

            {/* Score in Current Period */}
            <div className="text-center px-2 sm:px-6 shrink-0">
              <div className="text-3xl sm:text-5xl font-black text-white font-mono tracking-tight drop-shadow-sm">
                {state.scoreTeamA}
                <span className="text-slate-400 mx-2 sm:mx-3 font-normal">:</span>
                {state.scoreTeamB}
              </div>

              {!isCompleted ? (
                <div className="inline-block mt-1 sm:mt-2 px-3 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-bold animate-pulse">
                  {currentPeriodLabel}
                </div>
              ) : (
                <div className="inline-block mt-1 sm:mt-2 px-3 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
                  Final Score
                </div>
              )}
            </div>

            {/* Team / Player B */}
            <div className="flex-1 text-center">
              <div
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full mx-auto mb-2 flex items-center justify-center text-white text-base sm:text-lg font-extrabold shadow-lg border-2 border-white/20 transition-transform hover:scale-105"
                style={{
                  backgroundColor: state.teamBColor || "#f97316",
                }}
              >
                {state.teamBName.slice(0, 2).toUpperCase()}
              </div>
              <p className="text-xs sm:text-sm font-bold text-white truncate max-w-[130px] sm:max-w-[180px] mx-auto">
                {state.teamBName}
              </p>
              {isSetBased(sportType) && (
                <div className="text-[11px] text-amber-300 font-semibold mt-0.5">
                  Sets: {state.periodsWonB}
                </div>
              )}
            </div>
          </div>

          {/* Set-based Visual Progress Dots */}
          {isSetBased(sportType) && (
            <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-slate-700/60">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-300 font-medium mr-1 truncate max-w-[80px]">
                  {state.teamAName}
                </span>
                {Array.from({ length: periodsToWin }, (_, i) => (
                  <div
                    key={i}
                    className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
                      i < state.periodsWonA
                        ? "border-transparent shadow-sm"
                        : "border-slate-500 bg-slate-800"
                    }`}
                    style={
                      i < state.periodsWonA
                        ? { backgroundColor: state.teamAColor || "#6366f1" }
                        : {}
                    }
                  />
                ))}
              </div>

              <div className="w-px h-4 bg-slate-600" />

              <div className="flex items-center gap-1.5">
                {Array.from({ length: periodsToWin }, (_, i) => (
                  <div
                    key={i}
                    className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
                      i < state.periodsWonB
                        ? "border-transparent shadow-sm"
                        : "border-slate-500 bg-slate-800"
                    }`}
                    style={
                      i < state.periodsWonB
                        ? { backgroundColor: state.teamBColor || "#f97316" }
                        : {}
                    }
                  />
                ))}
                <span className="text-[11px] text-slate-300 font-medium ml-1 truncate max-w-[80px]">
                  {state.teamBName}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto min-h-0 bg-slate-50 dark:bg-slate-900/60 p-3 sm:p-6 space-y-4 sm:space-y-6">
          {/* Period Scores Breakdown Table */}
          {state.periods.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-slate-100/70 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-indigo-500" />
                  Score Breakdown by {isSetBased(sportType) ? "Set" : "Period"}
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 text-[11px] uppercase">
                      <th className="text-left py-2.5 px-3 sm:px-4 font-semibold">Team / Player</th>
                      {state.periods.map((p) => (
                        <th
                          key={p.periodNumber}
                          className={`text-center py-2.5 px-2 font-semibold ${
                            p.periodNumber === state.currentPeriod && !isCompleted
                              ? "text-indigo-600 dark:text-indigo-400 font-extrabold"
                              : ""
                          }`}
                        >
                          {p.periodLabel}
                        </th>
                      ))}
                      <th className="text-center py-2.5 px-3 sm:px-4 font-bold text-slate-800 dark:text-slate-100">
                        {isSetBased(sportType) ? "Sets" : "Total"}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 sm:px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: state.teamAColor || "#6366f1" }}
                        />
                        <span className="truncate">{state.teamAName}</span>
                      </td>
                      {state.periods.map((p) => (
                        <td
                          key={p.periodNumber}
                          className="text-center py-2.5 px-2 text-slate-700 dark:text-slate-200 font-mono font-semibold"
                        >
                          {p.scoreTeamA}
                        </td>
                      ))}
                      <td className="text-center py-2.5 px-3 sm:px-4 font-black text-indigo-600 dark:text-indigo-400 font-mono text-sm">
                        {isSetBased(sportType) ? state.periodsWonA : state.scoreTeamA}
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 sm:px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: state.teamBColor || "#f97316" }}
                        />
                        <span className="truncate">{state.teamBName}</span>
                      </td>
                      {state.periods.map((p) => (
                        <td
                          key={p.periodNumber}
                          className="text-center py-2.5 px-2 text-slate-700 dark:text-slate-200 font-mono font-semibold"
                        >
                          {p.scoreTeamB}
                        </td>
                      ))}
                      <td className="text-center py-2.5 px-3 sm:px-4 font-black text-amber-600 dark:text-amber-400 font-mono text-sm">
                        {isSetBased(sportType) ? state.periodsWonB : state.scoreTeamB}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Match Events Timeline */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-slate-100/70 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                Match Events ({state.recentEvents.length})
              </h3>
            </div>

            <div className="p-3 sm:p-4">
              {state.recentEvents.length === 0 ? (
                <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs sm:text-sm">
                  <Activity className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
                  <p className="font-semibold text-slate-700 dark:text-slate-300">
                    Waiting for events...
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Live points and score timeline will appear here automatically.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {state.recentEvents.map((evt) => (
                    <div
                      key={evt.id}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/50 text-xs sm:text-sm"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                          style={{
                            backgroundColor:
                              evt.teamId === state.teamAId
                                ? state.teamAColor || "#6366f1"
                                : state.teamBColor || "#f97316",
                          }}
                        />
                        <div className="truncate">
                          <span className="font-bold text-slate-800 dark:text-slate-100">
                            {evt.teamName}
                          </span>
                          <span className="text-slate-500 dark:text-slate-400 ml-1.5 font-medium">
                            {evt.eventType.replace(/_/g, " ")}
                            {evt.playerName && ` — ${evt.playerName}`}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 ml-2">
                        {evt.pointsAwarded > 0 && (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-extrabold text-xs">
                            +{evt.pointsAwarded}
                          </span>
                        )}
                        {evt.matchMinute != null && (
                          <span className="text-[11px] font-mono text-slate-400">
                            {evt.matchMinute}'
                          </span>
                        )}
                        {evt.timestamp && (
                          <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
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
              )}
            </div>
          </div>

          {/* Match Rules & Info */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700/80 shadow-sm">
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-indigo-500" />
              Match Info & Rules
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Sport</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {sportType.replace(/_/g, " ")}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Current Stage</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {currentPeriodLabel}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Format</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Best of {periodsToWin * 2 - 1} {isSetBased(sportType) ? "Sets" : "Periods"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Status</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {state.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
