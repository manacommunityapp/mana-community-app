import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import {
  communityManagerService,
  type CommunityManagerSnapshot,
} from "../../../services/communityManagerService";
import {
  RefreshCw, Loader2, AlertTriangle, CheckCircle, Clock,
  Users, Shield, Wrench, TrendingUp, Calendar, Building2,
  Zap, UserCheck, BarChart2, ChevronRight,
} from "lucide-react";

function formatINR(n: number): string {
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(1)}Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(1)}L`;
  if (n >= 1e3) return `₹${(n / 1e3).toFixed(1)}K`;
  return `₹${n.toLocaleString("en-IN")}`;
}

function timeAgo(iso: string): string {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 10) return "just now";
  if (secs < 60) return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  return `${Math.floor(secs / 3600)}h ago`;
}

type Severity = "ok" | "warn" | "critical" | "neutral";

function sev(value: number, warnAt: number, critAt: number): Severity {
  if (value >= critAt) return "critical";
  if (value >= warnAt) return "warn";
  return value > 0 ? "ok" : "neutral";
}

const COLORS: Record<Severity, { card: string; val: string; label: string }> = {
  ok:       { card: "bg-emerald-50 border-emerald-200", val: "text-emerald-800", label: "text-emerald-600" },
  warn:     { card: "bg-amber-50 border-amber-200",     val: "text-amber-900",   label: "text-amber-700" },
  critical: { card: "bg-red-50 border-red-200",         val: "text-red-800",     label: "text-red-600" },
  neutral:  { card: "bg-white border-slate-200",        val: "text-slate-800",   label: "text-slate-500" },
};

function KpiTile({
  label, value, sub, severity = "neutral", icon,
}: {
  label: string; value: string | number; sub?: string;
  severity?: Severity; icon?: React.ReactNode;
}) {
  const c = COLORS[severity];
  return (
    <div className={`rounded-xl border p-4 flex flex-col gap-1 ${c.card}`}>
      <div className={`flex items-center gap-1.5 text-xs font-medium ${c.label}`}>
        {icon}{label}
      </div>
      <div className={`text-2xl font-bold font-mono tabular-nums ${c.val}`}>{value}</div>
      {sub && <div className="text-xs text-slate-500">{sub}</div>}
    </div>
  );
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-slate-500">{icon}</span>
      <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">{title}</h2>
    </div>
  );
}

function ProgressBar({ value, max, color = "bg-blue-500" }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const bg = pct > 80 ? "bg-red-400" : pct > 60 ? "bg-amber-400" : color;
  return (
    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
      <div className={`h-2 rounded-full transition-all duration-500 ${bg}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function CategoryBars({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data).sort(([, a], [, b]) => b - a).slice(0, 5);
  const max = entries[0]?.[1] ?? 1;
  return (
    <div className="space-y-2">
      {entries.map(([cat, count]) => (
        <div key={cat} className="flex items-center gap-2 text-xs">
          <span className="w-24 text-slate-600 truncate capitalize">{cat.toLowerCase()}</span>
          <div className="flex-1 bg-slate-100 rounded-full h-2">
            <div
              className="bg-blue-400 h-2 rounded-full"
              style={{ width: `${(count / max) * 100}%` }}
            />
          </div>
          <span className="w-6 text-right text-slate-700 font-mono font-medium">{count}</span>
        </div>
      ))}
    </div>
  );
}

export function CommunityManagerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const communityId: number = (user as any)?.communityId ?? 1;

  const [snap, setSnap] = useState<CommunityManagerSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const data = await communityManagerService.getSnapshot(communityId);
      setSnap(data);
    } catch {
      setError("Could not load dashboard. Retrying…");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [communityId]);

  useEffect(() => {
    load();
    intervalRef.current = setInterval(() => load(true), 5 * 60 * 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 gap-3 text-slate-500">
        <Loader2 className="animate-spin" size={20} /> Loading community dashboard…
      </div>
    );
  }

  if (error || !snap) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-red-500">
        <AlertTriangle size={24} />
        <span>{error ?? "No data available"}</span>
        <button onClick={() => load()} className="text-sm text-blue-600 underline">Retry</button>
      </div>
    );
  }

  const { maintenance, finance, residents, security, amenities, staff, upcoming, governance } = snap;

  // Quick-status chips
  const chips = [
    {
      label: `${maintenance.overdueTickets} overdue ticket${maintenance.overdueTickets !== 1 ? "s" : ""}`,
      sev: maintenance.overdueTickets > 0 ? "critical" : "ok",
      href: "/maintenance",
    },
    {
      label: formatINR(finance.outstandingDuesAmount) + " dues",
      sev: finance.outstandingDuesAmount > 100000 ? "critical" : finance.outstandingDuesAmount > 50000 ? "warn" : "ok",
      href: "/finance",
    },
    {
      label: `${finance.collectionRatePct.toFixed(0)}% collection`,
      sev: finance.collectionRatePct < 70 ? "critical" : finance.collectionRatePct < 85 ? "warn" : "ok",
      href: "/finance",
    },
    {
      label: `${upcoming.pendingNocRequests} pending NOC`,
      sev: upcoming.pendingNocRequests > 3 ? "critical" : upcoming.pendingNocRequests > 0 ? "warn" : "ok",
      href: "/governance/noc",
    },
    {
      label: upcoming.pendingElections > 0 ? `${upcoming.pendingElections} pending election` : "No pending elections",
      sev: upcoming.pendingElections > 0 ? "warn" : "ok",
      href: "/governance",
    },
    {
      label: `Gate: ${security.gateEntriesToday} entries today`,
      sev: "ok" as Severity,
      href: "/visitors",
    },
  ];

  const chipColors: Record<string, string> = {
    ok: "bg-emerald-100 text-emerald-700 border-emerald-200",
    warn: "bg-amber-100 text-amber-700 border-amber-200",
    critical: "bg-red-100 text-red-700 border-red-200",
    neutral: "bg-slate-100 text-slate-600 border-slate-200",
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-lg font-bold text-slate-900">{snap.communityName}</h1>
            <p className="text-xs text-slate-500">Community Manager Dashboard</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">Updated {timeAgo(snap.capturedAt)}</span>
            <button
              onClick={() => load(true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* Quick-status chips */}
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <button
              key={chip.label}
              onClick={() => navigate(chip.href)}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full border text-xs font-medium transition-opacity hover:opacity-80 ${chipColors[chip.sev]}`}
            >
              {chip.sev === "critical" && <AlertTriangle size={11} />}
              {chip.sev === "warn" && <Clock size={11} />}
              {chip.sev === "ok" && <CheckCircle size={11} />}
              {chip.label}
              <ChevronRight size={11} />
            </button>
          ))}
        </div>

        {/* ROW 1: Maintenance */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5">
          <SectionHeader icon={<Wrench size={16} />} title="Maintenance & Helpdesk" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* KPI tiles */}
            <div className="grid grid-cols-2 gap-3">
              <KpiTile
                label="Open Tickets"
                value={maintenance.openTickets}
                severity={sev(maintenance.openTickets, 10, 20)}
                icon={<Wrench size={11} />}
              />
              <KpiTile
                label="Overdue"
                value={maintenance.overdueTickets}
                severity={maintenance.overdueTickets > 0 ? "critical" : "ok"}
                icon={<AlertTriangle size={11} />}
              />
              <KpiTile
                label="Resolved (7d)"
                value={maintenance.resolvedLast7Days}
                severity="ok"
                icon={<CheckCircle size={11} />}
              />
              <KpiTile
                label="Avg Resolution"
                value={`${maintenance.avgResolutionHours.toFixed(0)}h`}
                severity={sev(maintenance.avgResolutionHours, 48, 72)}
                icon={<Clock size={11} />}
              />
            </div>
            {/* Category bars */}
            <div>
              <p className="text-xs font-medium text-slate-500 mb-3">By category</p>
              <CategoryBars data={maintenance.byCategory} />
            </div>
          </div>
        </section>

        {/* ROW 2: Finance */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5">
          <SectionHeader icon={<TrendingUp size={16} />} title="Finance" />
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
            <KpiTile
              label="Collection Rate"
              value={`${finance.collectionRatePct.toFixed(1)}%`}
              severity={finance.collectionRatePct < 70 ? "critical" : finance.collectionRatePct < 85 ? "warn" : "ok"}
            />
            <KpiTile
              label="Collected (Month)"
              value={formatINR(finance.collectedThisMonth)}
              severity="ok"
            />
            <KpiTile
              label="Outstanding Dues"
              value={formatINR(finance.outstandingDuesAmount)}
              severity={finance.outstandingDuesAmount > 100000 ? "critical" : finance.outstandingDuesAmount > 50000 ? "warn" : "neutral"}
            />
            <KpiTile
              label="Maintenance Fund"
              value={formatINR(finance.maintenanceFundBalance)}
              severity="neutral"
            />
            <KpiTile
              label="Overdue Residents"
              value={finance.overdueResidents}
              severity={finance.overdueResidents > 10 ? "critical" : finance.overdueResidents > 3 ? "warn" : "ok"}
            />
          </div>
          {/* Expense vs Budget */}
          <div className="bg-slate-50 rounded-xl p-3">
            <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5">
              <span className="font-medium">Expenses vs Budget</span>
              <span>
                {formatINR(finance.actualExpenses)} / {formatINR(finance.budgetedExpenses)}
              </span>
            </div>
            <ProgressBar value={finance.actualExpenses} max={finance.budgetedExpenses} />
          </div>
        </section>

        {/* ROW 3: Residents + Security */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Residents */}
          <section className="bg-white rounded-2xl border border-slate-200 p-5">
            <SectionHeader icon={<Users size={16} />} title="Residents" />
            <div className="grid grid-cols-3 gap-3 mb-4">
              <KpiTile label="Total" value={residents.totalResidents} />
              <KpiTile label="Active (Month)" value={residents.activeThisMonth} severity="ok" />
              <KpiTile label="New Joiners" value={residents.newJoinersThisMonth} severity={residents.newJoinersThisMonth > 0 ? "ok" : "neutral"} />
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                  <span className="flex items-center gap-1"><UserCheck size={11} /> KYC Verified</span>
                  <span>{residents.verifiedKycCount} / {residents.totalResidents} ({residents.totalResidents > 0 ? Math.round((residents.verifiedKycCount / residents.totalResidents) * 100) : 0}%)</span>
                </div>
                <ProgressBar value={residents.verifiedKycCount} max={residents.totalResidents} color="bg-emerald-400" />
              </div>
              <div>
                <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                  <span className="flex items-center gap-1"><Building2 size={11} /> Occupancy</span>
                  <span>{residents.occupiedFlats} / {residents.totalFlats} ({residents.occupancyPct.toFixed(0)}%)</span>
                </div>
                <ProgressBar value={residents.occupiedFlats} max={residents.totalFlats} color="bg-blue-400" />
              </div>
            </div>
          </section>

          {/* Security */}
          <section className="bg-white rounded-2xl border border-slate-200 p-5">
            <SectionHeader icon={<Shield size={16} />} title="Security" />
            <div className="grid grid-cols-2 gap-3">
              <KpiTile
                label="Gate Entries Today"
                value={security.gateEntriesToday}
                severity="neutral"
                sub="Total entries logged"
              />
              <KpiTile
                label="Visitor Requests"
                value={security.visitorRequestsPending}
                severity={security.visitorRequestsPending > 5 ? "warn" : "neutral"}
                sub="Pending approval"
              />
              <KpiTile
                label="Incidents (Month)"
                value={security.incidentsThisMonth}
                severity={security.incidentsThisMonth > 2 ? "critical" : security.incidentsThisMonth > 0 ? "warn" : "ok"}
              />
              <KpiTile
                label="Watchlist Alerts"
                value={security.watchlistAlerts}
                severity={security.watchlistAlerts > 0 ? "critical" : "ok"}
                sub={security.watchlistAlerts > 0 ? "Immediate action required" : "All clear"}
              />
            </div>
          </section>
        </div>

        {/* ROW 4: Amenities + Staff */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Amenities */}
          <section className="bg-white rounded-2xl border border-slate-200 p-5">
            <SectionHeader icon={<BarChart2 size={16} />} title="Amenities" />
            <div className="grid grid-cols-2 gap-3 mb-4">
              <KpiTile label="Bookings Today" value={amenities.bookingsToday} severity="neutral" />
              <KpiTile label="This Week" value={amenities.bookingsThisWeek} severity="neutral" />
            </div>
            {amenities.topBookedAmenity && (
              <div className="mb-3">
                <span className="text-xs text-slate-500">Top booked: </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                  {amenities.topBookedAmenity}
                </span>
              </div>
            )}
            <div>
              <p className="text-xs font-medium text-slate-500 mb-2">Utilisation</p>
              <div className="space-y-2">
                {Object.entries(amenities.utilizationByAmenity)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 4)
                  .map(([name, pct]) => (
                    <div key={name} className="flex items-center gap-2 text-xs">
                      <span className="w-28 text-slate-600 truncate">{name}</span>
                      <div className="flex-1 bg-slate-100 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${pct > 80 ? "bg-red-400" : pct > 60 ? "bg-amber-400" : "bg-blue-400"}`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                      <span className="w-8 text-right text-slate-700 font-mono">{pct}%</span>
                    </div>
                  ))}
              </div>
            </div>
          </section>

          {/* Staff & Vendors */}
          <section className="bg-white rounded-2xl border border-slate-200 p-5">
            <SectionHeader icon={<Users size={16} />} title="Staff & Vendors" />
            <div className="grid grid-cols-2 gap-3 mb-4">
              <KpiTile
                label="Staff Present"
                value={`${staff.staffPresentToday} / ${staff.totalStaff}`}
                severity={staff.staffPresentToday < staff.totalStaff * 0.7 ? "warn" : "ok"}
                sub="Today"
              />
              <KpiTile
                label="Pending Tasks"
                value={staff.pendingTasks}
                severity={staff.pendingTasks > 10 ? "warn" : "neutral"}
              />
            </div>
            {/* Staff presence circle */}
            <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
              <div className="relative w-16 h-16 flex-shrink-0">
                <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                  <circle
                    cx="18" cy="18" r="15.9" fill="none"
                    stroke={staff.staffPresentToday / staff.totalStaff < 0.7 ? "#f59e0b" : "#10b981"}
                    strokeWidth="3"
                    strokeDasharray={`${staff.totalStaff > 0 ? (staff.staffPresentToday / staff.totalStaff) * 100 : 0} 100`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-700">
                  {staff.totalStaff > 0 ? Math.round((staff.staffPresentToday / staff.totalStaff) * 100) : 0}%
                </span>
              </div>
              <div className="text-sm text-slate-600">
                <div><span className="font-semibold text-slate-800">{staff.staffPresentToday}</span> present</div>
                <div className="text-xs text-slate-500">{staff.totalStaff - staff.staffPresentToday} absent</div>
                {staff.vendorsPending > 0 && (
                  <div className="mt-1 text-xs text-amber-600 font-medium">
                    {staff.vendorsPending} vendor payment{staff.vendorsPending !== 1 ? "s" : ""} pending
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* ROW 5: Upcoming + Governance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Upcoming */}
          <section className="bg-white rounded-2xl border border-slate-200 p-5">
            <SectionHeader icon={<Calendar size={16} />} title="Upcoming" />
            <div className="space-y-2">
              {[
                {
                  icon: <Calendar size={14} />,
                  label: "Events next 7 days",
                  value: upcoming.eventsNext7Days,
                  href: "/events",
                  badge: upcoming.eventsNext7Days > 0 ? "blue" : "neutral",
                },
                {
                  icon: <Building2 size={14} />,
                  label: "Next AGM",
                  value: upcoming.nextAgmDate
                    ? new Date(upcoming.nextAgmDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                    : "Not scheduled",
                  href: "/governance",
                  badge: upcoming.nextAgmDate ? "blue" : "neutral",
                },
                {
                  icon: <Zap size={14} />,
                  label: "Pending NOC requests",
                  value: upcoming.pendingNocRequests,
                  href: "/governance/noc",
                  badge: upcoming.pendingNocRequests > 0 ? "warn" : "ok",
                },
                {
                  icon: <Users size={14} />,
                  label: "Pending elections",
                  value: upcoming.pendingElections,
                  href: "/governance",
                  badge: upcoming.pendingElections > 0 ? "warn" : "ok",
                },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => navigate(item.href)}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                >
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <span className="text-slate-400">{item.icon}</span>
                    {item.label}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${
                      item.badge === "warn" ? "text-amber-700" :
                      item.badge === "ok" ? "text-emerald-700" :
                      item.badge === "blue" ? "text-blue-700" : "text-slate-500"
                    }`}>
                      {item.value}
                    </span>
                    <ChevronRight size={14} className="text-slate-400" />
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Governance */}
          <section className="bg-white rounded-2xl border border-slate-200 p-5">
            <SectionHeader icon={<Shield size={16} />} title="Governance" />
            <div className="grid grid-cols-2 gap-3 mb-4">
              <KpiTile
                label="Active Polls"
                value={governance.activePolls}
                severity={governance.activePolls > 0 ? "ok" : "neutral"}
                sub={`${governance.recentVoteParticipationPct.toFixed(0)}% participation`}
              />
              <KpiTile
                label="Pending Resolutions"
                value={governance.pendingResolutions}
                severity={governance.pendingResolutions > 2 ? "warn" : "neutral"}
              />
            </div>
            {/* Committee positions pips */}
            <div className="p-3 bg-slate-50 rounded-xl">
              <div className="flex items-center justify-between text-xs text-slate-600 mb-2">
                <span className="font-medium">Committee Positions</span>
                <span>{governance.committeePositionsFilled} / {governance.totalCommitteePositions} filled</span>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {Array.from({ length: governance.totalCommitteePositions }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-5 h-5 rounded-full border-2 ${
                      i < governance.committeePositionsFilled
                        ? "bg-emerald-400 border-emerald-500"
                        : "bg-white border-slate-300"
                    }`}
                  />
                ))}
              </div>
            </div>
          </section>
        </div>

      </div>
    </div>
  );
}

export default CommunityManagerDashboard;
