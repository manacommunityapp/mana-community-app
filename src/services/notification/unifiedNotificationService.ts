import { apiClient } from "../common/apiClient";

export type NotificationChannel = "IN_APP" | "PUSH" | "EMAIL" | "SMS" | "WHATSAPP";

export type NotificationCategory =
  | "EMERGENCY_SOS"
  | "GATE_ACCESS"
  | "FINANCIAL_BILLING"
  | "HELPDESK_TICKET"
  | "COMMUNITY_NOTICE"
  | "AMENITY_BOOKING"
  | "CHAT_MESSAGE"
  | "GENERAL";

export type NotificationPriority = "CRITICAL" | "HIGH" | "NORMAL" | "LOW";

export type DeliveryStrategy = "ALL_CHANNELS" | "PREFERENCE_BASED" | "FALLBACK_CASCADE";

export type DeliveryStatus =
  | "DELIVERED"
  | "SUPPRESSED_QUIET_HOURS"
  | "FAILED"
  | "OPTED_OUT"
  | "FALLBACK_TRIGGERED"
  | "QUEUED";

export interface NotificationPreferenceDto {
  id?: number;
  category: NotificationCategory;
  channel: NotificationChannel;
  isEnabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  timezone: string;
}

export interface NotificationPreferenceUpdateRequest {
  category: NotificationCategory;
  channel: NotificationChannel;
  isEnabled?: boolean;
  quietHoursEnabled?: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  timezone?: string;
}

export interface UnifiedNotificationRequest {
  recipientUserId: number;
  category: NotificationCategory;
  priority?: NotificationPriority;
  strategy?: DeliveryStrategy;
  explicitChannels?: NotificationChannel[];
  title: string;
  body: string;
  data?: Record<string, unknown>;
  actionUrl?: string;
}

export interface ChannelDeliveryReport {
  channel: NotificationChannel;
  status: DeliveryStatus;
  providerMessageId?: string;
  message?: string;
}

export interface UnifiedNotificationResult {
  notificationId: string;
  recipientUserId: number;
  category: NotificationCategory;
  priority: NotificationPriority;
  channelReports: ChannelDeliveryReport[];
  overallDelivered: boolean;
}

export interface NotificationAuditLog {
  id: number;
  notificationId: string;
  category: NotificationCategory;
  channel: NotificationChannel;
  priority: NotificationPriority;
  title: string;
  body: string;
  status: DeliveryStatus;
  errorReason?: string;
  providerMessageId?: string;
  deliveredAt?: string;
  createdAt: string;
}

export interface AuditLogPage {
  content: NotificationAuditLog[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export const unifiedNotificationService = {
  async getPreferences(userId: number): Promise<NotificationPreferenceDto[]> {
    return apiClient.get<NotificationPreferenceDto[]>(`/v1/notifications/preferences/${userId}`);
  },

  async updatePreference(
    userId: number,
    req: NotificationPreferenceUpdateRequest
  ): Promise<NotificationPreferenceDto> {
    return apiClient.put<NotificationPreferenceDto>(`/v1/notifications/preferences/${userId}`, req);
  },

  async orchestrate(req: UnifiedNotificationRequest): Promise<UnifiedNotificationResult> {
    return apiClient.post<UnifiedNotificationResult>("/v1/notifications/orchestrate/send", req);
  },

  async getAuditLogs(userId: number, page = 0, size = 15): Promise<AuditLogPage> {
    return apiClient.get<AuditLogPage>(
      `/v1/notifications/orchestrate/audit-logs/${userId}?page=${page}&size=${size}`
    );
  },
};
