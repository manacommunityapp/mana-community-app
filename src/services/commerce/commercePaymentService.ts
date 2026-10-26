import { apiClient } from "../common/apiClient";
import type { CommerceOrderDto } from "./commerceOrderService";

export interface CommercePaymentInitiateResponse {
  orderNumber: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  keyId: string;
  description: string;
}

export interface CommercePaymentVerifyRequest {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export const commercePaymentService = {
  initiatePayment(orderNumber: string): Promise<CommercePaymentInitiateResponse> {
    return apiClient.post<CommercePaymentInitiateResponse>(`/commerce/orders/${orderNumber}/pay/initiate`);
  },

  verifyPayment(orderNumber: string, req: CommercePaymentVerifyRequest): Promise<CommerceOrderDto> {
    return apiClient.post<CommerceOrderDto>(`/commerce/orders/${orderNumber}/pay/verify`, req);
  },
};
