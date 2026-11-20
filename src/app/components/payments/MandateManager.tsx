import React, { useEffect, useState, useCallback } from 'react';
import { paymentsService, PaymentMandate } from '../../../services/payments/paymentsService';

export default function MandateManager() {
  const [mandates, setMandates] = useState<PaymentMandate[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelId, setCancelId] = useState<number | null>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try { setMandates(await paymentsService.listMandates()); }
    catch { setError('Failed to load mandates'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const cancel = async (id: number) => {
    if (!reason.trim()) return;
    try { await paymentsService.cancelMandate(id, reason); setCancelId(null); setReason(''); load(); }
    catch { setError('Failed to cancel mandate'); }
  };

  if (loading) return <div style={{ padding: 24 }}>Loading...</div>;

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ margin: '0 0 20px', fontSize: 20, fontWeight: 700 }}>Payment Mandates</h2>
      {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, marginBottom: 16 }}>{error}</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {mandates.map(m => (
          <div key={m.id} style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 14, background: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: cancelId === m.id ? 10 : 0 }}>
              <div>
                <div style={{ fontWeight: 600 }}>{m.provider}</div>
                <div style={{ color: '#64748b', fontSize: 13 }}>{m.mandateType} · {m.frequency} · Max ₹{m.maxAmount}</div>
                {m.cancelReason && <div style={{ color: '#dc2626', fontSize: 12 }}>Cancelled: {m.cancelReason}</div>}
                <div style={{ color: '#94a3b8', fontSize: 12 }}>Approved: {new Date(m.approvedAt).toLocaleDateString()}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ background: m.active ? '#dcfce7' : '#f1f5f9', color: m.active ? '#16a34a' : '#94a3b8', padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{m.active ? 'Active' : 'Cancelled'}</span>
                {m.active && <button onClick={() => setCancelId(cancelId === m.id ? null : m.id)} style={{ background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: 7, padding: '5px 12px', cursor: 'pointer', fontSize: 13 }}>Cancel</button>}
              </div>
            </div>
            {cancelId === m.id && (
              <div>
                <input placeholder="Reason for cancellation" value={reason} onChange={e => setReason(e.target.value)} style={{ width: '100%', padding: 8, border: '1px solid #e2e8f0', borderRadius: 6, marginBottom: 8, boxSizing: 'border-box' }} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => cancel(m.id)} style={{ background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: 7, padding: '6px 16px', cursor: 'pointer', fontWeight: 600 }}>Confirm Cancel</button>
                  <button onClick={() => setCancelId(null)} style={{ background: '#e2e8f0', border: 'none', borderRadius: 7, padding: '6px 16px', cursor: 'pointer' }}>Back</button>
                </div>
              </div>
            )}
          </div>
        ))}
        {mandates.length === 0 && <div style={{ color: '#94a3b8', textAlign: 'center', padding: 40 }}>No active mandates</div>}
      </div>
    </div>
  );
}
