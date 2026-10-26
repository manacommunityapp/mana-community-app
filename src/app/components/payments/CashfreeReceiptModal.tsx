import React from "react";
import { X, CheckCircle2, XCircle, Clock, RotateCcw, Receipt, Share2, Printer } from "lucide-react";
import type { CashfreeOrderResponse } from "../../../services/payments/cashfreePaymentService";

export interface CashfreeReceiptModalProps {
  isOpen: boolean;
  order: CashfreeOrderResponse | null;
  onClose: () => void;
  onRequestRefund?: (manaOrderId: string) => void;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; badgeCls: string; iconCls: string; Icon: React.ElementType }
> = {
  PAID:           { label: "Paid",           badgeCls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400", iconCls: "text-emerald-500",  Icon: CheckCircle2 },
  CREATED:        { label: "Pending",        badgeCls: "bg-indigo-100  text-indigo-700  dark:bg-indigo-950/60  dark:text-indigo-400",   iconCls: "text-indigo-500",   Icon: Clock },
  PENDING:        { label: "Pending",        badgeCls: "bg-indigo-100  text-indigo-700  dark:bg-indigo-950/60  dark:text-indigo-400",   iconCls: "text-indigo-500",   Icon: Clock },
  FAILED:         { label: "Failed",         badgeCls: "bg-red-100     text-red-700     dark:bg-red-950/60     dark:text-red-400",      iconCls: "text-red-500",      Icon: XCircle },
  EXPIRED:        { label: "Expired",        badgeCls: "bg-slate-100   text-slate-600   dark:bg-slate-800      dark:text-slate-400",    iconCls: "text-slate-400",    Icon: Clock },
  REFUNDED:       { label: "Refunded",       badgeCls: "bg-orange-100  text-orange-700  dark:bg-orange-950/60  dark:text-orange-400",   iconCls: "text-orange-500",   Icon: RotateCcw },
  REFUND_PENDING: { label: "Refund Pending", badgeCls: "bg-orange-100  text-orange-700  dark:bg-orange-950/60  dark:text-orange-400",   iconCls: "text-orange-500",   Icon: RotateCcw },
};

function fmt(amount: number): string {
  return `₹${Number(amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function CashfreeReceiptModal({
  isOpen, order, onClose, onRequestRefund,
}: CashfreeReceiptModalProps) {
  if (!isOpen || !order) return null;

  const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.CREATED;
  const { Icon } = cfg;

  const handlePrint = () => window.print();

  const handleShare = async () => {
    const text = [
      "Mana Community Payment Receipt",
      `Order ID: ${order.manaOrderId}`,
      `Amount: ${fmt(order.amount)}`,
      `Status: ${cfg.label}`,
      order.description ? `Purpose: ${order.description}` : "",
      order.paidAt ? `Paid on: ${fmtDate(order.paidAt)}` : "",
    ].filter(Boolean).join("\n");

    if (navigator.share) {
      await navigator.share({ title: "Payment Receipt", text }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(text).catch(() => {});
    }
  };

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Payment Receipt"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-indigo-500" />
            <span className="font-bold text-sm text-slate-900 dark:text-white">Payment Receipt</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              title="Share"
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={handlePrint}
              title="Print"
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status hero */}
        <div className="flex flex-col items-center gap-2 py-5 border-b border-slate-100 dark:border-slate-800">
          <Icon className={`w-10 h-10 ${cfg.iconCls}`} />
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${cfg.badgeCls}`}>
            {cfg.label}
          </span>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            {fmt(order.amount)}
          </p>
          {order.paymentMethod && (
            <p className="text-xs text-slate-500 dark:text-slate-400">via {order.paymentMethod}</p>
          )}
        </div>

        {/* Details */}
        <div className="px-5 py-4 space-y-0 divide-y divide-slate-100 dark:divide-slate-800">
          <Row label="Order ID" value={order.manaOrderId} mono />
          {order.cfOrderId && <Row label="Gateway Order" value={order.cfOrderId} mono />}
          {order.referenceType && (
            <Row label="Purpose" value={order.referenceType.replace(/_/g, " ")} />
          )}
          {order.description && <Row label="Description" value={order.description} />}
          {order.paidAt && <Row label="Paid On" value={fmtDate(order.paidAt)} />}
          <Row label="Created On" value={fmtDate(order.createdAt)} />
          {order.failureReason && (
            <Row label="Failure Reason" value={order.failureReason} highlight="red" />
          )}
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 flex gap-3">
          {onRequestRefund && order.status === "PAID" && (
            <button
              onClick={() => onRequestRefund(order.manaOrderId)}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Request Refund
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-500 text-white text-sm font-bold hover:opacity-90 transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({
  label, value, mono, highlight,
}: {
  label: string;
  value: string;
  mono?: boolean;
  highlight?: "red" | "green";
}) {
  const valueCls = highlight === "red"
    ? "text-red-600 dark:text-red-400"
    : highlight === "green"
    ? "text-emerald-600 dark:text-emerald-400"
    : "text-slate-800 dark:text-slate-200";

  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0 pt-0.5">{label}</span>
      <span
        className={`text-xs font-semibold ${valueCls} ${mono ? "font-mono break-all text-right" : "text-right"} max-w-[60%]`}
      >
        {value}
      </span>
    </div>
  );
}
