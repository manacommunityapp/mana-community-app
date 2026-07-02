import { useState, useEffect } from "react";
import { BarChart3, TrendingUp, DollarSign, Calendar, IndianRupee, PieChart, AlertCircle } from "lucide-react";
import { toast, Toaster } from "sonner";
import { billingService, type BillingExpense, type BillingInvoice } from "../../../services/billingService";

export function FinancialReports() {
  const [expenses, setExpenses] = useState<BillingExpense[]>([]);
  const [invoices, setInvoices] = useState<BillingInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [financialYear, setFinancialYear] = useState("FY 2026-27");

  const loadData = async () => {
    try {
      const expData = await billingService.getExpenses(0, 100);
      const invData = await billingService.getInvoices(0, 100);
      setExpenses(expData.content);
      setInvoices(invData.content);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load financial datasets");
    }
  };

  useEffect(() => {
    setLoading(true);
    loadData().finally(() => setLoading(false));
  }, []);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

  // Math aggregates
  const totalExpenseAmount = expenses.filter(e => e.status === "APPROVED").reduce((sum, e) => sum + e.amount, 0);
  const pendingExpenseAmount = expenses.filter(e => e.status === "PENDING").reduce((sum, e) => sum + e.amount, 0);
  
  const totalInvoiced = invoices.reduce((sum, i) => sum + i.totalAmount, 0);
  const collectedAmount = invoices.filter(i => i.status === "PAID").reduce((sum, i) => sum + i.totalAmount, 0);
  const outstandingAmount = totalInvoiced - collectedAmount;

  // Category aggregates
  const categorySummary = expenses.reduce((acc, exp) => {
    if (exp.status !== "APPROVED") return acc;
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen text-[#0d0d2b] p-6 font-sans">
      <Toaster position="top-center" richColors />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <span className="text-xs text-indigo-600 font-bold uppercase tracking-wider">Finance Management</span>
          <h1 className="text-2xl font-black text-[#0d0d2b] flex items-center gap-2 mt-0.5">
            <BarChart3 className="h-7 w-7 text-indigo-600" />
            Financial Reports
          </h1>
          <p className="text-[#6b7094] text-xs mt-1">Aggregated expenditure audits, tax collections, and cash flow analysis.</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-[#374151]">
          <Calendar className="h-4 w-4 text-indigo-600" />
          <span className="font-bold">{financialYear}</span>
        </div>
      </div>

      {loading ? (
        <div className="bg-white border border-[#6366f1]/12 py-20 text-center text-[#6b7094] rounded-2xl shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
          Aggregating ledger datasets...
        </div>
      ) : (
        <div className="space-y-6 max-w-7xl mx-auto">
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div className="bg-white border border-[#6366f1]/12 rounded-2xl p-5 shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
              <span className="text-[10px] font-bold text-[#6b7094] uppercase tracking-wider">Approved Expenses</span>
              <h2 className="text-2xl font-black text-[#0d0d2b] mt-2">{formatCurrency(totalExpenseAmount)}</h2>
              <p className="text-[10px] text-[#6b7094] mt-1">Disbursed community funds</p>
            </div>
            <div className="bg-white border border-[#6366f1]/12 rounded-2xl p-5 shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
              <span className="text-[10px] font-bold text-[#6b7094] uppercase tracking-wider">Collections Invoiced</span>
              <h2 className="text-2xl font-black text-[#0d0d2b] mt-2">{formatCurrency(totalInvoiced)}</h2>
              <p className="text-[10px] text-[#6b7094] mt-1">Total resident maintenance bills</p>
            </div>
            <div className="bg-white border border-[#6366f1]/12 rounded-2xl p-5 shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
              <span className="text-[10px] font-bold text-[#6b7094] uppercase tracking-wider">Collected Funds</span>
              <h2 className="text-2xl font-black text-emerald-600 mt-2">{formatCurrency(collectedAmount)}</h2>
              <p className="text-[10px] text-emerald-600/80 mt-1">
                {totalInvoiced > 0 ? `${((collectedAmount / totalInvoiced) * 100).toFixed(0)}% recovery rate` : "0% recovery"}
              </p>
            </div>
            <div className="bg-white border border-[#6366f1]/12 rounded-2xl p-5 shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
              <span className="text-[10px] font-bold text-[#6b7094] uppercase tracking-wider">Outstanding Dues</span>
              <h2 className="text-2xl font-black text-red-600 mt-2">{formatCurrency(outstandingAmount)}</h2>
              <p className="text-[10px] text-red-600/80 mt-1">Awaiting resident payment</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category summary breakdowns */}
            <div className="bg-white border border-[#6366f1]/12 rounded-2xl p-5 shadow-[0_4px_20px_rgba(99,102,241,0.05)] space-y-4">
              <h3 className="font-bold text-sm text-[#0d0d2b] flex items-center gap-2">
                <PieChart className="h-4.5 w-4.5 text-indigo-600" />
                Expenditure by Category
              </h3>
              <div className="space-y-3.5">
                {Object.keys(categorySummary).length === 0 ? (
                  <p className="text-xs text-[#6b7094] py-6 text-center">No approved expenditures on record yet.</p>
                ) : (
                  Object.entries(categorySummary).map(([cat, amt]) => {
                    const pct = totalExpenseAmount > 0 ? (amt / totalExpenseAmount) * 100 : 0;
                    return (
                      <div key={cat} className="space-y-1.5 text-xs">
                        <div className="flex justify-between font-bold text-[#374151]">
                          <span>{cat.replace("_", " ")}</span>
                          <span>{formatCurrency(amt)} ({pct.toFixed(0)}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/50">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Income recovery variance */}
            <div className="bg-white border border-[#6366f1]/12 rounded-2xl p-5 shadow-[0_4px_20px_rgba(99,102,241,0.05)] space-y-4">
              <h3 className="font-bold text-sm text-[#0d0d2b] flex items-center gap-2">
                <TrendingUp className="h-4.5 w-4.5 text-indigo-600" />
                Ledger Recovery Balance
              </h3>
              <div className="space-y-4 text-xs">
                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <div>
                    <span className="text-[#6b7094]">Collected Income:</span>
                    <p className="font-black text-sm text-emerald-600 mt-0.5">{formatCurrency(collectedAmount)}</p>
                  </div>
                  <div>
                    <span className="text-[#6b7094]">Approved Expense:</span>
                    <p className="font-black text-sm text-red-600 mt-0.5">{formatCurrency(totalExpenseAmount)}</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl border bg-white flex gap-3 items-center border-slate-200 shadow-[0_4px_20px_rgba(99,102,241,0.03)]">
                  <span className="text-2xl">
                    {collectedAmount >= totalExpenseAmount ? "📈" : "📉"}
                  </span>
                  <div>
                    <span className="text-[10px] font-bold text-[#6b7094] uppercase tracking-wider block">Net Capital Balance</span>
                    <p className={`font-black text-sm mt-0.5 ${collectedAmount >= totalExpenseAmount ? "text-emerald-600" : "text-red-600"}`}>
                      {formatCurrency(collectedAmount - totalExpenseAmount)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
