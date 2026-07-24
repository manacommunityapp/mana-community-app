import { apiClient } from "./apiClient";
import type {
  CorporateAccount, MealCard, FoodPageResponse,
} from "../types/food";

export const foodCorporateService = {
  // ── Accounts ──
  async getAccounts(): Promise<CorporateAccount[]> {
    return apiClient.get<CorporateAccount[]>("/food/corporate/accounts");
  },
  async createAccount(data: Partial<CorporateAccount>): Promise<CorporateAccount> {
    return apiClient.post<CorporateAccount>("/food/corporate/accounts", data);
  },

  // ── Meal Cards ──
  async issueMealCard(accountId: number, data: { userId: number; dailyLimit: number; monthlyLimit: number; validFrom: string; validUntil: string }): Promise<MealCard> {
    return apiClient.post<MealCard>(`/food/corporate/accounts/${accountId}/meal-cards`, data);
  },
  async getMealCards(accountId: number): Promise<MealCard[]> {
    return apiClient.get<MealCard[]>(`/food/corporate/accounts/${accountId}/meal-cards`);
  },
  async getCardTransactions(cardId: number, page = 0, size = 20): Promise<FoodPageResponse<unknown>> {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    return apiClient.get<FoodPageResponse<unknown>>(`/food/corporate/meal-cards/${cardId}/transactions?${params}`);
  },

  // ── Cafeterias ──
  async getCafeterias(accountId: number): Promise<unknown[]> {
    return apiClient.get<unknown[]>(`/food/corporate/accounts/${accountId}/cafeterias`);
  },
  async createCafeteria(accountId: number, data: { name: string; location?: string; capacity?: number }): Promise<unknown> {
    return apiClient.post<unknown>(`/food/corporate/accounts/${accountId}/cafeterias`, data);
  },
  async getCafeteriaMenu(cafeteriaId: number, date?: string): Promise<unknown[]> {
    const params = date ? `?date=${date}` : "";
    return apiClient.get<unknown[]>(`/food/corporate/cafeterias/${cafeteriaId}/menu${params}`);
  },
  async createCateringRequest(accountId: number, data: { eventDate: string; guestCount: number; menuPreferences?: string; budget?: number }): Promise<unknown> {
    return apiClient.post<unknown>(`/food/corporate/accounts/${accountId}/catering-requests`, data);
  },
};
