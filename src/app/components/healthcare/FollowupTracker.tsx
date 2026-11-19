import { useState, useEffect, useCallback } from 'react';
import healthcareService, { PrescriptionFollowup } from '@/services/healthcare/healthcareService';

function daysUntil(dateStr: string) {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

export function FollowupTracker() {
  const [followups, setFollowups] = useState<PrescriptionFollowup[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    try { setFollowups(await healthcareService.getPendingFollowups()); }
    catch { setMsg('Failed to load follow-ups'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const complete = async (id: number) => {
    try {
      await healthcareService.completeFollowup(id);
      setMsg('Follow-up marked complete');
      load();
    } catch { setMsg('Failed to mark complete'); }
  };

  return (
    <div style={{ padding: '24px 32px' }}>
      <h2 style={{ margin: '0 0 20px', fontSize: 20, fontWeight: 700, color: '#111827' }}>Prescription Follow-ups</h2>
      {msg && <div style={{ padding: '10px 16px', marginBottom: 16, borderRadius: 8, background: msg.includes('complete') ? '#D1FAE5' : '#FEE2E2', color: msg.includes('complete') ? '#065F46' : '#991B1B', fontSize: 13 }}>{msg}<button onClick={() => setMsg(null)} style={{ marginLeft: 8, background: 'none', border: 'none', cursor: 'pointer' }}>✕</button></div>}
      {loading ? <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>Loading…</div> : followups.length === 0 ? <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>No pending follow-ups</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {followups.map(f => {
            const days = daysUntil(f.followupDueDate);
            const overdue = days < 0;
            const urgent = days <= 1 && !overdue;
            return (
              <div key={f.id} style={{ border: `1px solid ${overdue ? '#FCA5A5' : urgent ? '#FDE68A' : '#E5E7EB'}`, borderRadius: 12, padding: 16, background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#111827' }}>{f.medicationName}</div>
                  <div style={{ fontSize: 12, color: '#6B7280' }}>Patient #{f.patientUserId} · Due: {f.followupDueDate}</div>
                  {f.dosage && <div style={{ fontSize: 12, color: '#6B7280' }}>Dosage: {f.dosage}</div>}
                  {f.followupNote && <div style={{ fontSize: 12, color: '#6B7280', fontStyle: 'italic', marginTop: 2 }}>{f.followupNote}</div>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                  <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: overdue ? '#FEE2E2' : urgent ? '#FEF3C7' : '#EFF6FF', color: overdue ? '#991B1B' : urgent ? '#92400E' : '#1D4ED8' }}>
                    {overdue ? `${Math.abs(days)}d overdue` : days === 0 ? 'Due today' : `${days}d left`}
                  </span>
                  {f.reminderSent && <span style={{ fontSize: 11, color: '#10B981' }}>✓ Reminded</span>}
                  <button onClick={() => complete(f.id)} style={{ padding: '5px 12px', background: '#10B981', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>Complete</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
