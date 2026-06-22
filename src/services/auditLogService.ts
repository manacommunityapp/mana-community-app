import { apiClient } from "./apiClient";

export interface AuditLogDto {
  id: number;
  userId: number | null;
  action: string;
  module: string;
  entityName: string | null;
  entityId: string | null;
  oldValue: string | null;
  newValue: string | null;
  ipAddress: string | null;
  correlationId: string | null;
  createdAt: string; // ISO LocalDateTime
}

export interface AuditPageResponse {
  content: AuditLogDto[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface AuditStatsResponse {
  eventsToday: number;
  usersCreatedToday: number;
  auctionEventsToday: number;
  permissionChangesToday: number;
  bidsToday: number;
}

export interface AuditLogQuery {
  page?: number;
  size?: number;
  module?: string;
  action?: string;
  userId?: number;
}

export const auditLogService = {
  getAuditLogs(q: AuditLogQuery = {}): Promise<AuditPageResponse> {
    const params = new URLSearchParams();
    params.set("page", String(q.page ?? 0));
    params.set("size", String(q.size ?? 50));
    if (q.module) params.set("module", q.module);
    if (q.action) params.set("action", q.action);
    if (q.userId != null) params.set("userId", String(q.userId));
    return apiClient.get<AuditPageResponse>(`/admin/audit-logs?${params.toString()}`);
  },

  getAuditStats(): Promise<AuditStatsResponse> {
    return apiClient.get<AuditStatsResponse>("/admin/audit-logs/stats");
  },
};

export const AUDIT_MODULES = [
  "USER_MANAGEMENT", "COMMUNITY", "SPORTS", "TOURNAMENT", "AUCTION",
  "MARKETPLACE", "JOBS", "CHAT", "NOTIFICATION", "EVENTS", "ADMIN",
];

export const AUDIT_ACTIONS = [
  "USER_CREATED", "USER_UPDATED", "USER_DELETED", "ROLE_CHANGED", "PERMISSION_CHANGED",
  "PLAYER_REGISTERED", "MATCH_CREATED", "MATCH_UPDATED", "WINNER_DECLARED", "TOURNAMENT_COMPLETED",
  "AUCTION_STARTED", "AUCTION_ENDED", "BID_PLACED", "PLAYER_SOLD", "TEAM_CREATED",
  "PRODUCT_CREATED", "PRODUCT_UPDATED", "PRODUCT_DELETED", "CONFIG_UPDATED",
];
