import React, { useEffect, useState, useCallback } from 'react';
import { sportsOpsService, OpenPlaySession } from '../../../services/sports/sportsOpsService';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const SKILL_OPTIONS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'OPEN'];

export default function OpenPlayManager() {
  const [sessions, setSessions] = useState<OpenPlaySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ sport: '', courtId: '', sessionDate: '', startTime: '', endTime: '', minPlayers: 2, maxPlayers: 10, skillLevel: 'OPEN', notes: '' });
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await sportsOpsService.listOpenSessions();
      setSessions(data);
    } catch { setError('Failed to load sessions'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    try {
      await sportsOpsService.createSession({ ...form, courtId: Number(form.courtId) });
      setShowForm(false);
      setForm({ sport: '', courtId: '', sessionDate: '', startTime: '', endTime: '', minPlayers: 2, maxPlayers: 10, skillLevel: 'OPEN', notes: '' });
      load();
    } catch { setError('Failed to create session'); }
  };

  const join = async (id: number) => {
    try { await sportsOpsService.joinSession(id); load(); }
    catch (e: any) { setError(e?.message || 'Could not join session'); }
  };

  const close = async (id: number) => {
    try { await sportsOpsService.closeSession(id); load(); }
    catch { setError('Could not close session'); }
  };

  if (loading) return <div style={{ padding: 24 }}>Loading...</div>;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Open Play Sessions</h2>
        <button onClick={() => setShowForm(true)} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', cursor: 'pointer', fontWeight: 600 }}>+ New Session</button>
      </div>
      {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, marginBottom: 16 }}>{error}</div>}

      {showForm && (
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Create Open Play Session</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <input placeholder="Sport (e.g. Badminton)" value={form.sport} onChange={e => setForm(f => ({ ...f, sport: e.target.value }))} style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 }} />
            <input placeholder="Court ID" type="number" value={form.courtId} onChange={e => setForm(f => ({ ...f, courtId: e.target.value }))} style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 }} />
            <input type="date" value={form.sessionDate} onChange={e => setForm(f => ({ ...f, sessionDate: e.target.value }))} style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} style={{ flex: 1, padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 }} />
              <input type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} style={{ flex: 1, padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 }} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="number" placeholder="Min players" value={form.minPlayers} onChange={e => setForm(f => ({ ...f, minPlayers: Number(e.target.value) }))} style={{ flex: 1, padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 }} />
              <input type="number" placeholder="Max players" value={form.maxPlayers} onChange={e => setForm(f => ({ ...f, maxPlayers: Number(e.target.value) }))} style={{ flex: 1, padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 }} />
            </div>
            <select value={form.skillLevel} onChange={e => setForm(f => ({ ...f, skillLevel: e.target.value }))} style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 }}>
              {SKILL_OPTIONS.map(s => <option key={s}>{s}</option>)}
            </select>
            <input placeholder="Notes (optional)" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 }} />
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button onClick={submit} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', cursor: 'pointer', fontWeight: 600 }}>Create</button>
            <button onClick={() => setShowForm(false)} style={{ background: '#e2e8f0', border: 'none', borderRadius: 8, padding: '8px 20px', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {sessions.map(s => (
          <div key={s.id} style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, background: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{s.sport}</div>
                <div style={{ color: '#64748b', fontSize: 13 }}>{s.sessionDate} · {s.startTime}–{s.endTime}</div>
              </div>
              <span style={{ background: s.status === 'OPEN' ? '#dcfce7' : '#f1f5f9', color: s.status === 'OPEN' ? '#16a34a' : '#64748b', padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{s.status}</span>
            </div>
            <div style={{ fontSize: 13, color: '#475569', marginBottom: 10 }}>Skill: {s.skillLevel} · {s.minPlayers}–{s.maxPlayers} players</div>
            {s.notes && <div style={{ fontSize: 13, color: '#64748b', marginBottom: 10 }}>{s.notes}</div>}
            {s.status === 'OPEN' && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => join(s.id)} style={{ flex: 1, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 7, padding: '6px 0', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Join</button>
                <button onClick={() => close(s.id)} style={{ flex: 1, background: '#f1f5f9', border: 'none', borderRadius: 7, padding: '6px 0', cursor: 'pointer', fontSize: 13 }}>Close</button>
              </div>
            )}
          </div>
        ))}
        {sessions.length === 0 && <div style={{ color: '#94a3b8', gridColumn: '1/-1', textAlign: 'center', padding: 40 }}>No open sessions</div>}
      </div>
    </div>
  );
}
