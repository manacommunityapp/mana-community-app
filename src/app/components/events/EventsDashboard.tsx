import React, { useState, useEffect } from "react";
import {
  CalendarDays, Users, Ticket, TrendingUp, DollarSign,
  Utensils, Gavel, ClipboardCheck, Star, ArrowUpRight,
  Clock, MapPin, CheckCircle2, AlertCircle, Loader2,
  Sparkles, Search, QrCode, UserPlus, ShieldCheck, Award,
  ChevronRight, ArrowRight, Download, Filter, Bot, Flame
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import { GlassCard, TouchButton, StatusChip, BottomSheet } from "./redesign/EventDesignSystem";
import { EventAICopilotDrawer } from "./redesign/EventAICopilotDrawer";
import { EventRegistrationWizard } from "./redesign/EventRegistrationWizard";

export function EventsDashboard() {
  // Live ticking countdown state for Ganesh Utsav 2026
  const [timeLeft, setTimeLeft] = useState({ days: 18, hours: 14, mins: 32, secs: 45 });
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [showAICopilot, setShowAICopilot] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);

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

  const kpis = [
    { label: "Total Events", value: "24", sub: "8 active festivals", icon: CalendarDays, color: "#4F46E5", bg: "rgba(79, 70, 229, 0.12)", trend: "+3 this month" },
    { label: "Registrations", value: "1,842", sub: "↑ 14% vs last week", icon: Ticket, color: "#7C3AED", bg: "rgba(124, 58, 237, 0.12)", trend: "+204 this week" },
    { label: "Volunteers", value: "318", sub: "94% Duty assigned", icon: Users, color: "#16A34A", bg: "rgba(22, 163, 74, 0.12)", trend: "12 Teams" },
    { label: "Budget Spent", value: "₹4.82L", sub: "64% of ₹7.5L total", icon: DollarSign, color: "#2563EB", bg: "rgba(37, 99, 235, 0.12)", trend: "₹2.68L left" },
    { label: "Sponsors Raised", value: "₹6.10L", sub: "19 Active partners", icon: Star, color: "#F59E0B", bg: "rgba(245, 158, 11, 0.12)", trend: "5 pending" },
    { label: "Donations", value: "₹6.20L", sub: "Cash & Kind", icon: TrendingUp, color: "#EC4899", bg: "rgba(236, 72, 153, 0.12)", trend: "+₹80K today" },
    { label: "Food Prepared", value: "85%", sub: "4,200 plates est", icon: Utensils, color: "#8B5CF6", bg: "rgba(139, 92, 246, 0.12)", trend: "On schedule" },
    { label: "Auction Revenue", value: "₹2.10L", sub: "14 items sold", icon: Gavel, color: "#06B6D4", bg: "rgba(6, 182, 212, 0.12)", trend: "Live now" },
  ];

  const registrationTrend = [
    { day: "Mon", count: 82, vip: 12 },
    { day: "Tue", count: 145, vip: 20 },
    { day: "Wed", count: 203, vip: 35 },
    { day: "Thu", count: 178, vip: 28 },
    { day: "Fri", count: 267, vip: 45 },
    { day: "Sat", count: 312, vip: 60 },
    { day: "Sun", count: 225, vip: 40 },
  ];

  const budgetBreakdown = [
    { cat: "Stage & Venue", budget: 1.8, spent: 1.5 },
    { cat: "Food & Feast", budget: 2.2, spent: 1.8 },
    { cat: "Sound & Light", budget: 1.0, spent: 0.75 },
    { cat: "Security & Ops", budget: 0.8, spent: 0.5 },
    { cat: "Marketing", budget: 0.5, spent: 0.27 },
  ];

  const pieCategories = [
    { name: "Family Passes", value: 520, color: "#4F46E5" },
    { name: "Individual", value: 680, color: "#7C3AED" },
    { name: "VIP Guests", value: 120, color: "#16A34A" },
    { name: "Volunteers", value: 318, color: "#2563EB" },
    { name: "Performers", value: 204, color: "#EC4899" },
  ];

  const bannerEvents = [
    {
      id: "ev-1",
      title: "Ganesh Chaturthi Utsav 2026",
      subtitle: "Grand 10-Day Festival, Cultural Competitions & Community Feasts",
      location: "Main Community Grounds, Sector 4",
      date: "Aug 27 - Sep 06, 2026",
      registered: "1,842 passes issued",
      category: "Grand Festival",
      bgGradient: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #6366F1 100%)",
      image: "https://images.unsplash.com/photo-1567157577867-05ccb1388e66?auto=format&fit=crop&w=1200&q=80",
    },
    {
      id: "ev-2",
      title: "Annual Sports Olympiad 2026",
      subtitle: "Cricket, Badminton, Swimming & Athletics Tournaments",
      location: "Central Sports Arena",
      date: "Sep 14 - Sep 18, 2026",
      registered: "412 athletes registered",
      category: "Sports Championship",
      bgGradient: "linear-gradient(135deg, #4F46E5 0%, #6366F1 50%, #FF6B00 100%)",
      image: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80",
    },
  ];

  const currentBanner = bannerEvents[carouselIndex];

  const todaysActivities = [
    { time: "09:00 AM", title: "Morning Aarti & Prasadam Distribution", dept: "Rituals Team", status: "Live", count: "450 attendees" },
    { time: "02:30 PM", title: "Children's Drawing Competition", dept: "Cultural Wing", status: "Upcoming", count: "120 kids" },
    { time: "06:00 PM", title: "Volunteers Shift Briefing", dept: "Ops Division", status: "Planning", count: "45 volunteers" },
  ];

  const pendingTasks = [
    { task: "Confirm catering vendor for Maha Prasadam", priority: "high", due: "2 days" },
    { task: "Send QR pass reminder emails to pending registrants", priority: "medium", due: "Today" },
    { task: "Finalize stage sound & light layout diagram", priority: "high", due: "3 days" },
    { task: "Collect pending sponsor payments from Apollo", priority: "medium", due: "1 week" },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Compact Executive Command Bar */}
      <div className="flex items-center justify-between gap-2 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent px-3.5 py-2 rounded-2xl border border-indigo-500/20 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-extrabold text-[#4F46E5] dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Executive Command OS
          </span>
          <span className="hidden sm:inline text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            • Real-time control & analytics
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowQRModal(true)}
            className="px-3 py-1.5 rounded-xl bg-white/80 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-200 border border-indigo-200 dark:border-slate-700 hover:text-[#4F46E5] transition-colors cursor-pointer flex items-center gap-1"
          >
            <QrCode className="w-3.5 h-3.5 text-[#4F46E5]" />
            <span>My Pass</span>
          </button>

          <button
            onClick={() => setShowRegisterModal(true)}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white text-[11px] font-bold shadow-xs hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-1"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ Register</span>
          </button>
        </div>
      </div>

      {/* Featured Hero Banner Carousel with Live Ticking Countdown */}
      <div className="relative overflow-hidden rounded-[32px] shadow-2xl transition-all duration-500 group">
        <div
          className="p-6 sm:p-8 text-white min-h-[260px] flex flex-col justify-between relative z-10"
          style={{ background: currentBanner.bgGradient }}
        >
          {/* Top category chip & dots */}
          <div className="flex items-center justify-between">
            <span className="px-3.5 py-1.5 rounded-full text-xs font-black bg-white/20 backdrop-blur-md uppercase tracking-wider text-white border border-white/30">
              🔥 {currentBanner.category}
            </span>
            <div className="flex items-center gap-2">
              {bannerEvents.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCarouselIndex(idx)}
                  className={`w-3 h-3 rounded-full transition-all cursor-pointer ${
                    carouselIndex === idx ? "w-8 bg-white" : "bg-white/40"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Banner Title & Description */}
          <div className="my-4 max-w-2xl">
            <h2 className="text-2xl sm:text-3xl font-black leading-tight drop-shadow-md">
              {currentBanner.title}
            </h2>
            <p className="text-xs sm:text-sm font-medium text-white/90 mt-1.5 drop-shadow-xs leading-relaxed">
              {currentBanner.subtitle}
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-white/80 mt-3">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" /> {currentBanner.location}
              </span>
              <span className="flex items-center gap-1.5">
                <Ticket className="w-4 h-4" /> {currentBanner.registered}
              </span>
            </div>
          </div>

          {/* Live Ticking Countdown Footer Bar */}
          <div className="pt-3 border-t border-white/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-white/80">Starts In:</span>
              <div className="flex items-center gap-2 mt-0.5 font-mono text-xs sm:text-sm font-extrabold text-white">
                <span className="px-2.5 py-1 rounded-xl bg-black/40">{timeLeft.days}d</span>:
                <span className="px-2.5 py-1 rounded-xl bg-black/40">{timeLeft.hours}h</span>:
                <span className="px-2.5 py-1 rounded-xl bg-black/40">{timeLeft.mins}m</span>:
                <span className="px-2.5 py-1 rounded-xl bg-black/40 text-amber-300 animate-pulse">{timeLeft.secs}s</span>
              </div>
            </div>

            <button
              onClick={() => setShowRegisterModal(true)}
              className="px-5 py-3 rounded-2xl bg-white text-[#4F46E5] font-black text-xs hover:bg-indigo-50 active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer self-end sm:self-auto"
            >
              <span>Register Now</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid (8 Core Specs Metrics) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <GlassCard
              key={idx}
              hoverScale={true}
              className="p-4 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <div
                  style={{ backgroundColor: kpi.bg, color: kpi.color }}
                  className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs"
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  {kpi.trend}
                </span>
              </div>

              <div className="mt-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{kpi.label}</span>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-0.5">
                  {kpi.value}
                </h3>
                <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                  {kpi.sub}
                </p>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Analytics Visual Breakdown (Area & Bar & Pie Charts) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Area Chart: Ticket Registration Velocity */}
        <GlassCard hoverScale={false} className="lg:col-span-2 p-5 border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Velocity Chart</span>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Daily Ticket Registrations</h3>
            </div>
            <span className="text-xs font-bold text-[#4F46E5] bg-indigo-50 dark:bg-slate-800 px-3 py-1 rounded-full border border-indigo-200 dark:border-slate-700">
              Total: 1,842 Passes
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={registrationTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRegDash" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorVipDash" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="day" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1E293B",
                    color: "#FFFFFF",
                    borderRadius: "16px",
                    borderColor: "#4F46E5",
                    fontSize: "12px",
                  }}
                />
                <Area type="monotone" dataKey="count" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#colorRegDash)" name="Standard Passes" />
                <Area type="monotone" dataKey="vip" stroke="#7C3AED" strokeWidth={2} fillOpacity={1} fill="url(#colorVipDash)" name="VIP Passes" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Pie Category Distribution */}
        <GlassCard hoverScale={false} className="p-5 border border-slate-200/80 dark:border-slate-800 space-y-3">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Pass Category Distribution</h3>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieCategories}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieCategories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: "11px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      {/* Today's Schedule & Pending Tasks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Today's Duty Schedule */}
        <GlassCard hoverScale={false} className="p-5 border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#4F46E5]" /> Today's Schedule & Duty
            </h3>
            <span className="text-xs font-bold text-[#4F46E5]">Live Updates</span>
          </div>

          <div className="space-y-2.5">
            {todaysActivities.map((act, idx) => (
              <div key={idx} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="px-2.5 py-1.5 rounded-xl bg-indigo-100 dark:bg-slate-900 text-[11px] font-mono font-bold text-[#4F46E5] text-center border border-indigo-200/60 dark:border-slate-700">
                    {act.time}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{act.title}</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {act.dept} • {act.count}
                    </p>
                  </div>
                </div>
                <StatusChip status={act.status} />
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Pending Operational Tasks */}
        <GlassCard hoverScale={false} className="p-5 border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-[#4F46E5]" /> Pending Action Items
            </h3>
            <span className="text-xs font-bold text-rose-500">4 Critical</span>
          </div>

          <div className="space-y-2.5">
            {pendingTasks.map((t, idx) => (
              <div key={idx} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <input type="checkbox" className="w-4 h-4 rounded-md accent-[#4F46E5] cursor-pointer" />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{t.task}</span>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                  t.priority === "high" ? "bg-rose-100 text-rose-600 border border-rose-200" : "bg-amber-100 text-amber-600 border border-amber-200"
                }`}>
                  Due {t.due}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Floating CRED-style AI Assistant Launcher Button */}
      <button
        onClick={() => setShowAICopilot(true)}
        style={{
          background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
          boxShadow: "0 10px 30px -4px rgba(79, 70, 229, 0.5), 0 0 25px rgba(124, 58, 237, 0.4)",
        }}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full flex items-center justify-center text-white cursor-pointer hover:scale-110 active:scale-95 transition-all duration-300 border-2 border-white dark:border-slate-900 group shadow-2xl"
        title="Open AI Event Copilot"
      >
        <Bot className="w-7 h-7 group-hover:rotate-12 transition-transform duration-300" />
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-white animate-ping" />
      </button>

      {/* AI Copilot Drawer */}
      <EventAICopilotDrawer
        isOpen={showAICopilot}
        onClose={() => setShowAICopilot(false)}
      />

      {/* Registration Wizard Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-lg">
            <EventRegistrationWizard onClose={() => setShowRegisterModal(false)} />
          </div>
        </div>
      )}

      {/* Digital QR Entry Pass Bottom Sheet */}
      <BottomSheet
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        title="Digital QR Pass"
        subtitle="Present this QR code at the event gate for instant check-in"
      >
        <div className="p-4 text-center space-y-4">
          <div className="p-6 rounded-3xl bg-slate-900 text-white inline-block shadow-2xl">
            <QrCode className="w-48 h-48 mx-auto" />
            <p className="text-xs font-mono text-orange-400 mt-2 font-bold">PASS-8849-2026-GANESH</p>
          </div>
          <div>
            <h4 className="text-base font-extrabold text-slate-900 dark:text-white">Sandeep Kumar (VIP Pass)</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">Main Gate Entry • Seat Row A-12</p>
          </div>
          <TouchButton variant="primary" icon={Download} fullWidth onClick={() => alert("Pass downloaded!")}>
            Download Digital Ticket PDF
          </TouchButton>
        </div>
      </BottomSheet>
    </div>
  );
}
