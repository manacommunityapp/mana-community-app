import { apiClient } from "./common/apiClient";

export interface DuesStatus {
  outstanding: number;
  nextDueDate?: string;
  nextDueAmount?: number;
  overdueCount: number;
  paymentHistory: { amount: number; date: string; status: string }[];
}

export interface HouseholdSummary {
  flatNumber: string;
  familyMemberCount: number;
  vehicleCount: number;
  staffCount: number;
  pendingVisitorRequests: number;
}

export interface ActiveRequests {
  openComplaints: number;
  inProgressComplaints: number;
  pendingServiceRequests: number;
  mostRecentComplaint?: { title: string; status: string; daysOpen: number };
}

export interface UpcomingBookings {
  confirmed: { amenityName: string; date: string; slot: string }[];
  pendingApproval: number;
}

export interface WalletSummary {
  balance: number;
  creditAvailable: number;
  lastTransactionAmount?: number;
  lastTransactionDate?: string;
  lastTransactionType?: string;
}

export interface CommunityPulse {
  activePolls: number;
  upcomingEvents: number;
  communityAnnouncements: number;
  maintenanceFundHealthPct: number;
}

export interface RecentActivityItem {
  type: string;
  title: string;
  timestamp: string;
}

export interface KycStatus {
  isVerified: boolean;
  verificationMethod?: string;
  expiresAt?: string;
}

export interface ResidentDashboardSnapshot {
  residentId: number;
  communityId: number;
  residentName: string;
  flatNumber: string;
  capturedAt: string;
  dues: DuesStatus;
  household: HouseholdSummary;
  activeRequests: ActiveRequests;
  bookings: UpcomingBookings;
  wallet: WalletSummary;
  communityPulse: CommunityPulse;
  recentActivity: RecentActivityItem[];
  kyc: KycStatus;
}

export const residentDashboardService = {
  getSnapshot(communityId: number): Promise<ResidentDashboardSnapshot> {
    return apiClient.get<ResidentDashboardSnapshot>(
      `/api/resident/dashboard/snapshot?communityId=${communityId}`
    );
  },

  refreshSnapshot(communityId: number): Promise<void> {
    return apiClient.post(`/api/resident/dashboard/refresh?communityId=${communityId}`, {});
  },
};
