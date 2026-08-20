import { Outlet, NavLink, useNavigate, useLocation } from "react-router";
import { Users, Package, Store, Briefcase, Trophy, CalendarDays, Menu, X, UserCircle, ShieldCheck, Zap, Search, LogOut, MessageCircle, Layers, Gauge, ChevronDown, ChevronRight, Truck, Landmark, FileText, BarChart3, Receipt, ClipboardList, BookOpen, Shield, Megaphone, Building2, Headphones, Vote, Server, Sparkles, Home } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useAuth } from "../../../../contexts/AuthContext";
import {
  VIEW_FEED, VIEW_SPORTS_MENU, VIEW_MARKETPLACE,
  VIEW_JOBS, VIEW_EVENTS, VIEW_ADMIN, VIEW_VISITORS, VIEW_NOTICES, VIEW_AMENITIES,
  VIEW_TICKETS, VIEW_POLLS, REGISTER_EVENT, VIEW_EVENT_GALLERY,
} from "../../../../constants/permissions";
import { FloatingChat } from "../../chat/FloatingChat";
import { FloatingChatBot } from "../../chat/FloatingChatBot";
import { ChatProvider } from "../../../../contexts/ChatContext";
import { NotificationBell } from "./NotificationBell";
import { MobileHeaderActions } from "./MobileFloatingActions";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/* ── Global Header Breadcrumb with Clickable Links ── */
function AppHeaderBreadcrumb() {
  const location = useLocation();
  const path = location.pathname;

  const getCrumbs = () => {
    const crumbs: { label: string; to: string }[] = [{ label: "Home", to: "/" }];

    if (path === "/") return crumbs;

    if (path.startsWith("/events")) {
      crumbs.push({ label: "Events", to: "/events" });
      if (path.includes("/member-flow")) crumbs.push({ label: "Member Flow", to: "/events/member-flow" });
      else if (path.includes("/schedule")) crumbs.push({ label: "Schedule", to: "/events/schedule" });
      else if (path.includes("/registration")) crumbs.push({ label: "Registration", to: "/events/registration" });
      else if (path.includes("/people")) crumbs.push({ label: "People", to: "/events/people" });
      else if (path.includes("/fundraising")) crumbs.push({ label: "Fundraising", to: "/events/fundraising" });
      else if (path.includes("/operations")) crumbs.push({ label: "Operations", to: "/events/operations" });
      else if (path.includes("/media")) crumbs.push({ label: "Media & Reports", to: "/events/media" });
    } else if (path.startsWith("/sports")) {
      crumbs.push({ label: "Sports", to: "/sports" });
      if (path.includes("/leagues")) crumbs.push({ label: "Leagues", to: "/sports/leagues" });
      else if (path.includes("/teams")) crumbs.push({ label: "Teams", to: "/sports/teams" });
      else if (path.includes("/schedule")) crumbs.push({ label: "Schedule", to: "/sports/schedule" });
      else if (path.includes("/auctions")) crumbs.push({ label: "Auctions", to: "/sports/auctions" });
    } else if (path.startsWith("/marketplace")) {
      crumbs.push({ label: "Marketplace", to: "/marketplace" });
      if (path.includes("/orders")) crumbs.push({ label: "Orders", to: "/marketplace/orders" });
      else if (path.includes("/my-listings")) crumbs.push({ label: "My Listings", to: "/marketplace/my-listings" });
    } else if (path.startsWith("/visitors")) {
      crumbs.push({ label: "Visitors", to: "/visitors" });
    } else if (path.startsWith("/notices")) {
      crumbs.push({ label: "Notices", to: "/notices" });
    } else if (path.startsWith("/bookings")) {
      crumbs.push({ label: "Bookings", to: "/bookings" });
    } else if (path.startsWith("/helpdesk")) {
      crumbs.push({ label: "Helpdesk", to: "/helpdesk" });
    } else if (path.startsWith("/polls")) {
      crumbs.push({ label: "Polls", to: "/polls" });
    } else if (path.startsWith("/jobs")) {
      crumbs.push({ label: "Jobs & Referrals", to: "/jobs" });
    } else if (path.startsWith("/cpn")) {
      crumbs.push({ label: "Professional Network", to: "/cpn" });
    } else if (path.startsWith("/admin")) {
      crumbs.push({ label: "Admin Hub", to: "/admin" });
    } else if (path.startsWith("/finance")) {
      crumbs.push({ label: "Finance", to: "/finance/expenses" });
      if (path.includes("/expenses")) crumbs.push({ label: "Expenses", to: "/finance/expenses" });
      else if (path.includes("/invoices")) crumbs.push({ label: "Invoices", to: "/finance/invoices" });
      else if (path.includes("/budget")) crumbs.push({ label: "Budget", to: "/finance/budget" });
      else if (path.includes("/reports")) crumbs.push({ label: "Reports", to: "/finance/reports" });
    } else if (path.startsWith("/community")) {
      crumbs.push({ label: "Community", to: "/" });
      if (path.includes("/inventory")) crumbs.push({ label: "Inventory", to: "/community/inventory" });
      else if (path.includes("/assets")) crumbs.push({ label: "Assets", to: "/community/assets" });
      else if (path.includes("/procurement")) crumbs.push({ label: "Procurement", to: "/community/procurement" });
      else if (path.includes("/vendors")) crumbs.push({ label: "Vendors", to: "/community/vendors" });
    } else if (path.startsWith("/vendor-portal")) {
      crumbs.push({ label: "Vendor Portal", to: "/vendor-portal" });
    } else if (path.startsWith("/profile")) {
      crumbs.push({ label: "My Profile", to: "/profile" });
    } else if (path.startsWith("/architecture")) {
      crumbs.push({ label: "Architecture", to: "/architecture" });
    } else {
      const seg = path.replace("/", "").replaceAll("-", " ");
      if (seg) crumbs.push({ label: seg.charAt(0).toUpperCase() + seg.slice(1), to: path });
    }

    return crumbs;
  };

  const crumbs = getCrumbs();

  return (
    <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground ml-3">
      {crumbs.map((crumb, idx) => {
        const isLast = idx === crumbs.length - 1;
        return (
          <div key={crumb.to + idx} className="flex items-center gap-1.5">
            {idx > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground/40 shrink-0" />}
            {isLast ? (
              <span className="font-extrabold text-foreground">{crumb.label}</span>
            ) : (
              <NavLink
                to={crumb.to}
                className="hover:underline hover:text-primary transition-colors font-medium text-muted-foreground"
              >
                {crumb.label}
              </NavLink>
            )}
          </div>
        );
      })}
    </nav>
  );
}

/* ── Merged User Profile & Account Dropdown Menu ── */
function UserProfileMenu({
  user,
  isAdmin,
  isSuperAdmin,
  isAnyAdmin,
  onLogout,
}: {
  user: any;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isAnyAdmin: boolean;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const initials = user?.fullName
    ? user.fullName
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "ME";

  const firstName = user?.fullName?.split(" ")[0] ?? "Member";
  const roleLabel =
    user?.role === "SUPER_ADMIN"
      ? "Super Admin"
      : user?.role === "COMMUNITY_ADMIN"
      ? "Community Admin"
      : isAdmin
      ? "Admin"
      : user?.role === "VENDOR"
      ? "Vendor"
      : "Verified Member";

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger Button: Merged Profile & Account Toggle */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-1.5 sm:gap-2.5 pl-1.5 pr-2 sm:pr-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted/50 hover:border-primary/25 transition-all shadow-sm cursor-pointer active:scale-95 group select-none"
        title="Profile & Account Menu"
        aria-expanded={open}
      >
        <div className="h-7 w-7 rounded-lg flex items-center justify-center text-white text-xs font-black bg-primary group-hover:ring-2 group-hover:ring-primary/20 transition-all shrink-0">
          {initials}
        </div>
        <span className="hidden sm:block text-xs font-extrabold text-foreground max-w-[100px] truncate">
          {firstName}
        </span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 shrink-0",
            open && "rotate-180 text-foreground"
          )}
        />
      </button>

      {/* Merged Dropdown Menu */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 sm:w-72 bg-card border border-border rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150 flex flex-col">
          {/* User Info Header */}
          <div className="px-4 py-3.5 border-b border-border bg-muted/30 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center text-white text-sm font-black bg-primary shadow-sm shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-foreground truncate">
                {user?.fullName ?? "Community Member"}
              </p>
              <p className="text-[11px] text-muted-foreground truncate">
                {user?.email ?? user?.phone ?? ""}
              </p>
              <span className="inline-block text-[10px] font-semibold px-2 py-0.5 mt-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                {roleLabel}
              </span>
            </div>
          </div>

          {/* Navigation & Action Links */}
          <div className="p-1.5 space-y-0.5">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                navigate("/profile");
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl text-foreground hover:bg-muted/60 transition-colors cursor-pointer text-left"
            >
              <UserCircle className="h-4 w-4 text-primary shrink-0" />
              <div>
                <span className="block text-foreground">My Profile</span>
                <span className="block text-[10px] text-muted-foreground font-normal">Account settings & personal info</span>
              </div>
            </button>

            {isAnyAdmin && (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  navigate("/admin");
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl text-foreground hover:bg-muted/60 transition-colors cursor-pointer text-left"
              >
                <ShieldCheck className="h-4 w-4 text-indigo-500 shrink-0" />
                <div>
                  <span className="block text-foreground">Admin Hub</span>
                  <span className="block text-[10px] text-muted-foreground font-normal">Platform management</span>
                </div>
              </button>
            )}

            {isSuperAdmin && (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  navigate("/architecture");
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl text-foreground hover:bg-muted/60 transition-colors cursor-pointer text-left"
              >
                <Layers className="h-4 w-4 text-purple-500 shrink-0" />
                <div>
                  <span className="block text-foreground">Architecture Docs</span>
                  <span className="block text-[10px] text-muted-foreground font-normal">System documentation</span>
                </div>
              </button>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-border my-0.5" />

          {/* Logout Action */}
          <div className="p-1.5">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl text-destructive hover:bg-destructive/10 transition-colors cursor-pointer text-left"
            >
              <LogOut className="h-4 w-4 text-destructive shrink-0" />
              <div>
                <span className="block text-destructive font-bold">Logout</span>
                <span className="block text-[10px] text-destructive/70 font-normal">End your current session</span>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function Layout() {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCommunityOpen, setIsCommunityOpen] = useState(() => location.pathname.startsWith("/community"));
  const [isFinanceOpen, setIsFinanceOpen] = useState(() => location.pathname.startsWith("/finance"));
  const { user, isAdmin, isSuperAdmin, isAnyAdmin, logout, hasMenuPermission } = useAuth();
  const navigate = useNavigate();

  // Auto expand parent collapsible sub-menus when user is on a child route
  useEffect(() => {
    if (location.pathname.startsWith("/community")) {
      setIsCommunityOpen(true);
    }
    if (location.pathname.startsWith("/finance")) {
      setIsFinanceOpen(true);
    }
  }, [location.pathname]);

  // ── Global Escape Key handler to close any active modal or mobile sidebar across the app ──
  useEffect(() => {
    const handleGlobalEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isSidebarOpen) {
          setIsSidebarOpen(false);
        }
        // Find topmost open modal overlay close button and trigger click if present
        const modalCloseButtons = Array.from(
          document.querySelectorAll<HTMLElement>(
            "div.fixed.inset-0 button[aria-label='Close'], div.fixed.inset-0 button:has(svg.lucide-x), div.fixed.inset-0 button.close-btn"
          )
        );
        if (modalCloseButtons.length > 0) {
          const topBtn = modalCloseButtons[modalCloseButtons.length - 1];
          topBtn.click();
        }
      }
    };

    window.addEventListener("keydown", handleGlobalEscape);
    return () => window.removeEventListener("keydown", handleGlobalEscape);
  }, [isSidebarOpen]);

  // AuthContext fetches /users/me on boot and populates user.permissions
  const permissions = user?.permissions || [];
  const enabledModules = user?.enabledModules;
  const loadingPermissions = !!user && !user.permissions;

  const labelToModule: Record<string, string> = {
    "Community Feed": "COMMUNITY_FEED",
    "Sports": "SPORTS",
    "Marketplace": "MARKETPLACE",
    "Visitors": "VISITORS",
    "Notices": "NOTICES",
    "Bookings": "BOOKINGS",
    "Helpdesk": "HELPDESK",
    "Polls": "POLLS",
    "Jobs & Referrals": "JOBS",
    "Events": "EVENTS",
    "Professional Network": "JOBS",
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const navLinks = [
    { to: "/", icon: Users, label: "Community Feed" },
    { to: "/cpn", icon: Sparkles, label: "Professional Network" },
    { to: "/sports", icon: Trophy, label: "Sports" },
    { to: "/marketplace", icon: Store, label: "Marketplace" },
    { to: "/visitors", icon: Shield, label: "Visitors" },
    { to: "/notices", icon: Megaphone, label: "Notices" },
    { to: "/bookings", icon: Building2, label: "Bookings" },
    { to: "/helpdesk", icon: Headphones, label: "Helpdesk" },
    { to: "/polls", icon: Vote, label: "Polls" },
    { to: "/jobs", icon: Briefcase, label: "Jobs & Referrals" },
    { to: "/events", icon: CalendarDays, label: "Events" },
  ];

  const adminLinks = [
    ...(isAnyAdmin ? [{ to: "/admin", icon: ShieldCheck, label: "Admin Hub" }] : []),
    ...(isSuperAdmin ? [{ to: "/architecture", icon: Layers, label: "Architecture Docs" }] : []),
  ];

  const filteredNavLinks = navLinks.filter((link) => {
    if (isSuperAdmin) return true;
    if (loadingPermissions) return true;

    const moduleKey = labelToModule[link.label];
    if (moduleKey && enabledModules && !enabledModules.includes(moduleKey)) return false;

    if (link.label === "Community Feed") return permissions.includes(VIEW_FEED);
    if (link.label === "Sports") return permissions.includes(VIEW_SPORTS_MENU);
    if (link.label === "Marketplace") return permissions.includes(VIEW_MARKETPLACE);
    if (link.label === "Visitors") return permissions.includes(VIEW_VISITORS);
    if (link.label === "Notices") return permissions.includes(VIEW_NOTICES);
    if (link.label === "Bookings") return permissions.includes(VIEW_AMENITIES);
    if (link.label === "Helpdesk") return permissions.includes(VIEW_TICKETS);
    if (link.label === "Polls") return permissions.includes(VIEW_POLLS);
    if (link.label === "Jobs & Referrals") return permissions.includes(VIEW_JOBS);
    if (link.label === "Professional Network") return permissions.includes(VIEW_JOBS);
    if (link.label === "Events") return isAdmin || permissions.includes(VIEW_EVENTS) || permissions.includes(REGISTER_EVENT) || permissions.includes(VIEW_EVENT_GALLERY);
    return true;
  });

  const filteredAdminLinks = adminLinks.filter((link) => {
    if (isSuperAdmin) return true;
    if (loadingPermissions) return isAdmin; // default while loading
    return permissions.includes(VIEW_ADMIN);
  });

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const displayName = user?.fullName ?? "Community Member";
  const roleLabel = user?.role === "SUPER_ADMIN" ? "Super Admin" 
                 : user?.role === "COMMUNITY_ADMIN" ? "Community Admin"
                 : isAdmin ? "Admin" 
                 : user?.role === "VENDOR" ? "Vendor" 
                 : "Verified Member";

  return (
    <ChatProvider>
      <div className="h-screen bg-background flex font-sans text-foreground">
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs" onClick={() => setIsSidebarOpen(false)} />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform transition-all duration-300 ease-in-out flex flex-col overflow-hidden bg-sidebar border-r border-sidebar-border shadow-[4px_0_20px_rgba(0,0,0,0.15)]",
          isSidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full shadow-none"
        )}
      >
        <div className="w-64 flex flex-col h-full bg-sidebar">
        <div className="h-16 flex items-center px-5 border-b border-sidebar-border">
          <div className="flex items-center gap-3 flex-1">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-primary shadow-md shadow-primary/25">
              <Zap className="h-5 w-5 text-white animate-pulse" />
            </div>
            <span className="font-black text-white tracking-tight text-base">
              Mana Community
            </span>
          </div>
          <button className="text-white/40 hover:text-white/85 transition-colors p-1 rounded-lg hover:bg-white/10" onClick={() => setIsSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User Info Card inside Sidebar */}
        <div className="mx-4 my-4 rounded-xl p-3 border border-sidebar-border bg-sidebar-accent/30">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full flex items-center justify-center text-white text-xs font-black flex-shrink-0 bg-primary">
              {user?.fullName ? user.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "ME"}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs font-extrabold text-white/90 truncate leading-tight">{displayName}</p>
              <div className="flex items-center gap-1 mt-1">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping"></div>
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">
                  {roleLabel}
                </span>
                {loadingPermissions && (
                  <span className="ml-1 flex h-1.5 w-1.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-0.5 overflow-y-auto">
          {/* Nav Section Label */}
          <div className="px-2 mb-2 mt-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-white/30">
              Navigation
            </span>
          </div>

          {filteredNavLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              onClick={() => setIsSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 group border border-transparent",
                  isActive 
                    ? "text-white bg-primary border-primary/25 shadow-sm" 
                    : "text-white/50 hover:text-white/85 hover:bg-white/5"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <link.icon className={cn("h-4.5 w-4.5 mr-3 flex-shrink-0 transition-all", isActive ? "text-white" : "text-white/40 group-hover:text-white/80")} />
                  {link.label}
                  {isActive && (
                    <div className="ml-auto h-1.5 w-1.5 rounded-full bg-white" />
                  )}
                </>
              )}
            </NavLink>
          ))}

          {/* Community Management Collapsible Group */}
          {(isSuperAdmin || (enabledModules && enabledModules.includes("COMMUNITY_MGMT"))) && (
          <div className="space-y-1">
            <button
              onClick={() => setIsCommunityOpen(!isCommunityOpen)}
              className="w-full flex items-center px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 text-white/50 hover:text-white/85 hover:bg-white/5 cursor-pointer text-left focus:outline-none"
            >
              <Package className="h-4.5 w-4.5 mr-3 flex-shrink-0 text-white/40" />
              <span className="flex-1">Community Mgmt</span>
              {isCommunityOpen ? (
                <ChevronDown className="h-3.5 w-3.5 text-white/85" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-white/40" />
              )}
            </button>

            {isCommunityOpen && (
              <div className="pl-5 space-y-0.5 animate-in slide-in-from-top-1 duration-150">
                {(isSuperAdmin || hasMenuPermission("inventory", "view")) && (
                <NavLink
                  to="/community/inventory"
                  onClick={() => setIsSidebarOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 group border border-transparent",
                      isActive
                        ? "text-white bg-primary border-primary/25 shadow-sm"
                        : "text-white/50 hover:text-white/85 hover:bg-white/5"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Package className={cn("h-4 w-4 mr-2.5 flex-shrink-0", isActive ? "text-white" : "text-white/40")} />
                      Inventory
                    </>
                  )}
                </NavLink>
                )}

                {(isSuperAdmin || hasMenuPermission("inventory-management", "view")) && (
                <NavLink
                  to="/community/inventory-management"
                  onClick={() => setIsSidebarOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 group border border-transparent",
                      isActive
                        ? "text-white bg-primary border-primary/25 shadow-sm"
                        : "text-white/50 hover:text-white/85 hover:bg-white/5"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Store className={cn("h-4 w-4 mr-2.5 flex-shrink-0", isActive ? "text-white" : "text-white/40")} />
                      Inventory Management
                    </>
                  )}
                </NavLink>
                )}

                {(isSuperAdmin || hasMenuPermission("procurement", "view")) && (
                <NavLink
                  to="/community/procurement"
                  onClick={() => setIsSidebarOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 group border border-transparent",
                      isActive
                        ? "text-white bg-primary border-primary/25 shadow-sm"
                        : "text-white/50 hover:text-white/85 hover:bg-white/5"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Truck className={cn("h-4 w-4 mr-2.5 flex-shrink-0", isActive ? "text-white" : "text-white/40")} />
                      Procurement
                    </>
                  )}
                </NavLink>
                )}

                {(isSuperAdmin || hasMenuPermission("maintenance", "view")) && (
                <NavLink
                  to="/community/maintenance"
                  onClick={() => setIsSidebarOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 group border border-transparent",
                      isActive
                        ? "text-white bg-primary border-primary/25 shadow-sm"
                        : "text-white/50 hover:text-white/85 hover:bg-white/5"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <CalendarDays className={cn("h-4 w-4 mr-2.5 flex-shrink-0", isActive ? "text-white" : "text-white/40")} />
                      Maintenance
                    </>
                  )}
                </NavLink>
                )}

                {(isSuperAdmin || hasMenuPermission("audit", "view")) && (
                <NavLink
                  to="/community/audit"
                  onClick={() => setIsSidebarOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 group border border-transparent",
                      isActive
                        ? "text-white bg-primary border-primary/25 shadow-sm"
                        : "text-white/50 hover:text-white/85 hover:bg-white/5"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <ClipboardList className={cn("h-4 w-4 mr-2.5 flex-shrink-0", isActive ? "text-white" : "text-white/40")} />
                      Asset Audit
                    </>
                  )}
                </NavLink>
                )}

                {(isSuperAdmin || hasMenuPermission("resource-booking", "view")) && (
                <NavLink
                  to="/community/resource-booking"
                  onClick={() => setIsSidebarOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 group border border-transparent",
                      isActive
                        ? "text-white bg-primary border-primary/25 shadow-sm"
                        : "text-white/50 hover:text-white/85 hover:bg-white/5"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Server className={cn("h-4 w-4 mr-2.5 flex-shrink-0", isActive ? "text-white" : "text-white/40")} />
                      Resource Booking
                    </>
                  )}
                </NavLink>
                )}
              </div>
            )}
          </div>
          )}

          {/* Finance Management Collapsible Group */}
          {(isSuperAdmin || (enabledModules && enabledModules.includes("FINANCE_MGMT"))) && (
            <div className="space-y-1">
              <button
                onClick={() => setIsFinanceOpen(!isFinanceOpen)}
                className="w-full flex items-center px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 text-white/50 hover:text-white/85 hover:bg-white/5 cursor-pointer text-left focus:outline-none"
              >
                <Landmark className="h-4.5 w-4.5 mr-3 flex-shrink-0 text-white/40" />
                <span className="flex-1">Finance Mgmt</span>
                {isFinanceOpen ? (
                  <ChevronDown className="h-3.5 w-3.5 text-white/85" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-white/40" />
                )}
              </button>

              {isFinanceOpen && (
                <div className="pl-5 space-y-0.5 animate-in slide-in-from-top-1 duration-150">
                  {(isSuperAdmin || hasMenuPermission("expenses", "view")) && (
                  <NavLink
                    to="/finance/expenses"
                    onClick={() => setIsSidebarOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 group border border-transparent",
                        isActive
                          ? "text-white bg-primary border-primary/25 shadow-sm"
                          : "text-white/50 hover:text-white/85 hover:bg-white/5"
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Receipt className={cn("h-4 w-4 mr-2.5 flex-shrink-0", isActive ? "text-white" : "text-white/40")} />
                        Expenses
                      </>
                    )}
                  </NavLink>
                  )}

                  {(isSuperAdmin || hasMenuPermission("invoices", "view")) && (
                  <NavLink
                    to="/finance/invoices"
                    onClick={() => setIsSidebarOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 group border border-transparent",
                        isActive
                          ? "text-white bg-primary border-primary/25 shadow-sm"
                          : "text-white/50 hover:text-white/85 hover:bg-white/5"
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <FileText className={cn("h-4 w-4 mr-2.5 flex-shrink-0", isActive ? "text-white" : "text-white/40")} />
                        Invoices & Payments
                      </>
                    )}
                  </NavLink>
                  )}

                  {(isSuperAdmin || hasMenuPermission("budget", "view")) && (
                  <NavLink
                    to="/finance/budget"
                    onClick={() => setIsSidebarOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 group border border-transparent",
                        isActive
                          ? "text-white bg-primary border-primary/25 shadow-sm"
                          : "text-white/50 hover:text-white/85 hover:bg-white/5"
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Landmark className={cn("h-4 w-4 mr-2.5 flex-shrink-0", isActive ? "text-white" : "text-white/40")} />
                        Budget Allocation
                      </>
                    )}
                  </NavLink>
                  )}

                  {(isSuperAdmin || hasMenuPermission("reports", "view")) && (
                  <NavLink
                    to="/finance/reports"
                    onClick={() => setIsSidebarOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 group border border-transparent",
                        isActive
                          ? "text-white bg-primary border-primary/25 shadow-sm"
                          : "text-white/50 hover:text-white/85 hover:bg-white/5"
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <BarChart3 className={cn("h-4 w-4 mr-2.5 flex-shrink-0", isActive ? "text-white" : "text-white/40")} />
                        Financial Reports
                      </>
                    )}
                  </NavLink>
                  )}
                </div>
              )}
            </div>
          )}

          {filteredAdminLinks.length > 0 && (
            <>
              <div className="py-3 px-3">
                <div className="h-px bg-white/10" />
              </div>
              <div className="px-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">
                  Admin Settings
                </span>
              </div>
              {filteredAdminLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setIsSidebarOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 group border border-transparent",
                      isActive 
                        ? "text-white bg-primary border-primary/25 shadow-sm" 
                        : "text-white/50 hover:text-white/85 hover:bg-white/5"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <link.icon className={cn("h-4.5 w-4.5 mr-3 flex-shrink-0", isActive ? "text-white" : "text-white/40 group-hover:text-white/80")} />
                      {link.label}
                      {isActive && (
                        <div className="ml-auto h-1.5 w-1.5 rounded-full bg-white" />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-card border-b border-border h-14 sm:h-16 flex items-center justify-between px-3 sm:px-6 lg:px-8 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center">
            <button onClick={toggleSidebar} className="p-2 -ml-2 mr-1.5 sm:mr-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl transition-all">
              <Menu className="h-5 w-5" />
            </button>
            <span className="font-extrabold text-sm sm:text-base text-foreground lg:hidden tracking-tight">Mana Community</span>
            <AppHeaderBreadcrumb />
          </div>

          {/* Search bar - desktop */}
          <div className="hidden lg:flex items-center gap-3 flex-1 max-w-sm ml-4">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl w-full bg-input border border-border focus-within:border-primary/50 focus-within:bg-card transition-all">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search community..."
                className="bg-transparent border-none outline-none text-xs flex-1 text-foreground placeholder:text-muted-foreground/60"
              />
            </div>
          </div>

          <div className="flex-1 hidden lg:block" />

          <div className="flex items-center gap-1.5 sm:gap-3 ml-auto">
            <MobileHeaderActions />
            <NotificationBell />

            {/* Merged Profile & Logout Menu */}
            <UserProfileMenu
              user={user}
              isAdmin={isAdmin}
              isSuperAdmin={isSuperAdmin}
              isAnyAdmin={isAnyAdmin}
              onLogout={handleLogout}
            />
          </div>
        </header>

        <main className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-6 lg:p-8">
          <div className="w-full h-full">
            <Outlet />
          </div>
        </main>
        <FloatingChat />
        <FloatingChatBot />
      </div>
    </div>
    </ChatProvider>
  );
}
