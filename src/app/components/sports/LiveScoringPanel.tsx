import { useState, useEffect, useCallback } from "react";
import { X, Loader2, Undo2, ChevronDown, ChevronUp, Wifi, WifiOff, AlertTriangle } from "lucide-react";
import { tournamentService, type LiveMatchStateData, type BallEventRequestData } from "../../../services/tournamentService";
import { stompClient } from "../../../services/stompClient";
import { ballColor } from "./utils/cricketUtils";
import { toast } from "sonner";

interface LiveScoringPanelProps {
  matchId: number;
  configId?: number;
  onClose: () => void;
}

interface PlayerOption {
  id: number;
  name: string;
  teamId?: number;
}

export function LiveScoringPanel({ matchId, configId, onClose }: LiveScoringPanelProps) {
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

  useEffect(() => {
    tournamentService.getLiveMatchState(matchId)
      .then((s) => {
        setState(s);
        setInningsNumber(s.currentInnings);
        if (s.batsmanOnStrikeId) setBatsmanId(s.batsmanOnStrikeId);
        if (s.batsmanNonStrikeId) setNonStrikerId(s.batsmanNonStrikeId);
        if (s.currentBowlerId) setBowlerId(s.currentBowlerId);
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
  }, [matchId]);

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
      };

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
  }, [matchId, inningsNumber, batsmanId, nonStrikerId, bowlerId, wsConnected]);

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
  const battingTeamPlayers = players.filter(p => {
    if (!state) return true;
    const battingTeamId = inningsNumber === 1 ? state.teamAId : state.teamBId;
    return p.teamId === battingTeamId;
  });
  const bowlingTeamPlayers = players.filter(p => {
    if (!state) return true;
    const bowlingTeamId = inningsNumber === 1 ? state.teamBId : state.teamAId;
    return p.teamId === bowlingTeamId;
  });

  const availableBatsmen = battingTeamPlayers.filter(p => {
    if (!inn) return true;
    const dismissed = inn.batters.filter(b => b.isOut).map(b => b.playerId);
    return !dismissed.includes(p.id) && p.id !== batsmanId;
  });

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4" onClick={handleClose}>
      <div
        className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-indigo-700 px-3 py-2 sm:px-5 sm:py-3 flex items-center justify-between z-10 rounded-t-xl sm:rounded-t-2xl">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-[11px] sm:text-sm font-bold text-white">Live Scorer</span>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-400 animate-pulse" />
              <span className="text-[9px] sm:text-[10px] font-bold text-red-300 uppercase">LIVE</span>
            </div>
            {wsConnected ? <Wifi className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-300" /> : <WifiOff className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-300" />}
          </div>
          <button onClick={handleClose} className="p-1 sm:p-1.5 hover:bg-white/10 rounded-lg transition">
            <X className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </button>
        </div>

        {/* Mini Scoreboard */}
        {state && inn && (
          <div className="bg-slate-800 px-3 py-2 sm:px-5 sm:py-3 text-white flex items-center justify-between">
            <div>
              <div className="text-[10px] sm:text-xs text-slate-400">{inn.battingTeamName} — Innings {inningsNumber}</div>
              <div className="text-lg sm:text-2xl font-extrabold">
                {inn.totalRuns}/{inn.totalWickets}
                <span className="text-[10px] sm:text-xs text-slate-400 font-normal ml-1.5 sm:ml-2">({inn.totalOvers} ov)</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] sm:text-xs text-slate-400">CRR: {inn.runRate}</div>
              {state.target && inningsNumber === 2 && (
                <div className="text-[10px] sm:text-xs text-amber-400">Need {state.target - inn.totalRuns}</div>
              )}
            </div>
          </div>
        )}

        {/* This Over */}
        {inn && inn.thisOver.length > 0 && (
          <div className="px-3 py-1.5 sm:px-5 sm:py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-1 sm:gap-2 flex-wrap">
            <span className="text-[9px] sm:text-[10px] text-slate-400 font-semibold uppercase mr-1">This Over:</span>
            {inn.thisOver.map((ball, i) => (
              <span key={i} className={`w-5 h-5 sm:w-7 sm:h-7 flex items-center justify-center rounded-full text-[9px] sm:text-[10px] font-bold ${ballColor(ball)}`}>
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
              <span className="text-[10px] sm:text-xs text-amber-700 font-medium">WebSocket disconnected — scoring via REST fallback</span>
            </div>
          )}

          {/* Innings Selector */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-[10px] sm:text-xs text-slate-500 font-semibold">Innings:</span>
            {[1, 2].map((n) => (
              <button
                key={n}
                onClick={() => setInningsNumber(n)}
                className={`px-2.5 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs font-semibold rounded-lg transition active:scale-[0.96] ${
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
              <label className="text-[9px] sm:text-[10px] text-slate-400 font-semibold uppercase">Striker</label>
              <select value={batsmanId} onChange={(e) => setBatsmanId(Number(e.target.value))}
                className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-[10px] sm:text-xs mt-1 outline-none focus:border-indigo-400">
                <option value={0}>Select batter...</option>
                {battingTeamPlayers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[9px] sm:text-[10px] text-slate-400 font-semibold uppercase">Non-Striker</label>
              <select value={nonStrikerId} onChange={(e) => setNonStrikerId(Number(e.target.value))}
                className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-[10px] sm:text-xs mt-1 outline-none focus:border-indigo-400">
                <option value={0}>Select batter...</option>
                {battingTeamPlayers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-[9px] sm:text-[10px] text-slate-400 font-semibold uppercase">Bowler</label>
            <select value={bowlerId} onChange={(e) => setBowlerId(Number(e.target.value))}
              className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-[10px] sm:text-xs mt-1 outline-none focus:border-indigo-400">
              <option value={0}>Select bowler...</option>
              {bowlingTeamPlayers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          {/* Run Buttons */}
          <div>
            <div className="text-[9px] sm:text-[10px] text-slate-400 font-semibold uppercase mb-1.5 sm:mb-2">Runs</div>
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {[0, 1, 2, 3, 4, 5, 6].map((r) => (
                <button
                  key={r}
                  onClick={() => recordBall(r, {
                    isBoundary: r === 4,
                    isSix: r === 6,
                  })}
                  disabled={saving || !batsmanId || !bowlerId}
                  className={`py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-[11px] sm:text-sm font-bold transition hover:scale-105 active:scale-95 disabled:opacity-40 ${
                    r === 4 ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" :
                    r === 6 ? "bg-purple-100 text-purple-700 hover:bg-purple-200" :
                    r === 0 ? "bg-slate-100 text-slate-500 hover:bg-slate-200" :
                    "bg-blue-100 text-blue-700 hover:bg-blue-200"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Extras Toggle */}
          <div>
            <button
              onClick={() => setShowExtras(!showExtras)}
              className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs text-slate-500 font-semibold hover:text-slate-700 transition active:scale-[0.97]"
            >
              Extras {showExtras ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            {showExtras && (
              <div className="mt-1.5 sm:mt-2 space-y-2">
                <div className="flex items-center gap-2">
                  <label className="text-[9px] sm:text-[10px] text-slate-400 font-semibold uppercase shrink-0">Extra Runs:</label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((r) => (
                      <button
                        key={r}
                        onClick={() => setExtrasRuns(r)}
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-[10px] sm:text-xs font-bold transition ${
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
                      className="py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold bg-amber-100 text-amber-700 hover:bg-amber-200 transition active:scale-95 disabled:opacity-40"
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
              className={`w-full py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-[11px] sm:text-sm font-bold transition active:scale-[0.98] ${
                showWicketPanel ? "bg-red-600 text-white" : "bg-red-100 text-red-700 hover:bg-red-200"
              }`}
            >
              Wicket
            </button>
            {showWicketPanel && (
              <div className="mt-2 sm:mt-3 space-y-2.5 sm:space-y-3 bg-red-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-red-100">
                <div>
                  <label className="text-[9px] sm:text-[10px] text-red-400 font-semibold uppercase">Dismissal Type</label>
                  <select value={dismissalType} onChange={(e) => setDismissalType(e.target.value)}
                    className="w-full border border-red-200 rounded-lg px-2 py-1.5 text-[10px] sm:text-xs mt-1 outline-none focus:border-red-400">
                    {["BOWLED", "CAUGHT", "LBW", "RUN_OUT", "STUMPED", "HIT_WICKET", "CAUGHT_AND_BOWLED", "RETIRED_HURT"].map((d) => (
                      <option key={d} value={d}>{d.replace(/_/g, " ")}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] sm:text-[10px] text-red-400 font-semibold uppercase">Runs scored on this ball</label>
                  <div className="flex items-center gap-1 mt-1">
                    {[0, 1, 2, 3].map((r) => (
                      <button
                        key={r}
                        onClick={() => setWicketRuns(r)}
                        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg text-[10px] sm:text-xs font-bold transition ${
                          wicketRuns === r ? "bg-red-600 text-white" : "bg-white text-red-700 border border-red-200 hover:bg-red-100"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[9px] sm:text-[10px] text-red-400 font-semibold uppercase">Dismissed Player</label>
                  <select value={dismissedPlayerId} onChange={(e) => setDismissedPlayerId(Number(e.target.value))}
                    className="w-full border border-red-200 rounded-lg px-2 py-1.5 text-[10px] sm:text-xs mt-1 outline-none focus:border-red-400">
                    <option value={0}>Select player...</option>
                    {battingTeamPlayers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                {(dismissalType === "CAUGHT" || dismissalType === "RUN_OUT" || dismissalType === "STUMPED") && (
                  <div>
                    <label className="text-[9px] sm:text-[10px] text-red-400 font-semibold uppercase">Fielder</label>
                    <select value={fielderId} onChange={(e) => setFielderId(Number(e.target.value))}
                      className="w-full border border-red-200 rounded-lg px-2 py-1.5 text-[10px] sm:text-xs mt-1 outline-none focus:border-red-400">
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
                  className="w-full py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold bg-red-600 text-white hover:bg-red-700 transition active:scale-[0.98] disabled:opacity-40"
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
              className="flex items-center gap-1 sm:gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 text-[10px] sm:text-xs font-semibold text-slate-500 bg-slate-100 rounded-lg sm:rounded-xl hover:bg-slate-200 transition active:scale-[0.96] disabled:opacity-40"
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
              className="px-3 py-1.5 sm:px-4 sm:py-2 text-[10px] sm:text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-lg sm:rounded-xl hover:bg-indigo-100 transition active:scale-[0.96]"
            >
              Swap Batsmen
            </button>
          </div>
        </div>

        {/* New Batsman Prompt */}
        {showNewBatsman && (
          <div className="border-t border-slate-200 bg-emerald-50 px-3 py-3 sm:px-5 sm:py-4 rounded-b-xl sm:rounded-b-2xl">
            <div className="text-[10px] sm:text-xs font-semibold text-emerald-800 mb-2">Select new batsman:</div>
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
              className="w-full border border-emerald-200 rounded-lg px-2 py-1.5 text-[10px] sm:text-xs outline-none focus:border-emerald-400"
            >
              <option value={0}>Select incoming batter...</option>
              {availableBatsmen.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <button
              onClick={() => setShowNewBatsman(false)}
              className="mt-2 text-[9px] sm:text-[10px] text-slate-500 hover:text-slate-700 transition"
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
            <h4 className="text-sm font-bold text-slate-800">Close Live Scorer?</h4>
            <p className="text-[10px] sm:text-xs text-slate-500 mt-1">The match will continue in the background. You can reopen it any time.</p>
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
    </div>
  );
}
