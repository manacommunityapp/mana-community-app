import { useState, useEffect } from 'react';
import communityOpsService, { WatchlistEntryDto, WatchlistType, WatchlistSeverity } from '@/services/communityOps/communityOpsService';

export function WatchlistManager() {
  const [entries, setEntries] = useState<WatchlistEntryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [checkQuery, setCheckQuery] = useState('');
  const [checkResult, setCheckResult] = useState<{ matched: boolean; entries: WatchlistEntryDto[] } | null>(null);
  const [checking, setChecking] = useState(false);
  const [form, setForm] = useState<{ type: WatchlistType; identifier: string; name: string; reason: string; severity: WatchlistSeverity }>({
    type: 'PERSON', identifier: '', name: '', reason: '', severity: 'CAUTION',
  });
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    communityOpsService.getWatchlist().then(setEntries).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!form.identifier || !form.reason) return;
    setSubmitting(true);
    try {
      await communityOpsService.addWatchlistEntry({
        type: form.type,
        identifier: form.identifier,
        name: form.name || undefined,
        reason: form.reason,
        severity: form.severity,
      });
      setShowAdd(false);
      setForm({ type: 'PERSON', identifier: '', name: '', reason: '', severity: 'CAUTION' });
      load();
    } catch { /* handled */ } finally { setSubmitting(false); }
  };

  const handleRemove = async (id: number) => {
    if (!confirm('Remove this entry from watchlist?')) return;
    await communityOpsService.removeWatchlistEntry(id);
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  const handleCheck = async () => {
    if (!checkQuery.trim()) return;
    setChecking(true);
    try {
      const result = await communityOpsService.checkWatchlist(checkQuery.trim());
      setCheckResult(result);
    } catch { /* handled */ } finally { setChecking(false); }
  };

  return (
    <div style={{ padding: '24px 32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>Watchlist</h1>
        <button onClick={() => setShowAdd(!showAdd)}
          style={{ padding: '9px 18px', background: '#2563EB', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
          + Add Entry
        </button>
      </div>

      {/* Quick check panel */}
      <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 12, padding: 16, marginBottom: 24 }}>
        <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: '#374151' }}>Quick Check</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={checkQuery} onChange={e => setCheckQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCheck()}
            placeholder="Enter name, ID or vehicle number…"
            style={{ flex: 1, padding: '9px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 14 }} />
          <button onClick={handleCheck} disabled={checking}
            style={{ padding: '9px 20px', background: '#374151', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
            {checking ? 'Checking…' : 'Check'}
          </button>
        </div>
        {checkResult && (
          <div style={{ marginTop: 12 }}>
            {checkResult.matched ? (
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#DC2626', margin: '0 0 8px' }}>⚠️ {checkResult.entries.length} match(es) found:</p>
                {checkResult.entries.map(e => (
                  <div key={e.id} style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '8px 12px', marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, color: '#991B1B' }}>{e.identifier}</span>
                    {e.name && <span style={{ color: '#374151', marginLeft: 6 }}>({e.name})</span>}
                    <span style={{ marginLeft: 8, padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: e.severity === 'BLOCKED' ? '#DC2626' : '#FEF3C7', color: e.severity === 'BLOCKED' ? '#fff' : '#92400E' }}>{e.severity}</span>
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: '#6B7280' }}>{e.reason}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 13, color: '#059669', fontWeight: 600, margin: '8px 0 0' }}>✓ No match found</p>
            )}
          </div>
        )}
      </div>

      {/* Add entry form */}
      {showAdd && (
        <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20, marginBottom: 24, maxWidth: 480 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>New Watchlist Entry</h3>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Type</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['PERSON', 'VEHICLE'] as WatchlistType[]).map(t => (
                <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
                  style={{ padding: '7px 16px', border: '1px solid', borderColor: form.type === t ? '#2563EB' : '#E5E7EB', borderRadius: 8, background: form.type === t ? '#2563EB' : '#fff', color: form.type === t ? '#fff' : '#374151', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          {[
            { label: form.type === 'VEHICLE' ? 'Vehicle Number *' : 'ID / Aadhar / Phone *', key: 'identifier', placeholder: form.type === 'VEHICLE' ? 'e.g. KA01AB1234' : 'Identifier' },
            { label: 'Name (optional)', key: 'name', placeholder: 'Full name' },
            { label: 'Reason *', key: 'reason', placeholder: 'Why is this entry being flagged?' },
          ].map(({ label, key, placeholder }) => (
            <div key={key} style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>{label}</label>
              <input value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
            </div>
          ))}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Severity</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['CAUTION', 'BLOCKED'] as WatchlistSeverity[]).map(s => (
                <button key={s} onClick={() => setForm(f => ({ ...f, severity: s }))}
                  style={{ padding: '7px 16px', border: '1px solid', borderColor: form.severity === s ? (s === 'BLOCKED' ? '#DC2626' : '#D97706') : '#E5E7EB', borderRadius: 8, background: form.severity === s ? (s === 'BLOCKED' ? '#DC2626' : '#FEF3C7') : '#fff', color: form.severity === s ? (s === 'BLOCKED' ? '#fff' : '#92400E') : '#374151', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleAdd} disabled={submitting}
              style={{ padding: '9px 20px', background: '#DC2626', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
              {submitting ? 'Adding…' : 'Add to Watchlist'}
            </button>
            <button onClick={() => setShowAdd(false)}
              style={{ padding: '9px 20px', background: '#F3F4F6', color: '#374151', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Entries table */}
      {loading ? <p style={{ color: '#9CA3AF' }}>Loading…</p> : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead style={{ background: '#F9FAFB' }}>
            <tr>{['Type', 'Identifier', 'Name', 'Severity', 'Reason', 'Added', ''].map(h => (
              <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#6B7280', fontWeight: 600, fontSize: 12 }}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: 20, textAlign: 'center', color: '#9CA3AF' }}>No watchlist entries</td></tr>
            ) : entries.map(e => (
              <tr key={e.id} style={{ borderTop: '1px solid #F3F4F6', background: e.severity === 'BLOCKED' ? '#FFF5F5' : '#fff' }}>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: '#F3F4F6', color: '#374151' }}>{e.type}</span>
                </td>
                <td style={{ padding: '10px 12px', fontWeight: 600, color: '#111827' }}>{e.identifier}</td>
                <td style={{ padding: '10px 12px', color: '#374151' }}>{e.name ?? '—'}</td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: e.severity === 'BLOCKED' ? '#FEE2E2' : '#FEF3C7', color: e.severity === 'BLOCKED' ? '#991B1B' : '#92400E' }}>{e.severity}</span>
                </td>
                <td style={{ padding: '10px 12px', color: '#374151', maxWidth: 200 }}>{e.reason}</td>
                <td style={{ padding: '10px 12px', color: '#9CA3AF', fontSize: 12 }}>{new Date(e.addedAt).toLocaleDateString()}</td>
                <td style={{ padding: '10px 12px' }}>
                  <button onClick={() => handleRemove(e.id)}
                    style={{ padding: '4px 10px', background: '#F3F4F6', color: '#6B7280', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
