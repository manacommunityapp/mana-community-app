import { useState, useEffect, useCallback } from "react";
import { Users, Shield, Calendar, Plus, X, Loader2, Trash2 } from "lucide-react";
import {
  staffAccessRuleService, staffLeaveService,
  type StaffAccessRule, type StaffLeave,
} from "../../../services/security/securityService";

type TabKey = "access-rules" | "leaves";

export function StaffManagement() {
  const [tab, setTab] = useState<TabKey>("access-rules");

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: "access-rules", label: "Access Rules", icon: <Shield className="w-4 h-4" /> },
    { key: "leaves", label: "Leave Management", icon: <Calendar className="w-4 h-4" /> },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Users className="w-6 h-6 text-blue-600" /> Staff Management
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">Manage staff access rules and leave records</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === "access-rules" && <StaffAccessRulesTab />}
      {tab === "leaves" && <StaffLeavesTab />}
    </div>
  );
}

// ── Access Rules ──────────────────────────────────────────────────────────────

function StaffAccessRulesTab() {
  const [staffId, setStaffId] = useState("");
  const [rules, setRules] = useState<StaffAccessRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ allowedFrom: "08:00", allowedUntil: "20:00", gateAccess: "", notes: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!staffId) return;
    setLoading(true);
    try { setRules(await staffAccessRuleService.getRules(Number(staffId))); } catch { setRules([]); }
    finally { setLoading(false); }
  }, [staffId]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!staffId) return;
    setSaving(true);
    try {
      await staffAccessRuleService.addRule({
        staffId: Number(staffId),
        allowedFrom: form.allowedFrom,
        allowedUntil: form.allowedUntil,
        gateAccess: form.gateAccess || undefined,
        notes: form.notes || undefined,
      });
      setShowForm(false);
      load();
    } catch { alert("Failed to add rule."); }
    finally { setSaving(false); }
  };

  const del = async (id: number) => {
    if (!confirm("Delete this access rule?")) return;
    try { await staffAccessRuleService.deleteRule(id); load(); } catch { alert("Failed."); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3 flex-wrap">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Staff ID</label>
          <input value={staffId} onChange={(e) => setStaffId(e.target.value)}
            placeholder="Enter staff ID to load rules"
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48" />
        </div>
        <button onClick={load} disabled={!staffId}
          className="px-4 py-2 bg-slate-100 text-slate-700 text-sm rounded-lg hover:bg-slate-200 disabled:opacity-50">Load</button>
        <button onClick={() => setShowForm(true)} disabled={!staffId}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 ml-auto">
          <Plus className="w-4 h-4" /> Add Rule
        </button>
      </div>

      {showForm && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <h4 className="font-medium text-slate-900">New Access Rule</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Allowed From *</label>
              <input type="time" value={form.allowedFrom} onChange={(e) => setForm({ ...form, allowedFrom: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Allowed Until *</label>
              <input type="time" value={form.allowedUntil} onChange={(e) => setForm({ ...form, allowedUntil: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Gate Access</label>
              <input value={form.gateAccess} onChange={(e) => setForm({ ...form, gateAccess: e.target.value })}
                placeholder="e.g. Main Gate, All"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
              <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Optional notes"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-slate-200 text-slate-700 text-sm rounded-lg hover:bg-slate-50">Cancel</button>
            <button onClick={save} disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin inline" /> : "Save"}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
      ) : rules.length === 0 ? (
        <div className="text-center py-10 text-slate-400">
          <Shield className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>{staffId ? "No access rules for this staff member" : "Enter a staff ID above to load rules"}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {["Time Window", "Gate Access", "Days", "Notes", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rules.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-slate-700">{r.allowedFrom} – {r.allowedUntil}</td>
                  <td className="px-4 py-3 text-slate-600">{r.gateAccess ?? "All"}</td>
                  <td className="px-4 py-3 text-slate-500">{r.daysAllowed?.join(", ") ?? "All days"}</td>
                  <td className="px-4 py-3 text-slate-500">{r.notes ?? "—"}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => del(r.id)} className="p-1.5 rounded hover:bg-red-50">
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
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

// ── Leave Management ──────────────────────────────────────────────────────────

function StaffLeavesTab() {
  const [staffId, setStaffId] = useState("");
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [leaves, setLeaves] = useState<StaffLeave[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ leaveDate: new Date().toISOString().slice(0, 10), leaveType: "FULL_DAY", reason: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!staffId) return;
    setLoading(true);
    try { setLeaves(await staffLeaveService.getLeaves(Number(staffId), month)); } catch { setLeaves([]); }
    finally { setLoading(false); }
  }, [staffId, month]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!staffId) return;
    setSaving(true);
    try {
      await staffLeaveService.markLeave({
        staffId: Number(staffId),
        leaveDate: form.leaveDate,
        leaveType: form.leaveType || undefined,
        reason: form.reason || undefined,
      });
      setShowForm(false);
      load();
    } catch { alert("Failed to mark leave."); }
    finally { setSaving(false); }
  };

  const cancel = async (id: number) => {
    if (!confirm("Cancel this leave?")) return;
    try { await staffLeaveService.cancelLeave(id); load(); } catch { alert("Failed."); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3 flex-wrap">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Staff ID</label>
          <input value={staffId} onChange={(e) => setStaffId(e.target.value)}
            placeholder="Enter staff ID"
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-40" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Month</label>
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <button onClick={load} disabled={!staffId}
          className="px-4 py-2 bg-slate-100 text-slate-700 text-sm rounded-lg hover:bg-slate-200 disabled:opacity-50">Load</button>
        <button onClick={() => setShowForm(true)} disabled={!staffId}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 ml-auto">
          <Plus className="w-4 h-4" /> Mark Leave
        </button>
      </div>

      {showForm && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <h4 className="font-medium text-slate-900">Mark Leave</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Leave Date *</label>
              <input type="date" value={form.leaveDate} onChange={(e) => setForm({ ...form, leaveDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Leave Type</label>
              <select value={form.leaveType} onChange={(e) => setForm({ ...form, leaveType: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="FULL_DAY">Full Day</option>
                <option value="HALF_DAY">Half Day</option>
                <option value="SICK_LEAVE">Sick Leave</option>
                <option value="CASUAL_LEAVE">Casual Leave</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Reason</label>
              <input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}
                placeholder="Optional reason"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-slate-200 text-slate-700 text-sm rounded-lg hover:bg-slate-50">Cancel</button>
            <button onClick={save} disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin inline" /> : "Save"}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
      ) : leaves.length === 0 ? (
        <div className="text-center py-10 text-slate-400">
          <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>{staffId ? "No leaves recorded this month" : "Enter a staff ID above"}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {["Date", "Type", "Reason", "Status", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leaves.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{l.leaveDate}</td>
                  <td className="px-4 py-3 text-slate-600">{l.leaveType ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-500">{l.reason ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                      l.status === "APPROVED" ? "bg-emerald-50 border-emerald-200 text-emerald-700" :
                      l.status === "CANCELLED" ? "bg-red-50 border-red-200 text-red-700" :
                      "bg-amber-50 border-amber-200 text-amber-700"
                    }`}>{l.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    {l.status !== "CANCELLED" && (
                      <button onClick={() => cancel(l.id)} className="p-1.5 rounded hover:bg-red-50" title="Cancel Leave">
                        <X className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    )}
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
