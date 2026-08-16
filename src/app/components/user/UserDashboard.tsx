import { useState, useEffect } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { Link } from "react-router";
import {
  CalendarDays,
  Megaphone,
  Building2,
  Headphones,
  Trophy,
  Store,
  Vote,
  Briefcase,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Bell,
  Clock,
} from "lucide-react";
import { apiClient } from "../../../services/common/apiClient";

interface UserStats {
  userName: string;
  communityName: string;
  activeEventsCount: number;
  activeNoticesCount: number;
  myBookingsCount: number;
  myTicketsCount: number;
  recentNotices: Array<{ id: number; title: string; category: string; createdAt: string }>;
}

export function UserDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats>({
    userName: user?.fullName || user?.email || "Community Member",
    communityName: "Mana Community",
    activeEventsCount: 0,
    activeNoticesCount: 0,
    myBookingsCount: 0,
    myTicketsCount: 0,
    recentNotices: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get<UserStats>("/dashboard/user/stats")
      .then((res) => {
        if (res.data) setStats(res.data);
      })
      .catch((err) => {
        console.error("Failed to load user dashboard stats:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  const quickModules = [
    { label: "Community Feed", icon: Sparkles, to: "/", color: "bg-blue-500/10 text-blue-600 border-blue-200" },
    { label: "Events", icon: CalendarDays, to: "/events", color: "bg-purple-500/10 text-purple-600 border-purple-200" },
    { label: "Sports", icon: Trophy, to: "/sports", color: "bg-emerald-500/10 text-emerald-600 border-emerald-200" },
    { label: "Marketplace", icon: Store, to: "/marketplace", color: "bg-amber-500/10 text-amber-600 border-amber-200" },
    { label: "Bookings", icon: Building2, to: "/bookings", color: "bg-teal-500/10 text-teal-600 border-teal-200" },
    { label: "Notices", icon: Megaphone, to: "/notices", color: "bg-red-500/10 text-red-600 border-red-200" },
    { label: "Helpdesk", icon: Headphones, to: "/helpdesk", color: "bg-indigo-500/10 text-indigo-600 border-indigo-200" },
    { label: "Polls", icon: Vote, to: "/polls", color: "bg-pink-500/10 text-pink-600 border-pink-200" },
    { label: "Jobs", icon: Briefcase, to: "/jobs", color: "bg-orange-500/10 text-orange-600 border-orange-200" },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-primary/90 to-accent p-6 sm:p-8 text-primary-foreground shadow-xl">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5" />
            User Dashboard
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Welcome back, {stats.userName}! 👋
          </h1>
          <p className="text-sm sm:text-base text-primary-foreground/80 max-w-2xl font-medium">
            Stay connected with {stats.communityName}. Here is your quick overview for today.
          </p>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10 translate-x-8 translate-y-8 pointer-events-none">
          <Building2 className="h-64 w-64" />
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 rounded-xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Active Events</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600">
              <CalendarDays className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold">{loading ? "-" : stats.activeEventsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Upcoming community events</p>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Community Notices</span>
            <div className="p-2 rounded-lg bg-red-500/10 text-red-600">
              <Megaphone className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold">{loading ? "-" : stats.activeNoticesCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Broadcast announcements</p>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">My Bookings</span>
            <div className="p-2 rounded-lg bg-teal-500/10 text-teal-600">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold">{loading ? "-" : stats.myBookingsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Reserved amenities</p>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Helpdesk Tickets</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600">
              <Headphones className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold">{loading ? "-" : stats.myTicketsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Active support queries</p>
          </div>
        </div>
      </div>

      {/* Quick Access Modules Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Quick Access Services
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {quickModules.map((mod) => {
            const Icon = mod.icon;
            return (
              <Link
                key={mod.label}
                to={mod.to}
                className="group flex flex-col items-center justify-center p-4 rounded-xl border bg-card hover:border-primary/50 hover:shadow-md transition-all text-center space-y-2"
              >
                <div className={`p-3 rounded-xl border transition-transform group-hover:scale-110 ${mod.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                  {mod.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Admin Quick Management Tools (if user has any admin role) */}
      {useAuth().isAnyAdmin && (
        <div className="space-y-4 pt-2">
          <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Admin Quick Management
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link
              to="/admin/roles"
              className="flex items-center gap-3 p-4 rounded-xl border bg-card hover:border-primary/50 hover:shadow-md transition-all"
            >
              <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-600">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-foreground">User &amp; Roles</div>
                <div className="text-xs text-muted-foreground">Manage user role assignments</div>
              </div>
            </Link>

            <Link
              to="/admin/access-roles"
              className="flex items-center gap-3 p-4 rounded-xl border bg-card hover:border-primary/50 hover:shadow-md transition-all"
            >
              <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-600">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-foreground">Access &amp; Roles</div>
                <div className="text-xs text-muted-foreground">Configure module permissions</div>
              </div>
            </Link>

            <Link
              to="/admin"
              className="flex items-center gap-3 p-4 rounded-xl border bg-card hover:border-primary/50 hover:shadow-md transition-all"
            >
              <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-foreground">Admin Hub</div>
                <div className="text-xs text-muted-foreground">Full community management hub</div>
              </div>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
