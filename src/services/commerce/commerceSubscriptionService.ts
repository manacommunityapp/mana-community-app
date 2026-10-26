import { apiClient } from "../common/apiClient";

export interface SubscriptionDto {
  id: number;
  subscriptionCode: string;
  customerId: number;
  customerName: string;
  productId?: number;
  productName: string;
  sku?: string;
  sellerId?: number;
  sellerName?: string;
  unitPrice: number;
  quantity: number;
  totalPerCycle: number;
  channel: string;
  frequency: string;
  status: string;
  nextRunDate?: string;
  lastRunDate?: string;
  totalCycles?: number;
  completedCycles: number;
  deliveryAddress?: string;
  notes?: string;
  createdAt?: string;
}

export interface SubscriptionRequest {
  productId?: number;
  productName: string;
  sku?: string;
  sellerId?: number;
  sellerName?: string;
  unitPrice: number;
  quantity: number;
  channel?: string;
  frequency: string;
  startDate?: string;
  totalCycles?: number;
  deliveryAddress?: string;
  notes?: string;
}

export const commerceSubscriptionService = {
  create(req: SubscriptionRequest): Promise<SubscriptionDto> {
    return apiClient.post<SubscriptionDto>("/v1/commerce/subscriptions", req);
  },

  getMySubscriptions(): Promise<SubscriptionDto[]> {
    return apiClient.get<SubscriptionDto[]>("/v1/commerce/subscriptions/my");
  },

  pause(code: string): Promise<SubscriptionDto> {
    return apiClient.post<SubscriptionDto>(`/v1/commerce/subscriptions/${code}/pause`);
  },

  resume(code: string): Promise<SubscriptionDto> {
    return apiClient.post<SubscriptionDto>(`/v1/commerce/subscriptions/${code}/resume`);
  },

  cancel(code: string): Promise<SubscriptionDto> {
    return apiClient.post<SubscriptionDto>(`/v1/commerce/subscriptions/${code}/cancel`);
  },

  getAdminSubscriptions(): Promise<SubscriptionDto[]> {
    return apiClient.get<SubscriptionDto[]>("/v1/commerce/subscriptions/admin");
  },
};
