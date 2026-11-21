import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  PlatformOpsOverview,
  FailedNotificationSummary,
  WebSocketHealth,
  BackgroundJobStatus,
  CicdPipelineStatus,
  PaymentGatewayHealth,
  TenantHealthSummary,
  DatabaseConnectionPool,
} from "../../../services/admin/platformOpsService";

vi.mock("../../../services/common/apiClient", () => ({
  apiClient: { get: vi.fn(), post: vi.fn() },
}));

import { apiClient } from "../../../services/common/apiClient";
import { platformOpsService } from "../../../services/admin/platformOpsService";

// ── Minimal fixture for new optional sections ────────────────────────────────

const notifications: FailedNotificationSummary = {
  totalFailed: 12,
  failedLast1h: 3,
  byChannel: [
    { channel: "PUSH", failed: 5, total: 1000, failureRate: 0.005 },
    { channel: "EMAIL", failed: 7, total: 800, failureRate: 0.00875 },
  ],
  lastFailureAt: "2026-11-20T08:45:00Z",
};

const webSocketHealth: WebSocketHealth = {
  activeConnections: 342,
  peakConnectionsLast1h: 410,
  disconnectsLast1h: 18,
  messageErrorRate: 0.001,
  avgSessionDurationSeconds: 1800,
  status: "UP",
};

const backgroundJobs: BackgroundJobStatus[] = [
  {
    jobName: "MaintenanceInvoiceGenerator",
    cronExpression: "0 9 1 * *",
    status: "HEALTHY",
    lastRunAt: "2026-11-01T09:00:00Z",
    lastSuccessAt: "2026-11-01T09:00:00Z",
    lastFailureAt: null,
    failureCountLast24h: 0,
    avgDurationMs: 1240,
    nextScheduledAt: "2026-12-01T09:00:00Z",
  },
  {
    jobName: "ExpiredPassCleaner",
    cronExpression: "*/30 * * * *",
    status: "FAILING",
    lastRunAt: "2026-11-20T08:30:00Z",
    lastSuccessAt: "2026-11-19T23:00:00Z",
    lastFailureAt: "2026-11-20T08:30:00Z",
    failureCountLast24h: 4,
    avgDurationMs: 320,
    nextScheduledAt: "2026-11-20T09:00:00Z",
    lastErrorMessage: "Connection timeout to visitor-service",
  },
];

const cicdPipelines: CicdPipelineStatus[] = [
  {
    pipeline: "mana-backend-deploy",
    status: "SUCCESS",
    branch: "main",
    commitSha: "a1b2c3d4e5f6",
    triggeredBy: "github-actions[bot]",
    startedAt: "2026-11-20T07:00:00Z",
    finishedAt: "2026-11-20T07:08:30Z",
    durationSeconds: 510,
    deployedEnvironment: "production",
  },
];

const paymentGateways: PaymentGatewayHealth[] = [
  {
    gateway: "Cashfree",
    status: "UP",
    verificationDelayP95Ms: 420,
    successRate: 0.9972,
    failureCount: 3,
    avgResponseMs: 210,
  },
  {
    gateway: "Razorpay",
    status: "DEGRADED",
    verificationDelayP95Ms: 2100,
    successRate: 0.961,
    failureCount: 42,
    avgResponseMs: 980,
  },
];

const tenantHealth: TenantHealthSummary = {
  totalTenants: 85,
  healthyTenants: 80,
  degradedTenants: 4,
  offlineTenants: 1,
  pendingOnboarding: 7,
  onboardingCompletedLast7Days: 3,
};

const databasePools: DatabaseConnectionPool[] = [
  {
    poolName: "community-db",
    activeConnections: 12,
    idleConnections: 8,
    maxPoolSize: 30,
    pendingAcquire: 0,
    avgAcquireTimeMs: 2,
    status: "HEALTHY",
  },
  {
    poolName: "analytics-db",
    activeConnections: 27,
    idleConnections: 2,
    maxPoolSize: 30,
    pendingAcquire: 3,
    avgAcquireTimeMs: 45,
    status: "WARNING",
  },
];

// ── Full overview fixture ────────────────────────────────────────────────────

const overview: PlatformOpsOverview = {
  generatedAt: "2026-11-20T00:00:00Z",
  overallStatus: "UP",
  uptimeSeconds: 86400,
  activeWebsockets: 342,
  failedRequestsTotal: 3,
  clusterMetrics: {
    cpuLoadPercent: 38,
    totalMemoryMb: 16384,
    usedMemoryMb: 10240,
    memoryPercent: 62,
    totalDiskGb: 500,
    usedDiskGb: 210,
    diskPercent: 42,
    jvmUsedMemoryMb: 2048,
    jvmMaxMemoryMb: 4096,
    jvmPercent: 50,
    activeThreads: 120,
    uptimeSeconds: 86400,
    totalRequestsTracked: 50000,
    totalFailedRequests: 3,
    overallErrorRate: 0.006,
  },
  services: [],
  recentFailures: [],
  queueLags: [],
  migrations: [],
  activeIncidents: [],
  notifications,
  webSocketHealth,
  backgroundJobs,
  cicdPipelines,
  paymentGateways,
  tenantHealth,
  databasePools,
};

// ── Tests ────────────────────────────────────────────────────────────────────

describe("platformOpsService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("loads the live overview endpoint", async () => {
    vi.mocked(apiClient.get).mockResolvedValue(overview);

    await expect(platformOpsService.getOverview()).resolves.toEqual(overview);
    expect(apiClient.get).toHaveBeenCalledWith("/admin/ops/overview");
  });

  it("does not substitute demo telemetry when the API is unavailable", async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error("API unavailable"));

    await expect(platformOpsService.getOverview()).rejects.toThrow("API unavailable");
  });

  it("probes and acknowledges through the live API", async () => {
    vi.mocked(apiClient.post)
      .mockResolvedValueOnce(overview.services)
      .mockResolvedValueOnce({ acknowledged: true });

    await expect(platformOpsService.probeServices()).resolves.toEqual([]);
    await expect(platformOpsService.acknowledgeIncident("incident-1")).resolves.toBe(true);
    expect(apiClient.post).toHaveBeenNthCalledWith(1, "/admin/ops/probe");
    expect(apiClient.post).toHaveBeenNthCalledWith(2, "/admin/ops/incidents/incident-1/acknowledge");
  });

  it("overview fixture includes all new optional sections", () => {
    expect(overview.notifications?.totalFailed).toBe(12);
    expect(overview.notifications?.byChannel).toHaveLength(2);
    expect(overview.webSocketHealth?.activeConnections).toBe(342);
    expect(overview.webSocketHealth?.status).toBe("UP");
    expect(overview.backgroundJobs).toHaveLength(2);
    expect(overview.backgroundJobs?.find((j) => j.status === "FAILING")?.jobName).toBe("ExpiredPassCleaner");
    expect(overview.cicdPipelines?.[0].pipeline).toBe("mana-backend-deploy");
    expect(overview.cicdPipelines?.[0].status).toBe("SUCCESS");
    expect(overview.paymentGateways?.find((g) => g.gateway === "Razorpay")?.status).toBe("DEGRADED");
    expect(overview.paymentGateways?.find((g) => g.gateway === "Razorpay")?.verificationDelayP95Ms).toBe(2100);
    expect(overview.tenantHealth?.healthyTenants).toBe(80);
    expect(overview.tenantHealth?.pendingOnboarding).toBe(7);
    expect(overview.databasePools?.find((p) => p.poolName === "analytics-db")?.status).toBe("WARNING");
  });

  it("root-level convenience fields mirror cluster metrics", () => {
    expect(overview.uptimeSeconds).toBe(overview.clusterMetrics.uptimeSeconds);
    expect(overview.activeWebsockets).toBe(overview.webSocketHealth?.activeConnections);
    expect(overview.failedRequestsTotal).toBe(overview.clusterMetrics.totalFailedRequests);
  });

  it("background job failure count aggregation works", () => {
    const totalFailures = overview.backgroundJobs?.reduce((acc, j) => acc + j.failureCountLast24h, 0) ?? 0;
    expect(totalFailures).toBe(4);
  });

  it("payment gateway degradation is detectable", () => {
    const degraded = overview.paymentGateways?.filter((g) => g.status !== "UP") ?? [];
    expect(degraded).toHaveLength(1);
    expect(degraded[0].gateway).toBe("Razorpay");
    // p95 > 2000 ms should be flagged as slow
    expect(degraded[0].verificationDelayP95Ms).toBeGreaterThan(2000);
  });

  it("tenant health distribution sums to totalTenants", () => {
    const th = overview.tenantHealth!;
    expect(th.healthyTenants + th.degradedTenants + th.offlineTenants).toBe(th.totalTenants);
  });
});
