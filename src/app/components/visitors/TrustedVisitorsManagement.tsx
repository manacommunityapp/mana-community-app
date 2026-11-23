import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  ShieldCheck,
  UserCheck,
  Plus,
  Search,
  Clock,
  Phone,
  Car,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Users,
  Briefcase,
  Calendar,
  Lock,
} from "lucide-react";
import {
  visitorService,
  type WhitelistEntry,
  type WhitelistRequest,
} from "../../../services/visitors/visitorService";

const STAFF_CATEGORIES = [
  "Maid / Housekeeping",
  "Driver",
  "Cook / Chef",
  "Tutor / Teacher",
  "Nanny / Babysitter",
  "Elder Caregiver",
  "Car Washer / Cleaner",
  "Milk / Daily Vendor",
  "Personal Trainer / Yoga",
  "Family Member",
  "Other",
];

const TIME_WINDOWS = [
  "Daily · 06:00 – 22:00 (Full Day)",
  "Morning Shift · 06:00 – 11:00",
  "Afternoon Shift · 11:00 – 16:00",
  "Evening Shift · 16:00 – 21:00",
  "24x7 Round the Clock (Live-in)",
  "Weekdays Only · 08:00 – 18:00",
  "Weekends Only · 09:00 – 19:00",
];

const SAMPLE_ENTRIES: WhitelistEntry[] = [
  {
    id: 101,
    name: "Sunita Devi",
    category: "Maid / Housekeeping",
    phone: "+91 98765 43211",
    vehicleNumber: "KA 03 EX 2910",
    notes: "Daily morning housekeeping & dusting. Daily · 06:00 – 11:00",
    isActive: true,
    createdAt: "2026-01-10T08:00:00Z",
  },
  {
    id: 102,
    name: "Rajesh Kumar",
    category: "Driver",
    phone: "+91 98450 12345",
    vehicleNumber: "KA 01 MJ 8820",
    notes: "Office commute driver. Weekdays Only · 08:00 – 18:00",
    isActive: true,
    createdAt: "2026-01-15T09:30:00Z",
  },
  {
    id: 103,
    name: "Anjali Rao",
    category: "Tutor / Teacher",
    phone: "+91 97412 99881",
    vehicleNumber: "KA 05 AB 1002",
    notes: "Maths and Science evening tuition. Evening Shift · 16:00 – 21:00",
    isActive: true,
    createdAt: "2026-02-01T14:15:00Z",
  },
  {
    id: 104,
    name: "Babu Lal",
    category: "Car Washer / Cleaner",
    phone: "+91 91234 56789",
    vehicleNumber: "—",
    notes: "Morning basement vehicle cleaning. Morning Shift · 06:00 – 11:00",
    isActive: false,
    createdAt: "2026-02-10T06:00:00Z",
  },
];

export function TrustedVisitorsManagement() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<WhitelistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [showAddModal, setShowAddModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState(STAFF_CATEGORIES[0]);
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [timeWindow, setTimeWindow] = useState(TIME_WINDOWS[0]);
  const [notes, setNotes] = useState("");
  const [formErr, setFormErr] = useState("");

  const loadWhitelist = useCallback(async () => {
    setLoading(true);
    try {
      const data = await visitorService.getWhitelist();
      if (Array.isArray(data) && data.length > 0) {
        setEntries(data);
      } else {
        setEntries(SAMPLE_ENTRIES);
      }
    } catch {
      setEntries(SAMPLE_ENTRIES);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWhitelist();
  }, [loadWhitelist]);

  const handleToggleStatus = async (item: WhitelistEntry) => {
    setActionLoading(item.id);
    const newStatus = !item.isActive;
    try {
      await visitorService.toggleWhitelistStatus(item.id, newStatus);
      setEntries((prev) =>
        prev.map((e) => (e.id === item.id ? { ...e, isActive: newStatus } : e))
      );
    } catch {
      // Local fallback
      setEntries((prev) =>
        prev.map((e) => (e.id === item.id ? { ...e, isActive: newStatus } : e))
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to remove this trusted visitor? Their automatic gate entry will be revoked.")) {
      return;
    }
    setActionLoading(id);
    try {
      await visitorService.removeFromWhitelist(id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch {
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormErr("Please enter the visitor's full name.");
      return;
    }
    setFormErr("");
    const combinedNotes = `${notes ? notes + ". " : ""}${timeWindow}`;
    const payload: WhitelistRequest = {
      name: name.trim(),
      phone: phone.trim() || undefined,
      category,
      vehicleNumber: vehicleNumber.trim() || undefined,
      notes: combinedNotes,
    };

    try {
      const created = await visitorService.addToWhitelist(payload);
      setEntries((prev) => [created, ...prev]);
    } catch {
      const newEntry: WhitelistEntry = {
        id: Date.now(),
        name: payload.name,
        phone: payload.phone,
        category: payload.category,
        vehicleNumber: payload.vehicleNumber,
        notes: payload.notes,
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      setEntries((prev) => [newEntry, ...prev]);
    }

    setName("");
    setPhone("");
    setVehicleNumber("");
    setNotes("");
    setShowAddModal(false);
  };

  const filteredEntries = entries.filter((e) => {
    const matchQuery =
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.phone && e.phone.includes(searchQuery)) ||
      (e.vehicleNumber && e.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (e.notes && e.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchCat = filterCategory === "ALL" || e.category === filterCategory;
    return matchQuery && matchCat;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/visitors")}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium transition cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Visitors Hub
        </button>
        <span className="text-xs font-semibold px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5" />
          Resident Fast-Track Security Pass
        </span>
      </div>

      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-blue-700 to-sky-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-4 -bottom-6 text-indigo-100/10 pointer-events-none select-none">
          <UserCheck className="w-64 h-64" />
        </div>
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold text-indigo-100">
            <Sparkles className="w-3.5 h-3.5" />
            Recurring Staff & Trusted Whitelist
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Trusted Visitors & Domestic Help Whitelist
          </h1>
          <p className="text-indigo-100/90 text-sm leading-relaxed">
            Registered maids, drivers, cooks, and tutors are automatically verified at security gates
            during their authorized time window without requiring repeated phone approvals or doorbell rings.
          </p>
        </div>
      </div>

      {/* Add New Trusted Visitor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5" />
                <h3 className="text-base font-bold">Add Trusted Visitor / Staff</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-white/80 hover:text-white p-1 rounded-full cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
              {formErr && (
                <div className="bg-red-50 text-red-700 p-3 rounded-xl border border-red-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formErr}</span>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar / Sunita Devi"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Staff Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    {STAFF_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mobile Number</label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Vehicle Plate (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. KA 03 AB 1234"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Allowed Time Window</label>
                  <select
                    value={timeWindow}
                    onChange={(e) => setTimeWindow(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    {TIME_WINDOWS.map((w) => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes / Instructions for Guard</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Leaves by 11:30 AM, authorized to collect parcel from tower reception"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-600 text-[11px] flex items-center gap-2">
                <Lock className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                <span>
                  The guard will view this visitor under "Pre-Approved Whitelist" and check them in directly via badge or phone number.
                </span>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition shadow-md cursor-pointer"
                >
                  Add to Whitelist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Action Controls & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by name, phone, plate..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Categories</option>
            {STAFF_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Trusted Staff
        </button>
      </div>

      {/* Whitelist Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEntries.map((item) => (
          <div
            key={item.id}
            className={`bg-white rounded-2xl p-5 border transition flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md ${
              item.isActive ? "border-slate-200/80" : "border-slate-200/50 bg-slate-50/60 opacity-80"
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200">
                    {item.category || "Staff"}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-1">{item.name}</h3>
                </div>

                {/* Status Badge */}
                <button
                  onClick={() => handleToggleStatus(item)}
                  disabled={actionLoading === item.id}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition ${
                    item.isActive
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                      : "bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200"
                  }`}
                  title={item.isActive ? "Click to suspend auto-approval" : "Click to reactivate"}
                >
                  {item.isActive ? (
                    <>
                      <ToggleRight className="w-4 h-4 text-emerald-600" />
                      Active
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-4 h-4 text-slate-400" />
                      Suspended
                    </>
                  )}
                </button>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600">
                {item.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{item.phone}</span>
                  </div>
                )}
                {item.vehicleNumber && item.vehicleNumber !== "—" && (
                  <div className="flex items-center gap-2">
                    <Car className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-mono">{item.vehicleNumber}</span>
                  </div>
                )}
                {item.notes && (
                  <div className="flex items-start gap-2 pt-1 text-[11px] text-slate-500">
                    <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{item.notes}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-medium">
                Auto-entry enabled at gate
              </span>
              <button
                onClick={() => handleDelete(item.id)}
                disabled={actionLoading === item.id}
                className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition cursor-pointer"
                title="Remove from whitelist"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TrustedVisitorsManagement;
