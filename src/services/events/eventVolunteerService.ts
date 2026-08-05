import { apiClient } from "../common/apiClient";

export interface EventVolunteerResponse {
  id: number;
  eventId: number;
  eventTitle: string;
  userId: number;
  userName: string;
  role: string | null;
  zone: string | null;
  shift: string | null;
  status: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  createdAt: string;
}

export interface EventVolunteerRequest {
  eventId: number;
  userId: number;
  role?: string;
  zone?: string;
  shift?: string;
}

export const eventVolunteerService = {
  async getAll(eventId?: number): Promise<EventVolunteerResponse[]> {
    const qs = eventId ? `?eventId=${eventId}` : "";
    return apiClient.get<EventVolunteerResponse[]>(`/events/volunteers${qs}`);
  },

  async create(data: EventVolunteerRequest): Promise<EventVolunteerResponse> {
    return apiClient.post<EventVolunteerResponse>("/events/volunteers", data);
  },

  async update(id: number, data: EventVolunteerRequest): Promise<EventVolunteerResponse> {
    return apiClient.put<EventVolunteerResponse>(`/events/volunteers/${id}`, data);
  },

  async checkIn(id: number): Promise<EventVolunteerResponse> {
    return apiClient.put<EventVolunteerResponse>(`/events/volunteers/${id}/check-in`, {});
  },

  async checkOut(id: number): Promise<EventVolunteerResponse> {
    return apiClient.put<EventVolunteerResponse>(`/events/volunteers/${id}/check-out`, {});
  },

  async deleteVolunteer(id: number): Promise<void> {
    await apiClient.delete<void>(`/events/volunteers/${id}`);
  },
};
