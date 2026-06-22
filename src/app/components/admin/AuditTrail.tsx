import { useCallback, useEffect, useState } from "react";
import { ShieldCheck, RefreshCw, Loader2, AlertTriangle, Filter, Monitor } from "lucide-react";
import {
  auditLogService,
  AUDIT_MODULES,
  AUDIT_ACTIONS,
  type AuditLogDto,
  type AuditPageResponse,
  type AuditStatsResponse,
} from "../../../services/auditLogService";
import {
  sessionMonitorService,
  type SessionDto,
  type SessionStatsResponse,
} from "../../../services/sessionMonitorService";

const PAGE_SIZE = 50;

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500 mt-1">{label}</p>
    </div>
  );
}

const ACTION_COLORS: Record<string, string> = {
  USER_CREATED: "bg-emerald-100 text-emerald-700",
  PERMISSION_CHANGED: "bg-amber-100 text-amber-700",
  ROLE_CHANGED: "bg-amber-100 text-amber-700",
  BID_PLACED: "bg-blue-100 text-blue-700",
  PLAYER_SOLD: "bg-violet-100 text-violet-700",
  TEAM_CREATED: "bg-indigo-100 text-indigo-700",
};

export function AuditTrail() {
  const [stats, setStats] = useState<AuditStatsResponse | null>(null);
  const [data, setData] = useState<AuditPageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(0);
  const [module, setModule] = useState("");
  const [action, setAction] = useState("");

  const [sessions, setSessions] = useState<SessionDto[]>([]);
  const [sessionStats, setSessionStats] = useState<SessionStatsResponse | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [logs, statResp, sess, sessStats] = await Promise.all([
        auditLogService.getAuditLogs({ page, size: PAGE_SIZE, module: module || undefined, action: action || undefined }),
        auditLogService.getAuditStats(),
        sessionMonitorService.getSessions(20),
        sessionMonitorService.getSessionStats(),
      ]);
      setData(logs);
      setStats(statResp);
      setSessions(sess);
      setSessionStats(sessStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load audit trail");
    } finally {
      setLoading(false);
    }
  }, [page, module, action]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fmt = (iso: string) => {
    try {
      return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "medium" });
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            Audit Trail
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Durable record of sensitive actions across the platform.</p>
        </div>
        <button
          onClick={() => fetchData()}
          className="flex items-center gap-1.5 px-3 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Stat widgets */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="Events Today" value={stats?.eventsToday ?? 0} />
        <StatCard label="Users Created" value={stats?.usersCreatedToday ?? 0} />
        <StatCard label="Auction Events" value={stats?.auctionEventsToday ?? 0} />
        <StatCard label="Permission Changes" value={stats?.permissionChangesToday ?? 0} />
        <StatCard label="Bids Placed" value={stats?.bidsToday ?? 0} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1 text-xs font-medium text-slate-500"><Filter className="w-3.5 h-3.5" />Filters</span>
        <select
          value={module}
          onChange={(e) => { setPage(0); setModule(e.target.value); }}
          className="text-sm border border-slate-300 rounded-lg px-3 py-1.5 bg-white outline-none focus:border-indigo-400"
        >
          <option value="">All modules</option>
          {AUDIT_MODULES.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <select
          value={action}
          onChange={(e) => { setPage(0); setAction(e.target.value); }}
          className="text-sm border border-slate-300 rounded-lg px-3 py-1.5 bg-white outline-none focus:border-indigo-400"
        >
          <option value="">All actions</option>
          {AUDIT_ACTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        {(module || action) && (
          <button
            onClick={() => { setPage(0); setModule(""); setAction(""); }}
            className="text-xs text-slate-500 hover:text-slate-700 underline"
          >
            Clear
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading audit trail…
          </div>
        ) : !data || data.content.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-500">No audit events found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase">
                  <th className="px-4 py-2.5">Time</th>
                  <th className="px-4 py-2.5">Action</th>
                  <th className="px-4 py-2.5">Module</th>
                  <th className="px-4 py-2.5">Entity</th>
                  <th className="px-4 py-2.5">User</th>
                  <th className="px-4 py-2.5">IP</th>
                  <th className="px-4 py-2.5">Detail</th>
                </tr>
              </thead>
              <tbody>
                {data.content.map((row: AuditLogDto) => (
                  <tr key={row.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-2.5 whitespace-nowrap text-slate-600">{fmt(row.createdAt)}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ACTION_COLORS[row.action] ?? "bg-slate-100 text-slate-600"}`}>
                        {row.action}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">{row.module}</td>
                    <td className="px-4 py-2.5 text-slate-600">{row.entityName}{row.entityId ? ` #${row.entityId}` : ""}</td>
                    <td className="px-4 py-2.5 text-slate-600">{row.userId ?? "—"}</td>
                    <td className="px-4 py-2.5 text-slate-500 font-mono text-xs">{row.ipAddress ?? "—"}</td>
                    <td className="px-4 py-2.5 text-slate-500 max-w-xs truncate" title={row.newValue ?? ""}>{row.newValue ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">
            Page {data.page + 1} of {data.totalPages} · {data.totalElements} events
          </span>
          <div className="flex gap-2">
            <button
              disabled={data.page <= 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-300 disabled:opacity-40 hover:bg-slate-50"
            >
              Previous
            </button>
            <button
              disabled={data.page >= data.totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 disabled:opacity-40 hover:bg-slate-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Login sessions */}
      <div className="pt-2">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-3">
          <Monitor className="w-4 h-4 text-indigo-600" />
          Login Sessions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          <StatCard label="Active Sessions" value={sessionStats?.activeSessions ?? 0} />
          <StatCard label="Logins Today" value={sessionStats?.loginsToday ?? 0} />
        </div>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {sessions.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-500">No login sessions recorded.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase">
                    <th className="px-4 py-2.5">User</th>
                    <th className="px-4 py-2.5">Device</th>
                    <th className="px-4 py-2.5">Browser</th>
                    <th className="px-4 py-2.5">IP</th>
                    <th className="px-4 py-2.5">Login</th>
                    <th className="px-4 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s) => (
                    <tr key={s.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-2.5 text-slate-600">{s.userId}</td>
                      <td className="px-4 py-2.5 text-slate-600">{s.device ?? "—"}</td>
                      <td className="px-4 py-2.5 text-slate-600">{s.browser ?? "—"}</td>
                      <td className="px-4 py-2.5 text-slate-500 font-mono text-xs">{s.ipAddress ?? "—"}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap text-slate-600">{fmt(s.loginAt)}</td>
                      <td className="px-4 py-2.5">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          s.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                        }`}>
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
