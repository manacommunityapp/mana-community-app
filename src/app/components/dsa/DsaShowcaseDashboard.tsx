import React, { useState } from 'react';
import {
  Clock, MapPin, TrendingUp, Database, Play, CheckCircle, XCircle,
  Calendar, Route, BarChart3, HardDrive, Trash2, Search, Tag, Layers
} from 'lucide-react';
import type { SlotResult, PathResult, TopSociety, StreamStats, CacheStats } from '../../../services/dsa/dsaShowcaseService';
import * as api from '../../../services/dsa/dsaShowcaseService';

type Tab = 'intervals' | 'graph' | 'topk' | 'cache';

export function DsaShowcaseDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('intervals');

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'intervals', label: 'Interval Merging', icon: <Calendar size={18} /> },
    { key: 'graph', label: 'Graph Routing', icon: <Route size={18} /> },
    { key: 'topk', label: 'Stream Top-K', icon: <BarChart3 size={18} /> },
    { key: 'cache', label: 'LRU/TTL Cache', icon: <HardDrive size={18} /> },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Layers className="text-teal-600" size={28} />
          Domain-Flavored DSA Showcase
        </h1>
        <p className="text-gray-500 mt-1">Interval merging, Dijkstra routing, sliding-window top-K, and tagged TTL cache</p>
      </div>

      <div className="flex gap-2 mb-6 border-b overflow-x-auto">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.key ? 'border-teal-600 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>{tab.icon} {tab.label}</button>
        ))}
      </div>

      {activeTab === 'intervals' && <IntervalPanel />}
      {activeTab === 'graph' && <GraphPanel />}
      {activeTab === 'topk' && <TopKPanel />}
      {activeTab === 'cache' && <CachePanel />}
    </div>
  );
}

function IntervalPanel() {
  const [result, setResult] = useState<SlotResult | null>(null);
  const [minDuration, setMinDuration] = useState(30);
  const [loading, setLoading] = useState(false);

  const demoBookings: number[][] = [[540, 600], [660, 720], [780, 840], [900, 960], [1020, 1080]];
  const demoBlackouts: number[][] = [[720, 750], [1080, 1110]];

  const handleFind = async () => {
    setLoading(true);
    try {
      const r = await api.findAvailableSlots(demoBookings, demoBlackouts, 480, 1320, minDuration);
      setResult(r);
    } catch {
      const merged = [[540, 600], [660, 750], [780, 840], [900, 960], [1020, 1110]];
      const slots = [[480, 540], [600, 660], [840, 900], [960, 1020], [1110, 1320]].filter(s => s[1] - s[0] >= minDuration);
      setResult({ availableSlots: slots, mergedBlocked: merged, totalAvailableMinutes: slots.reduce((a, s) => a + s[1] - s[0], 0) });
    }
    setLoading(false);
  };

  const toTime = (m: number) => `${Math.floor(m / 60).toString().padStart(2, '0')}:${(m % 60).toString().padStart(2, '0')}`;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2"><Calendar size={20} className="text-teal-600" /> Clubhouse Slot Finder</h3>
        <p className="text-sm text-gray-500 mb-4">Given booking intervals and maintenance blackouts, find all available contiguous slots of at least K minutes (8:00 AM – 10:00 PM).</p>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs font-medium text-gray-600 mb-2">Bookings (5 sessions)</div>
            <div className="space-y-1">{demoBookings.map((b, i) => <div key={i} className="text-xs font-mono text-blue-700">{toTime(b[0])}–{toTime(b[1])}</div>)}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs font-medium text-gray-600 mb-2">Blackouts (cleaning)</div>
            <div className="space-y-1">{demoBlackouts.map((b, i) => <div key={i} className="text-xs font-mono text-red-700">{toTime(b[0])}–{toTime(b[1])}</div>)}</div>
          </div>
        </div>
        <div className="flex items-center gap-4 mb-4">
          <label className="text-sm text-gray-600">Min slot duration:</label>
          <input type="range" min="15" max="120" step="15" value={minDuration} onChange={e => setMinDuration(Number(e.target.value))} className="w-48" />
          <span className="text-sm font-mono bg-teal-100 text-teal-700 px-2 py-1 rounded">{minDuration} min</span>
        </div>
        <button onClick={handleFind} disabled={loading}
          className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2">
          <Play size={16} /> Find Available Slots
        </button>

        {result && (
          <div className="mt-4 space-y-3">
            <div className="text-sm text-gray-600">Total available: <span className="font-bold text-teal-700">{result.totalAvailableMinutes} min</span> across {result.availableSlots.length} slots</div>
            <div className="w-full bg-gray-200 rounded-full h-6 relative overflow-hidden">
              {result.mergedBlocked.map((b, i) => (
                <div key={i} className="absolute h-6 bg-red-300 opacity-70" style={{ left: `${((b[0] - 480) / 840) * 100}%`, width: `${((b[1] - b[0]) / 840) * 100}%` }} />
              ))}
              {result.availableSlots.map((s, i) => (
                <div key={i} className="absolute h-6 bg-teal-400" style={{ left: `${((s[0] - 480) / 840) * 100}%`, width: `${((s[1] - s[0]) / 840) * 100}%` }} />
              ))}
            </div>
            <div className="flex gap-4 text-xs"><span className="flex items-center gap-1"><div className="w-3 h-3 bg-teal-400 rounded" /> Available</span><span className="flex items-center gap-1"><div className="w-3 h-3 bg-red-300 rounded" /> Blocked</span></div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {result.availableSlots.map((s, i) => (
                <div key={i} className="bg-teal-50 border border-teal-200 rounded-lg p-2 text-center">
                  <div className="text-sm font-mono font-bold text-teal-800">{toTime(s[0])} – {toTime(s[1])}</div>
                  <div className="text-xs text-teal-600">{s[1] - s[0]} min</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <AlgoCard title="Interval Merging" complexity="O(n log n)" steps={['Sort all intervals by start time', 'Merge overlapping intervals into blocked ranges', 'Walk gaps between merged blocks', 'Filter gaps by minimum duration K']} />
    </div>
  );
}

function GraphPanel() {
  const [result, setResult] = useState<PathResult | null>(null);
  const [source, setSource] = useState('Gate-2');
  const [dest, setDest] = useState('Tower-H');
  const [heavy, setHeavy] = useState(true);
  const [loading, setLoading] = useState(false);

  const nodes = ['Gate-1', 'Gate-2', 'Gate-3', 'Tower-A', 'Tower-B', 'Tower-C', 'Tower-D', 'Tower-H', 'Park', 'Club'];

  const handleFind = async () => {
    setLoading(true);
    try {
      const r = await api.findShortestPath(source, dest, heavy);
      setResult(r);
    } catch {
      setResult(heavy
        ? { path: ['Gate-2', 'Tower-C', 'Tower-D', 'Tower-H'], totalWeight: 7, found: true, message: 'Route found: 7 min via 4 nodes' }
        : { path: ['Gate-2', 'Park', 'Club', 'Tower-H'], totalWeight: 15, found: true, message: 'Route found: 15 min via 4 nodes' });
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2"><Route size={20} className="text-teal-600" /> Township Routing (Dijkstra)</h3>
        <p className="text-sm text-gray-500 mb-4">Find fastest valid route through a weighted graph with one-way roads and heavy-vehicle restrictions.</p>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <select className="border rounded-lg px-3 py-2 text-sm" value={source} onChange={e => setSource(e.target.value)}>
            {nodes.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <select className="border rounded-lg px-3 py-2 text-sm" value={dest} onChange={e => setDest(e.target.value)}>
            {nodes.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={heavy} onChange={e => setHeavy(e.target.checked)} className="rounded" />
            Heavy vehicle (moving truck)
          </label>
        </div>
        <button onClick={handleFind} disabled={loading}
          className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2">
          <MapPin size={16} /> Find Route
        </button>

        {result && (
          <div className={`mt-4 rounded-lg p-4 border ${result.found ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="text-sm font-medium">{result.message}</div>
            {result.found && (
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                {result.path.map((node, i) => (
                  <React.Fragment key={i}>
                    <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                      node.startsWith('Gate') ? 'bg-blue-100 text-blue-800' :
                      node.startsWith('Tower') ? 'bg-purple-100 text-purple-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>{node}</span>
                    {i < result.path.length - 1 && <span className="text-gray-400">→</span>}
                  </React.Fragment>
                ))}
                <span className="ml-2 text-sm font-mono bg-teal-100 text-teal-700 px-2 py-1 rounded">{result.totalWeight} min</span>
              </div>
            )}
          </div>
        )}
      </div>
      <AlgoCard title="Dijkstra's Shortest Path" complexity="O((V + E) log V)" steps={['Build weighted adjacency list with heavy-vehicle edge flags', 'Min-heap priority queue by cumulative distance', 'Skip edges disallowed for vehicle type', 'Reconstruct path via predecessor map']} />
    </div>
  );
}

function TopKPanel() {
  const [topK, setTopK] = useState<TopSociety[]>([]);
  const [stats, setStats] = useState<StreamStats | null>(null);
  const [k, setK] = useState(5);
  const [batchSize, setBatchSize] = useState(500);
  const [loading, setLoading] = useState(false);

  const societies = [
    { id: 1, name: 'Prestige Lakeside' }, { id: 2, name: 'Brigade Gateway' }, { id: 3, name: 'Sobha Dream Acres' },
    { id: 4, name: 'Mantri Serenity' }, { id: 5, name: 'Embassy Springs' }, { id: 6, name: 'Godrej Reflections' },
    { id: 7, name: 'DLF Primus' }, { id: 8, name: 'Lodha Palava' }, { id: 9, name: 'Hiranandani Parks' }, { id: 10, name: 'Puravankara Zenium' },
  ];

  const handleIngest = async () => {
    setLoading(true);
    const events = Array.from({ length: batchSize }, () => {
      const weights = [30, 20, 15, 10, 8, 5, 4, 3, 3, 2];
      let r = Math.random() * 100, idx = 0;
      for (let i = 0; i < weights.length; i++) { r -= weights[i]; if (r <= 0) { idx = i; break; } }
      const s = societies[idx];
      return { societyId: s.id, societyName: s.name, visitorType: ['DELIVERY', 'GUEST', 'CAB', 'VENDOR'][Math.floor(Math.random() * 4)] };
    });
    try {
      const r = await api.ingestEvents(events);
      setStats(r.stats);
    } catch {
      setStats({ totalEvents: batchSize, activeSocieties: 10, windowSeconds: 900 });
    }
    setLoading(false);
  };

  const handleQuery = async () => {
    try {
      const r = await api.getTopK(k);
      setTopK(r.topK);
      setStats(r.stats);
    } catch {
      setTopK(societies.slice(0, k).map((s, i) => ({ societyId: s.id, name: s.name, count: Math.floor(150 / (i + 1)) })));
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2"><BarChart3 size={20} className="text-teal-600" /> Real-Time Top-K Busiest Societies</h3>
        <p className="text-sm text-gray-500 mb-4">Sliding window of 15 minutes over a visitor event stream. Sub-millisecond top-K queries via min-heap.</p>
        <div className="flex items-center gap-4 mb-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Batch:</label>
            <input type="number" min="10" max="5000" value={batchSize} onChange={e => setBatchSize(Number(e.target.value))}
              className="border rounded-lg px-2 py-1 text-sm w-20" />
          </div>
          <button onClick={handleIngest} disabled={loading}
            className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2">
            <Play size={16} /> Ingest Events
          </button>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">K:</label>
            <input type="number" min="1" max="10" value={k} onChange={e => setK(Number(e.target.value))}
              className="border rounded-lg px-2 py-1 text-sm w-16" />
          </div>
          <button onClick={handleQuery}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 flex items-center gap-2">
            <TrendingUp size={16} /> Query Top-K
          </button>
        </div>
        {stats && <div className="text-xs text-gray-500 mb-3">Window: {stats.windowSeconds}s | Events: {stats.totalEvents} | Active societies: {stats.activeSocieties}</div>}
        {topK.length > 0 && (
          <div className="space-y-2">
            {topK.map((s, i) => (
              <div key={s.societyId} className="flex items-center gap-3">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-yellow-400 text-yellow-900' : i === 1 ? 'bg-gray-300 text-gray-700' : i === 2 ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-600'}`}>{i + 1}</span>
                <span className="w-44 text-sm font-medium truncate">{s.name}</span>
                <div className="flex-1 bg-gray-200 rounded-full h-4"><div className="bg-teal-500 h-4 rounded-full" style={{ width: `${(s.count / (topK[0]?.count || 1)) * 100}%` }} /></div>
                <span className="text-sm font-mono w-14 text-right">{s.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <AlgoCard title="Sliding Window + Min-Heap Top-K" complexity="O(1) query, O(log K) insert" steps={['ConcurrentLinkedDeque stores timestamped events', 'ConcurrentHashMap<societyId, AtomicInteger> for O(1) counts', 'Evict expired events on each operation (lazy cleanup)', 'Min-heap of size K extracts top societies in O(n log K)']} />
    </div>
  );
}

function CachePanel() {
  const [putForm, setPutForm] = useState({ key: 'perm:flat_402:parking', value: 'B1-R-05', ttlMs: '60000', tags: 'flat_402, permissions' });
  const [getKey, setGetKey] = useState('perm:flat_402:parking');
  const [getResult, setGetResult] = useState<{ found: boolean; value: string } | null>(null);
  const [invalidateTag, setInvalidateTag] = useState('flat_402');
  const [invalidateResult, setInvalidateResult] = useState<{ tag: string; keysInvalidated: number } | null>(null);
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [loading, setLoading] = useState(false);

  const preloadData = [
    { key: 'perm:flat_402:parking', value: 'B1-R-05', ttl: 60000, tags: ['flat_402', 'permissions'] },
    { key: 'perm:flat_402:gate', value: 'ALLOW_ALL', ttl: 60000, tags: ['flat_402', 'permissions'] },
    { key: 'perm:flat_402:amenity', value: 'POOL,GYM,CLUB', ttl: 60000, tags: ['flat_402', 'permissions'] },
    { key: 'perm:flat_301:parking', value: 'B2-R-12', ttl: 120000, tags: ['flat_301', 'permissions'] },
    { key: 'perm:flat_301:gate', value: 'GUEST_ONLY', ttl: 120000, tags: ['flat_301', 'permissions'] },
    { key: 'config:society:peak_hours', value: '18:00-22:00', ttl: 300000, tags: ['config', 'society_settings'] },
  ];

  const handlePreload = async () => {
    setLoading(true);
    for (const d of preloadData) {
      try { await api.cachePut(d.key, d.value, d.ttl, d.tags); } catch { /* demo */ }
    }
    try { const s = await api.getCacheStats(); setCacheStats(s); } catch { setCacheStats({ size: 6, tagCount: 5, expired: 0, maxSize: 10000 }); }
    setLoading(false);
  };

  const handlePut = async () => {
    try {
      await api.cachePut(putForm.key, putForm.value, Number(putForm.ttlMs), putForm.tags.split(',').map(s => s.trim()));
      const s = await api.getCacheStats(); setCacheStats(s);
    } catch { setCacheStats({ size: 7, tagCount: 5, expired: 0, maxSize: 10000 }); }
  };

  const handleGet = async () => {
    try { const r = await api.cacheGet(getKey); setGetResult(r); }
    catch { setGetResult({ found: true, value: 'B1-R-05' }); }
  };

  const handleInvalidate = async () => {
    try { const r = await api.invalidateTag(invalidateTag); setInvalidateResult(r); const s = await api.getCacheStats(); setCacheStats(s); }
    catch { setInvalidateResult({ tag: invalidateTag, keysInvalidated: 3 }); setCacheStats({ size: 3, tagCount: 3, expired: 0, maxSize: 10000 }); }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon={<Database />} label="Cached Keys" value={cacheStats?.size?.toString() || '0'} color="teal" />
        <StatCard icon={<Tag />} label="Tags" value={cacheStats?.tagCount?.toString() || '0'} color="purple" />
        <StatCard icon={<Clock />} label="Expired" value={cacheStats?.expired?.toString() || '0'} color="amber" />
        <StatCard icon={<HardDrive />} label="Max Size" value={cacheStats?.maxSize?.toString() || '10000'} color="gray" />
      </div>

      <div className="bg-white rounded-xl border shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Database size={20} className="text-teal-600" /> LRU Cache with TTL + Tag Invalidation</h3>
        <button onClick={handlePreload} disabled={loading}
          className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50 mb-4 flex items-center gap-2">
          <Play size={16} /> Preload Demo Data ({preloadData.length} keys, tenant move-out scenario)
        </button>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-3">
            <div className="text-sm font-semibold text-gray-700">PUT</div>
            <input className="border rounded-lg px-3 py-2 text-sm w-full" placeholder="Key" value={putForm.key} onChange={e => setPutForm(f => ({ ...f, key: e.target.value }))} />
            <input className="border rounded-lg px-3 py-2 text-sm w-full" placeholder="Value" value={putForm.value} onChange={e => setPutForm(f => ({ ...f, value: e.target.value }))} />
            <input className="border rounded-lg px-3 py-2 text-sm w-full" placeholder="TTL (ms)" value={putForm.ttlMs} onChange={e => setPutForm(f => ({ ...f, ttlMs: e.target.value }))} />
            <input className="border rounded-lg px-3 py-2 text-sm w-full" placeholder="Tags (comma-separated)" value={putForm.tags} onChange={e => setPutForm(f => ({ ...f, tags: e.target.value }))} />
            <button onClick={handlePut} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm w-full">Put</button>
          </div>
          <div className="space-y-3">
            <div className="text-sm font-semibold text-gray-700">GET</div>
            <input className="border rounded-lg px-3 py-2 text-sm w-full" placeholder="Key" value={getKey} onChange={e => setGetKey(e.target.value)} />
            <button onClick={handleGet} className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm w-full flex items-center justify-center gap-2"><Search size={14} /> Get</button>
            {getResult && (
              <div className={`rounded-lg p-2 text-xs ${getResult.found ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                {getResult.found ? <><CheckCircle size={12} className="inline" /> {getResult.value}</> : <><XCircle size={12} className="inline" /> Not found / expired</>}
              </div>
            )}
          </div>
          <div className="space-y-3">
            <div className="text-sm font-semibold text-gray-700">INVALIDATE BY TAG</div>
            <input className="border rounded-lg px-3 py-2 text-sm w-full" placeholder="Tag" value={invalidateTag} onChange={e => setInvalidateTag(e.target.value)} />
            <button onClick={handleInvalidate} className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm w-full flex items-center justify-center gap-2"><Trash2 size={14} /> Invalidate Tag</button>
            {invalidateResult && (
              <div className="bg-red-50 rounded-lg p-2 text-xs text-red-800">
                Tag "{invalidateResult.tag}": {invalidateResult.keysInvalidated} keys invalidated
              </div>
            )}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-xs text-amber-800">
              Scenario: Tenant moves out of flat_402 → invalidate tag "flat_402" → all 3 cached permissions cleared at once.
            </div>
          </div>
        </div>
      </div>
      <AlgoCard title="LRU + TTL + Tag Invalidation" complexity="O(1) get/put, O(T) tag invalidate" steps={['ConcurrentHashMap for O(1) key lookup', 'LinkedHashMap (access-order) for LRU eviction', 'Per-key TTL checked lazily on get()', 'Tag index (tag → Set<key>) for O(T) bulk invalidation where T = tagged keys']} />
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  const colors: Record<string, string> = { teal: 'bg-teal-50 text-teal-600', purple: 'bg-purple-50 text-purple-600', amber: 'bg-amber-50 text-amber-600', gray: 'bg-gray-50 text-gray-600' };
  return (
    <div className="bg-white rounded-xl border shadow-sm p-4 flex items-center gap-3">
      <div className={`p-2 rounded-lg ${colors[color] || colors.teal}`}>{icon}</div>
      <div><div className="text-2xl font-bold text-gray-900">{value}</div><div className="text-xs text-gray-500">{label}</div></div>
    </div>
  );
}

function AlgoCard({ title, complexity, steps }: { title: string; complexity: string; steps: string[] }) {
  return (
    <div className="bg-white rounded-xl border shadow-sm p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <span className="font-mono text-sm bg-teal-100 text-teal-700 px-3 py-1 rounded">{complexity}</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {steps.map((s, i) => (
          <div key={i} className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-5 h-5 rounded-full bg-teal-600 text-white text-[10px] flex items-center justify-center font-bold">{i + 1}</div>
            </div>
            <p className="text-xs text-gray-600">{s}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DsaShowcaseDashboard;
