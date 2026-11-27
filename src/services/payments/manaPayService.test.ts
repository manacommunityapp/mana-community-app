import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Environment shims (vitest runs these service tests in the "node" env) ────
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    length: 0,
  } as unknown as Storage;
}

// The HTTP layer is mocked, so the service's real confirm/intent paths run but
// never touch the network. Mocking the module also supplies the logged-in user
// the api client's pre-flight access check (and the per-user storage
// namespacing / receipt phone lookup) needs — the two pre-existing
// "User is not logged in." failures in this file were that check firing on an
// anonymous test run, not a bug in the service.
const STORED_USER = { userId: 'user-302', phone: '+91 90000 11111', role: 'RESIDENT' };

vi.mock('../common/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
  getStoredUser: vi.fn(() => STORED_USER),
}));

import type { Mock } from 'vitest';
import { manaPayService } from './manaPayService';
import { apiClient } from '../common/apiClient';
import { safeStorage } from '../../utils/storage';
import type {
  CreateManaPaymentIntentRequest,
  ManaPaymentIntentResponse,
  ManaPaymentRecord,
} from '../../types/manaPay';

const postMock = apiClient.post as unknown as Mock;
const getMock = apiClient.get as unknown as Mock;

const STORAGE_KEY = `mana_pay_transactions_v2_${STORED_USER.userId}`;

/** A server-issued intent. Every identifier in it belongs to the backend. */
const SERVER_INTENT: ManaPaymentIntentResponse = {
  intentId: 'PI_SRV_90210',
  idempotencyKey: 'mana_EVENT_BOOKING_EVT-501_1200_1',
  domain: 'EVENT_BOOKING',
  orderReferenceId: 'EVT-501',
  amount: 1200,
  currency: 'INR',
  status: 'PENDING',
  preferredRail: 'UPI_INTENT',
  upiVpa: 'rwa-collections@hdfcbank',
  upiIntentUri: 'upi://pay?pa=rwa-collections@hdfcbank&am=1200.00&tr=PI_SRV_90210',
  expiresAt: new Date(Date.now() + 900000).toISOString(),
  createdAt: new Date().toISOString(),
};

const intentReq: CreateManaPaymentIntentRequest = {
  idempotencyKey: 'mana_EVENT_BOOKING_EVT-501_1200_1',
  domain: 'EVENT_BOOKING',
  orderReferenceId: 'EVT-501',
  title: 'Diwali Gala Passes (x2)',
  totalAmount: 1200,
  payer: { name: 'John Doe', phone: '+91 99999 88888', unit: 'Flat 401' },
  items: [{ title: 'Pass', quantity: 2, unitPrice: 600, amount: 1200 }],
};

describe('manaPayService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getMock.mockReset();
    postMock.mockReset();
    safeStorage.removeItem(STORAGE_KEY);
  });

  it('generates consistent idempotency keys for the same parameters within the same minute', () => {
    const key1 = manaPayService.generateIdempotencyKey('MAINTENANCE_BILL', 'INV-101', 3500);
    const key2 = manaPayService.generateIdempotencyKey('MAINTENANCE_BILL', 'INV-101', 3500);
    expect(key1).toBe(key2);
    expect(key1).toContain('mana_MAINTENANCE_BILL_INV-101_3500_');
  });

  // ── createPaymentIntent ────────────────────────────────────────────────────

  it('createPaymentIntent returns the intent the server issued, with the server VPA and URI', async () => {
    postMock.mockResolvedValueOnce(SERVER_INTENT);

    const intent = await manaPayService.createPaymentIntent(intentReq);

    expect(apiClient.post).toHaveBeenCalledWith('/payments/intents', {
      idempotencyKey: intentReq.idempotencyKey,
      domain: 'EVENT_BOOKING',
      orderReferenceId: 'EVT-501',
      amount: 1200,
      currency: 'INR',
      payerName: 'John Doe',
      payerEmail: undefined,
      payerPhone: '+91 99999 88888',
      preferredRail: 'UPI',
      remarks: 'Diwali Gala Passes (x2)',
    });

    // The intent is the server's, verbatim: no client-minted VPA, URI or receipt.
    expect(intent).toEqual(SERVER_INTENT);
    expect(intent.upiVpa).toBe('rwa-collections@hdfcbank');
    expect(intent.upiVpa).not.toBe('mana.society@icici');
    expect(intent.receiptNumber).toBeUndefined();
  });

  it('createPaymentIntent propagates a backend failure instead of fabricating a payable UPI intent', async () => {
    postMock.mockRejectedValueOnce(
      new Error('Unable to connect to the server. Please check your internet connection or try again shortly.')
    );

    await expect(manaPayService.createPaymentIntent(intentReq)).rejects.toThrow(/Unable to connect/);

    // Checkout must be able to refuse: nothing was invented and nothing stored.
    expect(safeStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  // ── confirmPayment ─────────────────────────────────────────────────────────

  it('confirmPayment persists SUCCESS using only the identifiers the server returned', async () => {
    const serverConfirmation = {
      status: 'SUCCESS' as const,
      utr: 'SRV-UTR-628499001122',
      gatewayRef: 'pay_srv_77821',
      receiptNumber: 'SRV-RCP-2026-5521',
      transactionNumber: 'TXN-SRV-0001',
      orderReferenceId: 'SPORTS-09',
      amount: 850,
      paidAt: '2026-11-01T10:30:00.000Z',
    };
    postMock.mockResolvedValueOnce(serverConfirmation);

    const record = await manaPayService.confirmPayment(
      { intentId: 'PI_TEST_INTENT_101', rail: 'UPI_INTENT', utr: '628499001122' },
      {
        title: 'Sports Registration',
        domain: 'SPORTS_FEE',
        orderReferenceId: 'SPORTS-09',
        payerName: 'Alice Green',
        payerUnit: 'Flat 102',
        amount: 850,
      }
    );

    expect(apiClient.post).toHaveBeenCalledWith('/payments/intents/PI_TEST_INTENT_101/confirm', {
      gatewayPaymentId: undefined,
      gatewayOrderId: undefined,
      gatewaySignature: undefined,
      utr: '628499001122',
    });

    expect(record.status).toBe('SUCCESS');
    expect(record.transactionNumber).toBe('TXN-SRV-0001');
    expect(record.utr).toBe('SRV-UTR-628499001122');
    expect(record.gatewayRef).toBe('pay_srv_77821');
    expect(record.receiptNumber).toBe('SRV-RCP-2026-5521');
    expect(record.amount).toBe(850);
    expect(record.paidAt).toBe('2026-11-01T10:30:00.000Z');

    // Reconciliation is a treasury fact: the client defaults to UNRECONCILED
    // and claims no reconciliation of its own.
    expect(record.reconciliationStatus).toBe('UNRECONCILED');
    expect(record.reconciledAt).toBeUndefined();
    expect(record.reconciledBy).toBeUndefined();

    // Nothing in the stored record is locally generated.
    const stored = JSON.parse(safeStorage.getItem(STORAGE_KEY) as string) as ManaPaymentRecord[];
    const persisted = stored.find((t) => t.transactionNumber === 'TXN-SRV-0001');
    expect(persisted).toBeDefined();
    expect(persisted?.receiptNumber).toBe('SRV-RCP-2026-5521');
    expect(persisted?.receiptNumber).not.toMatch(/^RCP-/);

    // The receipt carries the server's number and is NOT stamped verified,
    // because "verified" means reconciled against the society bank account.
    const receipt = await manaPayService.getTransactionReceipt(record.transactionNumber);
    expect(receipt).not.toBeNull();
    expect(receipt?.receiptNumber).toBe('SRV-RCP-2026-5521');
    expect(receipt?.totalAmount).toBe(850);
    expect(receipt?.verifiedStamp).toBe(false);
    expect(receipt?.societyGstin).toBeDefined();
  });

  it('confirmPayment carries a server-reported reconciliation through unchanged', async () => {
    postMock.mockResolvedValueOnce({
      status: 'SUCCESS',
      utr: 'SRV-UTR-991',
      receiptNumber: 'SRV-RCP-991',
      transactionNumber: 'TXN-SRV-0991',
      amount: 500,
      reconciliationStatus: 'RECONCILED',
      reconciledAt: '2026-11-02T06:00:00.000Z',
      reconciledBy: 'Treasurer (RWA ICICI Current A/c)',
    });

    const record = await manaPayService.confirmPayment(
      { intentId: 'PI_RECONCILED_1', rail: 'UPI_QR' },
      { orderReferenceId: 'EVT-991', amount: 500 }
    );

    expect(record.reconciliationStatus).toBe('RECONCILED');
    expect(record.reconciledBy).toBe('Treasurer (RWA ICICI Current A/c)');
    expect(record.reconciledAt).toBe('2026-11-02T06:00:00.000Z');

    const receipt = await manaPayService.getTransactionReceipt('TXN-SRV-0991');
    expect(receipt?.verifiedStamp).toBe(true);
  });

  it('confirmPayment issues no receipt when the server returned no receipt number', async () => {
    postMock.mockResolvedValueOnce({
      status: 'SUCCESS',
      transactionNumber: 'TXN-SRV-NO-RCP',
      amount: 300,
    });

    const record = await manaPayService.confirmPayment(
      { intentId: 'PI_NO_RECEIPT', rail: 'WALLET' },
      { orderReferenceId: 'MKT-NO-RCP', amount: 300 }
    );

    expect(record.status).toBe('SUCCESS');
    expect(record.receiptNumber).toBeUndefined();

    // A receipt number that exists nowhere server-side is never minted locally.
    await expect(manaPayService.getTransactionReceipt('TXN-SRV-NO-RCP')).resolves.toBeNull();
  });

  it('confirmPayment throws and persists nothing when the backend is unreachable', async () => {
    postMock.mockRejectedValueOnce(
      new Error('Unable to connect to the server. Please check your internet connection or try again shortly.')
    );

    await expect(
      manaPayService.confirmPayment(
        { intentId: 'PI_UNREACHABLE', rail: 'UPI_INTENT', utr: '999888777666' },
        { orderReferenceId: 'SPORTS-FAIL-01', amount: 850, title: 'Sports Registration' }
      )
    ).rejects.toThrow(/Unable to connect/);

    // No local ledger write at all — not even the seed bootstrap — so the
    // resident is never shown a receipt for a payment the backend never took.
    expect(safeStorage.getItem(STORAGE_KEY)).toBeNull();

    const list = await manaPayService.getMyTransactions();
    expect(list.find((t) => t.orderReferenceId === 'SPORTS-FAIL-01')).toBeUndefined();
    expect(list.find((t) => t.utr === '999888777666')).toBeUndefined();
  });

  it('confirmPayment throws when the server confirms with an unusable body', async () => {
    postMock.mockResolvedValueOnce(undefined);

    await expect(
      manaPayService.confirmPayment(
        { intentId: 'PI_EMPTY_BODY', rail: 'UPI_INTENT' },
        { orderReferenceId: 'EVT-EMPTY', amount: 100 }
      )
    ).rejects.toThrow(/could not be confirmed/i);

    expect(safeStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  // ── Local ledger views (seeded, no backend call) ────────────────────────────

  it('tracks refunds without deleting original transactions', async () => {
    postMock.mockResolvedValueOnce({
      status: 'SUCCESS',
      gatewayRef: 'pay_srv_refundable',
      receiptNumber: 'SRV-RCP-554',
      transactionNumber: 'TXN-SRV-0554',
      amount: 2500,
    });

    const record = await manaPayService.confirmPayment(
      { intentId: 'PI_REFUND_TEST', rail: 'GATEWAY_CARD_NETBANKING' },
      {
        title: 'Marketplace Pre-order',
        domain: 'MARKETPLACE_ORDER',
        orderReferenceId: 'ORD-554',
        payerId: 'user-302',
        payerName: 'Bob White',
        amount: 2500,
      }
    );

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
    const summary = await manaPayService.getCommunityMetrics();
    expect(summary.totalCollections).toBeGreaterThan(0);
    expect(summary.domainBreakdown).toBeDefined();
    expect(summary.domainBreakdown['MAINTENANCE_BILL']).toBeGreaterThan(0);
    expect(summary.domainBreakdown['MANA_HEALTH']).toBeGreaterThan(0);
  });
});
