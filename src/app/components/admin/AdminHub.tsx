import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router";
import {
  LayoutDashboard,
  Users,
  Package,
  Shield,
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
  ToggleLeft,
  Megaphone,
  Mail,
  MailOpen,
} from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { useNavigate } from "react-router";
import { sortRoleStrings } from "../../../utils/roleUtils";

import { showSuccess, showError } from "../../../utils/ToastUtils";
const toast = {
  success: (msg: string) => showSuccess(msg),
  error: (msg: string) => showError(msg),
};
import { userService } from "../../../services/common/userService";
import { venueService } from "../../../services/bookings/venueService";
import { sportsService } from "../../../services/sports/sportsService";
import { AdminDashboard } from "./AdminDashboard";
import { AdminCreateUser } from "./AdminCreateUser";
import { AdminBulkUpload } from "./AdminBulkUpload";
import { AdminVenues } from "./AdminVenues";
import { AdminCommunity } from "./AdminCommunity";
import { AdminDirectory } from "./AdminDirectory";
import { AdminRoleManagement } from "./AdminRoleManagement";
import { AdminAccessManagement } from "./AdminAccessManagement";
import { SmartDashboard } from "../commons/SmartDashboard";
import { LogsDashboard } from "./LogsDashboard";
import { AuditTrail } from "./AuditTrail";
import { AdminSportsMeta } from "./AdminSportsMeta";
import { EmailTemplatesTab } from "./EmailTemplatesTab";
import { AnnouncementsPlanner } from "../architecture/AnnouncementsPlanner";
import { EmailTemplateBuilder } from "./EmailTemplateBuilder";
import { EmailDeliveryLogTab } from "./EmailDeliveryLogTab";
import { ExpenseUpload } from "../assets/ExpenseUpload";
import { TreasurerQueue } from "../assets/TreasurerQueue";
import { assetService } from "../../../services/inventory/assetService";
import { communityService } from "../../../services/community/communityService";
import type { Asset } from "../../../services/inventory/assetService";
import type { UserResponse, CommunityResponse } from "../../../types/api";
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
  { id: "dashboards", label: "Dashboard Modes", icon: LayoutDashboard },
  { id: "users-roles", label: "Users & Roles", icon: Users },
  { id: "access-roles", label: "Access & Roles", icon: Shield },
  { id: "directory",  label: "Directory",     icon: Shield },
  { id: "kyc",        label: "KYC Review",    icon: ShieldCheck },
  { id: "modules",    label: "Modules",       icon: ToggleLeft },
  { id: "bulk",       label: "Bulk Upload",   icon: FileSpreadsheet },
  { id: "community",  label: "Community",     icon: Building2 },
  { id: "announcements", label: "Announcements", icon: Megaphone },
  { id: "email-gallery", label: "Email Templates", icon: MailOpen },
  { id: "email-templates", label: "Email Builder", icon: Mail },
  { id: "email-logs", label: "Email Delivery Logs", icon: Clock },
] as const;

type TabId = (typeof TAB_ITEMS)[number]["id"];

// ── Skeleton ──────────────────────────────────────────────────────────────────
function KpiSkeleton() {
  return (
    <div className="bg-card border border-border/70 rounded-xl p-3.5 sm:p-4 shadow-2xs animate-pulse">
      <div className="flex items-center justify-between mb-2.5">
        <div className="h-7.5 w-7.5 rounded-lg bg-input" />
        <div className="h-4 w-14 rounded-md bg-input" />
      </div>
      <div className="h-6 w-16 rounded bg-input mb-1" />
      <div className="h-3 w-20 rounded bg-input" />
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
      className="group bg-card border border-border/70 rounded-xl p-3 sm:p-3.5 shadow-2xs hover:shadow-sm hover:border-primary/40 hover:bg-card/90 transition-all duration-200 text-left cursor-pointer w-full flex items-center justify-between gap-2.5"
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: bg }}>
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-bold text-xs sm:text-[13px] text-foreground truncate group-hover:text-primary transition-colors">{label}</div>
          <p className="text-[11px] text-muted-foreground truncate">{desc}</p>
        </div>
      </div>
      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
    </button>
  );
}

// ── Role badge ────────────────────────────────────────────────────────────────
function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    SUPER_ADMIN: "bg-rose-500/10 text-rose-500 border-rose-500/20",
    COMMUNITY_ADMIN: "bg-violet-500/10 text-violet-500 border-violet-500/20",
    ADMIN: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
    SPORTS_ADMIN: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    MEMBER: "bg-slate-500/10 text-slate-500 border-slate-500/20",
    VENDOR: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  };
  const style = styles[role] || styles.MEMBER;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${style}`}>
      {role.replace(/_/g, " ")}
    </span>
  );
}

// ── KYC badge ────────────────────────────────────────────────────────────────
function KycBadge({ status }: { status: string }) {
  if (status === "APPROVED")
    return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-success/10 text-success border border-success/20">Approved</span>;
  if (status === "PENDING")
    return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-warning/10 text-warning border border-warning/20">Pending</span>;
  if (status === "REJECTED")
    return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-danger/10 text-danger border border-danger/20">Rejected</span>;
  return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-muted text-muted-foreground">{status}</span>;
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
      <div className="flex flex-col items-center justify-center py-12">
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm text-center max-w-sm w-full">
          <div className="h-11 w-11 rounded-xl bg-danger/10 flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="h-5 w-5 text-danger" />
          </div>
          <h3 className="text-sm font-bold text-foreground mb-1">Failed to Load Overview</h3>
          <p className="text-xs text-muted-foreground mb-4">{error}</p>
          <button onClick={onRetry} className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-all cursor-pointer shadow-2xs">
            <RefreshCw className="h-3.5 w-3.5" /> Retry
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
      color: "#6366f1",
      bg: "rgba(99,102,241,0.12)",
    },
    {
      label: "Pending KYC",
      value: loading ? "—" : String(data?.pendingKyc ?? 0),
      sub: "Awaiting review",
      icon: Clock,
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.12)",
    },
    {
      label: "Approved KYC",
      value: loading ? "—" : String(data?.approvedKyc ?? 0),
      sub: `${loading ? "—" : data?.rejectedKyc ?? 0} rejected`,
      icon: CheckCircle,
      color: "#10b981",
      bg: "rgba(16,185,129,0.12)",
    },
    {
      label: "Venues",
      value: loading ? "—" : String(data?.totalVenues ?? 0),
      sub: `${loading ? "—" : data?.totalSports ?? 0} sport types`,
      icon: MapPin,
      color: "#8b5cf6",
      bg: "rgba(139,92,246,0.12)",
    },
  ];

  // Role breakdown rows
  const roleRows = data
    ? Object.entries(data.roleBreakdown)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
    : [];

  return (
    <div className="space-y-3.5 sm:space-y-4 animate-fade-in-up">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        {loading
          ? [1, 2, 3, 4].map((i) => <KpiSkeleton key={i} />)
          : kpis.map((k) => (
              <div key={k.label} className="bg-card border border-border/80 rounded-xl p-3 sm:p-3.5 shadow-2xs hover:border-primary/40 hover:shadow-xs transition-all">
                <div className="flex items-center justify-between mb-2">
                  <div className="h-7.5 w-7.5 rounded-lg flex items-center justify-center shrink-0" style={{ background: k.bg }}>
                    <k.icon className="h-3.5 w-3.5" style={{ color: k.color }} />
                  </div>
                  {k.sub && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-success/10 text-success border border-success/15 truncate max-w-[110px]">
                      {k.sub}
                    </span>
                  )}
                </div>
                <p className="text-xl sm:text-2xl font-black text-foreground tracking-tight leading-none">{k.value}</p>
                <p className="text-[11px] sm:text-xs font-semibold mt-1 text-muted-foreground">{k.label}</p>
              </div>
            ))}
      </div>

      {/* Role breakdown + KYC Status summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 sm:gap-4">
        {/* Role breakdown */}
        <div className="bg-card border border-border/80 rounded-xl p-3.5 sm:p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-xs sm:text-sm text-foreground flex items-center gap-1.5">
              <Crown className="h-4 w-4 text-warning" />
              User Role Distribution
            </h3>
            {data && data.totalUsers > 0 && (
              <span className="text-[11px] font-semibold text-muted-foreground">
                {Object.keys(data.roleBreakdown).length} roles
              </span>
            )}
          </div>
          {loading ? (
            <div className="space-y-2.5 py-1">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse flex items-center gap-2.5">
                  <div className="h-3 w-20 rounded bg-input" />
                  <div className="flex-1 h-1.5 rounded-full bg-input" />
                  <div className="h-3 w-6 rounded bg-input" />
                </div>
              ))}
            </div>
          ) : roleRows.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">No user data available</p>
          ) : (
            <div className="space-y-2">
              {roleRows.map(([role, count]) => {
                const pct = data && data.totalUsers > 0 ? Math.round((count / data.totalUsers) * 100) : 0;
                return (
                  <div key={role} className="flex items-center gap-2.5 text-xs py-0.5">
                    <span className="text-[11px] font-medium text-muted-foreground w-24 sm:w-28 shrink-0 truncate">
                      {role.replace(/_/g, " ")}
                    </span>
                    <div className="flex-1 h-1.5 bg-input rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
                        style={{ width: `${Math.max(pct, 3)}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-bold text-foreground w-12 text-right shrink-0">
                      {count} <span className="text-[10px] font-normal text-muted-foreground">({pct}%)</span>
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* KYC Status summary */}
        <div className="bg-card border border-border/80 rounded-xl p-3.5 sm:p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-xs sm:text-sm text-foreground flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-primary" />
                KYC Status Overview
              </h3>
              {data && (
                <span className="text-[11px] font-semibold text-muted-foreground">
                  {(data.approvedKyc + data.pendingKyc + data.rejectedKyc)} records
                </span>
              )}
            </div>
            {loading ? (
              <div className="space-y-3 py-1">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-lg bg-input" />
                    <div className="flex-1 h-1.5 rounded-full bg-input" />
                    <div className="h-3 w-8 rounded bg-input" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2.5">
                {[
                  { label: "Approved", value: data?.approvedKyc ?? 0, color: "#10b981", bg: "rgba(16,185,129,0.12)", icon: CheckCircle },
                  { label: "Pending", value: data?.pendingKyc ?? 0, color: "#f59e0b", bg: "rgba(245,158,11,0.12)", icon: Clock },
                  { label: "Rejected", value: data?.rejectedKyc ?? 0, color: "#ef4444", bg: "rgba(239,68,68,0.12)", icon: XCircle },
                ].map((item) => {
                  const total = (data?.approvedKyc ?? 0) + (data?.pendingKyc ?? 0) + (data?.rejectedKyc ?? 0);
                  const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
                  return (
                    <div key={item.label} className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: item.bg }}>
                        <item.icon className="h-3.5 w-3.5" style={{ color: item.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[11px] font-medium text-muted-foreground">{item.label}</span>
                          <span className="text-[11px] font-bold text-foreground">{item.value} <span className="text-[10px] font-normal text-muted-foreground">({pct}%)</span></span>
                        </div>
                        <div className="h-1.5 bg-input rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(pct, item.value > 0 ? 3 : 0)}%`, background: item.color }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          {!loading && (data?.pendingKyc ?? 0) > 0 && (
            <button
              onClick={() => onNavigate("kyc")}
              className="mt-3 w-full py-1.5 px-3 rounded-lg border border-warning/30 bg-warning/5 text-warning text-xs font-bold hover:bg-warning/10 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              Review {data?.pendingKyc} Pending KYC Applications
            </button>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-card border border-border/80 rounded-xl p-3.5 sm:p-4 shadow-2xs">
        <h3 className="font-bold text-xs sm:text-sm text-foreground mb-3 flex items-center gap-1.5">
          <Activity className="h-4 w-4 text-primary" />
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-2.5">
          <QuickAction icon={UserPlus} label="Create User" desc="Add a new community member" color="#6366f1" bg="rgba(99,102,241,0.12)" onClick={() => onNavigate("users-roles")} />
          <QuickAction icon={FileSpreadsheet} label="Bulk Upload" desc="Import users via CSV/Excel" color="#8b5cf6" bg="rgba(139,92,246,0.12)" onClick={() => onNavigate("bulk")} />
          <QuickAction icon={Building2} label="Community" desc="Manage community settings" color="#10b981" bg="rgba(16,185,129,0.12)" onClick={() => onNavigate("community")} />
          <QuickAction icon={Crown} label="Roles & Permissions" desc="Configure access control" color="#f59e0b" bg="rgba(245,158,11,0.12)" onClick={() => onNavigate("users-roles")} />
          <QuickAction icon={UploadCloud} label="OCR Invoice Upload" desc="Volunteers: 1-click snap & upload receipt" color="#ec4899" bg="rgba(236,72,153,0.12)" onClick={() => navigate("/inventory?tab=upload")} />
          <QuickAction icon={ClipboardList} label="Approval Queue" desc="Treasurers: Audit & Quick-settle invoices" color="#0ea5e9" bg="rgba(14,165,233,0.12)" onClick={() => navigate("/inventory?tab=approve")} />
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

  const roles = ["all", ...sortRoleStrings(Array.from(new Set(users.map((u) => u.role))))];
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



// ── All available feature modules ────────────────────────────────────────────
const ALL_MODULES = [
  { key: "COMMUNITY_FEED", label: "Community Feed",   icon: Users,        color: "#60a5fa", bg: "rgba(96,165,250,0.12)" },
  { key: "SPORTS",          label: "Sports",           icon: Trophy,       color: "#34d399", bg: "rgba(52,211,153,0.12)" },
  { key: "MARKETPLACE",     label: "Marketplace",      icon: Package,      color: "#818cf8", bg: "rgba(129,140,248,0.12)" },
  { key: "VISITORS",        label: "Visitors",         icon: Users,        color: "#a78bfa", bg: "rgba(167,139,250,0.12)" },
  { key: "NOTICES",         label: "Notices",          icon: AlertCircle,  color: "#fbbf24", bg: "rgba(251,191,36,0.12)" },
  { key: "BOOKINGS",        label: "Bookings",         icon: Building2,    color: "#38bdf8", bg: "rgba(56,189,248,0.12)" },
  { key: "HELPDESK",        label: "Helpdesk",         icon: ClipboardList,color: "#f472b6", bg: "rgba(244,114,182,0.12)" },
  { key: "POLLS",           label: "Polls",            icon: Activity,     color: "#fb923c", bg: "rgba(251,146,60,0.12)" },
  { key: "JOBS",            label: "Jobs & Referrals",  icon: Dumbbell,    color: "#4ade80", bg: "rgba(74,222,128,0.12)" },
  { key: "EVENTS",          label: "Events",           icon: Clock,        color: "#c084fc", bg: "rgba(192,132,252,0.12)" },
  { key: "COMMUNITY_MGMT",  label: "Community Mgmt",   icon: Package,     color: "#2dd4bf", bg: "rgba(45,212,191,0.12)" },
  { key: "FINANCE_MGMT",    label: "Finance Mgmt",     icon: Building2,   color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  { key: "ADMIN_HUB",       label: "Admin Hub",        icon: ShieldCheck,  color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
];

// ── Modules Tab ──────────────────────────────────────────────────────────────
function ModulesTab() {
  const [communities, setCommunities] = useState<CommunityResponse[]>([]);
  const [selectedCommunityId, setSelectedCommunityId] = useState<number | null>(null);
  const [enabledModules, setEnabledModules] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadModules = async (communityId: number) => {
    try {
      const modules = await communityService.getCommunityModules(communityId);
      // A community that was never initialized has no module rows.
      // Feature modules for all module checks should be disabled initially.
      if (modules.length === 0) {
        setEnabledModules([]);
      } else {
        setEnabledModules(modules.filter((m) => m.isEnabled).map((m) => m.moduleKey));
      }
    } catch {
      setEnabledModules([]);
    }
  };

  useEffect(() => {
    communityService.getCommunities().then((list) => {
      setCommunities(list);
      if (list.length > 0) {
        setSelectedCommunityId(list[0].id);
        loadModules(list[0].id);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleCommunityChange = (id: number) => {
    setSelectedCommunityId(id);
    loadModules(id);
  };

  const toggleModule = (key: string) => {
    setEnabledModules((prev) =>
      prev.includes(key) ? prev.filter((m) => m !== key) : [...prev, key]
    );
  };

  const toggleAll = () => {
    if (enabledModules.length === ALL_MODULES.length) {
      setEnabledModules([]);
    } else {
      setEnabledModules(ALL_MODULES.map((m) => m.key));
    }
  };

  const handleSave = async () => {
    if (!selectedCommunityId) return;
    setSaving(true);
    try {
      const toggles = ALL_MODULES.map((m) => ({
        moduleKey: m.key,
        isEnabled: enabledModules.includes(m.key),
      }));
      await communityService.bulkUpdateModules(selectedCommunityId, toggles);
      // Reload from the server so the UI reflects the persisted state (confirms the save).
      await loadModules(selectedCommunityId);
      toast.success("Community modules updated successfully");
    } catch (err: any) {
      toast.error(err?.message || "Failed to update modules");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const selectedCommunity = communities.find((c) => c.id === selectedCommunityId);

  return (
    <div className="space-y-6 animate-fade-in-up stagger-1">
      {/* Community Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border rounded-2xl p-5 shadow-lg">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Building2 className="h-4 w-4 text-primary" />
          Select Community
        </h3>
        <select
          value={selectedCommunityId ?? ""}
          onChange={(e) => handleCommunityChange(Number(e.target.value))}
          className="w-full max-w-md bg-input border border-border rounded-xl text-sm px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
        >
          {communities.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Module Toggles */}
      {selectedCommunity && (
        <div className="bg-card border border-border rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <ToggleLeft className="h-4 w-4 text-primary" />
              Feature Modules for {selectedCommunity.name}
            </h3>
            <button
              onClick={toggleAll}
              className="text-xs font-medium px-3 py-1.5 rounded-lg bg-input border border-border hover:bg-primary/10 hover:border-primary/30 transition-all cursor-pointer text-muted-foreground hover:text-foreground"
            >
              {enabledModules.length === ALL_MODULES.length ? "Disable All" : "Enable All"}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ALL_MODULES.map((mod) => {
              const isEnabled = enabledModules.includes(mod.key);
              const Icon = mod.icon;
              return (
                <button
                  key={mod.key}
                  onClick={() => toggleModule(mod.key)}
                  className={`flex items-center gap-3 p-4 rounded-xl border transition-all duration-200 cursor-pointer text-left ${
                    isEnabled
                      ? "border-primary/40 bg-primary/5 shadow-sm"
                      : "border-border bg-card hover:bg-input/50"
                  }`}
                >
                  <div
                    className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: isEnabled ? mod.bg : "rgba(100,100,100,0.1)" }}
                  >
                    <Icon className="h-4 w-4" style={{ color: isEnabled ? mod.color : "#888" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${isEnabled ? "text-foreground" : "text-muted-foreground"}`}>
                      {mod.label}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                      {isEnabled ? "Enabled" : "Disabled"}
                    </p>
                  </div>
                  <div className={`h-5 w-9 rounded-full transition-all duration-200 flex items-center px-0.5 ${
                    isEnabled ? "bg-primary" : "bg-input border border-border"
                  }`}>
                    <div className={`h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
                      isEnabled ? "translate-x-3.5" : "translate-x-0"
                    }`} />
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-center gap-6 mt-5 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{enabledModules.length}</span> of {ALL_MODULES.length} modules enabled
            </p>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-all disabled:opacity-50 cursor-pointer"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main AdminHub Component ───────────────────────────────────────────────────
export function AdminHub() {
  const { user, isAdmin, isSuperAdmin, isAnyAdmin, hasPermission } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get("tab") as TabId) || "overview";
  const setActiveTab = (tab: TabId) => {
    setSearchParams({ tab }, { replace: true });
  };

  // Overview data
  const [overviewData, setOverviewData] = useState<AdminOverviewData | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState<string | null>(null);

  // Users data (shared between Overview + Users tab)
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);

  const canManageCommunities = isSuperAdmin || hasPermission("Manage Communities");

  // ── Fetch all data ──────────────────────────────────────────────────────────
  const fetchOverview = useCallback(async () => {
    setOverviewLoading(true);
    setOverviewError(null);
    try {
      const [userStats, venues, sportsMeta] = await Promise.all([
        userService.getUserStats(user?.communityId ?? undefined).catch(() => null),
        venueService.getVenues(user?.communityId ?? null).catch(() => [] as any[]),
        sportsService.getSportsMeta().catch(() => [] as any[]),
      ]);

      if (userStats) {
        setOverviewData({
          totalUsers: userStats.totalUsers ?? 0,
          activeUsers: userStats.activeUsers ?? 0,
          pendingKyc: userStats.pendingKyc ?? 0,
          approvedKyc: userStats.approvedKyc ?? 0,
          rejectedKyc: userStats.rejectedKyc ?? 0,
          totalVenues: Array.isArray(venues) ? venues.length : 0,
          totalSports: Array.isArray(sportsMeta) ? sportsMeta.length : 0,
          roleBreakdown: userStats.roleBreakdown ?? {},
        });
      } else {
        // Fallback if stats endpoint is unreachable
        const allUsers = await userService.getAllUsers().catch(() => [] as UserResponse[]);
        let usersList: UserResponse[] = [];
        if (Array.isArray(allUsers)) {
          usersList = allUsers;
        } else if (typeof allUsers === "object" && Array.isArray((allUsers as any).content)) {
          usersList = (allUsers as any).content;
        }
        setUsers(usersList);
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
      }
    } catch (err: any) {
      setOverviewError(err?.message || "Failed to load overview data");
    } finally {
      setOverviewLoading(false);
    }
  }, [user?.communityId]);

  const hydratedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (activeTab === "overview" && !hydratedRef.current.has("overview")) {
      hydratedRef.current.add("overview");
      fetchOverview();
    }
    if (activeTab === "users-roles" && !hydratedRef.current.has("users-roles") && !hydratedRef.current.has("overview")) {
      hydratedRef.current.add("users-roles");
      setUsersLoading(true);
      userService.getAllUsers()
        .then(allUsers => {
          let list: UserResponse[] = [];
          if (Array.isArray(allUsers)) list = allUsers;
          else if (typeof allUsers === "object" && Array.isArray((allUsers as any).content)) list = (allUsers as any).content;
          setUsers(list);
        })
        .catch(() => {})
        .finally(() => setUsersLoading(false));
    }
  }, [activeTab, fetchOverview]);

  if (!isAnyAdmin) {
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
    if (t.id === "modules") return isSuperAdmin;
    if (t.id === "community") return canManageCommunities;
    if (t.id === "users-roles" || t.id === "access-roles") return isSuperAdmin || isAdmin || hasPermission("Manage Roles");
    return true;
  });

  // Pending badge count for KYC tab
  const pendingKycCount = overviewData?.pendingKyc ?? 0;

  return (
    <div className="flex flex-col h-full min-h-screen bg-background">
      {/* ── Header ── */}
      <div className="border-b border-border bg-card/60 backdrop-blur px-4 sm:px-6 py-3.5 sm:py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-foreground flex items-center gap-2">
              <div className="h-7.5 w-7.5 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0 shadow-2xs">
                <ShieldCheck className="h-4 w-4 text-white" />
              </div>
              <span>Admin Control Center</span>
            </h2>
            <p className="text-[11px] text-muted-foreground mt-0.5 ml-9 truncate">
              {user?.role?.replace(/_/g, " ")} · {user?.fullName}
            </p>
          </div>
          {!overviewLoading && overviewData && (
            <div className="flex items-center gap-2 sm:gap-3 text-xs text-muted-foreground shrink-0">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/10 text-success text-[11px] font-semibold border border-success/20">
                <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                {overviewData.activeUsers} active
              </span>
              {pendingKycCount > 0 && (
                <span
                  onClick={() => setActiveTab("kyc")}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-warning/10 text-warning border border-warning/25 text-[11px] font-semibold cursor-pointer hover:bg-warning/20 transition-all shadow-2xs"
                >
                  <Clock className="h-3 w-3" />
                  {pendingKycCount} KYC
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── Tabs ── */}
        <div className="flex items-center gap-1 mt-3 overflow-x-auto scrollbar-none pb-0.5">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer relative ${
                  isActive
                    ? "bg-primary text-white shadow-2xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-input/60"
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {tab.label}
                {tab.id === "kyc" && pendingKycCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-warning text-[8.5px] font-bold text-white flex items-center justify-center shadow-xs">
                    {pendingKycCount > 9 ? "9+" : pendingKycCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Tab Content ── */}
      <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 lg:p-6">
        {activeTab === "overview" && (
          <OverviewTab
            data={overviewData}
            loading={overviewLoading}
            error={overviewError}
            onRetry={fetchOverview}
            onNavigate={setActiveTab}
          />
        )}
        {activeTab === "dashboards" && <SmartDashboard />}
        {activeTab === "users-roles" && <AdminRoleManagement />}
        {activeTab === "access-roles" && <AdminAccessManagement />}
        {activeTab === "kyc" && <AdminDashboard />}
        {activeTab === "modules" && <ModulesTab />}
        {activeTab === "bulk" && <AdminBulkUpload />}
        {activeTab === "community" && <AdminCommunity />}
        {activeTab === "announcements" && <AnnouncementsPlanner />}
        {activeTab === "email-gallery" && <EmailTemplatesTab />}
        {activeTab === "email-templates" && <EmailTemplateBuilder />}
        {activeTab === "email-logs" && <EmailDeliveryLogTab />}
        {activeTab === "directory" && <AdminDirectory />}
      </div>
    </div>
  );
}
