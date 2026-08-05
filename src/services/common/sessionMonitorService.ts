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

export interface SessionStatsResponse {
  activeSessions: number;
  loginsToday: number;
}

export const sessionMonitorService = {
  getSessions(limit = 50): Promise<SessionDto[]> {
    return apiClient.get<SessionDto[]>(`/admin/sessions?limit=${limit}`);
  },
  getSessionStats(): Promise<SessionStatsResponse> {
    return apiClient.get<SessionStatsResponse>("/admin/sessions/stats");
  },
};
