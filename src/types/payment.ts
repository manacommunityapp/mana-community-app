// ── Razorpay payment types ──────────────────────────────────────────────────

/** Lifecycle status for a Razorpay order stored in the backend. */
export type RazorpayOrderStatus = "CREATED" | "PAID" | "FAILED" | "REFUNDED" | "CANCELLED";

/**
 * Discriminates which business module created the payment order.
 * Must match the values accepted by the backend {@code CreateOrderRequest.referenceType}.
 */
export type PaymentReferenceType =
  | "EVENT_REGISTRATION"
  | "POOJA"
  | "DONATION"
  | "FOOD_ORDER"
  | "AUCTION"
  | "SPORTS_REGISTRATION"
  | "CULTURAL_REGISTRATION"
  | "OTHER";

/** Request body for {@code POST /api/payments/razorpay/orders}. */
export interface CreatePaymentOrderRequest {
  /** Amount in INR rupees (not paise). Backend validates against server-calculated price. */
  amount: number;
  referenceType: PaymentReferenceType;
  /** PK of the business entity being paid for. */
  referenceId: number;
  /** Short description shown in the Razorpay checkout modal. */
  description?: string;
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
