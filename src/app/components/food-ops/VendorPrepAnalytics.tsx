import { useState } from 'react';
import foodOpsService, { VendorPrepSummary } from '@/services/food/foodOpsService';

export function VendorPrepAnalytics() {
  const [vendorId, setVendorId] = useState('');
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [summary, setSummary] = useState<VendorPrepSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorId) return;
    setLoading(true);
    setError(null);
    try {
      setSummary(await foodOpsService.getPrepAnalytics(parseInt(vendorId), from, to));
    } catch {
      setError('Failed to load analytics');
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px 32px' }}>
      <h2 style={{ margin: '0 0 20px', fontSize: 20, fontWeight: 700, color: '#111827' }}>Vendor Prep Analytics</h2>

      <form onSubmit={fetch} style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 28 }}>
        <div>
          <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 4 }}>Vendor ID</label>
          <input value={vendorId} onChange={e => setVendorId(e.target.value)} required type="number" placeholder="e.g. 42" style={{ padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, width: 120 }} />
        </div>
        <div>
          <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 4 }}>From</label>
          <input value={from} onChange={e => setFrom(e.target.value)} type="date" style={{ padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13 }} />
        </div>
        <div>
          <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 4 }}>To</label>
          <input value={to} onChange={e => setTo(e.target.value)} type="date" style={{ padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13 }} />
        </div>
        <button type="submit" disabled={loading} style={{ padding: '8px 20px', background: '#3B82F6', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
          {loading ? 'Loading…' : 'Fetch'}
        </button>
      </form>

      {error && <div style={{ padding: '10px 16px', borderRadius: 8, background: '#FEE2E2', color: '#991B1B', fontSize: 13, marginBottom: 16 }}>{error}</div>}

      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, maxWidth: 640 }}>
          {[
            { label: 'Avg Prep Time', value: `${summary.avgPrepMinutes?.toFixed(1) ?? '—'} min`, color: '#3B82F6', bg: '#EFF6FF' },
            { label: 'On-Time Rate', value: `${summary.onTimePct?.toFixed(1) ?? '—'}%`, color: summary.onTimePct >= 90 ? '#10B981' : summary.onTimePct >= 70 ? '#F59E0B' : '#EF4444', bg: summary.onTimePct >= 90 ? '#D1FAE5' : summary.onTimePct >= 70 ? '#FEF3C7' : '#FEE2E2' },
            { label: 'Total Orders', value: summary.totalOrders?.toString() ?? '0', color: '#7C3AED', bg: '#EDE9FE' },
          ].map(({ label, value, color, bg }) => (
            <div key={label} style={{ border: '1px solid #E5E7EB', borderRadius: 12, padding: 20, background: '#fff', textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
              <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>{label}</div>
              <div style={{ height: 4, borderRadius: 2, background: bg, marginTop: 8 }} />
            </div>
          ))}
        </div>
      )}

      {!summary && !loading && !error && (
        <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>Enter a Vendor ID and date range to view prep analytics</div>
      )}
    </div>
  );
}
