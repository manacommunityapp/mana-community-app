import { Outlet, NavLink, useNavigate } from "react-router";
import { Users, Store, Briefcase, Trophy, CalendarDays, Menu, X, UserCircle, Bell, ShieldCheck, Zap, Search, LogOut, MessageCircle, Layers, Gauge } from "lucide-react";
import { useState } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useAuth } from "../../../../contexts/AuthContext";
import {
  VIEW_FEED, VIEW_SPORTS_MENU, VIEW_MARKETPLACE,
  VIEW_JOBS, VIEW_EVENTS, VIEW_ADMIN,
} from "../../../../constants/permissions";
import { FloatingChat } from "../../chat/FloatingChat";
import { ChatProvider } from "../../../../contexts/ChatContext";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 1024 : false);
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  // AuthContext fetches /users/me on boot and populates user.permissions —
  // consume it here instead of fetching again.
  const permissions = user?.permissions || [];
  const loadingPermissions = !!user && !user.permissions;

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const navLinks = [
    { to: "/", icon: Users, label: "Community Feed" },
    { to: "/sports", icon: Trophy, label: "Sports" },
    { to: "/marketplace", icon: Store, label: "Marketplace" },
    { to: "/jobs", icon: Briefcase, label: "Jobs & Referrals" },
    { to: "/events", icon: CalendarDays, label: "Events" },
  ];

  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const adminLinks = [
    ...(isAdmin ? [{ to: "/admin", icon: ShieldCheck, label: "Admin Dashboard" }] : []),
    ...(isSuperAdmin ? [{ to: "/admin/logs", icon: Gauge, label: "System Logs & Monitoring" }] : []),
    ...(isSuperAdmin ? [{ to: "/architecture", icon: Layers, label: "Architecture Docs" }] : []),
  ];

  const filteredNavLinks = navLinks.filter((link) => {
    if (isSuperAdmin) return true;
    if (loadingPermissions) return true; // default while loading
    if (link.label === "Community Feed") return permissions.includes(VIEW_FEED);
    if (link.label === "Sports") return permissions.includes(VIEW_SPORTS_MENU);
    if (link.label === "Marketplace") return permissions.includes(VIEW_MARKETPLACE);
    if (link.label === "Jobs & Referrals") return permissions.includes(VIEW_JOBS);
    if (link.label === "Events") return permissions.includes(VIEW_EVENTS);
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
      <div className="h-screen bg-background flex font-sans">
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:flex-shrink-0 flex flex-col overflow-hidden",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0 lg:w-0"
        )}
        style={{ background: "linear-gradient(180deg, #1e1b4b 0%, #16144a 60%, #12103d 100%)", borderRight: "1px solid rgba(99, 102, 241, 0.2)" }}
      >
        <div className="w-64 flex flex-col h-full">
        <div className="h-16 flex items-center px-5 border-b" style={{ borderColor: "rgba(99, 102, 241, 0.25)" }}>
          <div className="flex items-center gap-3 flex-1">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)", boxShadow: "0 0 15px rgba(99,102,241,0.4)" }}>
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-white tracking-tight" style={{ fontSize: "1.15rem", letterSpacing: "-0.01em" }}>
              Mana Community
            </span>
          </div>
          <button className="lg:hidden text-indigo-300 hover:text-white transition-colors" onClick={() => setIsSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User Info Card inside Sidebar */}
        <div className="mx-3 my-4 rounded-xl p-3 border border-indigo-500/20 bg-indigo-500/5">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
              {user?.fullName ? user.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "ME"}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-semibold text-white truncate leading-tight">{displayName}</p>
              <div className="flex items-center gap-1 mt-1">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400"></div>
                <span className="text-[10px] font-medium text-indigo-300">
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

        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {/* Nav Section Label */}
          <div className="px-2 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400" style={{ letterSpacing: "0.08em" }}>
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
                  "flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group",
                  isActive ? "text-white" : "text-indigo-300 hover:text-white hover:bg-white/5"
                )
              }
              style={({ isActive }) => isActive ? {
                background: "linear-gradient(135deg, rgba(99,102,241,0.35) 0%, rgba(139,92,246,0.25) 100%)",
                border: "1px solid rgba(99,102,241,0.4)",
                boxShadow: "0 2px 12px rgba(99,102,241,0.2)",
              } : {}}
            >
              {({ isActive }) => (
                <>
                  <link.icon className={cn("h-5 w-5 mr-3 flex-shrink-0 opacity-85 group-hover:opacity-100", isActive ? "text-indigo-200" : "text-indigo-400")} />
                  {link.label}
                  {isActive && (
                    <div className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-300" />
                  )}
                </>
              )}
            </NavLink>
          ))}

          {filteredAdminLinks.length > 0 && (
            <>
              <div className="py-3 px-3">
                <div className="h-px bg-indigo-500/20" />
              </div>
              <div className="px-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-violet-400" style={{ letterSpacing: "0.08em" }}>
                  Admin
                </span>
              </div>
              {filteredAdminLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setIsSidebarOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group",
                      isActive ? "text-white" : "text-violet-300 hover:text-white hover:bg-white/5"
                    )
                  }
                  style={({ isActive }) => isActive ? {
                    background: "linear-gradient(135deg, rgba(139,92,246,0.35) 0%, rgba(167,139,250,0.2) 100%)",
                    border: "1px solid rgba(139,92,246,0.4)",
                    boxShadow: "0 2px 12px rgba(139,92,246,0.2)",
                  } : {}}
                >
                  {({ isActive }) => (
                    <>
                      <link.icon className={cn("h-5 w-5 mr-3 flex-shrink-0 opacity-85 group-hover:opacity-100", isActive ? "text-violet-200" : "text-violet-400")} />
                      {link.label}
                      {isActive && (
                        <div className="ml-auto h-1.5 w-1.5 rounded-full bg-violet-300" />
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
        <header className="bg-card/80 backdrop-blur-xl border-b border-border h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-30 transition-all">
          <div className="flex items-center">
            <button onClick={toggleSidebar} className="p-2 -ml-2 mr-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md">
              <Menu className="h-6 w-6" />
            </button>
            <span className="font-bold text-lg text-foreground lg:hidden">Mana Community</span>
          </div>

          {/* Search bar - desktop */}
          <div className="hidden lg:flex items-center gap-3 flex-1 max-w-sm ml-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl w-full bg-input border border-border focus-within:border-primary/50 transition-colors">
              <Search className="h-4 w-4 text-indigo-400" />
              <input
                type="text"
                placeholder="Search community..."
                className="bg-transparent border-none outline-none text-sm flex-1 text-foreground placeholder:text-muted-foreground/60"
              />
            </div>
          </div>

          <div className="flex-1 hidden lg:block" />

          <div className="flex items-center gap-3 ml-auto">
            <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-xl border border-border bg-card shadow-sm relative transition-all">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-destructive rounded-full ring-2 ring-card"></span>
            </button>

            {/* Profile badge */}
            <NavLink
              to="/profile"
              className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-xl border border-border bg-card hover:bg-accent hover:border-primary/50 transition-all shadow-sm"
            >
              <div className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
                {user?.fullName ? user.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "ME"}
              </div>
              <span className="hidden sm:block text-sm font-medium text-foreground">
                {user?.fullName?.split(" ")[0] ?? "Member"}
              </span>
            </NavLink>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl border border-border bg-card hover:border-red-500/30 transition-all shadow-sm flex items-center justify-center cursor-pointer"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>

        <main className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="w-full h-full">
            <Outlet />
          </div>
        </main>
        <FloatingChat />
      </div>
    </div>
    </ChatProvider>
  );
}
