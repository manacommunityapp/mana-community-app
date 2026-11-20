import React, { useEffect, useState, useCallback } from 'react';
import { homeServicesService, HsWorker } from '../../../services/homeServices/homeServicesService';

const CATEGORIES = ['','PLUMBING','ELECTRICAL','CARPENTRY','PAINTING','CLEANING','PEST_CONTROL','AC_SERVICE','APPLIANCE_REPAIR','GARDENING','LAUNDRY','SECURITY'];

function Stars({ rating }: { rating?: number }) {
  const r = Math.round(rating ?? 0);
  return <span style={{ color: '#f59e0b', letterSpacing: 1 }}>{Array(5).fill(0).map((_,i) => i < r ? '★' : '☆').join('')}</span>;
}

export default function WorkerBrowser() {
  const [workers, setWorkers] = useState<HsWorker[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try { setWorkers(await homeServicesService.listWorkers(category || undefined)); }
    catch {}
    finally { setLoading(false); }
  }, [category]);

  useEffect(() => { load(); }, [load]);

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Workers</h2>
        <select value={category} onChange={e => setCategory(e.target.value)} style={{ padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: 8 }}>
          <option value="">All Categories</option>
          {CATEGORIES.filter(c => c).map(c => <option key={c}>{c}</option>)}
        </select>
      </div>
      {loading ? <div>Loading...</div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 14 }}>
          {workers.map(w => (
            <div key={w.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 10 }}>👷</div>
              <div style={{ fontWeight: 700 }}>{w.name}</div>
              {w.phone && <div style={{ fontSize: 13, color: '#64748b' }}>{w.phone}</div>}
              <div style={{ marginTop: 6 }}><Stars rating={w.rating} /></div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{w.totalJobs} jobs completed</div>
            </div>
          ))}
          {workers.length === 0 && <div style={{ gridColumn: '1/-1', textAlign: 'center', color: '#94a3b8', padding: 40 }}>No workers found</div>}
        </div>
      )}
    </div>
  );
}
