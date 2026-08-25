import React, { useState, useEffect, useMemo } from "react";
import {
  Download, Users, FileText,
  Search, Calendar, Eye, Printer, CheckCircle2,
  RefreshCw, Sparkles, Utensils, Shield, ChevronRight, X,
  Tag, Award, Layers, ChevronLeft, Store
} from "lucide-react";
import { useEventMock } from "./EventMockToggle";
import { ErrorBanner, LoadingSpinner } from "./shared/index";
import {
  eventReportService,
  type EventReportResponse,
  type EventRegistrationReportRow
} from "../../../services/events/eventReportService";
import { eventService, type EventResponse } from "../../../services/events/eventService";
import {
  Tooltip, PieChart, Pie, Cell, Legend, ResponsiveContainer
} from "recharts";

// ── Category Config ────────────────────────────────────────────────────────────
const CATEGORY_REPORT_CARDS = [
  { id: "pooja",     title: "Pooja Seva Registrations",   desc: "Devotees, gotrams, sankalpam slots, pandit & seva fees", icon: Sparkles,  color: "#e11d48", bg: "#fff1f2", border: "#fecdd3", statKey: "poojaRegs",    revenueKey: "poojaRevenue" },
  { id: "general",   title: "General Event Passes",        desc: "Attendee pass holders, devotee headcount, check-ins",    icon: Users,     color: "#4f46e5", bg: "#eef2ff", border: "#c7d2fe", statKey: "generalRegs",  revenueKey: null },
  { id: "activity",  title: "Cultural & Competitions",     desc: "Stage performers, classical dances, competition teams",  icon: Award,     color: "#d97706", bg: "#fffbeb", border: "#fde68a", statKey: "activityRegs", revenueKey: null },
  { id: "meal",      title: "Annadanam / Meal Bookings",   desc: "Devotee meal headcount, lunch/dinner & dietary prefs",   icon: Utensils,  color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", statKey: "mealHeadcount",revenueKey: null },
  { id: "volunteer", title: "Volunteer Duty Roster",       desc: "Assigned volunteers, zones, shifts & duty status",       icon: Shield,    color: "#0891b2", bg: "#ecfeff", border: "#a5f3fc", statKey: "volunteers",   revenueKey: null },
  { id: "booking",   title: "Bookings & Stall Register",   desc: "Stall bookings, seva coupons, event activity bookings",  icon: Store,     color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe", statKey: "bookingRegs",  revenueKey: null },
  { id: "all",       title: "Master Consolidated Register", desc: "Complete all-in-one export containing every registered user", icon: Layers, color: "#64748b", bg: "#f8fafc", border: "#e2e8f0", statKey: "totalRegs", revenueKey: "totalRevenue" },
];

const CATEGORY_TABS = [
  { id: "all",       label: "All",        emoji: "📋" },
  { id: "pooja",     label: "Pooja Seva", emoji: "🕉️" },
  { id: "general",   label: "Passes",     emoji: "🎟️" },
  { id: "activity",  label: "Cultural",   emoji: "🎭" },
  { id: "meal",      label: "Meals",      emoji: "🍲" },
  { id: "volunteer", label: "Volunteers", emoji: "🤝" },
  { id: "booking",   label: "Bookings",   emoji: "🏪" },
];

const MOCK_ROWS: EventRegistrationReportRow[] = [
  { id: "POOJA-101", regCode: "POOJA-2026-001", category: "Pooja Seva", activityTitle: "Maha Ganapathi Abhishekam", participantName: "Ramesh Sharma", email: "ramesh.sharma@example.com", phone: "+91 98765 43210", gotram: "Bharadwaj", devoteeCount: 4, attendingDevotees: "Ramesh Sharma (Self), Sunita Sharma (Wife), Rahul (Son), Ananya (Daughter)", eventDate: "2026-08-27", eventTime: "08:30 AM", venue: "Main Temple Mandap", mandap: "Mandapam A", panditName: "Acharya Shastri", bookingFee: 501.0, paymentStatus: "PAID", paymentMethod: "UPI / Online", transactionId: "TXN_UPI_987654321", status: "CONFIRMED", checkedIn: true, prasadamMode: "Mandap Collection", notes: "Special Sankalpam requested for family health", registeredAt: "2026-08-15T10:30:00" },
  { id: "POOJA-102", regCode: "POOJA-2026-002", category: "Pooja Seva", activityTitle: "Sahasra Modaka Ganapathi Homam", participantName: "Venkata Raman", email: "v.raman@example.com", phone: "+91 98450 11223", gotram: "Kashyapa", devoteeCount: 2, attendingDevotees: "Venkata Raman (Self), Lakshmi Raman (Wife)", eventDate: "2026-08-27", eventTime: "10:00 AM", venue: "Homa Kundam", mandap: "Mandapam B", panditName: "Veda Murthy Krishna", bookingFee: 1001.0, paymentStatus: "PAID", paymentMethod: "NetBanking", transactionId: "TXN_NB_554433221", status: "CONFIRMED", checkedIn: false, prasadamMode: "Home Delivery", notes: "Prasadam delivery requested to flat 402", registeredAt: "2026-08-16T14:15:00" },
  { id: "POOJA-103", regCode: "POOJA-2026-003", category: "Pooja Seva", activityTitle: "Satyanarayan Vratam", participantName: "Aditya Hegde", email: "aditya.h@example.com", phone: "+91 97412 88776", gotram: "Vasishta", devoteeCount: 3, attendingDevotees: "Aditya Hegde, Priya Hegde, Aarav Hegde", eventDate: "2026-08-28", eventTime: "05:30 PM", venue: "Community Main Hall", mandap: "Mandapam A", panditName: "Acharya Somayaji", bookingFee: 350.0, paymentStatus: "PAID", paymentMethod: "UPI / PhonePe", transactionId: "TXN_UPI_112233445", status: "CONFIRMED", checkedIn: false, prasadamMode: "Mandap Collection", registeredAt: "2026-08-17T09:45:00" },
  { id: "GEN-501", regCode: "EVT-2026-501", category: "General Event", activityTitle: "Ganesh Utsav 2026 – Main Celebration Pass", participantName: "Rajesh Kumar Deshmukh", email: "rajesh.deshmukh@example.com", phone: "+91 91234 56789", gotram: "Koundinya", devoteeCount: 4, attendingDevotees: "4 Family Members", eventDate: "2026-08-27", eventTime: "07:00 AM", venue: "Community Complex Grounds", bookingFee: 200.0, paymentStatus: "PAID", paymentMethod: "Credit Card", transactionId: "TXN_CC_998877665", status: "CONFIRMED", checkedIn: true, registeredAt: "2026-08-10T11:00:00" },
  { id: "GEN-502", regCode: "EVT-2026-502", category: "General Event", activityTitle: "Ganesh Utsav 2026 – Main Celebration Pass", participantName: "Sowmya Rao", email: "sowmya.rao@example.com", phone: "+91 94480 33445", gotram: "Vishwamitra", devoteeCount: 2, attendingDevotees: "Sowmya Rao, Srinivas Rao", eventDate: "2026-08-27", eventTime: "07:00 AM", venue: "Community Complex Grounds", bookingFee: 100.0, paymentStatus: "PAID", paymentMethod: "UPI", transactionId: "TXN_UPI_667788990", status: "CONFIRMED", checkedIn: false, registeredAt: "2026-08-12T16:20:00" },
  { id: "ACT-301", regCode: "ACT-2026-301", category: "Cultural / Dance", activityTitle: "Classical Bharatanatyam – Pushpanjali & Varnam", participantName: "Meenakshi Sundaram", email: "meenakshi.dance@example.com", phone: "+91 98860 77889", gotram: "Harita", devoteeCount: 1, attendingDevotees: "Solo Performer (Age 19)", eventDate: "2026-08-27", eventTime: "06:30 PM", venue: "Main Cultural Stage", bookingFee: 0.0, paymentStatus: "FREE", paymentMethod: "Cultural Participant Entry", status: "CONFIRMED", checkedIn: true, notes: "Audio track submitted in advance", registeredAt: "2026-08-14T10:00:00" },
  { id: "ACT-302", regCode: "ACT-2026-302", category: "Competition / Music", activityTitle: "Devotional Singing Competition (Junior Group)", participantName: "Ananya Kulkarni", email: "kulkarni.family@example.com", phone: "+91 99001 22334", gotram: "Gautama", devoteeCount: 1, attendingDevotees: "Solo Participant (Age 11)", eventDate: "2026-08-28", eventTime: "11:00 AM", venue: "Auditorium Room 2", bookingFee: 0.0, paymentStatus: "FREE", status: "CONFIRMED", checkedIn: false, registeredAt: "2026-08-15T18:30:00" },
  { id: "MEAL-701", regCode: "MEAL-2026-701", category: "Food & Meals", activityTitle: "Maha Annadanam Lunch (Pure Veg)", participantName: "Gopalakrishna Bhatt", email: "gbhatt@example.com", phone: "+91 94490 55667", devoteeCount: 4, eventDate: "2026-08-27", eventTime: "12:30 PM - 02:30 PM", venue: "Dining Hall & Prasad Mandap", bookingFee: 0.0, paymentStatus: "FREE", status: "CONFIRMED", notes: "No onion / No garlic requested for 2 elders", registeredAt: "2026-08-18T12:00:00" },
  { id: "VOL-901", regCode: "VOL-2026-901", category: "Volunteer", activityTitle: "Prasadam & Queue Management - Zone A", participantName: "Suresh Krishnamurthy", email: "suresh.k@example.com", phone: "+91 98455 99887", devoteeCount: 1, eventDate: "2026-08-27", eventTime: "Morning Shift (07:00 AM - 01:00 PM)", venue: "Zone A - Main Temple Gate", bookingFee: 0.0, paymentStatus: "FREE", status: "ACTIVE", checkedIn: true, registeredAt: "2026-08-10T09:00:00" },
];

const PAGE_SIZE = 25;

function formatDate(val: string | undefined): string {
  if (!val) return "—";
  try { return new Date(val).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return val; }
}

// ── KPI Stat Card ──────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color, icon: Icon, progress }: {
  label: string; value: string | number; sub?: string; color: string;
  icon: React.ElementType; progress?: { value: number; max: number };
}) {
  const pct = progress ? Math.min(100, Math.round((progress.value / Math.max(1, progress.max)) * 100)) : null;
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-xs overflow-hidden flex flex-col">
      <div className="h-0.5 w-full" style={{ background: color }} />
      <div className="p-2.5 flex flex-col gap-1 flex-1">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{label}</span>
          <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: color + "1a" }}>
            <Icon className="w-3 h-3" style={{ color }} />
          </div>
        </div>
        <p className="text-lg font-black text-slate-900 leading-none tabular-nums">
          {typeof value === "number" ? value.toLocaleString("en-IN") : value}
        </p>
        {sub && <span className="text-[10px] font-semibold" style={{ color }}>{sub}</span>}
        {pct !== null && (
          <div className="h-1 bg-slate-100 rounded-full overflow-hidden mt-0.5">
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Download Category Card ─────────────────────────────────────────────────────
function DownloadCard({ card, count, revenue, isDownloading, onDownload, onPreview }: {
  card: typeof CATEGORY_REPORT_CARDS[0];
  count: number; revenue?: number | null;
  isDownloading: boolean;
  onDownload: () => void;
  onPreview: () => void;
}) {
  const Icon = card.icon;
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-xs hover:shadow-md transition-all group flex flex-col overflow-hidden">
      <div className="h-0.5 w-full" style={{ background: card.color }} />
      <div className="p-2.5 flex flex-col flex-1">
        <div className="flex items-start gap-2 mb-1.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
            style={{ background: card.bg }}>
            <Icon className="w-3.5 h-3.5" style={{ color: card.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-slate-900 text-[11px] leading-snug group-hover:text-indigo-700 transition-colors">
              {card.title}
            </h4>
            <p className="text-[10px] text-slate-400 leading-relaxed">{card.desc}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 mb-2">
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full border"
            style={{ background: card.bg, color: card.color, borderColor: card.border }}>
            {count.toLocaleString("en-IN")} records
          </span>
          {revenue != null && revenue > 0 && (
            <span className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              ₹{revenue.toLocaleString("en-IN")}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 mt-auto pt-2 border-t border-slate-100">
          <button
            onClick={onDownload}
            disabled={isDownloading}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-[10px] font-bold text-white transition-all cursor-pointer disabled:opacity-50 active:scale-95"
            style={{ background: isDownloading ? "#94a3b8" : card.color }}
          >
            {isDownloading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
            {isDownloading ? "Exporting…" : "Download CSV"}
          </button>
          <button
            onClick={onPreview}
            className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer"
            title="Preview in table"
          >
            <Eye className="w-3 h-3" />
            <span className="hidden sm:inline">View</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export function EventsReports() {
  const { useMock } = useEventMock();
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventResponse | null>(null);
  const [report, setReport] = useState<EventReportResponse | null>(null);
  const [registrations, setRegistrations] = useState<EventRegistrationReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingRegs, setLoadingRegs] = useState(false);
  const [downloadingCategory, setDownloadingCategory] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Table filters & pagination
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRowDetails, setSelectedRowDetails] = useState<EventRegistrationReportRow | null>(null);

  // ── Load Events ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (useMock) { setRegistrations(MOCK_ROWS); return; }
    eventService.getAllEvents()
      .then(evts => {
        setEvents(evts);
        if (evts.length > 0) { setSelectedEventId(evts[0].id); setSelectedEvent(evts[0]); }
      })
      .catch(() => {});
  }, [useMock]);

  // ── Load Report & Registrations when event changes ───────────────────────────
  useEffect(() => {
    if (useMock || !selectedEventId) return;
    const currentEvt = events.find(e => e.id === selectedEventId) || null;
    setSelectedEvent(currentEvt);
    setLoading(true);
    setError("");
    eventReportService.getEventReport(selectedEventId)
      .then(r => setReport(r))
      .catch(e => setError(e.message ?? "Failed to load report summary"))
      .finally(() => setLoading(false));

    setLoadingRegs(true);
    eventReportService.getRegistrationReport(selectedEventId, "all")
      .then(rows => setRegistrations(rows))
      .catch(e => { console.warn("Registration list error:", e); setRegistrations([]); })
      .finally(() => setLoadingRegs(false));
  }, [useMock, selectedEventId, events]);

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1); }, [activeCategoryTab, searchQuery, statusFilter, dateFrom, dateTo]);

  // ── CSV helpers ──────────────────────────────────────────────────────────────
  function esc(val: unknown): string {
    if (val === null || val === undefined) return '""';
    return `"${String(val).replace(/"/g, '""')}"`;
  }

  function downloadCsvClientSide(rows: EventRegistrationReportRow[], filename: string) {
    const headers = ["Reg Code","Category","Activity / Pooja / Seva","Participant Name","Phone","Email","Gotram","Devotee Count","Attending Devotees","Event Date","Event Time","Venue","Mandap","Pandit Name","Booking Fee (INR)","Payment Status","Payment Method","Transaction ID","Status","Checked In","Prasadam Mode","Registered At","Notes"];
    const csv = "﻿" + [
      headers.join(","),
      ...rows.map(r => [esc(r.regCode),esc(r.category),esc(r.activityTitle),esc(r.participantName),esc(r.phone),esc(r.email),esc(r.gotram),r.devoteeCount||1,esc(r.attendingDevotees),esc(r.eventDate),esc(r.eventTime),esc(r.venue),esc(r.mandap),esc(r.panditName),(r.bookingFee||0).toFixed(2),esc(r.paymentStatus),esc(r.paymentMethod),esc(r.transactionId),esc(r.status),r.checkedIn?"YES":"NO",esc(r.prasadamMode),esc(r.registeredAt),esc(r.notes)].join(","))
    ].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async function handleDownloadCategoryCsv(category: string, title: string) {
    setDownloadingCategory(category);
    setSuccessMsg("");
    setError("");
    const filename = `${(selectedEvent?.title || "event").replace(/[^a-zA-Z0-9_-]/g,"_")}_${category}_registrations_${new Date().toISOString().slice(0,10)}.csv`;
    try {
      if (useMock || !selectedEventId) {
        const filtered = category === "all" ? MOCK_ROWS : MOCK_ROWS.filter(r => r.category.toLowerCase().includes(category));
        downloadCsvClientSide(filtered, filename);
        setSuccessMsg(`Downloaded ${title} CSV (${filtered.length} records)`);
      } else {
        try {
          const blob = await eventReportService.exportRegistrationReportCsv(selectedEventId, category);
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = filename;
          document.body.appendChild(link); link.click(); document.body.removeChild(link);
          setSuccessMsg(`Successfully exported ${title} CSV`);
        } catch {
          const matchingRows = category === "all" ? registrations : registrations.filter(r => r.category.toLowerCase().includes(category));
          downloadCsvClientSide(matchingRows, filename);
          setSuccessMsg(`Exported ${title} CSV (${matchingRows.length} records)`);
        }
      }
    } catch (err: unknown) {
      setError((err as Error)?.message || "Failed to download CSV");
    } finally {
      setDownloadingCategory(null);
      setTimeout(() => setSuccessMsg(""), 5000);
    }
  }

  function handlePrintRoster(title: string, rows: EventRegistrationReportRow[]) {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>${title}</title>
    <style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;padding:20px;color:#1e293b}
    h1{font-size:18px;margin:0 0 4px 0;color:#4338ca}p.meta{font-size:11px;color:#64748b;margin:0 0 16px 0}
    table{width:100%;border-collapse:collapse;font-size:11px}th,td{border:1px solid #cbd5e1;padding:6px 8px;text-align:left}
    th{background:#f1f5f9;font-weight:700;color:#334155}tr:nth-child(even){background:#f8fafc}
    .chip{display:inline-block;padding:2px 6px;border-radius:4px;font-size:9px;font-weight:bold}
    .paid{background:#dcfce7;color:#15803d}.free{background:#f1f5f9;color:#475569}
    @media print{body{padding:10mm}}</style></head><body>
    <h1>${title}</h1>
    <p class="meta">Event: ${selectedEvent?.title||"Community Event"} | Date: ${new Date().toLocaleDateString()} | Total: ${rows.length}</p>
    <table><thead><tr><th>#</th><th>Reg Code</th><th>Category</th><th>Activity / Seva</th><th>Name</th><th>Phone</th><th>Gotram</th><th>Devotees</th><th>Date</th><th>Fee</th><th>Status</th></tr></thead>
    <tbody>${rows.map((r,i)=>`<tr><td>${i+1}</td><td><strong>${r.regCode||"—"}</strong></td><td>${r.category}</td><td>${r.activityTitle}</td><td>${r.participantName}</td><td>${r.phone||"—"}</td><td>${r.gotram||"—"}</td><td>${r.devoteeCount||1}</td><td>${r.eventDate||""}</td><td>₹${(r.bookingFee||0).toLocaleString("en-IN")}</td><td><span class="chip ${r.paymentStatus==="PAID"?"paid":"free"}">${r.status||"CONFIRMED"}</span></td></tr>`).join("")}
    </tbody></table></body></html>`);
    w.document.close(); w.focus(); setTimeout(() => w.print(), 400);
  }

  // ── Filtered Registrations ───────────────────────────────────────────────────
  const allSource = useMock ? MOCK_ROWS : registrations;

  const filteredRows = useMemo(() => {
    return allSource.filter(r => {
      if (activeCategoryTab !== "all") {
        const tab = activeCategoryTab.toLowerCase();
        const cat = r.category.toLowerCase();
        if (tab === "pooja"     && !cat.includes("pooja")) return false;
        if (tab === "general"   && !cat.includes("general") && !cat.includes("event")) return false;
        if (tab === "activity"  && !cat.includes("activity") && !cat.includes("cultural") && !cat.includes("competition")) return false;
        if (tab === "meal"      && !cat.includes("meal") && !cat.includes("food")) return false;
        if (tab === "volunteer" && !cat.includes("volunteer")) return false;
        if (tab === "booking"   && !cat.includes("booking") && !cat.includes("stall")) return false;
      }
      if (statusFilter === "paid"       && r.paymentStatus !== "PAID") return false;
      if (statusFilter === "free"       && r.paymentStatus === "PAID") return false;
      if (statusFilter === "checked_in" && !r.checkedIn) return false;
      if (dateFrom && r.eventDate && r.eventDate < dateFrom) return false;
      if (dateTo   && r.eventDate && r.eventDate > dateTo)   return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const fields = [r.participantName, r.regCode, r.phone, r.gotram, r.activityTitle, r.email].map(v => (v||"").toLowerCase());
        if (!fields.some(f => f.includes(q))) return false;
      }
      return true;
    });
  }, [allSource, activeCategoryTab, statusFilter, dateFrom, dateTo, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const pagedRows = filteredRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // ── KPI Summary ──────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    if (useMock) return { totalRegs: 2768, poojaRegs: 248, generalRegs: 854, activityRegs: 182, bookingRegs: 96, mealHeadcount: 1420, volunteers: 64, poojaRevenue: 124500, totalRevenue: 209900, totalExpenses: 85000, netRevenue: 124900, checkedIn: 640 };
    const poojaCount = report?.poojaRegistrationsCount ?? allSource.filter(r => r.category.toLowerCase().includes("pooja")).length;
    const generalCount = report?.generalRegistrationsCount ?? allSource.filter(r => r.category.toLowerCase().includes("general")).length;
    const actCount = report?.activityRegistrationsCount ?? allSource.filter(r => r.category.toLowerCase().includes("activity") || r.category.toLowerCase().includes("cultural")).length;
    const bookingCount = report?.bookingRegistrationsCount ?? allSource.filter(r => r.category.toLowerCase().includes("booking") || r.category.toLowerCase().includes("stall")).length;
    const mealCount = report?.mealRegistrationsCount ?? allSource.filter(r => r.category.toLowerCase().includes("meal") || r.category.toLowerCase().includes("food")).length;
    const volCount = report?.totalVolunteers ?? allSource.filter(r => r.category.toLowerCase().includes("volunteer")).length;
    const poojaRev = report?.poojaRevenue ?? allSource.filter(r => r.category.toLowerCase().includes("pooja")).reduce((s, r) => s + (r.bookingFee||0), 0);
    const totalRev = report?.totalRevenue ?? poojaRev;
    return {
      totalRegs: report?.totalRegistrations ?? allSource.length,
      poojaRegs: poojaCount, generalRegs: generalCount, activityRegs: actCount,
      bookingRegs: bookingCount, mealHeadcount: mealCount, volunteers: volCount,
      poojaRevenue: poojaRev, totalRevenue: totalRev,
      totalExpenses: report?.totalExpenses ?? 0,
      netRevenue: report?.netRevenue ?? 0,
      checkedIn: report?.totalCheckedIn ?? allSource.filter(r => r.checkedIn).length,
    };
  }, [useMock, report, allSource]);

  const pieData = useMemo(() => {
    const d = [
      { name: "Pooja Seva",       value: stats.poojaRegs,    color: "#e11d48" },
      { name: "General Passes",   value: stats.generalRegs,  color: "#4f46e5" },
      { name: "Cultural & Sports",value: stats.activityRegs, color: "#d97706" },
      { name: "Meals",            value: stats.mealHeadcount,color: "#16a34a" },
      { name: "Bookings",         value: stats.bookingRegs,  color: "#7c3aed" },
      { name: "Volunteers",       value: stats.volunteers,   color: "#0891b2" },
    ].filter(d => d.value > 0);
    return d.length ? d : [{ name: "No Registrations", value: 1, color: "#cbd5e1" }];
  }, [stats]);

  function getStatForCard(card: typeof CATEGORY_REPORT_CARDS[0]): number {
    const k = card.statKey as keyof typeof stats;
    return (stats[k] as number) ?? 0;
  }

  // ── JSX ──────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-3 pb-6">

      {/* ── Header ── */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-xs p-2.5 sm:p-3 flex flex-col md:flex-row md:items-center gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <FileText className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-black text-slate-900 leading-tight">Event Reports & Registrations</h2>
            <p className="text-[11px] text-slate-400 truncate hidden sm:block">Download verified registrant lists — Pooja sevas, passes, cultural activities, meals & volunteers</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          {!useMock && events.length > 0 && (
            <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
              <Calendar className="w-3 h-3 text-indigo-500 shrink-0" />
              <select
                value={selectedEventId ?? ""}
                onChange={e => setSelectedEventId(Number(e.target.value))}
                className="bg-transparent text-[11px] font-bold text-slate-800 focus:outline-none cursor-pointer max-w-[200px]"
              >
                {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
              </select>
            </div>
          )}
          <button
            onClick={() => handleDownloadCategoryCsv("all", "All Event Registrations")}
            disabled={downloadingCategory === "all"}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {downloadingCategory === "all" ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
            Master CSV
          </button>
          <button
            onClick={() => handlePrintRoster("Master Event Registration Roster", filteredRows)}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
          >
            <Printer className="w-3 h-3" /> Print
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && <ErrorBanner message={error} />}
      {successMsg && (
        <div className="flex items-center gap-1.5 p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold rounded-lg">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />{successMsg}
        </div>
      )}
      {loading && <LoadingSpinner label="Compiling event report and registration analytics…" />}

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        <StatCard label="Total Registrants" value={stats.totalRegs} sub="Across all modules" color="#4f46e5" icon={Users}
          progress={{ value: stats.checkedIn, max: stats.totalRegs }} />
        <StatCard label="Pooja Sevas" value={stats.poojaRegs} sub={`₹${stats.poojaRevenue.toLocaleString("en-IN")} Seva Fee`} color="#e11d48" icon={Sparkles} />
        <StatCard label="Event Passes" value={stats.generalRegs} sub={`${stats.checkedIn} checked in`} color="#4f46e5" icon={Tag} />
        <StatCard label="Cultural & Sports" value={stats.activityRegs} sub="Performers & entries" color="#d97706" icon={Award} />
        <StatCard label="Annadanam Meals" value={stats.mealHeadcount} sub="Plates requested" color="#16a34a" icon={Utensils} />
        <StatCard label="Volunteers" value={stats.volunteers} sub="On-duty shifts" color="#0891b2" icon={Shield} />
      </div>

      {/* ── Download Hub ── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-xs font-extrabold text-slate-800">Download Category Registers</h3>
            <p className="text-[10px] text-slate-400">Export dedicated CSV spreadsheets per module</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {CATEGORY_REPORT_CARDS.map(card => (
            <DownloadCard
              key={card.id}
              card={card}
              count={getStatForCard(card)}
              revenue={card.revenueKey ? (stats[card.revenueKey as keyof typeof stats] as number) : null}
              isDownloading={downloadingCategory === card.id}
              onDownload={() => handleDownloadCategoryCsv(card.id, card.title)}
              onPreview={() => {
                setActiveCategoryTab(card.id);
                document.getElementById("reg-table-section")?.scrollIntoView({ behavior: "smooth" });
              }}
            />
          ))}
        </div>
      </div>

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-2">
        {/* Donut */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 shadow-xs p-3">
          <h3 className="font-bold text-slate-800 text-[11px] mb-0.5">Registration Mix</h3>
          <p className="text-[10px] text-slate-400 mb-1.5">Volume by category</p>
          <div className="h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={58} innerRadius={34} paddingAngle={3}>
                  {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: 11 }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 10, paddingTop: 4 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Panel */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-slate-100 shadow-xs p-3 flex flex-col">
          <h3 className="font-bold text-slate-800 text-[11px] mb-0.5">Financial Overview</h3>
          <p className="text-[10px] text-slate-400 mb-2">Seva collections, donations & sponsorships vs expenses</p>

          <div className="grid grid-cols-3 gap-2 mb-2">
            <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-2 text-center">
              <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 mb-0.5">Collected</p>
              <p className="text-sm font-black text-emerald-700 tabular-nums">₹{stats.totalRevenue.toLocaleString("en-IN")}</p>
            </div>
            <div className="rounded-lg bg-rose-50 border border-rose-100 p-2 text-center">
              <p className="text-[9px] font-bold uppercase tracking-wider text-rose-600 mb-0.5">Expenses</p>
              <p className="text-sm font-black text-rose-700 tabular-nums">₹{stats.totalExpenses.toLocaleString("en-IN")}</p>
            </div>
            <div className={`rounded-lg border p-2 text-center ${stats.netRevenue >= 0 ? "bg-indigo-50 border-indigo-100" : "bg-amber-50 border-amber-100"}`}>
              <p className={`text-[9px] font-bold uppercase tracking-wider mb-0.5 ${stats.netRevenue >= 0 ? "text-indigo-600" : "text-amber-600"}`}>Net</p>
              <p className={`text-sm font-black tabular-nums ${stats.netRevenue >= 0 ? "text-indigo-700" : "text-amber-700"}`}>₹{Math.abs(stats.netRevenue).toLocaleString("en-IN")}</p>
            </div>
          </div>

          <div className="flex-1 space-y-1.5">
            {[
              { label: "Pooja Seva Fees", amount: stats.poojaRevenue, color: "#e11d48" },
              { label: "Donations", amount: report?.totalDonations ?? 0, color: "#4f46e5" },
              { label: "Sponsorships", amount: report?.totalSponsorships ?? 0, color: "#16a34a" },
            ].map(item => {
              const pct = stats.totalRevenue > 0 ? Math.round((item.amount / stats.totalRevenue) * 100) : 0;
              return (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[11px] font-semibold text-slate-600">{item.label}</span>
                    <span className="text-[11px] font-bold text-slate-800 tabular-nums">₹{item.amount.toLocaleString("en-IN")} <span className="text-slate-400 font-normal">({pct}%)</span></span>
                  </div>
                  <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: item.color }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[10px] text-slate-400">Need full audit?</span>
            <button onClick={() => handleDownloadCategoryCsv("all", "Comprehensive Financial Register")}
              className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer">
              Export Audit Register <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Registrations Table ── */}
      <div id="reg-table-section" className="bg-white rounded-xl border border-slate-100 shadow-xs overflow-hidden">

        {/* Table Header */}
        <div className="p-3 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
            <h3 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              Live Registrations Register
              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">{filteredRows.length}</span>
            </h3>
            <div className="flex flex-wrap items-center gap-1.5">
              <div className="relative">
                <Search className="w-3 h-3 text-slate-400 absolute left-2 top-1.5" />
                <input type="text" placeholder="Name, phone, gotram, code…" value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-6 pr-6 py-1.5 w-full sm:w-48 rounded-lg border border-slate-200 bg-white text-[11px] font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-300"
                />
                {searchQuery && <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1.5 text-slate-400 hover:text-slate-600"><X className="w-3 h-3" /></button>}
              </div>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-[11px] font-semibold text-slate-700 focus:outline-none cursor-pointer">
                <option value="all">All Statuses</option>
                <option value="paid">Paid Only</option>
                <option value="free">Free Entries</option>
                <option value="checked_in">Checked In</option>
              </select>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                className="px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-[11px] font-medium text-slate-700 focus:outline-none cursor-pointer" title="From date" />
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                className="px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-[11px] font-medium text-slate-700 focus:outline-none cursor-pointer" title="To date" />
              <button
                onClick={() => downloadCsvClientSide(filteredRows, `filtered_${activeCategoryTab}_${new Date().toISOString().slice(0,10)}.csv`)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all cursor-pointer"
              >
                <Download className="w-3 h-3" /> Export
              </button>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
            {CATEGORY_TABS.map(tab => {
              const count = tab.id === "all" ? allSource.length :
                allSource.filter(r => {
                  const cat = r.category.toLowerCase();
                  if (tab.id === "pooja") return cat.includes("pooja");
                  if (tab.id === "general") return cat.includes("general") || cat.includes("event");
                  if (tab.id === "activity") return cat.includes("activity") || cat.includes("cultural") || cat.includes("competition");
                  if (tab.id === "meal") return cat.includes("meal") || cat.includes("food");
                  if (tab.id === "volunteer") return cat.includes("volunteer");
                  if (tab.id === "booking") return cat.includes("booking") || cat.includes("stall");
                  return true;
                }).length;
              return (
                <button key={tab.id} onClick={() => setActiveCategoryTab(tab.id)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer border ${
                    activeCategoryTab === tab.id
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                      : "text-slate-500 border-transparent hover:bg-slate-100"
                  }`}>
                  <span>{tab.emoji}</span> {tab.label}
                  {count > 0 && <span className={`text-[9px] font-extrabold px-1 py-0.5 rounded-full ${activeCategoryTab === tab.id ? "bg-white/25 text-white" : "bg-slate-100 text-slate-500"}`}>{count}</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loadingRegs ? (
            <div className="py-8 text-center text-slate-400">
              <RefreshCw className="w-4 h-4 animate-spin inline mr-1.5 text-indigo-500" />
              <span className="text-[11px]">Loading registration records…</span>
            </div>
          ) : pagedRows.length === 0 ? (
            <div className="py-8 text-center space-y-1">
              <Users className="w-8 h-8 mx-auto text-slate-200 stroke-1" />
              <p className="text-[11px] font-semibold text-slate-500">No matching registrations</p>
              <p className="text-[10px] text-slate-400">Adjust your search, filters, or category tab</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {["Reg Code", "Participant & Gotram", "Activity / Seva", "Date & Slot", "Dev.", "Payment", "Status", ""].map(h => (
                    <th key={h} className="py-2 px-2.5 text-[9px] font-extrabold uppercase tracking-widest text-slate-400 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {pagedRows.map((row, idx) => {
                  const isPaid = row.paymentStatus === "PAID";
                  return (
                    <tr key={row.id} className={`hover:bg-indigo-50/40 transition-colors ${idx % 2 === 0 ? "" : "bg-slate-50/40"}`}>
                      <td className="py-1.5 px-2.5">
                        <p className="font-mono font-black text-indigo-600 text-[10px]">{row.regCode}</p>
                        <div className="text-[9px] font-semibold text-slate-400 mt-0.5 inline-flex items-center gap-1 px-1 py-0.5 bg-slate-100 rounded">
                          {row.category}
                        </div>
                      </td>
                      <td className="py-1.5 px-2.5 max-w-[160px]">
                        <p className="font-bold text-slate-800 text-[11px] truncate">{row.participantName}</p>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {row.phone && <span className="text-[9px] text-slate-500">{row.phone}</span>}
                          {row.gotram && <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1 rounded">G: {row.gotram}</span>}
                        </div>
                      </td>
                      <td className="py-1.5 px-2.5 max-w-[180px]">
                        <p className="font-semibold text-slate-700 text-[11px] truncate">{row.activityTitle}</p>
                        {row.venue && <p className="text-[9px] text-slate-400 truncate mt-0.5">📍 {row.venue}</p>}
                      </td>
                      <td className="py-1.5 px-2.5 whitespace-nowrap">
                        <p className="font-semibold text-slate-700 text-[10px]">{row.eventDate || "—"}</p>
                        {row.eventTime && <p className="text-[9px] text-slate-400">{row.eventTime}</p>}
                      </td>
                      <td className="py-1.5 px-2.5 text-center">
                        <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-700 font-black text-[10px] inline-flex items-center justify-center">
                          {row.devoteeCount || 1}
                        </span>
                      </td>
                      <td className="py-1.5 px-2.5 whitespace-nowrap">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold border ${
                          isPaid ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}>
                          {isPaid ? `₹${(row.bookingFee||0).toLocaleString("en-IN")}` : "FREE"}
                        </span>
                        {row.paymentMethod && <p className="text-[9px] text-slate-400 mt-0.5 truncate max-w-[80px]">{row.paymentMethod}</p>}
                      </td>
                      <td className="py-1.5 px-2.5 whitespace-nowrap">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          row.status === "CONFIRMED" || row.status === "ACTIVE" ? "bg-indigo-50 text-indigo-700" : "bg-amber-50 text-amber-700"
                        }`}>{row.status || "CONFIRMED"}</span>
                        {row.checkedIn && (
                          <span className="mt-0.5 flex items-center gap-0.5 text-[9px] font-bold text-emerald-600">
                            <CheckCircle2 className="w-2.5 h-2.5" /> In
                          </span>
                        )}
                      </td>
                      <td className="py-1.5 px-2.5 text-right">
                        <button onClick={() => setSelectedRowDetails(row)}
                          className="px-2 py-1 rounded text-[9px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 transition-colors cursor-pointer">
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {filteredRows.length > PAGE_SIZE && (
          <div className="px-3 py-2 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-medium">
              {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredRows.length)} of {filteredRows.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1 rounded border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-3 h-3 text-slate-600" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let page = i + 1;
                if (totalPages > 5) {
                  if (currentPage <= 3) page = i + 1;
                  else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
                  else page = currentPage - 2 + i;
                }
                return (
                  <button key={page} onClick={() => setCurrentPage(page)}
                    className={`w-6 h-6 rounded text-[10px] font-bold transition-all ${page === currentPage ? "bg-indigo-600 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-100"}`}>
                    {page}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1 rounded border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-3 h-3 text-slate-600" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Row Detail Modal ── */}
      {selectedRowDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4" onClick={() => setSelectedRowDetails(null)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="h-1" style={{ background: selectedRowDetails.category.toLowerCase().includes("pooja") ? "#e11d48" : "#4f46e5" }} />
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="text-[9px] font-extrabold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                    {selectedRowDetails.category}
                  </span>
                  <h3 className="text-sm font-black text-slate-900 mt-1">{selectedRowDetails.participantName}</h3>
                  <p className="text-[10px] font-mono text-slate-500">{selectedRowDetails.regCode}</p>
                </div>
                <button onClick={() => setSelectedRowDetails(null)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { label: "Phone", value: selectedRowDetails.phone },
                  { label: "Gotram", value: selectedRowDetails.gotram },
                  { label: "Email", value: selectedRowDetails.email, full: true },
                  { label: "Seva / Program", value: selectedRowDetails.activityTitle, full: true },
                  { label: "Date & Time", value: `${selectedRowDetails.eventDate || ""} ${selectedRowDetails.eventTime || ""}` },
                  { label: "Devotee Count", value: `${selectedRowDetails.devoteeCount} Devotee(s)` },
                  { label: "Venue / Mandap", value: selectedRowDetails.venue || selectedRowDetails.mandap },
                  { label: "Pandit", value: selectedRowDetails.panditName },
                  { label: "Booking Fee", value: `₹${(selectedRowDetails.bookingFee||0).toLocaleString("en-IN")} (${selectedRowDetails.paymentStatus})` },
                  { label: "Transaction ID", value: selectedRowDetails.transactionId, mono: true },
                ].filter(f => f.value).map(f => (
                  <div key={f.label} className={f.full ? "col-span-2" : ""}>
                    <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">{f.label}</p>
                    <p className={`text-[11px] font-semibold text-slate-800 truncate ${f.mono ? "font-mono text-slate-600" : ""}`}>{f.value}</p>
                  </div>
                ))}
                {selectedRowDetails.attendingDevotees && (
                  <div className="col-span-2">
                    <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">Attending Devotees</p>
                    <p className="text-[11px] text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100">{selectedRowDetails.attendingDevotees}</p>
                  </div>
                )}
                {selectedRowDetails.notes && (
                  <div className="col-span-2">
                    <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">Notes / Special Requests</p>
                    <p className="text-[11px] text-amber-900 bg-amber-50 p-2 rounded-lg border border-amber-100">{selectedRowDetails.notes}</p>
                  </div>
                )}
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100 flex justify-between items-center gap-2">
                <div className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg ${selectedRowDetails.checkedIn ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                  <CheckCircle2 className="w-3 h-3" />
                  {selectedRowDetails.checkedIn ? "Checked In" : "Not Checked In"}
                </div>
                <button onClick={() => setSelectedRowDetails(null)}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
