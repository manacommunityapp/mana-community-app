import { apiClient } from '../common/apiClient';
import { safeStorage } from '../../utils/storage';
import type {
  CreateManaPaymentIntentRequest,
  ManaPaymentIntentResponse,
  ConfirmManaPaymentRequest,
  ManaDigitalReceipt,
  ManaPaymentRecord,
  ManaRefundRequest,
  ManaPayDomain,
  ManaPaymentStatus,
  ManaReconciliationStatus,
} from '../../types/manaPay';

const STORAGE_KEY = 'mana_pay_transactions_v2';

// 6 Core Business Capabilities seed data
const SEED_TRANSACTIONS: ManaPaymentRecord[] = [
  // 1. Maintenance (Invoices and dues)
  {
    id: 'pay-txn-001',
    transactionNumber: 'TXN-2026-B817A201',
    orderReferenceId: 'INV-202610-302A',
    domain: 'MAINTENANCE_BILL',
    title: 'October 2026 Monthly Maintenance & Sinking Fund',
    amount: 3850,
    currency: 'INR',
    status: 'SUCCESS',
    paymentRail: 'UPI_INTENT',
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    paidAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    payerId: 'user-302',
    payerName: 'Sandeep Sharma',
    payerUnit: 'Flat 302, Tower A',
    utr: '628491028475',
    receiptNumber: 'RCP-2026-8812',
    reconciliationStatus: 'RECONCILED',
    reconciledAt: new Date(Date.now() - 3600000 * 40).toISOString(),
    reconciledBy: 'Treasurer (RWA ICICI Current A/c)',
    canRefund: false,
  },
  // 2. Events & Pooja (Bookings and receipts)
  {
    id: 'pay-txn-002',
    transactionNumber: 'TXN-2026-D104F982',
    orderReferenceId: 'EVT-POOJA-081',
    domain: 'POOJA_BOOKING',
    title: 'Maha Deepotsav Special Sankalpa Pooja Seva',
    amount: 1100,
    currency: 'INR',
    status: 'SUCCESS',
    paymentRail: 'UPI_QR',
    createdAt: new Date(Date.now() - 3600000 * 28).toISOString(),
    paidAt: new Date(Date.now() - 3600000 * 28).toISOString(),
    payerId: 'user-302',
    payerName: 'Sandeep Sharma',
    payerUnit: 'Flat 302, Tower A',
    vendorId: 'vendor-priest-01',
    vendorName: 'Archaka Seva Trust',
    utr: '628499318490',
    receiptNumber: 'RCP-2026-9210',
    reconciliationStatus: 'RECONCILED',
    reconciledAt: new Date(Date.now() - 3600000 * 20).toISOString(),
    reconciledBy: 'Treasurer (Events Trust A/c)',
    canRefund: true,
  },
  // 3. Sports (Tournament fees)
  {
    id: 'pay-txn-003',
    transactionNumber: 'TXN-2026-E552K319',
    orderReferenceId: 'SPORTS-BADM-04',
    domain: 'SPORTS_FEE',
    title: 'Mana Smash 2026 - Badminton Doubles Entry Fee',
    amount: 750,
    currency: 'INR',
    status: 'PENDING',
    paymentRail: 'UPI_INTENT',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    payerId: 'user-302',
    payerName: 'Sandeep Sharma',
    payerUnit: 'Flat 302, Tower A',
    vendorId: 'vendor-sports-arena',
    vendorName: 'Bangalore Sports Management',
    reconciliationStatus: 'UNRECONCILED',
    canRefund: false,
  },
  // 4. Marketplace (Orders and refunds)
  {
    id: 'pay-txn-004',
    transactionNumber: 'TXN-2026-F612M841',
    orderReferenceId: 'MKT-ORD-902',
    domain: 'MARKETPLACE_ORDER',
    title: 'Organic Farm Harvest Box (Pre-ordered)',
    amount: 1450,
    currency: 'INR',
    status: 'REFUNDED',
    paymentRail: 'GATEWAY_CARD_NETBANKING',
    createdAt: new Date(Date.now() - 3600000 * 36).toISOString(),
    paidAt: new Date(Date.now() - 3600000 * 36).toISOString(),
    payerId: 'user-302',
    payerName: 'Sandeep Sharma',
    payerUnit: 'Flat 302, Tower A',
    vendorId: 'vendor-farm-fresh',
    vendorName: 'Green Meadows Organics',
    gatewayRef: 'pay_rzp_mock_881923',
    receiptNumber: 'RCP-2026-7731',
    refundedAmount: 1450,
    refundReason: 'Item out of stock from vendor',
    reconciliationStatus: 'RECONCILED',
    canRefund: false,
  },
  // 5. Mana Trips (Trip costs and split bills)
  {
    id: 'pay-txn-005',
    transactionNumber: 'TXN-2026-C924B105',
    orderReferenceId: 'TRIP-GOA-2026',
    domain: 'TRIP_BOOKING',
    title: 'Community Weekend Trip to Coorg (2 Persons, Twin Sharing)',
    amount: 5400,
    currency: 'INR',
    status: 'SUCCESS',
    paymentRail: 'GATEWAY_CARD_NETBANKING',
    createdAt: new Date(Date.now() - 3600000 * 20).toISOString(),
    paidAt: new Date(Date.now() - 3600000 * 20).toISOString(),
    payerId: 'user-302',
    payerName: 'Sandeep Sharma',
    payerUnit: 'Flat 302, Tower A',
    vendorId: 'vendor-karnataka-travels',
    vendorName: 'Wildcraft Outdoors & Bus Charters',
    gatewayRef: 'pay_rzp_mock_491823901',
    receiptNumber: 'RCP-2026-9041',
    reconciliationStatus: 'RECONCILED',
    canRefund: true,
  },
  // 6. Mana Health (Healthcare payments)
  {
    id: 'pay-txn-006',
    transactionNumber: 'TXN-2026-H891P502',
    orderReferenceId: 'HLT-LAB-019',
    domain: 'MANA_HEALTH',
    title: 'Home Sample Collection - Comprehensive Health Package',
    amount: 2200,
    currency: 'INR',
    status: 'SUCCESS',
    paymentRail: 'WALLET',
    createdAt: new Date(Date.now() - 3600000 * 14).toISOString(),
    paidAt: new Date(Date.now() - 3600000 * 14).toISOString(),
    payerId: 'user-302',
    payerName: 'Sandeep Sharma',
    payerUnit: 'Flat 302, Tower A',
    vendorId: 'vendor-apollo-diagnostics',
    vendorName: 'Apollo Diagnostics Community Partner',
    receiptNumber: 'RCP-2026-9502',
    reconciliationStatus: 'RECONCILED',
    reconciledAt: new Date(Date.now() - 3600000 * 10).toISOString(),
    reconciledBy: 'Treasurer (Health Wallet Settlement)',
    canRefund: false,
  },
];

function loadLocalTransactions(): ManaPaymentRecord[] {
  try {
    const raw = safeStorage.getItem(STORAGE_KEY);
    if (!raw) {
      safeStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_TRANSACTIONS));
      return SEED_TRANSACTIONS;
    }
    return JSON.parse(raw);
  } catch {
    return SEED_TRANSACTIONS;
  }
}

function saveLocalTransactions(list: ManaPaymentRecord[]) {
  try {
    safeStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Failed to save Mana Pay transactions to localStorage', e);
  }
}

export const manaPayService = {
  /**
   * Helper to generate a standardized idempotency key.
   */
  generateIdempotencyKey(domain: ManaPayDomain, refId: string, amount: number): string {
    const tsBucket = Math.floor(Date.now() / 60000); // 1-minute bucket
    return `mana_${domain}_${refId}_${amount}_${tsBucket}`;
  },

  /**
   * Step 1: Create payment intent on backend.
   * Never fabricates an intent — a backend failure is a hard error that must surface to the caller.
   */
  async createPaymentIntent(req: CreateManaPaymentIntentRequest): Promise<ManaPaymentIntentResponse> {
    return apiClient.post<ManaPaymentIntentResponse>('/payments/intents', {
      idempotencyKey: req.idempotencyKey,
      domain: req.domain,
      orderReferenceId: req.orderReferenceId,
      amount: req.totalAmount,
      currency: req.currency || 'INR',
      payerName: req.payer.name,
      payerEmail: req.payer.email,
      payerPhone: req.payer.phone,
      preferredRail: req.preferredRail || 'UPI',
      remarks: req.description || req.title,
    });
  },

  /**
   * Step 2: Confirm payment after UPI / Gateway / Wallet debit.
   * Payment status is determined solely by the backend — never fabricated client-side.
   * Throws on backend failure so the caller can surface it to the user.
   */
  async confirmPayment(req: ConfirmManaPaymentRequest): Promise<ManaPaymentRecord> {
    return apiClient.post<ManaPaymentRecord>(`/payments/intents/${req.intentId}/confirm`, {
      gatewayPaymentId: req.gatewayPaymentId,
      gatewayOrderId: req.gatewayOrderId,
      gatewaySignature: req.gatewaySignature,
      utr: req.utr,
    });
  },

  /**
   * Get transactions filtered by role (Resident, Treasurer, Vendor) and attributes.
   */
  async getTransactions(params?: {
    role?: 'RESIDENT' | 'TREASURER' | 'VENDOR';
    payerId?: string;
    vendorId?: string;
    domain?: ManaPayDomain;
    status?: ManaPaymentStatus;
    reconciliationStatus?: ManaReconciliationStatus;
    search?: string;
  }): Promise<ManaPaymentRecord[]> {
    let list = loadLocalTransactions();

    // 1. Role Scoping
    if (params?.role === 'RESIDENT') {
      const pid = params.payerId || 'user-302';
      list = list.filter(t => t.payerId === pid);
    } else if (params?.role === 'VENDOR') {
      const vid = params.vendorId || 'vendor-sports-arena';
      list = list.filter(t => t.vendorId === vid);
    }

    // 2. Domain & Status filtering
    if (params?.domain) {
      list = list.filter(t => t.domain === params.domain);
    }
    if (params?.status) {
      list = list.filter(t => t.status === params.status);
    }
    if (params?.reconciliationStatus) {
      list = list.filter(t => t.reconciliationStatus === params.reconciliationStatus);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.transactionNumber.toLowerCase().includes(q) ||
        t.orderReferenceId.toLowerCase().includes(q) ||
        (t.payerName && t.payerName.toLowerCase().includes(q)) ||
        (t.vendorName && t.vendorName.toLowerCase().includes(q)) ||
        (t.utr && t.utr.toLowerCase().includes(q))
      );
    }
    return list;
  },

  /**
   * Backwards compatible helper for resident's personal list.
   */
  async getMyTransactions(params?: { domain?: ManaPayDomain; status?: ManaPaymentStatus; search?: string }): Promise<ManaPaymentRecord[]> {
    return this.getTransactions({ ...params, role: 'RESIDENT' });
  },

  /**
   * Generate official digital receipt.
   */
  async getTransactionReceipt(transactionNumber: string): Promise<ManaDigitalReceipt | null> {
    const list = loadLocalTransactions();
    const txn = list.find(t => t.transactionNumber === transactionNumber);
    if (!txn) return null;

    const tax = Math.round(txn.amount * 0.05);
    const convenience = txn.paymentRail === 'GATEWAY_CARD_NETBANKING' ? 20 : 0;
    const base = txn.amount - tax - convenience;

    return {
      receiptNumber: txn.receiptNumber || 'RCP-2026-9999',
      receiptDate: txn.paidAt || txn.createdAt,
      transactionNumber: txn.transactionNumber,
      orderReferenceId: txn.orderReferenceId,
      domain: txn.domain,
      status: txn.status,
      payerName: txn.payerName,
      payerUnit: txn.payerUnit,
      payerPhone: '+91 98450 12345',
      paymentRail: txn.paymentRail,
      amount: base > 0 ? base : txn.amount,
      taxAmount: tax,
      convenienceFee: convenience,
      totalAmount: txn.amount,
      utr: txn.utr,
      gatewayRef: txn.gatewayRef,
      vendorId: txn.vendorId,
      vendorName: txn.vendorName,
      societyName: 'Mana Palm Gardens Resident Welfare Association',
      societyGstin: '29AAACM1984C1Z5',
      societyAddress: 'Survey No. 44, Sarjapur Outer Ring Road, Bangalore - 560103',
      items: [
        {
          title: txn.title,
          amount: txn.amount,
          quantity: 1,
          unitPrice: txn.amount,
        },
      ],
      notes: 'This is a computer generated digital receipt issued by Mana Community Pay Core.',
      verifiedStamp: true,
    };
  },

  /**
   * Request full or partial refund without deleting the transaction.
   */
  async requestRefund(req: ManaRefundRequest): Promise<ManaPaymentRecord> {
    const list = loadLocalTransactions();
    const idx = list.findIndex(t => t.transactionNumber === req.transactionNumber);
    if (idx < 0) throw new Error('Transaction not found');

    const updated: ManaPaymentRecord = {
      ...list[idx],
      status: 'REFUNDED',
      refundedAmount: req.amount || list[idx].amount,
      refundReason: req.reason,
      canRefund: false,
    };
    list[idx] = updated;
    saveLocalTransactions(list);
    return updated;
  },

  /**
   * Treasurer manual reconciliation with bank statement UTR.
   */
  async reconcileTransaction(transactionNumber: string, utr: string, reconciledBy = 'Treasurer'): Promise<ManaPaymentRecord> {
    const list = loadLocalTransactions();
    const idx = list.findIndex(t => t.transactionNumber === transactionNumber);
    if (idx < 0) throw new Error('Transaction not found');

    const updated: ManaPaymentRecord = {
      ...list[idx],
      utr,
      reconciliationStatus: 'RECONCILED',
      reconciledAt: new Date().toISOString(),
      reconciledBy,
    };
    list[idx] = updated;
    saveLocalTransactions(list);
    return updated;
  },

  /**
   * Community Treasurer summary metrics across all 6 business capabilities.
   */
  async getCommunityMetrics(): Promise<{
    totalCollections: number;
    pendingCollections: number;
    reconciledCount: number;
    pendingCount: number;
    domainBreakdown: Record<string, number>;
  }> {
    const list = loadLocalTransactions();
    const domainBreakdown: Record<string, number> = {};
    let totalCollections = 0;
    let pendingCollections = 0;
    let reconciledCount = 0;
    let pendingCount = 0;

    for (const t of list) {
      if (!domainBreakdown[t.domain]) {
        domainBreakdown[t.domain] = 0;
      }
      if (t.status === 'SUCCESS') {
        totalCollections += t.amount;
        domainBreakdown[t.domain] += t.amount;
      } else if (t.status === 'PENDING') {
        pendingCollections += t.amount;
        pendingCount += 1;
      }
      if (t.reconciliationStatus === 'RECONCILED') {
        reconciledCount += 1;
      }
    }

    return {
      totalCollections,
      pendingCollections,
      reconciledCount,
      pendingCount,
      domainBreakdown,
    };
  },
};
