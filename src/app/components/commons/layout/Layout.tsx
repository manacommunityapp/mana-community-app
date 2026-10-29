import { Outlet, NavLink, Link, useNavigate, useLocation } from "react-router";
import {
  Users, Package, Store, Briefcase, Trophy, CalendarDays, Menu, X, UserCircle, ShieldCheck,
  Zap, Search, LogOut, MessageCircle, Layers, Gauge, ChevronDown, ChevronRight, ChevronLeft,
  Truck, Landmark, FileText, BarChart3, Receipt, ClipboardList, BookOpen, Shield, Megaphone,
  Building2, Headphones, Vote, Server, Sparkles, Home, Lock, HeartHandshake, ShieldAlert,
  ShoppingBag, Compass, CreditCard, GraduationCap, Tag, Heart, Stethoscope, Wallet, Car,
  PieChart, CalendarClock, HeartPulse, FolderKanban, Brain, Bot, Calendar, ShoppingCart,
  Smartphone, Film
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useAuth } from "../../../../contexts/AuthContext";
import {
  VIEW_FEED, VIEW_SPORTS_MENU, VIEW_MARKETPLACE,
  VIEW_JOBS, VIEW_EVENTS, VIEW_ADMIN, VIEW_VISITORS, VIEW_SAFETY, VIEW_NOTICES, VIEW_AMENITIES,
  VIEW_TICKETS, VIEW_POLLS, REGISTER_EVENT, VIEW_EVENT_GALLERY, VIEW_HOME_SERVICE,
  VIEW_EMERGENCY, VIEW_GROUP_BUYING, VIEW_TRIPS, VIEW_DISCOVER, VIEW_MAINTENANCE_DUES,
  PAY_MAINTENANCE_DUES, VIEW_PARKING,
} from "../../../../constants/permissions";
import { FloatingChat } from "../../chat/FloatingChat";
import { FloatingChatBot } from "../../chat/FloatingChatBot";
import { ChatProvider } from "../../../../contexts/ChatContext";
import { NotificationBell } from "./NotificationBell";
import { MobileHeaderActions } from "./MobileFloatingActions";
import { profileService } from "../../../../services/common/profileService";
import { resolveUserAvatar, resolveImageUrl } from "../../../../utils/imageUrlUtils";
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
        className="flex items-center gap-1.5 sm:gap-2 pl-1 pr-1.5 sm:pr-2.5 py-1 rounded-xl border border-[#EBEFF2] bg-white hover:bg-[#F9FAFC] hover:border-[#A7F3D0] transition-all shadow-xs cursor-pointer active:scale-95 group select-none"
        title="Profile & Account Menu"
        aria-expanded={open}
      >
        {userAvatar ? (
          <img
            src={userAvatar}
            alt={user?.fullName ?? "Profile"}
            className="h-6.5 w-6.5 rounded-lg object-cover ring-1 ring-[#EBEFF2] group-hover:ring-2 group-hover:ring-[#00D09C]/30 transition-all shrink-0"
            onError={(e) => {
              const currentSrc = e.currentTarget.src;
              if (currentSrc && !currentSrc.includes("/api/files/")) {
                const s3Match = currentSrc.match(/users\/\d+\/gallery\/.+/);
                if (s3Match) {
                  e.currentTarget.src = `/api/files/${s3Match[0].split("?")[0]}`;
                  return;
                }
              }
              setImgError(true);
            }}
          />
        ) : (
          <div className="h-6.5 w-6.5 rounded-lg flex items-center justify-center text-white text-[10px] font-black bg-[#00D09C] shadow-xs group-hover:ring-2 group-hover:ring-[#00D09C]/30 transition-all shrink-0">
            {initials}
          </div>
        )}
        <span className="hidden sm:block text-xs font-semibold text-[#44475B] max-w-[85px] truncate">
          {firstName}
        </span>
        <ChevronDown
          className={cn(
            "h-3 w-3 text-[#7C7E8C] transition-transform duration-200 shrink-0",
            open && "rotate-180 text-[#00D09C]"
          )}
        />
      </button>

      {/* Merged Dropdown Menu */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 max-w-[calc(100vw-1.5rem)] bg-white border border-[#EBEFF2] rounded-2xl shadow-xl shadow-slate-900/10 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150 flex flex-col">
          {/* User Info Header with Groww Emerald Badge */}
          <div className="p-3 bg-gradient-to-b from-[#F9FAFC] to-white border-b border-[#EBEFF2] flex items-center gap-3">
            {userAvatar ? (
              <img
                src={userAvatar}
                alt={user?.fullName ?? "Profile"}
                className="h-9 w-9 rounded-xl object-cover ring-1 ring-[#EBEFF2] shadow-2xs shrink-0"
                onError={(e) => {
                  const currentSrc = e.currentTarget.src;
                  if (currentSrc && !currentSrc.includes("/api/files/")) {
                    const s3Match = currentSrc.match(/users\/\d+\/gallery\/.+/);
                    if (s3Match) {
                      e.currentTarget.src = `/api/files/${s3Match[0].split("?")[0]}`;
                      return;
                    }
                  }
                  setImgError(true);
                }}
              />
            ) : (
              <div className="h-9 w-9 rounded-xl flex items-center justify-center text-white text-xs font-black bg-[#00D09C] shadow-2xs shrink-0">
                {initials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-[#44475B] truncate leading-tight">{user?.fullName ?? "Community Member"}</p>
              <p className="text-[10px] text-[#7C7E8C] truncate leading-tight font-mono mt-0.5">{user?.email || "user@community.org"}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase bg-[#E6FAF5] text-[#008767] border border-[#A7F3D0] leading-none">
                  {roleLabel}
                </span>
                {(user?.flatNo || user?.block) && (
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-[#F1F4F7] text-[#7C7E8C] border border-[#EBEFF2] leading-none truncate">
                    Flat {user?.block ? `${user.block}-` : ""}{user?.flatNo}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions Links */}
          <div className="p-1.5 space-y-0.5 text-xs">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                navigate("/profile");
              }}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium text-[#44475B] hover:text-[#008767] hover:bg-[#E6FAF5]/60 transition-all cursor-pointer group text-left"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-6.5 w-6.5 rounded-lg bg-[#EEF2FF] text-[#5367FF] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <UserCircle className="h-3.5 w-3.5" />
                </div>
                <span className="truncate">My Profile &amp; Settings</span>
              </div>
              <ChevronRight className="h-3 w-3 text-[#DFE4E8] group-hover:text-[#00D09C] group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                navigate("/events");
              }}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium text-[#44475B] hover:text-[#008767] hover:bg-[#E6FAF5]/60 transition-all cursor-pointer group text-left"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-6.5 w-6.5 rounded-lg bg-[#FFFBEB] text-[#FFB800] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <CalendarDays className="h-3.5 w-3.5" />
                </div>
                <span className="truncate">Events &amp; Passes</span>
              </div>
              <ChevronRight className="h-3 w-3 text-[#DFE4E8] group-hover:text-[#00D09C] group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                navigate("/sports");
              }}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium text-[#44475B] hover:text-[#008767] hover:bg-[#E6FAF5]/60 transition-all cursor-pointer group text-left"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-6.5 w-6.5 rounded-lg bg-[#E6FAF5] text-[#008767] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Trophy className="h-3.5 w-3.5" />
                </div>
                <span className="truncate">Sports &amp; Tournaments</span>
              </div>
              <ChevronRight className="h-3 w-3 text-[#DFE4E8] group-hover:text-[#00D09C] group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>

            {isAnyAdmin && (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  navigate("/admin");
                }}
                className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium text-[#44475B] hover:text-[#008767] hover:bg-[#E6FAF5]/60 transition-all cursor-pointer group text-left"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-6.5 w-6.5 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <ShieldCheck className="h-3.5 w-3.5" />
                  </div>
                  <span className="truncate">Admin Hub</span>
                </div>
                <ChevronRight className="h-3 w-3 text-[#DFE4E8] group-hover:text-[#00D09C] group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setShowPrivacyModal(true);
              }}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium text-[#44475B] hover:text-[#008767] hover:bg-[#E6FAF5]/60 transition-all cursor-pointer group text-left"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-6.5 w-6.5 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Lock className="h-3.5 w-3.5" />
                </div>
                <span className="truncate">Privacy &amp; Data Policy</span>
              </div>
              <ChevronRight className="h-3 w-3 text-[#DFE4E8] group-hover:text-[#00D09C] group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>
          </div>

          {/* Logout Action Footer */}
          <div className="p-1.5 border-t border-[#EBEFF2] bg-[#F9FAFC]">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold text-[#DC2626] hover:bg-[#FEEFEF] transition-all cursor-pointer text-left group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-6.5 w-6.5 rounded-lg bg-[#FEEFEF] text-[#DC2626] flex items-center justify-center shrink-0">
                  <LogOut className="h-3.5 w-3.5" />
                </div>
                <span className="truncate">Sign Out</span>
              </div>
              <ChevronRight className="h-3 w-3 text-[#DC2626]/40 group-hover:text-[#DC2626] group-hover:translate-x-0.5 transition-all shrink-0" />
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
          const rawPic = p?.profilePicUrl || (p as any)?.profilePic;
          const resolvedPic = resolveImageUrl(rawPic);
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

  const labelToModule: Record<string, string | string[]> = {
    "Community Feed": "COMMUNITY_FEED",
    "Safety & Security": ["VISITORS", "SAFETY"],
    "Mana Pay": ["FINANCE_MGMT", "PAYMENTS", "MANA_PAY"],
    "Mana Deals": "COMMUNITY_OFFERS",
    "Mana Academy": "ACADEMY",
    "Mana Health": "HEALTH",
    "Health Buddy": "WELLNESS",
    "Mana HealthGuard": "HEALTH_GUARD",
    "Mana Insurance": "INSURANCE",
    "Emergency SOS": "EMERGENCY",
    "Home Services": "HOME_SERVICES",
    "Group Buying": "GROUP_BUYING",
    "Community Trips": "TRIPS",
    "Community Discover": "COMMUNITY_GRAPH",
    "Governance & Decisions": "GOVERNANCE",
    "Pet Registry": "HOME_SERVICES",
    "Sports": "SPORTS",
    "Marketplace": "MARKETPLACE",
    "Visitors": "VISITORS",
    "Notices": "NOTICES",
    "Bookings": "BOOKINGS",
    "Helpdesk": "HELPDESK",
    "Smart Helpdesk": "HELPDESK",
    "Maintenance Dues": "FINANCE_MGMT",
    "Bills & Autopay": "FINANCE_MGMT",
    "My Money": ["PERSONAL_FINANCE", "FINANCE_MGMT"],
    "Parking & Vehicles": ["PARKING", "VISITORS"],
    "Mana Split": ["FINANCE_MGMT", "MANA_SPLIT"],
    "Polls": "POLLS",
    "Jobs & Referrals": "JOBS",
    "Events": "EVENTS",
    "Professional Network": "JOBS",
    "Personal Finance": "PERSONAL_FINANCE",
    "Health Hub": "HEALTH",
    "Community Rides": "COMMUTE",
    "Projects": "PROJECTS",
    "Automation": "AUTOMATION",
    "Intelligence": "INTELLIGENCE",
    "AI Chat": "AI_CHAT",
    "Calendar": "CALENDAR",
    "Commerce": "COMMERCE",
    "Mobile Recharge": ["PAYMENTS", "MANA_PAY", "FINANCE_MGMT"],
    "Smart Gates": ["VISITORS", "SAFETY"],
    "Community Calendar": "CALENDAR",
    "Vehicle Care": "HOME_SERVICES",
    "Property OS (CPOS)": "CPOS",
    "Movie Night": ["ENTERTAINMENT", "MOVIES"],
    "Food & Dining": "FOOD_OS",
    "Fixed Deposits": ["FINANCE_MGMT", "PERSONAL_FINANCE"],
    "Digital Gold": ["FINANCE_MGMT", "PERSONAL_FINANCE"],
    "Mutual Funds": ["FINANCE_MGMT", "PERSONAL_FINANCE"],
    "Loans & EMI": ["FINANCE_MGMT", "PERSONAL_FINANCE"],
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
  interface NavItem {
    to: string;
    icon: any;
    label: string;
    badge?: string;
    /** Optional: matches menuPermissions[].menuKey from backend. Enables dynamic per-role visibility. */
    menuKey?: string;
  }

  interface NavSection {
    id: string;
    title: string;
    items: NavItem[];
  }

  const navSections: NavSection[] = [
    {
      id: "core",
      title: "Core & Safety",
      items: [
        { to: "/", icon: Users, label: "Community Feed", menuKey: "community-feed" },
        { to: "/safety", icon: ShieldCheck, label: "Safety & Security", menuKey: "safety" },
        { to: "/access/turnstiles", icon: ShieldCheck, label: "Smart Gates", badge: "Live", menuKey: "smart-gates" },
        { to: "/emergency", icon: ShieldAlert, label: "Emergency SOS", badge: "24/7", menuKey: "emergency" },
        { to: "/commute", icon: Car, label: "Community Rides", menuKey: "commute" },
      ],
    },
    {
      id: "living",
      title: "Living & Facilities",
      items: [
        { to: "/calendar", icon: Calendar, label: "Community Calendar", badge: "NEW", menuKey: "calendar" },
        { to: "/notices", icon: Megaphone, label: "Notices", menuKey: "notices" },
        { to: "/pay", icon: CreditCard, label: "Mana Pay", badge: "UPI", menuKey: "mana-pay" },
        { to: "/recharge", icon: Smartphone, label: "Mobile Recharge", badge: "NEW", menuKey: "recharge" },
        { to: "/bookings", icon: Building2, label: "Bookings", menuKey: "amenity-booking" },
        { to: "/vehicle-care", icon: Car, label: "Vehicle Care", badge: "Wash", menuKey: "vehicle-care" },
        { to: "/parking", icon: Car, label: "Parking & Vehicles", menuKey: "parking" },
        { to: "/helpdesk-smart", icon: Headphones, label: "Smart Helpdesk", menuKey: "helpdesk" },
        { to: "/finance/maintenance", icon: CreditCard, label: "Maintenance Dues", menuKey: "maintenance-dues" },
        { to: "/finance/bills", icon: CalendarClock, label: "Bills & Autopay", badge: "CRED", menuKey: "bills-autopay" },
        { to: "/my-money", icon: Wallet, label: "My Money", menuKey: "my-money" },
        { to: "/cpos", icon: Home, label: "Property OS (CPOS)", badge: "CPOS", menuKey: "cpos" },
        { to: "/visitors", icon: Shield, label: "Visitors", menuKey: "visitors" },
      ],
    },
    {
      id: "social",
      title: "Community & Lifestyle",
      items: [
        { to: "/discover", icon: Sparkles, label: "Community Discover", menuKey: "discover" },
        { to: "/health", icon: Stethoscope, label: "Mana Health", badge: "New", menuKey: "health" },
        { to: "/wellness", icon: HeartPulse, label: "Health Buddy", badge: "New", menuKey: "health-buddy" },
        { to: "/healthguard", icon: ShieldAlert, label: "Mana HealthGuard", badge: "SOS", menuKey: "healthguard" },
        { to: "/insurance", icon: ShieldCheck, label: "Mana Insurance", badge: "New", menuKey: "insurance" },
        { to: "/sports", icon: Trophy, label: "Sports", menuKey: "sports" },
        { to: "/events", icon: CalendarDays, label: "Events", menuKey: "events" },
        { to: "/movies", icon: Film, label: "Movie Night", badge: "Cinema", menuKey: "movies" },
        { to: "/trips", icon: Compass, label: "Community Trips", menuKey: "trips" },
        { to: "/split", icon: PieChart, label: "Mana Split", badge: "New", menuKey: "split-bill" },
        { to: "/pets", icon: Heart, label: "Pet Registry", menuKey: "pets" },
        { to: "/polls", icon: Vote, label: "Polls", menuKey: "polls" },
      ],
    },
    {
      id: "commerce",
      title: "Commerce & Network",
      items: [
        { to: "/marketplace", icon: Store, label: "Marketplace", menuKey: "marketplace" },
        { to: "/deals", icon: Tag, label: "Mana Deals", menuKey: "deals" },
        { to: "/food", icon: ShoppingCart, label: "Food & Dining", menuKey: "food" },
        { to: "/academy", icon: GraduationCap, label: "Mana Academy", menuKey: "academy" },
        { to: "/group-buying", icon: ShoppingBag, label: "Group Buying", menuKey: "group-buying" },
        { to: "/home-services", icon: HeartHandshake, label: "Home Services", menuKey: "home-services" },
        { to: "/jobs", icon: Briefcase, label: "Jobs & Referrals", menuKey: "jobs" },
        { to: "/cpn", icon: Sparkles, label: "Professional Network", menuKey: "professional-network" },
        { to: "/governance", icon: Landmark, label: "Governance & Decisions", menuKey: "governance" },
      ],
    },
    {
      id: "wealth",
      title: "Wealth & Investments",
      items: [
        { to: "/fd", icon: Landmark, label: "Fixed Deposits", badge: "8.5%", menuKey: "fixed-deposits" },
        { to: "/gold", icon: Sparkles, label: "Digital Gold", badge: "24K", menuKey: "digital-gold" },
        { to: "/mutual-funds", icon: BarChart3, label: "Mutual Funds", badge: "SIP", menuKey: "mutual-funds" },
        { to: "/loans", icon: Receipt, label: "Loans & EMI", badge: "Pre-Appr", menuKey: "loans" },
      ],
    },
  ];

  const adminLinks = [
    ...(isAnyAdmin ? [{ to: "/admin", icon: ShieldCheck, label: "Admin Hub" }] : []),
    ...(isSuperAdmin ? [{ to: "/architecture", icon: Layers, label: "Architecture Docs" }] : []),
  ];

  const isModuleEnabled = (moduleKeyOrKeys: string | string[]): boolean => {
    if (isSuperAdmin && !user?.communityId) return true;
    if (!enabledModules || enabledModules.length === 0) return false;
    const keys = Array.isArray(moduleKeyOrKeys) ? moduleKeyOrKeys : [moduleKeyOrKeys];
    return keys.some((k) => enabledModules.includes(k));
  };

  /**
   * Hybrid visibility check — three-tier logic:
   * 1. If the link has a menuKey AND user.menuPermissions[] is populated (backend-driven):
   *    → use hasMenuPermission(menuKey, "view") — fully dynamic, no code changes needed for new items
   * 2. Else fall back to the legacy label-based module + permission check (old behaviour)
   * 3. SuperAdmin always sees everything
   */
  const isLinkVisible = (label: string, menuKey?: string) => {
    if (loadingPermissions) return true;

    // SuperAdmin bypass
    if (isSuperAdmin) return true;

    // Tier 1: dynamic menuPermissions from backend (populated after /users/me)
    if (menuKey && user?.menuPermissions && user.menuPermissions.length > 0) {
      return hasMenuPermission(menuKey, "view");
    }

    // Tier 2: legacy module-enablement check
    const moduleConfig = labelToModule[label];
    if (moduleConfig) {
      if (!isModuleEnabled(moduleConfig)) {
        return false;
      }
    }

    // Tier 3: legacy hardcoded permission check (fallback)
    if (label === "Community Feed") return permissions.includes(VIEW_FEED);
    if (label === "Safety & Security") return permissions.includes(VIEW_SAFETY) || permissions.includes(VIEW_VISITORS) || isAnyAdmin;
    if (label === "Mana Pay") return permissions.includes(VIEW_MAINTENANCE_DUES) || permissions.includes(PAY_MAINTENANCE_DUES) || permissions.includes(VIEW_ADMIN) || isAnyAdmin;
    if (label === "Maintenance Dues") return permissions.includes(VIEW_MAINTENANCE_DUES) || isAnyAdmin;
    if (label === "Bills & Autopay") return permissions.includes(VIEW_MAINTENANCE_DUES) || permissions.includes(PAY_MAINTENANCE_DUES) || isAnyAdmin;
    if (label === "Emergency SOS") return permissions.includes(VIEW_EMERGENCY);
    if (label === "Home Services") return permissions.includes(VIEW_HOME_SERVICE);
    if (label === "Group Buying") return permissions.includes(VIEW_GROUP_BUYING);
    if (label === "Community Trips") return permissions.includes(VIEW_TRIPS);
    if (label === "Community Discover") return permissions.includes(VIEW_DISCOVER);
    if (label === "Sports") return permissions.includes(VIEW_SPORTS_MENU);
    if (label === "Marketplace") return permissions.includes(VIEW_MARKETPLACE);
    if (label === "Visitors") return permissions.includes(VIEW_VISITORS);
    if (label === "Notices") return permissions.includes(VIEW_NOTICES);
    if (label === "Bookings") return permissions.includes(VIEW_AMENITIES);
    if (label === "Helpdesk" || label === "Smart Helpdesk") return permissions.includes(VIEW_TICKETS);
    if (label === "Polls") return permissions.includes(VIEW_POLLS);
    if (label === "Jobs & Referrals") return permissions.includes(VIEW_JOBS);
    if (label === "Professional Network") return permissions.includes(VIEW_JOBS);
    if (label === "Events") return isAdmin || permissions.includes(VIEW_EVENTS) || permissions.includes(REGISTER_EVENT) || permissions.includes(VIEW_EVENT_GALLERY);
    if (label === "Parking & Vehicles") return permissions.includes(VIEW_PARKING) || permissions.includes(VIEW_VISITORS) || isAnyAdmin;
    if (label === "Mana Deals") return true;
    if (label === "Mana Academy") return true;
    if (label === "Mana Health" || label === "Health Hub") return true;
    if (label === "Health Buddy") return true;
    if (label === "Mana HealthGuard") return true;
    if (label === "Mana Insurance") return true;
    if (label === "Governance & Decisions") return true;
    if (label === "Pet Registry") return true;
    if (label === "Community Rides") return true;
    if (label === "My Money") return true;
    if (label === "Mana Split") return true;
    if (label === "Mobile Recharge") return true;
    if (label === "Smart Gates") return permissions.includes(VIEW_SAFETY) || permissions.includes(VIEW_VISITORS) || isAnyAdmin;
    if (label === "Community Calendar" || label === "Calendar") return true;
    if (label === "Vehicle Care") return true;
    if (label === "Property OS (CPOS)") return true;
    if (label === "Movie Night") return isModuleEnabled(["ENTERTAINMENT", "MOVIES"]);
    if (label === "Food & Dining") return true;
    if (label === "Fixed Deposits") return true;
    if (label === "Digital Gold") return true;
    if (label === "Mutual Funds") return true;
    if (label === "Loans & EMI") return true;
    return false;
  };

  const filteredSections = navSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => isLinkVisible(item.label, item.menuKey)),
    }))
    .filter((section) => section.items.length > 0);

  const filteredAdminLinks = adminLinks.filter((link) => {
    if (isSuperAdmin) return true;
    if (loadingPermissions) return isAdmin;
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
                "h-14 flex items-center border-b border-white/10 shrink-0 transition-all",
                isSidebarCollapsed ? "justify-between px-3 lg:justify-center lg:px-2" : "justify-between px-3.5"
              )}
            >
              <Link
                to="/"
                onClick={handleNavClick}
                className="flex items-center gap-2.5 hover:opacity-95 transition-opacity min-w-0 group"
                title="Mana Community"
              >
                <div className="h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#00D09C] shadow-md shadow-[#00D09C]/25 group-hover:scale-105 transition-transform">
                  <Zap className="h-4.5 w-4.5 text-white" />
                </div>
                <div className={cn("min-w-0 flex flex-col", isSidebarCollapsed && "lg:hidden")}>
                  <span className="font-extrabold text-white tracking-tight text-sm truncate leading-tight">
                    Mana Community
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium tracking-wide">
                    Super App
                  </span>
                </div>
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
                isSidebarCollapsed
                  ? "mx-2 rounded-xl p-1 lg:mx-0 lg:px-2 lg:border-0 lg:bg-transparent lg:flex lg:justify-center"
                  : "mx-3 rounded-2xl p-2.5 border border-white/10 bg-slate-800/50 backdrop-blur-xs"
              )}
            >
              {/* On Desktop Collapsed: Avatar only */}
              <div
                title={`${displayName} • ${roleLabel}`}
                className={cn(
                  "cursor-pointer group items-center justify-center",
                  isSidebarCollapsed ? "hidden lg:flex" : "hidden"
                )}
                onClick={() => setIsSidebarCollapsed(false)}
              >
                {userAvatar ? (
                  <img
                    src={userAvatar}
                    alt={displayName}
                    className="h-8.5 w-8.5 rounded-xl object-cover ring-1 ring-white/20 shadow-2xs group-hover:scale-105 transition-transform"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="h-8.5 w-8.5 rounded-xl flex items-center justify-center text-white text-xs font-black bg-[#00D09C] shadow-2xs group-hover:scale-105 transition-transform">
                    {user?.fullName ? user.fullName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() : "ME"}
                  </div>
                )}
              </div>

              {/* On Desktop Expanded & Mobile Drawer: Full user info card */}
              <div className={cn("flex items-center gap-2.5", isSidebarCollapsed && "lg:hidden")}>
                {userAvatar ? (
                  <img
                    src={userAvatar}
                    alt={displayName}
                    className="h-9 w-9 rounded-xl object-cover flex-shrink-0 ring-1 ring-white/20 shadow-2xs"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="h-9 w-9 rounded-xl flex items-center justify-center text-white text-xs font-black flex-shrink-0 bg-[#00D09C] shadow-2xs">
                    {user?.fullName ? user.fullName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() : "ME"}
                  </div>
                )}
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-xs font-bold text-white truncate leading-tight">{displayName}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-[#00D09C]/20 text-[#A7F3D0] border border-[#00D09C]/30 uppercase tracking-wide leading-none">
                      {roleLabel}
                    </span>
                    {(user?.flatNo || user?.block) && (
                      <span className="text-[9px] text-slate-400 font-medium truncate leading-none">
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
              {filteredSections.map((section, sIdx) => (
                <div key={section.id} className="space-y-0.5">
                  {/* Category Section Header / Divider */}
                  <div className={cn(sIdx > 0 && "pt-3 pb-1", isSidebarCollapsed && "lg:hidden")}>
                    <div className="flex items-center justify-between px-2.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {section.title}
                      </span>
                    </div>
                  </div>
                  {sIdx > 0 && isSidebarCollapsed && (
                    <div className="hidden lg:block my-2 h-px bg-white/10 mx-1" />
                  )}

                  {section.items.map((link) => (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      end={link.to === "/"}
                      title={isSidebarCollapsed ? link.label : undefined}
                      onClick={handleNavClick}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center rounded-xl text-xs font-semibold transition-all duration-150 group border border-transparent",
                          isSidebarCollapsed
                            ? "px-2.5 py-2 lg:justify-center lg:h-9 lg:w-9 lg:mx-auto lg:px-0"
                            : "px-2.5 py-1.5",
                          isActive
                            ? "text-[#008767] bg-[#E6FAF5] border-[#A7F3D0]/60 shadow-xs font-bold"
                            : "text-slate-300 hover:text-white hover:bg-white/10"
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <link.icon
                            className={cn(
                              "h-4 w-4 flex-shrink-0 transition-transform group-hover:scale-105",
                              isSidebarCollapsed ? "mr-2.5 lg:m-0" : "mr-2.5",
                              isActive ? "text-[#00D09C]" : "text-slate-400 group-hover:text-slate-200"
                            )}
                          />
                          <span className={cn("truncate flex-1 text-left", isSidebarCollapsed && "lg:hidden")}>
                            {link.label}
                          </span>
                          {link.badge && (
                            <span
                              className={cn(
                                "ml-1.5 px-1.5 py-0.2 rounded-full text-[9px] font-bold tracking-tight uppercase leading-none",
                                isSidebarCollapsed && "lg:hidden",
                                isActive
                                  ? "bg-[#00D09C] text-white"
                                  : link.badge === "24/7"
                                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                  : "bg-[#00D09C]/20 text-[#A7F3D0] border border-[#00D09C]/30"
                              )}
                            >
                              {link.badge}
                            </span>
                          )}
                          {isActive && !link.badge && (
                            <div className={cn("ml-auto h-1.5 w-1.5 rounded-full bg-[#00D09C]", isSidebarCollapsed && "lg:hidden")} />
                          )}
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
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
                                "flex items-center px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 group border border-transparent",
                                isActive
                                  ? "text-[#008767] bg-[#E6FAF5] border-[#A7F3D0]/60 shadow-xs font-bold"
                                  : "text-slate-300 hover:text-white hover:bg-white/10"
                              )
                            }
                          >
                            {({ isActive }) => (
                              <>
                                <Package className={cn("h-4 w-4 mr-2.5 flex-shrink-0", isActive ? "text-[#00D09C]" : "text-slate-400 group-hover:text-slate-200")} />
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
                                "flex items-center px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 group border border-transparent",
                                isActive
                                  ? "text-[#008767] bg-[#E6FAF5] border-[#A7F3D0]/60 shadow-xs font-bold"
                                  : "text-slate-300 hover:text-white hover:bg-white/10"
                              )
                            }
                          >
                            {({ isActive }) => (
                              <>
                                <Store className={cn("h-4 w-4 mr-2.5 flex-shrink-0", isActive ? "text-[#00D09C]" : "text-slate-400 group-hover:text-slate-200")} />
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
                                "flex items-center px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 group border border-transparent",
                                isActive
                                  ? "text-[#008767] bg-[#E6FAF5] border-[#A7F3D0]/60 shadow-xs font-bold"
                                  : "text-slate-300 hover:text-white hover:bg-white/10"
                              )
                            }
                          >
                            {({ isActive }) => (
                              <>
                                <Truck className={cn("h-4 w-4 mr-2.5 flex-shrink-0", isActive ? "text-[#00D09C]" : "text-slate-400 group-hover:text-slate-200")} />
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
                                "flex items-center px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 group border border-transparent",
                                isActive
                                  ? "text-[#008767] bg-[#E6FAF5] border-[#A7F3D0]/60 shadow-xs font-bold"
                                  : "text-slate-300 hover:text-white hover:bg-white/10"
                              )
                            }
                          >
                            {({ isActive }) => (
                              <>
                                <CalendarDays className={cn("h-4 w-4 mr-2.5 flex-shrink-0", isActive ? "text-[#00D09C]" : "text-slate-400 group-hover:text-slate-200")} />
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
                                "flex items-center px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 group border border-transparent",
                                isActive
                                  ? "text-[#008767] bg-[#E6FAF5] border-[#A7F3D0]/60 shadow-xs font-bold"
                                  : "text-slate-300 hover:text-white hover:bg-white/10"
                              )
                            }
                          >
                            {({ isActive }) => (
                              <>
                                <ClipboardList className={cn("h-4 w-4 mr-2.5 flex-shrink-0", isActive ? "text-[#00D09C]" : "text-slate-400 group-hover:text-slate-200")} />
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
                                "flex items-center px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 group border border-transparent",
                                isActive
                                  ? "text-[#008767] bg-[#E6FAF5] border-[#A7F3D0]/60 shadow-xs font-bold"
                                  : "text-slate-300 hover:text-white hover:bg-white/10"
                              )
                            }
                          >
                            {({ isActive }) => (
                              <>
                                <Server className={cn("h-4 w-4 mr-2.5 flex-shrink-0", isActive ? "text-[#00D09C]" : "text-slate-400 group-hover:text-slate-200")} />
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
                        location.pathname.startsWith("/finance") && "text-[#008767] bg-[#E6FAF5] border border-[#A7F3D0]"
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
                                "flex items-center px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 group border border-transparent",
                                isActive
                                  ? "text-[#008767] bg-[#E6FAF5] border-[#A7F3D0]/60 shadow-xs font-bold"
                                  : "text-slate-300 hover:text-white hover:bg-white/10"
                              )
                            }
                          >
                            {({ isActive }) => (
                              <>
                                <Receipt className={cn("h-4 w-4 mr-2.5 flex-shrink-0", isActive ? "text-[#00D09C]" : "text-slate-400 group-hover:text-slate-200")} />
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
                                "flex items-center px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 group border border-transparent",
                                isActive
                                  ? "text-[#008767] bg-[#E6FAF5] border-[#A7F3D0]/60 shadow-xs font-bold"
                                  : "text-slate-300 hover:text-white hover:bg-white/10"
                              )
                            }
                          >
                            {({ isActive }) => (
                              <>
                                <FileText className={cn("h-4 w-4 mr-2.5 flex-shrink-0", isActive ? "text-[#00D09C]" : "text-slate-400 group-hover:text-slate-200")} />
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
                                "flex items-center px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 group border border-transparent",
                                isActive
                                  ? "text-[#008767] bg-[#E6FAF5] border-[#A7F3D0]/60 shadow-xs font-bold"
                                  : "text-slate-300 hover:text-white hover:bg-white/10"
                              )
                            }
                          >
                            {({ isActive }) => (
                              <>
                                <Landmark className={cn("h-4 w-4 mr-2.5 flex-shrink-0", isActive ? "text-[#00D09C]" : "text-slate-400 group-hover:text-slate-200")} />
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
                                "flex items-center px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 group border border-transparent",
                                isActive
                                  ? "text-[#008767] bg-[#E6FAF5] border-[#A7F3D0]/60 shadow-xs font-bold"
                                  : "text-slate-300 hover:text-white hover:bg-white/10"
                              )
                            }
                          >
                            {({ isActive }) => (
                              <>
                                <BarChart3 className={cn("h-4 w-4 mr-2.5 flex-shrink-0", isActive ? "text-[#00D09C]" : "text-slate-400 group-hover:text-slate-200")} />
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
                  <div className={cn("my-2 h-px bg-white/10 mx-1", isSidebarCollapsed ? "hidden lg:block" : "hidden")} />
                  <div className={cn("py-2 px-3", isSidebarCollapsed && "lg:hidden")}>
                    <div className="h-px bg-white/10" />
                  </div>
                  <div className={cn("px-2.5 mb-1.5", isSidebarCollapsed && "lg:hidden")}>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
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
                          "flex items-center rounded-xl text-xs font-semibold transition-all duration-150 group border border-transparent",
                          isSidebarCollapsed ? "px-2.5 py-2 lg:justify-center lg:h-9 lg:w-9 lg:mx-auto lg:px-0" : "px-2.5 py-1.5",
                          isActive
                            ? "text-[#008767] bg-[#E6FAF5] border-[#A7F3D0]/60 shadow-xs font-bold"
                            : "text-slate-300 hover:text-white hover:bg-white/10"
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <link.icon
                            className={cn(
                              "h-4 w-4 flex-shrink-0 transition-transform group-hover:scale-105",
                              isSidebarCollapsed ? "mr-2.5 lg:m-0" : "mr-2.5",
                              isActive ? "text-[#00D09C]" : "text-slate-400 group-hover:text-slate-200"
                            )}
                          />
                          <span className={cn("truncate flex-1 text-left", isSidebarCollapsed && "lg:hidden")}>{link.label}</span>
                          {isActive && (
                            <div className={cn("ml-auto h-1.5 w-1.5 rounded-full bg-[#00D09C]", isSidebarCollapsed && "lg:hidden")} />
                          )}
                        </>
                      )}
                    </NavLink>
                  ))}
                </>
              )}
            </nav>

            {/* Sidebar Footer — Grievance & Legal Links (DPDP Act 2023 s.13) */}
            <div className={cn("mt-auto px-3 py-3 border-t border-white/10 shrink-0", isSidebarCollapsed && "lg:hidden")}>
              <div className="flex flex-col gap-1">
                <Link
                  to="/account/privacy-settings"
                  onClick={handleNavClick}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-[10px] text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                >
                  <Shield className="w-3 h-3 shrink-0" />
                  <span className="truncate">Privacy Centre</span>
                </Link>
                <Link
                  to="/terms"
                  onClick={handleNavClick}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-[10px] text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                >
                  <FileText className="w-3 h-3 shrink-0" />
                  <span className="truncate">Terms of Use</span>
                </Link>
                <a
                  href="mailto:dpo@manacommunity.app"
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-[10px] text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                >
                  <HeartHandshake className="w-3 h-3 shrink-0" />
                  <span className="truncate">Grievance Officer</span>
                </a>
              </div>
              <p className="text-[9px] text-slate-500 mt-1.5 px-2">DPDP Act 2023 Compliant</p>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#F9FAFC]">
          <header className="bg-white border-b border-[#EBEFF2] h-13 flex items-center justify-between px-3 sm:px-6 lg:px-8 sticky top-0 z-30 shadow-xs">
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Desktop Menu Toggle Button */}
              <button
                type="button"
                onClick={toggleSidebar}
                title={isSidebarCollapsed ? "Expand Sidebar Menu" : "Collapse to Icons"}
                className="hidden lg:flex p-2 text-[#7C7E8C] hover:text-[#44475B] hover:bg-[#F1F4F7] rounded-xl transition-all border border-[#EBEFF2] hover:border-[#DFE4E8] shrink-0 cursor-pointer shadow-2xs items-center justify-center active:scale-95"
              >
                <Menu className="h-4.5 w-4.5" />
              </button>

              <Link
                to="/"
                className="font-extrabold text-sm sm:text-base text-[#44475B] lg:hidden tracking-tight hover:opacity-85 transition-opacity cursor-pointer"
              >
                Mana Community
              </Link>
            </div>

            {/* Desktop Header Search Bar */}
            <div className="flex-1 max-w-md mx-3 sm:mx-6 hidden lg:block">
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent("mana:open-search"))}
                className="w-full flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-[#F9FAFC] hover:bg-[#F1F4F7] border border-[#EBEFF2] hover:border-[#A7F3D0] text-xs text-[#7C7E8C] hover:text-[#44475B] transition-all cursor-pointer shadow-2xs group"
                title="Search features, modules, pages (Ctrl+K / ⌘K)"
              >
                <Search className="w-3.5 h-3.5 text-[#9CA3AF] group-hover:text-[#00D09C] transition-colors shrink-0" />
                <span className="flex-1 text-left truncate font-medium">Search features, events, bookings, directory...</span>
                <kbd className="inline-flex items-center gap-0.5 text-[10px] font-bold text-[#7C7E8C] bg-white border border-[#EBEFF2] px-1.5 py-0.5 rounded-md shadow-2xs">
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

        <main className="flex-1 min-h-0 overflow-y-auto p-1.5 sm:p-2 lg:p-2.5">
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
