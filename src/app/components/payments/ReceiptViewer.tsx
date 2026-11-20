import React, { useEffect, useState, useCallback } from 'react';
import { paymentsService, PaymentReceipt } from '../../../services/payments/paymentsService';

export default function ReceiptViewer() {
  const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try { setReceipts(await paymentsService.listReceipts()); }
    catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = receipts.filter(r =>
    r.receiptNumber.toLowerCase().includes(search.toLowerCase()) ||
    r.sourceModule.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div style={{ padding: 24 }}>Loading...</div>;

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ margin: '0 0 16px', fontSize: 20, fontWeight: 700 }}>Payment Receipts</h2>
      <input placeholder="Search by receipt number or module..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, marginBottom: 16, boxSizing: 'border-box' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map(r => (
          <div key={r.id} style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 14, background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: 14 }}>{r.receiptNumber}</div>
              <div style={{ color: '#64748b', fontSize: 13 }}>{r.sourceModule} · Ref #{r.referenceId}</div>
              {r.paymentMethod && <div style={{ color: '#94a3b8', fontSize: 12 }}>{r.paymentMethod}</div>}
              <div style={{ color: '#94a3b8', fontSize: 12 }}>{new Date(r.paidAt).toLocaleString()}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 800, fontSize: 18, color: '#1e293b' }}>₹{r.amount}</div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>{r.currency}</div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div style={{ color: '#94a3b8', textAlign: 'center', padding: 40 }}>No receipts found</div>}
      </div>
    </div>
  );
}
