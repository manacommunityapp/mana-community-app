import { NavLink, Outlet, useLocation } from "react-router";
import {
  LayoutDashboard, Briefcase, CalendarCheck, Clock, Wallet,
  FileText, Star, UserCircle, ChevronRight, Store,
} from "lucide-react";

const portalNav = [
  { to: "/vendor-portal", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/vendor-portal/services", label: "My Services", icon: Briefcase },
  { to: "/vendor-portal/bookings", label: "My Bookings", icon: CalendarCheck },
  { to: "/vendor-portal/availability", label: "Availability", icon: Clock },
  { to: "/vendor-portal/payments", label: "Payments", icon: Wallet },
  { to: "/vendor-portal/documents", label: "Documents", icon: FileText },
  { to: "/vendor-portal/ratings", label: "Ratings", icon: Star },
  { to: "/vendor-portal/profile", label: "Profile", icon: UserCircle },
];

export function VendorPortalLayout() {
  const location = useLocation();

  const activeItem = portalNav.find((item) =>
    item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)
  );

  return (
    <div className="min-h-screen font-sans text-[#0d0d2b]">
      {/* Top Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight">
              Vendor<span className="text-indigo-600">Portal</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              Business Management Hub
            </p>
          </div>
        </div>

        {/* Breadcrumb */}
        {activeItem && (
          <div className="hidden sm:flex items-center gap-1 text-xs text-[#6b7094]">
            <span>Home</span>
            <ChevronRight className="w-3 h-3" />
            <span>Vendor Portal</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-indigo-600 font-semibold">{activeItem.label}</span>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 shadow-xs">
        <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar -mb-px">
          {portalNav.map((item) => {
            const Icon = item.icon;
            const isActive = item.end
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to) && location.pathname !== "/vendor-portal" || (item.end && location.pathname === item.to);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive: navActive }) =>
                  `flex items-center gap-2 px-4 py-3.5 text-xs font-bold whitespace-nowrap border-b-2 transition-all cursor-pointer ${
                    navActive
                      ? "border-indigo-600 text-indigo-600 bg-indigo-50/50"
                      : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300"
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </NavLink>
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
