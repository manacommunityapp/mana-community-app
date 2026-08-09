import { apiClient } from "../common/apiClient";

export interface EventDayResponse {
  id: number;
  label: string;
  sortOrder: number;
}

export interface EventDayRequest {
  label: string;
  sortOrder?: number;
}

export const eventDayService = {
  async getAll(): Promise<EventDayResponse[]> {
    return apiClient.get<EventDayResponse[]>("/events/media-days");
  },

  async create(data: EventDayRequest): Promise<EventDayResponse> {
    return apiClient.post<EventDayResponse>("/events/media-days", data);
  },

  async deleteDay(id: number): Promise<void> {
    await apiClient.delete<void>(`/events/media-days/${id}`);
  },
};
