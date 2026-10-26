import React from 'react';
import type { LeaderboardEntry } from '../../types/sports-enhanced';
import { BadgeCard } from './BadgeCard';

const MEDALS = ['🥇', '🥈', '🥉'];

interface LeaderboardTableProps {
  entries:    LeaderboardEntry[];
  isLoading?: boolean;
  onRowClick: (userId: number) => void;
}

export function LeaderboardTable({ entries, isLoading, onRowClick }: LeaderboardTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-4xl mb-3">🏆</p>
        <p className="text-gray-500">No data yet. Play some matches to appear here!</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wide">
            <th className="px-4 py-3 text-center w-12">#</th>
            <th className="px-4 py-3 text-left">Player</th>
            <th className="px-4 py-3 text-center hidden md:table-cell">Badge</th>
            <th className="px-4 py-3 text-right">Score</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {entries.map((entry) => (
            <tr
              key={entry.userId}
              onClick={() => onRowClick(entry.userId)}
              className={[
                'cursor-pointer transition-colors hover:bg-indigo-50',
                entry.isCurrentUser ? 'bg-indigo-50' : 'bg-white',
              ].join(' ')}
            >
              {/* Rank */}
              <td className="px-4 py-3 text-center">
                {entry.rank <= 3 ? (
                  <span className="text-xl">{MEDALS[entry.rank - 1]}</span>
                ) : (
                  <span className="text-sm font-bold text-gray-400">{entry.rank}</span>
                )}
              </td>

              {/* Player */}
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${
                      entry.rank <= 3 ? 'bg-indigo-600' : 'bg-indigo-400'
                    }`}
                  >
                    {entry.name[0]}
                  </div>
                  <div>
                    <p className={`font-semibold text-sm ${entry.isCurrentUser ? 'text-indigo-700' : 'text-gray-900'}`}>
                      {entry.name}
                      {entry.isCurrentUser && (
                        <span className="ml-1 text-xs text-indigo-500">(You)</span>
                      )}
                    </p>
                    {entry.flatNo && (
                      <p className="text-xs text-gray-400">🏠 {entry.flatNo}</p>
                    )}
                  </div>
                </div>
              </td>

              {/* Badge */}
              <td className="px-4 py-3 text-center hidden md:table-cell">
                {entry.topBadge ? (
                  <BadgeCard badge={entry.topBadge} size="sm" />
                ) : (
                  <span className="text-gray-300 text-xs">—</span>
                )}
              </td>

              {/* Value */}
              <td className="px-4 py-3 text-right">
                <span className={`font-black text-base ${entry.rank === 1 ? 'text-amber-600' : 'text-gray-900'}`}>
                  {entry.displayValue}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
