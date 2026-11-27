import React, { useEffect, useState, useCallback } from 'react';
import { paymentsService, PaymentReconciliation } from '../../../services/payments/paymentsService';

export default function ReconciliationManager() {
  const [records, setRecords] = useState<PaymentReconciliation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ periodStart: '', periodEnd: '', totalCollected: '', totalRefunded: '', totalPending: '' });
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try { setRecords(await paymentsService.listReconciliations()); }
    catch { setError('Failed to load reconciliations'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    try {
      await paymentsService.createReconciliation({
        periodStart: form.periodStart, periodEnd: form.periodEnd,
        totalCollected: Number(form.totalCollected), totalRefunded: Number(form.totalRefunded), totalPending: Number(form.totalPending),
      });
      setShowForm(false);
      setForm({ periodStart: '', periodEnd: '', totalCollected: '', totalRefunded: '', totalPending: '' });
      load();
    } catch { setError('Failed to create reconciliation'); }
  };

  const approve = async (id: number) => {
    try { await paymentsService.approveReconciliation(id); load(); }
    catch { setError('Could not approve'); }
  };

  const statusColor = (s: string) => s === 'APPROVED' ? { bg: '#dcfce7', text: '#16a34a' } : { bg: '#fefce8', text: '#ca8a04' };

  if (loading) return <div style={{ padding: 24 }}>Loading...</div>;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Reconciliation</h2>
        <button onClick={() => setShowForm(true)} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', cursor: 'pointer', fontWeight: 600 }}>+ New Period</button>
      </div>
      {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, marginBottom: 16 }}>{error}</div>}

      {showForm && (
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={{ fontSize: 12, color: '#64748b' }}>Period Start</label><input type="date" value={form.periodStart} onChange={e => setForm(f => ({ ...f, periodStart: e.target.value }))} style={{ display: 'block', width: '100%', padding: 8, border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} /></div>
            <div><label style={{ fontSize: 12, color: '#64748b' }}>Period End</label><input type="date" value={form.periodEnd} onChange={e => setForm(f => ({ ...f, periodEnd: e.target.value }))} style={{ display: 'block', width: '100%', padding: 8, border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} /></div>
            <input type="number" placeholder="Total Collected ₹" value={form.totalCollected} onChange={e => setForm(f => ({ ...f, totalCollected: e.target.value }))} style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 }} />
            <input type="number" placeholder="Total Refunded ₹" value={form.totalRefunded} onChange={e => setForm(f => ({ ...f, totalRefunded: e.target.value }))} style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 }} />
            <input type="number" placeholder="Total Pending ₹" value={form.totalPending} onChange={e => setForm(f => ({ ...f, totalPending: e.target.value }))} style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 }} />
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button onClick={submit} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', cursor: 'pointer', fontWeight: 600 }}>Save Draft</button>
            <button onClick={() => setShowForm(false)} style={{ background: '#e2e8f0', border: 'none', borderRadius: 8, padding: '8px 20px', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {records.map(r => {
          const sc = statusColor(r.status);
          return (
            <div key={r.id} style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 14, background: '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{new Date(r.periodStart).toLocaleDateString()} – {new Date(r.periodEnd).toLocaleDateString()}</div>
                  <div style={{ display: 'flex', gap: 16, marginTop: 6 }}>
                    <span style={{ fontSize: 13, color: '#16a34a' }}>Collected: ₹{r.totalCollected}</span>
                    <span style={{ fontSize: 13, color: '#dc2626' }}>Refunded: ₹{r.totalRefunded}</span>
                    <span style={{ fontSize: 13, color: '#ca8a04' }}>Pending: ₹{r.totalPending}</span>
                  </div>
                  {r.discrepancy !== 0 && <div style={{ fontSize: 12, color: '#dc2626', marginTop: 2 }}>Discrepancy: ₹{r.discrepancy}</div>}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ background: sc.bg, color: sc.text, padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{r.status}</span>
                  {r.status === 'DRAFT' && <button onClick={() => approve(r.id)} style={{ background: '#dcfce7', color: '#16a34a', border: 'none', borderRadius: 7, padding: '5px 12px', cursor: 'pointer', fontWeight: 600 }}>Approve</button>}
                </div>
              </div>
            </div>
          );
        })}
        {records.length === 0 && <div style={{ color: '#94a3b8', textAlign: 'center', padding: 40 }}>No reconciliation records</div>}
      </div>
    </div>
  );
}
