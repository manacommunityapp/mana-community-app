import React, { useEffect, useState, useCallback } from 'react';
import { paymentsService, PaymentTimelineEvent } from '../../../services/payments/paymentsService';

const MODULE_COLORS: Record<string, string> = {
  FOOD: '#10b981', HEALTHCARE: '#3b82f6', SPORTS: '#f59e0b',
  BILLING: '#8b5cf6', FINANCE: '#06b6d4', DEFAULT: '#64748b',
};

export default function PaymentTimeline() {
  const [events, setEvents] = useState<PaymentTimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { setEvents(await paymentsService.timeline()); }
    catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div style={{ padding: 24 }}>Loading...</div>;

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ margin: '0 0 20px', fontSize: 20, fontWeight: 700 }}>Payment Timeline</h2>
      <div style={{ position: 'relative' }}>
        {events.map((e, idx) => {
          const color = MODULE_COLORS[e.sourceModule] || MODULE_COLORS.DEFAULT;
          return (
            <div key={e.id} style={{ display: 'flex', gap: 16, marginBottom: 16, position: 'relative' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: color, marginTop: 4, flexShrink: 0 }} />
                {idx < events.length - 1 && <div style={{ width: 2, flex: 1, background: '#e2e8f0', marginTop: 2 }} />}
              </div>
              <div style={{ flex: 1, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', marginBottom: 2 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 700, color, background: `${color}18`, padding: '1px 7px', borderRadius: 10 }}>{e.sourceModule}</span>
                    <span style={{ marginLeft: 8, fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{e.eventType.replace(/_/g, ' ')}</span>
                  </div>
                  {e.amount != null && <span style={{ fontWeight: 700, color: '#1e293b' }}>₹{e.amount}</span>}
                </div>
                {e.description && <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{e.description}</div>}
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{new Date(e.occurredAt).toLocaleString()}</div>
              </div>
            </div>
          );
        })}
        {events.length === 0 && <div style={{ color: '#94a3b8', textAlign: 'center', padding: 40 }}>No payment events</div>}
      </div>
    </div>
  );
}
