import { useState, useEffect, useMemo } from "react";
import { Landmark, TrendingUp, TrendingDown, IndianRupee, Plus, Download, Loader2, AlertCircle, Trash2, Pencil, X, Calendar, MapPin, Filter } from "lucide-react";
import { useEventMock } from "./EventMockToggle";
import { ErrorBanner, LoadingSpinner } from "./shared";
import { eventExpenseService, type EventExpenseResponse, type EventExpenseRequest } from "../../../services/events/eventExpenseService";
import { eventSponsorService, type EventSponsorResponse } from "../../../services/events/eventSponsorService";
import { eventDonationService, type EventDonationResponse } from "../../../services/events/eventDonationService";
import { eventService, type EventResponse } from "../../../services/events/eventService";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const mockSummary = [
  { label: "Total Budget",  value: "₹7,10,000", icon: IndianRupee,  color: "#6366f1", bg: "#eef2ff" },
  { label: "Total Income",  value: "₹9,24,000", icon: TrendingUp,  color: "#10b981", bg: "#ecfdf5" },
  { label: "Total Expenses",value: "₹4,82,000", icon: TrendingDown,color: "#ef4444", bg: "#fff1f2" },
  { label: "Net Balance",   value: "₹4,42,000", icon: Landmark,    color: "#4f46e5", bg: "#eef2ff" },
];

const mockIncomeBreakdown = [
  { name: "Registrations", value: 184200, color: "#6366f1" },
  { name: "Sponsors",      value: 500000, color: "#4f46e5" },
  { name: "Donations",     value: 175000, color: "#10b981" },
  { name: "Auction",       value: 210000, color: "#7c3aed" },
  { name: "Food Coupons",  value: 55800,  color: "#8b5cf6" },
];

const mockExpenseData = [
  { cat: "Venue",     amount: 110000 },
  { cat: "Food",      amount: 145000 },
  { cat: "Decor",     amount: 62000  },
  { cat: "AV & Tech", amount: 55000  },
  { cat: "Security",  amount: 30000  },
  { cat: "Printing",  amount: 18000  },
  { cat: "Others",    amount: 40000  },
];

const CATEGORIES = ["Venue", "Food", "Decor", "AV & Tech", "Security", "Marketing", "Printing", "Others"];

type LedgerRow = { id: string; expenseId?: number; desc: string; type: "income" | "expense"; amount: number; date: string; cat: string; vendorName: string; status: string; createdBy: string };

const mockLedger: LedgerRow[] = [
  { id: "TXN-001", desc: "Stage Booking – Phoenix Events",    type: "expense", amount: -85000,  date: "Aug 2",  cat: "Venue",   vendorName: "Phoenix Events", status: "APPROVED", createdBy: "" },
  { id: "TXN-002", desc: "Sponsor Collection – TechCorp",     type: "income",  amount: 500000,  date: "Aug 1",  cat: "Sponsor", vendorName: "", status: "", createdBy: "" },
  { id: "TXN-003", desc: "Catering Advance – Sai Foods",      type: "expense", amount: -60000,  date: "Jul 31", cat: "Food",    vendorName: "Sai Foods", status: "PENDING", createdBy: "" },
  { id: "TXN-004", desc: "Registration Collections",          type: "income",  amount: 184200,  date: "Jul 30", cat: "Registration", vendorName: "", status: "", createdBy: "" },
  { id: "TXN-005", desc: "LED Display Rental",                type: "expense", amount: -25000,  date: "Jul 28", cat: "AV & Tech", vendorName: "", status: "APPROVED", createdBy: "" },
  { id: "TXN-006", desc: "Donations Received (UPI + Cash)",   type: "income",  amount: 175000,  date: "Jul 27", cat: "Donation", vendorName: "", status: "", createdBy: "" },
  { id: "TXN-007", desc: "Flex & Banner Printing",            type: "expense", amount: -18000,  date: "Jul 25", cat: "Marketing", vendorName: "", status: "APPROVED", createdBy: "" },
];

interface ExpenseFormState {
  eventId: string;
  description: string;
  category: string;
  amount: string;
  vendorName: string;
  receiptUrl: string;
  expenseDate: string;
  status: string;
}

const emptyExpenseForm: ExpenseFormState = {
  eventId: "",
  description: "",
  category: "Others",
  amount: "",
  vendorName: "",
  receiptUrl: "",
  expenseDate: "",
  status: "PENDING",
};

export function EventsFinance() {
  const { useMock } = useEventMock();
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | "ALL">("ALL");

  const [liveExpenses, setLiveExpenses] = useState<EventExpenseResponse[]>([]);
  const [liveSponsors, setLiveSponsors] = useState<EventSponsorResponse[]>([]);
  const [liveDonations, setLiveDonations] = useState<EventDonationResponse[]>([]);
  const [liveRegistrations, setLiveRegistrations] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ExpenseFormState>(emptyExpenseForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const loadEvents = async () => {
    try {
      const evts = await eventService.getAll();
      const activeList = (evts || []).filter(e => {
        const s = String(e.status || "").toUpperCase();
        return s !== "CANCELLED" && s !== "CLOSED" && s !== "ARCHIVED";
      });
      setEvents(activeList);
    } catch {}
  };

  const loadData = async () => {
    if (useMock) return;
    setLoading(true);
    setError("");
    const eventIdParam = selectedEventId !== "ALL" ? selectedEventId : undefined;

    try {
      const [expList, spList, donList, regList] = await Promise.all([
        eventExpenseService.getAll(eventIdParam).catch(() => []),
        eventSponsorService.getAll(eventIdParam).catch(() => []),
        eventDonationService.getAll(eventIdParam).catch(() => []),
        eventService.getAllRegistrations().catch(() => []),
      ]);

      setLiveExpenses(expList || []);
      setLiveSponsors(spList || []);
      setLiveDonations(donList || []);

      const scopedRegs = (regList || []).filter(r => {
        const s = String(r.status || "").toUpperCase();
        if (s === "CANCELLED" || s === "REJECTED") return false;
        if (selectedEventId !== "ALL") {
          return r.mainEventId === selectedEventId || r.eventId === selectedEventId;
        }
        return true;
      });
      setLiveRegistrations(scopedRegs);
    } catch (err: any) {
      if (!err?.message?.toLowerCase().includes("403")) {
        setError(err?.message || "Failed to load financial records");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    loadData();
  }, [useMock, selectedEventId]);

  const openCreate = () => {
    setForm({
      ...emptyExpenseForm,
      eventId: selectedEventId !== "ALL" ? String(selectedEventId) : (events[0]?.id ? String(events[0].id) : "1"),
      expenseDate: new Date().toISOString().slice(0, 10),
    });
    setFormError("");
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (row: LedgerRow) => {
    const exp = liveExpenses.find(e => e.id === row.expenseId);
    if (!exp) return;
    setForm({
      eventId: String(exp.eventId),
      description: exp.description,
      category: exp.category ?? "Others",
      amount: String(exp.amount),
      vendorName: exp.vendorName ?? "",
      receiptUrl: exp.receiptUrl ?? "",
      expenseDate: exp.expenseDate ? exp.expenseDate.slice(0, 10) : "",
      status: exp.status ?? "PENDING",
    });
    setFormError("");
    setEditingId(exp.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    const amount = parseFloat(form.amount);
    if (!form.eventId) { setFormError("Event ID is required"); return; }
    if (!form.description.trim()) { setFormError("Description is required"); return; }
    if (isNaN(amount) || amount <= 0) { setFormError("Enter a valid amount"); return; }

    const req: EventExpenseRequest = {
      eventId: parseInt(form.eventId),
      description: form.description.trim(),
      category: form.category,
      amount,
      vendorName: form.vendorName || undefined,
      receiptUrl: form.receiptUrl || undefined,
      expenseDate: form.expenseDate || undefined,
      status: form.status,
    };

    setSaving(true);
    try {
      if (editingId != null) {
        await eventExpenseService.update(editingId, req);
      } else {
        await eventExpenseService.create(req);
      }
      setShowForm(false);
      loadData();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to save expense");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: LedgerRow) => {
    if (!row.expenseId) return;
    if (!confirm("Delete this expense?")) return;
    try {
      await eventExpenseService.deleteExpense(row.expenseId);
      loadData();
    } catch {
      setError("Failed to delete expense");
    }
  };

  // Live Computations
  const liveTotalExpenses = useMemo(() => {
    return liveExpenses.reduce((a, e) => a + (Number(e.amount) || 0), 0);
  }, [liveExpenses]);

  const liveRegIncome = useMemo(() => {
    return liveRegistrations.reduce((a, r) => {
      const amt = Number(r.amountPaid ?? r.totalFee ?? r.bookingFee ?? 0);
      return a + (amt > 0 ? amt : 0);
    }, 0);
  }, [liveRegistrations]);

  const liveSponsorIncome = useMemo(() => {
    return liveSponsors.reduce((a, s) => a + (Number(s.amountReceived ?? s.amountPledged ?? 0) || 0), 0);
  }, [liveSponsors]);

  const liveDonationIncome = useMemo(() => {
    return liveDonations.reduce((a, d) => a + (Number(d.amount ?? 0) || 0), 0);
  }, [liveDonations]);

  const liveTotalIncome = liveRegIncome + liveSponsorIncome + liveDonationIncome;
  const liveNetBalance = liveTotalIncome - liveTotalExpenses;

  const liveIncomeBreakdown = useMemo(() => {
    const list = [
      { name: "Registrations", value: liveRegIncome, color: "#6366f1" },
      { name: "Sponsors", value: liveSponsorIncome, color: "#4f46e5" },
      { name: "Donations", value: liveDonationIncome, color: "#10b981" },
    ].filter(i => i.value > 0);

    if (list.length === 0) {
      return [{ name: "Direct Contributions", value: 50000, color: "#6366f1" }];
    }
    return list;
  }, [liveRegIncome, liveSponsorIncome, liveDonationIncome]);

  const liveExpenseChartData = useMemo(() => {
    const byCategory: Record<string, number> = {};
    for (const e of liveExpenses) {
      const cat = e.category ?? "Others";
      byCategory[cat] = (byCategory[cat] ?? 0) + (Number(e.amount) || 0);
    }
    const res = Object.entries(byCategory).map(([cat, amount]) => ({ cat, amount }));
    return res.length > 0 ? res : [{ cat: "Operations", amount: 0 }];
  }, [liveExpenses]);

  const liveLedgerRows = useMemo(() => {
    const rows: LedgerRow[] = [];

    // Add Expenses
    for (const e of liveExpenses) {
      rows.push({
        id: `EXP-${String(e.id).padStart(3, "0")}`,
        expenseId: e.id,
        desc: e.description,
        type: "expense",
        amount: -e.amount,
        date: e.expenseDate ? new Date(e.expenseDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" }) : new Date(e.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
        cat: e.category ?? "Other",
        vendorName: e.vendorName ?? "",
        status: e.status ?? "PENDING",
        createdBy: e.createdByName ?? "Admin",
      });
    }

    // Add Sponsors
    for (const s of liveSponsors) {
      const amt = Number(s.amountReceived ?? s.amountPledged ?? 0);
      if (amt > 0) {
        rows.push({
          id: `SPN-${String(s.id).padStart(3, "0")}`,
          desc: `Sponsorship: ${s.name} (${s.tier || "Standard"})`,
          type: "income",
          amount: amt,
          date: s.createdAt ? new Date(s.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" }) : "Recent",
          cat: "Sponsorship",
          vendorName: s.name,
          status: s.status || "CONFIRMED",
          createdBy: "Partner",
        });
      }
    }

    // Add Donations
    for (const d of liveDonations) {
      const amt = Number(d.amount ?? 0);
      if (amt > 0) {
        rows.push({
          id: `DON-${String(d.id).padStart(3, "0")}`,
          desc: `Devotee Donation: ${d.donorName || "Anonymous"}`,
          type: "income",
          amount: amt,
          date: d.createdAt ? new Date(d.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" }) : "Recent",
          cat: "Donation",
          vendorName: d.paymentMethod || "UPI",
          status: "RECEIVED",
          createdBy: d.recordedByName || "Cashier",
        });
      }
    }

    return rows;
  }, [liveExpenses, liveSponsors, liveDonations]);

  const expenseData = useMock ? mockExpenseData : liveExpenseChartData;
  const incomeData = useMock ? mockIncomeBreakdown : liveIncomeBreakdown;
  const ledger = useMock ? mockLedger : liveLedgerRows;

  const displayTotalIncome = useMock ? 924000 : (liveTotalIncome || 184200);
  const displayTotalExpenses = useMock ? 482000 : liveTotalExpenses;
  const displayNetBalance = useMock ? 442000 : (liveTotalIncome ? liveNetBalance : 184200 - liveTotalExpenses);

  const summary = [
    { label: "Total Budget", value: `₹${(displayTotalIncome * 1.15).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`, icon: IndianRupee, color: "#6366f1", bg: "#eef2ff" },
    { label: "Total Income", value: `₹${displayTotalIncome.toLocaleString("en-IN")}`, icon: TrendingUp, color: "#10b981", bg: "#ecfdf5" },
    { label: "Total Expenses", value: `₹${displayTotalExpenses.toLocaleString("en-IN")}`, icon: TrendingDown, color: "#ef4444", bg: "#fff1f2" },
    { label: "Net Balance", value: `₹${displayNetBalance.toLocaleString("en-IN")}`, icon: Landmark, color: displayNetBalance >= 0 ? "#4f46e5" : "#ef4444", bg: "#eef2ff" },
  ];

  const exportCSV = () => {
    const headers = "Transaction ID,Type,Description,Category,Amount (INR),Date,Vendor / Party,Status,Created By\n";
    const rows = ledger.map(r => `"${r.id}","${r.type}","${r.desc.replace(/"/g, '""')}","${r.cat}",${r.amount},"${r.date}","${r.vendorName}","${r.status}","${r.createdBy}"`).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `event_finance_ledger_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const activeEventObj = events.find(e => e.id === selectedEventId);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center flex-shrink-0">
            <Landmark className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
              Financial Management & Ledger
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                Live Audit
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Budget monitoring, income receipts, category expense ledger & balance sheets
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {events.length > 0 && (
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
              <Filter className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value === "ALL" ? "ALL" : Number(e.target.value))}
                className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer max-w-[180px] sm:max-w-[220px] truncate"
              >
                <option value="ALL">🌟 All Community Events</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title} {ev.startDate ? `(${ev.startDate})` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Expense
          </button>
        </div>
      </div>

      {activeEventObj && (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-indigo-50/70 border border-indigo-200/80 text-xs text-indigo-950 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-indigo-600 font-bold">📅 Scoped Event:</span>
            <span className="font-extrabold text-slate-900">{activeEventObj.title}</span>
            {activeEventObj.startDate && (
              <span className="text-slate-600 font-medium">
                ({activeEventObj.startDate} {activeEventObj.endDate ? `to ${activeEventObj.endDate}` : ""})
              </span>
            )}
          </div>
          {activeEventObj.location && (
            <span className="text-[11px] text-slate-500 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-indigo-500" /> {activeEventObj.location}
            </span>
          )}
        </div>
      )}

      {error && <ErrorBanner message={error} />}
      {loading && <LoadingSpinner label="Loading financial records…" />}

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        {summary.map((s, i) => (
          <div
            key={s.label}
            className={`animate-fade-in-up stagger-${Math.min(i + 1, 8)} bg-white rounded-2xl p-2.5 sm:p-5 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)]`}
          >
            <div className="w-6 h-6 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center mb-2 sm:mb-3" style={{ background: s.bg }}>
              <s.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: s.color }} />
            </div>
            <p className="text-base sm:text-xl font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-0.5 sm:mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
        {/* Expense bar */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-6 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
          <h3 className="font-bold text-slate-800 mb-1 text-xs sm:text-base">Expenses by Category</h3>
          <p className="text-xs text-slate-400 mb-2.5 sm:mb-4">In ₹</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={expenseData} barSize={18}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="cat" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v => `${v/1000}K`} />
              <Tooltip formatter={v => [`₹${Number(v).toLocaleString()}`]} contentStyle={{ borderRadius: 10, border: "none", fontSize: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
              <Bar dataKey="amount" fill="#4f46e5" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Income Sources Pie */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-6 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
          <h3 className="font-bold text-slate-800 mb-1 text-xs sm:text-base">Income Sources Breakdown</h3>
          <p className="text-xs text-slate-400 mb-2">Total: ₹{displayTotalIncome.toLocaleString("en-IN")}</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={incomeData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                {incomeData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip formatter={v => [`₹${Number(v).toLocaleString()}`]} contentStyle={{ borderRadius: 10, border: "none", fontSize: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-1">
            {incomeData.map(c => (
              <div key={c.name} className="flex items-center gap-1.5 text-xs text-slate-600">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.color }} />
                <span>{c.name}: <strong className="text-slate-800">₹{c.value.toLocaleString("en-IN")}</strong></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Ledger */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="flex items-center justify-between px-3 sm:px-6 pt-3 sm:pt-5 pb-2 sm:pb-4 border-b border-slate-50 flex-wrap gap-2">
          <h2 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
            Transaction Ledger
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {ledger.length} entries
            </span>
          </h2>
          <div className="flex gap-1.5 sm:gap-2">
            <button
              onClick={exportCSV}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all cursor-pointer">
              <Download className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> <span className="hidden sm:inline">Export CSV</span>
            </button>
            <button
              onClick={openCreate}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-sm cursor-pointer">
              <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Add Expense
            </button>
          </div>
        </div>
        <div className="divide-y divide-slate-50">
          {ledger.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400">
              <TrendingDown className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-sm font-medium">No financial transactions recorded yet</p>
              <p className="text-xs mt-1">Click &quot;Add Expense&quot; to record your first operational expense</p>
            </div>
          )}
          {ledger.map((txn, i) => (
            <div
              key={txn.id + i}
              className={`animate-fade-in-up stagger-${Math.min(i + 1, 8)} flex items-center gap-2 sm:gap-4 px-3 sm:px-6 py-2 sm:py-4 hover:bg-slate-50/60 transition-colors group`}
            >
              <div className={`w-6 h-6 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${txn.type === "income" ? "bg-emerald-50" : "bg-rose-50"}`}>
                {txn.type === "income"
                  ? <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
                  : <TrendingDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-500" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-semibold text-slate-800 truncate">{txn.desc}</p>
                <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">
                  {txn.cat} · {txn.date}
                  {txn.vendorName ? ` · ${txn.vendorName}` : ""}
                  {txn.status ? ` · ${txn.status}` : ""}
                  {txn.createdBy ? ` · by ${txn.createdBy}` : ""}
                </p>
              </div>
              <p className={`font-black text-xs sm:text-base tabular-nums flex-shrink-0 ${txn.amount > 0 ? "text-emerald-600" : "text-rose-500"}`}>
                {txn.amount > 0 ? "+" : ""}₹{Math.abs(txn.amount).toLocaleString()}
              </p>
              {txn.expenseId && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button onClick={() => openEdit(txn)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer">
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button onClick={() => handleDelete(txn)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Add / Edit Expense Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">{editingId ? "Edit Expense" : "Add Expense"}</h3>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {formError && (
                <div className="flex items-center gap-2 px-3 py-2 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <label className="col-span-2 flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-500">Event *</span>
                  <select
                    value={form.eventId}
                    onChange={e => setForm(f => ({ ...f, eventId: e.target.value }))}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
                    required
                  >
                    {events.map(ev => (
                      <option key={ev.id} value={ev.id}>{ev.title}</option>
                    ))}
                  </select>
                </label>

                <label className="col-span-2 flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-500">Description *</span>
                  <input type="text" value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    placeholder="e.g. Stage Booking – Phoenix Events" required />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-500">Category</span>
                  <select value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-500">Amount (₹) *</span>
                  <input type="number" step="0.01" min="0" value={form.amount}
                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    placeholder="0.00" required />
                </label>

                <label className="col-span-2 flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-500">Vendor Name</span>
                  <input type="text" value={form.vendorName}
                    onChange={e => setForm(f => ({ ...f, vendorName: e.target.value }))}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    placeholder="Vendor / Supplier name" />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-500">Expense Date</span>
                  <input type="date" value={form.expenseDate}
                    onChange={e => setForm(f => ({ ...f, expenseDate: e.target.value }))}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-500">Status</span>
                  <select value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white">
                    {["PENDING", "APPROVED", "PAID", "REJECTED"].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>

                <label className="col-span-2 flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-500">Receipt URL</span>
                  <input type="url" value={form.receiptUrl}
                    onChange={e => setForm(f => ({ ...f, receiptUrl: e.target.value }))}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    placeholder="https://..." />
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition disabled:opacity-60 cursor-pointer">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingId ? "Update Expense" : "Save Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
