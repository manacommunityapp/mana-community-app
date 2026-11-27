import React, { useState, useEffect } from 'react';
import { foodOpsService, DeliverySlotDto, DeliveryBatchDto, ColdChainType } from '../../../services/food/foodOpsService';

const COLD_CHAIN_STYLES: Record<ColdChainType, { bg: string; text: string }> = {
  AMBIENT: { bg: '#F3F4F6', text: '#374151' },
  CHILLED: { bg: '#DBEAFE', text: '#1D4ED8' },
  FROZEN:  { bg: '#E0F2FE', text: '#0369A1' },
};

export function DeliveryBatchView({ vendorId, communityId }: { vendorId?: number; communityId?: number }) {
  const vid = vendorId ?? 1;
  const cid = communityId ?? 1;
  const [slots, setSlots] = useState<DeliverySlotDto[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<number | ''>('');
  const [batches, setBatches] = useState<DeliveryBatchDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [assignModal, setAssignModal] = useState<number | null>(null);
  const [assignName, setAssignName] = useState('');

  useEffect(() => {
    foodOpsService.getSlots(vid, cid).then(setSlots).catch(() => setSlots([]));
  }, [vid, cid]);

  useEffect(() => {
    if (!selectedSlot) { setBatches([]); return; }
    setLoading(true);
    foodOpsService.getBatches(Number(selectedSlot)).then(setBatches).catch(() => setBatches([])).finally(() => setLoading(false));
  }, [selectedSlot]);

  const createBatches = async () => {
    if (!selectedSlot) return;
    await foodOpsService.createBatches(Number(selectedSlot));
    foodOpsService.getBatches(Number(selectedSlot)).then(setBatches);
  };

  const handleAssign = async () => {
    if (assignModal == null) return;
    await foodOpsService.assignBatch(assignModal, 0, assignName);
    setAssignModal(null);
    setAssignName('');
    if (selectedSlot) foodOpsService.getBatches(Number(selectedSlot)).then(setBatches);
  };

  const markDelivered = async (batchOrderId: number) => {
    await foodOpsService.markOrderDelivered(batchOrderId);
    if (selectedSlot) foodOpsService.getBatches(Number(selectedSlot)).then(setBatches);
  };

  const markAllDelivered = async (batch: DeliveryBatchDto) => {
    for (const o of (batch.orders ?? []).filter(o => !o.delivered)) {
      await foodOpsService.markOrderDelivered(o.id);
    }
    if (selectedSlot) foodOpsService.getBatches(Number(selectedSlot)).then(setBatches);
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111827' }}>Delivery Batches</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={selectedSlot} onChange={e => setSelectedSlot(e.target.value ? Number(e.target.value) : '')}
            style={{ border: '1px solid #D1D5DB', borderRadius: 8, padding: '8px 12px', fontSize: 14, minWidth: 200 }}>
            <option value="">Select slot…</option>
            {slots.map(s => (
              <option key={s.id} value={s.id}>{s.slotDate} {s.slotStart}–{s.slotEnd}</option>
            ))}
          </select>
          {selectedSlot && (
            <button onClick={createBatches}
              style={{ background: '#2563EB', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 600 }}>
              Generate Batches
            </button>
          )}
        </div>
      </div>

      {loading ? <p style={{ color: '#6B7280' }}>Loading…</p> : !selectedSlot ? (
        <p style={{ color: '#9CA3AF', textAlign: 'center', padding: 48 }}>Select a slot to view delivery batches.</p>
      ) : batches.length === 0 ? (
        <p style={{ color: '#9CA3AF', textAlign: 'center', padding: 48 }}>No batches yet. Click "Generate Batches" to group orders by tower.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {batches.map(batch => (
            <div key={batch.id} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>{batch.towerName}</span>
                  <span style={{ marginLeft: 12, fontSize: 13, color: '#6B7280' }}>{batch.orderCount} orders</span>
                  {batch.assignedTo ? (
                    <span style={{ marginLeft: 12, fontSize: 13, color: '#059669', fontWeight: 600 }}>→ {batch.assignedTo}</span>
                  ) : (
                    <button onClick={() => setAssignModal(batch.id)}
                      style={{ marginLeft: 12, background: '#FEF3C7', border: '1px solid #D97706', color: '#92400E', borderRadius: 6, padding: '2px 8px', cursor: 'pointer', fontSize: 12 }}>
                      Assign
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => markAllDelivered(batch)}
                    style={{ background: '#D1FAE5', border: '1px solid #6EE7B7', color: '#065F46', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                    Mark All Delivered
                  </button>
                  <button onClick={() => setExpanded(expanded === batch.id ? null : batch.id)}
                    style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#2563EB', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 12 }}>
                    {expanded === batch.id ? 'Hide' : 'View Orders'}
                  </button>
                </div>
              </div>
              {expanded === batch.id && (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#FAFAFA' }}>
                      {['Flat', 'Order ID', 'Cold Chain', 'Status', 'Action'].map(h => (
                        <th key={h} style={{ padding: '8px 16px', textAlign: 'left', color: '#374151', fontWeight: 600, borderBottom: '1px solid #F3F4F6' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(batch.orders ?? []).map(o => {
                      const cc = COLD_CHAIN_STYLES[o.coldChain ?? 'AMBIENT'] ?? { bg: '#F3F4F6', text: '#374151' };
                      return (
                        <tr key={o.id} style={{ borderBottom: '1px solid #F9FAFB' }}>
                          <td style={{ padding: '8px 16px', fontWeight: 600 }}>{o.flatNumber}</td>
                          <td style={{ padding: '8px 16px', color: '#6B7280' }}>#{o.orderId}</td>
                          <td style={{ padding: '8px 16px' }}>
                            <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: cc.bg, color: cc.text }}>{o.coldChain}</span>
                          </td>
                          <td style={{ padding: '8px 16px' }}>
                            {o.delivered ? <span style={{ color: '#059669', fontWeight: 600 }}>✓ Delivered</span> : <span style={{ color: '#9CA3AF' }}>Pending</span>}
                          </td>
                          <td style={{ padding: '8px 16px' }}>
                            {!o.delivered && (
                              <button onClick={() => markDelivered(o.id)}
                                style={{ background: '#D1FAE5', border: 'none', color: '#065F46', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}>
                                Delivered
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          ))}
        </div>
      )}

      {assignModal != null && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, width: 320, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>Assign Delivery Person</h3>
            <input value={assignName} onChange={e => setAssignName(e.target.value)} placeholder="Delivery person name"
              style={{ width: '100%', border: '1px solid #D1D5DB', borderRadius: 8, padding: '8px 10px', fontSize: 14, marginBottom: 16, boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setAssignModal(null)} style={{ border: '1px solid #D1D5DB', background: '#fff', borderRadius: 8, padding: '8px 16px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleAssign} style={{ background: '#2563EB', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 600 }}>Assign</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
