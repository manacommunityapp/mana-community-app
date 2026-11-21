import { apiClient } from "../common/apiClient";

export interface BusinessRevenueModuleKpi {
  module: string;
  activeUsers: number;
  orderCount: number;
  grossPaymentVolume: number;
  estimatedDirectCost: number;
  actualCommissionRevenue: number | null;
  actualDirectCost: number | null;
  marginSource: "ACTUAL" | "GMV_PROXY";
}

export interface BusinessRevenueCostCalibration {
  gatewayMdrRate: number;
  perTxnFixedCost: number;
  moduleHostingAllocation: number;
}

export type CommunitySubscriptionStatus = "ACTIVE" | "TRIALING" | "PAST_DUE" | "PAUSED" | "CANCELLED" | "EXPIRED";

export interface CommunitySubscriptionRecord {
  id: number; communityId: number; externalReference: string | null; planCode: string; planName: string;
  recurringAmount: number; billingPeriodMonths: number; status: CommunitySubscriptionStatus;
  currentPeriodStart: string; currentPeriodEnd: string | null;
}

export interface CommunitySubscriptionInput {
  communityId: number; externalReference: string | null; planCode: string; planName: string;
  recurringAmount: number; billingPeriodMonths: number; status: CommunitySubscriptionStatus;
  currentPeriodStart: string; currentPeriodEnd: string | null;
}

export interface BusinessRevenueKpis {
  transactions: { paymentsStarted: number; paymentsSucceeded: number; paymentsFailed: number };
  revenue: { gmv: number; commission: number; subscriptionMrr: number | null; subscribers: number | null };
  business: {
    activePayingCommunities: number | null;
    activeVendors: number;
    completedOrders: number;
    completedBookings: number;
    refundCount: number;
    refundedAmount: number;
    repeatBuyers: number;
    uniqueBuyers: number;
    averageSettlementDelayDays: number | null;
    overdueSettlements: number | null;
    settlementSlaDays: number | null;
  };
  modules: BusinessRevenueModuleKpi[];
  costCalibration?: BusinessRevenueCostCalibration;
  unavailableMetrics: string[];
}

export const moduleContributionProxy = (module: BusinessRevenueModuleKpi) => {
  if (module.marginSource === "ACTUAL") {
    return module.actualCommissionRevenue != null && module.actualCommissionRevenue > 0 && module.actualDirectCost != null
      ? (module.actualCommissionRevenue - module.actualDirectCost) / module.actualCommissionRevenue
      : null;
  }
  return module.grossPaymentVolume > 0
    ? (module.grossPaymentVolume - module.estimatedDirectCost) / module.grossPaymentVolume
    : null;
};

export const businessRevenueService = {
  async getSummary(params: {
    from: string;
    to: string;
    gatewayMdrRate?: number;
    perTxnFixedCost?: number;
    moduleHostingAllocation?: number;
  }): Promise<BusinessRevenueKpis> {
    const query = new URLSearchParams({ from: params.from, to: params.to });
    if (params.gatewayMdrRate != null) query.set("gatewayMdrRate", String(params.gatewayMdrRate));
    if (params.perTxnFixedCost != null) query.set("perTxnFixedCost", String(params.perTxnFixedCost));
    if (params.moduleHostingAllocation != null) query.set("moduleHostingAllocation", String(params.moduleHostingAllocation));
    return apiClient.get<BusinessRevenueKpis>(`/admin/business-revenue/summary?${query}`);
  },
  async listSubscriptions(): Promise<CommunitySubscriptionRecord[]> {
    return apiClient.get<CommunitySubscriptionRecord[]>("/admin/business-revenue/subscriptions");
  },
  async saveSubscription(id: number | null, input: CommunitySubscriptionInput): Promise<CommunitySubscriptionRecord> {
    return id == null
      ? apiClient.post<CommunitySubscriptionRecord>("/admin/business-revenue/subscriptions", input)
      : apiClient.put<CommunitySubscriptionRecord>(`/admin/business-revenue/subscriptions/${id}`, input);
  },
  async upsertModuleFinance(input: {
    moduleCode: string;
    reportDate: string;
    commissionRevenue: number;
    directCost: number;
  }): Promise<unknown> {
    return apiClient.post("/admin/business-revenue/module-finance", input);
  },
};