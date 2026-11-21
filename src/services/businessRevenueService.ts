import { apiClient } from "./common/apiClient";

export interface ModuleMargin {
  module: string;
  revenue: number;
  cost: number;
  contributionMargin: number;
  marginPct: number;
}

export interface BusinessRevenueSnapshot {
  asOf: string;
  periodStart: string;
  periodEnd: string;
  activePayingCommunities: number;
  totalCommunities: number;
  communityActivationRatePct: number;
  monthlyRecurringRevenue: number;
  mrrGrowthPct: number;
  grossMerchandiseValue: number;
  gmvGrowthPct: number;
  commissionRevenue: number;
  commissionMarginPct: number;
  activeVendors: number;
  newVendorsThisMonth: number;
  completedOrders: number;
  completedBookings: number;
  paymentFailureRatePct: number;
  failedPayments: number;
  totalPayments: number;
  refundRatePct: number;
  totalRefundedAmount: number;
  repeatPurchaseRatePct: number;
  repeatBuyers: number;
  totalBuyers: number;
  avgSettlementDelayDays: number;
  overdueSettlements: number;
  moduleMargins: ModuleMargin[];
}

export async function fetchBusinessRevenueSnapshot(): Promise<BusinessRevenueSnapshot> {
  const res = await apiClient.get<{ data: BusinessRevenueSnapshot }>("/api/platform/revenue/snapshot");
  return res.data;
}

export async function refreshBusinessRevenueSnapshot(): Promise<BusinessRevenueSnapshot> {
  const res = await apiClient.post<{ data: BusinessRevenueSnapshot }>("/api/platform/revenue/snapshot/refresh");
  return res.data;
}
