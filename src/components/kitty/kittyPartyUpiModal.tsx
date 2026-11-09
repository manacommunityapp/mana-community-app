import React, { useState } from 'react';

interface KittyPartyUpiModalProps {
  isOpen: boolean;
  onClose: () => void;
  beneficiaryName: string;
  beneficiaryUpiId: string;
  amount: number;
  periodNumber: number;
  cycleName: string;
  onProceedToRecord: () => void;
}

export const KittyPartyUpiModal: React.FC<KittyPartyUpiModalProps> = ({
  isOpen,
  onClose,
  beneficiaryName,
  beneficiaryUpiId,
  amount,
  periodNumber,
  cycleName,
  onProceedToRecord,
}) => {
  const [copied, setCopied] = useState(false);
  const remark = `Kitty ${cycleName} P${periodNumber}`;
  const upiUrl = `upi://pay?pa=${encodeURIComponent(beneficiaryUpiId)}&pn=${encodeURIComponent(beneficiaryName)}&am=${amount}&tn=${encodeURIComponent(remark)}&cu=INR`;

  if (!isOpen) return null;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(beneficiaryUpiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Pay via UPI</h3>
              <p className="text-xs text-slate-500">Peer-to-peer settlement (Zero Platform Custody)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-lg"
          >
            ✕
          </button>
        </div>

        {/* Payment Summary */}
        <div className="my-5 rounded-xl bg-pink-50 p-4 text-center dark:bg-pink-950/30 border border-pink-100 dark:border-pink-900/40">
          <span className="text-xs font-semibold uppercase tracking-wider text-pink-600 dark:text-pink-400">
            Current Beneficiary (Period {periodNumber})
          </span>
          <h4 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{beneficiaryName}</h4>
          <div className="mt-3 text-3xl font-black text-pink-600 dark:text-pink-400">
            ₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>

        {/* UPI Details Box */}
        <div className="space-y-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-700 dark:bg-slate-800/60">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400">Beneficiary UPI ID</span>
                <p className="font-mono font-semibold text-slate-800 dark:text-slate-200">{beneficiaryUpiId}</p>
              </div>
              <button
                onClick={handleCopyUpi}
                className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-pink-600 shadow-sm border border-slate-200 hover:bg-pink-50 dark:bg-slate-700 dark:text-pink-400 dark:border-slate-600"
              >
                {copied ? '✓ Copied!' : 'Copy UPI'}
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/60">
            <span className="text-xs text-slate-500 dark:text-slate-400">Transaction Remark (Must match)</span>
            <p className="font-mono text-xs font-medium text-slate-700 dark:text-slate-300">{remark}</p>
          </div>
        </div>

        {/* Deep link Action */}
        <div className="mt-5 space-y-2.5">
          <a
            href={upiUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 py-3 text-sm font-bold text-white shadow-lg shadow-pink-500/25 hover:from-pink-500 hover:to-rose-500"
          >
            <span>📱</span> Open Any UPI App (GPay, PhonePe, Paytm)
          </a>

          <button
            onClick={() => {
              onClose();
              onProceedToRecord();
            }}
            className="w-full rounded-xl border border-slate-300 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            I Have Paid • Upload Receipt / UTR
          </button>
        </div>

        <p className="mt-3 text-center text-[11px] text-slate-400">
          Payment is made directly from your bank to the host. Mana Community Hub does not hold or touch funds.
        </p>
      </div>
    </div>
  );
};
