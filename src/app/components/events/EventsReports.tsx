import { useState, useEffect } from "react";
import { BarChart3, Download, TrendingUp, Users, DollarSign, Package, FileText } from "lucide-react";
import { useEventMock } from "./EventMockToggle";
import { ErrorBanner, LoadingSpinner } from "./shared";
import { eventReportService, type EventReportResponse } from "../../../services/events/eventReportService";
import { eventService, type EventResponse } from "../../../services/events/eventService";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";

const mockReportCards = [
  { title: "Registration Report",  desc: "1,842 registrants across 8 categories", icon: Users,      color: "#6366f1", bg: "#eef2ff", pages: 12 },
  { title: "Finance Summary",      desc: "Income ₹9.24L · Expenses ₹4.82L",       icon: DollarSign, color: "#10b981", bg: "#ecfdf5", pages: 8  },
  { title: "Sponsor ROI Report",   desc: "19 sponsors · ₹12.4L collected",          icon: TrendingUp, color: "#d97706", bg: "#fffbeb", pages: 6  },
  { title: "Volunteer Attendance", desc: "318 volunteers · 94% attendance",          icon: Users,      color: "#0891b2", bg: "#ecfeff", pages: 5  },
  { title: "Food & Inventory",     desc: "4,200 plates · 6 menu items tracked",      icon: Package,    color: "#be185d", bg: "#fdf2f8", pages: 7  },
  { title: "Auction Report",       desc: "6 items · ₹2.1L revenue",                 icon: BarChart3,  color: "#8b5cf6", bg: "#f5f3ff", pages: 4  },
];

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

const mockRadarData = [
  { metric: "Registration", score: 88 },
  { metric: "Finance",      score: 75 },
  { metric: "Volunteers",   score: 94 },
  { metric: "Food",         score: 82 },
  { metric: "Sponsors",     score: 80 },
  { metric: "Programs",     score: 91 },
  { metric: "Security",     score: 96 },
  { metric: "Venue",        score: 85 },
];

function buildReportCards(r: EventReportResponse) {
  const taskPct = r.totalTasks > 0 ? Math.round((r.completedTasks / r.totalTasks) * 100) : 0;
  return [
    { title: "Registration Report",  desc: `${r.totalRegistrations} registrants`,                              icon: Users,      color: "#6366f1", bg: "#eef2ff", pages: 0 },
    { title: "Finance Summary",      desc: `Donations ₹${(r.totalDonations / 100000).toFixed(1)}L · Expenses ₹${(r.totalExpenses / 100000).toFixed(1)}L · Net ₹${(r.netRevenue / 100000).toFixed(1)}L`, icon: DollarSign, color: "#10b981", bg: "#ecfdf5", pages: 0 },
    { title: "Sponsor Report",       desc: `${r.totalSponsorships} sponsors`,                                  icon: TrendingUp, color: "#d97706", bg: "#fffbeb", pages: 0 },
    { title: "Volunteer Report",     desc: `${r.totalVolunteers} volunteers`,                                   icon: Users,      color: "#0891b2", bg: "#ecfeff", pages: 0 },
    { title: "Gallery",              desc: `${r.totalGalleryItems} items`,                                      icon: Package,    color: "#be185d", bg: "#fdf2f8", pages: 0 },
    { title: "Task Progress",        desc: `${r.completedTasks}/${r.totalTasks} tasks (${taskPct}%)`,           icon: BarChart3,  color: "#8b5cf6", bg: "#f5f3ff", pages: 0 },
  ];
}

function buildRadarData(r: EventReportResponse) {
  const max = Math.max(r.totalRegistrations, r.totalVolunteers, r.totalDonations, r.totalSponsorships, r.totalExpenses, r.totalGalleryItems, r.totalPrograms, 1);
  return [
    { metric: "Registrations", score: Math.round((r.totalRegistrations / max) * 100) },
    { metric: "Volunteers",    score: Math.round((r.totalVolunteers / max) * 100) },
    { metric: "Donations",     score: Math.round((r.totalDonations / max) * 100) },
    { metric: "Sponsors",      score: Math.round((r.totalSponsorships / max) * 100) },
    { metric: "Programs",      score: Math.round((r.totalPrograms / max) * 100) },
    { metric: "Gallery",       score: Math.round((r.totalGalleryItems / max) * 100) },
  ];
}

export function EventsReports() {
  const { useMock } = useEventMock();
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [report, setReport] = useState<EventReportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (useMock) return;
    eventService.getUpcomingEvents()
      .then(evts => {
        setEvents(evts);
        if (evts.length > 0) setSelectedEventId(evts[0].id);
      })
      .catch(() => {});
  }, [useMock]);

  useEffect(() => {
    if (useMock || !selectedEventId) return;
    setLoading(true);
    setError("");
    eventReportService.getEventReport(selectedEventId)
      .then(setReport)
      .catch(e => setError(e.message ?? "Failed to load report"))
      .finally(() => setLoading(false));
  }, [useMock, selectedEventId]);

  const reportCards = useMock ? mockReportCards : (report ? buildReportCards(report) : []);
  const radarData = useMock ? mockRadarData : (report ? buildRadarData(report) : []);

  return (
    <div className="space-y-3 sm:space-y-6">
      {error && <ErrorBanner message={error} />}
      {loading && <LoadingSpinner label="Loading report…" />}

      {!useMock && events.length > 1 && (
        <select
          value={selectedEventId ?? ""}
          onChange={e => setSelectedEventId(Number(e.target.value))}
          className="w-full max-w-xs px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white"
        >
          {events.map(ev => (
            <option key={ev.id} value={ev.id}>{ev.title}</option>
          ))}
        </select>
      )}

      {/* Report cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {reportCards.map((r, i) => (
          <div key={r.title}
            className={`animate-fade-in-up stagger-${Math.min(i + 1, 8)} bg-white rounded-2xl p-3 sm:p-5 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.05)] hover:shadow-lg transition-shadow group`}>
            <div className="flex items-start justify-between mb-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center" style={{ background: r.bg }}>
                <r.icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: r.color }} />
              </div>
              {r.pages > 0 && <span className="text-[10px] font-bold text-slate-400">{r.pages} pages</span>}
            </div>
            <p className="font-bold text-slate-800">{r.title}</p>
            <p className="text-xs text-slate-500 mt-1 mb-4">{r.desc}</p>
            <button className="w-full flex items-center justify-center gap-2 py-2 sm:py-2.5 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 transition-all">
              <Download className="w-3.5 h-3.5" /> Download PDF
            </button>
          </div>
        ))}
      </div>

      {/* Analytics charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">

        {/* Attendance trend — mock only */}
        {useMock && (
          <div className="bg-white rounded-2xl p-3 sm:p-6 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
            <h3 className="font-bold text-slate-800 mb-1 text-xs sm:text-base">Attendance Trend</h3>
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
        )}

        {/* Radar – overall event scorecard */}
        {radarData.length > 0 && (
          <div className="bg-white rounded-2xl p-3 sm:p-6 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
            <h3 className="font-bold text-slate-800 mb-1 text-xs sm:text-base">Event Scorecard</h3>
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
        )}
      </div>

      {/* Quick export */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h3 className="font-bold text-slate-800 text-sm sm:text-base">Generate Complete Event Report</h3>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">Export all modules into a single consolidated PDF report</p>
          </div>
          <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
            <button className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all">
              <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Preview
            </button>
            <button className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-indigo-500 to-violet-500 text-white hover:from-indigo-600 hover:to-violet-600 transition-all shadow-sm">
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Export
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
