import { useState } from "react";
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

export function MobileHeaderActions() {
  const navigate = useNavigate();
  const [activeModal, setActiveModal] = useState<"sports_notifications" | "directory" | "search" | null>(null);
  const [sportsTab, setSportsTab] = useState<"sports" | "notifications">("sports");
  const [searchQuery, setSearchQuery] = useState("");

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
        {/* Button 0: Search Button (Mobile View - placed right before Sports & Notifications) */}
        <button
          type="button"
          onClick={() => setActiveModal("search")}
          title="Search Community"
          className="p-2 rounded-xl bg-sky-50 border border-sky-100 text-sky-600 hover:bg-sky-100 active:scale-95 transition-all flex items-center justify-center cursor-pointer lg:hidden"
        >
          <Search className="w-4 h-4 text-sky-600" />
        </button>

        {/* Button 1: Sports & Notifications (Icon Only) */}
        <button
          type="button"
          onClick={() => setActiveModal("sports_notifications")}
          title="Sports & Notifications"
          className="p-2 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 hover:bg-indigo-100 active:scale-95 transition-all flex items-center justify-center relative cursor-pointer"
        >
          <Trophy className="w-4 h-4 text-indigo-600" />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
        </button>

        {/* Button 2: Community Directory (Icon Only) */}
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

      {/* ── Modal 0: Search Modal (Mobile & Tablet) ─────────────────────────── */}
      {activeModal === "search" && (
        <div className="fixed inset-x-3 top-12 bottom-6 z-50 flex flex-col bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 lg:inset-auto lg:top-16 lg:right-28 lg:w-[480px] lg:max-h-[80vh] lg:rounded-2xl">
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

      {/* ── Modal 1: Sports & Notifications Modal ──────────────────────────── */}
      {activeModal === "sports_notifications" && (
        <div className="fixed inset-x-3 top-14 bottom-6 z-50 flex flex-col bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 lg:inset-auto lg:top-16 lg:right-24 lg:w-[480px] lg:max-h-[80vh] lg:rounded-2xl">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-white/10 rounded-xl border border-white/20">
                <Trophy className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-white">Sports & Notifications</h3>
                <p className="text-[11px] text-white/70">Quick access to tournaments & alerts</p>
              </div>
            </div>
            <button
              onClick={() => setActiveModal(null)}
              className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Sub-tabs */}
          <div className="flex border-b border-slate-100 bg-slate-50 p-1.5 gap-1.5">
            <button
              onClick={() => setSportsTab("sports")}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                sportsTab === "sports"
                  ? "bg-white text-indigo-600 shadow-sm border border-slate-200"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Trophy className="w-3.5 h-3.5" /> Sports Hub
            </button>
            <button
              onClick={() => setSportsTab("notifications")}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                sportsTab === "notifications"
                  ? "bg-white text-indigo-600 shadow-sm border border-slate-200"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Bell className="w-3.5 h-3.5" /> Notifications
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {sportsTab === "sports" ? (
              <div className="space-y-3">
                <div className="p-3 bg-indigo-50/60 rounded-2xl border border-indigo-100 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-extrabold text-indigo-900">Sports Community Hub</h4>
                    <p className="text-[11px] text-indigo-600 mt-0.5">Events, fixtures, leaderboards & auction</p>
                  </div>
                  <button
                    onClick={() => {
                      setActiveModal(null);
                      navigate("/sports");
                    }}
                    className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-sm hover:bg-indigo-700 transition-colors flex items-center gap-1"
                  >
                    Open Hub <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { label: "Dashboard & Events", desc: "View all sports", icon: CalendarDays, path: "/sports", color: "text-indigo-600", bg: "bg-indigo-50" },
                    { label: "Schedule & Fixtures", desc: "Match timings", icon: Flame, path: "/sports?tab=schedule", color: "text-orange-600", bg: "bg-orange-50" },
                    { label: "Live Auctions", desc: "Bid on players", icon: Sparkles, path: "/sports?tab=auction", color: "text-amber-600", bg: "bg-amber-50" },
                    { label: "Leaderboards", desc: "Top performers", icon: Award, path: "/sports?tab=leaderboard", color: "text-emerald-600", bg: "bg-emerald-50" },
                  ].map((item) => (
                    <button
                      key={item.label}
                      onClick={() => {
                        setActiveModal(null);
                        navigate(item.path);
                      }}
                      className="p-3 rounded-2xl border border-slate-100 bg-white hover:border-indigo-200 transition-all text-left group shadow-2xs"
                    >
                      <div className={`w-8 h-8 rounded-xl ${item.bg} flex items-center justify-center mb-2`}>
                        <item.icon className={`w-4 h-4 ${item.color}`} />
                      </div>
                      <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{item.label}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{item.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-700">In-App Notifications</span>
                  <NotificationBell />
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Tap the notification bell icon above or check your Profile → Settings to configure your alert preferences.
                </p>
              </div>
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
