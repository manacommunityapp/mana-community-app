import { useState, useEffect } from "react";
import { Landmark, Plus, Trash2, Calendar, AlertCircle, Sparkles, TrendingUp, HelpCircle } from "lucide-react";
import { toast, Toaster } from "sonner";
import { budgetService, type BudgetAllocation } from "../../../services/budgetService";

const CATEGORIES = [
  { value: "CapEx_Asset", label: "CapEx (Capital Asset Purchase)" },
  { value: "OpEx_Maintenance", label: "OpEx (Repairs & Maintenance)" },
  { value: "OpEx_Consumable", label: "OpEx (Supplies & Consumables)" },
  { value: "OpEx_Other", label: "OpEx (Other Operations)" },
  { value: "SPORTS", label: "Sports Activities" },
  { value: "FESTIVAL", label: "Festival Celebrations" },
  { value: "CLEANING", label: "Cleaning & Sanitation" },
  { value: "SECURITY", label: "Security Services" },
  { value: "EVENTS", label: "Social Events" }
];

export function BudgetDashboard() {
  const [budgets, setBudgets] = useState<BudgetAllocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [financialYear, setFinancialYear] = useState("FY 2026-27");
  const [showAllocateModal, setShowAllocateModal] = useState(false);

  // Form State
  const [form, setForm] = useState({
    financialYear: "FY 2026-27",
    category: "OpEx_Maintenance",
    amount: "",
    notes: ""
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchBudgets = async () => {
    try {
      const data = await budgetService.getBudgets(financialYear);
      setBudgets(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load budget allocations");
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchBudgets().finally(() => setLoading(false));
  }, [financialYear]);

  const handleAllocateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || parseFloat(form.amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    setSubmitting(true);
    try {
      await budgetService.allocateBudget({
        financialYear: form.financialYear,
        category: form.category,
        amount: parseFloat(form.amount),
        notes: form.notes
      });
      toast.success("Budget allocated successfully!");
      setShowAllocateModal(false);
      setForm({
        financialYear: "FY 2026-27",
        category: "OpEx_Maintenance",
        amount: "",
        notes: ""
      });
      fetchBudgets();
    } catch {
      toast.error("Failed to allocate budget");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAllocation = async (id: number) => {
    if (!confirm("Are you sure you want to delete this allocation?")) return;
    try {
      await budgetService.deleteAllocation(id);
      toast.success("Allocation removed");
      fetchBudgets();
    } catch {
      toast.error("Failed to delete allocation");
    }
  };

  const formatCurrency = (amt: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amt);

  // Stats calculation
  const totalAllocated = budgets.reduce((sum, b) => sum + b.allocatedAmount, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spentAmount, 0);
  const remainingBalance = totalAllocated - totalSpent;

  return (
    <div className="min-h-screen text-[#0d0d2b] p-6 font-sans">
      <Toaster position="top-center" richColors />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <span className="text-xs text-indigo-600 font-bold uppercase tracking-wider">Finance Management</span>
          <h1 className="text-2xl font-black text-[#0d0d2b] flex items-center gap-2 mt-0.5">
            <Landmark className="h-7 w-7 text-indigo-600" />
            Budget Allocation
          </h1>
          <p className="text-[#6b7094] text-xs mt-1">Configure community budgets and monitor category expenditure variance.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-[#374151]">
            <Calendar className="h-4 w-4 text-indigo-600" />
            <select
              value={financialYear}
              onChange={(e) => setFinancialYear(e.target.value)}
              className="bg-transparent text-[#0d0d2b] focus:outline-none cursor-pointer font-bold"
            >
              <option value="FY 2026-27">FY 2026-27</option>
              <option value="FY 2025-26">FY 2025-26</option>
            </select>
          </div>
          <button
            onClick={() => setShowAllocateModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-95 shadow-md shadow-indigo-500/20 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Allocate Budget
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div className="bg-white border border-[#6366f1]/12 rounded-2xl p-5 shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
          <span className="text-[10px] font-bold text-[#6b7094] uppercase tracking-wider">Total Allocated Budget</span>
          <h2 className="text-3xl font-black text-[#0d0d2b] mt-2">{formatCurrency(totalAllocated)}</h2>
          <p className="text-[10px] text-[#6b7094] mt-1">For period: {financialYear}</p>
        </div>
        <div className="bg-white border border-[#6366f1]/12 rounded-2xl p-5 shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
          <span className="text-[10px] font-bold text-[#6b7094] uppercase tracking-wider">Total Expenses Spent</span>
          <h2 className="text-3xl font-black text-indigo-600 mt-2">{formatCurrency(totalSpent)}</h2>
          <p className="text-[10px] text-[#6b7094] mt-1">
            {totalAllocated > 0 ? `${((totalSpent / totalAllocated) * 100).toFixed(1)}% of allocation utilized` : "0% utilized"}
          </p>
        </div>
        <div className="bg-white border border-[#6366f1]/12 rounded-2xl p-5 shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
          <span className="text-[10px] font-bold text-[#6b7094] uppercase tracking-wider">Remaining Balance</span>
          <h2 className="text-3xl font-black text-emerald-600 mt-2">{formatCurrency(remainingBalance)}</h2>
          <p className="text-[10px] text-[#6b7094] mt-1">Available for new requests</p>
        </div>
      </div>

      {/* Budget Breakdowns table */}
      {loading ? (
        <div className="bg-white border border-[#6366f1]/12 rounded-2xl py-20 text-center text-[#6b7094] shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
          Loading budget allocations...
        </div>
      ) : budgets.length === 0 ? (
        <div className="bg-white border border-[#6366f1]/12 rounded-2xl py-20 text-center text-[#6b7094] shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
          <AlertCircle className="h-10 w-10 text-slate-300 mx-auto mb-2" />
          No budget allocations logged for {financialYear} yet.
        </div>
      ) : (
        <div className="bg-white border border-[#6366f1]/12 rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4.5 text-xs font-bold uppercase tracking-wider text-[#6b7094]">Category</th>
                  <th className="px-6 py-4.5 text-xs font-bold uppercase tracking-wider text-[#6b7094]">Allocated</th>
                  <th className="px-6 py-4.5 text-xs font-bold uppercase tracking-wider text-[#6b7094]">Spent</th>
                  <th className="px-6 py-4.5 text-xs font-bold uppercase tracking-wider text-[#6b7094]">Balance</th>
                  <th className="px-6 py-4.5 text-xs font-bold uppercase tracking-wider text-[#6b7094]">Utilization</th>
                  <th className="px-6 py-4.5 text-xs font-bold uppercase tracking-wider text-[#6b7094]">Notes</th>
                  <th className="px-6 py-4.5 text-xs font-bold uppercase tracking-wider text-[#6b7094] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {budgets.map((b) => {
                  const percent = b.allocatedAmount > 0 ? (b.spentAmount / b.allocatedAmount) * 100 : 0;
                  const label = CATEGORIES.find((c) => c.value === b.category)?.label || b.category;
                  return (
                    <tr key={b.id} className="hover:bg-indigo-50/50 transition-all">
                      <td className="px-6 py-4">
                        <span className="font-bold text-sm text-[#0d0d2b]">{label}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#374151] font-semibold">
                        {formatCurrency(b.allocatedAmount)}
                      </td>
                      <td className="px-6 py-4 text-sm text-indigo-600 font-semibold">
                        {formatCurrency(b.spentAmount)}
                      </td>
                      <td className="px-6 py-4 text-sm text-emerald-600 font-semibold">
                        {formatCurrency(b.allocatedAmount - b.spentAmount)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/50">
                            <div
                              className={`h-full rounded-full transition-all ${
                                percent > 90 ? "bg-red-500" : percent > 75 ? "bg-yellow-500" : "bg-indigo-500"
                              }`}
                              style={{ width: `${Math.min(percent, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-[#6b7094] font-bold">{percent.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-[#6b7094] truncate max-w-[200px]" title={b.notes}>
                        {b.notes || "—"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDeleteAllocation(b.id)}
                          className="p-1.5 hover:bg-red-50 rounded text-[#6b7094] hover:text-red-600 transition-all cursor-pointer"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Allocate Budget Modal */}
      {showAllocateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowAllocateModal(false)}>
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-150" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <h3 className="font-bold text-base text-[#0d0d2b] flex items-center gap-2">
                <Landmark className="h-5 w-5 text-indigo-600" />
                Allocate Budget Limit
              </h3>
              <button onClick={() => setShowAllocateModal(false)} className="text-[#6b7094] hover:text-[#0d0d2b] cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleAllocateSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#6b7094] block mb-1">Financial Year</label>
                <select
                  value={form.financialYear}
                  onChange={(e) => setForm((f) => ({ ...f, financialYear: e.target.value }))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-3 text-sm text-[#0d0d2b] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 cursor-pointer"
                >
                  <option value="FY 2026-27">FY 2026-27</option>
                  <option value="FY 2025-26">FY 2025-26</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#6b7094] block mb-1">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-3 text-sm text-[#0d0d2b] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 cursor-pointer"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#6b7094] block mb-1">Allocated Amount (INR)</label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  placeholder="e.g. 50000"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-3 text-sm text-[#0d0d2b] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#6b7094] block mb-1">Notes / Remarks</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="e.g. Annual allocation for sports awards and equipment maintenance"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-[#0d0d2b] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 resize-none"
                  rows={3}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-95 shadow-md shadow-indigo-500/20 text-white font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50"
              >
                {submitting ? "Allocating..." : "Confirm Allocation"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
