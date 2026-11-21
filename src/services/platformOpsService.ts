import { apiClient } from "./common/apiClient";

export type AlertSeverity = "INFO" | "WARNING" | "CRITICAL";
export type OverallStatus = "HEALTHY" | "DEGRADED" | "DOWN";

export interface ApiHealthMetrics {
  overallStatus: OverallStatus;
  avgLatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  errorRatePct: number;
  requestsPerMin: number;
  endpointBreakdown: { path: string; avgMs: number; p95Ms: number; errorPct: number }[];
}

export interface BackgroundJobStats {
  scheduledJobCount: number;
  failedLast24h: number;
  lastRunTimes: Record<string, { lastRun: string; status: "OK" | "FAILED" | "NEVER" }>;
}

export interface DbPoolMetrics {
  activeConnections: number;
  idleConnections: number;
  maxPoolSize: number;
  waitingThreads: number;
  avgAcquireMs: number;
}

export interface NotificationStats {
  sentLast24h: number;
  failedLast24h: number;
  failureRatePct: number;
  failedByChannel: Record<string, number>;
}

export interface PaymentHealthStats {
  pendingVerifications: number;
  avgVerificationDelayMin: number;
  stalledPayments: number;
  failedLast24h: number;
}

export interface WebSocketStats {
  activeConnections: number;
  peakConnectionsToday: number;
  messagesPerMin: number;
  topicBreakdown: Record<string, { connections: number; messagesPerMin: number }>;
}

export interface StorageStats {
  diskUsedGb: number;
  diskTotalGb: number;
  diskUsedPct: number;
}

export interface SecurityIncident {
  incidentId: number;
  category: string;
  actorId?: number;
  severity: AlertSeverity;
  description: string;
  occurredAt: string;
}

export interface TenantHealth {
  communityId: number;
  communityName: string;
  status: "ACTIVE" | "ONBOARDING" | "INACTIVE" | "CHURNED";
  onboardingStepCompleted: number;
  lastActiveAt: string;
  residentCount: number;
  openIssues: number;
  createdAt?: string;
}

export interface PlatformAlert {
  id: number;
  alertType: string;
  severity: AlertSeverity;
  title: string;
  description?: string;
  createdAt: string;
}

export interface DeployEvent {
  id: number;
  serviceName: string;
  version: string;
  environment: string;
  status: "STARTED" | "SUCCEEDED" | "FAILED" | "ROLLED_BACK";
  commitSha?: string;
  deployedBy?: string;
  startedAt: string;
  finishedAt?: string;
}

export interface PlatformOpsSnapshot {
  capturedAt: string;
  apiHealth: ApiHealthMetrics;
  jobStats: BackgroundJobStats;
  dbPool: DbPoolMetrics;
  notificationStats: NotificationStats;
  paymentHealth: PaymentHealthStats;
  wsStats: WebSocketStats;
  storageStats: StorageStats;
  recentDeploys: DeployEvent[];
  openAlerts: PlatformAlert[];
  securityIncidents: SecurityIncident[];
  tenantHealth: TenantHealth[];
}

export interface MetricPoint {
  value: number;
  recordedAt: string;
}

export const platformOpsService = {
  async getSnapshot(): Promise<PlatformOpsSnapshot> {
    const res = await apiClient.get<any>("/api/platform/ops/snapshot");
    return (res?.data ?? res) as PlatformOpsSnapshot;
  },

  async getMetricHistory(type: string, hours: number): Promise<MetricPoint[]> {
    const res = await apiClient.get<any>("/api/platform/ops/metrics/history", {
      params: { type, hours },
    });
    return (res?.data ?? res) as MetricPoint[];
  },

  async resolveAlert(alertId: number): Promise<void> {
    await apiClient.put(`/api/platform/ops/alerts/${alertId}/resolve`);
  },

  async getSecurityIncidents(hours = 24): Promise<SecurityIncident[]> {
    const res = await apiClient.get<any>("/api/platform/ops/security/incidents", {
      params: { hours },
    });
    return (res?.data ?? res) as SecurityIncident[];
  },

  async getTenants(): Promise<TenantHealth[]> {
    const res = await apiClient.get<any>("/api/platform/ops/tenants");
    return (res?.data ?? res) as TenantHealth[];
  },
};
