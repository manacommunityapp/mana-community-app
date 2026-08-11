import { apiClient } from "../common/apiClient";

export interface EventDepartmentResponse {
  id: number;
  communityId?: number | null;
  eventId?: number | null;
  name: string;
  headName?: string | null;
  totalTarget: number;
  presentCount: number;
  color: string;
  description?: string | null;
  active: boolean;
  createdAt?: string;
}

export interface EventDepartmentRequest {
  communityId?: number;
  eventId?: number;
  name: string;
  headName?: string;
  totalTarget?: number;
  presentCount?: number;
  color?: string;
  description?: string;
}

export const eventDepartmentService = {
  async getAll(communityId?: number, eventId?: number): Promise<EventDepartmentResponse[]> {
    let qs = "";
    if (eventId) qs = `?eventId=${eventId}`;
    else if (communityId) qs = `?communityId=${communityId}`;
    return apiClient.get<EventDepartmentResponse[]>(`/events/departments${qs}`);
  },

  async create(data: EventDepartmentRequest): Promise<EventDepartmentResponse> {
    return apiClient.post<EventDepartmentResponse>("/events/departments", data);
  },

  async update(id: number, data: EventDepartmentRequest): Promise<EventDepartmentResponse> {
    return apiClient.put<EventDepartmentResponse>(`/events/departments/${id}`, data);
  },

  async deleteDepartment(id: number): Promise<void> {
    await apiClient.delete<void>(`/events/departments/${id}`);
  },
};
