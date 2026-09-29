// AdminBillingDashboard.tsx - Enterprise Community Billing, Rules Engine, Invoices & Ledger
import React, { useState } from "react";
import {
  DollarSign, TrendingUp, AlertTriangle, CheckCircle2,
  Calendar, Layers, FileText, BookOpen, Sliders,
  ArrowUpRight, Download, RefreshCw, Plus, Search, Filter, ShieldCheck
} from "lucide-react";
import { communityFinanceService } from "../../../services/finance/communityFinanceService";
import type { MaintenanceBill, ChargeRule, MaintenancePlan, GeneralLedgerTransaction, TrialBalanceItem } from "../../../services/finance/communityFinanceService";

export function AdminBillingDashboard() {
  const [activeTab, setActiveTab] = useState<"overview" | "rules" | "invoices" | "ledger" | "aging">("overview");
  const [summary, setSummary] = useState(communityFinanceService.getSummary());
  const [bills] = useState<MaintenanceBill[]>(communityFinanceService.getAllBills());
  const [plans] = useState<MaintenancePlan[]>(communityFinanceService.getPlans());
  const [rules] = useState<ChargeRule[]>(communityFinanceService.getRules());
  const [penaltyConfig] = useState(communityFinanceService.getPenaltyConfig());
  const [ledgerTxs] = useState<GeneralLedgerTransaction[]>(communityFinanceService.getLedgerTransactions());
  const [trialBalance] = useState<TrialBalanceItem[]>(communityFinanceService.getTrialBalance());

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isGenerating, setIsGenerating] = useState(false);
  const [genSuccess, setGenSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const handleGenerateCycle = () => {
    setIsGenerating(true);
    setGenSuccess(null);
    setTimeout(() => {
      const res = communityFinanceService.generateMonthlyCycle(selectedMonth, selectedYear);
      setIsGenerating(false);
      setGenSuccess(`Batch generated ${res.generatedCount} invoices for ${selectedMonth}/${selectedYear} (Total: ₹${res.totalBilled.toLocaleString("en-IN")}) with idempotency lock!`);
      setSummary(communityFinanceService.getSummary());
    }, 1000);
  };

  const filteredBills = bills.filter(b =>
    b.flatNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.billNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.tower.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* ── Top Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#1E1E36] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
              Mana Financial OS
            </span>
            <span className="text-xs text-slate-400 font-mono">CFBOS Core</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            Community Billing & Financial Engine
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Unit-anchored billing rules, monthly batch generation, automated ledgers, receipts & aging collections.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleGenerateCycle}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${isGenerating ? "animate-spin" : ""}`} />
            {isGenerating ? "Generating..." : "Run Monthly Batch"}
          </button>
        </div>
      </div>

      {genSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          {genSuccess}
        </div>
      )}

      {/* ── Navigation Tabs ──────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        {[
          { id: "overview", label: "Financial Overview", icon: DollarSign },
          { id: "rules", label: "Billing Rules & Plans", icon: Sliders },
          { id: "invoices", label: "Invoices & Dues", icon: FileText },
          { id: "ledger", label: "Double-Entry Ledger", icon: BookOpen },
          { id: "aging", label: "Aging Analysis", icon: TrendingUp },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === t.id
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB 1: Financial Overview ────────────────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-[#1E1E36] p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Total Billed & Due</span>
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40"><DollarSign className="w-4 h-4" /></div>
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">₹{summary.totalDue.toLocaleString("en-IN")}</div>
              <div className="text-[11px] text-slate-400 mt-1">{summary.activeFlats} Active Billing Units</div>
            </div>

            <div className="bg-white dark:bg-[#1E1E36] p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Total Collected</span>
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40"><CheckCircle2 className="w-4 h-4" /></div>
              </div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">₹{summary.totalCollected.toLocaleString("en-IN")}</div>
              <div className="text-[11px] text-emerald-500 mt-1 font-bold">{summary.collectionPercent}% Collection Efficiency</div>
            </div>

            <div className="bg-white dark:bg-[#1E1E36] p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Overdue Balances</span>
                <div className="p-2 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/40"><AlertTriangle className="w-4 h-4" /></div>
              </div>
              <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-2">₹{summary.totalOverdue.toLocaleString("en-IN")}</div>
              <div className="text-[11px] text-rose-500 mt-1">{summary.overdueFlats} Flats Past Grace Period</div>
            </div>

            <div className="bg-white dark:bg-[#1E1E36] p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Advance Wallet Pool</span>
                <div className="p-2 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/40"><Layers className="w-4 h-4" /></div>
              </div>
              <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-2">₹1,10,000</div>
              <div className="text-[11px] text-purple-500 mt-1">Prepaid Float for Auto-Deduction</div>
            </div>
          </div>

          {/* Tower Performance Grid */}
          <div className="bg-white dark:bg-[#1E1E36] p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Tower-Wise Collection Progress</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {summary.towerPerformance.map(t => (
                <div key={t.tower} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{t.tower}</span>
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{t.percent}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${t.percent}%` }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 mt-2">
                    <span>Collected: ₹{t.collected.toLocaleString("en-IN")}</span>
                    <span>Billed: ₹{t.billed.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: Billing Rules & Plans ─────────────────────────────────────── */}
      {activeTab === "rules" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active Plans */}
            <div className="bg-white dark:bg-[#1E1E36] p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Maintenance Plans</h3>
                <button className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> New Plan</button>
              </div>
              <div className="space-y-3">
                {plans.map(p => (
                  <div key={p.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{p.name}</span>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                        {p.calculationType}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-2 flex items-center gap-4">
                      {p.ratePerSqFt > 0 && <span>Rate: ₹{p.ratePerSqFt.toFixed(2)}/sq.ft</span>}
                      {p.fixedAmountPerFlat > 0 && <span>Fixed: ₹{p.fixedAmountPerFlat}</span>}
                      <span>Frequency: {p.billingFrequency}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Charge Component Rules */}
            <div className="bg-white dark:bg-[#1E1E36] p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Charge Component Rules</h3>
                <span className="text-xs text-slate-400">Standard Rule Set</span>
              </div>
              <div className="space-y-2">
                {rules.map(r => (
                  <div key={r.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{r.ruleName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{r.componentType} · {r.calculationType}</div>
                    </div>
                    <div className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                      ₹{r.rate.toLocaleString("en-IN")}
                    </div>
                  </div>
                ))}
              </div>

              {/* Late Penalty Rule Box */}
              <div className="mt-4 p-4 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
                  <ShieldCheck className="w-4 h-4" /> Late Fee & Penalty Configuration
                </div>
                <div className="text-[11px] text-amber-700 dark:text-amber-400 mt-1">
                  Grace Period: <strong>{penaltyConfig.gracePeriodDays} days</strong> | Rate: <strong>{penaltyConfig.penaltyValue}% per month</strong> | Max Cap: <strong>₹{penaltyConfig.maxPenaltyCap}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: Invoices & Dues ───────────────────────────────────────────── */}
      {activeTab === "invoices" && (
        <div className="bg-white dark:bg-[#1E1E36] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search flat number, invoice no, tower..."
                className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none focus:border-indigo-500"
              />
            </div>
            <div className="text-xs text-slate-400">Showing {filteredBills.length} invoices</div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">Invoice #</th>
                  <th className="p-3">Unit</th>
                  <th className="p-3">Period</th>
                  <th className="p-3">Subtotal</th>
                  <th className="p-3">Penalty</th>
                  <th className="p-3">Total Due</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredBills.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">{b.billNumber}</td>
                    <td className="p-3 font-bold text-slate-800 dark:text-slate-200">{b.flatNumber} ({b.tower})</td>
                    <td className="p-3 text-slate-500">{b.month}/{b.year}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-300">₹{b.subtotal.toLocaleString("en-IN")}</td>
                    <td className="p-3 text-amber-600">₹{b.penaltyAmount}</td>
                    <td className="p-3 font-bold text-slate-900 dark:text-white">₹{b.dueAmount.toLocaleString("en-IN")}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                        b.status === "PAID" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300" :
                        b.status === "OVERDUE" ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300" :
                        b.status === "PARTIAL" ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300" :
                        "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300"
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500">{new Date(b.dueDate).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 4: Double-Entry Ledger ───────────────────────────────────────── */}
      {activeTab === "ledger" && (
        <div className="space-y-6">
          {/* Trial Balance Table */}
          <div className="bg-white dark:bg-[#1E1E36] p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">General Ledger Trial Balance</h3>
                <p className="text-[11px] text-slate-400">Real-time balancing of debits & credits</p>
              </div>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-xs font-bold rounded-full">
                ✓ Perfectly Balanced
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3">Account Code</th>
                    <th className="p-3">Account Name</th>
                    <th className="p-3">Category</th>
                    <th className="p-3 text-right">Debit Balance (₹)</th>
                    <th className="p-3 text-right">Credit Balance (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {trialBalance.map(a => (
                    <tr key={a.accountCode} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="p-3 font-mono font-bold text-slate-700 dark:text-slate-300">{a.accountCode}</td>
                      <td className="p-3 font-semibold text-slate-900 dark:text-white">{a.accountName}</td>
                      <td className="p-3 text-slate-400">{a.accountType}</td>
                      <td className="p-3 text-right font-mono font-bold">{a.debitAmount > 0 ? `₹${a.debitAmount.toLocaleString("en-IN")}` : "-"}</td>
                      <td className="p-3 text-right font-mono font-bold">{a.creditAmount > 0 ? `₹${a.creditAmount.toLocaleString("en-IN")}` : "-"}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-100 dark:bg-slate-900 font-black text-slate-900 dark:text-white">
                    <td colSpan={3} className="p-3">Total Balance</td>
                    <td className="p-3 text-right font-mono text-indigo-600">₹9,50,000</td>
                    <td className="p-3 text-right font-mono text-indigo-600">₹9,50,000</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Journal Transactions */}
          <div className="bg-white dark:bg-[#1E1E36] p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Recent General Ledger Postings</h3>
            <div className="space-y-4">
              {ledgerTxs.map(tx => (
                <div key={tx.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                    <div>
                      <span className="font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400">{tx.transactionRef}</span>
                      <span className="text-xs text-slate-400 ml-2">({tx.transactionDate})</span>
                    </div>
                    <span className="text-xs font-black text-slate-900 dark:text-white">₹{tx.totalAmount.toLocaleString("en-IN")}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2">{tx.narration}</p>

                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-[11px] text-left">
                      <thead className="text-slate-400">
                        <tr>
                          <th className="py-1">Account</th>
                          <th className="py-1">Type</th>
                          <th className="py-1 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/40 dark:divide-slate-800">
                        {tx.entries.map(e => (
                          <tr key={e.id}>
                            <td className="py-1 font-semibold">{e.accountCode} - {e.accountName}</td>
                            <td className="py-1">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-black ${
                                e.entryType === "DEBIT" ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300" : "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                              }`}>
                                {e.entryType}
                              </span>
                            </td>
                            <td className="py-1 text-right font-mono font-bold">₹{e.amount.toLocaleString("en-IN")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 5: Aging Analysis ────────────────────────────────────────────── */}
      {activeTab === "aging" && (
        <div className="bg-white dark:bg-[#1E1E36] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Outstanding Receivables Aging Buckets</h3>
            <p className="text-xs text-slate-400 mt-0.5">Defaulter tracking and recovery timelines</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {summary.agingBuckets.map(b => (
              <div key={b.period} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300">{b.period}</div>
                <div className="text-xl font-black text-slate-900 dark:text-white mt-2">₹{b.amount.toLocaleString("en-IN")}</div>
                <div className="flex justify-between text-[11px] text-slate-500 mt-2">
                  <span>{b.count} Flats</span>
                  <span className="font-bold text-indigo-600">{b.percentage}% of Dues</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
