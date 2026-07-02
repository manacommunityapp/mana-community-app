import React, { useState, useEffect } from "react";
import { CalendarDays, Plus, Check, X, ShieldAlert, FileText, IndianRupee, Calendar, User, Search, CheckCircle2, ChevronRight, AlertCircle, Wrench, Clock, PenTool } from "lucide-react";
import { toast, Toaster } from "sonner";
import { maintenanceService, type MaintenanceRecord } from "../../../services/maintenanceService";
import { assetService, type Asset } from "../../../services/assetService";

const MAINTENANCE_TYPES = [
  { value: "PREVENTIVE", label: "Preventive Maintenance" },
  { value: "REPAIR", label: "Repair Work" },
  { value: "INSPECTION", label: "Safety & Audit Inspection" }
];

const STATUS_CONFIG = {
  SCHEDULED: { label: "Scheduled", bg: "bg-slate-100 border-slate-200 text-slate-500" },
  IN_PROGRESS: { label: "In Progress", bg: "bg-amber-50 border-amber-200 text-amber-600" },
  COMPLETED: { label: "Completed", bg: "bg-emerald-50 border-emerald-200 text-emerald-600" },
  CANCELLED: { label: "Cancelled", bg: "bg-red-50 border-red-200 text-red-600" }
};

export function MaintenanceDashboard() {
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"schedule" | "orders">("schedule");
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Search and filter
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Form State
  const [form, setForm] = useState({
    assetId: "",
    maintenanceDate: new Date().toISOString().split("T")[0],
    type: "PREVENTIVE" as const,
    description: "",
    cost: "",
    performedBy: "",
    status: "SCHEDULED" as const
  });

  const fetchRecords = async () => {
    try {
      const data = await maintenanceService.getMaintenanceRecords();
      setRecords(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load maintenance records");
    }
  };

  const fetchAssets = async () => {
    try {
      const data = await assetService.getAssets();
      setAssets(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load assets");
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchRecords(), fetchAssets()]).finally(() => setLoading(false));
  }, []);

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.assetId) {
      toast.error("Please select an asset");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        maintenanceDate: form.maintenanceDate,
        type: form.type,
        description: form.description,
        cost: form.cost ? parseFloat(form.cost) : 0,
        performedBy: form.performedBy,
        status: form.status
      };

      await maintenanceService.createMaintenanceRecord(form.assetId, payload);
      toast.success("Maintenance work order created successfully");
      setShowScheduleModal(false);
      // Reset form
      setForm({
        assetId: "",
        maintenanceDate: new Date().toISOString().split("T")[0],
        type: "PREVENTIVE",
        description: "",
        cost: "",
        performedBy: "",
        status: "SCHEDULED"
      });
      fetchRecords();
    } catch (err) {
      console.error(err);
      toast.error("Failed to create maintenance record");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: number, nextStatus: MaintenanceRecord["status"]) => {
    try {
      await maintenanceService.updateMaintenanceStatus(id, nextStatus);
      toast.success(`Work order updated to ${nextStatus}`);
      fetchRecords();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    }
  };

  // KPI Calculations
  const totalCost = records.reduce((sum, r) => sum + (r.cost || 0), 0);
  const activeJobs = records.filter(r => r.status === "IN_PROGRESS").length;
  const completedJobs = records.filter(r => r.status === "COMPLETED").length;
  const upcomingJobs = records.filter(r => r.status === "SCHEDULED").length;

  const filteredRecords = records.filter(r => {
    const assetName = r.asset?.name?.toLowerCase() || "";
    const performedVal = r.performedBy?.toLowerCase() || "";
    const descVal = r.description?.toLowerCase() || "";
    const matchesSearch = assetName.includes(searchTerm.toLowerCase()) || 
                          performedVal.includes(searchTerm.toLowerCase()) ||
                          descVal.includes(searchTerm.toLowerCase());
    const matchesType = !typeFilter || r.type === typeFilter;
    const matchesStatus = !statusFilter || r.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const getMaintenanceTypeLabel = (type: string) => {
    return MAINTENANCE_TYPES.find(t => t.value === type)?.label || type;
  };

  return (
    <div className="min-h-screen text-[#0d0d2b] p-6 font-sans">
      <Toaster position="top-right" richColors />
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-xs text-indigo-600 font-bold uppercase tracking-wider">Facility Management</span>
          <h1 className="text-3xl font-black text-[#0d0d2b] flex items-center gap-2 mt-1">
            <Wrench className="h-8 w-8 text-indigo-600" />
            Maintenance & Repairs
          </h1>
          <p className="text-[#6b7094] text-sm mt-1">
            Keep community infrastructure healthy with preventative maintenance and work orders.
          </p>
        </div>

        <button
          onClick={() => setShowScheduleModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-95 shadow-md shadow-indigo-500/20 text-white px-5 py-3 rounded-full font-bold transition-all text-sm md:self-end"
        >
          <Plus className="h-5 w-5" />
          Schedule Maintenance
        </button>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-[#6366f1]/12 rounded-2xl shadow-[0_4px_20px_rgba(99,102,241,0.05)] p-5">
          <div className="flex items-center gap-3 text-[#6b7094] text-xs font-semibold mb-2">
            <Calendar className="h-4 w-4 text-indigo-600" />
            UPCOMING JOBS
          </div>
          <div className="text-2xl font-black text-[#0d0d2b]">{upcomingJobs}</div>
        </div>

        <div className="bg-white border border-[#6366f1]/12 rounded-2xl shadow-[0_4px_20px_rgba(99,102,241,0.05)] p-5">
          <div className="flex items-center gap-3 text-[#6b7094] text-xs font-semibold mb-2">
            <Clock className="h-4 w-4 text-amber-500" />
            IN PROGRESS
          </div>
          <div className="text-2xl font-black text-[#0d0d2b]">{activeJobs}</div>
        </div>

        <div className="bg-white border border-[#6366f1]/12 rounded-2xl shadow-[0_4px_20px_rgba(99,102,241,0.05)] p-5">
          <div className="flex items-center gap-3 text-[#6b7094] text-xs font-semibold mb-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            COMPLETED JOBS
          </div>
          <div className="text-2xl font-black text-[#0d0d2b]">{completedJobs}</div>
        </div>

        <div className="bg-white border border-[#6366f1]/12 rounded-2xl shadow-[0_4px_20px_rgba(99,102,241,0.05)] p-5">
          <div className="flex items-center gap-3 text-[#6b7094] text-xs font-semibold mb-2">
            <IndianRupee className="h-4 w-4 text-teal-500" />
            TCO MAINTENANCE COST
          </div>
          <div className="text-2xl font-black text-[#0d0d2b]">₹{totalCost.toLocaleString("en-IN")}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6">
        <button
          onClick={() => setActiveTab("schedule")}
          className={`px-6 py-3 font-bold text-sm transition-all border-b-2 ${
            activeTab === "schedule" ? "border-indigo-500 text-[#0d0d2b]" : "border-transparent text-[#6b7094] hover:text-[#0d0d2b]"
          }`}
        >
          Scheduled Agenda
        </button>
        <button
          onClick={() => setActiveTab("orders")}
          className={`px-6 py-3 font-bold text-sm transition-all border-b-2 ${
            activeTab === "orders" ? "border-indigo-500 text-[#0d0d2b]" : "border-transparent text-[#6b7094] hover:text-[#0d0d2b]"
          }`}
        >
          Work Orders History
        </button>
      </div>

      {/* Filters bar */}
      <div className="bg-white border border-[#6366f1]/12 rounded-2xl shadow-[0_4px_20px_rgba(99,102,241,0.03)] p-4 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6b7094]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by asset, technician..."
            className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-sm text-[#0d0d2b] placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
          />
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="flex-1 md:flex-none bg-white border border-slate-200 rounded-xl py-2 px-4 text-sm text-[#6b7094] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
          >
            <option value="">All Types</option>
            {MAINTENANCE_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 md:flex-none bg-white border border-slate-200 rounded-xl py-2 px-4 text-sm text-[#6b7094] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
          >
            <option value="">All Statuses</option>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-white border border-[#6366f1]/12 rounded-2xl shadow-[0_4px_20px_rgba(99,102,241,0.03)] p-12 text-center text-[#6b7094]">
          Loading records...
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="bg-white border border-[#6366f1]/12 rounded-2xl shadow-[0_4px_20px_rgba(99,102,241,0.03)] p-12 text-center text-[#6b7094]">
          No maintenance records match your filters.
        </div>
      ) : activeTab === "schedule" ? (
        // Scheduled / Agenda Card list
        <div className="grid md:grid-cols-2 gap-6">
          {filteredRecords
            .filter(r => r.status === "SCHEDULED" || r.status === "IN_PROGRESS")
            .map(record => (
              <div
                key={record.id}
                className="bg-white border border-[#6366f1]/12 rounded-2xl shadow-[0_4px_20px_rgba(99,102,241,0.05)] p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs text-indigo-600 font-bold bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full">
                      {getMaintenanceTypeLabel(record.type)}
                    </span>
                    <span className={`text-xs border px-3 py-1 rounded-full font-bold ${STATUS_CONFIG[record.status].bg}`}>
                      {STATUS_CONFIG[record.status].label}
                    </span>
                  </div>

                  <h3 className="text-lg font-black text-[#0d0d2b]">{record.asset?.name || "Unknown Asset"}</h3>
                  <p className="text-[#6b7094] text-sm mt-2 font-medium">{record.description || "No description provided."}</p>

                  <div className="grid grid-cols-2 gap-4 mt-6 text-xs text-[#6b7094]">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-[#6b7094]" />
                      <span>{record.maintenanceDate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-[#6b7094]" />
                      <span>{record.performedBy || "Unassigned"}</span>
                    </div>
                    {record.cost > 0 && (
                      <div className="flex items-center gap-2 col-span-2">
                        <IndianRupee className="h-4 w-4 text-[#6b7094]" />
                        <span>Estimated Cost: ₹{record.cost}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 mt-6 pt-6 border-t border-slate-200">
                  {record.status === "SCHEDULED" && (
                    <button
                      onClick={() => handleUpdateStatus(record.id, "IN_PROGRESS")}
                      className="flex-1 bg-amber-500 hover:bg-amber-600 shadow-md shadow-amber-500/20 text-white font-bold text-xs py-2 px-4 rounded-xl transition-all"
                    >
                      Start Work
                    </button>
                  )}
                  {record.status === "IN_PROGRESS" && (
                    <button
                      onClick={() => handleUpdateStatus(record.id, "COMPLETED")}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 shadow-md shadow-emerald-500/20 text-white font-bold text-xs py-2 px-4 rounded-xl transition-all"
                    >
                      Complete Work Order
                    </button>
                  )}
                  <button
                    onClick={() => handleUpdateStatus(record.id, "CANCELLED")}
                    className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-indigo-500/20 text-[#6b7094] font-bold text-xs py-2 px-4 rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ))}
        </div>
      ) : (
        // Grid/Table List view of history
        <div className="bg-white border border-[#6366f1]/12 rounded-2xl shadow-[0_4px_20px_rgba(99,102,241,0.05)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold text-[#6b7094] uppercase tracking-wider">
                  <th className="py-4 px-6">Asset</th>
                  <th className="py-4 px-6">Type</th>
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6">Performed By</th>
                  <th className="py-4 px-6">Cost</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-indigo-50/50 transition-colors">
                    <td className="py-4 px-6 font-bold text-[#0d0d2b]">{record.asset?.name}</td>
                    <td className="py-4 px-6">
                      <span className="text-xs font-semibold text-[#374151]">
                        {getMaintenanceTypeLabel(record.type)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-[#6b7094]">{record.maintenanceDate}</td>
                    <td className="py-4 px-6 text-[#374151]">{record.performedBy || "—"}</td>
                    <td className="py-4 px-6 font-bold text-[#0d0d2b]">₹{record.cost || 0}</td>
                    <td className="py-4 px-6">
                      <span className={`text-xs border px-2.5 py-0.5 rounded-full font-bold ${STATUS_CONFIG[record.status].bg}`}>
                        {STATUS_CONFIG[record.status].label}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-[#6b7094] max-w-xs truncate">{record.description || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 md:p-8 overflow-y-auto max-h-[90vh]">
            <button
              onClick={() => setShowScheduleModal(false)}
              className="absolute right-4 top-4 text-[#6b7094] hover:text-[#0d0d2b]"
            >
              <X className="h-6 w-6" />
            </button>

            <h2 className="text-xl font-black text-[#0d0d2b] flex items-center gap-2 mb-6">
              <PenTool className="h-6 w-6 text-indigo-600" />
              Schedule Asset Maintenance
            </h2>

            <form onSubmit={handleCreateRecord} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6b7094] mb-2">Select Asset</label>
                <select
                  value={form.assetId}
                  onChange={(e) => setForm({ ...form, assetId: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm text-[#0d0d2b] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                  required
                >
                  <option value="">-- Choose Asset --</option>
                  {assets.map(asset => (
                    <option key={asset.id} value={asset.id}>{asset.name} ({asset.category})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#6b7094] mb-2">Date</label>
                  <input
                    type="date"
                    value={form.maintenanceDate}
                    onChange={(e) => setForm({ ...form, maintenanceDate: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm text-[#0d0d2b] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#6b7094] mb-2">Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as any })}
                    className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm text-[#0d0d2b] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                    required
                  >
                    {MAINTENANCE_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#6b7094] mb-2">Estimated Cost (₹)</label>
                  <input
                    type="number"
                    value={form.cost}
                    onChange={(e) => setForm({ ...form, cost: e.target.value })}
                    placeholder="0"
                    className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm text-[#0d0d2b] placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#6b7094] mb-2">Performed By</label>
                  <input
                    type="text"
                    value={form.performedBy}
                    onChange={(e) => setForm({ ...form, performedBy: e.target.value })}
                    placeholder="Technician/Company"
                    className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm text-[#0d0d2b] placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6b7094] mb-2">Description / Notes</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Details of repair/preventive actions required..."
                  rows={3}
                  className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm text-[#0d0d2b] placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 resize-none"
                />
              </div>

              <div className="flex gap-4 pt-4 border-t border-slate-200">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-95 shadow-md shadow-indigo-500/20 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl transition-all"
                >
                  {submitting ? "Scheduling..." : "Create Work Order"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-[#6b7094] font-bold py-3 px-4 rounded-xl transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
