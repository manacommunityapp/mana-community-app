import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Trophy, Bell, Users, Shield, X, ChevronRight,
  CalendarDays, Flame, Award, Sparkles, Search,
  Store, Briefcase, Megaphone, Building2, Headphones, Vote, UserCircle
} from "lucide-react";
import { CommunityDirectory } from "../../community/CommunityDirectory";
import { NotificationBell } from "./NotificationBell";

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
  const [activeModal, setActiveModal] = useState<"directory" | "search" | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

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
  ];

  const filteredItems = searchQuery.trim() === ""
    ? searchItems
    : searchItems.filter(item =>
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
      <div className="flex items-center gap-1.5">
        {/* Button 0: Search Button (Mobile View - placed right before Menu & Sports) */}
        <button
          type="button"
          onClick={() => setActiveModal("search")}
          title="Search Community"
          className="p-2 rounded-xl bg-sky-50 border border-sky-100 text-sky-600 hover:bg-sky-100 active:scale-95 transition-all flex items-center justify-center cursor-pointer lg:hidden"
        >
          <Search className="w-4 h-4 text-sky-600" />
        </button>

        {/* Menu Button (Mobile View - placed beside/after Search button) */}
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            title="Open Navigation Menu"
            className="p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 active:scale-95 transition-all flex items-center justify-center cursor-pointer lg:hidden"
          >
            <MenuListIcon className="w-4 h-4 text-slate-700" />
          </button>
        )}

        {/* Button 1: Community Directory (Icon Only) */}
        <button
          type="button"
          onClick={() => setActiveModal("directory")}
          title="Community Directory"
          className="p-2 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 hover:bg-emerald-100 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
        >
          <Users className="w-4 h-4 text-emerald-600" />
        </button>
      </div>

      {/* ── Modal Backdrop ──────────────────────────────────────────────────── */}
      {activeModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setActiveModal(null)}
        />
      )}

      {/* ── Modal 0: Search Modal (Mobile & Desktop) ─────────────────────────── */}
      {activeModal === "search" && (
        <div className="fixed inset-x-3 top-12 bottom-6 z-50 flex flex-col bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 lg:inset-auto lg:top-14 lg:left-1/2 lg:-translate-x-1/2 lg:w-[560px] lg:max-h-[80vh] lg:rounded-2xl">
          {/* Search Header */}
          <div className="p-3 bg-gradient-to-r from-sky-600 via-sky-500 to-indigo-600 text-white flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 bg-white/15 border border-white/25 rounded-xl px-3 py-2 text-white">
              <Search className="w-4 h-4 text-white/80 shrink-0" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search features, modules, pages..."
                className="w-full bg-transparent border-none outline-none text-xs text-white placeholder:text-white/70"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="p-0.5 rounded-full hover:bg-white/20 text-white/80 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              onClick={() => setActiveModal(null)}
              className="p-2 rounded-xl hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Categories / Search Results */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {filteredItems.length === 0 ? (
              <div className="text-center py-10 px-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <Search className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-xs font-bold text-slate-700">No results found</p>
                <p className="text-[11px] text-slate-500 mt-1">Try searching for events, sports, marketplace, notices, or bookings.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between px-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>{searchQuery.trim() ? "Search Results" : "Quick Access & Features"}</span>
                  <span className="text-[10px] font-normal lowercase">{filteredItems.length} destinations</span>
                </div>
                <div className="space-y-1.5">
                  {filteredItems.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => handleSelectSearchItem(item)}
                      className="w-full p-2.5 rounded-2xl border border-slate-100 bg-white hover:bg-slate-50/80 hover:border-sky-200 transition-all flex items-center gap-3 text-left group shadow-2xs cursor-pointer active:scale-[0.99]"
                    >
                      <div className={`w-9 h-9 rounded-xl ${item.bg} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                        <item.icon className={`w-4.5 h-4.5 ${item.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-slate-800 group-hover:text-sky-600 transition-colors truncate">
                            {item.label}
                          </p>
                          <span className="text-[9px] font-medium px-1.5 py-0.2 bg-slate-100 text-slate-500 rounded-md">
                            {item.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {item.desc}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-sky-500 group-hover:translate-x-0.5 transition-all shrink-0" />
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
        <div className="fixed inset-x-2 sm:inset-x-4 top-10 bottom-3 z-50 flex flex-col bg-slate-50 rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 lg:inset-auto lg:top-16 lg:right-12 lg:w-[720px] lg:max-h-[85vh] lg:rounded-2xl">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white flex items-center justify-between shrink-0 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/15 rounded-xl border border-white/25 shadow-2xs">
                <Users className="w-5 h-5 text-emerald-100" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-white">Community Directory</h3>
                <p className="text-[11px] text-white/80">Management committee, leaders & emergency contacts</p>
              </div>
            </div>
            <button
              onClick={() => setActiveModal(null)}
              className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Directory Content */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 bg-slate-50/60">
            <CommunityDirectory isModal={true} />
          </div>
        </div>
      )}
    </>
  );
}

export function MobileFloatingActions() {
  return <MobileHeaderActions />;
}
