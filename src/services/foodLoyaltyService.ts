import { apiClient } from "./apiClient";
import type {
  LoyaltyProgram, LoyaltyMember, LoyaltyCoupon,
} from "../types/food";

export const foodLoyaltyService = {
  // ── Programs ──
  async getPrograms(): Promise<LoyaltyProgram[]> {
    return apiClient.get<LoyaltyProgram[]>("/food/loyalty/programs");
  },
  async enrollMember(programId: number): Promise<LoyaltyMember> {
    return apiClient.post<LoyaltyMember>(`/food/loyalty/programs/${programId}/enroll`, {});
  },

  // ── Member Info ──
  async getMyInfo(): Promise<LoyaltyMember> {
    return apiClient.get<LoyaltyMember>("/food/loyalty/mine");
  },
  async redeemPoints(points: number, description?: string): Promise<LoyaltyMember> {
    return apiClient.post<LoyaltyMember>("/food/loyalty/redeem", { points, description });
  },

  // ── Coupons ──
  async validateCoupon(code: string): Promise<LoyaltyCoupon> {
    return apiClient.get<LoyaltyCoupon>(`/food/loyalty/coupons/validate?code=${code}`);
  },
  async applyCoupon(code: string, orderId: number): Promise<{ discount: number }> {
    return apiClient.post<{ discount: number }>("/food/loyalty/coupons/apply", { code, orderId });
  },

  // ── Gift Cards ──
  async getGiftCards(): Promise<unknown[]> {
    return apiClient.get<unknown[]>("/food/loyalty/gift-cards");
  },
  async purchaseGiftCard(data: { amount: number; recipientEmail?: string; message?: string }): Promise<unknown> {
    return apiClient.post<unknown>("/food/loyalty/gift-cards", data);
  },
};
