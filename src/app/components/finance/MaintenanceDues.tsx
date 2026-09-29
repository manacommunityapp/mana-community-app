// MaintenanceDues.tsx - Resident Maintenance Bill, Advance Wallet & Pay Now Flow
import React, { useState } from "react";
import {
  CreditCard, Wallet, CheckCircle2, Clock, AlertTriangle,
  Download, ChevronRight, ShieldCheck, ArrowDownRight, Layers, FileText, X
} from "lucide-react";
import { communityFinanceService } from "../../../services/finance/communityFinanceService";
import type { MaintenanceBill, CommunityReceipt, PaymentMode } from "../../../services/finance/communityFinanceService";

export function MaintenanceDues() {
  const [bill, setBill] = useState<MaintenanceBill>(communityFinanceService.getMyBill("302"));
  const [wallet, setWallet] = useState(communityFinanceService.getAdvanceWallet("302"));
  const [history] = useState<MaintenanceBill[]>(communityFinanceService.getMyBillHistory("302"));
  const [showPayModal, setShowPayModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<CommunityReceipt | null>(null);

  const [paymentMode, setPaymentMode] = useState<PaymentMode>("UPI");
  const [useAdvanceWallet, setUseAdvanceWallet] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const handlePay = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const res = communityFinanceService.recordPayment(bill.id, bill.dueAmount, paymentMode);
      setIsProcessing(false);
      if (res) {
        setBill({ ...res.bill });
        setSelectedReceipt(res.receipt);
        setPaymentSuccess(true);
        setShowPayModal(false);
        setShowReceiptModal(true);
      }
    }, 1200);
  };

  const handleOpenReceipt = (receiptNum?: string) => {
    if (!receiptNum) return;
    const r = communityFinanceService.getReceipt(receiptNum);
    setSelectedReceipt(r);
    setShowReceiptModal(true);
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#1E1E36] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
            Resident Financial Portal
          </span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            My Maintenance Dues & Invoices
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Unit: <strong>Flat 302 · Tower A</strong> (1,200 sq.ft) · Account Ref: <span className="font-mono">BA-0001302A</span>
          </p>
        </div>

        {/* Advance Wallet Box */}
        <div className="p-4 rounded-xl border border-purple-200 dark:border-purple-900/40 bg-purple-50/50 dark:bg-purple-950/20 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-900/60"><Wallet className="w-5 h-5" /></div>
          <div>
            <div className="text-[11px] font-bold text-purple-700 dark:text-purple-300">Advance Wallet Balance</div>
            <div className="text-lg font-black text-purple-900 dark:text-white">₹{wallet.balanceAmount.toLocaleString("en-IN")}</div>
          </div>
        </div>
      </div>

      {/* ── Current Active Bill Card ─────────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#1E1E36] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black text-slate-900 dark:text-white">{bill.billNumber}</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                bill.status === "PAID" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300" :
                bill.status === "OVERDUE" ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300" :
                "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
              }`}>
                {bill.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Billing Period: <strong>{bill.month}/{bill.year}</strong> · Due Date: <strong>{new Date(bill.dueDate).toLocaleDateString()}</strong>
            </p>
          </div>

          <div className="flex items-center gap-3">
            {bill.status !== "PAID" ? (
              <button
                onClick={() => setShowPayModal(true)}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                Pay Now (₹{bill.dueAmount.toLocaleString("en-IN")})
              </button>
            ) : (
              <button
                onClick={() => handleOpenReceipt(bill.receiptNumber)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <Download className="w-3.5 h-3.5" /> Download Receipt
              </button>
            )}
          </div>
        </div>

        {/* Itemized Charges Breakdown Table */}
        <div className="mt-5 space-y-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Itemized Charge Breakdown</h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
            {bill.charges.map((c, i) => (
              <div key={i} className="p-3 flex items-center justify-between text-xs bg-slate-50/50 dark:bg-slate-900/30">
                <span className="font-medium text-slate-800 dark:text-slate-200">{c.item}</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">₹{c.amount.toLocaleString("en-IN")}</span>
              </div>
            ))}
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl flex items-center justify-between">
            <span className="text-xs font-black text-slate-700 dark:text-slate-300">Total Bill Amount</span>
            <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">₹{bill.totalAmount.toLocaleString("en-IN")}</span>
          </div>
        </div>
      </div>

      {/* ── Bill History ─────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#1E1E36] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Previous Invoices & Receipts</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="pb-3">Invoice No</th>
                <th className="pb-3">Period</th>
                <th className="pb-3">Amount</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Payment Date</th>
                <th className="pb-3 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {history.map(h => (
                <tr key={h.id}>
                  <td className="py-3 font-mono font-bold text-indigo-600">{h.billNumber}</td>
                  <td className="py-3 text-slate-600 dark:text-slate-300">{h.month}/{h.year}</td>
                  <td className="py-3 font-bold text-slate-900 dark:text-white">₹{h.totalAmount.toLocaleString("en-IN")}</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                      {h.status}
                    </span>
                  </td>
                  <td className="py-3 text-slate-500">{h.paidAt ? new Date(h.paidAt).toLocaleDateString() : "-"}</td>
                  <td className="py-3 text-right">
                    {h.receiptNumber && (
                      <button
                        onClick={() => handleOpenReceipt(h.receiptNumber)}
                        className="text-xs text-indigo-600 font-bold hover:underline"
                      >
                        {h.receiptNumber}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Payment Modal ────────────────────────────────────────────────────── */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Pay Maintenance Dues</h3>
              <button onClick={() => setShowPayModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl flex items-center justify-between">
              <div>
                <div className="text-xs text-indigo-700 dark:text-indigo-300">Amount Due</div>
                <div className="text-xl font-black text-indigo-900 dark:text-white">₹{bill.dueAmount.toLocaleString("en-IN")}</div>
              </div>
              <span className="text-xs text-indigo-600 font-mono">Invoice #{bill.billNumber}</span>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Select Payment Mode</label>
              <div className="grid grid-cols-2 gap-2">
                {(["UPI", "NET_BANKING", "CARD", "WALLET"] as PaymentMode[]).map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPaymentMode(m)}
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      paymentMode === m
                        ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300"
                        : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handlePay}
              disabled={isProcessing}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all shadow-md mt-4"
            >
              {isProcessing ? "Verifying & Allocating..." : `Confirm Payment of ₹${bill.dueAmount.toLocaleString("en-IN")}`}
            </button>
          </div>
        </div>
      )}

      {/* ── Official Receipt Modal ───────────────────────────────────────────── */}
      {showReceiptModal && selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Official Community Receipt</h3>
              </div>
              <button onClick={() => setShowReceiptModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 space-y-2 text-xs">
              <div className="flex justify-between font-mono font-bold text-indigo-600">
                <span>Receipt: {selectedReceipt.receiptNumber}</span>
                <span>Date: {new Date(selectedReceipt.receiptDate).toLocaleDateString()}</span>
              </div>
              <div className="text-slate-500">Unit: Flat {selectedReceipt.flatNumber} ({selectedReceipt.tower})</div>
              <div className="text-slate-500">Tx Reference: <span className="font-mono">{selectedReceipt.transactionRef}</span></div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {selectedReceipt.allocations.map((a, i) => (
                <div key={i} className="py-2 flex justify-between text-slate-700 dark:text-slate-300">
                  <span>{a.item}</span>
                  <span className="font-mono font-bold">₹{a.amount.toLocaleString("en-IN")}</span>
                </div>
              ))}
              <div className="pt-3 flex justify-between font-black text-sm text-slate-900 dark:text-white">
                <span>Total Paid</span>
                <span className="text-emerald-600">₹{selectedReceipt.amountPaid.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowReceiptModal(false)}
                className="px-5 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
