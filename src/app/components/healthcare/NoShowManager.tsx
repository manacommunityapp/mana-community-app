import { useState, useEffect, useCallback } from 'react';
import healthcareService, { AppointmentNoShow } from '@/services/healthcare/healthcareService';

export function NoShowManager() {
  const [records, setRecords] = useState<AppointmentNoShow[]>([]);
  const [loading, setLoading] = useState(true);
  const [waiving, setWaiving] = useState<number | null>(null);
  const [reason, setReason] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    try { setRecords(await healthcareService.getNoShows()); }
    catch { setMsg('Failed to load no-shows'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const waive = async (id: number) => {
    try {
      await healthcareService.waiveNoShowFee(id, reason);
      setWaiving(null);
      setReason('');
      setMsg('Fee waived');
      load();
    } catch { setMsg('Failed to waive fee'); }
  };

  return (
    <div style={{ padding: '24px 32px' }}>
      <h2 style={{ margin: '0 0 20px', fontSize: 20, fontWeight: 700, color: '#111827' }}>Appointment No-Shows</h2>
      {msg && <div style={{ padding: '10px 16px', marginBottom: 16, borderRadius: 8, background: msg.includes('waived') ? '#D1FAE5' : '#FEE2E2', color: msg.includes('waived') ? '#065F46' : '#991B1B', fontSize: 13 }}>{msg}<button onClick={() => setMsg(null)} style={{ marginLeft: 8, background: 'none', border: 'none', cursor: 'pointer' }}>✕</button></div>}
      {loading ? <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>Loading…</div> : records.length === 0 ? <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>No no-shows recorded</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {records.map(r => (
            <div key={r.id} style={{ border: '1px solid #E5E7EB', borderRadius: 12, padding: 18, background: '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#111827' }}>Appointment #{r.appointmentId}</div>
                  <div style={{ fontSize: 12, color: '#6B7280' }}>Patient #{r.patientUserId} · Doctor #{r.doctorId} · {new Date(r.noShowAt).toLocaleDateString()}</div>
                  {r.feeCharged && <div style={{ fontSize: 13, marginTop: 4, color: '#374151' }}>Fee: ₹{r.feeCharged} {r.feeWaived && <span style={{ color: '#059669', fontWeight: 600 }}>(Waived)</span>}</div>}
                </div>
                {!r.feeWaived && r.feeCharged && (
                  <button onClick={() => setWaiving(r.id)} style={{ padding: '6px 14px', border: '1px solid #E5E7EB', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 12 }}>Waive Fee</button>
                )}
              </div>
              {waiving === r.id && (
                <div style={{ marginTop: 12, borderTop: '1px solid #F3F4F6', paddingTop: 12 }}>
                  <input value={reason} onChange={e => setReason(e.target.value)} placeholder="Waiver reason" style={{ width: '100%', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, marginBottom: 8, boxSizing: 'border-box' }} />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => waive(r.id)} style={{ padding: '7px 16px', background: '#10B981', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Confirm Waiver</button>
                    <button onClick={() => { setWaiving(null); setReason(''); }} style={{ padding: '7px 16px', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
