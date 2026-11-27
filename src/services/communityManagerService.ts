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
  ownerCount: number;
  tenantCount: number;
}

export interface EventAttendanceStats {
  upcomingEventsCount: number;
  totalRsvpsThisMonth: number;
  actualAttendeesThisMonth: number;
  avgAttendanceRatePct: number;
}

export interface VendorContractStats {
  activeVendors: number;
  contractsExpiringIn30Days: number;
  contractsExpired: number;
}

export interface EngagementStats {
  activeUsersThisMonth: number;
  pollParticipantsThisMonth: number;
  eventRsvpsThisMonth: number;
  engagementScorePct: number;
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
  eventAttendance: EventAttendanceStats;
  vendorContracts: VendorContractStats;
  engagement: EngagementStats;
}

/** Standard API response envelope: { success, data, message, correlationId, timestamp }. */
interface ApiEnvelope<T> {
  success?: boolean;
  data?: T | null;
  message?: string;
}

/**
 * Unwraps the API envelope, surfacing `success: false` and a missing payload as errors
 * instead of returning the envelope itself (which leaves every field `undefined`).
 */
async function unwrap<T>(request: Promise<ApiEnvelope<T>>): Promise<T> {
  const res = await request;
  if (res?.success === false) {
    throw new Error(res.message || "Request failed");
  }
  const data = res?.data;
  if (data === undefined || data === null) {
    throw new Error(res?.message || "Malformed API response: missing data payload");
  }
  return data;
}

export const communityManagerService = {
  getSnapshot(communityId: number): Promise<CommunityManagerSnapshot> {
    return unwrap(
      apiClient.get<ApiEnvelope<CommunityManagerSnapshot>>(
        `/api/community/${communityId}/manager/snapshot`
      )
    );
  },
  async refreshSnapshot(communityId: number): Promise<void> {
    const res = await apiClient.post<ApiEnvelope<unknown>>(
      `/api/community/${communityId}/manager/snapshot/refresh`,
      {}
    );
    if (res?.success === false) {
      throw new Error(res.message || "Snapshot refresh failed");
    }
  },
  getMetricTrend(
    communityId: number,
    metric: string,
    days: number
  ): Promise<{ date: string; value: number }[]> {
    return unwrap(
      apiClient.get<ApiEnvelope<{ date: string; value: number }[]>>(
        `/api/community/${communityId}/manager/metrics/${metric}?days=${days}`
      )
    );
  },
};
