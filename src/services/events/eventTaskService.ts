import { apiClient } from "../common/apiClient";

export interface EventTaskResponse {
  id: number;
  eventId: number;
  eventTitle: string;
  title: string;
  description: string | null;
  phase: string | null;
  priority: string;
  assigneeName: string | null;
  assigneeId: number | null;
  dueDate: string | null;
  done: boolean;
  createdAt: string;
}

export interface EventTaskRequest {
  eventId: number;
  title: string;
  description?: string;
  phase?: string;
  priority?: string;
  assigneeName?: string;
  assigneeId?: number;
  dueDate?: string;
}

export const eventTaskService = {
  async getAll(eventId?: number): Promise<EventTaskResponse[]> {
    const qs = eventId ? `?eventId=${eventId}` : "";
    return apiClient.get<EventTaskResponse[]>(`/events/tasks${qs}`);
  },

  async create(data: EventTaskRequest): Promise<EventTaskResponse> {
    return apiClient.post<EventTaskResponse>("/events/tasks", data);
  },

  async update(id: number, data: EventTaskRequest): Promise<EventTaskResponse> {
    return apiClient.put<EventTaskResponse>(`/events/tasks/${id}`, data);
  },

  async toggleDone(id: number): Promise<EventTaskResponse> {
    return apiClient.put<EventTaskResponse>(`/events/tasks/${id}/toggle`, {});
  },

  async deleteTask(id: number): Promise<void> {
    await apiClient.delete<void>(`/events/tasks/${id}`);
  },
};
