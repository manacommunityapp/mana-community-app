import { describe, it, expect, vi, beforeEach } from "vitest";
import { smartDeviceService } from "../smartDeviceService";
import { turnstileService } from "./turnstileService";
import { apiClient } from "../common/apiClient";

vi.mock("../common/apiClient", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("Smart Locks, Biometric Edge Sync & Anti-Passback Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("issues HKDF time-bound offline smart-lock PIN for plumber window", async () => {
    (apiClient.post as any).mockResolvedValueOnce({
      data: {
        otpId: 700,
        deviceId: 42,
        pinCode: "491820",
        derivationMode: "HKDF_TIME_WINDOW",
        slotDurationBuckets: 8,
        singleUse: true,
      },
    });

    const pin = await smartDeviceService.issueOfflineTimeBoundPin(
      42,
      "Plumber",
      "2026-11-27T14:00:00Z",
      "2026-11-27T16:00:00Z",
      true
    );

    expect(pin.pinCode).toBe("491820");
    expect(pin.derivationMode).toBe("HKDF_TIME_WINDOW");
    expect(apiClient.post).toHaveBeenCalledWith("/devices/42/offline-pin", {
      visitorName: "Plumber",
      validFrom: "2026-11-27T14:00:00Z",
      validUntil: "2026-11-27T16:00:00Z",
      singleUse: true,
    });
  });

  it("fetches incremental biometric edge deltas and triggers priority kill-switch revocation", async () => {
    (apiClient.get as any).mockResolvedValueOnce([{ syncVersion: 11, op: "UPSERT", personId: 305 }]);
    const deltas = await turnstileService.getBiometricDeltasSince(5, 10);
    expect(deltas).toHaveLength(1);
    expect(deltas[0].syncVersion).toBe(11);

    (apiClient.post as any).mockResolvedValueOnce({ op: "REVOKE", urgentKillSwitch: true, syncVersion: 12 });
    const kill = await turnstileService.revokeBiometricKillSwitch(305, "BLACKLISTED");
    expect(kill.urgentKillSwitch).toBe(true);
  });

  it("evaluates turnstile anti-passback bounce block and IR tailgate flag", async () => {
    (apiClient.post as any).mockResolvedValueOnce({
      allowed: false,
      decision: "DENIED_PASSBACK_COOLDOWN",
      captureSecuritySnapshot: true,
    });

    const res = await turnstileService.evaluateApbSwipe({
      zoneId: "CLUBHOUSE_GYM",
      credentialId: "RFID-4412",
      direction: "ENTRY",
      turnstileId: "TURNSTILE_1",
      irPersonsDetected: 1,
    });
    expect(res.allowed).toBe(false);
    expect(res.decision).toBe("DENIED_PASSBACK_COOLDOWN");
  });
});
