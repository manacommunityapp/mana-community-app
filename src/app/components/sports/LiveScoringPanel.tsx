import { useState, useEffect, useCallback } from "react";
import { X, Loader2, Undo2, ChevronDown, ChevronUp, Wifi, WifiOff } from "lucide-react";
import { tournamentService, type LiveMatchStateData, type BallEventRequestData } from "../../../services/tournamentService";
import { stompClient } from "../../../services/stompClient";

interface LiveScoringPanelProps {
  matchId: number;
  onClose: () => void;
}

interface PlayerOption {
  id: number;
  name: string;
  teamId?: number;
}

export function LiveScoringPanel({ matchId, onClose }: LiveScoringPanelProps) {
  const [state, setState] = useState<LiveMatchStateData | null>(null);
  const [loading, setLoading] = useState(true);
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
  const [showExtras, setShowExtras] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);

  useEffect(() => {
    tournamentService.getLiveMatchState(matchId)
      .then((s) => {
        setState(s);
        setInningsNumber(s.currentInnings);
        if (s.batsmanOnStrikeId) setBatsmanId(s.batsmanOnStrikeId);
        if (s.batsmanNonStrikeId) setNonStrikerId(s.batsmanNonStrikeId);
        if (s.currentBowlerId) setBowlerId(s.currentBowlerId);
      })
      .catch(() => {})
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
      // fallback: no players loaded
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
    if (!batsmanId || !bowlerId) return;
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

      setShowWicketPanel(false);
      setShowExtras(false);
    } catch (err) {
      console.error("Failed to record ball", err);
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
    } catch (err) {
      console.error("Failed to undo", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
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

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-indigo-700 px-5 py-3 flex items-center justify-between z-10 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-white">Live Scorer</span>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              <span className="text-[10px] font-bold text-red-300 uppercase">LIVE</span>
            </div>
            {wsConnected ? <Wifi className="w-3.5 h-3.5 text-emerald-300" /> : <WifiOff className="w-3.5 h-3.5 text-amber-300" />}
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg transition">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Mini Scoreboard */}
        {state && inn && (
          <div className="bg-slate-800 px-5 py-3 text-white flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400">{inn.battingTeamName} — Innings {inningsNumber}</div>
              <div className="text-2xl font-extrabold">
                {inn.totalRuns}/{inn.totalWickets}
                <span className="text-xs text-slate-400 font-normal ml-2">({inn.totalOvers} ov)</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400">CRR: {inn.runRate}</div>
              {state.target && inningsNumber === 2 && (
                <div className="text-xs text-amber-400">Need {state.target - inn.totalRuns}</div>
              )}
            </div>
          </div>
        )}

        {/* This Over */}
        {inn && inn.thisOver.length > 0 && (
          <div className="px-5 py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-2 flex-wrap">
            <span className="text-[10px] text-slate-400 font-semibold uppercase mr-1">This Over:</span>
            {inn.thisOver.map((ball, i) => (
              <span key={i} className={`w-7 h-7 flex items-center justify-center rounded-full text-[10px] font-bold ${ballColor(ball)}`}>
                {ball}
              </span>
            ))}
          </div>
        )}

        <div className="p-5 space-y-4">
          {/* Innings Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-semibold">Innings:</span>
            {[1, 2].map((n) => (
              <button
                key={n}
                onClick={() => setInningsNumber(n)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  inningsNumber === n ? "bg-indigo-100 text-indigo-700" : "text-slate-500 hover:bg-slate-100"
                }`}
              >
                {n}
              </button>
            ))}
          </div>

          {/* Player Selectors */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-slate-400 font-semibold uppercase">Striker</label>
              <select value={batsmanId} onChange={(e) => setBatsmanId(Number(e.target.value))}
                className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs mt-1 outline-none focus:border-indigo-400">
                <option value={0}>Select batter...</option>
                {battingTeamPlayers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-semibold uppercase">Non-Striker</label>
              <select value={nonStrikerId} onChange={(e) => setNonStrikerId(Number(e.target.value))}
                className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs mt-1 outline-none focus:border-indigo-400">
                <option value={0}>Select batter...</option>
                {battingTeamPlayers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-[10px] text-slate-400 font-semibold uppercase">Bowler</label>
            <select value={bowlerId} onChange={(e) => setBowlerId(Number(e.target.value))}
              className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs mt-1 outline-none focus:border-indigo-400">
              <option value={0}>Select bowler...</option>
              {bowlingTeamPlayers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          {/* Run Buttons */}
          <div>
            <div className="text-[10px] text-slate-400 font-semibold uppercase mb-2">Runs</div>
            <div className="grid grid-cols-7 gap-2">
              {[0, 1, 2, 3, 4, 5, 6].map((r) => (
                <button
                  key={r}
                  onClick={() => recordBall(r, {
                    isBoundary: r === 4,
                    isSix: r === 6,
                  })}
                  disabled={saving || !batsmanId || !bowlerId}
                  className={`py-3 rounded-xl text-sm font-bold transition hover:scale-105 active:scale-95 disabled:opacity-40 ${
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
              className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold hover:text-slate-700 transition"
            >
              Extras {showExtras ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            {showExtras && (
              <div className="grid grid-cols-4 gap-2 mt-2">
                <button
                  onClick={() => recordBall(0, { extrasType: "WIDE", extrasRuns: 1 })}
                  disabled={saving || !batsmanId || !bowlerId}
                  className="py-2.5 rounded-xl text-xs font-bold bg-amber-100 text-amber-700 hover:bg-amber-200 transition disabled:opacity-40"
                >
                  Wide
                </button>
                <button
                  onClick={() => recordBall(0, { extrasType: "NO_BALL", extrasRuns: 1 })}
                  disabled={saving || !batsmanId || !bowlerId}
                  className="py-2.5 rounded-xl text-xs font-bold bg-amber-100 text-amber-700 hover:bg-amber-200 transition disabled:opacity-40"
                >
                  No Ball
                </button>
                <button
                  onClick={() => recordBall(0, { extrasType: "BYE", extrasRuns: 1 })}
                  disabled={saving || !batsmanId || !bowlerId}
                  className="py-2.5 rounded-xl text-xs font-bold bg-amber-100 text-amber-700 hover:bg-amber-200 transition disabled:opacity-40"
                >
                  Bye
                </button>
                <button
                  onClick={() => recordBall(0, { extrasType: "LEG_BYE", extrasRuns: 1 })}
                  disabled={saving || !batsmanId || !bowlerId}
                  className="py-2.5 rounded-xl text-xs font-bold bg-amber-100 text-amber-700 hover:bg-amber-200 transition disabled:opacity-40"
                >
                  Leg Bye
                </button>
              </div>
            )}
          </div>

          {/* Wicket Toggle */}
          <div>
            <button
              onClick={() => setShowWicketPanel(!showWicketPanel)}
              className={`w-full py-3 rounded-xl text-sm font-bold transition ${
                showWicketPanel ? "bg-red-600 text-white" : "bg-red-100 text-red-700 hover:bg-red-200"
              }`}
            >
              Wicket
            </button>
            {showWicketPanel && (
              <div className="mt-3 space-y-3 bg-red-50 rounded-xl p-4 border border-red-100">
                <div>
                  <label className="text-[10px] text-red-400 font-semibold uppercase">Dismissal Type</label>
                  <select value={dismissalType} onChange={(e) => setDismissalType(e.target.value)}
                    className="w-full border border-red-200 rounded-lg px-2 py-1.5 text-xs mt-1 outline-none focus:border-red-400">
                    {["BOWLED", "CAUGHT", "LBW", "RUN_OUT", "STUMPED", "HIT_WICKET", "CAUGHT_AND_BOWLED", "RETIRED_HURT"].map((d) => (
                      <option key={d} value={d}>{d.replace(/_/g, " ")}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-red-400 font-semibold uppercase">Dismissed Player</label>
                  <select value={dismissedPlayerId} onChange={(e) => setDismissedPlayerId(Number(e.target.value))}
                    className="w-full border border-red-200 rounded-lg px-2 py-1.5 text-xs mt-1 outline-none focus:border-red-400">
                    <option value={0}>Select player...</option>
                    {battingTeamPlayers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                {(dismissalType === "CAUGHT" || dismissalType === "RUN_OUT" || dismissalType === "STUMPED") && (
                  <div>
                    <label className="text-[10px] text-red-400 font-semibold uppercase">Fielder</label>
                    <select value={fielderId} onChange={(e) => setFielderId(Number(e.target.value))}
                      className="w-full border border-red-200 rounded-lg px-2 py-1.5 text-xs mt-1 outline-none focus:border-red-400">
                      <option value={0}>Select fielder...</option>
                      {bowlingTeamPlayers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                )}
                <button
                  onClick={() => recordBall(0, {
                    isWicket: true,
                    dismissalType,
                    dismissedPlayerId: dismissedPlayerId || batsmanId,
                    fielderId: fielderId || undefined,
                  })}
                  disabled={saving || !batsmanId || !bowlerId}
                  className="w-full py-2.5 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-40"
                >
                  {saving ? "Recording..." : "Confirm Wicket"}
                </button>
              </div>
            )}
          </div>

          {/* Undo */}
          <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
            <button
              onClick={handleUndo}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-500 bg-slate-100 rounded-xl hover:bg-slate-200 transition disabled:opacity-40"
            >
              <Undo2 className="w-3.5 h-3.5" />
              Undo Last Ball
            </button>
            <button
              onClick={() => {
                const temp = batsmanId;
                setBatsmanId(nonStrikerId);
                setNonStrikerId(temp);
              }}
              className="px-4 py-2 text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition"
            >
              Swap Batsmen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ballColor(ball: string): string {
  if (ball === "W") return "bg-red-100 text-red-700";
  if (ball === "4") return "bg-emerald-100 text-emerald-700";
  if (ball === "6") return "bg-purple-100 text-purple-700";
  if (ball.includes("wd") || ball.includes("nb")) return "bg-amber-100 text-amber-700";
  if (ball === "0") return "bg-slate-100 text-slate-400";
  return "bg-blue-100 text-blue-700";
}
