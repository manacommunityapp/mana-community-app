import { useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { EventsDashboard } from "./EventsDashboard";
import { EventMemberView } from "./EventMemberView";
import { ShieldCheck, LayoutDashboard, Ticket } from "lucide-react";
import {
  VIEW_EVENT_ADMIN_DASHBOARD,
  VIEW_EVENT_USER_DASHBOARD,
} from "../../../constants/permissions";

/**
 * Event Dashboard Wrapper.
 * Permission-gated routing:
 *  - VIEW_EVENT_ADMIN_DASHBOARD only → Admin Dashboard with optional User View toggle
 *  - VIEW_EVENT_USER_DASHBOARD only  → User Dashboard directly (no toggle)
 *  - Both permissions (or SuperAdmin) → Admin Dashboard by default with both toggles
 *  - Neither                          → User Dashboard (safe fallback)
 */
export function EventDashboardWrapper() {
  const { isSuperAdmin, hasPermission } = useAuth();

  const canViewAdmin = isSuperAdmin || hasPermission(VIEW_EVENT_ADMIN_DASHBOARD);
  const canViewUser  = isSuperAdmin || hasPermission(VIEW_EVENT_USER_DASHBOARD);

  // Default to admin view if allowed, otherwise user view
  const [viewMode, setViewMode] = useState<"admin" | "user">(
    canViewAdmin ? "admin" : "user"
  );

  // ── Case 1: Only user dashboard access — render directly, no toggle ──
  if (!canViewAdmin && canViewUser) {
    return <EventMemberView />;
  }

  // ── Case 2: Only admin dashboard access — show admin, hide user toggle if no user perm ──
  // ── Case 3: Both — show both toggles ──
  // ── Case 4: Neither — fallback to user view ──
  if (!canViewAdmin && !canViewUser) {
    return <EventMemberView />;
  }

  return (
    <div className="space-y-4">
      {/* ── View Switcher Header ── */}
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

        {/* View Mode Toggle — only show both buttons when user has both permissions */}
        <div className="flex items-center gap-1.5 bg-muted/50 p-1 rounded-lg border border-border/50">
          {/* Admin tab — always visible here (we are in canViewAdmin branch) */}
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

          {/* User View tab — only shown when user also has VIEW_EVENT_USER_DASHBOARD */}
          {canViewUser && (
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
          )}
        </div>
      </div>

      {/* ── Active Dashboard View ── */}
      {viewMode === "admin" ? <EventsDashboard /> : <EventMemberView />}
    </div>
  );
}
