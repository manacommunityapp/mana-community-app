import React, { useEffect, useState, useCallback } from 'react';
import { sportsOpsService, RefereeAssignment } from '../../../services/sports/sportsOpsService';

export default function RefereeManager() {
  const [assignments, setAssignments] = useState<RefereeAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ refereeId: '', eventId: '', eventType: '', sport: '', fee: '', notes: '' });
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try { setAssignments(await sportsOpsService.listReferees()); }
    catch { setError('Failed to load assignments'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const assign = async () => {
    try {
      await sportsOpsService.assignReferee({ ...form, refereeId: Number(form.refereeId), eventId: Number(form.eventId), fee: form.fee ? Number(form.fee) : undefined });
      setShowForm(false);
      setForm({ refereeId: '', eventId: '', eventType: '', sport: '', fee: '', notes: '' });
      load();
    } catch { setError('Failed to assign referee'); }
  };

  const confirm = async (id: number) => {
    try { await sportsOpsService.confirmReferee(id); load(); }
    catch { setError('Failed to confirm assignment'); }
  };

  if (loading) return <div style={{ padding: 24 }}>Loading...</div>;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Referee Assignments</h2>
        <button onClick={() => setShowForm(true)} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', cursor: 'pointer', fontWeight: 600 }}>+ Assign Referee</button>
      </div>
      {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, marginBottom: 16 }}>{error}</div>}

      {showForm && (
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>New Referee Assignment</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <input placeholder="Referee User ID" type="number" value={form.refereeId} onChange={e => setForm(f => ({ ...f, refereeId: e.target.value }))} style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 }} />
            <input placeholder="Event ID" type="number" value={form.eventId} onChange={e => setForm(f => ({ ...f, eventId: e.target.value }))} style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 }} />
            <input placeholder="Event Type (e.g. TOURNAMENT)" value={form.eventType} onChange={e => setForm(f => ({ ...f, eventType: e.target.value }))} style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 }} />
            <input placeholder="Sport" value={form.sport} onChange={e => setForm(f => ({ ...f, sport: e.target.value }))} style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 }} />
            <input placeholder="Fee ₹ (optional)" type="number" value={form.fee} onChange={e => setForm(f => ({ ...f, fee: e.target.value }))} style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 }} />
            <input placeholder="Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 }} />
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button onClick={assign} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', cursor: 'pointer', fontWeight: 600 }}>Assign</button>
            <button onClick={() => setShowForm(false)} style={{ background: '#e2e8f0', border: 'none', borderRadius: 8, padding: '8px 20px', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {assignments.map(a => (
          <div key={a.id} style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 14, background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600 }}>Referee #{a.refereeId} · {a.sport}</div>
              <div style={{ color: '#64748b', fontSize: 13 }}>Event #{a.eventId} · {a.eventType}</div>
              {a.fee && <div style={{ fontSize: 13, color: '#2563eb', fontWeight: 600 }}>₹{a.fee}</div>}
              {a.notes && <div style={{ color: '#94a3b8', fontSize: 12 }}>{a.notes}</div>}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ background: a.confirmed ? '#dcfce7' : '#fefce8', color: a.confirmed ? '#16a34a' : '#ca8a04', padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{a.confirmed ? 'Confirmed' : 'Pending'}</span>
              {!a.confirmed && <button onClick={() => confirm(a.id)} style={{ background: '#f0fdf4', color: '#16a34a', border: 'none', borderRadius: 7, padding: '5px 12px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Confirm</button>}
            </div>
          </div>
        ))}
        {assignments.length === 0 && <div style={{ color: '#94a3b8', textAlign: 'center', padding: 40 }}>No referee assignments</div>}
      </div>
    </div>
  );
}
