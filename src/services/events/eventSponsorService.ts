import { apiClient } from "../common/apiClient";

export interface EventSponsorResponse {
  id: number;
  eventId: number;
  eventTitle: string;
  name: string;
  tier: string;
  amountPledged: number | null;
  amountReceived: number | null;
  logoUrl: string | null;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  status: string;
  createdAt: string;
}

export interface EventSponsorRequest {
  eventId?: number;
  name: string;
  tier?: string;
  amountPledged?: number;
  amountReceived?: number;
  logoUrl?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  status?: string;
}

export const eventSponsorService = {
  async getAll(eventId?: number): Promise<EventSponsorResponse[]> {
    const qs = eventId ? `?eventId=${eventId}` : "";
    return apiClient.get<EventSponsorResponse[]>(`/events/sponsors${qs}`);
  },

  async getSponsors(eventId?: number): Promise<EventSponsorResponse[]> {
    return this.getAll(eventId);
  },

  async create(data: EventSponsorRequest): Promise<EventSponsorResponse> {
    return apiClient.post<EventSponsorResponse>("/events/sponsors", data);
  },

  async update(id: number, data: EventSponsorRequest): Promise<EventSponsorResponse> {
    return apiClient.put<EventSponsorResponse>(`/events/sponsors/${id}`, data);
  },

  async deleteSponsor(id: number): Promise<void> {
    await apiClient.delete<void>(`/events/sponsors/${id}`);
  },
};
