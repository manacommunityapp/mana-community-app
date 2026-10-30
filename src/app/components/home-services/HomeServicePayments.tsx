import { useState, useEffect } from "react";
import { DollarSign, CheckCircle2, Clock, CreditCard, Download, Smartphone, QrCode, X } from "lucide-react";
import { homeServiceApi } from "../../../services/homeServices/homeServiceApi";

interface PaymentRecord {
  id: string;
  bookingId: string;
  workerName: string;
  categoryName: string;
  billingMonth: string;
  amount: number;
  status: "PAID" | "PENDING";
  paidOn: string | null;
  paymentMethod: string | null;
}

const UPI_ID = "mana@upi";

export function HomeServicePayments() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [filter, setFilter] = useState<"ALL" | "PAID" | "PENDING">("ALL");
  const [upiPayment, setUpiPayment] = useState<PaymentRecord | null>(null);
  const [markingPaid, setMarkingPaid] = useState<string | null>(null);

  useEffect(() => {
    homeServiceApi.getPayments().then(setPayments);
  }, []);

  const buildUpiUrl = (p: PaymentRecord) =>
    `upi://pay?pa=${UPI_ID}&pn=ManaHomeServices&am=${p.amount}&cu=INR&tn=Payment for ${encodeURIComponent(p.workerName)} - ${p.billingMonth}`;

  const markPaid = async (p: PaymentRecord) => {
    setMarkingPaid(p.id);
    try {
      await homeServiceApi.payBooking(p.bookingId);
      setPayments(prev => prev.map(x => x.id === p.id ? { ...x, status: "PAID", paidOn: new Date().toISOString() } : x));
      setUpiPayment(null);
    } catch {
      // keep modal open so user can retry
    } finally {
      setMarkingPaid(null);
    }
  };

  const filtered = payments.filter((p) => {
    if (filter === "ALL") return true;
    return p.status === filter;
  });

  const totalPending = payments.filter((p) => p.status === "PENDING").reduce((s, p) => s + p.amount, 0);
  const totalPaid = payments.filter((p) => p.status === "PAID").reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-5">
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
          Payment Tracking
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Track monthly payments for all your domestic help services
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Total Due</span>
          <span className="text-xl font-black text-amber-600 mt-1 block">
            ₹{totalPending.toLocaleString("en-IN")}
          </span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Total Paid</span>
          <span className="text-xl font-black text-emerald-600 mt-1 block">
            ₹{totalPaid.toLocaleString("en-IN")}
          </span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Active Services</span>
          <span className="text-xl font-black text-primary mt-1 block">{payments.length}</span>
        </div>
      </div>

      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit text-xs font-bold">
        {(["ALL", "PENDING", "PAID"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
              filter === tab
                ? "bg-white dark:bg-slate-900 text-primary shadow-xs font-extrabold"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((p) => (
          <div
            key={p.id}
            className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary font-black flex items-center justify-center shrink-0">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  {p.workerName}
                </h4>
                <p className="text-[11px] text-slate-500">
                  {p.categoryName} • {p.billingMonth}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto">
              <div className="text-right">
                <span className="text-base font-black text-slate-900 dark:text-white">
                  ₹{p.amount.toLocaleString("en-IN")}
                </span>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                  p.status === "PAID"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                }`}
              >
                {p.status === "PAID" ? (
                  <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Paid</span>
                ) : (
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</span>
                )}
              </span>
              {p.status === "PENDING" && (
                <button
                  onClick={() => setUpiPayment(p)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] rounded-xl flex items-center gap-1"
                >
                  <Smartphone className="w-3 h-3" /> Pay via UPI
                </button>
              )}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center">
            <p className="text-sm font-bold text-slate-400">No payment records found.</p>
          </div>
        )}
      </div>

      {/* UPI Payment Modal */}
      {upiPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-blue-600" /> Pay via UPI
              </h3>
              <button onClick={() => setUpiPayment(null)} className="p-1 rounded hover:bg-slate-100">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm text-slate-600">{upiPayment.workerName} · {upiPayment.billingMonth}</p>
              <p className="text-3xl font-black text-slate-900">₹{upiPayment.amount.toLocaleString("en-IN")}</p>
              <p className="text-xs text-slate-400">UPI ID: <span className="font-mono font-bold text-slate-700">{UPI_ID}</span></p>
            </div>
            <div className="flex flex-col gap-3">
              <a
                href={buildUpiUrl(upiPayment)}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl w-full"
              >
                <Smartphone className="w-4 h-4" /> Open UPI App
              </a>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <div className="flex-1 h-px bg-slate-200" /> or confirm payment manually <div className="flex-1 h-px bg-slate-200" />
              </div>
              <button
                onClick={() => markPaid(upiPayment)}
                disabled={markingPaid === upiPayment.id}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl w-full disabled:opacity-50"
              >
                {markingPaid === upiPayment.id ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Mark as Paid
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
