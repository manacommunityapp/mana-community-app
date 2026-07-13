import { apiClient } from "./apiClient";
import type { RegistrationOpenNotificationRequest } from "../types/api";

export interface NotificationItem {
  id: number;
  type: string | null;
  category: string | null;
  title: string;
  body: string | null;
  icon: string | null;
  actionUrl: string | null;
  referenceType: string | null;
  referenceId: number | null;
  priority: string | null;
  read: boolean;
  readAt: string | null;
  metadata: string | null;
  createdAt: string;
}

export interface NotificationPage {
  content: NotificationItem[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface NotificationCount {
  count: number;
}

export const notificationService = {
  async sendRegistrationOpenNotification(
    tournamentId: number,
    config: RegistrationOpenNotificationRequest
  ): Promise<void> {
    return apiClient.post<void>(`/notifications/tournament/${tournamentId}/open`, config);
  },

  async getNotifications(page = 0, size = 20): Promise<NotificationPage> {
    return apiClient.get<NotificationPage>(`/notifications?page=${page}&size=${size}`);
  },

  async getUnreadCount(): Promise<NotificationCount> {
    return apiClient.get<NotificationCount>("/notifications/count");
  },

  async markAsRead(notificationIds: number[]): Promise<{ updated: number }> {
    return apiClient.put<{ updated: number }>("/notifications/read", { notificationIds });
  },

  async markAllAsRead(): Promise<{ updated: number }> {
    return apiClient.put<{ updated: number }>("/notifications/read-all", {});
  },

  async dismiss(notificationId: number): Promise<{ dismissed: number }> {
    return apiClient.put<{ dismissed: number }>(`/notifications/${notificationId}/dismiss`, {});
  },

  async dismissAll(): Promise<{ dismissed: number }> {
    return apiClient.put<{ dismissed: number }>("/notifications/dismiss-all", {});
  },
};
