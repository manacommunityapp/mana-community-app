import { apiClient } from "../common/apiClient";
import type {
  CreatePaymentOrderRequest,
  PaymentOrderResponse,
  VerifyPaymentRequest,
} from "../../types/payment";

/**
 * All calls go through apiClient which automatically adds the
 * Authorization: Bearer {token} header and handles 401 token refresh.
 *
 * Path convention: apiClient prefixes /api, so pass /payments/... here.
 */
export const razorpayService = {
  /**
   * Step 1 — Create a Razorpay order on the backend.
   * Returns keyId + razorpayOrderId needed to open the checkout modal.
   */
  createOrder(req: CreatePaymentOrderRequest): Promise<PaymentOrderResponse> {
    return apiClient.post<PaymentOrderResponse>("/payments/razorpay/orders", req);
  },

  /**
   * Step 2 — Verify the payment after the Razorpay checkout succeeds.
   * The backend verifies the HMAC-SHA256 signature and marks the order PAID.
   */
  verifyPayment(req: VerifyPaymentRequest): Promise<PaymentOrderResponse> {
    return apiClient.post<PaymentOrderResponse>("/payments/razorpay/verify", req);
  },

  /** Current user's payment history within their community (paginated). */
  getMyOrders(page = 0, size = 20): Promise<import("../../types/api").PaginatedResponse<PaymentOrderResponse>> {
    return apiClient.get(`/payments/razorpay/orders?page=${page}&size=${size}`);
  },

  /** All community payment orders — for admins (paginated). */
  getCommunityOrders(
    page = 0,
    size = 20,
  ): Promise<import("../../types/api").PaginatedResponse<PaymentOrderResponse>> {
    return apiClient.get(`/payments/razorpay/orders/community?page=${page}&size=${size}`);
  },

  /** Get a single order by its local DB ID. */
  getOrderById(id: number): Promise<PaymentOrderResponse> {
    return apiClient.get<PaymentOrderResponse>(`/payments/razorpay/orders/${id}`);
  },

  /** All orders for a specific business entity (e.g. all payments for event #42). */
  getByReference(
    referenceType: string,
    referenceId: number,
    page = 0,
    size = 20,
  ): Promise<import("../../types/api").PaginatedResponse<PaymentOrderResponse>> {
    return apiClient.get(
      `/payments/razorpay/orders/by-reference?referenceType=${referenceType}&referenceId=${referenceId}&page=${page}&size=${size}`,
    );
  },
};
