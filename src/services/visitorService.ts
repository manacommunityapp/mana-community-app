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

  // New fields
  otp?: string;
  otpExpiresAt?: string | null;
  gateIn?: string | null;
  gateOut?: string | null;
  guardIn?: string | null;
  guardOut?: string | null;
  visitorPhoto?: string | null;
  encryptedToken?: string | null;
}

export interface VisitorPassRequest {
  visitorName: string;
  visitorPhone?: string;
  vehicleNumber?: string;
  purpose?: string;
  passType?: string;
  expectedAt?: string;
  flatNumber?: string;
  residentId?: number;
  gate?: string;
  guard?: string;
  visitorPhoto?: string;
}

export interface VisitorAuditLog {
  id: number;
  visitorPassId: number;
  visitorName: string;
  action: string;
  performedBy: string;
  timestamp: string;
  details: string;
}

export interface VisitorAnalytics {
  totalPasses: number;
  currentlyInside: number;
  pendingApprovals: number;
  awaitingEntry: number;
  dailyVisits: Record<string, number>;
  hourlyVisits: Record<number, number>;
  categoryVisits: Record<string, number>;
  topVisitedFlats: Array<{ flat: string; count: number }>;
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

  async getPendingApprovals(): Promise<VisitorPassResponse[]> {
    return apiClient.get<VisitorPassResponse[]>("/visitors/pending");
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

  async createWalkIn(data: VisitorPassRequest): Promise<VisitorPassResponse> {
    return apiClient.post<VisitorPassResponse>("/visitors/walk-in", data);
  },

  async approveWalkIn(id: number): Promise<VisitorPassResponse> {
    return apiClient.put<VisitorPassResponse>(`/visitors/${id}/approve`, {});
  },

  async verifyPass(query: string): Promise<VisitorPassResponse> {
    return apiClient.get<VisitorPassResponse>(`/visitors/verify?query=${encodeURIComponent(query)}`);
  },

  async checkInWithOptions(
    id: number,
    gate?: string,
    guard?: string,
    visitorPhoto?: string
  ): Promise<VisitorPassResponse> {
    let url = `/visitors/${id}/check-in`;
    const params = new URLSearchParams();
    if (gate) params.append("gate", gate);
    if (guard) params.append("guard", guard);
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    return apiClient.put<VisitorPassResponse>(url, { visitorPhoto });
  },

  async checkOutWithOptions(id: number, gate?: string, guard?: string): Promise<VisitorPassResponse> {
    let url = `/visitors/${id}/check-out`;
    const params = new URLSearchParams();
    if (gate) params.append("gate", gate);
    if (guard) params.append("guard", guard);
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    return apiClient.put<VisitorPassResponse>(url, {});
  },

  async getAnalytics(): Promise<VisitorAnalytics> {
    return apiClient.get<VisitorAnalytics>("/visitors/analytics");
  },

  async getAuditLogs(): Promise<VisitorAuditLog[]> {
    return apiClient.get<VisitorAuditLog[]>("/visitors/audit-logs");
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

  async reject(id: number): Promise<VisitorPassResponse> {
    return apiClient.put<VisitorPassResponse>(`/visitors/${id}/reject`, {});
  },
};
