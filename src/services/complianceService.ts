import { apiClient } from "./common/apiClient";

export interface GeneratedReport {
  id: number;
  reportType: string;
  reportPeriod: string;
  fileUrl?: string;
  generatedAt: string;
  totalAmount?: number;
  rowCount?: number;
  generatedBy?: string;
  status: "GENERATING" | "READY" | "FAILED";
}

export const REPORT_TYPES = [
  "MAINTENANCE_COLLECTION",
  "EXPENSE_SUMMARY",
  "VENDOR_PAYMENTS",
  "OCCUPANCY_REGISTER",
  "VISITOR_LOG",
  "WATER_USAGE",
  "ELECTRICITY_USAGE",
  "AMENITY_BOOKINGS",
] as const;

export const complianceService = {
  getReports(communityId: number, type?: string): Promise<GeneratedReport[]> {
    const params = type ? `?communityId=${communityId}&type=${type}` : `?communityId=${communityId}`;
    return apiClient.get<GeneratedReport[]>(`/compliance/reports${params}`);
  },

  generateReport(communityId: number, type: string, period: string): Promise<GeneratedReport> {
    return apiClient.post<GeneratedReport>("/compliance/reports/generate", { communityId, type, period });
  },
};
