import { useState, useEffect } from "react";
import { X, Loader2, Wifi, WifiOff } from "lucide-react";
import { tournamentService, type LiveMatchStateData } from "../../../services/tournamentService";
import { stompClient } from "../../../services/stompClient";

interface LiveMatchViewProps {
  matchId: number;
  onClose: () => void;
}

export function LiveMatchView({ matchId, onClose }: LiveMatchViewProps) {
  const [state, setState] = useState<LiveMatchStateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);

  useEffect(() => {
    tournamentService.getLiveMatchState(matchId)
      .then(setState)
      .catch(() => {})
      .finally(() => setLoading(false));

    const unsub = stompClient.subscribe(`/topic/match/${matchId}/state`, (body) => {
      setState(body as LiveMatchStateData);
      setWsConnected(true);
    });

    const unsubConnect = stompClient.onConnect(() => setWsConnected(true));

    return () => {
      unsub();
      unsubConnect();
    };
  }, [matchId]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!state) return null;

  const inn = state.currentInnings === 1 ? state.innings1 : state.innings2;
  const otherInn = state.currentInnings === 1 ? state.innings2 : state.innings1;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4 flex items-center justify-between z-10 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-bold text-red-400 uppercase tracking-wider">LIVE</span>
            </div>
            {wsConnected ? (
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-amber-400" />
            )}
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg transition">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Scoreboard */}
        <div className="bg-gradient-to-b from-slate-800 to-slate-700 px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-sm font-bold" style={{ color: state.teamAColor }}>{state.teamAName}</div>
              <div className="text-3xl font-extrabold mt-1">
                {state.innings1.totalRuns}/{state.innings1.totalWickets}
                <span className="text-sm font-normal text-slate-400 ml-2">({state.innings1.totalOvers} ov)</span>
              </div>
            </div>
            <div className="text-xs font-bold text-slate-500 px-4">VS</div>
            <div className="flex-1 text-right">
              <div className="text-sm font-bold" style={{ color: state.teamBColor }}>{state.teamBName}</div>
              <div className="text-3xl font-extrabold mt-1">
                {state.innings2.totalRuns}/{state.innings2.totalWickets}
                <span className="text-sm font-normal text-slate-400 ml-2">({state.innings2.totalOvers} ov)</span>
              </div>
            </div>
          </div>

          {state.target && state.currentInnings === 2 && (
            <div className="mt-3 text-center">
              <span className="text-xs bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full font-semibold">
                Need {state.target - state.innings2.totalRuns} runs from {remainingBalls(state.innings2.totalOvers)} balls
              </span>
            </div>
          )}

          <div className="mt-3 flex items-center justify-center gap-4 text-xs text-slate-400">
            <span>CRR: {inn.runRate}</span>
            {state.target && state.currentInnings === 2 && (
              <span>RRR: {requiredRunRate(state.target, state.innings2.totalRuns, state.innings2.totalOvers)}</span>
            )}
          </div>
        </div>

        {/* This Over */}
        {inn.thisOver.length > 0 && (
          <div className="px-6 py-3 bg-slate-50 border-b border-slate-100">
            <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-2">This Over</div>
            <div className="flex items-center gap-2 flex-wrap">
              {inn.thisOver.map((ball, i) => (
                <span
                  key={i}
                  className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold ${ballColor(ball)}`}
                >
                  {ball}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="p-6 space-y-5">
          {/* Current Batters */}
          {inn.batters.filter(b => !b.isOut).length > 0 && (
            <div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-2">At the Crease</div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400">
                      <th className="text-left py-2 font-semibold">Batter</th>
                      <th className="text-right py-2 px-1 font-semibold">R</th>
                      <th className="text-right py-2 px-1 font-semibold">B</th>
                      <th className="text-right py-2 px-1 font-semibold">4s</th>
                      <th className="text-right py-2 px-1 font-semibold">6s</th>
                      <th className="text-right py-2 px-1 font-semibold">SR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inn.batters.filter(b => !b.isOut).map((b) => (
                      <tr key={b.playerId} className="border-b border-slate-50">
                        <td className="py-2 font-semibold text-slate-800">
                          {b.playerName}
                          {b.playerId === state.batsmanOnStrikeId && (
                            <span className="ml-1 text-[10px] text-indigo-500 font-bold">*</span>
                          )}
                        </td>
                        <td className="text-right py-2 px-1 font-bold text-slate-800">{b.runs}</td>
                        <td className="text-right py-2 px-1 text-slate-500">{b.balls}</td>
                        <td className="text-right py-2 px-1 text-slate-500">{b.fours}</td>
                        <td className="text-right py-2 px-1 text-slate-500">{b.sixes}</td>
                        <td className="text-right py-2 px-1 text-slate-500">{b.strikeRate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Current Bowler */}
          {inn.bowlers.length > 0 && (
            <div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-2">Bowling</div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400">
                      <th className="text-left py-2 font-semibold">Bowler</th>
                      <th className="text-right py-2 px-1 font-semibold">O</th>
                      <th className="text-right py-2 px-1 font-semibold">R</th>
                      <th className="text-right py-2 px-1 font-semibold">W</th>
                      <th className="text-right py-2 px-1 font-semibold">Econ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inn.bowlers.map((b) => (
                      <tr key={b.playerId} className={`border-b border-slate-50 ${b.playerId === state.currentBowlerId ? "bg-indigo-50/40" : ""}`}>
                        <td className="py-2 font-semibold text-slate-800">{b.playerName}</td>
                        <td className="text-right py-2 px-1 text-slate-500">{b.overs}</td>
                        <td className="text-right py-2 px-1 text-slate-500">{b.runs}</td>
                        <td className="text-right py-2 px-1 font-bold text-slate-800">{b.wickets}</td>
                        <td className="text-right py-2 px-1 text-slate-500">{b.economy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Recent Balls */}
          {state.recentBalls.length > 0 && (
            <div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-2">Ball-by-Ball</div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {[...state.recentBalls].reverse().map((b) => (
                  <div key={b.id} className="flex items-center gap-2 text-xs text-slate-600 py-1 border-b border-slate-50">
                    <span className="text-slate-400 w-10 shrink-0">{b.overNumber}.{b.ballNumber}</span>
                    <span className="font-semibold text-slate-700">{b.bowlerName}</span>
                    <span className="text-slate-400">to</span>
                    <span className="font-semibold text-slate-700">{b.batsmanName}</span>
                    <span className="ml-auto">
                      {b.isWicket ? (
                        <span className="text-red-600 font-bold">W</span>
                      ) : b.extrasType ? (
                        <span className="text-amber-600">{b.extrasRuns}{b.extrasType === "WIDE" ? "wd" : b.extrasType === "NO_BALL" ? "nb" : "b"}</span>
                      ) : (
                        <span className={`font-bold ${b.isSix ? "text-purple-600" : b.isBoundary ? "text-emerald-600" : "text-slate-700"}`}>{b.runsScored}</span>
                      )}
                    </span>
                    {b.commentary && <span className="text-slate-400 text-[10px] truncate max-w-[120px]">{b.commentary}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dismissed Batters */}
          {inn.batters.filter(b => b.isOut).length > 0 && (
            <div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-2">Dismissed</div>
              <div className="space-y-1">
                {inn.batters.filter(b => b.isOut).map((b) => (
                  <div key={b.playerId} className="flex items-center justify-between text-xs py-1">
                    <span className="text-slate-500">{b.playerName} <span className="italic text-slate-400">{b.dismissalText}</span></span>
                    <span className="font-bold text-slate-700">{b.runs} ({b.balls})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
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

function remainingBalls(currentOvers: string): number {
  const parts = currentOvers.split(".");
  const overs = parseInt(parts[0]) || 0;
  const balls = parseInt(parts[1]) || 0;
  const bowled = overs * 6 + balls;
  return Math.max(0, 120 - bowled);
}

function requiredRunRate(target: number, currentRuns: number, currentOvers: string): string {
  const remaining = remainingBalls(currentOvers);
  if (remaining <= 0) return "-";
  const needed = target - currentRuns;
  if (needed <= 0) return "0.00";
  const oversRemaining = remaining / 6;
  return (needed / oversRemaining).toFixed(2);
}
