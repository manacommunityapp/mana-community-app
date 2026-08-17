import { apiClient } from "../common/apiClient";

export interface EventDonationResponse {
  id: number;
  eventId: number;
  eventTitle: string;
  donorName: string;
  donorEmail: string | null;
  donorPhone: string | null;
  amount: number;
  paymentMethod: string;
  transactionRef: string | null;
  note: string | null;
  anonymous: boolean;
  recordedByName: string;
  createdAt: string;
}

export interface EventDonationRequest {
  eventId?: number;
  donorName: string;
  donorEmail?: string;
  donorPhone?: string;
  amount: number;
  paymentMethod?: string;
  transactionRef?: string;
  note?: string;
  anonymous?: boolean;
}

export const eventDonationService = {
  async getAll(eventId?: number): Promise<EventDonationResponse[]> {
    const qs = eventId ? `?eventId=${eventId}` : "";
    return apiClient.get<EventDonationResponse[]>(`/events/donations${qs}`);
  },

  async create(data: EventDonationRequest): Promise<EventDonationResponse> {
    return apiClient.post<EventDonationResponse>("/events/donations", data);
  },

  async update(id: number, data: EventDonationRequest): Promise<EventDonationResponse> {
    return apiClient.put<EventDonationResponse>(`/events/donations/${id}`, data);
  },

  async deleteDonation(id: number): Promise<void> {
    await apiClient.delete<void>(`/events/donations/${id}`);
  },
};
