import { NavLink, Outlet, useLocation } from "react-router";
import {
  LayoutDashboard, CalendarDays, Users,
  HandHeart, UtensilsCrossed, ImageIcon, ChevronRight,
  Database, Wifi, UserRound, ClipboardList, BarChart3,
} from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import {
  VIEW_EVENTS, REGISTER_EVENT, MANAGE_EVENT_FORMS, MANAGE_EVENT_DASHBOARD,
  VIEW_EVENT_DASHBOARD, VIEW_EVENT_SCHEDULE, VIEW_EVENT_REGISTRATION,
  VIEW_EVENT_PEOPLE, VIEW_EVENT_FUNDRAISING, VIEW_EVENT_OPERATIONS, VIEW_EVENT_MEDIA,
  VIEW_EVENT_GALLERY,
} from "../../../constants/permissions";
import { EventMockProvider, useEventMock } from "./EventMockToggle";
import { CreateEventButton } from "./EventsCreate";

const navItems = [
  { to: "/events",              label: "Dashboard",        icon: LayoutDashboard, end: true, permission: VIEW_EVENT_DASHBOARD, altPermission: VIEW_EVENTS },
  { to: "/events/member-flow",  label: "Member Flow",      icon: UserRound,       superAdminOnly: true, permission: MANAGE_EVENT_DASHBOARD },
  { to: "/events/schedule",     label: "Events & Schedule",icon: CalendarDays,              permission: VIEW_EVENT_SCHEDULE },
  { to: "/events/forms",        label: "Forms",            icon: ClipboardList,   adminOnly: true, permission: MANAGE_EVENT_FORMS },
  { to: "/events/people",       label: "People",           icon: Users,                     permission: VIEW_EVENT_PEOPLE },
  { to: "/events/fundraising",  label: "Fundraising",      icon: HandHeart,                 permission: VIEW_EVENT_FUNDRAISING },
  { to: "/events/operations",   label: "Operations",       icon: UtensilsCrossed,           permission: VIEW_EVENT_OPERATIONS },
  { to: "/events/media",        label: "Media",            icon: ImageIcon,                 permission: VIEW_EVENT_MEDIA, altPermission: VIEW_EVENT_GALLERY },
  { to: "/events/reports",      label: "Reports",          icon: BarChart3,                 permission: VIEW_EVENT_MEDIA, altPermission: VIEW_EVENT_DASHBOARD },
];

function DataModeToggle() {
  const { useMock, toggle } = useEventMock();
  return (
    <button
      onClick={toggle}
      title={useMock ? "Click to switch to Live API mode" : "Click to switch to Mock Data mode"}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border cursor-pointer select-none shadow-2xs hover:shadow-xs"
      style={{
        background: useMock ? "#fef3c7" : "#ecfdf5",
        color: useMock ? "#92400e" : "#065f46",
        borderColor: useMock ? "#fcd34d" : "#6ee7b7",
      }}
    >
      {useMock ? <Database className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />}
      <span>{useMock ? "Mock Data" : "Live API"}</span>
    </button>
  );
}

function EventsLayoutInner() {
  const { hasPermission, isAdmin, isSuperAdmin } = useAuth();
  const location = useLocation();

  const activeItem = navItems.find((item) =>
    item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)
  );

  const visibleNav = navItems.filter((nav) => {
    if ("superAdminOnly" in nav && nav.superAdminOnly && !isSuperAdmin) return false;
    if ("adminOnly" in nav && nav.adminOnly && !isAdmin) return false;
    // Hide items marked as localOnly when running in a production build
    if ("localOnly" in nav && nav.localOnly && !import.meta.env.DEV) return false;
    // ADMIN/COMMUNITY_ADMIN roles see all event tabs regardless of explicit permission strings,
    // because the backend may not return per-permission strings for admin roles.
    if (isAdmin) return true;
    if (nav.permission && hasPermission(nav.permission)) return true;
    if ("altPermission" in nav && nav.altPermission && hasPermission(nav.altPermission)) return true;
    return false;
  });

  return (
    <div className="flex flex-col gap-2 sm:gap-4 h-full min-h-0">
      <div className="shrink-0 flex items-center justify-between gap-2 sm:gap-3 border-b border-slate-100 pb-2 sm:pb-3 min-w-0">
        <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs shrink-0" style={{ color: "#6b7094" }}>
          <NavLink to="/" className="hover:underline hover:text-indigo-600 transition-colors">
            Home
          </NavLink>
          <ChevronRight className="h-3 w-3 shrink-0 text-slate-300" />
          <NavLink to="/events" className="hover:underline font-semibold transition-colors" style={{ color: "#4f46e5" }}>
            Events
          </NavLink>
          {activeItem && activeItem.label !== "Dashboard" && (
            <>
              <ChevronRight className="h-3 w-3 shrink-0 text-slate-300" />
              <NavLink to={activeItem.to} className="hover:underline font-bold transition-colors" style={{ color: "#4f46e5" }}>
                {activeItem.label}
              </NavLink>
            </>
          )}
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2.5 text-right justify-end shrink-0 ml-auto">
          <DataModeToggle />
          <CreateEventButton />
          <div className="text-right min-w-0 hidden xs:block sm:block">
            <h2 className="text-xs sm:text-xl font-bold leading-tight truncate" style={{ color: "#0d0d2b" }}>Event Management</h2>
            <p className="text-xs hidden sm:block" style={{ color: "#6b7094" }}>
              Planning, Registration, Finance & more
            </p>
          </div>
          <div
            className="h-6 w-6 sm:h-9 sm:w-9 rounded-md sm:rounded-xl flex items-center justify-center flex-shrink-0 order-last"
            style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}
          >
            <CalendarDays className="h-3 w-3 sm:h-4.5 sm:w-4.5 text-white" />
          </div>
        </div>
      </div>

      <div
        className="rounded-lg sm:rounded-xl p-0.5 sm:p-1.5 flex items-center gap-0.5 sm:gap-1 overflow-x-auto shrink-0 hide-scrollbar"
        style={{
          background: "white",
          border: "1px solid rgba(99, 102, 241, 0.12)",
          boxShadow: "rgba(99, 102, 241, 0.06) 0px 2px 12px",
        }}
      >
        {visibleNav.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className="flex-shrink-0">
            {({ isActive }) => (
              <div
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-md sm:rounded-lg text-[10px] sm:text-sm font-medium whitespace-nowrap transition-all duration-200 cursor-pointer"
                style={
                  isActive
                    ? {
                        background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                        color: "white",
                        boxShadow: "0 2px 12px rgba(99, 102, 241, 0.35)",
                      }
                    : { color: "rgb(107, 112, 148)", background: "transparent" }
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
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                {label}
              </div>
            )}
          </NavLink>
        ))}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar">
        <Outlet />
      </div>
    </div>
  );
}

export function EventsLayout() {
  return (
    <EventMockProvider>
      <EventsLayoutInner />
    </EventMockProvider>
  );
}
