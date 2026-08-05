import { apiClient } from "../common/apiClient";
import type {
  FoodRestaurant, RestaurantRequest, MenuCategory, MenuCategoryRequest,
  MenuItem, MenuItemRequest, FoodPageResponse,
} from "../../types/food";

export const foodRestaurantService = {
  // ── Restaurants ──
  async getRestaurants(page = 0, size = 20, status?: string, search?: string): Promise<FoodPageResponse<FoodRestaurant>> {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (status) params.set("status", status);
    if (search) params.set("search", search);
    return apiClient.get<FoodPageResponse<FoodRestaurant>>(`/food/restaurants?${params}`);
  },
  async getRestaurantById(id: number): Promise<FoodRestaurant> {
    return apiClient.get<FoodRestaurant>(`/food/restaurants/${id}`);
  },
  async getMyRestaurant(): Promise<FoodRestaurant> {
    return apiClient.get<FoodRestaurant>("/food/restaurants/mine");
  },
  async createRestaurant(data: RestaurantRequest): Promise<FoodRestaurant> {
    return apiClient.post<FoodRestaurant>("/food/restaurants", data);
  },
  async updateRestaurant(id: number, data: RestaurantRequest): Promise<FoodRestaurant> {
    return apiClient.put<FoodRestaurant>(`/food/restaurants/${id}`, data);
  },
  async updateRestaurantStatus(id: number, status: string): Promise<FoodRestaurant> {
    return apiClient.patch<FoodRestaurant>(`/food/restaurants/${id}/status`, { status });
  },
  async getFeaturedRestaurants(): Promise<FoodRestaurant[]> {
    return apiClient.get<FoodRestaurant[]>("/food/restaurants/featured");
  },

  // ── Menu Categories ──
  async getMenuCategories(restaurantId: number): Promise<MenuCategory[]> {
    return apiClient.get<MenuCategory[]>(`/food/restaurants/${restaurantId}/categories`);
  },
  async createMenuCategory(restaurantId: number, data: MenuCategoryRequest): Promise<MenuCategory> {
    return apiClient.post<MenuCategory>(`/food/restaurants/${restaurantId}/categories`, data);
  },
  async updateMenuCategory(restaurantId: number, categoryId: number, data: MenuCategoryRequest): Promise<MenuCategory> {
    return apiClient.put<MenuCategory>(`/food/restaurants/${restaurantId}/categories/${categoryId}`, data);
  },
  async deleteMenuCategory(restaurantId: number, categoryId: number): Promise<void> {
    await apiClient.delete<void>(`/food/restaurants/${restaurantId}/categories/${categoryId}`);
  },

  // ── Menu Items ──
  async getMenuItems(restaurantId: number, page = 0, size = 20, categoryId?: number, search?: string): Promise<FoodPageResponse<MenuItem>> {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (categoryId) params.set("categoryId", String(categoryId));
    if (search) params.set("search", search);
    return apiClient.get<FoodPageResponse<MenuItem>>(`/food/restaurants/${restaurantId}/menu?${params}`);
  },
  async getMenuItem(restaurantId: number, itemId: number): Promise<MenuItem> {
    return apiClient.get<MenuItem>(`/food/restaurants/${restaurantId}/menu/${itemId}`);
  },
  async createMenuItem(restaurantId: number, data: MenuItemRequest): Promise<MenuItem> {
    return apiClient.post<MenuItem>(`/food/restaurants/${restaurantId}/menu`, data);
  },
  async updateMenuItem(restaurantId: number, itemId: number, data: MenuItemRequest): Promise<MenuItem> {
    return apiClient.put<MenuItem>(`/food/restaurants/${restaurantId}/menu/${itemId}`, data);
  },
  async toggleAvailability(restaurantId: number, itemId: number): Promise<MenuItem> {
    return apiClient.patch<MenuItem>(`/food/restaurants/${restaurantId}/menu/${itemId}/availability`, {});
  },

  // ── Combos ──
  async getCombos(restaurantId: number): Promise<MenuItem[]> {
    return apiClient.get<MenuItem[]>(`/food/restaurants/${restaurantId}/combos`);
  },
};
