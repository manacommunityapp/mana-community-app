import { useState, useEffect, useCallback } from "react";
import { X, Loader2, Undo2, ChevronDown, ChevronUp, Wifi, WifiOff, AlertTriangle, Scale, Radio } from "lucide-react";
import { tournamentService, type LiveMatchStateData, type BallEventRequestData } from "../../../services/sports/tournamentService";
import { stompClient } from "../../../services/chat/stompClient";
import { ballColor, remainingBalls, requiredRunRate } from "./utils/cricketUtils";
import { toast } from "sonner";
import { SportsDisputeModal } from "./SportsDisputeModal";

interface LiveScoringPanelProps {
  matchId: number;
  configId?: number;
  teamAName?: string;
  teamBName?: string;
  onClose: () => void;
}

interface PlayerOption {
  id: number;
  name: string;
  teamId?: number;
}

export function LiveScoringPanel({ matchId, configId, teamAName, teamBName, onClose }: LiveScoringPanelProps) {
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
  const [wsConnected, setWsConnected] = useState(false);
  const [showNewBatsman, setShowNewBatsman] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [feedActive, setFeedActive] = useState<boolean>(true);
  const [tossWinnerSide, setTossWinnerSide] = useState<"A" | "B" | "">("");
  const [tossDecision, setTossDecision] = useState<"BAT" | "BOWL" | "">("");
  const [tossSaving, setTossSaving] = useState(false);

  const toggleFeedVisibility = async () => {
    const next = !feedActive;
    try {
      await tournamentService.setFeedSettings("match", matchId, { showInFeed: next });
      setFeedActive(next);
      toast.success(next ? "Match score visible on Live Now strip" : "Match score hidden from Live Now strip");
    } catch {
      toast.error("Failed to update live strip setting");
    }
  };
  const [showOversAdjust, setShowOversAdjust] = useState(false);
  const [customOvers, setCustomOvers] = useState<string>("");
  const [customMaxBowler, setCustomMaxBowler] = useState<string>("");

  useEffect(() => {
    tournamentService.getLiveMatchState(matchId)
      .then((s) => {
        setState(s);
      })
      .catch(() => setError("Failed to load match state"))
      .finally(() => setLoading(false));

    const unsub = stompClient.subscribe(`/topic/match/${matchId}/state`, (body) => {
      const s = body as LiveMatchStateData;
      setState(s);
      setWsConnected(true);
    });

    const unsubConnect = stompClient.onConnect(() => setWsConnected(true));

    loadPlayers();

    return () => {
      unsub();
      unsubConnect();
    };
  }, [matchId, configId]);

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
      setState(await tournamentService.getLiveMatchState(matchId));
      toast.success("Toss details saved");
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
      const configs = await tournamentService.getConfigs();
      for (const cfg of configs) {
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
    if (!batsmanId || !bowlerId) {
      toast.error("Select both batsman and bowler first");
      return;
    }
    setSaving(true);
    try {
      const req: BallEventRequestData = {
        matchId,
        inningsNumber,
        batsmanId,
        nonStrikerId: nonStrikerId || undefined,
        bowlerId,
        runsScored,
        isBoundary: opts?.isBoundary,
        isSix: opts?.isSix,
        extrasType: opts?.extrasType,
        extrasRuns: opts?.extrasRuns,
        isWicket: opts?.isWicket,
        dismissalType: opts?.dismissalType,
        dismissedPlayerId: opts?.dismissedPlayerId,
        fielderId: opts?.fielderId,
        commandId: crypto.randomUUID(),
      };

      // Optimistic runs / wickets visual increment for scorer
      if (state) {
        const innKey = inningsNumber === 1 ? "innings1" : "innings2";
        const addRuns = runsScored + (opts?.extrasRuns || 0);
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

      if (runsScored % 2 === 1 && !opts?.extrasType) {
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
  }, [matchId, inningsNumber, batsmanId, nonStrikerId, bowlerId, wsConnected, state]);

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
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm text-center" onClick={e => e.stopPropagation()}>
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <p className="text-sm text-slate-700 font-semibold">{error}</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 transition">
            Close
          </button>
        </div>
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

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4" onClick={handleClose}>
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl max-h-[96dvh] sm:max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-indigo-700 px-3 py-2 sm:px-5 sm:py-3 flex items-center justify-between z-10 rounded-t-xl sm:rounded-t-2xl">
          <div className="flex items-center gap-2 sm:gap-3">
                  <div className="min-w-0">
                    <span className="block text-[10px] font-bold text-white">Live Scorer</span>
                    {(teamAName || teamBName) && (
                      <span className="block max-w-[180px] truncate text-[9px] text-indigo-100/80">{teamAName || "Team A"} vs {teamBName || "Team B"}</span>
                    )}
                  </div>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-400 animate-pulse" />
              <span className="text-[10px] font-bold text-red-300 uppercase">LIVE</span>
            </div>
            {wsConnected ? <Wifi className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-300" /> : <WifiOff className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-300" />}
            <button
              type="button"
              onClick={toggleFeedVisibility}
              title="Toggle whether live score appears on top Live Now strip"
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 border transition-all cursor-pointer ${
                feedActive
                  ? "bg-red-500/25 text-white border-red-300/60"
                  : "bg-white/10 text-white/60 border-white/20 hover:text-white"
              }`}
            >
              <Radio className="w-2.5 h-2.5" />
              <span>{feedActive ? "Live Strip ON" : "Live Strip OFF"}</span>
            </button>
          </div>
          <button onClick={handleClose} className="p-1 sm:p-1.5 hover:bg-white/10 rounded-lg transition">
            <X className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </button>
        </div>

        {state && canEditToss && (
          <div className="mx-3 mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 sm:mx-5 sm:px-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div>
                <p className="m-0 text-xs font-bold text-amber-900">Cricket toss</p>
                <p className="m-0 mt-0.5 text-[10px] text-amber-800/80">Save before recording the first ball.</p>
              </div>
              {state.tossWinnerTeamId && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Saved</span>}
            </div>
            <div className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
              <label className="min-w-0 text-[10px] font-semibold text-slate-600">
                Toss won by
                <select value={tossWinnerSide} onChange={e => setTossWinnerSide(e.target.value as "A" | "B" | "")} className="mt-1 w-full rounded-lg border border-amber-200 bg-white px-2 py-2 text-xs text-slate-800">
                  <option value="">Select team</option>
                  <option value="A">{state.teamAName}</option>
                  <option value="B">{state.teamBName}</option>
                </select>
              </label>
              <label className="min-w-0 text-[10px] font-semibold text-slate-600">
                Chose to
                <select value={tossDecision} onChange={e => setTossDecision(e.target.value as "BAT" | "BOWL" | "")} className="mt-1 w-full rounded-lg border border-amber-200 bg-white px-2 py-2 text-xs text-slate-800">
                  <option value="">Select decision</option>
                  <option value="BAT">Bat first</option>
                  <option value="BOWL">Bowl first</option>
                </select>
              </label>
              <button type="button" onClick={saveToss} disabled={tossSaving || !tossWinnerSide || !tossDecision} className="rounded-lg bg-amber-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50">
                {tossSaving ? "Saving" : state.tossWinnerTeamId ? "Update" : "Save toss"}
              </button>
            </div>
          </div>
        )}
        {state && !canEditToss && state.tossWinnerTeamId && (
          <div className="mx-3 mt-3 rounded-lg border border-amber-100 bg-amber-50/70 px-3 py-2 text-xs text-amber-900 sm:mx-5">
            <span className="font-bold">Toss:</span> {state.tossWinnerTeamId === state.teamAId ? state.teamAName : state.teamBName} chose to {state.tossDecision?.toUpperCase() === "BOWL" ? "bowl" : "bat"} first
          </div>
        )}

        {/* Mini Scoreboard */}
        {state && inn && (
          <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-4 py-4 sm:px-6 sm:py-5 text-white border-b border-slate-800">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-400/30">Innings {inningsNumber}</span>
                  <span className="text-xs text-slate-300 truncate">
                    {inn.battingTeamName || battingTeamFallback}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-4xl sm:text-5xl font-black tracking-tight">{inn.totalRuns}</span>
                  <span className="font-mono text-3xl font-bold text-rose-400">/</span>
                  <span className="font-mono text-4xl sm:text-5xl font-black text-rose-300">{inn.totalWickets}</span>
                </div>
                <div className="mt-1 text-[11px] font-semibold text-amber-300">Overs {inn.totalOvers}{state.oversLimit ? ` / ${state.oversLimit}` : ""}</div>
              </div>
              <div className="shrink-0 text-right space-y-1">
                <div className="text-[10px] uppercase tracking-wider text-slate-400">Current Run Rate</div>
                <div className="font-mono text-lg font-black text-emerald-300">{inn.runRate}</div>
                {state.maxOversPerBowler && <div className="text-[10px] text-slate-400">Max {state.maxOversPerBowler} ov / bowler</div>}
              </div>
            </div>
            {runsNeeded !== null && (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-2">
                <div className="text-xs font-bold text-amber-200">Target {state.target} · Need {runsNeeded} runs in {ballsRemaining} balls</div>
                <div className="text-[10px] font-semibold text-slate-300">Required rate <span className="font-mono font-black text-emerald-300">{requiredRate}</span></div>
              </div>
            )}
          </div>
        )}

        {/* Pre-Match / In-Match Format & Overs Config Bar */}
        {state && (
          <div className="bg-slate-900/90 border-b border-slate-700/60 px-3 py-1.5 sm:px-5 sm:py-2 text-xs text-slate-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Format:</span>
              <span>{state.oversLimit || 20} Overs/Innings</span>
              <span className="text-slate-500">•</span>
              <span>Max {state.maxOversPerBowler || Math.ceil((state.oversLimit || 20) / 5)} ov/bowler</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setCustomOvers((state.oversLimit || 20).toString());
                setCustomMaxBowler((state.maxOversPerBowler || 4).toString());
                setShowOversAdjust(!showOversAdjust);
              }}
              className="text-[10px] font-semibold text-indigo-300 hover:text-white underline underline-offset-2 transition cursor-pointer"
            >
              {showOversAdjust ? "Hide" : "Adjust Overs"}
            </button>
          </div>
        )}

        {/* Inline Overs Adjust Drawer */}
        {showOversAdjust && (
          <div className="bg-slate-800 border-b border-indigo-500/30 p-3 flex flex-wrap items-center gap-3 text-xs text-white">
            <span className="text-[11px] font-bold text-amber-300">Weather / Delay Override:</span>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-300">Overs:</span>
              <input
                type="number"
                min="1"
                max="50"
                value={customOvers}
                onChange={(e) => setCustomOvers(e.target.value)}
                className="w-14 rounded-lg bg-slate-700 border border-slate-600 px-2 py-1 text-white text-xs outline-none focus:border-indigo-400"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-300">Max/Bowler:</span>
              <input
                type="number"
                min="1"
                max="10"
                value={customMaxBowler}
                onChange={(e) => setCustomMaxBowler(e.target.value)}
                className="w-14 rounded-lg bg-slate-700 border border-slate-600 px-2 py-1 text-white text-xs outline-none focus:border-indigo-400"
              />
            </div>
            <button
              type="button"
              onClick={async () => {
                const ov = Number(customOvers);
                const maxB = Number(customMaxBowler);
                if (!ov || ov <= 0) { toast.error("Enter valid overs"); return; }
                try {
                  await tournamentService.updateMatchConfigOverride(matchId, JSON.stringify({
                    oversPerInnings: ov,
                    maxOversPerBowler: maxB || Math.ceil(ov / 5),
                  }));
                  toast.success(`Match overs updated to ${ov}`);
                  setShowOversAdjust(false);
                  const updated = await tournamentService.getLiveMatchState(matchId);
                  setState(updated);
                } catch {
                  toast.error("Failed to update match overs");
                }
              }}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs transition"
            >
              Apply
            </button>
          </div>
        )}

        {/* This Over */}
        {inn && inn.thisOver.length > 0 && (
          <div className="px-3 py-2 sm:px-5 sm:py-2.5 bg-slate-950 border-b border-slate-800 flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mr-1">This Over:</span>
            {inn.thisOver.map((ball, i) => (
              <span key={i} className={`w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full text-[10px] font-black border border-white/10 ${ballColor(ball)}`}>
                {ball}
              </span>
            ))}
          </div>
        )}

        <div className="p-2.5 sm:p-5 space-y-2.5 sm:space-y-4">
          {/* WS Disconnected Banner */}
          {!wsConnected && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <WifiOff className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="text-[10px] text-amber-700 font-medium">WebSocket disconnected — scoring via REST fallback</span>
            </div>
          )}

          {/* Innings Selector */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-[10px] text-slate-500 font-semibold">Innings:</span>
            {[1, 2].map((n) => (
              <button
                key={n}
                onClick={() => setInningsNumber(n)}
                className={`px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs font-semibold rounded-lg transition active:scale-[0.96] ${
                  inningsNumber === n ? "bg-indigo-100 text-indigo-700" : "text-slate-500 hover:bg-slate-100"
                }`}
              >
                {n}
              </button>
            ))}
          </div>

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
              {bowlingTeamPlayers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          {/* Run Buttons */}
          <div className="rounded-2xl bg-slate-950 p-3 sm:p-4 border border-slate-800 shadow-inner">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2.5">Record Ball Delivery</div>
            <div className="grid grid-cols-4 gap-2 sm:gap-2.5">
              {[0, 1, 2, 3, 4, 5, 6].map((r) => (
                <button
                  key={r}
                  onClick={() => recordBall(r, {
                    isBoundary: r === 4,
                    isSix: r === 6,
                  })}
                  disabled={saving || !batsmanId || !bowlerId}
                  aria-label={`Record ${r} run${r === 1 ? "" : "s"}`}
                  className={`min-h-14 rounded-xl text-lg sm:text-xl font-black font-mono transition active:scale-[0.97] disabled:opacity-40 ${
                    r === 4 ? "bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-950/30" :
                    r === 6 ? "bg-amber-400 text-slate-950 hover:bg-amber-300 shadow-lg shadow-amber-950/20" :
                    r === 0 ? "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700" :
                    "bg-slate-800 text-white hover:bg-slate-700 border border-slate-700"
                  }`}
                >
                  {r}<span className="block text-[9px] font-semibold tracking-normal">{r === 0 ? "Dot" : r === 4 ? "Four" : r === 6 ? "Six" : "Runs"}</span>
                </button>
              ))}
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
                      disabled={saving || !batsmanId || !bowlerId}
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
            <button
              onClick={() => setShowWicketPanel(!showWicketPanel)}
              className={`w-full py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition active:scale-[0.98] ${
                showWicketPanel ? "bg-red-600 text-white" : "bg-red-100 text-red-700 hover:bg-red-200"
              }`}
            >
              Wicket
            </button>
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
                  disabled={saving || !batsmanId || !bowlerId}
                  className="w-full py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700 transition active:scale-[0.98] disabled:opacity-40"
                >
                  {saving ? "Recording..." : `Confirm Wicket${wicketRuns > 0 ? ` (+${wicketRuns} runs)` : ""}`}
                </button>
              </div>
            )}
          </div>

          {/* Undo + Swap */}
          <div className="flex items-center gap-2 sm:gap-3 pt-2 border-t border-slate-100">
            <button
              onClick={handleUndo}
              disabled={saving}
              className="flex items-center gap-1 sm:gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-semibold text-slate-500 bg-slate-100 rounded-lg sm:rounded-xl hover:bg-slate-200 transition active:scale-[0.96] disabled:opacity-40"
            >
              <Undo2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              Undo Last Ball
            </button>
            <button
              onClick={() => {
                const temp = batsmanId;
                setBatsmanId(nonStrikerId);
                setNonStrikerId(temp);
              }}
              className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-lg sm:rounded-xl hover:bg-indigo-100 transition active:scale-[0.96]"
            >
              Swap Batsmen
            </button>
            <button
              onClick={() => setShowDisputeModal(true)}
              className="flex items-center gap-1 sm:gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200/70 rounded-lg sm:rounded-xl hover:bg-amber-100 transition active:scale-[0.96] ml-auto cursor-pointer"
              title="Dispute arbitration, 15-min walkovers, or rain rules"
            >
              <Scale className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-600" />
              Dispute / Rain
            </button>
          </div>
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
    </div>
  );
}
