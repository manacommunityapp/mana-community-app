import { useState, useEffect } from "react";
import {
  CalendarCheck, IndianRupee, Star, Clock, TrendingUp,
  ChevronRight, AlertCircle, CheckCircle2, Loader2,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import { vendorAnalyticsService, vendorBookingService } from "../../../../services/vendorService";
import type { VendorPortalStats, VendorBookingResponse } from "../../../../types/api";

const STATUS_BADGE: Record<string, string> = {
  PENDING: "bg-amber-50 border-amber-200 text-amber-700",
  CONFIRMED: "bg-blue-50 border-blue-200 text-blue-700",
  IN_PROGRESS: "bg-indigo-50 border-indigo-200 text-indigo-700",
  COMPLETED: "bg-emerald-50 border-emerald-200 text-emerald-700",
  CANCELLED: "bg-red-50 border-red-200 text-red-700",
  NO_SHOW: "bg-slate-50 border-slate-200 text-slate-600",
  RESCHEDULED: "bg-violet-50 border-violet-200 text-violet-700",
};

export function VendorPortalDashboard() {
  const [stats, setStats] = useState<VendorPortalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await vendorAnalyticsService.getPortalStats();
      setStats(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load dashboard data");
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <p className="text-[#6b7094] font-medium">{error}</p>
        <button onClick={loadStats} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors">
          Retry
        </button>
      </div>
    );
  }

  if (!stats) return null;

  const kpis = [
    { label: "TODAY'S BOOKINGS", value: stats.todayBookings, icon: CalendarCheck, iconColor: "text-indigo-600" },
    { label: "MONTHLY EARNINGS", value: `₹${stats.monthlyEarnings.toLocaleString("en-IN")}`, icon: IndianRupee, iconColor: "text-emerald-500" },
    { label: "AVG RATING", value: stats.avgRating.toFixed(1), icon: Star, iconColor: "text-amber-500" },
    { label: "PENDING PAYMENTS", value: `₹${stats.pendingPayments.toLocaleString("en-IN")}`, icon: Clock, iconColor: "text-red-500" },
  ];

  return (
    <div className="space-y-6">
      <Toaster position="top-right" richColors />

      {/* Header */}
      <div>
        <span className="text-xs text-indigo-600 font-bold uppercase tracking-wider">Vendor Portal</span>
        <h1 className="text-3xl font-black text-[#0d0d2b] flex items-center gap-2 mt-1">
          <TrendingUp className="h-8 w-8 text-indigo-600" />
          Dashboard
        </h1>
        <p className="text-[#6b7094] text-sm mt-1">
          Overview of your business performance and upcoming bookings.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="bg-white border border-[#6366f1]/12 rounded-2xl shadow-[0_4px_20px_rgba(99,102,241,0.05)] p-5">
              <div className="flex items-center gap-3 text-[#6b7094] text-xs font-semibold mb-2">
                <Icon className={`h-4 w-4 ${kpi.iconColor}`} />
                {kpi.label}
              </div>
              <div className="text-2xl font-black text-[#0d0d2b]">{kpi.value}</div>
            </div>
          );
        })}
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-[#6b7094] font-semibold">Pending Bookings</p>
          <p className="text-xl font-black mt-1">{stats.pendingBookings}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-[#6b7094] font-semibold">Completed Bookings</p>
          <p className="text-xl font-black mt-1">{stats.completedBookings}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-[#6b7094] font-semibold">Total Reviews</p>
          <p className="text-xl font-black mt-1">{stats.totalReviews}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-[#6b7094] font-semibold">Total Earnings</p>
          <p className="text-xl font-black mt-1">₹{stats.totalEarnings.toLocaleString("en-IN")}</p>
        </div>
      </div>

      {/* Rating Breakdown */}
      {stats.ratingBreakdown && stats.ratingBreakdown.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h3 className="text-sm font-black text-[#0d0d2b] mb-4">Rating Breakdown</h3>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((stars) => {
              const item = stats.ratingBreakdown.find((r) => r.stars === stars);
              const count = item?.count || 0;
              const total = stats.ratingBreakdown.reduce((sum, r) => sum + r.count, 0);
              const pct = total > 0 ? (count / total) * 100 : 0;
              return (
                <div key={stars} className="flex items-center gap-3">
                  <span className="text-xs font-bold w-12 text-[#6b7094]">{stars} star</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-[#6b7094] w-8 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upcoming Bookings */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-black text-[#0d0d2b]">Upcoming Bookings</h3>
          <a href="/vendor-portal/bookings" className="text-xs text-indigo-600 font-bold flex items-center gap-1 hover:underline">
            View All <ChevronRight className="w-3 h-3" />
          </a>
        </div>

        {stats.upcomingBookings.length === 0 ? (
          <p className="text-sm text-[#6b7094] text-center py-8">No upcoming bookings</p>
        ) : (
          <div className="space-y-3">
            {stats.upcomingBookings.slice(0, 5).map((booking) => (
              <div key={booking.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                    <CalendarCheck className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#0d0d2b]">{booking.service.name}</p>
                    <p className="text-xs text-[#6b7094]">
                      {booking.customer.fullName} &middot; {booking.scheduledDate} at {booking.scheduledTime}
                    </p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${STATUS_BADGE[booking.status] || "bg-slate-50 text-slate-600"}`}>
                  {booking.status.replace(/_/g, " ")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Payments */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-black text-[#0d0d2b]">Recent Payments</h3>
          <a href="/vendor-portal/payments" className="text-xs text-indigo-600 font-bold flex items-center gap-1 hover:underline">
            View All <ChevronRight className="w-3 h-3" />
          </a>
        </div>

        {stats.recentPayments.length === 0 ? (
          <p className="text-sm text-[#6b7094] text-center py-8">No recent payments</p>
        ) : (
          <div className="space-y-3">
            {stats.recentPayments.slice(0, 5).map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#0d0d2b]">#{payment.paymentNumber}</p>
                    <p className="text-xs text-[#6b7094]">
                      {payment.method.replace(/_/g, " ")} &middot; {new Date(payment.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-black text-emerald-600">
                  ₹{payment.amount.toLocaleString("en-IN")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
