import { useEffect, useState } from "react";
import { RefreshCw, ChevronDown, ChevronRight } from "lucide-react";
import { hrmService } from "../../../services/hrm/hrmService";
import type { HrAuditLog } from "../../../types/hrm";

interface Props { orgId: number }

const ENTITY_TYPES = ["", "EMPLOYEE", "LEAVE_REQUEST", "PAYROLL_RUN", "PAYSLIP", "EXPENSE_CLAIM", "ASSET", "ATTENDANCE", "SHIFT", "TICKET"];

export default function AuditTrailViewer({ orgId }: Props) {
  const [logs, setLogs] = useState<HrAuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [entityType, setEntityType] = useState("");
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const size = 20;

  const load = (p = page, et = entityType) => {
    if (!orgId) return;
    setLoading(true);
    hrmService.getAuditLogs(orgId, { page: p, size, entityType: et || undefined })
      .then(res => {
        const r = res as unknown as { content: HrAuditLog[]; totalElements: number };
        setLogs(r.content ?? []);
        setTotal(r.totalElements ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(0, entityType); setPage(0); }, [orgId, entityType]);

  if (!orgId) return <p className="text-muted-foreground">Select an organisation.</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-semibold">Audit Trail</h2>
          <p className="text-sm text-muted-foreground">All HRM actions logged with actor and before/after state</p>
        </div>
        <button onClick={() => load(page, entityType)} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:bg-accent">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm text-muted-foreground">Filter by entity:</label>
        <select
          value={entityType}
          onChange={e => setEntityType(e.target.value)}
          className="text-sm rounded-lg border border-border bg-background px-3 py-1.5"
        >
          {ENTITY_TYPES.map(t => <option key={t} value={t}>{t || "All"}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 bg-muted animate-pulse rounded-lg" />)}
        </div>
      ) : logs.length === 0 ? (
        <p className="text-center py-12 text-muted-foreground text-sm">No audit logs found.</p>
      ) : (
        <>
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Timestamp</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Actor</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Action</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Entity</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Description</th>
                  <th className="px-4 py-2 w-8" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map(log => (
                  <>
                    <tr key={log.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => setExpanded(expanded === log.id ? null : log.id)}>
                      <td className="px-4 py-2 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-xs">{log.actorName ?? `User #${log.actorUserId}`}</td>
                      <td className="px-4 py-2">
                        <span className="text-xs px-2 py-0.5 rounded bg-muted font-mono">{log.action}</span>
                      </td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">
                        {log.entityType}{log.entityId ? ` #${log.entityId}` : ""}
                      </td>
                      <td className="px-4 py-2 text-xs truncate max-w-[200px]">{log.entityDescription}</td>
                      <td className="px-4 py-2">
                        {(log.beforeSnapshot || log.afterSnapshot) &&
                          (expanded === log.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />)
                        }
                      </td>
                    </tr>
                    {expanded === log.id && (log.beforeSnapshot || log.afterSnapshot) && (
                      <tr key={`${log.id}-detail`}>
                        <td colSpan={6} className="px-4 py-3 bg-muted/20">
                          <div className="grid md:grid-cols-2 gap-3 text-xs font-mono">
                            {log.beforeSnapshot && (
                              <div>
                                <p className="font-sans font-semibold text-muted-foreground mb-1">Before</p>
                                <pre className="bg-background p-2 rounded border border-border overflow-auto max-h-32 text-[10px]">
                                  {JSON.stringify(JSON.parse(log.beforeSnapshot), null, 2)}
                                </pre>
                              </div>
                            )}
                            {log.afterSnapshot && (
                              <div>
                                <p className="font-sans font-semibold text-muted-foreground mb-1">After</p>
                                <pre className="bg-background p-2 rounded border border-border overflow-auto max-h-32 text-[10px]">
                                  {JSON.stringify(JSON.parse(log.afterSnapshot), null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <p>Showing {page * size + 1}–{Math.min((page + 1) * size, total)} of {total}</p>
            <div className="flex gap-2">
              <button disabled={page === 0} onClick={() => { const p = page - 1; setPage(p); load(p, entityType); }} className="px-3 py-1 rounded border border-border hover:bg-accent disabled:opacity-40">Previous</button>
              <button disabled={(page + 1) * size >= total} onClick={() => { const p = page + 1; setPage(p); load(p, entityType); }} className="px-3 py-1 rounded border border-border hover:bg-accent disabled:opacity-40">Next</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
