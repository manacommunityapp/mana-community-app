import { apiClient } from "../common/apiClient";
import type {
  FoodOrder, FoodOrderRequest, FoodOrderTracking, FoodOrderRating, FoodPageResponse,
} from "../../types/food";

export const foodOrderService = {
  // ── Orders ──
  async placeOrder(data: FoodOrderRequest): Promise<FoodOrder> {
    return apiClient.post<FoodOrder>("/food/orders", data);
  },
  async getMyOrders(page = 0, size = 20): Promise<FoodPageResponse<FoodOrder>> {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    return apiClient.get<FoodPageResponse<FoodOrder>>(`/food/orders/mine?${params}`);
  },
  async getOrderById(id: number): Promise<FoodOrder> {
    return apiClient.get<FoodOrder>(`/food/orders/${id}`);
  },
  async getOrderByNumber(orderNumber: string): Promise<FoodOrder> {
    return apiClient.get<FoodOrder>(`/food/orders/number/${orderNumber}`);
  },
  async getProviderOrders(providerType: string, providerId: number, page = 0, size = 20, status?: string): Promise<FoodPageResponse<FoodOrder>> {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (status) params.set("status", status);
    return apiClient.get<FoodPageResponse<FoodOrder>>(`/food/orders/provider/${providerType}/${providerId}?${params}`);
  },

  // ── Order Actions ──
  async updateOrderStatus(id: number, status: string): Promise<FoodOrder> {
    return apiClient.patch<FoodOrder>(`/food/orders/${id}/status`, { status });
  },
  async cancelOrder(id: number, reason?: string): Promise<FoodOrder> {
    return apiClient.put<FoodOrder>(`/food/orders/${id}/cancel`, { reason });
  },
  async rateOrder(id: number, rating: FoodOrderRating): Promise<void> {
    await apiClient.post<void>(`/food/orders/${id}/rate`, rating);
  },
  async getOrderTracking(id: number): Promise<FoodOrderTracking[]> {
    return apiClient.get<FoodOrderTracking[]>(`/food/orders/${id}/tracking`);
  },

  // ── Group Orders ──
  async createGroupOrder(data: FoodOrderRequest): Promise<FoodOrder> {
    return apiClient.post<FoodOrder>("/food/orders/group", data);
  },
  async joinGroupOrder(orderId: number, items: FoodOrderRequest["items"]): Promise<FoodOrder> {
    return apiClient.post<FoodOrder>(`/food/orders/group/${orderId}/join`, { items });
  },

  // ── Refunds ──
  async requestRefund(orderId: number, reason: string): Promise<void> {
    await apiClient.post<void>(`/food/orders/${orderId}/refund`, { reason });
  },
};
