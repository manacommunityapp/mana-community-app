import { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  Loader2,
  AlertTriangle,
  Maximize2,
  Minimize2,
  RefreshCw,
  Activity,
  Award,
  Zap,
  Info,
  Clock,
  Shield,
  ChevronRight,
} from "lucide-react";
import {
  tournamentService,
  type LiveMatchStateData,
  type BatterStateData,
  type BowlerStateData,
  type BallEventData,
} from "../../../services/sports/tournamentService";
import { stompClient } from "../../../services/chat/stompClient";
import { remainingBalls, requiredRunRate } from "./utils/cricketUtils";

interface LiveMatchViewProps {
  matchId: number;
  maxOvers?: number;
  onClose: () => void;
}

type TabType = "live" | "scorecard" | "overs" | "info";

export function LiveMatchView({ matchId, maxOvers, onClose }: LiveMatchViewProps) {
  const [state, setState] = useState<LiveMatchStateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("live");
  const [selectedInningsScorecard, setSelectedInningsScorecard] = useState<1 | 2>(1);

  const reconnectTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const stateRef = useRef<LiveMatchStateData | null>(null);
  stateRef.current = state;
  const prevMatchIdRef = useRef<number>(matchId);

  const fetchState = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const data = await tournamentService.getLiveMatchState(matchId);
      setState(data);
      setLastUpdated(new Date());
      setError(null);
    } catch {
      if (!stateRef.current) {
        setError("Could not load live match data. Please try again.");
      }
    } finally {
      setLoading(false);
      if (isManual) setIsRefreshing(false);
    }
  }, [matchId]);

  useEffect(() => {
    let isMounted = true;

    // Only reset state and trigger full-screen loading on initial mount or when matchId changes
    if (prevMatchIdRef.current !== matchId) {
      prevMatchIdRef.current = matchId;
      setState(null);
      setLoading(true);
    }

    fetchState(false);

    const unsubState = stompClient.subscribe(`/topic/match/${matchId}/state`, (body) => {
      if (!isMounted) return;
      setState(body as LiveMatchStateData);
      setLastUpdated(new Date());
      setError(null);
      setLoading(false);
    });

    const unsubConnect = stompClient.onConnect(() => {
      if (isMounted) fetchState(false);
    });

    // Fallback polling only when WebSocket is disconnected
    reconnectTimer.current = setInterval(() => {
      if (isMounted && !stompClient.connected) fetchState(false);
    }, 5000);

    return () => {
      isMounted = false;
      unsubState();
      unsubConnect();
      if (reconnectTimer.current) clearInterval(reconnectTimer.current);
    };
  }, [matchId, fetchState]);

  // Keep scorecard view aligned to current innings initially
  useEffect(() => {
    if (state?.currentInnings) {
      setSelectedInningsScorecard(state.currentInnings as 1 | 2);
    }
  }, [state?.currentInnings]);

  // Only show full loading overlay if we don't have any state yet
  if (loading && !state) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 text-white p-6 rounded-2xl shadow-2xl flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
          <p className="text-sm font-medium text-slate-300">Loading live scorecard...</p>
        </div>
      </div>
    );
  }

  if (error || !state) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 max-w-sm text-center border border-slate-200 dark:border-slate-800" onClick={e => e.stopPropagation()}>
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <p className="text-sm text-slate-700 dark:text-slate-200 font-semibold">{error || "Match data unavailable"}</p>
          <div className="mt-4 flex gap-2 justify-center">
            <button
              onClick={() => fetchState(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const effectiveMaxOvers = state.oversLimit ?? maxOvers ?? 20;

  // Accurately determine team innings mapping
  const inn1BattingTeam = state.innings1?.battingTeamName || state.teamAName;
  const isTeamABattingFirst = (state.innings1?.battingTeamId && state.innings1.battingTeamId === state.teamAId) || inn1BattingTeam === state.teamAName;

  const teamAInn = isTeamABattingFirst ? state.innings1 : state.innings2;
  const teamBInn = isTeamABattingFirst ? state.innings2 : state.innings1;

  const isTeamABatted = isTeamABattingFirst || state.currentInnings >= 2 || (teamAInn && (teamAInn.totalRuns > 0 || teamAInn.totalWickets > 0 || teamAInn.batters.length > 0));
  const isTeamBBatted = !isTeamABattingFirst || state.currentInnings >= 2 || (teamBInn && (teamBInn.totalRuns > 0 || teamBInn.totalWickets > 0 || teamBInn.batters.length > 0));

  const isTeamABattingNow = (state.currentInnings === 1 && isTeamABattingFirst) || (state.currentInnings === 2 && !isTeamABattingFirst);
  const isTeamBBattingNow = !isTeamABattingNow;

  const currentInn = state.currentInnings === 1 ? state.innings1 : state.innings2;
  const battingTeamName = currentInn.battingTeamName || (isTeamABattingNow ? state.teamAName : state.teamBName);
  const bowlingTeamName = isTeamABattingNow ? state.teamBName : state.teamAName;
  const battingTeamColor = isTeamABattingNow ? (state.teamAColor || "#3b82f6") : (state.teamBColor || "#ec4899");
  const bowlingTeamColor = isTeamABattingNow ? (state.teamBColor || "#ec4899") : (state.teamAColor || "#3b82f6");

  // Active batters
  const activeBatters = currentInn.batters.filter(b => !b.isOut);
  const striker = activeBatters.find(b => b.playerId === state.batsmanOnStrikeId) || activeBatters[0];
  const nonStriker = activeBatters.find(b => b.playerId !== striker?.playerId) || (activeBatters.length > 1 ? activeBatters[1] : undefined);

  // Fallback if innings started but batters haven't faced a ball yet
  const displayStriker: BatterStateData | undefined = striker || (state.batsmanOnStrikeName ? {
    playerId: state.batsmanOnStrikeId || 1,
    playerName: state.batsmanOnStrikeName,
    runs: 0,
    balls: 0,
    fours: 0,
    sixes: 0,
    strikeRate: "0.00",
    isOut: false,
  } : undefined);

  const displayNonStriker: BatterStateData | undefined = nonStriker || (state.batsmanNonStrikeName ? {
    playerId: state.batsmanNonStrikeId || 2,
    playerName: state.batsmanNonStrikeName,
    runs: 0,
    balls: 0,
    fours: 0,
    sixes: 0,
    strikeRate: "0.00",
    isOut: false,
  } : undefined);

  // Active bowler
  const activeBowler = currentInn.bowlers.find(b => b.playerId === state.currentBowlerId) || currentInn.bowlers[0];
  const displayBowler: BowlerStateData | undefined = activeBowler || (state.currentBowlerName ? {
    playerId: state.currentBowlerId || 1,
    playerName: state.currentBowlerName,
    overs: "0.0",
    runs: 0,
    wickets: 0,
    maidens: 0,
    economy: "0.00",
    dots: 0,
  } : undefined);

  // Partnership calculation
  const partnershipRuns = (displayStriker?.runs ?? 0) + (displayNonStriker?.runs ?? 0);
  const partnershipBalls = (displayStriker?.balls ?? 0) + (displayNonStriker?.balls ?? 0);

  // Target status for 2nd innings
  const chasingTarget = state.target && state.currentInnings === 2;
  const runsNeeded = chasingTarget ? Math.max(0, state.target! - state.innings2.totalRuns) : 0;
  const ballsLeft = chasingTarget ? remainingBalls(state.innings2.totalOvers, effectiveMaxOvers) : 0;
  const rrr = chasingTarget ? requiredRunRate(state.target!, state.innings2.totalRuns, state.innings2.totalOvers, effectiveMaxOvers) : "-";

  // Cricbuzz ball badge renderer
  const renderCricbuzzBall = (ball: string, key?: number | string) => {
    let bg = "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700";
    if (ball === "W") {
      bg = "bg-red-600 text-white font-extrabold shadow-sm shadow-red-500/20";
    } else if (ball === "4") {
      bg = "bg-blue-600 text-white font-extrabold shadow-sm shadow-blue-500/20";
    } else if (ball === "6") {
      bg = "bg-purple-600 text-white font-extrabold shadow-sm shadow-purple-500/20";
    } else if (ball.includes("wd") || ball.includes("nb")) {
      bg = "bg-amber-500 text-white font-bold shadow-sm shadow-amber-500/20";
    } else if (ball === "0" || ball === ".") {
      bg = "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400";
    } else if (["1", "2", "3"].includes(ball)) {
      bg = "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-semibold";
    }

    return (
      <span
        key={key}
        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-mono font-bold shrink-0 transition-transform hover:scale-110 ${bg}`}
      >
        {ball === "0" ? "•" : ball}
      </span>
    );
  };

  // Group recent balls into overs for the Overs tab
  const oversGrouped: Record<number, BallEventData[]> = {};
  if (state.recentBalls && state.recentBalls.length > 0) {
    state.recentBalls.forEach((b) => {
      const overNum = b.overNumber;
      if (!oversGrouped[overNum]) oversGrouped[overNum] = [];
      oversGrouped[overNum].push(b);
    });
  }
  const overNumbersDesc = Object.keys(oversGrouped)
    .map(Number)
    .sort((a, b) => b - a);

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-1 sm:p-4"
      onClick={onClose}
    >
      <div
        className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col transition-all duration-200 ${
          isFullscreen
            ? "fixed inset-0 w-screen h-screen z-50 rounded-none"
            : "w-full max-w-[98vw] sm:max-w-4xl lg:max-w-5xl h-[92vh] max-h-[96vh] rounded-2xl overflow-hidden"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top App Bar */}
        <div className="bg-slate-950 px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between text-white border-b border-slate-800/80 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/15 border border-red-500/30">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] font-extrabold text-red-400 tracking-wider">LIVE</span>
            </div>

            <span className="text-xs text-slate-400">
              Match #{state.matchId} • {effectiveMaxOvers} Overs
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
              title="Close Scorecard"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Hero Scoreboard (Cricbuzz Style) */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white px-3 sm:px-6 py-4 sm:py-5 border-b border-slate-700/60 shrink-0">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              {state.status === "COMPLETED" ? "Match Completed" : `Innings ${state.currentInnings} in Progress`}
            </span>
            <span className="text-[11px] text-slate-400">
              Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          </div>

          {/* Teams Banner */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 items-center">
            {/* Team A Card */}
            <div
              className={`p-3 rounded-xl border transition-all ${
                isTeamABattingNow
                  ? "bg-slate-800/80 border-indigo-500/40 shadow-lg shadow-indigo-500/10"
                  : "bg-slate-800/40 border-slate-700/50"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: state.teamAColor || "#3b82f6" }}
                  />
                  <span className="font-bold text-sm sm:text-base tracking-wide text-white">
                    {state.teamAName}
                  </span>
                </div>
                {isTeamABattingNow && (
                  <span className="text-[10px] bg-indigo-500/30 text-indigo-300 font-bold px-2 py-0.5 rounded-full border border-indigo-500/40 uppercase">
                    Batting
                  </span>
                )}
              </div>
              <div className="flex items-baseline justify-between mt-1">
                {isTeamABatted ? (
                  <>
                    <div className="text-2xl sm:text-3xl font-extrabold tracking-tight font-mono text-white">
                      {teamAInn.totalRuns}
                      <span className="text-slate-400 font-normal">/{teamAInn.totalWickets}</span>
                    </div>
                    <div className="text-right text-xs text-slate-300">
                      <span className="font-mono text-slate-400">({teamAInn.totalOvers} ov)</span>
                      <div className="text-[11px] text-slate-400">CRR: <span className="text-white font-semibold">{teamAInn.runRate}</span></div>
                    </div>
                  </>
                ) : (
                  <div className="text-slate-400 text-sm italic font-medium py-1">
                    Yet to bat
                  </div>
                )}
              </div>
            </div>

            {/* Team B Card */}
            <div
              className={`p-3 rounded-xl border transition-all ${
                isTeamBBattingNow
                  ? "bg-slate-800/80 border-indigo-500/40 shadow-lg shadow-indigo-500/10"
                  : "bg-slate-800/40 border-slate-700/50"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: state.teamBColor || "#ec4899" }}
                  />
                  <span className="font-bold text-sm sm:text-base tracking-wide text-white">
                    {state.teamBName}
                  </span>
                </div>
                {isTeamBBattingNow && (
                  <span className="text-[10px] bg-indigo-500/30 text-indigo-300 font-bold px-2 py-0.5 rounded-full border border-indigo-500/40 uppercase">
                    Batting
                  </span>
                )}
              </div>
              <div className="flex items-baseline justify-between mt-1">
                {isTeamBBatted ? (
                  <>
                    <div className="text-2xl sm:text-3xl font-extrabold tracking-tight font-mono text-white">
                      {teamBInn.totalRuns}
                      <span className="text-slate-400 font-normal">/{teamBInn.totalWickets}</span>
                    </div>
                    <div className="text-right text-xs text-slate-300">
                      <span className="font-mono text-slate-400">({teamBInn.totalOvers} ov)</span>
                      <div className="text-[11px] text-slate-400">
                        CRR: <span className="text-white font-semibold">{teamBInn.runRate}</span>
                        {chasingTarget && isTeamBBattingNow && (
                          <span className="ml-2">RRR: <span className="text-amber-300 font-semibold">{rrr}</span></span>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-slate-400 text-sm italic font-medium py-1">
                    Yet to bat
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Equation Banner */}
          {chasingTarget && (
            <div className="mt-3 p-2.5 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-between text-xs text-amber-200">
              <span className="font-medium">
                🎯 Target: <span className="font-bold text-white">{state.target}</span>
              </span>
              <span className="font-bold text-white">
                {state.innings2.battingTeamName || battingTeamName} need {runsNeeded} runs in {ballsLeft} balls
                {rrr !== "-" && <span className="text-amber-300 ml-1.5 font-normal">(RRR: {rrr})</span>}
              </span>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-100 dark:bg-slate-800/80 px-3 sm:px-6 flex items-center gap-2 border-b border-slate-200 dark:border-slate-700/60 overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab("live")}
            className={`py-2.5 sm:py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "live"
                ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <Activity className="w-3.5 h-3.5" /> Live Center
          </button>

          <button
            onClick={() => setActiveTab("scorecard")}
            className={`py-2.5 sm:py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "scorecard"
                ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <Shield className="w-3.5 h-3.5" /> Full Scorecard
          </button>

          <button
            onClick={() => setActiveTab("overs")}
            className={`py-2.5 sm:py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "overs"
                ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> Overs & Ball Log ({state.recentBalls?.length || 0})
          </button>

          <button
            onClick={() => setActiveTab("info")}
            className={`py-2.5 sm:py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "info"
                ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <Info className="w-3.5 h-3.5" /> Match Info
          </button>
        </div>

        {/* Scrollable Main Content Area */}
        <div className="flex-1 overflow-y-auto min-h-0 bg-slate-50 dark:bg-slate-900/50 p-3 sm:p-6 space-y-4 sm:space-y-6">
          {/* TAB 1: LIVE CENTER (Cricbuzz Experience) */}
          {activeTab === "live" && (
            <div className="space-y-4 sm:space-y-6">
              {/* This Over Strip */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-3 sm:p-4 border border-slate-200 dark:border-slate-700/80 shadow-sm">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    This Over ({currentInn.totalOvers} ov)
                  </span>
                  {currentInn.thisOver.length > 0 && (
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                      {currentInn.thisOver.length} balls bowled
                    </span>
                  )}
                </div>

                {currentInn.thisOver.length > 0 ? (
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    {currentInn.thisOver.map((ball, idx) => renderCricbuzzBall(ball, idx))}
                  </div>
                ) : (
                  <div className="py-2 text-xs text-slate-500 dark:text-slate-400 italic">
                    Waiting for first delivery of the over...
                  </div>
                )}
              </div>

              {/* Batting: At The Crease */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-sm overflow-hidden">
                <div className="px-3.5 sm:px-5 py-3 bg-slate-100/70 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: battingTeamColor }}
                    />
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Batter on Crease ({battingTeamName})
                    </h3>
                  </div>
                  <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                    * On Strike
                  </span>
                </div>

                {displayStriker || displayNonStriker ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs sm:text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 text-[11px] uppercase">
                          <th className="text-left py-2.5 px-3 sm:px-4 font-semibold">Batter</th>
                          <th className="text-right py-2.5 px-2 font-semibold">R</th>
                          <th className="text-right py-2.5 px-2 font-semibold">B</th>
                          <th className="text-right py-2.5 px-2 font-semibold">4s</th>
                          <th className="text-right py-2.5 px-2 font-semibold">6s</th>
                          <th className="text-right py-2.5 px-3 sm:px-4 font-semibold">SR</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                        {displayStriker && (
                          <tr className="bg-indigo-50/50 dark:bg-indigo-950/20 font-medium">
                            <td className="py-2.5 px-3 sm:px-4 text-slate-900 dark:text-white font-bold flex items-center gap-1.5">
                              <span>{displayStriker.playerName}</span>
                              <span className="text-indigo-600 dark:text-indigo-400 font-extrabold text-sm">*</span>
                              <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.2 rounded font-semibold ml-1">
                                Strike
                              </span>
                            </td>
                            <td className="text-right py-2.5 px-2 font-extrabold text-slate-900 dark:text-white font-mono">
                              {displayStriker.runs}
                            </td>
                            <td className="text-right py-2.5 px-2 text-slate-600 dark:text-slate-400 font-mono">
                              {displayStriker.balls}
                            </td>
                            <td className="text-right py-2.5 px-2 text-slate-600 dark:text-slate-400 font-mono">
                              {displayStriker.fours}
                            </td>
                            <td className="text-right py-2.5 px-2 text-slate-600 dark:text-slate-400 font-mono">
                              {displayStriker.sixes}
                            </td>
                            <td className="text-right py-2.5 px-3 sm:px-4 text-slate-600 dark:text-slate-400 font-mono">
                              {displayStriker.strikeRate}
                            </td>
                          </tr>
                        )}
                        {displayNonStriker && (
                          <tr className="font-medium">
                            <td className="py-2.5 px-3 sm:px-4 text-slate-800 dark:text-slate-200 font-semibold">
                              {displayNonStriker.playerName}
                            </td>
                            <td className="text-right py-2.5 px-2 font-extrabold text-slate-900 dark:text-white font-mono">
                              {displayNonStriker.runs}
                            </td>
                            <td className="text-right py-2.5 px-2 text-slate-600 dark:text-slate-400 font-mono">
                              {displayNonStriker.balls}
                            </td>
                            <td className="text-right py-2.5 px-2 text-slate-600 dark:text-slate-400 font-mono">
                              {displayNonStriker.fours}
                            </td>
                            <td className="text-right py-2.5 px-2 text-slate-600 dark:text-slate-400 font-mono">
                              {displayNonStriker.sixes}
                            </td>
                            <td className="text-right py-2.5 px-3 sm:px-4 text-slate-600 dark:text-slate-400 font-mono">
                              {displayNonStriker.strikeRate}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400">
                    <p className="font-semibold text-slate-700 dark:text-slate-300">
                      Innings commenced · 0.0 overs bowled
                    </p>
                    <p className="mt-1">
                      Batters will appear here once the first ball is bowled or players are selected.
                    </p>
                  </div>
                )}
              </div>

              {/* Bowling: Current Bowler & Spell */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-sm overflow-hidden">
                <div className="px-3.5 sm:px-5 py-3 bg-slate-100/70 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: bowlingTeamColor }}
                    />
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Bowling ({bowlingTeamName})
                    </h3>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Max: {state.maxOversPerBowler ?? Math.ceil(effectiveMaxOvers / 5)} ov/bowler
                  </span>
                </div>

                {displayBowler || currentInn.bowlers.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs sm:text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 text-[11px] uppercase">
                          <th className="text-left py-2.5 px-3 sm:px-4 font-semibold">Bowler</th>
                          <th className="text-right py-2.5 px-2 font-semibold">O</th>
                          <th className="text-right py-2.5 px-2 font-semibold">M</th>
                          <th className="text-right py-2.5 px-2 font-semibold">R</th>
                          <th className="text-right py-2.5 px-2 font-semibold">W</th>
                          <th className="text-right py-2.5 px-2 font-semibold">Econ</th>
                          <th className="text-right py-2.5 px-3 sm:px-4 font-semibold">0s</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                        {currentInn.bowlers.length > 0 ? (
                          currentInn.bowlers.map((b) => {
                            const isCurrent = b.playerId === state.currentBowlerId || b.playerName === displayBowler?.playerName;
                            return (
                              <tr
                                key={b.playerId}
                                className={
                                  isCurrent
                                    ? "bg-amber-50/50 dark:bg-amber-950/20 font-medium"
                                    : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                                }
                              >
                                <td className="py-2.5 px-3 sm:px-4 text-slate-900 dark:text-white font-bold flex items-center gap-1.5">
                                  <span>{b.playerName}</span>
                                  {isCurrent && (
                                    <span className="text-[10px] bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 px-1.5 py-0.2 rounded font-semibold">
                                      Active
                                    </span>
                                  )}
                                </td>
                                <td className="text-right py-2.5 px-2 text-slate-600 dark:text-slate-400 font-mono">{b.overs}</td>
                                <td className="text-right py-2.5 px-2 text-slate-600 dark:text-slate-400 font-mono">{b.maidens}</td>
                                <td className="text-right py-2.5 px-2 text-slate-600 dark:text-slate-400 font-mono">{b.runs}</td>
                                <td className="text-right py-2.5 px-2 font-extrabold text-red-600 dark:text-red-400 font-mono">{b.wickets}</td>
                                <td className="text-right py-2.5 px-2 text-slate-600 dark:text-slate-400 font-mono">{b.economy}</td>
                                <td className="text-right py-2.5 px-3 sm:px-4 text-slate-600 dark:text-slate-400 font-mono">{b.dots}</td>
                              </tr>
                            );
                          })
                        ) : displayBowler ? (
                          <tr className="bg-amber-50/50 dark:bg-amber-950/20 font-medium">
                            <td className="py-2.5 px-3 sm:px-4 text-slate-900 dark:text-white font-bold flex items-center gap-1.5">
                              <span>{displayBowler.playerName}</span>
                              <span className="text-[10px] bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 px-1.5 py-0.2 rounded font-semibold">
                                Active
                              </span>
                            </td>
                            <td className="text-right py-2.5 px-2 text-slate-600 dark:text-slate-400 font-mono">0.0</td>
                            <td className="text-right py-2.5 px-2 text-slate-600 dark:text-slate-400 font-mono">0</td>
                            <td className="text-right py-2.5 px-2 text-slate-600 dark:text-slate-400 font-mono">0</td>
                            <td className="text-right py-2.5 px-2 font-extrabold text-red-600 dark:text-red-400 font-mono">0</td>
                            <td className="text-right py-2.5 px-2 text-slate-600 dark:text-slate-400 font-mono">0.00</td>
                            <td className="text-right py-2.5 px-3 sm:px-4 text-slate-600 dark:text-slate-400 font-mono">0</td>
                          </tr>
                        ) : null}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400">
                    Waiting for opening bowler to be recorded.
                  </div>
                )}
              </div>

              {/* Partnership Card */}
              {(displayStriker || displayNonStriker) && (
                <div className="bg-white dark:bg-slate-800 rounded-xl p-3 sm:p-4 border border-slate-200 dark:border-slate-700/80 shadow-sm">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Current Partnership
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white font-mono text-sm">
                      {partnershipRuns} runs <span className="font-normal text-slate-500 text-xs">({partnershipBalls} balls)</span>
                    </span>
                  </div>

                  {displayStriker && displayNonStriker && partnershipRuns > 0 && (
                    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden flex">
                      <div
                        className="bg-indigo-600 h-full transition-all duration-300"
                        style={{
                          width: `${Math.round(((displayStriker.runs || 0) / partnershipRuns) * 100)}%`,
                        }}
                      />
                      <div
                        className="bg-pink-600 h-full transition-all duration-300"
                        style={{
                          width: `${Math.round(((displayNonStriker.runs || 0) / partnershipRuns) * 100)}%`,
                        }}
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                    <span>
                      {displayStriker?.playerName || "Striker"}: <strong className="text-slate-700 dark:text-slate-200">{displayStriker?.runs ?? 0} ({displayStriker?.balls ?? 0})</strong>
                    </span>
                    <span>
                      {displayNonStriker?.playerName || "Non-Striker"}: <strong className="text-slate-700 dark:text-slate-200">{displayNonStriker?.runs ?? 0} ({displayNonStriker?.balls ?? 0})</strong>
                    </span>
                  </div>
                </div>
              )}

              {/* Recent Deliveries Mini-Feed */}
              {state.recentBalls && state.recentBalls.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-xl p-3 sm:p-4 border border-slate-200 dark:border-slate-700/80 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-indigo-500" />
                      Recent Deliveries
                    </span>
                    <button
                      onClick={() => setActiveTab("overs")}
                      className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-0.5"
                    >
                      View Full Ball Log <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    {[...state.recentBalls]
                      .slice(-6)
                      .reverse()
                      .map((b) => (
                        <div
                          key={b.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-500 w-9">
                              {b.overNumber}.{b.ballNumber}
                            </span>
                            <div className="truncate max-w-[200px] sm:max-w-xs">
                              <span className="font-semibold text-slate-800 dark:text-slate-200">{b.bowlerName}</span>
                              <span className="text-slate-400 mx-1">to</span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200">{b.batsmanName}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {b.isWicket ? (
                              <span className="px-2 py-0.5 bg-red-600 text-white font-extrabold rounded text-[11px]">
                                WICKET
                              </span>
                            ) : b.extrasType ? (
                              <span className="px-2 py-0.5 bg-amber-500 text-white font-bold rounded text-[11px]">
                                {b.extrasRuns} {b.extrasType}
                              </span>
                            ) : (
                              <span
                                className={`px-2 py-0.5 font-bold rounded text-[11px] ${
                                  b.isSix
                                    ? "bg-purple-600 text-white"
                                    : b.isBoundary
                                    ? "bg-blue-600 text-white"
                                    : "bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                                }`}
                              >
                                {b.runsScored} {b.runsScored === 1 ? "run" : "runs"}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: FULL SCORECARD */}
          {activeTab === "scorecard" && (
            <div className="space-y-4 sm:space-y-6">
              {/* Innings Selector Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedInningsScorecard(1)}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 border ${
                    selectedInningsScorecard === 1
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                      : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <span>1st Innings: {inn1BattingTeam}</span>
                  <span className="font-mono">({state.innings1.totalRuns}/{state.innings1.totalWickets})</span>
                </button>

                <button
                  onClick={() => setSelectedInningsScorecard(2)}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 border ${
                    selectedInningsScorecard === 2
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                      : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <span>2nd Innings: {state.innings2.battingTeamName || (isTeamABattingFirst ? state.teamBName : state.teamAName)}</span>
                  {state.currentInnings === 1 && state.innings2.batters.length === 0 ? (
                    <span className="text-xs font-normal italic opacity-75">(Yet to bat)</span>
                  ) : (
                    <span className="font-mono">({state.innings2.totalRuns}/{state.innings2.totalWickets})</span>
                  )}
                </button>
              </div>

              {/* Selected Innings Scorecard Table */}
              {(() => {
                const innData = selectedInningsScorecard === 1 ? state.innings1 : state.innings2;
                const dismissals = innData.batters.filter((b) => b.isOut);

                return (
                  <div className="space-y-4">
                    {/* Batting Card */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                      <div className="px-4 py-3 bg-slate-100/70 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                          Batting Scorecard
                        </h4>
                        <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                          {innData.totalRuns}/{innData.totalWickets} ({innData.totalOvers} Ov) • CRR: {innData.runRate}
                        </span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-xs sm:text-sm">
                          <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 text-[11px] uppercase">
                              <th className="text-left py-2.5 px-3 sm:px-4 font-semibold">Batter</th>
                              <th className="text-left py-2.5 px-2 font-semibold">Dismissal</th>
                              <th className="text-right py-2.5 px-2 font-semibold">R</th>
                              <th className="text-right py-2.5 px-2 font-semibold">B</th>
                              <th className="text-right py-2.5 px-2 font-semibold">4s</th>
                              <th className="text-right py-2.5 px-2 font-semibold">6s</th>
                              <th className="text-right py-2.5 px-3 sm:px-4 font-semibold">SR</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                            {innData.batters.length > 0 ? (
                              innData.batters.map((b) => (
                                <tr key={b.playerId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                  <td className="py-2.5 px-3 sm:px-4 font-bold text-slate-900 dark:text-white">
                                    {b.playerName} {!b.isOut && <span className="text-indigo-500">*</span>}
                                  </td>
                                  <td className="py-2.5 px-2 text-slate-500 dark:text-slate-400 text-xs italic">
                                    {b.isOut ? (b.dismissalText || "out") : "not out"}
                                  </td>
                                  <td className="text-right py-2.5 px-2 font-extrabold text-slate-900 dark:text-white font-mono">
                                    {b.runs}
                                  </td>
                                  <td className="text-right py-2.5 px-2 text-slate-600 dark:text-slate-400 font-mono">
                                    {b.balls}
                                  </td>
                                  <td className="text-right py-2.5 px-2 text-slate-600 dark:text-slate-400 font-mono">
                                    {b.fours}
                                  </td>
                                  <td className="text-right py-2.5 px-2 text-slate-600 dark:text-slate-400 font-mono">
                                    {b.sixes}
                                  </td>
                                  <td className="text-right py-2.5 px-3 sm:px-4 text-slate-600 dark:text-slate-400 font-mono">
                                    {b.strikeRate}
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={7} className="py-6 text-center text-xs text-slate-400">
                                  No batting entries recorded yet for this innings.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Fall of Wickets */}
                    {dismissals.length > 0 && (
                      <div className="bg-white dark:bg-slate-800 rounded-xl p-3 sm:p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
                        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                          Fall of Wickets
                        </h4>
                        <div className="flex flex-wrap gap-2 text-xs">
                          {dismissals.map((d, i) => (
                            <span
                              key={d.playerId}
                              className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700/60 rounded-lg text-slate-700 dark:text-slate-300"
                            >
                              <strong className="text-red-500 mr-1">{i + 1}w:</strong>
                              {d.playerName} ({d.runs}r, {d.balls}b)
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Bowling Card */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                      <div className="px-4 py-3 bg-slate-100/70 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                          Bowling Figures
                        </h4>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-xs sm:text-sm">
                          <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 text-[11px] uppercase">
                              <th className="text-left py-2.5 px-3 sm:px-4 font-semibold">Bowler</th>
                              <th className="text-right py-2.5 px-2 font-semibold">O</th>
                              <th className="text-right py-2.5 px-2 font-semibold">M</th>
                              <th className="text-right py-2.5 px-2 font-semibold">R</th>
                              <th className="text-right py-2.5 px-2 font-semibold">W</th>
                              <th className="text-right py-2.5 px-2 font-semibold">Econ</th>
                              <th className="text-right py-2.5 px-3 sm:px-4 font-semibold">0s</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                            {innData.bowlers.length > 0 ? (
                              innData.bowlers.map((b) => (
                                <tr key={b.playerId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                  <td className="py-2.5 px-3 sm:px-4 font-bold text-slate-900 dark:text-white">
                                    {b.playerName}
                                  </td>
                                  <td className="text-right py-2.5 px-2 text-slate-600 dark:text-slate-400 font-mono">{b.overs}</td>
                                  <td className="text-right py-2.5 px-2 text-slate-600 dark:text-slate-400 font-mono">{b.maidens}</td>
                                  <td className="text-right py-2.5 px-2 text-slate-600 dark:text-slate-400 font-mono">{b.runs}</td>
                                  <td className="text-right py-2.5 px-2 font-extrabold text-red-600 dark:text-red-400 font-mono">{b.wickets}</td>
                                  <td className="text-right py-2.5 px-2 text-slate-600 dark:text-slate-400 font-mono">{b.economy}</td>
                                  <td className="text-right py-2.5 px-3 sm:px-4 text-slate-600 dark:text-slate-400 font-mono">{b.dots}</td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={7} className="py-6 text-center text-xs text-slate-400">
                                  No bowling figures recorded yet for this innings.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB 3: OVERS & COMMENTARY */}
          {activeTab === "overs" && (
            <div className="space-y-4">
              {overNumbersDesc.length > 0 ? (
                overNumbersDesc.map((overNum) => {
                  const ballsInOver = oversGrouped[overNum] || [];
                  const bowlerName = ballsInOver[0]?.bowlerName || "Bowler";
                  const overRuns = ballsInOver.reduce((sum, b) => sum + (b.runsScored || 0) + (b.extrasRuns || 0), 0);
                  const wicketsInOver = ballsInOver.filter((b) => b.isWicket).length;

                  return (
                    <div
                      key={overNum}
                      className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-sm overflow-hidden"
                    >
                      {/* Over Header Bar */}
                      <div className="px-3.5 sm:px-5 py-2.5 bg-slate-100/80 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                            Over {overNum + 1}
                          </span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-700 dark:text-slate-300 font-semibold">{bowlerName}</span>
                        </div>
                        <div className="flex items-center gap-2 font-mono font-bold text-slate-700 dark:text-slate-300">
                          <span>{overRuns} {overRuns === 1 ? "run" : "runs"}</span>
                          {wicketsInOver > 0 && (
                            <span className="text-red-500 font-extrabold">({wicketsInOver} wkt)</span>
                          )}
                        </div>
                      </div>

                      {/* Ball details in this over */}
                      <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                        {ballsInOver.map((b) => (
                          <div
                            key={b.id}
                            className="p-2.5 sm:px-4 sm:py-3 flex items-start justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-xs sm:text-sm"
                          >
                            <div className="flex items-start gap-2.5">
                              <span className="font-mono font-bold text-slate-400 w-9 shrink-0 pt-0.5">
                                {b.overNumber}.{b.ballNumber}
                              </span>
                              <div>
                                <div className="text-slate-800 dark:text-slate-200">
                                  <strong className="text-slate-900 dark:text-white">{b.bowlerName}</strong> to{" "}
                                  <strong className="text-slate-900 dark:text-white">{b.batsmanName}</strong>
                                </div>
                                {b.commentary ? (
                                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 italic">
                                    {b.commentary}
                                  </p>
                                ) : (
                                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    {b.isWicket
                                      ? `OUT! Dismissed (${b.dismissalType || "Wicket"})`
                                      : b.extrasType
                                      ? `${b.extrasRuns} runs awarded (${b.extrasType})`
                                      : `${b.runsScored} run(s) scored`}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="shrink-0 pt-0.5">
                              {renderCricbuzzBall(
                                b.isWicket ? "W" : b.extrasType ? `${b.extrasRuns}${b.extrasType.charAt(0).toLowerCase()}` : String(b.runsScored)
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="bg-white dark:bg-slate-800 rounded-xl p-8 text-center text-slate-500 dark:text-slate-400 text-xs sm:text-sm border border-slate-200 dark:border-slate-700">
                  <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
                  <p className="font-semibold text-slate-700 dark:text-slate-300">No ball events recorded yet</p>
                  <p className="mt-1 text-xs">Full over-by-over ball timeline will populate as deliveries are scored.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: MATCH INFO */}
          {activeTab === "info" && (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider pb-2 border-b border-slate-200 dark:border-slate-700">
                Match Details & Rules
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                <div>
                  <span className="text-slate-400 text-xs">Match Identifier</span>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">Match #{state.matchId}</div>
                </div>

                <div>
                  <span className="text-slate-400 text-xs">Format</span>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                    Cricket Limited Overs ({effectiveMaxOvers} Overs)
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 text-xs">Overs Limit</span>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                    {effectiveMaxOvers} overs per innings
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 text-xs">Max Overs per Bowler</span>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                    {state.maxOversPerBowler ?? Math.ceil(effectiveMaxOvers / 5)} overs
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 text-xs">Balls per Over</span>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                    {state.ballsPerOver || 6} legal deliveries
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 text-xs">Match Status</span>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                    {state.status}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 text-xs">Team A</span>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: state.teamAColor || "#3b82f6" }} />
                    {state.teamAName}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 text-xs">Team B</span>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: state.teamBColor || "#ec4899" }} />
                    {state.teamBName}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
