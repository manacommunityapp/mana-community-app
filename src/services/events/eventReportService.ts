import { apiClient, getToken, getStoredUser } from "../common/apiClient";

export interface EventReportResponse {
  eventId: number;
  eventTitle: string;
  totalRegistrations: number;
  generalRegistrationsCount?: number;
  poojaRegistrationsCount?: number;
  activityRegistrationsCount?: number;
  bookingRegistrationsCount?: number;
  mealRegistrationsCount?: number;
  totalVolunteers: number;
  totalDonations: number;
  totalSponsorships: number;
  totalExpenses: number;
  poojaRevenue?: number;
  totalRevenue?: number;
  netRevenue: number;
  totalGalleryItems: number;
  totalTasks: number;
  completedTasks: number;
  totalPrograms: number;
  totalDevoteesHeadcount?: number;
  totalCheckedIn?: number;
}

export interface EventRegistrationReportRow {
  id: string;
  regCode: string;
  category: string;
  activityTitle: string;
  participantName: string;
  email?: string;
  phone?: string;
  gotram?: string;
  devoteeCount: number;
  attendingDevotees?: string;
  eventDate?: string;
  eventTime?: string;
  venue?: string;
  mandap?: string;
  panditName?: string;
  bookingFee?: number;
  paymentStatus?: string;
  paymentMethod?: string;
  transactionId?: string;
  status: string;
  checkedIn?: boolean;
  checkedInAt?: string;
  prasadamMode?: string;
  notes?: string;
  registeredAt?: string;
}

export const eventReportService = {
  async getEventReport(eventId: number): Promise<EventReportResponse> {
    return apiClient.get<EventReportResponse>(`/events/${eventId}/report`);
  },

  async getRegistrationReport(eventId: number, category: string = "all"): Promise<EventRegistrationReportRow[]> {
    return apiClient.get<EventRegistrationReportRow[]>(`/events/${eventId}/report/registrations?category=${encodeURIComponent(category)}`);
  },

  async exportRegistrationReportCsv(eventId: number, category: string = "all"): Promise<Blob> {
    const token = getToken();
    const communityId = getStoredUser()?.communityId;
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    if (communityId) headers["X-Community-Id"] = String(communityId);

    const response = await fetch(`/api/events/${eventId}/report/registrations/export?category=${encodeURIComponent(category)}`, { headers });
    if (!response.ok) {
      if (response.status === 401) throw new Error("Session expired. Please refresh the page and try again.");
      throw new Error(`Failed to export CSV: ${response.statusText}`);
    }
    return response.blob();
  },
};

