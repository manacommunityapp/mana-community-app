import { useState, useEffect } from "react";
import { Landmark, TrendingUp, TrendingDown, DollarSign, Plus, Download, Loader2, AlertCircle } from "lucide-react";
import { useEventMock } from "./EventMockToggle";
import { eventExpenseService, type EventExpenseResponse } from "../../../services/events/eventExpenseService";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const mockSummary = [
  { label: "Total Budget",  value: "₹7,10,000", icon: DollarSign,  color: "#6366f1", bg: "#eef2ff" },
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
  { cat: "Marketing", amount: 22000  },
  { cat: "Printing",  amount: 18000  },
  { cat: "Others",    amount: 40000  },
];

const mockLedger = [
  { id: "TXN-001", desc: "Stage Booking – Phoenix Events",    type: "expense", amount: -85000,  date: "Aug 2",  cat: "Venue"   },
  { id: "TXN-002", desc: "Sponsor Collection – TechCorp",     type: "income",  amount: 500000,  date: "Aug 1",  cat: "Sponsor" },
  { id: "TXN-003", desc: "Catering Advance – Sai Foods",      type: "expense", amount: -60000,  date: "Jul 31", cat: "Food"    },
  { id: "TXN-004", desc: "Registration Collections",          type: "income",  amount: 184200,  date: "Jul 30", cat: "Registration" },
  { id: "TXN-005", desc: "LED Display Rental",                type: "expense", amount: -25000,  date: "Jul 28", cat: "AV & Tech" },
  { id: "TXN-006", desc: "Donations Received (UPI + Cash)",   type: "income",  amount: 175000,  date: "Jul 27", cat: "Donation" },
  { id: "TXN-007", desc: "Flex & Banner Printing",            type: "expense", amount: -18000,  date: "Jul 25", cat: "Marketing" },
];

type LedgerRow = { id: string; desc: string; type: string; amount: number; date: string; cat: string };

function mapLiveExpenses(data: EventExpenseResponse[]): { ledger: LedgerRow[]; chartData: { cat: string; amount: number }[]; total: number } {
  const ledger: LedgerRow[] = data.map(e => ({
    id: `TXN-${String(e.id).padStart(3, "0")}`,
    desc: e.description,
    type: "expense",
    amount: -e.amount,
    date: e.expenseDate ? new Date(e.expenseDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" }) : new Date(e.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
    cat: e.category ?? "Other",
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
  const [liveLedger, setLiveLedger] = useState<LedgerRow[]>([]);
  const [liveChartData, setLiveChartData] = useState<{ cat: string; amount: number }[]>([]);
  const [liveTotal, setLiveTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (useMock) return;
    setLoading(true);
    setError("");
    eventExpenseService.getAll()
      .then(data => {
        const { ledger, chartData, total } = mapLiveExpenses(data);
        setLiveLedger(ledger);
        setLiveChartData(chartData);
        setLiveTotal(total);
      })
      .catch(e => setError(e.message ?? "Failed to load expenses"))
      .finally(() => setLoading(false));
  }, [useMock]);

  const expenseData = useMock ? mockExpenseData : liveChartData;
  const ledger = useMock ? mockLedger : liveLedger;

  const summary = useMock
    ? mockSummary
    : [
        { label: "Total Budget",  value: "—",                                            icon: DollarSign,  color: "#6366f1", bg: "#eef2ff" },
        { label: "Total Income",  value: "—",                                            icon: TrendingUp,  color: "#10b981", bg: "#ecfdf5" },
        { label: "Total Expenses",value: `₹${liveTotal.toLocaleString("en-IN")}`,        icon: TrendingDown,color: "#ef4444", bg: "#fff1f2" },
        { label: "Net Balance",   value: "—",                                            icon: Landmark,    color: "#4f46e5", bg: "#eef2ff" },
      ];

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-8 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading finance data...
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {summary.map((s, i) => (
          <div
            key={s.label}
            className={`animate-fade-in-up stagger-${Math.min(i + 1, 8)} bg-white rounded-2xl p-3.5 sm:p-5 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)]`}
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center mb-2 sm:mb-3" style={{ background: s.bg }}>
              <s.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: s.color }} />
            </div>
            <p className="text-lg sm:text-xl font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-0.5 sm:mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense bar */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
          <h3 className="font-bold text-slate-800 mb-1">Expenses by Category</h3>
          <p className="text-xs text-slate-400 mb-4">In ₹</p>
          <ResponsiveContainer width="100%" height={200}>
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
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
            <h3 className="font-bold text-slate-800 mb-1">Income Sources</h3>
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
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-6 pt-4 sm:pt-5 pb-3 sm:pb-4 border-b border-slate-50 flex-wrap gap-2">
          <h2 className="font-bold text-slate-800 text-sm sm:text-base">Transaction Ledger</h2>
          <div className="flex gap-1.5 sm:gap-2">
            <button className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all">
              <Download className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> <span className="hidden sm:inline">Export</span>
            </button>
            <button className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-sm">
              <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Add
            </button>
          </div>
        </div>
        <div className="divide-y divide-slate-50">
          {ledger.map((txn, i) => (
            <div
              key={txn.id}
              className={`animate-fade-in-up stagger-${Math.min(i + 1, 8)} flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4 hover:bg-slate-50/60 transition-colors`}
            >
              <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${txn.type === "income" ? "bg-emerald-50" : "bg-rose-50"}`}>
                {txn.type === "income"
                  ? <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
                  : <TrendingDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-500" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-semibold text-slate-800 truncate">{txn.desc}</p>
                <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">{txn.cat} · {txn.date}</p>
              </div>
              <p className={`font-black text-sm sm:text-base tabular-nums flex-shrink-0 ${txn.amount > 0 ? "text-emerald-600" : "text-rose-500"}`}>
                {txn.amount > 0 ? "+" : ""}₹{Math.abs(txn.amount).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
