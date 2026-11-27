import React, { useState } from 'react';
import { foodOpsService, PrepAnalyticsSummaryDto } from '../../../services/food/foodOpsService';

function fmt(d: Date) { return d.toISOString().split('T')[0]; }

export function VendorPrepAnalytics({ vendorId }: { vendorId?: number }) {
  const vid = vendorId ?? 1;
  const today = new Date();
  const [from, setFrom] = useState(fmt(new Date(today.getFullYear(), today.getMonth(), 1)));
  const [to, setTo] = useState(fmt(today));
  const [data, setData] = useState<PrepAnalyticsSummaryDto | null>(null);
  const [loading, setLoading] = useState(false);

  const load = () => {
    setLoading(true);
    foodOpsService.getPrepAnalytics(vid, from, to)
      .then(setData).catch(() => setData(null)).finally(() => setLoading(false));
  };

  const maxOrders = data ? Math.max(...data.dailyStats.map(d => d.orderCount), 1) : 1;
  const maxPrep = data ? Math.max(...data.dailyStats.map(d => d.avgPrepMinutes), 1) : 1;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111827' }}>Vendor Prep Analytics</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)}
            style={{ border: '1px solid #D1D5DB', borderRadius: 8, padding: '6px 10px', fontSize: 13 }} />
          <span style={{ color: '#6B7280' }}>to</span>
          <input type="date" value={to} onChange={e => setTo(e.target.value)}
            style={{ border: '1px solid #D1D5DB', borderRadius: 8, padding: '6px 10px', fontSize: 13 }} />
          <button onClick={load}
            style={{ background: '#2563EB', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 600 }}>
            Load
          </button>
        </div>
      </div>

      {loading ? <p style={{ color: '#6B7280' }}>Loading…</p> : !data ? (
        <p style={{ color: '#9CA3AF', textAlign: 'center', padding: 48 }}>Select a date range and click Load.</p>
      ) : (
        <>
          {/* KPI Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
            {[
              { label: 'Avg Prep Time', value: `${data.avgPrepMinutes?.toFixed(1) ?? 0} min`, color: '#2563EB' },
              { label: 'On-Time %', value: `${data.onTimePercent?.toFixed(1) ?? 0}%`, color: '#059669' },
              { label: 'Total Orders', value: data.totalOrders, color: '#374151' },
              { label: 'Late Orders', value: data.lateOrders, color: '#DC2626' },
            ].map(kpi => (
              <div key={kpi.label} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
                <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>{kpi.label}</div>
              </div>
            ))}
          </div>

          {/* Bar chart */}
          {data.dailyStats.length > 0 && (
            <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 16, marginBottom: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#374151', marginBottom: 12 }}>Daily Orders & Avg Prep Time</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 120, overflowX: 'auto' }}>
                {data.dailyStats.map(d => (
                  <div key={d.date} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '0 0 auto', minWidth: 32 }}>
                    {/* Prep time bar (orange) */}
                    <div style={{ position: 'relative', width: 12, height: 100, display: 'flex', alignItems: 'flex-end', gap: 2 }}>
                      <div style={{ width: 10, height: `${(d.avgPrepMinutes / maxPrep) * 100}%`, background: '#F59E0B', borderRadius: 3 }} title={`${d.avgPrepMinutes?.toFixed(1)} min`} />
                      <div style={{ width: 10, height: `${(d.orderCount / maxOrders) * 100}%`, background: '#2563EB', borderRadius: 3 }} title={`${d.orderCount} orders`} />
                    </div>
                    <div style={{ fontSize: 9, color: '#9CA3AF', marginTop: 4, transform: 'rotate(-45deg)', transformOrigin: 'top left', whiteSpace: 'nowrap' }}>
                      {d.date.substring(5)}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 16, marginTop: 24, fontSize: 12, color: '#6B7280' }}>
                <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#2563EB', borderRadius: 2, marginRight: 4 }} />Orders</span>
                <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#F59E0B', borderRadius: 2, marginRight: 4 }} />Avg Prep (min)</span>
              </div>
            </div>
          )}

          {/* Recent orders table */}
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #E5E7EB', fontWeight: 700, fontSize: 14, color: '#374151' }}>Recent Orders</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F9FAFB' }}>
                  {['Order ID', 'Date', 'Prep Start', 'Complete', 'Duration', 'On-Time'].map(h => (
                    <th key={h} style={{ padding: '8px 16px', textAlign: 'left', color: '#374151', fontWeight: 600, borderBottom: '1px solid #E5E7EB' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.recentOrders.map(o => (
                  <tr key={o.orderId} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '8px 16px', fontWeight: 600 }}>#{o.orderId}</td>
                    <td style={{ padding: '8px 16px', color: '#6B7280' }}>{o.orderDate}</td>
                    <td style={{ padding: '8px 16px', color: '#6B7280' }}>{o.prepStartAt?.substring(11, 16) ?? '—'}</td>
                    <td style={{ padding: '8px 16px', color: '#6B7280' }}>{o.prepCompleteAt?.substring(11, 16) ?? '—'}</td>
                    <td style={{ padding: '8px 16px' }}>{o.durationMinutes != null ? `${o.durationMinutes} min` : '—'}</td>
                    <td style={{ padding: '8px 16px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                        background: o.onTime ? '#D1FAE5' : '#FEE2E2', color: o.onTime ? '#065F46' : '#991B1B' }}>
                        {o.onTime ? 'On-Time' : 'Late'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
