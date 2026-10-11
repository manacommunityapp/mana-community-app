import { useState, useEffect } from "react";
import {
  ShieldCheck,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  TrendingUp,
  BarChart3,
  Search,
  UserPlus,
  Download,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { HomeServiceWorker, ServiceCategory } from "../../../types/homeServices";
import { homeServiceApi } from "../../../services/homeServices/homeServiceApi";

export function HomeServiceAdminDashboard() {
  const [workers, setWorkers] = useState<HomeServiceWorker[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [analytics, setAnalytics] = useState({
    totalWorkers: 0,
    verifiedWorkers: 0,
    activeBookings: 0,
    monthlyServices: 0,
    pendingRequests: 0,
    openReports: 0,
  });
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [regForm, setRegForm] = useState({
    displayName: "",
    phone: "",
    workerType: "INDIVIDUAL",
    languages: "Hindi, Telugu",
    primarySkillCategoryId: "",
    experienceYears: 1,
    bio: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [workersData, stats, cats] = await Promise.all([
      homeServiceApi.getWorkers(),
      homeServiceApi.getAdminAnalytics(),
      homeServiceApi.getCategories(),
    ]);
    setWorkers(workersData);
    setAnalytics(stats);
    setCategories(cats);
    if (cats.length > 0 && !regForm.primarySkillCategoryId) {
      setRegForm((f) => ({ ...f, primarySkillCategoryId: cats[0].id }));
    }
  };

  const handleVerify = async (workerId: string, status: "VERIFIED" | "REJECTED" | "SUSPENDED") => {
    await homeServiceApi.updateWorkerVerification(workerId, status);
    loadData();
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await homeServiceApi.registerWorker({
        displayName: regForm.displayName,
        phone: regForm.phone,
        workerType: regForm.workerType,
        languages: regForm.languages.split(",").map((l) => l.trim()),
        primarySkillCategoryId: regForm.primarySkillCategoryId,
        experienceYears: regForm.experienceYears,
        bio: regForm.bio,
      });
      toast.success(`Worker "${regForm.displayName}" registered successfully!`);
      setShowRegisterModal(false);
      setRegForm({ displayName: "", phone: "", workerType: "INDIVIDUAL", languages: "Hindi, Telugu", primarySkillCategoryId: categories[0]?.id || "", experienceYears: 1, bio: "" });
      loadData();
    } catch (err: any) {
      toast.error("Registration failed: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleExport = async (type: "workers" | "bookings" | "attendance") => {
    const csv = await homeServiceApi.exportData(type);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `home-services-${type}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${type} data exported as CSV`);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
            Home Services Administration
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Worker KYC approvals, security compliance, booking oversight, and complaint resolution
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowRegisterModal(true)}
            className="px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-xs hover:opacity-95 cursor-pointer flex items-center gap-1.5"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Register Worker
          </button>
          <div className="relative group">
            <button className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 cursor-pointer flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5" />
              Export Data
            </button>
            <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg py-1 min-w-[160px] z-10 hidden group-hover:block">
              <button onClick={() => handleExport("workers")} className="w-full px-3 py-2 text-left text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                Workers CSV
              </button>
              <button onClick={() => handleExport("bookings")} className="w-full px-3 py-2 text-left text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                Bookings CSV
              </button>
              <button onClick={() => handleExport("attendance")} className="w-full px-3 py-2 text-left text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                Attendance CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Total Workers</span>
          <span className="text-xl font-black text-slate-900 dark:text-white mt-1 block">{analytics.totalWorkers}</span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Verified</span>
          <span className="text-xl font-black text-emerald-600 mt-1 block">{analytics.verifiedWorkers}</span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Active Bookings</span>
          <span className="text-xl font-black text-primary mt-1 block">{analytics.activeBookings}</span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Monthly Services</span>
          <span className="text-xl font-black text-indigo-600 mt-1 block">{analytics.monthlyServices}</span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Open Requests</span>
          <span className="text-xl font-black text-amber-600 mt-1 block">{analytics.pendingRequests}</span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Reports</span>
          <span className="text-xl font-black text-rose-600 mt-1 block">{analytics.openReports}</span>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 font-extrabold text-sm text-slate-900 dark:text-white">
          Worker Verification &amp; KYC Oversight
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          {workers.map((w) => (
            <div key={w.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary font-black flex items-center justify-center shrink-0">
                  {w.displayName[0]}
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 dark:text-white">
                    {w.displayName} ({w.skills[0]?.categoryName})
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400 font-medium">
                    <span>Exp: {w.experienceYears} Yrs</span>
                    <span>•</span>
                    <span>Flats: {w.flatAssignments.length}</span>
                    <span>•</span>
                    <span>Rating: ⭐ {w.rating.toFixed(1)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                    w.verificationStatus === "VERIFIED"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : w.verificationStatus === "PENDING"
                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                      : "bg-rose-50 text-rose-700 border border-rose-200"
                  }`}
                >
                  {w.verificationStatus}
                </span>
                {w.verificationStatus === "PENDING" && (
                  <button
                    onClick={() => handleVerify(w.id, "VERIFIED")}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 cursor-pointer"
                  >
                    Approve KYC
                  </button>
                )}
                {w.verificationStatus === "VERIFIED" && (
                  <button
                    onClick={() => handleVerify(w.id, "SUSPENDED")}
                    className="px-3 py-1.5 rounded-xl border border-rose-300 text-rose-600 font-bold hover:bg-rose-50 cursor-pointer"
                  >
                    Suspend
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showRegisterModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3.5 sm:p-6 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-w-lg w-full">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Register New Community Worker
              </h3>
              <button onClick={() => setShowRegisterModal(false)} className="p-1 rounded-full text-slate-400 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegister} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="font-bold text-slate-500 block mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={regForm.displayName}
                    onChange={(e) => setRegForm({ ...regForm, displayName: e.target.value })}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-500 block mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={regForm.phone}
                    onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="font-bold text-slate-500 block mb-1">Worker Type</label>
                  <select
                    value={regForm.workerType}
                    onChange={(e) => setRegForm({ ...regForm, workerType: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold outline-none"
                  >
                    <option value="INDIVIDUAL">Individual</option>
                    <option value="AGENCY">Agency</option>
                    <option value="FREELANCER">Freelancer</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-500 block mb-1">Primary Skill</label>
                  <select
                    value={regForm.primarySkillCategoryId}
                    onChange={(e) => setRegForm({ ...regForm, primarySkillCategoryId: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="font-bold text-slate-500 block mb-1">Experience (Years)</label>
                  <input
                    type="number"
                    min={0}
                    value={regForm.experienceYears}
                    onChange={(e) => setRegForm({ ...regForm, experienceYears: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-500 block mb-1">Languages</label>
                  <input
                    type="text"
                    value={regForm.languages}
                    onChange={(e) => setRegForm({ ...regForm, languages: e.target.value })}
                    placeholder="Hindi, Telugu, English"
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-500 block mb-1">Bio / Notes</label>
                <textarea
                  rows={2}
                  value={regForm.bio}
                  onChange={(e) => setRegForm({ ...regForm, bio: e.target.value })}
                  placeholder="Brief description of worker's background..."
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium outline-none resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-bold shadow-xs hover:opacity-95 cursor-pointer"
                >
                  {submitting ? "Registering..." : "Register Worker"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
