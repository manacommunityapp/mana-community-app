import { apiClient } from "./apiClient";

export interface SessionDto {
  id: number;
  userId: number;
  ipAddress: string | null;
  device: string | null;
  browser: string | null;
  loginAt: string;
  lastActivityAt: string | null;
  logoutAt: string | null;
  status: string; // ACTIVE | LOGGED_OUT | EXPIRED
}

export interface UserSessionDto {
  id: number;
  userId: number;
  ipAddress: string | null;
  device: string | null;
  browser: string | null;
  loginAt: string;
  lastActivityAt: string | null;
  status: string; // ACTIVE | LOGGED_OUT | EXPIRED
  isCurrent?: boolean;
}

export interface SessionStatsResponse {
  activeSessions: number;
  loginsToday: number;
}

export interface SecurityAuditItemDto {
  id: number;
  event: string;
  location: string;
  time: string;
  timestamp?: string;
  iconType: string;
  color: string;
}

export interface PagedAuditResponse {
  content: SecurityAuditItemDto[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export const sessionMonitorService = {
  getSessions(limit = 50): Promise<SessionDto[]> {
    return apiClient.get<SessionDto[]>(`/admin/sessions?limit=${limit}`);
  },
  getSessionStats(): Promise<SessionStatsResponse> {
    return apiClient.get<SessionStatsResponse>("/admin/sessions/stats");
  },
  getMySessions(): Promise<UserSessionDto[]> {
    return apiClient.get<UserSessionDto[]>("/user/sessions");
  },
  revokeMySession(id: number): Promise<{ success: boolean; message: string }> {
    return apiClient.delete<{ success: boolean; message: string }>(`/user/sessions/${id}`);
  },
  revokeOtherSessions(keepSessionId?: number): Promise<{ success: boolean; revokedCount: number; message: string }> {
    const query = keepSessionId ? `?keepSessionId=${keepSessionId}` : "";
    return apiClient.delete<{ success: boolean; revokedCount: number; message: string }>(`/user/sessions/others${query}`);
  },
  async getSecurityAuditLogs(page = 0, size = 5): Promise<PagedAuditResponse> {
    try {
      const res = await apiClient.get<any>(`/user/security-audit?page=${page}&size=${size}`);
      if (res && Array.isArray(res.content)) {
        return res as PagedAuditResponse;
      }
      if (Array.isArray(res)) {
        return {
          content: res,
          page,
          size,
          totalElements: res.length,
          totalPages: Math.max(1, Math.ceil(res.length / size)),
        };
      }
    } catch {
      // fallback
    }
    return {
      content: [],
      page: 0,
      size,
      totalElements: 0,
      totalPages: 1,
    };
  },
};
