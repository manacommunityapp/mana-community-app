import { describe, it, expect, vi, beforeEach } from "vitest";
import { isRiskWarningActionable, federationRiskService } from "./federationRiskService";
import { apiClient } from "../common/apiClient";

vi.mock("../common/apiClient", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe("Mega-Township Federation Routing & Privacy-Preserving Risk Network", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("gates actionable risk warnings on K>=2 multi-society corroboration", () => {
    expect(
      isRiskWarningActionable({
        cityCode: "HYD",
        riskTier: "NONE",
        corroboratedSocietiesCount: 1,
        actionGuidance: "STANDARD_VERIFICATION",
      }),
    ).toBe(false);

    expect(
      isRiskWarningActionable({
        cityCode: "HYD",
        riskTier: "HIGH_RISK",
        topCategory: "DELIVERY_IMPERSONATION",
        corroboratedSocietiesCount: 3,
        actionGuidance: "VERIFY_GOVT_ID_AND_HOST_CALLBACK",
      }),
    ).toBe(true);
  });

  it("calls federation outer admission, inner prewarmed lookup, and city risk endpoints", async () => {
    (apiClient.post as any).mockResolvedValueOnce({
      transitId: "TR-123",
      targetSocietyId: 202,
      opaqueFlatLabel: "Phase 2 · B-404",
    });
    const transit = await federationRiskService.admitOuterGate({
      federationId: 10,
      targetSocietyId: 202,
      opaqueFlatLabel: "Phase 2 · B-404",
      identifier: "TS09AB1234",
    });
    expect(transit.targetSocietyId).toBe(202);

    (apiClient.get as any).mockResolvedValueOnce([transit]);
    const list = await federationRiskService.listPrewarmedInnerGate(202);
    expect(list).toHaveLength(1);

    (apiClient.post as any).mockResolvedValueOnce({
      cityCode: "HYD",
      riskTier: "HIGH_RISK",
      corroboratedSocietiesCount: 2,
      actionGuidance: "VERIFY_GOVT_ID_AND_HOST_CALLBACK",
    });
    const verdict = await federationRiskService.assessCityRisk("HYD", "+919876543210", 2);
    expect(verdict.riskTier).toBe("HIGH_RISK");
  });
});
