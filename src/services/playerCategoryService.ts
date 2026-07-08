import { apiClient } from "./apiClient";
import type { PlayerCategory } from "../types/api";

export const playerCategoryService = {
  /** GET /api/player-categories — all player categories */
  async getCategories(): Promise<PlayerCategory[]> {
    return apiClient.get<PlayerCategory[]>("/player-categories");
  },

  async createCategory(category: Omit<PlayerCategory, "id">): Promise<PlayerCategory> {
    return apiClient.post<PlayerCategory>("/player-categories", category);
  },

  async updateCategory(id: number, category: Omit<PlayerCategory, "id">): Promise<PlayerCategory> {
    return apiClient.put<PlayerCategory>(`/player-categories/${id}`, category);
  },

  async deleteCategory(id: number): Promise<void> {
    return apiClient.delete(`/player-categories/${id}`);
  },
};
