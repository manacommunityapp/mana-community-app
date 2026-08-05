import { apiClient } from "../common/apiClient";

export interface EventProgramResponse {
  id: number;
  eventId: number;
  eventTitle: string;
  dayLabel: string | null;
  dayDate: string | null;
  title: string;
  programType: string | null;
  startTime: string | null;
  duration: string | null;
  venue: string | null;
  performer: string | null;
  judge: string | null;
  sortOrder: number;
  createdAt: string;
}

export interface EventProgramRequest {
  eventId: number;
  title: string;
  dayLabel?: string;
  dayDate?: string;
  programType?: string;
  startTime?: string;
  duration?: string;
  venue?: string;
  performer?: string;
  judge?: string;
  sortOrder?: number;
}

export const eventProgramService = {
  async getByEvent(eventId: number, dayLabel?: string): Promise<EventProgramResponse[]> {
    let qs = `?eventId=${eventId}`;
    if (dayLabel) qs += `&dayLabel=${encodeURIComponent(dayLabel)}`;
    return apiClient.get<EventProgramResponse[]>(`/events/programs${qs}`);
  },

  async create(data: EventProgramRequest): Promise<EventProgramResponse> {
    return apiClient.post<EventProgramResponse>("/events/programs", data);
  },

  async update(id: number, data: EventProgramRequest): Promise<EventProgramResponse> {
    return apiClient.put<EventProgramResponse>(`/events/programs/${id}`, data);
  },

  async deleteProgram(id: number): Promise<void> {
    await apiClient.delete<void>(`/events/programs/${id}`);
  },
};
