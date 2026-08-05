import { apiClient } from "../common/apiClient";
import type {
  SubscriptionPlan, FoodSubscription, SubscriptionRequest, FoodPageResponse,
} from "../../types/food";

export const foodSubscriptionService = {
  // ── Plans ──
  async getPlans(targetAudience?: string): Promise<SubscriptionPlan[]> {
    const params = targetAudience ? `?targetAudience=${targetAudience}` : "";
    return apiClient.get<SubscriptionPlan[]>(`/food/subscriptions/plans${params}`);
  },
  async getPlanById(id: number): Promise<SubscriptionPlan> {
    return apiClient.get<SubscriptionPlan>(`/food/subscriptions/plans/${id}`);
  },
  async createPlan(data: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> {
    return apiClient.post<SubscriptionPlan>("/food/subscriptions/plans", data);
  },
  async updatePlan(id: number, data: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> {
    return apiClient.put<SubscriptionPlan>(`/food/subscriptions/plans/${id}`, data);
  },

  // ── Subscriptions ──
  async subscribe(data: SubscriptionRequest): Promise<FoodSubscription> {
    return apiClient.post<FoodSubscription>("/food/subscriptions", data);
  },
  async getMySubscriptions(): Promise<FoodSubscription[]> {
    return apiClient.get<FoodSubscription[]>("/food/subscriptions/mine");
  },
  async pauseSubscription(id: number): Promise<FoodSubscription> {
    return apiClient.patch<FoodSubscription>(`/food/subscriptions/${id}/pause`, {});
  },
  async resumeSubscription(id: number): Promise<FoodSubscription> {
    return apiClient.patch<FoodSubscription>(`/food/subscriptions/${id}/resume`, {});
  },
  async cancelSubscription(id: number): Promise<FoodSubscription> {
    return apiClient.patch<FoodSubscription>(`/food/subscriptions/${id}/cancel`, {});
  },
  async getDeliveries(subscriptionId: number): Promise<FoodPageResponse<unknown>> {
    return apiClient.get<FoodPageResponse<unknown>>(`/food/subscriptions/${subscriptionId}/deliveries`);
  },
};
