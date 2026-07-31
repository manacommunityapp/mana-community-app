import { useState } from "react";
import { NavLink, Outlet } from "react-router";
import {
  LayoutDashboard,
  Store,
  ClipboardList,
  FolderTree,
  Wrench,
  FileText,
  CreditCard,
  BarChart3,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { cn } from "../../ui/utils";

const NAV_ITEMS = [
  { to: "/vendor-admin",              icon: LayoutDashboard, label: "Dashboard",      end: true },
  { to: "/vendor-admin/vendors",      icon: Store,           label: "Vendor Directory" },
  { to: "/vendor-admin/registrations",icon: ClipboardList,   label: "Registrations" },
  { to: "/vendor-admin/categories",   icon: FolderTree,      label: "Categories" },
  { to: "/vendor-admin/work-orders",  icon: Wrench,          label: "Work Orders" },
  { to: "/vendor-admin/contracts",    icon: FileText,        label: "Contracts" },
  { to: "/vendor-admin/payments",     icon: CreditCard,      label: "Payments" },
  { to: "/vendor-admin/analytics",    icon: BarChart3,       label: "Analytics" },
] as const;

export function VendorAdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-full min-h-[calc(100vh-4rem)]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 mt-16 w-60 border-r border-border bg-card transition-transform duration-200 lg:static lg:mt-0 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center gap-2 border-b border-border px-4 py-4">
          <Store className="h-5 w-5 text-primary" />
          <h2 className="text-sm font-bold text-foreground">Vendor Management</h2>
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

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {/* Mobile toggle */}
        <div className="flex items-center border-b border-border px-4 py-2 lg:hidden">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-md p-2 text-muted-foreground hover:bg-accent"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <span className="ml-2 text-sm font-semibold text-foreground">Vendor Admin</span>
        </div>

        <div className="p-4 md:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
