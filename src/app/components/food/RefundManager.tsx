import React, { useState, useEffect } from 'react';
import { foodOpsService, RefundDto, RefundStatus, RefundTrigger } from '../../../services/food/foodOpsService';

const TRIGGER_LABELS: Record<RefundTrigger, string> = {
  OUT_OF_STOCK:          'Out of Stock',
  SUBSTITUTION_REJECTED: 'Sub Rejected',
  LATE_DELIVERY:         'Late Delivery',
  QUALITY_ISSUE:         'Quality Issue',
  WRONG_ITEM:            'Wrong Item',
  CANCELLED_BY_VENDOR:   'Vendor Cancel',
  MANUAL:                'Manual',
};

const TRIGGER_COLORS: Record<RefundTrigger, string> = {
  OUT_OF_STOCK:          '#FEF3C7',
  SUBSTITUTION_REJECTED: '#FEE2E2',
  LATE_DELIVERY:         '#FEE2E2',
  QUALITY_ISSUE:         '#FEE2E2',
  WRONG_ITEM:            '#FEE2E2',
  CANCELLED_BY_VENDOR:   '#F3F4F6',
  MANUAL:                '#EDE9FE',
};

export function RefundManager({ communityId }: { communityId?: number }) {
  const cid = communityId ?? 1;
  const [tab, setTab] = useState<RefundStatus | 'ALL'>('PENDING');
  const [refunds, setRefunds] = useState<RefundDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState<Record<number, string>>({});

  const load = () => {
    setLoading(true);
    foodOpsService.getRefunds(cid, tab === 'ALL' ? undefined : tab)
      .then(setRefunds).catch(() => setRefunds([])).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [tab, cid]);

  const handleReview = async (id: number, approved: boolean) => {
    await foodOpsService.reviewRefund(id, approved, notes[id]);
    load();
  };

  const totalPending = refunds.filter(r => r.status === 'PENDING').reduce((sum, r) => sum + r.amount, 0);
  const autoToday = refunds.filter(r => r.autoApproved && r.status === 'AUTO_APPROVED').length;

  const TABS: { key: RefundStatus | 'ALL'; label: string }[] = [
    { key: 'PENDING',      label: 'Pending' },
    { key: 'AUTO_APPROVED',label: 'Auto-Approved' },
    { key: 'PROCESSED',    label: 'Processed' },
    { key: 'ALL',          label: 'All' },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111827' }}>Refund Management</h2>
        <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#374151' }}>
          <span>Pending: <strong style={{ color: '#DC2626' }}>₹{totalPending.toLocaleString('en-IN')}</strong></span>
          <span>Auto-approved today: <strong style={{ color: '#059669' }}>{autoToday}</strong></span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #E5E7EB', cursor: 'pointer', fontWeight: 600,
              background: tab === t.key ? '#2563EB' : '#fff', color: tab === t.key ? '#fff' : '#374151' }}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? <p style={{ color: '#6B7280' }}>Loading…</p> : refunds.length === 0 ? (
        <p style={{ color: '#9CA3AF', textAlign: 'center', padding: 48 }}>No refunds found.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {refunds.map(r => (
            <div key={r.id} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, color: '#111827' }}>Order #{r.orderId}</span>
                    <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                      background: TRIGGER_COLORS[r.trigger ?? 'MANUAL'] ?? '#F3F4F6', color: '#374151' }}>
                      {TRIGGER_LABELS[r.trigger ?? 'MANUAL']}
                    </span>
                    {r.autoApproved && (
                      <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: '#D1FAE5', color: '#065F46' }}>Auto</span>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: '#6B7280' }}>{r.residentName} · {new Date(r.createdAt || Date.now()).toLocaleDateString()}</div>
                </div>
                <div style={{ fontWeight: 700, fontSize: 18, color: '#DC2626' }}>₹{r.amount}</div>
              </div>
              {r.status === 'PENDING' && (
                <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input value={notes[r.id] ?? ''} onChange={e => setNotes(p => ({ ...p, [r.id]: e.target.value }))}
                    placeholder="Notes (optional)"
                    style={{ flex: 1, border: '1px solid #D1D5DB', borderRadius: 8, padding: '6px 10px', fontSize: 13 }} />
                  <button onClick={() => handleReview(r.id, true)}
                    style={{ background: '#D1FAE5', border: 'none', color: '#065F46', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 600 }}>
                    Approve
                  </button>
                  <button onClick={() => handleReview(r.id, false)}
                    style={{ background: '#FEE2E2', border: 'none', color: '#991B1B', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 600 }}>
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
