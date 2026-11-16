import type { PaymentOrderStatus } from "../../../services/payments/unifiedPaymentService";

interface Props {
  status: PaymentOrderStatus | "PAID" | "UNPAID" | "FREE" | string;
  className?: string;
}

const CONFIG: Record<string, { label: string; className: string }> = {
  INITIATED:          { label: "Initiated",         className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" },
  PENDING:            { label: "Pending",           className: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
  SUCCESS:            { label: "Paid",              className: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" },
  PAID:               { label: "Paid",              className: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" },
  FAILED:             { label: "Failed",            className: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" },
  REFUND_PENDING:     { label: "Refund Pending",    className: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300" },
  REFUNDED:           { label: "Refunded",          className: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  PARTIALLY_REFUNDED: { label: "Partial Refund",    className: "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300" },
  VOIDED:             { label: "Voided",            className: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 line-through" },
  EXPIRED:            { label: "Expired",           className: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 line-through" },
  UNPAID:             { label: "Unpaid",            className: "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400" },
  FREE:               { label: "Free",              className: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300" },
};

export function PaymentStatusBadge({ status, className = "" }: Props) {
  const cfg = CONFIG[status] ?? { label: status, className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300" };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.className} ${className}`}
    >
      {cfg.label}
    </span>
  );
}

export default PaymentStatusBadge;
