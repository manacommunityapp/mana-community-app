import { apiClient } from "../common/apiClient";

export interface AdminDashboardStats {
  totalUsers: number;
  pendingKycCount: number;
  verifiedUsersCount: number;
  totalRolesCount: number;
  totalCommunitiesCount: number;
  activeVisitorsCount: number;
  openTicketsCount: number;
  inProgressTicketsCount: number;
  activeVendorsCount: number;
  pendingWorkOrdersCount: number;
  pendingExpensesCount: number;
  totalBookingResourcesCount: number;
  pendingContentReportsCount: number;
  activeEventsCount: number;
  activeNoticesCount: number;
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
