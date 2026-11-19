import { useState, useEffect } from 'react';
import communityOpsService, { AssetDto, AssetCategory, AssetStatus, MaintenanceLogDto } from '@/services/communityOps/communityOpsService';

type Tab = 'assets' | 'upcoming' | 'log';

const statusColors: Record<AssetStatus, { bg: string; color: string }> = {
  OPERATIONAL: { bg: '#D1FAE5', color: '#065F46' },
  UNDER_MAINTENANCE: { bg: '#FEF3C7', color: '#92400E' },
  OUT_OF_ORDER: { bg: '#FEE2E2', color: '#991B1B' },
  DECOMMISSIONED: { bg: '#F3F4F6', color: '#374151' },
};

const CATEGORIES: AssetCategory[] = ['LIFT', 'GENERATOR', 'PUMP', 'CCTV', 'FIRE_SAFETY', 'ELECTRICAL', 'PLUMBING', 'HVAC', 'GATE', 'OTHER'];

export function AssetMaintenance() {
  const [tab, setTab] = useState<Tab>('assets');
  const [assets, setAssets] = useState<AssetDto[]>([]);
  const [upcoming, setUpcoming] = useState<AssetDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState<Omit<AssetDto, 'id'>>({
    name: '', category: 'LIFT', location: '', status: 'OPERATIONAL',
    serialNumber: '', purchaseDate: '', warrantyExpiry: '', amcExpiry: '',
    nextMaintenanceDate: '', vendor: '', notes: '',
  });
  const [logForm, setLogForm] = useState({
    assetId: 0, taskDescription: '', performedBy: '', cost: '', performedAt: '', nextScheduled: '', notes: '',
  });
  const [logSubmitting, setLogSubmitting] = useState(false);
  const [logSuccess, setLogSuccess] = useState(false);

  useEffect(() => {
    if (tab === 'assets') {
      setLoading(true);
      communityOpsService.getAssets().then(setAssets).catch(console.error).finally(() => setLoading(false));
    } else if (tab === 'upcoming') {
      setLoading(true);
      Promise.all([
        communityOpsService.getUpcomingMaintenance(7),
        communityOpsService.getOverdueAssets(),
      ]).then(([up, over]) => {
        const combined = [...over.map(a => ({ ...a, _overdue: true })), ...up];
        setUpcoming(combined as any);
      }).catch(console.error).finally(() => setLoading(false));
    } else {
      communityOpsService.getAssets().then(setAssets).catch(console.error);
    }
  }, [tab]);

  const handleAddAsset = async () => {
    await communityOpsService.createAsset(addForm);
    setShowAddModal(false);
    communityOpsService.getAssets().then(setAssets);
  };

  const handleLogMaintenance = async () => {
    if (!logForm.assetId || !logForm.taskDescription || !logForm.performedBy || !logForm.performedAt) return;
    setLogSubmitting(true);
    try {
      await communityOpsService.logMaintenance(logForm.assetId, {
        taskDescription: logForm.taskDescription,
        performedBy: logForm.performedBy,
        cost: logForm.cost ? Number(logForm.cost) : undefined,
        performedAt: logForm.performedAt,
        nextScheduled: logForm.nextScheduled || undefined,
        notes: logForm.notes || undefined,
      });
      setLogSuccess(true);
      setLogForm({ assetId: 0, taskDescription: '', performedBy: '', cost: '', performedAt: '', nextScheduled: '', notes: '' });
      setTimeout(() => setLogSuccess(false), 3000);
    } catch { /* handled */ } finally { setLogSubmitting(false); }
  };

  const isOverdue = (date?: string) => date ? new Date(date) < new Date() : false;

  return (
    <div style={{ padding: '24px 32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>Asset Maintenance</h1>
        {tab === 'assets' && (
          <button onClick={() => setShowAddModal(true)}
            style={{ padding: '9px 18px', background: '#2563EB', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
            + Add Asset
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 4, borderBottom: '2px solid #E5E7EB', marginBottom: 24 }}>
        {([['assets', 'Assets'], ['upcoming', 'Upcoming / Overdue'], ['log', 'Log Maintenance']] as [Tab, string][]).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, fontWeight: tab === t ? 700 : 500, color: tab === t ? '#2563EB' : '#6B7280', borderBottom: tab === t ? '2px solid #2563EB' : '2px solid transparent', marginBottom: -2 }}>
            {label}
          </button>
        ))}
      </div>

      {/* Add asset modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: 480, maxHeight: '85vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>Add Asset</h3>
            {[
              { label: 'Asset Name *', key: 'name', type: 'text' },
              { label: 'Location *', key: 'location', type: 'text', placeholder: 'e.g. Basement B1' },
              { label: 'Serial Number', key: 'serialNumber', type: 'text' },
              { label: 'Purchase Date', key: 'purchaseDate', type: 'date' },
              { label: 'Warranty Expiry', key: 'warrantyExpiry', type: 'date' },
              { label: 'AMC Expiry', key: 'amcExpiry', type: 'date' },
              { label: 'Next Maintenance', key: 'nextMaintenanceDate', type: 'date' },
              { label: 'Vendor', key: 'vendor', type: 'text' },
            ].map(({ label, key, type, placeholder }) => (
              <div key={key} style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>{label}</label>
                <input type={type} value={(addForm as any)[key] ?? ''} placeholder={placeholder}
                  onChange={e => setAddForm(f => ({ ...f, [key]: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
              </div>
            ))}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Category</label>
              <select value={addForm.category} onChange={e => setAddForm(f => ({ ...f, category: e.target.value as AssetCategory }))}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 14, background: '#fff' }}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button onClick={handleAddAsset}
                style={{ padding: '9px 20px', background: '#2563EB', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>Save</button>
              <button onClick={() => setShowAddModal(false)}
                style={{ padding: '9px 20px', background: '#F3F4F6', color: '#374151', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {tab === 'assets' && (
        loading ? <p style={{ color: '#9CA3AF' }}>Loading…</p> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead style={{ background: '#F9FAFB' }}>
              <tr>{['Name', 'Category', 'Location', 'Status', 'Warranty', 'AMC', 'Next Maintenance'].map(h => (
                <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#6B7280', fontWeight: 600, fontSize: 12 }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {assets.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: 20, textAlign: 'center', color: '#9CA3AF' }}>No assets registered</td></tr>
              ) : assets.map(a => (
                <tr key={a.id} style={{ borderTop: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 600, color: '#111827' }}>{a.name}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 11, background: '#EDE9FE', color: '#5B21B6', fontWeight: 600 }}>{a.category.replace('_', ' ')}</span>
                  </td>
                  <td style={{ padding: '10px 12px', color: '#374151' }}>{a.location}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600, ...statusColors[a.status] }}>{a.status.replace('_', ' ')}</span>
                  </td>
                  <td style={{ padding: '10px 12px', color: isOverdue(a.warrantyExpiry) ? '#DC2626' : '#374151', fontSize: 12 }}>{a.warrantyExpiry ?? '—'}</td>
                  <td style={{ padding: '10px 12px', color: isOverdue(a.amcExpiry) ? '#DC2626' : '#374151', fontSize: 12 }}>{a.amcExpiry ?? '—'}</td>
                  <td style={{ padding: '10px 12px', color: isOverdue(a.nextMaintenanceDate) ? '#DC2626' : '#374151', fontSize: 12, fontWeight: isOverdue(a.nextMaintenanceDate) ? 700 : 400 }}>{a.nextMaintenanceDate ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      )}

      {tab === 'upcoming' && (
        loading ? <p style={{ color: '#9CA3AF' }}>Loading…</p> : (
          <div>
            <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 12 }}>Overdue tasks highlighted in red. Upcoming tasks within 7 days shown below.</p>
            {upcoming.length === 0 ? <p style={{ color: '#9CA3AF' }}>No upcoming or overdue maintenance</p> : upcoming.map(a => (
              <div key={a.id} style={{ background: (a as any)._overdue ? '#FFF5F5' : '#fff', border: `1px solid ${(a as any)._overdue ? '#FCA5A5' : '#E5E7EB'}`, borderRadius: 10, padding: '12px 16px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontWeight: 700, color: '#111827', marginRight: 10 }}>{a.name}</span>
                  <span style={{ fontSize: 12, color: '#6B7280' }}>{a.location} · {a.category}</span>
                </div>
                <span style={{ fontSize: 13, color: (a as any)._overdue ? '#DC2626' : '#D97706', fontWeight: 700 }}>
                  {(a as any)._overdue ? '⚠️ OVERDUE' : `📅 ${a.nextMaintenanceDate}`}
                </span>
              </div>
            ))}
          </div>
        )
      )}

      {tab === 'log' && (
        <div style={{ maxWidth: 480 }}>
          {logSuccess && <div style={{ padding: '10px 14px', background: '#D1FAE5', color: '#065F46', borderRadius: 8, marginBottom: 16, fontSize: 14, fontWeight: 600 }}>Maintenance logged successfully!</div>}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Asset *</label>
            <select value={logForm.assetId} onChange={e => setLogForm(f => ({ ...f, assetId: Number(e.target.value) }))}
              style={{ width: '100%', padding: '9px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 14, background: '#fff' }}>
              <option value={0}>— Select asset —</option>
              {assets.map(a => <option key={a.id} value={a.id}>{a.name} ({a.location})</option>)}
            </select>
          </div>
          {[
            { label: 'Task Description *', key: 'taskDescription', placeholder: 'What was done?' },
            { label: 'Performed By *', key: 'performedBy', placeholder: 'Technician name or company' },
            { label: 'Cost (₹)', key: 'cost', placeholder: '0' },
            { label: 'Notes', key: 'notes', placeholder: 'Additional notes' },
          ].map(({ label, key, placeholder }) => (
            <div key={key} style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>{label}</label>
              <input value={(logForm as any)[key]} onChange={e => setLogForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
            </div>
          ))}
          {[
            { label: 'Date Performed *', key: 'performedAt' },
            { label: 'Next Scheduled (optional)', key: 'nextScheduled' },
          ].map(({ label, key }) => (
            <div key={key} style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>{label}</label>
              <input type="date" value={(logForm as any)[key]} onChange={e => setLogForm(f => ({ ...f, [key]: e.target.value }))}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
            </div>
          ))}
          <button onClick={handleLogMaintenance} disabled={logSubmitting}
            style={{ width: '100%', padding: '12px', background: logSubmitting ? '#93C5FD' : '#2563EB', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 15, fontWeight: 700 }}>
            {logSubmitting ? 'Saving…' : 'Log Maintenance'}
          </button>
        </div>
      )}
    </div>
  );
}
