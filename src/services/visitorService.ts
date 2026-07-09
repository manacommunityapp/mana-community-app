import { apiClient } from "./apiClient";

export interface VisitorPassResponse {
  id: number;
  passCode: string;
  visitorName: string;
  visitorPhone: string;
  vehicleNumber: string;
  purpose: string;
  passType: string;
  status: string;
  expectedAt: string | null;
  checkedInAt: string | null;
  checkedOutAt: string | null;
  flatNumber: string;
  residentId: number;
  residentName: string;
  communityId: number;
  createdAt: string;
}

export interface VisitorPassRequest {
  visitorName: string;
  visitorPhone?: string;
  vehicleNumber?: string;
  purpose?: string;
  passType?: string;
  expectedAt?: string;
  flatNumber?: string;
}

export const visitorService = {
  async getCommunityPasses(): Promise<VisitorPassResponse[]> {
    return apiClient.get<VisitorPassResponse[]>("/visitors");
  },

  async getActivePasses(): Promise<VisitorPassResponse[]> {
    return apiClient.get<VisitorPassResponse[]>("/visitors/active");
  },

  async getTodaysPasses(): Promise<VisitorPassResponse[]> {
    return apiClient.get<VisitorPassResponse[]>("/visitors/today");
  },

  async getMyPasses(): Promise<VisitorPassResponse[]> {
    return apiClient.get<VisitorPassResponse[]>("/visitors/mine");
  },

  async getByPassCode(code: string): Promise<VisitorPassResponse> {
    return apiClient.get<VisitorPassResponse>(`/visitors/code/${code}`);
  },

  async getById(id: number): Promise<VisitorPassResponse> {
    return apiClient.get<VisitorPassResponse>(`/visitors/${id}`);
  },

  async create(data: VisitorPassRequest): Promise<VisitorPassResponse> {
    return apiClient.post<VisitorPassResponse>("/visitors", data);
  },

  async checkIn(id: number): Promise<VisitorPassResponse> {
    return apiClient.put<VisitorPassResponse>(`/visitors/${id}/check-in`, {});
  },

  async checkInByCode(code: string): Promise<VisitorPassResponse> {
    return apiClient.put<VisitorPassResponse>(`/visitors/code/${code}/check-in`, {});
  },

  async checkOut(id: number): Promise<VisitorPassResponse> {
    return apiClient.put<VisitorPassResponse>(`/visitors/${id}/check-out`, {});
  },

  async reject(id: number): Promise<void> {
    await apiClient.put<void>(`/visitors/${id}/reject`, {});
  },
};
