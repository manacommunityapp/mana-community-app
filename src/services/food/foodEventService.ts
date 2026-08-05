import { apiClient } from "../common/apiClient";
import type {
  FoodEvent, FoodEventRequest, FoodEventRegistration, FoodPageResponse,
} from "../../types/food";

export const foodEventService = {
  // ── Events ──
  async getEvents(page = 0, size = 20, status?: string): Promise<FoodPageResponse<FoodEvent>> {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (status) params.set("status", status);
    return apiClient.get<FoodPageResponse<FoodEvent>>(`/food/events?${params}`);
  },
  async getEventById(id: number): Promise<FoodEvent> {
    return apiClient.get<FoodEvent>(`/food/events/${id}`);
  },
  async createEvent(data: FoodEventRequest): Promise<FoodEvent> {
    return apiClient.post<FoodEvent>("/food/events", data);
  },
  async updateEvent(id: number, data: FoodEventRequest): Promise<FoodEvent> {
    return apiClient.put<FoodEvent>(`/food/events/${id}`, data);
  },

  // ── Registrations ──
  async registerForEvent(eventId: number, data: { guests?: number; dietaryRequirements?: string; contributionItem?: string }): Promise<FoodEventRegistration> {
    return apiClient.post<FoodEventRegistration>(`/food/events/${eventId}/register`, data);
  },
  async getRegistrations(eventId: number): Promise<FoodEventRegistration[]> {
    return apiClient.get<FoodEventRegistration[]>(`/food/events/${eventId}/registrations`);
  },
  async checkInAttendee(eventId: number, registrationId: number): Promise<FoodEventRegistration> {
    return apiClient.put<FoodEventRegistration>(`/food/events/${eventId}/registrations/${registrationId}/check-in`, {});
  },
  async addContribution(eventId: number, registrationId: number, item: string): Promise<FoodEventRegistration> {
    return apiClient.put<FoodEventRegistration>(`/food/events/${eventId}/registrations/${registrationId}/contribution`, { contributionItem: item });
  },
  async submitFeedback(eventId: number, data: { rating: number; comment?: string }): Promise<void> {
    await apiClient.post<void>(`/food/events/${eventId}/feedback`, data);
  },
};
