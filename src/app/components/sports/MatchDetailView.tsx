import { useState, useEffect } from "react";
import { X, Loader2, Trophy, ChevronDown, ChevronUp } from "lucide-react";
import { tournamentService, type MatchDetailData, type InningsDetailData } from "../../../services/tournamentService";

interface MatchDetailViewProps {
  matchId: number;
  onClose: () => void;
}

function ScorecardTable({ innings, index }: { innings: InningsDetailData; index: number }) {
  const [expanded, setExpanded] = useState(index === 0);

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition text-left"
      >
        <div>
          <span className="text-sm font-bold text-slate-800">{innings.battingTeamName}</span>
          <span className="text-sm text-slate-500 ml-2">
            {innings.totalRuns}/{innings.totalWickets} ({innings.totalOvers} ov)
          </span>
          {innings.target != null && (
            <span className="text-xs text-slate-400 ml-2">Target: {innings.target}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">RR: {innings.runRate}</span>
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {expanded && (
        <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
          {/* Batting */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="text-left py-2 pr-2 font-semibold">Batter</th>
                  <th className="text-right py-2 px-1 font-semibold">R</th>
                  <th className="text-right py-2 px-1 font-semibold">B</th>
                  <th className="text-right py-2 px-1 font-semibold">4s</th>
                  <th className="text-right py-2 px-1 font-semibold">6s</th>
                  <th className="text-right py-2 px-1 font-semibold">SR</th>
                  <th className="text-left py-2 pl-2 font-semibold">Dismissal</th>
                </tr>
              </thead>
              <tbody>
                {innings.batting.map((b) => (
                  <tr key={b.playerId} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="py-1.5 pr-2 font-semibold text-slate-800">{b.playerName}</td>
                    <td className="text-right py-1.5 px-1 font-bold text-slate-800">{b.runsScored}</td>
                    <td className="text-right py-1.5 px-1 text-slate-500">{b.ballsFaced}</td>
                    <td className="text-right py-1.5 px-1 text-slate-500">{b.fours}</td>
                    <td className="text-right py-1.5 px-1 text-slate-500">{b.sixes}</td>
                    <td className="text-right py-1.5 px-1 text-slate-500">{b.strikeRate}</td>
                    <td className="py-1.5 pl-2 text-slate-400 italic text-[10px]">
                      {b.dismissalType
                        ? `${b.dismissalType.toLowerCase().replace("_", " ")}${b.dismissedBy ? ` b ${b.dismissedBy}` : ""}${b.fielder ? ` c ${b.fielder}` : ""}`
                        : "not out"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Extras */}
          {innings.extras > 0 && (
            <div className="text-xs text-slate-500">
              <span className="font-semibold">Extras:</span> {innings.extras}
              {innings.extrasDetail && <span className="ml-1 text-slate-400">({innings.extrasDetail})</span>}
            </div>
          )}

          {/* Bowling */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="text-left py-2 pr-2 font-semibold">Bowler</th>
                  <th className="text-right py-2 px-1 font-semibold">O</th>
                  <th className="text-right py-2 px-1 font-semibold">M</th>
                  <th className="text-right py-2 px-1 font-semibold">R</th>
                  <th className="text-right py-2 px-1 font-semibold">W</th>
                  <th className="text-right py-2 px-1 font-semibold">Econ</th>
                  <th className="text-right py-2 px-1 font-semibold">Dots</th>
                </tr>
              </thead>
              <tbody>
                {innings.bowling.map((b) => (
                  <tr key={b.playerId} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="py-1.5 pr-2 font-semibold text-slate-800">{b.playerName}</td>
                    <td className="text-right py-1.5 px-1 text-slate-500">{b.oversBowled}</td>
                    <td className="text-right py-1.5 px-1 text-slate-500">{b.maidens}</td>
                    <td className="text-right py-1.5 px-1 text-slate-500">{b.runsConceded}</td>
                    <td className="text-right py-1.5 px-1 font-bold text-slate-800">{b.wicketsTaken}</td>
                    <td className="text-right py-1.5 px-1 text-slate-500">{b.economyRate}</td>
                    <td className="text-right py-1.5 px-1 text-slate-400">{b.dotBalls}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Fall of Wickets */}
          {innings.fallOfWickets && (
            <div className="text-[10px] text-slate-400">
              <span className="font-semibold text-slate-500">Fall of Wickets:</span> {innings.fallOfWickets}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function MatchDetailView({ matchId, onClose }: MatchDetailViewProps) {
  const [detail, setDetail] = useState<MatchDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    tournamentService.getMatchDetail(matchId)
      .then(setDetail)
      .catch((e) => setError(e?.message || "Failed to load match details"))
      .finally(() => setLoading(false));
  }, [matchId]);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between z-10 rounded-t-2xl">
          <h2 className="text-base sm:text-lg font-bold text-slate-800">Match Details</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        )}

        {error && (
          <div className="p-6 text-center">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}

        {detail && !loading && (
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            {/* Match Header */}
            <div className="text-center space-y-2">
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                {detail.roundName} &middot; Match #{detail.matchNumber}
              </div>

              <div className="flex items-center justify-center gap-4">
                <div className="text-right flex-1">
                  <div className="text-sm font-bold" style={{ color: detail.teamA.color }}>{detail.teamA.name}</div>
                  {detail.scoreTeamA && (
                    <div className="text-xl sm:text-2xl font-bold text-slate-800 mt-1">{detail.scoreTeamA}</div>
                  )}
                </div>
                <div className="text-xs font-bold text-slate-300 px-3">VS</div>
                <div className="text-left flex-1">
                  <div className="text-sm font-bold" style={{ color: detail.teamB.color }}>{detail.teamB.name}</div>
                  {detail.scoreTeamB && (
                    <div className="text-xl sm:text-2xl font-bold text-slate-800 mt-1">{detail.scoreTeamB}</div>
                  )}
                </div>
              </div>

              {detail.winnerName && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-100">
                  <Trophy className="w-3 h-3" />
                  {detail.winnerName} won
                  {detail.winMargin && ` by ${detail.winMargin}`}
                </div>
              )}

              {detail.matchSummary && (
                <p className="text-xs text-slate-500 mt-1">{detail.matchSummary}</p>
              )}
            </div>

            {/* Match Info Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {detail.tossWinnerName && (
                <div className="bg-slate-50 rounded-xl px-3 py-2 border border-slate-100">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">Toss</div>
                  <div className="text-xs text-slate-700 font-semibold mt-0.5">
                    {detail.tossWinnerName} — {detail.tossDecision}
                  </div>
                </div>
              )}
              {detail.manOfMatch && (
                <div className="bg-amber-50 rounded-xl px-3 py-2 border border-amber-100">
                  <div className="text-[10px] text-amber-500 font-semibold uppercase">Man of Match</div>
                  <div className="text-xs text-amber-800 font-semibold mt-0.5">{detail.manOfMatch.name}</div>
                  <div className="text-[10px] text-amber-400">{detail.manOfMatch.teamName}</div>
                </div>
              )}
              {detail.venueName && (
                <div className="bg-slate-50 rounded-xl px-3 py-2 border border-slate-100">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">Venue</div>
                  <div className="text-xs text-slate-700 font-semibold mt-0.5">{detail.venueName}</div>
                  {detail.courtName && <div className="text-[10px] text-slate-400">{detail.courtName}</div>}
                </div>
              )}
              {detail.umpires && (
                <div className="bg-slate-50 rounded-xl px-3 py-2 border border-slate-100">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">Umpires</div>
                  <div className="text-xs text-slate-700 font-semibold mt-0.5">{detail.umpires}</div>
                </div>
              )}
            </div>

            {/* Scorecards */}
            {detail.innings && detail.innings.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Scorecard</h3>
                {detail.innings.map((inn, i) => (
                  <ScorecardTable key={i} innings={inn} index={i} />
                ))}
              </div>
            )}

            {/* Top Performers */}
            {((detail.topRunScorers && detail.topRunScorers.length > 0) ||
              (detail.topWicketTakers && detail.topWicketTakers.length > 0)) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {detail.topRunScorers && detail.topRunScorers.length > 0 && (
                  <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                    <h4 className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-2">Top Run Scorers</h4>
                    <div className="space-y-1.5">
                      {detail.topRunScorers.slice(0, 3).map((p, i) => (
                        <div key={p.playerId} className="flex items-center justify-between">
                          <span className="text-xs text-slate-700">
                            <span className="font-bold text-orange-500 mr-1.5">#{i + 1}</span>
                            {p.playerName}
                          </span>
                          <span className="text-xs font-bold text-slate-800">{p.totalRuns} runs</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {detail.topWicketTakers && detail.topWicketTakers.length > 0 && (
                  <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                    <h4 className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-2">Top Wicket Takers</h4>
                    <div className="space-y-1.5">
                      {detail.topWicketTakers.slice(0, 3).map((p, i) => (
                        <div key={p.playerId} className="flex items-center justify-between">
                          <span className="text-xs text-slate-700">
                            <span className="font-bold text-purple-500 mr-1.5">#{i + 1}</span>
                            {p.playerName}
                          </span>
                          <span className="text-xs font-bold text-slate-800">{p.totalWickets} wkts</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* No scorecard data */}
            {(!detail.innings || detail.innings.length === 0) && (
              <div className="text-center py-8 text-sm text-slate-400">
                No scorecard data recorded for this match yet.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
