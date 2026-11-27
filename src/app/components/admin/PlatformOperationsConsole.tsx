import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Activity,
  Server,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Database,
  Layers,
  Cpu,
  Clock,
  Radio,
  ShieldAlert,
  Sparkles,
  Loader2,
  AlertCircle,
  Network,
  HardDrive,
  Wifi,
  Bell,
  Timer,
  GitBranch,
  CreditCard,
  Building2,
} from "lucide-react";
import {
  platformOpsService,
  type PlatformOpsOverview,
  type FailedRequest,
} from "../../../services/admin/platformOpsService";
import { showSuccess, showError } from "../../../utils/ToastUtils";
import {
  automationService,
  type AdminPlatformOpsAnalyzerResponse,
} from '../../../services/automation/automationService';


const REFRESH_OPTIONS = [
  { label: "5s", value: 5000 },
  { label: "15s", value: 15000 },
  { label: "30s", value: 30000 },
  { label: "Manual", value: 0 },
];

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const parts: string[] = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0 || d > 0) parts.push(`${h}h`);
  parts.push(`${m}m`);
  return parts.join(" ");
}

export function PlatformOperationsConsole() {
  // AI Platform Ops Analyzer State
  const [isAnalyzingOps, setIsAnalyzingOps] = useState(false);
  const [opsAnalysisResult, setOpsAnalysisResult] = useState<AdminPlatformOpsAnalyzerResponse | null>(null);
  const [showOpsModal, setShowOpsModal] = useState(false);

  const handleAnalyzePlatformOps = async () => {
    try {
      setIsAnalyzingOps(true);
      const res = await automationService.analyzeAdminPlatformOps({
        telemetrySnapshot: {
          uptimeSeconds: data?.uptimeSeconds ?? data?.clusterMetrics?.uptimeSeconds ?? 86400,
          databaseStatus: (data?.clusterMetrics ? (data.clusterMetrics.overallErrorRate > 5 ? 'DEGRADED' : 'HEALTHY') : 'HEALTHY') as any,
          activeWebsockets: data?.activeWebsockets ?? data?.webSocketHealth?.activeConnections ?? 0,
          failedRequestsCount: data?.failedRequestsTotal ?? data?.clusterMetrics?.totalFailedRequests ?? 0,
          p95LatencyMs: 145,
          memoryUsagePercent: data?.clusterMetrics?.memoryPercent ?? 62,
          cpuUsagePercent: data?.clusterMetrics?.cpuLoadPercent ?? 38,
        },
        recentAuditEventsCount: 18,
        privilegedActionsLogged: 3,
      });
      setOpsAnalysisResult(res);
      setShowOpsModal(true);
      showSuccess("AI Platform Operations health analysis completed!");
    } catch (err: any) {
      showError(err.message || "Failed to analyze platform ops");
    } finally {
      setIsAnalyzingOps(false);
    }
  };

  const [data, setData] = useState<PlatformOpsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [probing, setProbing] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<number>(15000);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedFailure, setSelectedFailure] = useState<FailedRequest | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());
  const [telemetryError, setTelemetryError] = useState<string | null>(null);

  const fetchOverview = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await platformOpsService.getOverview();
      setData(res);
      setTelemetryError(null);
      setLastRefreshedAt(new Date());
    } catch {
      setTelemetryError("Live platform telemetry could not be loaded. Check the operations API connection and retry.");
      showError("Failed to fetch platform metrics");
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  const triggerProbeNow = async () => {
    setProbing(true);
    try {
      await platformOpsService.probeServices();
      await fetchOverview(true);
      showSuccess("Live multi-service probe complete");
    } catch {
      showError("Probe failed for one or more endpoints");
    } finally {
      setProbing(false);
    }
  };

  const handleAcknowledge = async (id: string) => {
    try {
      const acknowledged = await platformOpsService.acknowledgeIncident(id);
      if (!acknowledged) {
        showError("The server did not acknowledge this incident");
        return;
      }
      setData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          activeIncidents: prev.activeIncidents.map((inc) =>
            inc.id === id ? { ...inc, acknowledged: true } : inc
          ),
        };
      });
      showSuccess("Incident acknowledged");
    } catch {
      showError("Failed to acknowledge incident");
    }
  };

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) fetchOverview();
    });
    return () => { active = false; };
  }, [fetchOverview]);

  useEffect(() => {
    if (refreshInterval === 0) return;
    const interval = setInterval(() => {
      fetchOverview(true);
    }, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval, fetchOverview]);

  const filteredServices = useMemo(() => {
    if (!data) return [];
    if (selectedCategory === "ALL") return data.services;
    return data.services.filter((s) => s.category === selectedCategory);
  }, [data, selectedCategory]);

  const unacknowledgedIncidents = useMemo(() => {
    if (!data) return [];
    return data.activeIncidents.filter((i) => !i.acknowledged);
  }, [data]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 font-sans">
      {/* ── Top Header ────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-800/80">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  Platform Operations Console
                </h1>
                <span
                  data-testid="status-badge"
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    data?.overallStatus === "UP"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : data?.overallStatus === "DEGRADED"
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      data?.overallStatus === "UP" ? "bg-emerald-400" : data?.overallStatus === "DEGRADED" ? "bg-amber-400" : "bg-rose-400"
                    } animate-pulse`}
                  />
                  {data?.overallStatus === "UP" ? "ALL SYSTEMS OPERATIONAL" : data?.overallStatus === "DEGRADED" ? "DEGRADED PERFORMANCE" : data ? "SYSTEMS DOWN" : "TELEMETRY UNAVAILABLE"}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Unified live observability across microservices, databases, event buses, and AI pipelines.
              </p>
              <p className="mt-1 text-[10px] text-slate-500">
                {loading ? "Refreshing platform telemetry…" : `Last successful refresh: ${lastRefreshedAt.toLocaleTimeString()}`}
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
              <span className="text-slate-400 px-2 font-medium">Auto-refresh:</span>
              {REFRESH_OPTIONS.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => setRefreshInterval(opt.value)}
                  className={`px-2.5 py-1 rounded font-medium transition-all ${
                    refreshInterval === opt.value
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <button
              onClick={triggerProbeNow}
              disabled={probing}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-all shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${probing ? "animate-spin" : ""}`} />
              {probing ? "Probing..." : "Probe Now"}
            </button>

            <button
              onClick={handleAnalyzePlatformOps}
              disabled={isAnalyzingOps || !data}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-violet-700 hover:bg-violet-600 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-all shadow-sm"
            >
              {isAnalyzingOps ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              {isAnalyzingOps ? "Analysing…" : "AI Analysis"}
            </button>
          </div>
        </header>

        {telemetryError && (
          <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
            <span>{telemetryError}</span>
            <button onClick={() => fetchOverview()} className="rounded-lg border border-rose-400/30 px-3 py-1.5 text-xs font-semibold hover:bg-rose-500/10">Retry</button>
          </div>
        )}

        {/* ── Active Incidents Banner (if any) ─────────────────────────────────── */}
        {unacknowledgedIncidents.length > 0 && (
          <div className="space-y-2">
            {unacknowledgedIncidents.map((incident) => (
              <div
                key={incident.id}
                className="flex items-center justify-between p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-200"
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold">{incident.title}</p>
                    <p className="text-xs text-amber-300/80 mt-0.5">{incident.message}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleAcknowledge(incident.id)}
                  className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 rounded-lg text-xs font-medium text-amber-100 transition-colors"
                >
                  Acknowledge
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ── Infrastructure Cluster Metrics Cards ─────────────────────────────── */}
        {data && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>CPU Load</span>
                <Cpu className="w-4 h-4 text-indigo-400" />
              </div>
              <p className="text-xl font-bold text-white mt-2">
                {data.clusterMetrics.cpuLoadPercent}%
              </p>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-indigo-500 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(data.clusterMetrics.cpuLoadPercent, 100)}%` }}
                />
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Memory</span>
                <Layers className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-xl font-bold text-white mt-2">
                {data.clusterMetrics.memoryPercent}%
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                {(data.clusterMetrics.usedMemoryMb / 1024).toFixed(1)} GB /{" "}
                {(data.clusterMetrics.totalMemoryMb / 1024).toFixed(1)} GB
              </p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Disk Storage</span>
                <HardDrive className="w-4 h-4 text-sky-400" />
              </div>
              <p className="text-xl font-bold text-white mt-2">
                {data.clusterMetrics.diskPercent}%
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                {data.clusterMetrics.usedDiskGb} GB / {data.clusterMetrics.totalDiskGb} GB
              </p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Error Rate</span>
                <AlertCircle className="w-4 h-4 text-rose-400" />
              </div>
              <p className="text-xl font-bold text-white mt-2">
                {data.clusterMetrics.overallErrorRate}%
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                {data.clusterMetrics.totalFailedRequests} / {data.clusterMetrics.totalRequestsTracked} reqs
              </p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>JVM Memory</span>
                <Activity className="w-4 h-4 text-violet-400" />
              </div>
              <p className="text-xl font-bold text-white mt-2">
                {data.clusterMetrics.jvmUsedMemoryMb} MB
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                {data.clusterMetrics.jvmPercent}% of {data.clusterMetrics.jvmMaxMemoryMb} MB max
              </p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Cluster Uptime</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-base font-bold text-white mt-2 font-mono">
                {formatUptime(data.clusterMetrics.uptimeSeconds)}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Threads: {data.clusterMetrics.activeThreads}
              </p>
            </div>
          </div>
        )}

        {/* ── Services Health Grid ────────────────────────────────────────────── */}
        <section className="space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-indigo-400" />
              Microservices &amp; Infrastructure ({filteredServices.length})
            </h2>

            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
              {["ALL", "CORE", "INFRASTRUCTURE", "DOMAIN", "AI_VISION"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded font-medium transition-all ${
                    selectedCategory === cat
                      ? "bg-slate-800 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {cat.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {filteredServices.map((service) => {
              const isUp = service.status === "UP";
              const isDegraded = service.status === "DEGRADED";
              return (
                <div
                  key={service.id}
                  className="bg-slate-900/80 border border-slate-800/80 hover:border-slate-700/80 transition-all rounded-xl p-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h3 className="font-semibold text-sm text-white">{service.name}</h3>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                          Port {service.port} · v{service.version}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                          isUp
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : isDegraded
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        }`}
                      >
                        {isUp ? (
                          <CheckCircle className="w-3 h-3 text-emerald-400" />
                        ) : isDegraded ? (
                          <AlertTriangle className="w-3 h-3 text-amber-400" />
                        ) : (
                          <XCircle className="w-3 h-3 text-rose-400" />
                        )}
                        {service.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 mt-2 line-clamp-2">
                      {service.details}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1 font-mono">
                      <Radio className="w-3 h-3 text-indigo-400" />
                      {service.latencyMs} ms
                    </span>
                    <span className="text-[11px] font-mono bg-slate-800/80 px-1.5 py-0.5 rounded text-slate-300">
                      commit {service.gitCommit.substring(0, 7)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Two Column: Kafka Queue Lag & Database Migrations ───────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Kafka Consumer Queue Lag */}
          <section className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Network className="w-4 h-4 text-indigo-400" />
                Kafka Event Bus &amp; Queue Lag
              </h2>
              <span className="text-xs text-slate-400">{data?.queueLags.length ?? 0} Active Topics</span>
            </div>

            <div className="space-y-3">
              {data?.queueLags.map((lag) => (
                <div
                  key={lag.topic}
                  className="bg-slate-950/60 border border-slate-800/60 rounded-lg p-3 flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-indigo-300">
                        {lag.topic}
                      </span>
                      <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                        {lag.partitions} parts
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Group: <span className="font-mono text-slate-300">{lag.consumerGroup}</span> →{" "}
                      {lag.targetService}
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <span className="text-xs font-bold font-mono text-white">
                        {lag.totalLag} lag
                      </span>
                      <span
                        className={`w-2 h-2 rounded-full ${
                          lag.totalLag === 0 ? "bg-emerald-400" : "bg-amber-400"
                        }`}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                      {lag.consumptionRatePerSec} msg/sec
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Database Migration Status */}
          <section className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                Liquibase Database Migrations
              </h2>
              <span className={`text-xs font-medium ${data?.migrations.length && data.migrations.every((migration) => migration.status === "UP_TO_DATE") ? "text-emerald-400" : "text-amber-300"}`}>
                {data?.migrations.length && data.migrations.every((migration) => migration.status === "UP_TO_DATE") ? "All Up To Date" : "Review Migration Status"}
              </span>
            </div>

            <div className="space-y-3">
              {data?.migrations.map((mig) => (
                <div
                  key={mig.schemaName}
                  className="bg-slate-950/60 border border-slate-800/60 rounded-lg p-3 flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-white">
                        {mig.schemaName}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${mig.status === "UP_TO_DATE" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : mig.status === "FAILED" ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" : "bg-amber-500/10 text-amber-300 border border-amber-500/20"}`}>
                        {mig.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 font-mono">
                      Latest: {mig.latestChangeSetId} ({mig.latestAuthor})
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs font-bold font-mono text-white">
                      {mig.executedChangeSets} / {mig.totalChangeSets} sets
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                      {mig.pendingChangeSets} pending
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* ── Failed Requests & 5xx Error Traces ──────────────────────────────── */}
        <section className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                Failed Requests &amp; Dead-Letter Traces ({data?.recentFailures.length || 0})
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                HTTP 5xx server errors and unhandled exceptions captured by OpsMetricsCollector.
              </p>
            </div>
          </div>

          {data && data.recentFailures.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-medium">
                    <th className="py-2.5 px-3">Time</th>
                    <th className="py-2.5 px-3">Method &amp; Path</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Latency</th>
                    <th className="py-2.5 px-3">Correlation ID</th>
                    <th className="py-2.5 px-3">Error Summary</th>
                    <th className="py-2.5 px-3 text-right">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {data.recentFailures.map((failure) => (
                    <tr
                      key={failure.id}
                      className="hover:bg-slate-800/30 transition-colors text-slate-300"
                    >
                      <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                        {new Date(failure.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="font-bold text-rose-400 mr-1.5">{failure.method}</span>
                        <span>{failure.path}</span>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[11px] font-bold">
                          {failure.statusCode}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                        {failure.latencyMs} ms
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                        {failure.correlationId}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300 truncate max-w-xs font-sans">
                        {failure.errorMessage}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => setSelectedFailure(failure)}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-[11px] text-slate-300 transition-colors"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : data ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              <CheckCircle className="w-6 h-6 text-emerald-400/60 mx-auto mb-2" />
              Zero 5xx server failures recorded in the active buffer.
            </div>
          ) : (
            <div className="py-8 text-center text-slate-500 text-xs">Failure telemetry is unavailable until the operations API responds.</div>
          )}
        </section>

        {/* ── WebSocket Health & Failed Notifications ──────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* WebSocket Health */}
          <section className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Wifi className="w-4 h-4 text-cyan-400" />
                WebSocket Connection Health
              </h2>
              {data?.webSocketHealth && (
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                  data.webSocketHealth.status === "UP"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : data.webSocketHealth.status === "DEGRADED"
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                }`}>{data.webSocketHealth.status}</span>
              )}
            </div>
            {data?.webSocketHealth ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: "Active connections", value: data.webSocketHealth.activeConnections.toLocaleString() },
                  { label: "Peak (last 1h)", value: data.webSocketHealth.peakConnectionsLast1h.toLocaleString() },
                  { label: "Disconnects (1h)", value: data.webSocketHealth.disconnectsLast1h.toLocaleString() },
                  { label: "Msg error rate", value: `${(data.webSocketHealth.messageErrorRate * 100).toFixed(2)}%` },
                  { label: "Avg session", value: `${Math.round(data.webSocketHealth.avgSessionDurationSeconds / 60)}m` },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-slate-950/60 border border-slate-800/60 rounded-lg p-3">
                    <p className="text-[11px] text-slate-400">{label}</p>
                    <p className="text-lg font-bold text-white mt-1 font-mono">{value}</p>
                  </div>
                ))}
              </div>
            ) : data ? (
              <div className="py-6 text-center text-xs text-slate-500">WebSocket telemetry not available from operations API.</div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-500">Loading…</div>
            )}
          </section>

          {/* Failed Notifications */}
          <section className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-400" />
                Failed Notification Deliveries
              </h2>
              {data?.notifications && (
                <span className={`text-xs font-bold font-mono ${data.notifications.failedLast1h > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                  {data.notifications.failedLast1h} failed last 1h
                </span>
              )}
            </div>
            {data?.notifications ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2.5 bg-slate-950/60 border border-slate-800/60 rounded-lg">
                  <span className="text-xs text-slate-400">Total failures on record</span>
                  <span className="text-sm font-bold font-mono text-white">{data.notifications.totalFailed.toLocaleString()}</span>
                </div>
                {data.notifications.byChannel.map((ch) => (
                  <div key={ch.channel} className="bg-slate-950/60 border border-slate-800/60 rounded-lg p-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-semibold bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">{ch.channel}</span>
                      <span className="text-xs text-slate-400">{ch.failed} / {ch.total} failed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${ch.failureRate > 0.1 ? "bg-rose-500" : ch.failureRate > 0.02 ? "bg-amber-400" : "bg-emerald-500"}`}
                          style={{ width: `${Math.min(ch.failureRate * 500, 100)}%` }}
                        />
                      </div>
                      <span className={`text-xs font-mono font-bold ${ch.failureRate > 0.1 ? "text-rose-400" : ch.failureRate > 0.02 ? "text-amber-400" : "text-emerald-400"}`}>
                        {(ch.failureRate * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
                {data.notifications.lastFailureAt && (
                  <p className="text-[10px] text-slate-500 pt-1">
                    Last failure: {new Date(data.notifications.lastFailureAt).toLocaleTimeString()}
                  </p>
                )}
              </div>
            ) : data ? (
              <div className="py-6 text-center text-xs text-slate-500">Notification telemetry not available from operations API.</div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-500">Loading…</div>
            )}
          </section>
        </div>

        {/* ── Background Job Health ────────────────────────────────────────────── */}
        <section className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Timer className="w-4 h-4 text-violet-400" />
                Background Job Health ({data?.backgroundJobs?.length ?? 0} jobs)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Scheduled and recurring jobs across all services.</p>
            </div>
            {data?.backgroundJobs && data.backgroundJobs.some((j) => j.failureCountLast24h > 0) && (
              <span className="text-xs font-bold text-rose-400">
                {data.backgroundJobs.reduce((acc, j) => acc + j.failureCountLast24h, 0)} failures (24h)
              </span>
            )}
          </div>
          {data?.backgroundJobs && data.backgroundJobs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-medium">
                    <th className="py-2.5 px-3">Job Name</th>
                    <th className="py-2.5 px-3">Schedule</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Last Run</th>
                    <th className="py-2.5 px-3">Failures (24h)</th>
                    <th className="py-2.5 px-3">Avg Duration</th>
                    <th className="py-2.5 px-3">Next Run</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {data.backgroundJobs.map((job) => (
                    <tr key={job.jobName} className="hover:bg-slate-800/30 transition-colors text-slate-300" title={job.lastErrorMessage}>
                      <td className="py-2.5 px-3 font-semibold text-white font-sans">{job.jobName}</td>
                      <td className="py-2.5 px-3 text-slate-400">{job.cronExpression}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                          job.status === "HEALTHY" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : job.status === "FAILING" ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          : job.status === "STALLED" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-slate-700/50 text-slate-400 border border-slate-700"
                        }`}>{job.status}</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                        {job.lastRunAt ? new Date(job.lastRunAt).toLocaleTimeString() : "—"}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`font-bold ${job.failureCountLast24h > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                          {job.failureCountLast24h}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">{job.avgDurationMs ? `${job.avgDurationMs} ms` : "—"}</td>
                      <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                        {job.nextScheduledAt ? new Date(job.nextScheduledAt).toLocaleTimeString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : data ? (
            <div className="py-6 text-center text-xs text-slate-500">
              <CheckCircle className="w-5 h-5 text-emerald-400/60 mx-auto mb-2" />
              No background jobs registered or telemetry unavailable from operations API.
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-slate-500">Loading job health…</div>
          )}
        </section>

        {/* ── CI/CD Pipeline Status ────────────────────────────────────────────── */}
        <section className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-sky-400" />
              CI/CD Release Status ({data?.cicdPipelines?.length ?? 0} pipelines)
            </h2>
            {data?.cicdPipelines?.some((p) => p.status === "RUNNING") && (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                Deploy in progress
              </span>
            )}
          </div>
          {data?.cicdPipelines && data.cicdPipelines.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {data.cicdPipelines.map((pipeline) => {
                const isSuccess = pipeline.status === "SUCCESS";
                const isRunning = pipeline.status === "RUNNING";
                const isFailed = pipeline.status === "FAILED";
                return (
                  <div key={pipeline.pipeline} className="bg-slate-950/60 border border-slate-800/60 rounded-lg p-3.5">
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                      <div>
                        <p className="font-semibold text-sm text-white">{pipeline.pipeline}</p>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">{pipeline.deployedEnvironment}</p>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                        isSuccess ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : isRunning ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                        : isFailed ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        : "bg-slate-700/50 text-slate-400 border border-slate-700"
                      }`}>
                        {isRunning && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />}
                        {pipeline.status}
                      </span>
                    </div>
                    <div className="space-y-1 text-[11px] font-mono text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <span>Branch:</span>
                        <span className="text-sky-300">{pipeline.branch}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span>Commit:</span>
                        <span className="text-slate-300">{pipeline.commitSha.substring(0, 7)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span>By:</span>
                        <span className="text-slate-300">{pipeline.triggeredBy}</span>
                      </div>
                      {pipeline.durationSeconds != null && (
                        <div className="flex items-center gap-1.5">
                          <span>Duration:</span>
                          <span className="text-slate-300">{Math.floor(pipeline.durationSeconds / 60)}m {pipeline.durationSeconds % 60}s</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : data ? (
            <div className="py-6 text-center text-xs text-slate-500">CI/CD pipeline telemetry not configured — connect your GitHub Actions / Jenkins integration to /admin/ops/overview.</div>
          ) : (
            <div className="py-6 text-center text-xs text-slate-500">Loading pipeline status…</div>
          )}
        </section>

        {/* ── Payment Gateway Health & Tenant Health ───────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Payment Gateway Verification Health */}
          <section className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                Payment Gateway &amp; Verification Delay
              </h2>
            </div>
            {data?.paymentGateways && data.paymentGateways.length > 0 ? (
              <div className="space-y-3">
                {data.paymentGateways.map((gw) => (
                  <div key={gw.gateway} className="bg-slate-950/60 border border-slate-800/60 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="font-semibold text-sm text-white">{gw.gateway}</span>
                      <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded border ${
                        gw.status === "UP" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : gw.status === "DEGRADED" ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                      }`}>{gw.status}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-slate-500 text-[10px]">Verif. p95</p>
                        <p className={`font-mono font-bold mt-0.5 ${gw.verificationDelayP95Ms > 2000 ? "text-rose-400" : gw.verificationDelayP95Ms > 800 ? "text-amber-400" : "text-emerald-400"}`}>
                          {gw.verificationDelayP95Ms} ms
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-[10px]">Success rate</p>
                        <p className={`font-mono font-bold mt-0.5 ${gw.successRate < 0.95 ? "text-rose-400" : gw.successRate < 0.99 ? "text-amber-400" : "text-emerald-400"}`}>
                          {(gw.successRate * 100).toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-[10px]">Avg response</p>
                        <p className="font-mono font-bold text-slate-300 mt-0.5">{gw.avgResponseMs} ms</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : data ? (
              <div className="py-6 text-center text-xs text-slate-500">Payment gateway telemetry not available. Ensure the payment service exposes health metrics to the ops overview API.</div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-500">Loading…</div>
            )}
          </section>

          {/* Tenant Health & Onboarding */}
          <section className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-400" />
                Tenant Health &amp; Onboarding Status
              </h2>
            </div>
            {data?.tenantHealth ? (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Total tenants", value: data.tenantHealth.totalTenants, color: "text-white" },
                    { label: "Healthy", value: data.tenantHealth.healthyTenants, color: "text-emerald-400" },
                    { label: "Degraded", value: data.tenantHealth.degradedTenants, color: "text-amber-400" },
                    { label: "Offline", value: data.tenantHealth.offlineTenants, color: "text-rose-400" },
                    { label: "Pending onboarding", value: data.tenantHealth.pendingOnboarding, color: "text-sky-400" },
                    { label: "Onboarded (7d)", value: data.tenantHealth.onboardingCompletedLast7Days, color: "text-violet-400" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="bg-slate-950/60 border border-slate-800/60 rounded-lg p-3 text-center">
                      <p className={`text-xl font-black font-mono ${color}`}>{value}</p>
                      <p className="text-[10px] text-slate-400 mt-1 leading-tight">{label}</p>
                    </div>
                  ))}
                </div>
                {data.tenantHealth.totalTenants > 0 && (
                  <div className="bg-slate-950/60 border border-slate-800/60 rounded-lg p-3">
                    <div className="flex justify-between text-[10px] text-slate-400 mb-1.5">
                      <span>Health distribution</span>
                      <span>{((data.tenantHealth.healthyTenants / data.tenantHealth.totalTenants) * 100).toFixed(1)}% healthy</span>
                    </div>
                    <div className="flex h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full" style={{ width: `${(data.tenantHealth.healthyTenants / data.tenantHealth.totalTenants) * 100}%` }} />
                      <div className="bg-amber-400 h-full" style={{ width: `${(data.tenantHealth.degradedTenants / data.tenantHealth.totalTenants) * 100}%` }} />
                      <div className="bg-rose-500 h-full" style={{ width: `${(data.tenantHealth.offlineTenants / data.tenantHealth.totalTenants) * 100}%` }} />
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-[10px]">
                      <span className="flex items-center gap-1 text-emerald-400"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Healthy</span>
                      <span className="flex items-center gap-1 text-amber-400"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Degraded</span>
                      <span className="flex items-center gap-1 text-rose-400"><span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> Offline</span>
                    </div>
                  </div>
                )}
              </div>
            ) : data ? (
              <div className="py-6 text-center text-xs text-slate-500">Tenant health telemetry not available from operations API.</div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-500">Loading…</div>
            )}
          </section>
        </div>

        {/* ── Database Connection Pool Usage ───────────────────────────────────── */}
        <section className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-teal-400" />
                Database Connection Pool Usage
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">HikariCP / JDBC pool stats per data source.</p>
            </div>
            {data?.databasePools?.some((p) => p.pendingAcquire > 0) && (
              <span className="text-xs font-bold text-amber-400">
                {data.databasePools.reduce((acc, p) => acc + p.pendingAcquire, 0)} pending acquires
              </span>
            )}
          </div>
          {data?.databasePools && data.databasePools.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-medium">
                    <th className="py-2.5 px-3">Pool / Data Source</th>
                    <th className="py-2.5 px-3 text-right">Active</th>
                    <th className="py-2.5 px-3 text-right">Idle</th>
                    <th className="py-2.5 px-3 text-right">Max</th>
                    <th className="py-2.5 px-3 text-right">Pending</th>
                    <th className="py-2.5 px-3 text-right">Avg Acquire</th>
                    <th className="py-2.5 px-3">Utilisation</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {data.databasePools.map((pool) => {
                    const utilPct = pool.maxPoolSize > 0 ? (pool.activeConnections / pool.maxPoolSize) * 100 : 0;
                    return (
                      <tr key={pool.poolName} className="hover:bg-slate-800/30 transition-colors text-slate-300">
                        <td className="py-2.5 px-3 font-semibold text-white font-sans">{pool.poolName}</td>
                        <td className="py-2.5 px-3 text-right">{pool.activeConnections}</td>
                        <td className="py-2.5 px-3 text-right text-slate-400">{pool.idleConnections}</td>
                        <td className="py-2.5 px-3 text-right text-slate-400">{pool.maxPoolSize}</td>
                        <td className="py-2.5 px-3 text-right">
                          <span className={pool.pendingAcquire > 0 ? "text-amber-400 font-bold" : "text-slate-400"}>{pool.pendingAcquire}</span>
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-400">{pool.avgAcquireTimeMs} ms</td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${utilPct > 85 ? "bg-rose-500" : utilPct > 60 ? "bg-amber-400" : "bg-teal-500"}`}
                                style={{ width: `${Math.min(utilPct, 100)}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-slate-400">{utilPct.toFixed(0)}%</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                            pool.status === "HEALTHY" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : pool.status === "WARNING" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          }`}>{pool.status}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : data ? (
            <div className="py-6 text-center text-xs text-slate-500">
              <CheckCircle className="w-5 h-5 text-emerald-400/60 mx-auto mb-2" />
              Database connection pool telemetry not available. Ensure each service exposes HikariCP metrics via the ops overview endpoint.
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-slate-500">Loading pool stats…</div>
          )}
        </section>

        {/* ── Inspect Failure Modal ───────────────────────────────────────────── */}
        {selectedFailure && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  Failed Request Trace
                </h3>
                <button
                  onClick={() => setSelectedFailure(null)}
                  className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800"
                >
                  Close
                </button>
              </div>

              <div className="space-y-2.5 text-xs font-mono">
                <div>
                  <span className="text-slate-400">Endpoint:</span>{" "}
                  <span className="text-white font-bold">{selectedFailure.method} {selectedFailure.path}</span>
                </div>
                <div>
                  <span className="text-slate-400">Status:</span>{" "}
                  <span className="text-rose-400 font-bold">{selectedFailure.statusCode}</span>
                </div>
                <div>
                  <span className="text-slate-400">Correlation ID:</span>{" "}
                  <span className="text-indigo-300">{selectedFailure.correlationId}</span>
                </div>
                <div>
                  <span className="text-slate-400">Client IP:</span>{" "}
                  <span className="text-slate-300">{selectedFailure.clientIp}</span>
                </div>
                <div>
                  <span className="text-slate-400">Duration:</span>{" "}
                  <span className="text-slate-300">{selectedFailure.latencyMs} ms</span>
                </div>
                <div className="pt-2">
                  <p className="text-slate-400 mb-1">Error Message:</p>
                  <pre className="p-3 bg-slate-950 rounded-lg text-rose-300 text-xs whitespace-pre-wrap border border-slate-800">
                    {selectedFailure.errorMessage}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── AI Platform Ops Analysis Modal ──────────────────────────────────── */}
        {showOpsModal && opsAnalysisResult && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-violet-400" />
                  AI Platform Operations Analysis
                </h3>
                <button
                  onClick={() => setShowOpsModal(false)}
                  className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800"
                >
                  Close
                </button>
              </div>
              <div className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                {typeof opsAnalysisResult === 'string'
                  ? opsAnalysisResult
                  : JSON.stringify(opsAnalysisResult, null, 2)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
