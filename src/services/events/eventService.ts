import { apiClient } from "../common/apiClient";

export interface EventResponse {
  id: number;
  title: string;
  description: string;
  type: string;
  startDate: string;
  endDate: string | null;
  startTime: string | null;
  endTime: string | null;
  locationType: string;
  location: string;
  priceType: string;
  price: number | null;
  capacity: number | null;
  imageUrl: string | null;
  organizerName: string;
  organizerContact: string;
  createdById: number;
  createdByName: string;
  communityId: number;
  attendees: number;
  isRegistered: boolean;
  createdAt: string;
}

export interface EventRequest {
  title: string;
  description?: string;
  type?: string;
  startDate: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  locationType?: string;
  location?: string;
  priceType?: string;
  price?: number;
  capacity?: number;
  imageUrl?: string;
  organizerName?: string;
  organizerContact?: string;
}

export interface DashboardStatsResponse {
  totalEvents: number;
  upcomingEvents: number;
  totalRegistrations: number;
  totalVolunteers: number;
  totalRevenue: number;
  totalExpenses: number;
}

export interface RegistrationResponse {
  id: number;
  eventId: number;
  eventTitle: string;
  userId: number;
  userName: string;
  userEmail: string;
  status: string;
  registeredAt: string;
}

export const eventService = {
  async getUpcomingEvents(type?: string): Promise<EventResponse[]> {
    const qs = type && type !== "All" ? `?type=${type}` : "";
    return apiClient.get<EventResponse[]>(`/events${qs}`);
  },

  async getAllEvents(): Promise<EventResponse[]> {
    return apiClient.get<EventResponse[]>("/events/all");
  },

  async getMyEvents(): Promise<EventResponse[]> {
    return apiClient.get<EventResponse[]>("/events/mine");
  },

  async getById(id: number): Promise<EventResponse> {
    return apiClient.get<EventResponse>(`/events/${id}`);
  },

  async create(data: EventRequest): Promise<EventResponse> {
    return apiClient.post<EventResponse>("/events", data);
  },

  async update(id: number, data: EventRequest): Promise<EventResponse> {
    return apiClient.put<EventResponse>(`/events/${id}`, data);
  },

  async deleteEvent(id: number): Promise<void> {
    await apiClient.delete<void>(`/events/${id}`);
  },

  async register(id: number): Promise<EventResponse> {
    return apiClient.post<EventResponse>(`/events/${id}/register`, {});
  },

  async unregister(id: number): Promise<EventResponse> {
    return apiClient.delete<EventResponse>(`/events/${id}/register`);
  },

  async getDashboardStats(): Promise<DashboardStatsResponse> {
    return apiClient.get<DashboardStatsResponse>("/events/dashboard/stats");
  },

  async getEventRegistrations(eventId: number): Promise<RegistrationResponse[]> {
    return apiClient.get<RegistrationResponse[]>(`/events/${eventId}/registrations`);
  },

  async confirmRegistration(regId: number): Promise<RegistrationResponse> {
    return apiClient.put<RegistrationResponse>(`/events/registrations/${regId}/confirm`, {});
  },

  async rejectRegistration(regId: number): Promise<RegistrationResponse> {
    return apiClient.put<RegistrationResponse>(`/events/registrations/${regId}/reject`, {});
  },
};
