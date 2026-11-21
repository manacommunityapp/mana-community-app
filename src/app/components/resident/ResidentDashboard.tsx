import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router";
import {
  Home, Users, Car, Briefcase, UserPlus, AlertTriangle, Wallet,
  CreditCard, Bell, Calendar, BarChart2, Shield, CheckCircle2,
  Clock, FileText, MessageSquare, Vote, RefreshCw, ChevronRight,
  Loader2, AlertCircle, TrendingUp, Building2
} from "lucide-react";
import {
  residentDashboardService,
  type ResidentDashboardSnapshot,
} from "@/services/residentDashboardService";

function timeGreeting(name: string): string {
  const h = new Date().getHours();
  const tod = h < 12 ? "morning" : h < 17 ? "afternoon" : "evening";
  return `Good ${tod}, ${name}`;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function fmtCurrency(n: number): string {
  return "₹" + n.toLocaleString("en-IN");
}

const ACTIVITY_ICONS: Record<string, typeof Home> = {
  COMPLAINT: FileText,
  MAINTENANCE: FileText,
  PAYMENT: CreditCard,
  BOOKING: Calendar,
  VOTE: Vote,
  ANNOUNCEMENT: Bell,
  DEFAULT: Clock,
};

export default function ResidentDashboard() {
  const navigate = useNavigate();
  const [snap, setSnap] = useState<ResidentDashboardSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const communityId = parseInt(localStorage.getItem("communityId") ?? "0", 10);

  const load = useCallback(async () => {
    try {
      const data = await residentDashboardService.getSnapshot(communityId);
      setSnap(data);
      setError(null);
    } catch {
      setError("Could not load your dashboard.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [communityId]);

  useEffect(() => { load(); }, [load]);

  const refresh = async () => {
    setRefreshing(true);
    await load();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  if (error || !snap) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <AlertCircle className="text-red-500" size={32} />
        <p className="text-gray-600">{error ?? "No data available."}</p>
        <button onClick={load} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">
          Try again
        </button>
      </div>
    );
  }

  const { dues, household, activeRequests, bookings, wallet, communityPulse, recentActivity, kyc } = snap;
  const duesOverdue = dues.overdueCount > 0;
  const duesSoon = !duesOverdue && dues.nextDueDate
    ? (new Date(dues.nextDueDate).getTime() - Date.now()) / 86400000 < 7
    : false;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">

      {/* ── HEADER ── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {timeGreeting(snap.residentName)}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-gray-500 flex items-center gap-1">
              <Building2 size={14} /> {snap.flatNumber}
            </span>
            {kyc.isVerified ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                <CheckCircle2 size={11} /> Identity verified
              </span>
            ) : (
              <Link
                to="/profile/kyc"
                className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full hover:bg-amber-100"
              >
                <AlertTriangle size={11} /> Verify identity →
              </Link>
            )}
          </div>
        </div>
        <button
          onClick={refresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* ── DUES ALERT BANNER ── */}
      {dues.outstanding > 0 && (
        <div className={`flex items-center justify-between gap-4 px-4 py-3 rounded-xl border ${
          duesOverdue
            ? "bg-red-50 border-red-200 text-red-800"
            : duesSoon
            ? "bg-amber-50 border-amber-200 text-amber-800"
            : "bg-amber-50 border-amber-200 text-amber-800"
        }`}>
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} />
            <span className="text-sm font-medium">
              You have {fmtCurrency(dues.outstanding)} outstanding dues.
              {dues.nextDueDate && dues.nextDueAmount && (
                <> Next due: {new Date(dues.nextDueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} ({fmtCurrency(dues.nextDueAmount)})</>
              )}
            </span>
          </div>
          <Link to="/finance/payments" className="shrink-0 text-sm font-semibold underline underline-offset-2">
            Pay Now →
          </Link>
        </div>
      )}

      {/* ── ROW 1: DUES + WALLET ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* My Dues */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <CreditCard size={16} className="text-blue-500" /> My Dues
            </h2>
            <Link to="/finance/payments" className="text-xs text-blue-600 hover:underline">View all →</Link>
          </div>
          <div className={`text-3xl font-bold ${dues.outstanding > 0 ? "text-red-600" : "text-green-600"}`}>
            {fmtCurrency(dues.outstanding)}
          </div>
          {dues.nextDueDate && dues.nextDueAmount && (
            <p className="text-sm text-gray-500">
              Next: {fmtCurrency(dues.nextDueAmount)} due {new Date(dues.nextDueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
            </p>
          )}
          <div className="space-y-1">
            {dues.paymentHistory.slice(0, 3).map((p, i) => (
              <div key={i} className="flex items-center justify-between text-xs text-gray-500">
                <span>{new Date(p.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                <span>{fmtCurrency(p.amount)}</span>
                <span className={`px-1.5 py-0.5 rounded-full font-medium ${
                  p.status === "PAID" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
                }`}>{p.status}</span>
              </div>
            ))}
          </div>
          {dues.outstanding > 0 && (
            <Link
              to="/finance/payments"
              className="block w-full text-center py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors"
            >
              Pay Now
            </Link>
          )}
        </div>

        {/* My Wallet */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Wallet size={16} className="text-purple-500" /> My Wallet
            </h2>
            <Link to="/finance/wallet" className="text-xs text-blue-600 hover:underline">Manage →</Link>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {fmtCurrency(wallet.balance)}
          </div>
          {wallet.creditAvailable > 0 && (
            <p className="text-sm text-gray-400">
              + {fmtCurrency(wallet.creditAvailable)} credit available
            </p>
          )}
          {wallet.lastTransactionAmount != null && wallet.lastTransactionDate && (
            <p className="text-sm text-gray-500">
              {wallet.lastTransactionType === "DEBIT" ? "−" : "+"}{fmtCurrency(wallet.lastTransactionAmount)}
              {wallet.lastTransactionType ? ` ${wallet.lastTransactionType.toLowerCase()}` : ""} · {timeAgo(wallet.lastTransactionDate)}
            </p>
          )}
          <Link
            to="/finance/wallet"
            className="block w-full text-center py-2 border border-purple-300 hover:bg-purple-50 text-purple-700 text-sm font-medium rounded-xl transition-colors"
          >
            Top Up
          </Link>
        </div>
      </div>

      {/* ── ROW 2: HOUSEHOLD ── */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Home size={16} className="text-emerald-500" /> My Household · {household.flatNumber}
          </h2>
          <Link to="/household" className="text-xs text-blue-600 hover:underline">Manage →</Link>
        </div>
        <div className="flex flex-wrap gap-3">
          {[
            { icon: Users,    label: `${household.familyMemberCount} family`, to: "/household" },
            { icon: Car,      label: `${household.vehicleCount} vehicles`,    to: "/household" },
            { icon: Briefcase,label: `${household.staffCount} staff`,         to: "/household" },
            { icon: UserPlus, label: `${household.pendingVisitorRequests} visitors pending`, to: "/visitors" },
          ].map(({ icon: Icon, label, to }) => (
            <Link
              key={label}
              to={to}
              className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-600 transition-colors"
            >
              <Icon size={13} className="text-gray-500" />
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* ── ROW 3: REQUESTS + BOOKINGS ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* My Requests */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <MessageSquare size={16} className="text-orange-500" /> My Requests
            </h2>
            <Link to="/helpdesk" className="text-xs text-blue-600 hover:underline">View all →</Link>
          </div>
          <div className="flex gap-4">
            <div className="text-center">
              <div className={`text-2xl font-bold ${activeRequests.openComplaints > 3 ? "text-red-600" : activeRequests.openComplaints > 0 ? "text-amber-500" : "text-green-600"}`}>
                {activeRequests.openComplaints}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">Open</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{activeRequests.inProgressComplaints}</div>
              <div className="text-xs text-gray-500 mt-0.5">In progress</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-500">{activeRequests.pendingServiceRequests}</div>
              <div className="text-xs text-gray-500 mt-0.5">Pending</div>
            </div>
          </div>
          {activeRequests.mostRecentComplaint && (
            <p className="text-xs text-gray-500 border-t pt-2">
              <span className="font-medium">{activeRequests.mostRecentComplaint.title}</span>
              {" · "}{activeRequests.mostRecentComplaint.status}
              {" · "}{activeRequests.mostRecentComplaint.daysOpen}d open
            </p>
          )}
        </div>

        {/* My Bookings */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Calendar size={16} className="text-cyan-500" /> My Bookings
            </h2>
            <Link to="/bookings" className="text-xs text-blue-600 hover:underline">Book →</Link>
          </div>
          {bookings.confirmed.length === 0 && bookings.pendingApproval === 0 ? (
            <p className="text-sm text-gray-400">
              No upcoming bookings.{" "}
              <Link to="/bookings" className="text-blue-600 hover:underline">Book an amenity →</Link>
            </p>
          ) : (
            <div className="space-y-1.5">
              {bookings.confirmed.slice(0, 3).map((b, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-800 dark:text-gray-200">{b.amenityName}</span>
                  <span className="text-gray-500 text-xs">{b.date} · {b.slot}</span>
                </div>
              ))}
              {bookings.pendingApproval > 0 && (
                <p className="text-xs text-amber-600">{bookings.pendingApproval} pending approval</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── ROW 4: COMMUNITY PULSE ── */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <TrendingUp size={16} className="text-indigo-500" /> Community Pulse
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Active Polls",    value: communityPulse.activePolls,         icon: Vote,     to: "/governance",    color: "text-purple-600" },
            { label: "Events this week",value: communityPulse.upcomingEvents,      icon: Calendar, to: "/events",        color: "text-cyan-600" },
            { label: "Announcements",   value: communityPulse.communityAnnouncements, icon: Bell,  to: "/announcements", color: "text-orange-500" },
            { label: "Fund health",     value: `${communityPulse.maintenanceFundHealthPct}%`, icon: BarChart2, to: "/finance", color: communityPulse.maintenanceFundHealthPct >= 80 ? "text-green-600" : "text-amber-500" },
          ].map(({ label, value, icon: Icon, to, color }) => (
            <Link
              key={label}
              to={to}
              className="flex flex-col items-center gap-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-center"
            >
              <Icon size={18} className={color} />
              <span className={`text-xl font-bold ${color}`}>{value}</span>
              <span className="text-xs text-gray-500 leading-tight">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── ROW 5: RECENT ACTIVITY ── */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <Clock size={16} className="text-gray-500" /> Recent Activity
        </h2>
        {recentActivity.length === 0 ? (
          <p className="text-sm text-gray-400">No recent activity.</p>
        ) : (
          <div className="space-y-3">
            {recentActivity.slice(0, 5).map((a, i) => {
              const Icon = ACTIVITY_ICONS[a.type] ?? ACTIVITY_ICONS.DEFAULT;
              return (
                <div key={i} className="flex items-start gap-3">
                  <div className="mt-0.5 p-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg shrink-0">
                    <Icon size={13} className="text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 dark:text-gray-200 truncate">{a.title}</p>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">{timeAgo(a.timestamp)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── QUICK ACTIONS BAR ── */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {[
          { label: "Raise Complaint", to: "/helpdesk/new",    icon: FileText, color: "text-orange-600 bg-orange-50 border-orange-200" },
          { label: "Book Amenity",    to: "/bookings",         icon: Calendar, color: "text-cyan-600 bg-cyan-50 border-cyan-200" },
          { label: "Pay Dues",        to: "/finance/payments", icon: CreditCard, color: "text-blue-600 bg-blue-50 border-blue-200" },
          { label: "My Visitors",     to: "/visitors",         icon: UserPlus, color: "text-indigo-600 bg-indigo-50 border-indigo-200" },
          { label: "Household",       to: "/household",        icon: Home,     color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
          { label: "Community",       to: "/community",        icon: Users,    color: "text-purple-600 bg-purple-50 border-purple-200" },
        ].map(({ label, to, icon: Icon, color }) => (
          <Link
            key={label}
            to={to}
            className={`flex flex-col items-center gap-1.5 py-3 px-2 border rounded-xl text-xs font-medium transition-all hover:scale-105 ${color}`}
          >
            <Icon size={18} />
            <span className="text-center leading-tight">{label}</span>
          </Link>
        ))}
      </div>

    </div>
  );
}
