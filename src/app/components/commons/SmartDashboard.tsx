import { useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { AdminDashboard } from "../admin/AdminDashboard";
import { UserDashboard } from "../user/UserDashboard";
import { EventsDashboard } from "../events/EventsDashboard";
import { SportsDashboard } from "../sports/SportsDashboard";
import { ShieldCheck, CalendarDays, Trophy, User, LayoutDashboard } from "lucide-react";

/**
 * Smart Dashboard router component.
 * Renders the appropriate role-based dashboard:
 *  - Event Admin → Event Admin Dashboard (with tab toggle)
 *  - Sports Admin → Sports Admin Dashboard (with tab toggle)
 *  - System / Community Admin → Main Admin Dashboard
 *  - Member / User → User Dashboard
 */
export function SmartDashboard() {
  const { user, isAdmin, isSuperAdmin, isSportsAdmin, isEventsAdmin, isAnyAdmin } = useAuth();

  // Determine user's primary admin specialization
  const userRolesUpper = (user?.roles || (user?.role ? [user.role] : [])).map((r) => r.trim().toUpperCase());
  const hasEventAdminRole = userRolesUpper.includes("EVENTS_ADMIN") || userRolesUpper.includes("EVENT_ADMIN");
  const hasSportsAdminRole = userRolesUpper.includes("SPORTS_ADMIN");

  // Default active tab based on role
  const initialTab = hasEventAdminRole
    ? "event-admin"
    : hasSportsAdminRole
    ? "sports-admin"
    : isAnyAdmin
    ? "main-admin"
    : "user";

  const [activeTab, setActiveTab] = useState<string>(initialTab);

  if (!isAnyAdmin) {
    return <UserDashboard />;
  }

  return (
    <div className="space-y-4">
      {/* Role Switcher Navigation bar for Admin Users */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-2">
        <div className="flex flex-wrap items-center justify-between gap-3 p-2 rounded-xl bg-card border shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground px-2">
            <LayoutDashboard className="h-4 w-4 text-primary" />
            <span>Dashboard Mode:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {hasEventAdminRole && (
              <button
                onClick={() => setActiveTab("event-admin")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "event-admin"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "hover:bg-muted text-muted-foreground"
                }`}
              >
                <CalendarDays className="h-3.5 w-3.5" />
                Event Admin Dashboard
              </button>
            )}

            {hasSportsAdminRole && (
              <button
                onClick={() => setActiveTab("sports-admin")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "sports-admin"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "hover:bg-muted text-muted-foreground"
                }`}
              >
                <Trophy className="h-3.5 w-3.5" />
                Sports Admin Dashboard
              </button>
            )}

            <button
              onClick={() => setActiveTab("main-admin")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "main-admin"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "hover:bg-muted text-muted-foreground"
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Community Admin Hub
            </button>

            <button
              onClick={() => setActiveTab("user")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "user"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "hover:bg-muted text-muted-foreground"
              }`}
            >
              <User className="h-3.5 w-3.5" />
              User Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Render selected dashboard */}
      {activeTab === "event-admin" && <EventsDashboard />}
      {activeTab === "sports-admin" && <SportsDashboard />}
      {activeTab === "main-admin" && <AdminDashboard />}
      {activeTab === "user" && <UserDashboard />}
    </div>
  );
}
