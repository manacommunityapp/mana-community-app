import { apiClient } from "../common/apiClient";

export interface EventReportResponse {
  eventId: number;
  eventTitle: string;
  totalRegistrations: number;
  totalVolunteers: number;
  totalDonations: number;
  totalSponsorships: number;
  totalExpenses: number;
  netRevenue: number;
  totalGalleryItems: number;
  totalTasks: number;
  completedTasks: number;
  totalPrograms: number;
}

export const eventReportService = {
  async getEventReport(eventId: number): Promise<EventReportResponse> {
    return apiClient.get<EventReportResponse>(`/events/${eventId}/report`);
  },
};
