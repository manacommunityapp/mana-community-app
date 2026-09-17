import { NavLink, Outlet, useLocation } from "react-router";
import { LayoutDashboard, Medal, CalendarDays, Gavel, ShieldCog, BarChart3, Trophy, ChevronRight } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import {
  VIEW_SPORTS_MAIN,
  VIEW_EVENT_REGISTRATIONS,
  VIEW_AUCTION_CONFIG,
  VIEW_LIVE_AUCTION,
  VIEW_TEAMS_DASHBOARD,
  VIEW_PLAYER_POOL,
  VIEW_AUCTION_RESULTS,
  CREATE_EDIT_SPORTS_MAIN,
  DELETE_SPORTS_MAIN,
  CREATE_EDIT_AUCTION_CONFIG,
  CREATE_EDIT_PLAYER_POOL,
  CREATE_EDIT_EVENT_REGISTRATIONS,
} from "../../../constants/permissions";

const sportsNav = [
  { to: "/sports", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/sports/my-sports", label: "My Sports", icon: Medal },
  { to: "/sports/schedule", label: "Schedule", icon: CalendarDays },
  { to: "/sports/auction", label: "Auction", icon: Gavel },
  { to: "/sports/admin", label: "Admin", icon: ShieldCog },
  { to: "/sports/analytics", label: "Analytics", icon: BarChart3 },
];

export function SportsLayout() {
  const { hasPermission, hasAnyPermission } = useAuth();
  const location = useLocation();

  // Current sports sub-section, for the breadcrumb trail (Home › Sports › …).
  const activeItem = sportsNav.find((item) =>
    item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)
  );

  const visibleNav = sportsNav.filter((nav) => {
    switch (nav.label) {
      case "Dashboard":
        return hasPermission(VIEW_SPORTS_MAIN);
      case "My Sports":
        return hasPermission(VIEW_EVENT_REGISTRATIONS);
      case "Schedule":
        return hasPermission(VIEW_SPORTS_MAIN);
      case "Auction":
        return hasAnyPermission(
          VIEW_AUCTION_CONFIG,
          VIEW_LIVE_AUCTION,
          VIEW_TEAMS_DASHBOARD,
          VIEW_PLAYER_POOL,
          VIEW_AUCTION_RESULTS
        );
      case "Admin":
        return hasAnyPermission(
          CREATE_EDIT_SPORTS_MAIN,
          DELETE_SPORTS_MAIN,
          CREATE_EDIT_AUCTION_CONFIG,
          CREATE_EDIT_PLAYER_POOL,
          CREATE_EDIT_EVENT_REGISTRATIONS
        );
      case "Analytics":
        return hasPermission(VIEW_SPORTS_MAIN);
      default:
        return true;
    }
  });

  return (
    <div className="flex flex-col gap-3 h-full min-h-0">
      {/* Breadcrumb + page header in a single horizontal row */}
      <div className="shrink-0 flex items-center justify-between gap-3 border-b border-slate-100 pb-2.5">
        {/* Left: Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-xs text-[#6b7094]">
          <NavLink to="/" className="hover:underline hover:text-indigo-600 transition-colors">
            Home
          </NavLink>
          <ChevronRight className="h-3 w-3 text-slate-300" />
          <NavLink to="/sports" className="hover:underline font-semibold transition-colors" style={{ color: "#4f46e5" }}>
            Sports
          </NavLink>
          {activeItem && activeItem.label !== "Dashboard" && (
            <>
              <ChevronRight className="h-3 w-3 text-slate-300" />
              <NavLink to={activeItem.to} className="hover:underline font-bold transition-colors" style={{ color: "#4f46e5" }}>
                {activeItem.label}
              </NavLink>
            </>
          )}
        </div>

        {/* Right: Page Header */}
        <div className="flex items-center gap-3">
          <div
            className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #f59e0b, #ef4444)" }}
          >
            <Trophy className="h-4.5 w-4.5 text-white" />
          </div>
          <div className="text-left hidden sm:block">
            <h2 className="text-xl font-bold leading-tight" style={{ color: "#0d0d2b" }}>Sports</h2>
            <p className="text-xs" style={{ color: "#6b7094" }}>
              Leagues, teams, schedules &amp; player auctions
            </p>
          </div>
        </div>
      </div>

      {/* Sports sub-nav pill bar */}
      <div className="w-full shrink-0">
        <div 
          className="flex items-center gap-1 sm:gap-1.5 p-1.5 rounded-2xl bg-white/95 backdrop-blur-md border border-indigo-100 shadow-[0_2px_10px_rgba(99,102,241,0.06)] overflow-x-auto w-full hide-scrollbar"
        >
          {visibleNav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className="flex-1 min-w-[110px] sm:min-w-0 select-none group"
            >
              {({ isActive }) => (
                <div
                  className={`w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 rounded-[11px] text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-[0_8px_18px_-6px_rgba(99,102,241,0.55)]"
                      : "text-slate-500 group-hover:text-indigo-600 group-hover:bg-indigo-50/80"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 flex-shrink-0 transition-colors ${
                      isActive
                        ? "text-white"
                        : "text-slate-400 group-hover:text-indigo-600"
                    }`}
                  />
                  <span>{label}</span>
                </div>
              )}
            </NavLink>
          ))}
        </div>
      </div>

      {/* Page content */}
      <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar">
        <Outlet />
      </div>
    </div>
  );
}
