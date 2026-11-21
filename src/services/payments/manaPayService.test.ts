import { describe, it, expect, beforeEach, vi } from 'vitest';
import { manaPayService } from './manaPayService';
import { apiClient } from '../common/apiClient';
import type {
  CreateManaPaymentIntentRequest,
  ManaPaymentRecord,
  ManaDigitalReceipt,
  ManaPaymentIntentResponse,
} from '../../types/manaPay';

vi.mock('../common/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
  getStoredUser: vi.fn(() => ({
    userId: 'user-302',
    role: 'ADMIN',
    roles: ['ADMIN', 'RESIDENT', 'TREASURER'],
    communityId: 1,
  })),
  getToken: vi.fn(() => 'mock-jwt-token'),
  storeUser: vi.fn(),
  setToken: vi.fn(),
  setTokens: vi.fn(),
  removeToken: vi.fn(),
  clearUserStorage: vi.fn(),
}));

describe('manaPayService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generates consistent idempotency keys for the same parameters within the same minute', () => {
    const key1 = manaPayService.generateIdempotencyKey('MAINTENANCE_BILL', 'INV-101', 3500);
    const key2 = manaPayService.generateIdempotencyKey('MAINTENANCE_BILL', 'INV-101', 3500);
    expect(key1).toBe(key2);
    expect(key1).toContain('mana_MAINTENANCE_BILL_INV-101_3500_');
  });

  it('creates a payment intent and returns valid UPI intent URI and VPA', async () => {
    const mockIntent: ManaPaymentIntentResponse = {
      intentId: 'PI_TEST_INTENT_101',
      idempotencyKey: 'idem-1',
      domain: 'EVENT_BOOKING',
      orderReferenceId: 'EVT-501',
      amount: 1200,
      currency: 'INR',
      status: 'PENDING',
      preferredRail: 'UPI_INTENT',
      upiVpa: 'mana.society@icici',
      upiIntentUri: 'upi://pay?pa=mana.society@icici&pn=Mana%20Community&am=1200.00&cu=INR&tr=PI_TEST_INTENT_101',
      gatewayOrderId: 'order_1',
      gatewayKeyId: 'key_1',
      receiptNumber: 'RCP-1',
      expiresAt: '2026-11-20T12:00:00Z',
      createdAt: '2026-11-20T11:00:00Z',
    };
    (apiClient.post as any).mockResolvedValueOnce(mockIntent);

    const req: CreateManaPaymentIntentRequest = {
      idempotencyKey: manaPayService.generateIdempotencyKey('EVENT_BOOKING', 'EVT-501', 1200),
      domain: 'EVENT_BOOKING',
      orderReferenceId: 'EVT-501',
      title: 'Diwali Gala Passes (x2)',
      totalAmount: 1200,
      payer: {
        name: 'John Doe',
        phone: '+91 99999 88888',
        unit: 'Flat 401',
      },
      items: [
        {
          title: 'Pass',
          quantity: 2,
          unitPrice: 600,
          amount: 1200,
        },
      ],
    };

    const intent = await manaPayService.createPaymentIntent(req);
    expect(intent).toBeDefined();
    expect(intent.intentId).toMatch(/^PI_/);
    expect(intent.amount).toBe(1200);
    expect(intent.upiVpa).toBe('mana.society@icici');
    expect(intent.upiIntentUri).toContain('upi://pay?');
    expect(intent.upiIntentUri).toContain('am=1200.00');
    expect(apiClient.post).toHaveBeenCalledWith('/payments/intents', expect.any(Object));
  });

  it('confirms payment, stores transaction record, and retrieves official digital receipt', async () => {
    const mockRecord: ManaPaymentRecord = {
      id: 'pay-PI_TEST_INTENT_101',
      transactionNumber: 'TXN-2026-101',
      orderReferenceId: 'SPORTS-09',
      domain: 'SPORTS_FEE',
      title: 'Sports Registration',
      amount: 850,
      currency: 'INR',
      status: 'SUCCESS',
      paymentRail: 'UPI_INTENT',
      createdAt: '2026-11-20T10:00:00Z',
      paidAt: '2026-11-20T10:05:00Z',
      payerName: 'Alice Green',
      payerUnit: 'Flat 102',
      utr: '628499001122',
      receiptNumber: 'RCP-2026-1001',
      reconciliationStatus: 'RECONCILED',
      canRefund: true,
    };
    (apiClient.post as any).mockResolvedValueOnce(mockRecord);

    const mockReceipt: any = {
      receiptNumber: 'RCP-2026-1001',
      transactionNumber: 'TXN-2026-101',
      orderReferenceId: 'SPORTS-09',
      domain: 'SPORTS_FEE',
      title: 'Sports Registration',
      totalAmount: 850,
      currency: 'INR',
      payerName: 'Alice Green',
      payerUnit: 'Flat 102',
      paymentRail: 'UPI_INTENT',
      paidAt: '2026-11-20T10:05:00Z',
      societyGstin: '29ABCDE1234F1Z5',
      verifiedStamp: true,
      qrVerificationPayload: 'https://mana.community/receipts/RCP-2026-1001',
    };
    (apiClient.get as any).mockResolvedValueOnce(mockReceipt);

    const intentId = 'PI_TEST_INTENT_101';
    const record = await manaPayService.confirmPayment({
      intentId,
      rail: 'UPI_INTENT',
      utr: '628499001122',
    });

    expect(record.status).toBe('SUCCESS');
    expect(record.utr).toBe('628499001122');
    expect(record.receiptNumber).toMatch(/^RCP-/);

    const receipt = await manaPayService.getTransactionReceipt(record.transactionNumber);
    expect(receipt).not.toBeNull();
    expect(receipt?.totalAmount).toBe(850);
    expect(receipt?.verifiedStamp).toBe(true);
    expect(receipt?.societyGstin).toBeDefined();
  });

  it('tracks refunds without deleting original transactions', async () => {
    const mockSuccess: ManaPaymentRecord = {
      id: 'pay-PI_REFUND_TEST',
      transactionNumber: 'TXN-2026-554',
      orderReferenceId: 'ORD-554',
      domain: 'MARKETPLACE_ORDER',
      title: 'Marketplace Pre-order',
      amount: 2500,
      currency: 'INR',
      status: 'SUCCESS',
      paymentRail: 'GATEWAY_CARD_NETBANKING',
      createdAt: '2026-11-20T10:00:00Z',
      payerName: 'Bob White',
      reconciliationStatus: 'RECONCILED',
      canRefund: true,
    };
    (apiClient.post as any).mockResolvedValueOnce(mockSuccess);

    const mockRefunded: ManaPaymentRecord = {
      ...mockSuccess,
      status: 'REFUNDED',
      refundReason: 'Seller cancelled item delivery',
      refundedAmount: 2500,
    };
    (apiClient.post as any).mockResolvedValueOnce(mockRefunded);
    (apiClient.get as any).mockResolvedValueOnce([mockRefunded]);

    const record = await manaPayService.confirmPayment({
      intentId: 'PI_REFUND_TEST',
      rail: 'GATEWAY_CARD_NETBANKING',
    });

    const refunded = await manaPayService.requestRefund({
      transactionNumber: record.transactionNumber,
      amount: 2500,
      reason: 'Seller cancelled item delivery',
    });

    expect(refunded.status).toBe('REFUNDED');
    expect(refunded.refundReason).toBe('Seller cancelled item delivery');

    // Confirm transaction is still in list
    const list = await manaPayService.getMyTransactions();
    const found = list.find((t) => t.transactionNumber === record.transactionNumber);
    expect(found).toBeDefined();
    expect(found?.status).toBe('REFUNDED');
  });

  it('correctly scopes transaction queries by role (Resident, Treasurer, Vendor)', async () => {
    const residentMock: ManaPaymentRecord[] = [
      {
        id: '1',
        payerName: 'Alice Green',
        transactionNumber: 'TXN-1',
        orderReferenceId: 'ORD-1',
        domain: 'MAINTENANCE_BILL',
        title: 'Maintenance',
        amount: 2000,
        currency: 'INR',
        status: 'SUCCESS',
        paymentRail: 'UPI_INTENT',
        createdAt: '2026-11-20T10:00:00Z',
        payerId: 'user-302',
        reconciliationStatus: 'RECONCILED',
        canRefund: false,
      },
    ];
    const treasurerMock: ManaPaymentRecord[] = [
      ...residentMock,
      {
        id: '2',
        payerName: 'Bob Green',
        transactionNumber: 'TXN-2',
        orderReferenceId: 'ORD-2',
        domain: 'POOJA_BOOKING',
        title: 'Pooja',
        amount: 500,
        currency: 'INR',
        status: 'SUCCESS',
        paymentRail: 'UPI_INTENT',
        createdAt: '2026-11-20T10:00:00Z',
        payerId: 'user-404',
        reconciliationStatus: 'RECONCILED',
        canRefund: false,
      },
    ];
    const vendorMock: ManaPaymentRecord[] = [
      {
        id: '3',
        payerName: 'Charlie Vendor',
        transactionNumber: 'TXN-3',
        orderReferenceId: 'ORD-3',
        domain: 'SPORTS_FEE',
        title: 'Turf',
        amount: 1500,
        currency: 'INR',
        status: 'SUCCESS',
        paymentRail: 'UPI_INTENT',
        createdAt: '2026-11-20T10:00:00Z',
        vendorId: 'vendor-sports-arena',
        reconciliationStatus: 'RECONCILED',
        canRefund: false,
      },
    ];

    (apiClient.get as any)
      .mockResolvedValueOnce(residentMock)
      .mockResolvedValueOnce(treasurerMock)
      .mockResolvedValueOnce(vendorMock);

    // 1. Resident view: should only see transactions for user-302
    const residentTxns = await manaPayService.getTransactions({ role: 'RESIDENT', payerId: 'user-302' });
    expect(residentTxns.length).toBeGreaterThan(0);
    expect(residentTxns.every((t) => t.payerId === 'user-302')).toBe(true);

    // 2. Treasurer view: sees community collections across all residents
    const treasurerTxns = await manaPayService.getTransactions({ role: 'TREASURER' });
    expect(treasurerTxns.length).toBeGreaterThanOrEqual(residentTxns.length);
    const domains = new Set(treasurerTxns.map((t) => t.domain));
    expect(domains.has('MAINTENANCE_BILL')).toBe(true);
    expect(domains.has('POOJA_BOOKING')).toBe(true);

    // 3. Vendor view: sees only authorized transactions for that specific vendor
    const vendorTxns = await manaPayService.getTransactions({
      role: 'VENDOR',
      vendorId: 'vendor-sports-arena',
    });
    expect(vendorTxns.length).toBeGreaterThan(0);
    expect(vendorTxns.every((t) => t.vendorId === 'vendor-sports-arena')).toBe(true);
  });

  it('allows Treasurer to reconcile transactions with Bank UTR', async () => {
    const mockTxns: ManaPaymentRecord[] = [
      {
        id: '1',
        payerName: 'David Resident',
        transactionNumber: 'TXN-UNREC-1',
        orderReferenceId: 'ORD-1',
        domain: 'MAINTENANCE_BILL',
        title: 'Maintenance',
        amount: 3000,
        currency: 'INR',
        status: 'SUCCESS',
        paymentRail: 'UPI_INTENT',
        createdAt: '2026-11-20T10:00:00Z',
        reconciliationStatus: 'UNRECONCILED',
        canRefund: false,
      },
    ];
    (apiClient.get as any).mockResolvedValueOnce(mockTxns);

    const reconciledTxn: ManaPaymentRecord = {
      ...mockTxns[0],
      reconciliationStatus: 'RECONCILED',
      utr: 'HDFC_UTR_99887766',
      reconciledBy: 'Treasurer Office',
    };
    (apiClient.post as any).mockResolvedValueOnce(reconciledTxn);

    const allTxns = await manaPayService.getTransactions({ role: 'TREASURER' });
    const unreconciled = allTxns.find((t) => t.reconciliationStatus === 'UNRECONCILED');
    expect(unreconciled).toBeDefined();

    if (unreconciled) {
      const updated = await manaPayService.reconcileTransaction(
        unreconciled.transactionNumber,
        'HDFC_UTR_99887766',
        'Treasurer Office'
      );
      expect(updated.reconciliationStatus).toBe('RECONCILED');
      expect(updated.utr).toBe('HDFC_UTR_99887766');
    }
  });

  it('calculates capability metrics with correct domain breakdowns', async () => {
    const mockMetrics = {
      totalCollections: 125000,
      pendingCollections: 15000,
      reconciledCount: 88,
      pendingCount: 6,
      domainBreakdown: {
        MAINTENANCE_BILL: 95000,
        MANA_HEALTH: 30000,
      },
    };
    (apiClient.get as any).mockResolvedValueOnce(mockMetrics);

    const summary = await manaPayService.getCommunityMetrics();
    expect(summary.totalCollections).toBeGreaterThan(0);
    expect(summary.domainBreakdown).toBeDefined();
    expect(summary.domainBreakdown['MAINTENANCE_BILL']).toBeGreaterThan(0);
    expect(summary.domainBreakdown['MANA_HEALTH']).toBeGreaterThan(0);
  });
});
