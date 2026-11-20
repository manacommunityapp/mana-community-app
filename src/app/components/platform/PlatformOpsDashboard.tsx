import { useState, useEffect, useCallback, useRef } from "react";
import {
  Activity, Database, Bell, CreditCard, Wifi, HardDrive,
  Shield, Server, Users, RefreshCw, AlertTriangle, CheckCircle,
  XCircle, AlertCircle, Loader2, ChevronDown, ChevronUp, X,
  GitBranch, Clock, Zap,
} from "lucide-react";
import { stompClient } from "../../../services/chat/stompClient";
import {
  platformOpsService,
  type PlatformOpsSnapshot,
  type PlatformAlert,
  type AlertSeverity,
  type OverallStatus,
  type MetricPoint,
} from "../../../services/platformOpsService";

// ── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 10) return "just now";
  if (secs < 60) return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  return `${Math.floor(secs / 3600)}h ago`;
}

function fmtMs(ms: number): string {
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${Math.round(ms)}ms`;
}

function statusColor(s: OverallStatus | string): string {
  if (s === "HEALTHY" || s === "ACTIVE") return "bg-emerald-500";
  if (s === "DEGRADED" || s === "ONBOARDING") return "bg-amber-400";
  if (s === "DOWN" || s === "CHURNED") return "bg-red-500";
  return "bg-slate-400";
}

function severityBorder(s: AlertSeverity): string {
  if (s === "CRITICAL") return "border-l-red-500";
  if (s === "WARNING") return "border-l-amber-400";
  return "border-l-blue-400";
}

function severityBg(s: AlertSeverity): string {
  if (s === "CRITICAL") return "bg-red-50 border-red-200";
  if (s === "WARNING") return "bg-amber-50 border-amber-200";
  return "bg-blue-50 border-blue-200";
}

function deployStatusChip(status: string) {
  const map: Record<string, string> = {
    SUCCEEDED: "bg-emerald-100 text-emerald-700",
    STARTED: "bg-blue-100 text-blue-700",
    FAILED: "bg-red-100 text-red-700",
    ROLLED_BACK: "bg-amber-100 text-amber-700",
  };
  return map[status] ?? "bg-slate-100 text-slate-600";
}

// ── Sparkline (pure SVG, no deps) ─────────────────────────────────────────────

function Sparkline({ points, width = 120, height = 32 }: { points: number[]; width?: number; height?: number }) {
  if (points.length < 2) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const xs = points.map((_, i) => (i / (points.length - 1)) * width);
  const ys = points.map((v) => height - ((v - min) / range) * (height - 4) - 2);
  const d = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(" ");
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none">
      <path d={d} stroke="#6366f1" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

// ── Section header ─────────────────────────────────────────────────────────────

function SectionHeader({ icon, title, id }: { icon: React.ReactNode; title: string; id: string }) {
  return (
    <h2 id={id} className="flex items-center gap-2 text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
      <span className="text-slate-400">{icon}</span>
      {title}
    </h2>
  );
}

// ── KPI tile ───────────────────────────────────────────────────────────────────

type Severity = "ok" | "warn" | "crit" | "neutral";
function kpiColor(s: Severity) {
  if (s === "ok")   return "bg-emerald-50 border-emerald-200 text-emerald-800";
  if (s === "warn") return "bg-amber-50 border-amber-200 text-amber-900";
  if (s === "crit") return "bg-red-50 border-red-200 text-red-800";
  return "bg-white border-slate-200 text-slate-800";
}
function KpiTile({ label, value, unit, severity = "neutral" }: { label: string; value: string | number; unit?: string; severity?: Severity }) {
  return (
    <div className={`rounded-xl border p-3 flex flex-col gap-1 ${kpiColor(severity)}`}>
      <span className="text-xs text-slate-500 font-medium">{label}</span>
      <span className="text-xl font-bold font-mono leading-none">
        {value}{unit && <span className="text-sm font-normal ml-1 opacity-70">{unit}</span>}
      </span>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function PlatformOpsDashboard() {
  const [snap, setSnap] = useState<PlatformOpsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [storageHistory, setStorageHistory] = useState<MetricPoint[]>([]);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<number>>(new Set());
  const [alertsExpanded, setAlertsExpanded] = useState(false);
  const [sortTenantBy, setSortTenantBy] = useState<"openIssues" | "lastActive">("openIssues");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    try {
      const [data, hist] = await Promise.all([
        platformOpsService.getSnapshot(),
        platformOpsService.getMetricHistory("STORAGE_GB_USED", 7).catch(() => []),
      ]);
      setSnap(data);
      setStorageHistory(hist);
      setError(null);
    } catch {
      setError("Failed to load platform snapshot");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    // STOMP subscription for live push; fall back to 30s poll
    let subbed = false;
    try {
      stompClient.subscribe("/topic/platform/ops", (body: unknown) => {
        if (body && typeof body === "object") setSnap(body as PlatformOpsSnapshot);
        subbed = true;
      });
    } catch {
      // STOMP unavailable — poll only
    }
    intervalRef.current = setInterval(load, 30_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (subbed) {
        try { stompClient.unsubscribe("/topic/platform/ops"); } catch {}
      }
    };
  }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 gap-2 text-slate-500">
        <Loader2 className="animate-spin" size={20} /> Loading platform data…
      </div>
    );
  }
  if (error || !snap) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-red-600">
        <AlertCircle size={32} />
        <p>{error ?? "No data"}</p>
        <button onClick={load} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm">Retry</button>
      </div>
    );
  }

  const { apiHealth, jobStats, dbPool, notificationStats, paymentHealth, wsStats, storageStats,
          recentDeploys, openAlerts, securityIncidents, tenantHealth } = snap;

  const visibleAlerts = openAlerts.filter((a) => !dismissedAlerts.has(a.id));
  const shownAlerts = alertsExpanded ? visibleAlerts : visibleAlerts.slice(0, 3);

  const subsystems: { id: string; label: string; status: OverallStatus }[] = [
    { id: "api",           label: "API",           status: apiHealth.overallStatus },
    { id: "db",            label: "DB",            status: dbPool.activeConnections / dbPool.maxPoolSize > 0.8 ? "DEGRADED" : "HEALTHY" },
    { id: "jobs",          label: "Jobs",          status: jobStats.failedLast24h > 0 ? "DEGRADED" : "HEALTHY" },
    { id: "notifications", label: "Notifications", status: notificationStats.failureRatePct > 5 ? "DEGRADED" : "HEALTHY" },
    { id: "payments",      label: "Payments",      status: paymentHealth.stalledPayments > 0 ? "DEGRADED" : "HEALTHY" },
    { id: "websocket",     label: "WebSocket",     status: "HEALTHY" },
    { id: "storage",       label: "Storage",       status: storageStats.diskUsedPct > 90 ? "DEGRADED" : "HEALTHY" },
    { id: "security",      label: "Security",      status: securityIncidents.some(i => i.severity === "CRITICAL") ? "DOWN" : "HEALTHY" },
  ];

  const sortedTenants = [...tenantHealth].sort((a, b) =>
    sortTenantBy === "openIssues"
      ? b.openIssues - a.openIssues
      : new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime()
  );

  const storagePoints = storageHistory.map(p => p.value);

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* ── Header ── */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 py-3">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Server size={20} className="text-indigo-600" />
            <h1 className="text-base font-bold text-slate-900">Platform Operations</h1>
            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide">
              Production
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <Clock size={12} />
            Updated {timeAgo(snap.capturedAt)}
            <button
              onClick={load}
              className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition-colors"
            >
              <RefreshCw size={12} /> Refresh
            </button>
          </div>
        </div>

        {/* Status pill bar */}
        <div className="max-w-screen-xl mx-auto mt-3 flex flex-wrap gap-2">
          {subsystems.map(({ id, label, status }) => (
            <a
              key={id}
              href={`#${id}`}
              className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <span className={`w-2 h-2 rounded-full ${statusColor(status)}`} />
              {label}
            </a>
          ))}
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 pt-6 space-y-8">

        {/* ── SECTION 1: API Health ── */}
        <section id="api">
          <SectionHeader icon={<Activity size={16} />} title="API Health" id="api-h" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <KpiTile label="Avg Latency" value={fmtMs(apiHealth.avgLatencyMs)}
              severity={apiHealth.avgLatencyMs < 200 ? "ok" : apiHealth.avgLatencyMs < 500 ? "warn" : "crit"} />
            <KpiTile label="P95 Latency" value={fmtMs(apiHealth.p95LatencyMs)}
              severity={apiHealth.p95LatencyMs < 500 ? "ok" : apiHealth.p95LatencyMs < 1500 ? "warn" : "crit"} />
            <KpiTile label="Error Rate" value={`${apiHealth.errorRatePct.toFixed(2)}%`}
              severity={apiHealth.errorRatePct < 1 ? "ok" : apiHealth.errorRatePct < 5 ? "warn" : "crit"} />
            <KpiTile label="Requests / min" value={apiHealth.requestsPerMin} severity="neutral" />
          </div>
          <div className="bg-white rounded-xl border border-slate-200 overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wide">
                <tr>
                  {["Endpoint", "Avg ms", "P95 ms", "Error %", "Status"].map(h => (
                    <th key={h} className="px-4 py-2 text-left font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {apiHealth.endpointBreakdown.sort((a, b) => b.avgMs - a.avgMs).map((ep, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-4 py-2 font-mono text-xs text-slate-700">{ep.path}</td>
                    <td className="px-4 py-2 font-mono">{Math.round(ep.avgMs)}</td>
                    <td className="px-4 py-2 font-mono">{Math.round(ep.p95Ms)}</td>
                    <td className={`px-4 py-2 font-mono font-semibold ${ep.errorPct > 5 ? "text-red-600" : ep.errorPct > 1 ? "text-amber-600" : "text-emerald-600"}`}>
                      {ep.errorPct.toFixed(2)}%
                    </td>
                    <td className="px-4 py-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${ep.errorPct < 1 ? "bg-emerald-100 text-emerald-700" : ep.errorPct < 5 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                        {ep.errorPct < 1 ? "OK" : ep.errorPct < 5 ? "WARN" : "ERROR"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── SECTIONS 2+3: Jobs + DB Pool ── */}
        <div className="grid md:grid-cols-2 gap-6">
          <section id="jobs">
            <SectionHeader icon={<Zap size={16} />} title="Background Jobs" id="jobs-h" />
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
              <div className="flex items-center gap-4">
                <div className={`text-3xl font-bold font-mono ${jobStats.failedLast24h > 0 ? "text-red-600" : "text-emerald-600"}`}>
                  {jobStats.failedLast24h}
                </div>
                <div className="text-sm text-slate-500">
                  failures in last 24h<br />
                  <span className="text-slate-400">{jobStats.scheduledJobCount} scheduled jobs</span>
                </div>
              </div>
              <div className="border-t border-slate-100 pt-3">
                <table className="w-full text-xs">
                  <thead className="text-slate-400 uppercase tracking-wide">
                    <tr>
                      <th className="text-left pb-2">Job</th>
                      <th className="text-left pb-2">Last Run</th>
                      <th className="text-left pb-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {Object.entries(jobStats.lastRunTimes).map(([name, info]) => (
                      <tr key={name}>
                        <td className="py-1.5 font-mono text-slate-700 pr-2">{name}</td>
                        <td className="py-1.5 text-slate-500">{timeAgo(info.lastRun)}</td>
                        <td className="py-1.5">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${info.status === "OK" ? "bg-emerald-100 text-emerald-700" : info.status === "FAILED" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-500"}`}>
                            {info.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section id="db">
            <SectionHeader icon={<Database size={16} />} title="Database Pool" id="db-h" />
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
              {(() => {
                const pct = dbPool.activeConnections / dbPool.maxPoolSize;
                const barColor = pct > 0.8 ? "bg-red-500" : pct > 0.6 ? "bg-amber-400" : "bg-emerald-500";
                return (
                  <>
                    <div>
                      <div className="flex justify-between text-sm font-medium text-slate-700 mb-1">
                        <span>Active Connections</span>
                        <span className={`font-mono font-bold ${pct > 0.8 ? "text-red-600" : pct > 0.6 ? "text-amber-600" : "text-emerald-600"}`}>
                          {dbPool.activeConnections} / {dbPool.maxPoolSize}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5">
                        <div className={`${barColor} h-2.5 rounded-full transition-all`} style={{ width: `${Math.min(pct * 100, 100).toFixed(1)}%` }} />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="bg-slate-50 rounded-lg p-2">
                        <div className="text-lg font-bold font-mono text-slate-800">{dbPool.idleConnections}</div>
                        <div className="text-xs text-slate-400">Idle</div>
                      </div>
                      <div className={`rounded-lg p-2 ${dbPool.waitingThreads > 0 ? "bg-amber-50" : "bg-slate-50"}`}>
                        <div className={`text-lg font-bold font-mono ${dbPool.waitingThreads > 0 ? "text-amber-700" : "text-slate-800"}`}>{dbPool.waitingThreads}</div>
                        <div className="text-xs text-slate-400">Waiting</div>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-2">
                        <div className="text-lg font-bold font-mono text-slate-800">{fmtMs(dbPool.avgAcquireMs)}</div>
                        <div className="text-xs text-slate-400">Avg Acquire</div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </section>
        </div>

        {/* ── SECTIONS 4+5: Notifications + Payments ── */}
        <div className="grid md:grid-cols-2 gap-6">
          <section id="notifications">
            <SectionHeader icon={<Bell size={16} />} title="Notifications" id="notif-h" />
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <KpiTile label="Sent 24h" value={notificationStats.sentLast24h} severity="neutral" />
                <KpiTile label="Failed 24h" value={notificationStats.failedLast24h}
                  severity={notificationStats.failedLast24h === 0 ? "ok" : "warn"} />
                <KpiTile label="Fail Rate" value={`${notificationStats.failureRatePct.toFixed(1)}%`}
                  severity={notificationStats.failureRatePct < 1 ? "ok" : notificationStats.failureRatePct < 5 ? "warn" : "crit"} />
              </div>
              <div className="border-t border-slate-100 pt-3">
                <p className="text-xs text-slate-400 mb-2 uppercase font-semibold tracking-wide">By Channel</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(notificationStats.failedByChannel).map(([ch, count]) => (
                    <span key={ch} className={`text-xs px-2 py-1 rounded-lg font-medium ${count > 0 ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
                      {ch}: {count}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section id="payments">
            <SectionHeader icon={<CreditCard size={16} />} title="Payment Verification" id="pay-h" />
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="grid grid-cols-2 gap-3">
                <KpiTile label="Pending Verif." value={paymentHealth.pendingVerifications}
                  severity={paymentHealth.pendingVerifications === 0 ? "ok" : "warn"} />
                <KpiTile label="Avg Delay" value={`${paymentHealth.avgVerificationDelayMin.toFixed(0)}m`}
                  severity={paymentHealth.avgVerificationDelayMin < 5 ? "ok" : paymentHealth.avgVerificationDelayMin < 30 ? "warn" : "crit"} />
                <KpiTile label="Stalled >30m" value={paymentHealth.stalledPayments}
                  severity={paymentHealth.stalledPayments === 0 ? "ok" : "crit"} />
                <KpiTile label="Failed 24h" value={paymentHealth.failedLast24h}
                  severity={paymentHealth.failedLast24h === 0 ? "ok" : paymentHealth.failedLast24h < 10 ? "warn" : "crit"} />
              </div>
            </div>
          </section>
        </div>

        {/* ── SECTION 6: WebSocket Health ── */}
        <section id="websocket">
          <SectionHeader icon={<Wifi size={16} />} title="WebSocket Health" id="ws-h" />
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <KpiTile label="Active Connections" value={wsStats.activeConnections} severity="neutral" />
              <KpiTile label="Peak Today" value={wsStats.peakConnectionsToday} severity="neutral" />
              <KpiTile label="Messages / min" value={wsStats.messagesPerMin} severity="neutral" />
            </div>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2 text-left">Topic</th>
                    <th className="px-4 py-2 text-right">Connections</th>
                    <th className="px-4 py-2 text-right">Msg / min</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Object.entries(wsStats.topicBreakdown)
                    .sort((a, b) => b[1].connections - a[1].connections)
                    .map(([topic, stats]) => (
                      <tr key={topic} className="hover:bg-slate-50">
                        <td className="px-4 py-2 font-mono text-xs text-slate-700">{topic}</td>
                        <td className="px-4 py-2 text-right font-mono">{stats.connections}</td>
                        <td className="px-4 py-2 text-right font-mono">{stats.messagesPerMin}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── SECTION 7: Storage ── */}
        <section id="storage">
          <SectionHeader icon={<HardDrive size={16} />} title="Storage" id="storage-h" />
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
            {(() => {
              const pct = storageStats.diskUsedPct;
              const barColor = pct > 90 ? "bg-red-500" : pct > 75 ? "bg-amber-400" : "bg-indigo-500";
              return (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Disk Usage</span>
                    <span className={`font-mono font-bold text-sm ${pct > 90 ? "text-red-600" : pct > 75 ? "text-amber-600" : "text-slate-700"}`}>
                      {storageStats.diskUsedGb.toFixed(1)} / {storageStats.diskTotalGb.toFixed(1)} GB ({pct.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3">
                    <div className={`${barColor} h-3 rounded-full transition-all`} style={{ width: `${Math.min(pct, 100).toFixed(1)}%` }} />
                  </div>
                  {storagePoints.length > 1 && (
                    <div className="flex items-center gap-3 pt-1">
                      <span className="text-xs text-slate-400">7-hour trend</span>
                      <Sparkline points={storagePoints} width={160} height={28} />
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </section>

        {/* ── SECTION 8: CI/CD Releases ── */}
        <section id="cicd">
          <SectionHeader icon={<GitBranch size={16} />} title="CI/CD Releases" id="cicd-h" />
          <div className="bg-white rounded-xl border border-slate-200 overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wide">
                <tr>
                  {["Service", "Version", "Env", "Status", "Commit", "By", "Time"].map(h => (
                    <th key={h} className="px-4 py-2 text-left font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentDeploys.slice(0, 10).map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2 font-semibold text-slate-800 whitespace-nowrap">{d.serviceName}</td>
                    <td className="px-4 py-2 font-mono text-xs">{d.version}</td>
                    <td className="px-4 py-2">
                      <span className="text-xs px-2 py-0.5 bg-slate-100 rounded-full font-medium text-slate-600">{d.environment}</span>
                    </td>
                    <td className="px-4 py-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${deployStatusChip(d.status)}`}>{d.status}</span>
                    </td>
                    <td className="px-4 py-2 font-mono text-xs text-slate-500">{d.commitSha?.slice(0, 7) ?? "—"}</td>
                    <td className="px-4 py-2 text-xs text-slate-500">{d.deployedBy ?? "—"}</td>
                    <td className="px-4 py-2 text-xs text-slate-400 whitespace-nowrap">{timeAgo(d.startedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── SECTION 9: Security Incidents ── */}
        <section id="security">
          <SectionHeader icon={<Shield size={16} />} title="Security Incidents (last 24h)" id="sec-h" />
          {securityIncidents.length === 0 ? (
            <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm">
              <CheckCircle size={16} /> No incidents in the last 24 hours
            </div>
          ) : (
            <div className="space-y-2">
              {securityIncidents.map((inc) => (
                <div key={inc.incidentId} className={`bg-white border-l-4 border border-slate-200 rounded-xl px-4 py-3 ${inc.severity === "CRITICAL" ? "border-l-red-500" : "border-l-amber-400"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${inc.severity === "CRITICAL" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>{inc.category}</span>
                      {inc.description}
                    </div>
                    <span className="text-xs text-slate-400 whitespace-nowrap shrink-0">{timeAgo(inc.occurredAt)}</span>
                  </div>
                  {inc.actorId && <p className="text-xs text-slate-400 mt-1">Actor ID: {inc.actorId}</p>}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── SECTION 10: Tenant Health ── */}
        <section id="tenants">
          <SectionHeader icon={<Users size={16} />} title="Tenant Health" id="tenants-h" />
          <div className="bg-white rounded-xl border border-slate-200 overflow-auto">
            <div className="flex items-center gap-3 px-4 py-2 border-b border-slate-100 text-xs text-slate-500">
              <span>Sort by:</span>
              <button onClick={() => setSortTenantBy("openIssues")} className={`px-2 py-1 rounded ${sortTenantBy === "openIssues" ? "bg-indigo-100 text-indigo-700 font-semibold" : "hover:bg-slate-100"}`}>Open Issues</button>
              <button onClick={() => setSortTenantBy("lastActive")} className={`px-2 py-1 rounded ${sortTenantBy === "lastActive" ? "bg-indigo-100 text-indigo-700 font-semibold" : "hover:bg-slate-100"}`}>Last Active</button>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wide">
                <tr>
                  {["Community", "Status", "Residents", "Open Issues", "Last Active", "Onboarding"].map(h => (
                    <th key={h} className="px-4 py-2 text-left font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedTenants.map((t) => {
                  const stuckOnboarding = t.status === "ONBOARDING" && t.onboardingStepCompleted < 5;
                  return (
                    <tr key={t.communityId} className={`hover:bg-slate-50 ${stuckOnboarding ? "bg-amber-50" : ""}`}>
                      <td className="px-4 py-2 font-semibold text-slate-800">{t.communityName}</td>
                      <td className="px-4 py-2">
                        <span className={`flex items-center gap-1.5 w-fit text-xs px-2 py-0.5 rounded-full font-semibold ${
                          t.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" :
                          t.status === "ONBOARDING" ? "bg-blue-100 text-blue-700" :
                          t.status === "INACTIVE" ? "bg-slate-100 text-slate-500" :
                          "bg-red-100 text-red-700"}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusColor(t.status)}`} />
                          {t.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 font-mono">{t.residentCount.toLocaleString()}</td>
                      <td className="px-4 py-2">
                        <span className={`font-mono font-bold ${t.openIssues > 10 ? "text-red-600" : t.openIssues > 5 ? "text-amber-600" : "text-slate-700"}`}>{t.openIssues}</span>
                      </td>
                      <td className="px-4 py-2 text-slate-500 text-xs">{timeAgo(t.lastActiveAt)}</td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-0.5">
                            {[1,2,3,4,5,6,7].map(step => (
                              <div key={step} className={`w-2.5 h-2.5 rounded-sm ${step <= t.onboardingStepCompleted ? "bg-indigo-500" : "bg-slate-200"}`} />
                            ))}
                          </div>
                          <span className="text-xs text-slate-400">{t.onboardingStepCompleted}/7</span>
                          {stuckOnboarding && <AlertTriangle size={12} className="text-amber-500" />}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* ── Floating Alerts Panel ── */}
      {visibleAlerts.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50 w-80 space-y-2">
          {shownAlerts.map((alert) => (
            <div key={alert.id} className={`rounded-xl border shadow-lg ${severityBg(alert.severity)} border-l-4 ${severityBorder(alert.severity)} p-3`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {alert.severity === "CRITICAL" ? <XCircle size={14} className="text-red-500 shrink-0" /> :
                   alert.severity === "WARNING" ? <AlertTriangle size={14} className="text-amber-500 shrink-0" /> :
                   <AlertCircle size={14} className="text-blue-500 shrink-0" />}
                  <span className="text-xs font-semibold text-slate-800 truncate">{alert.title}</span>
                </div>
                <button
                  onClick={() => setDismissedAlerts(prev => new Set([...prev, alert.id]))}
                  className="shrink-0 text-slate-400 hover:text-slate-600"
                ><X size={12} /></button>
              </div>
              {alert.description && (
                <p className="text-xs text-slate-500 mt-1 ml-5">{alert.description}</p>
              )}
            </div>
          ))}
          {visibleAlerts.length > 3 && (
            <button
              onClick={() => setAlertsExpanded(!alertsExpanded)}
              className="w-full text-xs text-center text-slate-500 hover:text-slate-700 flex items-center justify-center gap-1 py-1"
            >
              {alertsExpanded ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
              {alertsExpanded ? "Show fewer" : `and ${visibleAlerts.length - 3} more alerts`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
