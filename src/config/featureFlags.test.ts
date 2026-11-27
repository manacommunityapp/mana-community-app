import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  isModuleEnabled,
  deterministicTenantBucket,
  isRushHourWindow,
  releaseSafetyService,
} from "./featureFlags";
import { apiClient } from "../services/common/apiClient";

vi.mock("../services/common/apiClient", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe("Progressive Tenant Canary Rollouts & Chaos GameDay Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("hashes society IDs deterministically and blocks morning/evening rush windows", () => {
    const b1 = deterministicTenantBucket("guard-checkin-v2", 412);
    const b2 = deterministicTenantBucket("guard-checkin-v2", 412);
    expect(b1).toBe(b2);
    expect(b1).toBeGreaterThanOrEqual(0);
    expect(b1).toBeLessThan(10_000);

    expect(isRushHourWindow(8, 15)).toBe(true);
    expect(isRushHourWindow(18, 0)).toBe(true);
    expect(isRushHourWindow(14, 0)).toBe(false);
    expect(isModuleEnabled("GATE_V2", { enabledModules: ["GATE_V2"] })).toBe(true);
  });

  it("evaluates tenant canary flag and reports telemetry rollback", async () => {
    (apiClient.get as any).mockResolvedValueOnce({ variant: "CANARY", tenantBucket: 42 });
    const flag = await releaseSafetyService.evaluateTenantFlag("guard-checkin-v2", 412);
    expect(flag.variant).toBe("CANARY");

    (apiClient.post as any).mockResolvedValueOnce({ rolledBack: true, p99LatencyMs: 450 });
    const rb = await releaseSafetyService.reportCanaryTelemetry("guard-checkin-v2", 450, 10);
    expect(rb.rolledBack).toBe(true);
  });

  it("starts and verifies gate chaos GameDay experiment", async () => {
    (apiClient.post as any).mockResolvedValueOnce({ id: 9, status: "RUNNING", faultType: "REDIS_EVICTION" });
    const exp = await releaseSafetyService.startChaosGameDay("GD-01", 101, "REDIS_EVICTION", 300);
    expect(exp.status).toBe("RUNNING");

    (apiClient.post as any).mockResolvedValueOnce({ status: "PASSED", gateDegradedOk: true, emergencySosInvariantOk: true });
    const verify = await releaseSafetyService.verifyChaosGateInvariants(9, {
      offlineCacheFallbackServed: true,
      sosProbeHealthy: true,
    });
    expect(verify.status).toBe("PASSED");
    expect(verify.gateDegradedOk).toBe(true);
  });
});
