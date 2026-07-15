import { apiClient } from "./apiClient";

export interface TypeCount {
  type: string;
  count: number;
}

export interface CategoryCount {
  category: string;
  count: number;
}

export interface CategoryReadRate {
  category: string;
  total: number;
  read: number;
  readRate: number;
}

export interface DailyTrend {
  date: string;
  count: number;
}

export interface PriorityCount {
  priority: string;
  count: number;
}

export interface NotificationAnalytics {
  totalSent: number;
  totalRead: number;
  readRate: number;
  days: number;
  byType: TypeCount[];
  byCategory: CategoryCount[];
  readRateByCategory: CategoryReadRate[];
  dailyTrend: DailyTrend[];
  byPriority: PriorityCount[];
}

export const notificationAnalyticsService = {
  async getAnalytics(days: number = 30): Promise<NotificationAnalytics> {
    return apiClient.get<NotificationAnalytics>(`/notifications/analytics?days=${days}`);
  },
};
