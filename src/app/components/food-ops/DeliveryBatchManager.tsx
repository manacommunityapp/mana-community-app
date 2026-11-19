import { useState, useCallback } from 'react';
import foodOpsService, { DeliveryBatch } from '@/services/food/foodOpsService';

export function DeliveryBatchManager() {
  const [slotId, setSlotId] = useState('');
  const [batches, setBatches] = useState<DeliveryBatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async (id: number) => {
    setLoading(true);
    try {
      setBatches(await foodOpsService.getBatchesForSlot(id));
    } catch {
      setMsg('Failed to load batches');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleFetch = (e: React.FormEvent) => {
    e.preventDefault();
    if (slotId) load(parseInt(slotId));
  };

  const assign = async (batchId: number, userId: number) => {
    try {
      await foodOpsService.assignDeliveryPerson(batchId, userId);
      setMsg('Assigned');
      load(parseInt(slotId));
    } catch {
      setMsg('Assignment failed');
    }
  };

  const markDelivered = async (batchOrderId: number) => {
    try {
      await foodOpsService.markOrderDelivered(batchOrderId);
      setMsg('Marked delivered');
      load(parseInt(slotId));
    } catch {
      setMsg('Failed to update');
    }
  };

  return (
    <div style={{ padding: '24px 32px' }}>
      <h2 style={{ margin: '0 0 20px', fontSize: 20, fontWeight: 700, color: '#111827' }}>Delivery Batches</h2>

      <form onSubmit={handleFetch} style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginBottom: 24 }}>
        <div>
          <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 4 }}>Slot ID</label>
          <input value={slotId} onChange={e => setSlotId(e.target.value)} required type="number" placeholder="e.g. 7" style={{ padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, width: 120 }} />
        </div>
        <button type="submit" disabled={loading} style={{ padding: '8px 20px', background: '#3B82F6', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
          Load
        </button>
      </form>

      {msg && (
        <div style={{ padding: '10px 16px', marginBottom: 16, borderRadius: 8, background: '#D1FAE5', color: '#065F46', fontSize: 13 }}>
          {msg}<button onClick={() => setMsg(null)} style={{ marginLeft: 8, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'inherit' }}>✕</button>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>Loading…</div>
      ) : batches.length === 0 && slotId ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>No batches for slot #{slotId}</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {batches.map(batch => (
            <div key={batch.id} style={{ border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>Tower {batch.towerIdentifier}</span>
                  <span style={{ marginLeft: 12, fontSize: 12, color: '#6B7280' }}>{batch.orders?.length ?? 0} orders</span>
                </div>
                {!batch.assignedUserId && (
                  <button
                    onClick={() => {
                      const uid = prompt('Enter delivery person user ID:');
                      if (uid && parseInt(uid)) assign(batch.id, parseInt(uid));
                    }}
                    style={{ padding: '6px 14px', border: '1px solid #E5E7EB', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 12 }}
                  >
                    Assign
                  </button>
                )}
                {batch.assignedUserId && <span style={{ fontSize: 12, color: '#6B7280' }}>Assigned: #{batch.assignedUserId}</span>}
              </div>
              {batch.orders && batch.orders.length > 0 && (
                <div>
                  {batch.orders.map(order => (
                    <div key={order.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderBottom: '1px solid #F3F4F6' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>Flat {order.flatNumber}</div>
                        <div style={{ fontSize: 11, color: '#9CA3AF' }}>Order #{order.orderId} · {order.orderType}</div>
                      </div>
                      {order.deliveredAt ? (
                        <span style={{ fontSize: 12, color: '#10B981', fontWeight: 600 }}>✓ Delivered {new Date(order.deliveredAt).toLocaleTimeString()}</span>
                      ) : (
                        <button onClick={() => markDelivered(order.id)} style={{ padding: '5px 12px', background: '#10B981', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
                          Mark Delivered
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
