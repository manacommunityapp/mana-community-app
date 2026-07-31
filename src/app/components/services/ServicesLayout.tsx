import { Outlet, useNavigate, useLocation } from "react-router";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Search, ClipboardList, Wrench, Shield } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import {
  VIEW_SERVICE_REQUESTS,
  MANAGE_SERVICE_CATALOG,
} from "../../../constants/permissions";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function ServicesLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPermission } = useAuth();

  const tabs = [
    { id: "browse", label: "Browse", path: "/services", icon: Search, exact: true },
    ...(hasPermission(VIEW_SERVICE_REQUESTS)
      ? [{ id: "requests", label: "My Requests", path: "/services/requests", icon: ClipboardList, exact: false }]
      : []),
    { id: "provider", label: "Provider", path: "/services/provider", icon: Wrench, exact: false },
    ...(hasPermission(MANAGE_SERVICE_CATALOG)
      ? [{ id: "admin", label: "Admin", path: "/services/admin", icon: Shield, exact: false }]
      : []),
  ];

  const isTabActive = (tab: (typeof tabs)[0]) => {
    if (tab.exact) {
      return location.pathname === tab.path;
    }
    return location.pathname.startsWith(tab.path);
  };

  return (
    <div className="min-h-screen font-sans bg-[#F8F7FC] text-[#1A1A2E] transition-colors duration-200 dark:bg-[#16162A] dark:text-[#F0EFF5]">
      {/* Topbar */}
      <div className="sticky top-0 z-40 bg-white/90 dark:bg-[#1E1E36]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-6 h-16 flex items-center gap-4 shadow-sm">
        <div
          className="flex items-center gap-2 cursor-pointer flex-shrink-0"
          onClick={() => navigate("/services")}
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 flex items-center justify-center text-white font-black text-lg shadow-md shadow-emerald-500/20">
            S
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-base font-black tracking-tight text-slate-900 dark:text-white leading-tight">
              Mana<span className="text-emerald-600 dark:text-emerald-400">Services</span>
            </span>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              Community Hub
            </span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-[#1E1E36] border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 shadow-xs">
        <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar -mb-px">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = isTabActive(tab);
            return (
              <button
                key={tab.id}
                onClick={() => navigate(tab.path)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3.5 text-xs font-bold whitespace-nowrap border-b-2 transition-all cursor-pointer",
                  active
                    ? "border-emerald-600 text-emerald-600 dark:text-emerald-400 dark:border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20"
                    : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700"
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Page Content */}
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <Outlet />
      </div>
    </div>
  );
}
