import React, { useState, useEffect } from 'react';
import { LeaderboardTable } from '../../components/sports/LeaderboardTable';
import { sportsEnhancedService } from '../../services/sportsEnhancedService';
import type {
  LeaderboardEntry, LeaderboardCategory,
  LeaderboardPeriod, SportType,
} from '../../types/sports-enhanced';

const SPORT_OPTIONS: { value: SportType | 'ALL'; label: string }[] = [
  { value: 'ALL',          label: '🏅 Overall'    },
  { value: 'CRICKET',      label: '🏏 Cricket'    },
  { value: 'FOOTBALL',     label: '⚽ Football'   },
  { value: 'BADMINTON',    label: '🏸 Badminton'  },
  { value: 'TABLE_TENNIS', label: '🏓 Table Tennis'},
  { value: 'BASKETBALL',   label: '🏀 Basketball' },
];

const CATEGORIES: { value: LeaderboardCategory; label: string; desc: string }[] = [
  { value: 'WINS',          label: 'Most Wins',    desc: 'Total match wins'         },
  { value: 'MATCHES_PLAYED',label: 'Most Active',  desc: 'Matches played'           },
  { value: 'TROPHIES',      label: 'Trophies',     desc: 'Tournament wins'          },
  { value: 'RATING',        label: 'Top Rated',    desc: 'Avg peer rating'          },
  { value: 'RUNS',          label: 'Most Runs',    desc: 'Cricket total runs'       },
  { value: 'WICKETS',       label: 'Most Wickets', desc: 'Cricket total wickets'    },
  { value: 'GOALS',         label: 'Top Scorer',   desc: 'Football goals scored'    },
];

const PERIODS: { value: LeaderboardPeriod; label: string }[] = [
  { value: 'MONTH',    label: 'This Month' },
  { value: 'SEASON',   label: 'This Season'},
  { value: 'ALL_TIME', label: 'All Time'   },
];

export function SportsLeaderboard() {
  const [sport,    setSport]    = useState<SportType | 'ALL'>('ALL');
  const [category, setCategory] = useState<LeaderboardCategory>('WINS');
  const [period,   setPeriod]   = useState<LeaderboardPeriod>('ALL_TIME');
  const [entries,  setEntries]  = useState<LeaderboardEntry[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    setLoading(true);
    sportsEnhancedService
      .getLeaderboard(sport, category, period)
      .then(setEntries)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [sport, category, period]);

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-gray-900">🏆 Leaderboard</h1>
        <p className="text-gray-500 text-sm">Community sports rankings</p>
      </div>

      {/* Period tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={[
              'flex-1 py-2 text-sm font-semibold rounded-lg transition-all',
              period === p.value ? 'bg-white text-indigo-700 shadow' : 'text-gray-500 hover:text-gray-700',
            ].join(' ')}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Sport filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {SPORT_OPTIONS.map((s) => (
          <button
            key={s.value}
            onClick={() => setSport(s.value)}
            className={[
              'flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium border transition-all',
              sport === s.value
                ? 'bg-indigo-600 border-indigo-600 text-white'
                : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300',
            ].join(' ')}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            onClick={() => setCategory(c.value)}
            className={[
              'flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium border transition-all',
              category === c.value
                ? 'bg-indigo-100 border-indigo-300 text-indigo-700 font-semibold'
                : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300',
            ].join(' ')}
          >
            {c.label}
          </button>
        ))}
      </div>

      <p className="text-xs text-gray-400">
        {CATEGORIES.find((c) => c.value === category)?.desc}
      </p>

      {/* Table */}
      <LeaderboardTable
        entries={entries}
        isLoading={loading}
        onRowClick={(userId) => {
          window.location.href = `/sports/player/${userId}`;
        }}
      />
    </div>
  );
}
