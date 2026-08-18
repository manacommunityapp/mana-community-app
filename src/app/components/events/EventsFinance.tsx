import { useState, useEffect } from "react";
import { Landmark, TrendingUp, TrendingDown, IndianRupee, Plus, Download, Loader2, AlertCircle, Trash2, Pencil } from "lucide-react";
import { useEventMock } from "./EventMockToggle";
import { ErrorBanner, LoadingSpinner } from "./shared";
import { eventExpenseService, type EventExpenseResponse, type EventExpenseRequest } from "../../../services/events/eventExpenseService";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const mockSummary = [
  { label: "Total Budget",  value: "₹7,10,000", icon: IndianRupee,  color: "#6366f1", bg: "#eef2ff" },
  { label: "Total Income",  value: "₹9,24,000", icon: TrendingUp,  color: "#10b981", bg: "#ecfdf5" },
  { label: "Total Expenses",value: "₹4,82,000", icon: TrendingDown,color: "#ef4444", bg: "#fff1f2" },
  { label: "Net Balance",   value: "₹4,42,000", icon: Landmark,    color: "#4f46e5", bg: "#eef2ff" },
];

const incomeBreakdown = [
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

type LedgerRow = { id: string; expenseId?: number; desc: string; type: string; amount: number; date: string; cat: string; vendorName: string; status: string; createdBy: string };

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

function mapLiveExpenses(data: EventExpenseResponse[]): { ledger: LedgerRow[]; chartData: { cat: string; amount: number }[]; total: number } {
  const ledger: LedgerRow[] = data.map(e => ({
    id: `TXN-${String(e.id).padStart(3, "0")}`,
    expenseId: e.id,
    desc: e.description,
    type: "expense",
    amount: -e.amount,
    date: e.expenseDate ? new Date(e.expenseDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" }) : new Date(e.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
    cat: e.category ?? "Other",
    vendorName: e.vendorName ?? "",
    status: e.status ?? "",
    createdBy: e.createdByName ?? "",
  }));

  const byCategory: Record<string, number> = {};
  for (const e of data) {
    const cat = e.category ?? "Other";
    byCategory[cat] = (byCategory[cat] ?? 0) + e.amount;
  }
  const chartData = Object.entries(byCategory).map(([cat, amount]) => ({ cat, amount }));
  const total = data.reduce((a, e) => a + e.amount, 0);

  return { ledger, chartData, total };
}

export function EventsFinance() {
  const { useMock } = useEventMock();
  const [liveExpenses, setLiveExpenses] = useState<EventExpenseResponse[]>([]);
  const [liveLedger, setLiveLedger] = useState<LedgerRow[]>([]);
  const [liveChartData, setLiveChartData] = useState<{ cat: string; amount: number }[]>([]);
  const [liveTotal, setLiveTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ExpenseFormState>(emptyExpenseForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  const load = () => {
    if (useMock) return;
    setLoading(true);
    setError("");
    eventExpenseService.getAll()
      .then(data => {
        setLiveExpenses(data);
        const { ledger, chartData, total } = mapLiveExpenses(data);
        setLiveLedger(ledger);
        setLiveChartData(chartData);
        setLiveTotal(total);
      })
      .catch(e => setError(e.message ?? "Failed to load expenses"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useMock]);

  const openCreate = () => {
    setForm(emptyExpenseForm);
    setFormError("");
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (row: LedgerRow) => {
    if (!row.expenseId) return;
    const exp = liveExpenses.find(e => e.id === row.expenseId);
    if (!exp) return;
    setForm({
      eventId: String(exp.eventId),
      description: exp.description,
      category: exp.category ?? "Others",
      amount: String(exp.amount),
      vendorName: exp.vendorName ?? "",
      receiptUrl: exp.receiptUrl ?? "",
      expenseDate: exp.expenseDate ?? "",
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
      load();
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
      load();
    } catch {
      setError("Failed to delete expense");
    }
  };

  const expenseData = useMock ? mockExpenseData : liveChartData;
  const ledger = useMock ? mockLedger : liveLedger;

  const summary = useMock
    ? mockSummary
    : [
        { label: "Total Budget",  value: "—",                                            icon: IndianRupee,  color: "#6366f1", bg: "#eef2ff" },
        { label: "Total Income",  value: "—",                                            icon: TrendingUp,  color: "#10b981", bg: "#ecfdf5" },
        { label: "Total Expenses",value: `₹${liveTotal.toLocaleString("en-IN")}`,        icon: TrendingDown,color: "#ef4444", bg: "#fff1f2" },
        { label: "Net Balance",   value: "—",                                            icon: Landmark,    color: "#4f46e5", bg: "#eef2ff" },
      ];

  return (
    <div className="space-y-3 sm:space-y-6">
      {error && <ErrorBanner message={error} />}
      {loading && <LoadingSpinner label="Loading finance data…" />}

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

        {/* Income pie — mock only */}
        {useMock && (
          <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-6 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
            <h3 className="font-bold text-slate-800 mb-1 text-xs sm:text-base">Income Sources</h3>
            <p className="text-xs text-slate-400 mb-2">Total: ₹9,24,000</p>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={incomeBreakdown} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                  {incomeBreakdown.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip formatter={v => [`₹${Number(v).toLocaleString()}`]} contentStyle={{ borderRadius: 10, border: "none", fontSize: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-1">
              {incomeBreakdown.map(c => (
                <div key={c.name} className="flex items-center gap-1.5 text-xs text-slate-600">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.color }} />
                  {c.name}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Ledger */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="flex items-center justify-between px-3 sm:px-6 pt-3 sm:pt-5 pb-2 sm:pb-4 border-b border-slate-50 flex-wrap gap-2">
          <h2 className="font-bold text-slate-800 text-sm sm:text-base">Transaction Ledger</h2>
          <div className="flex gap-1.5 sm:gap-2">
            <button className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all">
              <Download className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> <span className="hidden sm:inline">Export</span>
            </button>
            {!useMock && (
              <button
                onClick={openCreate}
                className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-sm">
                <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Add Expense
              </button>
            )}
          </div>
        </div>
        <div className="divide-y divide-slate-50">
          {ledger.length === 0 && !useMock && !loading && (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400">
              <TrendingDown className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-sm font-medium">No expenses yet</p>
              <p className="text-xs mt-1">Click &quot;Add Expense&quot; to record your first expense</p>
            </div>
          )}
          {ledger.map((txn, i) => (
            <div
              key={txn.id}
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
              {!useMock && txn.expenseId && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button onClick={() => openEdit(txn)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition">
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button onClick={() => handleDelete(txn)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition">
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
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {formError && (
                <div className="flex items-center gap-2 px-3 py-2 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <label className="col-span-2 flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-500">Event ID *</span>
                  <input type="number" value={form.eventId}
                    onChange={e => setForm(f => ({ ...f, eventId: e.target.value }))}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    placeholder="e.g. 12" required />
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
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
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
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
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
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-500 hover:opacity-90 rounded-xl transition disabled:opacity-60">
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
