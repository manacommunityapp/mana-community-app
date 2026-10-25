import React, { useState } from "react";
import { Loader2, CheckCircle2, XCircle, FileText } from "lucide-react";
import type { CashfreePaymentStatus } from "../../../hooks/useCashfree";
import type { CashfreeOrderResponse } from "../../../services/payments/cashfreePaymentService";
import CashfreeReceiptModal from "./CashfreeReceiptModal";

export interface CashfreeCheckoutProps {
  /** Whether the overlay is visible. */
  visible: boolean;
  status: CashfreePaymentStatus;
  order: CashfreeOrderResponse | null;
  error: string | null;
  /** Called after the user acknowledges success or failure. */
  onDismiss: () => void;
}

/**
 * Shared Cashfree payment status overlay for web.
 *
 * Renders as a centred modal overlay that sits on top of the triggering page.
 * The Cashfree v3 SDK opens its own iframe/modal for the checkout sheet;
 * this component shows the loading state (while the order is being created)
 * and the final result (success or failure) once the SDK flow completes.
 */
export default function CashfreeCheckout({
  visible,
  status,
  order,
  error,
  onDismiss,
}: CashfreeCheckoutProps) {
  const [showReceipt, setShowReceipt] = useState(false);

  if (!visible) return null;

  const isLoading = status === "creating" || status === "checkout" || status === "verifying";
  const isSuccess = status === "success";
  const isFailed  = status === "failed";

  return (
    <>
    {showReceipt && (
      <CashfreeReceiptModal
        isOpen={showReceipt}
        order={order}
        onClose={() => { setShowReceipt(false); onDismiss(); }}
      />
    )}
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-live="polite"
    >
      <div className="relative w-full max-w-sm mx-4 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-8 flex flex-col items-center gap-5 animate-in fade-in zoom-in-95 duration-200">

        {/* ── Loading ── */}
        {isLoading && (
          <>
            <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin" />
            </div>
            <div className="text-center">
              <p className="text-base font-bold text-slate-900 dark:text-white">
                {status === "creating"  && "Preparing payment…"}
                {status === "checkout"  && "Opening checkout…"}
                {status === "verifying" && "Confirming payment…"}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Please do not close this window.
              </p>
            </div>
          </>
        )}

        {/* ── Success ── */}
        {isSuccess && order && (
          <>
            <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center">
              <CheckCircle2 className="w-9 h-9 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-center">
              <p className="text-base font-bold text-slate-900 dark:text-white">Payment Successful</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                ₹{Number(order.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })} paid
                {order.paymentMethod ? ` via ${order.paymentMethod}` : ""}
              </p>
            </div>
            <div className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-4 text-xs space-y-2 border border-slate-200 dark:border-slate-700">
              <Row label="Order ID" value={order.manaOrderId} />
              <Row
                label="Amount"
                value={`₹${Number(order.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
              />
              <Row label="Status" value="PAID" valueClass="text-emerald-600 dark:text-emerald-400 font-bold" />
            </div>
            <div className="w-full flex gap-2">
              <button
                type="button"
                onClick={() => setShowReceipt(true)}
                className="flex items-center justify-center gap-1.5 flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition active:scale-[0.98] cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                Receipt
              </button>
              <button
                type="button"
                onClick={onDismiss}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-500 text-white font-bold text-sm hover:opacity-90 transition active:scale-[0.98] cursor-pointer"
              >
                Continue
              </button>
            </div>
          </>
        )}

        {/* ── Failure ── */}
        {isFailed && (
          <>
            <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-950/60 flex items-center justify-center">
              <XCircle className="w-9 h-9 text-red-500 dark:text-red-400" />
            </div>
            <div className="text-center">
              <p className="text-base font-bold text-slate-900 dark:text-white">Payment Failed</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                {error ?? "Your payment could not be completed. No amount has been charged."}
              </p>
            </div>
            <button
              type="button"
              onClick={onDismiss}
              className="w-full py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 font-bold text-sm hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition active:scale-[0.98] cursor-pointer"
            >
              Try Again
            </button>
          </>
        )}
      </div>
    </div>
    </>
  );
}

function Row({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className={`font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[180px] text-right ${valueClass ?? ""}`}>
        {value}
      </span>
    </div>
  );
}
