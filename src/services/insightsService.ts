import { apiClient } from './common/apiClient';

export type InsightSeverity = 'INFO' | 'WARNING' | 'ALERT' | 'CRITICAL';

export interface CommunityInsight {
  id: number;
  insightType: string;
  severity: InsightSeverity;
  title: string;
  description: string;
  recommendation?: string;
  metricValue?: number;
  metricUnit?: string;
  referencePeriod?: string;
  generatedAt: string;
}

export interface MetricsSnapshot {
  snapshotDate: string;
  totalDuesOutstanding: number;
  collectionRate: number;
  openComplaints: number;
  avgResolutionHours: number;
  activeResidentsPct: number;
  gateEntriesToday?: number;
  unrecognisedEntries?: number;
}

export const insightsService = {
  getActiveInsights: (communityId: number): Promise<CommunityInsight[]> =>
    apiClient.get<CommunityInsight[]>(`/insights/active?communityId=${communityId}`),

  getMetricsTrend: (communityId: number, metric: string, days: number): Promise<MetricsSnapshot[]> =>
    apiClient.get<MetricsSnapshot[]>(`/insights/trend?communityId=${communityId}&metric=${metric}&days=${days}`),

  generateSnapshot: (communityId: number): Promise<void> =>
    apiClient.post(`/insights/generate`, { communityId }),

  dismissInsight: (insightId: number): Promise<void> =>
    apiClient.post(`/insights/${insightId}/dismiss`, {}),
};
