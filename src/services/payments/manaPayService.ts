import { apiClient } from '../common/apiClient';
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
   * All transaction data is fetched from the backend — never from local storage.
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
    return apiClient.get<ManaPaymentRecord[]>('/payments/mana/transactions', { params });
  },

  /**
   * Resident's own transaction history.
   */
  async getMyTransactions(params?: {
    domain?: ManaPayDomain;
    status?: ManaPaymentStatus;
    search?: string;
  }): Promise<ManaPaymentRecord[]> {
    return apiClient.get<ManaPaymentRecord[]>('/payments/mana/my-transactions', { params });
  },

  /**
   * Generate official digital receipt from backend.
   */
  async getTransactionReceipt(transactionNumber: string): Promise<ManaDigitalReceipt | null> {
    return apiClient.get<ManaDigitalReceipt>(`/payments/receipts/${transactionNumber}`);
  },

  /**
   * Request full or partial refund via backend.
   * Financial records are never mutated client-side — the backend issues the refund and
   * returns the updated record.
   */
  async requestRefund(req: ManaRefundRequest): Promise<ManaPaymentRecord> {
    return apiClient.post<ManaPaymentRecord>(
      `/payments/mana/transactions/${encodeURIComponent(req.transactionNumber)}/refund`,
      { amount: req.amount, reason: req.reason }
    );
  },

  /**
   * Treasurer manual reconciliation — recorded on the backend only.
   */
  async reconcileTransaction(
    transactionNumber: string,
    utr: string,
    reconciledBy = 'Treasurer'
  ): Promise<ManaPaymentRecord> {
    return apiClient.post<ManaPaymentRecord>('/payments/mana/reconcile', {
      transactionNumber,
      utr,
      reconciledBy,
    });
  },

  /**
   * Community Treasurer summary metrics — sourced from real backend analytics.
   */
  async getCommunityMetrics(): Promise<{
    totalCollections: number;
    pendingCollections: number;
    reconciledCount: number;
    pendingCount: number;
    domainBreakdown: Record<string, number>;
  }> {
    return apiClient.get('/payments/mana/metrics');
  },
};
