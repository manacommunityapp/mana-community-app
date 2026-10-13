import { describe, it, expect, beforeEach } from 'vitest';
import { vendorMerchantPaymentService } from './vendorMerchantPaymentService';

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

describe('vendorMerchantPaymentService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Merchant Profile & Regulatory Direct Settlement', () => {
    it('retrieves verified merchant profile with bank settlement credentials', () => {
      const profile = vendorMerchantPaymentService.getMerchantProfile();
      expect(profile).toBeDefined();
      expect(profile.vpa).toContain('@');
      expect(profile.settlementAccount.verificationStatus).toBe('VERIFIED');
      expect(profile.settlementAccount.ifscCode).toBeDefined();
      expect(profile.paymentAggregatorRef).toBeDefined();
    });

    it('updates merchant profile payment instructions and details', () => {
      const updated = vendorMerchantPaymentService.updateMerchantProfile({
        paymentInstructions: 'Deliver after 5 PM and ring flat doorbell.',
      });
      expect(updated.paymentInstructions).toBe('Deliver after 5 PM and ring flat doorbell.');
    });
  });

  describe('Order-Specific Payment Links', () => {
    it('creates a dynamic payment link with UPI intent url and short link', () => {
      const newLink = vendorMerchantPaymentService.createPaymentLink({
        customerName: 'Aarav Gupta',
        customerPhone: '+91 98450 11223',
        customerUnit: 'Tower B 304',
        amount: 1250,
        description: 'Organic Cold-Pressed Juices Pack of 6',
        orderType: 'COMMUNITY_MARKET',
      });

      expect(newLink.id).toBeDefined();
      expect(newLink.amount).toBe(1250);
      expect(newLink.status).toBe('ACTIVE');
      expect(newLink.upiIntentUrl).toContain('am=1250');
      expect(newLink.upiIntentUrl).toContain('pa=');
      expect(newLink.shortUrl).toContain('pay.mana.community');
    });

    it('marks payment link as paid and injects into reconciliation records', () => {
      const links = vendorMerchantPaymentService.getPaymentLinks();
      const active = links.find((l) => l.status === 'ACTIVE') || links[0];

      const paid = vendorMerchantPaymentService.markLinkAsPaid(active.id, '628899112233');
      expect(paid).not.toBeNull();
      expect(paid?.status).toBe('PAID');
      expect(paid?.utr).toBe('628899112233');

      // Verify reconciliation has this order
      const reconciliations = vendorMerchantPaymentService.getReconciliationRecords();
      const match = reconciliations.find((r) => r.orderId === paid?.orderId);
      expect(match).toBeDefined();
      expect(match?.status).toBe('MATCHED');
    });

    it('cancels active payment link', () => {
      const newLink = vendorMerchantPaymentService.createPaymentLink({
        customerName: 'Test Resident',
        customerPhone: '+91 99999 88888',
        amount: 500,
        description: 'Sample order to cancel',
      });

      const cancelled = vendorMerchantPaymentService.cancelPaymentLink(newLink.id);
      expect(cancelled).toBe(true);

      const links = vendorMerchantPaymentService.getPaymentLinks();
      const check = links.find((l) => l.id === newLink.id);
      expect(check?.status).toBe('CANCELLED');
    });
  });

  describe('QR-Based Collections', () => {
    it('generates standard UPI QR payload for static counter standee', () => {
      const qrData = vendorMerchantPaymentService.getMerchantQrPayload();
      expect(qrData.vpa).toBeDefined();
      expect(qrData.upiPayload).toContain('upi://pay');
      expect(qrData.upiPayload).toContain(qrData.vpa);
      expect(qrData.displayAmount).toBeUndefined();
    });

    it('generates dynamic UPI QR payload with embedded amount and order reference', () => {
      const qrData = vendorMerchantPaymentService.getMerchantQrPayload(1450, 'ORD-MKT-9912');
      expect(qrData.displayAmount).toBe(1450);
      expect(qrData.upiPayload).toContain('am=1450');
      expect(qrData.upiPayload).toContain('tr=ORD-MKT-9912');
    });
  });

  describe('Order / Payment Reconciliation', () => {
    it('retrieves reconciliation records with UTR and status', () => {
      const records = vendorMerchantPaymentService.getReconciliationRecords();
      expect(records.length).toBeGreaterThan(0);
      expect(records[0].utr).toBeDefined();
      expect(records[0].bankRefNumber).toBeDefined();
    });

    it('resolves discrepancy manually when matched against bank statement', () => {
      const records = vendorMerchantPaymentService.getReconciliationRecords();
      const pending = records.find((r) => r.status === 'PENDING_RECONCILIATION');
      if (pending) {
        const resolved = vendorMerchantPaymentService.resolveReconciliationDiscrepancy(
          pending.id,
          'UTR-HDFC-9912'
        );
        expect(resolved?.status).toBe('MATCHED');
        expect(resolved?.discrepancyNote).toContain('UTR-HDFC-9912');
      }
    });
  });

  describe('Refunds & Dispute Workflows', () => {
    it('approves and processes direct customer refund', () => {
      const disputes = vendorMerchantPaymentService.getDisputes();
      const openDispute = disputes.find((d) => d.status === 'OPEN');
      if (openDispute) {
        const processed = vendorMerchantPaymentService.processRefund(
          openDispute.id,
          'Approved full refund to customer VPA source'
        );
        expect(processed?.status).toBe('REFUNDED');
        expect(processed?.merchantResponseNote).toContain('Approved full refund');
      }
    });

    it('initiates direct goodwill order refund', () => {
      const refund = vendorMerchantPaymentService.initiateDirectOrderRefund(
        'ORD-MKT-5511',
        450,
        'Customer received damaged packaging'
      );
      expect(refund.id).toBeDefined();
      expect(refund.status).toBe('REFUNDED');
      expect(refund.refundAmount).toBe(450);
    });
  });

  describe('Settlement Reports & Sales Summaries', () => {
    it('generates sales summary with GMV, average ticket size, and payment modes', () => {
      const summary = vendorMerchantPaymentService.getSalesSummary('THIS_MONTH');
      expect(summary.grossVolume).toBeGreaterThan(0);
      expect(summary.averageTicketSize).toBeGreaterThan(0);
      expect(summary.paymentMethodBreakdown.length).toBeGreaterThan(0);
      expect(summary.topSellingItems.length).toBeGreaterThan(0);
    });

    it('retrieves settlement batches and verifies T+1 cycle summary', () => {
      const batches = vendorMerchantPaymentService.getSettlementBatches();
      expect(batches.length).toBeGreaterThan(0);

      const summary = vendorMerchantPaymentService.getSettlementSummary();
      expect(summary.totalSettledVolume).toBeGreaterThan(0);
      expect(summary.settlementCycle).toContain('T+1');
    });
  });
});
