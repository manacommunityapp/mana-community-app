import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  CalendarDays, Users, Ticket, TrendingUp, IndianRupee,
  Utensils, Gavel, ClipboardCheck, Star, Heart,
  Clock, MapPin, AlertCircle, Loader2,
  Sparkles, QrCode, UserPlus,
  ChevronLeft, ChevronRight, Download, Bot, RefreshCw,
  Search, ChevronDown, ChevronUp, User,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { GlassCard, TouchButton, StatusChip, BottomSheet } from "./redesign/EventDesignSystem";
import { EventAICopilotDrawer } from "./redesign/EventAICopilotDrawer";
import { EventRegistrationWizard } from "./redesign/EventRegistrationWizard";
import { GatePassModal } from "./GatePassModal";
import { useEventMock } from "./EventMockToggle";
import { useAuth } from "../../../contexts/AuthContext";
import { useEscapeKey } from "../../../hooks/useEscapeKey";
import {
  eventService,
  type DashboardStatsResponse,
  type DashboardAnalyticsResponse,
  type PendingActionItemResponse,
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
  { label: "Total Events",            value: "24",     sub: "8 active festivals",  icon: CalendarDays, color: "#4F46E5", bg: "rgba(79,70,229,0.12)",   trend: "+3 this month",   to: "/events/schedule?tab=events" },
  { label: "Registrations",           value: "1,842",  sub: "↑ 14% vs last week",  icon: Ticket,       color: "#7C3AED", bg: "rgba(124,58,237,0.12)",  trend: "+204 this week",  to: "/events/registration" },
  { label: "Budget Spent",            value: "₹4.82L", sub: "64% of ₹7.5L total",  icon: IndianRupee,   color: "#2563EB", bg: "rgba(37,99,235,0.12)",   trend: "₹2.68L left",     to: "/events/operations?tab=finance" },
  { label: "Today's Schedule & Duty", value: "32 Items", sub: "12 programs · 318 duty shifts", icon: Clock, color: "#16A34A", bg: "rgba(22,163,74,0.12)", trend: "Active Today", to: "/events/schedule?tab=programs" },
  { label: "Pending Action Items",    value: "9",      sub: "4 tasks · 5 sponsors", icon: AlertCircle, color: "#F59E0B", bg: "rgba(245,158,11,0.12)",  trend: "Action Required", to: "/events/schedule?tab=planning" },
  { label: "Sponsors Raised",         value: "₹6.10L", sub: "19 Active partners",   icon: Star,         color: "#F59E0B", bg: "rgba(245,158,11,0.12)",  trend: "5 pending",       to: "/events/fundraising?tab=sponsors" },
  // { label: "Food Prepared",           value: "85%",    sub: "4,200 plates est",    icon: Utensils,     color: "#8B5CF6", bg: "rgba(139,92,246,0.12)",  trend: "On schedule",     to: "/events/operations?tab=food" },
  { label: "Auction Revenue",         value: "₹2.10L", sub: "14 items sold",       icon: Gavel,        color: "#06B6D4", bg: "rgba(6,182,212,0.12)",   trend: "Live now",        to: "/events/fundraising?tab=auction" },
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
    image: "https://images.unsplash.com/photo-1567157577867-05ccb1388e66?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "ev-2", title: "Annual Sports Olympiad 2026",
    subtitle: "Cricket, Badminton, Swimming & Athletics Tournaments",
    location: "Central Sports Arena", date: "Sep 14 - Sep 18, 2026",
    registered: "412 athletes registered", category: "Sports Championship",
    bgGradient: BANNER_GRADIENTS[1], targetDate: "2026-09-14", targetTime: null as string | null,
    image: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80",
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
  image?: string | null;
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
    image: ev.imageUrl || ev.coverImageUrl || ev.coverImage || null,
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
  const navigate = useNavigate();
  const { user } = useAuth();
  const { useMock } = useEventMock();

  // ── UI state ──
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [showAICopilot, setShowAICopilot] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);

  useEscapeKey(() => setShowRegisterModal(false), showRegisterModal);
  useEscapeKey(() => setShowQRModal(false), showQRModal);
  useEscapeKey(() => setShowAICopilot(false), showAICopilot);

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
  const [pendingActionItems, setPendingActionItems] = useState<PendingActionItemResponse[]>([]);
  const [registrations, setRegistrations] = useState<RegistrationResponse[]>([]);
  const [tasksDone, setTasksDone]       = useState<Record<string, boolean>>({});

  // ── Registered Users section state ──
  type RegCat = 'all' | 'event' | 'pooja' | 'cultural' | 'competition';
  type UnifiedReg = { id: string|number; regCode: string; category: RegCat; activityTitle: string; participantName: string; email?: string; phone?: string; extra?: string; devoteeCount: number; bookingFee: number; paymentStatus: string; status: string; eventDate?: string; eventTime?: string; venue?: string; createdAt: string; registeredAt?: string; passType?: string; };
  const MOCK_REGS: UnifiedReg[] = [
    { id:'e1', regCode:'EVT-5001', category:'event', activityTitle:'Ganesh Utsav 2026 – Main Event', participantName:'Rajesh Sharma', email:'rajesh@example.com', phone:'+91 98765 43210', devoteeCount:4, bookingFee:300, paymentStatus:'PAID', status:'CONFIRMED', eventDate:'2026-08-27', venue:'Community Hall', createdAt:'2026-08-10T10:00:00' },
    { id:'e2', regCode:'EVT-5002', category:'event', activityTitle:'Ganesh Utsav 2026 – Main Event', participantName:'Meera Deshmukh', email:'meera@example.com', phone:'+91 91234 56789', devoteeCount:2, bookingFee:300, paymentStatus:'PAID', status:'CONFIRMED', eventDate:'2026-08-27', venue:'Community Hall', createdAt:'2026-08-10T11:30:00' },
    { id:'e3', regCode:'EVT-5003', category:'event', activityTitle:'Day 2 – Special Program', participantName:'Amit Verma', email:'amit@example.com', phone:'+91 99887 76655', devoteeCount:1, bookingFee:100, paymentStatus:'PAID', status:'CONFIRMED', eventDate:'2026-08-28', venue:'Temple Grounds', createdAt:'2026-08-11T09:00:00' },
    { id:'e4', regCode:'EVT-5004', category:'event', activityTitle:'Day 2 – Special Program', participantName:'Sunita Patil', email:'sunita@example.com', phone:'+91 98100 22334', devoteeCount:3, bookingFee:200, paymentStatus:'PENDING', status:'PENDING', eventDate:'2026-08-28', venue:'Temple Grounds', createdAt:'2026-08-12T14:00:00' },
    { id:'p1', regCode:'POOJA-1001', category:'pooja', activityTitle:'Maha Ganapathi Abhishekam', participantName:'Ramesh Sharma', extra:'Gotram: Bharadwaj', devoteeCount:3, bookingFee:501, paymentStatus:'PAID', status:'CONFIRMED', eventDate:'2026-08-27', eventTime:'08:30 AM', venue:'Main Temple Mandap', createdAt:'2026-08-15T10:30:00' },
    { id:'p2', regCode:'POOJA-1002', category:'pooja', activityTitle:'Maha Ganapathi Abhishekam', participantName:'Lakshmi Devi', extra:'Gotram: Kashyap', devoteeCount:2, bookingFee:501, paymentStatus:'PAID', status:'CONFIRMED', eventDate:'2026-08-27', eventTime:'11:00 AM', venue:'Main Temple Mandap', createdAt:'2026-08-15T14:20:00' },
    { id:'p3', regCode:'POOJA-1003', category:'pooja', activityTitle:'Satyanarayan Puja', participantName:'Subramaniam K.', extra:'Gotram: Vasishta', devoteeCount:5, bookingFee:0, paymentStatus:'FREE', status:'CONFIRMED', eventDate:'2026-08-28', eventTime:'09:00 AM', venue:'Community Hall', createdAt:'2026-08-16T11:00:00' },
    { id:'p4', regCode:'POOJA-1004', category:'pooja', activityTitle:'Navagraha Homam', participantName:'Annapurna Devi', extra:'Gotram: Bharadwaj', devoteeCount:2, bookingFee:1100, paymentStatus:'PAID', status:'CONFIRMED', eventDate:'2026-08-27', eventTime:'06:00 AM', venue:'Homa Kund Area', createdAt:'2026-08-17T08:30:00' },
    { id:'c1', regCode:'CULT-3001', category:'cultural', activityTitle:'Bharatanatyam – Pushpanjali', participantName:'Meenakshi Sundaram', extra:'Solo · Youth (16-25)', devoteeCount:1, bookingFee:0, paymentStatus:'FREE', status:'CONFIRMED', eventDate:'2026-08-27', eventTime:'10:00 AM', venue:'Main Stage', createdAt:'2026-08-14T10:00:00' },
    { id:'c2', regCode:'CULT-3002', category:'cultural', activityTitle:'Carnatic Vocal Ensemble', participantName:'Ramakrishnan V.', extra:'Ensemble · Open', devoteeCount:4, bookingFee:0, paymentStatus:'FREE', status:'CONFIRMED', eventDate:'2026-08-27', eventTime:'11:00 AM', venue:'Main Stage', createdAt:'2026-08-14T12:00:00' },
    { id:'c3', regCode:'CULT-3003', category:'cultural', activityTitle:'Bhajan Sandhya', participantName:'Annapurna Group', extra:'Group · Open', devoteeCount:8, bookingFee:0, paymentStatus:'FREE', status:'CONFIRMED', eventDate:'2026-08-28', eventTime:'06:00 PM', venue:'Temple Mandap', createdAt:'2026-08-16T15:00:00' },
    { id:'comp1', regCode:'COMP-4001', category:'competition', activityTitle:'Drawing Competition – Kids', participantName:'Aarav Sharma', extra:'Kids · Drawing', devoteeCount:1, bookingFee:50, paymentStatus:'PAID', status:'CONFIRMED', eventDate:'2026-08-28', eventTime:'10:00 AM', venue:'Hall – Room A', createdAt:'2026-08-14T09:00:00' },
    { id:'comp2', regCode:'COMP-4002', category:'competition', activityTitle:'Elocution – Junior', participantName:'Nidhi Kulkarni', extra:'Junior · Elocution', devoteeCount:1, bookingFee:50, paymentStatus:'PAID', status:'CONFIRMED', eventDate:'2026-08-28', eventTime:'11:30 AM', venue:'Hall – Room B', createdAt:'2026-08-15T11:00:00' },
    { id:'comp3', regCode:'COMP-4003', category:'competition', activityTitle:'Classical Singing – Open', participantName:'Keertana S.', extra:'Open · Singing', devoteeCount:1, bookingFee:100, paymentStatus:'PAID', status:'CONFIRMED', eventDate:'2026-08-29', eventTime:'09:00 AM', venue:'Auditorium', createdAt:'2026-08-16T13:00:00' },
    { id:'comp4', regCode:'COMP-4004', category:'competition', activityTitle:'Quiz – Youth', participantName:'Arjun Verma', extra:'Youth · Quiz (Team)', devoteeCount:2, bookingFee:80, paymentStatus:'PAID', status:'CONFIRMED', eventDate:'2026-08-29', eventTime:'02:00 PM', venue:'Hall – Room A', createdAt:'2026-08-17T09:30:00' },
  ];
  const [regCat, setRegCat] = useState<RegCat>('all');
  const [regSearch, setRegSearch] = useState('');
  const [allUnifiedRegs, setAllUnifiedRegs] = useState<UnifiedReg[]>([]);
  const [loadingRegs, setLoadingRegs] = useState(false);
  const [expandedActivity, setExpandedActivity] = useState<string|null>(null);

  const fetchLiveRegistrations = () => {
    if (useMock) {
      setAllUnifiedRegs(MOCK_REGS.filter(r => String(r.status || '').toUpperCase() !== 'CANCELLED'));
      return;
    }
    setLoadingRegs(true);
    Promise.all([
      eventService.getAllRegistrations().catch(() => []),
      eventService.getAllEvents().catch(() => [])
    ])
      .then(([regs, evts]: [any[], any[]]) => {
        // Collect cancelled event IDs and normalized titles
        const cancelledEventIds = new Set<number>();
        const cancelledEventTitles = new Set<string>();

        if (Array.isArray(evts)) {
          evts.forEach(ev => {
            const evStatus = String(ev.status || '').toUpperCase();
            if (evStatus === 'CANCELLED') {
              if (ev.id != null) cancelledEventIds.add(Number(ev.id));
              if (ev.title) cancelledEventTitles.add(ev.title.trim().toLowerCase());
            }
          });
        }

        const validRegs = (Array.isArray(regs) ? regs : []).filter((r: any) => {
          // Exclude cancelled or rejected registrations
          const regStatus = String(r.status || '').toUpperCase();
          if (regStatus === 'CANCELLED' || regStatus === 'REJECTED') return false;

          // Exclude if registration's eventStatus indicates cancellation
          const regEvtStatus = String(r.eventStatus || '').toUpperCase();
          if (regEvtStatus === 'CANCELLED') return false;

          // Exclude if associated event is cancelled
          if (r.eventId != null && cancelledEventIds.has(Number(r.eventId))) return false;
          const actTitle = String(r.activityTitle || r.eventTitle || r.eventName || '').trim().toLowerCase();
          if (actTitle && cancelledEventTitles.has(actTitle)) return false;

          return true;
        });

        setAllUnifiedRegs(validRegs.map((r: any) => {
          let attendeeCount = Number(r.devoteeCount ?? r.membersCount ?? 0);
          if (r.membersJson) {
            try {
              const parsed = JSON.parse(r.membersJson);
              if (Array.isArray(parsed) && parsed.length > attendeeCount) attendeeCount = parsed.length;
            } catch {}
          }
          if (r.attendingDevotees) {
            try {
              const parsed = JSON.parse(r.attendingDevotees);
              if (Array.isArray(parsed) && parsed.length > attendeeCount) attendeeCount = parsed.length;
              else if (typeof r.attendingDevotees === 'string') {
                const parts = r.attendingDevotees.split(',').map((s: string) => s.trim()).filter(Boolean);
                if (parts.length > attendeeCount) attendeeCount = parts.length;
              }
            } catch {
              const parts = String(r.attendingDevotees).split(',').map((s: string) => s.trim()).filter(Boolean);
              if (parts.length > attendeeCount) attendeeCount = parts.length;
            }
          }
          if (!attendeeCount) attendeeCount = 1;

          return {
            id: r.id,
            regCode: r.regCode || `REG-${r.id}`,
            category: (r.category === 'Pooja' ? 'pooja' : r.category === 'Cultural' ? 'cultural' : r.category === 'Competition' ? 'competition' : 'event') as RegCat,
            activityTitle: r.activityTitle || r.eventTitle || 'Event',
            participantName: r.participantName || r.userName || 'N/A',
            email: r.userEmail || r.email,
            phone: r.phone,
            extra: r.gotram ? `Gotram: ${r.gotram}` : r.ageGroup,
            devoteeCount: attendeeCount,
            bookingFee: r.bookingFee ?? 0,
            paymentStatus: r.paymentStatus || 'N/A',
            status: r.status || 'CONFIRMED',
            eventDate: r.eventDate,
            eventTime: r.eventTime,
            venue: r.venue,
            createdAt: r.createdAt || new Date().toISOString(),
          };
        }));
      })
      .catch(() => {})
      .finally(() => setLoadingRegs(false));
  };

  useEffect(() => {
    fetchLiveRegistrations();
  }, [useMock]);

  const filteredUnifiedRegs = allUnifiedRegs.filter(r => {
    const matchCat = regCat === 'all' || r.category === regCat;
    const term = regSearch.toLowerCase();
    return matchCat && (!term || r.participantName.toLowerCase().includes(term) || r.regCode.toLowerCase().includes(term) || r.activityTitle.toLowerCase().includes(term));
  });

  const groupedRegs = filteredUnifiedRegs.reduce<Record<string, UnifiedReg[]>>((acc, r) => {
    const key = `${r.category}::${r.activityTitle}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

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
      eventService.getPendingActionItems(),
    ]).then(([statsR, analyticsR, eventsR, sponsorsR, donationsR, expensesR, tasksR, pendingActionsR]) => {
      if (statsR.status === "fulfilled") setStats(statsR.value);
      if (analyticsR.status === "fulfilled") setAnalytics(analyticsR.value);

      if (eventsR.status === "fulfilled") {
        const evs = eventsR.value;
        setEvents(evs);
        const upcoming = [...evs]
          .filter(ev => String(ev.status || '').toUpperCase() !== "CANCELLED")
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

      if (pendingActionsR.status === "fulfilled" && pendingActionsR.value && pendingActionsR.value.length > 0) {
        setPendingActionItems(pendingActionsR.value);
      }

      const anyFailed = [statsR, analyticsR, eventsR, sponsorsR, donationsR, expensesR, tasksR, pendingActionsR].some(r => r.status === "rejected");
      if (anyFailed) setError("Some data failed to load — partial results shown.");
    }).finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchAll();

    const handleRefresh = () => {
      fetchAll();
      fetchLiveRegistrations();
    };

    window.addEventListener("mana_event_created", handleRefresh);
    window.addEventListener("mana_event_updated", handleRefresh);
    window.addEventListener("mana_activities_updated", handleRefresh);
    window.addEventListener("mana_schedule_updated", handleRefresh);
    window.addEventListener("mana_dashboard_updated", handleRefresh);
    window.addEventListener("mana_registrations_updated", handleRefresh);

    return () => {
      window.removeEventListener("mana_event_created", handleRefresh);
      window.removeEventListener("mana_event_updated", handleRefresh);
      window.removeEventListener("mana_activities_updated", handleRefresh);
      window.removeEventListener("mana_schedule_updated", handleRefresh);
      window.removeEventListener("mana_dashboard_updated", handleRefresh);
      window.removeEventListener("mana_registrations_updated", handleRefresh);
    };
  }, [useMock]);

  // ── Phase 2: fetch registrations for the trend chart (needs eventId) ──
  useEffect(() => {
    if (useMock || events.length === 0) return;
    const activeEvents = events.filter(e => String(e.status || '').toUpperCase() !== "CANCELLED");
    if (activeEvents.length === 0) return;
    const target = [...activeEvents]
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      .find(ev => new Date(ev.startDate).getTime() >= Date.now() - 86400000)
      ?? activeEvents[0];
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
    if (useMock) return MOCK_ACTIVITIES;
    const today = new Date().toISOString().slice(0, 10);
    const filtered = events
      .filter(ev => String(ev.status || '').toUpperCase() !== "CANCELLED")
      .filter(ev =>
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
    if (useMock) return MOCK_TASKS;
    if (pendingActionItems.length > 0) {
      return pendingActionItems.map((item: any) => ({
        id: item.id,
        task: item.task,
        priority: item.priority || "medium",
        due: item.due || "—",
        done: tasksDone[item.id] || item.done,
      }));
    }
    if (tasks.length > 0) {
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
          done: tasksDone[String(t.id)] || t.done,
        }));
    }
    return [];
  }, [useMock, pendingActionItems, tasks, tasksDone]);

  const liveDevoteeCount = useMemo(() => {
    return allUnifiedRegs.reduce((sum, r) => sum + (r.devoteeCount || 1), 0);
  }, [allUnifiedRegs]);

  const liveRegCount = useMemo(() => {
    return Math.max(
      stats?.totalRegistrations ?? 0,
      allUnifiedRegs.length,
      liveDevoteeCount,
      registrations.length
    );
  }, [stats?.totalRegistrations, allUnifiedRegs.length, liveDevoteeCount, registrations.length]);

  // ── Derived: KPI cards ────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    if (useMock) return MOCK_KPIS;
    const spent   = stats?.totalExpenses ?? 0;
    const revenue = stats?.totalRevenue  ?? 0;
    // Use backend-computed counts (accurate today-specific) with frontend list as fallback
    const livePendingSponsor = stats?.pendingSponsorCount ?? sponsors.filter(s => s.status === "PENDING").length;
    const liveActiveSponsor  = stats?.activeSponsorCount  ?? sponsors.filter(s => ["ACTIVE","CONFIRMED"].includes(s.status)).length;
    const liveSponsorTotal   = stats?.sponsorTotal   ?? sponsorTotal;
    const liveDonationTotal  = stats?.donationTotal  ?? donationTotal;
    const spentPct = revenue > 0 ? `${Math.round(spent / revenue * 100)}% utilised` : "—";
    const hasEvents = (events && events.length > 0) || (stats && stats.totalEvents > 0);

    const foodPct    = stats?.foodPreparedPercentage != null && stats.foodPreparedPercentage > 0
      ? `${Math.round(stats.foodPreparedPercentage)}%`
      : "—";
    const foodPlates = stats?.foodPlatesCount != null && stats.foodPlatesCount > 0
      ? `${stats.foodPlatesCount.toLocaleString()} plates`
      : "No data yet";
    const foodTrend = stats?.foodPlatesCount ? "Live tracking" : "No active menu";

    const auctionRev   = fmtINR(stats?.auctionRevenue ?? 0);
    const auctionItems = `${stats?.auctionItemCount ?? 0} items sold`;

    // Today's schedule & duty: exact counts from backend (events active today)
    const todayCount          = stats?.todaysScheduleCount ?? 0;
    const dutyCount           = stats?.todaysDutyCount ?? 0;
    const pendingActionsCount = stats?.pendingActionItemsCount ?? (pendingTasks.length + livePendingSponsor);

    const totalEventsCount = stats?.totalEvents ?? events.length;

    return [
      {
        label: "Total Events",    value: totalEventsCount > 0 ? String(totalEventsCount) : (stats ? String(stats.totalEvents) : "0"),
        sub: stats ? `${stats.upcomingEvents} upcoming` : `${events.filter(e => e.status !== "CANCELLED").length} upcoming`,
        icon: CalendarDays, color: "#4F46E5", bg: "rgba(79,70,229,0.12)",
        trend: stats ? `${stats.upcomingEvents} upcoming` : "0 upcoming",
        to: "/events/schedule?tab=events",
      },
      {
        label: "Registrations",   value: liveRegCount > 0 ? liveRegCount.toLocaleString() : (stats ? stats.totalRegistrations.toLocaleString() : "0"),
        sub: `Across ${totalEventsCount} ${totalEventsCount === 1 ? "event" : "events"}`,
        icon: Ticket, color: "#7C3AED", bg: "rgba(124,58,237,0.12)",
        trend: hasEvents ? "Live" : "Inactive",
        to: "/events/registration",
      },
      {
        label: "Budget Spent",    value: fmtINR(spent),
        sub: revenue > 0 ? `Revenue: ${fmtINR(revenue)}` : "Revenue: ₹0",
        icon: IndianRupee, color: "#2563EB", bg: "rgba(37,99,235,0.12)", trend: spentPct,
        to: "/events/operations?tab=finance",
      },
      {
        label: "Today's Schedule & Duty",
        value: `${todayCount + dutyCount} Items`,
        sub: `${todayCount} events today · ${dutyCount} on duty`,
        icon: Clock, color: "#16A34A", bg: "rgba(22,163,74,0.12)",
        trend: todayCount > 0 ? `${todayCount} active` : "No events today",
        to: "/events/schedule?tab=programs",
      },
      {
        label: "Pending Action Items", value: String(pendingActionsCount),
        sub: `${pendingTasks.length} tasks · ${livePendingSponsor} sponsors pending`,
        icon: AlertCircle, color: "#F59E0B", bg: "rgba(245,158,11,0.12)",
        trend: pendingActionsCount > 0 ? "Action Required" : "All Clear",
        to: "/events/schedule?tab=planning",
      },
      {
        label: "Sponsors Raised", value: fmtINR(liveSponsorTotal),
        sub: `${liveActiveSponsor} active · ${livePendingSponsor} pending`,
        icon: Star, color: "#F59E0B", bg: "rgba(245,158,11,0.12)",
        trend: livePendingSponsor > 0 ? `${livePendingSponsor} need review` : "All confirmed",
        to: "/events/fundraising?tab=sponsors",
      },
      {
        label: "Donations Raised", value: fmtINR(liveDonationTotal),
        sub: "Live community contributions",
        icon: Heart, color: "#EC4899", bg: "rgba(236,72,153,0.12)",
        trend: liveDonationTotal > 0 ? "Active" : "No donations yet",
        to: "/events/fundraising?tab=donations",
      },
      // {
      //   label: "Live Food Prepared", value: foodPlates,
      //   sub: foodPct !== "—" ? `${foodPct} target reached` : "Live tracking",
      //   icon: Utensils, color: "#8B5CF6", bg: "rgba(139,92,246,0.12)", trend: foodTrend,
      //   to: "/events/operations?tab=food",
      // },
      {
        label: "Auction Revenue", value: auctionRev,
        sub: auctionItems,
        icon: Gavel, color: "#06B6D4", bg: "rgba(6,182,212,0.12)",
        trend: (stats?.auctionItemCount ?? 0) > 0 ? "Bids active" : "No Active Auction",
        to: "/events/fundraising?tab=auction",
      },
    ];
  }, [useMock, stats, sponsorTotal, donationTotal, sponsors, registrations, allUnifiedRegs, todaySchedule, pendingTasks, events]);

  // ── Derived: banner items ─────────────────────────────────────────────────
  const bannerItems: BannerItem[] = useMemo(() => {
    if (useMock) return MOCK_BANNERS;
    const runningEvents = events.filter(e => String(e.status || '').toUpperCase() !== "CANCELLED");
    if (runningEvents.length > 0) {
      return runningEvents.slice(0, 4).map((ev, i) => eventToBanner(ev, i));
    }
    return [
      {
        id: "empty-db",
        title: "No Events Created Yet",
        subtitle: "Create your first community event in the Events module to display it here",
        location: "Community Center",
        date: "Upcoming",
        registered: "0 registered",
        category: "Community Event",
        bgGradient: BANNER_GRADIENTS[0],
        targetDate: new Date().toISOString().slice(0, 10),
        targetTime: null,
      }
    ];
  }, [useMock, events]);

  const currentBanner = bannerItems[Math.min(carouselIndex, bannerItems.length - 1)] || bannerItems[0];
  const [isBannerHovered, setIsBannerHovered] = useState(false);

  // Auto-move banner every 4.5s (pauses on hover)
  useEffect(() => {
    if (bannerItems.length <= 1 || isBannerHovered) return;
    const timer = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % bannerItems.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [bannerItems.length, isBannerHovered]);

  // Sync countdown target with active banner item
  useEffect(() => {
    if (currentBanner.targetDate) {
      setCdTarget(currentBanner.targetDate);
      setCdTime(currentBanner.targetTime || null);
    }
  }, [currentBanner]);

  const handlePrevBanner = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCarouselIndex((prev) => (prev - 1 + bannerItems.length) % bannerItems.length);
  };

  const handleNextBanner = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCarouselIndex((prev) => (prev + 1) % bannerItems.length);
  };

  // ── Derived: registration trend ───────────────────────────────────────────
  const regTrendData = useMemo(() => {
    if (!useMock && analytics?.dailyRegistrations && analytics.dailyRegistrations.some((d: any) => (d.count || 0) > 0 || (d.vip || 0) > 0)) {
      return analytics.dailyRegistrations;
    }
    if (useMock) return MOCK_REG_TREND;
    const counts: Record<string, number> = {};
    const vipCounts: Record<string, number> = {};
    WEEK_DAYS.forEach(d => { counts[d] = 0; vipCounts[d] = 0; });

    registrations.forEach(r => {
      if (r.registeredAt) {
        try {
          const d = new Date(r.registeredAt);
          const dayIdx = d.getDay();
          const dayName = WEEK_DAYS[dayIdx === 0 ? 6 : dayIdx - 1];
          if (dayName) {
            counts[dayName] = (counts[dayName] || 0) + 1;
            if (r.status === "CONFIRMED") vipCounts[dayName] = (vipCounts[dayName] || 0) + 1;
          }
        } catch {}
      }
    });

    allUnifiedRegs.forEach(r => {
      const dateStr = (r as any).registeredAt || r.createdAt || r.eventDate;
      if (dateStr) {
        try {
          const d = new Date(dateStr);
          const dayIdx = isNaN(d.getTime()) ? 0 : d.getDay();
          const dayName = WEEK_DAYS[dayIdx === 0 ? 6 : dayIdx - 1];
          if (dayName) {
            const devotees = r.devoteeCount || 1;
            counts[dayName] = (counts[dayName] || 0) + devotees;
            if (r.status === "CONFIRMED" || r.paymentStatus === "PAID") {
              vipCounts[dayName] = (vipCounts[dayName] || 0) + devotees;
            }
          }
        } catch {}
      }
    });

    return WEEK_DAYS.map(d => ({ day: d, count: counts[d] || 0, vip: vipCounts[d] || 0 }));
  }, [useMock, analytics, registrations, allUnifiedRegs]);

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
    if (!useMock && analytics?.passCategories && analytics.passCategories.length > 0) return analytics.passCategories;
    if (useMock) return MOCK_PIE;
    const byCat: Record<string, number> = {};
    allUnifiedRegs.forEach(r => {
      const cat = r.category || (r as any).passType || r.activityTitle || "Event Pass";
      const count = r.devoteeCount || 1;
      byCat[cat] = (byCat[cat] || 0) + count;
    });
    registrations.forEach(r => {
      const status = r.status === "CONFIRMED" ? "Confirmed Passes" : "General Passes";
      byCat[status] = (byCat[status] || 0) + 1;
    });
    const entries = Object.entries(byCat).map(([name, value], i) => ({
      name,
      value,
      color: PIE_COLORS[i % PIE_COLORS.length],
    }));
    if (stats?.totalVolunteers) entries.push({ name: "Volunteers", value: stats.totalVolunteers, color: "#2563EB" });
    return entries;
  }, [useMock, analytics, registrations, allUnifiedRegs, stats]);

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
    const activeToday = events
      .filter(e => String(e.status || '').toUpperCase() !== "CANCELLED")
      .filter(e => e.startDate <= todayStr && (!e.endDate || e.endDate >= todayStr));
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
    <div className="space-y-3 pb-10 min-h-screen bg-gradient-to-br from-[#F3F4FB] via-[#F6F4FE] to-[#EEF0F8] px-2 sm:px-3 py-2.5">

      {/* ── Loading bar ── */}
      {!useMock && loading && (
        <div className="w-full h-0.5 bg-indigo-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 animate-pulse w-2/3 rounded-full" />
        </div>
      )}

      {/* ── Error banner ── */}
      {!useMock && error && (
        <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
          <button onClick={fetchAll} className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-amber-700 hover:text-amber-900">
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      )}

      {/* ── Single Merged Unified Festival & Event Header Bar with Auto-Move & Manual Navigation ── */}
      <div
        onMouseEnter={() => setIsBannerHovered(true)}
        onMouseLeave={() => setIsBannerHovered(false)}
        className="relative rounded-xl overflow-hidden shadow-sm transition-all duration-300 border border-indigo-900/20 group/banner"
        style={{ background: currentBanner.bgGradient || "linear-gradient(135deg, #3730A3 0%, #4F46E5 40%, #7C3AED 72%, #9333EA 100%)" }}
      >
        {/* Dot grid texture */}
        <div className="absolute inset-0 opacity-[0.07] pointer-events-none z-0"
          style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
        {/* Glow blob */}
        <div className="absolute right-0 top-0 w-48 h-full rounded-full opacity-15 blur-3xl pointer-events-none z-0"
          style={{ background: "radial-gradient(circle, #FEF3C7 0%, transparent 70%)", transform: "translate(20%,-20%)" }} />

        <div className="relative z-10 px-3 py-2 sm:px-3.5 sm:py-2.5 text-white flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">

          {/* Left: Single Festival Icon + Title + Metadata */}
          <div className="flex items-start sm:items-center gap-2.5 min-w-0 flex-1">
            <div className="relative w-8 h-8 rounded-lg bg-amber-400/20 border border-amber-300/30 flex items-center justify-center text-base shrink-0 shadow-xs overflow-hidden">
              <span className="text-base">{(useMock || events.length > 0) ? "🕉️" : "📅"}</span>
              {currentBanner.image && (
                <img
                  src={currentBanner.image}
                  alt={currentBanner.title}
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-amber-400/20 text-amber-200 border border-amber-300/30 uppercase tracking-wider">
                  🔥 {currentBanner.category}
                </span>
                {(useMock || events.length > 0) ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 text-[9.5px] font-bold border border-emerald-400/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {bannerItems.length > 1 ? `Live · Event ${carouselIndex + 1} of ${bannerItems.length}` : `Live · 1 Event`}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-500/20 text-slate-300 text-[9.5px] font-bold border border-slate-400/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> 0 Events Available
                  </span>
                )}
                {(useMock || events.length > 0) && (
                  <>
                    <span className="text-white/60 text-xs hidden sm:inline">·</span>
                    <span className="text-[11px] font-semibold text-white/80 hidden sm:inline-flex items-center gap-1">
                      <Ticket className="w-3.5 h-3.5 text-indigo-200" /> {currentBanner.registered}
                    </span>
                  </>
                )}
              </div>
              <h2 className="text-sm sm:text-base font-bold text-white leading-tight drop-shadow-sm truncate">
                {currentBanner.title}
              </h2>
              <div className="flex flex-wrap items-center gap-2 text-[10px] font-normal text-white/75 mt-0.5">
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-amber-300" /> {currentBanner.location}</span>
                <span className="text-white/30">·</span>
                <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3 text-indigo-200" /> {currentBanner.date}</span>
              </div>
            </div>
          </div>

          {/* Center: Manual Carousel Move Controls & Indicators when multiple events exist */}
          {bannerItems.length > 1 && (
            <div className="flex items-center gap-1.5 bg-black/25 backdrop-blur-xs px-2 py-1 rounded-xl border border-white/15 shrink-0 self-start lg:self-center shadow-xs">
              <button
                type="button"
                onClick={handlePrevBanner}
                className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
                title="Previous Event"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <div className="flex items-center gap-1 px-1">
                {bannerItems.map((_, dotIdx) => (
                  <button
                    key={dotIdx}
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setCarouselIndex(dotIdx); }}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      dotIdx === carouselIndex
                        ? "w-4 bg-amber-400 shadow-xs"
                        : "w-1.5 bg-white/40 hover:bg-white/70"
                    }`}
                    title={`Go to Event ${dotIdx + 1}`}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={handleNextBanner}
                className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
                title="Next Event"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Right: Countdown Ticker & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 justify-between lg:justify-end border-t lg:border-t-0 pt-2 lg:pt-0 border-white/10">
            {/* Countdown (only if events exist) */}
            {(useMock || events.length > 0) ? (
              <div className="flex items-center gap-1">
                <span className="text-[9px] font-bold text-white/60 uppercase tracking-wider mr-1">Starts in</span>
                {[
                  { val: timeLeft.days, unit: "d" },
                  { val: timeLeft.hours, unit: "h" },
                  { val: timeLeft.mins, unit: "m" },
                  { val: timeLeft.secs, unit: "s", amber: true },
                ].map(({ val, unit, amber }, i) => (
                  <div key={unit} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <span
                        className={`w-6 sm:w-7 text-center px-1 py-0.5 rounded-md font-mono text-[11px] font-extrabold leading-none ${
                          amber ? "bg-amber-500/30 text-amber-200 border border-amber-400/30" : "bg-black/30 text-white"
                        }`}
                      >
                        {String(val).padStart(2, "0")}
                      </span>
                      <span className="text-[7.5px] font-bold text-white/50 mt-0.5 uppercase">{unit}</span>
                    </div>
                    {i < 3 && <span className="text-white/40 font-bold text-xs mx-0.5 mb-1.5">:</span>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[11px] font-semibold text-white/70 italic">
                No active timer
              </div>
            )}

            {/* Buttons */}
            {(useMock || events.length > 0) ? (
              <div className="flex items-center gap-2">
                <button onClick={() => setShowQRModal(true)} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white border border-white/20 text-[11px] font-bold transition-all shadow-xs cursor-pointer">
                  <QrCode className="w-3.5 h-3.5 text-amber-300" /> My Pass
                </button>
                <button onClick={() => setShowRegisterModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-white text-[11px] font-black shadow-sm cursor-pointer hover:scale-105 active:scale-95 transition-all"
                  style={{ background: "linear-gradient(135deg, #EA580C, #F97316)", boxShadow: "0 4px 12px rgba(234,88,12,0.35)" }}
                >
                  <UserPlus className="w-3.5 h-3.5" /> Register
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-amber-200 bg-amber-400/20 px-3 py-1 rounded-xl border border-amber-300/30">
                  Create an event in Events module to open registrations
                </span>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ── KPI Cards Grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {kpis.map((kpi: any, idx) => {
          const Icon = kpi.icon;
          const isLiveCard = !useMock && idx < 6;
          const isSkeleton = isLiveCard && loading;
          return (
            <div
              key={idx}
              onClick={() => kpi.to && navigate(kpi.to)}
              className="group bg-white rounded-xl border border-indigo-100/60 shadow-[0_2px_12px_rgba(79,70,229,0.05)] hover:border-indigo-300 hover:shadow-md p-3 sm:p-3.5 flex flex-col justify-between gap-2 hover:-translate-y-0.5 transition-all cursor-pointer select-none"
              title={`Click to view ${kpi.label}`}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  if (kpi.to) navigate(kpi.to);
                }
              }}
            >
              <div className="flex items-start justify-between gap-1.5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                  style={{ background: kpi.bg, color: kpi.color }}
                >
                  <Icon className="w-4 h-4" strokeWidth={2} />
                </div>
                <div className="flex items-center gap-1">
                  {isSkeleton ? (
                    <div className="w-14 h-4 bg-slate-100 rounded-full animate-pulse" />
                  ) : (
                    <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                      {kpi.trend}
                    </span>
                  )}
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                </div>
              </div>
              <div>
                <p className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider group-hover:text-indigo-600 transition-colors">
                  {kpi.label}
                </p>
                {isSkeleton ? (
                  <div className="mt-1 w-16 h-6 bg-slate-100 rounded animate-pulse" />
                ) : (
                  <p className="text-lg font-black text-slate-900 mt-0.5 leading-none group-hover:text-indigo-600 transition-colors">
                    {kpi.value}
                  </p>
                )}
                <p className="text-[10px] font-medium text-slate-500 mt-0.5 truncate">{kpi.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Charts Grid: 4 Live Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Chart 1: Daily Ticket Registrations */}
        <div className="bg-white rounded-xl border border-indigo-100/60 shadow-[0_2px_12px_rgba(79,70,229,0.05)] p-3.5 sm:p-4 space-y-2">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[9.5px] uppercase font-bold text-slate-400 tracking-wider">Registration Trend</p>
              <h3
                onClick={() => navigate("/events/registration")}
                className="text-xs sm:text-sm font-extrabold text-slate-900 mt-0.5 hover:text-indigo-600 cursor-pointer flex items-center gap-1 transition-colors"
                title="View Registrations"
              >
                Daily Ticket Registrations
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </h3>
            </div>
            <button
              onClick={() => navigate("/events/registration")}
              className="text-[10.5px] font-bold text-[#4F46E5] bg-indigo-50 hover:bg-indigo-100 px-2.5 py-0.5 rounded-full border border-indigo-200 cursor-pointer transition-colors"
            >
              {!useMock
                ? `Total: ${liveRegCount.toLocaleString()} Passes →`
                : "Total: 1,842 Passes →"}
            </button>
          </div>
          <div className="h-[175px] w-full">
            {!useMock && regTrendData.every((d: any) => d.count === 0 && d.vip === 0) ? (
              <div className="h-full w-full flex flex-col items-center justify-center text-center gap-1.5 rounded-xl border-2 border-dashed border-slate-100 bg-slate-50/50">
                <CalendarDays className="w-6 h-6 text-slate-300" strokeWidth={1.5} />
                <p className="text-[11.5px] font-semibold text-slate-500">No Daily Registrations Data</p>
                <p className="text-[10.5px] text-slate-400 max-w-[200px] leading-snug">No ticket registrations recorded in database yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={regTrendData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRegDash" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E0E7FF", fontSize: 11 }} />
                  <Area type="monotone" dataKey="count" stroke="#4F46E5" strokeWidth={2} fill="url(#colorRegDash)" name="Registrations" dot={{ r: 3, fill: "#4F46E5" }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 2: Pass Category Distribution */}
        <div className="bg-white rounded-xl border border-indigo-100/60 shadow-[0_2px_12px_rgba(79,70,229,0.05)] p-3.5 sm:p-4 space-y-2">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[9.5px] uppercase font-bold text-slate-400 tracking-wider">Category Breakdown</p>
              <h3
                onClick={() => navigate("/events/registration")}
                className="text-xs sm:text-sm font-extrabold text-slate-900 mt-0.5 hover:text-indigo-600 cursor-pointer flex items-center gap-1 transition-colors"
                title="View Pass Categories"
              >
                Pass Category Distribution
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </h3>
            </div>
            <button
              onClick={() => navigate("/events/registration")}
              className="text-[10.5px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200 cursor-pointer transition-colors"
            >
              View Passes →
            </button>
          </div>
          <div className="h-[175px] w-full flex items-center">
            {!useMock && pieData.length === 0 ? (
              <div className="h-full w-full flex flex-col items-center justify-center text-center gap-1.5 rounded-xl border-2 border-dashed border-slate-100 bg-slate-50/50">
                <Ticket className="w-6 h-6 text-slate-300" strokeWidth={1.5} />
                <p className="text-[11.5px] font-semibold text-slate-500">No Pass Category Data</p>
                <p className="text-[10.5px] text-slate-400 max-w-[200px] leading-snug">No pass registration categories recorded in database yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="40%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={3} dataKey="value">
                    {pieData.map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E0E7FF", fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="flex flex-col gap-1.5 pr-2">
              {pieData.map((d: any) => (
                <div key={d.name} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                  <div>
                    <p className="text-[10.5px] font-semibold text-slate-700 leading-tight">{d.name}</p>
                    <p className="text-[9.5px] text-slate-400 leading-tight">{d.value} passes</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chart 3: Today's Schedule & Duty */}
        <div className="bg-white rounded-xl border border-indigo-100/60 shadow-[0_2px_12px_rgba(79,70,229,0.05)] p-3.5 sm:p-4 space-y-2">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[9.5px] uppercase font-bold text-slate-400 tracking-wider">Timeline Analysis</p>
              <h3
                onClick={() => navigate("/events/schedule?tab=programs")}
                className="text-xs sm:text-sm font-extrabold text-slate-900 mt-0.5 hover:text-indigo-600 cursor-pointer flex items-center gap-1 transition-colors"
                title="View Schedule & Duty"
              >
                Today's Schedule & Duty
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </h3>
            </div>
            <button
              onClick={() => navigate("/events/schedule?tab=programs")}
              className="text-[10.5px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-0.5 rounded-full border border-indigo-200 cursor-pointer transition-colors"
            >
              View Schedule →
            </button>
          </div>
          <div className="h-[175px] space-y-1.5 overflow-y-auto pr-1">
            {!useMock && scheduleDutyChartData.every((d: any) => d.programs === 0 && d.volunteers === 0) ? (
              <div className="h-full w-full flex flex-col items-center justify-center text-center gap-1.5 rounded-xl border-2 border-dashed border-slate-100 bg-slate-50/50">
                <Clock className="w-6 h-6 text-slate-300" strokeWidth={1.5} />
                <p className="text-[11.5px] font-semibold text-slate-500">No Schedule & Duty Data</p>
                <p className="text-[10.5px] text-slate-400 max-w-[200px] leading-snug">No active event programs or duty shifts scheduled today</p>
              </div>
            ) : (
              scheduleDutyChartData.map((item: any) => (
                <div key={item.time} className="flex items-center gap-2.5">
                  <span className="text-[10.5px] font-mono font-bold text-slate-400 w-16 flex-shrink-0">{item.time}</span>
                  <div className="flex-1 flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-100 text-indigo-700">{item.programs}p</span>
                    <span className="text-[11px] font-semibold text-slate-800 flex-1">{item.volunteers} volunteers</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chart 4: Budget vs Actual Spend (₹ Lakhs) */}
        <div className="bg-white rounded-xl border border-indigo-100/60 shadow-[0_2px_12px_rgba(79,70,229,0.05)] p-3.5 sm:p-4 space-y-2">
          <div className="flex items-start justify-between flex-wrap gap-2">
            <div>
              <p className="text-[9.5px] uppercase font-bold text-slate-400 tracking-wider">Finance Analytics</p>
              <h3
                onClick={() => navigate("/events/operations?tab=finance")}
                className="text-xs sm:text-sm font-extrabold text-slate-900 mt-0.5 hover:text-indigo-600 cursor-pointer flex items-center gap-1 transition-colors"
                title="View Finance Details"
              >
                Budget vs Actual Spend (₹ Lakhs)
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </h3>
            </div>
            <button
              onClick={() => navigate("/events/operations?tab=finance")}
              className="text-[10.5px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-0.5 rounded-full border border-indigo-200 cursor-pointer transition-colors"
            >
              {!useMock && stats ? `Spent: ${fmtINR(stats.totalExpenses)} →` : "View Budget →"}
            </button>
          </div>
          <div className="h-[175px] w-full">
            {!useMock && (budgetData.length === 0 || budgetData.every((d: any) => d.budget === 0 && d.spent === 0)) ? (
              <div className="h-full w-full flex flex-col items-center justify-center text-center gap-1.5 rounded-xl border-2 border-dashed border-slate-100 bg-slate-50/50">
                <IndianRupee className="w-6 h-6 text-slate-300" strokeWidth={1.5} />
                <p className="text-[11.5px] font-semibold text-slate-500">No Financial Expense Data</p>
                <p className="text-[10.5px] text-slate-400 max-w-[200px] leading-snug">No category budget or actual spend recorded in database yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={budgetData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={12}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="cat" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E0E7FF", fontSize: 11 }} />
                  <Bar dataKey="budget" fill="rgba(79,70,229,0.18)" stroke="#4F46E5" strokeWidth={1.5} radius={[4, 4, 0, 0]} name="Budget (L)" />
                  <Bar dataKey="spent" fill="#7C3AED" radius={[4, 4, 0, 0]} name="Spent (L)" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500">
              <span className="w-2.5 h-2.5 rounded-sm border border-indigo-400" style={{ background: "rgba(79,70,229,0.18)" }} />
              Budget
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500">
              <span className="w-2.5 h-2.5 rounded-sm bg-violet-600" />
              Actual
            </div>
          </div>
        </div>
      </div>

      {/* ── Today's Schedule + Pending Tasks ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-white rounded-xl border border-indigo-100/60 shadow-[0_2px_12px_rgba(79,70,229,0.05)] p-3.5 sm:p-4">
          <div className="flex items-center justify-between mb-3">
            <h3
              onClick={() => navigate("/events/schedule?tab=programs")}
              className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-1.5 hover:text-indigo-600 cursor-pointer transition-colors"
              title="View All Programs"
            >
              <Clock className="w-4 h-4 text-indigo-500" /> Today's Schedule & Duty
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </h3>
            <button
              onClick={() => navigate("/events/schedule?tab=programs")}
              className="text-[10.5px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
            >
              Full Schedule →
            </button>
          </div>
          {loading && !useMock ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="p-2.5 rounded-xl bg-slate-50 animate-pulse h-12" />
              ))}
            </div>
          ) : todaySchedule.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">No events scheduled for today.</div>
          ) : (
            <div className="relative pl-3.5 space-y-0">
              <div className="absolute left-[5px] top-2 bottom-2 w-px bg-slate-200" />
              {todaySchedule.map((act, idx) => (
                <div
                  key={idx}
                  onClick={() => navigate("/events/schedule?tab=programs")}
                  className="relative flex gap-2.5 pb-3 last:pb-0 cursor-pointer group"
                >
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5 border-2 border-white shadow-xs"
                    style={{ background: act.status === "Live" ? "#7C3AED" : act.status === "Done" ? "#16A34A" : "#4F46E5" }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[12px] font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors truncate">{act.title}</p>
                      <span className="text-[9.5px] font-mono font-bold text-slate-400 flex-shrink-0">{act.time}</span>
                    </div>
                    <p className="text-[10.5px] text-slate-500 mt-0.5">{act.dept} · {act.count}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-indigo-100/60 shadow-[0_2px_12px_rgba(79,70,229,0.05)] p-3.5 sm:p-4">
          <div className="flex items-center justify-between mb-3">
            <h3
              onClick={() => navigate("/events/schedule?tab=planning")}
              className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-1.5 hover:text-indigo-600 cursor-pointer transition-colors"
              title="View Action Items & Planning"
            >
              <ClipboardCheck className="w-4 h-4 text-indigo-500" /> Pending Action Items
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </h3>
            <button
              onClick={() => navigate("/events/schedule?tab=planning")}
              className="text-[10.5px] font-bold text-rose-500 hover:text-rose-700 cursor-pointer"
            >
              {pendingTasks.filter(t => t.priority === "high").length} Critical →
            </button>
          </div>
          {loading && !useMock ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="p-2.5 rounded-xl bg-slate-50 animate-pulse h-10" />
              ))}
            </div>
          ) : pendingTasks.length === 0 ? (
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 py-6 justify-center">
              🎉 All tasks completed!
            </div>
          ) : (
            <div className="space-y-1.5">
              {pendingTasks.map((t) => (
                <div
                  key={t.id}
                  className={`flex items-center justify-between gap-2.5 p-2.5 rounded-xl border transition-all ${
                    tasksDone[t.id]
                      ? "bg-slate-50 border-slate-100 opacity-60"
                      : "bg-white border-slate-200/80 shadow-2xs hover:border-indigo-300"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      onClick={() => toggleTask(t.id)}
                      className={`w-4.5 h-4.5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        tasksDone[t.id] ? "bg-indigo-500 border-indigo-500" : "bg-white border-slate-300 hover:border-indigo-400"
                      }`}
                    >
                      {tasksDone[t.id] && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                    <span
                      onClick={() => navigate("/events/schedule?tab=planning")}
                      className={`text-[11.5px] font-semibold truncate cursor-pointer hover:text-indigo-600 transition-colors ${tasksDone[t.id] ? "line-through text-slate-400" : "text-slate-800"}`}
                    >
                      {t.task}
                    </span>
                  </div>
                  <span
                    onClick={() => navigate("/events/schedule?tab=planning")}
                    className={`text-[9.5px] font-black px-2 py-0.5 rounded-full border flex-shrink-0 cursor-pointer ${
                      t.due === "Overdue" ? "bg-red-50 text-red-600 border-red-200"
                      : t.priority === "high" ? "bg-rose-50 text-rose-600 border-rose-200"
                      : "bg-blue-50 text-blue-600 border-blue-200"
                    }`}
                  >
                    {t.due === "—" ? "—" : `Due ${t.due}`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Registered Users Section ── */}
      <div className="bg-white rounded-xl border border-indigo-100/60 shadow-[0_2px_12px_rgba(79,70,229,0.05)] overflow-hidden">
        {/* Section header */}
        <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-[9.5px] uppercase font-bold text-slate-400 tracking-wider">Registrations</p>
            <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 mt-0.5 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-indigo-500" /> Registered Users
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200 ml-1">
                {filteredUnifiedRegs.length}
              </span>
            </h3>
          </div>
          {/* Category filter pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {([
              { value:'all', label:'All', icon:'📋' },
              { value:'event', label:'Events', icon:'🎉' },
              { value:'pooja', label:'Pooja', icon:'🔥' },
              { value:'cultural', label:'Cultural', icon:'🎵' },
              { value:'competition', label:'Competition', icon:'🏆' },
            ] as const).map(opt => (
              <button key={opt.value} onClick={() => { setRegCat(opt.value); setExpandedActivity(null); }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all border ${
                  regCat === opt.value ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
                }`}>
                <span>{opt.icon}</span> {opt.label}
                <span className={`ml-0.5 text-[9px] font-bold px-1 py-0.5 rounded-full ${regCat === opt.value ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'}`}>
                  {opt.value === 'all' ? allUnifiedRegs.length : allUnifiedRegs.filter(r => r.category === opt.value).length}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Search + KPIs bar */}
        <div className="px-4 sm:px-5 py-2.5 border-b border-slate-50 flex flex-col sm:flex-row gap-2.5 items-start sm:items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-4 flex-wrap text-xs">
            {[
              { label:'Total Users', value: filteredUnifiedRegs.length, color:'#6366f1' },
              { label:'Attendees', value: filteredUnifiedRegs.reduce((a,r)=>a+r.devoteeCount,0), color:'#10b981' },
              { label:'Paid', value: filteredUnifiedRegs.filter(r=>r.paymentStatus==='PAID').length, color:'#0891b2' },
              { label:'Revenue', value:`₹${filteredUnifiedRegs.reduce((a,r)=>a+r.bookingFee,0).toLocaleString('en-IN')}`, color:'#f59e0b' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <span className="font-black text-sm" style={{color:s.color}}>{s.value}</span>
                <span className="text-[10px] text-slate-400 ml-1">{s.label}</span>
              </div>
            ))}
          </div>
          {/* Search bar */}
          <div className="relative w-full sm:w-52">
            <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-2.5" />
            <input type="text" placeholder="Search name, code..." value={regSearch}
              onChange={e => setRegSearch(e.target.value)}
              className="w-full pl-7 pr-3 py-1.5 rounded-lg border border-slate-200 bg-white text-[11px] font-medium text-slate-700 focus:outline-none focus:border-indigo-400" />
          </div>
        </div>

        {loadingRegs && <div className="py-8 text-center text-xs text-slate-400"><Loader2 className="w-4 h-4 animate-spin inline mr-1" />Loading...</div>}

        {/* Grouped list */}
        <div className="divide-y divide-slate-50">
          {Object.keys(groupedRegs).length === 0 && !loadingRegs && (
            <div className="py-8 text-center text-xs text-slate-400">No registrations found</div>
          )}
          {Object.entries(groupedRegs).map(([key, regs]) => {
            const [cat, title] = key.split('::');
            const isOpen = expandedActivity === key;
            const headcount = regs.reduce((a,r)=>a+r.devoteeCount,0);
            const revenue = regs.reduce((a,r)=>a+r.bookingFee,0);
            const catMeta: Record<string,{icon:string;color:string;bg:string}> = {
              event:{icon:'🎉',color:'text-indigo-700',bg:'bg-indigo-50'},
              pooja:{icon:'🔥',color:'text-amber-700',bg:'bg-amber-50'},
              cultural:{icon:'🎵',color:'text-violet-700',bg:'bg-violet-50'},
              competition:{icon:'🏆',color:'text-emerald-700',bg:'bg-emerald-50'},
            };
            const m = catMeta[cat] || catMeta['event'];
            return (
              <div key={key}>
                <button onClick={() => setExpandedActivity(isOpen ? null : key)}
                  className="w-full px-4 sm:px-5 py-3 flex items-center gap-3 hover:bg-slate-50/60 transition-colors text-left">
                  <span className={`w-8 h-8 rounded-xl ${m.bg} flex items-center justify-center text-sm flex-shrink-0`}>{m.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-bold text-slate-800 truncate">{title}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${m.bg} ${m.color} capitalize`}>{cat}</span>
                      <span className="text-[10px] text-slate-400">{regs.length} users · {headcount} attendees</span>
                      {revenue > 0 && <span className="text-[10px] font-semibold text-emerald-600">₹{revenue.toLocaleString('en-IN')}</span>}
                    </div>
                  </div>
                  <div className="text-slate-400 flex-shrink-0 flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-indigo-600">{regs.length}</span>
                    {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-slate-50 overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-100">
                          {['Reg Code','Participant','Details','Guests','Date/Time','Fee','Payment','Status'].map(h => (
                            <th key={h} className={`px-3 py-2 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap ${['Date/Time','Details'].includes(h)?'hidden lg:table-cell':''}`}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {regs.map(r => (
                          <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="px-3 py-2 font-mono text-[10px] text-indigo-600 font-semibold whitespace-nowrap">{r.regCode}</td>
                            <td className="px-3 py-2">
                              <p className="font-semibold text-slate-800 text-[11px] whitespace-nowrap">{r.participantName}</p>
                              {r.email && <p className="text-[10px] text-slate-400">{r.email}</p>}
                            </td>
                            <td className="px-3 py-2 hidden lg:table-cell">
                              {r.extra && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium">{r.extra}</span>}
                            </td>
                            <td className="px-3 py-2">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold shadow-2xs">
                                <Users className="w-3 h-3 text-indigo-600" /> {r.devoteeCount} {r.devoteeCount === 1 ? 'Attendee' : 'Attendees'}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-slate-500 text-[10px] hidden lg:table-cell whitespace-nowrap">
                              {r.eventDate||'—'}{r.eventTime?` · ${r.eventTime}`:''}
                            </td>
                            <td className="px-3 py-2 font-semibold text-[11px] text-slate-700 whitespace-nowrap">
                              {r.bookingFee > 0 ? `₹${r.bookingFee.toLocaleString('en-IN')}` : 'Free'}
                            </td>
                            <td className="px-3 py-2">
                              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${r.paymentStatus==='PAID'?'bg-emerald-50 text-emerald-700':r.paymentStatus==='FREE'?'bg-sky-50 text-sky-700':'bg-amber-50 text-amber-700'}`}>{r.paymentStatus}</span>
                            </td>
                            <td className="px-3 py-2">
                              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${r.status==='CONFIRMED'?'bg-emerald-50 text-emerald-700':r.status==='CANCELLED'?'bg-rose-50 text-rose-700':'bg-amber-50 text-amber-700'}`}>{r.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Floating AI Assistant ── */}
      <button
        onClick={() => setShowAICopilot(true)}
        style={{
          background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
          boxShadow: "0 10px 30px -4px rgba(79,70,229,0.5), 0 0 20px rgba(124,58,237,0.3)",
          width: 52,
          height: 52,
        }}
        className="fixed bottom-6 right-6 z-40 rounded-full flex items-center justify-center text-white cursor-pointer hover:scale-110 active:scale-95 transition-all duration-300 border-2 border-white group shadow-2xl"
        title="Open AI Event Copilot"
      >
        <Bot className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-white animate-ping" />
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-white" />
      </button>

      <EventAICopilotDrawer isOpen={showAICopilot} onClose={() => setShowAICopilot(false)} />

      {showRegisterModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/70 backdrop-blur-md overflow-y-auto cursor-pointer"
          onClick={() => setShowRegisterModal(false)}
        >
          <div
            className="relative w-full max-w-lg sm:max-w-xl md:max-w-2xl bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 min-h-[85vh] sm:min-h-[640px] max-h-[94vh] flex flex-col justify-between overflow-y-auto animate-scaleUp cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowRegisterModal(false)}
              className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
              title="Close modal (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
            <EventRegistrationWizard
              event={
                (() => {
                  const runningEvents = events.filter(e => String(e.status || '').toUpperCase() !== "CANCELLED");
                  return (runningEvents && runningEvents.length > 0) ? (runningEvents[carouselIndex] || runningEvents[0]) : {
                    id: "ev-1",
                    title: "Ganesh Chaturthi Utsav 2026",
                    ticketTypes: [
                      {
                        id: "ganesh-pass-2026",
                        name: "Ganesh Utsav 2026 Pass",
                        price: "250",
                        qty: "2500",
                        description: "All-access entry pass for Ganesh Chaturthi 2026 Mahotsav rituals, prasadam & cultural programs",
                      },
                    ],
                  };
                })()
              }
              onClose={() => setShowRegisterModal(false)}
            />
          </div>
        </div>
      )}

      <GatePassModal isOpen={showQRModal} onClose={() => setShowQRModal(false)} />
    </div>
  );
}
