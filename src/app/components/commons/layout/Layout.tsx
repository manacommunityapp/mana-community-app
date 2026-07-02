import { Outlet, NavLink, useNavigate } from "react-router";
import { Users, Package, Store, Briefcase, Trophy, CalendarDays, Menu, X, UserCircle, Bell, ShieldCheck, Zap, Search, LogOut, MessageCircle, Layers, Gauge, ChevronDown, ChevronRight, Truck, Landmark, FileText, BarChart3, Receipt, ClipboardList } from "lucide-react";
import { useState } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useAuth } from "../../../../contexts/AuthContext";
import {
  VIEW_FEED, VIEW_SPORTS_MENU, VIEW_MARKETPLACE,
  VIEW_JOBS, VIEW_EVENTS, VIEW_ADMIN,
} from "../../../../constants/permissions";
import { FloatingChat } from "../../chat/FloatingChat";
import { FloatingChatBot } from "../../chat/FloatingChatBot";
import { ChatProvider } from "../../../../contexts/ChatContext";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 1024 : false);
  const [isCommunityOpen, setIsCommunityOpen] = useState(false);
  const [isFinanceOpen, setIsFinanceOpen] = useState(false);
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  // AuthContext fetches /users/me on boot and populates user.permissions
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
    ...(isAdmin ? [{ to: "/admin", icon: ShieldCheck, label: "Admin Hub" }] : []),
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
      <div className="h-screen bg-slate-50 flex font-sans text-[#0d0d2b]">
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-[#0d0d2b]/25 backdrop-blur-sm lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:flex-shrink-0 flex flex-col overflow-hidden bg-white border-r border-[#6366f1]/12 shadow-[4px_0_20px_rgba(99,102,241,0.02)]",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0 lg:w-0"
        )}
      >
        <div className="w-64 flex flex-col h-full bg-white">
        <div className="h-16 flex items-center px-5 border-b border-slate-100">
          <div className="flex items-center gap-3 flex-1">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-tr from-indigo-600 to-violet-600 shadow-md shadow-indigo-500/20">
              <Zap className="h-5 w-5 text-white animate-pulse" />
            </div>
            <span className="font-black text-[#0d0d2b] tracking-tight text-base">
              Mana Community
            </span>
          </div>
          <button className="lg:hidden text-[#6b7094] hover:text-[#0d0d2b] transition-colors" onClick={() => setIsSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User Info Card inside Sidebar */}
        <div className="mx-4 my-4 rounded-xl p-3 border border-indigo-100 bg-indigo-50/20">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full flex items-center justify-center text-white text-xs font-black flex-shrink-0 bg-gradient-to-tr from-indigo-600 to-violet-600">
              {user?.fullName ? user.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "ME"}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs font-extrabold text-[#0d0d2b] truncate leading-tight">{displayName}</p>
              <div className="flex items-center gap-1 mt-1">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping"></div>
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                  {roleLabel}
                </span>
                {loadingPermissions && (
                  <span className="ml-1 flex h-1.5 w-1.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-500"></span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-0.5 overflow-y-auto">
          {/* Nav Section Label */}
          <div className="px-2 mb-2 mt-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#6b7094]">
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
                    ? "text-indigo-600 bg-gradient-to-r from-indigo-50 to-violet-50 border-indigo-100/50 shadow-sm" 
                    : "text-[#6b7094] hover:text-[#0d0d2b] hover:bg-slate-50"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <link.icon className={cn("h-4.5 w-4.5 mr-3 flex-shrink-0 transition-all", isActive ? "text-indigo-600" : "text-[#6b7094] group-hover:text-[#0d0d2b]")} />
                  {link.label}
                  {isActive && (
                    <div className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-600" />
                  )}
                </>
              )}
            </NavLink>
          ))}

          {/* Community Management Collapsible Group */}
          <div className="space-y-1">
            <button
              onClick={() => setIsCommunityOpen(!isCommunityOpen)}
              className="w-full flex items-center px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 text-[#6b7094] hover:text-[#0d0d2b] hover:bg-slate-50 cursor-pointer text-left focus:outline-none"
            >
              <Package className="h-4.5 w-4.5 mr-3 flex-shrink-0 text-[#6b7094]" />
              <span className="flex-1">Community Mgmt</span>
              {isCommunityOpen ? (
                <ChevronDown className="h-3.5 w-3.5 text-indigo-600" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-[#6b7094]" />
              )}
            </button>

            {isCommunityOpen && (
              <div className="pl-5 space-y-0.5 animate-in slide-in-from-top-1 duration-150">
                <NavLink
                  to="/community/inventory"
                  onClick={() => setIsSidebarOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 group border border-transparent",
                      isActive 
                        ? "text-indigo-600 bg-gradient-to-r from-indigo-50 to-violet-50 border-indigo-100/50 shadow-sm" 
                        : "text-[#6b7094] hover:text-[#0d0d2b] hover:bg-slate-50"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Package className={cn("h-4 w-4 mr-2.5 flex-shrink-0", isActive ? "text-indigo-600" : "text-[#6b7094]")} />
                      Inventory
                    </>
                  )}
                </NavLink>

                <NavLink
                  to="/community/inventory-management"
                  onClick={() => setIsSidebarOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 group border border-transparent",
                      isActive 
                        ? "text-indigo-600 bg-gradient-to-r from-indigo-50 to-violet-50 border-indigo-100/50 shadow-sm" 
                        : "text-[#6b7094] hover:text-[#0d0d2b] hover:bg-slate-50"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Store className={cn("h-4 w-4 mr-2.5 flex-shrink-0", isActive ? "text-indigo-600" : "text-[#6b7094]")} />
                      Inventory Management
                    </>
                  )}
                </NavLink>

                {isAdmin && (
                  <>
                    <NavLink
                      to="/community/procurement"
                      onClick={() => setIsSidebarOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 group border border-transparent",
                          isActive 
                            ? "text-indigo-600 bg-gradient-to-r from-indigo-50 to-violet-50 border-indigo-100/50 shadow-sm" 
                            : "text-[#6b7094] hover:text-[#0d0d2b] hover:bg-slate-50"
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Truck className={cn("h-4 w-4 mr-2.5 flex-shrink-0", isActive ? "text-indigo-600" : "text-[#6b7094]")} />
                          Procurement
                        </>
                      )}
                    </NavLink>

                    <NavLink
                      to="/community/maintenance"
                      onClick={() => setIsSidebarOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 group border border-transparent",
                          isActive 
                            ? "text-indigo-600 bg-gradient-to-r from-indigo-50 to-violet-50 border-indigo-100/50 shadow-sm" 
                            : "text-[#6b7094] hover:text-[#0d0d2b] hover:bg-slate-50"
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <CalendarDays className={cn("h-4 w-4 mr-2.5 flex-shrink-0", isActive ? "text-indigo-600" : "text-[#6b7094]")} />
                          Maintenance
                        </>
                      )}
                    </NavLink>

                    <NavLink
                      to="/community/audit"
                      onClick={() => setIsSidebarOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 group border border-transparent",
                          isActive 
                            ? "text-indigo-600 bg-gradient-to-r from-indigo-50 to-violet-50 border-indigo-100/50 shadow-sm" 
                            : "text-[#6b7094] hover:text-[#0d0d2b] hover:bg-slate-50"
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <ClipboardList className={cn("h-4 w-4 mr-2.5 flex-shrink-0", isActive ? "text-indigo-600" : "text-[#6b7094]")} />
                          Asset Audit
                        </>
                      )}
                    </NavLink>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Finance Management Collapsible Group */}
          {isAdmin && (
            <div className="space-y-1">
              <button
                onClick={() => setIsFinanceOpen(!isFinanceOpen)}
                className="w-full flex items-center px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 text-[#6b7094] hover:text-[#0d0d2b] hover:bg-slate-50 cursor-pointer text-left focus:outline-none"
              >
                <Landmark className="h-4.5 w-4.5 mr-3 flex-shrink-0 text-[#6b7094]" />
                <span className="flex-1">Finance Mgmt</span>
                {isFinanceOpen ? (
                  <ChevronDown className="h-3.5 w-3.5 text-indigo-600" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-[#6b7094]" />
                )}
              </button>

              {isFinanceOpen && (
                <div className="pl-5 space-y-0.5 animate-in slide-in-from-top-1 duration-150">
                  <NavLink
                    to="/finance/expenses"
                    onClick={() => setIsSidebarOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 group border border-transparent",
                        isActive 
                          ? "text-indigo-600 bg-gradient-to-r from-indigo-50 to-violet-50 border-indigo-100/50 shadow-sm" 
                          : "text-[#6b7094] hover:text-[#0d0d2b] hover:bg-slate-50"
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Receipt className={cn("h-4 w-4 mr-2.5 flex-shrink-0", isActive ? "text-indigo-600" : "text-[#6b7094]")} />
                        Expenses
                      </>
                    )}
                  </NavLink>

                  <NavLink
                    to="/finance/invoices"
                    onClick={() => setIsSidebarOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 group border border-transparent",
                        isActive 
                          ? "text-indigo-600 bg-gradient-to-r from-indigo-50 to-violet-50 border-indigo-100/50 shadow-sm" 
                          : "text-[#6b7094] hover:text-[#0d0d2b] hover:bg-slate-50"
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <FileText className={cn("h-4 w-4 mr-2.5 flex-shrink-0", isActive ? "text-indigo-600" : "text-[#6b7094]")} />
                        Invoices & Payments
                      </>
                    )}
                  </NavLink>

                  <NavLink
                    to="/finance/budget"
                    onClick={() => setIsSidebarOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 group border border-transparent",
                        isActive 
                          ? "text-indigo-600 bg-gradient-to-r from-indigo-50 to-violet-50 border-indigo-100/50 shadow-sm" 
                          : "text-[#6b7094] hover:text-[#0d0d2b] hover:bg-slate-50"
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Landmark className={cn("h-4 w-4 mr-2.5 flex-shrink-0", isActive ? "text-indigo-600" : "text-[#6b7094]")} />
                        Budget Allocation
                      </>
                    )}
                  </NavLink>

                  <NavLink
                    to="/finance/reports"
                    onClick={() => setIsSidebarOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 group border border-transparent",
                        isActive 
                          ? "text-indigo-600 bg-gradient-to-r from-indigo-50 to-violet-50 border-indigo-100/50 shadow-sm" 
                          : "text-[#6b7094] hover:text-[#0d0d2b] hover:bg-slate-50"
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <BarChart3 className={cn("h-4 w-4 mr-2.5 flex-shrink-0", isActive ? "text-indigo-600" : "text-[#6b7094]")} />
                        Financial Reports
                      </>
                    )}
                  </NavLink>
                </div>
              )}
            </div>
          )}

          {filteredAdminLinks.length > 0 && (
            <>
              <div className="py-3 px-3">
                <div className="h-px bg-slate-100" />
              </div>
              <div className="px-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#6b7094]">
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
                        ? "text-violet-600 bg-gradient-to-r from-violet-50 to-fuchsia-50 border-violet-100/50 shadow-sm" 
                        : "text-[#6b7094] hover:text-[#0d0d2b] hover:bg-slate-50"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <link.icon className={cn("h-4.5 w-4.5 mr-3 flex-shrink-0", isActive ? "text-violet-600" : "text-[#6b7094] group-hover:text-[#0d0d2b]")} />
                      {link.label}
                      {isActive && (
                        <div className="ml-auto h-1.5 w-1.5 rounded-full bg-violet-600" />
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
        <header className="bg-white border-b border-slate-100 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-30 shadow-sm shadow-[#6366f1]/5">
          <div className="flex items-center">
            <button onClick={toggleSidebar} className="p-2 -ml-2 mr-2 text-[#6b7094] hover:text-[#0d0d2b] hover:bg-slate-50 rounded-xl transition-all">
              <Menu className="h-5 w-5" />
            </button>
            <span className="font-extrabold text-base text-[#0d0d2b] lg:hidden tracking-tight">Mana Community</span>
          </div>

          {/* Search bar - desktop */}
          <div className="hidden lg:flex items-center gap-3 flex-1 max-w-sm ml-4">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl w-full bg-slate-50 border border-slate-200 focus-within:border-indigo-500/50 focus-within:bg-white transition-all">
              <Search className="h-4 w-4 text-[#6b7094]" />
              <input
                type="text"
                placeholder="Search community..."
                className="bg-transparent border-none outline-none text-xs flex-1 text-[#0d0d2b] placeholder:text-[#6b7094]/60"
              />
            </div>
          </div>

          <div className="flex-1 hidden lg:block" />

          <div className="flex items-center gap-3 ml-auto">
            <button className="p-2 text-[#6b7094] hover:text-[#0d0d2b] hover:bg-slate-50 rounded-xl border border-slate-200 bg-white shadow-sm relative transition-all cursor-pointer">
              <Bell className="h-4.5 w-4.5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full ring-2 ring-white"></span>
            </button>

            {/* Profile badge */}
            <NavLink
              to="/profile"
              className="flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-indigo-500/20 transition-all shadow-sm"
            >
              <div className="h-7 w-7 rounded-lg flex items-center justify-center text-white text-xs font-black bg-gradient-to-tr from-indigo-600 to-violet-600">
                {user?.fullName ? user.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "ME"}
              </div>
              <span className="hidden sm:block text-xs font-extrabold text-[#374151]">
                {user?.fullName?.split(" ")[0] ?? "Member"}
              </span>
            </NavLink>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl border border-slate-200 bg-white hover:border-red-200 transition-all shadow-sm flex items-center justify-center cursor-pointer"
              title="Logout"
            >
              <LogOut className="h-4.5 w-4.5" />
            </button>
          </div>
        </header>

        <main className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 lg:p-8">
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
