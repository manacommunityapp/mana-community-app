import { apiClient } from "../common/apiClient";
import type {
  GroceryStore, GroceryProduct, GroceryCategory, GroceryOrder, GroceryOrderRequest, FoodPageResponse,
} from "../../types/food";

export const foodGroceryService = {
  // ── Stores ──
  async getStores(page = 0, size = 20): Promise<FoodPageResponse<GroceryStore>> {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    return apiClient.get<FoodPageResponse<GroceryStore>>(`/food/grocery/stores?${params}`);
  },
  async getStoreById(id: number): Promise<GroceryStore> {
    return apiClient.get<GroceryStore>(`/food/grocery/stores/${id}`);
  },
  async createStore(data: Partial<GroceryStore>): Promise<GroceryStore> {
    return apiClient.post<GroceryStore>("/food/grocery/stores", data);
  },
  async updateStore(id: number, data: Partial<GroceryStore>): Promise<GroceryStore> {
    return apiClient.put<GroceryStore>(`/food/grocery/stores/${id}`, data);
  },

  // ── Categories ──
  async getCategories(storeId: number): Promise<GroceryCategory[]> {
    return apiClient.get<GroceryCategory[]>(`/food/grocery/stores/${storeId}/categories`);
  },

  // ── Products ──
  async getProducts(storeId: number, page = 0, size = 20, categoryId?: number, search?: string): Promise<FoodPageResponse<GroceryProduct>> {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (categoryId) params.set("categoryId", String(categoryId));
    if (search) params.set("search", search);
    return apiClient.get<FoodPageResponse<GroceryProduct>>(`/food/grocery/stores/${storeId}/products?${params}`);
  },
  async getProductById(storeId: number, productId: number): Promise<GroceryProduct> {
    return apiClient.get<GroceryProduct>(`/food/grocery/stores/${storeId}/products/${productId}`);
  },
  async createProduct(storeId: number, data: Partial<GroceryProduct>): Promise<GroceryProduct> {
    return apiClient.post<GroceryProduct>(`/food/grocery/stores/${storeId}/products`, data);
  },
  async updateProduct(storeId: number, productId: number, data: Partial<GroceryProduct>): Promise<GroceryProduct> {
    return apiClient.put<GroceryProduct>(`/food/grocery/stores/${storeId}/products/${productId}`, data);
  },

  // ── Orders ──
  async placeGroceryOrder(data: GroceryOrderRequest): Promise<GroceryOrder> {
    return apiClient.post<GroceryOrder>("/food/grocery/orders", data);
  },
  async getGroceryOrders(page = 0, size = 20): Promise<FoodPageResponse<GroceryOrder>> {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    return apiClient.get<FoodPageResponse<GroceryOrder>>(`/food/grocery/orders/mine?${params}`);
  },
  async getGroceryOrderById(id: number): Promise<GroceryOrder> {
    return apiClient.get<GroceryOrder>(`/food/grocery/orders/${id}`);
  },
  async updateGroceryOrderStatus(id: number, status: string): Promise<GroceryOrder> {
    return apiClient.patch<GroceryOrder>(`/food/grocery/orders/${id}/status`, { status });
  },

  // ── Delivery Slots ──
  async getDeliverySlots(storeId: number, date: string): Promise<unknown[]> {
    return apiClient.get<unknown[]>(`/food/grocery/stores/${storeId}/delivery-slots?date=${date}`);
  },

  // ── Wishlist ──
  async addToWishlist(productId: number): Promise<void> {
    await apiClient.post<void>(`/food/grocery/wishlist/${productId}`);
  },
  async removeFromWishlist(productId: number): Promise<void> {
    await apiClient.delete<void>(`/food/grocery/wishlist/${productId}`);
  },
};
