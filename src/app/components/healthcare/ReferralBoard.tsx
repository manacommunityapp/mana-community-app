import { useState, useEffect, useCallback } from 'react';
import healthcareService, { Referral } from '@/services/healthcare/healthcareService';

const statusColor: Record<string, { bg: string; color: string }> = {
  PENDING: { bg: '#EFF6FF', color: '#1D4ED8' },
  APPOINTMENT_BOOKED: { bg: '#FEF3C7', color: '#92400E' },
  COMPLETED: { bg: '#D1FAE5', color: '#065F46' },
  CANCELLED: { bg: '#F3F4F6', color: '#6B7280' },
};

export function ReferralBoard() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const [form, setForm] = useState({ outcomeNotes: '', feedbackToReferrer: '', status: 'COMPLETED' });
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    try { setReferrals(await healthcareService.getReferrals()); }
    catch { setMsg('Failed to load referrals'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateOutcome = async (id: number) => {
    try {
      await healthcareService.updateReferralOutcome(id, form.outcomeNotes, form.feedbackToReferrer, form.status);
      setUpdating(null);
      setForm({ outcomeNotes: '', feedbackToReferrer: '', status: 'COMPLETED' });
      setMsg('Referral updated');
      load();
    } catch { setMsg('Update failed'); }
  };

  const urgencyColor = (u: string) => ({ URGENT: '#DC2626', STAT: '#7C3AED', ROUTINE: '#6B7280' }[u] ?? '#6B7280');

  return (
    <div style={{ padding: '24px 32px' }}>
      <h2 style={{ margin: '0 0 20px', fontSize: 20, fontWeight: 700, color: '#111827' }}>Referrals</h2>
      {msg && <div style={{ padding: '10px 16px', marginBottom: 16, borderRadius: 8, background: '#D1FAE5', color: '#065F46', fontSize: 13 }}>{msg}<button onClick={() => setMsg(null)} style={{ marginLeft: 8, background: 'none', border: 'none', cursor: 'pointer' }}>✕</button></div>}
      {loading ? <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>Loading…</div> : referrals.length === 0 ? <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>No referrals</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {referrals.map(r => {
            const sc = statusColor[r.status] ?? { bg: '#F3F4F6', color: '#6B7280' };
            return (
              <div key={r.id} style={{ border: '1px solid #E5E7EB', borderRadius: 12, padding: 18, background: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontWeight: 600, color: '#111827' }}>{r.referredToName}</div>
                    <div style={{ fontSize: 12, color: '#6B7280' }}>{r.referredToType}{r.specialization ? ` · ${r.specialization}` : ''}</div>
                    <div style={{ fontSize: 12, color: '#6B7280' }}>Patient #{r.patientUserId} · Dr #{r.referringDoctorId} · {r.referralDate}</div>
                    <div style={{ fontSize: 12, color: urgencyColor(r.urgency), fontWeight: 600, marginTop: 2 }}>{r.urgency}</div>
                  </div>
                  <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: sc.bg, color: sc.color }}>{r.status.replace(/_/g, ' ')}</span>
                </div>
                <div style={{ fontSize: 13, color: '#374151', marginBottom: 10 }}>{r.reason}</div>
                {r.outcomeNotes && <div style={{ fontSize: 12, color: '#6B7280', fontStyle: 'italic' }}>Outcome: {r.outcomeNotes}</div>}
                {r.status === 'PENDING' && updating !== r.id && (
                  <button onClick={() => setUpdating(r.id)} style={{ marginTop: 8, padding: '6px 14px', background: '#3B82F6', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Update Outcome</button>
                )}
                {updating === r.id && (
                  <div style={{ marginTop: 10, borderTop: '1px solid #F3F4F6', paddingTop: 10 }}>
                    <textarea value={form.outcomeNotes} onChange={e => setForm(f => ({ ...f, outcomeNotes: e.target.value }))} placeholder="Outcome notes" style={{ width: '100%', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 12, resize: 'none', height: 56, boxSizing: 'border-box', marginBottom: 6 }} />
                    <textarea value={form.feedbackToReferrer} onChange={e => setForm(f => ({ ...f, feedbackToReferrer: e.target.value }))} placeholder="Feedback to referring doctor" style={{ width: '100%', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 12, resize: 'none', height: 56, boxSizing: 'border-box', marginBottom: 6 }} />
                    <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} style={{ padding: '7px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 12, marginBottom: 8 }}>
                      <option value="APPOINTMENT_BOOKED">Appointment Booked</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => updateOutcome(r.id)} style={{ padding: '7px 16px', background: '#10B981', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Save</button>
                      <button onClick={() => setUpdating(null)} style={{ padding: '7px 16px', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, cursor: 'pointer', fontSize: 12 }}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
