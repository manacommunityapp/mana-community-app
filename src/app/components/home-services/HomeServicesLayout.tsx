import { Outlet, useNavigate, useLocation } from "react-router";
import { useState } from "react";
import {
  Search,
  Users,
  CalendarDays,
  FilePlus,
  Package,
  Star,
  AlertTriangle,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  Clock,
  HeartHandshake,
} from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import {
  VIEW_ADMIN,
  MANAGE_WORKER,
} from "../../../constants/permissions";

export function HomeServicesLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPermission, isAdmin, isSuperAdmin } = useAuth();
  const canAdmin = isAdmin || isSuperAdmin || hasPermission(VIEW_ADMIN) || hasPermission(MANAGE_WORKER);

  const tabs = [
    { id: "dashboard", label: "Overview", path: "/home-services", exact: true, icon: Sparkles },
    { id: "find-help", label: "Find Help", path: "/home-services/find-help", exact: false, icon: Search },
    { id: "my-help", label: "My Home Help", path: "/home-services/my-help", exact: false, icon: HeartHandshake },
    { id: "bookings", label: "My Bookings", path: "/home-services/bookings", exact: false, icon: CalendarDays },
    { id: "requirements", label: "Requirements", path: "/home-services/requirements", exact: false, icon: FilePlus },
    { id: "packages", label: "Packages", path: "/home-services/packages", exact: false, icon: Package },
    { id: "reviews", label: "Reviews", path: "/home-services/reviews", exact: false, icon: Star },
    { id: "reports", label: "Help & Reports", path: "/home-services/reports", exact: false, icon: AlertTriangle },
    ...(canAdmin ? [{ id: "admin", label: "Administration", path: "/home-services/admin", exact: false, icon: ShieldCheck }] : []),
  ];

  const isTabActive = (tab: (typeof tabs)[0]) => {
    if (tab.exact) {
      return location.pathname === tab.path;
    }
    return location.pathname.startsWith(tab.path);
  };

  return (
    <div className="min-h-screen font-sans bg-slate-50/50 dark:bg-slate-950/40 text-slate-900 dark:text-slate-100 flex flex-col pb-12">
      {/* Top Banner Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 via-primary to-violet-600 flex items-center justify-center text-white shadow-md shadow-primary/20 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-white">
                  Home Services
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide uppercase bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  Community Verified
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Find, book & manage trusted domestic help already serving your community
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => navigate("/home-services/requirements")}
              className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-sm hover:opacity-90 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <FilePlus className="w-3.5 h-3.5" />
              Post a Requirement
            </button>
            <button
              onClick={() => navigate("/home-services/find-help")}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-200 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              Find Help
            </button>
          </div>
        </div>

        {/* Tab Submenu Navigation */}
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6">
          <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar -mb-px">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = isTabActive(tab);
              return (
                <button
                  key={tab.id}
                  onClick={() => navigate(tab.path)}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition-all cursor-pointer ${
                    active
                      ? "border-primary text-primary bg-primary/5 dark:bg-primary/10"
                      : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Module Content */}
      <main className="max-w-7xl mx-auto w-full px-3.5 sm:px-6 py-5 flex-1">
        <Outlet />
      </main>
    </div>
  );
}
