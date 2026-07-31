import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router";
import {
  User, Network, Rss, Briefcase, Share2, Building2,
  Store, Globe, GraduationCap, BookOpen, Rocket, Calendar,
  Handshake, FileText, Bot, MessageSquare, Trophy, BarChart3,
  Search, Bell, Sparkles, TrendingUp, Users,
  Star, Zap
} from "lucide-react";

// ── Tab definitions ──────────────────────────────────────────────────────────
const CPN_TABS = [
  { to: "feed",         icon: Rss,           label: "Professional Feed" },
  { to: "profile",      icon: User,           label: "My Profile" },
  { to: "network",      icon: Network,        label: "My Network" },
  { to: "jobs",         icon: Briefcase,      label: "Job Marketplace" },
  { to: "referrals",    icon: Share2,         label: "Referral Marketplace" },
  { to: "freelance",    icon: Globe,          label: "Freelance Projects" },
  { to: "mentorship",   icon: GraduationCap,  label: "Mentorship" },
  { to: "learning",     icon: BookOpen,       label: "Learning Platform" },
  { to: "companies",    icon: Building2,      label: "Company Portal" },
  { to: "business",     icon: Store,          label: "Business Directory" },
  { to: "startups",     icon: Rocket,         label: "Startup Hub" },
  { to: "events",       icon: Calendar,       label: "Professional Events" },
  { to: "collaborate",  icon: Handshake,      label: "Collaborate" },
  { to: "resume",       icon: FileText,       label: "Resume Builder" },
  { to: "ai-assistant", icon: Bot,            label: "AI Career Coach" },
  { to: "messages",     icon: MessageSquare,  label: "Messages" },
  { to: "gamification", icon: Trophy,         label: "Achievements" },
  { to: "analytics",    icon: BarChart3,      label: "Analytics" },
];

// ── Quick Stats Bar ───────────────────────────────────────────────────────────
function QuickStats() {
  const stats = [
    { icon: Users,      value: "248",  label: "Connections",    color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-400" },
    { icon: Briefcase,  value: "12",   label: "Jobs Matched",   color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400" },
    { icon: TrendingUp, value: "1.2K", label: "Profile Views",  color: "text-violet-600 bg-violet-50 dark:bg-violet-950/40 dark:text-violet-400" },
    { icon: Star,       value: "850",  label: "CPN Points",     color: "text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {stats.map((s) => (
        <div key={s.label} className="bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3 hover:shadow-md transition-all">
          <div className={`p-2.5 rounded-xl ${s.color}`}>
            <s.icon className="w-4 h-4" />
          </div>
          <div>
            <div className="text-lg font-black leading-none">{s.value}</div>
            <div className="text-xs text-slate-500 mt-1">{s.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── CPN Hub Shell ─────────────────────────────────────────────────────────────
export function CPNHub() {
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();

  return (
    <div className="space-y-0 -m-4 sm:-m-6 lg:-m-8 min-h-[calc(100vh-4rem)] bg-background text-foreground">

      {/* ── CPN Header Band ──────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-indigo-700 via-violet-700 to-purple-700 px-4 sm:px-6 lg:px-8 py-6 text-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center ring-2 ring-white/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-black text-xl leading-none">Professional Network</h1>
              <p className="text-indigo-200 text-xs mt-1 font-semibold">Community Career Hub · Powered by CPN</p>
            </div>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-lg md:ml-6">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-300" />
              <input
                type="text"
                placeholder="Search professionals, jobs, companies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-indigo-300 text-xs focus:outline-none focus:ring-2 focus:ring-white/40 focus:bg-white/20 transition-all font-medium"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button className="relative p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-colors">
              <Bell className="w-4.5 h-4.5 text-white" />
              <span className="absolute top-2 right-2 h-2 w-2 bg-rose-400 rounded-full ring-1 ring-white/50 animate-pulse" />
            </button>
            <button className="flex items-center gap-1.5 px-4 py-2.5 bg-white text-indigo-700 hover:bg-indigo-50 rounded-xl text-xs font-black transition-colors shadow-md">
              <Zap className="w-4 h-4" />
              Post Update
            </button>
          </div>
        </div>
      </div>

      {/* ── Tab Navigation ────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#1E1E36] border-b border-slate-200 dark:border-slate-800 sticky top-16 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto hide-scrollbar -mb-px">
            {CPN_TABS.map((tab) => (
              <NavLink
                key={tab.to}
                to={`/cpn/${tab.to}`}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-4 text-xs font-black border-b-2 whitespace-nowrap transition-all flex-shrink-0 ${
                    isActive
                      ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20"
                      : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 hover:border-slate-300"
                  }`
                }
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </NavLink>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content Area ──────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <QuickStats />
        <Outlet />
      </div>
    </div>
  );
}
