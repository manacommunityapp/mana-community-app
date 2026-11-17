import { apiClient } from "../common/apiClient";

export interface GatewayBreakdown {
  gateway: string;
  count: number;
  amount: number;
  successRate: number;
}

export interface ModuleBreakdown {
  referenceType: string;
  count: number;
  amount: number;
}

export interface DailyTrend {
  date: string;
  count: number;
  amount: number;
}

export interface PaymentAnalytics {
  totalOrders: number;
  totalSuccessful: number;
  totalFailed: number;
  successRate: number;
  totalAmount: number;
  totalRefunded: number;
  breakdownByGateway: GatewayBreakdown[];
  breakdownByModule: ModuleBreakdown[];
  dailyTrend: DailyTrend[];
}

export const paymentAnalyticsService = {
  async getAnalytics(params: {
    communityId: number;
    from: string;
    to: string;
  }): Promise<PaymentAnalytics> {
    const q = new URLSearchParams({
      communityId: String(params.communityId),
      from: params.from,
      to: params.to,
    });
    return apiClient.get<PaymentAnalytics>(`/admin/payments/analytics?${q}`);
  },
};
