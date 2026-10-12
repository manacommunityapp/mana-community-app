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
  ExternalLink,
  ShieldAlert,
  ArrowUpRight,
  Filter,
  Check,
  Eye,
  FileText,
  AlertCircle,
  HardDrive,
  Network
} from "lucide-react";
import {
  platformOpsService,
  type PlatformOpsOverview,
  type ServiceHealth,
  type FailedRequest,
  type QueueLag,
  type MigrationStatus,
  type IncidentAlert,
} from "../../../services/admin/platformOpsService";
import { showSuccess, showError } from "../../../utils/ToastUtils";

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
  const [data, setData] = useState<PlatformOpsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [probing, setProbing] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<number>(15000);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedFailure, setSelectedFailure] = useState<FailedRequest | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());

  const fetchOverview = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await platformOpsService.getOverview();
      setData(res);
      setLastRefreshedAt(new Date());
    } catch {
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
      await platformOpsService.acknowledgeIncident(id);
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
    fetchOverview();
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
                      : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      data?.overallStatus === "UP" ? "bg-emerald-400" : "bg-amber-400"
                    } animate-pulse`}
                  />
                  {data?.overallStatus === "UP" ? "ALL SYSTEMS OPERATIONAL" : "DEGRADED PERFORMANCE"}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Unified live observability across microservices, databases, event buses, and AI pipelines.
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
          </div>
        </header>

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
              Microservices & Infrastructure ({filteredServices.length})
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
                Kafka Event Bus & Queue Lag
              </h2>
              <span className="text-xs text-slate-400">5 Active Topics</span>
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
              <span className="text-xs text-emerald-400 font-medium">All Up To Date</span>
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
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.2 rounded font-medium">
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
                      0 pending
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
                Failed Requests & Dead-Letter Traces ({data?.recentFailures.length || 0})
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
                    <th className="py-2.5 px-3">Method & Path</th>
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
          ) : (
            <div className="py-8 text-center text-slate-500 text-xs">
              <CheckCircle className="w-6 h-6 text-emerald-400/60 mx-auto mb-2" />
              Zero 5xx server failures recorded in the active buffer.
            </div>
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
      </div>
    </div>
  );
}