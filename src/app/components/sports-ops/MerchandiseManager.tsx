import React, { useEffect, useState } from 'react';
import { sportsOpsService, TournamentMerchandise, MerchandiseOrder } from '../../../services/sports/sportsOpsService';

export default function MerchandiseManager() {
  const [tab, setTab] = useState<'shop' | 'orders'>('shop');
  const [tournamentId, setTournamentId] = useState<number>(1);
  const [items, setItems] = useState<TournamentMerchandise[]>([]);
  const [orders, setOrders] = useState<MerchandiseOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ itemName: '', description: '', price: '', stockQty: '' });
  const [orderQtys, setOrderQtys] = useState<Record<number, number>>({});
  const [msg, setMsg] = useState('');

  const loadItems = (tid: number) => {
    setLoading(true);
    sportsOpsService.listMerchandise(tid).then(r => setItems((r as any)?.data ?? r)).finally(() => setLoading(false));
  };
  const loadOrders = () => {
    setLoading(true);
    sportsOpsService.myMerchandiseOrders().then(r => setOrders((r as any)?.data ?? r)).finally(() => setLoading(false));
  };

  useEffect(() => { if (tab === 'shop') loadItems(tournamentId); else loadOrders(); }, [tab, tournamentId]);

  const addItem = async () => {
    if (!form.itemName || !form.price || !form.stockQty) return;
    await sportsOpsService.addMerchandise({ tournamentId, itemName: form.itemName, description: form.description || undefined, price: parseFloat(form.price), stockQty: parseInt(form.stockQty) });
    setMsg('Item added'); setShowAdd(false); setForm({ itemName: '', description: '', price: '', stockQty: '' }); loadItems(tournamentId);
  };

  const placeOrder = async (item: TournamentMerchandise) => {
    const qty = orderQtys[item.id] ?? 1;
    await sportsOpsService.orderMerchandise(item.id, qty);
    setMsg(`Ordered ${qty}x ${item.itemName}`); loadItems(tournamentId);
  };

  const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: 0 }}>Merchandise</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          {tab === 'shop' && <input type="number" value={tournamentId} onChange={e => setTournamentId(Number(e.target.value))}
            style={{ ...inp, width: 120 }} placeholder="Tournament ID" />}
          <button onClick={() => setTab(tab === 'shop' ? 'orders' : 'shop')}
            style={{ padding: '8px 14px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
            {tab === 'shop' ? 'My Orders' : 'Shop'}
          </button>
          {tab === 'shop' && <button onClick={() => setShowAdd(v => !v)}
            style={{ padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
            + Add Item
          </button>}
        </div>
      </div>
      {msg && <div style={{ padding: '10px 14px', background: '#dcfce7', color: '#16a34a', borderRadius: 8, marginBottom: 12 }}>{msg}</div>}
      {showAdd && (
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, marginBottom: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ gridColumn: '1/-1' }}><label style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Item Name *</label>
            <input style={inp} value={form.itemName} onChange={e => setForm(f => ({ ...f, itemName: e.target.value }))} placeholder="Team Jersey" /></div>
          <div><label style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Price (₹) *</label>
            <input style={inp} type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} /></div>
          <div><label style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Stock Qty *</label>
            <input style={inp} type="number" value={form.stockQty} onChange={e => setForm(f => ({ ...f, stockQty: e.target.value }))} /></div>
          <div style={{ gridColumn: '1/-1' }}><label style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Description</label>
            <input style={inp} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
          <button onClick={addItem} style={{ gridColumn: '1/-1', padding: '10px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
            Save Item
          </button>
        </div>
      )}
      {loading ? <div style={{ color: '#64748b' }}>Loading…</div> : tab === 'shop' ? (
        items.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8', background: '#f8fafc', borderRadius: 12 }}>No merchandise available.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
            {items.map(item => (
              <div key={item.id} style={{ background: '#fff', borderRadius: 12, padding: 16, border: '1px solid #e2e8f0' }}>
                <p style={{ margin: '0 0 4px', fontWeight: 700, color: '#1e293b' }}>{item.itemName}</p>
                {item.description && <p style={{ margin: '0 0 8px', fontSize: 13, color: '#64748b' }}>{item.description}</p>}
                <p style={{ margin: '0 0 12px', fontSize: 20, fontWeight: 800, color: '#2563eb' }}>₹{item.price}</p>
                <p style={{ margin: '0 0 12px', fontSize: 12, color: item.stockQty > 0 ? '#16a34a' : '#dc2626' }}>
                  {item.stockQty > 0 ? `${item.stockQty} in stock` : 'Out of stock'}
                </p>
                {item.isAvailable && (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input type="number" min={1} max={item.stockQty} value={orderQtys[item.id] ?? 1}
                      onChange={e => setOrderQtys(q => ({ ...q, [item.id]: Number(e.target.value) }))}
                      style={{ width: 60, padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 14 }} />
                    <button onClick={() => placeOrder(item)}
                      style={{ flex: 1, padding: '8px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                      Order
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      ) : (
        orders.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8', background: '#f8fafc', borderRadius: 12 }}>No orders yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {orders.map(o => (
              <div key={o.id} style={{ background: '#fff', borderRadius: 10, padding: 14, border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 600, color: '#1e293b' }}>Order #{o.id}</p>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>{o.quantity} × ₹{o.unitPrice} = <strong>₹{o.totalAmount}</strong></p>
                </div>
                <p style={{ margin: 0, fontSize: 12, color: '#94a3b8', alignSelf: 'center' }}>{new Date(o.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
