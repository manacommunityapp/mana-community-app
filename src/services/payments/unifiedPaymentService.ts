// unifiedPaymentService.ts
// All feature modules must use this for gateway-initiated payments.
// Never call cashfreePaymentService or razorpayService directly from feature code.
// Never accept a PG SDK callback as payment confirmation — always call verifyPayment().

import { apiClient } from "../common/apiClient";

export type PaymentGateway = "CASHFREE" | "RAZORPAY";

export type PaymentReferenceType =
  | "MAINTENANCE_BILL"
  | "EVENT_REGISTRATION"
  | "POOJA_BOOKING"
  | "SPORTS_REGISTRATION"
  | "FOOD_ORDER"
  | "MARKETPLACE_ORDER"
  | "HEALTH_BOOKING"
  | "AMENITY_BOOKING"
  | "TRIP_SETTLEMENT"
  | "BBPS_BILL"
  | "MANUAL";

export type PaymentOrderStatus =
  | "INITIATED"
  | "PENDING"
  | "SUCCESS"
  | "FAILED"
  | "REFUND_PENDING"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED"
  | "VOIDED"
  | "EXPIRED";

export interface PaymentOrder {
  id: number;
  idempotencyKey: string;
  gateway: PaymentGateway;
  gatewayOrderId: string;
  referenceType: PaymentReferenceType;
  referenceId: number;
  amount: number;
  currency: string;
  status: PaymentOrderStatus;
  receiptNumber?: string;
  failureReason?: string;
  refundedAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentOrderRequest {
  communityId: number;
  gateway: PaymentGateway;
  referenceType: PaymentReferenceType;
  referenceId: number;
  amount: number;
  currency?: string;
  /** If omitted the server generates a UUID-based idempotency key. */
  idempotencyKey?: string;
}

export const unifiedPaymentService = {
  /**
   * Step 1 — Create a server-side payment order before launching any PG SDK.
   * Returns the gateway order id and session token needed to open the PG checkout.
   */
  createOrder: (req: CreatePaymentOrderRequest): Promise<PaymentOrder> =>
    apiClient.post<PaymentOrder>("/payments/orders", req),

  /** Retrieve current order state from the server. */
  getOrder: (orderId: number): Promise<PaymentOrder> =>
    apiClient.get<PaymentOrder>(`/payments/orders/${orderId}`),

  /**
   * Step 2 — Verify after PG SDK callback.
   * NEVER treat the SDK callback alone as payment confirmation.
   * Always call this; the backend re-queries the gateway.
   */
  verifyPayment: (orderId: number): Promise<PaymentOrder> =>
    apiClient.post<PaymentOrder>(`/payments/orders/${orderId}/verify`),

  /** Initiate a refund for a captured payment. */
  initiateRefund: (orderId: number, amount: number): Promise<PaymentOrder> =>
    apiClient.post<PaymentOrder>(`/payments/orders/${orderId}/refund`, { amount }),

  /** All payment orders for a given domain object (e.g. all attempts for bill #42). */
  getOrdersForReference: (
    referenceType: PaymentReferenceType,
    referenceId: number
  ): Promise<PaymentOrder[]> =>
    apiClient.get<PaymentOrder[]>("/payments/orders", {
      params: { referenceType, referenceId },
    }),
};
