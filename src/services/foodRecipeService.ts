import { apiClient } from "./apiClient";
import type {
  FoodRecipe, RecipeRequest, FoodPageResponse,
} from "../types/food";

export const foodRecipeService = {
  // ── Recipes ──
  async getRecipes(page = 0, size = 20, search?: string): Promise<FoodPageResponse<FoodRecipe>> {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (search) params.set("search", search);
    return apiClient.get<FoodPageResponse<FoodRecipe>>(`/food/recipes?${params}`);
  },
  async getRecipeById(id: number): Promise<FoodRecipe> {
    return apiClient.get<FoodRecipe>(`/food/recipes/${id}`);
  },
  async getMyRecipes(page = 0, size = 20): Promise<FoodPageResponse<FoodRecipe>> {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    return apiClient.get<FoodPageResponse<FoodRecipe>>(`/food/recipes/mine?${params}`);
  },
  async createRecipe(data: RecipeRequest): Promise<FoodRecipe> {
    return apiClient.post<FoodRecipe>("/food/recipes", data);
  },
  async updateRecipe(id: number, data: RecipeRequest): Promise<FoodRecipe> {
    return apiClient.put<FoodRecipe>(`/food/recipes/${id}`, data);
  },
  async deleteRecipe(id: number): Promise<void> {
    await apiClient.delete<void>(`/food/recipes/${id}`);
  },

  // ── Ratings ──
  async rateRecipe(id: number, rating: number, review?: string): Promise<void> {
    await apiClient.post<void>(`/food/recipes/${id}/rate`, { rating, review });
  },

  // ── Collections ──
  async getCollections(): Promise<unknown[]> {
    return apiClient.get<unknown[]>("/food/recipes/collections");
  },
  async createCollection(data: { name: string; description?: string }): Promise<unknown> {
    return apiClient.post<unknown>("/food/recipes/collections", data);
  },
  async addToCollection(collectionId: number, recipeId: number): Promise<void> {
    await apiClient.post<void>(`/food/recipes/collections/${collectionId}/recipes/${recipeId}`);
  },

  // ── Comments ──
  async getComments(recipeId: number, page = 0, size = 20): Promise<FoodPageResponse<unknown>> {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    return apiClient.get<FoodPageResponse<unknown>>(`/food/recipes/${recipeId}/comments?${params}`);
  },
  async addComment(recipeId: number, text: string): Promise<unknown> {
    return apiClient.post<unknown>(`/food/recipes/${recipeId}/comments`, { text });
  },
};
