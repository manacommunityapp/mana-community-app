import { Outlet, NavLink, Link, useNavigate, useLocation } from "react-router";
import { Users, Package, Store, Briefcase, Trophy, CalendarDays, Menu, X, UserCircle, ShieldCheck, Zap, Search, LogOut, MessageCircle, Layers, Gauge, ChevronDown, ChevronRight, ChevronLeft, Truck, Landmark, FileText, BarChart3, Receipt, ClipboardList, BookOpen, Shield, Megaphone, Building2, Headphones, Vote, Server, Sparkles, Home, Lock, HeartHandshake } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useAuth } from "../../../../contexts/AuthContext";
import {
  VIEW_FEED, VIEW_SPORTS_MENU, VIEW_MARKETPLACE,
  VIEW_JOBS, VIEW_EVENTS, VIEW_ADMIN, VIEW_VISITORS, VIEW_NOTICES, VIEW_AMENITIES,
  VIEW_TICKETS, VIEW_POLLS, REGISTER_EVENT, VIEW_EVENT_GALLERY, VIEW_HOME_SERVICE,
} from "../../../../constants/permissions";
import { FloatingChat } from "../../chat/FloatingChat";
import { FloatingChatBot } from "../../chat/FloatingChatBot";
import { ChatProvider } from "../../../../contexts/ChatContext";
import { NotificationBell } from "./NotificationBell";
import { MobileHeaderActions } from "./MobileFloatingActions";
import { profileService } from "../../../../services/common/profileService";
import { resolveUserAvatar } from "../../../../utils/imageUrlUtils";
import { PrivacyPolicyModal } from "../privacy/PrivacyPolicyModal";
import { safeStorage, STORAGE_KEYS } from "../../../../utils/storage";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
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

  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [user?.profilePicUrl, user?.profilePic]);

  const userAvatar = !imgError ? resolveUserAvatar(user) : undefined;

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
        className="flex items-center gap-1.5 sm:gap-2 pl-1 pr-1.5 sm:pr-2.5 py-1 rounded-lg border border-border/80 bg-card hover:bg-muted/60 hover:border-primary/30 transition-all shadow-xs cursor-pointer active:scale-95 group select-none"
        title="Profile & Account Menu"
        aria-expanded={open}
      >
        {userAvatar ? (
          <img
            src={userAvatar}
            alt={user?.fullName ?? "Profile"}
            className="h-6 w-6 sm:h-6.5 sm:w-6.5 rounded-md object-cover group-hover:ring-2 group-hover:ring-primary/20 transition-all shrink-0 border border-border/80"
            onError={(e) => {
              const currentSrc = e.currentTarget.src;
              if (currentSrc && currentSrc.includes("?")) {
                e.currentTarget.src = currentSrc.split("?")[0];
              } else {
                setImgError(true);
              }
            }}
          />
        ) : (
          <div className="h-6 w-6 sm:h-6.5 sm:w-6.5 rounded-md flex items-center justify-center text-primary-foreground text-[10px] font-black bg-primary group-hover:ring-2 group-hover:ring-primary/20 transition-all shrink-0">
            {initials}
          </div>
        )}
        <span className="hidden sm:block text-xs font-bold text-foreground max-w-[85px] truncate">
          {firstName}
        </span>
        <ChevronDown
          className={cn(
            "h-3 w-3 text-muted-foreground transition-transform duration-200 shrink-0",
            open && "rotate-180 text-foreground"
          )}
        />
      </button>

      {/* Merged Dropdown Menu */}
      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-60 sm:w-64 max-w-[calc(100vw-1.5rem)] bg-card/95 backdrop-blur-md border border-border/80 rounded-xl shadow-xl shadow-black/10 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150 flex flex-col">
          {/* User Info Header */}
          <div className="p-2.5 bg-gradient-to-b from-muted/50 to-muted/20 border-b border-border/60 flex items-center gap-2.5">
            {userAvatar ? (
              <img
                src={userAvatar}
                alt={user?.fullName ?? "Profile"}
                className="h-8 w-8 rounded-lg object-cover ring-1 ring-border/80 shadow-2xs shrink-0"
                onError={(e) => {
                  const currentSrc = e.currentTarget.src;
                  if (currentSrc && currentSrc.includes("?")) {
                    e.currentTarget.src = currentSrc.split("?")[0];
                  } else {
                    setImgError(true);
                  }
                }}
              />
            ) : (
              <div className="h-8 w-8 rounded-lg flex items-center justify-center text-primary-foreground text-xs font-black bg-primary shadow-2xs shrink-0">
                {initials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-foreground truncate leading-tight">{user?.fullName ?? "Community Member"}</p>
              <p className="text-[10px] text-muted-foreground truncate leading-tight font-mono mt-0.5">{user?.email || "user@community.org"}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wide uppercase bg-primary/10 text-primary border border-primary/20 leading-none">
                  {roleLabel}
                </span>
                {(user?.flatNo || user?.block) && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-muted/80 text-muted-foreground border border-border/60 leading-none truncate">
                    Flat {user?.block ? `${user.block}-` : ""}{user?.flatNo}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions Links */}
          <div className="p-1 space-y-0.5 text-xs">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                navigate("/profile");
              }}
              className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-medium text-foreground/90 hover:text-foreground hover:bg-muted/70 transition-all cursor-pointer group text-left"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="h-6 w-6 rounded-md bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                  <UserCircle className="h-3.5 w-3.5" />
                </div>
                <span className="truncate">My Profile &amp; Settings</span>
              </div>
              <ChevronRight className="h-3 w-3 text-muted-foreground/30 group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                navigate("/events");
              }}
              className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-medium text-foreground/90 hover:text-foreground hover:bg-muted/70 transition-all cursor-pointer group text-left"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="h-6 w-6 rounded-md bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                  <CalendarDays className="h-3.5 w-3.5" />
                </div>
                <span className="truncate">Events &amp; My Passes</span>
              </div>
              <ChevronRight className="h-3 w-3 text-muted-foreground/30 group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                navigate("/sports");
              }}
              className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-medium text-foreground/90 hover:text-foreground hover:bg-muted/70 transition-all cursor-pointer group text-left"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="h-6 w-6 rounded-md bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                  <Trophy className="h-3.5 w-3.5" />
                </div>
                <span className="truncate">Sports &amp; Tournaments</span>
              </div>
              <ChevronRight className="h-3 w-3 text-muted-foreground/30 group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>

            {isAnyAdmin && (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  navigate("/admin");
                }}
                className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-medium text-foreground/90 hover:text-foreground hover:bg-muted/70 transition-all cursor-pointer group text-left"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-6 w-6 rounded-md bg-violet-500/10 text-violet-500 flex items-center justify-center shrink-0">
                    <ShieldCheck className="h-3.5 w-3.5" />
                  </div>
                  <span className="truncate">Admin Hub</span>
                </div>
                <ChevronRight className="h-3 w-3 text-muted-foreground/30 group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setShowPrivacyModal(true);
              }}
              className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-medium text-foreground/90 hover:text-foreground hover:bg-muted/70 transition-all cursor-pointer group text-left"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="h-6 w-6 rounded-md bg-sky-500/10 text-sky-500 flex items-center justify-center shrink-0">
                  <Lock className="h-3.5 w-3.5" />
                </div>
                <span className="truncate">Privacy &amp; Data Policy</span>
              </div>
              <ChevronRight className="h-3 w-3 text-muted-foreground/30 group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>
          </div>

          {/* Logout Action Footer */}
          <div className="p-1 border-t border-border/60 bg-muted/20">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-semibold text-destructive hover:bg-destructive/10 transition-all cursor-pointer text-left group"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="h-6 w-6 rounded-md bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
                  <LogOut className="h-3.5 w-3.5" />
                </div>
                <span className="truncate">Sign Out</span>
              </div>
              <ChevronRight className="h-3 w-3 text-destructive/40 group-hover:text-destructive group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>
          </div>
        </div>
      )}

      <PrivacyPolicyModal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
      />
    </div>
  );
}

export function Layout() {
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return safeStorage.getItem(STORAGE_KEYS.SIDEBAR_COLLAPSED) === "true";
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCommunityOpen, setIsCommunityOpen] = useState(() => location.pathname.startsWith("/community"));
  const [isFinanceOpen, setIsFinanceOpen] = useState(() => location.pathname.startsWith("/finance"));
  const { user, isAdmin, isSuperAdmin, isAnyAdmin, logout, hasMenuPermission, updateUser } = useAuth();
  const navigate = useNavigate();

  // Fetch full profile if profilePicUrl isn't yet in cache
  useEffect(() => {
    if (user && !user.profilePicUrl && !user.profilePic) {
      profileService.getProfile()
        .then((p) => {
          const resolvedPic = p?.profilePicUrl || (p as any)?.profilePic;
          if (resolvedPic) {
            updateUser({ profilePicUrl: resolvedPic });
          }
        })
        .catch(() => {});
    }
  }, [user?.userId, user?.profilePicUrl, user?.profilePic, updateUser]);

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
        if (isMobileSidebarOpen) {
          setIsMobileSidebarOpen(false);
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
  }, [isMobileSidebarOpen]);

  // AuthContext fetches /users/me on boot and populates user.permissions
  const permissions = user?.permissions || [];
  const enabledModules = user?.enabledModules;
  const loadingPermissions = !!user && !user.permissions;

  const labelToModule: Record<string, string> = {
    "Community Feed": "COMMUNITY_FEED",
    "Home Services": "HOME_SERVICES",
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

  const toggleSidebar = () => {
    if (typeof window !== "undefined" && window.innerWidth >= 1024) {
      setIsSidebarCollapsed((prev) => {
        const next = !prev;
        safeStorage.setItem(STORAGE_KEYS.SIDEBAR_COLLAPSED, String(next));
        return next;
      });
    } else {
      setIsMobileSidebarOpen((prev) => !prev);
    }
  };

  const handleNavClick = () => {
    setIsMobileSidebarOpen(false);
  };

  const navLinks = [
    { to: "/", icon: Users, label: "Community Feed" },
    { to: "/home-services", icon: HeartHandshake, label: "Home Services" },
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
    if (link.label === "Home Services") return true; // Community members can view home services
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
  const userAvatar = resolveUserAvatar(user);
  const roleLabel = user?.role === "SUPER_ADMIN" ? "Super Admin" 
                 : user?.role === "COMMUNITY_ADMIN" ? "Community Admin"
                 : isAdmin ? "Admin" 
                 : user?.role === "VENDOR" ? "Vendor" 
                 : "Verified Member";

  return (
    <ChatProvider>
      <div className="h-screen bg-background flex font-sans text-foreground overflow-hidden">
        {/* Mobile Backdrop */}
        {isMobileSidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden transition-opacity"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* ─── Collapsible Sidebar (Hidden on Mobile by default; Collapsible to Icons on Desktop) ─── */}
        <aside
          data-sidebar="content"
          data-collapsible={isSidebarCollapsed ? "icon" : "offcanvas"}
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar border-r border-sidebar-border shadow-[4px_0_20px_rgba(0,0,0,0.15)] transition-[width,transform] duration-300 ease-in-out select-none",
            // Mobile: slide-in drawer
            isMobileSidebarOpen ? "translate-x-0 w-64 shadow-2xl" : "-translate-x-full lg:translate-x-0",
            // Desktop: relative in-flow width
            "lg:relative lg:z-30 lg:shadow-none",
            isSidebarCollapsed ? "lg:w-[68px]" : "lg:w-64"
          )}
        >
          <div className="flex flex-col h-full overflow-hidden w-full bg-sidebar">
            {/* Header: App Logo & Collapse Action */}
            <div
              className={cn(
                "h-12 flex items-center border-b border-sidebar-border shrink-0 transition-all",
                isSidebarCollapsed ? "justify-between px-3 lg:justify-center lg:px-2" : "justify-between px-3"
              )}
            >
              <Link
                to="/"
                onClick={handleNavClick}
                className="flex items-center gap-2.5 hover:opacity-90 transition-opacity min-w-0"
                title="Mana Community"
              >
                <div className="h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-primary shadow-md shadow-primary/25">
                  <Zap className="h-4 w-4 text-white animate-pulse" />
                </div>
                <span className={cn("font-black text-white tracking-tight text-sm truncate", isSidebarCollapsed && "lg:hidden")}>
                  Mana Community
                </span>
              </Link>

              {/* Mobile Close X button */}
              <button
                type="button"
                className="lg:hidden text-white/50 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10 cursor-pointer"
                onClick={() => setIsMobileSidebarOpen(false)}
                title="Close Navigation"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* User Profile Info Card inside Sidebar */}
            <div
              className={cn(
                "my-2 shrink-0 transition-all",
                isSidebarCollapsed ? "mx-2.5 rounded-xl p-1.5 border border-sidebar-border bg-sidebar-accent/30 lg:mx-0 lg:px-2 lg:border-0 lg:bg-transparent lg:flex lg:justify-center" : "mx-2.5 rounded-xl p-2 border border-sidebar-border bg-sidebar-accent/30"
              )}
            >
              {/* On Desktop Collapsed: Avatar only */}
              <div
                title={`${displayName} • ${roleLabel}`}
                className={cn("cursor-pointer group flex items-center justify-center", !isSidebarCollapsed && "hidden", "hidden lg:flex")}
                onClick={() => setIsSidebarCollapsed(false)}
              >
                {userAvatar ? (
                  <img
                    src={userAvatar}
                    alt={displayName}
                    className="h-8 w-8 rounded-lg object-cover border border-sidebar-border shadow-2xs group-hover:scale-105 transition-transform"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-xs font-black bg-primary shadow-2xs group-hover:scale-105 transition-transform">
                    {user?.fullName ? user.fullName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() : "ME"}
                  </div>
                )}
              </div>

              {/* On Desktop Expanded & Mobile Drawer: Full user info card */}
              <div className={cn("flex items-center gap-2", isSidebarCollapsed && "lg:hidden")}>
                {userAvatar ? (
                  <img
                    src={userAvatar}
                    alt={displayName}
                    className="h-8 w-8 rounded-lg object-cover flex-shrink-0 border border-sidebar-border shadow-2xs"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-xs font-black flex-shrink-0 bg-primary shadow-2xs">
                    {user?.fullName ? user.fullName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() : "ME"}
                  </div>
                )}
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-xs font-bold text-white/95 truncate leading-tight">{displayName}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-primary/20 text-primary-200 border border-primary/30 uppercase tracking-wide leading-none">
                      {roleLabel}
                    </span>
                    {(user?.flatNo || user?.block) && (
                      <span className="text-[9px] text-white/50 font-medium truncate leading-none">
                        Flat {user?.block ? `${user.block}-` : ""}{user?.flatNo}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Links */}
            <nav
              className={cn(
                "flex-1 space-y-0.5 overflow-y-auto hide-scrollbar transition-all pb-3",
                isSidebarCollapsed ? "px-3 lg:px-2" : "px-3"
              )}
            >
              {/* Nav Section Label / Divider */}
              <div className={cn("my-2 h-px bg-white/10 mx-1", !isSidebarCollapsed && "hidden", "hidden lg:block")} />
              <div className={cn("px-2 mb-2 mt-2", isSidebarCollapsed && "lg:hidden")}>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-white/30">
                  Navigation
                </span>
              </div>

              {filteredNavLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === "/"}
                  title={isSidebarCollapsed ? link.label : undefined}
                  onClick={handleNavClick}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center rounded-lg text-xs font-bold transition-all duration-200 group border border-transparent",
                      isSidebarCollapsed ? "px-2.5 py-2 lg:justify-center lg:h-9 lg:w-9 lg:mx-auto lg:px-0" : "px-2.5 py-2",
                      isActive
                        ? "text-white bg-primary border-primary/25 shadow-sm"
                        : "text-white/50 hover:text-white/85 hover:bg-white/10"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <link.icon
                        className={cn(
                          "h-4 w-4 flex-shrink-0 transition-all",
                          isSidebarCollapsed ? "mr-2.5 lg:m-0" : "mr-2.5",
                          isActive ? "text-white" : "text-white/40 group-hover:text-white/80"
                        )}
                      />
                      <span className={cn("truncate", isSidebarCollapsed && "lg:hidden")}>{link.label}</span>
                      {isActive && (
                        <div className={cn("ml-auto h-1.5 w-1.5 rounded-full bg-white", isSidebarCollapsed && "lg:hidden")} />
                      )}
                    </>
                  )}
                </NavLink>
              ))}

              {/* Community Management Collapsible Group */}
              {(isSuperAdmin || (enabledModules && enabledModules.includes("COMMUNITY_MGMT"))) && (
                <div className="space-y-1">
                  {isSidebarCollapsed && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsSidebarCollapsed(false);
                        setIsCommunityOpen(true);
                      }}
                      title="Community Management"
                      className={cn(
                        "hidden lg:flex h-9 w-9 items-center justify-center mx-auto rounded-lg transition-all text-white/50 hover:text-white hover:bg-white/10 cursor-pointer",
                        location.pathname.startsWith("/community") && "text-white bg-primary/40 border border-primary/30"
                      )}
                    >
                      <Package className="h-4.5 w-4.5" />
                    </button>
                  )}

                  <div className={cn(isSidebarCollapsed && "lg:hidden")}>
                    <button
                      type="button"
                      onClick={() => setIsCommunityOpen(!isCommunityOpen)}
                      className="w-full flex items-center px-2.5 py-2 rounded-lg text-xs font-bold transition-all duration-200 text-white/50 hover:text-white/85 hover:bg-white/5 cursor-pointer text-left focus:outline-none"
                    >
                      <Package className="h-4 w-4 mr-2.5 flex-shrink-0 text-white/40" />
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
                            onClick={handleNavClick}
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
                            onClick={handleNavClick}
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
                            onClick={handleNavClick}
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
                            onClick={handleNavClick}
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
                            onClick={handleNavClick}
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
                            onClick={handleNavClick}
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
                </div>
              )}

              {/* Finance Management Collapsible Group */}
              {(isSuperAdmin || (enabledModules && enabledModules.includes("FINANCE_MGMT"))) && (
                <div className="space-y-1">
                  {isSidebarCollapsed && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsSidebarCollapsed(false);
                        setIsFinanceOpen(true);
                      }}
                      title="Finance Management"
                      className={cn(
                        "hidden lg:flex h-9 w-9 items-center justify-center mx-auto rounded-lg transition-all text-white/50 hover:text-white hover:bg-white/10 cursor-pointer",
                        location.pathname.startsWith("/finance") && "text-white bg-primary/40 border border-primary/30"
                      )}
                    >
                      <Landmark className="h-4.5 w-4.5" />
                    </button>
                  )}

                  <div className={cn(isSidebarCollapsed && "lg:hidden")}>
                    <button
                      type="button"
                      onClick={() => setIsFinanceOpen(!isFinanceOpen)}
                      className="w-full flex items-center px-2.5 py-2 rounded-lg text-xs font-bold transition-all duration-200 text-white/50 hover:text-white/85 hover:bg-white/5 cursor-pointer text-left focus:outline-none"
                    >
                      <Landmark className="h-4 w-4 mr-2.5 flex-shrink-0 text-white/40" />
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
                            onClick={handleNavClick}
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
                            onClick={handleNavClick}
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
                            onClick={handleNavClick}
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
                            onClick={handleNavClick}
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
                </div>
              )}

              {/* Admin Links */}
              {filteredAdminLinks.length > 0 && (
                <>
                  <div className={cn("my-2 h-px bg-white/10 mx-1", !isSidebarCollapsed && "hidden", "hidden lg:block")} />
                  <div className={cn("py-3 px-3", isSidebarCollapsed && "lg:hidden")}>
                    <div className="h-px bg-white/10" />
                  </div>
                  <div className={cn("px-2 mb-2", isSidebarCollapsed && "lg:hidden")}>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">
                      Admin Settings
                    </span>
                  </div>
                  {filteredAdminLinks.map((link) => (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      title={isSidebarCollapsed ? link.label : undefined}
                      onClick={handleNavClick}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center rounded-xl text-xs font-bold transition-all duration-200 group border border-transparent",
                          isSidebarCollapsed ? "px-3 py-2.5 lg:justify-center lg:h-10 lg:w-10 lg:mx-auto lg:px-0" : "px-3 py-2.5",
                          isActive
                            ? "text-white bg-primary border-primary/25 shadow-sm"
                            : "text-white/50 hover:text-white/85 hover:bg-white/10"
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <link.icon
                            className={cn(
                              "h-4.5 w-4.5 flex-shrink-0 transition-all",
                              isSidebarCollapsed ? "mr-3 lg:m-0" : "mr-3",
                              isActive ? "text-white" : "text-white/40 group-hover:text-white/80"
                            )}
                          />
                          <span className={cn("truncate", isSidebarCollapsed && "lg:hidden")}>{link.label}</span>
                          {isActive && (
                            <div className={cn("ml-auto h-1.5 w-1.5 rounded-full bg-white", isSidebarCollapsed && "lg:hidden")} />
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
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header className="bg-card border-b border-border h-12 flex items-center justify-between px-3 sm:px-6 lg:px-8 sticky top-0 z-30 shadow-sm">
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Desktop Menu Toggle Button */}
              <button
                type="button"
                onClick={toggleSidebar}
                title={isSidebarCollapsed ? "Expand Sidebar Menu" : "Collapse to Icons"}
                className="hidden lg:flex p-2 text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-xl transition-all border border-border hover:border-primary/30 shrink-0 cursor-pointer shadow-2xs items-center justify-center active:scale-95"
              >
                <Menu className="h-4.5 w-4.5" />
              </button>

              <Link
                to="/"
                className="font-extrabold text-sm sm:text-base text-foreground lg:hidden tracking-tight hover:opacity-85 transition-opacity cursor-pointer"
              >
                Mana Community
              </Link>
            </div>

            {/* Desktop Header Search Bar */}
            <div className="flex-1 max-w-md mx-3 sm:mx-6 hidden lg:block">
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent("mana:open-search"))}
                className="w-full flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-slate-100/90 hover:bg-slate-200/70 border border-slate-200/90 hover:border-slate-300 text-xs text-slate-500 hover:text-slate-700 transition-all cursor-pointer shadow-2xs group"
                title="Search features, modules, pages (Ctrl+K / ⌘K)"
              >
                <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-primary transition-colors shrink-0" />
                <span className="flex-1 text-left truncate font-medium">Search features, events, bookings, directory...</span>
                <kbd className="inline-flex items-center gap-0.5 text-[10px] font-bold text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-2xs">
                  ⌘K
                </kbd>
              </button>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-3 ml-auto">
            <MobileHeaderActions onToggleSidebar={toggleSidebar} />
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

        <main className="flex-1 min-h-0 overflow-y-auto p-2.5 sm:p-2.5 lg:p-5">
          <div className="w-full h-full">
            <Outlet />
          </div>
        </main>
        <FloatingChatBot />
      </div>
    </div>
    </ChatProvider>
  );
}
