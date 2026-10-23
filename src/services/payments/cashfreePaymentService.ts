import { apiClient } from "../common/apiClient";
import type { PaginatedResponse } from "../../types/api";

export interface CashfreeCreateOrderRequest {
  amount: number;
  referenceType: string;
  referenceId: number | string;
  description?: string;
  customerPhone?: string;
}

export interface CashfreeOrderResponse {
  id: number;
  manaOrderId: string;
  cfOrderId?: string;
  amount: number;
  currency: string;
  status: "CREATED" | "PAID" | "FAILED" | "EXPIRED" | "REFUNDED" | "REFUND_PENDING" | "PENDING";
  referenceType: string;
  referenceId: number;
  description?: string;
  paymentMethod?: string;
  failureReason?: string;
  paidAt?: string;
  createdAt: string;
  /** Only populated on the order-creation response. */
  paymentSessionId?: string;
  /** Only populated on the order-creation response. */
  appId?: string;
}

export interface CashfreeAdminSummaryResponse {
  totalCollected: number;
  totalRefunded: number;
  countByStatus: Record<string, number>;
  amountByStatus: Record<string, number>;
  countByReferenceType: Record<string, number>;
  revenueByReferenceType: Record<string, number>;
}

export const cashfreePaymentService = {
  createOrder(req: CashfreeCreateOrderRequest): Promise<CashfreeOrderResponse> {
    return apiClient.post<CashfreeOrderResponse>("/payments/cashfree/orders", req);
  },

  verifyPayment(manaOrderId: string): Promise<CashfreeOrderResponse> {
    return apiClient.post<CashfreeOrderResponse>(`/payments/cashfree/orders/${manaOrderId}/verify`, {
      orderId: manaOrderId,
    });
  },

  getMyOrders(page = 0, size = 20): Promise<PaginatedResponse<CashfreeOrderResponse>> {
    return apiClient.get(`/payments/cashfree/orders?page=${page}&size=${size}`);
  },

  getCommunityOrders(page = 0, size = 20): Promise<PaginatedResponse<CashfreeOrderResponse>> {
    return apiClient.get(`/payments/cashfree/orders/community?page=${page}&size=${size}`);
  },

  getOrderById(id: number): Promise<CashfreeOrderResponse> {
    return apiClient.get<CashfreeOrderResponse>(`/payments/cashfree/orders/${id}`);
  },

  getByReference(
    referenceType: string,
    referenceId: number | string,
    page = 0,
    size = 20,
  ): Promise<PaginatedResponse<CashfreeOrderResponse>> {
    return apiClient.get(
      `/payments/cashfree/orders/by-reference?referenceType=${referenceType}&referenceId=${referenceId}&page=${page}&size=${size}`,
    );
  },

  // ── Admin endpoints ───────────────────────────────────────────────────────

  getAdminReport(params: {
    status?: string;
    refType?: string;
    from?: string;
    to?: string;
    page?: number;
    size?: number;
  }): Promise<PaginatedResponse<CashfreeOrderResponse>> {
    const q = new URLSearchParams();
    if (params.status)        q.set("status",   params.status);
    if (params.refType)       q.set("refType",  params.refType);
    if (params.from)          q.set("from",     params.from);
    if (params.to)            q.set("to",       params.to);
    q.set("page", String(params.page ?? 0));
    q.set("size", String(params.size ?? 20));
    return apiClient.get(`/payments/cashfree/admin/report?${q.toString()}`);
  },

  getAdminSummary(params: { from?: string; to?: string }): Promise<CashfreeAdminSummaryResponse> {
    const q = new URLSearchParams();
    if (params.from) q.set("from", params.from);
    if (params.to)   q.set("to",   params.to);
    return apiClient.get(`/payments/cashfree/admin/summary?${q.toString()}`);
  },

  adminInitiateRefund(
    manaOrderId: string,
    amount?: number,
    reason?: string,
  ): Promise<CashfreeOrderResponse> {
    return apiClient.post(`/payments/cashfree/admin/refund/${manaOrderId}`, { amount, reason });
  },
};
