import {
  Shield, Plus, X, Loader2, LogIn, LogOut, UserCheck, Clock, Car, Phone,
  Search, Ban, Copy, Check, Users, ChevronDown
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { visitorService, type VisitorPassResponse, type VisitorPassRequest } from "../../../services/visitorService";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type TabKey = "all" | "active" | "mine";

const passTypeLabels: Record<string, string> = {
  PRE_APPROVED: "Pre-Approved",
  WALK_IN: "Walk-In",
  DELIVERY: "Delivery",
  RECURRING: "Recurring",
};

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: "Pending", color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
  APPROVED: { label: "Approved", color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
  CHECKED_IN: { label: "Inside", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
  CHECKED_OUT: { label: "Left", color: "text-slate-500", bg: "bg-slate-50 border-slate-200" },
  REJECTED: { label: "Rejected", color: "text-red-500", bg: "bg-red-50 border-red-200" },
  EXPIRED: { label: "Expired", color: "text-slate-400", bg: "bg-slate-50 border-slate-200" },
};

function formatTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function VisitorManagement() {
  const [tab, setTab] = useState<TabKey>("all");
  const [passes, setPasses] = useState<VisitorPassResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchPasses = useCallback(async () => {
    setLoading(true);
    try {
      let data: VisitorPassResponse[];
      if (tab === "active") data = await visitorService.getActivePasses();
      else if (tab === "mine") data = await visitorService.getMyPasses();
      else data = await visitorService.getCommunityPasses();
      setPasses(data);
    } catch {
      setPasses([]);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { fetchPasses(); }, [fetchPasses]);

  const handleCheckIn = async (id: number) => {
    setActionLoading(id);
    try {
      await visitorService.checkIn(id);
      fetchPasses();
    } finally { setActionLoading(null); }
  };

  const handleCheckOut = async (id: number) => {
    setActionLoading(id);
    try {
      await visitorService.checkOut(id);
      fetchPasses();
    } finally { setActionLoading(null); }
  };

  const handleReject = async (id: number) => {
    setActionLoading(id);
    try {
      await visitorService.reject(id);
      fetchPasses();
    } finally { setActionLoading(null); }
  };

  const filtered = searchQuery
    ? passes.filter(
        (p) =>
          p.visitorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.passCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.flatNumber && p.flatNumber.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : passes;

  const stats = {
    total: passes.length,
    inside: passes.filter((p) => p.status === "CHECKED_IN").length,
    approved: passes.filter((p) => p.status === "APPROVED").length,
  };

  return (
    <div className="min-h-screen text-[#0d0d2b] p-6 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-xs text-indigo-600 font-bold uppercase tracking-wider">Security & Access</span>
          <h1 className="text-3xl font-black text-[#0d0d2b] mt-1">Visitor Management</h1>
          <p className="text-[#6b7094] text-sm mt-1">Manage gate passes and track visitor check-ins.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-95 shadow-md shadow-indigo-500/20 text-white text-sm font-bold rounded-full transition-all cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4.5 h-4.5" />
          Create Pass
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard icon={<Users className="w-5 h-5" />} label="Total Passes" value={stats.total} color="indigo" />
        <StatCard icon={<LogIn className="w-5 h-5" />} label="Currently Inside" value={stats.inside} color="emerald" />
        <StatCard icon={<UserCheck className="w-5 h-5" />} label="Awaiting Entry" value={stats.approved} color="blue" />
      </div>

      {/* Tabs and Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
          {([["all", "All Passes"], ["active", "Active"], ["mine", "My Passes"]] as [TabKey, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer",
                tab === key ? "bg-[#0d0d2b] text-white shadow-sm" : "text-[#6b7094] hover:bg-slate-50"
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7094] w-4.5 h-4.5" />
          <input
            type="text"
            placeholder="Search by name, pass code, or flat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-[#0d0d2b] placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Pass List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Shield className="w-12 h-12 text-slate-300 mb-3" />
          <p className="text-[#6b7094] text-sm font-medium">No visitor passes found</p>
          <p className="text-slate-400 text-xs mt-1">Create a pass to pre-approve a visitor.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((pass) => (
            <PassCard
              key={pass.id}
              pass={pass}
              onCheckIn={handleCheckIn}
              onCheckOut={handleCheckOut}
              onReject={handleReject}
              actionLoading={actionLoading}
            />
          ))}
        </div>
      )}

      {showCreate && (
        <CreatePassModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); fetchPasses(); }}
        />
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    indigo: "from-indigo-50 to-violet-50 border-indigo-100 text-indigo-600",
    emerald: "from-emerald-50 to-teal-50 border-emerald-100 text-emerald-600",
    blue: "from-blue-50 to-sky-50 border-blue-100 text-blue-600",
  };
  return (
    <div className={cn("rounded-2xl border bg-gradient-to-br p-5 shadow-sm", colors[color])}>
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-white/80 shadow-sm">{icon}</div>
        <div>
          <p className="text-2xl font-black">{value}</p>
          <p className="text-xs font-medium opacity-70">{label}</p>
        </div>
      </div>
    </div>
  );
}

function PassCard({
  pass, onCheckIn, onCheckOut, onReject, actionLoading,
}: {
  pass: VisitorPassResponse;
  onCheckIn: (id: number) => void;
  onCheckOut: (id: number) => void;
  onReject: (id: number) => void;
  actionLoading: number | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const cfg = statusConfig[pass.status] ?? statusConfig.PENDING;
  const isLoading = actionLoading === pass.id;

  const copyCode = () => {
    navigator.clipboard.writeText(pass.passCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="bg-white rounded-2xl border border-[#6366f1]/12 shadow-[0_4px_20px_rgba(99,102,241,0.03)] overflow-hidden">
      <div
        className="p-4 flex items-center gap-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-50 to-violet-50 border border-indigo-100 flex items-center justify-center text-sm font-black text-indigo-600 shrink-0">
          {pass.visitorName.charAt(0)}
        </div>

        {/* Main Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-[#0d0d2b] truncate">{pass.visitorName}</h3>
            <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold border", cfg.bg, cfg.color)}>
              {cfg.label}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-[11px] text-[#6b7094]">
            {pass.flatNumber && <span>Flat {pass.flatNumber}</span>}
            {pass.purpose && <span className="truncate">{pass.purpose}</span>}
          </div>
        </div>

        {/* Pass Code */}
        <div className="hidden sm:flex items-center gap-1.5">
          <code className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg tracking-wider">
            {pass.passCode}
          </code>
          <button
            onClick={(e) => { e.stopPropagation(); copyCode(); }}
            className="p-1 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
          </button>
        </div>

        {/* Time */}
        <div className="text-right shrink-0 hidden md:block">
          <div className="text-[11px] text-[#6b7094]">{formatDate(pass.createdAt)}</div>
          <div className="text-[10px] text-slate-400">
            {pass.checkedInAt ? `In: ${formatTime(pass.checkedInAt)}` : pass.expectedAt ? `ETA: ${formatTime(pass.expectedAt)}` : ""}
          </div>
        </div>

        <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform shrink-0", expanded && "rotate-180")} />
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-slate-100">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 text-xs">
            {pass.visitorPhone && (
              <div className="flex items-center gap-1.5 text-[#6b7094]">
                <Phone className="w-3.5 h-3.5" /> {pass.visitorPhone}
              </div>
            )}
            {pass.vehicleNumber && (
              <div className="flex items-center gap-1.5 text-[#6b7094]">
                <Car className="w-3.5 h-3.5" /> {pass.vehicleNumber}
              </div>
            )}
            <div className="flex items-center gap-1.5 text-[#6b7094]">
              <Clock className="w-3.5 h-3.5" /> {formatDate(pass.createdAt)} {formatTime(pass.createdAt)}
            </div>
            <div className="flex items-center gap-1.5 text-[#6b7094]">
              <Shield className="w-3.5 h-3.5" /> {passTypeLabels[pass.passType] ?? pass.passType}
            </div>
          </div>
          <div className="text-xs text-[#6b7094] mb-3">
            <span className="font-medium text-[#0d0d2b]">Host:</span> {pass.residentName}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap">
            {pass.status === "APPROVED" && (
              <>
                <button
                  onClick={() => onCheckIn(pass.id)}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 text-xs font-bold rounded-lg transition-all cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogIn className="w-3.5 h-3.5" />}
                  Check In
                </button>
                <button
                  onClick={() => onReject(pass.id)}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-500 text-xs font-bold rounded-lg transition-all cursor-pointer disabled:opacity-50"
                >
                  <Ban className="w-3.5 h-3.5" /> Reject
                </button>
              </>
            )}
            {pass.status === "CHECKED_IN" && (
              <button
                onClick={() => onCheckOut(pass.id)}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-600 text-xs font-bold rounded-lg transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
                Check Out
              </button>
            )}
            {pass.checkedInAt && (
              <span className="text-[11px] text-slate-400 self-center">
                Checked in: {formatTime(pass.checkedInAt)}
                {pass.checkedOutAt && ` — Out: ${formatTime(pass.checkedOutAt)}`}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CreatePassModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState<VisitorPassRequest>({
    visitorName: "",
    visitorPhone: "",
    vehicleNumber: "",
    purpose: "",
    passType: "PRE_APPROVED",
    expectedAt: "",
    flatNumber: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.visitorName.trim()) {
      setError("Visitor name is required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await visitorService.create(form);
      onCreated();
    } catch {
      setError("Failed to create pass. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const update = (field: keyof VisitorPassRequest, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-lg font-black text-[#0d0d2b]">Create Visitor Pass</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
            <X className="w-5 h-5 text-[#6b7094]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <p className="text-red-500 text-xs font-medium bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <div>
            <label className="block text-xs font-bold text-[#0d0d2b] mb-1.5">Visitor Name *</label>
            <input
              value={form.visitorName}
              onChange={(e) => update("visitorName", e.target.value)}
              maxLength={100}
              className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
              placeholder="e.g. Ravi Kumar"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#0d0d2b] mb-1.5">Phone</label>
              <input
                value={form.visitorPhone}
                onChange={(e) => update("visitorPhone", e.target.value)}
                maxLength={15}
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                placeholder="+91 98765 43210"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#0d0d2b] mb-1.5">Vehicle Number</label>
              <input
                value={form.vehicleNumber}
                onChange={(e) => update("vehicleNumber", e.target.value)}
                maxLength={20}
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                placeholder="KA 01 AB 1234"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#0d0d2b] mb-1.5">Pass Type</label>
              <select
                value={form.passType}
                onChange={(e) => update("passType", e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
              >
                <option value="PRE_APPROVED">Pre-Approved</option>
                <option value="WALK_IN">Walk-In</option>
                <option value="DELIVERY">Delivery</option>
                <option value="RECURRING">Recurring</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#0d0d2b] mb-1.5">Flat / Unit</label>
              <input
                value={form.flatNumber}
                onChange={(e) => update("flatNumber", e.target.value)}
                maxLength={30}
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                placeholder="Tower B, 402"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0d0d2b] mb-1.5">Purpose</label>
            <input
              value={form.purpose}
              onChange={(e) => update("purpose", e.target.value)}
              maxLength={500}
              className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
              placeholder="Personal visit, delivery, repair work..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0d0d2b] mb-1.5">Expected Arrival</label>
            <input
              type="datetime-local"
              value={form.expectedAt}
              onChange={(e) => update("expectedAt", e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-bold text-[#6b7094] hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-bold rounded-xl hover:opacity-95 transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? "Creating..." : "Create Pass"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
