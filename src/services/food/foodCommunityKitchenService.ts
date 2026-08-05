import { apiClient } from "../common/apiClient";
import type {
  CommunityKitchen, CommunityKitchenMenu, CommunityKitchenBooking, FoodPageResponse,
} from "../../types/food";

export const foodCommunityKitchenService = {
  // ── Kitchens ──
  async getKitchens(): Promise<CommunityKitchen[]> {
    return apiClient.get<CommunityKitchen[]>("/food/community-kitchens");
  },
  async getKitchenById(id: number): Promise<CommunityKitchen> {
    return apiClient.get<CommunityKitchen>(`/food/community-kitchens/${id}`);
  },
  async createKitchen(data: Partial<CommunityKitchen>): Promise<CommunityKitchen> {
    return apiClient.post<CommunityKitchen>("/food/community-kitchens", data);
  },

  // ── Menu ──
  async getMenu(kitchenId: number, date?: string): Promise<CommunityKitchenMenu[]> {
    const params = date ? `?date=${date}` : "";
    return apiClient.get<CommunityKitchenMenu[]>(`/food/community-kitchens/${kitchenId}/menu${params}`);
  },
  async createMenu(kitchenId: number, data: Partial<CommunityKitchenMenu>): Promise<CommunityKitchenMenu> {
    return apiClient.post<CommunityKitchenMenu>(`/food/community-kitchens/${kitchenId}/menu`, data);
  },

  // ── Bookings ──
  async bookMeal(data: { menuId: number; quantity: number }): Promise<CommunityKitchenBooking> {
    return apiClient.post<CommunityKitchenBooking>("/food/community-kitchens/bookings", data);
  },
  async getMyBookings(page = 0, size = 20): Promise<FoodPageResponse<CommunityKitchenBooking>> {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    return apiClient.get<FoodPageResponse<CommunityKitchenBooking>>(`/food/community-kitchens/bookings/mine?${params}`);
  },
  async verifyToken(bookingId: number, token: string): Promise<CommunityKitchenBooking> {
    return apiClient.post<CommunityKitchenBooking>(`/food/community-kitchens/bookings/${bookingId}/verify`, { token });
  },
};
