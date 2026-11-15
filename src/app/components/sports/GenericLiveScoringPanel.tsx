import { useState, useEffect, useCallback } from "react";
import { X, Loader2, Undo2, AlertTriangle, ChevronDown, Radio, Send, Check, Sliders, Crown, Zap, RefreshCw } from "lucide-react";
import {
  tournamentService,
  type GenericMatchState,
  type GenericScoreRequest,
} from "../../../services/sports/tournamentService";
import { stompClient } from "../../../services/chat/stompClient";
import {
  SPORT_EVENT_TYPES,
  PERIOD_LABELS,
} from "./utils/sportScoringConstants";
import { toast } from "sonner";
import { MatchScoringRulesModal } from "./MatchScoringRulesModal";
import { EmergencyScoreModal } from "./EmergencyScoreModal";

interface GenericLiveScoringPanelProps {
  matchId: number;
  sportType: string; // "BADMINTON", "FOOTBALL", "BASKETBALL", "VOLLEYBALL", "TENNIS", "TABLE_TENNIS"
  onClose: () => void;
  teamA: { id: number; name: string; color: string };
  teamB: { id: number; name: string; color: string };
  players?: { id: number; name: string; teamId: number }[];
}

const COLOR_MAP: Record<string, string> = {
  green: "bg-emerald-500 hover:bg-emerald-600 text-white",
  blue: "bg-blue-500 hover:bg-blue-600 text-white",
  red: "bg-red-500 hover:bg-red-600 text-white",
  yellow: "bg-yellow-400 hover:bg-yellow-500 text-black",
  purple: "bg-purple-500 hover:bg-purple-600 text-white",
  indigo: "bg-indigo-500 hover:bg-indigo-600 text-white",
  orange: "bg-orange-500 hover:bg-orange-600 text-white",
  gray: "bg-slate-400 hover:bg-slate-500 text-white",
};

const isSetBased = (sport: string) =>
  [
    "BADMINTON",
    "VOLLEYBALL",
    "BEACH_VOLLEYBALL",
    "GRASS_VOLLEYBALL",
    "THROWBALL",
    "TENNIS",
    "TABLE_TENNIS",
    "PICKLEBALL",
    "SQUASH",
  ].includes(sport);

const isTimedSport = (sport: string) =>
  [
    "FOOTBALL",
    "SOCCER",
    "BASKETBALL",
    "KABADDI",
    "HOCKEY",
    "WATER_POLO",
    "RUGBY",
    "HANDBALL",
    "FUTSAL",
  ].includes(sport);

export const isIndividualSport = (sport?: string): boolean => {
  if (!sport) return false;
  const s = sport.toUpperCase().replace(/[\s_-]/g, "");
  return (
    s.includes("BADMINTON") ||
    s.includes("TENNIS") ||
    s.includes("TABLETENNIS") ||
    s.includes("SQUASH") ||
    s.includes("CHESS") ||
    s.includes("CARROM") ||
    s.includes("BILLIARDS") ||
    s.includes("POOL") ||
    s.includes("SNOOKER")
  );
};

export function GenericLiveScoringPanel({
  matchId,
  sportType,
  onClose,
  teamA: teamAProp,
  teamB: teamBProp,
  players,
}: GenericLiveScoringPanelProps) {
  const [state, setState] = useState<GenericMatchState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedPlayerA, setSelectedPlayerA] = useState<number | undefined>();
  const [selectedPlayerB, setSelectedPlayerB] = useState<number | undefined>();
  const [matchMinute, setMatchMinute] = useState<number | undefined>();
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [feedActive, setFeedActive] = useState<boolean>(true);
  const [publishingFeed, setPublishingFeed] = useState<boolean>(false);
  const [hasPublishedResult, setHasPublishedResult] = useState<boolean>(false);
  const [showRulesModal, setShowRulesModal] = useState<boolean>(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState<boolean>(false);

  const isCarrom = (sportType || "").toUpperCase().replace(/[\s-]/g, "_") === "CARROM";
  const [carromMode, setCarromMode] = useState<"BOARD" | "STROKE">("BOARD");
  const [carromWinner, setCarromWinner] = useState<"A" | "B">("A");
  const [carromOpponentMen, setCarromOpponentMen] = useState<number>(3);
  const [carromQueenCovered, setCarromQueenCovered] = useState<boolean>(false);

  const toggleFeedVisibility = async () => {
    const next = !feedActive;
    try {
      await tournamentService.setFeedSettings("match", matchId, { showInFeed: next });
      setFeedActive(next);
      toast.success(next ? "Match score visible on Live Now strip" : "Match hidden from Live Now strip");
    } catch {
      toast.error("Failed to update live strip setting");
    }
  };

  const handlePublishResultToFeed = async () => {
    setPublishingFeed(true);
    try {
      const res = await tournamentService.publishMatchResultToFeed(matchId);
      setHasPublishedResult(true);
      toast.success(res.message || "Match result posted to Community Feed!");
    } catch (e: any) {
      toast.error(e?.message || "Failed to publish result to feed");
    } finally {
      setPublishingFeed(false);
    }
  };

  const eventTypes = SPORT_EVENT_TYPES[sportType] || SPORT_EVENT_TYPES["DEFAULT"] || [];
  const periodLabels = PERIOD_LABELS[sportType] || PERIOD_LABELS["DEFAULT"] || ["Period 1", "Period 2", "Period 3"];

  const fetchState = useCallback(async () => {
    try {
      const s = await tournamentService.getGenericMatchState(matchId);
      setState(s);
    } catch {
      setError("Failed to load match state");
    }
  }, [matchId]);

  useEffect(() => {
    fetchState().finally(() => setLoading(false));

    const unsub = stompClient.subscribe(
      `/topic/match/${matchId}/generic-state`,
      (body) => setState(body as GenericMatchState)
    );

    const interval = setInterval(() => {
      if (!stompClient.connected) fetchState();
    }, 10000);

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, [fetchState, matchId]);

  const isIndividual = isIndividualSport(sportType);
  const defaultSideAName = isIndividual ? "Player 1" : "Team A";
  const defaultSideBName = isIndividual ? "Player 2" : "Team B";

  const resolveCompetitorName = (
    serverName?: string | null,
    propName?: string | null,
    fallback: string = "TBD"
  ): string => {
    const isGeneric = (name?: string | null) =>
      !name ||
      ["TEAM A", "TEAM B", "PLAYER 1", "PLAYER 2", "COMPETITOR A", "COMPETITOR B", "TBD"].includes(
        name.trim().toUpperCase()
      );

    if (!isGeneric(serverName)) return serverName!.trim();
    if (!isGeneric(propName)) return propName!.trim();
    return (serverName && serverName.trim()) || (propName && propName.trim()) || fallback;
  };

  // Prefer the real competitor names: real player/team name > server name > prop name > fallback
  const teamA = {
    ...teamAProp,
    id: (state?.teamAId && state.teamAId > 0) ? state.teamAId : (teamAProp.id || 1),
    name: resolveCompetitorName(state?.teamAName, teamAProp.name, defaultSideAName),
  };
  const teamB = {
    ...teamBProp,
    id: (state?.teamBId && state.teamBId > 0) ? state.teamBId : (teamBProp.id || 2),
    name: resolveCompetitorName(state?.teamBName, teamBProp.name, defaultSideBName),
  };

  const isUnassigned =
    !teamA.name ||
    !teamB.name ||
    teamA.name.toUpperCase() === "TBD" ||
    teamB.name.toUpperCase() === "TBD" ||
    teamA.name.toUpperCase() === "BYE" ||
    teamB.name.toUpperCase() === "BYE";

  const handleScore = useCallback(
    async (
      teamId: number,
      eventType: string,
      points: number,
      playerId?: number
    ) => {
      if (!state || saving || state.status === "COMPLETED") return;
      if (isUnassigned) {
        toast.error(`Both ${isIndividual ? "players" : "teams"} must be assigned to this match before scoring.`);
        return;
      }
      const targetTeamId = teamId || (teamA.name === state?.teamAName ? teamA.id : teamB.id) || 1;

      // 1. Optimistic snapshot for rollback
      const prevState = state;
      const isTeamA = targetTeamId === state.teamAId || (teamA.name === state.teamAName);

      // 2. Immediate optimistic state update on umpire screen (0ms)
      setState((prev) => {
        if (!prev) return prev;
        const newScoreA = isTeamA ? prev.scoreTeamA + points : prev.scoreTeamA;
        const newScoreB = !isTeamA ? prev.scoreTeamB + points : prev.scoreTeamB;
        const updatedPeriods = prev.periods?.map((p) => {
          if (p.periodNumber === prev.currentPeriod) {
            return {
              ...p,
              scoreTeamA: isTeamA ? p.scoreTeamA + points : p.scoreTeamA,
              scoreTeamB: !isTeamA ? p.scoreTeamB + points : p.scoreTeamB,
            };
          }
          return p;
        }) || [];
        return {
          ...prev,
          scoreTeamA: newScoreA,
          scoreTeamB: newScoreB,
          periods: updatedPeriods,
        };
      });

      const req: GenericScoreRequest = {
        matchId,
        teamId: targetTeamId,
        eventType,
        periodNumber: state.currentPeriod,
        pointsAwarded: points,
        playerId,
        matchMinute: isTimedSport(sportType) ? matchMinute : undefined,
        commandId: crypto.randomUUID(),
      };

      try {
        if (stompClient.connected) {
          // Fast WebSocket publish (1-way frame, ~5-15ms)
          stompClient.publish(`/app/generic-match/${matchId}/score`, req);
        } else {
          setSaving(true);
          await tournamentService.recordGenericScore(req);
          await fetchState();
        }
      } catch (err: any) {
        // Rollback optimistic state if send failed
        setState(prevState);
        toast.error(err?.message || "Failed to record score");
      } finally {
        setSaving(false);
      }
    },
    [state, saving, matchId, sportType, matchMinute, fetchState, isUnassigned, teamA, teamB]
  );

  const handleUndo = useCallback(async () => {
    if (!state || saving) return;
    setSaving(true);
    try {
      if (stompClient.connected) {
        stompClient.publish(`/app/generic-match/${matchId}/undo`, {});
      } else {
        await tournamentService.undoGenericEvent(matchId);
        await fetchState();
      }
      toast.success("Last event undone");
    } catch (err: any) {
      toast.error(err?.message || "Failed to undo");
    } finally {
      setSaving(false);
    }
  }, [state, saving, matchId, fetchState]);

  const handleCompletePeriod = useCallback(async () => {
    if (!state || saving) return;
    setSaving(true);
    try {
      await tournamentService.completePeriod(matchId, state.currentPeriod);
      await fetchState();
      toast.success(`${periodLabels[state.currentPeriod - 1] || `Period ${state.currentPeriod}`} completed`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to complete period");
    } finally {
      setSaving(false);
    }
  }, [state, saving, matchId, fetchState, periodLabels]);

  const playersA = players?.filter((p) => p.teamId === teamA.id) || [];
  const playersB = players?.filter((p) => p.teamId === teamB.id) || [];
  const isCompleted = state?.status === "COMPLETED";

  if (loading && !state) {
    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (error || !state) {
    return (
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 max-w-sm text-center border border-slate-100 dark:border-slate-700"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-sm text-slate-800 dark:text-slate-100 font-bold mb-1">
            Scoring Issue Detected
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
            {error || "Unable to sync real-time match state. You can still score this match manually, record a walkover, or queue offline scores."}
          </p>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                setError(null);
                setLoading(true);
                fetchState().finally(() => setLoading(false));
              }}
              className="w-full px-4 py-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-semibold hover:bg-indigo-100 transition inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Connection</span>
            </button>
            <button
              type="button"
              onClick={() => setShowEmergencyModal(true)}
              className="w-full px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition inline-flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>⚡ Score Manually (Alternative Mode)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

        <EmergencyScoreModal
          isOpen={showEmergencyModal}
          onClose={() => setShowEmergencyModal(false)}
          matchId={matchId}
          configId={undefined}
          sportType={sportType}
          teamAId={teamA.id}
          teamBId={teamB.id}
          teamAName={teamA.name}
          teamBName={teamB.name}
          currentScoreA={undefined}
          currentScoreB={undefined}
          currentPeriod={1}
          onSuccess={() => {
            fetchState();
            onClose();
          }}
        />
      </div>
    );
  }

  const currentPeriodLabel =
    periodLabels[state.currentPeriod - 1] || `Period ${state.currentPeriod}`;

  const winnerPreScore = carromWinner === "A" ? (Number(state.scoreTeamA) || 0) : (Number(state.scoreTeamB) || 0);
  const canCoverQueen = winnerPreScore < 21;
  const effectiveQueenPoints = (carromQueenCovered && canCoverQueen) ? 3 : 0;
  const carromBoardPoints = carromOpponentMen + effectiveQueenPoints;

  const handleCarromBoardFinish = async () => {
    if (!state || saving || isCompleted) return;
    if (isUnassigned) {
      toast.error(`Both ${isIndividual ? "players" : "teams"} must be assigned before recording score.`);
      return;
    }
    setSaving(true);
    const scoreA = carromWinner === "A" ? carromBoardPoints : 0;
    const scoreB = carromWinner === "B" ? carromBoardPoints : 0;
    const winnerName = carromWinner === "A" ? teamA.name : teamB.name;
    try {
      await tournamentService.recordPeriodScore(matchId, state.currentPeriod, scoreA, scoreB);
      await tournamentService.completePeriod(matchId, state.currentPeriod);
      await fetchState();
      toast.success(`${currentPeriodLabel} saved: ${winnerName} awarded +${carromBoardPoints} pts!`);
      setCarromOpponentMen(3);
      setCarromQueenCovered(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to record board score");
    } finally {
      setSaving(false);
    }
  };

  // Check whether individual periods/sets are completed
  const checkSetWon = (
    scoreA: number,
    scoreB: number,
    sport: string,
    config?: typeof state.scoringConfig
  ) => {
    const target =
      config?.pointsToWinPeriod ??
      (sport === "TENNIS" ? 6 : sport === "TABLE_TENNIS" || sport === "SQUASH" ? 11 : 21);
    const mustWinByTwo = config?.mustWinByTwo ?? (sport !== "TENNIS");
    const maxCap =
      config?.tiebreakPointsToWin ??
      (sport === "BADMINTON" ? 30 : sport === "PICKLEBALL" ? 15 : undefined);

    if (maxCap && (scoreA >= maxCap || scoreB >= maxCap)) return true;
    if (sport === "TENNIS") {
      if ((scoreA >= target || scoreB >= target) && Math.abs(scoreA - scoreB) >= 2) return true;
      if ((scoreA === 7 && scoreB === 6) || (scoreB === 7 && scoreA === 6)) return true;
      return false;
    }
    if (mustWinByTwo) {
      return (scoreA >= target || scoreB >= target) && Math.abs(scoreA - scoreB) >= 2;
    }
    return scoreA >= target || scoreB >= target;
  };

  let computedSetsWonA = 0;
  let computedSetsWonB = 0;
  let hasAnySetCompleted = false;

  if (isSetBased(sportType)) {
    for (const p of state.periods) {
      const isPast = p.periodNumber < state.currentPeriod;
      const isSetDone =
        isPast ||
        (p.periodNumber === state.currentPeriod && isCompleted) ||
        checkSetWon(p.scoreTeamA, p.scoreTeamB, sportType, state.scoringConfig);

      if (isSetDone) {
        hasAnySetCompleted = true;
        if (p.scoreTeamA > p.scoreTeamB) computedSetsWonA++;
        else if (p.scoreTeamB > p.scoreTeamA) computedSetsWonB++;
      }
    }
  } else {
    computedSetsWonA = state.periodsWonA;
    computedSetsWonB = state.periodsWonB;
  }

  const pointTarget = state.scoringConfig?.pointsToWinPeriod ??
    (sportType === "TENNIS" ? 6 : sportType === "TABLE_TENNIS" || sportType === "SQUASH" ? 11 : 21);
  const scoreA = Number(state.scoreTeamA) || 0;
  const scoreB = Number(state.scoreTeamB) || 0;
  const isDeuce = isSetBased(sportType) && sportType !== "TENNIS" && scoreA === scoreB && scoreA >= pointTarget - 1;
  const teamAHasGamePoint = isSetBased(sportType) && checkSetWon(scoreA + 1, scoreB, sportType, state.scoringConfig);
  const teamBHasGamePoint = isSetBased(sportType) && checkSetWon(scoreA, scoreB + 1, sportType, state.scoringConfig);
  const setsToWin = Math.ceil((state.scoringConfig?.periodsCount || 3) / 2);
  const isMatchPoint =
    (teamAHasGamePoint && computedSetsWonA + 1 >= setsToWin) ||
    (teamBHasGamePoint && computedSetsWonB + 1 >= setsToWin);

  // Sort events from last point of time (most recent first)
  const sortedEvents = [...state.recentEvents].reverse().sort((a, b) => {
    if (a.timestamp && b.timestamp) {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      if (!isNaN(timeA) && !isNaN(timeB) && timeA !== timeB) return timeB - timeA;
    }
    if (a.id != null && b.id != null && a.id !== b.id) return b.id - a.id;
    return 0;
  });

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
      <div
        className="bg-white dark:bg-slate-900 w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[95vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-4 py-3 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold text-slate-800 dark:text-slate-100">
              {sportType.replace(/_/g, " ")} - Live Scoring
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {currentPeriodLabel}
              {isCompleted && (
                <span className="ml-2 text-emerald-600 font-semibold">
                  COMPLETED
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {saving && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                <Loader2 className="w-2.5 h-2.5 animate-spin" />
                <span>Saving...</span>
              </span>
            )}
            <button
              type="button"
              onClick={() => setShowRulesModal(true)}
              title="Configure match scoring rules & sets format"
              className="px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition cursor-pointer"
            >
              <Sliders className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
              <span>Rules</span>
            </button>
            <button
              type="button"
              onClick={() => setShowEmergencyModal(true)}
              title="Manual Score Override / Walkover / Forfeit / Abandon"
              className="px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition cursor-pointer"
            >
              <Zap className="w-3 h-3 text-amber-600 dark:text-amber-400" />
              <span>Override</span>
            </button>
            <button
              type="button"
              onClick={toggleFeedVisibility}
              title="Toggle whether live score appears on the top Live Now strip"
              className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 border transition-all cursor-pointer ${
                feedActive
                  ? "bg-red-50 text-red-600 border-red-200"
                  : "bg-slate-100 text-slate-500 border-slate-200 hover:text-slate-700"
              }`}
            >
              <Radio className="w-3 h-3 text-red-500 animate-pulse" />
              <span>{feedActive ? "Live Strip: ON" : "Live Strip: OFF"}</span>
            </button>
            <button
              onClick={() => setShowCloseConfirm(true)}
              className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
            >
              <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            </button>
          </div>
        </div>

        {/* Scoreboard */}
        <div className="px-4 py-4">
          {/* Pre-Match / Match Format Rules Banner */}
          {state.scoringConfig && (
            <div className="flex items-center justify-between text-[11px] px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 mb-3 border border-slate-200/60 dark:border-slate-700">
              <span className="font-medium truncate mr-2">
                Format:{" "}
                {isSetBased(sportType)
                  ? `Best of ${state.scoringConfig.periodsCount || 3} Sets • ${state.scoringConfig.pointsToWinPeriod || 21} pts${state.scoringConfig.mustWinByTwo ? " (Deuce)" : ""}${state.scoringConfig.tiebreakPointsToWin ? ` • Cap ${state.scoringConfig.tiebreakPointsToWin}` : ""}`
                  : isTimedSport(sportType)
                  ? `${state.scoringConfig.periodsCount || 2} Halves • ${state.scoringConfig.periodDurationMinutes || 45} mins${state.scoringConfig.hasOvertime ? " + OT" : ""}`
                  : isCarrom
                  ? `Carrom: First to ${state.scoringConfig.targetScore || 25} pts or lead after ${state.scoringConfig.periodsCount || 8} Boards`
                  : state.scoringConfig.targetScore
                  ? `Target: ${state.scoringConfig.targetScore} pts • ${state.scoringConfig.periodsCount || 1} Period`
                  : `${state.scoringConfig.periodsCount || 2} Periods`}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowRulesModal(true)}
                  className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  title="Configure sets, points, or timing rules for this match"
                >
                  <Sliders className="w-2.5 h-2.5" />
                  <span>Edit Rules</span>
                </button>
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold uppercase">
                  {state.status === "COMPLETED" ? "Finished" : state.status === "LIVE" ? "In Progress" : "Scheduled"}
                </span>
              </div>
            </div>
          )}

          {isUnassigned && (
            <div className="flex items-center justify-between gap-2 text-xs px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 mb-3 border border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>
                  Both {isIndividual ? "players" : "teams"} must be assigned before normal point-by-point scoring can begin.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowEmergencyModal(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] transition shrink-0 cursor-pointer shadow-xs"
              >
                <Zap className="w-3 h-3" />
                Override / Walkover
              </button>
            </div>
          )}

          <div className="flex items-center justify-between gap-2 mb-3">
            {/* Team A */}
            <div className="flex-1 text-center">
              <div
                className="w-10 h-10 rounded-full mx-auto mb-1 flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: teamA.color || "#6366f1" }}
              >
                {teamA.name.slice(0, 2).toUpperCase()}
              </div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                {teamA.name}
              </p>
            </div>

            {/* Score */}
            <div className="text-center px-4 py-2 rounded-2xl bg-slate-950 text-white shadow-inner min-w-[116px]">
              <div className="font-mono text-4xl sm:text-5xl font-black tracking-tight">
                {state.scoreTeamA}
                <span className="text-slate-500 mx-1">
                  -
                </span>
                {state.scoreTeamB}
              </div>
              {isSetBased(sportType) && (hasAnySetCompleted || isCompleted) && (
                <div className="text-[10px] text-slate-300 mt-1">
                  Sets: {computedSetsWonA} - {computedSetsWonB}
                </div>
              )}
              {isCarrom && (
                <div className="text-[10px] font-semibold text-amber-300 mt-1">
                  Target: {state.scoringConfig?.targetScore || 25} pts
                </div>
              )}
            </div>

            {/* Team B */}
            <div className="flex-1 text-center">
              <div
                className="w-10 h-10 rounded-full mx-auto mb-1 flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: teamB.color || "#f97316" }}
              >
                {teamB.name.slice(0, 2).toUpperCase()}
              </div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                {teamB.name}
              </p>
            </div>
          </div>

          {(isDeuce || teamAHasGamePoint || teamBHasGamePoint) && !isCompleted && (
            <div className={`mb-3 rounded-xl border px-3 py-2 text-center text-xs font-extrabold tracking-wide ${
              isDeuce
                ? "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-200"
                : "bg-indigo-50 border-indigo-200 text-indigo-800 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-200"
            }`} role="status" aria-live="polite">
              {isDeuce
                ? `DEUCE · ${scoreA}-${scoreB} · Win by 2 points`
                : `${isMatchPoint ? "MATCH POINT" : sportType === "TENNIS" ? "SET POINT" : "GAME POINT"} · ${teamAHasGamePoint ? teamA.name : teamB.name}`}
            </div>
          )}

          {/* Period scores */}
          {state.periods.length > 0 && (
            <div className="flex gap-1 justify-center flex-wrap mb-3">
              {state.periods.map((p) => (
                <div
                  key={p.periodNumber}
                  className={`text-xs px-2 py-1 rounded-lg font-semibold ${
                    p.periodNumber === state.currentPeriod
                      ? "bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-300"
                      : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  {p.periodLabel}: {p.scoreTeamA}-{p.scoreTeamB}
                </div>
              ))}
            </div>
          )}

          {/* Point-to-win progress bar for set-based sports */}
          {isSetBased(sportType) && state.scoringConfig?.pointsToWinPeriod && (
            <div className="mb-3">
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                <span>
                  {state.scoreTeamA} / {state.scoringConfig.pointsToWinPeriod}
                </span>
                <span>Target: {state.scoringConfig.pointsToWinPeriod}</span>
                <span>
                  {state.scoreTeamB} / {state.scoringConfig.pointsToWinPeriod}
                </span>
              </div>
              <div className="flex gap-1 h-1.5 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700">
                <div
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(
                      (state.scoreTeamA /
                        state.scoringConfig.pointsToWinPeriod) *
                        50,
                      50
                    )}%`,
                    backgroundColor: teamA.color || "#6366f1",
                  }}
                />
                <div className="flex-1" />
                <div
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(
                      (state.scoreTeamB /
                        state.scoringConfig.pointsToWinPeriod) *
                        50,
                      50
                    )}%`,
                    backgroundColor: teamB.color || "#f97316",
                  }}
                />
              </div>
            </div>
          )}

          {/* Target score progress bar for Carrom */}
          {isCarrom && (
            <div className="mb-3">
              {(() => {
                const target = state.scoringConfig?.targetScore || 25;
                const scoreA = Number(state.scoreTeamA) || 0;
                const scoreB = Number(state.scoreTeamB) || 0;
                return (
                  <>
                    <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                      <span className="font-bold" style={{ color: teamA.color || "#6366f1" }}>
                        {teamA.name}: {scoreA} / {target} pts
                      </span>
                      <span className="text-[10px] uppercase font-bold text-slate-400">
                        First to {target} pts
                      </span>
                      <span className="font-bold" style={{ color: teamB.color || "#f97316" }}>
                        {teamB.name}: {scoreB} / {target} pts
                      </span>
                    </div>
                    <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700">
                      <div
                        className="rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min((scoreA / target) * 50, 50)}%`,
                          backgroundColor: teamA.color || "#6366f1",
                        }}
                      />
                      <div className="flex-1" />
                      <div
                        className="rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min((scoreB / target) * 50, 50)}%`,
                          backgroundColor: teamB.color || "#f97316",
                        }}
                      />
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>

        {/* Match minute input for timed sports */}
        {isTimedSport(sportType) && !isCompleted && (
          <div className="px-4 pb-3">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Match Minute
            </label>
            <input
              type="number"
              min={0}
              max={150}
              value={matchMinute ?? ""}
              onChange={(e) =>
                setMatchMinute(
                  e.target.value ? Number(e.target.value) : undefined
                )
              }
              placeholder="e.g. 45"
              className="mt-1 w-24 px-2 py-1.5 text-xs border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
        )}

        {/* Player selectors */}
        {(playersA.length > 0 || playersB.length > 0) && !isCompleted && (
          <div className="px-4 pb-3 grid grid-cols-2 gap-3">
            {playersA.length > 0 && (
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {teamA.name} Player
                </label>
                <div className="relative mt-1">
                  <select
                    value={selectedPlayerA ?? ""}
                    onChange={(e) =>
                      setSelectedPlayerA(
                        e.target.value ? Number(e.target.value) : undefined
                      )
                    }
                    className="w-full px-2 py-1.5 text-xs border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 appearance-none pr-7 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  >
                    <option value="">-- Select --</option>
                    {playersA.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            )}
            {playersB.length > 0 && (
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {teamB.name} Player
                </label>
                <div className="relative mt-1">
                  <select
                    value={selectedPlayerB ?? ""}
                    onChange={(e) =>
                      setSelectedPlayerB(
                        e.target.value ? Number(e.target.value) : undefined
                      )
                    }
                    className="w-full px-2 py-1.5 text-xs border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 appearance-none pr-7 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  >
                    <option value="">-- Select --</option>
                    {playersB.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Carrom Mode Switch (Board vs Stroke) */}
        {!isCompleted && isCarrom && (
          <div className="px-4 pb-2.5 flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <span>👑</span>
              <span>{currentPeriodLabel} Scoring</span>
            </span>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setCarromMode("BOARD")}
                className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition cursor-pointer ${
                  carromMode === "BOARD"
                    ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                Board Finisher (ICF)
              </button>
              <button
                type="button"
                onClick={() => setCarromMode("STROKE")}
                className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition cursor-pointer ${
                  carromMode === "STROKE"
                    ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                Coin / Stroke
              </button>
            </div>
          </div>
        )}

        {/* Dedicated Carrom Board Finisher Interface */}
        {!isCompleted && isCarrom && carromMode === "BOARD" && (
          <div className="px-4 pb-3 space-y-3">
            <div className="p-3.5 bg-gradient-to-b from-amber-50/50 to-orange-50/30 dark:from-slate-800/80 dark:to-slate-800/40 rounded-2xl border border-amber-200/70 dark:border-slate-700 shadow-sm space-y-3">
              {/* Winner Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  1. Which player won {currentPeriodLabel}?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCarromWinner("A")}
                    className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex items-center justify-center gap-2 ${
                      carromWinner === "A"
                        ? "bg-white dark:bg-slate-700 border-indigo-500 ring-2 ring-indigo-400/30 shadow-xs"
                        : "bg-white/60 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                    }`}
                  >
                    <div
                      className="w-3.5 h-3.5 rounded-full"
                      style={{ backgroundColor: teamA.color || "#6366f1" }}
                    />
                    <span className="text-xs font-bold truncate text-slate-800 dark:text-slate-100">
                      {teamA.name}
                    </span>
                    {carromWinner === "A" && (
                      <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 ml-auto" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setCarromWinner("B")}
                    className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex items-center justify-center gap-2 ${
                      carromWinner === "B"
                        ? "bg-white dark:bg-slate-700 border-orange-500 ring-2 ring-orange-400/30 shadow-xs"
                        : "bg-white/60 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                    }`}
                  >
                    <div
                      className="w-3.5 h-3.5 rounded-full"
                      style={{ backgroundColor: teamB.color || "#f97316" }}
                    />
                    <span className="text-xs font-bold truncate text-slate-800 dark:text-slate-100">
                      {teamB.name}
                    </span>
                    {carromWinner === "B" && (
                      <Check className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400 ml-auto" />
                    )}
                  </button>
                </div>
              </div>

              {/* Opponent Carrom Men Remaining */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    2. Opponent Men Remaining on Board (1 pt each)
                  </label>
                  <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
                    +{carromOpponentMen} {carromOpponentMen === 1 ? "pt" : "pts"}
                  </span>
                </div>
                <div className="grid grid-cols-9 gap-1 sm:gap-1.5">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((men) => (
                    <button
                      key={men}
                      type="button"
                      onClick={() => setCarromOpponentMen(men)}
                      className={`h-9 rounded-lg font-bold text-xs transition cursor-pointer ${
                        carromOpponentMen === men
                          ? "bg-indigo-600 text-white shadow-xs scale-105"
                          : "bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:border-indigo-300"
                      }`}
                    >
                      {men}
                    </button>
                  ))}
                </div>
              </div>

              {/* Queen Covered Toggle */}
              <div className="p-2.5 bg-white dark:bg-slate-700/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Queen Pocketed & Covered (+3 pts)
                      </span>
                      {canCoverQueen ? (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                          +3 pts
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                          Capped at 21
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {canCoverQueen
                        ? "Awarded to the winner if queen was covered before last piece."
                        : `ICF Rule: Winner pre-score is ${winnerPreScore} (>=21), so Queen earns 0 pts.`}
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
                  <input
                    type="checkbox"
                    disabled={!canCoverQueen}
                    checked={carromQueenCovered && canCoverQueen}
                    onChange={(e) => setCarromQueenCovered(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-500 peer-checked:bg-purple-600 peer-disabled:opacity-50"></div>
                </label>
              </div>

              {/* Total Board Points summary & Submit button */}
              <div className="pt-1">
                <button
                  type="button"
                  disabled={saving || isUnassigned}
                  onClick={handleCarromBoardFinish}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white shadow-md active:scale-[0.98] transition cursor-pointer disabled:opacity-50 flex items-center justify-between"
                >
                  <span className="flex items-center gap-1.5">
                    <span>👑 Complete {currentPeriodLabel}</span>
                  </span>
                  <span className="bg-white/20 px-2 py-0.5 rounded-lg text-[11px] font-extrabold tracking-wide">
                    Award +{carromBoardPoints} pts to {carromWinner === "A" ? teamA.name : teamB.name}
                  </span>
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleUndo}
                disabled={saving}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition disabled:opacity-50 cursor-pointer"
              >
                <Undo2 className="w-3.5 h-3.5" />
                Undo Last Event / Board
              </button>
            </div>
          </div>
        )}

        {/* Action buttons grid (Standard or Carrom Stroke mode) */}
        {!isCompleted && (!isCarrom || carromMode === "STROKE") && (
          <div className="px-4 pb-3">
            <div className="grid grid-cols-2 gap-3">
              {/* Team A column */}
              <div className="space-y-2">
                <p
                  className="text-xs font-bold uppercase tracking-wider text-center py-1 rounded-md"
                  style={{
                    color: teamA.color || "#6366f1",
                    backgroundColor: `${teamA.color || "#6366f1"}15`,
                  }}
                >
                  {teamA.name}
                </p>
                {eventTypes.map((evt) => (
                  <button
                    key={evt.eventType}
                    disabled={saving || isUnassigned}
                    onClick={() =>
                      handleScore(
                        teamA.id || 1,
                        evt.eventType,
                        evt.points,
                        selectedPlayerA
                      )
                    }
                    className={`w-full min-h-12 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-150 active:scale-[0.97] disabled:opacity-50 ${
                      COLOR_MAP[evt.color] || COLOR_MAP.green
                    }`}
                  >
                    {evt.label}
                    {evt.points > 0 && (
                      <span className="ml-1 opacity-80">+{evt.points}</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Team B column */}
              <div className="space-y-2">
                <p
                  className="text-xs font-bold uppercase tracking-wider text-center py-1 rounded-md"
                  style={{
                    color: teamB.color || "#f97316",
                    backgroundColor: `${teamB.color || "#f97316"}15`,
                  }}
                >
                  {teamB.name}
                </p>
                {eventTypes.map((evt) => (
                  <button
                    key={evt.eventType}
                    disabled={saving || isUnassigned}
                    onClick={() =>
                      handleScore(
                        teamB.id || 2,
                        evt.eventType,
                        evt.points,
                        selectedPlayerB
                      )
                    }
                    className={`w-full min-h-12 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-150 active:scale-[0.97] disabled:opacity-50 ${
                      COLOR_MAP[evt.color] || COLOR_MAP.green
                    }`}
                  >
                    {evt.label}
                    {evt.points > 0 && (
                      <span className="ml-1 opacity-80">+{evt.points}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Completed Match Post-to-Feed Banner */}
        {isCompleted && (
          <div className="px-4 pb-3">
            <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl p-3 flex items-center justify-between gap-3">
              <div className="text-xs">
                <span className="font-bold text-indigo-900 dark:text-indigo-200 block">Match Completed</span>
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">Publish official result card to Community Feed stream</span>
              </div>
              {hasPublishedResult ? (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white shadow-xs">
                  <Check className="w-3.5 h-3.5" /> Posted
                </span>
              ) : (
                <button
                  type="button"
                  disabled={publishingFeed}
                  onClick={handlePublishResultToFeed}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-xs cursor-pointer disabled:opacity-50"
                  title="Create an official result post in the Community Feed"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{publishingFeed ? "Posting..." : "Post Result to Feed"}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Undo + Complete Period row (Standard or Carrom Stroke mode) */}
        {!isCompleted && (!isCarrom || carromMode === "STROKE") && (
          <div className="px-4 pb-3 flex gap-2">
            <button
              onClick={handleUndo}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition disabled:opacity-50"
            >
              <Undo2 className="w-3.5 h-3.5" />
              Undo
            </button>
            <button
              onClick={handleCompletePeriod}
              disabled={saving}
              className="flex-1 px-3 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
            >
              {isSetBased(sportType)
                ? `End ${currentPeriodLabel}`
                : sportType === "BASKETBALL"
                ? `End ${currentPeriodLabel}`
                : `End ${currentPeriodLabel}`}
            </button>
          </div>
        )}

        {/* Recent events feed */}
        <div className="px-4 pb-4">
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Recent Events
          </h3>
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {state.recentEvents.length === 0 && (
              <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-3">
                No events yet
              </p>
            )}
            {sortedEvents.map((evt) => (
              <div
                key={evt.id}
                className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg"
              >
                <div
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor:
                      evt.teamId === teamA.id
                        ? teamA.color || "#6366f1"
                        : teamB.color || "#f97316",
                  }}
                />
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-200">
                    {evt.teamName}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 ml-1">
                    {evt.eventType.replace(/_/g, " ")}
                    {evt.playerName && ` - ${evt.playerName}`}
                    {evt.pointsAwarded > 0 && ` (+${evt.pointsAwarded})`}
                  </span>
                </div>
                {evt.matchMinute != null && (
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 flex-shrink-0">
                    {evt.matchMinute}'
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>


        {/* Close confirmation */}
        {showCloseConfirm && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-30 rounded-2xl">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-5 mx-4 max-w-sm shadow-xl">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1">
                Close scoring panel?
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Your scoring progress is saved. You can return anytime.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCloseConfirm(false)}
                  className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition"
                >
                  Stay
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 px-3 py-2 bg-red-500 text-white rounded-lg text-xs font-semibold hover:bg-red-600 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Emergency / Alternative Scoring Modal */}
        <EmergencyScoreModal
          isOpen={showEmergencyModal}
          onClose={() => setShowEmergencyModal(false)}
          matchId={matchId}
          configId={state?.scoringConfig?.id}
          sportType={sportType}
          teamAId={teamA.id}
          teamBId={teamB.id}
          teamAName={teamA.name}
          teamBName={teamB.name}
          currentScoreA={state?.scoreTeamA}
          currentScoreB={state?.scoreTeamB}
          currentPeriod={state?.currentPeriod}
          onSuccess={() => {
            fetchState();
            setShowEmergencyModal(false);
          }}
        />

        {/* Single Match Scoring Rules Configuration Modal */}
        {showRulesModal && (
          <MatchScoringRulesModal
            isOpen={showRulesModal}
            onClose={() => setShowRulesModal(false)}
            matchId={matchId}
            sportType={sportType}
            matchName={`${teamA?.name || "Team A"} vs ${teamB?.name || "Team B"}`}
            onSaved={(updatedConfig) => {
              setState((prev) => (prev ? { ...prev, scoringConfig: updatedConfig } : prev));
              fetchState();
            }}
          />
        )}
      </div>
    </div>
  );
}
