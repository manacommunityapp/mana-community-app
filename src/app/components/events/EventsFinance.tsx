import { Landmark, TrendingUp, TrendingDown, DollarSign, Plus, Download } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

// TODO: wire to eventService
const summary = [
  { label: "Total Budget",  value: "₹7,10,000", icon: DollarSign,  color: "#6366f1", bg: "#eef2ff" },
  { label: "Total Income",  value: "₹9,24,000", icon: TrendingUp,  color: "#10b981", bg: "#ecfdf5" },
  { label: "Total Expenses",value: "₹4,82,000", icon: TrendingDown,color: "#ef4444", bg: "#fff1f2" },
  { label: "Net Balance",   value: "₹4,42,000", icon: Landmark,    color: "#4f46e5", bg: "#eef2ff" },
];

// TODO: wire to eventService
const incomeBreakdown = [
  { name: "Registrations", value: 184200, color: "#6366f1" },
  { name: "Sponsors",      value: 500000, color: "#4f46e5" },
  { name: "Donations",     value: 175000, color: "#10b981" },
  { name: "Auction",       value: 210000, color: "#7c3aed" },
  { name: "Food Coupons",  value: 55800,  color: "#8b5cf6" },
];

// TODO: wire to eventService
const expenseData = [
  { cat: "Venue",     amount: 110000 },
  { cat: "Food",      amount: 145000 },
  { cat: "Decor",     amount: 62000  },
  { cat: "AV & Tech", amount: 55000  },
  { cat: "Security",  amount: 30000  },
  { cat: "Marketing", amount: 22000  },
  { cat: "Printing",  amount: 18000  },
  { cat: "Others",    amount: 40000  },
];

// TODO: wire to eventService
const ledger = [
  { id: "TXN-001", desc: "Stage Booking – Phoenix Events",    type: "expense", amount: -85000,  date: "Aug 2",  cat: "Venue"   },
  { id: "TXN-002", desc: "Sponsor Collection – TechCorp",     type: "income",  amount: 500000,  date: "Aug 1",  cat: "Sponsor" },
  { id: "TXN-003", desc: "Catering Advance – Sai Foods",      type: "expense", amount: -60000,  date: "Jul 31", cat: "Food"    },
  { id: "TXN-004", desc: "Registration Collections",          type: "income",  amount: 184200,  date: "Jul 30", cat: "Registration" },
  { id: "TXN-005", desc: "LED Display Rental",                type: "expense", amount: -25000,  date: "Jul 28", cat: "AV & Tech" },
  { id: "TXN-006", desc: "Donations Received (UPI + Cash)",   type: "income",  amount: 175000,  date: "Jul 27", cat: "Donation" },
  { id: "TXN-007", desc: "Flex & Banner Printing",            type: "expense", amount: -18000,  date: "Jul 25", cat: "Marketing" },
];

export function EventsFinance() {
  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {summary.map((s, i) => (
          <div
            key={s.label}
            className={`animate-fade-in-up stagger-${Math.min(i + 1, 8)} bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)]`}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: s.bg }}>
              <s.icon className="w-4 h-4" style={{ color: s.color }} />
            </div>
            <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-1">{s.label}</p>
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

        {/* Income pie */}
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
      </div>

      {/* Ledger */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-50">
          <h2 className="font-bold text-slate-800">Transaction Ledger</h2>
          <div className="flex gap-2">
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all">
              <Download className="w-3.5 h-3.5" /> Export
            </button>
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-sm">
              <Plus className="w-3.5 h-3.5" /> Add Entry
            </button>
          </div>
        </div>
        <div className="divide-y divide-slate-50">
          {ledger.map((txn, i) => (
            <div
              key={txn.id}
              className={`animate-fade-in-up stagger-${Math.min(i + 1, 8)} flex items-center gap-4 px-6 py-4 hover:bg-slate-50/60 transition-colors`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${txn.type === "income" ? "bg-emerald-50" : "bg-rose-50"}`}>
                {txn.type === "income"
                  ? <TrendingUp className="w-4 h-4 text-emerald-600" />
                  : <TrendingDown className="w-4 h-4 text-rose-500" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{txn.desc}</p>
                <p className="text-xs text-slate-400 mt-0.5">{txn.cat} · {txn.date}</p>
              </div>
              <p className={`font-black text-base tabular-nums ${txn.amount > 0 ? "text-emerald-600" : "text-rose-500"}`}>
                {txn.amount > 0 ? "+" : ""}₹{Math.abs(txn.amount).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
