import React, { useEffect, useState, useCallback } from 'react';
import { paymentsService, PaymentDispute } from '../../../services/payments/paymentsService';

export default function DisputeManager() {
  const [disputes, setDisputes] = useState<PaymentDispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ amount: '', reason: '', description: '' });
  const [resolutionId, setResolutionId] = useState<number | null>(null);
  const [resolution, setResolution] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try { setDisputes(await paymentsService.listDisputes()); }
    catch { setError('Failed to load disputes'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    try {
      await paymentsService.raiseDispute({ amount: Number(form.amount), reason: form.reason, description: form.description });
      setShowForm(false);
      setForm({ amount: '', reason: '', description: '' });
      load();
    } catch { setError('Failed to raise dispute'); }
  };

  const resolve = async (id: number) => {
    if (!resolution.trim()) return;
    try { await paymentsService.resolveDispute(id, resolution); setResolutionId(null); setResolution(''); load(); }
    catch { setError('Failed to resolve'); }
  };

  if (loading) return <div style={{ padding: 24 }}>Loading...</div>;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Payment Disputes</h2>
        <button onClick={() => setShowForm(true)} style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', cursor: 'pointer', fontWeight: 600 }}>+ Raise Dispute</button>
      </div>
      {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, marginBottom: 16 }}>{error}</div>}

      {showForm && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <input type="number" placeholder="Amount ₹" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} style={{ padding: 8, border: '1px solid #fca5a5', borderRadius: 6 }} />
            <input placeholder="Reason" value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} style={{ padding: 8, border: '1px solid #fca5a5', borderRadius: 6 }} />
            <textarea placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ gridColumn: '1/-1', padding: 8, border: '1px solid #fca5a5', borderRadius: 6, height: 80, resize: 'none' }} />
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button onClick={submit} style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', cursor: 'pointer', fontWeight: 600 }}>Raise</button>
            <button onClick={() => setShowForm(false)} style={{ background: '#e2e8f0', border: 'none', borderRadius: 8, padding: '8px 20px', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {disputes.map(d => (
          <div key={d.id} style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 14, background: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: resolutionId === d.id ? 10 : 0 }}>
              <div>
                <div style={{ fontWeight: 600 }}>₹{d.amount} · {d.reason}</div>
                {d.description && <div style={{ color: '#64748b', fontSize: 13 }}>{d.description}</div>}
                {d.resolution && <div style={{ color: '#16a34a', fontSize: 13, marginTop: 4 }}>Resolution: {d.resolution}</div>}
                <div style={{ color: '#94a3b8', fontSize: 12 }}>{new Date(d.createdAt).toLocaleDateString()}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ background: d.status === 'RESOLVED' ? '#dcfce7' : '#fef2f2', color: d.status === 'RESOLVED' ? '#16a34a' : '#dc2626', padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{d.status}</span>
                {d.status === 'OPEN' && <button onClick={() => setResolutionId(resolutionId === d.id ? null : d.id)} style={{ background: '#f1f5f9', border: 'none', borderRadius: 7, padding: '5px 12px', cursor: 'pointer', fontSize: 13 }}>Resolve</button>}
              </div>
            </div>
            {resolutionId === d.id && (
              <div>
                <textarea placeholder="Resolution notes" value={resolution} onChange={e => setResolution(e.target.value)} style={{ width: '100%', padding: 8, border: '1px solid #e2e8f0', borderRadius: 6, height: 60, resize: 'none', marginBottom: 8, boxSizing: 'border-box' }} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => resolve(d.id)} style={{ background: '#dcfce7', color: '#16a34a', border: 'none', borderRadius: 7, padding: '6px 16px', cursor: 'pointer', fontWeight: 600 }}>Confirm Resolution</button>
                  <button onClick={() => setResolutionId(null)} style={{ background: '#e2e8f0', border: 'none', borderRadius: 7, padding: '6px 16px', cursor: 'pointer' }}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        ))}
        {disputes.length === 0 && <div style={{ color: '#94a3b8', textAlign: 'center', padding: 40 }}>No disputes</div>}
      </div>
    </div>
  );
}
