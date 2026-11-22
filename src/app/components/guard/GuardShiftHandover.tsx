import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  ShieldAlert,
  ShieldCheck,
  Clock,
  Calendar,
  AlertTriangle,
  Car,
  User,
  Wrench,
  CheckCircle2,
  Plus,
  ArrowLeft,
  Sparkles,
  ChevronDown,
  ChevronUp,
  FileText,
  UserCheck,
  Search,
} from "lucide-react";
import {
  shiftHandoverService,
  type ShiftHandover,
  type ShiftType,
  type HandoverItem,
  type CreateHandoverRequest,
} from "../../../services/guard/shiftHandoverService";

const SHIFT_META: Record<ShiftType, { label: string; color: string; bg: string; time: string }> = {
  MORNING: { label: "Morning Shift", color: "text-amber-800", bg: "bg-amber-50 border-amber-200", time: "06:00 – 14:00" },
  AFTERNOON: { label: "Afternoon Shift", color: "text-blue-800", bg: "bg-blue-50 border-blue-200", time: "14:00 – 22:00" },
  NIGHT: { label: "Night Shift", color: "text-purple-800", bg: "bg-purple-50 border-purple-200", time: "22:00 – 06:00" },
};

const CATEGORY_ICONS: Record<string, any> = {
  VISITOR: User,
  VEHICLE: Car,
  INCIDENT: AlertTriangle,
  MAINTENANCE: Wrench,
  OTHER: FileText,
};

export function GuardShiftHandover() {
  const navigate = useNavigate();
  const [handovers, setHandovers] = useState<ShiftHandover[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"today" | "history">("today");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Form State
  const [newShift, setNewShift] = useState<ShiftType>("AFTERNOON");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<Omit<HandoverItem, "id">[]>([
    { category: "VISITOR", description: "", resolvedBefore: false, priority: "MEDIUM" },
  ]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data =
        activeTab === "today"
          ? await shiftHandoverService.getTodayHandovers()
          : await shiftHandoverService.getHandoverHistory(20);
      setHandovers(data);
    } catch {
      setHandovers([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAcknowledge = async (id: number) => {
    setActionLoading(id);
    try {
      await shiftHandoverService.acknowledgeHandover(id, "Incoming Guard Supervisor");
      loadData();
    } catch (err: any) {
      alert(err?.message || "Failed to acknowledge handover");
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddItemRow = () => {
    setItems((prev) => [
      ...prev,
      { category: "OTHER", description: "", resolvedBefore: false, priority: "MEDIUM" },
    ]);
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    setItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, [field]: value } : it))
    );
  };

  const handleRemoveItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = items.filter((it) => it.description.trim());
    if (validItems.length === 0) {
      alert("Please enter at least one handover observation or item.");
      return;
    }

    try {
      await shiftHandoverService.createHandover({
        shiftType: newShift,
        items: validItems,
        notes: notes.trim() || undefined,
      });
      setShowCreateModal(false);
      setNotes("");
      setItems([{ category: "VISITOR", description: "", resolvedBefore: false, priority: "MEDIUM" }]);
      loadData();
    } catch (err: any) {
      alert(err?.message || "Could not log shift handover");
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/visitors?portal=guard")}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium transition cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Guard Portal
        </button>
        <span className="text-xs font-semibold px-3 py-1 bg-amber-50 text-amber-800 rounded-full border border-amber-200 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5" />
          Security Shift Handover Console
        </span>
      </div>

      {/* Hero Header */}
      <div className="bg-gradient-to-r from-amber-700 via-yellow-700 to-orange-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-4 -bottom-6 text-amber-100/10 pointer-events-none select-none">
          <ShieldAlert className="w-64 h-64" />
        </div>
        <div className="relative z-10 max-w-xl space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Guard Shift Handover & Log
          </h1>
          <p className="text-amber-100/90 text-sm leading-relaxed">
            Record and acknowledge security briefings between outgoing and incoming guards to ensure
            unresolved incidents, unreturned visitor badges, and campus alerts are safely transferred.
          </p>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" />
                <h3 className="text-base font-bold">Log Shift Change Briefing</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-white/80 hover:text-white p-1 rounded-full cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Outgoing Shift</label>
                  <select
                    value={newShift}
                    onChange={(e) => setNewShift(e.target.value as ShiftType)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                  >
                    <option value="MORNING">Morning (06:00 – 14:00)</option>
                    <option value="AFTERNOON">Afternoon (14:00 – 22:00)</option>
                    <option value="NIGHT">Night (22:00 – 06:00)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">General Shift Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. All gates operational, key set complete"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-slate-700">Open Observation Items & Alerts</label>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-amber-700 hover:text-amber-800 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Item
                  </button>
                </div>

                {items.map((it, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 space-y-2"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <select
                        value={it.category}
                        onChange={(e) => handleItemChange(idx, "category", e.target.value)}
                        className="px-2.5 py-1.5 border border-slate-200 rounded-xl bg-white"
                      >
                        <option value="VISITOR">Visitor Issue</option>
                        <option value="VEHICLE">Vehicle Alert</option>
                        <option value="INCIDENT">Incident / Dispute</option>
                        <option value="MAINTENANCE">Maintenance / Light</option>
                        <option value="OTHER">Other Note</option>
                      </select>

                      <select
                        value={it.priority}
                        onChange={(e) => handleItemChange(idx, "priority", e.target.value)}
                        className="px-2.5 py-1.5 border border-slate-200 rounded-xl bg-white font-semibold"
                      >
                        <option value="LOW">Low Priority</option>
                        <option value="MEDIUM">Medium Priority</option>
                        <option value="HIGH">High Alert</option>
                      </select>

                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-1.5 text-slate-600">
                          <input
                            type="checkbox"
                            checked={it.resolvedBefore}
                            onChange={(e) => handleItemChange(idx, "resolvedBefore", e.target.checked)}
                          />
                          <span>Resolved</span>
                        </label>
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItemRow(idx)}
                            className="text-slate-400 hover:text-red-600 font-bold px-2 py-0.5 cursor-pointer"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>

                    <input
                      type="text"
                      required
                      placeholder="Describe observation (e.g. Cab left in visitor slot B-21 overnight)"
                      value={it.description}
                      onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold transition shadow-md cursor-pointer"
                >
                  Save Shift Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabs & Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl w-fit border border-slate-200">
          <button
            onClick={() => setActiveTab("today")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
              activeTab === "today"
                ? "bg-white text-amber-800 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Today's Handover Logs ({handovers.length})
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
              activeTab === "history"
                ? "bg-white text-amber-800 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Shift History (Past Records)
          </button>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Log Shift Handover
        </button>
      </div>

      {/* Handovers List */}
      <div className="space-y-4">
        {handovers.map((h) => {
          const meta = SHIFT_META[h.shiftType] || SHIFT_META.MORNING;
          const isPending = h.status === "PENDING";
          const isExpanded = expandedId === h.id || isPending;

          return (
            <div
              key={h.id}
              className={`bg-white rounded-3xl p-6 border transition space-y-4 shadow-sm hover:shadow-md ${
                isPending ? "border-amber-300 ring-2 ring-amber-100" : "border-slate-200/80"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className={`px-3 py-1 rounded-xl text-xs font-extrabold border ${meta.bg} ${meta.color}`}>
                    {meta.label} ({meta.time})
                  </div>
                  <span className="text-xs text-slate-500 font-semibold">{h.date}</span>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${
                      isPending
                        ? "bg-amber-100 text-amber-900 border border-amber-300 animate-pulse"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    }`}
                  >
                    {isPending ? "Pending Acknowledgement" : "Acknowledged & Transferred"}
                  </span>

                  <button
                    onClick={() => setExpandedId(expandedId === h.id ? null : h.id)}
                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Guard Names */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[11px]">Outgoing Guard</span>
                  <span className="font-bold text-slate-800">{h.outgoingGuardName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Incoming Guard Supervisor</span>
                  <span className="font-bold text-slate-800">
                    {h.incomingGuardName || (isPending ? "Awaiting Next Shift Guard Sign-in" : "—")}
                  </span>
                </div>
              </div>

              {/* Observation items */}
              {isExpanded && (
                <div className="space-y-2 pt-1">
                  <span className="text-xs font-bold text-slate-800 block">
                    Observations & Open Items ({h.items.length})
                  </span>
                  <div className="space-y-2">
                    {h.items.map((item) => {
                      const Icon = CATEGORY_ICONS[item.category] || FileText;
                      return (
                        <div
                          key={item.id}
                          className="flex items-start justify-between gap-3 p-3 rounded-2xl bg-white border border-slate-200/70 text-xs"
                        >
                          <div className="flex items-start gap-2.5">
                            <div className="p-1.5 rounded-xl bg-slate-100 text-slate-600 mt-0.5">
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <div className="font-semibold text-slate-800">{item.description}</div>
                              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                                {item.category}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                item.priority === "HIGH"
                                  ? "bg-red-50 text-red-700 border border-red-200"
                                  : item.priority === "MEDIUM"
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              }`}
                            >
                              {item.priority}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                item.resolvedBefore
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {item.resolvedBefore ? "Resolved" : "Open"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Notes */}
              {h.notes && (
                <div className="text-xs text-slate-600 bg-amber-50/50 p-3 rounded-xl border border-amber-100 italic">
                  "{h.notes}"
                </div>
              )}

              {/* Acknowledge Button */}
              {isPending && (
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => handleAcknowledge(h.id)}
                    disabled={actionLoading === h.id}
                    className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <UserCheck className="w-4 h-4" />
                    {actionLoading === h.id ? "Acknowledging..." : "Acknowledge & Accept Shift"}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default GuardShiftHandover;
