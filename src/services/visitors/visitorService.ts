import { apiClient } from "../common/apiClient";

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
  photoUrl?: string | null;
  photoCapturedAt?: string | null;
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

  async leaveAtGate(id: number): Promise<VisitorPassResponse> {
    return apiClient.put<VisitorPassResponse>(`/visitors/${id}/leave-at-gate`, {});
  },

  async reject(id: number): Promise<VisitorPassResponse> {
    return apiClient.put<VisitorPassResponse>(`/visitors/${id}/reject`, {});
  },
<<<<<<< HEAD

  // ── Whitelist ────────────────────────────────────────────────
  async getWhitelist(): Promise<WhitelistEntry[]> {
    return apiClient.get<WhitelistEntry[]>("/visitors/whitelist");
  },

  async addToWhitelist(data: WhitelistRequest): Promise<WhitelistEntry> {
    return apiClient.post<WhitelistEntry>("/visitors/whitelist", data);
  },

  async updateWhitelistEntry(id: number, data: WhitelistRequest): Promise<WhitelistEntry> {
    return apiClient.put<WhitelistEntry>(`/visitors/whitelist/${id}`, data);
  },

  async removeFromWhitelist(id: number): Promise<void> {
    return apiClient.delete(`/visitors/whitelist/${id}`);
  },

  async toggleWhitelistStatus(id: number, isActive: boolean): Promise<WhitelistEntry> {
    return apiClient.patch<WhitelistEntry>(`/visitors/whitelist/${id}/status`, { isActive });
  },

  // ── Group Invites ────────────────────────────────────────────
  async getGroupInvites(): Promise<GroupInvite[]> {
    return apiClient.get<GroupInvite[]>("/visitors/group-invites");
  },

  async createGroupInvite(data: CreateGroupInviteRequest): Promise<GroupInvite> {
    return apiClient.post<GroupInvite>("/visitors/group-invites", data);
  },

  async cancelGroupInvite(id: number): Promise<void> {
    return apiClient.delete(`/visitors/group-invites/${id}`);
  },

  async addGroupGuest(id: number, guest: GroupGuest): Promise<GroupInvite> {
    return apiClient.post<GroupInvite>(`/visitors/group-invites/${id}/guests`, guest);
  },
};

export interface WhitelistEntry {
  id: number;
  name: string;
  phone?: string;
  category?: string;
  vehicleNumber?: string;
  notes?: string;
  isActive: boolean;
  createdAt?: string;
}

export interface WhitelistRequest {
  name: string;
  phone?: string;
  category?: string;
  vehicleNumber?: string;
  notes?: string;
}

export interface GroupGuest {
  name: string;
  phone?: string;
  vehicleNumber?: string;
}

export interface GroupInvite {
  id: number;
  title: string;
  eventDate?: string;
  passCode: string;
  status: string;
  guests?: GroupGuest[];
  createdAt?: string;
}

export interface CreateGroupInviteRequest {
  title: string;
  eventDate?: string;
  startTime?: string;
  endTime?: string;
  guests?: GroupGuest[];
}
=======
};
>>>>>>> 9020008 (Merge pull request #323 from manacommunityapp/feat/menu-verification-and-hybrid-permissions)
