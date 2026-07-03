import { useState, useRef, useEffect } from "react";
import {
  Receipt,
  Plus,
  Upload,
  IndianRupee,
  FileText,
  Search,
  Filter,
  Download,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
  Calendar,
  X,
  Check,
  Ban,
  Eye,
  CreditCard,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import { useAuth } from "../../../contexts/AuthContext";
import { billingService, type BillingExpense, type BillingInvoice } from "../../../services/billingService";
import { cn } from "../ui/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type ExpenseCategory =
  | "EVENT"
  | "MAINTENANCE"
  | "SPORTS"
  | "UTILITIES"
  | "SECURITY"
  | "CLEANING"
  | "OTHER";

const CATEGORY_CONFIG: Record<ExpenseCategory, { label: string; color: string; bg: string }> = {
  EVENT: { label: "Event", color: "text-purple-600 border-purple-200", bg: "bg-purple-50" },
  MAINTENANCE: { label: "Maintenance", color: "text-blue-600 border-blue-200", bg: "bg-blue-50" },
  SPORTS: { label: "Sports", color: "text-green-600 border-green-200", bg: "bg-green-50" },
  UTILITIES: { label: "Utilities", color: "text-orange-600 border-orange-200", bg: "bg-orange-50" },
  SECURITY: { label: "Security", color: "text-red-600 border-red-200", bg: "bg-red-50" },
  CLEANING: { label: "Cleaning", color: "text-cyan-600 border-cyan-200", bg: "bg-cyan-50" },
  OTHER: { label: "Other", color: "text-slate-600 border-slate-200", bg: "bg-slate-50" },
};

const STATUS_CONFIG = {
  PAID: { label: "Paid", color: "text-emerald-600 border-emerald-200 bg-emerald-50", icon: CheckCircle },
  UNPAID: { label: "Unpaid", color: "text-yellow-600 border-yellow-200 bg-yellow-50", icon: Clock },
  OVERDUE: { label: "Overdue", color: "text-red-600 border-red-200 bg-red-50", icon: XCircle },
  PARTIAL: { label: "Partial", color: "text-blue-600 border-blue-200 bg-blue-50", icon: TrendingUp },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function ExpensesDashboard() {
  const { user, isAdmin } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<"expenses" | "invoices">("expenses");
  const [subTab, setSubTab] = useState<"dashboard" | "business-expenses" | "stock-purchases" | "purchase-orders" | "vendor-payments" | "debit-notes" | "vendors">("dashboard");
  const [expenses, setExpenses] = useState<BillingExpense[]>([]);
  const [invoices, setInvoices] = useState<BillingInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<BillingInvoice | null>(null);

  // Expense form state
  const [expenseForm, setExpenseForm] = useState({
    title: "",
    amount: "",
    category: "EVENT" as ExpenseCategory,
    description: "",
  });
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchExpenses = async () => {
    try {
      const data = await billingService.getExpenses(0, 50, filterStatus);
      setExpenses(data.content);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load expenses from server");
    }
  };

  const fetchInvoices = async () => {
    try {
      const data = await billingService.getInvoices(0, 50, filterStatus);
      setInvoices(data.content);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load invoices from server");
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    setLoading(true);
    if (activeTab === "expenses") {
      fetchExpenses().finally(() => setLoading(false));
    } else {
      fetchInvoices().finally(() => setLoading(false));
    }
  }, [activeTab, filterStatus]);

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-[#6b7094] font-medium">Access Denied. Administrative privileges required.</p>
      </div>
    );
  }

  // ── Stats ──

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const approvedExpenses = expenses.filter((e) => e.status === "APPROVED").reduce((sum, e) => sum + e.amount, 0);
  const pendingExpenses = expenses.filter((e) => e.status === "PENDING").reduce((sum, e) => sum + e.amount, 0);

  const totalInvoiced = invoices.reduce((sum, i) => sum + i.totalAmount, 0);
  const paidAmount = invoices.filter((i) => i.status === "PAID").reduce((sum, i) => sum + i.totalAmount, 0);
  const unpaidAmount = invoices.filter((i) => i.status !== "PAID").reduce((sum, i) => sum + i.totalAmount, 0);

  // ── Handlers ──

  const handleExpenseSubmit = async () => {
    if (!expenseForm.title.trim() || !expenseForm.amount) {
      toast.error("Title and Amount are required");
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", expenseForm.title);
      formData.append("amount", expenseForm.amount);
      formData.append("category", expenseForm.category);
      formData.append("description", expenseForm.description);
      if (receiptFile) formData.append("receipt", receiptFile);

      await billingService.createExpense(formData);

      setExpenseForm({ title: "", amount: "", category: "EVENT", description: "" });
      setReceiptFile(null);
      setShowExpenseForm(false);
      toast.success("Expense logged successfully");
      fetchExpenses();
    } catch {
      toast.error("Failed to log expense");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveExpense = async (id: number) => {
    try {
      await billingService.approveExpense(id);
      toast.success("Expense approved & invoices generated for residents!");
      fetchExpenses();
    } catch {
      toast.error("Failed to approve expense");
    }
  };

  const handleRejectExpense = async (id: number) => {
    try {
      await billingService.rejectExpense(id);
      toast.success("Expense request rejected");
      fetchExpenses();
    } catch {
      toast.error("Failed to reject expense");
    }
  };

  const handlePayInvoice = async (id: number) => {
    try {
      await billingService.payInvoice(id);
      toast.success("Invoice marked as PAID!");
      fetchInvoices();
    } catch {
      toast.error("Failed to mark invoice as paid");
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

  // ── Filtered Data ──

  const filteredExpenses = expenses.filter((e) => {
    if (searchQuery && !e.title.toLowerCase().includes(searchQuery.toLowerCase()) && !e.category.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const filteredInvoices = invoices.filter((i) => {
    if (searchQuery && !i.residentName.toLowerCase().includes(searchQuery.toLowerCase()) && !i.flatNo.toLowerCase().includes(searchQuery.toLowerCase()) && !i.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen text-[#0d0d2b] p-6 font-sans">
      <Toaster position="top-center" richColors />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <span className="text-xs text-indigo-600 font-bold uppercase tracking-wider">Finance Management</span>
          <h2 className="text-2xl font-black text-[#0d0d2b] flex items-center gap-2 mt-0.5">
            <Receipt className="w-7 h-7 text-indigo-600" />
            Expense Dashboard
          </h2>
          <p className="text-[#6b7094] text-sm mt-1">Track community expenses and manage resident invoices</p>
        </div>
        <div className="flex items-center gap-2">
           
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Side Submenu / Sidebar */}
        <aside className="w-full lg:w-60 shrink-0">
          <div className="bg-white border border-[#6366f1]/12 rounded-2xl p-4 shadow-[0_4px_20px_rgba(99,102,241,0.05)] space-y-1">
            <div className="px-3 mb-2.5">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#6b7094]/65">
                Expenses Menu
              </span>
            </div>
            
            <button
              onClick={() => { setActiveTab("expenses"); setSubTab("dashboard"); }}
              className={cn(
                "w-full flex items-center px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer text-left border",
                activeTab === "expenses" && subTab === "dashboard"
                  ? "text-[#6366f1] bg-[#6366f1]/8 border-[#6366f1]/12 shadow-xs"
                  : "text-[#6b7094] hover:text-[#0d0d2b] hover:bg-slate-50 border-transparent"
              )}
            >
              <Receipt className="w-4 h-4 mr-2.5" />
              Expenses Dashboard
            </button>

            <div className="h-px bg-slate-100 my-2" />

            <button
              onClick={() => { setActiveTab("expenses"); setSubTab("business-expenses"); }}
              className={cn(
                "w-full flex items-center px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer text-left border",
                activeTab === "expenses" && subTab === "business-expenses"
                  ? "text-[#6366f1] bg-[#6366f1]/8 border-[#6366f1]/12 shadow-xs"
                  : "text-[#6b7094] hover:text-[#0d0d2b] hover:bg-slate-50 border-transparent"
              )}
            >
              <CreditCard className="w-4 h-4 mr-2.5" />
              Business Expenses
            </button>

            <button
              onClick={() => { setActiveTab("expenses"); setSubTab("stock-purchases"); }}
              className={cn(
                "w-full flex items-center px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer text-left border",
                activeTab === "expenses" && subTab === "stock-purchases"
                  ? "text-[#6366f1] bg-[#6366f1]/8 border-[#6366f1]/12 shadow-xs"
                  : "text-[#6b7094] hover:text-[#0d0d2b] hover:bg-slate-50 border-transparent"
              )}
            >
              <Plus className="w-4 h-4 mr-2.5" />
              Stock Purchases
            </button>

            <button
              onClick={() => { setActiveTab("expenses"); setSubTab("purchase-orders"); }}
              className={cn(
                "w-full flex items-center px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer text-left border",
                activeTab === "expenses" && subTab === "purchase-orders"
                  ? "text-[#6366f1] bg-[#6366f1]/8 border-[#6366f1]/12 shadow-xs"
                  : "text-[#6b7094] hover:text-[#0d0d2b] hover:bg-slate-50 border-transparent"
              )}
            >
              <FileText className="w-4 h-4 mr-2.5" />
              Purchase Orders
            </button>

            <button
              onClick={() => { setActiveTab("expenses"); setSubTab("vendor-payments"); }}
              className={cn(
                "w-full flex items-center px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer text-left border",
                activeTab === "expenses" && subTab === "vendor-payments"
                  ? "text-[#6366f1] bg-[#6366f1]/8 border-[#6366f1]/12 shadow-xs"
                  : "text-[#6b7094] hover:text-[#0d0d2b] hover:bg-slate-50 border-transparent"
              )}
            >
              <IndianRupee className="w-4 h-4 mr-2.5" />
              Vendor Payments
            </button>

            <button
              onClick={() => { setActiveTab("expenses"); setSubTab("debit-notes"); }}
              className={cn(
                "w-full flex items-center px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer text-left border",
                activeTab === "expenses" && subTab === "debit-notes"
                  ? "text-[#6366f1] bg-[#6366f1]/8 border-[#6366f1]/12 shadow-xs"
                  : "text-[#6b7094] hover:text-[#0d0d2b] hover:bg-slate-50 border-transparent"
              )}
            >
              <FileText className="w-4 h-4 mr-2.5" />
              Debit Notes
            </button>

            <button
              onClick={() => { setActiveTab("expenses"); setSubTab("vendors"); }}
              className={cn(
                "w-full flex items-center px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer text-left border",
                activeTab === "expenses" && subTab === "vendors"
                  ? "text-[#6366f1] bg-[#6366f1]/8 border-[#6366f1]/12 shadow-xs"
                  : "text-[#6b7094] hover:text-[#0d0d2b] hover:bg-slate-50 border-transparent"
              )}
            >
              <TrendingUp className="w-4 h-4 mr-2.5" />
              Vendors
            </button>
          </div>
        </aside>

        {/* Right Side Content Area */}
        <div className="flex-1 min-w-0">
          {subTab === "dashboard" ? (
            <>
              

      {/* Stats */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[150px] mb-6">
          <p className="text-[#6b7094] text-sm">Loading stats...</p>
        </div>
      ) : activeTab === "expenses" ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
          <div className="bg-white border border-[#6366f1]/12 rounded-2xl p-5 shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#6b7094] uppercase tracking-wider">Total Expenses</span>
              <div className="p-2 bg-indigo-50 rounded-lg"><IndianRupee className="w-5 h-5 text-indigo-600" /></div>
            </div>
            <div className="text-2xl font-black text-[#0d0d2b]">{formatCurrency(totalExpenses)}</div>
            <p className="text-xs text-[#6b7094] mt-1">{expenses.length} entries</p>
          </div>
          <div className="bg-white border border-emerald-200 rounded-2xl p-5 shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Approved</span>
              <div className="p-2 bg-emerald-50 rounded-lg"><CheckCircle className="w-5 h-5 text-emerald-600" /></div>
            </div>
            <div className="text-2xl font-black text-emerald-600">{formatCurrency(approvedExpenses)}</div>
            <p className="text-xs text-[#6b7094] mt-1">{expenses.filter((e) => e.status === "APPROVED").length} entries</p>
          </div>
          <div className="bg-white border border-yellow-200 rounded-2xl p-5 shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-yellow-600 uppercase tracking-wider">Pending Approval</span>
              <div className="p-2 bg-yellow-50 rounded-lg"><Clock className="w-5 h-5 text-yellow-600" /></div>
            </div>
            <div className="text-2xl font-black text-yellow-600">{formatCurrency(pendingExpenses)}</div>
            <p className="text-xs text-[#6b7094] mt-1">{expenses.filter((e) => e.status === "PENDING").length} entries</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
          <div className="bg-white border border-[#6366f1]/12 rounded-2xl p-5 shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#6b7094] uppercase tracking-wider">Total Invoiced</span>
              <div className="p-2 bg-indigo-50 rounded-lg"><FileText className="w-5 h-5 text-indigo-600" /></div>
            </div>
            <div className="text-2xl font-black text-[#0d0d2b]">{formatCurrency(totalInvoiced)}</div>
            <p className="text-xs text-[#6b7094] mt-1">{invoices.length} invoices</p>
          </div>
          <div className="bg-white border border-emerald-200 rounded-2xl p-5 shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Collected</span>
              <div className="p-2 bg-emerald-50 rounded-lg"><CheckCircle className="w-5 h-5 text-emerald-600" /></div>
            </div>
            <div className="text-2xl font-black text-emerald-600">{formatCurrency(paidAmount)}</div>
            <p className="text-xs text-[#6b7094] mt-1">{invoices.filter((i) => i.status === "PAID").length} paid</p>
          </div>
          <div className="bg-white border border-red-200 rounded-2xl p-5 shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-red-600 uppercase tracking-wider">Outstanding</span>
              <div className="p-2 bg-red-50 rounded-lg"><XCircle className="w-5 h-5 text-red-600" /></div>
            </div>
            <div className="text-2xl font-black text-red-600">{formatCurrency(unpaidAmount)}</div>
            <p className="text-xs text-[#6b7094] mt-1">{invoices.filter((i) => i.status !== "PAID").length} unpaid</p>
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7094] w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={activeTab === "expenses" ? "Search expenses..." : "Search by name, flat, or invoice #..."}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-[#0d0d2b] placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-4 h-4 text-[#6b7094] flex-shrink-0" />
          {activeTab === "expenses"
            ? (["all", "PENDING", "APPROVED", "REJECTED"] as const).map((s) => (
                <button key={s} onClick={() => setFilterStatus(s)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    filterStatus === s ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20" : "bg-white text-[#6b7094] border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {s === "all" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
                </button>
              ))
            : (["all", "PAID", "UNPAID", "OVERDUE"] as const).map((s) => (
                <button key={s} onClick={() => setFilterStatus(s)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    filterStatus === s ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20" : "bg-white text-[#6b7094] border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {s === "all" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
                </button>
              ))}
        </div>
      </div>

      {/* Tables & Loader */}
      {loading ? (
        <div className="bg-white border border-[#6366f1]/12 py-20 text-center text-[#6b7094] rounded-2xl shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
          Loading data from server...
        </div>
      ) : activeTab === "expenses" ? (
        <div className="bg-white border border-[#6366f1]/12 rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-[#6b7094] uppercase tracking-wider">
                  <th className="px-6 py-4.5">Expense</th>
                  <th className="px-6 py-4.5">Category</th>
                  <th className="px-6 py-4.5 text-right">Amount</th>
                  <th className="px-6 py-4.5">Receipt</th>
                  <th className="px-6 py-4.5">Date</th>
                  <th className="px-6 py-4.5">Status</th>
                  <th className="px-6 py-4.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredExpenses.map((expense) => {
                  const cat = CATEGORY_CONFIG[expense.category as ExpenseCategory] || CATEGORY_CONFIG.OTHER;
                  return (
                    <tr key={expense.id} className="hover:bg-indigo-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-[#0d0d2b]">{expense.title}</div>
                        {expense.description && (
                          <div className="text-xs text-[#6b7094] mt-0.5 line-clamp-1">{expense.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 text-[10px] font-bold border uppercase tracking-wider rounded-full ${cat.bg} ${cat.color} ${cat.color.replace('text-', 'border-').split(' ')[1] || ''}`}>
                          {cat.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-bold text-[#0d0d2b]">{formatCurrency(expense.amount)}</span>
                      </td>
                      <td className="px-6 py-4">
                        {expense.receiptFileName ? (
                          <a href={expense.receiptUrl || "#"} className="text-indigo-600 hover:text-indigo-800 text-xs font-semibold flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5" />
                            {expense.receiptFileName}
                          </a>
                        ) : (
                          <span className="text-xs text-[#6b7094]">No receipt</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-[#6b7094]">
                        {new Date(expense.createdAt).toLocaleDateString("en-IN")}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 text-[10px] font-bold border uppercase tracking-wider rounded-full ${
                          expense.status === "APPROVED" ? "bg-emerald-50 border-emerald-200 text-emerald-600" :
                          expense.status === "PENDING" ? "bg-yellow-50 border-yellow-200 text-yellow-600" :
                          "bg-red-50 border-red-200 text-red-600"
                        }`}>
                          {expense.status.charAt(0) + expense.status.slice(1).toLowerCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {expense.status === "PENDING" && (
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => handleRejectExpense(expense.id)}
                              className="p-1 text-[#6b7094] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Reject Expense"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleApproveExpense(expense.id)}
                              className="p-1 text-[#6b7094] hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              title="Approve & Split Invoices"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filteredExpenses.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-[#6b7094]">
                      No expenses found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-[#6366f1]/12 rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-[#6b7094] uppercase tracking-wider">
                  <th className="px-6 py-4.5">Invoice #</th>
                  <th className="px-6 py-4.5">Resident</th>
                  <th className="px-6 py-4.5">Event</th>
                  <th className="px-6 py-4.5 text-right">Amount</th>
                  <th className="px-6 py-4.5 text-right">GST (18%)</th>
                  <th className="px-6 py-4.5 text-right">Total</th>
                  <th className="px-6 py-4.5">Due Date</th>
                  <th className="px-6 py-4.5">Status</th>
                  <th className="px-6 py-4.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredInvoices.map((inv) => {
                  const statusCfg = STATUS_CONFIG[inv.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.UNPAID;
                  const StatusIcon = statusCfg.icon;
                  return (
                    <tr key={inv.id} className="hover:bg-indigo-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-sm font-mono font-bold text-[#0d0d2b]">{inv.invoiceNumber}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-[#0d0d2b]">{inv.residentName}</div>
                        <div className="text-xs text-[#6b7094]">Flat {inv.flatNo}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-[#374151]">{inv.eventTitle || "—"}</span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-[#374151]">{formatCurrency(inv.taxableAmount)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="text-sm text-[#374151]">{formatCurrency(inv.cgst + inv.sgst)}</div>
                        <div className="text-[10px] text-[#6b7094]">CGST {formatCurrency(inv.cgst)} + SGST {formatCurrency(inv.sgst)}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-bold text-[#0d0d2b]">{formatCurrency(inv.totalAmount)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-[#6b7094] flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-[#6b7094]" />
                          {new Date(inv.dueDate).toLocaleDateString("en-IN")}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 text-[10px] font-bold border uppercase tracking-wider rounded-full ${statusCfg.color} inline-flex items-center gap-1`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right flex gap-2 justify-end items-center">
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="text-indigo-600 hover:text-indigo-800 p-1 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {inv.status !== "PAID" && (
                          <button
                            onClick={() => handlePayInvoice(inv.id)}
                            className="text-emerald-600 hover:text-emerald-800 p-1 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="Mark as Paid"
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filteredInvoices.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-[#6b7094]">
                      No invoices found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
            </>
          ) : subTab === "business-expenses" ? (
            <div className="space-y-6">
              {/* Business Expenses Dashboard */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="bg-white border border-[#6366f1]/12 rounded-2xl p-5 shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
                  <span className="text-xs font-bold text-[#6b7094] uppercase tracking-wider block mb-2">Total Business Expenses</span>
                  <div className="text-2xl font-black text-[#0d0d2b]">INR 48,500.00</div>
                  <p className="text-xs text-[#6b7094] mt-1">5 active logs</p>
                </div>
                <div className="bg-white border border-emerald-200 rounded-2xl p-5 shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
                  <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block mb-2">Paid amount</span>
                  <div className="text-2xl font-black text-emerald-600">INR 40,700.00</div>
                  <p className="text-xs text-[#6b7094] mt-1">4 transactions</p>
                </div>
                <div className="bg-white border border-yellow-200 rounded-2xl p-5 shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
                  <span className="text-xs font-bold text-yellow-600 uppercase tracking-wider block mb-2">Outstanding</span>
                  <div className="text-2xl font-black text-yellow-600">INR 7,800.00</div>
                  <p className="text-xs text-[#6b7094] mt-1">1 pending payment</p>
                </div>
              </div>

              <div className="bg-white border border-[#6366f1]/12 rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
                <div className="px-6 py-4.5 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="text-sm font-black text-[#0d0d2b]">Business Expense Ledger</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-[#6b7094] uppercase tracking-wider">
                        <th className="px-6 py-4.5">Expense Details</th>
                        <th className="px-6 py-4.5">Vendor</th>
                        <th className="px-6 py-4.5">Category</th>
                        <th className="px-6 py-4.5 text-right">Amount</th>
                        <th className="px-6 py-4.5">Date</th>
                        <th className="px-6 py-4.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {[
                        { title: "Monthly Server Cloud Hosting", vendor: "AWS Cloud", category: "IT & Software", amount: 18200, date: "2026-06-25", status: "Paid" },
                        { title: "Security Guards Uniforms", vendor: "Standard Uniforms", category: "Operations", amount: 15800, date: "2026-06-20", status: "Paid" },
                        { title: "Plumbing Equipment Repair Tools", vendor: "Hardware Depot", category: "Maintenance", amount: 7800, date: "2026-06-10", status: "Pending" },
                        { title: "Office Stationery & Printer Ink", vendor: "Amazon Business", category: "Office Supplies", amount: 4500, date: "2026-06-28", status: "Paid" },
                        { title: "Community Hall Tea & Refreshments", vendor: "Local Chai Vendor", category: "Refreshments", amount: 2200, date: "2026-06-15", status: "Paid" },
                      ].map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4 font-bold text-[#0d0d2b]">{item.title}</td>
                          <td className="px-6 py-4 text-[#374151]">{item.vendor}</td>
                          <td className="px-6 py-4 text-xs text-[#6b7094]">{item.category}</td>
                          <td className="px-6 py-4 text-right font-bold text-[#0d0d2b]">{formatCurrency(item.amount)}</td>
                          <td className="px-6 py-4 text-xs text-[#6b7094]">{item.date}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 text-[10px] font-bold border uppercase tracking-wider rounded-full ${
                              item.status === "Paid" ? "bg-emerald-50 border-emerald-200 text-emerald-600" : "bg-yellow-50 border-yellow-200 text-yellow-600"
                            }`}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : subTab === "stock-purchases" ? (
            <div className="space-y-6">
              {/* Stock Purchases Dashboard */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="bg-white border border-[#6366f1]/12 rounded-2xl p-5 shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
                  <span className="text-xs font-bold text-[#6b7094] uppercase tracking-wider block mb-2">Total Stock Value</span>
                  <div className="text-2xl font-black text-[#0d0d2b]">INR 85,200.00</div>
                  <p className="text-xs text-[#6b7094] mt-1">162 received items</p>
                </div>
                <div className="bg-white border border-emerald-200 rounded-2xl p-5 shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
                  <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block mb-2">Delivered Orders</span>
                  <div className="text-2xl font-black text-emerald-600">4 orders</div>
                  <p className="text-xs text-[#6b7094] mt-1">Fully checked & stocked</p>
                </div>
                <div className="bg-white border border-yellow-200 rounded-2xl p-5 shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
                  <span className="text-xs font-bold text-yellow-600 uppercase tracking-wider block mb-2">Pending Delivery</span>
                  <div className="text-2xl font-black text-yellow-600">1 order</div>
                  <p className="text-xs text-[#6b7094] mt-1">Estimated delivery: 2 days</p>
                </div>
              </div>

              <div className="bg-white border border-[#6366f1]/12 rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
                <div className="px-6 py-4.5 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="text-sm font-black text-[#0d0d2b]">Stock Purchase History</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-[#6b7094] uppercase tracking-wider">
                        <th className="px-6 py-4.5">Item Purchased</th>
                        <th className="px-6 py-4.5">Vendor</th>
                        <th className="px-6 py-4.5">Quantity</th>
                        <th className="px-6 py-4.5 text-right">Total Cost</th>
                        <th className="px-6 py-4.5">Purchase Date</th>
                        <th className="px-6 py-4.5">Delivery Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {[
                        { title: "High-Speed CCTV Dome Cameras", vendor: "SafeVision Security", qty: "8 units", amount: 32000, date: "2026-06-24", status: "Delivered" },
                        { title: "Swimming Pool Chlorine Drums", vendor: "AquaChem Ind.", qty: "5 drums", amount: 16500, date: "2026-06-12", status: "Delivered" },
                        { title: "Backup Diesel Generator Spares", vendor: "PowerSpares Ltd.", qty: "2 units", amount: 15800, date: "2026-06-08", status: "Pending" },
                        { title: "LED Tubelights & Bulbs", vendor: "Electrical World", qty: "50 units", amount: 12500, date: "2026-06-28", status: "Delivered" },
                        { title: "Garden Fertilizer & Grass Seeds", vendor: "GreenLife Nursery", qty: "20 bags", amount: 8400, date: "2026-06-18", status: "Delivered" },
                      ].map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4 font-bold text-[#0d0d2b]">{item.title}</td>
                          <td className="px-6 py-4 text-[#374151]">{item.vendor}</td>
                          <td className="px-6 py-4 text-xs text-[#6b7094]">{item.qty}</td>
                          <td className="px-6 py-4 text-right font-bold text-[#0d0d2b]">{formatCurrency(item.amount)}</td>
                          <td className="px-6 py-4 text-xs text-[#6b7094]">{item.date}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 text-[10px] font-bold border uppercase tracking-wider rounded-full ${
                              item.status === "Delivered" ? "bg-emerald-50 border-emerald-200 text-emerald-600" : "bg-yellow-50 border-yellow-200 text-yellow-600"
                            }`}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : subTab === "purchase-orders" ? (
            <div className="space-y-6">
              {/* Purchase Orders Dashboard */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="bg-white border border-[#6366f1]/12 rounded-2xl p-5 shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
                  <span className="text-xs font-bold text-[#6b7094] uppercase tracking-wider block mb-2">Total PO Amount</span>
                  <div className="text-2xl font-black text-[#0d0d2b]">INR 1,24,000.00</div>
                  <p className="text-xs text-[#6b7094] mt-1">5 purchase orders raised</p>
                </div>
                <div className="bg-white border border-emerald-200 rounded-2xl p-5 shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
                  <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block mb-2">Approved & Closed</span>
                  <div className="text-2xl font-black text-emerald-600">4 POs</div>
                  <p className="text-xs text-[#6b7094] mt-1">Contracts executed</p>
                </div>
                <div className="bg-white border border-yellow-200 rounded-2xl p-5 shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
                  <span className="text-xs font-bold text-yellow-600 uppercase tracking-wider block mb-2">Pending Approval</span>
                  <div className="text-2xl font-black text-yellow-600">1 PO</div>
                  <p className="text-xs text-[#6b7094] mt-1">Awaiting management signoff</p>
                </div>
              </div>

              <div className="bg-white border border-[#6366f1]/12 rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
                <div className="px-6 py-4.5 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="text-sm font-black text-[#0d0d2b]">Purchase Orders Registry</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-[#6b7094] uppercase tracking-wider">
                        <th className="px-6 py-4.5">PO Number</th>
                        <th className="px-6 py-4.5">Vendor Name</th>
                        <th className="px-6 py-4.5">Raised By</th>
                        <th className="px-6 py-4.5 text-right">Amount</th>
                        <th className="px-6 py-4.5">Date</th>
                        <th className="px-6 py-4.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {[
                        { po: "PO-2026-0045", vendor: "Apex Construction", raisedBy: "Maintenance Admin", amount: 45000, date: "2026-06-29", status: "Pending" },
                        { po: "PO-2026-0044", vendor: "Elite Elevators", raisedBy: "Facilities Manager", amount: 35000, date: "2026-06-26", status: "Approved" },
                        { po: "PO-2026-0043", vendor: "Super Cleaners", raisedBy: "Sanitation Lead", amount: 12800, date: "2026-06-20", status: "Closed" },
                        { po: "PO-2026-0042", vendor: "SecureLink Systems", raisedBy: "IT Coordinator", amount: 18200, date: "2026-06-15", status: "Closed" },
                        { po: "PO-2026-0041", vendor: "Greenery Landscapes", raisedBy: "Garden Committee", amount: 13000, date: "2026-06-10", status: "Closed" },
                      ].map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4 font-mono font-bold text-[#0d0d2b]">{item.po}</td>
                          <td className="px-6 py-4 text-[#374151]">{item.vendor}</td>
                          <td className="px-6 py-4 text-xs text-[#6b7094]">{item.raisedBy}</td>
                          <td className="px-6 py-4 text-right font-bold text-[#0d0d2b]">{formatCurrency(item.amount)}</td>
                          <td className="px-6 py-4 text-xs text-[#6b7094]">{item.date}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 text-[10px] font-bold border uppercase tracking-wider rounded-full ${
                              item.status === "Closed" ? "bg-slate-100 border-slate-200 text-slate-600" :
                              item.status === "Approved" ? "bg-emerald-50 border-emerald-200 text-emerald-600" :
                              "bg-yellow-50 border-yellow-200 text-yellow-600"
                            }`}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : subTab === "vendor-payments" ? (
            <div className="space-y-6">
              {/* Vendor Payments Dashboard */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="bg-white border border-[#6366f1]/12 rounded-2xl p-5 shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
                  <span className="text-xs font-bold text-[#6b7094] uppercase tracking-wider block mb-2">Total Disbursed</span>
                  <div className="text-2xl font-black text-[#0d0d2b]">INR 1,92,000.00</div>
                  <p className="text-xs text-[#6b7094] mt-1">4 processed vendor payouts</p>
                </div>
                <div className="bg-white border border-emerald-200 rounded-2xl p-5 shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
                  <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block mb-2">Completed Payments</span>
                  <div className="text-2xl font-black text-emerald-600">4 payments</div>
                  <p className="text-xs text-[#6b7094] mt-1">Settled to bank accounts</p>
                </div>
                <div className="bg-white border border-yellow-200 rounded-2xl p-5 shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
                  <span className="text-xs font-bold text-yellow-600 uppercase tracking-wider block mb-2">In Flight</span>
                  <div className="text-2xl font-black text-yellow-600">INR 24,000.00</div>
                  <p className="text-xs text-[#6b7094] mt-1">1 UPI transaction processing</p>
                </div>
              </div>

              <div className="bg-white border border-[#6366f1]/12 rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
                <div className="px-6 py-4.5 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="text-sm font-black text-[#0d0d2b]">Vendor Payout Ledger</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-[#6b7094] uppercase tracking-wider">
                        <th className="px-6 py-4.5">Reference #</th>
                        <th className="px-6 py-4.5">Vendor Name</th>
                        <th className="px-6 py-4.5">Payment Mode</th>
                        <th className="px-6 py-4.5 text-right">Paid Amount</th>
                        <th className="px-6 py-4.5">Date</th>
                        <th className="px-6 py-4.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {[
                        { ref: "TXN-9028481", vendor: "SafeVision Security", mode: "Bank Transfer", amount: 32000, date: "2026-06-28", status: "Success" },
                        { ref: "TXN-9028452", vendor: "AWS Cloud", mode: "Credit Card", amount: 18200, date: "2026-06-26", status: "Success" },
                        { ref: "TXN-9028410", vendor: "Standard Uniforms", mode: "UPI", amount: 15800, date: "2026-06-22", status: "Success" },
                        { ref: "TXN-9028389", vendor: "Electrical World", mode: "Net Banking", amount: 12500, date: "2026-06-19", status: "Success" },
                        { ref: "TXN-9028350", vendor: "Apex Construction", mode: "UPI", amount: 24000, date: "2026-06-15", status: "Processing" },
                      ].map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4 font-mono text-[#374151]">{item.ref}</td>
                          <td className="px-6 py-4 font-bold text-[#0d0d2b]">{item.vendor}</td>
                          <td className="px-6 py-4 text-xs text-[#6b7094]">{item.mode}</td>
                          <td className="px-6 py-4 text-right font-bold text-[#0d0d2b]">{formatCurrency(item.amount)}</td>
                          <td className="px-6 py-4 text-xs text-[#6b7094]">{item.date}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 text-[10px] font-bold border uppercase tracking-wider rounded-full ${
                              item.status === "Success" ? "bg-emerald-50 border-emerald-200 text-emerald-600" : "bg-yellow-50 border-yellow-200 text-yellow-600"
                            }`}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : subTab === "debit-notes" ? (
            <div className="space-y-6">
              {/* Debit Notes Dashboard */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="bg-white border border-[#6366f1]/12 rounded-2xl p-5 shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
                  <span className="text-xs font-bold text-[#6b7094] uppercase tracking-wider block mb-2">Total Credit Value</span>
                  <div className="text-2xl font-black text-[#0d0d2b]">INR 18,500.00</div>
                  <p className="text-xs text-[#6b7094] mt-1">4 active debit notes</p>
                </div>
                <div className="bg-white border border-emerald-200 rounded-2xl p-5 shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
                  <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block mb-2">Refunded / Adjusted</span>
                  <div className="text-2xl font-black text-emerald-600">INR 11,000.00</div>
                  <p className="text-xs text-[#6b7094] mt-1">2 settled notes</p>
                </div>
                <div className="bg-white border border-yellow-200 rounded-2xl p-5 shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
                  <span className="text-xs font-bold text-yellow-600 uppercase tracking-wider block mb-2">Open Balances</span>
                  <div className="text-2xl font-black text-yellow-600">INR 7,500.00</div>
                  <p className="text-xs text-[#6b7094] mt-1">2 outstanding notes</p>
                </div>
              </div>

              <div className="bg-white border border-[#6366f1]/12 rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
                <div className="px-6 py-4.5 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="text-sm font-black text-[#0d0d2b]">Vendor Debit Notes Ledger</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-[#6b7094] uppercase tracking-wider">
                        <th className="px-6 py-4.5">Debit Note #</th>
                        <th className="px-6 py-4.5">Original Inv #</th>
                        <th className="px-6 py-4.5">Vendor Name</th>
                        <th className="px-6 py-4.5 text-right">Credit Amount</th>
                        <th className="px-6 py-4.5">Date</th>
                        <th className="px-6 py-4.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {[
                        { dn: "DN-2026-008", inv: "INV-EL-8822", vendor: "Electrical World", amount: 3500, date: "2026-06-27", status: "Open" },
                        { dn: "DN-2026-007", inv: "INV-SL-9011", vendor: "SecureLink Systems", amount: 7500, date: "2026-06-20", status: "Refunded" },
                        { dn: "DN-2026-006", inv: "INV-AM-1048", vendor: "Amazon Business", amount: 1500, date: "2026-06-15", status: "Refunded" },
                        { dn: "DN-2026-005", inv: "INV-HW-7733", vendor: "Hardware Depot", amount: 6000, date: "2026-06-10", status: "Open" },
                      ].map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4 font-mono font-bold text-[#0d0d2b]">{item.dn}</td>
                          <td className="px-6 py-4 font-mono text-[#6b7094]">{item.inv}</td>
                          <td className="px-6 py-4 font-bold text-[#0d0d2b]">{item.vendor}</td>
                          <td className="px-6 py-4 text-right font-bold text-[#0d0d2b]">{formatCurrency(item.amount)}</td>
                          <td className="px-6 py-4 text-xs text-[#6b7094]">{item.date}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 text-[10px] font-bold border uppercase tracking-wider rounded-full ${
                              item.status === "Refunded" ? "bg-slate-100 border-slate-200 text-slate-600" : "bg-emerald-50 border-emerald-200 text-emerald-600"
                            }`}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Vendors List */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="bg-white border border-[#6366f1]/12 rounded-2xl p-5 shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
                  <span className="text-xs font-bold text-[#6b7094] uppercase tracking-wider block mb-2">Registered Vendors</span>
                  <div className="text-2xl font-black text-[#0d0d2b]">12 vendors</div>
                  <p className="text-xs text-[#6b7094] mt-1">Verified partner registry</p>
                </div>
                <div className="bg-white border border-emerald-200 rounded-2xl p-5 shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
                  <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block mb-2">Total Paid (YTD)</span>
                  <div className="text-2xl font-black text-emerald-600">INR 2,85,000.00</div>
                  <p className="text-xs text-[#6b7094] mt-1">Contract payouts</p>
                </div>
                <div className="bg-white border border-yellow-200 rounded-2xl p-5 shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
                  <span className="text-xs font-bold text-yellow-600 uppercase tracking-wider block mb-2">Vendor Rating Avg</span>
                  <div className="text-2xl font-black text-yellow-600">4.6 / 5.0</div>
                  <p className="text-xs text-[#6b7094] mt-1">Based on SLA performance</p>
                </div>
              </div>

              <div className="bg-white border border-[#6366f1]/12 rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
                <div className="px-6 py-4.5 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="text-sm font-black text-[#0d0d2b]">Partner Vendor Directory</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-[#6b7094] uppercase tracking-wider">
                        <th className="px-6 py-4.5">Vendor Name</th>
                        <th className="px-6 py-4.5">Business Category</th>
                        <th className="px-6 py-4.5">Contact Details</th>
                        <th className="px-6 py-4.5">Performance Rating</th>
                        <th className="px-6 py-4.5">SLA Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {[
                        { name: "SafeVision Security", cat: "Security Systems", contact: "info@safevision.com · +91 98765 43210", rating: "4.8 / 5.0", status: "Active" },
                        { name: "Electrical World", cat: "Electrical Spares", contact: "sales@elecworld.com · +91 98765 43211", rating: "4.5 / 5.0", status: "Active" },
                        { name: "AWS Cloud", cat: "Cloud Infrastructure", contact: "billing@aws.com · Online Portal", rating: "4.9 / 5.0", status: "Active" },
                        { name: "Apex Construction", cat: "Civil Work & Repair", contact: "contact@apexconstruct.in · +91 98765 43212", rating: "4.1 / 5.0", status: "Active" },
                        { name: "GreenLife Nursery", cat: "Gardening & Landscape", contact: "trees@greenlife.com · +91 98765 43213", rating: "4.6 / 5.0", status: "Active" },
                      ].map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4 font-bold text-[#0d0d2b]">{item.name}</td>
                          <td className="px-6 py-4 text-[#374151]">{item.cat}</td>
                          <td className="px-6 py-4 text-xs text-[#6b7094]">{item.contact}</td>
                          <td className="px-6 py-4 text-xs font-bold text-indigo-600">{item.rating}</td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-0.5 text-[10px] font-bold border uppercase tracking-wider rounded-full bg-emerald-50 border-emerald-200 text-emerald-600">
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Log Expense Modal */}
      {showExpenseForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowExpenseForm(false)}>
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-lg w-full p-0 overflow-hidden animate-in zoom-in-95 duration-150" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#0d0d2b] flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" />
                Log Community Expense
              </h3>
              <button onClick={() => setShowExpenseForm(false)} className="p-2 text-[#6b7094] hover:text-[#0d0d2b] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6b7094] mb-1.5">Title *</label>
                <input
                  type="text" value={expenseForm.title}
                  onChange={(e) => setExpenseForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g., Diwali Celebration Expenses"
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-[#0d0d2b] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#6b7094] mb-1.5">Amount (INR) *</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7094]" />
                    <input
                      type="number" min="0" value={expenseForm.amount}
                      onChange={(e) => setExpenseForm((f) => ({ ...f, amount: e.target.value }))}
                      placeholder="0"
                      className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-[#0d0d2b] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#6b7094] mb-1.5">Category</label>
                  <select
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm((f) => ({ ...f, category: e.target.value as ExpenseCategory }))}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-[#0d0d2b] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 cursor-pointer"
                  >
                    {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                      <option key={key} value={key}>{cfg.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6b7094] mb-1.5">Description</label>
                <textarea
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  placeholder="Brief description of the expense..."
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-[#0d0d2b] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6b7094] mb-1.5">Receipt Upload</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-sm text-[#6b7094] hover:border-indigo-400 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2 cursor-pointer bg-white"
                >
                  <Upload className="w-4 h-4" />
                  {receiptFile ? receiptFile.name : "Click to upload receipt (PDF, JPG, PNG)"}
                </button>
              </div>

              {expenseForm.amount && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <div className="text-[10px] font-bold text-[#6b7094] uppercase tracking-wider mb-2">GST Preview</div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-[#6b7094]">Base:</span>
                      <p className="font-semibold text-[#0d0d2b] mt-0.5">{formatCurrency(parseFloat(expenseForm.amount) || 0)}</p>
                    </div>
                    <div>
                      <span className="text-[#6b7094]">CGST (9%):</span>
                      <p className="font-semibold text-[#0d0d2b] mt-0.5">{formatCurrency((parseFloat(expenseForm.amount) || 0) * 0.09)}</p>
                    </div>
                    <div>
                      <span className="text-[#6b7094]">SGST (9%):</span>
                      <p className="font-semibold text-[#0d0d2b] mt-0.5">{formatCurrency((parseFloat(expenseForm.amount) || 0) * 0.09)}</p>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-200 flex justify-between items-center">
                    <span className="text-xs font-bold text-[#374151]">Total with GST:</span>
                    <span className="text-sm font-black text-indigo-600">
                      {formatCurrency((parseFloat(expenseForm.amount) || 0) * 1.18)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 px-6 py-4 flex gap-3 bg-slate-50/60">
              <button
                type="button"
                onClick={() => setShowExpenseForm(false)}
                className="flex-1 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-[#6b7094] font-bold rounded-xl transition-all cursor-pointer text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExpenseSubmit}
                disabled={submitting}
                className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-95 shadow-md shadow-indigo-500/20 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-xs"
              >
                {submitting ? "Saving..." : "Log Expense"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedInvoice(null)}>
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-150" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#0d0d2b]">Invoice Details</h3>
              <button onClick={() => setSelectedInvoice(null)} className="p-2 text-[#6b7094] hover:text-[#0d0d2b] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-[#6b7094]">Invoice Number</p>
                  <p className="font-mono font-bold text-lg text-[#0d0d2b]">{selectedInvoice.invoiceNumber}</p>
                </div>
                {(() => {
                  const cfg = STATUS_CONFIG[selectedInvoice.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.UNPAID;
                  const Icon = cfg.icon;
                  return (
                    <span className={`px-3 py-1 text-xs font-bold border uppercase tracking-wider rounded-full ${cfg.color} flex items-center gap-1.5`}>
                      <Icon className="w-4 h-4" /> {cfg.label}
                    </span>
                  );
                })()}
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="text-[#6b7094]">Resident</span>
                  <span className="font-semibold text-[#0d0d2b]">{selectedInvoice.residentName}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#6b7094]">Flat No</span>
                  <span className="font-semibold text-[#0d0d2b]">{selectedInvoice.flatNo}</span>
                </div>
                {selectedInvoice.eventTitle && (
                  <div className="flex justify-between text-xs">
                    <span className="text-[#6b7094]">Event</span>
                    <span className="font-semibold text-[#0d0d2b]">{selectedInvoice.eventTitle}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs">
                  <span className="text-[#6b7094]">Due Date</span>
                  <span className="font-semibold text-[#0d0d2b]">{new Date(selectedInvoice.dueDate).toLocaleDateString("en-IN")}</span>
                </div>
              </div>

              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 space-y-2">
                <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Tax Breakdown</div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#6b7094]">Taxable Amount</span>
                  <span className="font-semibold text-[#0d0d2b]">{formatCurrency(selectedInvoice.taxableAmount)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#6b7094]">CGST @ 9%</span>
                  <span className="font-semibold text-[#0d0d2b]">{formatCurrency(selectedInvoice.cgst)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#6b7094]">SGST @ 9%</span>
                  <span className="font-semibold text-[#0d0d2b]">{formatCurrency(selectedInvoice.sgst)}</span>
                </div>
                <div className="pt-2 border-t border-indigo-200 flex justify-between items-center">
                  <span className="font-bold text-[#0d0d2b] text-sm">Total</span>
                  <span className="font-black text-indigo-600 text-base">{formatCurrency(selectedInvoice.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ChevronRight helper
function ChevronRight(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  );
}
