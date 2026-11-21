import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router";
import {
  MessageSquare, CalendarCheck, CreditCard, Calendar,
  Shield, Users, BarChart2, Loader2, AlertCircle,
  RefreshCw, TrendingUp, TrendingDown, Clock, AlertTriangle,
  CheckCircle2, XCircle, Building2
} from "lucide-react";
import {
  fmOpsDashboardService,
  type FmOpsDashboardSnapshot,
} from "@/services/fmOpsDashboardService";

function fmtCurrency(n: number): string {
  if (n >= 10_00_000) return "₹" + (n / 10_00_000).toFixed(1) + "L";
  if (n >= 1_000) return "₹" + (n / 1_000).toFixed(0) + "K";
  return "₹" + n.toLocaleString("en-IN");
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function statusColor(val: number, warn: number, crit: number, invert = false) {
  if (invert) {
    if (val <= crit) return "text-red-600";
    if (val <= warn) return "text-amber-500";
    return "text-green-600";
  }
  if (val >= crit) return "text-red-600";
  if (val >= warn) return "text-amber-500";
  return "text-green-600";
}

function MiniBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, pct)}%` }} />
    </div>
  );
}

function SectionCard({ title, icon: Icon, children, iconColor = "text-blue-500", linkTo, linkLabel }: {
  title: string; icon: typeof MessageSquare; children: React.ReactNode;
  iconColor?: string; linkTo?: string; linkLabel?: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 text-sm">
          <Icon size={15} className={iconColor} /> {title}
        </h2>
        {linkTo && (
          <Link to={linkTo} className="text-xs text-blue-600 hover:underline">{linkLabel ?? "View all →"}</Link>
        )}
      </div>
      {children}
    </div>
  );
}

function KpiRow({ items }: { items: { label: string; value: string | number; color?: string }[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {items.map(({ label, value, color }) => (
        <div key={label} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 text-center">
          <div className={`text-xl font-bold ${color ?? "text-gray-800 dark:text-gray-100"}`}>{value}</div>
          <div className="text-[10px] text-gray-500 mt-0.5">{label}</div>
        </div>
      ))}
    </div>
  );
}

export default function FmOpsDashboard() {
  const [snap, setSnap] = useState<FmOpsDashboardSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const communityId = parseInt(localStorage.getItem("communityId") ?? "1", 10);

  const load = useCallback(async () => {
    try {
      const data = await fmOpsDashboardService.getSnapshot(communityId);
      setSnap(data);
      setError(null);
    } catch {
      setError("Could not load FM dashboard.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [communityId]);

  useEffect(() => { load(); }, [load]);

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

  const { complaintQueue: cq, amenityUtilization: au, duesCollection: dc,
          eventPipeline: ep, securityLog: sl, staffRoster: sr, budgetHealth: bh } = snap;

  const attendancePct = sr.totalActive > 0 ? Math.round(sr.presentToday * 100 / sr.totalActive) : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">

      {/* ── HEADER ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Building2 size={22} className="text-blue-600" /> FM Operations Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Community #{snap.communityId} · Last updated {timeAgo(snap.capturedAt)}
          </p>
        </div>
        <button
          onClick={async () => { setRefreshing(true); await load(); }}
          disabled={refreshing}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* ── TOP STATUS BAR ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Open Complaints",   value: cq.totalOpen,            color: statusColor(cq.totalOpen, 10, 20),          icon: MessageSquare },
          { label: "Overdue Complaints",value: cq.overdueCount,         color: statusColor(cq.overdueCount, 3, 8),          icon: AlertTriangle },
          { label: "Outstanding Dues",  value: fmtCurrency(dc.totalOutstanding), color: statusColor(dc.totalOutstanding, 100000, 500000), icon: CreditCard },
          { label: "Fund Health",       value: `${Math.round(bh.fundHealthPct)}%`, color: statusColor(bh.fundHealthPct, 70, 50, true), icon: BarChart2 },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-center">
            <Icon size={16} className={`mx-auto mb-1 ${color}`} />
            <div className={`text-lg font-bold ${color}`}>{value}</div>
            <div className="text-[10px] text-gray-500">{label}</div>
          </div>
        ))}
      </div>

      {/* ── ROW A: COMPLAINTS + AMENITIES ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Maintenance Queue */}
        <SectionCard title="Maintenance & Complaint Queue" icon={MessageSquare} iconColor="text-orange-500" linkTo="/helpdesk" linkLabel="View queue →">
          <KpiRow items={[
            { label: "Open",       value: cq.totalOpen,          color: statusColor(cq.totalOpen, 10, 20) },
            { label: "Overdue",    value: cq.overdueCount,       color: statusColor(cq.overdueCount, 3, 8) },
            { label: "In Progress",value: cq.inProgressCount,    color: "text-blue-600" },
            { label: "Resolved/mo",value: cq.resolvedThisMonth,  color: "text-green-600" },
          ]} />
          {cq.byCategory.length > 0 && (
            <div className="space-y-2 pt-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">By Category</p>
              {cq.byCategory.map(({ category, count }) => (
                <div key={category} className="flex items-center gap-2">
                  <span className="text-xs text-gray-600 dark:text-gray-400 w-28 truncate">{category}</span>
                  <MiniBar pct={cq.totalOpen > 0 ? (count / cq.totalOpen) * 100 : 0} color="bg-orange-400" />
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 w-5 text-right">{count}</span>
                </div>
              ))}
              <p className="text-xs text-gray-400">Avg resolution: {cq.avgResolutionDays}d</p>
            </div>
          )}
        </SectionCard>

        {/* Amenity Utilization */}
        <SectionCard title="Amenity Utilization" icon={CalendarCheck} iconColor="text-cyan-500" linkTo="/bookings" linkLabel="Manage bookings →">
          <KpiRow items={[
            { label: "Bookings/mo",  value: au.totalBookingsThisMonth, color: "text-cyan-600" },
            { label: "Avg Utilization", value: `${au.avgUtilizationPct.toFixed(0)}%`, color: statusColor(au.avgUtilizationPct, 80, 95) },
          ]} />
          {au.byAmenity.length > 0 && (
            <div className="space-y-2 pt-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">By Amenity</p>
              {au.byAmenity.map(({ amenityName, bookings, utilizationPct }) => (
                <div key={amenityName} className="flex items-center gap-2">
                  <span className="text-xs text-gray-600 dark:text-gray-400 w-28 truncate">{amenityName}</span>
                  <MiniBar pct={utilizationPct} color={utilizationPct >= 90 ? "bg-red-400" : utilizationPct >= 70 ? "bg-amber-400" : "bg-cyan-400"} />
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 w-6 text-right">{bookings}</span>
                </div>
              ))}
            </div>
          )}
          {au.peakHours.length > 0 && (
            <div className="pt-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Peak Hours (last 30d)</p>
              <div className="flex items-end gap-0.5 h-10">
                {au.peakHours.map(({ hour, bookings }) => {
                  const max = Math.max(...au.peakHours.map(h => h.bookings), 1);
                  return (
                    <div
                      key={hour}
                      className="flex-1 bg-cyan-300 dark:bg-cyan-700 rounded-t"
                      style={{ height: `${(bookings / max) * 100}%` }}
                      title={`${hour}:00 — ${bookings} bookings`}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between text-[9px] text-gray-400 mt-0.5">
                <span>0h</span><span>12h</span><span>23h</span>
              </div>
            </div>
          )}
        </SectionCard>
      </div>

      {/* ── ROW B: DUES + EVENTS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Dues Collection */}
        <SectionCard title="Resident Dues Collection" icon={CreditCard} iconColor="text-blue-500" linkTo="/finance/billing" linkLabel="View billing →">
          <KpiRow items={[
            { label: "Outstanding",    value: fmtCurrency(dc.totalOutstanding),  color: dc.totalOutstanding > 0 ? "text-red-600" : "text-green-600" },
            { label: "Collected/mo",   value: fmtCurrency(dc.collectedThisMonth), color: "text-green-600" },
            { label: "Collection Rate",value: `${dc.collectionRatePct.toFixed(0)}%`, color: statusColor(dc.collectionRatePct, 90, 70, true) },
            { label: "Overdue Residents", value: dc.overdueResidentCount, color: statusColor(dc.overdueResidentCount, 5, 15) },
          ]} />
          <div className="pt-1">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Collection rate</span>
              <span className="font-semibold">{dc.collectionRatePct.toFixed(0)}%</span>
            </div>
            <MiniBar
              pct={dc.collectionRatePct}
              color={dc.collectionRatePct >= 90 ? "bg-green-500" : dc.collectionRatePct >= 70 ? "bg-amber-400" : "bg-red-400"}
            />
            <p className="text-xs text-gray-400 mt-1">
              {dc.overdueResidentCount} of {dc.totalResidentCount} residents overdue · avg {fmtCurrency(dc.avgDuesPerResident)}/resident
            </p>
          </div>
        </SectionCard>

        {/* Event Pipeline */}
        <SectionCard title="Event Pipeline" icon={Calendar} iconColor="text-indigo-500" linkTo="/events" linkLabel="Manage events →">
          <KpiRow items={[
            { label: "This Week",     value: ep.upcomingThisWeek,   color: "text-indigo-600" },
            { label: "This Month",    value: ep.upcomingThisMonth,  color: "text-purple-600" },
            { label: "Pending Approval", value: ep.pendingApprovals, color: ep.pendingApprovals > 0 ? "text-amber-500" : "text-gray-500" },
            { label: "RSVPs/mo",      value: ep.totalRsvpsThisMonth, color: "text-green-600" },
          ]} />
          {ep.pendingApprovals > 0 && (
            <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-2">
              <AlertTriangle size={14} className="text-amber-500 shrink-0" />
              <p className="text-xs text-amber-700 dark:text-amber-300">
                {ep.pendingApprovals} event{ep.pendingApprovals > 1 ? "s" : ""} awaiting your approval.{" "}
                <Link to="/events?filter=pending" className="font-semibold underline">Review now →</Link>
              </p>
            </div>
          )}
          <p className="text-xs text-gray-400 pt-1">
            {ep.registrationsOpen} event{ep.registrationsOpen !== 1 ? "s" : ""} open for registrations
          </p>
        </SectionCard>
      </div>

      {/* ── ROW C: SECURITY + STAFF ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Security Log */}
        <SectionCard title="Security & Access Log" icon={Shield} iconColor="text-red-500" linkTo="/security" linkLabel="View log →">
          <KpiRow items={[
            { label: "Incidents/mo",   value: sl.incidentsThisMonth,  color: statusColor(sl.incidentsThisMonth, 2, 5) },
            { label: "Unresolved Alerts", value: sl.unresolvedAlerts, color: statusColor(sl.unresolvedAlerts, 1, 3) },
            { label: "Gate Access Today", value: sl.gateAccessToday,  color: "text-gray-700 dark:text-gray-300" },
            { label: "Flagged Entries",value: sl.suspiciousEntries,   color: statusColor(sl.suspiciousEntries, 1, 3) },
          ]} />
          {sl.recentIncidents.length > 0 && (
            <div className="space-y-2 pt-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Recent Incidents</p>
              {sl.recentIncidents.map((inc, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className={`mt-0.5 w-1.5 h-1.5 rounded-full shrink-0 ${inc.severity === "HIGH" || inc.severity === "CRITICAL" ? "bg-red-500" : "bg-amber-400"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-700 dark:text-gray-300 truncate">{inc.description || inc.type}</p>
                  </div>
                  <span className="text-[10px] text-gray-400 shrink-0">{timeAgo(inc.occurredAt)}</span>
                </div>
              ))}
            </div>
          )}
          {sl.incidentsThisMonth === 0 && sl.unresolvedAlerts === 0 && (
            <div className="flex items-center gap-2 text-green-700 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl px-3 py-2">
              <CheckCircle2 size={14} /> <span className="text-xs font-medium">All clear — no open security alerts</span>
            </div>
          )}
        </SectionCard>

        {/* Staff Roster */}
        <SectionCard title="Staff Roster & Attendance" icon={Users} iconColor="text-emerald-500" linkTo="/staff" linkLabel="View roster →">
          <KpiRow items={[
            { label: "Total Active",  value: sr.totalActive,   color: "text-gray-800 dark:text-gray-100" },
            { label: "Present Today", value: sr.presentToday,  color: "text-green-600" },
            { label: "Absent Today",  value: sr.absentToday,   color: sr.absentToday > sr.totalActive * 0.2 ? "text-red-500" : "text-gray-500" },
            { label: "Attendance",    value: `${attendancePct}%`, color: statusColor(attendancePct, 90, 75, true) },
          ]} />
          <div className="pt-1">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Attendance today</span>
              <span className="font-semibold">{attendancePct}%</span>
            </div>
            <MiniBar
              pct={attendancePct}
              color={attendancePct >= 90 ? "bg-green-500" : attendancePct >= 75 ? "bg-amber-400" : "bg-red-400"}
            />
          </div>
          {sr.byRole.length > 0 && (
            <div className="space-y-1.5 pt-1">
              {sr.byRole.slice(0, 5).map(({ role, total, presentToday }) => (
                <div key={role} className="flex items-center gap-2 text-xs">
                  <span className="text-gray-600 dark:text-gray-400 w-24 truncate">{role}</span>
                  <span className="text-green-600 font-semibold">{presentToday}</span>
                  <span className="text-gray-400">/</span>
                  <span className="text-gray-500">{total}</span>
                  <div className="flex-1">
                    <MiniBar pct={total > 0 ? (presentToday / total) * 100 : 0} color="bg-emerald-400" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {/* ── ROW D: BUDGET ── */}
      <SectionCard title="Budget vs Actuals — Maintenance Fund" icon={BarChart2} iconColor="text-violet-500" linkTo="/finance" linkLabel="View finances →">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Fund Balance",    value: fmtCurrency(bh.maintenanceFundBalance), color: bh.maintenanceFundBalance > 0 ? "text-green-600" : "text-red-600" },
            { label: "Budgeted/mo",     value: fmtCurrency(bh.budgetedMonthlyExpense),  color: "text-gray-700 dark:text-gray-300" },
            { label: "Actual Spent/mo", value: fmtCurrency(bh.actualMonthlyExpense),    color: bh.variancePct > 10 ? "text-red-600" : "text-gray-700 dark:text-gray-300" },
            { label: "Runway",          value: `${bh.projectedRunwayMonths}mo`,          color: bh.projectedRunwayMonths < 3 ? "text-red-600" : bh.projectedRunwayMonths < 6 ? "text-amber-500" : "text-green-600" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 text-center">
              <div className={`text-xl font-bold ${color}`}>{value}</div>
              <div className="text-[10px] text-gray-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500">Budget utilization</span>
              <span className="text-xs font-semibold flex items-center gap-1">
                {bh.variancePct > 0 ? <TrendingUp size={11} className="text-red-500" /> : <TrendingDown size={11} className="text-green-500" />}
                {Math.abs(bh.variancePct).toFixed(1)}% {bh.variancePct > 0 ? "over" : "under"} budget
              </span>
            </div>
            <MiniBar
              pct={bh.budgetedMonthlyExpense > 0 ? (bh.actualMonthlyExpense / bh.budgetedMonthlyExpense) * 100 : 0}
              color={bh.variancePct > 10 ? "bg-red-400" : bh.variancePct > 0 ? "bg-amber-400" : "bg-green-500"}
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500">Fund health</span>
              <span className="text-xs font-semibold">{Math.round(bh.fundHealthPct)}%</span>
            </div>
            <MiniBar
              pct={bh.fundHealthPct}
              color={bh.fundHealthPct >= 70 ? "bg-green-500" : bh.fundHealthPct >= 50 ? "bg-amber-400" : "bg-red-400"}
            />
          </div>
        </div>

        {bh.topExpenses.length > 0 && (
          <div className="pt-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Top Expenses This Month</p>
            <div className="space-y-2">
              {bh.topExpenses.map(({ category, amount, pctOfTotal }) => (
                <div key={category} className="flex items-center gap-2">
                  <span className="text-xs text-gray-600 dark:text-gray-400 w-32 truncate">{category}</span>
                  <MiniBar pct={pctOfTotal} color="bg-violet-400" />
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 w-16 text-right">{fmtCurrency(amount)}</span>
                  <span className="text-[10px] text-gray-400 w-9 text-right">{pctOfTotal.toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </SectionCard>

    </div>
  );
}
