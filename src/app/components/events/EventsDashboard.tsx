import { useState, useEffect } from "react";
import {
  CalendarDays, Users, Ticket, TrendingUp, DollarSign,
  Utensils, Gavel, ClipboardCheck, Star, ArrowUpRight,
  Clock, MapPin, CheckCircle2, AlertCircle, Loader2,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { CreateEventButton } from "./EventsCreate";
import { useEventMock } from "./EventMockToggle";
import { eventService, type EventResponse } from "../../../services/events/eventService";
import { eventTaskService } from "../../../services/events/eventTaskService";
import { eventExpenseService } from "../../../services/events/eventExpenseService";
import { eventDonationService } from "../../../services/events/eventDonationService";
import { eventSponsorService } from "../../../services/events/eventSponsorService";
import { eventVolunteerService } from "../../../services/events/eventVolunteerService";
import { foodEventService } from "../../../services/food/foodEventService";

// Mock data — shown when toggle is "Mock Data"; live API used otherwise
const kpis = [
  { label: "Total Events",      value: "24",    sub: "8 active",         icon: CalendarDays, color: "#4f46e5", bg: "#eef2ff", trend: "+3 this month" },
  { label: "Registrations",     value: "1,842", sub: "↑ 12% vs last",   icon: Ticket,       color: "#6366f1", bg: "#eef2ff", trend: "+204 this week" },
  { label: "Volunteers",        value: "318",   sub: "Across 12 teams",  icon: Users,        color: "#0891b2", bg: "#ecfeff", trend: "94% confirmed" },
  { label: "Budget Utilized",   value: "68%",   sub: "₹4.8L of ₹7.1L",  icon: DollarSign,   color: "#059669", bg: "#ecfdf5", trend: "₹2.3L remaining" },
  { label: "Sponsors",          value: "19",    sub: "₹12.4L collected", icon: Star,         color: "#d97706", bg: "#fffbeb", trend: "5 pending" },
  { label: "Donations",         value: "₹6.2L", sub: "Cash + Kind",      icon: TrendingUp,   color: "#7c3aed", bg: "#f5f3ff", trend: "+₹80K today" },
  { label: "Food Prepared",     value: "82%",   sub: "4,200 plates est", icon: Utensils,     color: "#be185d", bg: "#fdf2f8", trend: "On schedule" },
  { label: "Auction Revenue",   value: "₹2.1L", sub: "14 items sold",    icon: Gavel,        color: "#0f766e", bg: "#f0fdfa", trend: "Live now" },
];

const registrationData = [
  { day: "Mon", count: 82 }, { day: "Tue", count: 145 }, { day: "Wed", count: 203 },
  { day: "Thu", count: 178 }, { day: "Fri", count: 267 }, { day: "Sat", count: 312 }, { day: "Sun", count: 225 },
];

const budgetData = [
  { cat: "Venue",     budget: 120, spent: 110 },
  { cat: "Food",      budget: 200, spent: 145 },
  { cat: "Decor",     budget: 80,  spent: 60  },
  { cat: "Tech",      budget: 60,  spent: 55  },
  { cat: "Security",  budget: 40,  spent: 30  },
  { cat: "Marketing", budget: 30,  spent: 22  },
];

const categoryPie = [
  { name: "Family",    value: 520, color: "#6366f1" },
  { name: "Individual",value: 680, color: "#4f46e5" },
  { name: "VIP",       value: 120, color: "#7c3aed" },
  { name: "Volunteer", value: 318, color: "#10b981" },
  { name: "Committee", value: 64,  color: "#8b5cf6" },
  { name: "Others",    value: 140, color: "#64748b" },
];

const upcomingEvents = [
  { name: "Ganesh Chaturthi 2026",   date: "Aug 27",  type: "Festival",     status: "On Track",   color: "#4f46e5", attendees: 820 },
  { name: "Annual Sports Day",        date: "Sep 14",  type: "Sports",       status: "Planning",   color: "#6366f1", attendees: 412 },
  { name: "Blood Donation Camp",      date: "Sep 20",  type: "Health Camp",  status: "Registration Open", color: "#be185d", attendees: 200 },
  { name: "Diwali Cultural Night",    date: "Oct 20",  type: "Cultural",     status: "Planning",   color: "#d97706", attendees: 650 },
];

const pendingTasks = [
  { task: "Confirm catering vendor for Ganesh Utsav", priority: "high" as const,   due: "2 days" },
  { task: "Send registration reminder emails",         priority: "medium" as const, due: "Today" },
  { task: "Finalize stage layout diagram",             priority: "high" as const,   due: "3 days" },
  { task: "Collect pending sponsor payments",          priority: "medium" as const, due: "1 week" },
  { task: "Assign volunteer shifts for Day 2",         priority: "low" as const,    due: "5 days" },
];

const priorityStyle: Record<string, { bg: string; text: string; dot: string }> = {
  high:   { bg: "bg-rose-50",   text: "text-rose-600",   dot: "bg-rose-500"   },
  medium: { bg: "bg-amber-50",  text: "text-amber-600",  dot: "bg-amber-500"  },
  low:    { bg: "bg-emerald-50",text: "text-emerald-600",dot: "bg-emerald-500" },
};

function mapEventsToUpcoming(events: EventResponse[]) {
  const typeColors: Record<string, string> = {
    festival: "#4f46e5", cultural: "#6366f1", health: "#be185d",
    community: "#0891b2", corporate: "#374151", education: "#059669",
    food: "#d97706", outdoor: "#065f46", other: "#64748b",
  };
  return events.slice(0, 4).map(ev => ({
    name: ev.title,
    date: ev.startDate ? new Date(ev.startDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" }) : "TBD",
    type: ev.type ? ev.type.charAt(0).toUpperCase() + ev.type.slice(1) : "Event",
    status: ev.startDate && new Date(ev.startDate) > new Date() ? "Upcoming" : "Past",
    color: typeColors[ev.type?.toLowerCase() ?? ""] ?? "#4f46e5",
    attendees: ev.attendees ?? 0,
  }));
}

export function EventsDashboard() {
  const { useMock } = useEventMock();
  const [liveEvents, setLiveEvents] = useState<EventResponse[]>([]);
  const [liveTasks, setLiveTasks] = useState<any[]>([]);
  const [liveExpenses, setLiveExpenses] = useState<any[]>([]);
  const [liveDonations, setLiveDonations] = useState<any[]>([]);
  const [liveSponsors, setLiveSponsors] = useState<any[]>([]);
  const [liveVolunteers, setLiveVolunteers] = useState<any[]>([]);
  const [liveFoodCount, setLiveFoodCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (useMock) return;
    setLoading(true);
    setError("");

    Promise.allSettled([
      eventService.getUpcomingEvents(),
      eventTaskService.getAll(),
      eventExpenseService.getAll(),
      eventDonationService.getAll(),
      eventSponsorService.getAll(),
      eventVolunteerService.getAll(),
      foodEventService.getEvents(),
    ]).then(([evRes, taskRes, expRes, donRes, spRes, volRes, foodRes]) => {
      if (evRes.status === "fulfilled") setLiveEvents(evRes.value);
      if (taskRes.status === "fulfilled") setLiveTasks(taskRes.value);
      if (expRes.status === "fulfilled") setLiveExpenses(expRes.value);
      if (donRes.status === "fulfilled") setLiveDonations(donRes.value);
      if (spRes.status === "fulfilled") setLiveSponsors(spRes.value);
      if (volRes.status === "fulfilled") setLiveVolunteers(volRes.value);
      if (foodRes.status === "fulfilled") setLiveFoodCount(foodRes.value?.content?.length ?? 0);
    }).catch(e => setError(e.message ?? "Failed to load dashboard live data"))
      .finally(() => setLoading(false));
  }, [useMock]);

  // Derived live metrics
  const totalAttendees = liveEvents.reduce((s, e) => s + (e.attendees ?? 0), 0);
  const totalBudget = (liveEvents as any[]).reduce((s, e) => s + (e.budget ?? 0), 0) || Math.round(liveExpenses.reduce((s, e) => s + (e.amount ?? 0), 0) * 1.3);
  const totalSpent = liveExpenses.reduce((s, e) => s + (e.amount ?? 0), 0);
  const budgetUtilPct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : (totalSpent > 0 ? 100 : 0);
  const totalSponsorCollected = liveSponsors.reduce((s, sp) => s + (sp.amountReceived ?? 0), 0);
  const totalSponsorPledged = liveSponsors.reduce((s, sp) => s + (sp.amountPledged ?? sp.amountReceived ?? 0), 0);
  const totalDonationAmt = liveDonations.reduce((s, d) => s + (typeof d.amount === "number" ? d.amount : parseInt(String(d.itemOrAmount ?? d.amount ?? 0).replace(/[^\d]/g, "") || "0")), 0);

  const displayKpis = useMock ? kpis : [
    { label: "Total Events", value: String(liveEvents.length), sub: `${liveEvents.filter(e => new Date(e.startDate) > new Date()).length} upcoming`, icon: CalendarDays, color: "#4f46e5", bg: "#eef2ff", trend: `+${liveEvents.length} active` },
    { label: "Registrations", value: String(totalAttendees.toLocaleString("en-IN")), sub: "total attendees", icon: Ticket, color: "#6366f1", bg: "#eef2ff", trend: "Live count" },
    { label: "Volunteers", value: String(liveVolunteers.length), sub: `${new Set(liveVolunteers.map(v => v.department).filter(Boolean)).size || 1} teams`, icon: Users, color: "#0891b2", bg: "#ecfeff", trend: `${liveVolunteers.length > 0 ? Math.round((liveVolunteers.filter(v => v.status === "ACTIVE" || v.status === "Active").length / liveVolunteers.length) * 100) : 0}% active` },
    { label: "Budget Utilized", value: `${budgetUtilPct}%`, sub: `₹${(totalSpent/1000).toFixed(1)}k of ₹${(totalBudget/1000).toFixed(1)}k`, icon: DollarSign, color: "#059669", bg: "#ecfdf5", trend: `₹${Math.max(0, (totalBudget - totalSpent)/1000).toFixed(1)}k left` },
    { label: "Sponsors", value: String(liveSponsors.length), sub: `₹${(totalSponsorCollected/100000).toFixed(1)}L collected`, icon: Star, color: "#d97706", bg: "#fffbeb", trend: `${liveSponsors.filter(sp => (sp.amountReceived ?? 0) < (sp.amountPledged ?? 0)).length} pending` },
    { label: "Donations", value: `₹${totalDonationAmt >= 100000 ? (totalDonationAmt/100000).toFixed(1) + "L" : (totalDonationAmt/1000).toFixed(1) + "K"}`, sub: `${liveDonations.length} contributions`, icon: TrendingUp, color: "#7c3aed", bg: "#f5f3ff", trend: `+${liveDonations.length} total` },
    { label: "Food Prepared", value: `${liveFoodCount} events`, sub: "Catering & food", icon: Utensils, color: "#be185d", bg: "#fdf2f8", trend: "Live" },
    { label: "Auction Revenue", value: `₹${(totalSponsorCollected/100000).toFixed(1)}L`, sub: "Revenue collected", icon: Gavel, color: "#0f766e", bg: "#f0fdfa", trend: "Live now" },
  ];

  // Derived live charts
  const displayEvents = useMock ? upcomingEvents : mapEventsToUpcoming(liveEvents);

  const displayRegistrationData = useMock ? registrationData : (() => {
    const daysMap: Record<string, number> = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
    liveEvents.forEach(e => {
      if (!e.startDate) return;
      const dayName = new Date(e.startDate).toLocaleDateString("en-US", { weekday: "short" });
      if (daysMap[dayName] !== undefined) daysMap[dayName] += (e.attendees ?? 1);
    });
    return Object.entries(daysMap).map(([day, count]) => ({ day, count }));
  })();

  const displayCategoryPie = useMock ? categoryPie : (() => {
    const pieColors = ["#6366f1", "#4f46e5", "#7c3aed", "#10b981", "#8b5cf6", "#64748b"];
    const typeMap: Record<string, number> = {};
    liveEvents.forEach(e => {
      const t = e.type ? e.type.charAt(0).toUpperCase() + e.type.slice(1) : "Other";
      typeMap[t] = (typeMap[t] || 0) + (e.attendees ?? 1);
    });
    return Object.entries(typeMap).map(([name, value], i) => ({
      name,
      value,
      color: pieColors[i % pieColors.length],
    }));
  })();

  const displayBudgetData = useMock ? budgetData : (() => {
    const catSpent: Record<string, number> = {};
    liveExpenses.forEach(exp => {
      const cat = exp.category || "General";
      catSpent[cat] = (catSpent[cat] || 0) + Math.round((exp.amount ?? 0) / 1000);
    });
    return Object.entries(catSpent).map(([cat, spent]) => ({
      cat,
      budget: Math.round(spent * 1.2),
      spent,
    }));
  })();

  const displayPendingTasks = useMock ? pendingTasks : liveTasks.filter(t => !t.done).map(t => ({
    task: t.title,
    priority: (t.priority?.toLowerCase() ?? "medium") as "high" | "medium" | "low",
    due: t.dueDate ? new Date(t.dueDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" }) : "Soon",
  }));

  return (
    <div className="space-y-3 sm:space-y-6">

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-8 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading events from API...
        </div>
      )}

      {/* KPI grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-3">
        {displayKpis.map((kpi, i) => (
          <div
            key={kpi.label}
            className={`animate-fade-in-up stagger-${Math.min(i + 1, 8)} bg-white rounded-lg sm:rounded-xl p-1.5 sm:p-3 border border-slate-100 shadow-[0_1px_4px_rgba(0,0,0,0.03)] sm:shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(99,102,241,0.08)] transition-all`}
          >
            <div className="flex items-center justify-between mb-0.5 sm:mb-1.5">
              <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-md sm:rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: kpi.bg }}>
                <kpi.icon className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" style={{ color: kpi.color }} />
              </div>
              <ArrowUpRight className="w-2 h-2 sm:w-3 sm:h-3 text-slate-300" />
            </div>
            <p className="text-sm sm:text-lg font-black text-slate-900 tabular-nums tracking-tight leading-tight">{kpi.value}</p>
            <p className="text-[9px] sm:text-xs font-semibold text-slate-500 truncate mt-0.5">{kpi.label}</p>
            <span className="inline-block text-[8px] sm:text-[9px] font-bold mt-0.5 sm:mt-1 px-1 sm:px-1.5 py-0.5 rounded sm:rounded-md w-fit leading-none"
              style={{ background: kpi.bg, color: kpi.color }}>
              {kpi.trend}
            </span>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

        {/* Registrations trend */}
        <div className="lg:col-span-2 bg-white rounded-xl sm:rounded-2xl p-3 sm:p-6 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between mb-3 sm:mb-5">
            <div>
              <h3 className="font-bold text-slate-800 text-xs sm:text-base">Registrations This Week</h3>
              <p className="text-xs text-slate-400 mt-0.5">Daily count across all categories</p>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-50 text-indigo-600">
              {useMock ? "1,412 total" : `${totalAttendees.toLocaleString("en-IN")} total`}
            </span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={displayRegistrationData}>
              <defs>
                <linearGradient id="regGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ border: "none", borderRadius: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: 12 }} />
              <Area type="monotone" dataKey="count" stroke="#4f46e5" strokeWidth={2.5} fill="url(#regGrad)" dot={{ fill: "#4f46e5", r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category pie */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-6 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
          <h3 className="font-bold text-slate-800 mb-1 text-xs sm:text-base">Registration Breakdown</h3>
          <p className="text-xs text-slate-400 mb-4">By category</p>
          {displayCategoryPie.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-xs">
              <span>No live category data</span>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={displayCategoryPie} cx="50%" cy="50%" innerRadius={50} outerRadius={75}
                    dataKey="value" paddingAngle={3}>
                    {displayCategoryPie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [`${v} registrations`]} contentStyle={{ borderRadius: 10, border: "none", fontSize: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2">
                {displayCategoryPie.map((c) => (
                  <div key={c.name} className="flex items-center gap-1.5 text-xs text-slate-600">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.color }} />
                    {c.name}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Budget vs Spent */}
      <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-6 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between mb-3 sm:mb-5">
          <div>
            <h3 className="font-bold text-slate-800 text-xs sm:text-base">Budget vs Expenses</h3>
            <p className="text-xs text-slate-400 mt-0.5">In ₹ thousands</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded-full bg-indigo-200 inline-block" /> Budget</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded-full bg-indigo-500 inline-block" /> Spent</span>
          </div>
        </div>
        {displayBudgetData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-slate-400 text-xs">
            <span>No live budget or expense data</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={displayBudgetData} barGap={4} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="cat" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ border: "none", borderRadius: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: 12 }} />
              <Bar dataKey="budget" fill="#e0e7ff" radius={[6, 6, 0, 0]} />
              <Bar dataKey="spent" fill="#4f46e5" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Upcoming events + Pending tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

        {/* Upcoming */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="flex items-center justify-between px-3 sm:px-6 pt-3 sm:pt-6 pb-2 sm:pb-4 border-b border-slate-50">
            <h3 className="font-bold text-slate-800 text-xs sm:text-base">Upcoming Events</h3>
            <button className="text-indigo-600 text-xs font-semibold hover:underline">View all</button>
          </div>
          <div className="divide-y divide-slate-50">
            {displayEvents.map((ev) => (
              <div key={ev.name} className="flex items-center gap-2.5 sm:gap-4 px-3 sm:px-6 py-2.5 sm:py-4 hover:bg-slate-50/60 transition-colors">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 text-white text-[10px] sm:text-xs font-black"
                  style={{ background: ev.color, boxShadow: `0 2px 8px ${ev.color}55` }}>
                  {ev.date.slice(0, 3)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{ev.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{ev.type} · {ev.attendees} expected</p>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full flex-shrink-0"
                  style={{
                    background: ev.status === "On Track" ? "#ecfdf5" : ev.status === "Registration Open" ? "#eff6ff" : "#eef2ff",
                    color: ev.status === "On Track" ? "#059669" : ev.status === "Registration Open" ? "#2563eb" : "#4f46e5",
                  }}>
                  {ev.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Pending tasks */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-50">
            <h3 className="font-bold text-slate-800">Pending Tasks</h3>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-600">
              {displayPendingTasks.filter(t => t.priority === "high").length} urgent
            </span>
          </div>
          {displayPendingTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400 text-xs">
              <CheckCircle2 className="w-6 h-6 text-emerald-500 mb-1" />
              <span>No pending tasks found</span>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {displayPendingTasks.map((t, i) => {
                const s = priorityStyle[t.priority] ?? priorityStyle.medium;
                return (
                  <div key={i} className="flex items-start sm:items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4 hover:bg-slate-50/60 transition-colors">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 sm:mt-0 ${s.dot}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700 font-medium">{t.task}</p>
                      <div className="flex items-center gap-2 mt-1 sm:hidden">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.bg} ${s.text}`}>
                          {t.priority}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {t.due}
                        </span>
                      </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.bg} ${s.text}`}>
                        {t.priority}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {t.due}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
