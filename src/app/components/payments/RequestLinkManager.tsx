import React, { useEffect, useState, useCallback } from 'react';
import { paymentsService, PaymentRequestLink } from '../../../services/payments/paymentsService';

export default function RequestLinkManager() {
  const [links, setLinks] = useState<PaymentRequestLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ amount: '', description: '', expiresAt: '' });
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setLinks(await paymentsService.listRequestLinks()); }
    catch { setError('Failed to load request links'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    try {
      await paymentsService.createRequestLink({ amount: Number(form.amount), description: form.description, expiresAt: form.expiresAt || undefined });
      setShowForm(false);
      setForm({ amount: '', description: '', expiresAt: '' });
      load();
    } catch { setError('Failed to create link'); }
  };

  const copyLink = (token: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/pay/${token}`).catch(() => {});
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) return <div style={{ padding: 24 }}>Loading...</div>;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Payment Request Links</h2>
        <button onClick={() => setShowForm(true)} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', cursor: 'pointer', fontWeight: 600 }}>+ Create Link</button>
      </div>
      {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, marginBottom: 16 }}>{error}</div>}

      {showForm && (
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <input type="number" placeholder="Amount ₹" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 }} />
            <input type="datetime-local" placeholder="Expires At (optional)" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 }} />
            <input placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ gridColumn: '1/-1', padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 }} />
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button onClick={submit} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', cursor: 'pointer', fontWeight: 600 }}>Generate</button>
            <button onClick={() => setShowForm(false)} style={{ background: '#e2e8f0', border: 'none', borderRadius: 8, padding: '8px 20px', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {links.map(l => (
          <div key={l.id} style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 14, background: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>₹{l.amount}</div>
                {l.description && <div style={{ color: '#64748b', fontSize: 13 }}>{l.description}</div>}
                <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{l.linkToken}</div>
                {l.expiresAt && <div style={{ fontSize: 12, color: '#94a3b8' }}>Expires: {new Date(l.expiresAt).toLocaleString()}</div>}
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ background: l.paid ? '#dcfce7' : '#fefce8', color: l.paid ? '#16a34a' : '#ca8a04', padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{l.paid ? 'Paid' : 'Pending'}</span>
                {!l.paid && (
                  <button onClick={() => copyLink(l.linkToken)} style={{ background: copied === l.linkToken ? '#dcfce7' : '#eff6ff', color: copied === l.linkToken ? '#16a34a' : '#2563eb', border: 'none', borderRadius: 7, padding: '5px 12px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                    {copied === l.linkToken ? 'Copied!' : 'Copy Link'}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {links.length === 0 && <div style={{ color: '#94a3b8', textAlign: 'center', padding: 40 }}>No request links created</div>}
      </div>
    </div>
  );
}
