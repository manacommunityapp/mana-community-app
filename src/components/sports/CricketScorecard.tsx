import React from 'react';
import type { Innings, BattingEntry, BowlingEntry } from '../../types/sports-enhanced';

// ── Batting table ──────────────────────────────────────────────────────────
function BattingTable({ entries }: { entries: BattingEntry[] }) {
  const topScorer = entries.reduce(
    (a, b) => (a.runs > b.runs ? a : b),
    entries[0],
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
            <th className="px-3 py-2 text-left w-40">Batter</th>
            <th className="px-3 py-2 text-center">Dismissal</th>
            <th className="px-3 py-2 text-center w-10">R</th>
            <th className="px-3 py-2 text-center w-10">B</th>
            <th className="px-3 py-2 text-center w-10">4s</th>
            <th className="px-3 py-2 text-center w-10">6s</th>
            <th className="px-3 py-2 text-center w-14">SR</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {entries.map((e) => {
            const isTop = topScorer && e.id === topScorer.id;
            return (
              <tr
                key={e.id}
                className={isTop ? 'bg-amber-50' : 'hover:bg-gray-50'}
              >
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1">
                    {isTop && <span title="Top scorer">⭐</span>}
                    <span className={`font-medium ${isTop ? 'text-amber-700' : 'text-gray-900'}`}>
                      {e.playerName}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-2 text-center text-gray-500 text-xs">{e.dismissal}</td>
                <td className={`px-3 py-2 text-center font-bold ${e.runs >= 50 ? 'text-amber-600' : 'text-gray-900'}`}>
                  {e.runs}{e.isNotOut ? '*' : ''}
                </td>
                <td className="px-3 py-2 text-center text-gray-700">{e.balls}</td>
                <td className="px-3 py-2 text-center text-gray-700">{e.fours}</td>
                <td className="px-3 py-2 text-center text-gray-700">{e.sixes}</td>
                <td className="px-3 py-2 text-center text-gray-500">{e.strikeRate.toFixed(1)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Bowling table ──────────────────────────────────────────────────────────
function BowlingTable({ entries }: { entries: BowlingEntry[] }) {
  const best = entries.reduce(
    (a, b) =>
      a.wickets > b.wickets || (a.wickets === b.wickets && a.runs < b.runs) ? a : b,
    entries[0],
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
            <th className="px-3 py-2 text-left w-40">Bowler</th>
            <th className="px-3 py-2 text-center w-10">O</th>
            <th className="px-3 py-2 text-center w-10">M</th>
            <th className="px-3 py-2 text-center w-10">R</th>
            <th className="px-3 py-2 text-center w-10">W</th>
            <th className="px-3 py-2 text-center w-14">Eco</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {entries.map((e) => {
            const isBest = best && e.id === best.id && e.wickets > 0;
            return (
              <tr key={e.id} className={isBest ? 'bg-amber-50' : 'hover:bg-gray-50'}>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1">
                    {isBest && <span title="Best figures">⭐</span>}
                    <span className={`font-medium ${isBest ? 'text-amber-700' : 'text-gray-900'}`}>
                      {e.playerName}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-2 text-center text-gray-700">{e.overs}</td>
                <td className="px-3 py-2 text-center text-gray-700">{e.maidens}</td>
                <td className="px-3 py-2 text-center text-gray-700">{e.runs}</td>
                <td className={`px-3 py-2 text-center font-bold ${e.wickets >= 3 ? 'text-amber-600' : 'text-gray-900'}`}>
                  {e.wickets}
                </td>
                <td className="px-3 py-2 text-center text-gray-500">{e.economy.toFixed(1)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Innings card ───────────────────────────────────────────────────────────
function InningsCard({ innings, label }: { innings: Innings; label: string }) {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-indigo-900 px-4 py-3 flex justify-between items-center">
        <div>
          <p className="text-xs text-indigo-300 font-semibold uppercase tracking-wide">{label}</p>
          <p className="text-white font-bold text-base">{innings.battingTeamName}</p>
        </div>
        <div className="text-right">
          <p className="text-white font-black text-2xl">
            {innings.totalRuns}/{innings.wickets}
          </p>
          <p className="text-indigo-300 text-sm">({innings.overs} ov)</p>
        </div>
      </div>

      {innings.extras > 0 && (
        <p className="px-4 py-1 text-xs text-gray-500 bg-gray-50 border-b border-gray-100">
          Extras: {innings.extras}
        </p>
      )}

      {/* Batting */}
      <div>
        <p className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50 border-b border-gray-100">
          Batting
        </p>
        <BattingTable entries={innings.batting} />
      </div>

      {/* Bowling */}
      {innings.bowling.length > 0 && (
        <div className="border-t border-gray-200">
          <p className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50 border-b border-gray-100">
            Bowling
          </p>
          <BowlingTable entries={innings.bowling} />
        </div>
      )}
    </div>
  );
}

// ── Public export ──────────────────────────────────────────────────────────
interface CricketScorecardProps {
  scorecard: import('../../types/sports-enhanced').CricketScorecard;
}

export function CricketScorecard({ scorecard }: CricketScorecardProps) {
  const handleShare = () => {
    const first  = scorecard.firstInnings;
    const second = scorecard.secondInnings;
    const text = [
      `🏏 ${scorecard.matchTitle}`,
      '',
      `${first.battingTeamName}: ${first.totalRuns}/${first.wickets} (${first.overs} ov)`,
      second ? `${second.battingTeamName}: ${second.totalRuns}/${second.wickets} (${second.overs} ov)` : '',
      '',
      scorecard.result ?? '',
      scorecard.manOfMatch ? `⭐ MOM: ${scorecard.manOfMatch.playerName}` : '',
    ].filter(Boolean).join('\n');
    navigator.clipboard?.writeText(text).catch(() => {});
  };

  return (
    <div className="space-y-4">
      {/* Result banner */}
      {scorecard.result && (
        <div className="bg-indigo-900 text-white rounded-xl p-4 text-center">
          <p className="text-2xl mb-1">🏆</p>
          <p className="font-bold text-lg">{scorecard.result}</p>
        </div>
      )}

      {/* Man of the Match */}
      {scorecard.manOfMatch && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <span className="text-3xl">⭐</span>
          <div>
            <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">Man of the Match</p>
            <p className="font-bold text-amber-900 text-base">{scorecard.manOfMatch.playerName}</p>
            {scorecard.manOfMatch.contribution && (
              <p className="text-sm text-amber-700">{scorecard.manOfMatch.contribution}</p>
            )}
          </div>
          <button
            onClick={handleShare}
            className="ml-auto text-xs text-indigo-600 hover:text-indigo-800 border border-indigo-200 rounded-lg px-3 py-1.5"
          >
            📋 Copy result
          </button>
        </div>
      )}

      {/* Innings */}
      <InningsCard innings={scorecard.firstInnings} label="1st Innings" />
      {scorecard.secondInnings && (
        <InningsCard innings={scorecard.secondInnings} label="2nd Innings" />
      )}
    </div>
  );
}
