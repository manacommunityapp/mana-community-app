import { apiClient } from "../common/apiClient";

export interface CentralFinanceSummary {
  communityId: number;
  // Cross-module rollups
  totalCollected: number;
  totalOutstanding: number;
  totalExpenses: number;
  totalEscrowHeld: number;
  netPosition: number;
  // CFBOS maintenance billing
  maintenanceTotalBilled: number;
  maintenanceTotalCollected: number;
  maintenanceTotalOutstanding: number;
  maintenanceTotalOverdue: number;
  maintenancePendingInvoices: number;
  maintenanceOverdueInvoices: number;
  // Sports module
  sportsTotalCollected: number;
  sportsEscrowHeld: number;
  sportsEscrowPendingCount: number;
  // Events module
  eventsTotalCollected: number;
  eventsEscrowHeld: number;
  // Marketplace
  marketplaceTotalCollected: number;
  // Resource booking
  resourceBookingTotalCollected: number;
  // Society expenses
  societyApprovedExpenses: number;
  societyPendingApprovals: number;
  // Finance module invoices
  financeInvoicesOutstanding: number;
  financeInvoiceCount: number;
}

export const centralFinanceDashboardService = {
  async getSummary(communityId: number): Promise<CentralFinanceSummary> {
    return apiClient.get<CentralFinanceSummary>(
      `/finance/central/summary?communityId=${communityId}`
    );
  },
};
