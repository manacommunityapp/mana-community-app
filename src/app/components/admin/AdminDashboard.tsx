import { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck,
  UserCheck,
  UserX,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  Search,
  AlertTriangle,
  Loader2,
  Users,
  Ticket,
  Wrench,
  DollarSign,
  CalendarDays,
  Megaphone,
  Store,
  Flag,
  BookOpen,
  UserPlus,
  Activity,
  ArrowUpRight,
  Building2,
  CalendarCheck,
  CircleDollarSign,
  ClipboardList,
  DoorOpen,
  HeartHandshake,
  Landmark,
  Shield,
  Sofa,
} from "lucide-react";
import { Link } from "react-router";
import { showSuccess, showError } from "../../../utils/ToastUtils";
const toast = {
  success: (msg: string) => showSuccess(msg),
  error: (msg: string) => showError(msg),
};
import { useAuth } from "../../../contexts/AuthContext";
import { userService } from "../../../services/common/userService";
import {
  dashboardService,
  type AdminDashboardStats,
  type RecentActivityItem,
} from "../../../services/dashboard/dashboardService";

type VerificationStatus = "pending" | "approved" | "rejected";

type UserApplication = {
  id: string;
  fullName: string;
  email: string;
  communityType: string;
  communityCode: string;
  userType: "member" | "vendor";
  idType: string;
  idNumber: string;
  phoneNumber: string;
  address: string;
  submittedAt: string;
  status: VerificationStatus;
  documents: {
    idFront?: string;
    idBack?: string;
    selfie?: string;
  };
};

function StatCard({
  label,
  value,
  icon: Icon,
  color = "primary",
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color?: "primary" | "warning" | "success" | "danger" | "info";
}) {
  const colors: Record<string, { border: string; text: string; bg: string; iconBg: string }> = {
    primary: { border: "border-primary/30", text: "text-primary", bg: "bg-primary/10", iconBg: "bg-primary/10" },
    warning: { border: "border-warning/30", text: "text-warning", bg: "bg-warning/10", iconBg: "bg-warning/10" },
    success: { border: "border-success/30", text: "text-success", bg: "bg-success/10", iconBg: "bg-success/10" },
    danger: { border: "border-danger/30", text: "text-danger", bg: "bg-danger/10", iconBg: "bg-danger/10" },
    info: { border: "border-sky-500/30", text: "text-sky-500", bg: "bg-sky-500/10", iconBg: "bg-sky-500/10" },
  };
  const c = colors[color] || colors.primary;

  return (
    <div className={`bg-card p-2.5 sm:p-3 rounded-xl border ${c.border} shadow-2xs flex flex-col justify-between`}>
      <div className="flex items-center justify-between mb-1">
        <span className={`text-[10.5px] font-bold ${c.text}`}>{label}</span>
        <div className={`p-1 rounded-md ${c.iconBg} shrink-0`}>
          <Icon className={`w-3 h-3 ${c.text}`} />
        </div>
      </div>
      <div className={`text-lg sm:text-xl font-black ${c.text}`}>{value}</div>
    </div>
  );
}

function formatActivityTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return d.toLocaleDateString();
}

function formatCommunityMoney(value: number | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

export function AdminDashboard() {
  const { isAnyAdmin, isSuperAdmin } = useAuth();
  const [dashStats, setDashStats] = useState<AdminDashboardStats | null>(null);
  const [dashLoading, setDashLoading] = useState(true);

  const [applications, setApplications] = useState<UserApplication[]>([]);
  const [kycLoading, setKycLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<UserApplication | null>(null);
  const [filterStatus, setFilterStatus] = useState<VerificationStatus | "all">("pending");
  const [kycStats, setKycStats] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });

  useEffect(() => {
    if (!isAnyAdmin) return;
    let active = true;
    dashboardService
      .getAdminStats()
      .then((stats) => { if (active) setDashStats(stats); })
      .catch(() => {})
      .finally(() => { if (active) setDashLoading(false); });
    return () => { active = false; };
  }, [isAnyAdmin]);

  const fetchApplications = useCallback(async () => {
    try {
      setKycLoading(true);

      let backendStatus: "PENDING" | "VERIFIED" | "REJECTED" | undefined = undefined;
      if (filterStatus === "pending") backendStatus = "PENDING";
      else if (filterStatus === "approved") backendStatus = "VERIFIED";
      else if (filterStatus === "rejected") backendStatus = "REJECTED";

      const users = await userService.getAllUsers(backendStatus);
      const mapped: UserApplication[] = users.map((u) => {
        let status: VerificationStatus = "pending";
        if (["VERIFIED", "APPROVED"].includes(u.kycStatus?.toUpperCase())) status = "approved";
        else if (u.kycStatus?.toUpperCase() === "REJECTED") status = "rejected";

        return {
          id: String(u.id),
          fullName: u.fullName,
          email: u.email,
          communityType: u.communityId ? "Apartment" : "None",
          communityCode: u.communityId ? `COMM-${u.communityId}` : "—",
          userType: u.role === "VENDOR" ? "vendor" : "member",
          idType: u.govtIdType || "—",
          idNumber: u.govtIdNumber || "—",
          phoneNumber: u.phone || "—",
          address: u.flatNo && u.block ? `${u.block}, Apt ${u.flatNo}` : "—",
          submittedAt: u.createdAt || u.createdDate || new Date().toISOString(),
          status,
          documents: {
            idFront: undefined,
            idBack: undefined,
            selfie: u.profilePicUrl || undefined,
          },
        };
      });
      setApplications(mapped);

      const statsData = await userService.getKycStats();
      setKycStats(statsData);
    } catch {
      toast.error("Failed to load applications from database");
    } finally {
      setKycLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    if (!isAnyAdmin) return;
    let active = true;
    queueMicrotask(() => { if (active) void fetchApplications(); });
    return () => { active = false; };
  }, [fetchApplications, isAnyAdmin]);

  const handleApprove = async (id: string) => {
    try {
      await userService.updateUserKycStatus(Number(id), "VERIFIED");
      toast.success("Application approved successfully");
      fetchApplications();
      setSelectedApp(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to approve application");
    }
  };

  const handleReject = async (id: string) => {
    try {
      await userService.updateUserKycStatus(Number(id), "REJECTED");
      toast.error("Application rejected");
      fetchApplications();
      setSelectedApp(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to reject application");
    }
  };

  if (!isAnyAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-slate-500 font-medium">Access Denied. Administrative privileges required.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3.5 sm:space-y-4">
      {/* Apartment operations command center */}
      <section className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-2xs">
        <div className="flex flex-col gap-4 bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-700 p-5 text-white sm:flex-row sm:items-end sm:justify-between sm:p-6">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-white/75">
              <Building2 className="h-4 w-4" /> APARTMENT OPERATIONS
            </div>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Community Admin Dashboard</h1>
            <p className="mt-1 max-w-2xl text-sm text-white/80">Manage residents, services, finances, facilities and community life from one place.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/cpos/residents" className="inline-flex items-center gap-2 rounded-lg bg-white/15 px-3 py-2 text-xs font-semibold transition hover:bg-white/25">
              <Users className="h-4 w-4" /> Residents &amp; access
            </Link>
            <Link to="/finance/maintenance" className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-50">
              <CircleDollarSign className="h-4 w-4" /> Maintenance dues
            </Link>
            <Link to="/finance/budget" className="inline-flex items-center gap-2 rounded-lg bg-white/15 px-3 py-2 text-xs font-semibold transition hover:bg-white/25">
              <Landmark className="h-4 w-4" /> Budgets
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 p-3 sm:grid-cols-3 sm:gap-3 sm:p-4 lg:grid-cols-5">
          {[
            { title: "Residents & verification", detail: "Resident registry and identity checks", metric: dashStats?.residentCount != null ? `${dashStats.residentCount} residents` : "Resident directory", icon: Users, href: "/cpos/residents", tone: "text-violet-600 bg-violet-500/10" },
            { title: "Ownership registry", detail: "Unit owners and ownership records", metric: dashStats?.ownerCount != null ? `${dashStats.ownerCount} owners` : "View ownership", icon: Building2, href: "/cpos/ownership", tone: "text-blue-600 bg-blue-500/10" },
            { title: "Tenant occupancy", detail: "Tenant records, leases and unit occupancy", metric: dashStats?.tenantCount != null ? `${dashStats.tenantCount} tenants` : "Manage occupancy", icon: Building2, href: "/cpos/occupancy", tone: "text-indigo-600 bg-indigo-500/10" },
            { title: "Maintenance collection", detail: "Invoices, collections and receipts", metric: dashStats?.maintenanceCollectedThisMonthAmount != null ? `${formatCommunityMoney(dashStats.maintenanceCollectedThisMonthAmount)} collected this month` : "Open billing", icon: CircleDollarSign, href: "/finance/maintenance", tone: "text-emerald-600 bg-emerald-500/10" },
            { title: "Outstanding dues", detail: "Unpaid invoices and account follow-up", metric: dashStats?.outstandingInvoiceCount != null ? `${dashStats.outstandingInvoiceCount} invoices · ${formatCommunityMoney(dashStats.outstandingDuesAmount)}` : "View dues", icon: Landmark, href: "/finance/billing", tone: "text-amber-600 bg-amber-500/10" },
            { title: "Visitors & security", detail: "Gate entries, guards and access", metric: dashStats ? `${dashStats.activeVisitorsCount} checked in · ${dashStats.expectedVisitorsTodayCount ?? 0} expected today` : "Gate management", icon: Shield, href: "/visitors", tone: "text-sky-600 bg-sky-500/10" },
            { title: "Helpdesk & SLA", detail: "Tickets, priorities and resolution", metric: dashStats ? `${dashStats.openTicketsCount} open · ${dashStats.slaBreachedTicketsCount ?? "—"} SLA breached` : "Ticket queue", icon: ClipboardList, href: "/helpdesk", tone: "text-rose-600 bg-rose-500/10" },
            { title: "Event attendance", detail: "Registrations, attendee lists and check-in", metric: dashStats?.eventAttendanceCount != null ? `${dashStats.eventAttendanceCount} registered attendees` : "Attendance workspace", icon: CalendarCheck, href: "/events/people", tone: "text-fuchsia-600 bg-fuchsia-500/10" },
            { title: "Facility utilization", detail: "Booked facility hours against scheduled hours this month", metric: dashStats?.facilityUtilizationPercent != null ? `${dashStats.facilityUtilizationPercent.toFixed(1)}% utilized · ${dashStats.monthlyFacilityBookingsCount ?? 0} bookings MTD` : dashStats ? "No published opening schedules" : "Facility management", icon: Sofa, href: "/community/resource-booking", tone: "text-cyan-600 bg-cyan-500/10" },
            { title: "Vendor contracts", detail: "Contract terms, renewals and signatures", metric: dashStats?.activeVendorContractsCount != null ? `${dashStats.activeVendorContractsCount} active · ${dashStats.contractsExpiringWithin30DaysCount ?? "—"} renew soon` : dashStats ? `${dashStats.activeVendorsCount} active vendors` : "Contract management", icon: DoorOpen, href: "/vendor-admin/contracts", tone: "text-orange-600 bg-orange-500/10" },
            { title: "Expenses & budgets", detail: "Expense approvals and budget health", metric: dashStats?.currentFinancialYearBudgetAmount != null ? `${dashStats.pendingExpensesCount} pending · ${formatCommunityMoney(dashStats.currentFinancialYearSpentAmount)} / ${formatCommunityMoney(dashStats.currentFinancialYearBudgetAmount)}` : dashStats ? `${dashStats.pendingExpensesCount} pending approvals` : "Finance workspace", icon: CircleDollarSign, href: "/finance/expenses", tone: "text-lime-700 bg-lime-500/10" },
            { title: "Community engagement", detail: "Notices, conversations and feedback", metric: dashStats?.communityPostsLast30DaysCount != null ? `${dashStats.communityPostsLast30DaysCount} posts in 30 days` : dashStats ? `${dashStats.activeNoticesCount} active notices` : "Community feed", icon: HeartHandshake, href: "/feed", tone: "text-pink-600 bg-pink-500/10" },
          ].map(({ title, detail, metric, icon: Icon, href, tone }) => (
            <Link key={title} to={href} className="group rounded-xl border border-border/70 bg-background p-3 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
              <div className="mb-3 flex items-start justify-between gap-2">
                <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${tone}`}><Icon className="h-4 w-4" /></span>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground/60 transition group-hover:text-primary" />
              </div>
              <h2 className="text-xs font-bold leading-tight text-foreground">{title}</h2>
              <p className="mt-1 min-h-8 text-[10px] leading-snug text-muted-foreground">{detail}</p>
              <p className="mt-2 truncate text-[10px] font-semibold text-primary">{metric}</p>
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/70 bg-muted/20 px-4 py-2.5 text-[10px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><Activity className="h-3.5 w-3.5 text-emerald-600" /> Live counts reflect connected community modules</span>
          <Link to="/admin/operations" className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">Open platform health <ArrowUpRight className="h-3 w-3" /></Link>
        </div>
      </section>

      {/* ── Community Overview Stats ── */}
      <div className="flex items-center gap-2.5 bg-card border border-border/80 rounded-xl p-3 sm:p-3.5 shadow-2xs">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shrink-0 shadow-2xs">
          <Activity className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-xs sm:text-sm font-bold text-foreground leading-tight">Community Overview</h2>
          <p className="text-[10px] sm:text-[11px] text-muted-foreground">Live aggregated stats across all modules</p>
        </div>
      </div>

      {dashLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
      ) : dashStats ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-2.5">
            <StatCard label="Total Users" value={dashStats.totalUsers} icon={Users} color="primary" />
            <StatCard label="Verified Users" value={dashStats.verifiedUsersCount} icon={UserCheck} color="success" />
            <StatCard label="Pending KYC" value={dashStats.pendingKycCount} icon={Clock} color="warning" />
            <StatCard label="Active Visitors" value={dashStats.activeVisitorsCount} icon={UserPlus} color="info" />
            <StatCard label="Open Tickets" value={dashStats.openTicketsCount} icon={Ticket} color="danger" />
            <StatCard label="In-Progress Tickets" value={dashStats.inProgressTicketsCount} icon={Ticket} color="warning" />
            <StatCard label="Active Vendors" value={dashStats.activeVendorsCount} icon={Store} color="success" />
            <StatCard label="Pending Work Orders" value={dashStats.pendingWorkOrdersCount} icon={Wrench} color="warning" />
            <StatCard label="Pending Expenses" value={dashStats.pendingExpensesCount} icon={DollarSign} color="danger" />
            <StatCard label="Booking Resources" value={dashStats.totalBookingResourcesCount} icon={BookOpen} color="info" />
            <StatCard label="Content Reports" value={dashStats.pendingContentReportsCount} icon={Flag} color="danger" />
            <StatCard label="Active Events" value={dashStats.activeEventsCount} icon={CalendarDays} color="primary" />
            <StatCard label="Active Notices" value={dashStats.activeNoticesCount} icon={Megaphone} color="primary" />
            {isSuperAdmin && <StatCard label="Total Roles" value={dashStats.totalRolesCount} icon={ShieldCheck} color="info" />}
            {isSuperAdmin && <StatCard label="Communities" value={dashStats.totalCommunitiesCount} icon={Users} color="success" />}
          </div>

          {/* Recent Activities */}
          {dashStats.recentActivities.length > 0 && (
            <div className="bg-card rounded-xl shadow-2xs border border-border/80 overflow-hidden">
              <div className="px-3.5 py-2.5 border-b border-border/60 flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-primary" />
                <h3 className="text-xs font-bold text-foreground">Recent Activity</h3>
              </div>
              <div className="divide-y divide-border/40">
                {dashStats.recentActivities.map((act: RecentActivityItem, i: number) => (
                  <div key={i} className="px-3.5 py-2 flex items-center justify-between hover:bg-input/30 transition-colors">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{act.title}</p>
                        {act.module && (
                          <span className="text-[10px] text-muted-foreground">{act.module}</span>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-3">
                      {formatActivityTime(act.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : null}

      {/* ── KYC Verification Section ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-card border border-border/80 rounded-xl p-3 sm:p-3.5 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shrink-0 shadow-2xs">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-foreground leading-tight">
              KYC Verification &amp; Applicant Review
            </h2>
            <p className="text-[10px] sm:text-[11px] text-muted-foreground">Review, verify and approve community member identity applications</p>
          </div>
        </div>
      </div>

      {/* KYC Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5">
        <StatCard label="Total Apps" value={kycStats.total} icon={UserCheck} color="primary" />
        <StatCard label="Pending" value={kycStats.pending} icon={Clock} color="warning" />
        <StatCard label="Approved" value={kycStats.approved} icon={CheckCircle} color="success" />
        <StatCard label="Rejected" value={kycStats.rejected} icon={XCircle} color="danger" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground w-3.5 h-3.5" />
          <input
            type="text"
            placeholder="Search by applicant name or email..."
            className="w-full pl-8 pr-3 py-1.5 bg-input border border-border/80 rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 shadow-2xs"
          />
        </div>
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar flex-nowrap w-full sm:w-auto">
          <Filter className="w-3 h-3 text-muted-foreground shrink-0 hidden sm:inline mr-1" />
          {(["all", "pending", "approved", "rejected"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all shrink-0 cursor-pointer border ${
                filterStatus === status
                  ? "bg-primary text-white border-transparent shadow-2xs"
                  : "bg-card text-muted-foreground border-border/80 hover:text-foreground hover:bg-input/60"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Applications List */}
      <div className="bg-card rounded-xl shadow-2xs border border-border/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-input/40 border-b border-border/60 text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
              <tr>
                <th className="px-3.5 py-2.5">Applicant</th>
                <th className="px-3.5 py-2.5">Community</th>
                <th className="px-3.5 py-2.5">Type</th>
                <th className="px-3.5 py-2.5">Submitted</th>
                <th className="px-3.5 py-2.5">Status</th>
                <th className="px-3.5 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 text-foreground">
              {kycLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground text-xs font-medium">
                    <Loader2 className="w-4 h-4 animate-spin mx-auto mb-1.5 text-primary" />
                    Loading applications...
                  </td>
                </tr>
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground text-xs font-medium">
                    No applications found matching the criteria.
                  </td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr key={app.id} className="hover:bg-input/30 transition-colors">
                    <td className="px-3.5 py-2 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-[11px] shrink-0 shadow-2xs">
                          {app.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-2.5">
                          <div className="text-xs font-semibold text-foreground leading-tight">{app.fullName}</div>
                          <div className="text-[10px] text-muted-foreground">{app.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3.5 py-2 whitespace-nowrap">
                      <div className="text-xs font-semibold text-foreground">{app.communityCode}</div>
                      <div className="text-[10px] text-muted-foreground capitalize">{app.communityType}</div>
                    </td>
                    <td className="px-3.5 py-2 whitespace-nowrap">
                      <span className="px-2 py-0.5 text-[9.5px] font-bold bg-primary/10 text-primary border border-primary/20 rounded-md capitalize">
                        {app.userType}
                      </span>
                    </td>
                    <td className="px-3.5 py-2 whitespace-nowrap text-[11px] text-muted-foreground font-medium">
                      {new Date(app.submittedAt).toLocaleDateString()}
                    </td>
                    <td className="px-3.5 py-2 whitespace-nowrap">
                      {app.status === "pending" && (
                        <span className="px-2 py-0.5 text-[9.5px] font-bold bg-warning/10 text-warning border border-warning/25 rounded-md">
                          Pending
                        </span>
                      )}
                      {app.status === "approved" && (
                        <span className="px-2 py-0.5 text-[9.5px] font-bold bg-success/10 text-success border border-success/25 rounded-md">
                          Approved
                        </span>
                      )}
                      {app.status === "rejected" && (
                        <span className="px-2 py-0.5 text-[9.5px] font-bold bg-danger/10 text-danger border border-danger/25 rounded-md">
                          Rejected
                        </span>
                      )}
                    </td>
                    <td className="px-3.5 py-2 whitespace-nowrap text-right text-xs font-semibold">
                      <button
                        onClick={() => setSelectedApp(app)}
                        className="text-primary hover:text-primary/80 inline-flex items-center gap-1 ml-auto cursor-pointer px-2 py-1 hover:bg-primary/10 rounded-md transition-colors text-[11px] font-bold"
                      >
                        <Eye className="w-3 h-3" />
                        Review
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-2xs" onClick={() => setSelectedApp(null)}>
          <div className="bg-card rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-border" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-card border-b border-border/80 px-4 py-3 flex items-center justify-between z-10">
              <h2 className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-primary" /> Application Review
              </h2>
              <button
                onClick={() => setSelectedApp(null)}
                className="p-1 text-muted-foreground hover:text-foreground hover:bg-input rounded-md transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-4 text-xs">
              {/* Applicant Info */}
              <div className="bg-input/40 rounded-xl p-3 border border-border/60">
                <h3 className="font-bold text-xs text-foreground mb-2.5">Applicant Details</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-muted-foreground">Full Name:</span>
                    <p className="font-semibold text-foreground truncate">{selectedApp.fullName}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground">Email:</span>
                    <p className="font-semibold text-foreground truncate">{selectedApp.email}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground">Phone:</span>
                    <p className="font-semibold text-foreground font-mono truncate">{selectedApp.phoneNumber}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground">Unit / Address:</span>
                    <p className="font-semibold text-foreground truncate">{selectedApp.address}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground">Community:</span>
                    <p className="font-semibold text-foreground truncate">{selectedApp.communityCode}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground">Account Type:</span>
                    <p className="font-semibold text-foreground capitalize">{selectedApp.userType}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground">ID Type:</span>
                    <p className="font-semibold text-foreground truncate">{selectedApp.idType}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground">ID Number:</span>
                    <p className="font-semibold text-foreground font-mono truncate">{selectedApp.idNumber}</p>
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div>
                <h3 className="font-bold text-xs text-foreground mb-2">Verification Documents</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {(["idFront", "idBack", "selfie"] as const).map((key) => {
                    const url = selectedApp.documents[key];
                    const label = key === "idFront" ? "ID Front Side" : key === "idBack" ? "ID Back Side" : "Selfie Verification";
                    return (
                      <div key={key} className="border border-border/80 rounded-lg overflow-hidden bg-card">
                        {url
                          ? <img src={url} alt={label} className="w-full h-32 object-cover" />
                          : <div className="w-full h-32 flex items-center justify-center bg-muted text-muted-foreground text-xs">Not uploaded</div>
                        }
                        <div className="p-1.5 bg-input/40 text-center text-[10.5px] font-semibold text-muted-foreground">{label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Warning */}
              {selectedApp.status === "pending" && (
                <div className="bg-warning/5 border border-warning/20 rounded-lg p-2.5 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-warning mt-0.5 shrink-0" />
                  <div className="text-[11px] text-foreground">
                    <p className="font-bold text-warning mb-0.5">Verification Checklist:</p>
                    <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                      <li>Verify ID documents are clear and valid</li>
                      <li>Confirm selfie matches ID photo</li>
                      <li>Check community code is valid for this user</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Actions */}
              {selectedApp.status === "pending" && (
                <div className="flex gap-2 pt-2 border-t border-border/60">
                  <button
                    onClick={() => handleReject(selectedApp.id)}
                    className="flex-1 py-1.5 px-3 bg-danger/10 hover:bg-danger/15 text-danger font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs border border-danger/20"
                  >
                    <UserX className="w-3.5 h-3.5" />
                    Reject Application
                  </button>
                  <button
                    onClick={() => handleApprove(selectedApp.id)}
                    className="flex-1 py-1.5 px-3 bg-primary hover:bg-primary/90 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    Approve Application
                  </button>
                </div>
              )}

              {selectedApp.status !== "pending" && (
                <div className="text-center py-2 border-t border-border/60">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold ${
                    selectedApp.status === "approved"
                      ? "bg-success/10 text-success border border-success/20"
                      : "bg-danger/10 text-danger border border-danger/20"
                  }`}>
                    {selectedApp.status === "approved" ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5" />
                        Application Approved
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5" />
                        Application Rejected
                      </>
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
