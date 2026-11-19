import React, { useEffect, useState, useCallback } from 'react';
import { homeServicesService, HsRecurringPlan } from '../../../services/homeServices/homeServicesService';

const CATEGORIES = ['PLUMBING','ELECTRICAL','CARPENTRY','PAINTING','CLEANING','PEST_CONTROL','AC_SERVICE','APPLIANCE_REPAIR','GARDENING','LAUNDRY'];
const FREQUENCIES = ['WEEKLY','FORTNIGHTLY','MONTHLY','QUARTERLY'];

export default function RecurringPlanManager() {
  const [plans, setPlans] = useState<HsRecurringPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category: 'CLEANING', frequency: 'MONTHLY', nextServiceDate: '' });
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try { setPlans(await homeServicesService.myPlans()); }
    catch { setError('Failed to load plans'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    try { await homeServicesService.createPlan(form); setShowForm(false); load(); }
    catch { setError('Failed to create plan'); }
  };

  const pause = async (id: number) => {
    try { await homeServicesService.pausePlan(id); load(); } catch {}
  };

  const cancel = async (id: number) => {
    try { await homeServicesService.cancelPlan(id); load(); } catch {}
  };

  if (loading) return <div style={{ padding: 24 }}>Loading...</div>;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Recurring Plans</h2>
        <button onClick={() => setShowForm(true)} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', cursor: 'pointer', fontWeight: 600 }}>+ Add Plan</button>
      </div>
      {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, marginBottom: 16 }}>{error}</div>}

      {showForm && (
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 }}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <select value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))} style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 }}>
              {FREQUENCIES.map(f => <option key={f}>{f}</option>)}
            </select>
            <div><label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 4 }}>First Service Date</label><input type="date" value={form.nextServiceDate} onChange={e => setForm(f => ({ ...f, nextServiceDate: e.target.value }))} style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 6, width: '100%', boxSizing: 'border-box' }} /></div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button onClick={submit} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', cursor: 'pointer', fontWeight: 600 }}>Create Plan</button>
            <button onClick={() => setShowForm(false)} style={{ background: '#e2e8f0', border: 'none', borderRadius: 8, padding: '8px 20px', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {plans.map(p => (
          <div key={p.id} style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 14, background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 700 }}>{p.category.replace(/_/g, ' ')}</div>
              <div style={{ color: '#64748b', fontSize: 13 }}>{p.frequency} · Next: {new Date(p.nextServiceDate).toLocaleDateString()}</div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ background: p.status === 'ACTIVE' ? '#dcfce7' : '#f1f5f9', color: p.status === 'ACTIVE' ? '#16a34a' : '#94a3b8', padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{p.status}</span>
              {p.status === 'ACTIVE' && <button onClick={() => pause(p.id)} style={{ background: '#fefce8', color: '#ca8a04', border: 'none', borderRadius: 7, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}>Pause</button>}
              {p.status !== 'CANCELLED' && <button onClick={() => cancel(p.id)} style={{ background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: 7, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}>Cancel</button>}
            </div>
          </div>
        ))}
        {plans.length === 0 && <div style={{ color: '#94a3b8', textAlign: 'center', padding: 40 }}>No recurring plans</div>}
      </div>
    </div>
  );
}
