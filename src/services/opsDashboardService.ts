import { apiClient } from "./common/apiClient";

export interface OpsSnapshot {
  communityId: number;
  openComplaints: number;
  overduePaymentsCount: number;
  overduePaymentsAmount: number;
  activeGuards: number;
  totalGuards: number;
  todayVisitors: number;
  staffPresent: number;
  parkingOccupied: number;
  parkingTotal: number;
  asOf: string;
}

export const opsDashboardService = {
  async getSnapshot(communityId: number): Promise<OpsSnapshot> {
    return apiClient.get<OpsSnapshot>(`/api/community/${communityId}/ops/snapshot`);
  },
};
