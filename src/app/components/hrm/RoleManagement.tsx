import { useEffect, useState } from "react";
import { Shield, Trash2, RefreshCw, UserPlus } from "lucide-react";
import { hrmService } from "../../../services/hrm/hrmService";
import type { HrmRole, HrEmployeeListItem } from "../../../types/hrm";

interface Props { orgId: number }

const ROLES = ["HR_ADMIN", "HR_MANAGER", "MANAGER", "EMPLOYEE"] as const;
type RoleType = typeof ROLES[number];

const ROLE_BADGE: Record<RoleType, string> = {
  HR_ADMIN:   "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  HR_MANAGER: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  MANAGER:    "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  EMPLOYEE:   "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
};

export default function RoleManagement({ orgId }: Props) {
  const [roles, setRoles] = useState<HrmRole[]>([]);
  const [employees, setEmployees] = useState<HrEmployeeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ employeeId: 0, role: "EMPLOYEE" as RoleType });
  const [granting, setGranting] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    if (!orgId) return;
    setLoading(true);
    Promise.allSettled([
      hrmService.getRoleAssignments(orgId),
      hrmService.getEmployees(orgId, { page: 0, size: 200 }),
    ]).then(([r, e]) => {
      if (r.status === "fulfilled") setRoles(r.value);
      if (e.status === "fulfilled") {
        const list = (e.value as unknown as { content?: HrEmployeeListItem[] }).content ?? (e.value as HrEmployeeListItem[]);
        setEmployees(list);
      }
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [orgId]);

  const grant = async () => {
    if (!form.employeeId) { setError("Select an employee"); return; }
    setError("");
    setGranting(true);
    try {
      await hrmService.grantRole(orgId, { employeeId: form.employeeId, role: form.role });
      setForm({ employeeId: 0, role: "EMPLOYEE" });
      load();
    } catch (err: unknown) {
      setError((err as Error)?.message ?? "Failed to grant role");
    } finally {
      setGranting(false);
    }
  };

  const revoke = async (roleId: number) => {
    try {
      await hrmService.revokeRole(orgId, roleId);
      load();
    } catch {}
  };

  if (!orgId) return <p className="text-muted-foreground">Select an organisation.</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-semibold">Role Management</h2>
          <p className="text-sm text-muted-foreground">Assign HRM roles to employees</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:bg-accent">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 space-y-4">
        <h3 className="text-sm font-semibold flex items-center gap-2"><UserPlus className="h-4 w-4" /> Grant Role</h3>
        <div className="flex gap-3 flex-wrap">
          <select
            value={form.employeeId}
            onChange={e => setForm(f => ({ ...f, employeeId: Number(e.target.value) }))}
            className="text-sm rounded-lg border border-border bg-background px-3 py-2 flex-1 min-w-[180px]"
          >
            <option value={0}>Select employee…</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>
                {emp.firstName} {emp.lastName ?? ""} ({emp.employeeCode})
              </option>
            ))}
          </select>
          <select
            value={form.role}
            onChange={e => setForm(f => ({ ...f, role: e.target.value as RoleType }))}
            className="text-sm rounded-lg border border-border bg-background px-3 py-2"
          >
            {ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g, " ")}</option>)}
          </select>
          <button
            onClick={grant}
            disabled={granting}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90 disabled:opacity-50"
          >
            {granting ? "Granting…" : "Grant"}
          </button>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />)}
        </div>
      ) : roles.length === 0 ? (
        <p className="text-center py-10 text-muted-foreground text-sm">No role assignments found.</p>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Employee</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Role</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Granted</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-2 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {roles.map(r => (
                <tr key={r.id} className="hover:bg-muted/30">
                  <td className="px-4 py-2 font-medium flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    {r.employeeName ?? `Employee #${r.employeeId}`}
                  </td>
                  <td className="px-4 py-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_BADGE[r.role as RoleType] ?? ""}`}>
                      {r.role.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">{new Date(r.grantedAt).toLocaleDateString()}</td>
                  <td className="px-4 py-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${r.isActive ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
                      {r.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <button onClick={() => revoke(r.id)} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
