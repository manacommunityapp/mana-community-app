import { useState } from "react";
import { Plus, Users, CalendarDays, PlayCircle, CheckCheck, XCircle } from "lucide-react";
import type { KarateBatch, KarateBatchRequest, KarateProgram, BatchStatus } from "../../../../services/sports/karateService";

interface Props {
  batches: KarateBatch[];
  programs: KarateProgram[];
  venues: { id: number; name: string }[];
  onCreateBatch: (data: KarateBatchRequest) => Promise<void>;
  onStatusChange: (id: number, status: BatchStatus) => Promise<void>;
  onSelectBatch: (batch: KarateBatch) => void;
}

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

const STATUS_BADGE: Record<BatchStatus, { label: string; cls: string }> = {
  UPCOMING:  { label: "Upcoming",  cls: "bg-blue-100 text-blue-700" },
  ACTIVE:    { label: "Active",    cls: "bg-emerald-100 text-emerald-700" },
  COMPLETED: { label: "Completed", cls: "bg-slate-100 text-slate-600" },
  CANCELLED: { label: "Cancelled", cls: "bg-red-100 text-red-600" },
};

const EMPTY: KarateBatchRequest = {
  programId: 0, name: "", startDate: "", endDate: "",
  daysOfWeek: "MON,WED,FRI", classStartTime: "17:00", classEndTime: "18:00",
  attendanceThreshold: 75, autoGenerateClasses: true,
};

export function KarateBatchesTab({ batches, programs, venues, onCreateBatch, onStatusChange, onSelectBatch }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<KarateBatchRequest>({ ...EMPTY });
  const [selectedDays, setSelectedDays] = useState<Set<string>>(new Set(["MON", "WED", "FRI"]));
  const [saving, setSaving] = useState(false);

  function toggleDay(d: string) {
    setSelectedDays(prev => {
      const next = new Set(prev);
      next.has(d) ? next.delete(d) : next.add(d);
      return next;
    });
  }

  async function handleSave() {
    const daysStr = DAYS.filter(d => selectedDays.has(d)).join(",");
    setSaving(true);
    try {
      await onCreateBatch({ ...form, daysOfWeek: daysStr });
      setShowForm(false);
      setForm({ ...EMPTY });
      setSelectedDays(new Set(["MON", "WED", "FRI"]));
    } finally {
      setSaving(false);
    }
  }

  function nextStatus(current: BatchStatus): BatchStatus | null {
    if (current === "UPCOMING") return "ACTIVE";
    if (current === "ACTIVE") return "COMPLETED";
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Batches ({batches.length})</h3>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white rounded-lg"
          style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)" }}
        >
          <Plus className="w-3.5 h-3.5" /> New Batch
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {batches.map(batch => {
          const badge = STATUS_BADGE[batch.status];
          const next = nextStatus(batch.status);
          return (
            <div
              key={batch.id}
              className="rounded-xl border border-slate-100 bg-white p-4 space-y-3 hover:shadow-sm transition-shadow cursor-pointer"
              onClick={() => onSelectBatch(batch)}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{batch.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{batch.programName}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${badge.cls}`}>{badge.label}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {batch.daysOfWeek.split(",").map(d => (
                  <span key={d} className="px-1.5 py-0.5 text-xs rounded bg-indigo-50 text-indigo-700 font-medium">{d}</span>
                ))}
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{batch.activeEnrollments} enrolled</span>
                <span className="flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" />{batch.startDate}</span>
              </div>
              {next && (
                <button
                  onClick={e => { e.stopPropagation(); onStatusChange(batch.id, next); }}
                  className="w-full text-xs py-1.5 rounded-lg border border-indigo-200 text-indigo-700 hover:bg-indigo-50 transition-colors flex items-center justify-center gap-1"
                >
                  {next === "ACTIVE" ? <PlayCircle className="w-3.5 h-3.5" /> : <CheckCheck className="w-3.5 h-3.5" />}
                  Mark {next === "ACTIVE" ? "Active" : "Completed"}
                </button>
              )}
            </div>
          );
        })}
        {batches.length === 0 && (
          <div className="col-span-3 py-10 text-center text-slate-400 text-sm">No batches yet — create one to get started</div>
        )}
      </div>

      {showForm && (
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 space-y-3">
          <h4 className="text-sm font-semibold text-indigo-800">New Batch</h4>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Program</label>
              <select className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400" value={form.programId} onChange={e => setForm(f => ({ ...f, programId: +e.target.value }))}>
                <option value={0}>Select program…</option>
                {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="col-span-2 sm:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Batch Name</label>
              <input className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Beginner Batch – July 2025" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Start Date</label>
              <input type="date" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">End Date</label>
              <input type="date" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Venue</label>
              <select className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400" value={form.venueId ?? ""} onChange={e => setForm(f => ({ ...f, venueId: e.target.value ? +e.target.value : undefined }))}>
                <option value="">No venue</option>
                {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Class Start</label>
              <input type="time" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400" value={form.classStartTime} onChange={e => setForm(f => ({ ...f, classStartTime: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Class End</label>
              <input type="time" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400" value={form.classEndTime} onChange={e => setForm(f => ({ ...f, classEndTime: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Attendance Threshold %</label>
              <input type="number" min={0} max={100} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400" value={form.attendanceThreshold ?? 75} onChange={e => setForm(f => ({ ...f, attendanceThreshold: +e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">Class Days</label>
            <div className="flex gap-2 flex-wrap">
              {DAYS.map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDay(d)}
                  className={`px-3 py-1.5 text-xs rounded-lg font-medium border transition-colors ${selectedDays.has(d) ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"}`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="autoGen" checked={!!form.autoGenerateClasses} onChange={e => setForm(f => ({ ...f, autoGenerateClasses: e.target.checked }))} className="w-4 h-4 accent-indigo-600" />
            <label htmlFor="autoGen" className="text-sm text-slate-700 cursor-pointer">Auto-generate class sessions when batch goes Active</label>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-xs text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
            <button onClick={handleSave} disabled={saving || !form.name || !form.programId || !form.startDate || !form.endDate} className="px-4 py-2 text-xs font-medium text-white rounded-lg disabled:opacity-50" style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)" }}>
              {saving ? "Creating…" : "Create Batch"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
