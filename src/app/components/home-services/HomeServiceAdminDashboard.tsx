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
} from "lucide-react";
import type { HomeServiceWorker, ServiceCategory } from "../../../types/homeServices";
import { homeServiceApi } from "../../../services/homeServices/homeServiceApi";

export function HomeServiceAdminDashboard() {
  const [workers, setWorkers] = useState<HomeServiceWorker[]>([]);
  const [analytics, setAnalytics] = useState({
    totalWorkers: 0,
    verifiedWorkers: 0,
    activeBookings: 0,
    monthlyServices: 0,
    pendingRequests: 0,
    openReports: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [workersData, stats] = await Promise.all([
      homeServiceApi.getWorkers(),
      homeServiceApi.getAdminAnalytics(),
    ]);
    setWorkers(workersData);
    setAnalytics(stats);
  };

  const handleVerify = async (workerId: string, status: "VERIFIED" | "REJECTED" | "SUSPENDED") => {
    await homeServiceApi.updateWorkerVerification(workerId, status);
    loadData();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
          Home Services Administration
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Worker KYC approvals, security compliance, booking oversight, and complaint resolution
        </p>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Total Workers</span>
          <span className="text-xl font-black text-slate-900 dark:text-white mt-1 block">
            {analytics.totalWorkers}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Verified</span>
          <span className="text-xl font-black text-emerald-600 mt-1 block">
            {analytics.verifiedWorkers}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Active Bookings</span>
          <span className="text-xl font-black text-primary mt-1 block">
            {analytics.activeBookings}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Monthly Services</span>
          <span className="text-xl font-black text-indigo-600 mt-1 block">
            {analytics.monthlyServices}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Open Requests</span>
          <span className="text-xl font-black text-amber-600 mt-1 block">
            {analytics.pendingRequests}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Reports</span>
          <span className="text-xl font-black text-rose-600 mt-1 block">
            {analytics.openReports}
          </span>
        </div>
      </div>

      {/* Worker Verification Table */}
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
    </div>
  );
}
