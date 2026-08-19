import React, { useState, useEffect } from "react";
import {
  Sparkles, Bell, Search, QrCode, UserPlus, Utensils,
  CalendarDays, ChevronRight, TrendingUp, Clock, MapPin,
  Ticket, ShieldCheck, Heart, Award, ArrowUpRight, IndianRupee,
  Flame, CheckCircle2, ChevronLeft, Plus, BarChart3, Users
} from "lucide-react";
import { GlassCard, TouchButton, StatusChip } from "./EventDesignSystem";

interface EventsExecutiveHomeProps {
  isDark?: boolean;
  onNavigate: (view: string) => void;
  onOpenQRScanner: () => void;
  onOpenRegisterModal: () => void;
  onOpenFeatureModal?: (key: string) => void;
}

export const EventsExecutiveHome: React.FC<EventsExecutiveHomeProps> = ({
  isDark = false,
  onNavigate,
  onOpenQRScanner,
  onOpenFeatureModal,
  onOpenRegisterModal,
}) => {
  // Live ticking countdown state for Ganesh Utsav 2026
  const [timeLeft, setTimeLeft] = useState({ days: 18, hours: 14, mins: 32, secs: 45 });
  const [carouselIndex, setCarouselIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.secs > 0) return { ...prev, secs: prev.secs - 1 };
        if (prev.mins > 0) return { ...prev, mins: 59, secs: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, mins: 59, secs: 59 };
        if (prev.days > 0) return { ...prev, days: prev.days - 1, hours: 23, mins: 59, secs: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const bannerEvents = [
    {
      id: "ev-1",
      title: "Ganesh Chaturthi Utsav 2026",
      subtitle: "Grand 10-Day Festival & Cultural Celebration",
      location: "Main Community Grounds, Sector 4",
      date: "Aug 27 - Sep 06, 2026",
      registered: "1,842 passes issued",
      category: "Festival",
      bgGradient: "linear-gradient(135deg, #FF6B00 0%, #E05E00 50%, #4F46E5 100%)",
      image: "https://images.unsplash.com/photo-1567157577867-05ccb1388e66?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: "ev-2",
      title: "Annual Sports Olympiad 2026",
      subtitle: "Cricket, Badminton, Swimming & Athletics",
      location: "Central Sports Arena",
      date: "Sep 14 - Sep 18, 2026",
      registered: "412 athletes registered",
      category: "Sports",
      bgGradient: "linear-gradient(135deg, #4F46E5 0%, #6366F1 50%, #FF6B00 100%)",
      image: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: "ev-3",
      title: "Diwali Garba & Cultural Gala",
      subtitle: "Live Orchestra, Food Street & Fashion Show",
      location: "Grand Ball Room & Lawn",
      date: "Oct 20, 2026",
      registered: "650 tickets booked",
      category: "Cultural",
      bgGradient: "linear-gradient(135deg, #16A34A 0%, #059669 50%, #FF6B00 100%)",
      image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80",
    },
  ];

  const currentBanner = bannerEvents[carouselIndex];

  const quickActions = [
    { label: "Scan Pass", icon: QrCode, action: onOpenQRScanner, bg: "linear-gradient(135deg, #FF6B00, #FF8800)", text: "Pass validation" },
    { label: "Register", icon: UserPlus, action: onOpenRegisterModal, bg: "linear-gradient(135deg, #4F46E5, #6366F1)", text: "Individual/Family" },
    { label: "Food Coupons", icon: Utensils, action: () => onNavigate("food"), bg: "linear-gradient(135deg, #16A34A, #22C55E)", text: "Validate meals" },
    { label: "Cultural", icon: Sparkles, action: () => onNavigate("cultural"), bg: "linear-gradient(135deg, #2563EB, #3B82F6)", text: "Contests & Acts" },
  ];

  const todaysActivities = [
    { time: "09:00 AM", title: "Morning Aarti & Prasadam Distribution", dept: "Rituals Team", status: "Live", count: "450 attendees" },
    { time: "02:30 PM", title: "Children's Drawing Competition", dept: "Cultural Wing", status: "Upcoming", count: "120 kids" },
    { time: "06:00 PM", title: "Volunteers Shift Briefing", dept: "Ops Division", status: "Planning", count: "45 volunteers" },
  ];

  const quickAccessGrid = [
    { id: "details", label: "Event Details", icon: Ticket, count: "Active view", color: "#FF6B00" },
    { id: "analytics", label: "KPI Analytics", icon: TrendingUp, count: "Real-time", color: "#4F46E5" },
    { id: "volunteer", label: "Volunteers OS", icon: ShieldCheck, count: "318 Active", color: "#16A34A" },
    { id: "food", label: "Kitchen & Food", icon: Utensils, count: "4,200 Meals", color: "#2563EB" },
    { id: "inventory", label: "Inventory", icon: CalendarDays, count: "82 Equipments", color: "#F59E0B" },
    { id: "finance", label: "Finance & Sponsors", icon: IndianRupee, count: "₹18.5L Budget", color: "#EC4899" },
    { id: "cultural", label: "Cultural Contest", icon: Sparkles, count: "10 Categories", color: "#8B5CF6" },
    { id: "gallery", label: "Media Gallery", icon: Award, count: "240 Photos", color: "#06B6D4" },
    { id: "reports", label: "Reports", icon: BarChart3, count: "Export & PDF", color: "#6366F1" },
  ];

  return (
    <div className="space-y-5 pb-8">
      {/* Executive Greeting Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold tracking-wider uppercase text-[#FF6B00] flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Flagship Event OS
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Good Morning, Sandeep 👋
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate("notifications")}
            className="relative p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-[#FF6B00] shadow-xs transition-colors cursor-pointer"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-[#FF6B00] animate-ping" />
          </button>

          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
            alt="Profile Avatar"
            onClick={() => onNavigate("profile")}
            className="w-11 h-11 rounded-2xl object-cover border-2 border-[#FF6B00] cursor-pointer shadow-md hover:scale-105 transition-transform"
          />
        </div>
      </div>

      {/* Global Search Bar - hidden as of now */}
      {/* <div className="relative">
        <input
          type="text"
          placeholder="Search events, passes, volunteers, sponsors or food coupons..."
          className="w-full h-13 pl-11 pr-4 rounded-2xl bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 border border-slate-200 dark:border-slate-700 focus:border-[#FF6B00] shadow-sm outline-none transition-colors"
        />
        <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
      </div> */}

      {/* Event Hero Banner Carousel */}
      <div className="relative overflow-hidden rounded-[28px] shadow-2xl transition-all duration-500">
        <div
          className="p-6 text-white min-h-[220px] flex flex-col justify-between relative z-10"
          style={{ background: currentBanner.bgGradient }}
        >
          {/* Top category chip & dots */}
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-white/20 backdrop-blur-md uppercase tracking-wider text-white">
              🔥 {currentBanner.category}
            </span>
            <div className="flex items-center gap-1.5">
              {bannerEvents.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCarouselIndex(idx)}
                  className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                    carouselIndex === idx ? "w-7 bg-white" : "bg-white/40"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Banner Title & Meta */}
          <div className="my-3">
            <h2 className="text-xl sm:text-2xl font-black leading-tight drop-shadow-md">
              {currentBanner.title}
            </h2>
            <p className="text-xs font-medium text-white/90 mt-1 drop-shadow-xs">
              {currentBanner.subtitle}
            </p>
            <div className="flex items-center gap-4 text-xs font-semibold text-white/80 mt-2">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> {currentBanner.location}
              </span>
              <span className="flex items-center gap-1">
                <Ticket className="w-3.5 h-3.5" /> {currentBanner.registered}
              </span>
            </div>
          </div>

          {/* Live Ticking Countdown */}
          <div className="pt-2 border-t border-white/20 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-white/80">Starts In:</span>
              <div className="flex items-center gap-2 mt-0.5 font-mono text-xs font-extrabold text-white">
                <span className="px-2 py-1 rounded-lg bg-black/30">{timeLeft.days}d</span>:
                <span className="px-2 py-1 rounded-lg bg-black/30">{timeLeft.hours}h</span>:
                <span className="px-2 py-1 rounded-lg bg-black/30">{timeLeft.mins}m</span>:
                <span className="px-2 py-1 rounded-lg bg-black/30 text-amber-300">{timeLeft.secs}s</span>
              </div>
            </div>

            <button
              onClick={() => onNavigate("details")}
              className="px-4 py-2.5 rounded-2xl bg-white text-[#FF6B00] font-black text-xs hover:bg-orange-50 active:scale-95 transition-all shadow-lg flex items-center gap-1.5 cursor-pointer"
            >
              <span>View Details</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Action Grid */}
      <div>
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-3 flex items-center justify-between">
          <span>Quick Actions</span>
          <span className="text-[11px] text-[#FF6B00] font-bold">Touch Optimized</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map((item, idx) => {
            const Icon = item.icon;
            return (
              <GlassCard
                key={idx}
                isDark={isDark}
                onClick={item.action}
                className="p-4 border text-left group"
              >
                <div
                  style={{ background: item.bg }}
                  className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md mb-2.5 group-hover:scale-110 transition-transform"
                >
                  <Icon className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                  {item.label}
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {item.text}
                </p>
              </GlassCard>
            );
          })}
        </div>
      </div>

      {/* Today's Events Timeline */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#FF6B00]" />
            Today's Schedule & Duty
          </h3>
          <button
            onClick={() => onNavigate("calendar")}
            className="text-xs font-extrabold text-[#FF6B00] hover:underline cursor-pointer"
          >
            Full Calendar
          </button>
        </div>

        <div className="space-y-2.5">
          {todaysActivities.map((act, idx) => (
            <GlassCard key={idx} isDark={isDark} hoverScale={false} className="p-3.5 border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="px-2.5 py-1.5 rounded-xl bg-orange-50 dark:bg-slate-800 text-[11px] font-mono font-bold text-[#FF6B00] text-center border border-orange-200/50 dark:border-slate-700">
                  {act.time}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">{act.title}</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {act.dept} • {act.count}
                  </p>
                </div>
              </div>
              <StatusChip status={act.status} isDark={isDark} />
            </GlassCard>
          ))}
        </div>
      </div>

      {/* Budget & KPI Summary Gauge */}
      <GlassCard isDark={isDark} hoverScale={false} className="p-4 border">
        <div className="flex items-center justify-between mb-3 border-b border-slate-100 dark:border-slate-800 pb-2">
          <div>
            <span className="text-[10px] font-extrabold uppercase text-slate-400">Financial Snapshot</span>
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">Ganesh Utsav Budget</h4>
          </div>
          <span className="text-xs font-black text-[#16A34A] bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
            64% Utilized
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Total Budget</span>
            <span className="text-xs font-black text-slate-900 dark:text-white mt-0.5 block">₹7.50L</span>
          </div>
          <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Spent</span>
            <span className="text-xs font-black text-[#FF6B00] mt-0.5 block">₹4.82L</span>
          </div>
          <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Sponsor Raised</span>
            <span className="text-xs font-black text-[#4F46E5] mt-0.5 block">₹6.10L</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#FF6B00] to-[#4F46E5] rounded-full w-[64%]" />
          </div>
        </div>
      </GlassCard>

      {/* Quick Access Modules Navigation Grid */}
      <div>
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-3">
          Module Hub
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickAccessGrid.map((m) => {
            const Icon = m.icon;
            return (
              <GlassCard
                key={m.id}
                isDark={isDark}
                onClick={() => onNavigate(m.id)}
                className="p-3.5 border flex items-center gap-3 cursor-pointer group hover:border-[#FF6B00] transition-colors"
              >
                <div
                  style={{ backgroundColor: `${m.color}15`, color: m.color }}
                  className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform"
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                    {m.label}
                  </h4>
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                    {m.count}
                  </span>
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>

      {/* Member Services — Pooja / Meals / Passes / Family */}
      <div>
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-3 flex items-center justify-between">
          <span>Member Services</span>
          <span className="text-[11px] text-[#FF6B00] font-bold">Tap to view details</span>
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { key: "pooja",  label: "Pooja Registration", sub: "Seva & rituals",    bg: "linear-gradient(135deg, #F59E0B, #D97706)", icon: Heart },
            { key: "meals",  label: "Lunch / Dinner",     sub: "Meal preferences",  bg: "linear-gradient(135deg, #059669, #10B981)", icon: Utensils },
            { key: "passes", label: "Event Passes",        sub: "Entry & access",    bg: "linear-gradient(135deg, #7C3AED, #6366F1)", icon: Ticket },
            { key: "family", label: "Family Members",      sub: "Household details", bg: "linear-gradient(135deg, #0369A1, #0EA5E9)", icon: Users },
          ].map(({ key, label, sub, bg, icon: Icon }) => (
            <GlassCard
              key={key}
              isDark={isDark}
              onClick={() => onOpenFeatureModal?.(key)}
              className="p-4 border text-left group cursor-pointer hover:border-[#FF6B00] transition-colors"
            >
              <div
                style={{ background: bg }}
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md mb-2.5 group-hover:scale-110 transition-transform"
              >
                <Icon className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">{label}</h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{sub}</p>
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  );
};
