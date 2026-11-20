import React, { useEffect, useState, useCallback } from 'react';
import { sportsOpsService, CoachPackage, CoachPackageEnrollment } from '../../../services/sports/sportsOpsService';

export default function CoachPackageManager() {
  const [packages, setPackages] = useState<CoachPackage[]>([]);
  const [enrollments, setEnrollments] = useState<CoachPackageEnrollment[]>([]);
  const [tab, setTab] = useState<'packages' | 'enrollments'>('packages');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ sport: '', name: '', description: '', sessions: 8, durationMinutes: 60, price: '', groupSize: 1 });
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pkgs, enrs] = await Promise.all([sportsOpsService.listPackages(), sportsOpsService.listEnrollments()]);
      setPackages(pkgs);
      setEnrollments(enrs);
    } catch { setError('Failed to load data'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const createPkg = async () => {
    try {
      await sportsOpsService.createPackage({ ...form, price: Number(form.price) });
      setShowForm(false);
      setForm({ sport: '', name: '', description: '', sessions: 8, durationMinutes: 60, price: '', groupSize: 1 });
      load();
    } catch { setError('Failed to create package'); }
  };

  const enroll = async (packageId: number) => {
    try { await sportsOpsService.enrollPackage(packageId); load(); }
    catch { setError('Could not enroll'); }
  };

  const recordSession = async (enrollmentId: number) => {
    try { await sportsOpsService.recordSession(enrollmentId); load(); }
    catch { setError('Could not record session'); }
  };

  if (loading) return <div style={{ padding: 24 }}>Loading...</div>;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Coaching Packages</h2>
        {tab === 'packages' && <button onClick={() => setShowForm(true)} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', cursor: 'pointer', fontWeight: 600 }}>+ New Package</button>}
      </div>
      {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, marginBottom: 16 }}>{error}</div>}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['packages', 'enrollments'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '7px 18px', borderRadius: 7, border: 'none', cursor: 'pointer', fontWeight: 600, background: tab === t ? '#2563eb' : '#e2e8f0', color: tab === t ? '#fff' : '#374151' }}>{t === 'packages' ? 'Packages' : 'Enrollments'}</button>
        ))}
      </div>

      {showForm && tab === 'packages' && (
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>New Coaching Package</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <input placeholder="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 }} />
            <input placeholder="Sport" value={form.sport} onChange={e => setForm(f => ({ ...f, sport: e.target.value }))} style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 }} />
            <input placeholder="Sessions" type="number" value={form.sessions} onChange={e => setForm(f => ({ ...f, sessions: Number(e.target.value) }))} style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 }} />
            <input placeholder="Duration (min)" type="number" value={form.durationMinutes} onChange={e => setForm(f => ({ ...f, durationMinutes: Number(e.target.value) }))} style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 }} />
            <input placeholder="Price ₹" type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 }} />
            <input placeholder="Group Size" type="number" value={form.groupSize} onChange={e => setForm(f => ({ ...f, groupSize: Number(e.target.value) }))} style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 }} />
            <input placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ gridColumn: '1/-1', padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 }} />
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button onClick={createPkg} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', cursor: 'pointer', fontWeight: 600 }}>Create</button>
            <button onClick={() => setShowForm(false)} style={{ background: '#e2e8f0', border: 'none', borderRadius: 8, padding: '8px 20px', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      {tab === 'packages' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {packages.map(p => (
            <div key={p.id} style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, background: '#fff' }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{p.name}</div>
              <div style={{ color: '#64748b', fontSize: 13 }}>{p.sport} · {p.sessions} sessions · {p.durationMinutes} min each</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#2563eb', margin: '8px 0' }}>₹{p.price}</div>
              {p.description && <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 10 }}>{p.description}</div>}
              <button onClick={() => enroll(p.id)} style={{ width: '100%', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 7, padding: '7px 0', cursor: 'pointer', fontWeight: 600 }}>Enroll</button>
            </div>
          ))}
          {packages.length === 0 && <div style={{ color: '#94a3b8', gridColumn: '1/-1', textAlign: 'center', padding: 40 }}>No packages</div>}
        </div>
      )}

      {tab === 'enrollments' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {enrollments.map(e => {
            const pkg = packages.find(p => p.id === e.packageId);
            const pct = pkg ? Math.round((e.sessionsUsed / pkg.sessions) * 100) : 0;
            return (
              <div key={e.id} style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 14, background: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{pkg?.name || `Package #${e.packageId}`}</div>
                    <div style={{ color: '#64748b', fontSize: 13 }}>{e.sessionsUsed}/{pkg?.sessions ?? '?'} sessions used</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ background: e.active ? '#dcfce7' : '#f1f5f9', color: e.active ? '#16a34a' : '#94a3b8', padding: '2px 8px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{e.active ? 'Active' : 'Complete'}</span>
                    {e.active && <button onClick={() => recordSession(e.id)} style={{ background: '#f0fdf4', color: '#16a34a', border: 'none', borderRadius: 7, padding: '5px 12px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Record Session</button>}
                  </div>
                </div>
                <div style={{ background: '#f1f5f9', borderRadius: 4, height: 6 }}>
                  <div style={{ background: '#2563eb', height: 6, borderRadius: 4, width: `${pct}%`, transition: 'width 0.3s' }} />
                </div>
              </div>
            );
          })}
          {enrollments.length === 0 && <div style={{ color: '#94a3b8', textAlign: 'center', padding: 40 }}>No enrollments</div>}
        </div>
      )}
    </div>
  );
}
