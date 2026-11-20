// unifiedPaymentService.ts
// All feature modules must use this for gateway-initiated payments.
// Never call cashfreePaymentService or razorpayService directly from feature code.
// Never accept a PG SDK callback as payment confirmation — always call verifyPayment().

import { apiClient } from "../common/apiClient";
import { analyticsService } from "../analytics/analyticsService";

export type PaymentGateway =
  | "CASHFREE"
  | "RAZORPAY"
  | "MANA_PAY"
  | "UPI_DIRECT"
  | "MANUAL";

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
  | "MANUAL"
  | "FOOD_GROCERY_ORDER";

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
  convenienceFeeAmount: number;
  grossAmount: number;
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
  createOrder: (req: CreatePaymentOrderRequest): Promise<PaymentOrder> => {
    analyticsService.track("payment_started", { referenceType: req.referenceType, gateway: req.gateway, amount: req.amount });
    return apiClient.post<PaymentOrder>("/payments/orders", req);
  },

  /** Retrieve current order state from the server. */
  getOrder: (orderId: number): Promise<PaymentOrder> =>
    apiClient.get<PaymentOrder>(`/payments/orders/${orderId}`),

  /**
   * Step 2 — Verify after PG SDK callback.
   * NEVER treat the SDK callback alone as payment confirmation.
   * Always call this; the backend re-queries the gateway.
   */
  verifyPayment: async (orderId: number): Promise<PaymentOrder> => {
    const order = await apiClient.post<PaymentOrder>(`/payments/orders/${orderId}/verify`);
    // Server-confirmed outcome only; PENDING is intentionally not reported.
    const props = { referenceType: order.referenceType, gateway: order.gateway, amount: order.amount };
    if (order.status === "SUCCESS") analyticsService.track("payment_succeeded", props);
    else if (order.status === "FAILED" || order.status === "EXPIRED")
      analyticsService.track("payment_failed", { ...props, reason: order.failureReason ?? order.status });
    return order;
  },

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
