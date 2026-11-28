import axios from 'axios';

const API_BASE = '/api/runtime-profiling';

export interface GcEvent {
  id: number; serviceId: string; serviceName: string; jvmVersion: string;
  collector: string; cause: string; pauseMillis: number; stopTheWorld: boolean;
  heapBeforeMb: number; heapAfterMb: number; heapMaxMb: number;
  edenUsedMb: number; survivorUsedMb: number; oldGenUsedMb: number; metaspaceUsedMb: number;
  gcThreadCount: number; allocationRateMbPerSec: number; promotionRateMbPerSec: number;
  eventTimestamp: string; gcLogSnippet: string;
}

export interface ThreadPoolSnapshot {
  id: number; serviceId: string; serviceName: string; poolName: string; poolType: string;
  corePoolSize: number; maxPoolSize: number; activeThreads: number; queuedTasks: number;
  queueCapacity: number; completedTasks: number; rejectedTasks: number;
  cpuUsagePercent: number; avgTaskDurationMs: number; p99TaskDurationMs: number;
  health: string; virtualThreadsEnabled: boolean; virtualThreadCount: number;
  snapshotTimestamp: string; threadDumpSnippet: string;
}

export interface EventLoopSnapshot {
  id: number; serviceId: string; serviceName: string; nodeVersion: string;
  eventLoopLagMs: number; eventLoopLagP99Ms: number; eventLoopUtilizationPercent: number;
  activeHandles: number; activeRequests: number;
  heapUsedMb: number; heapTotalMb: number; externalMb: number; arrayBuffersMb: number; rssMemoryMb: number;
  blockingCause: string; blockingDurationMs: number; blockingStackTrace: string;
  workerThreadsActive: number; workerThreadsIdle: number; jobQueueDepth: number;
  health: string; snapshotTimestamp: string;
}

export interface BrowserMemorySnapshot {
  id: number; portalName: string; userId: string; browserVersion: string; sessionId: string;
  jsHeapUsedMb: number; jsHeapTotalMb: number; jsHeapLimitMb: number;
  domNodeCount: number; detachedDomNodes: number; eventListenerCount: number;
  websocketConnections: number; websocketMessagesQueued: number; websocketListenersCleaned: boolean;
  reactQueryCacheEntries: number; reactQueryStaleCacheEntries: number;
  reactComponentMountCount: number; reactComponentUnmountMissing: number;
  primaryLeakSource: string; sessionDurationMinutes: number; memoryGrowthRateMbPerHour: number;
  health: string; snapshotTimestamp: string; heapSnapshotSummary: string;
}

export interface ProfilingRecommendation {
  id: number; serviceId: string; domain: string; severity: string;
  title: string; description: string; codeSnippet: string;
  status: string; estimatedImpact: string; detectedAt: string; resolvedAt: string;
}

export interface JvmGcAnalysis {
  totalGcEvents: number; stwPauses: number; avgPauseMs: number; maxPauseMs: number;
  p99PauseMs: number; totalPauseMs: number; gcOverheadPercent: number;
  dominantCollector: string; dominantCause: string;
  worstPauses: GcEvent[]; recentEvents: GcEvent[];
}

export interface ThreadPoolAnalysis {
  totalPools: number; healthyPools: number; warningPools: number; criticalPools: number; starvedPools: number;
  totalActiveThreads: number; totalQueuedTasks: number; totalRejectedTasks: number;
  virtualThreadsAvailable: boolean; virtualThreadCount: number;
  snapshots: ThreadPoolSnapshot[];
}

export interface JvmDashboard { gcAnalysis: JvmGcAnalysis; threadAnalysis: ThreadPoolAnalysis; }

export interface EventLoopAnalysis {
  totalSnapshots: number; healthyCount: number; laggingCount: number; blockedCount: number; criticalCount: number;
  avgLagMs: number; maxLagMs: number; p99LagMs: number;
  avgHeapUsedMb: number; maxHeapUsedMb: number; avgRssMb: number;
  dominantBlockingCause: string; totalBlockingDurationMs: number;
  maxWorkerThreads: number; maxJobQueueDepth: number;
  recentSnapshots: EventLoopSnapshot[]; worstBlocks: EventLoopSnapshot[];
}

export interface BrowserMemoryAnalysis {
  totalSessions: number; healthySessions: number; growingSessions: number; leakingSessions: number; criticalSessions: number;
  avgHeapUsedMb: number; maxHeapUsedMb: number; avgDomNodeCount: number; maxDetachedDomNodes: number;
  avgEventListeners: number; maxEventListeners: number;
  avgSessionDurationMin: number; maxSessionDurationMin: number;
  avgGrowthRateMbPerHr: number; maxGrowthRateMbPerHr: number;
  dominantLeakSource: string;
  totalWebSocketLeaks: number; totalQueryCacheLeaks: number; totalMissingUnmounts: number;
  recentSnapshots: BrowserMemorySnapshot[]; worstLeaks: BrowserMemorySnapshot[];
}

export const runtimeProfilingService = {
  getJvmDashboard: () => axios.get<JvmDashboard>(`${API_BASE}/jvm/dashboard`).then(r => r.data),
  getNodejsDashboard: () => axios.get<EventLoopAnalysis>(`${API_BASE}/nodejs/dashboard`).then(r => r.data),
  getBrowserDashboard: () => axios.get<BrowserMemoryAnalysis>(`${API_BASE}/browser/dashboard`).then(r => r.data),
  getRecommendations: () => axios.get<ProfilingRecommendation[]>(`${API_BASE}/recommendations`).then(r => r.data),
  seedDemo: () => axios.post(`${API_BASE}/seed-demo`).then(r => r.data),
};
