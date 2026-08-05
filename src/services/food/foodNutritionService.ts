import { apiClient } from "../common/apiClient";
import type {
  Nutritionist, MealPlan, CalorieLog, CalorieLogRequest,
  DailyNutritionSummary, WeightLog,
} from "../../types/food";

export const foodNutritionService = {
  // ── Nutritionists ──
  async getNutritionists(): Promise<Nutritionist[]> {
    return apiClient.get<Nutritionist[]>("/food/nutrition/nutritionists");
  },
  async getNutritionistById(id: number): Promise<Nutritionist> {
    return apiClient.get<Nutritionist>(`/food/nutrition/nutritionists/${id}`);
  },
  async registerNutritionist(data: Partial<Nutritionist>): Promise<Nutritionist> {
    return apiClient.post<Nutritionist>("/food/nutrition/nutritionists", data);
  },
  async bookConsultation(nutritionistId: number, data: { date: string; time: string; notes?: string }): Promise<unknown> {
    return apiClient.post<unknown>(`/food/nutrition/nutritionists/${nutritionistId}/consultations`, data);
  },
  async getMyConsultations(): Promise<unknown[]> {
    return apiClient.get<unknown[]>("/food/nutrition/consultations/mine");
  },

  // ── Meal Plans ──
  async createMealPlan(data: Partial<MealPlan>): Promise<MealPlan> {
    return apiClient.post<MealPlan>("/food/nutrition/meal-plans", data);
  },
  async getMyMealPlans(): Promise<MealPlan[]> {
    return apiClient.get<MealPlan[]>("/food/nutrition/meal-plans/mine");
  },
  async getMealPlanById(id: number): Promise<MealPlan> {
    return apiClient.get<MealPlan>(`/food/nutrition/meal-plans/${id}`);
  },

  // ── Calorie Tracking ──
  async logCalories(data: CalorieLogRequest): Promise<CalorieLog> {
    return apiClient.post<CalorieLog>("/food/nutrition/calories", data);
  },
  async getCalorieLogs(date: string): Promise<CalorieLog[]> {
    return apiClient.get<CalorieLog[]>(`/food/nutrition/calories?date=${date}`);
  },
  async getDailyNutrition(date: string): Promise<DailyNutritionSummary> {
    return apiClient.get<DailyNutritionSummary>(`/food/nutrition/daily-summary?date=${date}`);
  },

  // ── Weight Tracking ──
  async logWeight(data: { date: string; weight: number; unit?: string; bodyFatPct?: number; muscleMass?: number; notes?: string }): Promise<WeightLog> {
    return apiClient.post<WeightLog>("/food/nutrition/weight", data);
  },
  async getWeightHistory(startDate?: string, endDate?: string): Promise<WeightLog[]> {
    const params = new URLSearchParams();
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    const qs = params.toString();
    return apiClient.get<WeightLog[]>(`/food/nutrition/weight${qs ? `?${qs}` : ""}`);
  },

  // ── Water Tracking ──
  async logWater(data: { date: string; amount: number; unit?: string }): Promise<unknown> {
    return apiClient.post<unknown>("/food/nutrition/water", data);
  },
};
