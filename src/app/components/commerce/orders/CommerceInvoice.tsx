import React, { useEffect, useState } from "react";
import {
  commerceOrderService,
  CommerceInvoiceDto,
} from "@/services/commerce/commerceOrderService";

interface Props {
  orderNumber: string;
}

export default function CommerceInvoice({ orderNumber }: Props) {
  const [invoice, setInvoice] = useState<CommerceInvoiceDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    commerceOrderService
      .getOrderInvoice(orderNumber)
      .then(setInvoice)
      .catch(() => setError("Could not load invoice"))
      .finally(() => setLoading(false));
  }, [orderNumber]);

  if (loading)
    return <div className="py-4 text-center text-xs text-gray-400">Loading invoice…</div>;
  if (error)
    return <div className="py-2 text-xs text-red-500">{error}</div>;
  if (!invoice)
    return <div className="py-2 text-xs text-gray-400">Invoice not yet available.</div>;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4 print:shadow-none">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide">Tax Invoice</p>
          <p className="text-xl font-bold text-gray-800">{invoice.code}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Date: {invoice.docDate ? new Date(invoice.docDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
          </p>
        </div>
        <div className="text-right">
          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
            invoice.status === "Paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
          }`}>
            {invoice.status}
          </span>
        </div>
      </div>

      {/* Bill To */}
      <div className="text-sm text-gray-700">
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Bill To</p>
        <p className="font-medium">{invoice.customerName ?? "Resident"}</p>
      </div>

      {/* Line items table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="py-2 text-left text-xs font-semibold text-gray-500 uppercase">Item</th>
              <th className="py-2 text-right text-xs font-semibold text-gray-500 uppercase">Qty</th>
              <th className="py-2 text-right text-xs font-semibold text-gray-500 uppercase">Rate</th>
              <th className="py-2 text-right text-xs font-semibold text-gray-500 uppercase">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {invoice.items?.map((line, i) => (
              <tr key={i}>
                <td className="py-2 text-gray-700">
                  {line.item}
                  {line.description && (
                    <p className="text-xs text-gray-400">{line.description}</p>
                  )}
                </td>
                <td className="py-2 text-right text-gray-600">{line.qty}</td>
                <td className="py-2 text-right text-gray-600">
                  ₹{Number(line.cost).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </td>
                <td className="py-2 text-right font-medium text-gray-800">
                  ₹{Number(line.lineTotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="border-t border-gray-200 pt-3 space-y-1">
        {Number(invoice.discount ?? 0) > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Discount</span>
            <span>−₹{Number(invoice.discount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
          </div>
        )}
        {Number(invoice.tax ?? 0) > 0 && (
          <div className="flex justify-between text-sm text-gray-600">
            <span>GST</span>
            <span>₹{Number(invoice.tax).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
          </div>
        )}
        {Number(invoice.otherCharges ?? 0) > 0 && (
          <div className="flex justify-between text-sm text-gray-600">
            <span>Delivery</span>
            <span>₹{Number(invoice.otherCharges).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
          </div>
        )}
        <div className="flex justify-between text-base font-bold text-gray-800 border-t border-gray-200 pt-2">
          <span>Grand Total</span>
          <span>₹{Number(invoice.grandTotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      {/* Notes */}
      {invoice.notes && (
        <p className="text-xs text-gray-400 italic">{invoice.notes}</p>
      )}

      {/* Print button */}
      <button
        onClick={() => window.print()}
        className="w-full py-2 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        Print / Save as PDF
      </button>
    </div>
  );
}
