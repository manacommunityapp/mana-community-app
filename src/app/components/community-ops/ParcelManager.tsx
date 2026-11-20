import { useState, useEffect } from 'react';
import communityOpsService, { ParcelDto, ParcelStatus } from '@/services/communityOps/communityOpsService';

type Tab = 'receive' | 'pending' | 'history';

const statusBadge: Record<ParcelStatus, { bg: string; color: string }> = {
  RECEIVED: { bg: '#FEF3C7', color: '#92400E' },
  NOTIFIED: { bg: '#DBEAFE', color: '#1E40AF' },
  PICKED_UP: { bg: '#D1FAE5', color: '#065F46' },
  RETURNED: { bg: '#F3F4F6', color: '#374151' },
  LOST: { bg: '#FEE2E2', color: '#991B1B' },
};

export function ParcelManager() {
  const [tab, setTab] = useState<Tab>('receive');
  const [pending, setPending] = useState<ParcelDto[]>([]);
  const [received, setReceived] = useState<ParcelDto | null>(null);
  const [form, setForm] = useState({ flatNumber: '', senderName: '', courier: '', trackingNumber: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tab === 'pending' || tab === 'history') {
      communityOpsService.getPendingParcels().then(setPending).catch(console.error);
    }
  }, [tab]);

  const handleReceive = async () => {
    if (!form.flatNumber || !form.senderName) { setError('Flat number and sender name are required'); return; }
    setSubmitting(true); setError(null);
    try {
      const parcel = await communityOpsService.receiveParcels({
        flatNumber: form.flatNumber,
        senderName: form.senderName,
        courier: form.courier || undefined,
        trackingNumber: form.trackingNumber || undefined,
        description: form.description || undefined,
      });
      setReceived(parcel);
      setForm({ flatNumber: '', senderName: '', courier: '', trackingNumber: '', description: '' });
    } catch (e: any) {
      setError(e?.message ?? 'Failed to record parcel');
    } finally { setSubmitting(false); }
  };

  return (
    <div style={{ padding: '24px 32px' }}>
      <h1 style={{ margin: '0 0 20px', fontSize: 22, fontWeight: 700, color: '#111827' }}>Parcel Manager</h1>
      <div style={{ display: 'flex', gap: 4, borderBottom: '2px solid #E5E7EB', marginBottom: 24 }}>
        {([['receive', 'Receive Parcel'], ['pending', 'Pending Pickup'], ['history', 'All Parcels']] as [Tab, string][]).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, fontWeight: tab === t ? 700 : 500, color: tab === t ? '#2563EB' : '#6B7280', borderBottom: tab === t ? '2px solid #2563EB' : '2px solid transparent', marginBottom: -2 }}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'receive' && (
        <div style={{ maxWidth: 480 }}>
          {error && <div style={{ padding: '10px 14px', background: '#FEE2E2', color: '#DC2626', borderRadius: 8, marginBottom: 16, fontSize: 14 }}>{error}</div>}

          {received && (
            <div style={{ background: '#D1FAE5', border: '1px solid #6EE7B7', borderRadius: 12, padding: 20, marginBottom: 20 }}>
              <p style={{ margin: '0 0 8px', fontWeight: 700, color: '#065F46', fontSize: 15 }}>Parcel Received! OTP for Resident:</p>
              <div style={{ fontSize: 36, fontWeight: 900, letterSpacing: 8, color: '#059669', textAlign: 'center', padding: '12px 0' }}>{received.otp}</div>
              <p style={{ margin: 0, fontSize: 13, color: '#065F46', textAlign: 'center' }}>Share this with the resident at pickup</p>
              <button onClick={() => setReceived(null)}
                style={{ display: 'block', margin: '12px auto 0', padding: '8px 20px', background: '#059669', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>
                Record Another
              </button>
            </div>
          )}

          {[
            { label: 'Flat Number *', key: 'flatNumber', placeholder: 'e.g. B-301' },
            { label: 'Sender Name *', key: 'senderName', placeholder: 'e.g. Amazon' },
            { label: 'Courier (optional)', key: 'courier', placeholder: 'e.g. BlueDart' },
            { label: 'Tracking Number (optional)', key: 'trackingNumber', placeholder: 'e.g. BD123456789' },
            { label: 'Description (optional)', key: 'description', placeholder: 'e.g. Small box' },
          ].map(({ label, key, placeholder }) => (
            <div key={key} style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{label}</label>
              <input value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
            </div>
          ))}
          <button onClick={handleReceive} disabled={submitting}
            style={{ width: '100%', padding: '12px', background: submitting ? '#93C5FD' : '#2563EB', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 15, fontWeight: 700 }}>
            {submitting ? 'Recording…' : 'Record Parcel & Generate OTP'}
          </button>
        </div>
      )}

      {(tab === 'pending' || tab === 'history') && (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead style={{ background: '#F9FAFB' }}>
            <tr>{['Flat', 'Sender', 'Courier', 'Description', 'Received', 'Status'].map(h => (
              <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#6B7280', fontWeight: 600, fontSize: 12 }}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {pending.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: 20, textAlign: 'center', color: '#9CA3AF' }}>No parcels</td></tr>
            ) : pending.map(p => (
              <tr key={p.id} style={{ borderTop: '1px solid #F3F4F6' }}>
                <td style={{ padding: '10px 12px', fontWeight: 600 }}>{p.flatNumber}</td>
                <td style={{ padding: '10px 12px' }}>{p.senderName}</td>
                <td style={{ padding: '10px 12px', color: '#6B7280' }}>{p.courier ?? '—'}</td>
                <td style={{ padding: '10px 12px', color: '#374151' }}>{p.description ?? '—'}</td>
                <td style={{ padding: '10px 12px', color: '#6B7280', fontSize: 12 }}>{new Date(p.receivedAt).toLocaleString()}</td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600, ...statusBadge[p.status] }}>{p.status.replace('_', ' ')}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
