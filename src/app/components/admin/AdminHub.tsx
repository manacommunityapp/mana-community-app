import { useState, useEffect, useCallback } from "react";
import {
  LayoutDashboard,
  Users,
  Package,
  ShieldCheck,
  Building2,
  FileSpreadsheet,
  MapPin,
  ClipboardList,
  Dumbbell,
  UserPlus,
  UserCheck,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  Activity,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  Loader2,
  Trophy,
  Crown,
  LogOut,
  Eye,
  UserX,
  Filter,
  Search,
  AlertTriangle,
  UploadCloud,
} from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { userService } from "../../../services/userService";
import { venueService } from "../../../services/venueService";
import { sportsService } from "../../../services/sportsService";
import { AdminDashboard } from "./AdminDashboard";
import { AdminCreateUser } from "./AdminCreateUser";
import { AdminBulkUpload } from "./AdminBulkUpload";
import { AdminVenues } from "./AdminVenues";
import { AdminCommunity } from "./AdminCommunity";
import { AdminRoleManagement } from "./AdminRoleManagement";
import { LogsDashboard } from "./LogsDashboard";
import { AuditTrail } from "./AuditTrail";
import { AdminSportsMeta } from "./AdminSportsMeta";
import { ExpenseUpload } from "../assets/ExpenseUpload";
import { TreasurerQueue } from "../assets/TreasurerQueue";
import { assetService } from "../../../services/assetService";
import type { Asset } from "../../../services/assetService";
import type { UserResponse } from "../../../types/api";
import type { Venue } from "../../../types/api";

// ── Types ─────────────────────────────────────────────────────────────────────
interface AdminOverviewData {
  totalUsers: number;
  activeUsers: number;
  pendingKyc: number;
  approvedKyc: number;
  rejectedKyc: number;
  totalVenues: number;
  totalSports: number;
  roleBreakdown: Record<string, number>;
}

// ── Tab config ────────────────────────────────────────────────────────────────
const TAB_ITEMS = [
  { id: "overview",   label: "Overview",      icon: LayoutDashboard },
  { id: "users",      label: "Users",         icon: Users },
  { id: "kyc",        label: "KYC Review",    icon: ShieldCheck },
  { id: "roles",      label: "Roles",         icon: Crown },
  { id: "bulk",       label: "Bulk Upload",   icon: FileSpreadsheet },
  { id: "community",  label: "Community",     icon: Building2 },
] as const;

type TabId = (typeof TAB_ITEMS)[number]["id"];

// ── Skeleton ──────────────────────────────────────────────────────────────────
function KpiSkeleton() {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-lg animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-9 w-9 rounded-xl bg-input" />
        <div className="h-4 w-16 rounded-full bg-input" />
      </div>
      <div className="h-8 w-20 rounded bg-input mb-1" />
      <div className="h-3 w-24 rounded bg-input" />
    </div>
  );
}

// ── Quick action card ─────────────────────────────────────────────────────────
function QuickAction({
  icon: Icon,
  label,
  desc,
  color,
  bg,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  desc: string;
  color: string;
  bg: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group bg-card border border-border rounded-2xl p-4 shadow-sm hover:shadow-lg transition-all duration-200 text-left hover:border-primary/40 cursor-pointer w-full"
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
        <span className="font-semibold text-sm text-foreground">{label}</span>
        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <p className="text-xs text-muted-foreground pl-12">{desc}</p>
    </button>
  );
}

// ── Role badge ────────────────────────────────────────────────────────────────
function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    SUPER_ADMIN: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    COMMUNITY_ADMIN: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    ADMIN: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    SPORTS_ADMIN: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    MEMBER: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    VENDOR: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  };
  const style = styles[role] || styles.MEMBER;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${style}`}>
      {role.replace(/_/g, " ")}
    </span>
  );
}

// ── KYC badge ────────────────────────────────────────────────────────────────
function KycBadge({ status }: { status: string }) {
  if (status === "APPROVED")
    return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-success/10 text-success border border-success/20">Approved</span>;
  if (status === "PENDING")
    return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-warning/10 text-warning border border-warning/20">Pending</span>;
  if (status === "REJECTED")
    return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-danger/10 text-danger border border-danger/20">Rejected</span>;
  return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-muted-foreground">{status}</span>;
}

// ── Overview Tab ──────────────────────────────────────────────────────────────
function OverviewTab({
  data,
  loading,
  error,
  onRetry,
  onNavigate,
}: {
  data: AdminOverviewData | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onNavigate: (tab: TabId) => void;
}) {
  const navigate = useNavigate();

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="bg-card border border-border rounded-2xl p-8 shadow-lg text-center max-w-md">
          <div className="h-14 w-14 rounded-2xl bg-danger/10 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-7 w-7 text-danger" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Failed to Load Overview</h3>
          <p className="text-sm text-muted-foreground mb-5">{error}</p>
          <button onClick={onRetry} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-all cursor-pointer">
            <RefreshCw className="h-4 w-4" />Retry
          </button>
        </div>
      </div>
    );
  }

  const kpis = [
    {
      label: "Total Users",
      value: loading ? "—" : String(data?.totalUsers ?? 0),
      sub: loading ? "" : `${data?.activeUsers ?? 0} active`,
      icon: Users,
      color: "#818cf8",
      bg: "rgba(129,140,248,0.12)",
    },
    {
      label: "Pending KYC",
      value: loading ? "—" : String(data?.pendingKyc ?? 0),
      sub: "Awaiting review",
      icon: Clock,
      color: "#fbbf24",
      bg: "rgba(251,191,36,0.12)",
    },
    {
      label: "Approved KYC",
      value: loading ? "—" : String(data?.approvedKyc ?? 0),
      sub: `${loading ? "—" : data?.rejectedKyc ?? 0} rejected`,
      icon: CheckCircle,
      color: "#34d399",
      bg: "rgba(52,211,153,0.12)",
    },
    {
      label: "Venues",
      value: loading ? "—" : String(data?.totalVenues ?? 0),
      sub: `${loading ? "—" : data?.totalSports ?? 0} sport types`,
      icon: MapPin,
      color: "#a78bfa",
      bg: "rgba(167,139,250,0.12)",
    },
  ];

  // Role breakdown rows
  const roleRows = data
    ? Object.entries(data.roleBreakdown)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
    : [];

  return (
    <div className="space-y-6 animate-fade-in-up stagger-1">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? [1, 2, 3, 4].map((i) => <KpiSkeleton key={i} />)
          : kpis.map((k) => (
              <div key={k.label} className="bg-card border border-border rounded-2xl p-5 shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: k.bg }}>
                    <k.icon className="h-4 w-4" style={{ color: k.color }} />
                  </div>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-success/10 text-success">{k.sub}</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{k.value}</p>
                <p className="text-xs mt-0.5 text-muted-foreground">{k.label}</p>
              </div>
            ))}
      </div>

      {/* Role breakdown + Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Role breakdown */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-lg">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Crown className="h-4 w-4 text-warning" />
            User Role Distribution
          </h3>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse flex items-center gap-3">
                  <div className="h-4 w-24 rounded bg-input" />
                  <div className="flex-1 h-2 rounded-full bg-input" />
                  <div className="h-4 w-8 rounded bg-input" />
                </div>
              ))}
            </div>
          ) : roleRows.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No user data</p>
          ) : (
            <div className="space-y-3">
              {roleRows.map(([role, count]) => {
                const pct = data ? Math.round((count / data.totalUsers) * 100) : 0;
                return (
                  <div key={role} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-28 shrink-0 truncate">{role.replace(/_/g, " ")}</span>
                    <div className="flex-1 h-2 bg-input rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-foreground w-8 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* KYC Status summary */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-lg">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            KYC Status Overview
          </h3>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-input" />
                  <div className="flex-1 h-2 rounded-full bg-input" />
                  <div className="h-4 w-10 rounded bg-input" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {[
                { label: "Approved", value: data?.approvedKyc ?? 0, color: "#34d399", bg: "rgba(52,211,153,0.12)", icon: CheckCircle },
                { label: "Pending", value: data?.pendingKyc ?? 0, color: "#fbbf24", bg: "rgba(251,191,36,0.12)", icon: Clock },
                { label: "Rejected", value: data?.rejectedKyc ?? 0, color: "#f87171", bg: "rgba(248,113,113,0.12)", icon: XCircle },
              ].map((item) => {
                const total = (data?.approvedKyc ?? 0) + (data?.pendingKyc ?? 0) + (data?.rejectedKyc ?? 0);
                const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
                return (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: item.bg }}>
                      <item.icon className="h-4 w-4" style={{ color: item.color }} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">{item.label}</span>
                        <span className="text-xs font-semibold text-foreground">{item.value} ({pct}%)</span>
                      </div>
                      <div className="h-1.5 bg-input rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: item.color }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {!loading && (data?.pendingKyc ?? 0) > 0 && (
            <button
              onClick={() => onNavigate("kyc")}
              className="mt-4 w-full py-2 rounded-xl border border-warning/30 bg-warning/5 text-warning text-xs font-semibold hover:bg-warning/10 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              Review {data?.pendingKyc} Pending Applications
            </button>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-lg">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <QuickAction icon={UserPlus} label="Create User" desc="Add a new community member" color="#818cf8" bg="rgba(129,140,248,0.12)" onClick={() => onNavigate("users")} />
          <QuickAction icon={FileSpreadsheet} label="Bulk Upload" desc="Import users via CSV/Excel" color="#a78bfa" bg="rgba(167,139,250,0.12)" onClick={() => onNavigate("bulk")} />
          <QuickAction icon={Building2} label="Community" desc="Manage community settings" color="#34d399" bg="rgba(52,211,153,0.12)" onClick={() => onNavigate("community")} />
          <QuickAction icon={Crown} label="Roles & Permissions" desc="Configure access control" color="#fbbf24" bg="rgba(251,191,36,0.12)" onClick={() => onNavigate("roles")} />
          <QuickAction icon={UploadCloud} label="OCR Invoice Upload" desc="Volunteers: 1-click snap & upload receipt" color="#f472b6" bg="rgba(244,114,182,0.12)" onClick={() => navigate("/inventory?tab=upload")} />
          <QuickAction icon={ClipboardList} label="Approval Queue" desc="Treasurers: Audit & Quick-settle invoices" color="#38bdf8" bg="rgba(56,189,248,0.12)" onClick={() => navigate("/inventory?tab=approve")} />
        </div>
      </div>
    </div>
  );
}

// ── Users Tab ─────────────────────────────────────────────────────────────────
function UsersTab({ users, loading }: { users: UserResponse[]; loading: boolean }) {
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterKyc, setFilterKyc] = useState("all");

  const roles = ["all", ...Array.from(new Set(users.map((u) => u.role))).sort()];
  const kycStatuses = ["all", "APPROVED", "PENDING", "REJECTED"];

  const filtered = users.filter((u) => {
    const matchSearch =
      !search ||
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === "all" || u.role === filterRole;
    const matchKyc = filterKyc === "all" || u.kycStatus === filterKyc;
    return matchSearch && matchRole && matchKyc;
  });

  return (
    <div className="space-y-4 animate-fade-in-up stagger-1">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-input border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="bg-input border border-border rounded-xl text-xs px-3 py-2 text-foreground focus:outline-none cursor-pointer"
          >
            {roles.map((r) => (
              <option key={r} value={r}>{r === "all" ? "All Roles" : r.replace(/_/g, " ")}</option>
            ))}
          </select>
          <select
            value={filterKyc}
            onChange={(e) => setFilterKyc(e.target.value)}
            className="bg-input border border-border rounded-xl text-xs px-3 py-2 text-foreground focus:outline-none cursor-pointer"
          >
            {kycStatuses.map((s) => (
              <option key={s} value={s}>{s === "all" ? "All KYC" : s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary pill */}
      <p className="text-xs text-muted-foreground">
        Showing <span className="font-semibold text-foreground">{filtered.length}</span> of <span className="font-semibold text-foreground">{users.length}</span> users
      </p>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl shadow-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">No users found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-input/40">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">User</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Role</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">KYC</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filtered.slice(0, 100).map((u) => (
                  <tr key={u.id} className="hover:bg-input/30 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {u.fullName?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <p className="font-medium text-foreground truncate max-w-[160px]">{u.fullName}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[160px]">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3"><RoleBadge role={u.role} /></td>
                    <td className="px-5 py-3"><KycBadge status={u.kycStatus} /></td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex h-2 w-2 rounded-full ${u.isActive !== false ? "bg-success" : "bg-muted-foreground"}`} />
                      <span className="text-xs text-muted-foreground ml-2">{u.isActive !== false ? "Active" : "Inactive"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}



// ── Main AdminHub Component ───────────────────────────────────────────────────
export function AdminHub() {
  const { user, isAdmin, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  // Overview data
  const [overviewData, setOverviewData] = useState<AdminOverviewData | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState<string | null>(null);

  // Users data (shared between Overview + Users tab)
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);

  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const canManageCommunities = isSuperAdmin || hasPermission("Manage Communities");

  // ── Fetch all data ──────────────────────────────────────────────────────────
  const fetchOverview = useCallback(async () => {
    setOverviewLoading(true);
    setOverviewError(null);
    try {
      const [allUsers, venues, sportsMeta] = await Promise.all([
        userService.getAllUsers().catch(() => [] as UserResponse[]),
        venueService.getVenues(user?.communityId ?? null).catch(() => [] as any[]),
        sportsService.getSportsMeta().catch(() => [] as any[]),
      ]);

      let usersList: UserResponse[] = [];
      if (allUsers) {
        if (Array.isArray(allUsers)) {
          usersList = allUsers;
        } else if (typeof allUsers === "object" && Array.isArray((allUsers as any).content)) {
          usersList = (allUsers as any).content;
        }
      }

      setUsers(usersList);
      setUsersLoading(false);

      const roleBreakdown: Record<string, number> = {};
      usersList.forEach((u) => {
        if (u.role) {
          roleBreakdown[u.role] = (roleBreakdown[u.role] || 0) + 1;
        }
      });

      setOverviewData({
        totalUsers: usersList.length,
        activeUsers: usersList.filter((u) => u.isActive !== false).length,
        pendingKyc: usersList.filter((u) => u.kycStatus === "PENDING").length,
        approvedKyc: usersList.filter((u) => u.kycStatus === "APPROVED" || u.kycStatus === "VERIFIED" || u.kycStatus === "approved").length,
        rejectedKyc: usersList.filter((u) => u.kycStatus === "REJECTED" || u.kycStatus === "rejected").length,
        totalVenues: Array.isArray(venues) ? venues.length : 0,
        totalSports: Array.isArray(sportsMeta) ? sportsMeta.length : 0,
        roleBreakdown,
      });
    } catch (err: any) {
      setOverviewError(err?.message || "Failed to load overview data");
    } finally {
      setOverviewLoading(false);
    }
  }, [user?.communityId]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="bg-card border border-border rounded-2xl p-8 text-center">
          <ShieldCheck className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-foreground font-semibold">Access Denied</p>
          <p className="text-sm text-muted-foreground mt-1">Administrative privileges required.</p>
        </div>
      </div>
    );
  }

  // Filter tabs based on permissions
  const visibleTabs = TAB_ITEMS.filter((t) => {
    if (t.id === "kyc") return isSuperAdmin || isAdmin;
    if (t.id === "community") return canManageCommunities;
    if (t.id === "roles") return isSuperAdmin || hasPermission("Manage Roles");
    return true;
  });

  // Pending badge count for KYC tab
  const pendingKycCount = overviewData?.pendingKyc ?? 0;

  return (
    <div className="flex flex-col h-full min-h-screen bg-background">
      {/* ── Header ── */}
      <div className="border-b border-border bg-card/60 backdrop-blur px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                <ShieldCheck className="h-4 w-4 text-white" />
              </div>
              Admin Control Center
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5 ml-10">
              {user?.role?.replace(/_/g, " ")} · {user?.fullName}
            </p>
          </div>
          {!overviewLoading && overviewData && (
            <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
                {overviewData.activeUsers} active users
              </span>
              {pendingKycCount > 0 && (
                <span
                  onClick={() => setActiveTab("kyc")}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-warning/10 text-warning border border-warning/20 cursor-pointer hover:bg-warning/20 transition-colors"
                >
                  <Clock className="h-3 w-3" />
                  {pendingKycCount} pending KYC
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── Tabs ── */}
        <div className="flex items-center gap-1 mt-4 overflow-x-auto scrollbar-none">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer relative ${
                  isActive
                    ? "bg-primary text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-input"
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {tab.label}
                {tab.id === "kyc" && pendingKycCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-warning text-[9px] font-bold text-white flex items-center justify-center">
                    {pendingKycCount > 9 ? "9+" : pendingKycCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Tab Content ── */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === "overview" && (
          <OverviewTab
            data={overviewData}
            loading={overviewLoading}
            error={overviewError}
            onRetry={fetchOverview}
            onNavigate={setActiveTab}
          />
        )}
        {activeTab === "users" && (
          <UsersTab users={users} loading={usersLoading} />
        )}
        {activeTab === "kyc" && <AdminDashboard />}
        {activeTab === "roles" && <AdminRoleManagement />}
        {activeTab === "bulk" && <AdminBulkUpload />}
        {activeTab === "community" && <AdminCommunity />}
      </div>
    </div>
  );
}
