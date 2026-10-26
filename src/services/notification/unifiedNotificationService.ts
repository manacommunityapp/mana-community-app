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

export type DomainEventType =
  | "SECURITY_ALERT"
  | "VISITOR_ARRIVED"
  | "BILL_GENERATED"
  | "PAYMENT_OVERDUE"
  | "HELPDESK_TICKET_ASSIGNED"
  | "COMMUNITY_ANNOUNCEMENT"
  | "GROUP_BUY_UNLOCKED"
  | "PARKING_VIOLATION"
  | "AMENITY_CONFIRMED"
  | "EMERGENCY_BROADCAST"
  | "DISPUTE_RAISED"
  | "COMMUTE_MATCH_FOUND";

export interface DomainEvent {
  eventId?: string;
  eventType: DomainEventType;
  aggregateType?: string;
  aggregateId?: string;
  communityId?: number;
  actorId?: number;
  targetType?: "DIRECT_USER" | "COMMUNITY" | "TOWER" | "ROLE" | "FLAT";
  targetId?: string;
  directRecipientUserId?: number;
  payload: Record<string, any>;
  occurredAt?: string;
}

export interface NotificationRule {
  ruleId: string;
  eventType: DomainEventType;
  category: NotificationCategory;
  defaultPriority: NotificationPriority;
  defaultStrategy: DeliveryStrategy;
  defaultChannels: NotificationChannel[];
  titleTemplate: string;
  bodyTemplate: string;
  defaultTargetType: string;
  actionUrlTemplate?: string;
}

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
    return apiClient.get<NotificationPreferenceDto[]>(`/notifications/preferences/user/${userId}`);
  },

  async updatePreference(userId: number, req: NotificationPreferenceUpdateRequest): Promise<NotificationPreferenceDto> {
    return apiClient.put<NotificationPreferenceDto>(`/notifications/preferences/user/${userId}`, req);
  },

  async bulkUpdatePreferences(userId: number, prefs: NotificationPreferenceDto[]): Promise<NotificationPreferenceDto[]> {
    return apiClient.put<NotificationPreferenceDto[]>(`/notifications/preferences/user/${userId}/bulk`, prefs);
  },

  async orchestrate(req: UnifiedNotificationRequest): Promise<UnifiedNotificationResult> {
    return apiClient.post<UnifiedNotificationResult>("/notifications/orchestrator/dispatch", req);
  },

  async dispatch(req: UnifiedNotificationRequest): Promise<UnifiedNotificationResult> {
    return this.orchestrate(req);
  },

  async publishDomainEvent(event: DomainEvent): Promise<UnifiedNotificationResult[]> {
    return apiClient.post<UnifiedNotificationResult[]>("/notifications/orchestrator/events", event);
  },

  async retryDelivery(auditLogId: number): Promise<UnifiedNotificationResult> {
    return apiClient.post<UnifiedNotificationResult>(`/notifications/orchestrator/retry/${auditLogId}`, {});
  },

  async getNotificationRules(): Promise<NotificationRule[]> {
    return apiClient.get<NotificationRule[]>("/notifications/orchestrator/rules");
  },

  async getMyLogs(page = 0, size = 20): Promise<AuditLogPage> {
    return apiClient.get<AuditLogPage>(`/notifications/orchestrator/logs?page=${page}&size=${size}`);
  },
};
