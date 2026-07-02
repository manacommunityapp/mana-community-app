import { useState, useEffect } from "react";
import { FileText, Search, Calendar, Filter, CheckCircle2, AlertCircle, Eye, CreditCard } from "lucide-react";
import { toast, Toaster } from "sonner";
import { billingService, type BillingInvoice } from "../../../services/billingService";

const STATUS_CONFIG = {
  PAID: { label: "Paid", color: "text-emerald-600 border-emerald-200 bg-emerald-50" },
  UNPAID: { label: "Unpaid", color: "text-yellow-600 border-yellow-200 bg-yellow-50" },
  OVERDUE: { label: "Overdue", color: "text-red-600 border-red-200 bg-red-50" },
  PARTIAL: { label: "Partial", color: "text-blue-600 border-blue-200 bg-blue-50" }
};

export function InvoicesDashboard() {
  const [invoices, setInvoices] = useState<BillingInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<BillingInvoice | null>(null);

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

  return (
    <div className="min-h-screen text-[#0d0d2b] p-6 font-sans">
      <Toaster position="top-center" richColors />

      {/* Header */}
      <div className="mb-6">
        <span className="text-xs text-indigo-600 font-bold uppercase tracking-wider">Finance Management</span>
        <h1 className="text-2xl font-black text-[#0d0d2b] flex items-center gap-2 mt-0.5">
          <FileText className="h-7 w-7 text-indigo-600" />
          Invoices & Payments
        </h1>
        <p className="text-[#6b7094] text-xs mt-1">Audit resident maintenance billing and process payments ledger.</p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7094] w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, flat, or invoice number..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-[#0d0d2b] placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
          />
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-[#6b7094]">
          <Filter className="h-4 w-4 text-indigo-600" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-transparent text-[#0d0d2b] focus:outline-none cursor-pointer font-bold"
          >
            <option value="all">All Statuses</option>
            <option value="PAID">Paid</option>
            <option value="UNPAID">Unpaid</option>
            <option value="OVERDUE">Overdue</option>
          </select>
        </div>
      </div>

      {/* Content grid */}
      {loading ? (
        <div className="bg-white border border-[#6366f1]/12 py-20 text-center text-[#6b7094] rounded-2xl shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
          Loading billing invoices...
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="bg-white border border-[#6366f1]/12 py-20 text-center text-[#6b7094] rounded-2xl shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
          <AlertCircle className="h-10 w-10 text-slate-300 mx-auto mb-2" />
          No invoices found.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {/* Invoices List */}
          <div className="lg:col-span-2 space-y-4">
            {filteredInvoices.map((inv) => {
              const statusCfg = STATUS_CONFIG[inv.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.UNPAID;
              return (
                <div
                  key={inv.id}
                  onClick={() => setSelectedInvoice(inv)}
                  className={`bg-white border rounded-2xl p-5 shadow-[0_4px_20px_rgba(99,102,241,0.05)] transition-all cursor-pointer hover:border-indigo-500/20 hover:shadow-md flex items-center justify-between ${
                    selectedInvoice?.id === inv.id ? "border-indigo-600 bg-indigo-50/30" : "border-[#6366f1]/12"
                  }`}
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#0d0d2b]">{inv.residentName}</span>
                      <span className="text-xs text-[#6b7094]">({inv.flatNo})</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-mono text-[#6b7094]">
                      <span>INV: #{inv.invoiceNumber}</span>
                      {inv.eventTitle && <span className="truncate">Event: {inv.eventTitle}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-bold text-sm text-indigo-600">{formatCurrency(inv.totalAmount)}</p>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${statusCfg.color} inline-block mt-1`}>
                        {statusCfg.label}
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-[#6b7094]" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Details Drawer */}
          <div className="bg-white border border-[#6366f1]/12 rounded-2xl p-5 shadow-[0_4px_20px_rgba(99,102,241,0.05)] h-fit space-y-5">
            {selectedInvoice ? (
              <>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold text-[#6b7094] uppercase tracking-wider block">Tax Invoice Details</span>
                    <h3 className="font-mono font-bold text-base text-[#0d0d2b] mt-1">INV: {selectedInvoice.invoiceNumber}</h3>
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
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 shadow-md shadow-emerald-500/20 text-white font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 text-sm"
                  >
                    <CreditCard className="h-4 w-4" />
                    Record Settlement (Mark Paid)
                  </button>
                )}
              </>
            ) : (
              <div className="text-center py-10 text-[#6b7094] text-xs">
                Select an invoice from the ledger to view full tax breakdown and settle payment.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ChevronRight helper
// Using the same component, just referencing the light-themed text colors above.
function ChevronRight(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  );
}
