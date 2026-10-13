import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  QrCode,
  Link2,
  RefreshCw,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Copy,
  ExternalLink,
  Printer,
  Volume2,
  VolumeX,
  FileText,
  DollarSign,
  Download,
  IndianRupee,
  Share2,
  ArrowUpRight,
  Clock,
  Layers,
  Search,
  Filter,
  Check,
  Building,
  Store,
  Sparkles,
  HelpCircle,
  ShoppingBag,
} from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../ui/dialog';
import { Input } from '../../ui/input';
import { ManaPayQrCode } from '../..//payments/unified/ManaPayQrCode';
import {
  vendorMerchantPaymentService,
  type VendorMerchantProfileDto,
  type PaymentLinkDto,
  type ReconciliationRecordDto,
  type RefundDisputeDto,
  type MerchantSalesSummaryDto,
  type SettlementBatchDto,
  type CreatePaymentLinkRequest,
} from '../../../../services/vendor/vendorMerchantPaymentService';

type ActiveTab = 'overview' | 'links' | 'qr_collect' | 'reconciliation' | 'disputes' | 'settlements' | 'profile';

export const VendorMerchantPayments: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [profile, setProfile] = useState<VendorMerchantProfileDto | null>(null);
  const [links, setLinks] = useState<PaymentLinkDto[]>([]);
  const [reconciliations, setReconciliations] = useState<ReconciliationRecordDto[]>([]);
  const [disputes, setDisputes] = useState<RefundDisputeDto[]>([]);
  const [salesSummary, setSalesSummary] = useState<MerchantSalesSummaryDto | null>(null);
  const [settlements, setSettlements] = useState<SettlementBatchDto[]>([]);
  const [settlementSummary, setSettlementSummary] = useState<ReturnType<
    typeof vendorMerchantPaymentService.getSettlementSummary
  > | null>(null);

  // Audio confirmation toggle (PhonePe SmartSpeaker simulation)
  const [audioChimeEnabled, setAudioChimeEnabled] = useState(true);

  // Modals
  const [showCreateLinkModal, setShowCreateLinkModal] = useState(false);
  const [showDirectRefundModal, setShowDirectRefundModal] = useState<ReconciliationRecordDto | null>(null);
  const [selectedLinkForQr, setSelectedLinkForQr] = useState<PaymentLinkDto | null>(null);
  const [standeeMode, setStandeeMode] = useState<'COUNTER_DESK' | 'CUSTOM_AMOUNT'>('COUNTER_DESK');
  const [counterCustomAmount, setCounterCustomAmount] = useState<number>(0);

  // New Link Form
  const [newLinkForm, setNewLinkForm] = useState<CreatePaymentLinkRequest>({
    customerName: '',
    customerPhone: '',
    customerUnit: '',
    amount: 0,
    description: '',
    orderType: 'COMMUNITY_MARKET',
    expiryHours: 24,
  });

  // Direct refund form
  const [directRefundReason, setDirectRefundReason] = useState('Customer cancellation & goodwill refund');

  // Filter & Search states
  const [linkFilter, setLinkFilter] = useState<'ALL' | 'ACTIVE' | 'PAID' | 'EXPIRED'>('ALL');
  const [reconSearch, setReconSearch] = useState('');

  const loadData = () => {
    const prof = vendorMerchantPaymentService.getMerchantProfile();
    const lks = vendorMerchantPaymentService.getPaymentLinks();
    const recons = vendorMerchantPaymentService.getReconciliationRecords();
    const dsps = vendorMerchantPaymentService.getDisputes();
    const sales = vendorMerchantPaymentService.getSalesSummary('THIS_MONTH');
    const setts = vendorMerchantPaymentService.getSettlementBatches();
    const settSum = vendorMerchantPaymentService.getSettlementSummary();

    setProfile(prof);
    setLinks(lks);
    setReconciliations(recons);
    setDisputes(dsps);
    setSalesSummary(sales);
    setSettlements(setts);
    setSettlementSummary(settSum);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLinkForm.customerName || !newLinkForm.amount) {
      toast.error('Please enter customer name and order amount.');
      return;
    }

    const created = vendorMerchantPaymentService.createPaymentLink(newLinkForm);
    toast.success(`Payment link generated for ₹${created.amount}`);
    setShowCreateLinkModal(false);
    setNewLinkForm({
      customerName: '',
      customerPhone: '',
      customerUnit: '',
      amount: 0,
      description: '',
      orderType: 'COMMUNITY_MARKET',
      expiryHours: 24,
    });
    loadData();
  };

  const handleSimulatePayment = (linkId: string) => {
    const paid = vendorMerchantPaymentService.markLinkAsPaid(linkId);
    if (paid) {
      if (audioChimeEnabled) {
        // Voice chime simulation
        try {
          const utterance = new SpeechSynthesisUtterance(
            `PhonePe received payment of rupees ${paid.amount} from ${paid.customerName}`
          );
          utterance.rate = 1.0;
          utterance.pitch = 1.0;
          window.speechSynthesis?.speak(utterance);
        } catch {
          // ignore
        }
      }
      toast.success(`Payment simulated: ₹${paid.amount} received via UPI!`);
      loadData();
    }
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('Payment link copied to clipboard!');
  };

  const handleRefund = (disputeId: string) => {
    vendorMerchantPaymentService.processRefund(disputeId, 'Refund approved and credited back to source UPI VPA.');
    toast.success('Refund processed successfully to resident account.');
    loadData();
  };

  const handleDirectRefundSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showDirectRefundModal) return;
    vendorMerchantPaymentService.initiateDirectOrderRefund(
      showDirectRefundModal.orderId,
      showDirectRefundModal.paidAmount,
      directRefundReason
    );
    toast.success(`Refund of ₹${showDirectRefundModal.paidAmount} initiated via PG node.`);
    setShowDirectRefundModal(null);
    loadData();
  };

  const filteredLinks = links.filter((l) => {
    if (linkFilter === 'ALL') return true;
    return l.status === linkFilter;
  });

  const filteredRecon = reconciliations.filter((r) => {
    return (
      r.orderId.toLowerCase().includes(reconSearch.toLowerCase()) ||
      r.customerName.toLowerCase().includes(reconSearch.toLowerCase()) ||
      r.utr.toLowerCase().includes(reconSearch.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      <Toaster position="top-right" richColors />

      {/* ── Top Header & PhonePe Integration Badge ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#5f259f] flex items-center justify-center text-white shadow-md shadow-purple-600/20">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Mana Merchant & Vendor Payments
                </h1>
                <Badge className="bg-purple-100 text-purple-900 border-purple-200 text-xs font-bold">
                  PhonePe PG Integrated
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Regulated direct vendor settlement, dynamic order payment links, counter QR standees & reconciliation.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAudioChimeEnabled(!audioChimeEnabled)}
            className={`text-xs font-semibold ${
              audioChimeEnabled
                ? 'border-purple-300 text-purple-800 bg-purple-50 hover:bg-purple-100'
                : 'border-slate-200 text-slate-500'
            }`}
          >
            {audioChimeEnabled ? (
              <>
                <Volume2 className="w-4 h-4 mr-1.5 text-purple-600" />
                SmartSpeaker Voice: ON
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 mr-1.5" />
                SmartSpeaker Voice: OFF
              </>
            )}
          </Button>

          <Button
            onClick={() => setShowCreateLinkModal(true)}
            className="bg-[#5f259f] hover:bg-[#4d1d82] text-white shadow-xs font-semibold text-xs"
            size="sm"
          >
            <Link2 className="w-4 h-4 mr-1.5" />
            Create Payment Link
          </Button>
        </div>
      </div>

      {/* ── Regulatory Compliance Banner ── */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <span className="p-2 rounded-lg bg-emerald-600 text-white shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </span>
          <div>
            <p className="text-xs sm:text-sm font-bold text-emerald-950">
              Direct Vendor Settlement · No Regulatory Fund Pooling
            </p>
            <p className="text-xs text-emerald-800">
              Resident payments flow directly through licensed payment aggregators to your verified bank account ({profile?.settlementAccount.bankName} ending in {profile?.settlementAccount.accountNumber}). Mana does not hold vendor funds.
            </p>
          </div>
        </div>
        <Badge className="bg-white text-emerald-800 border-emerald-300 font-bold text-[10px] uppercase shrink-0">
          T+1 Automated NEFT/RTGS
        </Badge>
      </div>

      {/* ── Tabs Navigation ── */}
      <div className="bg-white border border-slate-200 rounded-xl p-1.5 shadow-xs flex items-center gap-1 overflow-x-auto scrollbar-none">
        {[
          { key: 'overview', label: 'Sales Overview', icon: TrendingUp },
          { key: 'links', label: 'Payment Links', icon: Link2, count: links.length },
          { key: 'qr_collect', label: 'QR Counter & Standee', icon: QrCode },
          { key: 'reconciliation', label: 'Reconciliation', icon: RefreshCw, count: reconciliations.length },
          { key: 'disputes', label: 'Refunds & Disputes', icon: AlertTriangle, count: disputes.filter(d => d.status === 'OPEN').length },
          { key: 'settlements', label: 'Settlement Reports', icon: FileText, count: settlements.length },
          { key: 'profile', label: 'Merchant Profile', icon: Store },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as ActiveTab)}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-purple-100 text-purple-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    tab.key === 'disputes'
                      ? 'bg-rose-500 text-white'
                      : isActive
                      ? 'bg-purple-700 text-white'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: SALES OVERVIEW & SUMMARIES ── */}
      {activeTab === 'overview' && salesSummary && (
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Gross Collections (GMV)
              </span>
              <div className="text-2xl font-black text-slate-900 mt-1">
                ₹{salesSummary.grossVolume.toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5" /> +18.4% vs last month
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Net Settled Payouts
              </span>
              <div className="text-2xl font-black text-emerald-700 mt-1">
                ₹{salesSummary.netSettledVolume.toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Direct to {profile?.settlementAccount.bankName}
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Successful Transactions
              </span>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {salesSummary.successfulCount} Orders
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {salesSummary.refundedCount} refunds processed
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Average Ticket Size
              </span>
              <div className="text-2xl font-black text-purple-900 mt-1">
                ₹{salesSummary.averageTicketSize.toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-slate-500 mt-1">Across Market & Deals</p>
            </div>
          </div>

          {/* Payment Modes & Top Products Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Payment Method Mix */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">Payment Modes & Channels</h3>
                <span className="text-xs font-semibold text-slate-500">October Breakdown</span>
              </div>
              <div className="space-y-3">
                {salesSummary.paymentMethodBreakdown.map((pm, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                      <span>{pm.method}</span>
                      <span>₹{pm.amount.toLocaleString('en-IN')} ({pm.percentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
                      <div
                        className="bg-[#5f259f] h-1.5 rounded-full"
                        style={{ width: `${pm.percentage}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1.5">{pm.count} completed orders</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Selling Goods & Services */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">Top Revenue Generators</h3>
                <span className="text-xs font-semibold text-slate-500">Community Market</span>
              </div>
              <div className="space-y-3">
                {salesSummary.topSellingItems.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                    <div>
                      <p className="text-xs font-bold text-slate-900">{item.itemName}</p>
                      <p className="text-[11px] text-slate-500">{item.unitsSold} units delivered</p>
                    </div>
                    <span className="text-xs font-black text-slate-900">
                      ₹{item.revenue.toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: ORDER-SPECIFIC PAYMENT LINKS ── */}
      {activeTab === 'links' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Order-Specific Payment Links</h2>
              <p className="text-xs text-slate-500">
                Generate dedicated checkout links for resident orders, custom deliveries, or group purchase claims.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={linkFilter}
                onChange={(e) => setLinkFilter(e.target.value as any)}
                className="text-xs border border-slate-200 rounded-lg p-2 bg-white font-medium"
              >
                <option value="ALL">All Links</option>
                <option value="ACTIVE">Active (Unpaid)</option>
                <option value="PAID">Paid</option>
                <option value="EXPIRED">Expired</option>
              </select>
              <Button
                onClick={() => setShowCreateLinkModal(true)}
                className="bg-[#5f259f] hover:bg-[#4d1d82] text-white text-xs font-semibold"
                size="sm"
              >
                <Link2 className="w-4 h-4 mr-1.5" />
                New Link
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLinks.map((link) => (
              <div
                key={link.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-mono text-purple-700 font-bold">{link.orderId}</span>
                      <h4 className="text-sm font-bold text-slate-900 mt-0.5">{link.customerName}</h4>
                      {link.customerUnit && (
                        <p className="text-xs text-slate-500">{link.customerUnit}</p>
                      )}
                    </div>
                    <Badge
                      className={`text-[10px] font-bold ${
                        link.status === 'PAID'
                          ? 'bg-emerald-100 text-emerald-800'
                          : link.status === 'ACTIVE'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {link.status}
                    </Badge>
                  </div>

                  <p className="text-xs text-slate-600 mt-2 line-clamp-2">{link.description}</p>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-baseline justify-between">
                    <span className="text-lg font-black text-slate-900">
                      ₹{link.amount.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {link.status === 'PAID' ? `Paid ${link.paidAt?.slice(11, 16)}` : `Expires ${link.expiresAt.slice(0, 10)}`}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleCopyLink(link.shortUrl)}
                      className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      title="Copy short payment link"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setSelectedLinkForQr(link)}
                      className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      title="View Order QR Code"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {link.status === 'ACTIVE' && (
                    <Button
                      size="sm"
                      onClick={() => handleSimulatePayment(link.id)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-8"
                    >
                      Simulate Pay
                    </Button>
                  )}
                  {link.status === 'PAID' && (
                    <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> UTR: {link.utr?.slice(-6)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 3: QR COUNTER & STANDEE ── */}
      {activeTab === 'qr_collect' && profile && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">QR-Based Collections & Counter Standee</h2>
              <p className="text-xs text-slate-500">
                Official UPI QR code for your store counter, delivery bags, or community stall.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="border-slate-200 text-slate-700 text-xs font-semibold"
              >
                <Printer className="w-4 h-4 mr-1.5" />
                Print Standee
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Standee Preview Card */}
            <div className="bg-gradient-to-b from-[#5f259f] to-[#391560] text-white rounded-3xl p-6 shadow-xl flex flex-col items-center text-center">
              {/* Standee Header */}
              <div className="bg-white/10 px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase mb-4">
                Mana Community Verified Merchant
              </div>

              <h3 className="text-xl font-black">{profile.tradeName}</h3>
              <p className="text-xs text-purple-200 mt-1">UPI ID: {profile.vpa}</p>

              {/* QR Code Container */}
              <div className="bg-white p-4 rounded-2xl shadow-lg mt-6 text-slate-900">
                <ManaPayQrCode
                  value={
                    vendorMerchantPaymentService.getMerchantQrPayload(
                      standeeMode === 'CUSTOM_AMOUNT' && counterCustomAmount > 0
                        ? counterCustomAmount
                        : undefined
                    ).upiPayload
                  }
                  size={200}
                />
                {standeeMode === 'CUSTOM_AMOUNT' && counterCustomAmount > 0 && (
                  <div className="mt-2 text-base font-black text-slate-900">
                    Pay ₹{counterCustomAmount}
                  </div>
                )}
              </div>

              {/* Accepted UPI Apps logos hint */}
              <div className="mt-6 flex items-center justify-center gap-3 text-xs text-purple-200 font-semibold">
                <span>PhonePe</span> • <span>GPay</span> • <span>Paytm</span> • <span>BHIM UPI</span>
              </div>
              <p className="text-[10px] text-purple-300/80 mt-2">
                Settles directly to {profile.settlementAccount.bankName}
              </p>
            </div>

            {/* Standee Controls & Options */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
              <h3 className="text-base font-bold text-slate-900">Counter QR Settings & Amount Tagging</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => setStandeeMode('COUNTER_DESK')}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    standeeMode === 'COUNTER_DESK'
                      ? 'border-[#5f259f] bg-purple-50/50 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="text-xs font-bold text-slate-900">Static Counter Standee</div>
                  <p className="text-xs text-slate-500 mt-1">
                    Customers enter their own bill amount at the stall or grocery checkout counter.
                  </p>
                </button>

                <button
                  onClick={() => setStandeeMode('CUSTOM_AMOUNT')}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    standeeMode === 'CUSTOM_AMOUNT'
                      ? 'border-[#5f259f] bg-purple-50/50 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="text-xs font-bold text-slate-900">Dynamic Amount QR</div>
                  <p className="text-xs text-slate-500 mt-1">
                    Locks exact bill amount so resident doesn&rsquo;t need to type the number.
                  </p>
                </button>
              </div>

              {standeeMode === 'CUSTOM_AMOUNT' && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <label className="text-xs font-bold text-slate-700">Enter Bill Amount to Embed (₹)</label>
                  <Input
                    type="number"
                    value={counterCustomAmount || ''}
                    onChange={(e) => setCounterCustomAmount(Number(e.target.value))}
                    placeholder="e.g. 450"
                  />
                  <p className="text-[11px] text-slate-500">
                    The QR code on the left updates dynamically in real-time.
                  </p>
                </div>
              )}

              <div className="border-t border-slate-100 pt-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Payment Instructions Broadcast to Residents
                </h4>
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900 font-medium">
                  {profile.paymentInstructions}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: ORDER & PAYMENT RECONCILIATION ── */}
      {activeTab === 'reconciliation' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Order & Payment Reconciliation</h2>
              <p className="text-xs text-slate-500">
                Automatic cross-matching of incoming UPI transactions with catalog orders & bank UTR reference numbers.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <Input
                placeholder="Search Order ID, UTR or resident..."
                value={reconSearch}
                onChange={(e) => setReconSearch(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-left font-bold text-slate-600">
                    <th className="p-3.5">Order ID</th>
                    <th className="p-3.5">Channel</th>
                    <th className="p-3.5">Resident</th>
                    <th className="p-3.5">Amount</th>
                    <th className="p-3.5">UTR / Bank Ref</th>
                    <th className="p-3.5">Timestamp</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRecon.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-slate-900">{r.orderId}</td>
                      <td className="p-3.5 text-slate-600">{r.channel.replace('_', ' ')}</td>
                      <td className="p-3.5 font-semibold text-slate-900">{r.customerName}</td>
                      <td className="p-3.5 font-bold text-slate-900">₹{r.paidAmount.toLocaleString('en-IN')}</td>
                      <td className="p-3.5 font-mono text-slate-600">
                        {r.utr}
                        <div className="text-[10px] text-slate-400">{r.bankRefNumber}</div>
                      </td>
                      <td className="p-3.5 text-slate-500">{r.paymentTimestamp}</td>
                      <td className="p-3.5">
                        <Badge
                          className={`text-[10px] font-bold ${
                            r.status === 'MATCHED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {r.status}
                        </Badge>
                      </td>
                      <td className="p-3.5 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowDirectRefundModal(r)}
                          className="text-[11px] h-7 border-slate-200 hover:bg-slate-50 text-slate-700"
                        >
                          Direct Refund
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 5: REFUNDS & DISPUTES ── */}
      {activeTab === 'disputes' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Refunds & Resident Disputes</h2>
              <p className="text-xs text-slate-500">
                Resolve chargebacks, missing deliveries, or quality complaints directly through regulated payment reversals.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {disputes.map((dsp) => (
              <div
                key={dsp.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-purple-700">{dsp.orderId}</span>
                    <Badge
                      className={`text-[10px] font-bold ${
                        dsp.status === 'REFUNDED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : dsp.status === 'OPEN'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {dsp.status}
                    </Badge>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mt-1">{dsp.reason}</h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Resident: {dsp.customerName} ({dsp.customerPhone}) · Claimed: &ldquo;{dsp.customerClaimNote}&rdquo;
                  </p>
                  {dsp.merchantResponseNote && (
                    <p className="text-xs text-emerald-800 mt-1 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                      Merchant Resolution: {dsp.merchantResponseNote}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 self-end md:self-center">
                  <div className="text-right">
                    <div className="text-base font-black text-slate-900">
                      ₹{dsp.amount.toLocaleString('en-IN')}
                    </div>
                    <span className="text-[11px] text-slate-400">{dsp.disputeDate}</span>
                  </div>

                  {dsp.status === 'OPEN' && (
                    <Button
                      size="sm"
                      onClick={() => handleRefund(dsp.id)}
                      className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold h-8"
                    >
                      Approve Refund
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 6: SETTLEMENT REPORTS (COMMUNITY MARKET & DEALS) ── */}
      {activeTab === 'settlements' && settlementSummary && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Settlement Reports & Payouts</h2>
              <p className="text-xs text-slate-500">
                Audited statements detailing Gross sales, PG convenience deductions, TDS, and Net bank disbursements.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.success('Downloaded full settlement statement (CSV)')}
              className="text-xs font-semibold border-slate-200"
            >
              <Download className="w-4 h-4 mr-1.5" />
              Download CSV Statement
            </Button>
          </div>

          {/* Settlement KPI bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Settled to Bank
              </span>
              <div className="text-2xl font-black text-emerald-700 mt-1">
                ₹{settlementSummary.totalSettledVolume.toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-slate-500 mt-1">T+1 automated clearing</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Pending T+1 In-Transit
              </span>
              <div className="text-2xl font-black text-amber-700 mt-1">
                ₹{settlementSummary.pendingPayoutVolume.toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-slate-500 mt-1">Releasing at 06:30 AM tomorrow</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Deductions (Fees & TDS)
              </span>
              <div className="text-2xl font-black text-slate-900 mt-1">
                ₹{settlementSummary.totalDeductions.toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-slate-500 mt-1">Includes 1% TDS & PG fees</p>
            </div>
          </div>

          {/* Settlement Batches Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-left font-bold text-slate-600">
                    <th className="p-3.5">Batch ID</th>
                    <th className="p-3.5">Source Type</th>
                    <th className="p-3.5">Gross Amount</th>
                    <th className="p-3.5">PG & Take Rate</th>
                    <th className="p-3.5">TDS (1%)</th>
                    <th className="p-3.5">Net Settled</th>
                    <th className="p-3.5">Bank UTR</th>
                    <th className="p-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {settlements.map((batch) => (
                    <tr key={batch.batchId} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-slate-900">{batch.batchId}</td>
                      <td className="p-3.5 font-semibold text-purple-900">
                        {batch.sourceType.replace('_', ' ')}
                      </td>
                      <td className="p-3.5 font-semibold text-slate-900">
                        ₹{batch.grossAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="p-3.5 text-slate-600">
                        ₹{(batch.convenienceFeeGst + batch.platformTakeRate).toLocaleString('en-IN')}
                      </td>
                      <td className="p-3.5 text-slate-600">₹{batch.tdsDeduction.toLocaleString('en-IN')}</td>
                      <td className="p-3.5 font-black text-emerald-700">
                        ₹{batch.netSettledAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="p-3.5 font-mono text-slate-600">{batch.bankUtr}</td>
                      <td className="p-3.5">
                        <Badge
                          className={`text-[10px] font-bold ${
                            batch.status === 'SETTLED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {batch.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 7: MERCHANT PROFILE & BANK DETAILS ── */}
      {activeTab === 'profile' && profile && (
        <div className="space-y-6 max-w-4xl">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Verified Merchant Profile & Bank Settlement</h2>
            <p className="text-xs text-slate-500">
              Tax registration credentials, direct settlement node info, and VPA configuration.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                Business & Entity Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 font-semibold">Legal Entity Name</span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">{profile.legalEntityName}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 font-semibold">Trade Name (Counter)</span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">{profile.tradeName}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 font-semibold">GSTIN</span>
                  <p className="text-sm font-bold font-mono text-slate-900 mt-0.5">{profile.gstin}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 font-semibold">PAN</span>
                  <p className="text-sm font-bold font-mono text-slate-900 mt-0.5">{profile.pan}</p>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-5">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                Direct Settlement Bank Credentials (Regulated)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl">
                  <span className="text-emerald-800 font-semibold">Bank Name</span>
                  <p className="text-sm font-bold text-emerald-950 mt-0.5">
                    {profile.settlementAccount.bankName}
                  </p>
                </div>
                <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl">
                  <span className="text-emerald-800 font-semibold">Account Number</span>
                  <p className="text-sm font-bold font-mono text-emerald-950 mt-0.5">
                    {profile.settlementAccount.accountNumber}
                  </p>
                </div>
                <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl">
                  <span className="text-emerald-800 font-semibold">IFSC Code</span>
                  <p className="text-sm font-bold font-mono text-emerald-950 mt-0.5">
                    {profile.settlementAccount.ifscCode}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-5 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 font-semibold">Payment Aggregator Reference</span>
                <p className="text-xs font-mono font-bold text-slate-800 mt-0.5">
                  {profile.paymentAggregatorRef} (PhonePe Direct Node)
                </p>
              </div>
              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 font-bold">
                Penny-Drop Verified
              </Badge>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: CREATE PAYMENT LINK ── */}
      <Dialog open={showCreateLinkModal} onOpenChange={setShowCreateLinkModal}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Generate Order Payment Link</DialogTitle>
            <DialogDescription>
              Create a link for a resident with custom order details and UPI intent.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateLink} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700">Customer Full Name</label>
              <Input
                placeholder="e.g. Rahul Mehra"
                value={newLinkForm.customerName}
                onChange={(e) => setNewLinkForm({ ...newLinkForm, customerName: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700">Phone</label>
                <Input
                  placeholder="+91 98450..."
                  value={newLinkForm.customerPhone}
                  onChange={(e) => setNewLinkForm({ ...newLinkForm, customerPhone: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="font-bold text-slate-700">Tower / Unit</label>
                <Input
                  placeholder="e.g. Tower B 402"
                  value={newLinkForm.customerUnit || ''}
                  onChange={(e) => setNewLinkForm({ ...newLinkForm, customerUnit: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700">Amount (₹)</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={newLinkForm.amount || ''}
                  onChange={(e) => setNewLinkForm({ ...newLinkForm, amount: Number(e.target.value) })}
                  required
                />
              </div>
              <div>
                <label className="font-bold text-slate-700">Channel</label>
                <select
                  value={newLinkForm.orderType}
                  onChange={(e) => setNewLinkForm({ ...newLinkForm, orderType: e.target.value as any })}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                >
                  <option value="COMMUNITY_MARKET">Community Market</option>
                  <option value="MANA_DEALS">Mana Deals</option>
                  <option value="DIRECT_SERVICE">Service Booking</option>
                  <option value="CUSTOM_ORDER">Custom Order</option>
                </select>
              </div>
            </div>
            <div>
              <label className="font-bold text-slate-700">Order Description</label>
              <Input
                placeholder="e.g. 5 KG Chakki Atta + 1L Oil"
                value={newLinkForm.description}
                onChange={(e) => setNewLinkForm({ ...newLinkForm, description: e.target.value })}
                required
              />
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setShowCreateLinkModal(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-[#5f259f] hover:bg-[#4d1d82] text-white">
                Generate Link
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── MODAL: VIEW ORDER QR CODE ── */}
      <Dialog open={!!selectedLinkForQr} onOpenChange={(open) => !open && setSelectedLinkForQr(null)}>
        <DialogContent className="max-w-sm bg-white text-center">
          <DialogHeader>
            <DialogTitle>Order UPI QR Code</DialogTitle>
            <DialogDescription>
              Scan to pay ₹{selectedLinkForQr?.amount} for {selectedLinkForQr?.orderId}
            </DialogDescription>
          </DialogHeader>
          {selectedLinkForQr && (
            <div className="flex flex-col items-center justify-center p-4">
              <ManaPayQrCode value={selectedLinkForQr.upiIntentUrl} size={180} />
              <p className="text-xs font-semibold text-slate-700 mt-4">
                {selectedLinkForQr.customerName} · ₹{selectedLinkForQr.amount}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5 font-mono">{selectedLinkForQr.shortUrl}</p>
            </div>
          )}
          <DialogFooter className="sm:justify-center">
            <Button
              size="sm"
              onClick={() => {
                if (selectedLinkForQr) handleCopyLink(selectedLinkForQr.shortUrl);
              }}
              className="bg-[#5f259f] text-white"
            >
              <Copy className="w-3.5 h-3.5 mr-1" /> Copy Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── MODAL: DIRECT REFUND ── */}
      <Dialog open={!!showDirectRefundModal} onOpenChange={(open) => !open && setShowDirectRefundModal(null)}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Initiate Direct Order Refund</DialogTitle>
            <DialogDescription>
              Order {showDirectRefundModal?.orderId} (₹{showDirectRefundModal?.paidAmount})
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleDirectRefundSubmit} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700">Refund Amount (₹)</label>
              <Input value={showDirectRefundModal?.paidAmount || 0} disabled />
            </div>
            <div>
              <label className="font-bold text-slate-700">Reason for Reversal</label>
              <Input
                value={directRefundReason}
                onChange={(e) => setDirectRefundReason(e.target.value)}
                required
              />
            </div>
            <p className="text-[11px] text-slate-500">
              The amount will reverse directly to the resident&rsquo;s original UPI payment method via PhonePe PG.
            </p>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setShowDirectRefundModal(null)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-rose-600 hover:bg-rose-700 text-white">
                Confirm Refund
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
