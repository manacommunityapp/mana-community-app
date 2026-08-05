import { apiClient } from "../common/apiClient";
import type {
  HomeChef, HomeChefRequest, HomeChefMenu, HomeChefMenuRequest, FoodPageResponse,
} from "../../types/food";

export const foodHomeChefService = {
  // ── Home Chefs ──
  async getHomeChefs(page = 0, size = 20, status?: string, search?: string): Promise<FoodPageResponse<HomeChef>> {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (status) params.set("status", status);
    if (search) params.set("search", search);
    return apiClient.get<FoodPageResponse<HomeChef>>(`/food/home-chefs?${params}`);
  },
  async getHomeChefById(id: number): Promise<HomeChef> {
    return apiClient.get<HomeChef>(`/food/home-chefs/${id}`);
  },
  async getMyProfile(): Promise<HomeChef> {
    return apiClient.get<HomeChef>("/food/home-chefs/mine");
  },
  async registerHomeChef(data: HomeChefRequest): Promise<HomeChef> {
    return apiClient.post<HomeChef>("/food/home-chefs", data);
  },
  async updateHomeChef(id: number, data: HomeChefRequest): Promise<HomeChef> {
    return apiClient.put<HomeChef>(`/food/home-chefs/${id}`, data);
  },

  // ── Menu ──
  async getMenu(chefId: number, page = 0, size = 20): Promise<FoodPageResponse<HomeChefMenu>> {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    return apiClient.get<FoodPageResponse<HomeChefMenu>>(`/food/home-chefs/${chefId}/menu?${params}`);
  },
  async addMenuItem(chefId: number, data: HomeChefMenuRequest): Promise<HomeChefMenu> {
    return apiClient.post<HomeChefMenu>(`/food/home-chefs/${chefId}/menu`, data);
  },
  async updateMenuItem(chefId: number, itemId: number, data: HomeChefMenuRequest): Promise<HomeChefMenu> {
    return apiClient.put<HomeChefMenu>(`/food/home-chefs/${chefId}/menu/${itemId}`, data);
  },

  // ── Reviews ──
  async getReviews(chefId: number, page = 0, size = 20): Promise<FoodPageResponse<unknown>> {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    return apiClient.get<FoodPageResponse<unknown>>(`/food/home-chefs/${chefId}/reviews?${params}`);
  },

  // ── Payouts ──
  async getPayouts(chefId: number, page = 0, size = 20): Promise<FoodPageResponse<unknown>> {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    return apiClient.get<FoodPageResponse<unknown>>(`/food/home-chefs/${chefId}/payouts?${params}`);
  },
};
