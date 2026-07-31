import { apiClient } from "./apiClient";
import type {
  ResidentFoodProfile, FoodProfileRequest, FoodAllergy, FoodGoal, MenuItem,
} from "../types/food";

export const foodProfileService = {
  // ── Profile ──
  async getProfile(): Promise<ResidentFoodProfile> {
    return apiClient.get<ResidentFoodProfile>("/food/profile");
  },
  async updateProfile(data: FoodProfileRequest): Promise<ResidentFoodProfile> {
    return apiClient.put<ResidentFoodProfile>("/food/profile", data);
  },

  // ── Allergies ──
  async getAllergies(): Promise<FoodAllergy[]> {
    return apiClient.get<FoodAllergy[]>("/food/profile/allergies");
  },
  async addAllergy(data: { allergyName: string; severity: string; notes?: string }): Promise<FoodAllergy> {
    return apiClient.post<FoodAllergy>("/food/profile/allergies", data);
  },
  async removeAllergy(id: number): Promise<void> {
    await apiClient.delete<void>(`/food/profile/allergies/${id}`);
  },

  // ── Favorites ──
  async getFavorites(): Promise<MenuItem[]> {
    return apiClient.get<MenuItem[]>("/food/profile/favorites");
  },
  async addFavorite(itemId: number): Promise<void> {
    await apiClient.post<void>(`/food/profile/favorites/${itemId}`);
  },
  async removeFavorite(itemId: number): Promise<void> {
    await apiClient.delete<void>(`/food/profile/favorites/${itemId}`);
  },

  // ── Goals ──
  async getGoals(): Promise<FoodGoal[]> {
    return apiClient.get<FoodGoal[]>("/food/profile/goals");
  },
};
