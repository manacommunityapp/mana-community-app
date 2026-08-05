import { apiClient } from "../common/apiClient";
import type {
  PantryItem, PantryItemRequest, PantryAlert,
  ShoppingList, ShoppingListItem,
} from "../../types/food";

export const foodPantryService = {
  // ── Pantry Items ──
  async getItems(): Promise<PantryItem[]> {
    return apiClient.get<PantryItem[]>("/food/pantry/items");
  },
  async addItem(data: PantryItemRequest): Promise<PantryItem> {
    return apiClient.post<PantryItem>("/food/pantry/items", data);
  },
  async updateItem(id: number, data: PantryItemRequest): Promise<PantryItem> {
    return apiClient.put<PantryItem>(`/food/pantry/items/${id}`, data);
  },
  async consumeItem(id: number, quantity: number): Promise<PantryItem> {
    return apiClient.patch<PantryItem>(`/food/pantry/items/${id}/consume`, { quantity });
  },
  async getExpiringItems(daysAhead = 7): Promise<PantryItem[]> {
    return apiClient.get<PantryItem[]>(`/food/pantry/items/expiring?daysAhead=${daysAhead}`);
  },

  // ── Shopping Lists ──
  async getShoppingLists(): Promise<ShoppingList[]> {
    return apiClient.get<ShoppingList[]>("/food/pantry/shopping-lists");
  },
  async createShoppingList(data: { name: string }): Promise<ShoppingList> {
    return apiClient.post<ShoppingList>("/food/pantry/shopping-lists", data);
  },
  async addShoppingListItem(listId: number, data: Partial<ShoppingListItem>): Promise<ShoppingListItem> {
    return apiClient.post<ShoppingListItem>(`/food/pantry/shopping-lists/${listId}/items`, data);
  },
  async markPurchased(listId: number, itemId: number, purchasedPrice?: number): Promise<ShoppingListItem> {
    return apiClient.patch<ShoppingListItem>(`/food/pantry/shopping-lists/${listId}/items/${itemId}/purchased`, { purchasedPrice });
  },

  // ── Alerts ──
  async getAlerts(): Promise<PantryAlert[]> {
    return apiClient.get<PantryAlert[]>("/food/pantry/alerts");
  },
  async markAlertRead(id: number): Promise<void> {
    await apiClient.patch<void>(`/food/pantry/alerts/${id}/read`, {});
  },
};
