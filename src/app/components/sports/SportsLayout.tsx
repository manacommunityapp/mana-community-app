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
    <div className="flex flex-col gap-4 h-full min-h-0">
      {/* Breadcrumb + page header */}
      <div className="shrink-0">
        <div className="flex items-center gap-2 text-xs mb-3" style={{ color: "#6b7094" }}>
          <span>Home</span>
          <ChevronRight className="h-3 w-3" />
          <span style={{ color: "#4f46e5" }}>Sports</span>
          {activeItem && activeItem.label !== "Dashboard" && (
            <>
              <ChevronRight className="h-3 w-3" />
              <span style={{ color: "#4f46e5" }}>{activeItem.label}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div
            className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #f59e0b, #ef4444)" }}
          >
            <Trophy className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold leading-tight" style={{ color: "#0d0d2b" }}>Sports</h2>
            <p className="text-sm" style={{ color: "#6b7094" }}>
              Leagues, teams, schedules &amp; player auctions
            </p>
          </div>
        </div>
      </div>

      {/* Sports sub-nav pill bar */}
      <div 
        className="rounded-xl p-1.5 flex items-center gap-1 overflow-x-auto shrink-0"
        style={{
          background: "white",
          border: "1px solid rgba(99, 102, 241, 0.12)",
          boxShadow: "rgba(99, 102, 241, 0.06) 0px 2px 12px",
        }}
      >
        {visibleNav.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className="flex-shrink-0"
          >
            {({ isActive }) => (
              <div
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 cursor-pointer"
                style={
                  isActive
                    ? {
                        background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                        color: "white",
                        boxShadow: "0 2px 12px rgba(99, 102, 241, 0.35)",
                      }
                    : {
                        color: "rgb(107, 112, 148)",
                        background: "transparent",
                      }
                }
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "rgba(99, 102, 241, 0.08)";
                    e.currentTarget.style.color = "#4f46e5";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "rgb(107, 112, 148)";
                  }
                }}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </div>
            )}
          </NavLink>
        ))}
      </div>

      {/* Page content */}
      <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar">
        <Outlet />
      </div>
    </div>
  );
}
