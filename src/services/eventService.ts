import { apiClient } from "./apiClient";

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
};
