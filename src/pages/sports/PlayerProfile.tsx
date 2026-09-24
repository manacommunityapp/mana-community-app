import React, { useState, useEffect } from 'react';
import { sportsEnhancedService } from '../../services/sportsEnhancedService';
import { BadgeGrid } from '../../components/sports/BadgeCard';
import type { PlayerProfile as IPlayerProfile, SportStat, SportType } from '../../types/sports-enhanced';
import { format } from 'date-fns';

const SPORT_EMOJI: Record<SportType | string, string> = {
  CRICKET: '🏏', FOOTBALL: '⚽', BADMINTON: '🏸', TABLE_TENNIS: '🏓',
  BASKETBALL: '🏀', VOLLEYBALL: '🏐', CHESS: '♟️', CARROM: '🎯',
};

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= Math.round(value) ? 'text-amber-400' : 'text-gray-200'}>★</span>
      ))}
      <span className="text-sm text-gray-500 ml-1">{value.toFixed(1)}</span>
    </div>
  );
}

function SportStatCard({ stat }: { stat: SportStat }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <button
      onClick={() => setExpanded(!expanded)}
      className="w-full text-left border border-gray-200 rounded-xl p-4 hover:border-indigo-200 transition-colors"
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{SPORT_EMOJI[stat.sport] ?? '🏅'}</span>
        <div className="flex-1">
          <p className="font-bold text-gray-900">{stat.sport.replace('_', ' ')}</p>
          <p className="text-xs text-gray-500">{(stat.winRate * 100).toFixed(0)}% win rate</p>
        </div>
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <span className="text-emerald-600">{stat.wins}W</span>
          <span className="text-gray-300">/</span>
          <span className="text-red-500">{stat.losses}L</span>
          {stat.draws > 0 && <><span className="text-gray-300">/</span><span className="text-gray-500">{stat.draws}D</span></>}
        </div>
        <span className="text-gray-400 text-sm">{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
          {/* General stats */}
          <div className="grid grid-cols-3 gap-3 bg-gray-50 rounded-xl p-3">
            {[
              { label: 'Matches', value: stat.matchesPlayed },
              { label: 'Tournaments', value: stat.tournaments },
              { label: 'Trophies', value: stat.trophies },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <p className="text-xl font-black text-gray-900">{value}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            ))}
          </div>

          {/* Cricket specifics */}
          {stat.sport === 'CRICKET' && (
            <div className="space-y-2">
              {stat.totalRuns != null && (
                <div className="grid grid-cols-3 gap-3 bg-indigo-50 rounded-xl p-3">
                  <div className="text-center"><p className="text-xl font-black text-indigo-900">{stat.totalRuns}</p><p className="text-xs text-indigo-600">Runs</p></div>
                  <div className="text-center"><p className="text-xl font-black text-indigo-900">{stat.highestScore ?? 0}</p><p className="text-xs text-indigo-600">Highest</p></div>
                  <div className="text-center"><p className="text-xl font-black text-indigo-900">{stat.battingAverage?.toFixed(1) ?? '—'}</p><p className="text-xs text-indigo-600">Avg</p></div>
                </div>
              )}
              {stat.totalWickets != null && (
                <div className="grid grid-cols-2 gap-3 bg-purple-50 rounded-xl p-3">
                  <div className="text-center"><p className="text-xl font-black text-purple-900">{stat.totalWickets}</p><p className="text-xs text-purple-600">Wickets</p></div>
                  <div className="text-center"><p className="text-xl font-black text-purple-900">{stat.bestBowling ?? '—'}</p><p className="text-xs text-purple-600">Best</p></div>
                </div>
              )}
            </div>
          )}

          {/* Football specifics */}
          {stat.sport === 'FOOTBALL' && stat.goals != null && (
            <div className="grid grid-cols-2 gap-3 bg-emerald-50 rounded-xl p-3">
              <div className="text-center"><p className="text-xl font-black text-emerald-900">{stat.goals}</p><p className="text-xs text-emerald-600">Goals</p></div>
              <div className="text-center"><p className="text-xl font-black text-emerald-900">{stat.assists ?? 0}</p><p className="text-xs text-emerald-600">Assists</p></div>
            </div>
          )}
        </div>
      )}
    </button>
  );
}

interface Props {
  userId: number;
}

export function PlayerProfile({ userId }: Props) {
  const [profile, setProfile] = useState<IPlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState<'stats' | 'badges' | 'matches'>('stats');

  useEffect(() => {
    sportsEnhancedService
      .getPlayerProfile(userId)
      .then(setProfile)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-4 space-y-4 animate-pulse">
        <div className="h-24 bg-gray-100 rounded-2xl" />
        <div className="h-12 bg-gray-100 rounded-xl" />
        <div className="h-64 bg-gray-100 rounded-xl" />
      </div>
    );
  }

  if (!profile) return <div className="p-8 text-center text-gray-500">Player not found.</div>;

  const earnedBadges = profile.badges.filter((b) => b.isEarned)
    .sort((a, b) => ['legendary', 'epic', 'rare', 'common'].indexOf(a.rarity) - ['legendary', 'epic', 'rare', 'common'].indexOf(b.rarity));

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-5">
      {/* Identity card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
        <div className="w-16 h-16 rounded-full bg-indigo-600 text-white flex items-center justify-center text-2xl font-black flex-shrink-0">
          {profile.name[0]}
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-black text-gray-900">{profile.name}</h1>
          {profile.flatNo && <p className="text-sm text-gray-500">🏠 {profile.flatNo}</p>}
          <StarRating value={profile.communityRating} />
          {profile.ratingCount > 0 && (
            <p className="text-xs text-gray-400">{profile.ratingCount} peer ratings</p>
          )}
        </div>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 divide-x border border-gray-200 rounded-xl overflow-hidden bg-white">
        {[
          { label: 'Matches',  value: profile.totalMatches  },
          { label: 'Trophies', value: profile.totalTrophies },
          { label: 'Badges',   value: earnedBadges.length   },
        ].map(({ label, value }) => (
          <div key={label} className="py-4 text-center">
            <p className="text-2xl font-black text-indigo-700">{value}</p>
            <p className="text-xs text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {(['stats', 'badges', 'matches'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={[
              'flex-1 py-3 text-sm font-semibold capitalize border-b-2 transition-colors',
              tab === t ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500 hover:text-gray-700',
            ].join(' ')}
          >
            {t === 'stats' ? '📊 Stats' : t === 'badges' ? '🏅 Badges' : '🕐 History'}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'stats' && (
        <div className="space-y-3">
          {profile.sportStats.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No match data yet.</p>
          ) : (
            profile.sportStats.map((s) => <SportStatCard key={s.sport} stat={s} />)
          )}
        </div>
      )}

      {tab === 'badges' && (
        <div className="space-y-4">
          <BadgeGrid badges={profile.badges} showLocked />
        </div>
      )}

      {tab === 'matches' && (
        <div className="space-y-2">
          {profile.recentMatches.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No recent matches.</p>
          ) : (
            profile.recentMatches.map((m, i) => (
              <a
                key={i}
                href={`/sports/match/${m.matchId}`}
                className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-indigo-200 hover:bg-indigo-50 transition-colors"
              >
                <span className="text-xl">{SPORT_EMOJI[m.sport] ?? '🏅'}</span>
                <p className="flex-1 text-sm font-medium text-gray-800">{m.result}</p>
                <p className="text-xs text-gray-400">{format(new Date(m.date), 'dd MMM')}</p>
              </a>
            ))
          )}
        </div>
      )}
    </div>
  );
}
