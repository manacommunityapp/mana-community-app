import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  buildCanonicalWebhookString,
  parseDeprecationHeaders,
  partnerWebhookAndVersioningService,
} from "./partnerWebhookAndVersioningService";
import { apiClient } from "../common/apiClient";

vi.mock("../common/apiClient", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

describe("Partner HMAC Key Rotation & Hardware API Versioning Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("constructs canonical signing payload matching backend HMAC contract", () => {
    const canonical = buildCanonicalWebhookString(
      "post",
      "/api/v1/partners/notify",
      1760000000,
      "nonce-987",
      '{"gateId":"G1","action":"OPEN"}',
    );
    expect(canonical).toBe(
      'POST\n/api/v1/partners/notify\n1760000000\nnonce-987\n{"gateId":"G1","action":"OPEN"}',
    );
  });

  it("parses RFC 8594 Deprecation, Sunset, and Link successor-version headers", () => {
    const info = parseDeprecationHeaders({
      Deprecation: "true",
      Sunset: "Wed, 30 Sep 2027 23:59:59 GMT",
      Link: '</api/v2/hardware/sync>; rel="successor-version"',
      "X-API-Version": "1.0",
    });

    expect(info).toEqual({
      deprecated: true,
      sunsetDate: "Wed, 30 Sep 2027 23:59:59 GMT",
      successorUrl: "/api/v2/hardware/sync",
      apiVersion: "1.0",
    });
  });

  it("calls key rotation, immediate revocation, laggards telemetry, and sunset toggle endpoints", async () => {
    (apiClient.post as any).mockResolvedValueOnce({ keyId: "boom-barrier-k2", status: "ACTIVE" });
    const rotated = await partnerWebhookAndVersioningService.rotatePartnerKey("BOOM-BARRIER", 168);
    expect(rotated.keyId).toBe("boom-barrier-k2");
    expect(apiClient.post).toHaveBeenCalledWith("/v1/partners/keys/rotate", {
      partnerId: "BOOM-BARRIER",
      graceHours: 168,
    });

    (apiClient.post as any).mockResolvedValueOnce({ keyId: "boom-barrier-k1", status: "REVOKED" });
    const revoked = await partnerWebhookAndVersioningService.revokePartnerKey(
      "boom-barrier-k1",
      "STOLEN_DEVICE_SECRET",
    );
    expect(revoked.status).toBe("REVOKED");

    (apiClient.get as any).mockResolvedValueOnce([{ controllerSerial: "CTRL-99", callCount: 14 }]);
    const laggards = await partnerWebhookAndVersioningService.getDeprecatedLaggards();
    expect(laggards[0].controllerSerial).toBe("CTRL-99");

    (apiClient.put as any).mockResolvedValueOnce({ v1SunsetEnabled: true });
    const sunset = await partnerWebhookAndVersioningService.setV1SunsetEnabled(true);
    expect(sunset.v1SunsetEnabled).toBe(true);
  });
});
