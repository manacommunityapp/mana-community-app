import { apiClient } from "../common/apiClient";

export interface GuardProfileResponse {
  id: number;
  fullName: string;
  phone: string | null;
  employeeId: string | null;
  assignedGate: string | null;
  userId: number | null;
  userName: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
}

export interface GuardProfileRequest {
  fullName: string;
  phone?: string;
  employeeId?: string;
  assignedGate?: string;
  userId?: number | null;
  notes?: string;
}

export interface GuardShiftResponse {
  id: number;
  guardId: number;
  guardName: string;
  shiftDate: string;
  startTime: string;
  endTime: string;
  gate: string | null;
  status: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  notes: string | null;
  createdAt: string;
}

export interface GuardShiftRequest {
  guardId: number;
  shiftDate: string;
  startTime: string;
  endTime: string;
  gate?: string;
  notes?: string;
}

export const guardService = {
  async getGuards(): Promise<GuardProfileResponse[]> {
    return apiClient.get<GuardProfileResponse[]>("/guards");
  },

  async getActiveGuards(): Promise<GuardProfileResponse[]> {
    return apiClient.get<GuardProfileResponse[]>("/guards/active");
  },

  async createGuard(data: GuardProfileRequest): Promise<GuardProfileResponse> {
    return apiClient.post<GuardProfileResponse>("/guards", data);
  },

  async updateGuard(id: number, data: GuardProfileRequest): Promise<GuardProfileResponse> {
    return apiClient.put<GuardProfileResponse>(`/guards/${id}`, data);
  },

  async updateGuardStatus(id: number, status: string): Promise<GuardProfileResponse> {
    return apiClient.patch<GuardProfileResponse>(`/guards/${id}/status?status=${status}`, {});
  },

  async deleteGuard(id: number): Promise<void> {
    return apiClient.delete(`/guards/${id}`);
  },

  async getShifts(date: string): Promise<GuardShiftResponse[]> {
    return apiClient.get<GuardShiftResponse[]>(`/guards/shifts?date=${date}`);
  },

  async getShiftsByRange(from: string, to: string): Promise<GuardShiftResponse[]> {
    return apiClient.get<GuardShiftResponse[]>(`/guards/shifts/range?from=${from}&to=${to}`);
  },

  async getGuardShifts(guardId: number): Promise<GuardShiftResponse[]> {
    return apiClient.get<GuardShiftResponse[]>(`/guards/${guardId}/shifts`);
  },

  async createShift(data: GuardShiftRequest): Promise<GuardShiftResponse> {
    return apiClient.post<GuardShiftResponse>("/guards/shifts", data);
  },

  async updateShift(id: number, data: GuardShiftRequest): Promise<GuardShiftResponse> {
    return apiClient.put<GuardShiftResponse>(`/guards/shifts/${id}`, data);
  },

  async checkInShift(id: number): Promise<GuardShiftResponse> {
    return apiClient.post<GuardShiftResponse>(`/guards/shifts/${id}/check-in`, {});
  },

  async checkOutShift(id: number): Promise<GuardShiftResponse> {
    return apiClient.post<GuardShiftResponse>(`/guards/shifts/${id}/check-out`, {});
  },

  async deleteShift(id: number): Promise<void> {
    return apiClient.delete(`/guards/shifts/${id}`);
  },
};
