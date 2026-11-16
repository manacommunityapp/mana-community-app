import { useState } from "react";
import { NavLink, Outlet } from "react-router";
import {
  LayoutDashboard,
  Users,
  Clock,
  CalendarDays,
  Timer,
  Settings,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { cn } from "../ui/utils";

const NAV_ITEMS: { to: string; icon: React.ElementType; label: string; end?: boolean }[] = [
  { to: "/hrm",            icon: LayoutDashboard, label: "Dashboard",   end: true },
  { to: "/hrm/employees",  icon: Users,           label: "Employees" },
  { to: "/hrm/attendance", icon: Clock,           label: "Attendance" },
  { to: "/hrm/leaves",     icon: CalendarDays,    label: "Leaves" },
  { to: "/hrm/shifts",     icon: Timer,           label: "Shifts" },
  { to: "/hrm/settings",   icon: Settings,        label: "Settings" },
];

export function HrmLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-full min-h-[calc(100vh-4rem)]">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 mt-16 w-60 border-r border-border bg-card transition-transform duration-200 lg:static lg:mt-0 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center gap-2 border-b border-border px-4 py-4">
          <Users className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-bold text-foreground m-0 mb-0">HR Management</h3>
        </div>

        <nav className="flex flex-col gap-0.5 p-2">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end ?? false}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )
              }
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
              <ChevronRight className="ml-auto h-3.5 w-3.5 opacity-50" />
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex-1 overflow-auto">
        <div className="lg:hidden sticky top-0 z-20 flex items-center gap-2 border-b border-border bg-background px-4 py-2">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-md p-1.5 hover:bg-accent"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <span className="text-sm font-semibold">HR Management</span>
        </div>

        <div className="p-4 md:p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
