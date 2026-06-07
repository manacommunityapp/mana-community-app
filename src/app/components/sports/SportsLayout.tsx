import { NavLink, Outlet } from "react-router";
import { LayoutDashboard, Medal, CalendarDays, Gavel, ShieldCog } from "lucide-react";
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
  { to: "/sports/register", label: "My Sports", icon: Medal },
  { to: "/sports/schedule", label: "Schedule", icon: CalendarDays },
  { to: "/sports/auction", label: "Auction", icon: Gavel },
  { to: "/sports/admin", label: "Admin", icon: ShieldCog },
];

export function SportsLayout() {
  const { hasPermission, hasAnyPermission } = useAuth();

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
      default:
        return true;
    }
  });

  return (
    <div className="space-y-4">
      {/* Sports sub-nav pill bar */}
      <div className="bg-[#141c2e] border border-[#2a3a5c] rounded-xl p-1.5 flex items-center gap-1 overflow-x-auto">
        {visibleNav.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${isActive
                ? "bg-[#f97316] text-white shadow-sm"
                : "text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-[#1a2540]"
              }`
            }
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </div>

      {/* Page content */}
      <Outlet />
    </div>
  );
}
