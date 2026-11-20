import { useState, useEffect, useCallback } from 'react';
import healthcareService, { DiagnosticsSla } from '@/services/healthcare/healthcareService';

export function DiagnosticsSlaMonitor() {
  const [records, setRecords] = useState<DiagnosticsSla[]>([]);
  const [showBreaches, setShowBreaches] = useState(false);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRecords(showBreaches ? await healthcareService.getDiagnosticsBreaches() : await healthcareService.getDiagnosticsSla());
    } catch { setMsg('Failed to load SLA records'); }
    finally { setLoading(false); }
  }, [showBreaches]);

  useEffect(() => { load(); }, [load]);

  const markDelivered = async (id: number) => {
    try {
      await healthcareService.markSlaDelivered(id);
      setMsg('Report marked delivered');
      load();
    } catch { setMsg('Failed to update'); }
  };

  const escalate = async (id: number) => {
    const notes = prompt('Escalation notes:') || '';
    try {
      await healthcareService.escalateSla(id, notes);
      setMsg('Escalated');
      load();
    } catch { setMsg('Escalation failed'); }
  };

  return (
    <div style={{ padding: '24px 32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111827' }}>Diagnostics SLA</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['All', 'Breaches'] as const).map(label => (
            <button key={label} onClick={() => setShowBreaches(label === 'Breaches')} style={{ padding: '7px 16px', border: '1px solid #E5E7EB', borderRadius: 8, cursor: 'pointer', fontSize: 12, background: (label === 'Breaches') === showBreaches ? '#3B82F6' : '#fff', color: (label === 'Breaches') === showBreaches ? '#fff' : '#374151', fontWeight: (label === 'Breaches') === showBreaches ? 600 : 400 }}>
              {label}
            </button>
          ))}
        </div>
      </div>
      {msg && <div style={{ padding: '10px 16px', marginBottom: 16, borderRadius: 8, background: '#D1FAE5', color: '#065F46', fontSize: 13 }}>{msg}<button onClick={() => setMsg(null)} style={{ marginLeft: 8, background: 'none', border: 'none', cursor: 'pointer' }}>✕</button></div>}
      {loading ? <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>Loading…</div> : records.length === 0 ? <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>No records</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {records.map(s => (
            <div key={s.id} style={{ border: `1px solid ${s.breach ? '#FCA5A5' : '#E5E7EB'}`, borderRadius: 12, padding: 16, background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600, color: '#111827' }}>{s.partnerName}</div>
                <div style={{ fontSize: 12, color: '#6B7280' }}>{s.testCategory} · SLA: {s.slaHours}h · Patient #{s.patientUserId}</div>
                <div style={{ fontSize: 12, color: '#6B7280' }}>Due: {new Date(s.reportDueAt).toLocaleString()}</div>
                {s.reportDeliveredAt && <div style={{ fontSize: 12, color: '#10B981' }}>Delivered: {new Date(s.reportDeliveredAt).toLocaleString()}</div>}
                {s.escalated && <div style={{ fontSize: 12, color: '#7C3AED', fontWeight: 600 }}>Escalated</div>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                {s.breach && <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: '#FEE2E2', color: '#991B1B' }}>BREACH</span>}
                {!s.reportDeliveredAt && (
                  <button onClick={() => markDelivered(s.id)} style={{ padding: '5px 12px', background: '#10B981', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>Mark Delivered</button>
                )}
                {s.breach && !s.escalated && (
                  <button onClick={() => escalate(s.id)} style={{ padding: '5px 12px', background: '#7C3AED', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>Escalate</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
