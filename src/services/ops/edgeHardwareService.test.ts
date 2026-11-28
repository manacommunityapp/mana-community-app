import { describe, it, expect, vi, beforeEach } from "vitest";
import { shouldTriggerWatchdogRollback, edgeHardwareService } from "./edgeHardwareService";
import { apiClient } from "../common/apiClient";

vi.mock("../common/apiClient", () => ({
  apiClient: {
    post: vi.fn(),
  },
}));

describe("Edge Hardware Relay Safety & A/B OTA Watchdog Client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("triggers 30s OTA watchdog rollback on timeout, serial failure, or TLS disconnect", () => {
    expect(
      shouldTriggerWatchdogRollback({
        serialBusHealthy: true,
        tlsMqttHealthy: true,
        secondsSinceBoot: 12,
        crashLoopDetected: false,
      }),
    ).toBe(false);

    expect(
      shouldTriggerWatchdogRollback({
        serialBusHealthy: true,
        tlsMqttHealthy: false,
        secondsSinceBoot: 31,
        crashLoopDetected: false,
      }),
    ).toBe(true);
  });

  it("dispatches idempotent barrier commands and watchdog checks cleanly", async () => {
    (apiClient.post as any).mockResolvedValueOnce({
      outcome: "IDEMPOTENT_DUPLICATE",
      relayPulseMs: 0,
    });
    const dup = await edgeHardwareService.sendBarrierCommand({
      controllerId: "PI-GATE-01",
      cmdNonce: "nonce-1",
      commandType: "OPEN_ONLY",
      loopAOccupied: true,
      loopBOccupied: false,
      issuedAt: "2026-11-28T08:05:00Z",
    });
    expect(dup.outcome).toBe("IDEMPOTENT_DUPLICATE");
    expect(dup.relayPulseMs).toBe(0);

    (apiClient.post as any).mockResolvedValueOnce({
      controllerId: "PI-GATE-09",
      activeSlot: "A",
      otaStatus: "ROLLED_BACK",
    });
    const rollback = await edgeHardwareService.evaluateOtaWatchdog({
      controllerId: "PI-GATE-09",
      serialBusHealthy: true,
      tlsMqttHealthy: false,
      secondsSinceBoot: 35,
    });
    expect(rollback.otaStatus).toBe("ROLLED_BACK");
    expect(rollback.activeSlot).toBe("A");
  });
});
