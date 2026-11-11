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
  Briefcase,
  TrendingUp,
  BookOpen,
  DollarSign,
  Receipt,
  Package,
  CheckSquare,
  HelpCircle,
  BarChart3,
  AlertTriangle,
  ScrollText,
  Shield,
  FileBarChart,
  Building2,
  ChevronDown,
} from "lucide-react";
import { cn } from "../ui/utils";
import { HrmOrgProvider, useHrmOrg } from "../../../contexts/HrmOrgContext";

const NAV_ITEMS: { to: string; icon: React.ElementType; label: string; end?: boolean }[] = [
  { to: "/hrm",            icon: LayoutDashboard, label: "Dashboard",   end: true },
  { to: "/hrm/employees",  icon: Users,           label: "Employees" },
  { to: "/hrm/attendance", icon: Clock,           label: "Attendance" },
  { to: "/hrm/leaves",     icon: CalendarDays,    label: "Leaves" },
  { to: "/hrm/shifts",       icon: Timer,           label: "Shifts" },
  { to: "/hrm/recruitment",  icon: Briefcase,       label: "Recruitment" },
  { to: "/hrm/performance",  icon: TrendingUp,      label: "Performance" },
  { to: "/hrm/learning",     icon: BookOpen,        label: "Learning" },
  { to: "/hrm/payroll",      icon: DollarSign,      label: "Payroll" },
  { to: "/hrm/expenses",     icon: Receipt,         label: "Expenses" },
  { to: "/hrm/assets",       icon: Package,         label: "Assets" },
  { to: "/hrm/tasks",        icon: CheckSquare,     label: "Tasks" },
  { to: "/hrm/helpdesk",     icon: HelpCircle,      label: "Help Desk" },
  { to: "/hrm/analytics",   icon: BarChart3,       label: "Analytics" },
  { to: "/hrm/compliance",  icon: AlertTriangle,   label: "Compliance" },
  { to: "/hrm/audit",       icon: ScrollText,      label: "Audit Trail" },
  { to: "/hrm/roles",       icon: Shield,          label: "Roles" },
  { to: "/hrm/reports",     icon: FileBarChart,    label: "Reports" },
  { to: "/hrm/settings",     icon: Settings,        label: "Settings" },
];

function OrgSwitcher() {
  const { activeOrgId, organizations, setActiveOrgId } = useHrmOrg();
  if (organizations.length <= 1) return null;
  return (
    <div className="relative mx-2 mb-1">
      <Building2 className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
      <select
        value={activeOrgId ?? ""}
        onChange={(e) => setActiveOrgId(Number(e.target.value))}
        className="w-full appearance-none rounded-md border border-border bg-background py-1.5 pl-7 pr-7 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
      >
        {organizations.map((org) => (
          <option key={org.id} value={org.id}>{org.name}</option>
        ))}
      </select>
    </div>
  );
}

function HrmLayoutInner() {
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

        <div className="pt-2">
          <OrgSwitcher />
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

export function HrmLayout() {
  return (
    <HrmOrgProvider>
      <HrmLayoutInner />
    </HrmOrgProvider>
  );
}
