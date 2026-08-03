import { NavLink, Outlet, useLocation } from "react-router";
import {
  LayoutDashboard, CalendarDays, ClipboardList, Users, Ticket,
  Mic2, HandHeart, Gem, Gavel, UtensilsCrossed, Landmark,
  MapPin, ImageIcon, BarChart3, ChevronRight, PlusCircle, UserCheck,
} from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { VIEW_EVENTS, CREATE_EVENT, REGISTER_EVENT } from "../../../constants/permissions";

const navItems = [
  { to: "/events",              label: "Dashboard",    icon: LayoutDashboard, end: true  },
  { to: "/events/create",      label: "Create Event", icon: PlusCircle       },
  { to: "/events/planning",    label: "Planning",     icon: ClipboardList    },
  { to: "/events/registration",label: "Registration", icon: Ticket           },
  { to: "/events/register",    label: "Public Reg.",  icon: UserCheck        },
  { to: "/events/programs",    label: "Programs",     icon: Mic2             },
  { to: "/events/volunteers",  label: "Volunteers",   icon: Users            },
  { to: "/events/sponsors",    label: "Sponsors",     icon: Gem              },
  { to: "/events/donations",   label: "Donations",    icon: HandHeart        },
  { to: "/events/auction",     label: "Auction",      icon: Gavel            },
  { to: "/events/food",        label: "Food",         icon: UtensilsCrossed  },
  { to: "/events/finance",     label: "Finance",      icon: Landmark         },
  { to: "/events/venue",       label: "Venue",        icon: MapPin           },
  { to: "/events/gallery",     label: "Gallery",      icon: ImageIcon        },
  { to: "/events/reports",     label: "Reports",      icon: BarChart3        },
];

export function EventsLayout() {
  const { hasPermission } = useAuth();
  const location = useLocation();

  const activeItem = navItems.find((item) =>
    item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)
  );

  const visibleNav = navItems.filter((nav) => {
    if (nav.label === "Create Event") return hasPermission(CREATE_EVENT);
    if (nav.label === "Public Reg.") return hasPermission(REGISTER_EVENT);
    return hasPermission(VIEW_EVENTS);
  });

  return (
    <div className="flex flex-col gap-4 h-full min-h-0">
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2 text-xs" style={{ color: "#6b7094" }}>
          <span>Home</span>
          <ChevronRight className="h-3 w-3" />
          <span style={{ color: "#4f46e5" }}>Events</span>
          {activeItem && activeItem.label !== "Dashboard" && (
            <>
              <ChevronRight className="h-3 w-3" />
              <span style={{ color: "#4f46e5" }}>{activeItem.label}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-3 sm:text-right sm:justify-end">
          <div className="text-left sm:text-right">
            <h2 className="text-xl font-bold leading-tight" style={{ color: "#0d0d2b" }}>Event Management</h2>
            <p className="text-xs" style={{ color: "#6b7094" }}>
              Planning, Registration, Finance & more
            </p>
          </div>
          <div
            className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 order-first sm:order-last"
            style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}
          >
            <CalendarDays className="h-4.5 w-4.5 text-white" />
          </div>
        </div>
      </div>

      <div
        className="rounded-xl p-1.5 flex items-center gap-1 overflow-x-auto shrink-0"
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
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 cursor-pointer"
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
                <Icon className="w-4 h-4 flex-shrink-0" />
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
