import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  estimateMorningRushCapacity,
  estimateBillingBlastCapacity,
  capacityPlanningService,
} from "./capacityPlanningService";
import { apiClient } from "../common/apiClient";

vi.mock("../common/apiClient", () => ({
  apiClient: {
    post: vi.fn(),
  },
}));

describe("Back-of-the-Envelope Capacity Planning Calculators", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("estimates morning rush QPS, Redis TTL RAM, and daily S3 growth for 30,000 societies", () => {
    const est = estimateMorningRushCapacity({
      societies: 30_000,
      avgFlatsPerSociety: 350,
      dailyEntriesPerFlat: 4,
      morningConcentrationPct: 40,
      windowHours: 2,
      burstMultiplier: 3.5,
      callsPerEntry: 3,
      realTimeAlertPct: 60,
      avgDevicesPerFlat: 2,
      ttlSeconds: 300,
      bytesPerSession: 1024,
      photoCapturePct: 50,
      avgPhotoKb: 150,
    });

    expect(est.totalFlats).toBe(10_500_000);
    expect(est.sustainedEntryQps).toBeCloseTo(2333.33, 1);
    expect(est.peakApiQps).toBeGreaterThan(24_000);
    expect(est.redisMemoryGb).toBeGreaterThan(2.2);
    expect(est.dailyS3GrowthTb).toBe(3.15);
  });

  it("sizes 10M monthly billing blast worker concurrency and Kafka partitions and calls APIs", async () => {
    const blast = estimateBillingBlastCapacity({
      totalInvoices: 10_000_000,
      windowHours: 4,
      slackHours: 1,
      cpuMsPerPdf: 25,
      wallMsPerInvoice: 50,
      targetCpuUtilizationPct: 60,
      avgPdfKb: 120,
      batchedWriteOpsPerInvoice: 8,
    });

    expect(blast.effectiveHours).toBe(3);
    expect(blast.targetInvoicesPerSec).toBeCloseTo(925.93, 1);
    expect(blast.recommendedKafkaPartitions).toBe(128);
    expect(blast.monthlyPdfStorageTb).toBe(1.2);
    expect(blast.deferPspApiToClick).toBe(true);

    (apiClient.post as any).mockResolvedValueOnce(blast);
    const remote = await capacityPlanningService.fetchBillingBlastEstimate({
      totalInvoices: 10_000_000,
      windowHours: 4,
      slackHours: 1,
      cpuMsPerPdf: 25,
      wallMsPerInvoice: 50,
      targetCpuUtilizationPct: 60,
      avgPdfKb: 120,
      batchedWriteOpsPerInvoice: 8,
    });
    expect(remote.recommendedKafkaPartitions).toBe(128);
  });
});
