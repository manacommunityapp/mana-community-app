import React, { useEffect, useState, useCallback } from 'react';
import { paymentsService, PaymentReward } from '../../../services/payments/paymentsService';

export default function RewardsDashboard() {
  const [rewards, setRewards] = useState<PaymentReward[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rws, bal] = await Promise.all([paymentsService.myRewards(), paymentsService.rewardBalance()]);
      setRewards(rws);
      setBalance(bal.points);
    } catch { setError('Failed to load rewards'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const redeem = async (id: number) => {
    try { await paymentsService.redeemReward(id); load(); }
    catch { setError('Could not redeem reward'); }
  };

  if (loading) return <div style={{ padding: 24 }}>Loading...</div>;

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ margin: '0 0 20px', fontSize: 20, fontWeight: 700 }}>Rewards</h2>
      {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, marginBottom: 16 }}>{error}</div>}
      <div style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)', borderRadius: 16, padding: 24, color: '#fff', marginBottom: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 13, opacity: 0.8 }}>Available Points</div>
        <div style={{ fontSize: 48, fontWeight: 800 }}>{balance}</div>
        <div style={{ fontSize: 13, opacity: 0.8 }}>points</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {rewards.map(r => (
          <div key={r.id} style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 14, background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600 }}>{r.rewardType.replace(/_/g, ' ')}</div>
              <div style={{ color: '#64748b', fontSize: 13 }}>{r.sourceModule}{r.description ? ` · ${r.description}` : ''}</div>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ fontWeight: 800, fontSize: 16, color: r.redeemed ? '#94a3b8' : '#2563eb' }}>+{r.points}</span>
              {!r.redeemed && <button onClick={() => redeem(r.id)} style={{ background: '#eff6ff', color: '#2563eb', border: 'none', borderRadius: 7, padding: '5px 12px', cursor: 'pointer', fontWeight: 600 }}>Redeem</button>}
              {r.redeemed && <span style={{ background: '#f1f5f9', color: '#94a3b8', padding: '2px 8px', borderRadius: 20, fontSize: 12 }}>Redeemed</span>}
            </div>
          </div>
        ))}
        {rewards.length === 0 && <div style={{ color: '#94a3b8', textAlign: 'center', padding: 40 }}>No rewards yet</div>}
      </div>
    </div>
  );
}
