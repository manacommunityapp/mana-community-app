import {
  CalendarDays, Users, Ticket, TrendingUp, DollarSign,
  Utensils, Gavel, ClipboardCheck, Star, ArrowUpRight,
  Clock, MapPin, CheckCircle2, AlertCircle,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

// TODO: wire to eventService
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

// TODO: wire to eventService
const registrationData = [
  { day: "Mon", count: 82 }, { day: "Tue", count: 145 }, { day: "Wed", count: 203 },
  { day: "Thu", count: 178 }, { day: "Fri", count: 267 }, { day: "Sat", count: 312 }, { day: "Sun", count: 225 },
];

// TODO: wire to eventService
const budgetData = [
  { cat: "Venue",     budget: 120, spent: 110 },
  { cat: "Food",      budget: 200, spent: 145 },
  { cat: "Decor",     budget: 80,  spent: 60  },
  { cat: "Tech",      budget: 60,  spent: 55  },
  { cat: "Security",  budget: 40,  spent: 30  },
  { cat: "Marketing", budget: 30,  spent: 22  },
];

// TODO: wire to eventService
const categoryPie = [
  { name: "Family",    value: 520, color: "#6366f1" },
  { name: "Individual",value: 680, color: "#4f46e5" },
  { name: "VIP",       value: 120, color: "#7c3aed" },
  { name: "Volunteer", value: 318, color: "#10b981" },
  { name: "Committee", value: 64,  color: "#8b5cf6" },
  { name: "Others",    value: 140, color: "#64748b" },
];

// TODO: wire to eventService
const upcomingEvents = [
  { name: "Ganesh Chaturthi 2026",   date: "Aug 27",  type: "Festival",     status: "On Track",   color: "#4f46e5", attendees: 820 },
  { name: "Annual Sports Day",        date: "Sep 14",  type: "Sports",       status: "Planning",   color: "#6366f1", attendees: 412 },
  { name: "Blood Donation Camp",      date: "Sep 20",  type: "Health Camp",  status: "Registration Open", color: "#be185d", attendees: 200 },
  { name: "Diwali Cultural Night",    date: "Oct 20",  type: "Cultural",     status: "Planning",   color: "#d97706", attendees: 650 },
];

// TODO: wire to eventService
const pendingTasks = [
  { task: "Confirm catering vendor for Ganesh Utsav", priority: "high",   due: "2 days" },
  { task: "Send registration reminder emails",         priority: "medium", due: "Today" },
  { task: "Finalize stage layout diagram",             priority: "high",   due: "3 days" },
  { task: "Collect pending sponsor payments",          priority: "medium", due: "1 week" },
  { task: "Assign volunteer shifts for Day 2",         priority: "low",    due: "5 days" },
];

const priorityStyle: Record<string, { bg: string; text: string; dot: string }> = {
  high:   { bg: "bg-rose-50",   text: "text-rose-600",   dot: "bg-rose-500"   },
  medium: { bg: "bg-amber-50",  text: "text-amber-600",  dot: "bg-amber-500"  },
  low:    { bg: "bg-emerald-50",text: "text-emerald-600",dot: "bg-emerald-500" },
};

export function EventsDashboard() {
  return (
    <div className="space-y-6">

      {/* KPI grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <div
            key={kpi.label}
            className={`animate-fade-in-up stagger-${Math.min(i + 1, 8)} bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_20px_rgba(99,102,241,0.1)] transition-shadow`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: kpi.bg }}>
                <kpi.icon className="w-4 h-4" style={{ color: kpi.color }} />
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-300" />
            </div>
            <p className="text-2xl font-black text-slate-900 tabular-nums">{kpi.value}</p>
            <p className="text-xs font-medium text-slate-500 mt-0.5">{kpi.label}</p>
            <p className="text-[10px] font-semibold mt-2 px-2 py-0.5 rounded-full w-fit"
              style={{ background: kpi.bg, color: kpi.color }}>
              {kpi.trend}
            </p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Registrations trend */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-slate-800">Registrations This Week</h3>
              <p className="text-xs text-slate-400 mt-0.5">Daily count across all categories</p>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-50 text-indigo-600">1,412 total</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={registrationData}>
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
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
          <h3 className="font-bold text-slate-800 mb-1">Registration Breakdown</h3>
          <p className="text-xs text-slate-400 mb-4">By category</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={categoryPie} cx="50%" cy="50%" innerRadius={50} outerRadius={75}
                dataKey="value" paddingAngle={3}>
                {categoryPie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(v) => [`${v} registrations`]} contentStyle={{ borderRadius: 10, border: "none", fontSize: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2">
            {categoryPie.map((c) => (
              <div key={c.name} className="flex items-center gap-1.5 text-xs text-slate-600">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.color }} />
                {c.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Budget vs Spent */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-slate-800">Budget vs Expenses</h3>
            <p className="text-xs text-slate-400 mt-0.5">In ₹ thousands</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded-full bg-indigo-200 inline-block" /> Budget</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded-full bg-indigo-500 inline-block" /> Spent</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={budgetData} barGap={4} barSize={20}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="cat" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ border: "none", borderRadius: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: 12 }} />
            <Bar dataKey="budget" fill="#e0e7ff" radius={[6, 6, 0, 0]} />
            <Bar dataKey="spent" fill="#4f46e5" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Upcoming events + Pending tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Upcoming */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-50">
            <h3 className="font-bold text-slate-800">Upcoming Events</h3>
            <button className="text-indigo-600 text-xs font-semibold hover:underline">View all</button>
          </div>
          <div className="divide-y divide-slate-50">
            {upcomingEvents.map((ev) => (
              <div key={ev.name} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/60 transition-colors">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-xs font-black"
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
              {pendingTasks.filter(t => t.priority === "high").length} urgent
            </span>
          </div>
          <div className="divide-y divide-slate-50">
            {pendingTasks.map((t, i) => {
              const s = priorityStyle[t.priority];
              return (
                <div key={i} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/60 transition-colors">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${s.dot}`} />
                  <p className="flex-1 text-sm text-slate-700 font-medium">{t.task}</p>
                  <div className="flex items-center gap-2 flex-shrink-0">
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
        </div>
      </div>
    </div>
  );
}
