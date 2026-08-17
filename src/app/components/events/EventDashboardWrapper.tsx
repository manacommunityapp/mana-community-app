import { useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { EventsDashboard } from "./EventsDashboard";
import { EventMemberView } from "./EventMemberView";
import { ShieldCheck, LayoutDashboard, Ticket } from "lucide-react";
import { VIEW_EVENT_ADMIN_DASHBOARD } from "../../../constants/permissions";

/**
 * Event Dashboard Wrapper.
 * Provides 2 dedicated event dashboard views based on Access & Roles:
 *  1. Admin Users (Role: ADMIN / COMMUNITY_ADMIN) — View Switcher Header allowing toggling between Admin Dashboard & User View.
 *  2. Regular Users (Role: USER / MEMBER) — Directly renders the User Dashboard (<EventMemberView />) with no header DIV clutter.
 */
export function EventDashboardWrapper() {
  const { user, isEventsAdmin, isAdmin, isSuperAdmin, isAnyAdmin, hasPermission } = useAuth();

  // Determine user role and admin access
  const userRolesUpper = (user?.roles || (user?.role ? [user.role] : [])).map((r) => r.trim().toUpperCase());
  const hasEventAdminRole =
    isEventsAdmin ||
    isAdmin ||
    isSuperAdmin ||
    isAnyAdmin ||
    userRolesUpper.includes("EVENTS_ADMIN") ||
    userRolesUpper.includes("EVENT_ADMIN") ||
    userRolesUpper.includes("ADMIN") ||
    userRolesUpper.includes("COMMUNITY_ADMIN") ||
    hasPermission(VIEW_EVENT_ADMIN_DASHBOARD);

  // Default active view mode for admins
  const [viewMode, setViewMode] = useState<"admin" | "user">("admin");

  // For regular users (Role: USER / MEMBER), directly show the User Dashboard with NO header DIV clutter
  if (!hasEventAdminRole) {
    return <EventMemberView />;
  }

  return (
    <div className="space-y-4">
      {/* ── View Switcher Header (Visible only to Admins) ── */}
      <div className="bg-card border border-border rounded-xl p-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <LayoutDashboard className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-foreground">
              {viewMode === "admin" ? "Event Admin Dashboard" : "User View (Quick Actions)"}
            </h3>
            <p className="text-[11px] text-muted-foreground">
              {viewMode === "admin"
                ? "Administrative overview, analytics, finances & active tasks"
                : "Member quick actions, registrations, family passes & seva bookings"}
            </p>
          </div>
        </div>

        {/* View Mode Toggle Buttons */}
        <div className="flex items-center gap-1.5 bg-muted/50 p-1 rounded-lg border border-border/50">
          <button
            onClick={() => setViewMode("admin")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
              viewMode === "admin"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Admin Dashboard</span>
          </button>

          <button
            onClick={() => setViewMode("user")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
              viewMode === "user"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            }`}
          >
            <Ticket className="h-3.5 w-3.5" />
            <span>User View (Quick Actions)</span>
          </button>
        </div>
      </div>

      {/* ── Active Dashboard View ── */}
      {viewMode === "admin" ? <EventsDashboard /> : <EventMemberView />}
    </div>
  );
}
