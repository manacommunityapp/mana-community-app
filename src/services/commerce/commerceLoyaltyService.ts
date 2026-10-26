import { apiClient } from "../common/apiClient";

export interface LoyaltyTxnDto {
  id: number;
  type: "EARN" | "REDEEM" | "EXPIRE" | "ADJUST";
  points: number;
  balanceAfter: number;
  description?: string;
  orderNumber?: string;
  createdAt?: string;
}

export interface CommerceLoyaltyDto {
  accountId?: number;
  availablePoints: number;
  totalPointsEarned: number;
  totalPointsSpent: number;
  tier: "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";
  recentTransactions: LoyaltyTxnDto[];
}

export const commerceLoyaltyService = {
  getMyLoyalty(): Promise<CommerceLoyaltyDto> {
    return apiClient.get<CommerceLoyaltyDto>("/commerce/loyalty/my");
  },

  redeemPoints(points: number): Promise<CommerceLoyaltyDto> {
    return apiClient.post<CommerceLoyaltyDto>("/commerce/loyalty/redeem", { points });
  },
};
