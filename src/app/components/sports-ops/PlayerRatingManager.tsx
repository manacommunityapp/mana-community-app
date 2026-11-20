import React, { useEffect, useState, useCallback } from 'react';
import { sportsOpsService, PlayerRating } from '../../../services/sports/sportsOpsService';

const STARS = [1, 2, 3, 4, 5];

function StarRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
      <span style={{ width: 110, fontSize: 13, color: '#475569' }}>{label}</span>
      {STARS.map(s => (
        <span key={s} onClick={() => onChange(s)} style={{ cursor: 'pointer', fontSize: 20, color: s <= value ? '#f59e0b' : '#d1d5db' }}>★</span>
      ))}
    </div>
  );
}

export default function PlayerRatingManager() {
  const [ratings, setRatings] = useState<PlayerRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ratedUserId: '', sport: '', rating: 3, sportsmanship: 3, skillLevel: 3, comment: '' });
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try { setRatings(await sportsOpsService.listAllRatings()); }
    catch { setError('Failed to load ratings'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    try {
      await sportsOpsService.submitRating({ ...form, ratedUserId: Number(form.ratedUserId) });
      setShowForm(false);
      setForm({ ratedUserId: '', sport: '', rating: 3, sportsmanship: 3, skillLevel: 3, comment: '' });
      load();
    } catch { setError('Failed to submit rating'); }
  };

  if (loading) return <div style={{ padding: 24 }}>Loading...</div>;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Player Ratings</h2>
        <button onClick={() => setShowForm(true)} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', cursor: 'pointer', fontWeight: 600 }}>+ Rate Player</button>
      </div>
      {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, marginBottom: 16 }}>{error}</div>}

      {showForm && (
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Rate a Player</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <input placeholder="Player User ID" type="number" value={form.ratedUserId} onChange={e => setForm(f => ({ ...f, ratedUserId: e.target.value }))} style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 }} />
            <input placeholder="Sport" value={form.sport} onChange={e => setForm(f => ({ ...f, sport: e.target.value }))} style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 }} />
          </div>
          <StarRow label="Overall Rating" value={form.rating} onChange={v => setForm(f => ({ ...f, rating: v }))} />
          <StarRow label="Sportsmanship" value={form.sportsmanship} onChange={v => setForm(f => ({ ...f, sportsmanship: v }))} />
          <StarRow label="Skill Level" value={form.skillLevel} onChange={v => setForm(f => ({ ...f, skillLevel: v }))} />
          <input placeholder="Comment (optional)" value={form.comment} onChange={e => setForm(f => ({ ...f, comment: e.target.value }))} style={{ width: '100%', padding: 8, border: '1px solid #cbd5e1', borderRadius: 6, marginTop: 8, boxSizing: 'border-box' }} />
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button onClick={submit} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', cursor: 'pointer', fontWeight: 600 }}>Submit</button>
            <button onClick={() => setShowForm(false)} style={{ background: '#e2e8f0', border: 'none', borderRadius: 8, padding: '8px 20px', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {ratings.map(r => (
          <div key={r.id} style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 14, background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600 }}>User #{r.ratedUserId} · {r.sport}</div>
              <div style={{ color: '#64748b', fontSize: 13 }}>by User #{r.ratedBy} · {new Date(r.createdAt).toLocaleDateString()}</div>
              {r.comment && <div style={{ color: '#94a3b8', fontSize: 12 }}>{r.comment}</div>}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 18, color: '#f59e0b' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
              {r.sportsmanship && <div style={{ fontSize: 12, color: '#64748b' }}>⚡ {r.sportsmanship}/5 sportsmanship</div>}
            </div>
          </div>
        ))}
        {ratings.length === 0 && <div style={{ color: '#94a3b8', textAlign: 'center', padding: 40 }}>No ratings yet</div>}
      </div>
    </div>
  );
}
