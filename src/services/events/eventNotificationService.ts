import { apiClient } from "../common/apiClient";

/* ─── Types ─── */

export type NotificationType = "reminder" | "update" | "custom";
export type RepeatMode = "none" | "daily" | "weekly" | "custom";
export type ScheduleStatus = "scheduled" | "sent" | "paused" | "failed" | "cancelled";
export type ChannelKey = "email" | "sms" | "whatsapp" | "push" | "inApp";

export interface ScheduleNotificationRequest {
  eventId: number;
  type: NotificationType;
  channels: ChannelKey[];
  sendNow: boolean;
  scheduledAt?: string;
  repeat: RepeatMode;
  customRepeatDays?: number;
  sendToAll: boolean;
  recipientIds?: number[];
  customMessage?: string;
}

export interface ScheduledNotificationResponse {
  id: number;
  eventId: number;
  eventTitle: string;
  type: NotificationType;
  typeLabel: string;
  channels: ChannelKey[];
  scheduledAt: string;
  repeat: RepeatMode;
  repeatLabel: string;
  customRepeatDays: number | null;
  recipients: number;
  status: ScheduleStatus;
  message: string | null;
  sentAt: string | null;
  createdAt: string;
  createdBy: string;
}

export interface NotificationHistoryPage {
  content: ScheduledNotificationResponse[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface NotificationStatsResponse {
  total: number;
  scheduled: number;
  sent: number;
  paused: number;
  failed: number;
  totalRecipients: number;
  channelBreakdown: Record<ChannelKey, number>;
}

export interface BulkActionResponse {
  updated: number;
}

/* ─── Service ─── */

export const eventNotificationService = {
  /**
   * Schedule or send a notification for an event.
   * POST /events/{eventId}/notifications/schedule
   */
  async schedule(
    eventId: number,
    request: ScheduleNotificationRequest
  ): Promise<ScheduledNotificationResponse> {
    return apiClient.post<ScheduledNotificationResponse>(
      `/events/${eventId}/notifications/schedule`,
      request
    );
  },

  /**
   * Send a notification immediately (convenience wrapper).
   * POST /events/{eventId}/notifications/send
   */
  async sendNow(
    eventId: number,
    request: Omit<ScheduleNotificationRequest, "sendNow" | "scheduledAt" | "repeat" | "customRepeatDays">
  ): Promise<ScheduledNotificationResponse> {
    return apiClient.post<ScheduledNotificationResponse>(
      `/events/${eventId}/notifications/send`,
      { ...request, sendNow: true, repeat: "none" }
    );
  },

  /**
   * List all scheduled/sent notifications for an event.
   * GET /events/{eventId}/notifications?page=0&size=20&status=scheduled
   */
  async list(
    eventId: number,
    params?: { page?: number; size?: number; status?: ScheduleStatus }
  ): Promise<NotificationHistoryPage> {
    const qs = new URLSearchParams();
    if (params?.page !== undefined) qs.set("page", String(params.page));
    if (params?.size !== undefined) qs.set("size", String(params.size));
    if (params?.status) qs.set("status", params.status);
    const query = qs.toString();
    return apiClient.get<NotificationHistoryPage>(
      `/events/${eventId}/notifications${query ? `?${query}` : ""}`
    );
  },

  /**
   * Get a single scheduled notification by ID.
   * GET /events/{eventId}/notifications/{notificationId}
   */
  async getById(
    eventId: number,
    notificationId: number
  ): Promise<ScheduledNotificationResponse> {
    return apiClient.get<ScheduledNotificationResponse>(
      `/events/${eventId}/notifications/${notificationId}`
    );
  },

  /**
   * Update a scheduled (not yet sent) notification.
   * PUT /events/{eventId}/notifications/{notificationId}
   */
  async update(
    eventId: number,
    notificationId: number,
    request: Partial<ScheduleNotificationRequest>
  ): Promise<ScheduledNotificationResponse> {
    return apiClient.put<ScheduledNotificationResponse>(
      `/events/${eventId}/notifications/${notificationId}`,
      request
    );
  },

  /**
   * Pause a scheduled notification.
   * PUT /events/{eventId}/notifications/{notificationId}/pause
   */
  async pause(
    eventId: number,
    notificationId: number
  ): Promise<ScheduledNotificationResponse> {
    return apiClient.put<ScheduledNotificationResponse>(
      `/events/${eventId}/notifications/${notificationId}/pause`,
      {}
    );
  },

  /**
   * Resume a paused notification.
   * PUT /events/{eventId}/notifications/{notificationId}/resume
   */
  async resume(
    eventId: number,
    notificationId: number
  ): Promise<ScheduledNotificationResponse> {
    return apiClient.put<ScheduledNotificationResponse>(
      `/events/${eventId}/notifications/${notificationId}/resume`,
      {}
    );
  },

  /**
   * Cancel/delete a scheduled notification.
   * DELETE /events/{eventId}/notifications/{notificationId}
   */
  async cancel(
    eventId: number,
    notificationId: number
  ): Promise<void> {
    return apiClient.delete<void>(
      `/events/${eventId}/notifications/${notificationId}`
    );
  },

  /**
   * Get notification stats/analytics for an event.
   * GET /events/{eventId}/notifications/stats
   */
  async getStats(eventId: number): Promise<NotificationStatsResponse> {
    return apiClient.get<NotificationStatsResponse>(
      `/events/${eventId}/notifications/stats`
    );
  },

  /**
   * Resend a previously sent or failed notification.
   * POST /events/{eventId}/notifications/{notificationId}/resend
   */
  async resend(
    eventId: number,
    notificationId: number
  ): Promise<ScheduledNotificationResponse> {
    return apiClient.post<ScheduledNotificationResponse>(
      `/events/${eventId}/notifications/${notificationId}/resend`,
      {}
    );
  },

  /**
   * Bulk pause all scheduled notifications for an event.
   * PUT /events/{eventId}/notifications/pause-all
   */
  async pauseAll(eventId: number): Promise<BulkActionResponse> {
    return apiClient.put<BulkActionResponse>(
      `/events/${eventId}/notifications/pause-all`,
      {}
    );
  },

  /**
   * Bulk resume all paused notifications for an event.
   * PUT /events/{eventId}/notifications/resume-all
   */
  async resumeAll(eventId: number): Promise<BulkActionResponse> {
    return apiClient.put<BulkActionResponse>(
      `/events/${eventId}/notifications/resume-all`,
      {}
    );
  },

  /**
   * Bulk cancel all scheduled notifications for an event.
   * DELETE /events/{eventId}/notifications/cancel-all
   */
  async cancelAll(eventId: number): Promise<BulkActionResponse> {
    return apiClient.delete<BulkActionResponse>(
      `/events/${eventId}/notifications/cancel-all`
    );
  },
};
