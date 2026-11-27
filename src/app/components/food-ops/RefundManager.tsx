import { useState, useEffect, useCallback } from 'react';
import foodOpsService, { OrderRefund, RefundStatus } from '@/services/food/foodOpsService';

const statusStyle: Record<RefundStatus, { bg: string; color: string }> = {
  PENDING: { bg: '#EFF6FF', color: '#1D4ED8' },
  AUTO_APPROVED: { bg: '#D1FAE5', color: '#065F46' },
  INITIATED: { bg: '#EFF6FF', color: '#1D4ED8' },
  APPROVED: { bg: '#D1FAE5', color: '#065F46' },
  REJECTED: { bg: '#FEE2E2', color: '#991B1B' },
  PROCESSED: { bg: '#F3F4F6', color: '#374151' },
};

export function RefundManager() {
  const [refunds, setRefunds] = useState<OrderRefund[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'INITIATED'>('INITIATED');
  const [reviewing, setReviewing] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRefunds(await foodOpsService.getRefunds(filter === 'ALL' ? undefined : filter));
    } catch {
      setMsg('Failed to load refunds');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const review = async (id: number, approve: boolean) => {
    try {
      await foodOpsService.reviewRefund(id, approve, notes || undefined);
      setReviewing(null);
      setNotes('');
      setMsg(approve ? 'Refund approved' : 'Refund rejected');
      load();
    } catch {
      setMsg('Review failed');
    }
  };

  return (
    <div style={{ padding: '24px 32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111827' }}>Refunds</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['INITIATED', 'ALL'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: '7px 16px', border: '1px solid #E5E7EB', borderRadius: 8, cursor: 'pointer', fontSize: 12, background: filter === f ? '#3B82F6' : '#fff', color: filter === f ? '#fff' : '#374151', fontWeight: filter === f ? 600 : 400 }}>
              {f === 'INITIATED' ? 'Pending' : 'All'}
            </button>
          ))}
        </div>
      </div>

      {msg && (
        <div style={{ padding: '10px 16px', marginBottom: 16, borderRadius: 8, background: msg.includes('approv') ? '#D1FAE5' : '#FEE2E2', color: msg.includes('approv') ? '#065F46' : '#991B1B', fontSize: 13 }}>
          {msg}<button onClick={() => setMsg(null)} style={{ marginLeft: 8, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'inherit' }}>✕</button>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>Loading…</div>
      ) : refunds.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>No refunds found</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {refunds.map(refund => {
            const ss = statusStyle[refund.status];
            return (
              <div key={refund.id} style={{ border: '1px solid #E5E7EB', borderRadius: 12, padding: 20, background: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, fontSize: 15, color: '#111827' }}>₹{refund.amount}</span>
                      {refund.autoApproved && (
                        <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: '#D1FAE5', color: '#065F46' }}>AUTO</span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                      Order #{refund.orderId} · {refund.triggerType ? refund.triggerType.replace(/_/g, ' ') : 'Manual'} · {new Date(refund.createdAt || Date.now()).toLocaleDateString()}
                    </div>
                    {refund.itemDetails && <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{refund.itemDetails}</div>}
                  </div>
                  <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: ss.bg, color: ss.color }}>
                    {refund.status}
                  </span>
                </div>

                {reviewing === refund.id ? (
                  <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 12, marginTop: 4 }}>
                    <textarea
                      placeholder="Review notes (optional)"
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, resize: 'none', height: 60, boxSizing: 'border-box' }}
                    />
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <button onClick={() => review(refund.id, true)} style={{ flex: 1, padding: '7px 0', background: '#10B981', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>✓ Approve</button>
                      <button onClick={() => review(refund.id, false)} style={{ flex: 1, padding: '7px 0', background: '#EF4444', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>✕ Reject</button>
                      <button onClick={() => { setReviewing(null); setNotes(''); }} style={{ padding: '7px 16px', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>Cancel</button>
                    </div>
                  </div>
                ) : refund.status === 'INITIATED' && !refund.autoApproved ? (
                  <button onClick={() => setReviewing(refund.id)} style={{ marginTop: 8, padding: '7px 16px', background: '#3B82F6', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                    Review
                  </button>
                ) : refund.reviewNotes ? (
                  <div style={{ fontSize: 12, color: '#6B7280', marginTop: 8, fontStyle: 'italic' }}>"{refund.reviewNotes}"</div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
