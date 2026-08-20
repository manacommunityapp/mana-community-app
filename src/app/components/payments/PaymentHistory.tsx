import React, { useEffect, useState } from "react";
import { razorpayService } from "../../../services/payments/razorpayService";
import type { PaymentOrderResponse } from "../../../types/payment";

const STATUS_STYLES: Record<string, string> = {
  PAID:     "bg-green-100 text-green-700",
  CREATED:  "bg-yellow-100 text-yellow-700",
  FAILED:   "bg-red-100 text-red-700",
  REFUNDED: "bg-gray-100 text-gray-600",
};

const STATUS_LABELS: Record<string, string> = {
  PAID:     "Paid",
  CREATED:  "Pending",
  FAILED:   "Failed",
  REFUNDED: "Refunded",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function formatAmount(amount: number): string {
  return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Paginated list of the current user's payment orders within their community.
 * Drop this into any "My Payments" / profile page.
 */
const PaymentHistory: React.FC = () => {
  const [orders, setOrders]     = useState<PaymentOrderResponse[]>([]);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    razorpayService
      .getMyOrders(page, 20)
      .then((data) => {
        setOrders(data.content);
        setTotalPages(data.totalPages);
        setError(null);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [page]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-600 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
        Failed to load payment history: {error}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-lg bg-gray-50 p-8 text-center text-sm text-gray-500">
        No payment records found.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-gray-800">My Payments</h2>

      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="min-w-full divide-y divide-gray-100 text-sm">
          <thead className="bg-gray-50 text-xs font-medium uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Description</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-left">Reference</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                  {formatDate(order.createdAt)}
                </td>
                <td className="px-4 py-3 text-gray-700 max-w-xs truncate">
                  {order.description ?? "—"}
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {order.referenceType?.replace(/_/g, " ") ?? "—"}
                </td>
                <td className="px-4 py-3 text-right font-medium text-gray-800">
                  {formatAmount(order.amount)}
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      STATUS_STYLES[order.status] ?? "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {STATUS_LABELS[order.status] ?? order.status}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-gray-400">
                  {order.razorpayPaymentId ?? order.razorpayOrderId}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="rounded px-3 py-1 text-sm text-violet-600 hover:bg-violet-50 disabled:opacity-40"
          >
            ← Previous
          </button>
          <span className="text-xs text-gray-500">
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="rounded px-3 py-1 text-sm text-violet-600 hover:bg-violet-50 disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

export default PaymentHistory;
