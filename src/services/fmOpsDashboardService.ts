import { apiClient } from "./common/apiClient";

export interface ComplaintQueueMetrics {
  totalOpen: number;
  overdueCount: number;
  inProgressCount: number;
  resolvedThisMonth: number;
  avgResolutionDays: number;
  byCategory: { category: string; count: number }[];
}

export interface AmenityUtilizationMetrics {
  totalBookingsThisMonth: number;
  avgUtilizationPct: number;
  byAmenity: { amenityName: string; bookings: number; utilizationPct: number }[];
  peakHours: { hour: number; bookings: number }[];
}

export interface DuesCollectionMetrics {
  totalOutstanding: number;
  collectedThisMonth: number;
  collectionRatePct: number;
  overdueResidentCount: number;
  totalResidentCount: number;
  avgDuesPerResident: number;
}

export interface EventPipelineMetrics {
  upcomingThisWeek: number;
  upcomingThisMonth: number;
  pendingApprovals: number;
  registrationsOpen: number;
  totalRsvpsThisMonth: number;
}

export interface SecurityLogMetrics {
  incidentsThisMonth: number;
  unresolvedAlerts: number;
  gateAccessToday: number;
  suspiciousEntries: number;
  recentIncidents: { type: string; description: string; occurredAt: string; severity: string }[];
}

export interface StaffRosterMetrics {
  totalActive: number;
  presentToday: number;
  absentToday: number;
  byRole: { role: string; total: number; presentToday: number }[];
}

export interface BudgetHealthMetrics {
  maintenanceFundBalance: number;
  budgetedMonthlyExpense: number;
  actualMonthlyExpense: number;
  variancePct: number;
  fundHealthPct: number;
  projectedRunwayMonths: number;
  topExpenses: { category: string; amount: number; pctOfTotal: number }[];
}

export interface FmOpsDashboardSnapshot {
  communityId: number;
  capturedAt: string;
  complaintQueue: ComplaintQueueMetrics;
  amenityUtilization: AmenityUtilizationMetrics;
  duesCollection: DuesCollectionMetrics;
  eventPipeline: EventPipelineMetrics;
  securityLog: SecurityLogMetrics;
  staffRoster: StaffRosterMetrics;
  budgetHealth: BudgetHealthMetrics;
}

export const fmOpsDashboardService = {
  getSnapshot(communityId: number): Promise<FmOpsDashboardSnapshot> {
    return apiClient.get<FmOpsDashboardSnapshot>(`/api/fm/dashboard/snapshot?communityId=${communityId}`);
  },
};
