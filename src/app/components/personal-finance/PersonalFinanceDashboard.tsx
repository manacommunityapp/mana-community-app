import { useState } from "react";
import {
  Wallet, TrendingUp, TrendingDown, PiggyBank, Target, Receipt,
  Calendar, RefreshCw, CreditCard, BarChart3, FolderOpen,
  ArrowUpRight, ArrowDownRight, Bell, CheckCircle2, Plus,
} from "lucide-react";

const SUMMARY = [
  { label: "Income", amount: "₹1,85,000", icon: TrendingUp, color: "#10b981", bg: "rgba(16,185,129,0.08)" },
  { label: "Expenses", amount: "₹1,12,450", icon: TrendingDown, color: "#ef4444", bg: "rgba(239,68,68,0.08)" },
  { label: "Savings", amount: "₹72,550", icon: PiggyBank, color: "#3b82f6", bg: "rgba(59,130,246,0.08)" },
  { label: "Net Worth", amount: "₹24,50,000", icon: Wallet, color: "#8b5cf6", bg: "rgba(139,92,246,0.08)" },
];

const MODULES = [
  { emoji: "🏦", label: "Accounts", desc: "Banks, cards & wallets" },
  { emoji: "📒", label: "Transactions", desc: "Income & expenses" },
  { emoji: "📊", label: "Budgets", desc: "Monthly spending limits" },
  { emoji: "🎯", label: "Goals", desc: "Savings targets" },
  { emoji: "🏷️", label: "Categories", desc: "Organize spending" },
  { emoji: "📅", label: "Calendar", desc: "Daily cash flow" },
  { emoji: "🔄", label: "Recurring", desc: "Auto-scheduled entries" },
  { emoji: "🔔", label: "Bills", desc: "Due date reminders" },
  { emoji: "🧾", label: "Receipts", desc: "Digital receipt vault" },
  { emoji: "📈", label: "Reports", desc: "Charts & insights" },
];

const BUDGETS = [
  { category: "Groceries", allocated: 15000, spent: 11200, status: "On Track" as const },
  { category: "Dining Out", allocated: 8000, spent: 7800, status: "Near Limit" as const },
  { category: "Transport", allocated: 5000, spent: 6200, status: "Over Budget" as const },
];

const BILLS = [
  { name: "Electricity Bill", due: "Oct 15", amount: "₹2,450", autoPay: true },
  { name: "Maintenance Dues", due: "Oct 20", amount: "₹5,800", autoPay: false },
  { name: "Netflix Subscription", due: "Oct 22", amount: "₹649", autoPay: true },
  { name: "Internet Bill", due: "Oct 25", amount: "₹999", autoPay: true },
];

const TRANSACTIONS = [
  { desc: "Salary — October", amount: "+₹1,85,000", cat: "💼", date: "Oct 1", positive: true },
  { desc: "BigBasket Groceries", amount: "−₹3,240", cat: "🛒", date: "Oct 8", positive: false },
  { desc: "Swiggy Food Order", amount: "−₹680", cat: "🍕", date: "Oct 9", positive: false },
  { desc: "Freelance Payment", amount: "+₹25,000", cat: "💻", date: "Oct 10", positive: true },
  { desc: "Uber Rides", amount: "−₹1,120", cat: "🚗", date: "Oct 10", positive: false },
];

const GOALS = [
  { name: "Emergency Fund", saved: 180000, target: 500000, color: "#3b82f6" },
  { name: "Vacation — Goa", saved: 32000, target: 60000, color: "#f59e0b" },
  { name: "New Laptop", saved: 55000, target: 80000, color: "#10b981" },
];

const statusColor = (s: string) =>
  s === "On Track" ? "#10b981" : s === "Near Limit" ? "#f59e0b" : "#ef4444";

export function PersonalFinanceDashboard() {
  const [activeModule, setActiveModule] = useState<string | null>(null);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(139,92,246,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Wallet size={22} style={{ color: "#8b5cf6" }} />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", margin: 0 }}>Personal Finance</h1>
            <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>Track income, expenses, goals & more</p>
          </div>
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, padding: "4px 10px", borderRadius: 20, background: "rgba(16,185,129,0.1)", color: "#10b981", display: "flex", alignItems: "center", gap: 4 }}>
          🔒 Zero Admin Access
        </span>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 24 }}>
        {SUMMARY.map(s => (
          <div key={s.label} style={{ padding: "16px 18px", borderRadius: 14, background: "var(--card)", border: "1px solid rgba(148,163,184,0.1)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)" }}>{s.label}</span>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <s.icon size={15} style={{ color: s.color }} />
              </div>
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text)" }}>{s.amount}</div>
          </div>
        ))}
      </div>

      {/* Quick Nav Grid */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 12 }}>Quick Access</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
          {MODULES.map(m => (
            <button key={m.label} onClick={() => setActiveModule(m.label)} style={{
              padding: "14px 10px", borderRadius: 12, border: `1px solid ${activeModule === m.label ? "var(--gold)" : "rgba(148,163,184,0.1)"}`,
              background: activeModule === m.label ? "rgba(212,160,23,0.06)" : "var(--card)",
              cursor: "pointer", textAlign: "center",
            }}>
              <div style={{ fontSize: 24, marginBottom: 4 }}>{m.emoji}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>{m.label}</div>
              <div style={{ fontSize: 9, color: "var(--muted)", marginTop: 2 }}>{m.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
        {/* Budgets */}
        <div style={{ background: "var(--card)", borderRadius: 14, border: "1px solid rgba(148,163,184,0.1)", padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <BarChart3 size={16} style={{ color: "var(--gold)" }} />
            <span style={{ fontSize: 14, fontWeight: 700 }}>Budget Overview</span>
          </div>
          {BUDGETS.map(b => (
            <div key={b.category} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>{b.category}</span>
                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: `${statusColor(b.status)}15`, color: statusColor(b.status) }}>{b.status}</span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: "rgba(148,163,184,0.1)", overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 3, width: `${Math.min((b.spent / b.allocated) * 100, 100)}%`, background: statusColor(b.status) }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
                <span style={{ fontSize: 10, color: "var(--muted)" }}>₹{b.spent.toLocaleString("en-IN")} spent</span>
                <span style={{ fontSize: 10, color: "var(--muted)" }}>₹{b.allocated.toLocaleString("en-IN")} limit</span>
              </div>
            </div>
          ))}
        </div>

        {/* Upcoming Bills */}
        <div style={{ background: "var(--card)", borderRadius: 14, border: "1px solid rgba(148,163,184,0.1)", padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <Bell size={16} style={{ color: "var(--gold)" }} />
            <span style={{ fontSize: 14, fontWeight: 700 }}>Upcoming Bills</span>
          </div>
          {BILLS.map(b => (
            <div key={b.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(148,163,184,0.06)" }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>{b.name}</div>
                <div style={{ fontSize: 10, color: "var(--muted)", display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                  Due {b.due}
                  {b.autoPay && <span style={{ fontSize: 8, fontWeight: 700, padding: "1px 5px", borderRadius: 4, background: "rgba(16,185,129,0.1)", color: "#10b981" }}>Auto-Pay</span>}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{b.amount}</span>
                {!b.autoPay && (
                  <button style={{ fontSize: 10, fontWeight: 700, padding: "4px 10px", borderRadius: 6, background: "var(--gold)", color: "#000", border: "none", cursor: "pointer" }}>Pay</button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Recent Transactions */}
        <div style={{ background: "var(--card)", borderRadius: 14, border: "1px solid rgba(148,163,184,0.1)", padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <Receipt size={16} style={{ color: "var(--gold)" }} />
            <span style={{ fontSize: 14, fontWeight: 700 }}>Recent Transactions</span>
          </div>
          {TRANSACTIONS.map((t, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "1px solid rgba(148,163,184,0.06)" }}>
              <span style={{ fontSize: 20 }}>{t.cat}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>{t.desc}</div>
                <div style={{ fontSize: 10, color: "var(--muted)" }}>{t.date}</div>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: t.positive ? "#10b981" : "#ef4444" }}>{t.amount}</span>
            </div>
          ))}
        </div>

        {/* Goals */}
        <div style={{ background: "var(--card)", borderRadius: 14, border: "1px solid rgba(148,163,184,0.1)", padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <Target size={16} style={{ color: "var(--gold)" }} />
            <span style={{ fontSize: 14, fontWeight: 700 }}>Savings Goals</span>
          </div>
          {GOALS.map(g => (
            <div key={g.name} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>{g.name}</span>
                <span style={{ fontSize: 10, color: "var(--muted)" }}>{Math.round((g.saved / g.target) * 100)}%</span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: "rgba(148,163,184,0.1)", overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 3, width: `${(g.saved / g.target) * 100}%`, background: g.color }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
                <span style={{ fontSize: 10, color: "var(--muted)" }}>₹{g.saved.toLocaleString("en-IN")} saved</span>
                <span style={{ fontSize: 10, color: "var(--muted)" }}>₹{g.target.toLocaleString("en-IN")} target</span>
              </div>
            </div>
          ))}
          <button style={{ width: "100%", padding: "8px 0", borderRadius: 8, border: "1px dashed rgba(148,163,184,0.2)", background: "transparent", color: "var(--muted)", fontSize: 11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4, marginTop: 4 }}>
            <Plus size={12} /> Add Goal
          </button>
        </div>
      </div>
    </div>
  );
}
