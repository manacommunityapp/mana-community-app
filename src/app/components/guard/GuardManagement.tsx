import {
  Shield, Plus, X, Loader2, Trash2, Edit3, Search, Clock,
  UserCheck, LogIn, LogOut, Calendar, Phone, BadgeCheck,
  AlertTriangle, BookOpen, ClipboardCheck, MapPin, Route, CheckSquare
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import {
  guardService,
  type GuardProfileResponse,
  type GuardProfileRequest,
  type GuardShiftResponse,
  type GuardShiftRequest,
} from "../../../services/guard/guardService";
import { guardSosService, guardDiaryService, guardHandoverService, guardPatrolService, type GuardSosAlert, type GuardDiaryEntry, type GuardHandoverRecord, type CreateHandoverRequest, type PatrolSession, type PatrolCheckpoint } from "../../../services/security/securityService";
import { getStoredUser } from "../../../services/common/apiClient";

type TabKey = "guards" | "shifts" | "sos" | "diary" | "handover" | "patrol";

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
    { key: "sos", label: "SOS Alerts", icon: <AlertTriangle className="w-4 h-4" />, count: 0 },
    { key: "diary", label: "Daily Log", icon: <BookOpen className="w-4 h-4" />, count: 0 },
    { key: "handover", label: "Shift Handover", icon: <ClipboardCheck className="w-4 h-4" />, count: 0 },
    { key: "patrol", label: "Patrol", icon: <Route className="w-4 h-4" />, count: 0 },
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

      {/* SOS Alerts Tab */}
      {tab === "sos" && <GuardSosTab />}

      {/* Daily Log Tab */}
      {tab === "diary" && <GuardDiaryTab />}

      {/* Shift Handover Tab */}
      {tab === "handover" && <GuardHandoverTab guards={activeGuards} />}

      {/* Patrol Tab */}
      {tab === "patrol" && <GuardPatrolTab guards={activeGuards} />}

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

// ── SOS Alerts ────────────────────────────────────────────────────────────────

function GuardSosTab() {
  const [alerts, setAlerts] = useState<GuardSosAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { setAlerts(await guardSosService.getActiveAlerts()); } catch { setAlerts([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const acknowledge = async (id: number) => {
    try { await guardSosService.acknowledgeAlert(id); load(); } catch { alert("Failed to acknowledge."); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-900">Active SOS Alerts</h3>
        <button onClick={load} className="text-sm text-blue-600 hover:underline">Refresh</button>
      </div>
      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <AlertTriangle className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>No active SOS alerts</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((a) => (
            <div key={a.id} className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span className="font-semibold text-red-800">{a.guardName ?? "Unknown Guard"}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">{a.status}</span>
                </div>
                {a.location && <p className="text-sm text-red-700">📍 {a.location}</p>}
                {a.description && <p className="text-sm text-slate-700">{a.description}</p>}
                <p className="text-xs text-slate-500">{new Date(a.createdAt).toLocaleString()}</p>
              </div>
              {a.status === "ACTIVE" && (
                <button
                  onClick={() => acknowledge(a.id)}
                  className="shrink-0 px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                >
                  Acknowledge
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Daily Log ─────────────────────────────────────────────────────────────────

function GuardDiaryTab() {
  const [entries, setEntries] = useState<GuardDiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category: "", description: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setEntries(await guardDiaryService.getEntries(date)); } catch { setEntries([]); }
    finally { setLoading(false); }
  }, [date]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.description.trim()) return;
    setSaving(true);
    try {
      const user = getStoredUser() as { communityId?: number } | null;
      await guardDiaryService.addEntry({
        communityId: user?.communityId ?? 0,
        entryDate: date,
        category: form.category || undefined,
        description: form.description,
      });
      setForm({ category: "", description: "" });
      setShowForm(false);
      load();
    } catch { alert("Failed to save entry."); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="font-semibold text-slate-900">Daily Log</h3>
        <div className="flex items-center gap-2">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
            <Plus className="w-4 h-4" /> Add Entry
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="e.g. Incident, Routine, Visitor"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description *</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3} placeholder="Describe the event or observation..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-slate-200 text-slate-700 text-sm rounded-lg hover:bg-slate-50">Cancel</button>
            <button onClick={save} disabled={saving || !form.description.trim()}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardCheck className="w-4 h-4" />} Save
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
      ) : entries.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>No entries for this date</p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((e) => (
            <div key={e.id} className="bg-white border border-slate-200 rounded-xl p-4 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-slate-900">{e.guardName ?? "Guard"}</span>
                {e.category && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">{e.category}</span>
                )}
                <span className="text-xs text-slate-400 ml-auto">{new Date(e.createdAt).toLocaleTimeString()}</span>
              </div>
              <p className="text-sm text-slate-700">{e.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
// ── Patrol Tracking ───────────────────────────────────────────────────────────

interface GuardPatrolTabProps {
  guards: { id: number; fullName: string }[];
}

function GuardPatrolTab({ guards }: GuardPatrolTabProps) {
  const [patrols, setPatrols] = useState<PatrolSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [showForm, setShowForm] = useState(false);
  const [detail, setDetail] = useState<PatrolSession | null>(null);
  const [checkpointPatrol, setCheckpointPatrol] = useState<PatrolSession | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ routeName: "", guardId: "" });
  const [cpForm, setCpForm] = useState({ checkpointName: "", notes: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try { setPatrols(await guardPatrolService.getPatrols(date)); } catch { setPatrols([]); }
    finally { setLoading(false); }
  }, [date]);

  useEffect(() => { load(); }, [load]);

  const startPatrol = async () => {
    if (!form.routeName.trim()) return;
    setSaving(true);
    try {
      const user = getStoredUser() as { communityId?: number } | null;
      await guardPatrolService.startPatrol({
        communityId: user?.communityId ?? 0,
        routeName: form.routeName,
        startTime: new Date().toISOString(),
        guardId: form.guardId ? Number(form.guardId) : undefined,
      });
      setShowForm(false);
      setForm({ routeName: "", guardId: "" });
      load();
    } catch { alert("Failed to start patrol."); }
    finally { setSaving(false); }
  };

  const logCheckpoint = async () => {
    if (!checkpointPatrol || !cpForm.checkpointName.trim()) return;
    setSaving(true);
    try {
      await guardPatrolService.logCheckpoint(checkpointPatrol.id, {
        checkpointName: cpForm.checkpointName,
        notes: cpForm.notes || undefined,
      });
      setCpForm({ checkpointName: "", notes: "" });
      setCheckpointPatrol(null);
      load();
    } catch { alert("Failed to log checkpoint."); }
    finally { setSaving(false); }
  };

  const completePatrol = async (id: number) => {
    if (!confirm("Mark this patrol as complete?")) return;
    try {
      await guardPatrolService.completePatrol(id, { endTime: new Date().toISOString() });
      load();
    } catch { alert("Failed to complete patrol."); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="font-semibold text-slate-900">Patrol Sessions</h3>
        <div className="flex items-center gap-2">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
            <Plus className="w-4 h-4" /> Start Patrol
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <h4 className="font-semibold text-slate-800 text-sm">Start New Patrol</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Route Name *</label>
              <input value={form.routeName} onChange={e => setForm(f => ({ ...f, routeName: e.target.value }))}
                placeholder="e.g. North Wing, Perimeter Round"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Guard</label>
              <select value={form.guardId} onChange={e => setForm(f => ({ ...f, guardId: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">— Select guard (optional) —</option>
                {guards.map(g => <option key={g.id} value={g.id}>{g.fullName}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-slate-200 text-slate-700 text-sm rounded-lg hover:bg-slate-50">Cancel</button>
            <button onClick={startPatrol} disabled={saving || !form.routeName.trim()}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />} Start
            </button>
          </div>
        </div>
      )}

      {checkpointPatrol && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setCheckpointPatrol(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-5 space-y-3" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Log Checkpoint</h3>
              <button onClick={() => setCheckpointPatrol(null)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <p className="text-xs text-slate-500">Patrol: {checkpointPatrol.routeName}</p>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Checkpoint Name *</label>
              <input value={cpForm.checkpointName} onChange={e => setCpForm(f => ({ ...f, checkpointName: e.target.value }))}
                placeholder="e.g. Gate A, Building 3 Lobby"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
              <input value={cpForm.notes} onChange={e => setCpForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Observations at this checkpoint"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setCheckpointPatrol(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 text-sm rounded-lg hover:bg-slate-50">Cancel</button>
              <button onClick={logCheckpoint} disabled={saving || !cpForm.checkpointName.trim()}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckSquare className="w-4 h-4" />} Log
              </button>
            </div>
          </div>
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setDetail(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-5 space-y-3 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Patrol Detail</h3>
              <button onClick={() => setDetail(null)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <div className="text-sm space-y-1">
              <p className="font-medium text-slate-800">{detail.routeName}</p>
              {detail.guardName && <p className="text-slate-600">Guard: {detail.guardName}</p>}
              <p className="text-slate-500 text-xs">
                {new Date(detail.startTime).toLocaleTimeString()} – {detail.endTime ? new Date(detail.endTime).toLocaleTimeString() : "In Progress"}
              </p>
              {detail.summary && <p className="text-slate-600 bg-slate-50 rounded-lg p-2 text-xs mt-2">{detail.summary}</p>}
            </div>
            {detail.checkpoints && detail.checkpoints.length > 0 ? (
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2">Checkpoints ({detail.checkpoints.length})</p>
                <div className="space-y-2">
                  {detail.checkpoints.map((cp, i) => (
                    <div key={cp.id || i} className="flex items-start gap-3">
                      <div className="flex flex-col items-center mt-1">
                        <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                        {i < detail.checkpoints.length - 1 && <div className="w-0.5 h-full bg-blue-200 mt-1" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-800">{cp.checkpointName}</p>
                        {cp.notes && <p className="text-xs text-slate-500">{cp.notes}</p>}
                        <p className="text-xs text-slate-400">{new Date(cp.loggedAt).toLocaleTimeString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-4">No checkpoints logged yet</p>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
      ) : patrols.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Route className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>No patrol sessions for this date</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Route</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Guard</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Start</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">End</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Checkpoints</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {patrols.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-900">{p.routeName}</td>
                  <td className="px-4 py-3 text-slate-600">{p.guardName || "—"}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{new Date(p.startTime).toLocaleTimeString()}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{p.endTime ? new Date(p.endTime).toLocaleTimeString() : "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{p.checkpoints?.length ?? 0}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded border ${
                      p.status === "IN_PROGRESS"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-slate-50 text-slate-600 border-slate-200"
                    }`}>{p.status === "IN_PROGRESS" ? "In Progress" : p.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setDetail(p)}
                        className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        View
                      </button>
                      {p.status === "IN_PROGRESS" && (
                        <>
                          <button onClick={() => setCheckpointPatrol(p)}
                            className="px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                            Checkpoint
                          </button>
                          <button onClick={() => completePatrol(p.id)}
                            className="px-2 py-1 text-xs text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                            Complete
                          </button>
                        </>
                      )}
                    </div>
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

// ── Shift Handover ────────────────────────────────────────────────────────────

interface GuardHandoverTabProps {
  guards: { id: number; fullName: string }[];
}

function GuardHandoverTab({ guards }: GuardHandoverTabProps) {
  const [records, setRecords] = useState<GuardHandoverRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [showForm, setShowForm] = useState(false);
  const [detail, setDetail] = useState<GuardHandoverRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<CreateHandoverRequest>>({
    shiftType: "MORNING",
    handoverNotes: "",
    incidentSummary: "",
    pendingTasks: [],
  });
  const [taskInput, setTaskInput] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try { setRecords(await guardHandoverService.getHandovers(date)); } catch { setRecords([]); }
    finally { setLoading(false); }
  }, [date]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      const user = getStoredUser() as { communityId?: number } | null;
      await guardHandoverService.createHandover({
        communityId: user?.communityId ?? 0,
        date,
        shiftType: form.shiftType || "MORNING",
        handoverNotes: form.handoverNotes || undefined,
        incidentSummary: form.incidentSummary || undefined,
        pendingTasks: form.pendingTasks?.filter(Boolean),
        nextGuardId: form.nextGuardId,
      });
      setShowForm(false);
      setForm({ shiftType: "MORNING", handoverNotes: "", incidentSummary: "", pendingTasks: [] });
      setTaskInput("");
      load();
    } catch { alert("Failed to save handover."); }
    finally { setSaving(false); }
  };

  const addTask = () => {
    if (!taskInput.trim()) return;
    setForm(f => ({ ...f, pendingTasks: [...(f.pendingTasks || []), taskInput.trim()] }));
    setTaskInput("");
  };

  const removeTask = (idx: number) => {
    setForm(f => ({ ...f, pendingTasks: (f.pendingTasks || []).filter((_, i) => i !== idx) }));
  };

  const shiftColors: Record<string, string> = {
    MORNING: "bg-amber-50 text-amber-700 border-amber-200",
    EVENING: "bg-orange-50 text-orange-700 border-orange-200",
    NIGHT: "bg-indigo-50 text-indigo-700 border-indigo-200",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="font-semibold text-slate-900">Shift Handover Records</h3>
        <div className="flex items-center gap-2">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
            <Plus className="w-4 h-4" /> Create Handover
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <h4 className="font-semibold text-slate-800 text-sm">New Shift Handover</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Shift Type *</label>
              <select value={form.shiftType} onChange={e => setForm(f => ({ ...f, shiftType: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="MORNING">Morning</option>
                <option value="EVENING">Evening</option>
                <option value="NIGHT">Night</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Incoming Guard</label>
              <select value={form.nextGuardId ?? ""} onChange={e => setForm(f => ({ ...f, nextGuardId: e.target.value ? Number(e.target.value) : undefined }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">— Select incoming guard —</option>
                {guards.map(g => <option key={g.id} value={g.id}>{g.fullName}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Handover Notes</label>
            <textarea value={form.handoverNotes} onChange={e => setForm(f => ({ ...f, handoverNotes: e.target.value }))}
              rows={2} placeholder="Key observations, gate status, visitor activity..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Incident Summary</label>
            <textarea value={form.incidentSummary} onChange={e => setForm(f => ({ ...f, incidentSummary: e.target.value }))}
              rows={2} placeholder="Any incidents during the shift..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Pending Tasks</label>
            <div className="flex gap-2 mb-2">
              <input value={taskInput} onChange={e => setTaskInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTask())}
                placeholder="Add a task and press Enter"
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <button onClick={addTask} className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm rounded-lg">Add</button>
            </div>
            {(form.pendingTasks || []).length > 0 && (
              <ul className="space-y-1">
                {(form.pendingTasks || []).map((t, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-1.5">
                    <span className="flex-1">{t}</span>
                    <button onClick={() => removeTask(i)} className="text-red-400 hover:text-red-600"><X className="w-3.5 h-3.5" /></button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-slate-200 text-slate-700 text-sm rounded-lg hover:bg-slate-50">Cancel</button>
            <button onClick={save} disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardCheck className="w-4 h-4" />} Submit Handover
            </button>
          </div>
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setDetail(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-5 space-y-3" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Handover Detail</h3>
              <button onClick={() => setDetail(null)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded border ${shiftColors[detail.shiftType] || "bg-slate-50 text-slate-700 border-slate-200"}`}>{detail.shiftType}</span>
                <span className="text-slate-500">{new Date(detail.createdAt).toLocaleString()}</span>
              </div>
              {detail.guardName && <p className="text-slate-700"><span className="font-medium">Outgoing:</span> {detail.guardName}</p>}
              {detail.nextGuardName && <p className="text-slate-700"><span className="font-medium">Incoming:</span> {detail.nextGuardName}</p>}
              {detail.handoverNotes && (
                <div>
                  <p className="font-medium text-slate-700 mb-1">Notes:</p>
                  <p className="text-slate-600 bg-slate-50 rounded-lg p-2 text-xs">{detail.handoverNotes}</p>
                </div>
              )}
              {detail.incidentSummary && (
                <div>
                  <p className="font-medium text-slate-700 mb-1">Incidents:</p>
                  <p className="text-slate-600 bg-red-50 rounded-lg p-2 text-xs border border-red-100">{detail.incidentSummary}</p>
                </div>
              )}
              {detail.pendingTasks && detail.pendingTasks.length > 0 && (
                <div>
                  <p className="font-medium text-slate-700 mb-1">Pending Tasks:</p>
                  <ul className="space-y-1">
                    {detail.pendingTasks.map((t, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-slate-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
      ) : records.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <ClipboardCheck className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>No handover records for this date</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Shift</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Outgoing Guard</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Incoming Guard</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Time</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded border ${shiftColors[r.shiftType] || "bg-slate-50 text-slate-700 border-slate-200"}`}>
                      {r.shiftType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{r.guardName || "—"}</td>
                  <td className="px-4 py-3 text-slate-700">{r.nextGuardName || "—"}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{new Date(r.createdAt).toLocaleTimeString()}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded border ${r.status === "COMPLETED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-600 border-slate-200"}`}>
                      {r.status || "PENDING"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setDetail(r)}
                      className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      View
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
