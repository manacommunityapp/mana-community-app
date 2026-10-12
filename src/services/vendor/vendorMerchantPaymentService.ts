import { safeStorage } from '../../utils/storage';

// ─── Types & DTOs ──────────────────────────────────────────────────────────

export interface VendorMerchantProfileDto {
  vendorId: string;
  legalEntityName: string;
  tradeName: string;
  gstin?: string;
  pan: string;
  fssaiLicense?: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  // Regulatory direct settlement bank details
  settlementAccount: {
    bankName: string;
    accountNumber: string; // Masked
    ifscCode: string;
    beneficiaryName: string;
    verificationStatus: 'VERIFIED' | 'PENDING' | 'REJECTED';
    verifiedAt?: string;
  };
  vpa: string; // Primary UPI handle
  paymentInstructions: string;
  onboardingStatus: 'ACTIVE' | 'PENDING_DOCUMENTATION' | 'UNDER_REVIEW';
  paymentAggregatorRef: string; // E.g., PhonePe Merchant ID
}

export type PaymentLinkStatus = 'ACTIVE' | 'PAID' | 'EXPIRED' | 'CANCELLED';

export interface PaymentLinkDto {
  id: string;
  orderId: string;
  orderType: 'COMMUNITY_MARKET' | 'MANA_DEALS' | 'DIRECT_SERVICE' | 'CUSTOM_ORDER';
  customerName: string;
  customerPhone: string;
  customerUnit?: string;
  amount: number;
  currency: string;
  description: string;
  items?: { name: string; quantity: number; unitPrice: number }[];
  expiresAt: string;
  status: PaymentLinkStatus;
  shortUrl: string;
  upiIntentUrl: string;
  paidAt?: string;
  utr?: string;
  paymentMethod?: 'UPI_INTENT' | 'UPI_QR' | 'NET_BANKING' | 'CARD';
  createdAt: string;
}

export interface CreatePaymentLinkRequest {
  orderId?: string;
  orderType?: 'COMMUNITY_MARKET' | 'MANA_DEALS' | 'DIRECT_SERVICE' | 'CUSTOM_ORDER';
  customerName: string;
  customerPhone: string;
  customerUnit?: string;
  amount: number;
  description: string;
  items?: { name: string; quantity: number; unitPrice: number }[];
  expiryHours?: number;
}

export type ReconciliationStatus = 'MATCHED' | 'PENDING_RECONCILIATION' | 'UNMATCHED';

export interface ReconciliationRecordDto {
  id: string;
  orderId: string;
  channel: 'COMMUNITY_MARKET' | 'MANA_DEALS' | 'COUNTER_QR' | 'PAYMENT_LINK';
  customerName: string;
  orderAmount: number;
  paidAmount: number;
  utr: string;
  paymentMethod: string;
  paymentTimestamp: string;
  status: ReconciliationStatus;
  discrepancyNote?: string;
  bankRefNumber: string;
}

export type DisputeStatus = 'OPEN' | 'UNDER_REVIEW' | 'REFUNDED' | 'REJECTED';

export interface RefundDisputeDto {
  id: string;
  orderId: string;
  utr: string;
  customerName: string;
  customerPhone: string;
  amount: number;
  refundAmount: number;
  reason: string;
  disputeDate: string;
  status: DisputeStatus;
  customerClaimNote: string;
  merchantResponseNote?: string;
  resolvedAt?: string;
}

export interface MerchantSalesSummaryDto {
  period: 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH';
  grossVolume: number; // GMV
  netSettledVolume: number;
  totalTransactions: number;
  successfulCount: number;
  refundedCount: number;
  averageTicketSize: number;
  paymentMethodBreakdown: {
    method: string;
    amount: number;
    percentage: number;
    count: number;
  }[];
  topSellingItems: {
    itemName: string;
    revenue: number;
    unitsSold: number;
  }[];
}

export interface SettlementBatchDto {
  batchId: string;
  periodStart: string;
  periodEnd: string;
  sourceType: 'COMMUNITY_MARKET' | 'MANA_DEALS' | 'BLENDED';
  grossAmount: number;
  convenienceFeeGst: number;
  platformTakeRate: number;
  tdsDeduction: number;
  netSettledAmount: number;
  bankUtr: string;
  settledAt: string;
  status: 'SETTLED' | 'PROCESSING' | 'ON_HOLD';
  transactionCount: number;
}

// ─── Storage Keys & Default State ────────────────────────────────────────────

const STORAGE_KEYS = {
  PROFILE: 'mana_vendor_merchant_profile',
  LINKS: 'mana_vendor_payment_links',
  RECONCILIATION: 'mana_vendor_reconciliation',
  DISPUTES: 'mana_vendor_disputes',
  SETTLEMENTS: 'mana_vendor_settlements',
};

const DEFAULT_PROFILE: VendorMerchantProfileDto = {
  vendorId: 'v-101',
  legalEntityName: 'GreenEarth Organics & Agro LLP',
  tradeName: 'GreenEarth Farms & Market',
  gstin: '29AABCG1234D1Z5',
  pan: 'AABCG1234D',
  fssaiLicense: '11223344556677',
  contactEmail: 'accounts@greenearthfarms.in',
  contactPhone: '+91 98450 12345',
  address: 'Commercial Kiosk #03, Mana Vista Clubhouse, Bangalore 560087',
  settlementAccount: {
    bankName: 'HDFC Bank Ltd',
    accountNumber: '••••••••4829',
    ifscCode: 'HDFC0000128',
    beneficiaryName: 'GreenEarth Organics & Agro LLP',
    verificationStatus: 'VERIFIED',
    verifiedAt: '2026-08-15T10:30:00Z',
  },
  vpa: 'greenearth.mana@phonepe',
  paymentInstructions: 'Please specify your Apartment & Tower number in UPI payment note for doorstep drop.',
  onboardingStatus: 'ACTIVE',
  paymentAggregatorRef: 'PP_MERCHANT_9984210',
};

const DEFAULT_PAYMENT_LINKS: PaymentLinkDto[] = [
  {
    id: 'link-101',
    orderId: 'ORD-MKT-8841',
    orderType: 'COMMUNITY_MARKET',
    customerName: 'Priya Sundaram',
    customerPhone: '+91 98860 12345',
    customerUnit: 'Tower B, Flat 402',
    amount: 1450,
    currency: 'INR',
    description: 'Weekly Organic Veggies & Cold Pressed Coconut Oil',
    items: [
      { name: 'Organic Spinach & Kale Bundle', quantity: 2, unitPrice: 120 },
      { name: 'Cold Pressed Coconut Oil (1L)', quantity: 1, unitPrice: 450 },
      { name: 'Hydroponic Cherry Tomatoes (500g)', quantity: 2, unitPrice: 380 },
    ],
    expiresAt: '2026-10-15T23:59:59Z',
    status: 'PAID',
    shortUrl: 'https://pay.mana.community/inv/8841',
    upiIntentUrl: 'upi://pay?pa=greenearth.mana@phonepe&pn=GreenEarth%20Market&am=1450&cu=INR&tr=ORD-MKT-8841',
    paidAt: '2026-10-12T09:14:22Z',
    utr: '628841928014',
    paymentMethod: 'UPI_INTENT',
    createdAt: '2026-10-12T08:45:00Z',
  },
  {
    id: 'link-102',
    orderId: 'ORD-DEAL-4412',
    orderType: 'MANA_DEALS',
    customerName: 'Rahul Mehra',
    customerPhone: '+91 97410 99881',
    customerUnit: 'Tower A, Flat 1201',
    amount: 850,
    currency: 'INR',
    description: 'Mana Deals: 25% Off Cold Brew & Sourdough Breakfast Combo',
    items: [
      { name: 'Artisan Sourdough Loaf', quantity: 1, unitPrice: 350 },
      { name: 'Arabica Cold Brew Concentrates', quantity: 2, unitPrice: 250 },
    ],
    expiresAt: '2026-10-13T18:00:00Z',
    status: 'ACTIVE',
    shortUrl: 'https://pay.mana.community/inv/4412',
    upiIntentUrl: 'upi://pay?pa=greenearth.mana@phonepe&pn=GreenEarth%20Market&am=850&cu=INR&tr=ORD-DEAL-4412',
    createdAt: '2026-10-12T10:15:00Z',
  },
  {
    id: 'link-103',
    orderId: 'ORD-SVC-2209',
    orderType: 'DIRECT_SERVICE',
    customerName: 'Ananya Sharma',
    customerPhone: '+91 99002 44112',
    customerUnit: 'Tower C, Flat 705',
    amount: 600,
    currency: 'INR',
    description: 'Kitchen Herb Garden Maintenance & Fertilizer Refill',
    expiresAt: '2026-10-11T20:00:00Z',
    status: 'EXPIRED',
    shortUrl: 'https://pay.mana.community/inv/2209',
    upiIntentUrl: 'upi://pay?pa=greenearth.mana@phonepe&pn=GreenEarth%20Market&am=600&cu=INR&tr=ORD-SVC-2209',
    createdAt: '2026-10-11T09:00:00Z',
  },
];

const DEFAULT_RECONCILIATION: ReconciliationRecordDto[] = [
  {
    id: 'rec-001',
    orderId: 'ORD-MKT-8841',
    channel: 'COMMUNITY_MARKET',
    customerName: 'Priya Sundaram',
    orderAmount: 1450,
    paidAmount: 1450,
    utr: '628841928014',
    paymentMethod: 'UPI_INTENT (PhonePe)',
    paymentTimestamp: '2026-10-12 09:14:22',
    status: 'MATCHED',
    bankRefNumber: 'HDFC984219084',
  },
  {
    id: 'rec-002',
    orderId: 'ORD-POS-9912',
    channel: 'COUNTER_QR',
    customerName: 'Karthik Raman',
    orderAmount: 420,
    paidAmount: 420,
    utr: '628841933099',
    paymentMethod: 'UPI_QR (GPay)',
    paymentTimestamp: '2026-10-12 10:45:10',
    status: 'MATCHED',
    bankRefNumber: 'HDFC984220015',
  },
  {
    id: 'rec-003',
    orderId: 'ORD-DEAL-3980',
    channel: 'MANA_DEALS',
    customerName: 'Sneha Patel',
    orderAmount: 750,
    paidAmount: 750,
    utr: '628841951122',
    paymentMethod: 'UPI_INTENT (Paytm)',
    paymentTimestamp: '2026-10-12 11:20:00',
    status: 'MATCHED',
    bankRefNumber: 'HDFC984221190',
  },
  {
    id: 'rec-004',
    orderId: 'ORD-MKT-8849',
    channel: 'COMMUNITY_MARKET',
    customerName: 'Vivek Joshi',
    orderAmount: 920,
    paidAmount: 920,
    utr: '628841968841',
    paymentMethod: 'UPI_QR (PhonePe)',
    paymentTimestamp: '2026-10-12 11:45:30',
    status: 'PENDING_RECONCILIATION',
    discrepancyNote: 'Awaiting Bank Clearing confirmation',
    bankRefNumber: 'HDFC984222041',
  },
];

const DEFAULT_DISPUTES: RefundDisputeDto[] = [
  {
    id: 'dsp-001',
    orderId: 'ORD-MKT-8799',
    utr: '628839014199',
    customerName: 'Deepa Nair',
    customerPhone: '+91 98450 77123',
    amount: 380,
    refundAmount: 380,
    reason: 'Damaged Organic Strawberries during transit',
    disputeDate: '2026-10-11',
    status: 'REFUNDED',
    customerClaimNote: 'The container seal was broken and fruit bruised on delivery.',
    merchantResponseNote: 'Refund approved without return. Amount reversed via PhonePe PG direct to UPI source.',
    resolvedAt: '2026-10-11 16:30:00',
  },
  {
    id: 'dsp-002',
    orderId: 'ORD-DEAL-4310',
    utr: '628840112344',
    customerName: 'Vikram Seth',
    customerPhone: '+91 98112 33445',
    amount: 550,
    refundAmount: 550,
    reason: 'Item Out of Stock at Kiosk pickup',
    disputeDate: '2026-10-12',
    status: 'OPEN',
    customerClaimNote: 'Visited kiosk at 10 AM, sourdough batch was fully sold out.',
  },
];

const DEFAULT_SETTLEMENTS: SettlementBatchDto[] = [
  {
    batchId: 'SETTL-2026-10-11',
    periodStart: '2026-10-10 00:00:00',
    periodEnd: '2026-10-10 23:59:59',
    sourceType: 'COMMUNITY_MARKET',
    grossAmount: 34800,
    convenienceFeeGst: 410,
    platformTakeRate: 696, // 2%
    tdsDeduction: 348, // 1%
    netSettledAmount: 33346,
    bankUtr: 'HDFCR5202610119842',
    settledAt: '2026-10-11 06:30:00',
    status: 'SETTLED',
    transactionCount: 28,
  },
  {
    batchId: 'SETTL-2026-10-10',
    periodStart: '2026-10-09 00:00:00',
    periodEnd: '2026-10-09 23:59:59',
    sourceType: 'MANA_DEALS',
    grossAmount: 18450,
    convenienceFeeGst: 218,
    platformTakeRate: 553, // 3%
    tdsDeduction: 184,
    netSettledAmount: 17495,
    bankUtr: 'HDFCR5202610101104',
    settledAt: '2026-10-10 06:30:00',
    status: 'SETTLED',
    transactionCount: 19,
  },
  {
    batchId: 'SETTL-2026-10-12-PENDING',
    periodStart: '2026-10-11 00:00:00',
    periodEnd: '2026-10-11 23:59:59',
    sourceType: 'BLENDED',
    grossAmount: 26900,
    convenienceFeeGst: 317,
    platformTakeRate: 618,
    tdsDeduction: 269,
    netSettledAmount: 25696,
    bankUtr: 'PENDING_T1_CLEARING',
    settledAt: 'Estimated 2026-10-13 06:30 AM',
    status: 'PROCESSING',
    transactionCount: 22,
  },
];

// ─── Service Implementation ──────────────────────────────────────────────────

export const vendorMerchantPaymentService = {
  // ── Merchant Profile & Regulatory Settlement Setup ──
  getMerchantProfile(): VendorMerchantProfileDto {
    return safeStorage.getJSON(STORAGE_KEYS.PROFILE, DEFAULT_PROFILE);
  },

  updateMerchantProfile(profile: Partial<VendorMerchantProfileDto>): VendorMerchantProfileDto {
    const current = this.getMerchantProfile();
    const updated = { ...current, ...profile };
    safeStorage.setJSON(STORAGE_KEYS.PROFILE, updated);
    return updated;
  },

  // ── Order-Specific Payment Links ──
  getPaymentLinks(): PaymentLinkDto[] {
    return safeStorage.getJSON(STORAGE_KEYS.LINKS, DEFAULT_PAYMENT_LINKS);
  },

  createPaymentLink(req: CreatePaymentLinkRequest): PaymentLinkDto {
    const profile = this.getMerchantProfile();
    const links = this.getPaymentLinks();
    const linkId = 'link-' + Math.floor(1000 + Math.random() * 9000);
    const orderId = req.orderId || 'ORD-CUST-' + Math.floor(1000 + Math.random() * 9000);
    const expiryHours = req.expiryHours || 24;
    const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000).toISOString();

    const shortUrl = `https://pay.mana.community/inv/${orderId.replace('ORD-', '')}`;
    const upiIntentUrl = `upi://pay?pa=${profile.vpa}&pn=${encodeURIComponent(
      profile.tradeName
    )}&am=${req.amount}&cu=INR&tr=${orderId}&tn=${encodeURIComponent(req.description.slice(0, 50))}`;

    const newLink: PaymentLinkDto = {
      id: linkId,
      orderId,
      orderType: req.orderType || 'CUSTOM_ORDER',
      customerName: req.customerName,
      customerPhone: req.customerPhone,
      customerUnit: req.customerUnit,
      amount: req.amount,
      currency: 'INR',
      description: req.description,
      items: req.items,
      expiresAt,
      status: 'ACTIVE',
      shortUrl,
      upiIntentUrl,
      createdAt: new Date().toISOString(),
    };

    const updated = [newLink, ...links];
    safeStorage.setJSON(STORAGE_KEYS.LINKS, updated);
    return newLink;
  },

  markLinkAsPaid(linkId: string, utr?: string): PaymentLinkDto | null {
    const links = this.getPaymentLinks();
    const index = links.findIndex((l) => l.id === linkId);
    if (index === -1) return null;

    const assignedUtr = utr || `628841${Math.floor(100000 + Math.random() * 900000)}`;
    links[index] = {
      ...links[index],
      status: 'PAID',
      paidAt: new Date().toISOString(),
      utr: assignedUtr,
      paymentMethod: 'UPI_INTENT',
    };
    safeStorage.setJSON(STORAGE_KEYS.LINKS, links);

    // Also inject into reconciliation stream
    this.recordIncomingPayment({
      orderId: links[index].orderId,
      channel: links[index].orderType === 'COMMUNITY_MARKET' ? 'COMMUNITY_MARKET' : 'PAYMENT_LINK',
      customerName: links[index].customerName,
      orderAmount: links[index].amount,
      paidAmount: links[index].amount,
      utr: assignedUtr,
      paymentMethod: 'UPI_INTENT (PhonePe)',
      paymentTimestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      status: 'MATCHED',
      bankRefNumber: `HDFC${Math.floor(100000000 + Math.random() * 900000000)}`,
    });

    return links[index];
  },

  cancelPaymentLink(linkId: string): boolean {
    const links = this.getPaymentLinks();
    const link = links.find((l) => l.id === linkId);
    if (!link || link.status === 'PAID') return false;

    link.status = 'CANCELLED';
    safeStorage.setJSON(STORAGE_KEYS.LINKS, links);
    return true;
  },

  // ── Standee & Dynamic QR Code Builder ──
  getMerchantQrPayload(amount?: number, orderRef?: string): {
    upiPayload: string;
    vpa: string;
    merchantName: string;
    displayAmount?: number;
  } {
    const profile = this.getMerchantProfile();
    let upi = `upi://pay?pa=${profile.vpa}&pn=${encodeURIComponent(profile.tradeName)}&cu=INR`;
    if (amount) {
      upi += `&am=${amount}`;
    }
    if (orderRef) {
      upi += `&tr=${orderRef}`;
    }
    return {
      upiPayload: upi,
      vpa: profile.vpa,
      merchantName: profile.tradeName,
      displayAmount: amount,
    };
  },

  // ── Order / Payment Reconciliation ──
  getReconciliationRecords(): ReconciliationRecordDto[] {
    return safeStorage.getJSON(STORAGE_KEYS.RECONCILIATION, DEFAULT_RECONCILIATION);
  },

  recordIncomingPayment(rec: Omit<ReconciliationRecordDto, 'id'>): ReconciliationRecordDto {
    const records = this.getReconciliationRecords();
    const newRecord: ReconciliationRecordDto = {
      id: 'rec-' + Math.floor(1000 + Math.random() * 9000),
      ...rec,
    };
    const updated = [newRecord, ...records];
    safeStorage.setJSON(STORAGE_KEYS.RECONCILIATION, updated);
    return newRecord;
  },

  resolveReconciliationDiscrepancy(recordId: string, utrNote: string): ReconciliationRecordDto | null {
    const records = this.getReconciliationRecords();
    const target = records.find((r) => r.id === recordId);
    if (!target) return null;

    target.status = 'MATCHED';
    target.discrepancyNote = `Manually verified against bank UTR ${utrNote}`;
    safeStorage.setJSON(STORAGE_KEYS.RECONCILIATION, records);
    return target;
  },

  // ── Refunds & Dispute Workflows ──
  getDisputes(): RefundDisputeDto[] {
    return safeStorage.getJSON(STORAGE_KEYS.DISPUTES, DEFAULT_DISPUTES);
  },

  processRefund(disputeId: string, merchantResponse: string): RefundDisputeDto | null {
    const disputes = this.getDisputes();
    const dispute = disputes.find((d) => d.id === disputeId);
    if (!dispute) return null;

    dispute.status = 'REFUNDED';
    dispute.merchantResponseNote = merchantResponse;
    dispute.resolvedAt = new Date().toISOString().replace('T', ' ').slice(0, 19);
    safeStorage.setJSON(STORAGE_KEYS.DISPUTES, disputes);
    return dispute;
  },

  rejectDispute(disputeId: string, reason: string): RefundDisputeDto | null {
    const disputes = this.getDisputes();
    const dispute = disputes.find((d) => d.id === disputeId);
    if (!dispute) return null;

    dispute.status = 'REJECTED';
    dispute.merchantResponseNote = reason;
    dispute.resolvedAt = new Date().toISOString().replace('T', ' ').slice(0, 19);
    safeStorage.setJSON(STORAGE_KEYS.DISPUTES, disputes);
    return dispute;
  },

  initiateDirectOrderRefund(orderId: string, amount: number, reason: string): RefundDisputeDto {
    const disputes = this.getDisputes();
    const newRefund: RefundDisputeDto = {
      id: 'dsp-' + Math.floor(1000 + Math.random() * 9000),
      orderId,
      utr: `628841${Math.floor(100000 + Math.random() * 900000)}`,
      customerName: 'Resident Customer',
      customerPhone: '+91 98450 00000',
      amount,
      refundAmount: amount,
      reason,
      disputeDate: new Date().toISOString().split('T')[0],
      status: 'REFUNDED',
      customerClaimNote: 'Direct merchant-initiated goodwill refund',
      merchantResponseNote: 'Processed direct to UPI VPA source via licensed PG callback.',
      resolvedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
    };
    const updated = [newRefund, ...disputes];
    safeStorage.setJSON(STORAGE_KEYS.DISPUTES, updated);
    return newRefund;
  },

  // ── Sales Summaries & Analytical Insights ──
  getSalesSummary(period: 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' = 'THIS_MONTH'): MerchantSalesSummaryDto {
    const links = this.getPaymentLinks();
    const paidLinks = links.filter((l) => l.status === 'PAID');
    const grossVolume = 124600; // Sample realistic month GMV
    const totalTransactions = 84;

    return {
      period,
      grossVolume,
      netSettledVolume: 119850,
      totalTransactions,
      successfulCount: 82,
      refundedCount: 2,
      averageTicketSize: Math.round(grossVolume / totalTransactions),
      paymentMethodBreakdown: [
        { method: 'PhonePe QR & UPI Intent', amount: 89700, percentage: 72, count: 61 },
        { method: 'Google Pay UPI', amount: 22400, percentage: 18, count: 15 },
        { method: 'Paytm & Other UPI', amount: 8700, percentage: 7, count: 6 },
        { method: 'Cards & Net Banking', amount: 3800, percentage: 3, count: 2 },
      ],
      topSellingItems: [
        { itemName: 'Aashirvaad Shudh Chakki Atta (10 KG Bulk)', revenue: 35100, unitsSold: 60 },
        { itemName: 'Fortune Sunlite Refined Sunflower Oil (5L)', revenue: 23600, unitsSold: 40 },
        { itemName: 'Hydroponic Salad & Greens Basket', revenue: 16800, unitsSold: 70 },
        { itemName: 'Cold Brew Breakfast Combo Pack', revenue: 12750, unitsSold: 15 },
      ],
    };
  },

  // ── Community Market & Mana Deals Settlement Reports ──
  getSettlementBatches(): SettlementBatchDto[] {
    return safeStorage.getJSON(STORAGE_KEYS.SETTLEMENTS, DEFAULT_SETTLEMENTS);
  },

  getSettlementSummary(): {
    totalSettledVolume: number;
    pendingPayoutVolume: number;
    totalDeductions: number;
    settlementCycle: string;
  } {
    const batches = this.getSettlementBatches();
    const settled = batches.filter((b) => b.status === 'SETTLED');
    const pending = batches.filter((b) => b.status === 'PROCESSING');

    const totalSettledVolume = settled.reduce((s, b) => s + b.netSettledAmount, 0);
    const pendingPayoutVolume = pending.reduce((s, b) => s + b.netSettledAmount, 0);
    const totalDeductions = batches.reduce(
      (s, b) => s + (b.convenienceFeeGst + b.platformTakeRate + b.tdsDeduction),
      0
    );

    return {
      totalSettledVolume,
      pendingPayoutVolume,
      totalDeductions,
      settlementCycle: 'T+1 Automatic Bank Settlement via Direct Aggregator Node',
    };
  },
};
