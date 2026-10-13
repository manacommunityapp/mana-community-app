import { describe, it, expect, vi, beforeEach } from "vitest";
import { platformOpsService } from "../../../services/admin/platformOpsService";

describe("platformOpsService Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return comprehensive platform overview from mock fallback", async () => {
    const overview = await platformOpsService.getOverview();

    expect(overview).toBeDefined();
    expect(overview.overallStatus).toBe("UP");
    expect(overview.clusterMetrics).toBeDefined();
    expect(overview.clusterMetrics.cpuLoadPercent).toBeGreaterThan(0);
    expect(overview.clusterMetrics.totalMemoryMb).toBeGreaterThan(0);
    expect(overview.clusterMetrics.totalDiskGb).toBeGreaterThan(0);

    // Verify services probed
    expect(overview.services).toHaveLength(10);
    const serviceIds = overview.services.map((s) => s.id);
    expect(serviceIds).toContain("core-service");
    expect(serviceIds).toContain("services-platform");
    expect(serviceIds).toContain("finance-service");
    expect(serviceIds).toContain("wallet-service");
    expect(serviceIds).toContain("vision-service");
    expect(serviceIds).toContain("ai-concierge");
    expect(serviceIds).toContain("postgres-db");
    expect(serviceIds).toContain("redis-cache");
    expect(serviceIds).toContain("kafka-cluster");
    expect(serviceIds).toContain("nginx-gateway");
  });

  it("should probe all services and return health records", async () => {
    const services = await platformOpsService.probeServices();

    expect(services).toBeDefined();
    expect(services.length).toBeGreaterThanOrEqual(10);
    for (const svc of services) {
      expect(svc.status).toBe("UP");
      expect(svc.port).toBeGreaterThan(0);
      expect(svc.latencyMs).toBeGreaterThanOrEqual(0);
      expect(svc.endpoint).toBeDefined();
    }
  });

  it("should acknowledge incidents correctly", async () => {
    const result = await platformOpsService.acknowledgeIncident("INC-WARN-01");
    expect(result).toBe(true);
  });

  it("should track Kafka queue lag properly", async () => {
    const overview = platformOpsService.getMockOverview();

    expect(overview.queueLags.length).toBeGreaterThan(0);
    const anprQueue = overview.queueLags.find((q) => q.topic.includes("anpr"));
    expect(anprQueue).toBeDefined();
    expect(anprQueue?.status).toBe("HEALTHY");

    const walletQueue = overview.queueLags.find((q) => q.topic.includes("wallet"));
    expect(walletQueue).toBeDefined();
    expect(walletQueue?.partitions).toBe(4);
  });

  it("should verify Liquibase migration status records", async () => {
    const overview = platformOpsService.getMockOverview();

    expect(overview.migrations).toHaveLength(3);
    for (const mig of overview.migrations) {
      expect(mig.status).toBe("UP_TO_DATE");
      expect(mig.pendingChangeSets).toBe(0);
      expect(mig.executedChangeSets).toBe(mig.totalChangeSets);
    }
  });
});