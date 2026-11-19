import React, { useEffect, useState, useCallback } from 'react';
import { sportsOpsService, CourtSlotSubscription } from '../../../services/sports/sportsOpsService';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const FREQ_OPTIONS = ['WEEKLY', 'BIWEEKLY', 'MONTHLY'];

export default function SubscriptionManager() {
  const [subs, setSubs] = useState<CourtSlotSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ courtId: '', dayOfWeek: 1, startTime: '', endTime: '', frequency: 'WEEKLY', startDate: '', endDate: '' });
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try { setSubs(await sportsOpsService.mySubscriptions()); }
    catch { setError('Failed to load subscriptions'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    try {
      await sportsOpsService.createSubscription({ ...form, courtId: Number(form.courtId) });
      setShowForm(false);
      load();
    } catch { setError('Failed to create subscription'); }
  };

  const cancel = async (id: number) => {
    try { await sportsOpsService.cancelSubscription(id); load(); }
    catch { setError('Failed to cancel'); }
  };

  if (loading) return <div style={{ padding: 24 }}>Loading...</div>;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Court Subscriptions</h2>
        <button onClick={() => setShowForm(true)} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', cursor: 'pointer', fontWeight: 600 }}>+ Subscribe</button>
      </div>
      {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, marginBottom: 16 }}>{error}</div>}

      {showForm && (
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>New Court Subscription</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <input placeholder="Court ID" type="number" value={form.courtId} onChange={e => setForm(f => ({ ...f, courtId: e.target.value }))} style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 }} />
            <select value={form.dayOfWeek} onChange={e => setForm(f => ({ ...f, dayOfWeek: Number(e.target.value) }))} style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 }}>
              {DAY_NAMES.map((d, i) => <option key={i} value={i}>{d}</option>)}
            </select>
            <input type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 }} />
            <input type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 }} />
            <select value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))} style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 }}>
              {FREQ_OPTIONS.map(f => <option key={f}>{f}</option>)}
            </select>
            <input type="date" placeholder="Start Date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 }} />
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button onClick={submit} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', cursor: 'pointer', fontWeight: 600 }}>Save</button>
            <button onClick={() => setShowForm(false)} style={{ background: '#e2e8f0', border: 'none', borderRadius: 8, padding: '8px 20px', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {subs.map(sub => (
          <div key={sub.id} style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600 }}>Court #{sub.courtId} · {DAY_NAMES[sub.dayOfWeek]}</div>
              <div style={{ color: '#64748b', fontSize: 13 }}>{sub.startTime}–{sub.endTime} · {sub.frequency}</div>
              <div style={{ color: '#94a3b8', fontSize: 12 }}>From {sub.startDate}{sub.endDate ? ` to ${sub.endDate}` : ''}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ background: sub.active ? '#dcfce7' : '#f1f5f9', color: sub.active ? '#16a34a' : '#94a3b8', padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{sub.active ? 'Active' : 'Inactive'}</span>
              {sub.active && <button onClick={() => cancel(sub.id)} style={{ background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: 7, padding: '5px 14px', cursor: 'pointer', fontSize: 13 }}>Cancel</button>}
            </div>
          </div>
        ))}
        {subs.length === 0 && <div style={{ color: '#94a3b8', textAlign: 'center', padding: 40 }}>No active subscriptions</div>}
      </div>
    </div>
  );
}
