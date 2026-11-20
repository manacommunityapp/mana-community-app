import { useState, useEffect, useCallback } from 'react';
import healthcareService, { ProviderCredential } from '@/services/healthcare/healthcareService';

function daysUntil(dateStr: string) {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

export function CredentialTracker() {
  const [creds, setCreds] = useState<ProviderCredential[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    try { setCreds(await healthcareService.getCredentials()); }
    catch { setMsg('Failed to load credentials'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const verify = async (id: number) => {
    try {
      await healthcareService.verifyCredential(id);
      setMsg('Credential verified');
      load();
    } catch { setMsg('Verification failed'); }
  };

  return (
    <div style={{ padding: '24px 32px' }}>
      <h2 style={{ margin: '0 0 20px', fontSize: 20, fontWeight: 700, color: '#111827' }}>Provider Credentials</h2>
      {msg && <div style={{ padding: '10px 16px', marginBottom: 16, borderRadius: 8, background: msg.includes('verified') ? '#D1FAE5' : '#FEE2E2', color: msg.includes('verified') ? '#065F46' : '#991B1B', fontSize: 13 }}>{msg}<button onClick={() => setMsg(null)} style={{ marginLeft: 8, background: 'none', border: 'none', cursor: 'pointer' }}>✕</button></div>}
      {loading ? <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>Loading…</div> : creds.length === 0 ? <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>No credentials on file</div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {creds.map(c => {
            const days = daysUntil(c.expiryDate);
            const urgent = days <= 7;
            const warn = days <= 30 && !urgent;
            const statusBg = urgent ? '#FEE2E2' : warn ? '#FEF3C7' : '#D1FAE5';
            const statusColor = urgent ? '#991B1B' : warn ? '#92400E' : '#065F46';
            return (
              <div key={c.id} style={{ border: `1px solid ${urgent ? '#FCA5A5' : warn ? '#FDE68A' : '#E5E7EB'}`, borderRadius: 12, padding: 18, background: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontWeight: 600, color: '#111827' }}>{c.credentialType}</div>
                    <div style={{ fontSize: 12, color: '#6B7280' }}>Provider #{c.providerId}</div>
                    {c.credentialNumber && <div style={{ fontSize: 12, color: '#6B7280' }}>#{c.credentialNumber}</div>}
                  </div>
                  <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: statusBg, color: statusColor }}>
                    {days <= 0 ? 'EXPIRED' : `${days}d left`}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: '#374151', marginBottom: 8 }}>Expires: {c.expiryDate}</div>
                {c.issuedBy && <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 8 }}>Issued by: {c.issuedBy}</div>}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {c.verified ? (
                    <span style={{ fontSize: 12, color: '#10B981', fontWeight: 600 }}>✓ Verified</span>
                  ) : (
                    <button onClick={() => verify(c.id)} style={{ padding: '6px 14px', background: '#3B82F6', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Verify</button>
                  )}
                  {c.alertSent7 && <span style={{ fontSize: 11, color: '#DC2626' }}>7-day alert sent</span>}
                  {c.alertSent30 && !c.alertSent7 && <span style={{ fontSize: 11, color: '#D97706' }}>30-day alert sent</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
