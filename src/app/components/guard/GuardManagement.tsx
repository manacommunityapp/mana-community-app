import {
  Shield, Plus, X, Loader2, Trash2, Edit3, Search, Clock,
  UserCheck, LogIn, LogOut, Calendar, Phone, BadgeCheck
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import {
  guardService,
  type GuardProfileResponse,
  type GuardProfileRequest,
  type GuardShiftResponse,
  type GuardShiftRequest,
} from "../../../services/guard/guardService";

type TabKey = "guards" | "shifts";

const guardStatusColors: Record<string, { label: string; bg: string; text: string }> = {
  ACTIVE: { label: "Active", bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700" },
  INACTIVE: { label: "Inactive", bg: "bg-slate-50 border-slate-200", text: "text-slate-500" },
  ON_LEAVE: { label: "On Leave", bg: "bg-amber-50 border-amber-200", text: "text-amber-700" },
  TERMINATED: { label: "Terminated", bg: "bg-red-50 border-red-200", text: "text-red-700" },
};

const shiftStatusColors: Record<string, { label: string; bg: string; text: string }> = {
  SCHEDULED: { label: "Scheduled", bg: "bg-blue-50 border-blue-200", text: "text-blue-700" },
  IN_PROGRESS: { label: "In Progress", bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700" },
  COMPLETED: { label: "Completed", bg: "bg-slate-50 border-slate-200", text: "text-slate-500" },
  MISSED: { label: "Missed", bg: "bg-red-50 border-red-200", text: "text-red-700" },
  CANCELLED: { label: "Cancelled", bg: "bg-amber-50 border-amber-200", text: "text-amber-700" },
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function GuardManagement() {
  const [tab, setTab] = useState<TabKey>("guards");
  const [guards, setGuards] = useState<GuardProfileResponse[]>([]);
  const [shifts, setShifts] = useState<GuardShiftResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [shiftDate, setShiftDate] = useState(todayStr());

  const [showGuardModal, setShowGuardModal] = useState(false);
  const [editingGuard, setEditingGuard] = useState<GuardProfileResponse | null>(null);
  const [guardForm, setGuardForm] = useState<GuardProfileRequest>({ fullName: "" });

  const [showShiftModal, setShowShiftModal] = useState(false);
  const [editingShift, setEditingShift] = useState<GuardShiftResponse | null>(null);
  const [shiftForm, setShiftForm] = useState<GuardShiftRequest>({
    guardId: 0, shiftDate: todayStr(), startTime: "08:00", endTime: "20:00",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [guardsData, shiftsData] = await Promise.all([
        guardService.getGuards().catch(() => []),
        guardService.getShifts(shiftDate).catch(() => []),
      ]);
      setGuards(guardsData);
      setShifts(shiftsData);
    } catch {
      setError("Failed to load guard data");
    } finally {
      setLoading(false);
    }
  }, [shiftDate]);

  useEffect(() => { loadData(); }, [loadData]);

  const activeGuards = guards.filter((g) => g.status === "ACTIVE");

  const openGuardModal = (guard?: GuardProfileResponse) => {
    if (guard) {
      setEditingGuard(guard);
      setGuardForm({
        fullName: guard.fullName,
        phone: guard.phone || "",
        employeeId: guard.employeeId || "",
        assignedGate: guard.assignedGate || "",
        userId: guard.userId,
        notes: guard.notes || "",
      });
    } else {
      setEditingGuard(null);
      setGuardForm({ fullName: "", phone: "", employeeId: "", assignedGate: "", notes: "" });
    }
    setShowGuardModal(true);
  };

  const saveGuard = async () => {
    setSaving(true);
    setError(null);
    try {
      if (editingGuard) {
        await guardService.updateGuard(editingGuard.id, guardForm);
      } else {
        await guardService.createGuard(guardForm);
      }
      setShowGuardModal(false);
      await loadData();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to save guard");
    } finally {
      setSaving(false);
    }
  };

  const deleteGuard = async (id: number) => {
    if (!confirm("Delete this guard profile? Associated shifts will also be removed.")) return;
    try {
      await guardService.deleteGuard(id);
      await loadData();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to delete guard");
    }
  };

  const toggleGuardStatus = async (guard: GuardProfileResponse) => {
    const newStatus = guard.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await guardService.updateGuardStatus(guard.id, newStatus);
      await loadData();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to update status");
    }
  };

  const openShiftModal = (shift?: GuardShiftResponse) => {
    if (shift) {
      setEditingShift(shift);
      setShiftForm({
        guardId: shift.guardId,
        shiftDate: shift.shiftDate,
        startTime: shift.startTime,
        endTime: shift.endTime,
        gate: shift.gate || "",
        notes: shift.notes || "",
      });
    } else {
      setEditingShift(null);
      setShiftForm({
        guardId: activeGuards[0]?.id || 0,
        shiftDate: shiftDate,
        startTime: "08:00",
        endTime: "20:00",
        gate: "",
        notes: "",
      });
    }
    setShowShiftModal(true);
  };

  const saveShift = async () => {
    setSaving(true);
    setError(null);
    try {
      if (editingShift) {
        await guardService.updateShift(editingShift.id, shiftForm);
      } else {
        await guardService.createShift(shiftForm);
      }
      setShowShiftModal(false);
      await loadData();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to save shift");
    } finally {
      setSaving(false);
    }
  };

  const checkInShift = async (id: number) => {
    try {
      await guardService.checkInShift(id);
      await loadData();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to check in");
    }
  };

  const checkOutShift = async (id: number) => {
    try {
      await guardService.checkOutShift(id);
      await loadData();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to check out");
    }
  };

  const deleteShift = async (id: number) => {
    if (!confirm("Delete this shift?")) return;
    try {
      await guardService.deleteShift(id);
      await loadData();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to delete shift");
    }
  };

  const filteredGuards = guards.filter((g) =>
    !search || g.fullName.toLowerCase().includes(search.toLowerCase()) ||
    (g.employeeId || "").toLowerCase().includes(search.toLowerCase()) ||
    (g.assignedGate || "").toLowerCase().includes(search.toLowerCase()) ||
    (g.phone || "").includes(search)
  );

  const filteredShifts = shifts.filter((s) =>
    !search || s.guardName.toLowerCase().includes(search.toLowerCase()) ||
    (s.gate || "").toLowerCase().includes(search.toLowerCase())
  );

  const tabs: { key: TabKey; label: string; icon: React.ReactNode; count: number }[] = [
    { key: "guards", label: "Guard Profiles", icon: <Shield className="w-4 h-4" />, count: guards.length },
    { key: "shifts", label: "Shift Schedule", icon: <Calendar className="w-4 h-4" />, count: shifts.length },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-7 h-7 text-blue-600" />
            Guard Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {guards.length} guards · {activeGuards.length} active · {shifts.length} shifts today
          </p>
        </div>
        <div className="flex gap-2">
          {tab === "guards" && (
            <button
              onClick={() => openGuardModal()}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Guard
            </button>
          )}
          {tab === "shifts" && (
            <button
              onClick={() => openShiftModal()}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Shift
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center justify-between">
          {error}
          <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setSearch(""); }}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md transition-colors flex-1 justify-center ${
              tab === t.key
                ? "bg-white text-blue-700 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.icon} {t.label}
            <span className="ml-1 text-xs bg-slate-200 px-1.5 py-0.5 rounded-full">{t.count}</span>
          </button>
        ))}
      </div>

      {/* Search + Date filter for shifts */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tab === "guards" ? "Search by name, employee ID, gate..." : "Search by guard name, gate..."}
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        {tab === "shifts" && (
          <input
            type="date"
            value={shiftDate}
            onChange={(e) => setShiftDate(e.target.value)}
            className="px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        )}
      </div>

      {/* Guards Tab */}
      {tab === "guards" && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Employee ID</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Phone</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Assigned Gate</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Linked User</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredGuards.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    {search ? "No guards match your search" : "No guards registered yet"}
                  </td>
                </tr>
              ) : (
                filteredGuards.map((guard) => {
                  const gs = guardStatusColors[guard.status] || guardStatusColors.ACTIVE;
                  return (
                    <tr key={guard.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-900">{guard.fullName}</td>
                      <td className="px-4 py-3 text-slate-600 font-mono text-xs">{guard.employeeId || "—"}</td>
                      <td className="px-4 py-3 text-slate-600">{guard.phone || "—"}</td>
                      <td className="px-4 py-3 text-slate-600">{guard.assignedGate || "—"}</td>
                      <td className="px-4 py-3 text-slate-600">{guard.userName || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded border ${gs.bg} ${gs.text}`}>
                          {gs.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openGuardModal(guard)} className="p-1.5 rounded hover:bg-slate-100" title="Edit">
                            <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                          </button>
                          <button onClick={() => toggleGuardStatus(guard)} className="p-1.5 rounded hover:bg-slate-100" title="Toggle status">
                            <UserCheck className="w-3.5 h-3.5 text-blue-500" />
                          </button>
                          <button onClick={() => deleteGuard(guard.id)} className="p-1.5 rounded hover:bg-red-50" title="Delete">
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Shifts Tab */}
      {tab === "shifts" && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Guard</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Time</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Gate</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Check In</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Check Out</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredShifts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    {search ? "No shifts match your search" : "No shifts scheduled for this date"}
                  </td>
                </tr>
              ) : (
                filteredShifts.map((shift) => {
                  const ss = shiftStatusColors[shift.status] || shiftStatusColors.SCHEDULED;
                  return (
                    <tr key={shift.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-900">{shift.guardName}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {shift.startTime.slice(0, 5)} – {shift.endTime.slice(0, 5)}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{shift.gate || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded border ${ss.bg} ${ss.text}`}>
                          {ss.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-xs">
                        {shift.checkInTime ? new Date(shift.checkInTime).toLocaleTimeString() : "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-xs">
                        {shift.checkOutTime ? new Date(shift.checkOutTime).toLocaleTimeString() : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {shift.status === "SCHEDULED" && (
                            <button onClick={() => checkInShift(shift.id)} className="p-1.5 rounded hover:bg-emerald-50" title="Check In">
                              <LogIn className="w-3.5 h-3.5 text-emerald-600" />
                            </button>
                          )}
                          {shift.status === "IN_PROGRESS" && (
                            <button onClick={() => checkOutShift(shift.id)} className="p-1.5 rounded hover:bg-blue-50" title="Check Out">
                              <LogOut className="w-3.5 h-3.5 text-blue-600" />
                            </button>
                          )}
                          <button onClick={() => openShiftModal(shift)} className="p-1.5 rounded hover:bg-slate-100" title="Edit">
                            <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                          </button>
                          <button onClick={() => deleteShift(shift.id)} className="p-1.5 rounded hover:bg-red-50" title="Delete">
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Guard Modal */}
      {showGuardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                {editingGuard ? "Edit Guard" : "Add Guard"}
              </h2>
              <button onClick={() => setShowGuardModal(false)} className="p-1 rounded hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                <input
                  value={guardForm.fullName}
                  onChange={(e) => setGuardForm({ ...guardForm, fullName: e.target.value })}
                  placeholder="e.g. Rajesh Kumar"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                  <input
                    value={guardForm.phone || ""}
                    onChange={(e) => setGuardForm({ ...guardForm, phone: e.target.value })}
                    placeholder="e.g. 9876543210"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Employee ID</label>
                  <input
                    value={guardForm.employeeId || ""}
                    onChange={(e) => setGuardForm({ ...guardForm, employeeId: e.target.value })}
                    placeholder="e.g. G-001"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Assigned Gate</label>
                <input
                  value={guardForm.assignedGate || ""}
                  onChange={(e) => setGuardForm({ ...guardForm, assignedGate: e.target.value })}
                  placeholder="e.g. Main Gate, Gate A"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea
                  value={guardForm.notes || ""}
                  onChange={(e) => setGuardForm({ ...guardForm, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowGuardModal(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={saveGuard}
                disabled={saving || !guardForm.fullName.trim()}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {editingGuard ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shift Modal */}
      {showShiftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                {editingShift ? "Edit Shift" : "Add Shift"}
              </h2>
              <button onClick={() => setShowShiftModal(false)} className="p-1 rounded hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Guard *</label>
                <select
                  value={shiftForm.guardId}
                  onChange={(e) => setShiftForm({ ...shiftForm, guardId: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={0} disabled>Select a guard</option>
                  {activeGuards.map((g) => (
                    <option key={g.id} value={g.id}>{g.fullName} {g.employeeId ? `(${g.employeeId})` : ""}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date *</label>
                <input
                  type="date"
                  value={shiftForm.shiftDate}
                  onChange={(e) => setShiftForm({ ...shiftForm, shiftDate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Start Time *</label>
                  <input
                    type="time"
                    value={shiftForm.startTime}
                    onChange={(e) => setShiftForm({ ...shiftForm, startTime: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">End Time *</label>
                  <input
                    type="time"
                    value={shiftForm.endTime}
                    onChange={(e) => setShiftForm({ ...shiftForm, endTime: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Gate</label>
                <input
                  value={shiftForm.gate || ""}
                  onChange={(e) => setShiftForm({ ...shiftForm, gate: e.target.value })}
                  placeholder="e.g. Main Gate"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea
                  value={shiftForm.notes || ""}
                  onChange={(e) => setShiftForm({ ...shiftForm, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowShiftModal(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={saveShift}
                disabled={saving || !shiftForm.guardId || !shiftForm.shiftDate}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {editingShift ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
