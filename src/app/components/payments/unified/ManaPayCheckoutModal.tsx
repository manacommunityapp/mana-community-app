import React, { useState, useEffect } from 'react';
import {
  X,
  QrCode,
  Smartphone,
  CreditCard,
  Wallet,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
  Lock,
  ChevronDown,
  ChevronUp,
  FileText,
  Building,
} from 'lucide-react';
import { toast } from 'sonner';
import { manaPayService } from '../../../../services/payments/manaPayService';
import { ManaPayQrCode } from './ManaPayQrCode';
import type {
  CreateManaPaymentIntentRequest,
  ManaPaymentIntentResponse,
  ManaPaymentRail,
  ManaPaymentRecord,
} from '../../../../types/manaPay';

export interface ManaPayCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: CreateManaPaymentIntentRequest;
  onPaymentSuccess: (record: ManaPaymentRecord) => void;
  residentWalletBalance?: number;
}

export const ManaPayCheckoutModal: React.FC<ManaPayCheckoutModalProps> = ({
  isOpen,
  onClose,
  order,
  onPaymentSuccess,
  residentWalletBalance = 2450,
}) => {
  const [selectedRail, setSelectedRail] = useState<ManaPaymentRail>('UPI_QR');
  const [intent, setIntent] = useState<ManaPaymentIntentResponse | null>(null);
  const [loadingIntent, setLoadingIntent] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [copiedVpa, setCopiedVpa] = useState(false);
  const [utrInput, setUtrInput] = useState('');
  const [showBillDetails, setShowBillDetails] = useState(true);

  // 1. Initialize Payment Intent
  useEffect(() => {
    if (isOpen && order) {
      setLoadingIntent(true);
      manaPayService
        .createPaymentIntent(order)
        .then((res) => {
          setIntent(res);
          setTimeLeft(600);
        })
        .catch((err) => {
          toast.error(err?.message || 'Failed to initiate payment intent');
        })
        .finally(() => setLoadingIntent(false));
    }
  }, [isOpen, order]);

  // 2. Countdown timer for QR
  useEffect(() => {
    if (!isOpen || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, timeLeft]);

  if (!isOpen) return null;

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleCopyVpa = () => {
    if (intent?.upiVpa) {
      navigator.clipboard.writeText(intent.upiVpa);
      setCopiedVpa(true);
      setTimeout(() => setCopiedVpa(false), 2000);
      toast.success('UPI ID copied to clipboard');
    }
  };

  // 3. Confirm Payment Execution
  const handleConfirmPayment = async (overrideRail?: ManaPaymentRail) => {
    if (!intent) return;
    setProcessingPayment(true);

    const railToConfirm = overrideRail || selectedRail;

    try {
      const record = await manaPayService.confirmPayment(
        {
          intentId: intent.intentId,
          rail: railToConfirm,
          utr: utrInput || undefined,
        },
        {
          title: order.title,
          domain: order.domain,
          orderReferenceId: order.orderReferenceId,
          payerName: order.payer.name,
          payerUnit: order.payer.unit,
          vendorId: order.vendorId,
          vendorName: order.vendorName,
          amount: order.totalAmount,
        }
      );

      toast.success('Payment completed successfully!');
      onPaymentSuccess(record);
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Payment confirmation failed');
    } finally {
      setProcessingPayment(false);
    }
  };

  const hasWalletSufficiency = residentWalletBalance >= order.totalAmount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#1E1E36] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-600 text-white font-bold text-xs">
              PAY
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                Mana Pay — Unified Checkout
              </h3>
              <p className="text-[11px] text-slate-500 font-mono">
                Order Ref: {order.orderReferenceId} · {order.domain.replace(/_/g, ' ')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Order Amount Banner */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-pink-950/20 border-b border-indigo-100 dark:border-indigo-950/60 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wide">
              {order.title}
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5 font-mono">
              ₹{order.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-white/80 dark:bg-slate-900/80 rounded-full border border-indigo-200 dark:border-indigo-900 text-xs text-indigo-700 dark:text-indigo-300 font-medium shadow-xs">
            <Lock className="w-3.5 h-3.5" />
            <span>256-Bit SSL Encrypted</span>
          </div>
        </div>

        {/* What am I paying for? Collapsible Line-Item Breakdown */}
        <div className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 px-6 py-2.5">
          <button
            type="button"
            onClick={() => setShowBillDetails(!showBillDetails)}
            className="w-full flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
              Understand your bill ({order.items?.length || 1} line item{order.items?.length === 1 ? '' : 's'})
            </span>
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <span>{showBillDetails ? 'Hide details' : 'View breakdown'}</span>
              {showBillDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </div>
          </button>

          {showBillDetails && (
            <div className="mt-2.5 space-y-1.5 pb-1 text-xs">
              {order.description && (
                <p className="text-[11px] text-slate-500 italic mb-2">
                  {order.description}
                </p>
              )}
              {order.vendorName && (
                <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400 mb-1.5">
                  <Building className="w-3 h-3 text-slate-400" />
                  <span>Authorized Beneficiary: <strong>{order.vendorName}</strong></span>
                </div>
              )}
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {order.items && order.items.length > 0 ? (
                  order.items.map((it, idx) => (
                    <div key={idx} className="py-1 flex justify-between text-slate-600 dark:text-slate-300">
                      <span>{it.title} {it.quantity && it.quantity > 1 ? `(x${it.quantity})` : ''}</span>
                      <span className="font-mono font-medium">₹{it.amount.toLocaleString('en-IN')}</span>
                    </div>
                  ))
                ) : (
                  <div className="py-1 flex justify-between text-slate-600 dark:text-slate-300">
                    <span>{order.title}</span>
                    <span className="font-mono font-medium">₹{order.totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Payment Rail Tabs */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-transparent">
          <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setSelectedRail('UPI_QR')}
              className={`py-2 rounded-xl flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all ${
                selectedRail === 'UPI_QR'
                  ? 'bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>UPI QR</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRail('UPI_INTENT')}
              className={`py-2 rounded-xl flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all ${
                selectedRail === 'UPI_INTENT'
                  ? 'bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>UPI Apps</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRail('GATEWAY_CARD_NETBANKING')}
              className={`py-2 rounded-xl flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all ${
                selectedRail === 'GATEWAY_CARD_NETBANKING'
                  ? 'bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Card/Net</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRail('WALLET')}
              className={`py-2 rounded-xl flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all ${
                selectedRail === 'WALLET'
                  ? 'bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span>Wallet</span>
            </button>
          </div>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: UPI QR */}
          {selectedRail === 'UPI_QR' && (
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="relative">
                {intent ? (
                  <ManaPayQrCode value={intent.upiIntentUri} size={180} />
                ) : (
                  <div className="w-48 h-48 bg-slate-100 rounded-2xl animate-pulse flex items-center justify-center text-slate-400 text-xs">
                    Generating dynamic QR...
                  </div>
                )}
                {/* Logo badge in center */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="p-1.5 rounded-xl bg-white shadow-md border border-slate-200">
                    <span className="font-black text-indigo-600 text-[11px] tracking-tight">MANA</span>
                  </div>
                </div>
              </div>

              {/* Timer & VPA */}
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 font-mono">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span>Valid for: <strong>{formatTimer(timeLeft)}</strong></span>
                </div>

                <div className="flex items-center justify-center gap-2 mt-1">
                  <span className="text-xs text-slate-500">VPA:</span>
                  <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                    {intent?.upiVpa || 'mana.society@icici'}
                  </span>
                  <button
                    onClick={handleCopyVpa}
                    type="button"
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-indigo-600"
                  >
                    {copiedVpa ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 w-full text-left space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Scan with any UPI App (GPay, PhonePe, Paytm, BHIM)</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Enter 12-digit UTR once paid (optional)"
                    value={utrInput}
                    onChange={(e) => setUtrInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-800 border rounded-lg text-xs font-mono"
                  />
                  <button
                    onClick={() => handleConfirmPayment('UPI_QR')}
                    disabled={processingPayment}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-all"
                  >
                    {processingPayment ? 'Verifying...' : 'Paid'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: UPI Apps Intent */}
          {selectedRail === 'UPI_INTENT' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500 text-center">
                Launch your preferred UPI app directly on your device to complete payment.
              </p>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: 'Google Pay', color: 'border-blue-200 hover:bg-blue-50/50' },
                  { name: 'PhonePe', color: 'border-purple-200 hover:bg-purple-50/50' },
                  { name: 'Paytm UPI', color: 'border-sky-200 hover:bg-sky-50/50' },
                  { name: 'BHIM UPI', color: 'border-emerald-200 hover:bg-emerald-50/50' },
                ].map((app) => (
                  <a
                    key={app.name}
                    href={intent?.upiIntentUri || '#'}
                    onClick={() => {
                      setTimeout(() => handleConfirmPayment('UPI_INTENT'), 2500);
                    }}
                    className={`p-4 rounded-2xl border ${app.color} flex flex-col items-center justify-center gap-1.5 text-center transition-all cursor-pointer shadow-xs`}
                  >
                    <Smartphone className="w-5 h-5 text-indigo-600" />
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                      {app.name}
                    </span>
                    <span className="text-[10px] text-slate-400">Tap to Pay</span>
                  </a>
                ))}
              </div>

              <div className="pt-2">
                <button
                  onClick={() => handleConfirmPayment('UPI_INTENT')}
                  disabled={processingPayment}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {processingPayment ? 'Verifying Transaction...' : 'I have completed UPI payment'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: Cards & Net Banking Gateway */}
          {selectedRail === 'GATEWAY_CARD_NETBANKING' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center gap-2 font-bold text-xs text-slate-800 dark:text-slate-200">
                  <CreditCard className="w-4 h-4 text-indigo-600" />
                  <span>Debit / Credit Cards & Net Banking</span>
                </div>
                <p className="text-xs text-slate-500">
                  Payment will be safely processed via regulated gateway partner (Razorpay / Cashfree) with 3D Secure OTP verification.
                </p>

                <div className="space-y-2 pt-2 border-t text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Order Subtotal:</span>
                    <span className="font-mono">₹{order.totalAmount}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Payment Gateway Fee:</span>
                    <span className="font-mono text-emerald-600 font-semibold">₹0.00 (Waived)</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleConfirmPayment('GATEWAY_CARD_NETBANKING')}
                disabled={processingPayment}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                {processingPayment ? (
                  'Launching Gateway...'
                ) : (
                  <>
                    <span>Proceed to Gateway Checkout</span>
                    <ExternalLink className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* TAB 4: Resident Advance Wallet */}
          {selectedRail === 'WALLET' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-purple-700 dark:text-purple-300" />
                    <span className="font-bold text-xs text-purple-900 dark:text-purple-200">
                      Resident Advance Wallet
                    </span>
                  </div>
                  <span className="font-mono font-bold text-sm text-purple-800 dark:text-purple-300">
                    ₹{residentWalletBalance.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-400">
                  {hasWalletSufficiency ? (
                    <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Sufficient balance available for 1-click settlement.</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-medium">
                      <AlertCircle className="w-4 h-4" />
                      <span>Insufficient wallet balance. Please use UPI or Cards.</span>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => handleConfirmPayment('WALLET')}
                disabled={!hasWalletSufficiency || processingPayment}
                className="w-full py-3.5 bg-purple-700 hover:bg-purple-800 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                {processingPayment ? 'Debiting Wallet...' : 'Pay ₹' + order.totalAmount + ' from Wallet'}
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
            <span>Idempotency Protected</span>
          </div>
          <span className="font-mono text-[10px] truncate max-w-xs">{order.idempotencyKey}</span>
        </div>
      </div>
    </div>
  );
};
