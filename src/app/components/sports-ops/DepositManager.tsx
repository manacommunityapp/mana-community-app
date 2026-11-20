import React, { useEffect, useState, useCallback } from 'react';
import { sportsOpsService, SportsNoShowDeposit } from '../../../services/sports/sportsOpsService';

export default function DepositManager() {
  const [deposits, setDeposits] = useState<SportsNoShowDeposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionId, setActionId] = useState<number | null>(null);
  const [reason, setReason] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try { setDeposits(await sportsOpsService.listDeposits()); }
    catch { setError('Failed to load deposits'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const release = async (id: number) => {
    if (!reason.trim()) return;
    try { await sportsOpsService.releaseDeposit(id, reason); setActionId(null); setReason(''); load(); }
    catch { setError('Failed to release deposit'); }
  };

  const forfeit = async (id: number) => {
    if (!reason.trim()) return;
    try { await sportsOpsService.forfeitDeposit(id, reason); setActionId(null); setReason(''); load(); }
    catch { setError('Failed to forfeit deposit'); }
  };

  const statusColor = (d: SportsNoShowDeposit) => {
    if (d.forfeited) return { bg: '#fef2f2', text: '#dc2626', label: 'Forfeited' };
    if (d.released) return { bg: '#f0fdf4', text: '#16a34a', label: 'Released' };
    return { bg: '#fefce8', text: '#ca8a04', label: 'Held' };
  };

  if (loading) return <div style={{ padding: 24 }}>Loading...</div>;

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ margin: '0 0 20px', fontSize: 20, fontWeight: 700 }}>No-Show Deposits</h2>
      {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, marginBottom: 16 }}>{error}</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {deposits.map(d => {
          const st = statusColor(d);
          return (
            <div key={d.id} style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, background: '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: actionId === d.id ? 12 : 0 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>Booking #{d.bookingId} · User #{d.userId}</div>
                  <div style={{ color: '#64748b', fontSize: 13 }}>₹{d.amount} · Held {new Date(d.heldAt).toLocaleDateString()}</div>
                  {d.reason && <div style={{ color: '#94a3b8', fontSize: 12 }}>{d.reason}</div>}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ background: st.bg, color: st.text, padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{st.label}</span>
                  {!d.released && !d.forfeited && (
                    <button onClick={() => setActionId(actionId === d.id ? null : d.id)} style={{ background: '#f1f5f9', border: 'none', borderRadius: 7, padding: '5px 14px', cursor: 'pointer', fontSize: 13 }}>Action</button>
                  )}
                </div>
              </div>
              {actionId === d.id && (
                <div style={{ marginTop: 10 }}>
                  <input placeholder="Reason (required)" value={reason} onChange={e => setReason(e.target.value)} style={{ width: '100%', padding: 8, border: '1px solid #cbd5e1', borderRadius: 6, marginBottom: 10, boxSizing: 'border-box' }} />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => release(d.id)} style={{ background: '#dcfce7', color: '#16a34a', border: 'none', borderRadius: 7, padding: '6px 16px', cursor: 'pointer', fontWeight: 600 }}>Release</button>
                    <button onClick={() => forfeit(d.id)} style={{ background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: 7, padding: '6px 16px', cursor: 'pointer', fontWeight: 600 }}>Forfeit</button>
                    <button onClick={() => setActionId(null)} style={{ background: '#e2e8f0', border: 'none', borderRadius: 7, padding: '6px 16px', cursor: 'pointer' }}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {deposits.length === 0 && <div style={{ color: '#94a3b8', textAlign: 'center', padding: 40 }}>No deposits</div>}
      </div>
    </div>
  );
}
