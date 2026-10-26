import { apiClient } from "./common/apiClient";
import type {
  CommerceChannel,
  CommerceOrder,
  CommerceCheckoutRequest,
  HandoverVerificationRequest,
  HandoverVerificationResponse,
  CommerceReview,
  CommerceDispute,
  CommerceSettlement,
  CommerceProduct,
} from "../types/commerceCore";

export const commerceCoreService = {
  getProducts: async (channel?: CommerceChannel): Promise<CommerceProduct[]> => {
    const q = channel ? `?channel=${channel}` : "";
    return apiClient.get<CommerceProduct[]>(`/commerce/products${q}`);
  },

  checkout: async (req: CommerceCheckoutRequest): Promise<CommerceOrder> => {
    return apiClient.post<CommerceOrder>("/commerce/orders/checkout", req);
  },

  getMyOrders: async (): Promise<CommerceOrder[]> => {
    return apiClient.get<CommerceOrder[]>("/commerce/orders/my");
  },

  getOrderByNumber: async (orderNumber: string): Promise<CommerceOrder> => {
    return apiClient.get<CommerceOrder>(`/commerce/orders/${orderNumber}`);
  },

  verifyHandover: async (req: HandoverVerificationRequest): Promise<HandoverVerificationResponse> => {
    return apiClient.post<HandoverVerificationResponse>("/commerce/handover/verify", req);
  },

  submitReview: async (review: CommerceReview): Promise<CommerceReview> => {
    return apiClient.post<CommerceReview>("/commerce/reviews", review);
  },

  raiseDispute: async (dispute: CommerceDispute): Promise<CommerceDispute> => {
    return apiClient.post<CommerceDispute>("/commerce/disputes", dispute);
  },

  initiateRefund: async (orderNumber: string, reason: string): Promise<any> => {
    return apiClient.post(`/commerce/orders/${orderNumber}/refund`, { reason });
  },

  getMySettlements: async (): Promise<CommerceSettlement[]> => {
    return apiClient.get<CommerceSettlement[]>("/commerce/settlements/my");
  },
};
