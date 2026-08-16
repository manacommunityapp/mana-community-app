import { apiClient } from "../common/apiClient";

export interface TicketTypeItem {
  id?: string;
  name: string;
  price: string | number;
  qty?: string | number;
  description?: string;
}

export interface EventResponse {
  id: number;
  title: string;
  description: string;
  type: string;
  category?: string | null;
  startDate: string;
  endDate: string | null;
  startTime: string | null;
  endTime: string | null;
  locationType: string;
  location: string;
  venue?: string | null;
  city?: string | null;
  visibility?: string | null;
  status?: string | null;
  priceType: string;
  price: number | null;
  capacity: number | null;
  maxAttendees?: number | null;
  imageUrl: string | null;
  organizerName: string;
  organizerContact: string;
  createdById: number;
  createdByName: string;
  communityId: number;
  attendees: number;
  isRegistered: boolean;
  createdAt: string;
  ticketTypes?: TicketTypeItem[];
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
  venue?: string;
  city?: string;
  category?: string;
  status?: string;
  maxAttendees?: number;
  ticketTypes?: TicketTypeItem[];
}

export interface DashboardStatsResponse {
  totalEvents: number;
  upcomingEvents: number;
  totalRegistrations: number;
  totalVolunteers: number;
  totalRevenue: number;
  totalExpenses: number;
  foodPreparedPercentage?: number;
  foodPlatesCount?: number;
  auctionRevenue?: number;
  auctionItemCount?: number;
  todaysScheduleCount?: number;
  todaysDutyCount?: number;
  pendingActionItemsCount?: number;
}

export interface DashboardAnalyticsResponse {
  dailyRegistrations: { day: string; count: number; vip: number }[];
  passCategories: { name: string; value: number; color: string }[];
  todaysScheduleDuty: { time: string; programs: number; volunteers: number }[];
  budgetVsExpenses: { cat: string; budget: number; spent: number }[];
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

export interface PendingActionItemResponse {
  id: string;
  task: string;
  due: string;
  priority: string;
  category: string;
  done: boolean;
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

  async getDashboardAnalytics(): Promise<DashboardAnalyticsResponse> {
    return apiClient.get<DashboardAnalyticsResponse>("/events/dashboard/analytics");
  },

  async getPendingActionItems(): Promise<PendingActionItemResponse[]> {
    return apiClient.get<PendingActionItemResponse[]>("/events/dashboard/pending-actions");
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

  async getPoojaTypes(): Promise<{ id: number; name: string; description?: string }[]> {
    return apiClient.get<{ id: number; name: string; description?: string }[]>("/events/pooja-types");
  },

  async createPoojaType(name: string, description?: string): Promise<{ id: number; name: string; description?: string }> {
    return apiClient.post<{ id: number; name: string; description?: string }>("/events/pooja-types", { name, description });
  },

  async getCulturalCategories(): Promise<{ id: number; name: string; description?: string }[]> {
    return apiClient.get<{ id: number; name: string; description?: string }[]>("/events/cultural-categories");
  },

  async createCulturalCategory(name: string, description?: string): Promise<{ id: number; name: string; description?: string }> {
    return apiClient.post<{ id: number; name: string; description?: string }>("/events/cultural-categories", { name, description });
  },

  async getCulturalPerformanceTypes(): Promise<{ id: number; name: string; description?: string }[]> {
    return apiClient.get<{ id: number; name: string; description?: string }[]>("/events/cultural-performance-types");
  },

  async createCulturalPerformanceType(name: string, description?: string): Promise<{ id: number; name: string; description?: string }> {
    return apiClient.post<{ id: number; name: string; description?: string }>("/events/cultural-performance-types", { name, description });
  },

  async getCompetitionCategories(): Promise<{ id: number; name: string; description?: string }[]> {
    return apiClient.get<{ id: number; name: string; description?: string }[]>("/events/competition-categories");
  },

  async createCompetitionCategory(name: string, description?: string): Promise<{ id: number; name: string; description?: string }> {
    return apiClient.post<{ id: number; name: string; description?: string }>("/events/competition-categories", { name, description });
  },

  async getCompetitionAgeGroups(): Promise<{ id: number; name: string; description?: string }[]> {
    return apiClient.get<{ id: number; name: string; description?: string }[]>("/events/competition-age-groups");
  },

  async createCompetitionAgeGroup(name: string, description?: string): Promise<{ id: number; name: string; description?: string }> {
    return apiClient.post<{ id: number; name: string; description?: string }>("/events/competition-age-groups", { name, description });
  },

  async getPoojaSevas(): Promise<any[]> {
    return apiClient.get<any[]>("/events/pooja-sevas");
  },

  async createPoojaSeva(data: any): Promise<any> {
    return apiClient.post<any>("/events/pooja-sevas", data);
  },

  async getCulturalEvents(): Promise<any[]> {
    return apiClient.get<any[]>("/events/cultural-events");
  },

  async createCulturalEvent(data: any): Promise<any> {
    return apiClient.post<any>("/events/cultural-events", data);
  },

  async getCompetitions(): Promise<any[]> {
    return apiClient.get<any[]>("/events/competitions");
  },

  async createCompetition(data: any): Promise<any> {
    return apiClient.post<any>("/events/competitions", data);
  },

  async getLunchDinners(mainEventId?: number): Promise<any[]> {
    const qs = mainEventId ? `?mainEventId=${mainEventId}` : "";
    return apiClient.get<any[]>(`/events/lunch-dinners${qs}`);
  },

  async createLunchDinner(data: any): Promise<any> {
    return apiClient.post<any>("/events/lunch-dinners", data);
  },

  async updateLunchDinner(id: number, data: any): Promise<any> {
    return apiClient.put<any>(`/events/lunch-dinners/${id}`, data);
  },

  async deleteLunchDinner(id: number): Promise<void> {
    return apiClient.delete<void>(`/events/lunch-dinners/${id}`);
  },
};
