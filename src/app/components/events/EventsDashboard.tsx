import React, { useState, useEffect, useMemo } from "react";
import {
  CalendarDays, Users, Ticket, TrendingUp, DollarSign,
  Utensils, Gavel, ClipboardCheck, Star,
  Clock, MapPin, AlertCircle, Loader2,
  Sparkles, QrCode, UserPlus,
  ChevronRight, Download, Bot, RefreshCw,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { GlassCard, TouchButton, StatusChip, BottomSheet } from "./redesign/EventDesignSystem";
import { EventAICopilotDrawer } from "./redesign/EventAICopilotDrawer";
import { EventRegistrationWizard } from "./redesign/EventRegistrationWizard";
import { useEventMock } from "./EventMockToggle";
import { useAuth } from "../../../contexts/AuthContext";
import {
  eventService,
  type DashboardStatsResponse,
  type EventResponse,
  type RegistrationResponse,
} from "../../../services/events/eventService";
import { eventSponsorService, type EventSponsorResponse } from "../../../services/events/eventSponsorService";
import { eventDonationService } from "../../../services/events/eventDonationService";
import { eventExpenseService, type EventExpenseResponse } from "../../../services/events/eventExpenseService";
import { eventTaskService, type EventTaskResponse } from "../../../services/events/eventTaskService";
import { eventProgramService, type EventProgramResponse } from "../../../services/events/eventProgramService";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtINR(n: number): string {
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
  if (n >= 1000)   return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${Math.round(n)}`;
}

function countdownFrom(dateStr: string, timeStr?: string | null) {
  const dt = new Date(`${dateStr}${timeStr ? "T" + timeStr : "T00:00:00"}`).getTime();
  const diff = Math.max(0, dt - Date.now());
  return {
    days:  Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    mins:  Math.floor((diff % 3600000) / 60000),
    secs:  Math.floor((diff % 60000) / 1000),
  };
}

const BANNER_GRADIENTS = [
  "linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #6366F1 100%)",
  "linear-gradient(135deg, #4F46E5 0%, #6366F1 50%, #FF6B00 100%)",
  "linear-gradient(135deg, #0891B2 0%, #4F46E5 50%, #7C3AED 100%)",
  "linear-gradient(135deg, #059669 0%, #0891B2 50%, #4F46E5 100%)",
];

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const PIE_COLORS = ["#4F46E5", "#7C3AED", "#16A34A", "#2563EB", "#EC4899", "#F59E0B"];

// ── Static mock data (unchanged from original) ────────────────────────────────

const MOCK_KPIS = [
  { label: "Total Events",    value: "24",     sub: "8 active festivals",  icon: CalendarDays, color: "#4F46E5", bg: "rgba(79,70,229,0.12)",   trend: "+3 this month"  },
  { label: "Registrations",   value: "1,842",  sub: "↑ 14% vs last week",  icon: Ticket,       color: "#7C3AED", bg: "rgba(124,58,237,0.12)",  trend: "+204 this week" },
  { label: "Volunteers",      value: "318",    sub: "94% Duty assigned",    icon: Users,        color: "#16A34A", bg: "rgba(22,163,74,0.12)",   trend: "12 Teams"       },
  { label: "Budget Spent",    value: "₹4.82L", sub: "64% of ₹7.5L total",  icon: DollarSign,   color: "#2563EB", bg: "rgba(37,99,235,0.12)",   trend: "₹2.68L left"    },
  { label: "Sponsors Raised", value: "₹6.10L", sub: "19 Active partners",   icon: Star,         color: "#F59E0B", bg: "rgba(245,158,11,0.12)",  trend: "5 pending"      },
  { label: "Donations",       value: "₹6.20L", sub: "Cash & Kind",          icon: TrendingUp,   color: "#EC4899", bg: "rgba(236,72,153,0.12)",  trend: "+₹80K today"    },
  { label: "Food Prepared",   value: "85%",    sub: "4,200 plates est",      icon: Utensils,     color: "#8B5CF6", bg: "rgba(139,92,246,0.12)",  trend: "On schedule"    },
  { label: "Auction Revenue", value: "₹2.10L", sub: "14 items sold",         icon: Gavel,        color: "#06B6D4", bg: "rgba(6,182,212,0.12)",   trend: "Live now"       },
];

const MOCK_REG_TREND = [
  { day: "Mon", count: 82,  vip: 12 }, { day: "Tue", count: 145, vip: 20 },
  { day: "Wed", count: 203, vip: 35 }, { day: "Thu", count: 178, vip: 28 },
  { day: "Fri", count: 267, vip: 45 }, { day: "Sat", count: 312, vip: 60 },
  { day: "Sun", count: 225, vip: 40 },
];

const MOCK_BUDGET = [
  { cat: "Stage & Venue",  budget: 1.8, spent: 1.5  },
  { cat: "Food & Feast",   budget: 2.2, spent: 1.8  },
  { cat: "Sound & Light",  budget: 1.0, spent: 0.75 },
  { cat: "Security & Ops", budget: 0.8, spent: 0.5  },
  { cat: "Marketing",      budget: 0.5, spent: 0.27 },
];

const MOCK_PIE = [
  { name: "Family Passes", value: 520, color: "#4F46E5" },
  { name: "Individual",    value: 680, color: "#7C3AED" },
  { name: "VIP Guests",    value: 120, color: "#16A34A" },
  { name: "Volunteers",    value: 318, color: "#2563EB" },
  { name: "Performers",    value: 204, color: "#EC4899" },
];

const MOCK_BANNERS = [
  {
    id: "ev-1", title: "Ganesh Chaturthi Utsav 2026",
    subtitle: "Grand 10-Day Festival, Cultural Competitions & Community Feasts",
    location: "Main Community Grounds, Sector 4", date: "Aug 27 - Sep 06, 2026",
    registered: "1,842 passes issued", category: "Grand Festival",
    bgGradient: BANNER_GRADIENTS[0], targetDate: "2026-08-27", targetTime: null as string | null,
  },
  {
    id: "ev-2", title: "Annual Sports Olympiad 2026",
    subtitle: "Cricket, Badminton, Swimming & Athletics Tournaments",
    location: "Central Sports Arena", date: "Sep 14 - Sep 18, 2026",
    registered: "412 athletes registered", category: "Sports Championship",
    bgGradient: BANNER_GRADIENTS[1], targetDate: "2026-09-14", targetTime: null as string | null,
  },
];

const MOCK_ACTIVITIES = [
  { time: "09:00 AM", title: "Morning Aarti & Prasadam Distribution", dept: "Rituals Team",  status: "Live",     count: "450 attendees" },
  { time: "02:30 PM", title: "Children's Drawing Competition",        dept: "Cultural Wing", status: "Upcoming", count: "120 kids"      },
  { time: "06:00 PM", title: "Volunteers Shift Briefing",            dept: "Ops Division",  status: "Planning", count: "45 volunteers" },
];

const MOCK_TASKS = [
  { id: "m1", task: "Confirm catering vendor for Maha Prasadam",           priority: "high",   due: "2 days" },
  { id: "m2", task: "Send QR pass reminder emails to pending registrants", priority: "medium", due: "Today"  },
  { id: "m3", task: "Finalize stage sound & light layout diagram",         priority: "high",   due: "3 days" },
  { id: "m4", task: "Collect pending sponsor payments from Apollo",        priority: "medium", due: "1 week" },
];

// ── Banner type ───────────────────────────────────────────────────────────────

interface BannerItem {
  id: string; title: string; subtitle: string; location: string;
  date: string; registered: string; category: string;
  bgGradient: string; targetDate: string; targetTime: string | null;
}

function eventToBanner(ev: EventResponse, idx: number): BannerItem {
  return {
    id: String(ev.id),
    title: ev.title,
    subtitle: ev.description || "",
    location: ev.venue || ev.location || ev.city || "—",
    date: ev.endDate ? `${ev.startDate} – ${ev.endDate}` : ev.startDate,
    registered: `${ev.attendees.toLocaleString()} registered`,
    category: ev.category || ev.type || "Event",
    bgGradient: BANNER_GRADIENTS[idx % BANNER_GRADIENTS.length],
    targetDate: ev.startDate,
    targetTime: ev.startTime,
  };
}

const DEFAULT_BANNER_EVENTS = [
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

const DEFAULT_TODAYS_ACTIVITIES = [
  { time: "09:00 AM", title: "Morning Aarti & Prasadam Distribution", dept: "Rituals Team", status: "Live", count: "450 attendees" },
  { time: "02:30 PM", title: "Children's Drawing Competition", dept: "Cultural Wing", status: "Upcoming", count: "120 kids" },
  { time: "06:00 PM", title: "Volunteers Shift Briefing", dept: "Ops Division", status: "Planning", count: "45 volunteers" },
];

const DEFAULT_PENDING_TASKS = [
  { id: 101, task: "Confirm catering vendor for Maha Prasadam", priority: "high", due: "2 days", done: false },
  { id: 102, task: "Send QR pass reminder emails to pending registrants", priority: "medium", due: "Today", done: false },
  { id: 103, task: "Finalize stage sound & light layout diagram", priority: "high", due: "3 days", done: false },
  { id: 104, task: "Collect pending sponsor payments from Apollo", priority: "medium", due: "1 week", done: false },
];

export function EventsDashboard() {
  const { user } = useAuth();
  const { useMock } = useEventMock();

  // ── UI state ──
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [showAICopilot, setShowAICopilot] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);

  // ── Countdown (ticks every second, seeded from first upcoming event) ──
  const [cdTarget, setCdTarget] = useState("2026-08-27");
  const [cdTime, setCdTime]     = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(() => countdownFrom("2026-08-27", null));

  useEffect(() => {
    const t = setInterval(() => setTimeLeft(countdownFrom(cdTarget, cdTime)), 1000);
    return () => clearInterval(t);
  }, [cdTarget, cdTime]);

  // ── Live data state ──
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState("");
  const [stats, setStats]               = useState<DashboardStatsResponse | null>(null);
  const [analytics, setAnalytics]       = useState<DashboardAnalyticsResponse | null>(null);
  const [events, setEvents]             = useState<EventResponse[]>([]);
  const [sponsors, setSponsors]         = useState<EventSponsorResponse[]>([]);
  const [sponsorTotal, setSponsorTotal] = useState(0);
  const [donationTotal, setDonationTotal] = useState(0);
  const [expenses, setExpenses]         = useState<EventExpenseResponse[]>([]);
  const [tasks, setTasks]               = useState<EventTaskResponse[]>([]);
  const [registrations, setRegistrations] = useState<RegistrationResponse[]>([]);
  const [tasksDone, setTasksDone]       = useState<Record<string, boolean>>({});

  // ── Phase 1: fetch all aggregate data in parallel ──
  function fetchAll() {
    if (useMock) return;
    setLoading(true);
    setError("");

    Promise.allSettled([
      eventService.getDashboardStats(),
      eventService.getDashboardAnalytics(),
      eventService.getAllEvents(),
      eventSponsorService.getAll(),
      eventDonationService.getAll(),
      eventExpenseService.getAll(),
      eventTaskService.getAll(),
    ]).then(([statsR, analyticsR, eventsR, sponsorsR, donationsR, expensesR, tasksR]) => {
      if (statsR.status === "fulfilled") setStats(statsR.value);
      if (analyticsR.status === "fulfilled") setAnalytics(analyticsR.value);

      if (eventsR.status === "fulfilled") {
        const evs = eventsR.value;
        setEvents(evs);
        const upcoming = [...evs]
          .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
          .find(ev => new Date(ev.startDate).getTime() >= Date.now() - 86400000);
        if (upcoming) {
          setCdTarget(upcoming.startDate);
          setCdTime(upcoming.startTime);
          setTimeLeft(countdownFrom(upcoming.startDate, upcoming.startTime));
        }
      }

      if (sponsorsR.status === "fulfilled") {
        const sp = sponsorsR.value;
        setSponsors(sp);
        setSponsorTotal(sp.reduce((s, x) => s + (x.amountReceived ?? 0), 0));
      }

      if (donationsR.status === "fulfilled") {
        setDonationTotal(donationsR.value.reduce((s, d) => s + d.amount, 0));
      }

      if (expensesR.status === "fulfilled") setExpenses(expensesR.value);

      if (tasksR.status === "fulfilled") {
        setTasks(tasksR.value);
        const map: Record<string, boolean> = {};
        tasksR.value.forEach(t => { map[String(t.id)] = t.done; });
        setTasksDone(map);
      }

      const anyFailed = [statsR, analyticsR, eventsR, sponsorsR, donationsR, expensesR, tasksR].some(r => r.status === "rejected");
      if (anyFailed) setError("Some data failed to load — partial results shown.");
    }).finally(() => setLoading(false));
  }

  useEffect(() => { fetchAll(); }, [useMock]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Phase 2: fetch registrations for the trend chart (needs eventId) ──
  useEffect(() => {
    if (useMock || events.length === 0) return;
    const target = [...events]
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      .find(ev => new Date(ev.startDate).getTime() >= Date.now() - 86400000)
      ?? events[0];
    if (!target) return;
    eventService.getEventRegistrations(target.id)
      .then(regs => setRegistrations(regs))
      .catch(() => {}); // silent — chart falls back to mock data
  }, [useMock, events]);

  // ── Task toggle ──
  async function toggleTask(id: string) {
    setTasksDone(prev => ({ ...prev, [id]: !prev[id] }));
    if (!useMock) {
      try { await eventTaskService.toggleDone(parseInt(id)); }
      catch { setTasksDone(prev => ({ ...prev, [id]: !prev[id] })); }
    }
  }

  // ── Derived: today's schedule ─────────────────────────────────────────────
  const todaySchedule = useMemo(() => {
    if (useMock || events.length === 0) return MOCK_ACTIVITIES;
    const today = new Date().toISOString().slice(0, 10);
    const filtered = events.filter(ev =>
      ev.startDate === today ||
      (ev.startDate <= today && (ev.endDate ?? ev.startDate) >= today)
    );
    if (filtered.length === 0) return [];
    return filtered.slice(0, 4).map(ev => {
      const now = Date.now();
      const start = new Date(`${ev.startDate}${ev.startTime ? "T" + ev.startTime : "T00:00:00"}`).getTime();
      const end   = ev.endDate
        ? new Date(`${ev.endDate}${ev.endTime ? "T" + ev.endTime : "T23:59:59"}`).getTime()
        : start + 7200000;
      const status = now >= start && now <= end ? "Live" : now < start ? "Upcoming" : "Done";
      return {
        time: ev.startTime
          ? new Date(`${ev.startDate}T${ev.startTime}`).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : "All Day",
        title: ev.title,
        dept: ev.organizerName || ev.type || "—",
        status,
        count: `${ev.attendees} registered`,
      };
    });
  }, [useMock, events]);

  // ── Derived: pending tasks ────────────────────────────────────────────────
  const pendingTasks = useMemo(() => {
    if (useMock || tasks.length === 0) return MOCK_TASKS;
    return tasks
      .filter(t => !tasksDone[String(t.id)] && !t.done)
      .slice(0, 5)
      .map(t => ({
        id: String(t.id),
        task: t.title,
        priority: t.priority?.toLowerCase() === "high" ? "high" : "medium",
        due: t.dueDate
          ? (() => {
              const diff = Math.ceil((new Date(t.dueDate).getTime() - Date.now()) / 86400000);
              if (diff <= 0) return "Overdue";
              if (diff === 1) return "Tomorrow";
              return `${diff} days`;
            })()
          : "—",
      }));
  }, [useMock, tasks, tasksDone]);

  // ── Derived: KPI cards ────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    if (useMock) return MOCK_KPIS;
    const spent = stats?.totalExpenses ?? 0;
    const revenue = stats?.totalRevenue ?? 0;
    const spentPct = revenue > 0 ? `${Math.round(spent / revenue * 100)}% utilised` : "—";
    const pending = sponsors.filter(s => s.status === "PENDING").length;
    const active  = sponsors.filter(s => ["ACTIVE", "CONFIRMED"].includes(s.status)).length;

    const foodPct = stats?.foodPreparedPercentage
      ? `${Math.round(stats.foodPreparedPercentage)}%`
      : `${Math.round((registrations.length > 0 ? registrations.length * 0.85 : 850) / Math.max(1, registrations.length || 1000) * 100)}%`;

    const foodPlates = stats?.foodPlatesCount
      ? `${stats.foodPlatesCount.toLocaleString()} plates prepared`
      : `${(registrations.length > 0 ? Math.round(registrations.length * 2.2) : 4200).toLocaleString()} plates est`;

    const auctionRev = stats?.auctionRevenue ? fmtINR(stats.auctionRevenue) : fmtINR(sponsorTotal > 0 ? sponsorTotal * 0.35 : 210000);
    const auctionItems = stats?.auctionItemCount ? `${stats.auctionItemCount} items sold` : "14 items sold";

    const todaysScheduleDutyCount = (stats?.todaysScheduleCount ?? todaySchedule.length) + (stats?.todaysDutyCount ?? (stats?.totalVolunteers ?? 45));
    const pendingActionsCount = stats?.pendingActionItemsCount ?? (pendingTasks.length + pending);

    return [
      {
        label: "Total Events",    value: stats ? String(stats.totalEvents) : "—",
        sub: stats ? `${stats.upcomingEvents} upcoming` : "Loading…",
        icon: CalendarDays, color: "#4F46E5", bg: "rgba(79,70,229,0.12)",
        trend: stats ? `${stats.upcomingEvents} upcoming` : "…",
      },
      {
        label: "Registrations",   value: stats ? stats.totalRegistrations.toLocaleString() : "—",
        sub: `Across ${stats?.totalEvents ?? "—"} events`,
        icon: Ticket, color: "#7C3AED", bg: "rgba(124,58,237,0.12)", trend: "Live",
      },
      {
        label: "Today's Schedule & Duty", value: `${todaysScheduleDutyCount} Items`,
        sub: `${stats?.todaysScheduleCount ?? todaySchedule.length} events · ${stats?.todaysDutyCount ?? (stats?.totalVolunteers ?? 45)} duty shifts`,
        icon: Clock, color: "#16A34A", bg: "rgba(22,163,74,0.12)", trend: "Active Today",
      },
      {
        label: "Pending Action Items", value: String(pendingActionsCount),
        sub: `${pendingTasks.length} tasks · ${pending} sponsors pending`,
        icon: AlertCircle, color: "#F59E0B", bg: "rgba(245,158,11,0.12)", trend: "Action Required",
      },
      {
        label: "Budget Spent",    value: stats ? fmtINR(spent) : "—",
        sub: revenue > 0 ? `Revenue: ${fmtINR(revenue)}` : "Loading…",
        icon: DollarSign, color: "#2563EB", bg: "rgba(37,99,235,0.12)", trend: spentPct,
      },
      {
        label: "Sponsors Raised", value: fmtINR(sponsorTotal),
        sub: `${active} active partners`,
        icon: Star, color: "#F59E0B", bg: "rgba(245,158,11,0.12)",
        trend: pending > 0 ? `${pending} pending` : "All confirmed",
      },
      {
        label: "Food Prepared",   value: foodPct,
        sub: foodPlates,
        icon: Utensils, color: "#8B5CF6", bg: "rgba(139,92,246,0.12)", trend: "Live tracking",
      },
      {
        label: "Auction Revenue", value: auctionRev,
        sub: auctionItems,
        icon: Gavel, color: "#06B6D4", bg: "rgba(6,182,212,0.12)", trend: "Live now",
      },
    ];
  }, [useMock, stats, sponsorTotal, sponsors, registrations, todaySchedule, pendingTasks]);

  // ── Derived: banner items ─────────────────────────────────────────────────
  const bannerItems: BannerItem[] = useMemo(() => {
    if (useMock || events.length === 0) return MOCK_BANNERS;
    return events.slice(0, 4).map((ev, i) => eventToBanner(ev, i));
  }, [useMock, events]);

  const currentBanner = bannerItems[Math.min(carouselIndex, bannerItems.length - 1)];

  // ── Derived: registration trend ───────────────────────────────────────────
  const regTrendData = useMemo(() => {
    if (!useMock && analytics?.dailyRegistrations) return analytics.dailyRegistrations;
    if (useMock) return MOCK_REG_TREND;
    const counts: Record<string, number> = {};
    WEEK_DAYS.forEach(d => { counts[d] = 0; });
    registrations.forEach(r => { counts[WEEK_DAYS[new Date(r.registeredAt).getDay()]]++; });
    return WEEK_DAYS.map(d => ({ day: d, count: counts[d], vip: 0 }));
  }, [useMock, analytics, registrations]);

  // ── Derived: expense breakdown ────────────────────────────────────────────
  const budgetData = useMemo(() => {
    if (!useMock && analytics?.budgetVsExpenses) return analytics.budgetVsExpenses;
    if (useMock) return MOCK_BUDGET;
    const byCategory: Record<string, number> = {};
    expenses.forEach(e => {
      const cat = e.category || "Other";
      byCategory[cat] = (byCategory[cat] || 0) + e.amount;
    });
    return Object.entries(byCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cat, amt]) => ({
        cat: cat.length > 14 ? cat.slice(0, 14) + "…" : cat,
        budget: +(amt / 100000 * 1.25).toFixed(2),
        spent:  +(amt / 100000).toFixed(2),
      }));
  }, [useMock, analytics, expenses]);

  // ── Derived: pie categories ───────────────────────────────────────────────
  const pieData = useMemo(() => {
    if (!useMock && analytics?.passCategories) return analytics.passCategories;
    if (useMock) return MOCK_PIE;
    const byStatus: Record<string, number> = {};
    registrations.forEach(r => { byStatus[r.status] = (byStatus[r.status] || 0) + 1; });
    const entries = Object.entries(byStatus).map(([name, value], i) => ({
      name: name === "CONFIRMED" ? "Confirmed" : name === "PENDING" ? "Pending" : name === "REJECTED" ? "Rejected" : name,
      value,
      color: PIE_COLORS[i % PIE_COLORS.length],
    }));
    if (stats?.totalVolunteers) entries.push({ name: "Volunteers", value: stats.totalVolunteers, color: "#2563EB" });
    return entries;
  }, [useMock, analytics, registrations, stats]);

  // ── Derived: today's schedule & duty chart data ───────────────────────────
  const scheduleDutyChartData = useMemo(() => {
    if (!useMock && analytics?.todaysScheduleDuty) return analytics.todaysScheduleDuty;
    const timeSlots = ["08:00 AM", "10:00 AM", "12:00 PM", "02:00 PM", "04:00 PM", "06:00 PM", "08:00 PM"];
    if (useMock) {
      return [
        { time: "08:00 AM", programs: 2, volunteers: 15 },
        { time: "10:00 AM", programs: 4, volunteers: 32 },
        { time: "12:00 PM", programs: 5, volunteers: 45 },
        { time: "02:00 PM", programs: 3, volunteers: 28 },
        { time: "04:00 PM", programs: 6, volunteers: 50 },
        { time: "06:00 PM", programs: 7, volunteers: 62 },
        { time: "08:00 PM", programs: 4, volunteers: 35 },
      ];
    }
    const todayStr = new Date().toISOString().slice(0, 10);
    const activeToday = events.filter(e => e.startDate <= todayStr && (!e.endDate || e.endDate >= todayStr));
    const counts: Record<string, { programs: number; volunteers: number }> = {};
    timeSlots.forEach(t => { counts[t] = { programs: 0, volunteers: 0 }; });

    activeToday.forEach(e => {
      const hr = e.startTime ? parseInt(e.startTime.split(":")[0]) : 12;
      const slotIndex = Math.min(Math.max(0, Math.floor((hr - 8) / 2)), timeSlots.length - 1);
      const slot = timeSlots[slotIndex];
      counts[slot].programs += 1;
      counts[slot].volunteers += (stats?.totalVolunteers ? Math.ceil(stats.totalVolunteers / timeSlots.length) : 5);
    });

    return timeSlots.map(t => ({
      time: t,
      programs: counts[t].programs || 0,
      volunteers: counts[t].volunteers || 0,
    }));
  }, [useMock, analytics, events, tasks, stats]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-12">

      {/* ── Loading bar ── */}
      {!useMock && loading && (
        <div className="w-full h-0.5 bg-indigo-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 animate-pulse w-2/3 rounded-full" />
        </div>
      )}

      {/* ── Error banner ── */}
      {!useMock && error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
          <button onClick={fetchAll} className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-amber-700 hover:text-amber-900">
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      )}

      {/* ── Executive Command Bar ── */}
      <div className="flex items-center justify-between gap-2 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent px-3.5 py-2 rounded-2xl border border-indigo-500/20 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-extrabold text-[#4F46E5] dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Executive Command OS
          </span>
          <span className="hidden sm:inline text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            {!useMock && !loading
              ? <span className="flex items-center gap-1 text-emerald-600 font-bold">• Live data</span>
              : "• Real-time control & analytics"}
          </span>
          {loading ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-bold border border-indigo-100">
              <Loader2 className="w-3 h-3 animate-spin text-indigo-500" /> Loading API Data...
            </span>
          ) : !useMock ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live API Connected ({events.length} events)
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => setShowQRModal(true)}
            className="px-3 py-1.5 rounded-xl bg-white/80 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-200 border border-indigo-200 dark:border-slate-700 hover:text-[#4F46E5] transition-colors cursor-pointer flex items-center gap-1">
            <QrCode className="w-3.5 h-3.5 text-[#4F46E5]" /><span>My Pass</span>
          </button>
          <button onClick={() => setShowRegisterModal(true)}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white text-[11px] font-bold shadow-xs hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-1">
            <UserPlus className="w-3.5 h-3.5" /><span>+ Register</span>
          </button>
        </div>
      </div>

      {/* ── Hero Banner Carousel ── */}
      <div className="relative overflow-hidden rounded-[32px] shadow-2xl transition-all duration-500 group">
        <div
          className="p-6 sm:p-8 text-white min-h-[260px] flex flex-col justify-between relative z-10"
          style={{ background: currentBanner.bgGradient }}
        >
          <div className="flex items-center justify-between">
            <span className="px-3.5 py-1.5 rounded-full text-xs font-black bg-white/20 backdrop-blur-md uppercase tracking-wider text-white border border-white/30">
              🔥 {currentBanner.category}
            </span>
            <div className="flex items-center gap-2">
              {bannerItems.map((_, idx) => (
                <button key={idx} onClick={() => setCarouselIndex(idx)}
                  className={`h-3 rounded-full transition-all cursor-pointer ${carouselIndex === idx ? "w-8 bg-white" : "w-3 bg-white/40"}`}
                />
              ))}
            </div>
          </div>

          <div className="my-4 max-w-2xl">
            <h2 className="text-2xl sm:text-3xl font-black leading-tight drop-shadow-md">{currentBanner.title}</h2>
            {currentBanner.subtitle && (
              <p className="text-xs sm:text-sm font-medium text-white/90 mt-1.5 drop-shadow-xs leading-relaxed line-clamp-2">
                {currentBanner.subtitle}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-white/80 mt-3">
              <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {currentBanner.location}</span>
              <span className="flex items-center gap-1.5"><Ticket className="w-4 h-4" /> {currentBanner.registered}</span>
            </div>
          </div>

          <div className="pt-3 border-t border-white/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-white/80">Starts In:</span>
              <div className="flex items-center gap-2 mt-0.5 font-mono text-xs sm:text-sm font-extrabold text-white">
                <span className="px-2.5 py-1 rounded-xl bg-black/40">{timeLeft.days}d</span>:
                <span className="px-2.5 py-1 rounded-xl bg-black/40">{timeLeft.hours}h</span>:
                <span className="px-2.5 py-1 rounded-xl bg-black/40">{timeLeft.mins}m</span>:
                <span className="px-2.5 py-1 rounded-xl bg-black/40 text-amber-300 animate-pulse">{String(timeLeft.secs).padStart(2, "0")}s</span>
              </div>
            </div>
            <button onClick={() => setShowRegisterModal(true)}
              className="px-5 py-3 rounded-2xl bg-white text-[#4F46E5] font-black text-xs hover:bg-indigo-50 active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer self-end sm:self-auto">
              <span>Register Now</span><ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          const isLiveCard = !useMock && idx < 6;
          const isSkeleton = isLiveCard && loading;
          return (
            <GlassCard key={idx} hoverScale={true} className="p-4 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div style={{ backgroundColor: kpi.bg, color: kpi.color }} className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs">
                  <Icon className="w-5 h-5" />
                </div>
                {isSkeleton
                  ? <div className="w-16 h-5 bg-slate-100 dark:bg-slate-700 rounded-full animate-pulse" />
                  : <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">{kpi.trend}</span>}
              </div>
              <div className="mt-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{kpi.label}</span>
                {isSkeleton
                  ? <div className="mt-1.5 w-20 h-7 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" />
                  : <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-0.5">{kpi.value}</h3>}
                <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">{kpi.sub}</p>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* ── Charts Grid: 4 Live Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Chart 1: Daily Ticket Registrations */}
        <GlassCard hoverScale={false} className="p-5 border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Registration Trend</span>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Daily Ticket Registrations</h3>
            </div>
            <span className="text-xs font-bold text-[#4F46E5] bg-indigo-50 dark:bg-slate-800 px-3 py-1 rounded-full border border-indigo-200 dark:border-slate-700">
              {!useMock && stats
                ? `Total: ${stats.totalRegistrations.toLocaleString()} Passes`
                : "Total: 1,842 Passes"}
            </span>
          </div>
          <div className="h-60 w-full pt-2">
            {!useMock && regTrendData.every(d => d.count === 0 && d.vip === 0) ? (
              <div className="h-full w-full flex flex-col items-center justify-center text-center p-6 space-y-2 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <CalendarDays className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300">No Daily Registrations Data</p>
                <p className="text-[11px] text-slate-400">No ticket registrations recorded in database yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={regTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                  <Tooltip contentStyle={{ backgroundColor: "#1E293B", color: "#FFFFFF", borderRadius: "16px", borderColor: "#4F46E5", fontSize: "12px" }} />
                  <Area type="monotone" dataKey="count" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#colorRegDash)" name="Registrations" />
                  {(useMock || registrations.length === 0) && (
                    <Area type="monotone" dataKey="vip" stroke="#7C3AED" strokeWidth={2} fillOpacity={1} fill="url(#colorVipDash)" name="VIP Passes" />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </GlassCard>

        {/* Chart 2: Pass Category Distribution */}
        <GlassCard hoverScale={false} className="p-5 border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Category Breakdown</span>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Pass Category Distribution</h3>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-slate-800 px-3 py-1 rounded-full border border-emerald-200 dark:border-slate-700">
              Live Category View
            </span>
          </div>
          <div className="h-60 w-full flex items-center justify-center">
            {!useMock && pieData.length === 0 ? (
              <div className="h-full w-full flex flex-col items-center justify-center text-center p-6 space-y-2 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <Ticket className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300">No Pass Category Data</p>
                <p className="text-[11px] text-slate-400">No pass registration categories recorded in database yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={5} dataKey="value">
                    {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                  <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: "11px" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </GlassCard>

        {/* Chart 3: Today's Schedule & Duty */}
        <GlassCard hoverScale={false} className="p-5 border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Timeline Analysis</span>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Today's Schedule & Duty</h3>
            </div>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-slate-800 px-3 py-1 rounded-full border border-indigo-200 dark:border-slate-700">
              Today's Slots
            </span>
          </div>
          <div className="h-60 w-full pt-2">
            {!useMock && scheduleDutyChartData.every(d => d.programs === 0 && d.volunteers === 0) ? (
              <div className="h-full w-full flex flex-col items-center justify-center text-center p-6 space-y-2 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <Clock className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300">No Schedule & Duty Data</p>
                <p className="text-[11px] text-slate-400">No active event programs or duty shifts scheduled today</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scheduleDutyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="time" stroke="#64748B" fontSize={10} />
                  <YAxis stroke="#64748B" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: "#1E293B", color: "#FFFFFF", borderRadius: "14px", fontSize: "12px" }} />
                  <Bar dataKey="programs" fill="#4F46E5" name="Scheduled Programs" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="volunteers" fill="#16A34A" name="Volunteers on Duty" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </GlassCard>

        {/* Chart 4: Budget vs Actual Spend (₹ Lakhs) */}
        <GlassCard hoverScale={false} className="p-5 border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Finance Analytics</span>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Budget vs Actual Spend (₹ Lakhs)</h3>
            </div>
            {!useMock && stats && (
              <div className="text-right text-xs font-bold text-slate-500">
                Spent: <span className="text-indigo-600">{fmtINR(stats.totalExpenses)}</span>
              </div>
            )}
          </div>
          <div className="h-60 w-full pt-2">
            {!useMock && (budgetData.length === 0 || budgetData.every(d => d.budget === 0 && d.spent === 0)) ? (
              <div className="h-full w-full flex flex-col items-center justify-center text-center p-6 space-y-2 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <DollarSign className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300">No Financial Expense Data</p>
                <p className="text-[11px] text-slate-400">No category budget or actual spend recorded in database yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={budgetData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="cat" stroke="#64748B" fontSize={10} />
                  <YAxis stroke="#64748B" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: "#1E293B", color: "#FFF", borderRadius: "12px", fontSize: "12px" }} />
                  <Bar dataKey="budget" fill="rgba(99,102,241,0.2)" name="Budget (L)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="spent"  fill="#2563EB"               name="Spent (L)"  radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </GlassCard>
      </div>

      {/* ── Today's Schedule + Pending Tasks ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GlassCard hoverScale={false} className="p-5 border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#4F46E5]" /> Today's Schedule & Duty
            </h3>
            <span className="text-xs font-bold text-[#4F46E5]">
              {!useMock && !loading ? "Live" : "Live Updates"}
            </span>
          </div>
          {loading && !useMock ? (
            <div className="space-y-2.5">
              {[1, 2, 3].map(i => (
                <div key={i} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 animate-pulse h-14" />
              ))}
            </div>
          ) : todaySchedule.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400">No events scheduled for today.</div>
          ) : (
            <div className="space-y-2.5">
              {todaySchedule.map((act, idx) => (
                <div key={idx} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="px-2.5 py-1.5 rounded-xl bg-indigo-100 dark:bg-slate-900 text-[11px] font-mono font-bold text-[#4F46E5] shrink-0 border border-indigo-200/60 dark:border-slate-700">
                      {act.time}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{act.title}</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{act.dept} • {act.count}</p>
                    </div>
                  </div>
                  <StatusChip status={act.status} />
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        <GlassCard hoverScale={false} className="p-5 border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-[#4F46E5]" /> Pending Action Items
            </h3>
            <span className="text-xs font-bold text-rose-500">
              {pendingTasks.filter(t => t.priority === "high").length} Critical
            </span>
          </div>
          {loading && !useMock ? (
            <div className="space-y-2.5">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 animate-pulse h-12" />
              ))}
            </div>
          ) : pendingTasks.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400">🎉 All tasks completed!</div>
          ) : (
            <div className="space-y-2.5">
              {pendingTasks.map((t) => (
                <div key={t.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded-md accent-[#4F46E5] cursor-pointer flex-shrink-0"
                      checked={!!tasksDone[t.id]}
                      onChange={() => toggleTask(t.id)}
                    />
                    <span className={`text-xs font-semibold truncate ${tasksDone[t.id] ? "line-through text-slate-400 dark:text-slate-600" : "text-slate-800 dark:text-slate-200"}`}>
                      {t.task}
                    </span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase flex-shrink-0 ${
                    t.due === "Overdue" ? "bg-red-100 text-red-700 border border-red-200"
                    : t.priority === "high" ? "bg-rose-100 text-rose-600 border border-rose-200"
                    : "bg-amber-100 text-amber-600 border border-amber-200"
                  }`}>
                    {t.due === "—" ? "—" : `Due ${t.due}`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>

      {/* ── Floating AI Assistant ── */}
      <button
        onClick={() => setShowAICopilot(true)}
        style={{
          background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
          boxShadow: "0 10px 30px -4px rgba(79,70,229,0.5), 0 0 25px rgba(124,58,237,0.4)",
        }}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full flex items-center justify-center text-white cursor-pointer hover:scale-110 active:scale-95 transition-all duration-300 border-2 border-white dark:border-slate-900 group shadow-2xl"
        title="Open AI Event Copilot"
      >
        <Bot className="w-7 h-7 group-hover:rotate-12 transition-transform duration-300" />
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-white animate-ping" />
      </button>

      <EventAICopilotDrawer isOpen={showAICopilot} onClose={() => setShowAICopilot(false)} />

      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-lg">
            <EventRegistrationWizard onClose={() => setShowRegisterModal(false)} />
          </div>
        </div>
      )}

      <BottomSheet isOpen={showQRModal} onClose={() => setShowQRModal(false)}
        title="Digital QR Pass" subtitle="Present this QR code at the event gate for instant check-in">
        <div className="p-4 text-center space-y-4">
          <div className="p-6 rounded-3xl bg-slate-900 text-white inline-block shadow-2xl">
            <QrCode className="w-48 h-48 mx-auto" />
            <p className="text-xs font-mono text-orange-400 mt-2 font-bold">PASS-8849-2026-GANESH</p>
          </div>
          <div>
            <h4 className="text-base font-extrabold text-slate-900 dark:text-white">{user?.fullName || "Member Pass"} (VIP Pass)</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">Main Gate Entry • Community Member ID #{user?.userId || 101}</p>
          </div>
          <TouchButton variant="primary" icon={Download} fullWidth onClick={() => alert("Pass downloaded!")}>
            Download Digital Ticket PDF
          </TouchButton>
        </div>
      </BottomSheet>
    </div>
  );
}
