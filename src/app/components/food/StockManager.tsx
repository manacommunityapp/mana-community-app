import React, { useState, useEffect } from 'react';
import { foodOpsService, StockItemDto } from '../../../services/food/foodOpsService';

export function StockManager({ vendorId }: { vendorId?: number }) {
  const vid = vendorId ?? 1;
  const [items, setItems] = useState<StockItemDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [showOutOnly, setShowOutOnly] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [subModal, setSubModal] = useState<{ productId: number; productType: string } | null>(null);
  const [subForm, setSubForm] = useState({ substituteProductId: '', priority: '1' });

  const load = () => {
    setLoading(true);
    // Fetch a list of products with stock status — using a generic stock endpoint
    // The backend returns all products; we simulate with what we have
    foodOpsService.getSubstitutes(vid, 0, 'ALL').then(() => {}).finally(() => setLoading(false));
    // In real usage the backend would have GET /food/stock?vendorId=
    // For now show empty state
    setItems([]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [vid]);

  const toggleStock = async (item: StockItemDto) => {
    if (item.inStock) {
      await foodOpsService.markOutOfStock(vid, item.productId, item.productType);
    } else {
      await foodOpsService.markInStock(vid, item.productId, item.productType);
    }
    load();
  };

  const addSubstitute = async () => {
    if (!subModal) return;
    await foodOpsService.addSubstitute({
      vendorId: vid,
      productId: subModal.productId,
      productType: subModal.productType,
      substituteProductId: Number(subForm.substituteProductId),
      priority: Number(subForm.priority),
    });
    setSubModal(null);
    setSubForm({ substituteProductId: '', priority: '1' });
    load();
  };

  const displayed = showOutOnly ? items.filter(i => !i.inStock) : items;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111827' }}>Stock Management</h2>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#374151', cursor: 'pointer' }}>
          <input type="checkbox" checked={showOutOnly} onChange={e => setShowOutOnly(e.target.checked)} />
          Show out-of-stock only
        </label>
      </div>

      {loading ? <p style={{ color: '#6B7280' }}>Loading…</p> : displayed.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#9CA3AF' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
          <p>No products found. Stock data will appear once the backend provides it.</p>
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#F9FAFB' }}>
              {['Product', 'Type', 'Status', 'Restock Date', 'Substitutes', 'Actions'].map(h => (
                <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#374151', fontWeight: 600, borderBottom: '1px solid #E5E7EB' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayed.map(item => (
              <React.Fragment key={item.productId}>
                <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 600 }}>{item.productName}</td>
                  <td style={{ padding: '10px 12px', color: '#6B7280' }}>{item.productType}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ padding: '2px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                      background: item.inStock ? '#D1FAE5' : '#FEE2E2',
                      color: item.inStock ? '#065F46' : '#991B1B' }}>
                      {item.inStock ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', color: '#6B7280' }}>{item.restockDate ?? '—'}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <button onClick={() => setExpanded(expanded === item.productId ? null : item.productId)}
                      style={{ background: 'none', border: '1px solid #D1D5DB', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontSize: 12 }}>
                      {item.substitutes?.length ?? 0} subs {expanded === item.productId ? '▲' : '▼'}
                    </button>
                  </td>
                  <td style={{ padding: '10px 12px', display: 'flex', gap: 8 }}>
                    <button onClick={() => toggleStock(item)}
                      style={{ background: item.inStock ? '#FEE2E2' : '#D1FAE5', border: 'none', borderRadius: 6,
                        padding: '4px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                        color: item.inStock ? '#991B1B' : '#065F46' }}>
                      {item.inStock ? 'Mark Out' : 'Mark In'}
                    </button>
                    <button onClick={() => setSubModal({ productId: item.productId, productType: item.productType })}
                      style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12, color: '#2563EB' }}>
                      + Sub
                    </button>
                  </td>
                </tr>
                {expanded === item.productId && (
                  <tr>
                    <td colSpan={6} style={{ padding: '8px 24px', background: '#F9FAFB' }}>
                      {(item.substitutes ?? []).length === 0 ? <span style={{ color: '#9CA3AF', fontSize: 13 }}>No substitutes configured.</span> : (
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {item.substitutes.map(s => (
                            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: '4px 10px', fontSize: 13 }}>
                              <span style={{ fontWeight: 600, color: '#374151' }}>P{s.priority}</span>
                              <span>{s.substituteProductName}</span>
                              <button onClick={() => foodOpsService.removeSubstitute(s.id).then(load)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', fontSize: 14 }}>×</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      )}

      {subModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, width: 320, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>Add Substitute</h3>
            {[
              { label: 'Substitute Product ID', key: 'substituteProductId' },
              { label: 'Priority (1=highest)', key: 'priority' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>{f.label}</label>
                <input value={(subForm as any)[f.key]} onChange={e => setSubForm(p => ({ ...p, [f.key]: e.target.value }))}
                  style={{ width: '100%', border: '1px solid #D1D5DB', borderRadius: 8, padding: '8px 10px', fontSize: 14, boxSizing: 'border-box' }} />
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <button onClick={() => setSubModal(null)} style={{ border: '1px solid #D1D5DB', background: '#fff', borderRadius: 8, padding: '8px 16px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={addSubstitute} style={{ background: '#2563EB', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 600 }}>Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
