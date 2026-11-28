import React, { useState, useEffect } from 'react';
import {
  Cpu, Activity, Globe, AlertTriangle, CheckCircle, XCircle, Clock, Zap,
  Server, Layers, MemoryStick, Code, ArrowRight, TrendingUp, Info,
  Terminal, AlertCircle, ChevronRight, Eye
} from 'lucide-react';
import {
  runtimeProfilingService, JvmDashboard, EventLoopAnalysis,
  BrowserMemoryAnalysis, ProfilingRecommendation, GcEvent,
  ThreadPoolSnapshot, EventLoopSnapshot, BrowserMemorySnapshot
} from '../../../services/profiling/runtimeProfilingService';

// ═══════════════════ DEMO DATA ═══════════════════

const DEMO_JVM: JvmDashboard = {
  gcAnalysis: {
    totalGcEvents: 12, stwPauses: 11, avgPauseMs: 185, maxPauseMs: 645,
    p99PauseMs: 645, totalPauseMs: 2220, gcOverheadPercent: 0.062,
    dominantCollector: 'G1GC', dominantCause: 'ALLOCATION_FAILURE',
    worstPauses: [
      { id: 1, serviceId: 'SVC-GATE-ROUTING', serviceName: 'Gate Routing Service', jvmVersion: 'Java 17.0.9', collector: 'G1GC', cause: 'ALLOCATION_FAILURE', pauseMillis: 645, stopTheWorld: true, heapBeforeMb: 3920, heapAfterMb: 3300, heapMaxMb: 4096, edenUsedMb: 1300, survivorUsedMb: 420, oldGenUsedMb: 2900, metaspaceUsedMb: 198, gcThreadCount: 8, allocationRateMbPerSec: 750, promotionRateMbPerSec: 240, eventTimestamp: '2026-11-28T08:52:00', gcLogSnippet: '[Full GC (Allocation Failure) 3920M->3300M(4096M), 0.6450000 secs]' },
      { id: 2, serviceId: 'SVC-GATE-ROUTING', serviceName: 'Gate Routing Service', jvmVersion: 'Java 17.0.9', collector: 'G1GC', cause: 'ALLOCATION_FAILURE', pauseMillis: 612, stopTheWorld: true, heapBeforeMb: 3890, heapAfterMb: 3200, heapMaxMb: 4096, edenUsedMb: 1200, survivorUsedMb: 400, oldGenUsedMb: 2800, metaspaceUsedMb: 195, gcThreadCount: 8, allocationRateMbPerSec: 680, promotionRateMbPerSec: 220, eventTimestamp: '2026-11-28T08:45:00', gcLogSnippet: '[Full GC (Allocation Failure) 3890M->3200M(4096M), 0.6120000 secs]' },
      { id: 3, serviceId: 'SVC-GATE-ROUTING', serviceName: 'Gate Routing Service', jvmVersion: 'Java 17.0.9', collector: 'G1GC', cause: 'G1_HUMONGOUS_ALLOCATION', pauseMillis: 584, stopTheWorld: true, heapBeforeMb: 3750, heapAfterMb: 3100, heapMaxMb: 4096, edenUsedMb: 1100, survivorUsedMb: 380, oldGenUsedMb: 2700, metaspaceUsedMb: 195, gcThreadCount: 8, allocationRateMbPerSec: 720, promotionRateMbPerSec: 195, eventTimestamp: '2026-11-28T08:48:00', gcLogSnippet: '[Full GC (G1 Humongous Allocation) 3750M->3100M(4096M), 0.5840000 secs]' },
    ],
    recentEvents: []
  },
  threadAnalysis: {
    totalPools: 4, healthyPools: 2, warningPools: 1, criticalPools: 0, starvedPools: 1,
    totalActiveThreads: 1551, totalQueuedTasks: 3189, totalRejectedTasks: 234,
    virtualThreadsAvailable: true, virtualThreadCount: 1250,
    snapshots: [
      { id: 1, serviceId: 'SVC-GATE-ROUTING', serviceName: 'Gate Routing Service', poolName: 'http-nio-8080', poolType: 'TOMCAT_HTTP', corePoolSize: 200, maxPoolSize: 200, activeThreads: 198, queuedTasks: 847, queueCapacity: 100, completedTasks: 1250000, rejectedTasks: 234, cpuUsagePercent: 94.5, avgTaskDurationMs: 1200, p99TaskDurationMs: 4500, health: 'STARVED', virtualThreadsEnabled: false, virtualThreadCount: 0, snapshotTimestamp: '2026-11-28T08:50:00', threadDumpSnippet: '198/200 threads BLOCKED on FCM HTTP call. Queue: 847 pending.' },
      { id: 2, serviceId: 'SVC-GATE-ROUTING', serviceName: 'Gate Routing Service', poolName: 'async-executor', poolType: 'CUSTOM', corePoolSize: 50, maxPoolSize: 100, activeThreads: 100, queuedTasks: 2340, queueCapacity: 5000, completedTasks: 89000, rejectedTasks: 0, cpuUsagePercent: 78.3, avgTaskDurationMs: 800, p99TaskDurationMs: 3200, health: 'WARNING', virtualThreadsEnabled: false, virtualThreadCount: 0, snapshotTimestamp: '2026-11-28T08:50:00', threadDumpSnippet: 'All 100 threads active. Queue growing at 500/sec.' },
      { id: 3, serviceId: 'SVC-NOTIFICATION', serviceName: 'Notification Service', poolName: 'virtual-thread-pool', poolType: 'VIRTUAL_THREAD', corePoolSize: 0, maxPoolSize: 0, activeThreads: 1250, queuedTasks: 0, queueCapacity: 0, completedTasks: 5600000, rejectedTasks: 0, cpuUsagePercent: 45.2, avgTaskDurationMs: 80, p99TaskDurationMs: 350, health: 'HEALTHY', virtualThreadsEnabled: true, virtualThreadCount: 1250, snapshotTimestamp: '2026-11-28T08:55:00', threadDumpSnippet: '1250 virtual threads active. No carrier thread pinning detected.' },
    ]
  }
};

const DEMO_NODEJS: EventLoopAnalysis = {
  totalSnapshots: 8, healthyCount: 6, laggingCount: 0, blockedCount: 2, criticalCount: 0,
  avgLagMs: 878, maxLagMs: 4200, p99LagMs: 4200,
  avgHeapUsedMb: 410, maxHeapUsedMb: 890, avgRssMb: 630,
  dominantBlockingCause: 'PDF_GENERATION', totalBlockingDurationMs: 7000,
  maxWorkerThreads: 2, maxJobQueueDepth: 3,
  recentSnapshots: [],
  worstBlocks: [
    { id: 1, serviceId: 'SVC-ERP-NODE', serviceName: 'ERP Ledger Service', nodeVersion: 'v20.11.0', eventLoopLagMs: 4200, eventLoopLagP99Ms: 4200, eventLoopUtilizationPercent: 100, activeHandles: 89, activeRequests: 67, heapUsedMb: 890, heapTotalMb: 1024, externalMb: 120, arrayBuffersMb: 45, rssMemoryMb: 1200, blockingCause: 'PDF_GENERATION', blockingDurationMs: 4200, blockingStackTrace: 'at PDFDocument.render (node_modules/pdfkit/lib/document.js:234)\n  at generateLedgerPDF (src/services/ledger.js:89)\n  at /src/routes/export.js:45\n  — synchronous render of 12,000-row ledger PDF', workerThreadsActive: 0, workerThreadsIdle: 4, jobQueueDepth: 0, health: 'BLOCKED', snapshotTimestamp: '2026-11-28T08:15:00' },
    { id: 2, serviceId: 'SVC-ERP-NODE', serviceName: 'ERP Ledger Service', nodeVersion: 'v20.11.0', eventLoopLagMs: 2800, eventLoopLagP99Ms: 2800, eventLoopUtilizationPercent: 100, activeHandles: 72, activeRequests: 54, heapUsedMb: 650, heapTotalMb: 1024, externalMb: 80, arrayBuffersMb: 30, rssMemoryMb: 900, blockingCause: 'CSV_EXPORT', blockingDurationMs: 2800, blockingStackTrace: 'at stringify (node_modules/csv-stringify/lib/sync.js:12)\n  at exportSocietyLedger (src/services/export.js:156)\n  — synchronous CSV generation for 50,000 transactions', workerThreadsActive: 0, workerThreadsIdle: 4, jobQueueDepth: 0, health: 'BLOCKED', snapshotTimestamp: '2026-11-28T08:30:00' },
  ]
};

const DEMO_BROWSER: BrowserMemoryAnalysis = {
  totalSessions: 12, healthySessions: 3, growingSessions: 3, leakingSessions: 3, criticalSessions: 3,
  avgHeapUsedMb: 850, maxHeapUsedMb: 2400, avgDomNodeCount: 15000, maxDetachedDomNodes: 12000,
  avgEventListeners: 1600, maxEventListeners: 4500,
  avgSessionDurationMin: 330, maxSessionDurationMin: 600,
  avgGrowthRateMbPerHr: 200, maxGrowthRateMbPerHr: 350,
  dominantLeakSource: 'DETACHED_DOM',
  totalWebSocketLeaks: 8, totalQueryCacheLeaks: 6600, totalMissingUnmounts: 825,
  recentSnapshots: [
    { id: 10, portalName: 'Admin Web Portal', userId: 'estate-mgr-001', browserVersion: 'Chrome 120', sessionId: 'S1', jsHeapUsedMb: 2400, jsHeapTotalMb: 2600, jsHeapLimitMb: 4096, domNodeCount: 42000, detachedDomNodes: 12000, eventListenerCount: 4500, websocketConnections: 3, websocketMessagesQueued: 8500, websocketListenersCleaned: false, reactQueryCacheEntries: 2200, reactQueryStaleCacheEntries: 1100, reactComponentMountCount: 2500, reactComponentUnmountMissing: 150, primaryLeakSource: 'DETACHED_DOM', sessionDurationMinutes: 600, memoryGrowthRateMbPerHour: 300, health: 'CRITICAL', snapshotTimestamp: '2026-11-28T08:00:00', heapSnapshotSummary: 'Hour 10: 2.4GB heap, 42K DOM nodes, 12K detached' },
    { id: 1, portalName: 'Admin Web Portal', userId: 'estate-mgr-001', browserVersion: 'Chrome 120', sessionId: 'S1', jsHeapUsedMb: 150, jsHeapTotalMb: 350, jsHeapLimitMb: 4096, domNodeCount: 1200, detachedDomNodes: 0, eventListenerCount: 80, websocketConnections: 3, websocketMessagesQueued: 0, websocketListenersCleaned: true, reactQueryCacheEntries: 20, reactQueryStaleCacheEntries: 0, reactComponentMountCount: 500, reactComponentUnmountMissing: 0, primaryLeakSource: 'NONE', sessionDurationMinutes: 0, memoryGrowthRateMbPerHour: 0, health: 'HEALTHY', snapshotTimestamp: '2026-11-27T22:00:00', heapSnapshotSummary: 'Hour 0: Fresh start at 150MB' },
  ],
  worstLeaks: []
};

const DEMO_RECS: ProfilingRecommendation[] = [
  { id: 1, serviceId: 'SVC-GATE-ROUTING', domain: 'JVM_GC', severity: 'CRITICAL', title: 'Migrate Gate Routing to ZGC or Virtual Threads', description: 'G1GC Full GC pauses reach 645ms during morning peak. The 4GB heap with 680MB/s allocation rate overwhelms G1\'s concurrent marking.', codeSnippet: '-XX:+UseZGC -XX:+ZGenerational -Xmx8g -XX:SoftMaxHeapSize=6g', status: 'OPEN', estimatedImpact: 'GC pause: 645ms → <5ms', detectedAt: '2026-11-28T07:00:00', resolvedAt: '' },
  { id: 2, serviceId: 'SVC-GATE-ROUTING', domain: 'JVM_THREADS', severity: 'CRITICAL', title: 'Tomcat Thread Pool Starvation Under FCM Latency Spike', description: '198/200 Tomcat threads blocked on FCM. 234 rejected requests. Virtual Threads would handle 10,000+ concurrent.', codeSnippet: 'spring.threads.virtual.enabled=true', status: 'OPEN', estimatedImpact: 'Throughput: 200 → 10,000+', detectedAt: '2026-11-28T08:00:00', resolvedAt: '' },
  { id: 3, serviceId: 'SVC-ERP-NODE', domain: 'NODEJS_EVENT_LOOP', severity: 'CRITICAL', title: 'PDF/CSV Exports Block Event Loop for 2.8–4.2 Seconds', description: 'Synchronous PDF and CSV generation stalls all wallet APIs.', codeSnippet: 'const worker = new Worker(\'./workers/pdf-gen.js\', { workerData });', status: 'IN_PROGRESS', estimatedImpact: 'Loop lag: 4200ms → <5ms', detectedAt: '2026-11-28T06:00:00', resolvedAt: '' },
  { id: 4, serviceId: 'ADMIN-PORTAL', domain: 'BROWSER_DOM', severity: 'CRITICAL', title: '12,000 Detached DOM Nodes After 10-Hour Admin Session', description: 'Missing useEffect cleanup functions leave DOM nodes and event listeners in memory.', codeSnippet: 'return () => clearInterval(interval); // cleanup', status: 'OPEN', estimatedImpact: 'Memory: 2.4GB → 200MB', detectedAt: '2026-11-28T08:00:00', resolvedAt: '' },
  { id: 5, serviceId: 'ADMIN-PORTAL', domain: 'BROWSER_MEMORY', severity: 'HIGH', title: 'Unbounded React Query Cache Grows to 2,200 Entries', description: 'Default Infinity cache keeps stale data forever.', codeSnippet: 'gcTime: 5 * 60 * 1000, staleTime: 30 * 1000', status: 'OPEN', estimatedImpact: 'Cache: 2,200 → <50', detectedAt: '2026-11-28T08:15:00', resolvedAt: '' },
];

// ═══════════════════ HELPERS ═══════════════════

const healthColor = (h: string) => {
  const m: Record<string, string> = {
    HEALTHY: 'bg-green-100 text-green-800', WARNING: 'bg-yellow-100 text-yellow-800',
    CRITICAL: 'bg-red-100 text-red-800', STARVED: 'bg-red-100 text-red-800',
    GROWING: 'bg-yellow-100 text-yellow-800', LEAKING: 'bg-orange-100 text-orange-800',
    LAGGING: 'bg-yellow-100 text-yellow-800', BLOCKED: 'bg-red-100 text-red-800',
    OPEN: 'bg-red-100 text-red-800', IN_PROGRESS: 'bg-blue-100 text-blue-800',
    RESOLVED: 'bg-green-100 text-green-800',
  };
  return m[h] || 'bg-gray-100 text-gray-800';
};

const sevColor = (s: string) => {
  const m: Record<string, string> = {
    CRITICAL: 'bg-red-100 text-red-800 border-red-200',
    HIGH: 'bg-orange-100 text-orange-800 border-orange-200',
    MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    LOW: 'bg-blue-100 text-blue-800 border-blue-200',
    INFO: 'bg-gray-100 text-gray-700 border-gray-200',
  };
  return m[s] || 'bg-gray-100 text-gray-800 border-gray-200';
};

function StatCard({ icon: Icon, label, value, color, sub }: { icon: React.ElementType; label: string; value: string | number; color: string; sub?: string }) {
  const bg: Record<string, string> = { blue: 'bg-blue-50', green: 'bg-green-50', red: 'bg-red-50', yellow: 'bg-yellow-50', purple: 'bg-purple-50', indigo: 'bg-indigo-50', orange: 'bg-orange-50', gray: 'bg-gray-50' };
  const fg: Record<string, string> = { blue: 'text-blue-600', green: 'text-green-600', red: 'text-red-600', yellow: 'text-yellow-600', purple: 'text-purple-600', indigo: 'text-indigo-600', orange: 'text-orange-600', gray: 'text-gray-600' };
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${bg[color]}`}><Icon className={`w-5 h-5 ${fg[color]}`} /></div>
        <div>
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          <div className="text-xs text-gray-500">{label}</div>
          {sub && <div className="text-[10px] text-gray-400 mt-0.5">{sub}</div>}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════ MAIN DASHBOARD ═══════════════════

export default function RuntimeProfilingDashboard() {
  const [tab, setTab] = useState<'jvm' | 'nodejs' | 'browser' | 'recs'>('jvm');
  const [jvm, setJvm] = useState<JvmDashboard>(DEMO_JVM);
  const [nodejs, setNodejs] = useState<EventLoopAnalysis>(DEMO_NODEJS);
  const [browser, setBrowser] = useState<BrowserMemoryAnalysis>(DEMO_BROWSER);
  const [recs, setRecs] = useState<ProfilingRecommendation[]>(DEMO_RECS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [j, n, b, r] = await Promise.all([
          runtimeProfilingService.getJvmDashboard(),
          runtimeProfilingService.getNodejsDashboard(),
          runtimeProfilingService.getBrowserDashboard(),
          runtimeProfilingService.getRecommendations(),
        ]);
        setJvm(j); setNodejs(n); setBrowser(b); setRecs(r);
      } catch { /* demo fallback */ }
      finally { setLoading(false); }
    })();
  }, []);

  const tabs = [
    { key: 'jvm' as const, label: 'JVM GC & Threads', icon: Cpu },
    { key: 'nodejs' as const, label: 'Node.js Event Loop', icon: Activity },
    { key: 'browser' as const, label: 'Browser Memory', icon: Globe },
    { key: 'recs' as const, label: 'Recommendations', icon: Zap },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Cpu className="w-7 h-7 text-indigo-600" />
            Runtime Profiling & Bottleneck Hunting
          </h1>
          <p className="text-sm text-gray-500 mt-1">JVM GC tuning, Node.js event loop analysis, browser memory leak detection</p>
        </div>
        {loading && <span className="text-sm text-gray-400 animate-pulse">Loading live data...</span>}
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                tab === t.key ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}>
              <t.icon className="w-4 h-4" />{t.label}
            </button>
          ))}
        </nav>
      </div>

      {tab === 'jvm' && <JvmTab data={jvm} />}
      {tab === 'nodejs' && <NodejsTab data={nodejs} />}
      {tab === 'browser' && <BrowserTab data={browser} />}
      {tab === 'recs' && <RecsTab data={recs} />}
    </div>
  );
}

// ═══════════════════ JVM TAB ═══════════════════

function JvmTab({ data }: { data: JvmDashboard }) {
  const gc = data.gcAnalysis;
  const tp = data.threadAnalysis;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Activity} label="Total GC Events" value={gc.totalGcEvents} color="blue" />
        <StatCard icon={AlertTriangle} label="STW Pauses" value={gc.stwPauses} color="red" />
        <StatCard icon={Clock} label="Max Pause" value={`${gc.maxPauseMs}ms`} color="red" sub={`avg ${Math.round(gc.avgPauseMs)}ms`} />
        <StatCard icon={TrendingUp} label="P99 Pause" value={`${gc.p99PauseMs}ms`} color="orange" />
        <StatCard icon={Server} label="Thread Pools" value={tp.totalPools} color="indigo" />
        <StatCard icon={AlertCircle} label="Starved Pools" value={tp.starvedPools} color="red" />
        <StatCard icon={Layers} label="Queued Tasks" value={tp.totalQueuedTasks.toLocaleString()} color="yellow" />
        <StatCard icon={Zap} label="Virtual Threads" value={tp.virtualThreadCount.toLocaleString()} color="green" sub={tp.virtualThreadsAvailable ? 'Available' : 'Not configured'} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Worst GC Pauses (Stop-The-World)
          </h3>
        </div>
        <div className="p-4 space-y-3">
          {gc.worstPauses.map(evt => (
            <div key={evt.id} className="p-4 rounded-lg border border-red-100 bg-red-50/30">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800">{evt.pauseMillis}ms</span>
                  <span className="text-sm font-medium text-gray-900">{evt.serviceName}</span>
                  <span className="text-xs text-gray-500">{evt.jvmVersion}</span>
                </div>
                <span className="text-xs text-gray-400">{new Date(evt.eventTimestamp).toLocaleTimeString('en-IN')}</span>
              </div>
              <div className="font-mono text-xs text-gray-600 bg-gray-900 text-green-400 rounded p-2 mt-2">{evt.gcLogSnippet}</div>
              <div className="grid grid-cols-4 gap-2 mt-3 text-xs">
                <div><span className="text-gray-500">Heap:</span> <span className="font-medium">{evt.heapBeforeMb}M → {evt.heapAfterMb}M / {evt.heapMaxMb}M</span></div>
                <div><span className="text-gray-500">Old Gen:</span> <span className="font-medium">{evt.oldGenUsedMb}M</span></div>
                <div><span className="text-gray-500">Alloc Rate:</span> <span className="font-medium">{evt.allocationRateMbPerSec} MB/s</span></div>
                <div><span className="text-gray-500">Cause:</span> <span className="font-medium">{evt.cause.replace(/_/g, ' ')}</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Server className="w-5 h-5 text-indigo-500" />
            Thread Pool Status
          </h3>
        </div>
        <div className="p-4 space-y-3">
          {tp.snapshots.map(pool => (
            <div key={pool.id} className="p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-900">{pool.poolName}</span>
                  <span className="text-xs text-gray-500">{pool.serviceName}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${healthColor(pool.health)}`}>{pool.health}</span>
                  {pool.virtualThreadsEnabled && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Virtual Threads</span>}
                </div>
                <span className="text-xs text-gray-500">{pool.poolType.replace(/_/g, ' ')}</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-2 text-xs">
                <div className="bg-gray-50 rounded p-2">
                  <div className="text-gray-500">Active / Max</div>
                  <div className="font-bold text-gray-900">{pool.activeThreads} / {pool.maxPoolSize || '∞'}</div>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <div className="text-gray-500">Queued</div>
                  <div className="font-bold text-gray-900">{pool.queuedTasks.toLocaleString()}</div>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <div className="text-gray-500">Rejected</div>
                  <div className={`font-bold ${pool.rejectedTasks > 0 ? 'text-red-600' : 'text-gray-900'}`}>{pool.rejectedTasks}</div>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <div className="text-gray-500">CPU</div>
                  <div className="font-bold text-gray-900">{pool.cpuUsagePercent}%</div>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <div className="text-gray-500">P99 Latency</div>
                  <div className="font-bold text-gray-900">{pool.p99TaskDurationMs}ms</div>
                </div>
              </div>
              <div className="mt-2 font-mono text-xs text-gray-500 bg-gray-50 rounded p-2">{pool.threadDumpSnippet}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════ NODE.JS TAB ═══════════════════

function NodejsTab({ data }: { data: EventLoopAnalysis }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Activity} label="Total Snapshots" value={data.totalSnapshots} color="blue" />
        <StatCard icon={CheckCircle} label="Healthy" value={data.healthyCount} color="green" />
        <StatCard icon={XCircle} label="Blocked" value={data.blockedCount} color="red" />
        <StatCard icon={Clock} label="Max Loop Lag" value={`${data.maxLagMs.toLocaleString()}ms`} color="red" sub={`avg ${Math.round(data.avgLagMs)}ms`} />
        <StatCard icon={MemoryStick} label="Max Heap" value={`${data.maxHeapUsedMb}MB`} color="orange" />
        <StatCard icon={Layers} label="Max RSS" value={`${data.avgRssMb}MB`} color="purple" />
        <StatCard icon={Cpu} label="Worker Threads" value={data.maxWorkerThreads} color="indigo" />
        <StatCard icon={AlertTriangle} label="Blocking Cause" value={data.dominantBlockingCause.replace(/_/g, ' ')} color="red" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Event Loop Blocking Incidents
          </h3>
        </div>
        <div className="p-4 space-y-4">
          {data.worstBlocks.map(block => (
            <div key={block.id} className="p-4 rounded-lg border border-red-100 bg-red-50/30">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800">
                    {block.blockingDurationMs.toLocaleString()}ms blocked
                  </span>
                  <span className="text-sm font-medium text-gray-900">{block.blockingCause.replace(/_/g, ' ')}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${healthColor(block.health)}`}>{block.health}</span>
                </div>
                <span className="text-xs text-gray-400">{new Date(block.snapshotTimestamp).toLocaleTimeString('en-IN')}</span>
              </div>
              <div className="font-mono text-xs bg-gray-900 text-green-400 rounded p-3 mt-2 whitespace-pre-wrap">{block.blockingStackTrace}</div>
              <div className="grid grid-cols-4 gap-2 mt-3 text-xs">
                <div><span className="text-gray-500">Loop Lag:</span> <span className="font-bold text-red-600">{block.eventLoopLagMs.toLocaleString()}ms</span></div>
                <div><span className="text-gray-500">Heap:</span> <span className="font-medium">{block.heapUsedMb}MB / {block.heapTotalMb}MB</span></div>
                <div><span className="text-gray-500">Pending Requests:</span> <span className="font-medium">{block.activeRequests}</span></div>
                <div><span className="text-gray-500">Utilization:</span> <span className="font-medium">{block.eventLoopUtilizationPercent}%</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Info className="w-5 h-5 text-blue-500" />
          Event Loop Blocking Explained
        </h3>
        <div className="bg-gray-50 rounded-lg p-4 font-mono text-xs leading-relaxed">
          <pre className="whitespace-pre-wrap text-gray-700">{`
┌─────────────────────────────────────────────────────────────┐
│                   Node.js V8 Event Loop                      │
│                                                              │
│  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐     │
│  │ Timers  │→ │ I/O Poll │→ │  Check   │→ │  Close  │→ …  │
│  └─────────┘  └──────────┘  └──────────┘  └─────────┘     │
│       ↑                                                      │
│       │  BLOCKED HERE for 4.2 seconds                       │
│       │  by synchronous PDF render                           │
│       │                                                      │
│  ┌────┴──────────────────────────────────────┐              │
│  │  pdfkit.render() — 12,000 rows            │              │
│  │  Single-threaded, no yield points          │              │
│  │  ALL wallet APIs stalled                   │              │
│  └───────────────────────────────────────────┘              │
│                                                              │
│  FIX: Move to Worker Thread                                  │
│  ┌────────────┐    ┌──────────────┐                         │
│  │ Main Thread │───▶│ Worker Thread │  PDF renders here      │
│  │ event loop  │    │ isolated V8   │  Main loop free        │
│  │ handles API │◀───│ returns buffer│                         │
│  └────────────┘    └──────────────┘                         │
└─────────────────────────────────────────────────────────────┘
          `}</pre>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════ BROWSER TAB ═══════════════════

function BrowserTab({ data }: { data: BrowserMemoryAnalysis }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Globe} label="Total Sessions" value={data.totalSessions} color="blue" />
        <StatCard icon={CheckCircle} label="Healthy" value={data.healthySessions} color="green" />
        <StatCard icon={TrendingUp} label="Growing" value={data.growingSessions} color="yellow" />
        <StatCard icon={AlertTriangle} label="Critical" value={data.criticalSessions} color="red" />
        <StatCard icon={MemoryStick} label="Max Heap" value={`${data.maxHeapUsedMb}MB`} color="red" sub={`avg ${data.avgHeapUsedMb}MB`} />
        <StatCard icon={Layers} label="Detached DOM" value={data.maxDetachedDomNodes.toLocaleString()} color="orange" />
        <StatCard icon={Eye} label="Max Listeners" value={data.maxEventListeners.toLocaleString()} color="purple" />
        <StatCard icon={Clock} label="Max Session" value={`${data.maxSessionDurationMin}min`} color="indigo" sub={`Growth: ${data.maxGrowthRateMbPerHr}MB/hr`} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-red-500" />
          Memory Growth Timeline — Admin Portal 10-Hour Session
        </h3>
        <div className="space-y-2">
          {data.recentSnapshots.sort((a, b) => a.sessionDurationMinutes - b.sessionDurationMinutes).map((snap, i) => {
            const pct = Math.min(100, (snap.jsHeapUsedMb / 2500) * 100);
            return (
              <div key={i} className="flex items-center gap-3">
                <div className="w-16 text-xs text-gray-500 text-right">Hr {snap.sessionDurationMinutes / 60}</div>
                <div className="flex-1 bg-gray-100 rounded-full h-6 relative overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${
                    snap.health === 'HEALTHY' ? 'bg-green-400' :
                    snap.health === 'GROWING' ? 'bg-yellow-400' :
                    snap.health === 'LEAKING' ? 'bg-orange-400' : 'bg-red-400'
                  }`} style={{ width: `${pct}%` }} />
                  <span className="absolute inset-0 flex items-center px-3 text-xs font-medium text-gray-800">
                    {snap.jsHeapUsedMb}MB • {snap.domNodeCount.toLocaleString()} DOM • {snap.detachedDomNodes.toLocaleString()} detached
                  </span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${healthColor(snap.health)}`}>{snap.health}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
          Leak Sources Breakdown
        </h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="bg-red-50 rounded-lg p-4 border border-red-100">
            <div className="flex items-center gap-2 mb-2">
              <Layers className="w-5 h-5 text-red-500" />
              <span className="font-semibold text-gray-900">Detached DOM Nodes</span>
            </div>
            <div className="text-3xl font-bold text-red-600">{data.maxDetachedDomNodes.toLocaleString()}</div>
            <p className="text-xs text-gray-600 mt-2">React components mount on tab switch but useEffect cleanup is missing. Event listeners and DOM references stay in memory after the component unmounts.</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-5 h-5 text-orange-500" />
              <span className="font-semibold text-gray-900">WebSocket Leaks</span>
            </div>
            <div className="text-3xl font-bold text-orange-600">{data.totalWebSocketLeaks}</div>
            <p className="text-xs text-gray-600 mt-2">WebSocket onmessage handlers accumulate without cleanup. After 10 hours, {data.recentSnapshots[0]?.websocketMessagesQueued?.toLocaleString() || '8,500'} messages queued in uncleaned listeners.</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-100">
            <div className="flex items-center gap-2 mb-2">
              <MemoryStick className="w-5 h-5 text-yellow-600" />
              <span className="font-semibold text-gray-900">Query Cache Bloat</span>
            </div>
            <div className="text-3xl font-bold text-yellow-600">{data.totalQueryCacheLeaks.toLocaleString()}</div>
            <p className="text-xs text-gray-600 mt-2">React Query default cache time is Infinity. Every paginated fetch stays cached forever. {data.recentSnapshots[0]?.reactQueryStaleCacheEntries?.toLocaleString() || '1,100'} stale entries hold ~800MB of JSON.</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Info className="w-5 h-5 text-blue-500" />
          Chrome DevTools Heap Snapshot Workflow
        </h3>
        <div className="bg-gray-50 rounded-lg p-4 font-mono text-xs leading-relaxed">
          <pre className="whitespace-pre-wrap text-gray-700">{`
Step 1: Take Heap Snapshot at session start (baseline)
  DevTools → Memory → Heap Snapshot → Take snapshot
  Record: 150MB JS heap, 1,200 DOM nodes

Step 2: Reproduce the leak (switch tabs 10 times, wait 1 hour)
  DevTools → Memory → Allocation Timeline (record)
  Look for: allocations that never get freed (blue bars stay)

Step 3: Take second Heap Snapshot
  Compare → "Objects allocated between Snapshot 1 and 2"
  Sort by "Retained Size" descending

Step 4: Identify detached DOM trees
  Filter: "Detached"
  Look for: Detached HTMLDivElement, Detached EventListener
  Retainer chain shows: component closure → stale state → DOM node

Step 5: Find the specific useEffect missing cleanup
  Retainer chain: closure → setInterval callback → component scope
  The closure holds a reference to the mounted DOM tree
  Fix: return () => clearInterval(id) in useEffect

Step 6: Verify fix
  After fix: Allocation Timeline shows freed objects (red bars)
  Heap stable at ~200MB after 10 hours
          `}</pre>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════ RECOMMENDATIONS TAB ═══════════════════

function RecsTab({ data }: { data: ProfilingRecommendation[] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 mb-2">
        <span className="text-sm text-gray-500">{data.length} recommendations</span>
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          {data.filter(r => r.severity === 'CRITICAL').length} critical
        </span>
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
          {data.filter(r => r.severity === 'HIGH').length} high
        </span>
      </div>

      {data.map(rec => (
        <div key={rec.id} className={`bg-white rounded-xl border ${sevColor(rec.severity).split(' ')[2]} overflow-hidden`}>
          <div className="p-5">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${sevColor(rec.severity)}`}>{rec.severity}</span>
                <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700">{rec.domain.replace(/_/g, ' ')}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${healthColor(rec.status)}`}>{rec.status.replace(/_/g, ' ')}</span>
              </div>
              <span className="text-xs text-gray-400">{rec.serviceId}</span>
            </div>
            <h3 className="font-semibold text-gray-900 mt-1">{rec.title}</h3>
            <p className="text-sm text-gray-600 mt-2">{rec.description}</p>
            {rec.estimatedImpact && (
              <div className="flex items-center gap-2 mt-2">
                <ArrowRight className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-green-700">Impact: {rec.estimatedImpact}</span>
              </div>
            )}
            {rec.codeSnippet && (
              <div className="mt-3 bg-gray-900 text-green-400 rounded-lg p-3 font-mono text-xs whitespace-pre-wrap overflow-x-auto">
                {rec.codeSnippet}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
