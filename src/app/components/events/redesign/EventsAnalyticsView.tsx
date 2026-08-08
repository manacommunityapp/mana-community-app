import React, { useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import {
  TrendingUp, Users, Ticket, DollarSign, Star, Utensils,
  Gavel, ClipboardCheck, ArrowUpRight, Download, Filter, Sparkles
} from "lucide-react";
import { GlassCard, TouchButton } from "./EventDesignSystem";

interface EventsAnalyticsViewProps {
  isDark?: boolean;
}

export const EventsAnalyticsView: React.FC<EventsAnalyticsViewProps> = ({ isDark = false }) => {
  const [timeframe, setTimeframe] = useState("week");

  const kpis = [
    { label: "Registrations", value: "1,842", sub: "↑ 14% vs last week", icon: Ticket, color: "#FF6B00", bg: "rgba(255, 107, 0, 0.1)" },
    { label: "Sponsors Raised", value: "₹6.10 Lakhs", sub: "19 Active sponsors", icon: Star, color: "#4F46E5", bg: "rgba(79, 70, 229, 0.1)" },
    { label: "Budget Spent", value: "₹4.82 Lakhs", sub: "64% of ₹7.5L total", icon: DollarSign, color: "#16A34A", bg: "rgba(22, 163, 74, 0.1)" },
    { label: "Volunteers", value: "318", sub: "94% Duty assigned", icon: Users, color: "#2563EB", bg: "rgba(37, 99, 235, 0.1)" },
    { label: "Food Meals Prepared", value: "85%", sub: "4,200 plates est", icon: Utensils, color: "#EC4899", bg: "rgba(236, 72, 153, 0.1)" },
    { label: "Auction Revenue", value: "₹2.10 Lakhs", sub: "14 items sold live", icon: Gavel, color: "#F59E0B", bg: "rgba(245, 158, 11, 0.1)" },
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
    { cat: "Marketing & PR", budget: 0.5, spent: 0.27 },
  ];

  const pieCategories = [
    { name: "Family Passes", value: 520, color: "#FF6B00" },
    { name: "Individual", value: 680, color: "#4F46E5" },
    { name: "VIP Guests", value: 120, color: "#16A34A" },
    { name: "Volunteers", value: 318, color: "#2563EB" },
    { name: "Performers", value: 204, color: "#EC4899" },
  ];

  return (
    <div className="space-y-5 pb-8">
      {/* Header & Filter Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <span className="text-[11px] font-extrabold text-[#FF6B00] uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Real-time Analytics
          </span>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Event Performance KPIs</h2>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className="flex items-center p-1 rounded-2xl bg-slate-200/80 dark:bg-slate-800 text-xs font-bold">
            {["week", "month", "all"].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1.5 rounded-xl capitalize transition-all cursor-pointer ${
                  timeframe === tf
                    ? "bg-[#FF6B00] text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          <button
            onClick={() => alert("KPI Analytics PDF report exported!")}
            className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-[#FF6B00] shadow-xs cursor-pointer"
            title="Export Report"
          >
            <Download className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <GlassCard key={idx} isDark={isDark} hoverScale={false} className="p-4 border">
              <div className="flex items-center justify-between">
                <div
                  style={{ backgroundColor: kpi.bg, color: kpi.color }}
                  className="w-10 h-10 rounded-2xl flex items-center justify-center"
                >
                  <Icon className="w-5 h-5" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-emerald-500" />
              </div>

              <div className="mt-3">
                <span className="text-[10px] text-slate-400 font-bold uppercase">{kpi.label}</span>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-0.5">
                  {kpi.value}
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                  {kpi.sub}
                </p>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Area Chart: Daily Registration Velocity */}
      <GlassCard isDark={isDark} hoverScale={false} className="p-5 border space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Velocity Chart</span>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Daily Ticket Registrations</h3>
          </div>
          <span className="text-xs font-bold text-[#FF6B00]">Total: 1,842 Passes</span>
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={registrationTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorReg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF6B00" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#FF6B00" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorVip" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="day" stroke={isDark ? "#94A3B8" : "#64748B"} fontSize={11} />
              <YAxis stroke={isDark ? "#94A3B8" : "#64748B"} fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
                  borderRadius: "16px",
                  borderColor: "#FF6B00",
                  fontSize: "12px",
                }}
              />
              <Area type="monotone" dataKey="count" stroke="#FF6B00" strokeWidth={3} fillOpacity={1} fill="url(#colorReg)" name="Standard Passes" />
              <Area type="monotone" dataKey="vip" stroke="#4F46E5" strokeWidth={2} fillOpacity={1} fill="url(#colorVip)" name="VIP Passes" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      {/* Grid: Bar Chart & Pie Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Budget vs Spent Bar Chart */}
        <GlassCard isDark={isDark} hoverScale={false} className="p-5 border space-y-3">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Budget vs Spent (₹ Lakhs)</h3>
          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={budgetBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="cat" stroke={isDark ? "#94A3B8" : "#64748B"} fontSize={10} />
                <YAxis stroke={isDark ? "#94A3B8" : "#64748B"} fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
                    borderRadius: "16px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="budget" fill="#4F46E5" radius={[6, 6, 0, 0]} name="Allocated" />
                <Bar dataKey="spent" fill="#FF6B00" radius={[6, 6, 0, 0]} name="Actual Spent" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Pie Category Distribution */}
        <GlassCard isDark={isDark} hoverScale={false} className="p-5 border space-y-3">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Registrations by Category</h3>
          <div className="h-56 w-full flex items-center justify-center">
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
    </div>
  );
};
