import { useState, useEffect } from 'react';
import communityOpsService, { MoveRequestDto, MoveStatus, MoveType } from '@/services/communityOps/communityOpsService';

const statusColors: Record<MoveStatus, { bg: string; color: string }> = {
  REQUESTED: { bg: '#FEE2E2', color: '#991B1B' },
  APPROVED: { bg: '#DBEAFE', color: '#1E40AF' },
  IN_PROGRESS: { bg: '#FEF3C7', color: '#92400E' },
  COMPLETED: { bg: '#D1FAE5', color: '#065F46' },
  CANCELLED: { bg: '#F3F4F6', color: '#374151' },
  REJECTED: { bg: '#FEE2E2', color: '#991B1B' },
};

export function MoveRequestManager() {
  const [requests, setRequests] = useState<MoveRequestDto[]>([]);
  const [statusFilter, setStatusFilter] = useState<MoveStatus | ''>('');
  const [expanded, setExpanded] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ moveType: 'MOVE_IN' as MoveType, plannedDate: '', vehicleNumber: '', moversCompany: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await communityOpsService.getAllMoveRequests(statusFilter || undefined);
      setRequests(data);
    } catch { /* handled */ } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [statusFilter]);

  const approve = async (id: number) => {
    await communityOpsService.approveMoveRequest(id);
    load();
  };

  const reject = async (id: number) => {
    const reason = prompt('Rejection reason:');
    if (reason === null) return;
    await communityOpsService.rejectMoveRequest(id, reason);
    load();
  };

  const toggleChecklist = async (reqId: number, itemId: number, completed: boolean) => {
    await communityOpsService.updateChecklistItem(reqId, itemId, completed);
    setRequests(prev => prev.map(r => r.id === reqId
      ? { ...r, checklist: r.checklist.map(c => c.id === itemId ? { ...c, completed } : c) }
      : r
    ));
  };

  const issueNoc = async (id: number) => {
    await communityOpsService.issueNoc(id);
    load();
  };

  const submitRequest = async () => {
    if (!form.plannedDate) return;
    setSubmitting(true);
    try {
      await communityOpsService.createMoveRequest(form);
      setShowForm(false);
      setForm({ moveType: 'MOVE_IN', plannedDate: '', vehicleNumber: '', moversCompany: '', notes: '' });
      load();
    } catch { /* handled */ } finally { setSubmitting(false); }
  };

  const statuses: (MoveStatus | '')[] = ['', 'REQUESTED', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED'];

  return (
    <div style={{ padding: '24px 32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>Move Requests</h1>
        <button onClick={() => setShowForm(!showForm)}
          style={{ padding: '9px 18px', background: '#2563EB', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
          + New Request
        </button>
      </div>

      {showForm && (
        <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20, marginBottom: 24, maxWidth: 480 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>New Move Request</h3>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Move Type</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['MOVE_IN', 'MOVE_OUT'] as MoveType[]).map(t => (
                <button key={t} onClick={() => setForm(f => ({ ...f, moveType: t }))}
                  style={{ padding: '7px 16px', border: '1px solid', borderColor: form.moveType === t ? '#2563EB' : '#E5E7EB', borderRadius: 8, background: form.moveType === t ? '#2563EB' : '#fff', color: form.moveType === t ? '#fff' : '#374151', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                  {t.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
          {[
            { label: 'Planned Date *', key: 'plannedDate', type: 'date' },
            { label: 'Vehicle Number', key: 'vehicleNumber', type: 'text', placeholder: 'e.g. KA01AB1234' },
            { label: 'Movers Company', key: 'moversCompany', type: 'text', placeholder: 'Company name' },
            { label: 'Notes', key: 'notes', type: 'text', placeholder: 'Any special instructions' },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key} style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>{label}</label>
              <input type={type} value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button onClick={submitRequest} disabled={submitting}
              style={{ padding: '9px 20px', background: '#2563EB', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
              {submitting ? 'Submitting…' : 'Submit Request'}
            </button>
            <button onClick={() => setShowForm(false)}
              style={{ padding: '9px 20px', background: '#F3F4F6', color: '#374151', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {statuses.map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            style={{ padding: '5px 14px', border: '1px solid', borderColor: statusFilter === s ? '#2563EB' : '#E5E7EB', borderRadius: 999, background: statusFilter === s ? '#2563EB' : '#fff', color: statusFilter === s ? '#fff' : '#374151', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {loading ? <p style={{ color: '#9CA3AF' }}>Loading…</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {requests.length === 0 ? <p style={{ color: '#9CA3AF' }}>No move requests</p> : requests.map(r => {
            const allMandatoryDone = r.checklist.filter(c => c.mandatory).every(c => c.completed);
            return (
              <div key={r.id} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
                <div onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                  style={{ padding: '14px 20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, color: '#111827' }}>{r.flatNumber}</span>
                    <span style={{ fontSize: 13, color: '#374151' }}>{r.residentName}</span>
                    <span style={{ padding: '2px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: r.moveType === 'MOVE_IN' ? '#D1FAE5' : '#FEE2E2', color: r.moveType === 'MOVE_IN' ? '#065F46' : '#991B1B' }}>{r.moveType.replace('_', ' ')}</span>
                    <span style={{ fontSize: 13, color: '#6B7280' }}>{r.plannedDate}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600, ...statusColors[r.status] }}>{r.status}</span>
                    <span style={{ color: '#9CA3AF' }}>{expanded === r.id ? '▲' : '▼'}</span>
                  </div>
                </div>
                {expanded === r.id && (
                  <div style={{ borderTop: '1px solid #F3F4F6', padding: '16px 20px' }}>
                    {r.checklist.length > 0 && (
                      <div style={{ marginBottom: 16 }}>
                        <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: '#374151' }}>Checklist</p>
                        {r.checklist.map(item => (
                          <label key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, cursor: 'pointer' }}>
                            <input type="checkbox" checked={item.completed}
                              onChange={e => toggleChecklist(r.id, item.id, e.target.checked)} />
                            <span style={{ fontSize: 13, color: '#374151', textDecoration: item.completed ? 'line-through' : 'none' }}>
                              {item.description}{item.mandatory && <span style={{ color: '#DC2626', marginLeft: 4 }}>*</span>}
                            </span>
                          </label>
                        ))}
                        {!allMandatoryDone && <p style={{ fontSize: 11, color: '#DC2626', margin: '4px 0 0' }}>* Mandatory items must be completed before NOC</p>}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 8 }}>
                      {r.status === 'REQUESTED' && (
                        <>
                          <button onClick={() => approve(r.id)}
                            style={{ padding: '7px 16px', background: '#059669', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Approve</button>
                          <button onClick={() => reject(r.id)}
                            style={{ padding: '7px 16px', background: '#DC2626', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Reject</button>
                        </>
                      )}
                      {r.status === 'APPROVED' && !r.nocIssued && (
                        <button onClick={() => issueNoc(r.id)} disabled={!allMandatoryDone}
                          style={{ padding: '7px 16px', background: allMandatoryDone ? '#7C3AED' : '#E5E7EB', color: allMandatoryDone ? '#fff' : '#9CA3AF', border: 'none', borderRadius: 8, cursor: allMandatoryDone ? 'pointer' : 'not-allowed', fontSize: 13, fontWeight: 600 }}>
                          Issue NOC
                        </button>
                      )}
                      {r.nocIssued && <span style={{ fontSize: 13, color: '#059669', fontWeight: 600 }}>✓ NOC Issued</span>}
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
