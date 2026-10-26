// MaintenanceDues.tsx - Resident Maintenance Bill, Advance Wallet & Pay Now Flow
import React, { useState } from "react";
import { Link } from "react-router";
import {
  CreditCard, Wallet, CheckCircle2, Clock, AlertTriangle,
  Download, ChevronRight, ShieldCheck, ArrowDownRight, Layers, FileText, X, Zap
} from "lucide-react";
import { communityFinanceService } from "../../../services/finance/communityFinanceService";
import type { MaintenanceBill, CommunityReceipt, PaymentMode } from "../../../services/finance/communityFinanceService";
import { personalFinanceService } from "../../../services/finance/personalFinanceService";
import { ManaPayCheckoutModal } from "../payments/unified/ManaPayCheckoutModal";
import { manaPayService } from "../../../services/payments/manaPayService";
import type { CreateManaPaymentIntentRequest, ManaPaymentRecord } from "../../../types/manaPay";

import { useAuth } from "../../../contexts/AuthContext";

export function MaintenanceDues() {
  const { user } = useAuth();
  const userFlat = user?.flatNumber || user?.flatNo || "302";
  const userTower = user?.tower || user?.block || "A";

  const [bill, setBill] = useState<MaintenanceBill>(communityFinanceService.getMyBill(userFlat));
  const [wallet, setWallet] = useState(communityFinanceService.getAdvanceWallet(userFlat));
  const [history] = useState<MaintenanceBill[]>(communityFinanceService.getMyBillHistory(userFlat));
  const [showPayModal, setShowPayModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<CommunityReceipt | null>(null);
  const [recordedInMyMoney, setRecordedInMyMoney] = useState(false);

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
          <h4 className="text-xl font-black text-slate-900 dark:text-white mt-1">
            My Maintenance Dues & Invoices
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Unit: <strong>Flat {userFlat} · Tower {userTower}</strong> · Account Ref: <span className="font-mono">BA-{user?.userId ? String(user.userId).slice(0, 8) : "0001"}{userFlat}</span>
          </p>
        </div>

        {/* Advance Wallet & Autopay Box */}
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/finance/bills"
            className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20 flex items-center gap-3 hover:border-emerald-400 transition-all"
          >
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60"><Zap className="w-5 h-5" /></div>
            <div>
              <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                Autopay Mandate <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="text-xs font-black text-emerald-950 dark:text-white">Active (UMN-MANA-992147)</div>
            </div>
          </Link>

          <div className="p-3.5 rounded-xl border border-purple-200 dark:border-purple-900/40 bg-purple-50/50 dark:bg-purple-950/20 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-900/60"><Wallet className="w-5 h-5" /></div>
            <div>
              <div className="text-[11px] font-bold text-purple-700 dark:text-purple-300">Advance Wallet Balance</div>
              <div className="text-lg font-black text-purple-900 dark:text-white">₹{wallet.balanceAmount.toLocaleString("en-IN")}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Current Active Bill Card / Empty State ────────────────────────────── */}
      {bill.status === "PAID" || bill.dueAmount === 0 ? (
        <div className="bg-white dark:bg-[#1E1E36] rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center shadow-xs">
          <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="text-base font-black text-slate-900 dark:text-white">All Maintenance Dues Paid!</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
            There are no outstanding dues for Flat {userFlat} · Tower {userTower}. You can review your past payment history and download receipts below.
          </p>
        </div>
      ) : (
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
      )}

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

      {/* ── Mana Pay Unified Checkout Modal ─────────────────────────────────── */}
      {showPayModal && (
        <ManaPayCheckoutModal
          isOpen={showPayModal}
          onClose={() => setShowPayModal(false)}
          residentWalletBalance={wallet.balanceAmount}
          order={{
            idempotencyKey: manaPayService.generateIdempotencyKey(
              "MAINTENANCE_BILL",
              bill.billNumber,
              bill.dueAmount
            ),
            domain: "MAINTENANCE_BILL",
            orderReferenceId: bill.billNumber,
            title: `Maintenance Dues - ${bill.month}/${bill.year}`,
            description: `Monthly maintenance invoice #${bill.billNumber} for Flat ${bill.flatNumber} (${bill.tower})`,
            totalAmount: bill.dueAmount,
            payer: {
              name: "Sandeep Sharma",
              unit: `Flat ${bill.flatNumber}`,
              tower: bill.tower,
            },
            items: bill.charges.map((c) => ({
              title: c.item,
              amount: c.amount,
            })),
          }}
          onPaymentSuccess={(record: ManaPaymentRecord) => {
            const res = communityFinanceService.recordPayment(bill.id, bill.dueAmount, "UPI");
            if (res) {
              setBill({ ...res.bill });
              setSelectedReceipt(res.receipt);
              setPaymentSuccess(true);
              setShowReceiptModal(true);
            }
          }}
        />
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

            {/* Isolation Boundary: Opt-in to record in Personal Finance */}
            <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5 text-indigo-600" />
                    Record in My Money (Personal Finance)?
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                    Community finance maintains this official society receipt. To record it as a personal expense in your private ledger, opt-in below.
                  </p>
                </div>
                {recordedInMyMoney ? (
                  <span className="shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Recorded
                  </span>
                ) : (
                  <button
                    onClick={() => {
                      const accounts = personalFinanceService.getAccounts();
                      const accId = accounts.length > 0 ? accounts[0].id : "acc-1";
                      personalFinanceService.createTransaction({
                        type: "EXPENSE",
                        amount: selectedReceipt.amountPaid,
                        accountId: accId,
                        categoryId: "cat-1",
                        description: `Society Maintenance: ${selectedReceipt.receiptNumber}`,
                        notes: `Paid for Flat ${selectedReceipt.flatNumber} (${selectedReceipt.tower}) - Tx: ${selectedReceipt.transactionRef}`,
                      });
                      setRecordedInMyMoney(true);
                    }}
                    className="shrink-0 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm transition"
                  >
                    + Record in My Money
                  </button>
                )}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => {
                  setShowReceiptModal(false);
                  setRecordedInMyMoney(false);
                }}
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
