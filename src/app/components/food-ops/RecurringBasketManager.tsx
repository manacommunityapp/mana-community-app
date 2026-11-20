import { useState, useEffect, useCallback } from 'react';
import foodOpsService, { RecurringBasket, BasketFrequency, BasketStatus } from '@/services/food/foodOpsService';

const freqLabel: Record<BasketFrequency, string> = {
  DAILY: 'Daily', WEEKLY: 'Weekly', FORTNIGHTLY: 'Fortnightly', MONTHLY: 'Monthly',
};

const statusStyle: Record<BasketStatus, { bg: string; color: string }> = {
  ACTIVE: { bg: '#D1FAE5', color: '#065F46' },
  PAUSED: { bg: '#FEF3C7', color: '#92400E' },
  CANCELLED: { bg: '#FEE2E2', color: '#991B1B' },
};

export function RecurringBasketManager() {
  const [baskets, setBaskets] = useState<RecurringBasket[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', frequency: 'WEEKLY' as BasketFrequency, vendorId: '', nextOrderDate: '' });

  const load = useCallback(async () => {
    try {
      setBaskets(await foodOpsService.getMyBaskets());
    } catch {
      setMsg('Failed to load baskets');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await foodOpsService.createBasket({
        vendorId: parseInt(form.vendorId),
        name: form.name,
        frequency: form.frequency,
        nextOrderDate: form.nextOrderDate,
      });
      setCreating(false);
      setForm({ name: '', frequency: 'WEEKLY', vendorId: '', nextOrderDate: '' });
      setMsg('Basket created');
      load();
    } catch {
      setMsg('Failed to create basket');
    }
  };

  const togglePause = async (basket: RecurringBasket) => {
    try {
      if (basket.status === 'ACTIVE') {
        await foodOpsService.pauseBasket(basket.id);
      } else if (basket.status === 'PAUSED') {
        await foodOpsService.resumeBasket(basket.id);
      }
      load();
    } catch {
      setMsg('Failed to update basket');
    }
  };

  const cancel = async (id: number) => {
    if (!confirm('Cancel this recurring basket?')) return;
    try {
      await foodOpsService.cancelBasket(id);
      load();
    } catch {
      setMsg('Failed to cancel basket');
    }
  };

  return (
    <div style={{ padding: '24px 32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111827' }}>Recurring Baskets</h2>
        <button onClick={() => setCreating(true)} style={{ padding: '8px 18px', background: '#3B82F6', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
          + New Basket
        </button>
      </div>

      {msg && (
        <div style={{ padding: '10px 16px', marginBottom: 16, borderRadius: 8, background: msg.includes('success') || msg.includes('created') ? '#D1FAE5' : '#FEE2E2', color: msg.includes('success') || msg.includes('created') ? '#065F46' : '#991B1B', fontSize: 13 }}>
          {msg}<button onClick={() => setMsg(null)} style={{ marginLeft: 8, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'inherit' }}>✕</button>
        </div>
      )}

      {creating && (
        <form onSubmit={handleCreate} style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20, marginBottom: 24 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600 }}>New Recurring Basket</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 4 }}>Basket Name</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required style={{ width: '100%', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 4 }}>Vendor ID</label>
              <input value={form.vendorId} onChange={e => setForm(f => ({ ...f, vendorId: e.target.value }))} required type="number" style={{ width: '100%', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 4 }}>Frequency</label>
              <select value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value as BasketFrequency }))} style={{ width: '100%', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }}>
                {(Object.keys(freqLabel) as BasketFrequency[]).map(f => <option key={f} value={f}>{freqLabel[f]}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 4 }}>Next Order Date</label>
              <input value={form.nextOrderDate} onChange={e => setForm(f => ({ ...f, nextOrderDate: e.target.value }))} required type="date" style={{ width: '100%', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button type="submit" style={{ padding: '8px 20px', background: '#3B82F6', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Create</button>
            <button type="button" onClick={() => setCreating(false)} style={{ padding: '8px 20px', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>Cancel</button>
          </div>
        </form>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>Loading…</div>
      ) : baskets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>No recurring baskets yet</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {baskets.map(basket => {
            const ss = statusStyle[basket.status];
            return (
              <div key={basket.id} style={{ border: '1px solid #E5E7EB', borderRadius: 12, padding: 20, background: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15, color: '#111827' }}>{basket.name}</div>
                    <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>Vendor #{basket.vendorId}</div>
                  </div>
                  <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: ss.bg, color: ss.color }}>
                    {basket.status}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: '#374151', marginBottom: 4 }}>
                  <span style={{ fontWeight: 500 }}>Frequency:</span> {freqLabel[basket.frequency]}
                </div>
                <div style={{ fontSize: 13, color: '#374151', marginBottom: 16 }}>
                  <span style={{ fontWeight: 500 }}>Next order:</span> {basket.nextOrderDate}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {basket.status !== 'CANCELLED' && (
                    <button onClick={() => togglePause(basket)} style={{ flex: 1, padding: '7px 0', border: '1px solid #E5E7EB', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 12, color: '#374151' }}>
                      {basket.status === 'ACTIVE' ? '⏸ Pause' : '▶ Resume'}
                    </button>
                  )}
                  {basket.status !== 'CANCELLED' && (
                    <button onClick={() => cancel(basket.id)} style={{ flex: 1, padding: '7px 0', border: '1px solid #FCA5A5', borderRadius: 8, background: '#FFF5F5', cursor: 'pointer', fontSize: 12, color: '#DC2626' }}>
                      ✕ Cancel
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
