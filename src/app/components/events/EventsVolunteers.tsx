import { useState, useEffect, useMemo } from "react";
import {
  Users, Clock, Plus, Loader2, AlertCircle, Search,
  X, LogIn, LogOut, Edit2, Trash2, Filter,
} from "lucide-react";
import { useEventMock } from "./EventMockToggle";
import { LoadingSpinner } from "./shared";
import {
  eventVolunteerService,
  type EventVolunteerResponse,
  type EventVolunteerRequest,
} from "../../../services/events/eventVolunteerService";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "../ui/table";

// ── Constants ─────────────────────────────────────────────────────────────────

const DEPARTMENTS = [
  { name: "Registration",   head: "Priya S.",   total: 18, present: 16, color: "#6366f1" },
  { name: "Food & Kitchen", head: "Ravi M.",    total: 42, present: 38, color: "#4f46e5" },
  { name: "Security",       head: "Amit P.",    total: 24, present: 22, color: "#0891b2" },
  { name: "Venue & Decor",  head: "Sara J.",    total: 30, present: 28, color: "#8b5cf6" },
  { name: "Medical",        head: "Dr. Neha",   total: 8,  present: 8,  color: "#be185d" },
  { name: "Parking",        head: "Karan T.",   total: 12, present: 10, color: "#d97706" },
  { name: "Audio/Visual",   head: "Deepak J.",  total: 10, present: 9,  color: "#0f766e" },
  { name: "Guest Mgmt",     head: "Anita D.",   total: 15, present: 13, color: "#059669" },
];

const SHIFTS = [
  "Morning (6AM–2PM)",
  "Afternoon (12PM–8PM)",
  "Evening (2PM–10PM)",
  "Night (8PM–4AM)",
  "Full Day",
];

const STATUS_META: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  Assigned:      { bg: "bg-slate-50",   text: "text-slate-600",   dot: "bg-slate-400",   label: "Assigned"    },
  "Checked In":  { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-400", label: "Checked In"  },
  "Checked Out": { bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-400",   label: "Checked Out" },
  "No Show":     { bg: "bg-rose-50",    text: "text-rose-700",    dot: "bg-rose-400",    label: "No Show"     },
  ASSIGNED:      { bg: "bg-slate-50",   text: "text-slate-600",   dot: "bg-slate-400",   label: "Assigned"    },
  CHECKED_IN:    { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-400", label: "Checked In"  },
  CHECKED_OUT:   { bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-400",   label: "Checked Out" },
  NO_SHOW:       { bg: "bg-rose-50",    text: "text-rose-700",    dot: "bg-rose-400",    label: "No Show"     },
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface VolunteerRow {
  rawId: number;
  id: string;
  name: string;
  dept: string;
  shift: string;
  status: string;
  contact: string;
  checkInTime?: string;
  checkOutTime?: string;
}

type Modal =
  | { type: "assign" }
  | { type: "edit"; volunteer: VolunteerRow }
  | { type: "delete"; volunteer: VolunteerRow }
  | null;

// ── Mock seed data ────────────────────────────────────────────────────────────

let _mockSeq = 8;

const MOCK_VOLUNTEERS: VolunteerRow[] = [
  { rawId: 1, id: "V-001", name: "Rahul Nair",     dept: "Food & Kitchen", shift: "Morning (6AM–2PM)",   status: "Checked In",  contact: "+91 98001 11111", checkInTime: "06:05 AM" },
  { rawId: 2, id: "V-002", name: "Meera Pillai",   dept: "Registration",   shift: "Morning (6AM–2PM)",   status: "Checked In",  contact: "+91 98002 22222", checkInTime: "08:02 AM" },
  { rawId: 3, id: "V-003", name: "Suresh Babu",    dept: "Security",       shift: "Full Day",            status: "Checked In",  contact: "+91 98003 33333", checkInTime: "06:58 AM" },
  { rawId: 4, id: "V-004", name: "Kavitha Rao",    dept: "Venue & Decor",  shift: "Evening (2PM–10PM)",  status: "Checked Out", contact: "+91 98004 44444", checkInTime: "02:01 PM", checkOutTime: "05:45 PM" },
  { rawId: 5, id: "V-005", name: "Ajay Mathur",    dept: "Parking",        shift: "Morning (6AM–2PM)",   status: "Checked In",  contact: "+91 98005 55555", checkInTime: "06:55 AM" },
  { rawId: 6, id: "V-006", name: "Divya Menon",    dept: "Audio/Visual",   shift: "Full Day",            status: "No Show",     contact: "+91 98006 66666" },
  { rawId: 7, id: "V-007", name: "Sanjay Gupta",   dept: "Guest Mgmt",     shift: "Evening (2PM–10PM)",  status: "Assigned",    contact: "+91 98007 77777" },
];

function mapLive(data: EventVolunteerResponse[]): VolunteerRow[] {
  return data.map(v => ({
    rawId: v.id,
    id: `V-${String(v.id).padStart(3, "0")}`,
    name: v.userName || `User #${v.userId}`,
    dept: v.role ?? v.zone ?? "General",
    shift: v.shift ?? "—",
    status: v.status,
    contact: "",
    checkInTime:  v.checkInTime  ? new Date(v.checkInTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : undefined,
    checkOutTime: v.checkOutTime ? new Date(v.checkOutTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : undefined,
  }));
}

// ── Assign / Edit dialog ──────────────────────────────────────────────────────

interface VolForm { name: string; userId: string; dept: string; shift: string; zone: string }
const EMPTY_FORM: VolForm = { name: "", userId: "", dept: "", shift: "", zone: "" };

interface AssignDialogProps {
  mode: "assign" | "edit";
  initial?: VolunteerRow;
  useMock: boolean;
  onClose: () => void;
  onSaved: (row: VolunteerRow) => void;
}

function AssignDialog({ mode, initial, useMock, onClose, onSaved }: AssignDialogProps) {
  const [form, setForm] = useState<VolForm>(
    initial
      ? { name: initial.name, userId: String(initial.rawId), dept: initial.dept, shift: initial.shift, zone: "" }
      : EMPTY_FORM
  );
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const set = (k: keyof VolForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setErr("Volunteer name is required."); return; }
    if (!form.dept)         { setErr("Please select a department."); return; }
    if (!form.shift)        { setErr("Please select a shift."); return; }
    setSaving(true);
    setErr("");
    try {
      if (useMock) {
        await new Promise(r => setTimeout(r, 450));
        const id = initial?.rawId ?? _mockSeq++;
        onSaved({
          rawId: id,
          id: initial?.id ?? `V-${String(id).padStart(3, "0")}`,
          name: form.name.trim(),
          dept: form.dept,
          shift: form.shift,
          status: initial?.status ?? "Assigned",
          contact: "",
          checkInTime: initial?.checkInTime,
          checkOutTime: initial?.checkOutTime,
        });
      } else {
        const req: EventVolunteerRequest = {
          eventId: 0,
          userId: parseInt(form.userId) || 0,
          role: form.dept,
          shift: form.shift,
          zone: form.zone || undefined,
        };
        const res = mode === "edit" && initial
          ? await eventVolunteerService.update(initial.rawId, req)
          : await eventVolunteerService.create(req);
        onSaved({
          rawId: res.id,
          id: `V-${String(res.id).padStart(3, "0")}`,
          name: res.userName || form.name,
          dept: res.role ?? form.dept,
          shift: res.shift ?? form.shift,
          status: res.status,
          contact: "",
          checkInTime:  res.checkInTime  ? new Date(res.checkInTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : undefined,
          checkOutTime: res.checkOutTime ? new Date(res.checkOutTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : undefined,
        });
      }
    } catch (ex: unknown) {
      setErr((ex as Error).message ?? "Failed to save.");
      setSaving(false);
    }
  }

  const inp = "w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 bg-white text-slate-800 placeholder-slate-400";
  const lbl = "block text-xs font-semibold text-slate-600 mb-1";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-800 text-sm">
            {mode === "assign" ? "Assign Volunteer" : "Edit Volunteer"}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          {err && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {err}
            </div>
          )}

          <div>
            <label className={lbl}>Volunteer Name</label>
            <input className={inp} placeholder="e.g. Ravi Kumar" value={form.name} onChange={set("name")} />
          </div>

          {!useMock && (
            <div>
              <label className={lbl}>User ID</label>
              <input className={inp} type="number" placeholder="Enter system user ID" value={form.userId} onChange={set("userId")} />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Department / Role</label>
              <select className={inp} value={form.dept} onChange={set("dept")}>
                <option value="">Select department</option>
                {DEPARTMENTS.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Shift</label>
              <select className={inp} value={form.shift} onChange={set("shift")}>
                <option value="">Select shift</option>
                {SHIFTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className={lbl}>Zone <span className="font-normal text-slate-400">(optional)</span></label>
            <input className={inp} placeholder="e.g. Gate A, North Block" value={form.zone} onChange={set("zone")} />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit" disabled={saving}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {mode === "assign" ? "Assign" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Delete confirmation ───────────────────────────────────────────────────────

interface DeleteConfirmProps {
  volunteer: VolunteerRow;
  useMock: boolean;
  onClose: () => void;
  onDeleted: (id: number) => void;
}

function DeleteConfirm({ volunteer, useMock, onClose, onDeleted }: DeleteConfirmProps) {
  const [busy, setBusy] = useState(false);

  async function confirm() {
    setBusy(true);
    try {
      if (!useMock) await eventVolunteerService.deleteVolunteer(volunteer.rawId);
      else await new Promise(r => setTimeout(r, 400));
      onDeleted(volunteer.rawId);
    } catch {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center flex-shrink-0">
            <Trash2 className="w-5 h-5 text-rose-500" />
          </div>
          <div>
            <p className="font-bold text-slate-800 text-sm">Remove Volunteer</p>
            <p className="text-xs text-slate-500 mt-1">
              This will unassign <span className="font-semibold">{volunteer.name}</span> from the event.
              This cannot be undone.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button onClick={confirm} disabled={busy}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-rose-500 text-white hover:bg-rose-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function EventsVolunteers() {
  const { useMock } = useEventMock();
  const [volunteers, setVolunteers] = useState<VolunteerRow[]>(useMock ? [...MOCK_VOLUNTEERS] : []);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [modal, setModal]           = useState<Modal>(null);
  const [search, setSearch]         = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [actioning, setActioning]   = useState<number | null>(null);

  useEffect(() => {
    if (useMock) { setVolunteers([...MOCK_VOLUNTEERS]); return; }
    setLoading(true);
    setError("");
    eventVolunteerService.getAll()
      .then(d => setVolunteers(mapLive(d)))
      .catch(e => setError(e.message ?? "Failed to load volunteers"))
      .finally(() => setLoading(false));
  }, [useMock]);

  // ── Check-in / out ──

  async function checkIn(v: VolunteerRow) {
    setActioning(v.rawId);
    try {
      const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      if (useMock) {
        await new Promise(r => setTimeout(r, 400));
        setVolunteers(p => p.map(x => x.rawId === v.rawId ? { ...x, status: "Checked In", checkInTime: now } : x));
      } else {
        const res = await eventVolunteerService.checkIn(v.rawId);
        setVolunteers(p => p.map(x => x.rawId === v.rawId ? {
          ...x,
          status: res.status,
          checkInTime: res.checkInTime ? new Date(res.checkInTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : now,
        } : x));
      }
    } catch (e: unknown) { setError((e as Error).message ?? "Check-in failed"); }
    finally { setActioning(null); }
  }

  async function checkOut(v: VolunteerRow) {
    setActioning(v.rawId);
    try {
      const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      if (useMock) {
        await new Promise(r => setTimeout(r, 400));
        setVolunteers(p => p.map(x => x.rawId === v.rawId ? { ...x, status: "Checked Out", checkOutTime: now } : x));
      } else {
        const res = await eventVolunteerService.checkOut(v.rawId);
        setVolunteers(p => p.map(x => x.rawId === v.rawId ? {
          ...x,
          status: res.status,
          checkOutTime: res.checkOutTime ? new Date(res.checkOutTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : now,
        } : x));
      }
    } catch (e: unknown) { setError((e as Error).message ?? "Check-out failed"); }
    finally { setActioning(null); }
  }

  // ── Dialog callbacks ──

  function onSaved(row: VolunteerRow) {
    setVolunteers(p => modal?.type === "edit" ? p.map(v => v.rawId === row.rawId ? row : v) : [...p, row]);
    setModal(null);
  }

  function onDeleted(id: number) {
    setVolunteers(p => p.filter(v => v.rawId !== id));
    setModal(null);
  }

  // ── Filtered list ──

  const normalized = (s: string) => STATUS_META[s]?.label ?? s;

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return volunteers.filter(v => {
      if (q && !v.name.toLowerCase().includes(q) && !v.dept.toLowerCase().includes(q)) return false;
      if (deptFilter !== "All" && v.dept !== deptFilter) return false;
      if (statusFilter !== "All" && normalized(v.status) !== statusFilter) return false;
      return true;
    });
  }, [volunteers, search, deptFilter, statusFilter]);

  const totalVols    = useMock ? DEPARTMENTS.reduce((a, d) => a + d.total, 0) : volunteers.length;
  const totalPresent = useMock ? DEPARTMENTS.reduce((a, d) => a + d.present, 0) : volunteers.filter(v => normalized(v.status) === "Checked In").length;

  return (
    <div className="space-y-3 sm:space-y-6">
      {/* ── Modals ── */}
      {modal?.type === "assign" && (
        <AssignDialog mode="assign" useMock={useMock} onClose={() => setModal(null)} onSaved={onSaved} />
      )}
      {modal?.type === "edit" && (
        <AssignDialog mode="edit" initial={modal.volunteer} useMock={useMock} onClose={() => setModal(null)} onSaved={onSaved} />
      )}
      {modal?.type === "delete" && (
        <DeleteConfirm volunteer={modal.volunteer} useMock={useMock} onClose={() => setModal(null)} onDeleted={onDeleted} />
      )}

      {/* ── Error banner ── */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          <button className="ml-auto text-rose-400 hover:text-rose-600" onClick={() => setError("")}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        {[
          { label: "Total Volunteers", value: totalVols, color: "#4f46e5" },
          { label: "Present Today",    value: totalPresent, color: "#10b981" },
          { label: "Departments",      value: useMock ? DEPARTMENTS.length : "—", color: "#6366f1" },
          { label: "Attendance Rate",  value: totalVols > 0 ? `${Math.round(totalPresent / totalVols * 100)}%` : "—", color: "#d97706" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-2.5 sm:p-5 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)] text-center">
            <p className="text-lg sm:text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-0.5 sm:mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Department grid (mock only) — cards are clickable to filter ── */}
      {useMock && (
        <div className="bg-white rounded-2xl p-3 sm:p-6 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between mb-3 sm:mb-5">
            <h2 className="font-bold text-slate-800 text-xs sm:text-base">Departments</h2>
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-sm">
              <Plus className="w-3.5 h-3.5" /> Add Department
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
            {DEPARTMENTS.map(dept => {
              const pct = Math.round((dept.present / dept.total) * 100);
              const active = deptFilter === dept.name;
              return (
                <div
                  key={dept.name}
                  onClick={() => setDeptFilter(active ? "All" : dept.name)}
                  className={`p-3 sm:p-4 rounded-xl border transition-all cursor-pointer ${
                    active
                      ? "border-indigo-300 bg-indigo-50 shadow-md"
                      : "border-slate-100 bg-slate-50/60 hover:bg-white hover:shadow-md"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center" style={{ background: `${dept.color}18` }}>
                      <Users className="w-4 h-4" style={{ color: dept.color }} />
                    </div>
                    <span className="text-xs font-black" style={{ color: dept.color }}>{pct}%</span>
                  </div>
                  <p className="font-bold text-slate-800 text-xs sm:text-sm">{dept.name}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Head: {dept.head}</p>
                  <div className="mt-3 space-y-1.5">
                    <div className="flex justify-between text-[10px] font-semibold">
                      <span className="text-slate-500">{dept.present} present</span>
                      <span className="text-slate-400">of {dept.total}</span>
                    </div>
                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ background: dept.color, width: `${pct}%` }} />
                    </div>
                  </div>
                  {active && <p className="text-[9px] font-bold text-indigo-500 mt-2">Filtering by this dept ×</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Volunteer table ── */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)] overflow-hidden">
        {/* Header + search bar */}
        <div className="px-3 sm:px-6 pt-3 sm:pt-5 pb-3 border-b border-slate-50 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-bold text-slate-800 text-xs sm:text-base">Volunteer Directory</h2>
            <button
              onClick={() => setModal({ type: "assign" })}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> Assign Volunteer
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative flex-1 min-w-[160px] max-w-sm">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <input
                className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 bg-white text-slate-800 placeholder-slate-400"
                placeholder="Search by name or department…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  onClick={() => setSearch("")}
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Status filter chips */}
            <div className="flex items-center gap-1 flex-wrap">
              {["All", "Checked In", "Checked Out", "Assigned", "No Show"].map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition-colors ${
                    statusFilter === s ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  {s}
                  {s !== "All" && (
                    <span className="ml-1 opacity-70">
                      ({volunteers.filter(v => normalized(v.status) === s).length})
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Active dept filter chip */}
            {deptFilter !== "All" && (
              <button
                onClick={() => setDeptFilter("All")}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-violet-100 text-violet-700 hover:bg-violet-200 transition-colors"
              >
                <Filter className="w-2.5 h-2.5" /> {deptFilter} <X className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
        </div>

        {/* Loading state */}
        {loading && <LoadingSpinner label="Loading volunteers…" className="py-10" />}

        {!loading && (
          <div className="overflow-x-auto">
            <Table className="text-xs sm:text-sm min-w-[700px]">
              <TableHeader>
                <TableRow className="bg-slate-50/80 border-b border-slate-100 hover:bg-slate-50/80">
                  {["ID", "Name", "Department", "Shift", "Status", "Check-in", "Actions"].map(h => (
                    <TableHead
                      key={h}
                      className={`px-3 sm:px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap h-auto ${
                        h === "ID" ? "hidden sm:table-cell" : ""
                      }`}
                    >
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-slate-50">
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-sm text-slate-400">
                      {search || deptFilter !== "All" || statusFilter !== "All"
                        ? "No volunteers match your filters."
                        : "No volunteers assigned yet. Click \"Assign Volunteer\" to add one."}
                    </TableCell>
                  </TableRow>
                )}

                {filtered.map(v => {
                  const ss = STATUS_META[v.status] ?? STATUS_META.Assigned;
                  const busy = actioning === v.rawId;
                  const canIn  = normalized(v.status) === "Assigned" || normalized(v.status) === "Checked Out";
                  const canOut = normalized(v.status) === "Checked In";

                  return (
                    <TableRow key={v.rawId} className="hover:bg-slate-50/60 transition-colors">
                      {/* ID */}
                      <TableCell className="px-3 sm:px-5 py-3 font-mono text-xs text-slate-400 hidden sm:table-cell">
                        {v.id}
                      </TableCell>

                      {/* Name */}
                      <TableCell className="px-3 sm:px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-600 to-violet-500 flex items-center justify-center text-white text-[10px] font-black flex-shrink-0">
                            {v.name?.[0] ?? "V"}
                          </div>
                          <span className="font-semibold text-slate-800 text-xs sm:text-sm">{v.name}</span>
                        </div>
                      </TableCell>

                      {/* Dept */}
                      <TableCell className="px-3 sm:px-5 py-3 text-slate-600 text-xs">{v.dept}</TableCell>

                      {/* Shift */}
                      <TableCell className="px-3 sm:px-5 py-3">
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <Clock className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate max-w-[90px] sm:max-w-none">{v.shift}</span>
                        </span>
                      </TableCell>

                      {/* Status badge */}
                      <TableCell className="px-3 sm:px-5 py-3">
                        <span className={`flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-full text-[10px] font-bold ${ss.bg} ${ss.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${ss.dot}`} />
                          {ss.label}
                        </span>
                      </TableCell>

                      {/* Check-in timestamp */}
                      <TableCell className="px-3 sm:px-5 py-3 text-xs text-slate-500 font-mono">
                        {v.checkInTime
                          ? <>{v.checkInTime}{v.checkOutTime ? <span className="text-slate-400"> → {v.checkOutTime}</span> : null}</>
                          : "—"}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="px-3 sm:px-5 py-3">
                        <div className="flex items-center gap-1">
                          {canIn && (
                            <button
                              onClick={() => checkIn(v)}
                              disabled={busy}
                              title="Check In"
                              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                            >
                              {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <LogIn className="w-3 h-3" />}
                              <span className="hidden sm:inline">In</span>
                            </button>
                          )}
                          {canOut && (
                            <button
                              onClick={() => checkOut(v)}
                              disabled={busy}
                              title="Check Out"
                              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors disabled:opacity-50"
                            >
                              {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <LogOut className="w-3 h-3" />}
                              <span className="hidden sm:inline">Out</span>
                            </button>
                          )}
                          <button
                            onClick={() => setModal({ type: "edit", volunteer: v })}
                            title="Edit"
                            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-indigo-600 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setModal({ type: "delete", volunteer: v })}
                            title="Remove volunteer"
                            className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
