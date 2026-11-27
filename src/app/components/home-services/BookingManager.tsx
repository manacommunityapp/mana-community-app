import React, { useEffect, useState, useCallback } from 'react';
import { homeServicesService, HsBooking, HsServicePackage } from '../../../services/homeServices/homeServicesService';

const CATEGORIES = ['PLUMBING','ELECTRICAL','CARPENTRY','PAINTING','CLEANING','PEST_CONTROL','AC_SERVICE','APPLIANCE_REPAIR','GARDENING','LAUNDRY','SECURITY','OTHER'];

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: '#fefce8', text: '#ca8a04' },
  ASSIGNED: { bg: '#eff6ff', text: '#2563eb' },
  WORKER_EN_ROUTE: { bg: '#f0fdf4', text: '#16a34a' },
  IN_PROGRESS: { bg: '#eff6ff', text: '#2563eb' },
  WORK_DONE: { bg: '#dcfce7', text: '#16a34a' },
  COMPLETED: { bg: '#dcfce7', text: '#16a34a' },
  CANCELLED: { bg: '#f1f5f9', text: '#94a3b8' },
  NO_SHOW: { bg: '#fef2f2', text: '#dc2626' },
};

export default function BookingManager() {
  const [bookings, setBookings] = useState<HsBooking[]>([]);
  const [packages, setPackages] = useState<HsServicePackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category: 'PLUMBING', bookingType: 'SCHEDULED' as 'SCHEDULED' | 'INSTANT', description: '', flatNumber: '', scheduledAt: '' });
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [bk, pk] = await Promise.all([homeServicesService.myBookings(), homeServicesService.listPackages()]);
      setBookings(bk); setPackages(pk);
    } catch { setError('Failed to load'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    try {
      await homeServicesService.createBooking(form);
      setShowForm(false);
      setForm({ category: 'PLUMBING', bookingType: 'SCHEDULED' as 'SCHEDULED' | 'INSTANT', description: '', flatNumber: '', scheduledAt: '' });
      load();
    } catch { setError('Failed to create booking'); }
  };

  const cancel = async (id: number) => {
    try { await homeServicesService.cancelBooking(id); load(); }
    catch { setError('Could not cancel'); }
  };

  if (loading) return <div style={{ padding: 24 }}>Loading...</div>;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>My Bookings</h2>
        <button onClick={() => setShowForm(true)} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', cursor: 'pointer', fontWeight: 600 }}>+ Book Service</button>
      </div>
      {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, marginBottom: 16 }}>{error}</div>}

      {showForm && (
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 }}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <select value={form.bookingType} onChange={e => setForm(f => ({ ...f, bookingType: e.target.value as "SCHEDULED" | "INSTANT" }))} style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 }}>
              <option value="SCHEDULED">Scheduled</option>
              <option value="INSTANT">Instant</option>
            </select>
            <input placeholder="Flat number" value={form.flatNumber} onChange={e => setForm(f => ({ ...f, flatNumber: e.target.value }))} style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 }} />
            {form.bookingType === 'SCHEDULED' && <input type="datetime-local" value={form.scheduledAt} onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))} style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 }} />}
            <textarea placeholder="Describe the problem" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ gridColumn: '1/-1', padding: 8, border: '1px solid #cbd5e1', borderRadius: 6, height: 72, resize: 'none' }} />
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button onClick={submit} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', cursor: 'pointer', fontWeight: 600 }}>Confirm Booking</button>
            <button onClick={() => setShowForm(false)} style={{ background: '#e2e8f0', border: 'none', borderRadius: 8, padding: '8px 20px', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {bookings.map(b => {
          const sc = STATUS_COLORS[b.status] || { bg: '#f1f5f9', text: '#64748b' };
          const canCancel = !['WORK_DONE','COMPLETED','CANCELLED'].includes(b.status);
          return (
            <div key={b.id} style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 14, background: '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ fontWeight: 700 }}>{b.category.replace(/_/g, ' ')}</span>
                  <span style={{ marginLeft: 8, fontSize: 12, color: '#94a3b8' }}>{b.bookingType}</span>
                  {b.flatNumber && <div style={{ fontSize: 13, color: '#64748b' }}>Flat {b.flatNumber}</div>}
                  {b.description && <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{b.description}</div>}
                  {b.quotedPrice && <div style={{ fontSize: 13, color: '#1e293b', marginTop: 4 }}>Quoted: ₹{b.quotedPrice}</div>}
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{new Date(b.createdAt).toLocaleString()}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ background: sc.bg, color: sc.text, padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{b.status.replace(/_/g, ' ')}</span>
                  {canCancel && <button onClick={() => cancel(b.id)} style={{ background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: 7, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}>Cancel</button>}
                </div>
              </div>
            </div>
          );
        })}
        {bookings.length === 0 && <div style={{ color: '#94a3b8', textAlign: 'center', padding: 40 }}>No bookings yet</div>}
      </div>
    </div>
  );
}
