import { apiClient } from "../common/apiClient";

export type ExpressEntryMode = "COURIER_ICON" | "OTP_6_DIGIT" | "QR_PASS" | "GUARD_OVERRIDE_PHOTO";
export type AccountingRuleType = "PENALTY_WAIVER" | "GST_OVERRIDE" | "SINKING_FUND_SURCHARGE" | "LATE_FEE_CAP";
export type GuardrailType = "BULKHEAD_POOL" | "RUSH_HOUR_FREEZE" | "AUTO_ROLLBACK" | "CHAOS_GAMEDAY";

export interface ExpressCheckinRequest {
  communityId: number;
  gateId: string;
  guardId: number;
  clientSeqId: number;
  entryMode: ExpressEntryMode;
  brandCode?: string;
  flatNo: string;
  photoUrl?: string;
}

export interface ExpressCheckinResponse {
  checkin: {
    id: number;
    gateId: string;
    clientSeqId: number;
    entryMode: ExpressEntryMode;
    requiresMcReview: boolean;
    audioCue: string;
  };
  idempotentReplay: boolean;
  audioCue: string;
}

export interface TenantAccountingRuleInput {
  communityId: number;
  ruleKey: string;
  ruleType: AccountingRuleType;
  rateBps: number;
  flatAmountPaise: number;
  effectiveFrom: string;
  effectiveTo: string;
  dryRunOnly: boolean;
  active: boolean;
  auditReason?: string;
}

export interface RuleEvaluationResult {
  originalPaise: number;
  previewAdjustedPaise: number;
  effectiveCommittedPaise: number;
  deltaPaise: number;
  appliedRuleKey: string;
  dryRunOnly: boolean;
  ruleApplied: boolean;
}

/**
 * Pure UI helper determining whether a guard override button requires photo capture before allowing entry.
 */
export function validateExpressTapReady(entryMode: ExpressEntryMode, photoUrl?: string): { ready: boolean; reason?: string } {
  if (entryMode === "GUARD_OVERRIDE_PHOTO" && (!photoUrl || photoUrl.trim().length === 0)) {
    return { ready: false, reason: "PHOTO_REQUIRED_FOR_OVERRIDE" };
  }
  return { ready: true };
}

export const opsResilienceService = {
  recordExpressCheckin(req: ExpressCheckinRequest): Promise<ExpressCheckinResponse> {
    return apiClient.post<ExpressCheckinResponse>("/v1/ops/guard-express/checkin", req);
  },

  listPendingOverrides(communityId: number) {
    return apiClient.get<ExpressCheckinResponse["checkin"][]>(`/v1/ops/guard-express/overrides?communityId=${communityId}`);
  },

  upsertAccountingRule(req: TenantAccountingRuleInput) {
    return apiClient.post("/v1/ops/accounting-rules", req);
  },

  evaluateAccountingRule(communityId: number, ruleKey: string, basePaise: number): Promise<RuleEvaluationResult> {
    return apiClient.post<RuleEvaluationResult>("/v1/ops/accounting-rules/evaluate", {
      communityId,
      ruleKey,
      basePaise,
    });
  },

  verifyPostmortemGuardrail(guardrailId: number) {
    return apiClient.post(`/v1/ops/postmortems/guardrails/${guardrailId}/verify`, {});
  },

  closePostmortem(postmortemId: number) {
    return apiClient.post(`/v1/ops/postmortems/${postmortemId}/close`, {});
  },
};
