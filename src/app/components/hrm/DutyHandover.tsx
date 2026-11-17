import { useState, useCallback, useEffect } from "react";
import {
  ArrowLeftRight, AlertTriangle, CheckCircle2, Clock, MapPin,
  Plus, Loader2, X, ChevronDown,
} from "lucide-react";
import { workforce360Service } from "../../../services/workforce360Service";
import { useHrmOrg } from "../../../contexts/HrmOrgContext";
import type { MwDutyHandover, MwOperationalAssignment } from "../../../types/hrm";

// ── Helpers ──────────────────────────────────────────────────────────

function fmtDT(ts: string) {
  return new Date(ts).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

const MODULE_COLORS: Record<string, string> = {
  POOL:        "bg-blue-100 text-blue-700",
  JOBS:        "bg-purple-100 text-purple-700",
  MANA_FRESH:  "bg-orange-100 text-orange-700",
};

const STATUS_COLORS: Record<string, string> = {
  ASSIGNED:    "bg-yellow-100 text-yellow-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  COMPLETED:   "bg-green-100 text-green-700",
  CANCELLED:   "bg-gray-100 text-gray-500",
};

// ── New Handover Modal ───────────────────────────────────────────────

function NewHandoverModal({ orgId, onClose, onSuccess }: { orgId: number; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    handoverFromEmployeeId: "", handoverToEmployeeId: "",
    location: "", notes: "", pendingTasks: "", equipmentStatus: "",
    incidentFlag: false, incidentDesc: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    setLoading(true); setError(null);
    try {
      await workforce360Service.createHandover(orgId, {
        handoverFromEmployeeId: form.handoverFromEmployeeId ? Number(form.handoverFromEmployeeId) : undefined,
        handoverToEmployeeId: form.handoverToEmployeeId ? Number(form.handoverToEmployeeId) : undefined,
        location: form.location || undefined,
        notes: form.notes || undefined,
        pendingTasks: form.pendingTasks || undefined,
        equipmentStatus: form.equipmentStatus || undefined,
        incidentFlag: form.incidentFlag,
        incidentDesc: form.incidentFlag ? form.incidentDesc : undefined,
      });
      onSuccess();
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to create handover");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl border border-border bg-background p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">New Duty Handover</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">From Employee ID</label>
              <input type="number" value={form.handoverFromEmployeeId} onChange={(e) => set("handoverFromEmployeeId", e.target.value)}
                className="w-full rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" placeholder="ID" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">To Employee ID</label>
              <input type="number" value={form.handoverToEmployeeId} onChange={(e) => set("handoverToEmployeeId", e.target.value)}
                className="w-full rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" placeholder="ID" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Location</label>
            <input value={form.location} onChange={(e) => set("location", e.target.value)}
              className="w-full rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Branch / area" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Notes</label>
            <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2}
              className="w-full rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" placeholder="General handover notes" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Pending Tasks</label>
            <textarea value={form.pendingTasks} onChange={(e) => set("pendingTasks", e.target.value)} rows={2}
              className="w-full rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" placeholder="List outstanding items..." />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Equipment Status</label>
            <input value={form.equipmentStatus} onChange={(e) => set("equipmentStatus", e.target.value)}
              className="w-full rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" placeholder="All OK / details..." />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="incidentFlag" checked={form.incidentFlag} onChange={(e) => set("incidentFlag", e.target.checked)} className="rounded accent-red-500" />
            <label htmlFor="incidentFlag" className="text-sm font-medium text-red-600">Flag Incident</label>
          </div>
          {form.incidentFlag && (
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Incident Description</label>
              <textarea value={form.incidentDesc} onChange={(e) => set("incidentDesc", e.target.value)} rows={2}
                className="w-full rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Describe the incident..." />
            </div>
          )}
        </div>
        {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted">Cancel</button>
          <button onClick={submit} disabled={loading}
            className="flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
            {loading && <Loader2 className="h-3 w-3 animate-spin" />} Create Handover
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Complete Assignment Modal ────────────────────────────────────────

function CompleteModal({ assignment, orgId, onClose, onSuccess }: { assignment: MwOperationalAssignment; orgId: number; onClose: () => void; onSuccess: () => void }) {
  const [score, setScore] = useState(0);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try { await workforce360Service.completeAssignment(orgId, assignment.id, score || undefined, notes || undefined); onSuccess(); onClose(); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-background p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">Complete Assignment</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Performance Score (1–5)</label>
        <div className="mb-3 flex gap-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <button key={s} onClick={() => setScore(s)}
              className={`h-8 w-8 rounded-full text-sm font-medium border transition-colors ${score === s ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-muted"}`}>{s}</button>
          ))}
        </div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Completion Notes</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
          className="mb-3 w-full rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Optional notes..." />
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted">Cancel</button>
          <button onClick={submit} disabled={loading}
            className="flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700 disabled:opacity-50">
            {loading && <Loader2 className="h-3 w-3 animate-spin" />} Complete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────

export default function DutyHandover() {
  const { activeOrgId } = useHrmOrg();
  const [tab, setTab] = useState<"handovers" | "assignments">("handovers");

  // Handovers
  const [handovers, setHandovers] = useState<MwDutyHandover[]>([]);
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().slice(0, 10));
  const [handoverLoading, setHandoverLoading] = useState(false);
  const [showNewHandover, setShowNewHandover] = useState(false);

  // Assignments
  const [assignments, setAssignments] = useState<MwOperationalAssignment[]>([]);
  const [moduleFilter, setModuleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);
  const [completeTarget, setCompleteTarget] = useState<MwOperationalAssignment | null>(null);

  const loadHandovers = useCallback(async () => {
    if (!activeOrgId) return;
    setHandoverLoading(true);
    try { setHandovers(await workforce360Service.getHandovers(activeOrgId, dateFilter || undefined)); }
    catch (e) { console.error(e); }
    finally { setHandoverLoading(false); }
  }, [activeOrgId, dateFilter]);

  const loadAssignments = useCallback(async () => {
    if (!activeOrgId) return;
    setAssignLoading(true);
    try { setAssignments(await workforce360Service.getOrgAssignments(activeOrgId, moduleFilter || undefined, statusFilter || undefined)); }
    catch (e) { console.error(e); }
    finally { setAssignLoading(false); }
  }, [activeOrgId, moduleFilter, statusFilter]);

  useEffect(() => { if (tab === "handovers") loadHandovers(); }, [tab, loadHandovers]);
  useEffect(() => { if (tab === "assignments") loadAssignments(); }, [tab, loadAssignments]);

  const acknowledge = async (h: MwDutyHandover) => {
    if (!activeOrgId) return;
    try { await workforce360Service.acknowledgeHandover(activeOrgId, h.id); loadHandovers(); }
    catch (e) { console.error(e); }
  };

  const startAssignment = async (a: MwOperationalAssignment) => {
    if (!activeOrgId) return;
    try { await workforce360Service.startAssignment(activeOrgId, a.id); loadAssignments(); }
    catch (e) { console.error(e); }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border bg-background px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Duty Handover</h1>
            <p className="text-xs text-muted-foreground">Shift handover log and operational assignments</p>
          </div>
          {tab === "handovers" && activeOrgId && (
            <button onClick={() => setShowNewHandover(true)}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4" /> New Handover
            </button>
          )}
        </div>
        <div className="mt-3 flex gap-2">
          {(["handovers", "assignments"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>
              {t === "handovers" ? "Handovers" : "Assignments"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {!activeOrgId ? (
          <p className="text-sm text-muted-foreground">Select an organization.</p>
        ) : tab === "handovers" ? (
          <div className="space-y-4">
            {/* Date filter */}
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}
                className="rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              <button onClick={loadHandovers} className="rounded-lg bg-muted px-3 py-1.5 text-sm hover:bg-muted/70">Refresh</button>
            </div>
            {handoverLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : handovers.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-8 text-center">
                <ArrowLeftRight className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No handovers on this date.</p>
              </div>
            ) : (
              handovers.map((h) => (
                <div key={h.id} className={`rounded-xl border bg-card p-4 shadow-sm ${h.incidentFlag ? "border-red-200 dark:border-red-900" : "border-border"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="font-medium text-foreground">
                          {h.handoverFrom ? `${h.handoverFrom.firstName} ${h.handoverFrom.lastName}` : "?"}
                        </span>
                        <ArrowLeftRight className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium text-foreground">
                          {h.handoverTo ? `${h.handoverTo.firstName} ${h.handoverTo.lastName}` : "?"}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        {h.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{h.location}</span>}
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{fmtDT(h.createdAt)}</span>
                      </div>
                      {h.notes && <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">{h.notes}</p>}
                      {h.pendingTasks && (
                        <p className="mt-1 text-xs text-muted-foreground"><span className="font-medium">Pending:</span> {h.pendingTasks}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {h.incidentFlag && (
                        <span className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                          <AlertTriangle className="h-3 w-3" /> Incident
                        </span>
                      )}
                      {h.acknowledged ? (
                        <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                          <CheckCircle2 className="h-3 w-3" /> Acknowledged
                        </span>
                      ) : (
                        <button onClick={() => acknowledge(h)}
                          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90">
                          Acknowledge
                        </button>
                      )}
                    </div>
                  </div>
                  {h.incidentFlag && h.incidentDesc && (
                    <div className="mt-2 rounded-lg bg-red-50 dark:bg-red-950/30 px-3 py-2 text-xs text-red-700 dark:text-red-300">
                      <span className="font-medium">Incident: </span>{h.incidentDesc}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        ) : (
          /* Assignments tab */
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <select value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)}
                  className="appearance-none rounded-lg border border-border bg-muted/40 py-1.5 pl-3 pr-7 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                  <option value="">All Modules</option>
                  {["POOL", "JOBS", "MANA_FRESH"].map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              </div>
              <div className="relative">
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                  className="appearance-none rounded-lg border border-border bg-muted/40 py-1.5 pl-3 pr-7 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                  <option value="">All Statuses</option>
                  {["ASSIGNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>

            {assignLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : assignments.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-8 text-center">
                <p className="text-sm text-muted-foreground">No assignments found.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {assignments.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${MODULE_COLORS[a.sourceModule] || "bg-gray-100 text-gray-600"}`}>
                      {a.sourceModule}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{a.assignmentType || "Assignment"} #{a.id}</p>
                      <p className="text-xs text-muted-foreground">Employee #{a.employeeId}</p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[a.status] || "bg-gray-100 text-gray-500"}`}>
                      {a.status}
                    </span>
                    <div className="flex gap-1">
                      {a.status === "ASSIGNED" && (
                        <button onClick={() => startAssignment(a)}
                          className="rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-200">Start</button>
                      )}
                      {a.status === "IN_PROGRESS" && (
                        <button onClick={() => setCompleteTarget(a)}
                          className="rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-200">Complete</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showNewHandover && activeOrgId && (
        <NewHandoverModal orgId={activeOrgId} onClose={() => setShowNewHandover(false)} onSuccess={loadHandovers} />
      )}
      {completeTarget && activeOrgId && (
        <CompleteModal assignment={completeTarget} orgId={activeOrgId} onClose={() => setCompleteTarget(null)} onSuccess={loadAssignments} />
      )}
    </div>
  );
}
