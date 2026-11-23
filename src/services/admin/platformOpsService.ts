import { apiClient } from "../common/apiClient";

export type HealthStatus = "UP" | "DEGRADED" | "DOWN" | "UNKNOWN";
export type AlertSeverity = "CRITICAL" | "WARNING" | "INFO";
export type QueueStatus = "HEALTHY" | "WARNING" | "CRITICAL";

export interface ServiceHealth {
  id: string;
  name: string;
  category: "CORE" | "INFRASTRUCTURE" | "DOMAIN" | "AI_VISION";
  status: HealthStatus;
  port: number;
  endpoint: string;
  latencyMs: number;
  version: string;
  gitCommit: string;
  errorRatePercent: number;
  uptimeSeconds: number;
  details: string;
  lastChecked: string;
}

export interface FailedRequest {
  id: string;
  timestamp: string;
  method: string;
  path: string;
  statusCode: number;
  latencyMs: number;
  correlationId: string;
  errorType: string;
  errorMessage: string;
  clientIp: string;
}

export interface QueueLag {
  topic: string;
  consumerGroup: string;
  partitions: number;
  totalLag: number;
  consumptionRatePerSec: number;
  status: QueueStatus;
  targetService: string;
}

export interface MigrationStatus {
  schemaName: string;
  totalChangeSets: number;
  executedChangeSets: number;
  pendingChangeSets: number;
  latestChangeSetId: string;
  latestAuthor: string;
  lastExecutedAt: string;
  status: "UP_TO_DATE" | "PENDING" | "FAILED";
}

export interface IncidentAlert {
  id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  sourceService: string;
  triggeredAt: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
}

export interface SystemClusterMetrics {
  cpuLoadPercent: number;
  totalMemoryMb: number;
  usedMemoryMb: number;
  memoryPercent: number;
  totalDiskGb: number;
  usedDiskGb: number;
  diskPercent: number;
  jvmUsedMemoryMb: number;
  jvmMaxMemoryMb: number;
  jvmPercent: number;
  activeThreads: number;
  uptimeSeconds: number;
  totalRequestsTracked: number;
  totalFailedRequests: number;
  overallErrorRate: number;
}

/** Failed notification delivery summary across all channels. */
export interface FailedNotificationSummary {
  totalFailed: number;
  failedLast1h: number;
  byChannel: {
    channel: "PUSH" | "EMAIL" | "SMS" | "WHATSAPP";
    failed: number;
    total: number;
    failureRate: number;
  }[];
  lastFailureAt: string | null;
}

/** Live WebSocket connection health from the push gateway. */
export interface WebSocketHealth {
  activeConnections: number;
  peakConnectionsLast1h: number;
  disconnectsLast1h: number;
  messageErrorRate: number;
  avgSessionDurationSeconds: number;
  status: HealthStatus;
}

/** Health state of a single scheduled / cron background job. */
export interface BackgroundJobStatus {
  jobName: string;
  cronExpression: string;
  status: "HEALTHY" | "FAILING" | "STALLED" | "DISABLED";
  lastRunAt: string | null;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  failureCountLast24h: number;
  avgDurationMs: number;
  nextScheduledAt: string | null;
  lastErrorMessage?: string;
}

/** CI/CD pipeline execution status for a single environment. */
export interface CicdPipelineStatus {
  pipeline: string;
  status: "SUCCESS" | "RUNNING" | "FAILED" | "PENDING" | "CANCELLED";
  branch: string;
  commitSha: string;
  triggeredBy: string;
  startedAt: string;
  finishedAt: string | null;
  durationSeconds: number | null;
  deployedEnvironment: string;
}

/** Payment gateway verification health and latency. */
export interface PaymentGatewayHealth {
  gateway: string;
  status: HealthStatus;
  verificationDelayP95Ms: number;
  successRate: number;
  failureCount: number;
  avgResponseMs: number;
}

/** Aggregate tenant health and onboarding pipeline state. */
export interface TenantHealthSummary {
  totalTenants: number;
  healthyTenants: number;
  degradedTenants: number;
  offlineTenants: number;
  pendingOnboarding: number;
  onboardingCompletedLast7Days: number;
}

/** HikariCP / JDBC connection pool stats for one data source. */
export interface DatabaseConnectionPool {
  poolName: string;
  activeConnections: number;
  idleConnections: number;
  maxPoolSize: number;
  pendingAcquire: number;
  avgAcquireTimeMs: number;
  status: "HEALTHY" | "WARNING" | "CRITICAL";
}

export interface PlatformOpsOverview {
  generatedAt: string;
  overallStatus: HealthStatus;
  /**
   * Root-level uptime seconds (mirrors clusterMetrics.uptimeSeconds).
   * Included at the top level as a convenience field for the AI ops analyzer.
   */
  uptimeSeconds: number;
  /** Total active WebSocket connections at snapshot time. */
  activeWebsockets: number;
  /** Total failed requests count (mirrors clusterMetrics.totalFailedRequests). */
  failedRequestsTotal: number;
  clusterMetrics: SystemClusterMetrics;
  services: ServiceHealth[];
  recentFailures: FailedRequest[];
  queueLags: QueueLag[];
  migrations: MigrationStatus[];
  activeIncidents: IncidentAlert[];
  /** Notification delivery failure summary across PUSH / EMAIL / SMS / WhatsApp. */
  notifications?: FailedNotificationSummary;
  /** Live WebSocket push gateway health. */
  webSocketHealth?: WebSocketHealth;
  /** All registered background / cron jobs across services. */
  backgroundJobs?: BackgroundJobStatus[];
  /** Recent CI/CD pipeline executions per environment. */
  cicdPipelines?: CicdPipelineStatus[];
  /** Payment gateway health, verification latency and success rates. */
  paymentGateways?: PaymentGatewayHealth[];
  /** Community tenant health and onboarding pipeline. */
  tenantHealth?: TenantHealthSummary;
  /** HikariCP / JDBC connection pool stats per data source. */
  databasePools?: DatabaseConnectionPool[];
}

export const platformOpsService = {
  async getOverview(): Promise<PlatformOpsOverview> {
    return apiClient.get<PlatformOpsOverview>("/admin/ops/overview");
  },

  async probeServices(): Promise<ServiceHealth[]> {
    return apiClient.post<ServiceHealth[]>("/admin/ops/probe");
  },

  async acknowledgeIncident(id: string): Promise<boolean> {
    const resp = await apiClient.post<{ acknowledged: boolean }>(`/admin/ops/incidents/${id}/acknowledge`);
    return resp.acknowledged;
  },
};
