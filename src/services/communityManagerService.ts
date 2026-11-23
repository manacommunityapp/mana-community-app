import { apiClient } from "./common/apiClient";

export interface MaintenanceStats {
  openTickets: number;
  overdueTickets: number;
  resolvedLast7Days: number;
  avgResolutionHours: number;
  byCategory: Record<string, number>;
}

export interface FinanceStats {
  collectionRatePct: number;
  outstandingDuesAmount: number;
  collectedThisMonth: number;
  budgetedExpenses: number;
  actualExpenses: number;
  maintenanceFundBalance: number;
  overdueResidents: number;
}

export interface ResidentStats {
  totalResidents: number;
  activeThisMonth: number;
  newJoinersThisMonth: number;
  verifiedKycCount: number;
  occupancyPct: number;
  totalFlats: number;
  occupiedFlats: number;
}

export interface SecurityStats {
  gateEntriesToday: number;
  visitorRequestsPending: number;
  incidentsThisMonth: number;
  watchlistAlerts: number;
}

export interface AmenityStats {
  bookingsToday: number;
  bookingsThisWeek: number;
  utilizationByAmenity: Record<string, number>;
  topBookedAmenity: string;
}

export interface StaffStats {
  staffPresentToday: number;
  totalStaff: number;
  pendingTasks: number;
  vendorsPending: number;
}

export interface UpcomingItems {
  eventsNext7Days: number;
  nextAgmDate?: string;
  pendingNocRequests: number;
  pendingElections: number;
}

export interface GovernanceStats {
  activePolls: number;
  pendingResolutions: number;
  committeePositionsFilled: number;
  totalCommitteePositions: number;
  recentVoteParticipationPct: number;
}

export interface CommunityManagerSnapshot {
  communityId: number;
  communityName: string;
  capturedAt: string;
  maintenance: MaintenanceStats;
  finance: FinanceStats;
  residents: ResidentStats;
  security: SecurityStats;
  amenities: AmenityStats;
  staff: StaffStats;
  upcoming: UpcomingItems;
  governance: GovernanceStats;
}

export const communityManagerService = {
  getSnapshot(communityId: number): Promise<CommunityManagerSnapshot> {
    return apiClient.get<CommunityManagerSnapshot>(
      `/api/community/${communityId}/manager/snapshot`
    );
  },
  refreshSnapshot(communityId: number): Promise<void> {
    return apiClient.post(`/api/community/${communityId}/manager/snapshot/refresh`, {});
  },
  getMetricTrend(
    communityId: number,
    metric: string,
    days: number
  ): Promise<{ date: string; value: number }[]> {
    return apiClient.get(
      `/api/community/${communityId}/manager/metrics/${metric}?days=${days}`
    );
  },
};
