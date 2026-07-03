import { useState, useEffect } from "react";
import {
  FileText, Search, Calendar, Filter, CheckCircle, XCircle, Clock,
  CreditCard, Eye, X, IndianRupee, Download, Receipt, TrendingUp, Plus
} from "lucide-react";
import { toast, Toaster } from "sonner";
import { billingService, type BillingInvoice } from "../../../services/billingService";
import { cn } from "../ui/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  PAID: { label: "Paid", icon: CheckCircle, color: "bg-emerald-50 border-emerald-200 text-emerald-600" },
  UNPAID: { label: "Unpaid", icon: Clock, color: "bg-yellow-50 border-yellow-200 text-yellow-600" },
  OVERDUE: { label: "Overdue", icon: XCircle, color: "bg-red-50 border-red-200 text-red-600" },
  PARTIAL: { label: "Partial", icon: Clock, color: "bg-blue-50 border-blue-200 text-blue-600" },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function InvoicesDashboard() {
  const [invoices, setInvoices] = useState<BillingInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<BillingInvoice | null>(null);
  const [subTab, setSubTab] = useState<"dashboard" | "receipts" | "estimates" | "sales-orders" | "credit-notes" | "customers">("dashboard");

  const fetchInvoices = async () => {
    try {
      const data = await billingService.getInvoices(0, 100, filterStatus);
      setInvoices(data.content);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load resident billing invoices");
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchInvoices().finally(() => setLoading(false));
  }, [filterStatus]);

  const handlePayInvoice = async (id: number) => {
    try {
      await billingService.payInvoice(id);
      toast.success("Invoice marked as PAID successfully!");
      fetchInvoices();
      if (selectedInvoice && selectedInvoice.id === id) {
        setSelectedInvoice((prev) => prev ? { ...prev, status: "PAID", paidAt: new Date().toISOString() } : null);
      }
    } catch {
      toast.error("Failed to update payment status");
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

  // ─── Computed ───────────────────────────────────────────────────────────────

  const totalInvoiced = invoices.reduce((sum, i) => sum + i.totalAmount, 0);
  const paidAmount = invoices.filter((i) => i.status === "PAID").reduce((sum, i) => sum + i.totalAmount, 0);
  const unpaidAmount = invoices.filter((i) => i.status !== "PAID").reduce((sum, i) => sum + i.totalAmount, 0);

  const filteredInvoices = invoices.filter((i) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      i.invoiceNumber.toLowerCase().includes(query) ||
      i.residentName.toLowerCase().includes(query) ||
      i.flatNo.toLowerCase().includes(query) ||
      (i.eventTitle && i.eventTitle.toLowerCase().includes(query))
    );
  });

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen text-[#0d0d2b] p-6 font-sans">
      <Toaster position="top-center" richColors />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <span className="text-xs text-indigo-600 font-bold uppercase tracking-wider">Finance Management</span>
          <h2 className="text-2xl font-black text-[#0d0d2b] flex items-center gap-2 mt-0.5">
            <FileText className="w-7 h-7 text-indigo-600" />
            Invoices & Payments
          </h2>
          <p className="text-[#6b7094] text-sm mt-1">Audit resident maintenance billing and process payments ledger</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-95 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 shadow-md shadow-indigo-500/20 cursor-pointer">
            <Plus className="w-4 h-4" />
            New Invoice
          </button>
          <button className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-[#374151] text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Side Submenu / Sidebar */}
        <aside className="w-full lg:w-60 shrink-0">
          <div className="bg-white border border-[#6366f1]/12 rounded-2xl p-4 shadow-[0_4px_20px_rgba(99,102,241,0.05)] space-y-1">
            <div className="px-3 mb-2.5">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#6b7094]/65">
                Income Menu
              </span>
            </div>

            <button
              onClick={() => setSubTab("dashboard")}
              className={cn(
                "w-full flex items-center px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer text-left border",
                subTab === "dashboard"
                  ? "text-[#6366f1] bg-[#6366f1]/8 border-[#6366f1]/12 shadow-xs"
                  : "text-[#6b7094] hover:text-[#0d0d2b] hover:bg-slate-50 border-transparent"
              )}
            >
              <FileText className="w-4 h-4 mr-2.5" />
              Invoices Dashboard
            </button>

            <div className="h-px bg-slate-100 my-2" />

            <button
              onClick={() => setSubTab("receipts")}
              className={cn(
                "w-full flex items-center px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer text-left border",
                subTab === "receipts"
                  ? "text-[#6366f1] bg-[#6366f1]/8 border-[#6366f1]/12 shadow-xs"
                  : "text-[#6b7094] hover:text-[#0d0d2b] hover:bg-slate-50 border-transparent"
              )}
            >
              <Receipt className="w-4 h-4 mr-2.5" />
              Receipts
            </button>

            <button
              onClick={() => setSubTab("estimates")}
              className={cn(
                "w-full flex items-center px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer text-left border",
                subTab === "estimates"
                  ? "text-[#6366f1] bg-[#6366f1]/8 border-[#6366f1]/12 shadow-xs"
                  : "text-[#6b7094] hover:text-[#0d0d2b] hover:bg-slate-50 border-transparent"
              )}
            >
              <FileText className="w-4 h-4 mr-2.5" />
              Estimates
            </button>

            <button
              onClick={() => setSubTab("sales-orders")}
              className={cn(
                "w-full flex items-center px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer text-left border",
                subTab === "sales-orders"
                  ? "text-[#6366f1] bg-[#6366f1]/8 border-[#6366f1]/12 shadow-xs"
                  : "text-[#6b7094] hover:text-[#0d0d2b] hover:bg-slate-50 border-transparent"
              )}
            >
              <TrendingUp className="w-4 h-4 mr-2.5" />
              Sales Orders
            </button>

            <button
              onClick={() => setSubTab("credit-notes")}
              className={cn(
                "w-full flex items-center px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer text-left border",
                subTab === "credit-notes"
                  ? "text-[#6366f1] bg-[#6366f1]/8 border-[#6366f1]/12 shadow-xs"
                  : "text-[#6b7094] hover:text-[#0d0d2b] hover:bg-slate-50 border-transparent"
              )}
            >
              <CreditCard className="w-4 h-4 mr-2.5" />
              Credit Notes
            </button>

            <button
              onClick={() => setSubTab("customers")}
              className={cn(
                "w-full flex items-center px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer text-left border",
                subTab === "customers"
                  ? "text-[#6366f1] bg-[#6366f1]/8 border-[#6366f1]/12 shadow-xs"
                  : "text-[#6b7094] hover:text-[#0d0d2b] hover:bg-slate-50 border-transparent"
              )}
            >
              <IndianRupee className="w-4 h-4 mr-2.5" />
              Customers
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
                    placeholder="Search by name, flat, or invoice #..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-[#0d0d2b] placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                  />
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                  <Filter className="w-4 h-4 text-[#6b7094] flex-shrink-0" />
                  {(["all", "PAID", "UNPAID", "OVERDUE"] as const).map((s) => (
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

              {/* Invoices Table */}
              {loading ? (
                <div className="bg-white border border-[#6366f1]/12 py-20 text-center text-[#6b7094] rounded-2xl shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
                  Loading data from server...
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
                                  className="p-1 text-[#6b7094] hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                                  title="View Invoice Details"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                {inv.status !== "PAID" && (
                                  <button
                                    onClick={() => handlePayInvoice(inv.id)}
                                    className="p-1 text-[#6b7094] hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                    title="Record Payment"
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
          ) : subTab === "receipts" ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="bg-white border border-[#6366f1]/12 rounded-2xl p-5 shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
                  <span className="text-xs font-bold text-[#6b7094] uppercase tracking-wider block mb-2">Total Receipts</span>
                  <div className="text-2xl font-black text-[#0d0d2b]">INR 3,42,500.00</div>
                  <p className="text-xs text-[#6b7094] mt-1">28 payment receipts</p>
                </div>
                <div className="bg-white border border-emerald-200 rounded-2xl p-5 shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
                  <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block mb-2">Bank Deposits</span>
                  <div className="text-2xl font-black text-emerald-600">INR 3,10,000.00</div>
                  <p className="text-xs text-[#6b7094] mt-1">24 settled deposits</p>
                </div>
                <div className="bg-white border border-yellow-200 rounded-2xl p-5 shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
                  <span className="text-xs font-bold text-yellow-600 uppercase tracking-wider block mb-2">Pending Clearance</span>
                  <div className="text-2xl font-black text-yellow-600">INR 32,500.00</div>
                  <p className="text-xs text-[#6b7094] mt-1">4 cheques in transit</p>
                </div>
              </div>

              <div className="bg-white border border-[#6366f1]/12 rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
                <div className="px-6 py-4.5 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="text-sm font-black text-[#0d0d2b]">Payment Receipts Ledger</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-[#6b7094] uppercase tracking-wider">
                        <th className="px-6 py-4.5">Receipt #</th>
                        <th className="px-6 py-4.5">Resident</th>
                        <th className="px-6 py-4.5">Payment Mode</th>
                        <th className="px-6 py-4.5 text-right">Amount</th>
                        <th className="px-6 py-4.5">Date</th>
                        <th className="px-6 py-4.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {[
                        { rcpt: "RCP-2026-0128", resident: "Ramesh Kumar (A-101)", mode: "UPI", amount: 15000, date: "2026-06-28", status: "Cleared" },
                        { rcpt: "RCP-2026-0127", resident: "Priya Sharma (B-204)", mode: "Net Banking", amount: 12500, date: "2026-06-27", status: "Cleared" },
                        { rcpt: "RCP-2026-0126", resident: "Amit Verma (C-302)", mode: "Cheque", amount: 18000, date: "2026-06-25", status: "Pending" },
                        { rcpt: "RCP-2026-0125", resident: "Sunita Devi (A-405)", mode: "UPI", amount: 12000, date: "2026-06-22", status: "Cleared" },
                        { rcpt: "RCP-2026-0124", resident: "Vikram Singh (D-110)", mode: "Cash", amount: 14500, date: "2026-06-20", status: "Cleared" },
                      ].map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4 font-mono font-bold text-[#0d0d2b]">{item.rcpt}</td>
                          <td className="px-6 py-4 font-bold text-[#0d0d2b]">{item.resident}</td>
                          <td className="px-6 py-4 text-xs text-[#6b7094]">{item.mode}</td>
                          <td className="px-6 py-4 text-right font-bold text-[#0d0d2b]">{formatCurrency(item.amount)}</td>
                          <td className="px-6 py-4 text-xs text-[#6b7094]">{item.date}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 text-[10px] font-bold border uppercase tracking-wider rounded-full ${
                              item.status === "Cleared" ? "bg-emerald-50 border-emerald-200 text-emerald-600" : "bg-yellow-50 border-yellow-200 text-yellow-600"
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
          ) : subTab === "estimates" ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="bg-white border border-[#6366f1]/12 rounded-2xl p-5 shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
                  <span className="text-xs font-bold text-[#6b7094] uppercase tracking-wider block mb-2">Total Estimates</span>
                  <div className="text-2xl font-black text-[#0d0d2b]">INR 5,60,000.00</div>
                  <p className="text-xs text-[#6b7094] mt-1">8 active estimates</p>
                </div>
                <div className="bg-white border border-emerald-200 rounded-2xl p-5 shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
                  <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block mb-2">Accepted</span>
                  <div className="text-2xl font-black text-emerald-600">5 estimates</div>
                  <p className="text-xs text-[#6b7094] mt-1">Converted to invoices</p>
                </div>
                <div className="bg-white border border-yellow-200 rounded-2xl p-5 shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
                  <span className="text-xs font-bold text-yellow-600 uppercase tracking-wider block mb-2">Awaiting Response</span>
                  <div className="text-2xl font-black text-yellow-600">3 estimates</div>
                  <p className="text-xs text-[#6b7094] mt-1">Sent to residents</p>
                </div>
              </div>

              <div className="bg-white border border-[#6366f1]/12 rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
                <div className="px-6 py-4.5 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="text-sm font-black text-[#0d0d2b]">Estimates Registry</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-[#6b7094] uppercase tracking-wider">
                        <th className="px-6 py-4.5">Estimate #</th>
                        <th className="px-6 py-4.5">Description</th>
                        <th className="px-6 py-4.5">Resident</th>
                        <th className="px-6 py-4.5 text-right">Amount</th>
                        <th className="px-6 py-4.5">Date</th>
                        <th className="px-6 py-4.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {[
                        { est: "EST-2026-032", desc: "Annual Maintenance Charge Q3", resident: "Tower A Residents", amount: 180000, date: "2026-06-30", status: "Accepted" },
                        { est: "EST-2026-031", desc: "Clubhouse Renovation Phase-2", resident: "All Residents", amount: 250000, date: "2026-06-25", status: "Pending" },
                        { est: "EST-2026-030", desc: "Parking Lot Expansion", resident: "Tower B Residents", amount: 85000, date: "2026-06-18", status: "Accepted" },
                        { est: "EST-2026-029", desc: "Swimming Pool Maintenance", resident: "Premium Members", amount: 45000, date: "2026-06-12", status: "Pending" },
                      ].map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4 font-mono font-bold text-[#0d0d2b]">{item.est}</td>
                          <td className="px-6 py-4 font-bold text-[#0d0d2b]">{item.desc}</td>
                          <td className="px-6 py-4 text-[#374151]">{item.resident}</td>
                          <td className="px-6 py-4 text-right font-bold text-[#0d0d2b]">{formatCurrency(item.amount)}</td>
                          <td className="px-6 py-4 text-xs text-[#6b7094]">{item.date}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 text-[10px] font-bold border uppercase tracking-wider rounded-full ${
                              item.status === "Accepted" ? "bg-emerald-50 border-emerald-200 text-emerald-600" : "bg-yellow-50 border-yellow-200 text-yellow-600"
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
          ) : subTab === "sales-orders" ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="bg-white border border-[#6366f1]/12 rounded-2xl p-5 shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
                  <span className="text-xs font-bold text-[#6b7094] uppercase tracking-wider block mb-2">Total Sales Orders</span>
                  <div className="text-2xl font-black text-[#0d0d2b]">INR 4,20,000.00</div>
                  <p className="text-xs text-[#6b7094] mt-1">12 active orders</p>
                </div>
                <div className="bg-white border border-emerald-200 rounded-2xl p-5 shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
                  <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block mb-2">Fulfilled</span>
                  <div className="text-2xl font-black text-emerald-600">10 orders</div>
                  <p className="text-xs text-[#6b7094] mt-1">Invoiced & closed</p>
                </div>
                <div className="bg-white border border-yellow-200 rounded-2xl p-5 shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
                  <span className="text-xs font-bold text-yellow-600 uppercase tracking-wider block mb-2">Open Orders</span>
                  <div className="text-2xl font-black text-yellow-600">2 orders</div>
                  <p className="text-xs text-[#6b7094] mt-1">Pending fulfillment</p>
                </div>
              </div>

              <div className="bg-white border border-[#6366f1]/12 rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
                <div className="px-6 py-4.5 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="text-sm font-black text-[#0d0d2b]">Sales Order Tracker</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-[#6b7094] uppercase tracking-wider">
                        <th className="px-6 py-4.5">SO Number</th>
                        <th className="px-6 py-4.5">Customer</th>
                        <th className="px-6 py-4.5">Description</th>
                        <th className="px-6 py-4.5 text-right">Amount</th>
                        <th className="px-6 py-4.5">Date</th>
                        <th className="px-6 py-4.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {[
                        { so: "SO-2026-0058", customer: "Tower A HOA", desc: "Q3 Maintenance Fee Collection", amount: 120000, date: "2026-06-30", status: "Open" },
                        { so: "SO-2026-0057", customer: "Tower B HOA", desc: "Parking Charges Annual", amount: 85000, date: "2026-06-26", status: "Fulfilled" },
                        { so: "SO-2026-0056", customer: "Club Members", desc: "Gym Membership Renewal", amount: 45000, date: "2026-06-20", status: "Fulfilled" },
                        { so: "SO-2026-0055", customer: "Tower C HOA", desc: "Generator Maintenance Share", amount: 62000, date: "2026-06-15", status: "Fulfilled" },
                        { so: "SO-2026-0054", customer: "All Residents", desc: "Festival Decoration Fund", amount: 28000, date: "2026-06-10", status: "Open" },
                      ].map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4 font-mono font-bold text-[#0d0d2b]">{item.so}</td>
                          <td className="px-6 py-4 font-bold text-[#0d0d2b]">{item.customer}</td>
                          <td className="px-6 py-4 text-[#374151]">{item.desc}</td>
                          <td className="px-6 py-4 text-right font-bold text-[#0d0d2b]">{formatCurrency(item.amount)}</td>
                          <td className="px-6 py-4 text-xs text-[#6b7094]">{item.date}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 text-[10px] font-bold border uppercase tracking-wider rounded-full ${
                              item.status === "Fulfilled" ? "bg-emerald-50 border-emerald-200 text-emerald-600" : "bg-yellow-50 border-yellow-200 text-yellow-600"
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
          ) : subTab === "credit-notes" ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="bg-white border border-[#6366f1]/12 rounded-2xl p-5 shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
                  <span className="text-xs font-bold text-[#6b7094] uppercase tracking-wider block mb-2">Total Credit Notes</span>
                  <div className="text-2xl font-black text-[#0d0d2b]">INR 24,500.00</div>
                  <p className="text-xs text-[#6b7094] mt-1">6 issued credit notes</p>
                </div>
                <div className="bg-white border border-emerald-200 rounded-2xl p-5 shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
                  <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block mb-2">Applied Credits</span>
                  <div className="text-2xl font-black text-emerald-600">INR 18,000.00</div>
                  <p className="text-xs text-[#6b7094] mt-1">4 notes adjusted</p>
                </div>
                <div className="bg-white border border-yellow-200 rounded-2xl p-5 shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
                  <span className="text-xs font-bold text-yellow-600 uppercase tracking-wider block mb-2">Unused Credits</span>
                  <div className="text-2xl font-black text-yellow-600">INR 6,500.00</div>
                  <p className="text-xs text-[#6b7094] mt-1">2 open notes</p>
                </div>
              </div>

              <div className="bg-white border border-[#6366f1]/12 rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
                <div className="px-6 py-4.5 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="text-sm font-black text-[#0d0d2b]">Credit Notes Ledger</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-[#6b7094] uppercase tracking-wider">
                        <th className="px-6 py-4.5">Credit Note #</th>
                        <th className="px-6 py-4.5">Against Invoice #</th>
                        <th className="px-6 py-4.5">Resident</th>
                        <th className="px-6 py-4.5 text-right">Credit Amount</th>
                        <th className="px-6 py-4.5">Date</th>
                        <th className="px-6 py-4.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {[
                        { cn: "CN-2026-012", inv: "INV-2026-0458", resident: "Ramesh Kumar (A-101)", amount: 5000, date: "2026-06-28", status: "Applied" },
                        { cn: "CN-2026-011", inv: "INV-2026-0445", resident: "Priya Sharma (B-204)", amount: 3500, date: "2026-06-22", status: "Open" },
                        { cn: "CN-2026-010", inv: "INV-2026-0432", resident: "Amit Verma (C-302)", amount: 8000, date: "2026-06-18", status: "Applied" },
                        { cn: "CN-2026-009", inv: "INV-2026-0420", resident: "Sunita Devi (A-405)", amount: 5000, date: "2026-06-12", status: "Applied" },
                        { cn: "CN-2026-008", inv: "INV-2026-0411", resident: "Vikram Singh (D-110)", amount: 3000, date: "2026-06-08", status: "Open" },
                      ].map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4 font-mono font-bold text-[#0d0d2b]">{item.cn}</td>
                          <td className="px-6 py-4 font-mono text-[#6b7094]">{item.inv}</td>
                          <td className="px-6 py-4 font-bold text-[#0d0d2b]">{item.resident}</td>
                          <td className="px-6 py-4 text-right font-bold text-[#0d0d2b]">{formatCurrency(item.amount)}</td>
                          <td className="px-6 py-4 text-xs text-[#6b7094]">{item.date}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 text-[10px] font-bold border uppercase tracking-wider rounded-full ${
                              item.status === "Applied" ? "bg-emerald-50 border-emerald-200 text-emerald-600" : "bg-yellow-50 border-yellow-200 text-yellow-600"
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
              {/* Customers */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="bg-white border border-[#6366f1]/12 rounded-2xl p-5 shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
                  <span className="text-xs font-bold text-[#6b7094] uppercase tracking-wider block mb-2">Total Residents</span>
                  <div className="text-2xl font-black text-[#0d0d2b]">156 residents</div>
                  <p className="text-xs text-[#6b7094] mt-1">Active billing accounts</p>
                </div>
                <div className="bg-white border border-emerald-200 rounded-2xl p-5 shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
                  <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block mb-2">Current on Payments</span>
                  <div className="text-2xl font-black text-emerald-600">142 residents</div>
                  <p className="text-xs text-[#6b7094] mt-1">No outstanding dues</p>
                </div>
                <div className="bg-white border border-yellow-200 rounded-2xl p-5 shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
                  <span className="text-xs font-bold text-yellow-600 uppercase tracking-wider block mb-2">Overdue Accounts</span>
                  <div className="text-2xl font-black text-yellow-600">14 residents</div>
                  <p className="text-xs text-[#6b7094] mt-1">Follow-up required</p>
                </div>
              </div>

              <div className="bg-white border border-[#6366f1]/12 rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
                <div className="px-6 py-4.5 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="text-sm font-black text-[#0d0d2b]">Resident Billing Directory</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-[#6b7094] uppercase tracking-wider">
                        <th className="px-6 py-4.5">Resident Name</th>
                        <th className="px-6 py-4.5">Flat / Unit</th>
                        <th className="px-6 py-4.5">Contact</th>
                        <th className="px-6 py-4.5 text-right">Outstanding</th>
                        <th className="px-6 py-4.5">Account Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {[
                        { name: "Ramesh Kumar", flat: "A-101", contact: "ramesh@email.com · +91 98765 43210", outstanding: 0, status: "Current" },
                        { name: "Priya Sharma", flat: "B-204", contact: "priya.s@email.com · +91 98765 43211", outstanding: 12500, status: "Overdue" },
                        { name: "Amit Verma", flat: "C-302", contact: "amit.v@email.com · +91 98765 43212", outstanding: 0, status: "Current" },
                        { name: "Sunita Devi", flat: "A-405", contact: "sunita.d@email.com · +91 98765 43213", outstanding: 8000, status: "Overdue" },
                        { name: "Vikram Singh", flat: "D-110", contact: "vikram.s@email.com · +91 98765 43214", outstanding: 0, status: "Current" },
                      ].map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4 font-bold text-[#0d0d2b]">{item.name}</td>
                          <td className="px-6 py-4 text-[#374151]">{item.flat}</td>
                          <td className="px-6 py-4 text-xs text-[#6b7094]">{item.contact}</td>
                          <td className="px-6 py-4 text-right font-bold text-[#0d0d2b]">{item.outstanding === 0 ? "—" : formatCurrency(item.outstanding)}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 text-[10px] font-bold border uppercase tracking-wider rounded-full ${
                              item.status === "Current" ? "bg-emerald-50 border-emerald-200 text-emerald-600" : "bg-yellow-50 border-yellow-200 text-yellow-600"
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
          )}
        </div>
      </div>

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedInvoice(null)}>
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-lg w-full p-0 overflow-hidden animate-in zoom-in-95 duration-150" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#0d0d2b] flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                Tax Invoice Details
              </h3>
              <button onClick={() => setSelectedInvoice(null)} className="p-2 text-[#6b7094] hover:text-[#0d0d2b] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Invoice Header */}
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold text-[#6b7094] uppercase tracking-wider block">Invoice Number</span>
                  <h3 className="font-mono font-bold text-base text-[#0d0d2b] mt-1">{selectedInvoice.invoiceNumber}</h3>
                </div>
                {(() => {
                  const statusCfg = STATUS_CONFIG[selectedInvoice.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.UNPAID;
                  return (
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${statusCfg.color}`}>
                      {statusCfg.label}
                    </span>
                  );
                })()}
              </div>

              {/* Resident Details */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#6b7094]">Resident:</span>
                  <span className="font-semibold text-[#0d0d2b]">{selectedInvoice.residentName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6b7094]">Flat Number:</span>
                  <span className="font-semibold text-[#0d0d2b]">{selectedInvoice.flatNo}</span>
                </div>
                {selectedInvoice.eventTitle && (
                  <div className="flex justify-between">
                    <span className="text-[#6b7094]">Shared Event:</span>
                    <span className="font-semibold text-[#0d0d2b]">{selectedInvoice.eventTitle}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[#6b7094]">Due Date:</span>
                  <span className="font-semibold text-[#0d0d2b] flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-[#6b7094]" />
                    {new Date(selectedInvoice.dueDate).toLocaleDateString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Tax breakdown */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 space-y-2.5 text-xs">
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">Tax Settlement Breakdown</span>
                <div className="flex justify-between">
                  <span className="text-[#6b7094]">Base Cost (Taxable):</span>
                  <span className="font-semibold text-[#0d0d2b]">{formatCurrency(selectedInvoice.taxableAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6b7094]">CGST (9%):</span>
                  <span className="font-semibold text-[#0d0d2b]">{formatCurrency(selectedInvoice.cgst)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6b7094]">SGST (9%):</span>
                  <span className="font-semibold text-[#0d0d2b]">{formatCurrency(selectedInvoice.sgst)}</span>
                </div>
                <div className="pt-2 border-t border-indigo-200 flex justify-between text-sm">
                  <span className="font-bold text-[#0d0d2b]">Total Tax Invoice:</span>
                  <span className="font-black text-indigo-600">{formatCurrency(selectedInvoice.totalAmount)}</span>
                </div>
              </div>

              {/* Mark paid action */}
              {selectedInvoice.status !== "PAID" && (
                <button
                  onClick={() => handlePayInvoice(selectedInvoice.id)}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:opacity-95 shadow-md shadow-emerald-500/20 text-white font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 text-sm"
                >
                  <CreditCard className="h-4 w-4" />
                  Record Settlement (Mark Paid)
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
