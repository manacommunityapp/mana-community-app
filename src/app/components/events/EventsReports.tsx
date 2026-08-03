import { BarChart3, Download, TrendingUp, Users, DollarSign, Package, FileText } from "lucide-react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";

// TODO: wire to eventService
const reportCards = [
  { title: "Registration Report",  desc: "1,842 registrants across 8 categories", icon: Users,      color: "#6366f1", bg: "#eef2ff", pages: 12 },
  { title: "Finance Summary",      desc: "Income ₹9.24L · Expenses ₹4.82L",       icon: DollarSign, color: "#10b981", bg: "#ecfdf5", pages: 8  },
  { title: "Sponsor ROI Report",   desc: "19 sponsors · ₹12.4L collected",          icon: TrendingUp, color: "#d97706", bg: "#fffbeb", pages: 6  },
  { title: "Volunteer Attendance", desc: "318 volunteers · 94% attendance",          icon: Users,      color: "#0891b2", bg: "#ecfeff", pages: 5  },
  { title: "Food & Inventory",     desc: "4,200 plates · 6 menu items tracked",      icon: Package,    color: "#be185d", bg: "#fdf2f8", pages: 7  },
  { title: "Auction Report",       desc: "6 items · ₹2.1L revenue",                 icon: BarChart3,  color: "#8b5cf6", bg: "#f5f3ff", pages: 4  },
];

// TODO: wire to eventService
const attendanceTrend = [
  { day: "Day 1 AM", count: 820  },
  { day: "Day 1 PM", count: 1450 },
  { day: "Day 1 Eve",count: 2100 },
  { day: "Day 2 AM", count: 950  },
  { day: "Day 2 PM", count: 1680 },
  { day: "Day 2 Eve",count: 2400 },
  { day: "Day 3 AM", count: 800  },
  { day: "Day 3 PM", count: 1200 },
];

// TODO: wire to eventService
const radarData = [
  { metric: "Registration", score: 88 },
  { metric: "Finance",      score: 75 },
  { metric: "Volunteers",   score: 94 },
  { metric: "Food",         score: 82 },
  { metric: "Sponsors",     score: 80 },
  { metric: "Programs",     score: 91 },
  { metric: "Security",     score: 96 },
  { metric: "Venue",        score: 85 },
];

export function EventsReports() {
  return (
    <div className="space-y-6">

      {/* Report cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportCards.map((r, i) => (
          <div key={r.title}
            className={`animate-fade-in-up stagger-${Math.min(i + 1, 8)} bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.05)] hover:shadow-lg transition-shadow group`}>
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: r.bg }}>
                <r.icon className="w-5 h-5" style={{ color: r.color }} />
              </div>
              <span className="text-[10px] font-bold text-slate-400">{r.pages} pages</span>
            </div>
            <p className="font-bold text-slate-800">{r.title}</p>
            <p className="text-xs text-slate-500 mt-1 mb-4">{r.desc}</p>
            <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 transition-all">
              <Download className="w-3.5 h-3.5" /> Download PDF
            </button>
          </div>
        ))}
      </div>

      {/* Analytics charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Attendance trend */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
          <h3 className="font-bold text-slate-800 mb-1">Attendance Trend</h3>
          <p className="text-xs text-slate-400 mb-5">Footfall across all 3 event days</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={attendanceTrend}>
              <defs>
                <linearGradient id="attGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ border: "none", borderRadius: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: 12 }} />
              <Area type="monotone" dataKey="count" stroke="#4f46e5" strokeWidth={2.5} fill="url(#attGrad)" dot={{ fill: "#4f46e5", r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Radar – overall event scorecard */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
          <h3 className="font-bold text-slate-800 mb-1">Event Scorecard</h3>
          <p className="text-xs text-slate-400 mb-2">Overall performance across modules</p>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: "#94a3b8" }} />
              <Radar dataKey="score" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.15} strokeWidth={2} dot={{ fill: "#4f46e5", r: 3 }} />
              <Tooltip contentStyle={{ border: "none", borderRadius: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: 12 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick export */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="font-bold text-slate-800">Generate Complete Event Report</h3>
            <p className="text-xs text-slate-400 mt-0.5">Export all modules into a single consolidated PDF report</p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all">
              <FileText className="w-4 h-4" /> Preview
            </button>
            <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-500 to-violet-500 text-white hover:from-indigo-600 hover:to-violet-600 transition-all shadow-sm">
              <Download className="w-4 h-4" /> Export Full Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
