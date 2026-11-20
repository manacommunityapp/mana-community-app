import React, { useEffect, useState, useCallback } from 'react';
import { paymentsService, BillReminder } from '../../../services/payments/paymentsService';

export default function BillReminderManager() {
  const [reminders, setReminders] = useState<BillReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ billType: '', billerName: '', amount: '', dueDate: '', reminderDays: 3 });
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try { setReminders(await paymentsService.listReminders()); }
    catch { setError('Failed to load reminders'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    try {
      await paymentsService.createReminder({ ...form, amount: form.amount ? Number(form.amount) : undefined });
      setShowForm(false);
      setForm({ billType: '', billerName: '', amount: '', dueDate: '', reminderDays: 3 });
      load();
    } catch { setError('Failed to create reminder'); }
  };

  const markPaid = async (id: number) => {
    try { await paymentsService.markReminderPaid(id); load(); }
    catch { setError('Could not mark as paid'); }
  };

  const isOverdue = (r: BillReminder) => !r.paid && new Date(r.dueDate) < new Date();

  if (loading) return <div style={{ padding: 24 }}>Loading...</div>;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Bill Reminders</h2>
        <button onClick={() => setShowForm(true)} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', cursor: 'pointer', fontWeight: 600 }}>+ Add Reminder</button>
      </div>
      {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, marginBottom: 16 }}>{error}</div>}

      {showForm && (
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <input placeholder="Bill Type (e.g. ELECTRICITY)" value={form.billType} onChange={e => setForm(f => ({ ...f, billType: e.target.value }))} style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 }} />
            <input placeholder="Biller Name" value={form.billerName} onChange={e => setForm(f => ({ ...f, billerName: e.target.value }))} style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 }} />
            <input type="number" placeholder="Amount ₹" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 }} />
            <input type="date" placeholder="Due Date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 }} />
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button onClick={submit} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', cursor: 'pointer', fontWeight: 600 }}>Save</button>
            <button onClick={() => setShowForm(false)} style={{ background: '#e2e8f0', border: 'none', borderRadius: 8, padding: '8px 20px', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {reminders.map(r => {
          const overdue = isOverdue(r);
          return (
            <div key={r.id} style={{ border: `1px solid ${overdue ? '#fca5a5' : '#e2e8f0'}`, borderRadius: 12, padding: 14, background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600 }}>{r.billerName}</div>
                <div style={{ color: '#64748b', fontSize: 13 }}>{r.billType}{r.amount ? ` · ₹${r.amount}` : ''}</div>
                <div style={{ fontSize: 12, color: overdue ? '#dc2626' : '#94a3b8' }}>Due: {new Date(r.dueDate).toLocaleDateString()}{overdue ? ' (OVERDUE)' : ''}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ background: r.paid ? '#dcfce7' : overdue ? '#fef2f2' : '#fefce8', color: r.paid ? '#16a34a' : overdue ? '#dc2626' : '#ca8a04', padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                  {r.paid ? 'Paid' : overdue ? 'Overdue' : 'Pending'}
                </span>
                {!r.paid && <button onClick={() => markPaid(r.id)} style={{ background: '#dcfce7', color: '#16a34a', border: 'none', borderRadius: 7, padding: '5px 12px', cursor: 'pointer', fontWeight: 600 }}>Mark Paid</button>}
              </div>
            </div>
          );
        })}
        {reminders.length === 0 && <div style={{ color: '#94a3b8', textAlign: 'center', padding: 40 }}>No reminders set</div>}
      </div>
    </div>
  );
}
