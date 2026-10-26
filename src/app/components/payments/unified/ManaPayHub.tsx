import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Wallet,
  CheckCircle2,
  Clock,
  RotateCcw,
  Search,
  Filter,
  Download,
  Receipt,
  ArrowUpRight,
  ShieldCheck,
  RefreshCw,
  Plus,
  Building,
  TrendingUp,
  FileCheck,
  CheckCheck,
  User,
  Landmark,
  Store,
  Calendar,
  Trophy,
  Plane,
  HeartPulse,
  ShoppingBag,
  Home,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../../../contexts/AuthContext';
import { manaPayService } from '../../../../services/payments/manaPayService';
import { ManaPayReceiptModal } from './ManaPayReceiptModal';
import { ManaPayCheckoutModal } from './ManaPayCheckoutModal';
import type {
  ManaPaymentRecord,
  ManaPayDomain,
  ManaPaymentStatus,
  ManaReconciliationStatus,
  ManaDigitalReceipt,
  CreateManaPaymentIntentRequest,
} from '../../../../types/manaPay';

// 6 Core Capabilities configuration
const CAPABILITY_CARDS: {
  domain: ManaPayDomain;
  title: string;
  subtitle: string;
  icon: any;
  color: string;
  badge: string;
}[] = [
  {
    domain: 'MAINTENANCE_BILL',
    title: 'Maintenance',
    subtitle: 'Invoices and dues',
    icon: Home,
    color: 'from-blue-600 to-indigo-700',
    badge: 'Society Dues',
  },
  {
    domain: 'EVENT_BOOKING',
    title: 'Events & Pooja',
    subtitle: 'Bookings and receipts',
    icon: Calendar,
    color: 'from-amber-500 to-orange-600',
    badge: 'Seva & Passes',
  },
  {
    domain: 'SPORTS_FEE',
    title: 'Sports',
    subtitle: 'Tournament fees',
    icon: Trophy,
    color: 'from-emerald-500 to-teal-700',
    badge: 'Tournaments',
  },
  {
    domain: 'MARKETPLACE_ORDER',
    title: 'Marketplace',
    subtitle: 'Orders and refunds',
    icon: ShoppingBag,
    color: 'from-violet-600 to-purple-800',
    badge: 'Orders',
  },
  {
    domain: 'TRIP_BOOKING',
    title: 'Mana Trips',
    subtitle: 'Trip costs and split bills',
    icon: Plane,
    color: 'from-sky-500 to-blue-600',
    badge: 'Split Bills',
  },
  {
    domain: 'MANA_HEALTH',
    title: 'Mana Health',
    subtitle: 'Healthcare payments',
    icon: HeartPulse,
    color: 'from-rose-500 to-pink-600',
    badge: 'Diagnostics',
  },
];

type ViewPerspective = 'RESIDENT' | 'TREASURER' | 'VENDOR';

export const ManaPayHub: React.FC = () => {
  const { user, isAnyAdmin } = useAuth();

  // Perspective switcher (Resident personal view, Community Treasurer, Vendor view)
  const [perspective, setPerspective] = useState<ViewPerspective>(
    isAnyAdmin ? 'TREASURER' : user?.role === 'VENDOR' ? 'VENDOR' : 'RESIDENT'
  );

  const [transactions, setTransactions] = useState<ManaPaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState<ManaPayDomain | ''>('');
  const [selectedStatus, setSelectedStatus] = useState<ManaPaymentStatus | ''>('');
  const [selectedRecon, setSelectedRecon] = useState<ManaReconciliationStatus | ''>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<ManaDigitalReceipt | null>(null);

  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [activeCheckoutOrder, setActiveCheckoutOrder] = useState<CreateManaPaymentIntentRequest | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await manaPayService.getTransactions({
        role: perspective,
        vendorId: perspective === 'VENDOR' ? 'vendor-sports-arena' : undefined,
        domain: selectedDomain || undefined,
        status: selectedStatus || undefined,
        reconciliationStatus: selectedRecon || undefined,
        search: searchQuery || undefined,
      });
      setTransactions(data);
    } catch {
      toast.error('Failed to load transaction records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [perspective, selectedDomain, selectedStatus, selectedRecon, searchQuery]);

  const handleOpenReceipt = async (transactionNumber: string) => {
    try {
      const r = await manaPayService.getTransactionReceipt(transactionNumber);
      if (r) {
        setSelectedReceipt(r);
        setReceiptModalOpen(true);
      } else {
        toast.error('Receipt not found');
      }
    } catch {
      toast.error('Failed to fetch receipt');
    }
  };

  const handleManualReconciliation = async (transactionNumber: string) => {
    const utr = window.prompt('Enter verified Bank Statement UTR / Reference:');
    if (!utr) return;

    try {
      await manaPayService.reconcileTransaction(transactionNumber, utr, 'Community Treasurer (ICICI NetBanking)');
      toast.success(`Transaction ${transactionNumber} reconciled with UTR ${utr}`);
      loadData();
    } catch {
      toast.error('Reconciliation failed');
    }
  };

  const handleRequestRefund = async (transactionNumber: string) => {
    const reason = window.prompt('Enter reason for refund request:');
    if (!reason) return;

    try {
      await manaPayService.requestRefund({
        transactionNumber,
        amount: 0,
        reason,
      });
      toast.success('Refund request submitted successfully');
      setReceiptModalOpen(false);
      loadData();
    } catch {
      toast.error('Failed to submit refund request');
    }
  };

  const handlePayCapabilityDemo = (card: typeof CAPABILITY_CARDS[0]) => {
    let title = `Pay ${card.title}`;
    let amount = 1000;
    let orderRef = `DEMO-${card.domain.slice(0, 3)}-${Date.now().toString().slice(-4)}`;

    if (card.domain === 'MAINTENANCE_BILL') {
      title = 'Monthly Maintenance Dues & Sinking Fund';
      amount = 3850;
      orderRef = 'INV-202610-302A';
    } else if (card.domain === 'EVENT_BOOKING') {
      title = 'Maha Deepotsav Pooja Seva Registration';
      amount = 1100;
      orderRef = 'EVT-POOJA-081';
    } else if (card.domain === 'SPORTS_FEE') {
      title = 'Badminton Tournament Entry Fee';
      amount = 750;
      orderRef = 'SPORTS-BADM-04';
    } else if (card.domain === 'MARKETPLACE_ORDER') {
      title = 'Marketplace Organic Farm Harvest Box';
      amount = 1450;
      orderRef = 'MKT-ORD-902';
    } else if (card.domain === 'TRIP_BOOKING') {
      title = 'Coorg Nature Weekend Trip (Twin Sharing)';
      amount = 5400;
      orderRef = 'TRIP-GOA-2026';
    } else if (card.domain === 'MANA_HEALTH') {
      title = 'Home Diagnostic Sample Collection Package';
      amount = 2200;
      orderRef = 'HLT-LAB-019';
    }

    const req: CreateManaPaymentIntentRequest = {
      idempotencyKey: manaPayService.generateIdempotencyKey(card.domain, orderRef, amount),
      domain: card.domain,
      orderReferenceId: orderRef,
      title,
      description: `Unified checkout payment for ${card.title} · ${card.subtitle}`,
      totalAmount: amount,
      payer: {
        name: user?.fullName || 'Sandeep Sharma',
        unit: 'Flat 302',
        tower: 'Tower A',
      },
      items: [
        {
          title,
          amount,
        },
      ],
    };
    setActiveCheckoutOrder(req);
    setCheckoutModalOpen(true);
  };

  // Metrics
  const totalCompleted = transactions
    .filter((t) => t.status === 'SUCCESS')
    .reduce((sum, t) => sum + t.amount, 0);

  const pendingAmount = transactions
    .filter((t) => t.status === 'PENDING')
    .reduce((sum, t) => sum + t.amount, 0);

  const reconciledCount = transactions.filter((t) => t.reconciliationStatus === 'RECONCILED').length;
  const pendingCount = transactions.filter((t) => t.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      {/* ── Illustrative Product Layout Header ───────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-slate-900 to-[#1E1E36] text-white p-8 rounded-3xl border border-indigo-950/60 shadow-xl">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Unified Payment Infrastructure</span>
            </div>
            <h4 className="text-2xl font-black tracking-tight mt-2">Mana Pay</h4>
            <p className="text-sm text-indigo-200/80 mt-1 max-w-xl">
              Your community payments, in one place. One consistent checkout and payment-history experience across Maintenance, Events, Sports, Marketplace, Trips, and Healthcare.
            </p>
          </div>

          {/* Perspective Switcher */}
          <div className="bg-slate-800/80 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 flex items-center gap-1 text-xs">
            <button
              type="button"
              onClick={() => setPerspective('RESIDENT')}
              className={`px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
                perspective === 'RESIDENT'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Resident View</span>
            </button>

            <button
              type="button"
              onClick={() => setPerspective('TREASURER')}
              className={`px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
                perspective === 'TREASURER'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Landmark className="w-3.5 h-3.5" />
              <span>Treasurer Collections</span>
            </button>

            <button
              type="button"
              onClick={() => setPerspective('VENDOR')}
              className={`px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
                perspective === 'VENDOR'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Vendor Ledger</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Perspective Context Banner ───────────────────────────────────────── */}
      <div className="p-4 rounded-2xl border bg-white dark:bg-[#1E1E36] border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          {perspective === 'RESIDENT' && <User className="w-4 h-4 text-indigo-600" />}
          {perspective === 'TREASURER' && <Landmark className="w-4 h-4 text-emerald-600" />}
          {perspective === 'VENDOR' && <Store className="w-4 h-4 text-purple-600" />}
          <span className="text-slate-600 dark:text-slate-400">
            Current Scope:{' '}
            <strong className="text-slate-900 dark:text-white">
              {perspective === 'RESIDENT' && 'Personal Payment & Spending Information (Flat 302)'}
              {perspective === 'TREASURER' && 'Community Collections, Bank UTR Reconciliation & Escrow Audit'}
              {perspective === 'VENDOR' && 'Authorized Vendor Settlement Ledger (Sports & Service Partner)'}
            </strong>
          </span>
        </div>
        <span className="text-[11px] font-mono text-slate-400">
          Role-Gated Security Active
        </span>
      </div>

      {/* ── 6 Core Capabilities Grid (Illustrative Layout) ───────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Community Payment Capabilities
          </h2>
          <span className="text-xs text-slate-400">Click any card to launch checkout</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {CAPABILITY_CARDS.map((card) => {
            const Icon = card.icon;
            const isSelected = selectedDomain === card.domain;
            return (
              <div
                key={card.domain}
                onClick={() => handlePayCapabilityDemo(card)}
                className={`group relative p-4 rounded-2xl bg-white dark:bg-[#1E1E36] border cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg flex flex-col justify-between ${
                  isSelected
                    ? 'border-indigo-600 ring-2 ring-indigo-600/20 shadow-md'
                    : 'border-slate-200 dark:border-slate-800 hover:border-indigo-300'
                }`}
              >
                <div>
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} text-white flex items-center justify-center shadow-md mb-3 group-hover:scale-105 transition-transform`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                    {card.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {card.subtitle}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                    {card.badge}
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Key Metrics Overview ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>{perspective === 'TREASURER' ? 'Total Collected' : 'Total Spent'}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2 font-mono">
            ₹{totalCompleted.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-emerald-600 font-medium">Verified receipts issued</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Pending Authorization</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-800 dark:text-amber-300 mt-2 font-mono">
            ₹{pendingAmount.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-amber-600 font-medium">{pendingCount} orders in transit</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Bank Reconciled</span>
            <CheckCheck className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-indigo-900 dark:text-indigo-300 mt-2 font-mono">
            {reconciledCount}
          </div>
          <span className="text-[10px] text-indigo-600 font-medium">Matched to bank statement</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Advance Wallet Balance</span>
            <Wallet className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-purple-900 dark:text-purple-300 mt-2 font-mono">
            ₹2,450.00
          </div>
          <span className="text-[10px] text-purple-600 font-medium">Instant 1-click settlement</span>
        </div>
      </div>

      {/* ── Filter Bar ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-[#1E1E36] p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search ref, UTR, payer, title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedDomain}
            onChange={(e) => setSelectedDomain(e.target.value as any)}
            className="px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
          >
            <option value="">All 6 Capabilities</option>
            <option value="MAINTENANCE_BILL">1. Maintenance</option>
            <option value="EVENT_BOOKING">2. Events & Pooja</option>
            <option value="SPORTS_FEE">3. Sports</option>
            <option value="MARKETPLACE_ORDER">4. Marketplace</option>
            <option value="TRIP_BOOKING">5. Mana Trips</option>
            <option value="MANA_HEALTH">6. Mana Health</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as any)}
            className="px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
          >
            <option value="">All Statuses</option>
            <option value="SUCCESS">Success / Paid</option>
            <option value="PENDING">Pending</option>
            <option value="REFUNDED">Refunded</option>
            <option value="FAILED">Failed</option>
          </select>

          {perspective === 'TREASURER' && (
            <select
              value={selectedRecon}
              onChange={(e) => setSelectedRecon(e.target.value as any)}
              className="px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
            >
              <option value="">Reconciliation (All)</option>
              <option value="RECONCILED">Reconciled</option>
              <option value="UNRECONCILED">Unreconciled</option>
            </select>
          )}

          <button
            onClick={loadData}
            type="button"
            className="p-2 text-slate-500 hover:text-indigo-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Unified Transaction History & Ledger Table ──────────────────────── */}
      <div className="bg-white dark:bg-[#1E1E36] rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-5 py-3 text-left">Date / ID</th>
                <th className="px-5 py-3 text-left">Service & Reference</th>
                <th className="px-5 py-3 text-left">
                  {perspective === 'VENDOR' ? 'Resident Payer' : 'Channel / Rail'}
                </th>
                <th className="px-5 py-3 text-right">Amount</th>
                <th className="px-5 py-3 text-center">Status</th>
                {perspective === 'TREASURER' && (
                  <th className="px-5 py-3 text-center">Bank Reconciliation</th>
                )}
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    No transactions found matching your criteria.
                  </td>
                </tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        {t.transactionNumber}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {new Date(t.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900 dark:text-white max-w-xs truncate">
                        {t.title}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                        <span>Ref: {t.orderReferenceId}</span>
                        <span>·</span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                          {t.domain.replace(/_/g, ' ')}
                        </span>
                      </div>
                      {t.vendorName && (
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Beneficiary: {t.vendorName}
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {perspective === 'VENDOR' ? (
                        <div>
                          <div className="font-bold text-slate-800 dark:text-slate-200">{t.payerName}</div>
                          <div className="text-[11px] text-slate-400">{t.payerUnit}</div>
                        </div>
                      ) : (
                        <div>
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {t.paymentRail.replace(/_/g, ' ')}
                          </span>
                          {t.utr && (
                            <div className="font-mono text-[10px] text-slate-400 truncate max-w-[120px]">
                              UTR: {t.utr}
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-right font-mono font-black text-slate-900 dark:text-white whitespace-nowrap">
                      ₹{t.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    <td className="px-5 py-3.5 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                          t.status === 'SUCCESS'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : t.status === 'REFUNDED'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300'
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>

                    {/* Treasurer Reconciliation Column */}
                    {perspective === 'TREASURER' && (
                      <td className="px-5 py-3.5 text-center whitespace-nowrap">
                        {t.reconciliationStatus === 'RECONCILED' ? (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                            <Check className="w-3 h-3" />
                            <span>Matched</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleManualReconciliation(t.transactionNumber)}
                            type="button"
                            className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors"
                          >
                            Match UTR
                          </button>
                        )}
                      </td>
                    )}

                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleOpenReceipt(t.transactionNumber)}
                        type="button"
                        className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 text-indigo-700 dark:bg-slate-800 dark:text-indigo-300 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1.5"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        Receipt
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Sub-Modals ──────────────────────────────────────────────────────── */}
      <ManaPayReceiptModal
        receipt={selectedReceipt}
        isOpen={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        onRequestRefund={handleRequestRefund}
      />

      {activeCheckoutOrder && (
        <ManaPayCheckoutModal
          isOpen={checkoutModalOpen}
          onClose={() => setCheckoutModalOpen(false)}
          order={activeCheckoutOrder}
          onPaymentSuccess={() => {
            loadData();
          }}
        />
      )}
    </div>
  );
};
