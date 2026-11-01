import { useState, useEffect, useCallback } from "react";
import { Wrench, Plus, X, Loader2, ToggleLeft, ToggleRight, Clock, Activity, Play } from "lucide-react";
import {
  maintenanceScheduleService,
  type MaintenanceSchedule,
  type CreateMaintenanceScheduleRequest,
} from "../../../services/security/securityService";
import { getStoredUser } from "../../../services/common/apiClient";

function nextSevenAM(): string {
  const now = new Date();
  const next = new Date(now);
  next.setHours(7, 0, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  return next.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

export function MaintenanceScheduleAdmin() {
  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<CreateMaintenanceScheduleRequest>>({
    frequencyDays: 30,
    nextDueDate: new Date().toISOString().slice(0, 10),
  });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setSchedules(await maintenanceScheduleService.getSchedules()); } catch { setSchedules([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.title || !form.nextDueDate) return;
    setSaving(true);
    try {
      const user = getStoredUser() as { communityId?: number } | null;
      await maintenanceScheduleService.createSchedule({
        communityId: user?.communityId ?? 0,
        title: form.title,
        description: form.description,
        frequencyDays: form.frequencyDays ?? 30,
        nextDueDate: form.nextDueDate,
        assignedTo: form.assignedTo,
        categoryId: form.categoryId,
      });
      setForm({ frequencyDays: 30, nextDueDate: new Date().toISOString().slice(0, 10) });
      setShowForm(false);
      load();
    } catch { alert("Failed to create schedule."); }
    finally { setSaving(false); }
  };

  const toggle = async (id: number) => {
    try { await maintenanceScheduleService.toggleSchedule(id); load(); } catch { alert("Failed."); }
  };

  const activeSchedules = schedules.filter(s => s.isActive);
  const lastRun = schedules.reduce<string | null>((acc, s) => {
    if (!s.lastRunDate) return acc;
    if (!acc || s.lastRunDate > acc) return s.lastRunDate;
    return acc;
  }, null);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Scheduler Status Card */}
      {!loading && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-blue-900 text-sm">Daily Scheduler Status</h2>
            <span className="ml-auto text-xs text-blue-500 font-mono">runs daily at 07:00</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-3 border border-blue-100">
              <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Clock className="w-3 h-3" /> Last Run</p>
              <p className="text-sm font-semibold text-slate-800">{lastRun ? new Date(lastRun).toLocaleDateString("en-IN", { dateStyle: "medium" }) : "Never"}</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-blue-100">
              <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Play className="w-3 h-3" /> Next Run</p>
              <p className="text-sm font-semibold text-slate-800">{nextSevenAM()}</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-blue-100">
              <p className="text-xs text-slate-500 mb-1">Total Schedules</p>
              <p className="text-2xl font-bold text-slate-800">{schedules.length}</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-blue-100">
              <p className="text-xs text-slate-500 mb-1">Active</p>
              <p className="text-2xl font-bold text-emerald-600">{activeSchedules.length}</p>
            </div>
          </div>
          <p className="text-xs text-blue-600 mt-3">
            The scheduler auto-generates helpdesk tickets for all active schedules each morning. Pause a schedule to skip ticket generation.
          </p>
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Wrench className="w-6 h-6 text-blue-600" /> Maintenance Schedules
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage recurring maintenance tasks for the community</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" /> New Schedule
        </button>
      </div>

      {showForm && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">New Maintenance Schedule</h3>
            <button onClick={() => setShowForm(false)} className="p-1 rounded hover:bg-slate-200">
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
              <input value={form.title ?? ""} onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Water Tank Cleaning, Elevator Maintenance"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2} placeholder="Details about this maintenance task"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Frequency (days) *</label>
              <input type="number" min={1} value={form.frequencyDays ?? 30}
                onChange={(e) => setForm({ ...form, frequencyDays: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Next Due Date *</label>
              <input type="date" value={form.nextDueDate ?? ""}
                onChange={(e) => setForm({ ...form, nextDueDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Assigned To</label>
              <input value={form.assignedTo ?? ""} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
                placeholder="e.g. Maintenance Team, Vendor Name"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-slate-200 text-slate-700 text-sm rounded-lg hover:bg-slate-50">Cancel</button>
            <button onClick={save} disabled={saving || !form.title}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin inline" /> : "Create Schedule"}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
      ) : schedules.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Wrench className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No maintenance schedules yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {schedules.map((s) => (
            <div key={s.id} className={`bg-white border rounded-xl p-4 flex items-start justify-between gap-4 ${
              s.isActive ? "border-slate-200" : "border-slate-100 opacity-60"
            }`}>
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-slate-900">{s.title}</span>
                  {s.categoryName && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">{s.categoryName}</span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${
                    s.isActive ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-slate-50 border-slate-200 text-slate-500"
                  }`}>{s.isActive ? "Active" : "Paused"}</span>
                </div>
                {s.description && <p className="text-sm text-slate-600">{s.description}</p>}
                <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                  <span>Every {s.frequencyDays} days</span>
                  <span>Next due: <strong className="text-slate-700">{s.nextDueDate}</strong></span>
                  {s.assignedTo && <span>Assigned: {s.assignedTo}</span>}
                  {s.lastRunDate && <span>Last run: {s.lastRunDate}</span>}
                </div>
              </div>
              <button onClick={() => toggle(s.id)} className="p-2 rounded hover:bg-slate-100" title={s.isActive ? "Pause" : "Activate"}>
                {s.isActive
                  ? <ToggleRight className="w-5 h-5 text-emerald-600" />
                  : <ToggleLeft className="w-5 h-5 text-slate-400" />
                }
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
