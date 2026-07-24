import { apiClient } from "./apiClient";
import type {
  RestaurantAnalytics, ConsumptionTrend, FoodDashboardStats,
} from "../types/food";

export const foodAnalyticsService = {
  // ── Restaurant Analytics ──
  async getRestaurantAnalytics(restaurantId: number, startDate: string, endDate: string): Promise<RestaurantAnalytics[]> {
    const params = new URLSearchParams({ startDate, endDate });
    return apiClient.get<RestaurantAnalytics[]>(`/food/analytics/restaurants/${restaurantId}?${params}`);
  },

  // ── Community Trends ──
  async getCommunityTrends(months = 6): Promise<ConsumptionTrend[]> {
    return apiClient.get<ConsumptionTrend[]>(`/food/analytics/trends?months=${months}`);
  },

  // ── Food Waste ──
  async getFoodWasteAnalytics(months = 6): Promise<unknown> {
    return apiClient.get<unknown>(`/food/analytics/food-waste?months=${months}`);
  },

  // ── Revenue ──
  async getRevenueAnalytics(startDate: string, endDate: string): Promise<unknown> {
    const params = new URLSearchParams({ startDate, endDate });
    return apiClient.get<unknown>(`/food/analytics/revenue?${params}`);
  },

  // ── Dashboard ──
  async getDashboardStats(): Promise<FoodDashboardStats> {
    return apiClient.get<FoodDashboardStats>("/food/analytics/dashboard");
  },
};
