import { describe, it, expect, beforeEach } from 'vitest';
import { manaPayService } from './manaPayService';
import { safeStorage } from '../../utils/storage';
import type { CreateManaPaymentIntentRequest } from '../../types/manaPay';

describe('manaPayService', () => {
  beforeEach(() => {
    safeStorage.removeItem('mana_pay_transactions_v1');
  });

  it('generates consistent idempotency keys for the same parameters within the same minute', () => {
    const key1 = manaPayService.generateIdempotencyKey('MAINTENANCE_BILL', 'INV-101', 3500);
    const key2 = manaPayService.generateIdempotencyKey('MAINTENANCE_BILL', 'INV-101', 3500);
    expect(key1).toBe(key2);
    expect(key1).toContain('mana_MAINTENANCE_BILL_INV-101_3500_');
  });

  it('creates a payment intent and returns valid UPI intent URI and VPA', async () => {
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
  });

  it('confirms payment, stores transaction record, and retrieves official digital receipt', async () => {
    const intentId = 'PI_TEST_INTENT_101';
    const record = await manaPayService.confirmPayment(
      {
        intentId,
        rail: 'UPI_INTENT',
        utr: '628499001122',
      },
      {
        title: 'Sports Registration',
        domain: 'SPORTS_FEE',
        orderReferenceId: 'SPORTS-09',
        payerName: 'Alice Green',
        payerUnit: 'Flat 102',
        amount: 850,
      }
    );

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
    const record = await manaPayService.confirmPayment(
      {
        intentId: 'PI_REFUND_TEST',
        rail: 'GATEWAY_CARD_NETBANKING',
      },
      {
        title: 'Marketplace Pre-order',
        domain: 'MARKETPLACE_ORDER',
        orderReferenceId: 'ORD-554',
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
