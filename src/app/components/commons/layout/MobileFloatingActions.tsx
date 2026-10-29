import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Trophy, Bell, Users, Shield, X, ChevronRight,
  CalendarDays, Flame, Award, Sparkles, Search,
  Store, Briefcase, Megaphone, Building2, Headphones, Vote, UserCircle,
  ShieldCheck, Tag, GraduationCap, ShieldAlert, ShoppingBag, Compass, Landmark, Heart, Activity, WifiOff, Stethoscope, Wallet, Car, PieChart,
  Film, ShoppingCart, CreditCard
} from "lucide-react";
import { CommunityDirectory } from "../../community/CommunityDirectory";
import { NotificationBell } from "./NotificationBell";
import { feedService, type FeedSummaryCountsResponse } from "../../../../services/community/feedService";
import { useAuth } from "../../../../contexts/AuthContext";

interface SearchResultItem {
  label: string;
  desc: string;
  icon: any;
  path?: string;
  action?: () => void;
  keywords: string;
  category: string;
  color: string;
  bg: string;
  requiredModule?: string | string[];
  menuKey?: string;
  adminOnly?: boolean;
}

export function MenuListIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="9.5" />
      <circle cx="7.2" cy="8" r="1.2" strokeWidth="1.5" />
      <circle cx="7.2" cy="12" r="1.2" strokeWidth="1.5" />
      <circle cx="7.2" cy="16" r="1.2" strokeWidth="1.5" />
      <line x1="10.8" y1="8" x2="16.8" y2="8" strokeWidth="2" />
      <line x1="10.8" y1="12" x2="16.8" y2="12" strokeWidth="2" />
      <line x1="10.8" y1="16" x2="16.8" y2="16" strokeWidth="2" />
    </svg>
  );
}

export function MobileHeaderActions({ onToggleSidebar }: { onToggleSidebar?: () => void }) {
  const navigate = useNavigate();
  const { user, isSuperAdmin, isAdmin, isAnyAdmin, hasMenuPermission } = useAuth();
  const enabledModules = user?.enabledModules;
  const [activeModal, setActiveModal] = useState<"directory" | "search" | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [directoryCount, setDirectoryCount] = useState<number | undefined>(undefined);

  useEffect(() => {
    feedService.getSidebarSummary()
      .then((res: FeedSummaryCountsResponse) => {
        if (res && typeof res.directoryCount === "number") {
          setDirectoryCount(res.directoryCount);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleOpenSearch = () => {
      setActiveModal("search");
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setActiveModal((prev) => (prev === "search" ? null : "search"));
      }
    };

    window.addEventListener("mana:open-search", handleOpenSearch);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("mana:open-search", handleOpenSearch);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const searchItems: SearchResultItem[] = [
    {
      label: "Community Feed",
      desc: "Posts, conversations & updates",
      icon: Users,
      path: "/",
      keywords: "feed home timeline posts updates discussions",
      category: "Main",
      color: "text-blue-600",
      bg: "bg-blue-50",
      requiredModule: "COMMUNITY_FEED",
      menuKey: "community-feed",
    },
    {
      label: "Professional Network (CPN)",
      desc: "Connect with professionals & mentors",
      icon: Sparkles,
      path: "/cpn",
      keywords: "cpn networking career mentor skills resume",
      category: "Network",
      color: "text-purple-600",
      bg: "bg-purple-50",
      requiredModule: ["JOBS", "CPN"],
      menuKey: "professional-network",
    },
    {
      label: "Sports Community Hub",
      desc: "Tournaments, schedule, auctions & stats",
      icon: Trophy,
      path: "/sports",
      keywords: "sports games matches tournaments auction cricket badminton",
      category: "Activities",
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      requiredModule: "SPORTS",
      menuKey: "sports",
    },
    {
      label: "Marketplace",
      desc: "Buy, sell & exchange goods locally",
      icon: Store,
      path: "/marketplace",
      keywords: "marketplace store buy sell buy-sell items products",
      category: "Community",
      color: "text-amber-600",
      bg: "bg-amber-50",
      requiredModule: "MARKETPLACE",
      menuKey: "marketplace",
    },
    {
      label: "Visitor Management",
      desc: "Guest approvals, entry passes & logs",
      icon: Shield,
      path: "/visitors",
      keywords: "visitors guest gate security pass vehicle parking entry",
      category: "Safety",
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      requiredModule: "VISITORS",
      menuKey: "visitors",
    },
    {
      label: "Notices & Circulars",
      desc: "Official management notifications",
      icon: Megaphone,
      path: "/notices",
      keywords: "notices circulars announcements broadcast alerts news",
      category: "Updates",
      color: "text-rose-600",
      bg: "bg-rose-50",
      requiredModule: "NOTICES",
      menuKey: "notices",
    },
    {
      label: "Facility Bookings",
      desc: "Clubhouse, sports courts & hall reservations",
      icon: Building2,
      path: "/bookings",
      keywords: "bookings amenities facilities clubhouse court slots reservation",
      category: "Amenities",
      color: "text-cyan-600",
      bg: "bg-cyan-50",
      requiredModule: ["BOOKINGS", "AMENITIES"],
      menuKey: "amenity-booking",
    },
    {
      label: "Helpdesk & Support",
      desc: "Maintenance issues & complaints",
      icon: Headphones,
      path: "/helpdesk",
      keywords: "helpdesk support maintenance ticket issue electrician plumber",
      category: "Services",
      color: "text-orange-600",
      bg: "bg-orange-50",
      requiredModule: "HELPDESK",
      menuKey: "helpdesk",
    },
    {
      label: "Maintenance Dues & Payments",
      desc: "Society maintenance invoices, payment receipts & ledger",
      icon: CreditCard,
      path: "/finance/maintenance",
      keywords: "maintenance dues payments bills invoices finance receipts pay society fees",
      category: "Finance",
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      requiredModule: "FINANCE_MGMT",
      menuKey: "maintenance-dues",
    },
    {
      label: "Polls & Surveys",
      desc: "Participate in resident voting & opinions",
      icon: Vote,
      path: "/polls",
      keywords: "polls surveys voting elections opinions feedback",
      category: "Engagement",
      color: "text-violet-600",
      bg: "bg-violet-50",
      requiredModule: "POLLS",
      menuKey: "polls",
    },
    {
      label: "Jobs & Referrals",
      desc: "Local opportunities & member referrals",
      icon: Briefcase,
      path: "/jobs",
      keywords: "jobs employment referrals hiring vacancies work",
      category: "Career",
      color: "text-teal-600",
      bg: "bg-teal-50",
      requiredModule: "JOBS",
      menuKey: "jobs",
    },
    {
      label: "Events & Celebrations",
      desc: "Festivals, registrations & gate passes",
      icon: CalendarDays,
      path: "/events",
      keywords: "events festivals celebrations registration schedule passes tickets",
      category: "Events",
      color: "text-pink-600",
      bg: "bg-pink-50",
      requiredModule: "EVENTS",
      menuKey: "events",
    },
    {
      label: "Community Directory",
      desc: "Leadership, committees & contacts",
      icon: Users,
      action: () => setActiveModal("directory"),
      keywords: "directory contacts management committee resident phone numbers",
      category: "Contacts",
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      requiredModule: ["COMMUNITY_FEED", "DIRECTORY", "COMMUNITY_MGMT"],
      menuKey: "directory",
    },
    {
      label: "My Profile",
      desc: "Profile, preferences & personal settings",
      icon: UserCircle,
      path: "/profile",
      keywords: "profile account user preferences password settings details",
      category: "Personal",
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      label: "Safety & Security Command Center",
      desc: "Live ANPR, boom barrier, patrols & staff passes",
      icon: ShieldCheck,
      path: "/safety",
      keywords: "safety security gate guard barrier anpr vehicles staff incident",
      category: "Safety",
      color: "text-emerald-700",
      bg: "bg-emerald-50",
      requiredModule: ["VISITORS", "SAFETY"],
      menuKey: "safety",
    },
    {
      label: "Smart Gates & Turnstiles",
      desc: "Real-time gate telemetry, contactless entry & QR access",
      icon: ShieldCheck,
      path: "/access/turnstiles",
      keywords: "gates turnstiles qr barrier access security telemetry",
      category: "Safety",
      color: "text-cyan-700",
      bg: "bg-cyan-50",
      requiredModule: ["VISITORS", "SAFETY"],
      menuKey: "smart-gates",
    },
    {
      label: "Mana Deals & Offers",
      desc: "Discounts, market events & community demands",
      icon: Tag,
      path: "/deals",
      keywords: "deals offers discounts market business coupons",
      category: "Commerce",
      color: "text-amber-600",
      bg: "bg-amber-50",
      requiredModule: ["COMMUNITY_OFFERS", "DEALS", "COMMERCE"],
      menuKey: "deals",
    },
    {
      label: "Food & Dining",
      desc: "Community canteen, cafe menus & pre-orders",
      icon: ShoppingCart,
      path: "/food",
      keywords: "food dining canteen cafe menu order meals delivery",
      category: "Commerce",
      color: "text-orange-600",
      bg: "bg-orange-50",
      requiredModule: ["FOOD_OS", "FOOD"],
      menuKey: "food",
    },
    {
      label: "Mana Academy",
      desc: "Skill workshops, courses & tutoring",
      icon: GraduationCap,
      path: "/academy",
      keywords: "academy learning teaching instructor courses tutoring classes",
      category: "Education",
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      requiredModule: "ACADEMY",
      menuKey: "academy",
    },
    {
      label: "Mana Health",
      desc: "Doctors, appointments, clinic bookings & health records",
      icon: Stethoscope,
      path: "/health",
      keywords: "health doctor clinic hospital appointment medicine prescription records lab test",
      category: "Lifestyle",
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      requiredModule: ["HEALTH", "WELLNESS"],
      menuKey: "health",
    },
    {
      label: "My Money & Personal Finance",
      desc: "Private personal accounts, budgets, goals & receipts vault",
      icon: Wallet,
      path: "/my-money",
      keywords: "finance money budget personal accounts salary spending expense networth goals receipts",
      category: "Finance",
      color: "text-teal-600",
      bg: "bg-teal-50",
      requiredModule: ["PERSONAL_FINANCE", "FINANCE_MGMT"],
      menuKey: "my-money",
    },
    {
      label: "Smart Parking & Vehicles",
      desc: "Slots, vehicle whitelist, spot marketplace & ANPR gate",
      icon: Car,
      path: "/parking",
      keywords: "parking vehicle car slot basement ev charging spot anpr barrier sticker",
      category: "Facilities",
      color: "text-blue-600",
      bg: "bg-blue-50",
      requiredModule: ["PARKING", "VISITORS"],
      menuKey: "parking",
    },
    {
      label: "Community Rides",
      desc: "Shared carpooling, commute pools & route discovery",
      icon: Car,
      path: "/commute",
      keywords: "rides carpool commute travel lift transport share pool",
      category: "Facilities",
      color: "text-sky-600",
      bg: "bg-sky-50",
      requiredModule: ["COMMUTE", "COMMUNITY_MGMT"],
      menuKey: "commute",
    },
    {
      label: "Mana Split & Collections",
      desc: "PhonePe-style expense splitting, debt minimization & community collections",
      icon: PieChart,
      path: "/split",
      keywords: "split expense group trip food fuel settlements owe share collection phonepe",
      category: "Finance",
      color: "text-purple-600",
      bg: "bg-purple-50",
      requiredModule: ["FINANCE_MGMT", "MANA_SPLIT"],
      menuKey: "split-bill",
    },
    {
      label: "Emergency SOS",
      desc: "Medical, fire, lift & security emergency alarms",
      icon: ShieldAlert,
      path: "/emergency",
      keywords: "emergency sos medical fire ambulance lift police alarm",
      category: "Safety",
      color: "text-red-600",
      bg: "bg-red-50",
      requiredModule: ["EMERGENCY", "SAFETY", "VISITORS"],
      menuKey: "emergency",
    },
    {
      label: "Community Trips OS",
      desc: "Curated weekend getaways, rosters & itineraries",
      icon: Compass,
      path: "/trips",
      keywords: "trips travel itinerary getaway weekend tour trek bus",
      category: "Activities",
      color: "text-blue-600",
      bg: "bg-blue-50",
      requiredModule: ["TRIPS", "EVENTS"],
      menuKey: "trips",
    },
    {
      label: "Movie Night & Entertainment",
      desc: "Open air screenings, movie votes & cinema schedules",
      icon: Film,
      path: "/movies",
      keywords: "movies cinema film screening show night entertainment tickets",
      category: "Activities",
      color: "text-pink-600",
      bg: "bg-pink-50",
      requiredModule: ["ENTERTAINMENT", "MOVIES"],
      menuKey: "movies",
    },
    {
      label: "Group Buying",
      desc: "Collective purchasing power & bulk discounts",
      icon: ShoppingBag,
      path: "/group-buying",
      keywords: "group buying bulk deals wholesale groceries collective",
      category: "Commerce",
      color: "text-orange-600",
      bg: "bg-orange-50",
      requiredModule: ["GROUP_BUYING", "COMMUNITY_MGMT", "MARKETPLACE"],
      menuKey: "group-buying",
    },
    {
      label: "Community Discover",
      desc: "Personalized recommendations & skill graph",
      icon: Sparkles,
      path: "/discover",
      keywords: "discover graph recommendations skills neighbors matching",
      category: "Network",
      color: "text-violet-600",
      bg: "bg-violet-50",
      requiredModule: ["COMMUNITY_GRAPH", "DISCOVER", "COMMUNITY_FEED"],
      menuKey: "discover",
    },
    {
      label: "Governance & Decisions",
      desc: "Committee resolutions, proposals & digital vault",
      icon: Landmark,
      path: "/governance",
      keywords: "governance meetings proposals voting resolutions agm elections committee",
      category: "Governance",
      color: "text-sky-600",
      bg: "bg-sky-50",
      requiredModule: ["GOVERNANCE", "COMMUNITY_MGMT"],
      menuKey: "governance",
    },
    {
      label: "Pet Registry",
      desc: "Vaccinations, lost pet alerts & pet community",
      icon: Heart,
      path: "/pets",
      keywords: "pets dogs cats animals vaccination pet-friendly lost-pet",
      category: "Community",
      color: "text-rose-600",
      bg: "bg-rose-50",
      requiredModule: ["HOME_SERVICES", "PETS", "COMMUNITY_MGMT"],
      menuKey: "pets",
    },
    {
      label: "IoT Smart Metering",
      desc: "Water & electricity telemetry & consumption",
      icon: Activity,
      path: "/iot/meters",
      keywords: "iot meters water electricity telemetry smart consumption",
      category: "Utilities",
      color: "text-cyan-600",
      bg: "bg-cyan-50",
      requiredModule: ["UTILITIES", "IOT", "COMMUNITY_MGMT"],
      menuKey: "iot-meters",
    },
    {
      label: "Admin Hub",
      desc: "Society operations, member verification, roles & module config",
      icon: ShieldCheck,
      path: "/admin",
      keywords: "admin management hub moderation kyc members approval settings roles modules",
      category: "Administration",
      color: "text-red-600",
      bg: "bg-red-50",
      requiredModule: ["ADMIN_HUB", "COMMUNITY_MGMT"],
      menuKey: "admin",
      adminOnly: true,
    },
    {
      label: "Offline Sync Manager",
      desc: "Queued operations, storage status & network sync",
      icon: WifiOff,
      path: "/sync",
      keywords: "sync offline queue storage network cache",
      category: "Settings",
      color: "text-slate-600",
      bg: "bg-slate-50",
    },
  ];

  const isModuleAllowed = (item: SearchResultItem): boolean => {
    // 1. Role-based admin restriction
    if (item.adminOnly && !isAnyAdmin && !isAdmin && !isSuperAdmin) {
      return false;
    }

    // 2. SuperAdmin bypass
    if (isSuperAdmin) {
      return true;
    }

    // 3. Dynamic backend menu permissions check
    if (item.menuKey && user?.menuPermissions && user.menuPermissions.length > 0) {
      if (!hasMenuPermission(item.menuKey, "view")) {
        return false;
      }
    }

    // 4. Global utilities without module restrictions (e.g., My Profile, Offline Sync)
    if (!item.requiredModule) {
      return true;
    }

    // 5. Initial boot grace period while user data is synchronizing
    if (user && !user.enabledModules && !user.permissions) {
      return true;
    }

    // 6. Community module enablement validation
    if (!enabledModules || enabledModules.length === 0) {
      return false;
    }

    const keys = Array.isArray(item.requiredModule) ? item.requiredModule : [item.requiredModule];
    return keys.some((k) => enabledModules.includes(k));
  };

  const availableSearchItems = searchItems.filter((item) => isModuleAllowed(item));

  const filteredItems = searchQuery.trim() === ""
    ? availableSearchItems
    : availableSearchItems.filter(item =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.keywords.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
      );

  const handleSelectSearchItem = (item: SearchResultItem) => {
    setActiveModal(null);
    setSearchQuery("");
    if (item.action) {
      item.action();
    } else if (item.path) {
      navigate(item.path);
    }
  };

  return (
    <>
      {/* ── Icon-Only Buttons inside Header (Visible on Mobile & Desktop) ────────── */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        {/* Button 0: Search Button (Mobile View - placed right before Menu & Sports) */}
        <button
          type="button"
          onClick={() => setActiveModal("search")}
          title="Search Community"
          className="p-1.5 sm:p-2 rounded-xl bg-[#F9FAFC] border border-[#EBEFF2] text-[#44475B] hover:bg-[#F1F4F7] hover:border-[#DFE4E8] active:scale-95 transition-all flex items-center justify-center cursor-pointer lg:hidden shadow-2xs"
        >
          <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#7C7E8C]" />
        </button>

        {/* Menu Button (Mobile View - placed beside/after Search button) */}
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            title="Open Navigation Menu"
            className="p-1.5 sm:p-2 rounded-xl bg-[#F9FAFC] border border-[#EBEFF2] text-[#44475B] hover:bg-[#F1F4F7] active:scale-95 transition-all flex items-center justify-center cursor-pointer lg:hidden shadow-2xs"
          >
            <MenuListIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#44475B]" />
          </button>
        )}

        {/* Button 1: Community Directory (Icon with Count Badge) */}
        <button
          type="button"
          onClick={() => setActiveModal("directory")}
          title="Community Directory"
          className="relative p-1.5 sm:p-2 rounded-xl bg-[#E6FAF5] border border-[#A7F3D0] text-[#008767] hover:bg-[#A7F3D0]/30 active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-2xs"
        >
          <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#008767]" />
          {directoryCount !== undefined && directoryCount > 0 && (
            <span className="absolute -top-1 -right-1 px-1.5 min-w-[16px] h-[16px] bg-[#00D09C] text-white text-[9px] font-bold rounded-full hidden sm:flex items-center justify-center shadow-xs">
              {directoryCount > 99 ? "99+" : directoryCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Modal Backdrop ──────────────────────────────────────────────────── */}
      {activeModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setActiveModal(null)}
        />
      )}

      {/* ── Modal 0: Search Modal (Mobile & Desktop) ─────────────────────────── */}
      {activeModal === "search" && (
        <div className="fixed inset-x-2.5 top-6 bottom-3 sm:inset-x-3 sm:top-10 sm:bottom-6 z-50 flex flex-col bg-white rounded-2xl shadow-2xl border border-[#EBEFF2] overflow-hidden animate-in fade-in zoom-in-95 duration-200 lg:inset-auto lg:top-14 lg:left-1/2 lg:-translate-x-1/2 lg:w-[540px] lg:max-h-[80vh]">
          {/* Search Header - Groww Clean Slate */}
          <div className="p-3 bg-white border-b border-[#EBEFF2] flex items-center gap-2.5">
            <div className="flex-1 flex items-center gap-2.5 bg-[#F9FAFC] border border-[#EBEFF2] rounded-xl px-3 py-2 text-[#44475B] focus-within:border-[#00D09C] focus-within:ring-2 focus-within:ring-[#00D09C]/20 transition-all">
              <Search className="w-4 h-4 text-[#00D09C] shrink-0" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search features, modules, pages..."
                className="w-full bg-transparent border-none outline-none text-xs font-medium text-[#44475B] placeholder:text-[#9CA3AF]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="p-0.5 rounded-full hover:bg-slate-200 text-[#7C7E8C] transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              onClick={() => setActiveModal(null)}
              className="p-2 rounded-xl hover:bg-[#F1F4F7] text-[#7C7E8C] hover:text-[#44475B] transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Categories / Search Results */}
          <div className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-1 bg-[#F9FAFC]">
            {filteredItems.length === 0 ? (
              <div className="text-center py-10 px-4">
                <div className="w-11 h-11 rounded-2xl bg-white border border-[#EBEFF2] flex items-center justify-center mx-auto mb-3 shadow-xs">
                  <Search className="w-5 h-5 text-[#9CA3AF]" />
                </div>
                <p className="text-xs font-bold text-[#44475B]">No results found</p>
                <p className="text-[11px] text-[#7C7E8C] mt-0.5">Try searching for health, events, sports, marketplace, notices, or bookings.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between px-1.5 py-1 text-[10px] font-bold text-[#7C7E8C] uppercase tracking-wider">
                  <span>{searchQuery.trim() ? "Search Results" : "Quick Access & Features"}</span>
                  <span className="text-[9px] font-medium lowercase bg-[#E6FAF5] text-[#008767] border border-[#A7F3D0] px-2 py-0.5 rounded-full">{filteredItems.length} destinations</span>
                </div>
                <div className="space-y-1">
                  {filteredItems.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => handleSelectSearchItem(item)}
                      className="w-full p-2 rounded-xl border border-[#EBEFF2] bg-white hover:bg-[#F9FAFC] hover:border-[#A7F3D0] transition-all flex items-center gap-2.5 text-left group shadow-xs cursor-pointer active:scale-[0.99]"
                    >
                      <div className={`w-8 h-8 rounded-xl ${item.bg} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                        <item.icon className={`w-4 h-4 ${item.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-[#44475B] group-hover:text-[#008767] transition-colors truncate leading-tight">
                            {item.label}
                          </p>
                          <span className="text-[9px] font-semibold px-1.5 py-0.2 bg-[#F1F4F7] text-[#7C7E8C] rounded-full leading-none">
                            {item.category}
                          </span>
                        </div>
                        <p className="text-[10px] text-[#7C7E8C] truncate mt-0.5 leading-tight">
                          {item.desc}
                        </p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-[#DFE4E8] group-hover:text-[#00D09C] group-hover:translate-x-0.5 transition-all shrink-0" />
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Modal 2: Community Directory Modal ────────────────────────────── */}
      {activeModal === "directory" && (
        <div className="fixed inset-x-2.5 top-6 bottom-3 sm:inset-x-4 sm:top-10 sm:bottom-3 z-50 flex flex-col bg-white rounded-2xl shadow-2xl border border-[#EBEFF2] overflow-hidden animate-in fade-in zoom-in-95 duration-200 lg:inset-auto lg:top-16 lg:right-12 lg:w-[680px] lg:max-h-[85vh]">
          {/* Header - Groww Clean Emerald */}
          <div className="px-3.5 py-2.5 bg-gradient-to-r from-[#008767] via-[#00A87D] to-[#00D09C] text-white flex items-center justify-between shrink-0 shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-white/20 border border-white/25 flex items-center justify-center shadow-2xs shrink-0">
                <Users className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-xs text-white leading-tight">Community Directory</h3>
                <p className="text-[9.5px] text-white/90 leading-snug">Management committee, leaders & emergency contacts</p>
              </div>
            </div>
            <button
              onClick={() => setActiveModal(null)}
              className="w-5.5 h-5.5 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors flex items-center justify-center cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Directory Content */}
          <div className="flex-1 overflow-y-auto p-1.5 sm:p-2.5 bg-slate-50/60">
            <CommunityDirectory isModal={true} badgeCount={directoryCount} />
          </div>
        </div>
      )}
    </>
  );
}

export function MobileFloatingActions() {
  return <MobileHeaderActions />;
}
