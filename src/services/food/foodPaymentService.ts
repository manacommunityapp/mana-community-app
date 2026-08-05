import { apiClient } from "../common/apiClient";
import type {
  FoodPaymentInfo, FoodWallet, WalletTransaction, FoodPageResponse,
} from "../../types/food";

export const foodPaymentService = {
  // ── Payments ──
  async getMyPayments(page = 0, size = 20): Promise<FoodPageResponse<FoodPaymentInfo>> {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    return apiClient.get<FoodPageResponse<FoodPaymentInfo>>(`/food/payments/mine?${params}`);
  },

  // ── Wallet ──
  async getWallet(): Promise<FoodWallet> {
    return apiClient.get<FoodWallet>("/food/payments/wallet");
  },
  async creditWallet(userId: number, amount: number, description?: string): Promise<FoodWallet> {
    return apiClient.post<FoodWallet>("/food/payments/wallet/credit", { userId, amount, description });
  },
  async getWalletTransactions(page = 0, size = 20): Promise<FoodPageResponse<WalletTransaction>> {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    return apiClient.get<FoodPageResponse<WalletTransaction>>(`/food/payments/wallet/transactions?${params}`);
  },
};
