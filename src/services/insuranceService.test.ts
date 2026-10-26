import { describe, it, expect, vi, beforeEach } from "vitest";
import { insuranceService } from "./insuranceService";
import { apiClient } from "./common/apiClient";
import {
  maskPolicyNumber,
  newIdempotencyKey,
  isExpired,
  daysUntil,
  renewalBucket,
  isSafeHandoffUrl,
  sortCatalogue,
  buildComparison,
  validateQuoteFields,
  normaliseRegNo,
  categoryLabel,
  categoryFromParam,
} from "../constants/insurance";
import type { CatalogueItem } from "../types/insurance";

vi.mock("./common/apiClient", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("insuranceService API calls", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("catalogue calls GET /insurance/catalogue with category param", async () => {
    const mockData = [{ productId: 1, name: "Care Shield" }];
    (apiClient.get as any).mockResolvedValueOnce(mockData);

    const result = await insuranceService.catalogue("HEALTH");
    expect(apiClient.get).toHaveBeenCalledWith("/insurance/catalogue?category=HEALTH");
    expect(result).toEqual(mockData);
  });

  it("grantConsent calls POST /insurance/consents", async () => {
    const mockConsent = { id: 10, purpose: "QUOTE_SHARING", noticeVersion: "v1", eventType: "GRANTED" };
    (apiClient.post as any).mockResolvedValueOnce(mockConsent);

    const result = await insuranceService.grantConsent("QUOTE_SHARING", "v1", 42);
    expect(apiClient.post).toHaveBeenCalledWith("/insurance/consents", {
      purpose: "QUOTE_SHARING",
      noticeVersion: "v1",
      partnerId: 42,
    });
    expect(result).toEqual(mockConsent);
  });

  it("withdrawConsent calls POST /insurance/consents/:id/withdraw", async () => {
    const mockWithdrawn = { id: 10, eventType: "WITHDRAWN" };
    (apiClient.post as any).mockResolvedValueOnce(mockWithdrawn);

    const result = await insuranceService.withdrawConsent(10);
    expect(apiClient.post).toHaveBeenCalledWith("/insurance/consents/10/withdraw");
    expect(result).toEqual(mockWithdrawn);
  });

  it("policies calls GET /insurance/policies", async () => {
    const mockPolicies = [{ id: 1, productName: "Optima Secure" }];
    (apiClient.get as any).mockResolvedValueOnce(mockPolicies);

    const result = await insuranceService.policies();
    expect(apiClient.get).toHaveBeenCalledWith("/insurance/policies");
    expect(result).toEqual(mockPolicies);
  });

  it("deletePolicy calls DELETE /insurance/policies/:id", async () => {
    (apiClient.delete as any).mockResolvedValueOnce({});
    await insuranceService.deletePolicy(5);
    expect(apiClient.delete).toHaveBeenCalledWith("/insurance/policies/5");
  });

  it("claimCases calls GET /insurance/claims-assistance", async () => {
    const mockClaims = [{ id: 1, caseRef: "CLM-001" }];
    (apiClient.get as any).mockResolvedValueOnce(mockClaims);

    const result = await insuranceService.claimCases();
    expect(apiClient.get).toHaveBeenCalledWith("/insurance/claims-assistance");
    expect(result).toEqual(mockClaims);
  });

  it("createGroupEnquiry calls POST /insurance/group-enquiries", async () => {
    const mockResp = { id: 99, enquiryRef: "GRP-123" };
    (apiClient.post as any).mockResolvedValueOnce(mockResp);

    const input = {
      organisationName: "Greenwood Society",
      organisationType: "RWA",
      coverageScope: "COMMON_PROPERTY" as const,
      coverageSought: "Fire & Allied",
      approxMembers: 120,
      contactMethod: "EMAIL" as const,
      consentId: 7,
    };
    const result = await insuranceService.createGroupEnquiry(input);
    expect(apiClient.post).toHaveBeenCalledWith("/insurance/group-enquiries", input);
    expect(result).toEqual(mockResp);
  });
});

describe("Insurance Constants & Helper Logic", () => {
  it("maskPolicyNumber masks all characters except last 4", () => {
    expect(maskPolicyNumber(undefined)).toBe("—");
    expect(maskPolicyNumber("")).toBe("—");
    expect(maskPolicyNumber("AB12")).toBe("XXXX");
    expect(maskPolicyNumber("POL123456789")).toBe("XXXXXX6789");
    expect(maskPolicyNumber("POL-99-88-77")).toBe("XXXXXX8877");
  });

  it("newIdempotencyKey creates unique keys starting with q-", () => {
    const k1 = newIdempotencyKey(1, () => 0.1);
    const k2 = newIdempotencyKey(2, () => 0.9);
    expect(k1).toMatch(/^q-/);
    expect(k1).not.toBe(k2);
  });

  it("isExpired identifies expired vs active dates", () => {
    const now = new Date("2026-10-17T12:00:00Z");
    expect(isExpired("2026-10-16T00:00:00Z", now)).toBe(true);
    expect(isExpired("2026-10-18T00:00:00Z", now)).toBe(false);
    expect(isExpired("invalid-date", now)).toBe(true);
  });

  it("daysUntil calculates days correctly", () => {
    const now = new Date("2026-10-17");
    expect(daysUntil(undefined, now)).toBeNull();
    expect(daysUntil("2026-10-17", now)).toBe(0);
    expect(daysUntil("2026-10-27", now)).toBe(10);
    expect(daysUntil("2026-10-07", now)).toBe(-10);
  });

  it("renewalBucket categorizes overdue, due 30, due 60, and later", () => {
    const now = new Date("2026-10-17");
    expect(renewalBucket({ expiryDate: "2026-10-10" }, now)).toBe("OVERDUE");
    expect(renewalBucket({ expiryDate: "2026-11-01" }, now)).toBe("DUE_30");
    expect(renewalBucket({ expiryDate: "2026-12-01" }, now)).toBe("DUE_60");
    expect(renewalBucket({ expiryDate: "2027-05-01" }, now)).toBe("LATER");
    expect(renewalBucket({ expiryDate: null }, now)).toBe("UNKNOWN");
  });

  it("isSafeHandoffUrl validates allowed partner domains and https only", () => {
    const host = "partner.hdfcergo.com";
    expect(isSafeHandoffUrl("https://partner.hdfcergo.com/quote/123", host)).toBe(true);
    expect(isSafeHandoffUrl("http://partner.hdfcergo.com/quote", host)).toBe(false);
    expect(isSafeHandoffUrl("https://attacker.com/quote", host)).toBe(false);
    expect(isSafeHandoffUrl("https://user:pass@partner.hdfcergo.com/quote", host)).toBe(false);
    expect(isSafeHandoffUrl("", host)).toBe(false);
  });

  it("sortCatalogue sorts by NAME and INSURER", () => {
    const items: CatalogueItem[] = [
      { productVersionId: 1, productId: 1, category: "HEALTH", name: "Zenith Care", versionNo: 1, insurerName: "Bajaj", partnerType: "INSURER", dataSource: "PARTNER" },
      { productVersionId: 2, productId: 2, category: "HEALTH", name: "Apex Health", versionNo: 1, insurerName: "Aditya", partnerType: "INSURER", dataSource: "PARTNER" },
    ];

    const sortedByName = sortCatalogue(items, "NAME");
    expect(sortedByName[0].name).toBe("Apex Health");

    const sortedByInsurer = sortCatalogue(items, "INSURER");
    expect(sortedByInsurer[0].insurerName).toBe("Aditya");
  });

  it("buildComparison creates neutral side-by-side rows without fabricated fields", () => {
    const items: CatalogueItem[] = [
      { productVersionId: 1, productId: 1, category: "HEALTH", name: "Plan A", versionNo: 1, insurerName: "Insurer 1", partnerType: "INSURER", dataSource: "PARTNER" },
      { productVersionId: 2, productId: 2, category: "HEALTH", name: "Plan B", versionNo: 1, insurerName: "Insurer 2", partnerType: "INSURER", dataSource: "PARTNER" },
    ];
    const rows = buildComparison(items);
    expect(rows.length).toBeGreaterThan(5);
    const insurerRow = rows.find((r) => r.label === "Insurer");
    expect(insurerRow?.differs).toBe(true);
    expect(rows.some((r) => /settlement|cheapest|best/i.test(r.label))).toBe(false);
  });

  it("validateQuoteFields validates category constraints", () => {
    const today = new Date("2026-10-17");

    // HEALTH: valid memberAges + pincode
    const validHealth = validateQuoteFields("HEALTH", { memberAges: [32, 28], pincode: "560100" }, today);
    expect(Object.keys(validHealth)).toHaveLength(0);

    // HEALTH: invalid pincode
    const invalidPin = validateQuoteFields("HEALTH", { memberAges: [30], pincode: "123" }, today);
    expect(invalidPin).toHaveProperty("pincode");

    // LIFE_TERM: age boundary
    const underage = validateQuoteFields("LIFE_TERM", { age: 16, annualIncome: 600000, smoker: false }, today);
    expect(underage).toHaveProperty("age");

    // TRAVEL: past date
    const pastTravel = validateQuoteFields("TRAVEL", { destination: "Dubai", startDate: "2026-09-01", endDate: "2026-09-10", travellers: 1 }, today);
    expect(pastTravel).toHaveProperty("startDate");
  });

  it("normaliseRegNo cleans registration numbers", () => {
    expect(normaliseRegNo("ka 01-ab-1234")).toBe("KA01AB1234");
    expect(normaliseRegNo("mh02cd5678")).toBe("MH02CD5678");
  });

  it("category helpers return human labels and keys", () => {
    expect(categoryLabel("MOTOR_CAR")).toBe("Car Insurance");
    expect(categoryFromParam("motor_car")).toBe("MOTOR_CAR");
    expect(categoryFromParam("invalid")).toBeUndefined();
  });
});