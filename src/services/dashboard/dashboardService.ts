import { apiClient } from "../common/apiClient";

export interface AdminDashboardStats {
  totalUsers: number;
  pendingKycCount: number;
  verifiedUsersCount: number;
  totalRolesCount: number;
  totalCommunitiesCount: number;
  activeVisitorsCount: number;
  expectedVisitorsTodayCount?: number;
  facilityUtilizationPercent?: number | null;
  openTicketsCount: number;
  inProgressTicketsCount: number;
  activeVendorsCount: number;
  pendingWorkOrdersCount: number;
  pendingExpensesCount: number;
  totalBookingResourcesCount: number;
  pendingContentReportsCount: number;
  activeEventsCount: number;
  activeNoticesCount: number;
  residentCount?: number;
  ownerCount?: number;
  tenantCount?: number;
  outstandingInvoiceCount?: number;
  outstandingDuesAmount?: number;
  maintenanceCollectedThisMonthAmount?: number;
  slaBreachedTicketsCount?: number;
  eventAttendanceCount?: number;
  monthlyFacilityBookingsCount?: number;
  activeVendorContractsCount?: number;
  contractsExpiringWithin30DaysCount?: number;
  monthlyApprovedExpenseAmount?: number;
  currentFinancialYearBudgetAmount?: number;
  currentFinancialYearSpentAmount?: number;
  communityPostsLast30DaysCount?: number;
  recentActivities: RecentActivityItem[];
}

export interface RecentActivityItem {
  title: string;
  timestamp: string;
  type: string;
  module: string;
}

export const dashboardService = {
  getAdminStats(): Promise<AdminDashboardStats> {
    return apiClient.get<AdminDashboardStats>("/dashboard/admin/stats");
  },
};
