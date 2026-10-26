// ── Shared Payment Infrastructure ("Mana Pay") Data Models & Types ─────────

/** Business domains originating payment orders across the Mana platform. */
export type PaymentDomainSource =
  | "COMMUNITY_FINANCE"     // Maintenance, sinking fund, vendor advances
  | "MY_MONEY"               // Personal bills, recurring expenses, wallet topups
  | "MANA_TRIPS"             // Trip deposits, split settlements, excursions
  | "MARKETPLACE"            // Classifieds, seller orders, delivery fees
  | "MANA_DEALS"             // Group buying deals, merchant offers
  | "EVENTS"                 // Event tickets, cultural registrations, auctions
  | "SPORTS"                 // Tournament passes, ground bookings
  | "FOOD_ORDERS"            // Canteen, festival food passes
  | "REWARDS"                // Points purchase, tier upgrade
  | "FACILITIES";            // Clubhouse bookings, EV chargers

/** Lifecycle status for a canonical payment order. */
export type PaymentOrderStatus =
  | "CREATED"
  | "PROCESSING"
  | "PAID"
  | "PARTIAL"
  | "FAILED"
  | "REFUNDED"
  | "CANCELLED";

/** Payment provider adapter identifier. */
export type PaymentProvider =
  | "RAZORPAY"
  | "CASHFREE"
  | "PHONEPE"
  | "UPI_AUTOPAY"
  | "ENACH"
  | "INTERNAL_WALLET";

/** Payment rail / method. */
export type PaymentMethod =
  | "UPI"
  | "CARD"
  | "NET_BANKING"
  | "WALLET"
  | "MANDATE"
  | "POINTS_REDEMPTION";

/**
 * Discriminates which business module created the payment order.
 * Must match the values accepted by the backend {@code CreateOrderRequest.referenceType}.
 */
export type PaymentReferenceType =
  | "MAINTENANCE_BILL"
  | "TRIP_BOOKING"
  | "TRIP_SPLIT_SETTLEMENT"
  | "MARKETPLACE_ORDER"
  | "DEAL_GROUP_BUY"
  | "EVENT_REGISTRATION"
  | "POOJA"
  | "DONATION"
  | "FOOD_ORDER"
  | "AUCTION"
  | "SPORTS_REGISTRATION"
  | "CULTURAL_REGISTRATION"
  | "PERSONAL_EXPENSE_SYNC"
  | "OTHER";

/** Canonical payment_order table schema. */
export interface PaymentOrderRecord {
  id: string;
  orderRef: string; // e.g. ORD-MANA-2026-10-88129
  domainSource: PaymentDomainSource;
  referenceType: PaymentReferenceType;
  referenceId: string | number;
  payerUserId: number;
  payerName?: string;
  payerEmail?: string;
  payerPhone?: string;
  communityId?: number;
  amount: number;
  currency: string;
  status: PaymentOrderStatus;
  idempotencyKey: string;
  description?: string;
  keyId?: string;
  paidAt?: string;
  createdAt: string;
}

/** Individual payment attempt log (payment_attempt table). */
export interface PaymentAttemptRecord {
  id: string;
  paymentOrderId: string;
  attemptSequence: number;
  provider: PaymentProvider;
  providerOrderId: string;
  paymentMethod?: PaymentMethod;
  status: "INITIATED" | "SUCCEEDED" | "FAILED" | "DISMISSED";
  errorCode?: string;
  errorMessage?: string;
  attemptedAt: string;
}

/** Verified, confirmed transaction record (payment_transaction table). */
export interface PaymentTransactionRecord {
  id: string;
  paymentOrderId: string;
  paymentAttemptId: string;
  provider: PaymentProvider;
  gatewayPaymentId: string; // e.g. pay_N0x8761298
  gatewaySignature?: string;
  signatureVerified: boolean;
  amountCaptured: number;
  feeDeducted?: number;
  taxDeducted?: number;
  currency: string;
  capturedAt: string;
}

/** Refund record (payment_refund table). */
export interface PaymentRefundRecord {
  id: string;
  paymentTransactionId: string;
  refundRef: string;
  gatewayRefundId?: string;
  amount: number;
  reason: string;
  status: "INITIATED" | "PROCESSED" | "FAILED";
  processedAt?: string;
  createdAt: string;
}

/** Deduplicated provider callback event (payment_webhook_event table). */
export interface PaymentWebhookEventRecord {
  id: string;
  provider: PaymentProvider;
  eventId: string; // unique gateway webhook ID
  eventType: string; // e.g. payment.captured, order.paid
  payloadJson: Record<string, any>;
  processed: boolean;
  processedAt?: string;
  receivedAt: string;
}

/** Discrepancy comparison log (payment_reconciliation table). */
export interface PaymentReconciliationRecord {
  id: string;
  batchRef: string;
  gatewayOrderId: string;
  gatewayPaymentId?: string;
  gatewayAmount: number;
  internalAmount: number;
  status: "MATCHED" | "AMOUNT_MISMATCH" | "STATUS_MISMATCH" | "MISSING_INTERNAL" | "UNRESOLVED";
  discrepancyReason?: string;
  reconciledAt: string;
}

/** Immutable receipt issuance ledger (payment_receipt table). */
export interface PaymentReceiptRecord {
  id: string;
  paymentTransactionId: string;
  receiptNumber: string; // e.g. REC-2026-10-8891
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalAmount: number;
  pdfStorageUrl?: string;
  issuedAt: string;
}

/** Authorized recurring-payment mandate metadata (payment_mandate table). */
export interface PaymentMandateRecord {
  id: string;
  mandateRef: string; // e.g. UMN-MANA-2026-892147
  payerUserId: number;
  provider: PaymentProvider;
  accountRefMask: string;
  bankName: string;
  maxAmountCap: number;
  frequency: "MONTHLY" | "QUARTERLY" | "AS_PRESENTED";
  status: "ACTIVE" | "PENDING_AUTH" | "PAUSED" | "REVOKED";
  preDebitNoticeHours: number;
  authMethod: "NET_BANKING_OTP" | "DEBIT_CARD_PIN" | "UPI_PIN";
  authorizedAt: string;
  expiresAt: string;
}

/** Eligible reward points balance (reward_account table). */
export interface RewardAccountRecord {
  id: string;
  userId: number;
  communityId: number;
  currentPoints: number;
  lifetimeEarned: number;
  lifetimeRedeemed: number;
  tier: "SILVER" | "GOLD" | "PLATINUM";
  updatedAt: string;
}

/** Append-only reward points ledger (reward_ledger_entry table). */
export interface RewardLedgerEntryRecord {
  id: string;
  rewardAccountId: string;
  entryType: "EARN" | "REDEEM" | "EXPIRE" | "REVERSAL";
  points: number;
  paymentTransactionId?: string;
  referenceType?: string;
  referenceId?: string;
  narration: string;
  createdAt: string;
}

/** Lifecycle status for a Razorpay order stored in the backend (alias for backwards compatibility). */
export type RazorpayOrderStatus = PaymentOrderStatus;

/** Request body for {@code POST /api/payments/razorpay/orders} or {@code POST /api/payments/orders}. */
export interface CreatePaymentOrderRequest {
  /** Amount in INR rupees (not paise). Backend validates against server-calculated price. */
  amount: number;
  referenceType: PaymentReferenceType;
  /** PK or UUID of the business entity being paid for. */
  referenceId: number | string;
  /** Originating business domain for segregation. */
  domainSource?: PaymentDomainSource;
  /** Short description shown in checkout. */
  description?: string;
  /** Idempotency key for zero-duplication guarantee. */
  idempotencyKey?: string;
}

/**
 * Response from {@code POST /api/payments/razorpay/orders}.
 * Includes {@link keyId} so the frontend can open the Razorpay checkout modal.
 * All other endpoints return {@code keyId: null}.
 */
export interface PaymentOrderResponse {
  id: number;
  razorpayOrderId: string;
  razorpayPaymentId: string | null;
  amount: number;
  currency: string;
  status: RazorpayOrderStatus;
  referenceType: PaymentReferenceType;
  referenceId: number;
  description: string | null;
  /** Razorpay publishable key — present only in the order-creation response. */
  keyId: string | null;
  paidAt: string | null;
  createdAt: string;
}

/** Request body for {@code POST /api/payments/razorpay/verify}. */
export interface VerifyPaymentRequest {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

// ── Razorpay checkout handler types (from Razorpay JS SDK) ──────────────────

/** Payload returned by Razorpay checkout on payment success. */
export interface RazorpaySuccessPayload {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

/** Payload returned by Razorpay checkout on modal dismiss or failure. */
export interface RazorpayErrorPayload {
  error: {
    code: string;
    description: string;
    source: string;
    step: string;
    reason: string;
    metadata: {
      order_id: string;
      payment_id?: string;
    };
  };
}

/** Options passed to {@code new window.Razorpay(options).open()}. */
export interface RazorpayCheckoutOptions {
  key: string;
  amount: number; // in paise
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string | number>;
  theme?: { color?: string };
  handler: (payload: RazorpaySuccessPayload) => void;
  modal?: {
    ondismiss?: () => void;
  };
}

// Augment window so TypeScript knows about the Razorpay global injected by checkout.js
declare global {
  interface Window {
    Razorpay: new (options: RazorpayCheckoutOptions) => { open(): void; close(): void };
  }
}
