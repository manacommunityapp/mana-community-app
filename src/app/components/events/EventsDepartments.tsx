import { useState, useEffect } from "react";
import { Building2, Plus, Pencil, Trash2, Loader2, X, Users, Target } from "lucide-react";
import { ErrorBanner, LoadingSpinner } from "./shared";
import {
  eventDepartmentService,
  type EventDepartmentResponse,
  type EventDepartmentRequest,
} from "../../../services/events/eventDepartmentService";
import { eventService, type EventResponse } from "../../../services/events/eventService";

const DEPARTMENT_COLORS = [
  "#6366f1", "#10b981", "#f59e0b", "#ef4444", "#3b82f6",
  "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#84cc16",
];

const emptyForm = (eventId?: number): EventDepartmentRequest => ({
  eventId,
  name: "",
  headName: "",
  totalTarget: 0,
  presentCount: 0,
  color: DEPARTMENT_COLORS[0],
  description: "",
});

interface DeleteConfirm { id: number; name: string }

export function EventsDepartments() {
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [departments, setDepartments] = useState<EventDepartmentResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<EventDepartmentRequest>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirm | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    eventService.getAll()
      .then(evts => {
        setEvents(evts);
        if (evts.length > 0) setSelectedEventId(evts[0].id);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedEventId) return;
    load();
  }, [selectedEventId]);

  const load = async () => {
    if (!selectedEventId) return;
    setLoading(true);
    setError("");
    try {
      const data = await eventDepartmentService.getAll(undefined, selectedEventId);
      setDepartments(data);
    } catch (e: any) {
      setError(e?.message || "Failed to load departments");
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm(selectedEventId ?? undefined));
    setShowForm(true);
  };

  const openEdit = (dept: EventDepartmentResponse) => {
    setEditingId(dept.id);
    setForm({
      eventId: dept.eventId ?? selectedEventId ?? undefined,
      name: dept.name,
      headName: dept.headName ?? "",
      totalTarget: dept.totalTarget,
      presentCount: dept.presentCount,
      color: dept.color,
      description: dept.description ?? "",
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (editingId !== null) {
        await eventDepartmentService.update(editingId, form);
      } else {
        await eventDepartmentService.create({ ...form, eventId: selectedEventId ?? undefined });
      }
      setShowForm(false);
      await load();
    } catch (err: any) {
      setError(err?.message || "Failed to save department");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await eventDepartmentService.deleteDepartment(deleteConfirm.id);
      setDeleteConfirm(null);
      await load();
    } catch (err: any) {
      setError(err?.message || "Failed to delete department");
    } finally {
      setDeleting(false);
    }
  };

  const totalTarget = departments.reduce((a, d) => a + d.totalTarget, 0);
  const totalPresent = departments.reduce((a, d) => a + d.presentCount, 0);

  return (
    <div className="space-y-4 sm:space-y-6">
      {error && <ErrorBanner message={error} />}

      {/* Header controls */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={selectedEventId ?? ""}
          onChange={e => setSelectedEventId(Number(e.target.value))}
          className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          {events.length === 0 && <option value="">Loading events…</option>}
          {events.map(ev => (
            <option key={ev.id} value={ev.id}>{ev.title}</option>
          ))}
        </select>

        <button
          onClick={openCreate}
          className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" /> Add Department
        </button>
      </div>

      {/* KPIs */}
      {departments.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          {[
            { label: "Departments", value: departments.length, color: "#4f46e5" },
            { label: "Total Target",value: totalTarget,        color: "#6366f1" },
            { label: "Present",     value: totalPresent,       color: "#10b981" },
          ].map((k, i) => (
            <div
              key={k.label}
              className={`animate-fade-in-up stagger-${i + 1} bg-white rounded-2xl p-3 sm:p-5 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)] text-center`}
            >
              <p className="text-xl sm:text-2xl font-black" style={{ color: k.color }}>{k.value}</p>
              <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-1">{k.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="flex items-center justify-between px-4 sm:px-6 pt-4 pb-3 border-b border-slate-50">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-500" />
              {editingId ? "Edit Department" : "New Department"}
            </h2>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-600">Department Name *</span>
                <input
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Registration Team"
                  className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-600">Head / Coordinator</span>
                <input
                  value={form.headName || ""}
                  onChange={e => setForm(f => ({ ...f, headName: e.target.value }))}
                  placeholder="e.g. Ramesh Kumar"
                  className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-600">Target Volunteers</span>
                <input
                  type="number"
                  min="0"
                  value={form.totalTarget}
                  onChange={e => setForm(f => ({ ...f, totalTarget: Number(e.target.value) }))}
                  className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-600">Present Count</span>
                <input
                  type="number"
                  min="0"
                  value={form.presentCount}
                  onChange={e => setForm(f => ({ ...f, presentCount: Number(e.target.value) }))}
                  className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </label>
            </div>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-slate-600">Description</span>
              <textarea
                rows={2}
                value={form.description || ""}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Brief description of this department's responsibilities"
                className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
              />
            </label>

            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-slate-600">Color</span>
              <div className="flex flex-wrap gap-2">
                {DEPARTMENT_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, color: c }))}
                    className={`w-7 h-7 rounded-full border-2 transition-transform ${form.color === c ? "border-slate-800 scale-110" : "border-transparent"}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingId ? "Save Changes" : "Create Department"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Departments list */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-6 pt-4 pb-3 border-b border-slate-50">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-500" /> Departments
          </h2>
        </div>

        {loading && <LoadingSpinner label="Loading departments…" />}

        {!loading && departments.length === 0 && (
          <div className="px-6 py-12 text-center">
            <Building2 className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-400">No departments yet</p>
            <p className="text-xs text-slate-400 mt-1">Add departments to organise your event teams</p>
          </div>
        )}

        {departments.length > 0 && (
          <div className="divide-y divide-slate-50">
            {departments.map((dept, i) => {
              const pct = dept.totalTarget > 0 ? Math.round((dept.presentCount / dept.totalTarget) * 100) : 0;
              return (
                <div key={dept.id} className={`animate-fade-in-up stagger-${Math.min(i + 1, 8)} flex items-center gap-3 px-4 sm:px-6 py-3 sm:py-4`}>
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: dept.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2">
                      <span className="font-semibold text-sm text-slate-800">{dept.name}</span>
                      {dept.headName && (
                        <span className="text-xs text-slate-400">{dept.headName}</span>
                      )}
                    </div>
                    {dept.description && (
                      <p className="text-xs text-slate-400 mt-0.5 truncate">{dept.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Users className="w-3 h-3" /> {dept.presentCount} / {dept.totalTarget}
                      </div>
                      <div className="flex-1 max-w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${pct}%`, backgroundColor: dept.color }}
                          className="h-full rounded-full transition-[width] duration-700"
                        />
                      </div>
                      <span className="text-xs font-semibold" style={{ color: dept.color }}>{pct}%</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => openEdit(dept)}
                      className="p-1.5 rounded-lg text-indigo-500 hover:bg-indigo-50 transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm({ id: dept.id, name: dept.name })}
                      className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-50 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-slate-800 mb-2">Delete Department?</h3>
            <p className="text-sm text-slate-500 mb-4">
              Are you sure you want to delete <strong>{deleteConfirm.name}</strong>? This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50 transition-colors"
              >
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
