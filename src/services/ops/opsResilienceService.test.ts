import { describe, it, expect, vi, beforeEach } from "vitest";
import { validateExpressTapReady, opsResilienceService } from "./opsResilienceService";
import { apiClient } from "../common/apiClient";

vi.mock("../common/apiClient", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe("Ops Resilience: Guard Express Flow, Declarative Billing & Blameless Post-Mortems", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("enforces photo capture only on manual guard overrides while keeping courier icons 1-tap", () => {
    expect(validateExpressTapReady("COURIER_ICON")).toEqual({ ready: true });
    expect(validateExpressTapReady("GUARD_OVERRIDE_PHOTO")).toEqual({
      ready: false,
      reason: "PHOTO_REQUIRED_FOR_OVERRIDE",
    });
    expect(validateExpressTapReady("GUARD_OVERRIDE_PHOTO", "s3://gate/pic-1.jpg")).toEqual({ ready: true });
  });

  it("submits guard express check-in and evaluates declarative dry-run accounting rule", async () => {
    (apiClient.post as any).mockResolvedValueOnce({
      idempotentReplay: false,
      audioCue: "ALLOW_CHIME",
      checkin: { gateId: "GATE-1", clientSeqId: 501, requiresMcReview: false },
    });

    const res = await opsResilienceService.recordExpressCheckin({
      communityId: 412,
      gateId: "GATE-1",
      guardId: 99,
      clientSeqId: 501,
      entryMode: "COURIER_ICON",
      brandCode: "AMAZON",
      flatNo: "B-404",
    });
    expect(res.audioCue).toBe("ALLOW_CHIME");

    (apiClient.post as any).mockResolvedValueOnce({
      originalPaise: 100000,
      previewAdjustedPaise: 90000,
      effectiveCommittedPaise: 100000,
      deltaPaise: -10000,
      appliedRuleKey: "MONSOON_WAIVER",
      dryRunOnly: true,
      ruleApplied: true,
    });

    const evalRes = await opsResilienceService.evaluateAccountingRule(412, "MONSOON_WAIVER", 100000);
    expect(evalRes.dryRunOnly).toBe(true);
    expect(evalRes.previewAdjustedPaise).toBe(90000);
    expect(evalRes.effectiveCommittedPaise).toBe(100000);
  });
});
