import { useState, useEffect, useCallback } from 'react';
import foodOpsService, { DeliverySlot, SlotStatus } from '@/services/food/foodOpsService';

const statusColor: Record<SlotStatus, { bg: string; color: string }> = {
  OPEN: { bg: '#D1FAE5', color: '#065F46' },
  FULL: { bg: '#FEE2E2', color: '#991B1B' },
  CUTOFF: { bg: '#FEF3C7', color: '#92400E' },
  CUTOFF_PASSED: { bg: '#FEF3C7', color: '#92400E' },
  CANCELLED: { bg: '#F3F4F6', color: '#6B7280' },
};

export function DeliverySlotManager() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [slots, setSlots] = useState<DeliverySlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [bookingId, setBookingId] = useState<number | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const communityId = 1; // resolved from auth context in real app

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setSlots(await foodOpsService.getAvailableSlots(communityId, date));
    } catch {
      setMsg('Failed to load slots');
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => { load(); }, [load]);

  const book = async (slotId: number) => {
    setBookingId(slotId);
    try {
      await foodOpsService.bookSlot(slotId);
      setMsg('Slot booked successfully');
      load();
    } catch {
      setMsg('Booking failed — slot may be full');
    } finally {
      setBookingId(null);
    }
  };

  return (
    <div style={{ padding: '24px 32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111827' }}>Delivery Slots</h2>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            style={{ padding: '7px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13 }}
          />
          <button onClick={load} style={{ padding: '8px 16px', border: '1px solid #E5E7EB', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 13 }}>
            ↻ Refresh
          </button>
        </div>
      </div>

      {msg && (
        <div style={{ padding: '10px 16px', marginBottom: 16, borderRadius: 8, background: msg.includes('success') ? '#D1FAE5' : '#FEE2E2', color: msg.includes('success') ? '#065F46' : '#991B1B', fontSize: 13 }}>
          {msg}
          <button onClick={() => setMsg(null)} style={{ marginLeft: 8, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'inherit' }}>✕</button>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>Loading…</div>
      ) : slots.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>No slots for {date}</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {slots.map(slot => {
            const pct = slot.capacity > 0 ? Math.round((slot.bookedCount / slot.capacity) * 100) : 0;
            const sc = statusColor[slot.status];
            return (
              <div key={slot.id} style={{ border: '1px solid #E5E7EB', borderRadius: 12, padding: 20, background: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15, color: '#111827' }}>{slot.startTime} – {slot.endTime}</div>
                    <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{slot.slotDate}</div>
                  </div>
                  <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: sc.bg, color: sc.color }}>
                    {slot.status}
                  </span>
                </div>

                {/* capacity bar */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6B7280', marginBottom: 4 }}>
                    <span>{slot.bookedCount} booked</span>
                    <span>{slot.capacity} capacity</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: '#E5E7EB' }}>
                    <div style={{ height: 6, borderRadius: 3, width: `${pct}%`, background: pct >= 90 ? '#EF4444' : pct >= 60 ? '#F59E0B' : '#10B981', transition: 'width 0.3s' }} />
                  </div>
                </div>

                <button
                  onClick={() => book(slot.id)}
                  disabled={slot.status !== 'OPEN' || bookingId === slot.id}
                  style={{ width: '100%', padding: '8px 0', borderRadius: 8, border: 'none', cursor: slot.status === 'OPEN' ? 'pointer' : 'not-allowed', background: slot.status === 'OPEN' ? '#3B82F6' : '#E5E7EB', color: slot.status === 'OPEN' ? '#fff' : '#9CA3AF', fontWeight: 600, fontSize: 13 }}
                >
                  {bookingId === slot.id ? 'Booking…' : 'Book Slot'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
