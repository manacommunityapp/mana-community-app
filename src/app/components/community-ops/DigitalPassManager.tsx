import { useState, useEffect } from 'react';
import communityOpsService, { DigitalPassDto, PassType, PassStatus } from '@/services/communityOps/communityOpsService';

type Tab = 'active' | 'generate';

const passTypeColors: Record<PassType, string> = {
  DELIVERY: '#DBEAFE',
  DOMESTIC_WORKER: '#D1FAE5',
  GUEST: '#EDE9FE',
  VEHICLE: '#FEF3C7',
  CONTRACTOR: '#FEE2E2',
};

const statusBadge: Record<PassStatus, { bg: string; color: string }> = {
  ACTIVE: { bg: '#D1FAE5', color: '#065F46' },
  USED: { bg: '#F3F4F6', color: '#374151' },
  EXPIRED: { bg: '#FEE2E2', color: '#991B1B' },
  REVOKED: { bg: '#FEE2E2', color: '#991B1B' },
};

const PASS_TYPES: PassType[] = ['DELIVERY', 'DOMESTIC_WORKER', 'GUEST', 'VEHICLE', 'CONTRACTOR'];

export function DigitalPassManager() {
  const [tab, setTab] = useState<Tab>('active');
  const [passes, setPasses] = useState<DigitalPassDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState<DigitalPassDto | null>(null);
  const [form, setForm] = useState({
    flatNumber: '', passType: 'GUEST' as PassType,
    visitorName: '', vehicleNumber: '', purpose: '', validHours: 24,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tab === 'active') {
      setLoading(true);
      communityOpsService.getActivePasses().then(setPasses).catch(console.error).finally(() => setLoading(false));
    }
  }, [tab]);

  const handleGenerate = async () => {
    if (!form.flatNumber || !form.visitorName) { setError('Flat number and visitor name are required'); return; }
    setSubmitting(true); setError(null);
    try {
      const pass = await communityOpsService.generatePass({
        flatNumber: form.flatNumber,
        passType: form.passType,
        visitorName: form.visitorName,
        vehicleNumber: form.vehicleNumber || undefined,
        purpose: form.purpose || undefined,
        validHours: form.validHours,
      });
      setGenerated(pass);
      setForm({ flatNumber: '', passType: 'GUEST', visitorName: '', vehicleNumber: '', purpose: '', validHours: 24 });
    } catch (e: any) {
      setError(e?.message ?? 'Failed to generate pass');
    } finally { setSubmitting(false); }
  };

  const revokePass = async (id: number) => {
    await communityOpsService.revokePass(id);
    setPasses(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div style={{ padding: '24px 32px' }}>
      <h1 style={{ margin: '0 0 20px', fontSize: 22, fontWeight: 700, color: '#111827' }}>Digital Pass Manager</h1>
      <div style={{ display: 'flex', gap: 4, borderBottom: '2px solid #E5E7EB', marginBottom: 24 }}>
        {(['active', 'generate'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, fontWeight: tab === t ? 700 : 500, color: tab === t ? '#2563EB' : '#6B7280', borderBottom: tab === t ? '2px solid #2563EB' : '2px solid transparent', marginBottom: -2 }}>
            {t === 'active' ? 'Active Passes' : 'Generate Pass'}
          </button>
        ))}
      </div>

      {tab === 'active' && (
        loading ? <p style={{ color: '#9CA3AF' }}>Loading…</p> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead style={{ background: '#F9FAFB' }}>
              <tr>{['Flat', 'Type', 'Visitor', 'Valid Until', 'Status', ''].map(h => (
                <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#6B7280', fontWeight: 600, fontSize: 12 }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {passes.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: 20, textAlign: 'center', color: '#9CA3AF' }}>No active passes</td></tr>
              ) : passes.map(p => (
                <tr key={p.id} style={{ borderTop: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 600 }}>{p.flatNumber}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: passTypeColors[p.passType], color: '#374151' }}>{p.passType.replace('_', ' ')}</span>
                  </td>
                  <td style={{ padding: '10px 12px' }}>{p.visitorName}</td>
                  <td style={{ padding: '10px 12px', color: '#374151' }}>{new Date(p.validUntil).toLocaleString()}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600, ...statusBadge[p.status] }}>{p.status}</span>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    {p.status === 'ACTIVE' && (
                      <button onClick={() => revokePass(p.id)}
                        style={{ padding: '4px 10px', background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      )}

      {tab === 'generate' && (
        <div style={{ maxWidth: 480 }}>
          {error && <div style={{ padding: '10px 14px', background: '#FEE2E2', color: '#DC2626', borderRadius: 8, marginBottom: 16, fontSize: 14 }}>{error}</div>}

          {generated && (
            <div style={{ background: '#D1FAE5', border: '1px solid #6EE7B7', borderRadius: 12, padding: 24, marginBottom: 24, textAlign: 'center' }}>
              <p style={{ margin: '0 0 12px', fontWeight: 700, color: '#065F46', fontSize: 16 }}>Pass Generated!</p>
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(generated.token)}`} alt="Pass QR" style={{ borderRadius: 8 }} />
              <p style={{ margin: '12px 0 4px', fontSize: 13, color: '#065F46' }}>Flat: <strong>{generated.flatNumber}</strong> · {generated.visitorName}</p>
              <p style={{ margin: 0, fontSize: 12, color: '#065F46' }}>Valid until: {new Date(generated.validUntil).toLocaleString()}</p>
              <button onClick={() => setGenerated(null)}
                style={{ marginTop: 12, padding: '8px 20px', background: '#059669', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>
                Generate Another
              </button>
            </div>
          )}

          {[
            { label: 'Flat Number *', key: 'flatNumber', type: 'text', placeholder: 'e.g. A-204' },
            { label: 'Visitor Name *', key: 'visitorName', type: 'text', placeholder: 'Full name' },
            { label: 'Vehicle Number (optional)', key: 'vehicleNumber', type: 'text', placeholder: 'e.g. KA01AB1234' },
            { label: 'Purpose (optional)', key: 'purpose', type: 'text', placeholder: 'e.g. Plumber visit' },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key} style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{label}</label>
              <input type={type} value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
            </div>
          ))}

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Pass Type</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {PASS_TYPES.map(t => (
                <button key={t} onClick={() => setForm(f => ({ ...f, passType: t }))}
                  style={{ padding: '6px 14px', border: '1px solid', borderColor: form.passType === t ? '#2563EB' : '#E5E7EB', borderRadius: 999, background: form.passType === t ? '#2563EB' : '#fff', color: form.passType === t ? '#fff' : '#374151', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                  {t.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Valid For</label>
            <select value={form.validHours} onChange={e => setForm(f => ({ ...f, validHours: Number(e.target.value) }))}
              style={{ padding: '9px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 14, background: '#fff' }}>
              <option value={4}>4 hours</option>
              <option value={8}>8 hours</option>
              <option value={24}>24 hours</option>
              <option value={72}>3 days</option>
              <option value={168}>7 days</option>
            </select>
          </div>

          <button onClick={handleGenerate} disabled={submitting}
            style={{ width: '100%', padding: '12px', background: submitting ? '#93C5FD' : '#2563EB', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 15, fontWeight: 700 }}>
            {submitting ? 'Generating…' : 'Generate Pass & QR Code'}
          </button>
        </div>
      )}
    </div>
  );
}
