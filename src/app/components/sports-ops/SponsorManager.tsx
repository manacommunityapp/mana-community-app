import React, { useEffect, useState } from 'react';
import { sportsOpsService, TournamentSponsor } from '../../../services/sports/sportsOpsService';

const TIERS = ['TITLE', 'GOLD', 'SILVER', 'BRONZE'];
const STATUSES = ['PENDING', 'ACTIVE', 'INACTIVE'];

export default function SponsorManager() {
  const [tournamentId, setTournamentId] = useState<number>(1);
  const [sponsors, setSponsors] = useState<TournamentSponsor[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ sponsorName: '', tier: 'GOLD', amount: '', contactName: '', contactEmail: '', benefits: '' });
  const [msg, setMsg] = useState('');

  const load = (tid: number) => {
    setLoading(true);
    sportsOpsService.listSponsors(tid)
      .then(r => setSponsors((r as any)?.data ?? r))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(tournamentId); }, [tournamentId]);

  const submit = async () => {
    if (!form.sponsorName.trim()) return;
    await sportsOpsService.addSponsor({
      tournamentId,
      sponsorName: form.sponsorName,
      tier: form.tier,
      amount: form.amount ? parseFloat(form.amount) : undefined,
      contactName: form.contactName || undefined,
      contactEmail: form.contactEmail || undefined,
      benefits: form.benefits || undefined,
    });
    setMsg('Sponsor added');
    setShowForm(false);
    setForm({ sponsorName: '', tier: 'GOLD', amount: '', contactName: '', contactEmail: '', benefits: '' });
    load(tournamentId);
  };

  const updateStatus = async (id: number, status: string) => {
    await sportsOpsService.updateSponsorStatus(id, status);
    setSponsors(prev => prev.map(s => s.id === id ? { ...s, status } : s));
  };

  const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: 0 }}>Tournament Sponsors</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          <input type="number" value={tournamentId} onChange={e => setTournamentId(Number(e.target.value))}
            style={{ ...inp, width: 120 }} placeholder="Tournament ID" />
          <button onClick={() => setShowForm(v => !v)}
            style={{ padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
            + Add Sponsor
          </button>
        </div>
      </div>
      {msg && <div style={{ padding: '10px 14px', background: '#dcfce7', color: '#16a34a', borderRadius: 8, marginBottom: 12 }}>{msg}</div>}
      {showForm && (
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, marginBottom: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ gridColumn: '1/-1' }}><label style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Sponsor Name *</label>
            <input style={inp} value={form.sponsorName} onChange={e => setForm(f => ({ ...f, sponsorName: e.target.value }))} placeholder="Acme Corp" /></div>
          <div><label style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Tier</label>
            <select style={inp} value={form.tier} onChange={e => setForm(f => ({ ...f, tier: e.target.value }))}>
              {TIERS.map(t => <option key={t}>{t}</option>)}
            </select></div>
          <div><label style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Amount (₹)</label>
            <input style={inp} type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="50000" /></div>
          <div><label style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Contact Name</label>
            <input style={inp} value={form.contactName} onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))} /></div>
          <div><label style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Contact Email</label>
            <input style={inp} type="email" value={form.contactEmail} onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))} /></div>
          <div style={{ gridColumn: '1/-1' }}><label style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Benefits</label>
            <input style={inp} value={form.benefits} onChange={e => setForm(f => ({ ...f, benefits: e.target.value }))} placeholder="Logo on jersey, banner slot…" /></div>
          <button onClick={submit} style={{ gridColumn: '1/-1', padding: '10px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
            Save Sponsor
          </button>
        </div>
      )}
      {loading ? <div style={{ color: '#64748b' }}>Loading…</div> : sponsors.length === 0 ? (
        <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8', background: '#f8fafc', borderRadius: 12 }}>No sponsors for this tournament.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {sponsors.map(s => (
            <div key={s.id} style={{ background: '#fff', borderRadius: 12, padding: 16, border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, color: '#1e293b', fontSize: 16 }}>{s.sponsorName}</p>
                  <p style={{ margin: '2px 0', fontSize: 13, color: '#64748b' }}>Tier: <strong>{s.tier || '—'}</strong>
                    {s.amount && <span style={{ marginLeft: 12 }}>₹{s.amount.toLocaleString()}</span>}</p>
                  {s.contactName && <p style={{ margin: '2px 0', fontSize: 12, color: '#94a3b8' }}>{s.contactName} · {s.contactEmail}</p>}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <select value={s.status} onChange={e => updateStatus(s.id, e.target.value)}
                    style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 12 }}>
                    {STATUSES.map(st => <option key={st}>{st}</option>)}
                  </select>
                </div>
              </div>
              {s.benefits && <p style={{ margin: '8px 0 0', fontSize: 13, color: '#475569' }}>Benefits: {s.benefits}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
