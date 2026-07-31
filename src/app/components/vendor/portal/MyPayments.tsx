import { useState, useEffect } from "react";
import {
  Wallet, IndianRupee, TrendingUp, Clock, Loader2,
  AlertCircle, ChevronLeft, ChevronRight, CheckCircle2,
  ArrowDownCircle,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import { vendorPaymentService } from "../../../../services/vendorService";
import type { VendorPaymentResponse } from "../../../../types/api";

const PAYMENT_STATUS_BADGE: Record<string, string> = {
  PENDING: "bg-amber-50 border-amber-200 text-amber-700",
  PROCESSING: "bg-blue-50 border-blue-200 text-blue-700",
  COMPLETED: "bg-emerald-50 border-emerald-200 text-emerald-700",
  FAILED: "bg-red-50 border-red-200 text-red-700",
  REFUNDED: "bg-violet-50 border-violet-200 text-violet-700",
};

export function MyPayments() {
  const [payments, setPayments] = useState<VendorPaymentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [earnings, setEarnings] = useState<{
    totalEarnings: number;
    monthlyEarnings: number;
    pendingAmount: number;
    walletBalance: number;
  } | null>(null);

  useEffect(() => {
    loadData();
  }, [page]);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [payRes, earningsRes] = await Promise.all([
        vendorPaymentService.getMyPayments(page, 10),
        vendorPaymentService.getMyEarningsSummary(),
      ]);
      setPayments(payRes.content);
      setTotalPages(payRes.totalPages);
      setEarnings(earningsRes);
    } catch (err) {
      console.error(err);
      setError("Failed to load payments");
      toast.error("Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !earnings) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error && !earnings) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <p className="text-[#6b7094] font-medium">{error}</p>
        <button onClick={loadData} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Toaster position="top-right" richColors />

      {/* Header */}
      <div>
        <span className="text-xs text-indigo-600 font-bold uppercase tracking-wider">Vendor Portal</span>
        <h1 className="text-3xl font-black text-[#0d0d2b] flex items-center gap-2 mt-1">
          <Wallet className="h-8 w-8 text-indigo-600" />
          Payments
        </h1>
        <p className="text-[#6b7094] text-sm mt-1">Track your earnings and payment history</p>
      </div>

      {/* Earnings Summary */}
      {earnings && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-[#6366f1]/12 rounded-2xl shadow-[0_4px_20px_rgba(99,102,241,0.05)] p-5">
            <div className="flex items-center gap-3 text-[#6b7094] text-xs font-semibold mb-2">
              <IndianRupee className="h-4 w-4 text-emerald-500" />
              TOTAL EARNINGS
            </div>
            <div className="text-2xl font-black text-[#0d0d2b]">
              ₹{earnings.totalEarnings.toLocaleString("en-IN")}
            </div>
          </div>
          <div className="bg-white border border-[#6366f1]/12 rounded-2xl shadow-[0_4px_20px_rgba(99,102,241,0.05)] p-5">
            <div className="flex items-center gap-3 text-[#6b7094] text-xs font-semibold mb-2">
              <TrendingUp className="h-4 w-4 text-indigo-600" />
              THIS MONTH
            </div>
            <div className="text-2xl font-black text-[#0d0d2b]">
              ₹{earnings.monthlyEarnings.toLocaleString("en-IN")}
            </div>
          </div>
          <div className="bg-white border border-[#6366f1]/12 rounded-2xl shadow-[0_4px_20px_rgba(99,102,241,0.05)] p-5">
            <div className="flex items-center gap-3 text-[#6b7094] text-xs font-semibold mb-2">
              <Clock className="h-4 w-4 text-amber-500" />
              PENDING
            </div>
            <div className="text-2xl font-black text-[#0d0d2b]">
              ₹{earnings.pendingAmount.toLocaleString("en-IN")}
            </div>
          </div>
          <div className="bg-white border border-[#6366f1]/12 rounded-2xl shadow-[0_4px_20px_rgba(99,102,241,0.05)] p-5">
            <div className="flex items-center gap-3 text-[#6b7094] text-xs font-semibold mb-2">
              <Wallet className="h-4 w-4 text-violet-500" />
              WALLET BALANCE
            </div>
            <div className="text-2xl font-black text-[#0d0d2b]">
              ₹{earnings.walletBalance.toLocaleString("en-IN")}
            </div>
          </div>
        </div>
      )}

      {/* Payment History */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h3 className="text-sm font-black text-[#0d0d2b]">Payment History</h3>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-16">
            <ArrowDownCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-[#6b7094] font-medium">No payments yet</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left">
                    <th className="px-5 py-3 text-xs font-bold text-[#6b7094] uppercase tracking-wider">Payment #</th>
                    <th className="px-5 py-3 text-xs font-bold text-[#6b7094] uppercase tracking-wider">Invoice</th>
                    <th className="px-5 py-3 text-xs font-bold text-[#6b7094] uppercase tracking-wider">Amount</th>
                    <th className="px-5 py-3 text-xs font-bold text-[#6b7094] uppercase tracking-wider">Method</th>
                    <th className="px-5 py-3 text-xs font-bold text-[#6b7094] uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3 text-xs font-bold text-[#6b7094] uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3 font-bold text-[#0d0d2b]">#{p.paymentNumber}</td>
                      <td className="px-5 py-3 text-[#6b7094]">#{p.invoiceNumber}</td>
                      <td className="px-5 py-3 font-bold text-[#0d0d2b]">₹{p.amount.toLocaleString("en-IN")}</td>
                      <td className="px-5 py-3 text-[#6b7094]">{p.method.replace(/_/g, " ")}</td>
                      <td className="px-5 py-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${PAYMENT_STATUS_BADGE[p.status] || ""}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-[#6b7094]">
                        {new Date(p.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3 p-4">
              {payments.map((p) => (
                <div key={p.id} className="bg-slate-50 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-[#0d0d2b]">#{p.paymentNumber}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${PAYMENT_STATUS_BADGE[p.status] || ""}`}>
                      {p.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-[#6b7094]">
                    <span>Invoice #{p.invoiceNumber}</span>
                    <span className="font-bold text-[#0d0d2b]">₹{p.amount.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-[#6b7094]">
                    <span>{p.method.replace(/_/g, " ")}</span>
                    <span>{new Date(p.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 p-4 border-t border-slate-100">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold text-[#6b7094]">
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page >= totalPages - 1}
                  className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
