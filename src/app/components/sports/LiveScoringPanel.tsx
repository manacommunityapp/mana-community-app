import { useState, useEffect, useCallback } from "react";
import { X, Loader2, Undo2, ChevronDown, ChevronUp, Wifi, WifiOff, AlertTriangle, Scale, Zap, RefreshCw, Radio, CheckCircle2, Edit3, Share2, ArrowLeftRight, Smartphone, Trophy, Coffee, Sliders } from "lucide-react";
import { tournamentService, type LiveMatchStateData, type BallEventRequestData } from "../../../services/sports/tournamentService";
import { stompClient } from "../../../services/chat/stompClient";
import { ballColor, remainingBalls, requiredRunRate, vibrateScorer, getLegalBallsInCurrentOver, isFreeHitActive, formatMatchShareText, shareMatchScore, type HouseRulesConfig } from "./utils/cricketUtils";
import { toast } from "sonner";
import { SportsDisputeModal } from "./SportsDisputeModal";
import { EmergencyScoreModal } from "./EmergencyScoreModal";
import { MatchShareCardModal } from "./MatchShareCardModal";
import { InningsBreakDashboard } from "./InningsBreakDashboard";
import { HouseRulesModal } from "./HouseRulesModal";
import { TossSetupModal } from "./TossSetupModal";
import { ConfettiCanvas } from "./utils/ConfettiCanvas";
import { useCricketSounds } from "./utils/useCricketSounds";
import { useWakeLock } from "./hooks/useWakeLock";
import { formatRoundStageLabel } from "../../../utils/sportsStageUtils";

interface LiveScoringPanelProps {
  matchId: number;
  configId?: number;
  teamAName?: string;
  teamBName?: string;
  roundName?: string;
  tournamentName?: string;
  eventName?: string;
  onClose: () => void;
}

interface PlayerOption {
  id: number;
  name: string;
  teamId?: number;
}

export function LiveScoringPanel({ matchId, configId, teamAName, teamBName, roundName, tournamentName, eventName, onClose }: LiveScoringPanelProps) {
  const { isLocked: isWakeLocked } = useWakeLock(true);
  const [fastMode, setFastMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem("mc-scorer-fast-mode") === "1";
    } catch {
      return false;
    }
  });
  const [state, setState] = useState<LiveMatchStateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [players, setPlayers] = useState<PlayerOption[]>([]);

  const [inningsNumber, setInningsNumber] = useState(1);
  const [batsmanId, setBatsmanId] = useState<number>(0);
  const [nonStrikerId, setNonStrikerId] = useState<number>(0);
  const [bowlerId, setBowlerId] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [showWicketPanel, setShowWicketPanel] = useState(false);
  const [dismissalType, setDismissalType] = useState("BOWLED");
  const [dismissedPlayerId, setDismissedPlayerId] = useState<number>(0);
  const [fielderId, setFielderId] = useState<number>(0);
  const [wicketRuns, setWicketRuns] = useState<number>(0);
  const [showExtras, setShowExtras] = useState(false);
  const [extrasRuns, setExtrasRuns] = useState<number>(1);
  const [wsConnected, setWsConnected] = useState(() => stompClient.connected);
  const [showNewBatsman, setShowNewBatsman] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [showMatchActions, setShowMatchActions] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [completingMatch, setCompletingMatch] = useState(false);
  const [showTossModal, setShowTossModal] = useState(false);
  const [showShareCardModal, setShowShareCardModal] = useState(false);
  const [showInningsBreak, setShowInningsBreak] = useState(false);
  const [showResultDashboard, setShowResultDashboard] = useState(false);
  const { play: playSound } = useCricketSounds();
  const [tossWinnerSide, setTossWinnerSide] = useState<"A" | "B" | "">("");
  const [tossDecision, setTossDecision] = useState<"BAT" | "BOWL" | "">("");
  const [tossSaving, setTossSaving] = useState(false);
  const [isEditingToss, setIsEditingToss] = useState(false);

  const [showHouseRulesModal, setShowHouseRulesModal] = useState(false);
  const [houseRules, setHouseRules] = useState<HouseRulesConfig>(() => {
    try {
      const stored = localStorage.getItem(`mc-match-${matchId}-house-rules`);
      if (stored) return JSON.parse(stored);
    } catch {}
    return {
      enabled: true,
      noExtraRuns: false,
      noFreeHits: false,
      oversLimit: 20,
      ballsPerOver: 6,
    };
  });
  const houseRulesEnabled = houseRules.enabled !== false;

  const handleSaveHouseRules = async (newRules: HouseRulesConfig) => {
    setHouseRules(newRules);
    try {
      localStorage.setItem(`mc-match-${matchId}-house-rules`, JSON.stringify(newRules));
    } catch {}

    try {
      await tournamentService.updateMatchConfigOverride(matchId, JSON.stringify({
        oversPerInnings: newRules.oversLimit,
        maxOversPerBowler: newRules.maxOversPerBowler || Math.ceil((newRules.oversLimit || 20) / 5),
        ballsPerOver: newRules.ballsPerOver || 6,
        noExtraRuns: newRules.enabled !== false && newRules.noExtraRuns,
        noFreeHits: newRules.enabled !== false && newRules.noFreeHits,
      }));
      const updated = await tournamentService.getLiveMatchState(matchId);
      setState(updated);
    } catch (e: any) {
      throw e;
    }
  };

  const fetchState = useCallback(async () => {
    try {
      const s = await tournamentService.getLiveMatchState(matchId);
      setState(s);
      if (s?.status === "COMPLETED") {
        setShowResultDashboard(true);
      }
      setError(null);
      return s;
    } catch {
      setError("Failed to load match state");
      return null;
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    fetchState();

    setWsConnected(stompClient.connected);
    const unsubConnect = stompClient.onConnect(() => setWsConnected(true));
    const unsubDisconnect = stompClient.onDisconnect(() => setWsConnected(false));
    const unsub = stompClient.subscribe(`/topic/match/${matchId}/state`, (body) => {
      const s = body as LiveMatchStateData;
      setState(s);
      setWsConnected(true);
    });
    // subscribe() may find a shared socket that was already connected before this panel mounted.
    setWsConnected(stompClient.connected);

    loadPlayers();

    return () => {
      unsub();
      unsubConnect();
      unsubDisconnect();
    };
  }, [matchId, configId, fetchState]);

  useEffect(() => {
    if (!state) return;
    setInningsNumber(state.currentInnings);
    setBatsmanId(state.batsmanOnStrikeId ?? 0);
    setNonStrikerId(state.batsmanNonStrikeId ?? 0);
    setBowlerId(state.currentBowlerId ?? 0);
    setTossWinnerSide(state.tossWinnerTeamId === state.teamAId ? "A" : state.tossWinnerTeamId === state.teamBId ? "B" : "");
    setTossDecision(state.tossDecision?.toUpperCase() === "BAT" ? "BAT" : state.tossDecision?.toUpperCase() === "BOWL" ? "BOWL" : "");
  }, [state]);

  const canEditToss = Boolean(state
    && state.innings1.totalRuns === 0
    && state.innings1.totalWickets === 0
    && state.innings1.totalOvers === "0.0"
    && state.innings2.totalRuns === 0
    && state.innings2.totalWickets === 0
    && state.innings2.totalOvers === "0.0");

  const saveToss = async () => {
    const tossWinnerTeamId = tossWinnerSide === "A" ? state?.teamAId : tossWinnerSide === "B" ? state?.teamBId : undefined;
    if (!tossWinnerTeamId || !tossDecision) {
      toast.error("Select the toss-winning team and their decision.");
      return;
    }
    setTossSaving(true);
    try {
      await tournamentService.recordMatchToss(matchId, { tossWinnerTeamId, tossDecision });
      const updatedState = await tournamentService.getLiveMatchState(matchId);
      setState(updatedState);
      setIsEditingToss(false);
      // Reset batter and bowler selections when toss changes team roles
      setBatsmanId(0);
      setNonStrikerId(0);
      setBowlerId(0);
      const winnerName = tossWinnerSide === "A" ? (state?.teamAName || "Team A") : (state?.teamBName || "Team B");
      toast.success(`Toss saved: ${winnerName} chose to ${tossDecision.toLowerCase()} first!`);
    } catch (e: any) {
      toast.error(e?.message || "Failed to save toss details");
    } finally {
      setTossSaving(false);
    }
  };

  const loadPlayers = async () => {
    try {
      if (configId) {
        const teams = await tournamentService.getConfigTeams(configId);
        const playerList: PlayerOption[] = [];
        for (const team of teams) {
          if (team.players) {
            for (const p of team.players) {
              playerList.push({ id: p.id, name: p.playerName, teamId: team.id });
            }
          }
        }
        setPlayers(playerList);
        return;
      }

      // First try to resolve configId directly from match detail
      try {
        const detail = await tournamentService.getMatchDetail(matchId);
        const resolvedConfigId = (detail as any)?.configId;
        if (resolvedConfigId) {
          const teams = await tournamentService.getConfigTeams(resolvedConfigId);
          const playerList: PlayerOption[] = [];
          for (const team of teams) {
            if (team.players) {
              for (const p of team.players) {
                playerList.push({ id: p.id, name: p.playerName, teamId: team.id });
              }
            }
          }
          if (playerList.length > 0) {
            setPlayers(playerList);
            return;
          }
        }
      } catch {
        // Fallback to searching active configs below
      }

      const configs = await tournamentService.getConfigs();
      const activeConfigs = (configs || []).filter(c => {
        const st = String(c?.status || "").toUpperCase();
        return ["PUBLISHED", "ACTIVE", "LIVE", "IN_PROGRESS", "COMPLETED"].includes(st);
      });

      for (const cfg of activeConfigs) {
        const matches = await tournamentService.getMatchesByConfigId(cfg.id);
        const match = matches.find((m: any) => m.matchId === matchId);
        if (match) {
          const teams = await tournamentService.getConfigTeams(cfg.id);
          const playerList: PlayerOption[] = [];
          for (const team of teams) {
            if (team.players) {
              for (const p of team.players) {
                playerList.push({ id: p.id, name: p.playerName, teamId: team.id });
              }
            }
          }
          setPlayers(playerList);
          return;
        }
      }
    } catch {
      toast.error("Failed to load players");
    }
  };

  const toggleFastMode = () => {
    setFastMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("mc-scorer-fast-mode", next ? "1" : "0");
      } catch {}
      toast.info(next ? "Fast Mode enabled: One-tap scoring without mandatory player selection" : "Player Mode enabled: Tracking individual batsman and bowler stats");
      return next;
    });
  };

  const recordBall = useCallback(async (runsScored: number, opts?: {
    isBoundary?: boolean;
    isSix?: boolean;
    extrasType?: string;
    extrasRuns?: number;
    isWicket?: boolean;
    dismissalType?: string;
    dismissedPlayerId?: number;
    fielderId?: number;
  }) => {
    if (inningsNumber === 1 && state && !state.tossWinnerTeamId
      && state.innings1.totalOvers === "0.0"
      && state.innings1.totalRuns === 0
      && state.innings1.totalWickets === 0) {
      toast.error("Record the toss before scoring the first ball.");
      return;
    }

    const currentInn = state ? (inningsNumber === 1 ? state.innings1 : state.innings2) : null;
    const curBattingTeamId = currentInn?.battingTeamId;
    const curBowlingTeamId = state && curBattingTeamId === state.teamAId ? state.teamBId : state?.teamAId;
    const curBattingPlayers = players.filter(p => !curBattingTeamId || p.teamId === curBattingTeamId);
    const curBowlingPlayers = players.filter(p => !curBowlingTeamId || p.teamId === curBowlingTeamId);

    let effectiveBatsmanId = batsmanId;
    let effectiveNonStrikerId = nonStrikerId;
    let effectiveBowlerId = bowlerId;

    if (fastMode) {
      if (!effectiveBatsmanId && curBattingPlayers.length > 0) {
        effectiveBatsmanId = curBattingPlayers[0].id;
      }
      if (!effectiveNonStrikerId && curBattingPlayers.length > 1) {
        effectiveNonStrikerId = curBattingPlayers[1].id;
      }
      if (!effectiveBowlerId && curBowlingPlayers.length > 0) {
        effectiveBowlerId = curBowlingPlayers[0].id;
      }
    }

    if (!fastMode && curBattingPlayers.length > 0 && (!effectiveBatsmanId || !effectiveBowlerId)) {
      toast.error("Select both batsman and bowler first");
      return;
    }
    setSaving(true);
    try {
      const reqExtrasRuns = opts?.extrasRuns !== undefined
        ? opts.extrasRuns
        : opts?.extrasType
          ? (houseRulesEnabled && houseRules.noExtraRuns ? 0 : 1)
          : undefined;

      const req: BallEventRequestData = {
        matchId,
        inningsNumber,
        batsmanId: effectiveBatsmanId || 0,
        nonStrikerId: effectiveNonStrikerId || undefined,
        bowlerId: effectiveBowlerId || 0,
        runsScored,
        isBoundary: opts?.isBoundary,
        isSix: opts?.isSix,
        extrasType: opts?.extrasType,
        extrasRuns: reqExtrasRuns,
        isWicket: opts?.isWicket,
        dismissalType: opts?.dismissalType,
        dismissedPlayerId: opts?.dismissedPlayerId,
        fielderId: opts?.fielderId,
        commandId: crypto.randomUUID(),
      };

      // Optimistic runs / wickets visual increment for scorer
      if (state) {
        const innKey = inningsNumber === 1 ? "innings1" : "innings2";
        const addRuns = runsScored + (reqExtrasRuns || 0);
        const addWickets = opts?.isWicket ? 1 : 0;
        setState((prev) => {
          if (!prev) return prev;
          const prevInn = prev[innKey];
          return {
            ...prev,
            [innKey]: {
              ...prevInn,
              totalRuns: (prevInn?.totalRuns || 0) + addRuns,
              totalWickets: (prevInn?.totalWickets || 0) + addWickets,
            },
          };
        });
      }

      if (wsConnected) {
        stompClient.publish(`/app/match/${matchId}/ball`, req);
      } else {
        await tournamentService.recordBall(matchId, req);
        const s = await tournamentService.getLiveMatchState(matchId);
        setState(s);
      }

      // Audio & Haptic vibration feedback
      if (opts?.isWicket) {
        playSound("wicket");
        vibrateScorer("wicket");
      } else if (runsScored === 6) {
        playSound("six");
        vibrateScorer("boundary");
      } else if (runsScored === 4) {
        playSound("four");
        vibrateScorer("boundary");
      } else if (opts?.extrasType) {
        vibrateScorer("extra");
      } else if (runsScored === 0) {
        playSound("dot");
        vibrateScorer("dot");
      } else {
        playSound("run");
        vibrateScorer("run");
      }

      // End of over chime detection & auto innings finish
      let isOverCompleted = false;
      if (currentInn) {
        const currentLegalBalls = getLegalBallsInCurrentOver(currentInn.totalOvers);
        const ballsPerOver = state?.ballsPerOver || houseRules.ballsPerOver || 6;
        const isLegal = !opts?.extrasType || (opts.extrasType !== "WIDE" && opts.extrasType !== "NO_BALL");
        isOverCompleted = Boolean(isLegal && currentLegalBalls + 1 >= ballsPerOver);

        if (isOverCompleted) {
          setTimeout(() => playSound("over"), 350);
          const nextOverNum = parseInt(currentInn.totalOvers.split('.')[0] || '0', 10) + 1;
          const matchMaxOvers = state?.oversLimit || houseRules.oversLimit || 20;

          if (inningsNumber === 1 && nextOverNum >= matchMaxOvers) {
            toast.success(`Innings 1 Complete! (${nextOverNum} overs bowled)`);
            setTimeout(() => setShowInningsBreak(true), 600);
          } else {
            toast.success(`Over Complete! (${nextOverNum}) - Select new bowler`, {
              duration: 2500,
            });
            // Reset active bowler to prompt new bowler selection for the next over
            setBowlerId(0);
          }
        }
      }

      // If all wickets fall in Innings 1, auto-trigger innings break
      if (inningsNumber === 1 && opts?.isWicket && currentInn && (currentInn.totalWickets + 1 >= 10)) {
        setTimeout(() => setShowInningsBreak(true), 800);
      }

      // Striker rotation:
      // Odd runs on normal ball OR odd Byes/Leg-Byes/No-ball runs swap ends.
      // Changing ends on over completion also swaps ends.
      const isOddRunRally =
        (!opts?.extrasType && runsScored % 2 === 1) ||
        ((opts?.extrasType === "BYE" || opts?.extrasType === "LEG_BYE") && (opts?.extrasRuns || 0) % 2 === 1) ||
        (opts?.extrasType === "NO_BALL" && runsScored % 2 === 1);

      const shouldSwapStriker = (isOddRunRally && !isOverCompleted) || (!isOddRunRally && isOverCompleted);

      if (shouldSwapStriker) {
        const temp = batsmanId;
        setBatsmanId(nonStrikerId);
        setNonStrikerId(temp);
      }

      if (opts?.isWicket) {
        setShowNewBatsman(true);
        setDismissedPlayerId(0);
        setFielderId(0);
        setWicketRuns(0);
      }

      setShowWicketPanel(false);
      setShowExtras(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to record ball");
    } finally {
      setSaving(false);
    }
  }, [matchId, inningsNumber, batsmanId, nonStrikerId, bowlerId, wsConnected, state, fastMode, players, playSound]);

  const handleUndo = async () => {
    setSaving(true);
    try {
      if (wsConnected) {
        stompClient.publish(`/app/match/${matchId}/undo`, { inningsNumber });
      } else {
        await tournamentService.undoLastBall(matchId, inningsNumber);
        const s = await tournamentService.getLiveMatchState(matchId);
        setState(s);
      }
      toast.success("Last ball undone");
    } catch (err: any) {
      toast.error(err?.message || "Failed to undo");
    } finally {
      setSaving(false);
    }
  };

  const getTeamInnings = (teamId: number | undefined, teamName: string) => {
    if (!state) return undefined;
    const innings = [state.innings1, state.innings2];
    const byId = teamId != null ? innings.find(item => Number(item.battingTeamId) === Number(teamId)) : undefined;
    if (byId) return byId;
    const normalizedName = teamName.trim().toLowerCase();
    return innings.find(item => item.battingTeamName?.trim().toLowerCase() === normalizedName);
  };

  const inningsA = getTeamInnings(state?.teamAId, state?.teamAName || teamAName || "Team A");
  const inningsB = getTeamInnings(state?.teamBId, state?.teamBName || teamBName || "Team B");
  const scoreA = inningsA ? `${inningsA.totalRuns}/${inningsA.totalWickets} (${inningsA.totalOvers} ov)` : "0/0 (0.0 ov)";
  const scoreB = inningsB ? `${inningsB.totalRuns}/${inningsB.totalWickets} (${inningsB.totalOvers} ov)` : "0/0 (0.0 ov)";
  const runsA = inningsA?.totalRuns ?? 0;
  const runsB = inningsB?.totalRuns ?? 0;
  const winnerName = runsA === runsB ? "Tie" : runsA > runsB ? (state?.teamAName || teamAName || "Team A") : (state?.teamBName || teamBName || "Team B");

  const handleShare = () => {
    if (!state) return;
    setShowShareCardModal(true);
  };

  const handleSwapSides = async () => {
    if (!state) return;
    const currentWinnerSide = tossWinnerSide || (state.tossWinnerTeamId === state.teamAId ? "A" : "B");
    const nextWinnerSide = currentWinnerSide === "A" ? "B" : "A";
    const nextWinnerId = nextWinnerSide === "A" ? state.teamAId : state.teamBId;
    const currentDecision = (tossDecision || state.tossDecision || "BAT") as "BAT" | "BOWL";
    if (!nextWinnerId) {
      toast.error("Both teams must be present to swap sides.");
      return;
    }

    setTossSaving(true);
    try {
      await tournamentService.recordMatchToss(matchId, {
        tossWinnerTeamId: nextWinnerId,
        tossDecision: currentDecision,
      });
      const updated = await tournamentService.getLiveMatchState(matchId);
      setState(updated);
      setTossWinnerSide(nextWinnerSide);
      setTossDecision(currentDecision);
      setBatsmanId(0);
      setNonStrikerId(0);
      setBowlerId(0);
      const newBattingTeamName = nextWinnerSide === "A" ? (state.teamAName || "Team A") : (state.teamBName || "Team B");
      toast.success(`Swapped sides! ${newBattingTeamName} is now batting first.`);
    } catch (e: any) {
      toast.error(e?.message || "Failed to swap sides");
    } finally {
      setTossSaving(false);
    }
  };

  const declareMatchCompleted = async () => {
    if (!state || !inningsA || !inningsB) {
      toast.error("Both innings need to be recorded before declaring a winner. For rain or no-result outcomes, use Match Actions.");
      return;
    }
    const inningsStarted = (innings: typeof state.innings1) =>
      innings.totalRuns > 0 || innings.totalWickets > 0 || innings.totalOvers !== "0.0";
    if (!inningsStarted(inningsA) || !inningsStarted(inningsB)) {
      toast.error("Both innings need scoring data before the match can be completed.");
      return;
    }

    const resultType = runsA === runsB ? "TIE" : "WIN";
    const winnerTeamId = runsA === runsB ? null : runsA > runsB ? state.teamAId : state.teamBId;
    if (resultType === "WIN" && winnerTeamId == null) {
      toast.error("Winner team details are missing. Use Match Actions to enter the final result.");
      return;
    }

    setCompletingMatch(true);
    try {
      const result = {
        matchId,
        winnerTeamId,
        resultType,
        scoreTeamA: scoreA,
        scoreTeamB: scoreB,
        tossWinnerTeamId: state.tossWinnerTeamId,
        tossDecision: state.tossDecision,
        matchNotes: "Match declared completed from the live cricket scorer.",
        matchSummary: `${state.teamAName || teamAName || "Team A"} ${scoreA}; ${state.teamBName || teamBName || "Team B"} ${scoreB}`,
      };

      try {
        await tournamentService.recordDetailedResult(result);
      } catch {
        await tournamentService.recordResult({
          ...result,
          winnerName: resultType === "WIN" ? winnerName : undefined,
          winnerSide: resultType === "WIN" ? (runsA > runsB ? "A" : "B") : undefined,
        });
      }
      if (stompClient.connected) {
        stompClient.publish("/topic/sports/live", { type: "REFRESH" });
      }
      toast.success(resultType === "TIE" ? "Match declared complete as a tie." : `${winnerName} declared the winner.`);
      setShowCompleteConfirm(false);
      setShowResultDashboard(true);
      playSound("win");
      try {
        const updated = await tournamentService.getLiveMatchState(matchId);
        setState(updated ? { ...updated, status: "COMPLETED" } : null);
      } catch {}
    } catch (err: any) {
      toast.error(err?.message || "Could not declare the match completed.");
    } finally {
      setCompletingMatch(false);
    }
  };

  const handleFixCompletedMatchError = async () => {
    setSaving(true);
    try {
      await tournamentService.undoLastBall(matchId, inningsNumber);
      const s = await tournamentService.getLiveMatchState(matchId);
      setState(s ? { ...s, status: "IN_PROGRESS" } : null);
      setShowResultDashboard(false);
      toast.success("Final delivery undone. Match reopened for corrections.");
    } catch (err: any) {
      toast.error(err?.message || "Failed to reopen and undo delivery");
    } finally {
      setSaving(false);
    }
  };

  const handleFixInnings1Error = async () => {
    setSaving(true);
    try {
      await tournamentService.undoLastBall(matchId, 1);
      const s = await tournamentService.getLiveMatchState(matchId);
      setState(s);
      setInningsNumber(1);
      setShowInningsBreak(false);
      toast.success("Last delivery of 1st innings undone. Resumed 1st innings scoring.");
    } catch (err: any) {
      toast.error(err?.message || "Failed to undo 1st innings delivery");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (saving) return;
    setShowCloseConfirm(true);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm text-center border border-slate-100" onClick={e => e.stopPropagation()}>
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-sm text-slate-800 font-bold mb-1">Cricket Scoring Issue Detected</h3>
          <p className="text-xs text-slate-500 mb-4 leading-relaxed">
            {error}
          </p>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                setError(null);
                setLoading(true);
                fetchState().finally(() => setLoading(false));
              }}
              className="w-full px-4 py-2 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-xl text-xs font-semibold hover:bg-indigo-100 transition inline-flex items-center justify-center gap-1.5 cursor-pointer"
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
              className="w-full px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

        <EmergencyScoreModal
          isOpen={showEmergencyModal}
          onClose={() => setShowEmergencyModal(false)}
          matchId={matchId}
          configId={configId}
          sportType="CRICKET"
          teamAId={undefined}
          teamBId={undefined}
          teamAName={teamAName || "Team A"}
          teamBName={teamBName || "Team B"}
          currentScoreA={undefined}
          currentScoreB={undefined}
          currentPeriod={inningsNumber}
          onSuccess={() => {
            fetchState();
            onClose();
          }}
        />
      </div>
    );
  }

  const inn = state ? (inningsNumber === 1 ? state.innings1 : state.innings2) : null;
  const battingTeamFallback = inn?.battingTeamId != null && state
    ? inn.battingTeamId === state.teamAId
      ? state.teamAName || teamAName || "Team A"
      : state.teamBName || teamBName || "Team B"
    : "Batting team";
  const ballsRemaining = state && inn ? remainingBalls(inn.totalOvers, state.oversLimit || 20) : 0;
  const runsNeeded = state?.target != null && inn && inningsNumber === 2
    ? Math.max(0, state.target - inn.totalRuns)
    : null;
  const requiredRate = state?.target != null && inn && inningsNumber === 2
    ? requiredRunRate(state.target, inn.totalRuns, inn.totalOvers, state.oversLimit || 20)
    : null;
  const battingTeamPlayers = players.filter(p => {
    if (!state) return true;
    const battingTeamId = inn?.battingTeamId;
    return p.teamId === battingTeamId;
  });
  const bowlingTeamPlayers = players.filter(p => {
    if (!state) return true;
    const bowlingTeamId = inn?.battingTeamId === state.teamAId ? state.teamBId : state.teamAId;
    return p.teamId === bowlingTeamId;
  });

  const availableBatsmen = battingTeamPlayers.filter(p => {
    if (!inn) return true;
    const dismissed = inn.batters.filter(b => b.isOut).map(b => b.playerId);
    return !dismissed.includes(p.id) && p.id !== batsmanId;
  });

  const targetRuns = (state?.innings1?.totalRuns ?? 0) + 1;
  const isTargetAchieved = Boolean(
    inningsNumber === 2 &&
    state &&
    (state.innings1?.totalRuns ?? 0) > 0 &&
    (state.innings2?.totalRuns ?? 0) >= targetRuns
  );
  const isScoringDisabled = saving || isTargetAchieved || (!fastMode && battingTeamPlayers.length > 0 && (!batsmanId || !bowlerId));
  const scorerTeamAName = state?.teamAName || teamAName || "Team A";
  const scorerTeamBName = state?.teamBName || teamBName || "Team B";

  const tossWinnerTeamName = state?.tossWinnerTeamId
    ? state.tossWinnerTeamId === state.teamAId
      ? scorerTeamAName
      : scorerTeamBName
    : null;

  const bowlingTeamName = state
    ? inn?.battingTeamId === state.teamAId
      ? scorerTeamBName
      : scorerTeamAName
    : "Opponent";

  const battingTeamColor = state
    ? inn?.battingTeamId === state.teamAId
      ? state.teamAColor || "#6366f1"
      : state.teamBColor || "#ec4899"
    : "#6366f1";

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-center overflow-hidden bg-black/60 backdrop-blur-sm sm:items-center sm:p-4" onClick={handleClose}>
      <div
        className="h-[100dvh] min-h-0 max-h-[100dvh] w-full overflow-y-auto overscroll-contain bg-white shadow-2xl sm:h-auto sm:max-h-[92dvh] sm:max-w-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ paddingTop: "max(1rem, env(safe-area-inset-top, 0px))" }} className="sticky top-0 z-10 flex min-h-[4.5rem] items-center gap-2 bg-gradient-to-r from-indigo-700 via-indigo-700 to-violet-700 px-3 pb-2.5 shadow-md shadow-indigo-950/15 sm:min-h-0 sm:gap-3 sm:rounded-t-2xl sm:px-5 sm:py-3.5">
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-indigo-50 shadow-inner">
              <Radio className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-center gap-2 flex-wrap">
                <span className="truncate text-[9px] font-extrabold uppercase tracking-[0.14em] text-indigo-100/80 sm:text-[10px]">
                  {[tournamentName || state?.tournamentName, eventName || state?.eventName, "Live Scorer"].filter(Boolean).join(" · ")}
                </span>
                {(roundName || state?.roundName) && (
                  <span className="inline-flex shrink-0 items-center rounded-full border border-amber-300/35 bg-amber-400/20 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-amber-100">
                    {formatRoundStageLabel(roundName || state?.roundName)}
                  </span>
                )}
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-rose-300/30 bg-rose-500/20 px-1.5 py-0.5 text-[9px] font-black tracking-wider text-rose-100">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-300 animate-pulse" /> LIVE
                </span>
              </div>
              <p className="m-0 mt-0.5 truncate text-[11px] font-bold leading-tight text-white sm:text-sm">
                {scorerTeamAName}<span className="mx-1.5 text-indigo-200/70">vs</span>{scorerTeamBName}
              </p>
            </div>
            <span
              title={wsConnected ? "Live connection connected" : "Live connection disconnected"}
              className={`inline-flex h-7 shrink-0 items-center justify-center gap-1 rounded-full border px-2 ${
                wsConnected ? "border-emerald-300/25 bg-emerald-400/10 text-emerald-100" : "border-amber-300/25 bg-amber-400/10 text-amber-100"
              }`}
            >
              {wsConnected ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
              <span className="hidden text-[9px] font-bold sm:inline">{wsConnected ? "Connected" : "Offline"}</span>
            </span>
            {isWakeLocked && (
              <span
                className="hidden sm:inline-flex h-7 shrink-0 items-center justify-center gap-1 rounded-full border border-emerald-300/25 bg-emerald-400/10 px-2 text-[9px] font-bold text-emerald-100"
                title="Screen wake lock is active (display won't sleep outdoors)"
              >
                <Smartphone className="h-3 w-3" />
                <span>Awake</span>
              </span>
            )}
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex h-7 shrink-0 items-center justify-center gap-1 rounded-full border border-white/20 bg-white/10 px-2.5 text-[10px] font-bold text-white hover:bg-white/20 transition active:scale-95 cursor-pointer shadow-xs"
              title="Share live scorecard via WhatsApp or clipboard"
            >
              <Share2 className="h-3 w-3" />
              <span className="hidden sm:inline">Share</span>
            </button>
            <button
              type="button"
              onClick={() => setShowHouseRulesModal(true)}
              className={`inline-flex h-7 shrink-0 items-center justify-center gap-1 rounded-full border px-2.5 text-[10px] font-bold transition active:scale-95 cursor-pointer shadow-xs ${
                (houseRulesEnabled && (houseRules.noExtraRuns || houseRules.noFreeHits || (houseRules.ballsPerOver && houseRules.ballsPerOver !== 6)))
                  ? "border-amber-400/50 bg-amber-500/20 text-amber-200"
                  : "border-white/20 bg-white/10 text-white hover:bg-white/20"
              }`}
              title="Configure Gully & Box Cricket House Rules"
            >
              <Sliders className="h-3 w-3 text-amber-300" />
              <span>Rules</span>
            </button>
          </div>
          <button onClick={handleClose} aria-label="Close live scorer" className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/80 transition hover:bg-white/10 hover:text-white">
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>

        {/* Toss Section */}
        {state && canEditToss && (
          !state.tossWinnerTeamId || isEditingToss ? (
            <div className="mx-3 mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 sm:mx-5 sm:px-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <img
                    src="/coin-tails.png"
                    alt="Coin"
                    className="w-5 h-5 rounded-full object-cover shrink-0 shadow-xs ring-1 ring-amber-400"
                  />
                  <div>
                    <p className="m-0 text-xs font-bold text-amber-900">Cricket Toss Setup</p>
                    <p className="m-0 mt-0.5 text-[10px] text-amber-800/80">Save before recording the first ball.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowTossModal(true)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-amber-900 bg-amber-200/90 hover:bg-amber-300 rounded-lg transition shadow-xs cursor-pointer border border-amber-300"
                    title="Launch interactive 3D coin toss"
                  >
                    <span>🪙 Flip 3D Coin</span>
                  </button>
                  {state.tossWinnerTeamId && (
                    <button
                      type="button"
                      onClick={() => setIsEditingToss(false)}
                      className="text-[10px] font-semibold text-amber-800 hover:text-amber-950 underline cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-[1fr_1fr_auto_auto] items-end gap-2">
                <label className="min-w-0 text-[10px] font-semibold text-slate-600">
                  Toss won by
                  <select
                    value={tossWinnerSide}
                    onChange={(e) => setTossWinnerSide(e.target.value as "A" | "B" | "")}
                    className="mt-1 w-full rounded-lg border border-amber-200 bg-white px-2 py-2 text-xs text-slate-800 outline-none focus:border-amber-500"
                  >
                    <option value="">Select team</option>
                    <option value="A">{state.teamAName}</option>
                    <option value="B">{state.teamBName}</option>
                  </select>
                </label>
                <label className="min-w-0 text-[10px] font-semibold text-slate-600">
                  Chose to
                  <select
                    value={tossDecision}
                    onChange={(e) => setTossDecision(e.target.value as "BAT" | "BOWL" | "")}
                    className="mt-1 w-full rounded-lg border border-amber-200 bg-white px-2 py-2 text-xs text-slate-800 outline-none focus:border-amber-500"
                  >
                    <option value="">Select decision</option>
                    <option value="BAT">Bat first</option>
                    <option value="BOWL">Bowl first</option>
                  </select>
                </label>
                <button
                  type="button"
                  onClick={handleSwapSides}
                  disabled={tossSaving}
                  className="rounded-lg bg-indigo-50 border border-indigo-200 px-2.5 py-2 text-xs font-bold text-indigo-700 transition hover:bg-indigo-100 disabled:opacity-50 cursor-pointer shadow-xs flex items-center gap-1 shrink-0"
                  title="Swap batting/bowling sides"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Swap</span>
                </button>
                <button
                  type="button"
                  onClick={saveToss}
                  disabled={tossSaving || !tossWinnerSide || !tossDecision}
                  className="rounded-lg bg-amber-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer shadow-xs shrink-0"
                >
                  {tossSaving ? "Saving..." : state.tossWinnerTeamId ? "Update" : "Save toss"}
                </button>
              </div>
            </div>
          ) : (
            <div className="mx-3 mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 sm:mx-5 sm:px-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src="/coin-tails.png"
                  alt="Toss Coin"
                  className="w-7 h-7 rounded-full object-cover shrink-0 shadow-xs ring-1 ring-emerald-400"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-emerald-950 truncate">
                    {tossWinnerTeamName} won the toss
                  </p>
                  <p className="text-[11px] text-emerald-800">
                    Chose to <strong className="font-bold uppercase tracking-wider">{state.tossDecision === "BOWL" ? "bowl" : "bat"}</strong> first
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowTossModal(true)}
                  className="px-2 py-1 text-[11px] font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-lg transition shadow-xs cursor-pointer flex items-center gap-1"
                  title="Launch 3D coin toss"
                >
                  <span>🪙 Re-Toss</span>
                </button>
                <button
                  type="button"
                  onClick={handleSwapSides}
                  disabled={tossSaving}
                  className="px-2 py-1 text-[11px] font-bold text-indigo-700 bg-white border border-indigo-200 hover:bg-indigo-50 rounded-lg transition shadow-xs cursor-pointer flex items-center gap-1"
                  title="Swap which team is batting vs bowling first"
                >
                  <ArrowLeftRight className="w-3 h-3" />
                  <span className="hidden sm:inline">Swap Sides</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingToss(true)}
                  className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-white border border-emerald-300 hover:bg-emerald-100/60 rounded-lg transition shadow-xs cursor-pointer flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Change Toss</span>
                </button>
              </div>
            </div>
          )
        )}
        {state && !canEditToss && state.tossWinnerTeamId && (
          <div className="mx-3 mt-3 rounded-lg border border-amber-100 bg-amber-50/70 px-3 py-2 text-xs text-amber-900 sm:mx-5 flex items-center gap-2">
            <img
              src="/coin-tails.png"
              alt="Coin"
              className="w-4 h-4 rounded-full object-cover shrink-0 shadow-xs"
            />
            <span>
              <span className="font-bold">Toss:</span> {tossWinnerTeamName} won the toss and chose to{" "}
              {state.tossDecision?.toUpperCase() === "BOWL" ? "bowl" : "bat"} first
            </span>
          </div>
        )}

        {/* Mini Scoreboard */}
        {state && inn && (
          <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-4 py-4 sm:px-6 sm:py-5 text-white border-b border-slate-800">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-400/30">
                    Innings {inningsNumber}
                  </span>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                      style={{ backgroundColor: battingTeamColor }}
                    />
                    <span className="text-xs font-bold text-white truncate">
                      {inn.battingTeamName || battingTeamFallback}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      (Batting)
                    </span>
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-4xl sm:text-5xl font-black tracking-tight">{inn.totalRuns}</span>
                  <span className="font-mono text-3xl font-bold text-rose-400">/</span>
                  <span className="font-mono text-4xl sm:text-5xl font-black text-rose-300">{inn.totalWickets}</span>
                </div>
                <div className="mt-1 text-[11px] font-semibold text-amber-300">
                  Overs {inn.totalOvers}{state.oversLimit ? ` / ${state.oversLimit}` : ""}
                </div>
              </div>
              <div className="shrink-0 text-right space-y-1">
                <div className="text-[10px] uppercase tracking-wider text-slate-400">Current Run Rate</div>
                <div className="font-mono text-lg font-black text-emerald-300">{inn.runRate}</div>
                {state.maxOversPerBowler && (
                  <div className="text-[10px] text-slate-400">Max {state.maxOversPerBowler} ov / bowler</div>
                )}
              </div>
            </div>

            {/* Toss & Match State Banner inside the Scoreboard Div */}
            <div className="mt-3.5 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-400/15 text-amber-300 border border-amber-400/30">
                  <img
                    src="/coin-tails.png"
                    alt="Toss"
                    className="w-3.5 h-3.5 rounded-full object-cover shrink-0"
                  />
                  <span>Toss</span>
                </span>
                {state.tossWinnerTeamId ? (
                  <span className="text-xs text-slate-200 truncate">
                    <strong className="text-white font-bold">{tossWinnerTeamName}</strong> won the toss and chose to{" "}
                    <strong className="text-amber-300 font-bold uppercase">{state.tossDecision === "BOWL" ? "bowl" : "bat"}</strong> first
                  </span>
                ) : (
                  <span className="text-xs text-amber-300/90 italic">
                    Toss pending • Select toss winner above
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5 shrink-0">
                <span>Fielding / Bowling:</span>
                <span className="font-bold text-white bg-white/10 px-2 py-0.5 rounded border border-white/10">
                  {bowlingTeamName}
                </span>
              </div>
            </div>

            {runsNeeded !== null && (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-2">
                <div className="text-xs font-bold text-amber-200">
                  Target {state.target} · Need {runsNeeded} runs in {ballsRemaining} balls
                </div>
                <div className="text-[10px] font-semibold text-slate-300">
                  Required rate <span className="font-mono font-black text-emerald-300">{requiredRate}</span>
                </div>
              </div>
            )}
          </div>
        )}



        {/* Pre-Match / In-Match Format & House Rules Bar */}
        {state && (
          <div className="bg-slate-900/90 border-b border-slate-700/60 px-3 py-1.5 sm:px-5 sm:py-2 text-xs text-slate-300 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Format:</span>
              <span className="font-semibold text-slate-200">{state.oversLimit || houseRules.oversLimit || 20} Ov</span>
              <span className="text-slate-500">•</span>
              <span className="font-semibold text-slate-200">{state.ballsPerOver || houseRules.ballsPerOver || 6} Balls/Ov</span>
              <span className="text-slate-500">•</span>
              <span>Max {state.maxOversPerBowler || houseRules.maxOversPerBowler || Math.ceil((state.oversLimit || 20) / 5)} ov/bowler</span>
              {houseRulesEnabled && houseRules.noExtraRuns && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  No Extras Runs
                </span>
              )}
              {houseRulesEnabled && houseRules.noFreeHits && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  No Free Hit
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowHouseRulesModal(true)}
              className="text-[10px] font-bold text-amber-300 hover:text-white underline underline-offset-2 transition cursor-pointer flex items-center gap-1"
            >
              <Sliders className="w-3 h-3 text-amber-400" />
              <span>House Rules & Overs</span>
            </button>
          </div>
        )}

        {/* Over Progress Timeline & Free Hit Badge */}
        {inn && (() => {
          const legalBallsInOver = getLegalBallsInCurrentOver(inn.totalOvers);
          const ballsPerOver = state?.ballsPerOver || houseRules.ballsPerOver || 6;
          const emptySlots = Math.max(0, ballsPerOver - legalBallsInOver);
          const freeHit = isFreeHitActive(inn.thisOver, state?.recentBalls, houseRulesEnabled && houseRules.noFreeHits);
          const currentOverNum = parseInt(inn.totalOvers.split(".")[0] || "0", 10) + 1;
          return (
            <div className="px-3 py-2 sm:px-5 sm:py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mr-1 flex items-center gap-1">
                  <span>Over {currentOverNum}:</span>
                  <span className="text-slate-500 font-mono text-[9px]">({legalBallsInOver}/{ballsPerOver})</span>
                </span>
                {inn.thisOver.map((ball, i) => (
                  <span key={i} className={`w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full text-[10px] font-black border border-white/10 transition-transform active:scale-95 ${ballColor(ball)}`}>
                    {ball}
                  </span>
                ))}
                {Array.from({ length: emptySlots }).map((_, idx) => (
                  <span key={`empty-${idx}`} className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full text-[10px] font-bold border border-dashed border-slate-700 bg-slate-900/60 text-slate-500" title={`Legal ball ${legalBallsInOver + idx + 1} remaining in over`}>
                    {legalBallsInOver + idx + 1}
                  </span>
                ))}
              </div>
              {freeHit && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-sm shadow-amber-500/20 animate-pulse border border-amber-300/40">
                  ⚡ FREE HIT
                </span>
              )}
            </div>
          );
        })()}

        <div style={{ paddingBottom: "max(0.625rem, env(safe-area-inset-bottom))" }} className="p-2.5 sm:p-5 space-y-2.5 sm:space-y-4">
          {/* WS Disconnected Banner */}
          {!wsConnected && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <WifiOff className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="text-[10px] text-amber-700 font-medium">Live updates disconnected. Scores still save through REST; live sync will resume after reconnect.</span>
            </div>
          )}

          {/* Innings Selector & Fast Mode Toggle */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-[10px] text-slate-500 font-semibold">Innings:</span>
              {[1, 2].map((n) => (
                <button
                  key={n}
                  onClick={() => {
                    setInningsNumber(n);
                    setShowInningsBreak(false);
                    setShowResultDashboard(false);
                  }}
                  className={`px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs font-semibold rounded-lg transition active:scale-[0.96] ${
                    inningsNumber === n && !showInningsBreak && !showResultDashboard
                      ? "bg-indigo-100 text-indigo-700 font-bold"
                      : "text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setShowInningsBreak(!showInningsBreak);
                  setShowResultDashboard(false);
                }}
                className={`flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs font-semibold rounded-lg transition active:scale-[0.96] ${
                  showInningsBreak ? "bg-amber-100 text-amber-800 font-bold border border-amber-300" : "text-slate-500 hover:bg-slate-100"
                }`}
                title="View Innings Break split-screen equation dashboard"
              >
                <Coffee className="w-3.5 h-3.5 text-amber-600" />
                <span>Break</span>
              </button>
              {state?.status === "COMPLETED" && (
                <button
                  type="button"
                  onClick={() => {
                    setShowResultDashboard(true);
                    setShowInningsBreak(false);
                  }}
                  className={`flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs font-semibold rounded-lg transition active:scale-[0.96] ${
                    showResultDashboard ? "bg-emerald-100 text-emerald-800 font-bold border border-emerald-300" : "text-slate-500 hover:bg-slate-100"
                  }`}
                  title="View Match Result & Celebration Dashboard"
                >
                  <Trophy className="w-3.5 h-3.5 text-amber-500" />
                  <span>Result</span>
                </button>
              )}
            </div>

            {/* Fast Mode Toggle */}
            <button
              type="button"
              onClick={toggleFastMode}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition active:scale-95 border ${
                fastMode
                  ? "bg-amber-500/10 text-amber-700 border-amber-300 hover:bg-amber-500/20"
                  : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
              }`}
              title={fastMode ? "Switch to Detailed Player Stats Mode" : "Switch to 1-Tap Fast Scoring Mode (Gully/Casual)"}
            >
              <Zap className={`w-3.5 h-3.5 ${fastMode ? "text-amber-600 fill-amber-500" : "text-slate-400"}`} />
              <span>{fastMode ? "⚡ Fast Mode (1-Tap)" : "Player Mode"}</span>
            </button>
          </div>

          {showResultDashboard && state ? (
            <div className="relative rounded-2xl sm:rounded-3xl bg-slate-900 border border-slate-800 p-4 sm:p-6 text-white space-y-5 overflow-hidden shadow-2xl">
              {/* Confetti Physics Burst */}
              <ConfettiCanvas primaryColor={runsA >= runsB ? state.teamAColor || "#10b981" : state.teamBColor || "#6366f1"} />

              {/* Trophy & Victory Announcement */}
              <div className="text-center py-4 space-y-2">
                <div className="inline-flex p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-lg shadow-amber-500/10">
                  <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-amber-400" />
                </div>
                <div className="text-[11px] uppercase tracking-widest text-slate-400 font-bold">
                  Match Concluded
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {runsA === runsB ? "Match Tied!" : `🏆 ${winnerName} Victorious!`}
                </h2>
                <p className="text-xs sm:text-sm font-semibold text-emerald-400">
                  {runsA === runsB
                    ? "Equal scores across both innings"
                    : `${winnerName} won the match (${runsA > runsB ? `${runsA - runsB} runs` : `${10 - (inningsB?.totalWickets || 0)} wickets`})`}
                </p>
              </div>

              {/* Split Innings Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-1">
                  <div className="text-xs text-slate-400 font-semibold">{state.teamAName || teamAName || "Team A"}</div>
                  <div className="text-xl sm:text-2xl font-black font-mono text-white">
                    {scoreA}
                  </div>
                  <div className="text-[11px] text-slate-400">Run Rate: {inningsA?.runRate || "0.00"}</div>
                </div>

                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-1">
                  <div className="text-xs text-slate-400 font-semibold">{state.teamBName || teamBName || "Team B"}</div>
                  <div className="text-xl sm:text-2xl font-black font-mono text-white">
                    {scoreB}
                  </div>
                  <div className="text-[11px] text-slate-400">Run Rate: {inningsB?.runRate || "0.00"}</div>
                </div>
              </div>

              {/* Actions: Fix Scoring Error (Safe Retrospective Undo), Share Match Card, Done */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleFixCompletedMatchError}
                  disabled={saving}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold text-xs border border-amber-500/30 transition active:scale-95 disabled:opacity-50"
                  title="Safe Retrospective Undo: Undo the final delivery and resume active scoring to fix errors"
                >
                  <Undo2 className="w-4 h-4 text-amber-400" />
                  <span>Fix Scoring Error (Reopen & Undo)</span>
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setShowShareCardModal(true)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/25 transition active:scale-95"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Share Match Card</span>
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs border border-slate-700 transition active:scale-95"
                  >
                    <span>Done</span>
                  </button>
                </div>
              </div>
            </div>
          ) : showInningsBreak && state ? (
            <InningsBreakDashboard
              state={state}
              teamAName={state.teamAName || teamAName}
              teamBName={state.teamBName || teamBName}
              oversLimit={state.oversLimit}
              onStartSecondInnings={() => {
                setInningsNumber(2);
                setShowInningsBreak(false);
              }}
              onFixInnings1={handleFixInnings1Error}
              onShareCard={() => setShowShareCardModal(true)}
              onClose={() => setShowInningsBreak(false)}
            />
          ) : (
            <>
              {fastMode && (
                <div className="flex items-center gap-2 bg-amber-50/70 border border-amber-200/80 rounded-lg px-3 py-1.5 text-[11px] text-amber-800">
                  <Zap className="w-3.5 h-3.5 text-amber-600 shrink-0 fill-amber-500" />
                  <span><strong>Fast 1-Tap Mode Active:</strong> Tap score buttons directly without mandatory player selection.</span>
                </div>
              )}

              {!fastMode && battingTeamPlayers.length > 0 && (!batsmanId || !bowlerId) && (
                <div className="flex items-center gap-2 bg-indigo-50/70 border border-indigo-200/80 rounded-lg px-3 py-1.5 text-[11px] text-indigo-800">
                  <span className="text-xs">ℹ️</span>
                  <span>Select Striker and Bowler below to score, or switch to <strong>Fast Mode</strong> for instant 1-tap scoring.</span>
                </div>
              )}

              {/* Player Selectors */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div>
                  <label className="text-xs text-slate-400 font-semibold uppercase">Striker</label>
                  <select value={batsmanId} onChange={(e) => setBatsmanId(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs mt-1 outline-none focus:border-indigo-400">
                    <option value={0}>Select batter...</option>
                    {battingTeamPlayers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-semibold uppercase">Non-Striker</label>
                  <select value={nonStrikerId} onChange={(e) => setNonStrikerId(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs mt-1 outline-none focus:border-indigo-400">
                    <option value={0}>Select batter...</option>
                    {battingTeamPlayers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 font-semibold uppercase">Bowler</label>
                <select value={bowlerId} onChange={(e) => setBowlerId(Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs mt-1 outline-none focus:border-indigo-400">
                  <option value={0}>Select bowler...</option>
                  {bowlingTeamPlayers.map((p) => {
                    const bStat: any = inn?.bowlers?.find((b: any) => b.playerId === p.id || b.playerName === p.name)
                      || (inn as any)?.bowlerStats?.find((b: any) => b.playerId === p.id || b.name === p.name);
                    const ov = bStat?.overs || bStat?.oversBowled || "0.0";
                    const r = bStat?.runs ?? bStat?.runsConceded ?? 0;
                    const w = bStat?.wickets ?? bStat?.wicketsTaken ?? 0;
                    const maxQuota = houseRules.maxOversPerBowler || state?.maxOversPerBowler || Math.ceil((state?.oversLimit || 20) / 5);
                    const isAtQuota = parseFloat(ov) >= maxQuota;
                    return (
                      <option key={p.id} value={p.id} disabled={isAtQuota}>
                        {p.name} ({ov} ov, {r}r, {w}w){isAtQuota ? " [MAX QUOTA]" : ""}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Target Achieved Celebratory Banner */}
              {isTargetAchieved && state?.status !== "COMPLETED" && (
                <div className="rounded-2xl border-2 border-emerald-300 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 p-4 text-center space-y-2.5 shadow-lg animate-fade-in">
                  <div className="flex items-center justify-center gap-2 text-emerald-600">
                    <Trophy className="w-5 h-5 animate-bounce" />
                    <span className="text-sm font-black uppercase tracking-wider text-slate-900">
                      Target Achieved!
                    </span>
                  </div>
                  <p className="text-xs font-extrabold text-slate-700 m-0">
                    {state?.innings2?.battingTeamName || "Chasing Team"} reached {state?.innings2?.totalRuns} to win by {10 - (state?.innings2?.totalWickets || 0)} wickets!
                  </p>
                  <button
                    type="button"
                    disabled={completingMatch}
                    onClick={declareMatchCompleted}
                    className="w-full min-h-12 py-3 px-4 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white shadow-md transition active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Trophy className="w-4 h-4" />
                    <span>🏆 Declare Match Completed & Celebrate</span>
                  </button>
                </div>
              )}

              {/* Run Buttons */}
              <div className="space-y-3 rounded-2xl border border-slate-200/90 bg-white p-3 shadow-xs sm:space-y-4 sm:p-5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 sm:text-xs">Record Next Delivery</span>
                  <span className="truncate text-[9px] font-medium text-slate-400 sm:text-[11px]">Tap a button to score</span>
                </div>

                <div className="grid grid-cols-4 gap-2 sm:grid-cols-7 sm:gap-2.5">
                  {[0, 1, 2, 3, 4, 5, 6].map((r) => {
                    const style = r === 4
                      ? "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 ring-1 ring-emerald-200"
                      : r === 6
                        ? "border-purple-300 bg-purple-50 text-purple-800 hover:bg-purple-100 ring-1 ring-purple-200"
                        : r === 1
                          ? "border-indigo-200 bg-indigo-50/70 text-indigo-800 hover:bg-indigo-100"
                          : "border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100";
                    const label = r === 0 ? "Dot Ball" : r === 1 ? "Single" : r === 2 ? "Double" : r === 3 ? "Three" : r === 4 ? "FOUR!" : r === 6 ? "SIX!" : "Runs";
                    const labelColor = r === 4 ? "text-emerald-600" : r === 6 ? "text-purple-600" : r === 1 ? "text-indigo-500" : "text-slate-400";
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => recordBall(r, { isBoundary: r === 4 || r === 6, isSix: r === 6 })}
                        disabled={isScoringDisabled}
                        aria-label={`Record ${r} run${r === 1 ? "" : "s"}`}
                        className={`min-h-14 rounded-xl border py-2.5 text-base font-extrabold transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 sm:py-3 ${style}`}
                      >
                        {r === 4 ? "4 🏏" : r === 6 ? "6 🚀" : r}
                        <span className={`block text-[9px] font-semibold ${labelColor}`}>{label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 sm:grid-cols-4 sm:gap-2.5">
                  <button
                    type="button"
                    onClick={() => recordBall(0, { extrasType: "WIDE", extrasRuns: houseRulesEnabled && houseRules.noExtraRuns ? 0 : 1 })}
                    disabled={isScoringDisabled}
                    className="min-h-10 rounded-xl border border-amber-200 bg-amber-50/60 py-2.5 text-xs font-bold text-amber-800 transition hover:bg-amber-100 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {houseRulesEnabled && houseRules.noExtraRuns ? "+0 Wd (Re-bowl)" : "+1 Wd (Wide)"}
                  </button>
                  <button
                    type="button"
                    onClick={() => recordBall(0, { extrasType: "NO_BALL", extrasRuns: houseRulesEnabled && houseRules.noExtraRuns ? 0 : 1 })}
                    disabled={isScoringDisabled}
                    className="min-h-10 rounded-xl border border-amber-200 bg-amber-50/60 py-2.5 text-xs font-bold text-amber-800 transition hover:bg-amber-100 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {houseRulesEnabled && houseRules.noExtraRuns ? "+0 Nb (Re-bowl)" : "+1 Nb (No Ball)"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowWicketPanel(!showWicketPanel)}
                    className={`flex min-h-10 items-center justify-center gap-1 rounded-xl border py-2.5 text-xs font-bold transition active:scale-95 ${showWicketPanel ? "border-rose-400 bg-rose-100 text-rose-800" : "border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100"}`}
                  >
                    <span aria-hidden="true">🔴</span> Wicket (Dismissal)
                  </button>
                  <button
                    type="button"
                    onClick={handleUndo}
                    disabled={saving}
                    className="flex min-h-10 items-center justify-center gap-1 rounded-xl border border-slate-200 bg-slate-100 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Undo2 className="h-3.5 w-3.5" /> Undo Last Ball
                  </button>
                </div>
              </div>

              {/* Extras Toggle */}
              <div>
                <button
                  onClick={() => setShowExtras(!showExtras)}
                  className="flex items-center gap-1 sm:gap-1.5 text-xs text-slate-500 font-semibold hover:text-slate-700 transition active:scale-[0.97]"
                >
                  Extras {showExtras ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
                {showExtras && (
                  <div className="mt-1.5 sm:mt-2 space-y-2">
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-slate-400 font-semibold uppercase shrink-0">Extra Runs:</label>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((r) => (
                          <button
                            key={r}
                            onClick={() => setExtrasRuns(r)}
                            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-xs font-bold transition ${
                              extrasRuns === r ? "bg-amber-500 text-white" : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                            }`}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                      {([["WIDE", "Wide"], ["NO_BALL", "No Ball"], ["BYE", "Bye"], ["LEG_BYE", "Leg Bye"]] as const).map(([type, label]) => (
                        <button
                          key={type}
                          onClick={() => recordBall(0, { extrasType: type, extrasRuns })}
                          disabled={isScoringDisabled}
                          className="py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs font-bold bg-amber-100 text-amber-700 hover:bg-amber-200 transition active:scale-95 disabled:opacity-40"
                        >
                          {label} +{extrasRuns}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Wicket Toggle */}
              <div>
                {showWicketPanel && (
                  <div className="mt-2 sm:mt-3 space-y-2.5 sm:space-y-3 bg-red-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-red-100">
                    <div>
                      <label className="text-xs text-red-400 font-semibold uppercase">Dismissal Type</label>
                      <select value={dismissalType} onChange={(e) => setDismissalType(e.target.value)}
                        className="w-full border border-red-200 rounded-lg px-2 py-1.5 text-xs mt-1 outline-none focus:border-red-400">
                        {["BOWLED", "CAUGHT", "LBW", "RUN_OUT", "STUMPED", "HIT_WICKET", "CAUGHT_AND_BOWLED", "RETIRED_HURT"].map((d) => (
                          <option key={d} value={d}>{d.replace(/_/g, " ")}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-red-400 font-semibold uppercase">Runs scored on this ball</label>
                      <div className="flex items-center gap-1 mt-1">
                        {[0, 1, 2, 3].map((r) => (
                          <button
                            key={r}
                            onClick={() => setWicketRuns(r)}
                            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg text-xs font-bold transition ${
                              wicketRuns === r ? "bg-red-600 text-white" : "bg-white text-red-700 border border-red-200 hover:bg-red-100"
                            }`}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-red-400 font-semibold uppercase">Dismissed Player</label>
                      <select value={dismissedPlayerId} onChange={(e) => setDismissedPlayerId(Number(e.target.value))}
                        className="w-full border border-red-200 rounded-lg px-2 py-1.5 text-xs mt-1 outline-none focus:border-red-400">
                        <option value={0}>Select player...</option>
                        {battingTeamPlayers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                    {(dismissalType === "CAUGHT" || dismissalType === "RUN_OUT" || dismissalType === "STUMPED") && (
                      <div>
                        <label className="text-xs text-red-400 font-semibold uppercase">Fielder</label>
                        <select value={fielderId} onChange={(e) => setFielderId(Number(e.target.value))}
                          className="w-full border border-red-200 rounded-lg px-2 py-1.5 text-xs mt-1 outline-none focus:border-red-400">
                          <option value={0}>Select fielder...</option>
                          {bowlingTeamPlayers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </div>
                    )}
                    <button
                      onClick={() => recordBall(wicketRuns, {
                        isWicket: true,
                        dismissalType,
                        dismissedPlayerId: dismissedPlayerId || batsmanId,
                        fielderId: fielderId || undefined,
                      })}
                      disabled={isScoringDisabled}
                      className="w-full py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700 transition active:scale-[0.98] disabled:opacity-40"
                    >
                      {saving ? "Recording..." : `Confirm Wicket${wicketRuns > 0 ? ` (+${wicketRuns} runs)` : ""}`}
                    </button>
                  </div>
                )}
              </div>

              {state?.status !== "COMPLETED" && (
                <button
                  type="button"
                  onClick={() => setShowCompleteConfirm(true)}
                  disabled={!state || completingMatch || saving}
                  className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-3 text-xs font-extrabold uppercase tracking-wider text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Declare Match Completed
                </button>
              )}

              {/* Actions & Utilities */}
              <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-2 sm:flex sm:items-center sm:gap-3">
                <button
                  onClick={() => {
                    const temp = batsmanId;
                    setBatsmanId(nonStrikerId);
                    setNonStrikerId(temp);
                  }}
                  disabled={!batsmanId || !nonStrikerId}
                  className="min-h-11 w-full rounded-xl bg-indigo-50 px-3 py-2.5 text-sm font-bold text-indigo-700 transition hover:bg-indigo-100 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-10 sm:w-auto sm:px-4 flex items-center justify-center gap-1.5"
                >
                  <ArrowLeftRight className="h-4 w-4" />
                  Swap Batsmen
                </button>
                <button
                  onClick={handleShare}
                  disabled={!state}
                  className="min-h-11 w-full rounded-xl bg-slate-100 px-3 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-200 active:scale-[0.97] flex items-center justify-center gap-1.5 sm:min-h-10 sm:w-auto sm:px-4"
                  title="Share scorecard to WhatsApp, Telegram, or copy link"
                >
                  <Share2 className="h-4 w-4 text-slate-600" />
                  Share Score
                </button>
                <button
                  onClick={() => setShowMatchActions(true)}
                  className="col-span-2 flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-amber-200/70 bg-amber-50 px-3 py-2.5 text-sm font-bold text-amber-800 transition hover:bg-amber-100 active:scale-[0.97] cursor-pointer sm:ml-auto sm:min-h-10 sm:w-auto sm:col-span-1 sm:px-4"
                  title="Open dispute, rain, and score override actions"
                >
                  <Scale className="h-4 w-4 text-amber-600" />
                  Match Actions
                </button>
              </div>
            </>
          )}
        </div>

        {/* New Batsman Prompt */}
        {showNewBatsman && (
          <div className="border-t border-slate-200 bg-emerald-50 px-3 py-3 sm:px-5 sm:py-4 rounded-b-xl sm:rounded-b-2xl">
            <div className="text-xs font-semibold text-emerald-800 mb-2">Select new batsman:</div>
            <select
              autoFocus
              value={0}
              onChange={(e) => {
                const newId = Number(e.target.value);
                if (newId) {
                  const dismissed = dismissedPlayerId || batsmanId;
                  if (dismissed === batsmanId) {
                    setBatsmanId(newId);
                  } else {
                    setNonStrikerId(newId);
                  }
                  setShowNewBatsman(false);
                }
              }}
              className="w-full border border-emerald-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-emerald-400"
            >
              <option value={0}>Select incoming batter...</option>
              {availableBatsmen.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <button
              onClick={() => setShowNewBatsman(false)}
              className="mt-2 text-xs text-slate-500 hover:text-slate-700 transition"
            >
              Skip for now
            </button>
          </div>
        )}
      </div>

      {/* Close Confirmation */}
      {showCloseConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50" onClick={() => setShowCloseConfirm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-5 max-w-xs w-full" onClick={e => e.stopPropagation()}>
            <h4 className="text-xs font-bold text-slate-800">Close Live Scorer?</h4>
            <p className="text-xs text-slate-500 mt-1">The match will continue in the background. You can reopen it any time.</p>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowCloseConfirm(false)}
                className="flex-1 px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => { setShowCloseConfirm(false); onClose(); }}
                className="flex-1 px-3 py-2 text-xs font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 transition"
              >
                Close Scorer
              </button>
            </div>
          </div>
        </div>
      )}

      {showCompleteConfirm && (
        <div className="fixed inset-0 z-[65] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-xs" onClick={() => !completingMatch && setShowCompleteConfirm(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby="declare-cricket-complete-title" className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl sm:p-5" onClick={event => event.stopPropagation()}>
            <div className="mb-3 flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h3 id="declare-cricket-complete-title" className="m-0 text-sm font-extrabold text-slate-900">Declare match completed?</h3>
                <p className="mb-0 mt-1 text-xs text-slate-500">This saves the final result and closes live scoring.</p>
              </div>
            </div>
            <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
              <div className="flex items-center justify-between gap-3"><span className="truncate font-semibold text-slate-600">{state?.teamAName || teamAName || "Team A"}</span><strong className="shrink-0 font-mono text-slate-900">{scoreA}</strong></div>
              <div className="flex items-center justify-between gap-3"><span className="truncate font-semibold text-slate-600">{state?.teamBName || teamBName || "Team B"}</span><strong className="shrink-0 font-mono text-slate-900">{scoreB}</strong></div>
              <div className="border-t border-slate-200 pt-2 font-bold text-emerald-700">{runsA === runsB ? "Outcome: Tie" : `Winner: ${winnerName}`}</div>
            </div>
            <p className="mb-0 mt-3 text-[10px] leading-relaxed text-slate-500">For a rain-affected, abandoned, or no-result match, choose that outcome from Match Actions instead.</p>
            <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" disabled={completingMatch} onClick={() => setShowCompleteConfirm(false)} className="min-h-10 rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-200 disabled:opacity-50">Cancel</button>
              <button type="button" disabled={completingMatch} onClick={() => void declareMatchCompleted()} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-extrabold text-white transition hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-60">
                {completingMatch && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {completingMatch ? "Saving result…" : "Confirm & Complete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Match Actions chooser */}
      {showMatchActions && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-xs"
          onClick={() => setShowMatchActions(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cricket-match-actions-title"
            className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl sm:p-5"
            onClick={event => event.stopPropagation()}
          >
            <div className="mb-3">
              <h3 id="cricket-match-actions-title" className="m-0 text-sm font-extrabold text-slate-900">Match Actions</h3>
              <p className="mb-0 mt-1 text-xs text-slate-500">Choose how you need to manage this match.</p>
            </div>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => { setShowMatchActions(false); setShowDisputeModal(true); }}
                className="flex min-h-12 w-full items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-left transition hover:bg-amber-100"
              >
                <Scale className="h-4 w-4 shrink-0 text-amber-700" />
                <span>
                  <span className="block text-xs font-bold text-amber-900">Dispute / Rain</span>
                  <span className="block text-[10px] text-amber-800/80">Open arbitration or apply a rain rule</span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => { setShowMatchActions(false); setShowEmergencyModal(true); }}
                className="flex min-h-12 w-full items-center gap-3 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-left transition hover:bg-indigo-100"
              >
                <Zap className="h-4 w-4 shrink-0 text-indigo-700" />
                <span>
                  <span className="block text-xs font-bold text-indigo-900">Score Override</span>
                  <span className="block text-[10px] text-indigo-800/80">Enter a manual result, walkover, or forfeit</span>
                </span>
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowMatchActions(false)}
              className="mt-3 min-h-10 w-full rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Sports Incident & Dispute Arbitration Modal */}
      {showDisputeModal && (
        <SportsDisputeModal
          isOpen={showDisputeModal}
          onClose={() => setShowDisputeModal(false)}
          matchId={matchId}
          tournamentName="Mana Community Cricket"
          teamAName={state?.innings1?.battingTeamName || "Team A"}
          teamBName={state?.innings2?.battingTeamName || (state?.innings1 ? "Team B" : "Opponent")}
          sport="Cricket"
          currentScoreSummary={{
            firstInningsRuns: state?.innings1?.totalRuns,
            firstInningsOvers: typeof state?.innings1?.totalOvers === "number" ? state.innings1.totalOvers : parseFloat(state?.innings1?.totalOvers || "20") || 20,
            currentOvers: typeof inn?.totalOvers === "number" ? inn.totalOvers : parseFloat(inn?.totalOvers || "0") || 0,
          }}
          onApplyRuling={(ruling) => {
            if (ruling.revisedMatchConditions?.revisedTargetRuns && state) {
              setState({ ...state, target: ruling.revisedMatchConditions.revisedTargetRuns });
              toast.success(`Match target revised to ${ruling.revisedMatchConditions.revisedTargetRuns} runs!`);
            }
            setShowDisputeModal(false);
          }}
        />
      )}

      {/* Emergency / Alternative Scoring Modal */}
      <EmergencyScoreModal
        isOpen={showEmergencyModal}
        onClose={() => setShowEmergencyModal(false)}
        matchId={matchId}
        configId={configId}
        sportType="CRICKET"
        teamAId={state?.teamAId}
        teamBId={state?.teamBId}
        teamAName={state?.teamAName || teamAName}
        teamBName={state?.teamBName || teamBName}
        currentScoreA={state?.innings1 ? `${state.innings1.totalRuns}/${state.innings1.totalWickets}` : null}
        currentScoreB={state?.innings2 ? `${state.innings2.totalRuns}/${state.innings2.totalWickets}` : null}
        currentPeriod={inningsNumber}
        onSuccess={() => {
          fetchState();
          setShowEmergencyModal(false);
        }}
      />

      {/* Match Direct Share Card Modal */}
      {showShareCardModal && state && (
        <MatchShareCardModal
          isOpen={showShareCardModal}
          onClose={() => setShowShareCardModal(false)}
          matchId={matchId}
          state={state}
          teamAName={state.teamAName || teamAName}
          teamBName={state.teamBName || teamBName}
        />
      )}

      {/* Gully & Box Cricket House Rules Modal */}
      {showHouseRulesModal && (
        <HouseRulesModal
          isOpen={showHouseRulesModal}
          onClose={() => setShowHouseRulesModal(false)}
          matchId={matchId}
          initialRules={{
            ...houseRules,
            oversLimit: state?.oversLimit || houseRules.oversLimit,
            ballsPerOver: state?.ballsPerOver || houseRules.ballsPerOver,
            maxOversPerBowler: state?.maxOversPerBowler || houseRules.maxOversPerBowler,
          }}
          onSaveRules={handleSaveHouseRules}
        />
      )}

      {/* Interactive 3D Coin Toss Modal */}
      {showTossModal && state && (
        <TossSetupModal
          isOpen={showTossModal}
          onClose={() => setShowTossModal(false)}
          matchId={matchId}
          teamAId={state.teamAId || 0}
          teamBId={state.teamBId || 0}
          teamAName={state.teamAName}
          teamBName={state.teamBName}
          onSaved={() => {
            fetchState();
            setShowTossModal(false);
          }}
          sportType="CRICKET"
        />
      )}
    </div>
  );
}





