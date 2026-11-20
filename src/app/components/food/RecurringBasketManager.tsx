import React, { useState, useEffect } from 'react';
import { foodOpsService, RecurringBasketDto, BasketFrequency, RecurringBasketItemDto } from '../../../services/food/foodOpsService';

const FREQ_COLORS: Record<BasketFrequency, { bg: string; text: string }> = {
  DAILY:       { bg: '#DBEAFE', text: '#1D4ED8' },
  WEEKLY:      { bg: '#D1FAE5', text: '#065F46' },
  FORTNIGHTLY: { bg: '#FEF3C7', text: '#92400E' },
  MONTHLY:     { bg: '#F3E8FF', text: '#6B21A8' },
};

export function RecurringBasketManager() {
  const [baskets, setBaskets] = useState<RecurringBasketDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [editBasket, setEditBasket] = useState<RecurringBasketDto | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newForm, setNewForm] = useState({ name: '', frequency: 'WEEKLY' as BasketFrequency });

  const load = () => {
    setLoading(true);
    foodOpsService.getBaskets().then(setBaskets).catch(() => setBaskets([])).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handlePause = async (id: number) => { await foodOpsService.pauseBasket(id); load(); };
  const handleResume = async (id: number) => { await foodOpsService.resumeBasket(id); load(); };
  const handleDelete = async (id: number) => {
    if (!confirm('Cancel this recurring basket?')) return;
    await foodOpsService.deleteBasket(id);
    load();
  };

  const handleCreate = async () => {
    await foodOpsService.createBasket(newForm);
    setShowCreate(false);
    setNewForm({ name: '', frequency: 'WEEKLY' });
    load();
  };

  const handleSaveEdit = async () => {
    if (!editBasket) return;
    await foodOpsService.updateBasket(editBasket.id, editBasket);
    setEditBasket(null);
    load();
  };

  const toggleSubstitute = (itemId: number) => {
    if (!editBasket) return;
    setEditBasket(prev => prev ? {
      ...prev,
      items: prev.items.map(i => i.id === itemId ? { ...i, acceptSubstitute: !i.acceptSubstitute } : i)
    } : null);
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111827' }}>Recurring Baskets</h2>
        <button onClick={() => setShowCreate(true)}
          style={{ background: '#2563EB', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 600 }}>
          + New Basket
        </button>
      </div>

      {loading ? <p style={{ color: '#6B7280' }}>Loading…</p> : baskets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#9CA3AF' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🧺</div>
          <p>No recurring baskets. Create one to auto-order your essentials.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {baskets.map(b => {
            const fc = FREQ_COLORS[b.frequency];
            return (
              <div key={b.id} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: '#111827' }}>{b.name}</div>
                    <div style={{ marginTop: 4, display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: fc.bg, color: fc.text }}>{b.frequency}</span>
                      <span style={{ fontSize: 13, color: '#6B7280' }}>Next: {b.nextOrderDate ?? '—'}</span>
                      <span style={{ fontSize: 13, color: '#6B7280' }}>{b.items?.length ?? 0} items</span>
                    </div>
                    <div style={{ marginTop: 4, fontSize: 13, color: '#6B7280' }}>Vendor: {b.vendorName}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setEditBasket(b)}
                      style={{ border: '1px solid #2563EB', color: '#2563EB', background: '#EFF6FF', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                      Edit
                    </button>
                    {b.status === 'ACTIVE' ? (
                      <button onClick={() => handlePause(b.id)}
                        style={{ border: '1px solid #D97706', color: '#D97706', background: '#FEF3C7', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                        Pause
                      </button>
                    ) : b.status === 'PAUSED' ? (
                      <button onClick={() => handleResume(b.id)}
                        style={{ border: '1px solid #059669', color: '#059669', background: '#D1FAE5', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                        Resume
                      </button>
                    ) : null}
                    <button onClick={() => handleDelete(b.id)}
                      style={{ border: '1px solid #DC2626', color: '#DC2626', background: '#FEE2E2', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, width: 360, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>New Recurring Basket</h3>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Basket Name</label>
            <input value={newForm.name} onChange={e => setNewForm(p => ({ ...p, name: e.target.value }))}
              style={{ width: '100%', border: '1px solid #D1D5DB', borderRadius: 8, padding: '8px 10px', fontSize: 14, marginBottom: 12, boxSizing: 'border-box' }} />
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Frequency</label>
            <select value={newForm.frequency} onChange={e => setNewForm(p => ({ ...p, frequency: e.target.value as BasketFrequency }))}
              style={{ width: '100%', border: '1px solid #D1D5DB', borderRadius: 8, padding: '8px 10px', fontSize: 14, marginBottom: 16 }}>
              {(['DAILY', 'WEEKLY', 'FORTNIGHTLY', 'MONTHLY'] as BasketFrequency[]).map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowCreate(false)} style={{ border: '1px solid #D1D5DB', background: '#fff', borderRadius: 8, padding: '8px 16px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleCreate} style={{ background: '#2563EB', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 600 }}>Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editBasket && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, width: 480, maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>Edit Basket: {editBasket.name}</h3>
            {(editBasket.items ?? []).length === 0 ? (
              <p style={{ color: '#9CA3AF' }}>No items in this basket yet.</p>
            ) : (
              <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F9FAFB' }}>
                    {['Item', 'Qty', 'Unit Price', 'Accept Sub'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: '#374151', fontWeight: 600, borderBottom: '1px solid #E5E7EB' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {editBasket.items.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                      <td style={{ padding: '8px 10px' }}>{item.productName}</td>
                      <td style={{ padding: '8px 10px' }}>{item.quantity} {item.unit}</td>
                      <td style={{ padding: '8px 10px' }}>₹{item.unitPrice}</td>
                      <td style={{ padding: '8px 10px' }}>
                        <input type="checkbox" checked={item.acceptSubstitute}
                          onChange={() => toggleSubstitute(item.id)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <button onClick={() => setEditBasket(null)} style={{ border: '1px solid #D1D5DB', background: '#fff', borderRadius: 8, padding: '8px 16px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSaveEdit} style={{ background: '#2563EB', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 600 }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
