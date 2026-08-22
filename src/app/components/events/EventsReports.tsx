import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart3, Download, TrendingUp, Users, IndianRupee, Package, FileText,
  Search, Filter, Calendar, Clock, MapPin, Eye, Printer, CheckCircle2,
  AlertCircle, RefreshCw, Sparkles, Utensils, Shield, ChevronRight, X,
  Heart, Tag, Award, Check, Layers
} from "lucide-react";
import { useEventMock } from "./EventMockToggle";
import { ErrorBanner, LoadingSpinner } from "./shared";
import {
  eventReportService,
  type EventReportResponse,
  type EventRegistrationReportRow
} from "../../../services/events/eventReportService";
import { eventService, type EventResponse } from "../../../services/events/eventService";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend
} from "recharts";

// ── Mock Data for Demo / Testing ──────────────────────────────────────────────

const MOCK_REPORT_CARDS = [
  { id: "pooja", title: "Pooja Seva Registrations", desc: "Devotees, gotrams, sankalpam slots, pandit & seva fees", icon: Sparkles, color: "#e11d48", bg: "#ffe4e6", count: 248, rev: "₹1,24,500", category: "pooja" },
  { id: "general", title: "General Event Passes", desc: "Attendee pass holders, devotee headcount, check-ins", icon: Users, color: "#6366f1", bg: "#eef2ff", count: 854, rev: "₹85,400", category: "general" },
  { id: "activity", title: "Cultural & Competitions", desc: "Stage performers, classical dances, competition teams", icon: Award, color: "#d97706", bg: "#fffbeb", count: 182, rev: "Free Entry", category: "activity" },
  { id: "meal", title: "Annadanam / Meal Bookings", desc: "Devotee meal headcount, lunch/dinner & dietary preferences", icon: Utensils, color: "#16a34a", bg: "#f0fdf4", count: 1420, rev: "Free Seva", category: "meal" },
  { id: "volunteer", title: "Volunteer Duty Roster", desc: "Assigned volunteers, zones, shifts & duty status", icon: Shield, color: "#0891b2", bg: "#ecfeff", count: 64, rev: "Seva Team", category: "volunteer" },
  { id: "all", title: "Master Consolidated Register", desc: "Complete all-in-one export containing every registered user", icon: Layers, color: "#8b5cf6", bg: "#f5f3ff", count: 2768, rev: "₹2,09,900", category: "all" },
];

const MOCK_REGISTRATION_ROWS: EventRegistrationReportRow[] = [
  {
    id: "POOJA-101",
    regCode: "POOJA-2026-001",
    category: "Pooja Seva",
    activityTitle: "Maha Ganapathi Abhishekam",
    participantName: "Ramesh Sharma",
    email: "ramesh.sharma@example.com",
    phone: "+91 98765 43210",
    gotram: "Bharadwaj",
    devoteeCount: 4,
    attendingDevotees: "Ramesh Sharma (Self), Sunita Sharma (Wife), Rahul (Son), Ananya (Daughter)",
    eventDate: "2026-08-27",
    eventTime: "08:30 AM",
    venue: "Main Temple Mandap",
    mandap: "Mandapam A",
    panditName: "Acharya Shastri",
    bookingFee: 501.0,
    paymentStatus: "PAID",
    paymentMethod: "UPI / Online",
    transactionId: "TXN_UPI_987654321",
    status: "CONFIRMED",
    checkedIn: true,
    prasadamMode: "Mandap Collection",
    notes: "Special Sankalpam requested for family health",
    registeredAt: "2026-08-15T10:30:00"
  },
  {
    id: "POOJA-102",
    regCode: "POOJA-2026-002",
    category: "Pooja Seva",
    activityTitle: "Sahasra Modaka Ganapathi Homam",
    participantName: "Venkata Raman",
    email: "v.raman@example.com",
    phone: "+91 98450 11223",
    gotram: "Kashyapa",
    devoteeCount: 2,
    attendingDevotees: "Venkata Raman (Self), Lakshmi Raman (Wife)",
    eventDate: "2026-08-27",
    eventTime: "10:00 AM",
    venue: "Homa Kundam",
    mandap: "Mandapam B",
    panditName: "Veda Murthy Krishna",
    bookingFee: 1001.0,
    paymentStatus: "PAID",
    paymentMethod: "NetBanking",
    transactionId: "TXN_NB_554433221",
    status: "CONFIRMED",
    checkedIn: false,
    prasadamMode: "Home Delivery",
    notes: "Prasadam delivery requested to flat 402",
    registeredAt: "2026-08-16T14:15:00"
  },
  {
    id: "POOJA-103",
    regCode: "POOJA-2026-003",
    category: "Pooja Seva",
    activityTitle: "Satyanarayan Vratam",
    participantName: "Aditya Hegde",
    email: "aditya.h@example.com",
    phone: "+91 97412 88776",
    gotram: "Vasishta",
    devoteeCount: 3,
    attendingDevotees: "Aditya Hegde, Priya Hegde, Aarav Hegde",
    eventDate: "2026-08-28",
    eventTime: "05:30 PM",
    venue: "Community Main Hall",
    mandap: "Mandapam A",
    panditName: "Acharya Somayaji",
    bookingFee: 350.0,
    paymentStatus: "PAID",
    paymentMethod: "UPI / PhonePe",
    transactionId: "TXN_UPI_112233445",
    status: "CONFIRMED",
    checkedIn: false,
    prasadamMode: "Mandap Collection",
    registeredAt: "2026-08-17T09:45:00"
  },
  {
    id: "GEN-501",
    regCode: "EVT-2026-501",
    category: "General Event",
    activityTitle: "Ganesh Utsav 2026 – Main Celebration Pass",
    participantName: "Rajesh Kumar Deshmukh",
    email: "rajesh.deshmukh@example.com",
    phone: "+91 91234 56789",
    gotram: "Koundinya",
    devoteeCount: 4,
    attendingDevotees: "4 Family Members",
    eventDate: "2026-08-27",
    eventTime: "07:00 AM",
    venue: "Community Complex Grounds",
    bookingFee: 200.0,
    paymentStatus: "PAID",
    paymentMethod: "Credit Card",
    transactionId: "TXN_CC_998877665",
    status: "CONFIRMED",
    checkedIn: true,
    registeredAt: "2026-08-10T11:00:00"
  },
  {
    id: "GEN-502",
    regCode: "EVT-2026-502",
    category: "General Event",
    activityTitle: "Ganesh Utsav 2026 – Main Celebration Pass",
    participantName: "Sowmya Rao",
    email: "sowmya.rao@example.com",
    phone: "+91 94480 33445",
    gotram: "Vishwamitra",
    devoteeCount: 2,
    attendingDevotees: "Sowmya Rao, Srinivas Rao",
    eventDate: "2026-08-27",
    eventTime: "07:00 AM",
    venue: "Community Complex Grounds",
    bookingFee: 100.0,
    paymentStatus: "PAID",
    paymentMethod: "UPI",
    transactionId: "TXN_UPI_667788990",
    status: "CONFIRMED",
    checkedIn: false,
    registeredAt: "2026-08-12T16:20:00"
  },
  {
    id: "ACT-301",
    regCode: "ACT-2026-301",
    category: "Cultural / Dance",
    activityTitle: "Classical Bharatanatyam – Pushpanjali & Varnam",
    participantName: "Meenakshi Sundaram",
    email: "meenakshi.dance@example.com",
    phone: "+91 98860 77889",
    gotram: "Harita",
    devoteeCount: 1,
    attendingDevotees: "Solo Performer (Age 19)",
    eventDate: "2026-08-27",
    eventTime: "06:30 PM",
    venue: "Main Cultural Stage",
    bookingFee: 0.0,
    paymentStatus: "FREE",
    paymentMethod: "Cultural Participant Entry",
    status: "CONFIRMED",
    checkedIn: true,
    notes: "Audio track submitted in advance",
    registeredAt: "2026-08-14T10:00:00"
  },
  {
    id: "ACT-302",
    regCode: "ACT-2026-302",
    category: "Competition / Music",
    activityTitle: "Devotional Singing Competition (Junior Group)",
    participantName: "Ananya Kulkarni",
    email: "kulkarni.family@example.com",
    phone: "+91 99001 22334",
    gotram: "Gautama",
    devoteeCount: 1,
    attendingDevotees: "Solo Participant (Age 11)",
    eventDate: "2026-08-28",
    eventTime: "11:00 AM",
    venue: "Auditorium Room 2",
    bookingFee: 0.0,
    paymentStatus: "FREE",
    status: "CONFIRMED",
    checkedIn: false,
    registeredAt: "2026-08-15T18:30:00"
  },
  {
    id: "MEAL-701",
    regCode: "MEAL-2026-701",
    category: "Food & Meals",
    activityTitle: "Maha Annadanam Lunch (Pure Veg)",
    participantName: "Gopalakrishna Bhatt",
    email: "gbhatt@example.com",
    phone: "+91 94490 55667",
    devoteeCount: 4,
    eventDate: "2026-08-27",
    eventTime: "12:30 PM - 02:30 PM",
    venue: "Dining Hall & Prasad Mandap",
    bookingFee: 0.0,
    paymentStatus: "FREE",
    status: "CONFIRMED",
    notes: "No onion / No garlic requested for 2 elders",
    registeredAt: "2026-08-18T12:00:00"
  },
  {
    id: "VOL-901",
    regCode: "VOL-2026-901",
    category: "Volunteer",
    activityTitle: "Prasadam & Queue Management - Zone A",
    participantName: "Suresh Krishnamurthy",
    email: "suresh.k@example.com",
    phone: "+91 98455 99887",
    devoteeCount: 1,
    eventDate: "2026-08-27",
    eventTime: "Morning Shift (07:00 AM - 01:00 PM)",
    venue: "Zone A - Main Temple Gate",
    bookingFee: 0.0,
    paymentStatus: "FREE",
    status: "ACTIVE",
    checkedIn: true,
    registeredAt: "2026-08-10T09:00:00"
  }
];

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

  // Table filters & view state
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedRowDetails, setSelectedRowDetails] = useState<EventRegistrationReportRow | null>(null);

  // ── Load Events List ───────────────────────────────────────────────────────
  useEffect(() => {
    if (useMock) {
      setRegistrations(MOCK_REGISTRATION_ROWS);
      return;
    }
    eventService.getAllEvents()
      .then(evts => {
        setEvents(evts);
        if (evts.length > 0) {
          setSelectedEventId(evts[0].id);
          setSelectedEvent(evts[0]);
        }
      })
      .catch(() => {});
  }, [useMock]);

  // ── Load Event Report Statistics ───────────────────────────────────────────
  useEffect(() => {
    if (useMock) return;
    if (!selectedEventId) return;

    const currentEvt = events.find(e => e.id === selectedEventId) || null;
    setSelectedEvent(currentEvt);

    setLoading(true);
    setError("");
    eventReportService.getEventReport(selectedEventId)
      .then(r => setReport(r))
      .catch(e => setError(e.message ?? "Failed to load report summary"))
      .finally(() => setLoading(false));

    // Load registrations report rows
    setLoadingRegs(true);
    eventReportService.getRegistrationReport(selectedEventId, "all")
      .then(rows => setRegistrations(rows))
      .catch(e => {
        console.warn("Could not load registration list from server:", e);
        setRegistrations([]);
      })
      .finally(() => setLoadingRegs(false));
  }, [useMock, selectedEventId, events]);

  // ── Client-side CSV Helper ──────────────────────────────────────────────────
  function downloadCsvClientSide(rows: EventRegistrationReportRow[], filename: string) {
    const headers = [
      "Reg Code", "Category", "Activity / Pooja / Seva", "Participant Name", "Phone", "Email",
      "Gotram", "Devotee Count", "Attending Devotees", "Event Date", "Event Time", "Venue",
      "Mandap", "Pandit Name", "Booking Fee (INR)", "Payment Status", "Payment Method",
      "Transaction ID", "Status", "Checked In", "Prasadam Mode", "Registered At", "Notes"
    ];

    function escape(val: any) {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    }

    const csvContent = "\ufeff" + [
      headers.join(","),
      ...rows.map(r => [
        escape(r.regCode),
        escape(r.category),
        escape(r.activityTitle),
        escape(r.participantName),
        escape(r.phone),
        escape(r.email),
        escape(r.gotram),
        r.devoteeCount || 1,
        escape(r.attendingDevotees),
        escape(r.eventDate),
        escape(r.eventTime),
        escape(r.venue),
        escape(r.mandap),
        escape(r.panditName),
        (r.bookingFee || 0).toFixed(2),
        escape(r.paymentStatus),
        escape(r.paymentMethod),
        escape(r.transactionId),
        escape(r.status),
        r.checkedIn ? "YES" : "NO",
        escape(r.prasadamMode),
        escape(r.registeredAt),
        escape(r.notes),
      ].join(","))
    ].join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // ── Trigger Download for Specific Category ──────────────────────────────────
  async function handleDownloadCategoryCsv(category: string, title: string) {
    setDownloadingCategory(category);
    setSuccessMsg("");
    setError("");

    const filename = `${(selectedEvent?.title || "event").replace(/[^a-zA-Z0-9_-]/g, "_")}_${category}_registrations_${new Date().toISOString().slice(0, 10)}.csv`;

    try {
      if (useMock || !selectedEventId) {
        // Mock export
        const filtered = category === "all"
          ? MOCK_REGISTRATION_ROWS
          : MOCK_REGISTRATION_ROWS.filter(r => r.category.toLowerCase().includes(category) || category.includes(r.category.toLowerCase()));
        downloadCsvClientSide(filtered, filename);
        setSuccessMsg(`Downloaded ${title} CSV (${filtered.length} records)`);
      } else {
        // Attempt server export, fallback to client-side
        try {
          const blob = await eventReportService.exportRegistrationReportCsv(selectedEventId, category);
          const link = document.createElement("a");
          const url = URL.createObjectURL(blob);
          link.setAttribute("href", url);
          link.setAttribute("download", filename);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          setSuccessMsg(`Successfully exported ${title} CSV`);
        } catch {
          const matchingRows = category === "all"
            ? registrations
            : registrations.filter(r => r.category.toLowerCase().includes(category) || category.includes(r.category.toLowerCase()));
          downloadCsvClientSide(matchingRows, filename);
          setSuccessMsg(`Exported ${title} CSV (${matchingRows.length} records)`);
        }
      }
    } catch (err: any) {
      setError(err?.message || "Failed to download registration CSV");
    } finally {
      setDownloadingCategory(null);
      setTimeout(() => setSuccessMsg(""), 5000);
    }
  }

  // ── Print Roster / Passes ──────────────────────────────────────────────────
  function handlePrintRoster(title: string, rows: EventRegistrationReportRow[]) {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`<!DOCTYPE html><html><head><title>${title} - Mana Community</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 20px; color: #1e293b; }
        h1 { font-size: 18px; margin: 0 0 4px 0; color: #4338ca; }
        p.meta { font-size: 11px; color: #64748b; margin: 0 0 16px 0; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
        th { background: #f1f5f9; font-weight: 700; color: #334155; }
        tr:nth-child(even) { background: #f8fafc; }
        .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: bold; }
        .badge-paid { background: #dcfce7; color: #15803d; }
        .badge-free { background: #f1f5f9; color: #475569; }
        .badge-pooja { background: #ffe4e6; color: #be123c; }
        .badge-gen { background: #e0e7ff; color: #4338ca; }
        @media print { body { padding: 10mm; } }
      </style></head><body>
      <h1>${title}</h1>
      <p class="meta">Event: ${selectedEvent?.title || "Community Event"} | Date: ${new Date().toLocaleDateString()} | Total Registrants: ${rows.length}</p>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Reg Code</th>
            <th>Category</th>
            <th>Activity / Seva</th>
            <th>Participant Name</th>
            <th>Phone</th>
            <th>Gotram</th>
            <th>Devotees</th>
            <th>Date & Time</th>
            <th>Fee (INR)</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map((r, i) => `
            <tr>
              <td>${i + 1}</td>
              <td><strong>${r.regCode || "—"}</strong></td>
              <td><span class="badge ${r.category.includes("Pooja") ? "badge-pooja" : "badge-gen"}">${r.category}</span></td>
              <td>${r.activityTitle}</td>
              <td>${r.participantName}</td>
              <td>${r.phone || "—"}</td>
              <td>${r.gotram || "—"}</td>
              <td>${r.devoteeCount || 1}</td>
              <td>${r.eventDate || ""} ${r.eventTime || ""}</td>
              <td>₹${(r.bookingFee || 0).toLocaleString("en-IN")}</td>
              <td><span class="badge ${r.paymentStatus === "PAID" ? "badge-paid" : "badge-free"}">${r.status || "CONFIRMED"}</span></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </body></html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 400);
  }

  // ── Filtered Registrations for Table Preview ───────────────────────────────
  const activeRegistrations = useMemo(() => {
    const base = useMock ? MOCK_REGISTRATION_ROWS : registrations;
    return base.filter(r => {
      // Category Tab Filter
      if (activeCategoryTab !== "all") {
        const cat = activeCategoryTab.toLowerCase();
        const rowCat = r.category.toLowerCase();
        if (cat === "pooja" && !rowCat.includes("pooja")) return false;
        if (cat === "general" && !rowCat.includes("general") && !rowCat.includes("event")) return false;
        if (cat === "activity" && !rowCat.includes("activity") && !rowCat.includes("cultural") && !rowCat.includes("competition")) return false;
        if (cat === "meal" && !rowCat.includes("meal") && !rowCat.includes("food")) return false;
        if (cat === "volunteer" && !rowCat.includes("volunteer")) return false;
      }

      // Status filter
      if (statusFilter !== "all") {
        if (statusFilter === "paid" && r.paymentStatus !== "PAID") return false;
        if (statusFilter === "free" && r.paymentStatus === "PAID") return false;
        if (statusFilter === "checked_in" && !r.checkedIn) return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const name = (r.participantName || "").toLowerCase();
        const code = (r.regCode || "").toLowerCase();
        const phone = (r.phone || "").toLowerCase();
        const gotram = (r.gotram || "").toLowerCase();
        const title = (r.activityTitle || "").toLowerCase();
        const email = (r.email || "").toLowerCase();
        if (!name.includes(q) && !code.includes(q) && !phone.includes(q) && !gotram.includes(q) && !title.includes(q) && !email.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [useMock, registrations, activeCategoryTab, statusFilter, searchQuery]);

  // ── Breakdown Summary Stats ────────────────────────────────────────────────
  const statsSummary = useMemo(() => {
    if (useMock) {
      return {
        totalRegs: 2768,
        poojaRegs: 248,
        generalRegs: 854,
        activityRegs: 182,
        mealHeadcount: 1420,
        volunteers: 64,
        poojaRevenue: 124500,
        totalRevenue: 209900,
        totalExpenses: 85000,
        netSurplus: 124900,
        checkedIn: 640
      };
    }
    const currentList = registrations;
    const poojaCount = report?.poojaRegistrationsCount ?? currentList.filter(r => r.category.toLowerCase().includes("pooja")).length;
    const generalCount = report?.generalRegistrationsCount ?? currentList.filter(r => r.category.toLowerCase().includes("general")).length;
    const actCount = report?.activityRegistrationsCount ?? currentList.filter(r => r.category.toLowerCase().includes("activity") || r.category.toLowerCase().includes("cultural")).length;
    const mealCount = report?.mealRegistrationsCount ?? currentList.filter(r => r.category.toLowerCase().includes("meal") || r.category.toLowerCase().includes("food")).length;
    const volCount = report?.totalVolunteers ?? currentList.filter(r => r.category.toLowerCase().includes("volunteer")).length;
    const poojaRev = report?.poojaRevenue ?? currentList.filter(r => r.category.toLowerCase().includes("pooja")).reduce((acc, r) => acc + (r.bookingFee || 0), 0);

    return {
      totalRegs: report?.totalRegistrations ?? currentList.length,
      poojaRegs: poojaCount,
      generalRegs: generalCount,
      activityRegs: actCount,
      mealHeadcount: report?.totalDevoteesHeadcount ?? currentList.reduce((acc, r) => acc + (r.devoteeCount || 1), 0),
      volunteers: volCount,
      poojaRevenue: poojaRev,
      totalRevenue: report?.totalRevenue ?? (poojaRev + (report?.totalDonations || 0) + (report?.totalSponsorships || 0)),
      totalExpenses: report?.totalExpenses ?? 0,
      netSurplus: report?.netRevenue ?? 0,
      checkedIn: report?.totalCheckedIn ?? currentList.filter(r => r.checkedIn).length
    };
  }, [useMock, report, registrations]);

  // Distribution chart data
  const categoryDistributionData = [
    { name: "Pooja Seva", value: statsSummary.poojaRegs || 1, color: "#e11d48" },
    { name: "General Passes", value: statsSummary.generalRegs || 1, color: "#6366f1" },
    { name: "Cultural & Sports", value: statsSummary.activityRegs || 1, color: "#d97706" },
    { name: "Annadanam / Food", value: statsSummary.mealHeadcount || 1, color: "#16a34a" },
    { name: "Volunteers", value: statsSummary.volunteers || 1, color: "#0891b2" },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 pb-12">
      {/* ── Top Header & Event Selector ── */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <FileText className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                Event Reports & Registrations Download Center
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Download verified registrant lists for Pooja sevas, attendee passes, cultural activities, meals, and volunteers.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {!useMock && events.length > 0 && (
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={selectedEventId ?? ""}
                onChange={e => setSelectedEventId(Number(e.target.value))}
                className="bg-transparent text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none cursor-pointer"
              >
                {events.map(ev => (
                  <option key={ev.id} value={ev.id}>{ev.title}</option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={() => handleDownloadCategoryCsv("all", "All Event Registrations")}
            disabled={downloadingCategory === "all"}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {downloadingCategory === "all" ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Download All (Master CSV)
          </button>

          <button
            onClick={() => handlePrintRoster("Master Event Registration Roster", activeRegistrations)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
            title="Print printable attendee list"
          >
            <Printer className="w-4 h-4" /> Print Roster
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && <ErrorBanner message={error} />}
      {successMsg && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {loading && <LoadingSpinner label="Compiling event report and registration analytics…" />}

      {/* ── Executive Summary KPIs ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
        <div className="bg-white rounded-xl p-3 sm:p-3.5 border border-slate-100 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Registrants</span>
          <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">{statsSummary.totalRegs.toLocaleString()}</p>
          <span className="text-[10.5px] font-semibold text-indigo-600 mt-0.5">Across All Modules</span>
        </div>

        <div className="bg-white rounded-xl p-3 sm:p-3.5 border border-rose-100 shadow-xs flex flex-col justify-between bg-gradient-to-b from-rose-50/30 to-white">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500">Pooja Sevas</span>
          <p className="text-xl sm:text-2xl font-black text-rose-600 mt-1">{statsSummary.poojaRegs.toLocaleString()}</p>
          <span className="text-[10.5px] font-semibold text-rose-700 mt-0.5">₹{statsSummary.poojaRevenue.toLocaleString("en-IN")} Seva Fee</span>
        </div>

        <div className="bg-white rounded-xl p-3 sm:p-3.5 border border-indigo-100 shadow-xs flex flex-col justify-between bg-gradient-to-b from-indigo-50/30 to-white">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">Event Passes</span>
          <p className="text-xl sm:text-2xl font-black text-indigo-600 mt-1">{statsSummary.generalRegs.toLocaleString()}</p>
          <span className="text-[10.5px] font-semibold text-indigo-700 mt-0.5">{statsSummary.checkedIn} Checked-in</span>
        </div>

        <div className="bg-white rounded-xl p-3 sm:p-3.5 border border-amber-100 shadow-xs flex flex-col justify-between bg-gradient-to-b from-amber-50/30 to-white">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500">Cultural & Activity</span>
          <p className="text-xl sm:text-2xl font-black text-amber-600 mt-1">{statsSummary.activityRegs.toLocaleString()}</p>
          <span className="text-[10.5px] font-semibold text-amber-700 mt-0.5">Performers & Entries</span>
        </div>

        <div className="bg-white rounded-xl p-3 sm:p-3.5 border border-emerald-100 shadow-xs flex flex-col justify-between bg-gradient-to-b from-emerald-50/30 to-white">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">Annadanam Meals</span>
          <p className="text-xl sm:text-2xl font-black text-emerald-600 mt-1">{statsSummary.mealHeadcount.toLocaleString()}</p>
          <span className="text-[10.5px] font-semibold text-emerald-700 mt-0.5">Plates Requested</span>
        </div>

        <div className="bg-white rounded-xl p-3 sm:p-3.5 border border-cyan-100 shadow-xs flex flex-col justify-between bg-gradient-to-b from-cyan-50/30 to-white">
          <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-600">Volunteers & Seva</span>
          <p className="text-xl sm:text-2xl font-black text-cyan-700 mt-1">{statsSummary.volunteers.toLocaleString()}</p>
          <span className="text-[10.5px] font-semibold text-cyan-800 mt-0.5">On-Duty Shifts</span>
        </div>
      </div>

      {/* ── Module-Specific Download Hub Cards ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-800">
              Download Category Registers & Reports
            </h3>
            <p className="text-xs text-slate-400">
              Export dedicated Excel/CSV spreadsheets containing complete registrant phone numbers, gotrams, and payment records.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {MOCK_REPORT_CARDS.map(card => {
            const Icon = card.icon;
            const isDownloading = downloadingCategory === card.category;

            let liveCount = card.count;
            if (!useMock && registrations.length > 0) {
              if (card.category === "pooja") liveCount = statsSummary.poojaRegs;
              else if (card.category === "general") liveCount = statsSummary.generalRegs;
              else if (card.category === "activity") liveCount = statsSummary.activityRegs;
              else if (card.category === "meal") liveCount = statsSummary.mealHeadcount;
              else if (card.category === "volunteer") liveCount = statsSummary.volunteers;
              else if (card.category === "all") liveCount = statsSummary.totalRegs;
            }

            return (
              <div
                key={card.id}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-xs hover:shadow-md hover:border-indigo-100 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105"
                      style={{ background: card.bg, color: card.color }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                      {liveCount.toLocaleString()} Registrations
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-indigo-600 transition-colors">
                    {card.title}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">
                    {card.desc}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => handleDownloadCategoryCsv(card.category, card.title)}
                    disabled={isDownloading}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isDownloading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    Download CSV
                  </button>

                  <button
                    onClick={() => {
                      setActiveCategoryTab(card.category);
                      const el = document.getElementById("registrations-preview-section");
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="flex items-center justify-center gap-1 p-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer"
                    title="Preview registrants in table below"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Preview</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Interactive Registrant Search, Filters & Data Table ── */}
      <div id="registrations-preview-section" className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Table Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              Live Registrations Register ({activeRegistrations.length})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Review and search all attendees, pooja sankalpams, and activity entries before exporting.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search name, phone, gotram, code..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="paid">Paid Sevas / Passes</option>
              <option value="free">Free Entries</option>
              <option value="checked_in">Checked In Only</option>
            </select>

            <button
              onClick={() => downloadCsvClientSide(activeRegistrations, `filtered_registrations_${activeCategoryTab}_${new Date().toISOString().slice(0,10)}.csv`)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" /> Export Filtered
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="px-4 py-2 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto bg-white">
          {[
            { id: "all", label: "All Registrations" },
            { id: "pooja", label: "🕉️ Pooja Seva" },
            { id: "general", label: "🎟️ Event Passes" },
            { id: "activity", label: "🎭 Cultural & Competitions" },
            { id: "meal", label: "🍲 Annadanam Meals" },
            { id: "volunteer", label: "🤝 Volunteers" },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveCategoryTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeCategoryTab === tab.id
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          {loadingRegs ? (
            <div className="py-12 text-center text-xs text-slate-400">
              <RefreshCw className="w-5 h-5 animate-spin inline mr-2 text-indigo-500" />
              Loading registration records...
            </div>
          ) : activeRegistrations.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-1">
              <Users className="w-8 h-8 mx-auto text-slate-300 stroke-1" />
              <p className="text-xs font-semibold text-slate-600">No matching registration records found</p>
              <p className="text-[11px]">Try adjusting your search query or category filter</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
                  <th className="py-3 px-3.5">Reg Code</th>
                  <th className="py-3 px-3.5">Participant & Gotram</th>
                  <th className="py-3 px-3.5">Activity / Seva Details</th>
                  <th className="py-3 px-3.5">Date & Slot</th>
                  <th className="py-3 px-3.5 text-center">Devotees</th>
                  <th className="py-3 px-3.5">Payment</th>
                  <th className="py-3 px-3.5">Status</th>
                  <th className="py-3 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeRegistrations.slice(0, 100).map(row => {
                  const isPooja = row.category.toLowerCase().includes("pooja");
                  const isPaid = row.paymentStatus === "PAID";

                  return (
                    <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3.5 font-mono font-bold text-indigo-600">
                        {row.regCode}
                        <div className="text-[9.5px] font-sans font-semibold text-slate-400">
                          {row.category}
                        </div>
                      </td>
                      <td className="py-3 px-3.5">
                        <p className="font-bold text-slate-800">{row.participantName}</p>
                        <div className="flex items-center gap-2 text-[10.5px] text-slate-500 mt-0.5">
                          {row.phone && <span>📞 {row.phone}</span>}
                          {row.gotram && <span className="text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded">Gotram: {row.gotram}</span>}
                        </div>
                      </td>
                      <td className="py-3 px-3.5 max-w-[200px]">
                        <p className="font-semibold text-slate-700 truncate">{row.activityTitle}</p>
                        {row.venue && <p className="text-[10px] text-slate-400 truncate">📍 {row.venue}</p>}
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <p className="font-medium text-slate-700">{row.eventDate || "—"}</p>
                        {row.eventTime && <p className="text-[10.5px] text-slate-400">{row.eventTime}</p>}
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <span className="font-bold text-slate-700">{row.devoteeCount || 1}</span>
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isPaid ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-600"
                        }`}>
                          {isPaid ? `₹${(row.bookingFee || 0).toLocaleString("en-IN")}` : "FREE"}
                        </span>
                        {row.paymentMethod && (
                          <div className="text-[9.5px] text-slate-400 mt-0.5">{row.paymentMethod}</div>
                        )}
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          row.status === "CONFIRMED" || row.status === "ACTIVE"
                            ? "bg-indigo-50 text-indigo-700"
                            : "bg-amber-50 text-amber-700"
                        }`}>
                          {row.status || "CONFIRMED"}
                        </span>
                        {row.checkedIn && (
                          <span className="ml-1.5 text-[10px] font-bold text-emerald-600">✓ In</span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        <button
                          onClick={() => setSelectedRowDetails(row)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors cursor-pointer"
                        >
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

        {activeRegistrations.length > 100 && (
          <div className="p-3 text-center text-xs text-slate-400 bg-slate-50 border-t border-slate-100">
            Showing first 100 of {activeRegistrations.length} registrations. Download full CSV to view all records.
          </div>
        )}
      </div>

      {/* ── Row Details Modal ── */}
      {selectedRowDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4" onClick={() => setSelectedRowDetails(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-5 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">{selectedRowDetails.category}</span>
                <h3 className="text-base font-bold text-slate-900">{selectedRowDetails.participantName}</h3>
              </div>
              <button onClick={() => setSelectedRowDetails(null)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Registration Code</p>
                <p className="font-mono font-bold text-slate-800">{selectedRowDetails.regCode}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Gotram</p>
                <p className="font-semibold text-slate-800">{selectedRowDetails.gotram || "—"}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Phone Number</p>
                <p className="font-semibold text-slate-800">{selectedRowDetails.phone || "—"}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Email</p>
                <p className="font-semibold text-slate-800 truncate">{selectedRowDetails.email || "—"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Seva / Program</p>
                <p className="font-semibold text-slate-800">{selectedRowDetails.activityTitle}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Date & Slot</p>
                <p className="font-semibold text-slate-800">{selectedRowDetails.eventDate} {selectedRowDetails.eventTime}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Devotee Count</p>
                <p className="font-semibold text-slate-800">{selectedRowDetails.devoteeCount} Devotee(s)</p>
              </div>
              {selectedRowDetails.attendingDevotees && (
                <div className="col-span-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Attending Family Devotees</p>
                  <p className="text-xs text-slate-700 bg-slate-50 p-2 rounded-lg mt-0.5 border border-slate-100">{selectedRowDetails.attendingDevotees}</p>
                </div>
              )}
              {selectedRowDetails.mandap && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Mandapam / Pandit</p>
                  <p className="font-semibold text-slate-800">{selectedRowDetails.mandap} ({selectedRowDetails.panditName || "Assigned Pandit"})</p>
                </div>
              )}
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Payment & Fee</p>
                <p className="font-bold text-emerald-700">₹{(selectedRowDetails.bookingFee || 0).toLocaleString("en-IN")} ({selectedRowDetails.paymentStatus})</p>
              </div>
              {selectedRowDetails.transactionId && (
                <div className="col-span-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Transaction ID</p>
                  <p className="font-mono text-[11px] text-slate-600 truncate">{selectedRowDetails.transactionId}</p>
                </div>
              )}
              {selectedRowDetails.notes && (
                <div className="col-span-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Notes / Special Requests</p>
                  <p className="text-xs text-slate-600 bg-amber-50/50 p-2 rounded-lg border border-amber-100 text-amber-900">{selectedRowDetails.notes}</p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => setSelectedRowDetails(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Category Distribution Visuals ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-xs">
          <h3 className="font-bold text-slate-800 text-sm mb-1">Registration Category Mix</h3>
          <p className="text-xs text-slate-400 mb-4">Volume distribution across event functions</p>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryDistributionData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  innerRadius={45}
                  paddingAngle={3}
                >
                  {categoryDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: 12 }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-sm mb-1">Event Revenue & Collections Overview</h3>
            <p className="text-xs text-slate-400 mb-4">Seva bookings, sponsorships, donations vs module expenses</p>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
                <span className="text-xs font-bold text-emerald-800">Total Seva & Registration Collections</span>
                <span className="text-sm font-black text-emerald-700">₹{statsSummary.totalRevenue.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-rose-50/60 border border-rose-100">
                <span className="text-xs font-bold text-rose-800">Total Incurred Event Expenses</span>
                <span className="text-sm font-black text-rose-700">₹{statsSummary.totalExpenses.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-50/60 border border-indigo-100">
                <span className="text-xs font-bold text-indigo-800">Net Event Balance</span>
                <span className="text-sm font-black text-indigo-700">₹{statsSummary.netSurplus.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between">
            <span className="text-xs text-slate-500">Need full financial audit report?</span>
            <button
              onClick={() => handleDownloadCategoryCsv("all", "Comprehensive Financial & Registration Register")}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
            >
              Export Audit Register →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
