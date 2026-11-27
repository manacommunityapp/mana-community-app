import React, { useEffect, useState, useMemo } from 'react';
import { sportsOpsService, PlayerRating } from '../../../services/sports/sportsOpsService';

interface LeaderboardEntry {
  userId: number;
  sport: string;
  avgRating: number;
  avgSportsmanship: number;
  avgSkill: number;
  ratingCount: number;
}

const MEDAL_COLORS = ['#f59e0b', '#94a3b8', '#d97706'];
const MEDAL_LABELS = ['1st', '2nd', '3rd'];
const CROWN = ['👑', '🥈', '🥉'];

function Stars({ value }: { value: number }) {
  const full = Math.round(value);
  return (
    <span style={{ color: '#f59e0b', fontSize: 14 }}>
      {'★'.repeat(full)}{'☆'.repeat(5 - full)}
      <span style={{ color: '#64748b', fontSize: 12, marginLeft: 4 }}>{value.toFixed(1)}</span>
    </span>
  );
}

function PodiumCard({ entry, rank }: { entry: LeaderboardEntry; rank: number }) {
  const heights = [120, 90, 70];
  const color = MEDAL_COLORS[rank];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
      <div style={{ fontSize: 24, marginBottom: 4 }}>{CROWN[rank]}</div>
      <div style={{ background: '#fff', border: `2px solid ${color}`, borderRadius: 12, padding: '12px 16px', textAlign: 'center', width: '100%', boxSizing: 'border-box', boxShadow: `0 4px 16px ${color}33` }}>
        <div style={{ fontSize: 28, fontWeight: 900, color: '#2563eb' }}>#{entry.userId}</div>
        <div style={{ fontSize: 12, color: '#64748b', margin: '2px 0 6px' }}>{entry.ratingCount} ratings</div>
        <Stars value={entry.avgRating} />
      </div>
      <div style={{ background: color, width: '100%', height: heights[rank], borderRadius: '0 0 8px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#fff', fontWeight: 800, fontSize: 18 }}>{MEDAL_LABELS[rank]}</span>
      </div>
    </div>
  );
}

export default function PlayerLeaderboard() {
  const [ratings, setRatings] = useState<PlayerRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [sport, setSport] = useState('ALL');
  const [error, setError] = useState('');

  useEffect(() => {
    sportsOpsService.listAllRatings()
      .then(r => setRatings((r as any)?.data ?? r))
      .catch(() => setError('Failed to load ratings'))
      .finally(() => setLoading(false));
  }, []);

  const sports = useMemo(() => {
    const s = new Set(ratings.map(r => r.sport));
    return ['ALL', ...Array.from(s).sort()];
  }, [ratings]);

  const leaderboard: LeaderboardEntry[] = useMemo(() => {
    const filtered = sport === 'ALL' ? ratings : ratings.filter(r => r.sport === sport);
    const map = new Map<string, { sum: number; sumS: number; sumK: number; count: number; userId: number; sport: string }>();
    for (const r of filtered) {
      const key = sport === 'ALL' ? String(r.ratedUserId) : `${r.ratedUserId}:${r.sport}`;
      const ex = map.get(key) ?? { sum: 0, sumS: 0, sumK: 0, count: 0, userId: r.ratedUserId, sport: r.sport };
      ex.sum += r.rating;
      ex.sumS += r.sportsmanship ?? r.rating;
      ex.sumK += r.skillLevel ?? r.rating;
      ex.count += 1;
      map.set(key, ex);
    }
    return Array.from(map.values())
      .map(e => ({
        userId: e.userId,
        sport: e.sport,
        avgRating: e.sum / e.count,
        avgSportsmanship: e.sumS / e.count,
        avgSkill: e.sumK / e.count,
        ratingCount: e.count,
      }))
      .sort((a, b) => b.avgRating - a.avgRating || b.ratingCount - a.ratingCount);
  }, [ratings, sport]);

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  if (loading) return <div style={{ padding: 24, color: '#64748b' }}>Loading leaderboard…</div>;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Player Leaderboard</h2>
        <select value={sport} onChange={e => setSport(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, background: '#fff' }}>
          {sports.map(s => <option key={s} value={s}>{s === 'ALL' ? 'All Sports' : s}</option>)}
        </select>
      </div>

      {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, marginBottom: 16 }}>{error}</div>}

      {leaderboard.length === 0 ? (
        <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8', background: '#f8fafc', borderRadius: 12 }}>
          No rating data available yet.
        </div>
      ) : (
        <>
          {/* Podium */}
          {top3.length >= 1 && (
            <div style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)', borderRadius: 16, padding: '24px 16px 0', marginBottom: 24 }}>
              <div style={{ textAlign: 'center', marginBottom: 16, fontSize: 13, fontWeight: 600, color: '#64748b', letterSpacing: 1 }}>
                TOP PLAYERS {sport !== 'ALL' ? `· ${sport.toUpperCase()}` : ''}
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, justifyContent: 'center' }}>
                {/* Podium order: 2nd | 1st | 3rd */}
                {top3.length >= 2 && <PodiumCard entry={top3[1]} rank={1} />}
                {top3.length >= 1 && <PodiumCard entry={top3[0]} rank={0} />}
                {top3.length >= 3 && <PodiumCard entry={top3[2]} rank={2} />}
              </div>
            </div>
          )}

          {/* Full ranked table */}
          {leaderboard.length > 0 && (
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#64748b' }}>Rank</th>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#64748b' }}>Player</th>
                    {sport === 'ALL' && <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#64748b' }}>Sport</th>}
                    <th style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 600, color: '#64748b' }}>Rating</th>
                    <th style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 600, color: '#64748b' }}>Sportsmanship</th>
                    <th style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 600, color: '#64748b' }}>Skill</th>
                    <th style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 600, color: '#64748b' }}>Ratings</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry, idx) => (
                    <tr key={`${entry.userId}:${entry.sport}`}
                      style={{ borderBottom: '1px solid #f1f5f9', background: idx < 3 ? '#fffbeb' : '#fff' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: idx === 0 ? '#f59e0b' : idx === 1 ? '#94a3b8' : idx === 2 ? '#d97706' : '#64748b' }}>
                        {idx < 3 ? CROWN[idx] : `#${idx + 1}`}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#1e293b' }}>User #{entry.userId}</td>
                      {sport === 'ALL' && <td style={{ padding: '12px 16px', color: '#475569' }}>{entry.sport}</td>}
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}><Stars value={entry.avgRating} /></td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}><Stars value={entry.avgSportsmanship} /></td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}><Stars value={entry.avgSkill} /></td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', color: '#64748b' }}>{entry.ratingCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
