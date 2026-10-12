import React from 'react';
import {
  X,
  Printer,
  Share2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  Building2,
  Receipt,
  FileCheck2,
} from 'lucide-react';
import type { ManaDigitalReceipt } from '../../../../types/manaPay';

interface ManaPayReceiptModalProps {
  receipt: ManaDigitalReceipt | null;
  isOpen: boolean;
  onClose: () => void;
  onRequestRefund?: (transactionNumber: string) => void;
}

export const ManaPayReceiptModal: React.FC<ManaPayReceiptModalProps> = ({
  receipt,
  isOpen,
  onClose,
  onRequestRefund,
}) => {
  if (!isOpen || !receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  const isSuccess = receipt.status === 'SUCCESS';
  const isRefunded = receipt.status === 'REFUNDED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white dark:bg-[#1E1E36] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
              Official Digital Receipt
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              type="button"
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
              title="Print Receipt"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              type="button"
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper Container */}
        <div className="p-6 md:p-8 overflow-y-auto space-y-6 text-slate-900 dark:text-slate-100 print:p-0">
          {/* Header & Society Brand */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-sm">
                  M
                </div>
                <h3 className="font-black text-lg text-slate-900 dark:text-white leading-tight">
                  {receipt.societyName}
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                {receipt.societyAddress}
              </p>
              {receipt.societyGstin && (
                <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                  GSTIN: <strong>{receipt.societyGstin}</strong>
                </p>
              )}
            </div>

            <div className="sm:text-right">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wide uppercase ${
                  isSuccess
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : isRefunded
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                }`}
              >
                {isSuccess && <CheckCircle2 className="w-3.5 h-3.5" />}
                {isRefunded && <RotateCcw className="w-3.5 h-3.5" />}
                {!isSuccess && !isRefunded && <AlertTriangle className="w-3.5 h-3.5" />}
                {receipt.status}
              </span>
              <div className="mt-2 text-xs text-slate-500 font-mono">
                Receipt: <strong>{receipt.receiptNumber}</strong>
              </div>
              <div className="text-[11px] text-slate-400">
                {new Date(receipt.receiptDate).toLocaleString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          </div>

          {/* Resident & Order Details Grid */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-xs">
            <div>
              <span className="text-[11px] font-medium text-slate-400">Payer Details</span>
              <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                {receipt.payerName}
              </div>
              {receipt.payerUnit && (
                <div className="text-slate-600 dark:text-slate-400">{receipt.payerUnit}</div>
              )}
              {receipt.payerPhone && (
                <div className="font-mono text-slate-500">{receipt.payerPhone}</div>
              )}
            </div>

            <div>
              <span className="text-[11px] font-medium text-slate-400">Payment Reference</span>
              <div className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                {receipt.transactionNumber}
              </div>
              <div className="text-slate-500 text-[11px]">
                Order Ref: <span className="font-mono">{receipt.orderReferenceId}</span>
              </div>
              <div className="text-slate-500 text-[11px]">
                Method: <strong>{receipt.paymentRail.replace(/_/g, ' ')}</strong>
              </div>
              {receipt.utr && (
                <div className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400 mt-0.5">
                  Bank UTR: {receipt.utr}
                </div>
              )}
            </div>
          </div>

          {/* Itemized Charge Breakdown */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/40 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Description</th>
                  <th className="px-4 py-3 text-center">Qty</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-transparent">
                {receipt.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                      {item.title}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-500">{item.quantity || 1}</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-slate-800 dark:text-slate-200">
                      ₹{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Calculations Summary */}
            <div className="p-4 bg-slate-50/70 dark:bg-slate-900/40 border-t border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span className="font-mono">
                  ₹{receipt.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              {receipt.taxAmount > 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>Applicable GST / Taxes</span>
                  <span className="font-mono">
                    ₹{receipt.taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
              {receipt.convenienceFee > 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>Gateway Convenience Fee</span>
                  <span className="font-mono">
                    ₹{receipt.convenienceFee.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-800 font-black text-base text-slate-900 dark:text-white">
                <span>Total Paid</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-mono">
                  ₹{receipt.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Verification Seal */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 text-[11px] text-indigo-800 dark:text-indigo-300">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>
                Digitally cryptographically signed by <strong>Mana Community Pay Core</strong>.
                Valid for tax deduction and society audit.
              </span>
            </div>
            <FileCheck2 className="w-5 h-5 text-indigo-500 opacity-60" />
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          {onRequestRefund && isSuccess ? (
            <button
              onClick={() => onRequestRefund(receipt.transactionNumber)}
              type="button"
              className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Request Refund / Correction
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={onClose}
            type="button"
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 rounded-xl font-bold text-xs transition-all shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
