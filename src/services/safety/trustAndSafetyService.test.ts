import { describe, it, expect, vi, beforeEach } from "vitest";
import { trustAndSafetyService } from "./trustAndSafetyService";

describe("trustAndSafetyService Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return trust & safety overview with verified members and active incidents", async () => {
    const overview = await trustAndSafetyService.getOverview();

    expect(overview).toBeDefined();
    expect(overview.totalVerifiedMembers).toBeGreaterThan(0);
    expect(overview.averageTrustScore).toBeGreaterThan(50);
    expect(overview.locationConsentAdherencePercent).toBe(100.0);

    expect(overview.recentMemberships.length).toBeGreaterThan(0);
    const verifiedMember = overview.recentMemberships.find((m) => m.kycStatus === "VERIFIED");
    expect(verifiedMember).toBeDefined();
    expect(verifiedMember?.trustBadge).toBeDefined();

    expect(overview.activeIncidents.length).toBeGreaterThan(0);
    const p1Incident = overview.activeIncidents.find((i) => i.severity === "CRITICAL_P1");
    expect(p1Incident).toBeDefined();
  });

  it("should verify membership KYC status and recalculate trust score", async () => {
    const updated = await trustAndSafetyService.verifyMembership(103, "VERIFIED", "Manual ID check passed");

    expect(updated).toBeDefined();
    expect(updated.kycStatus).toBe("VERIFIED");
    expect(updated.trustScore).toBeGreaterThanOrEqual(90);
    expect(updated.trustBadge).toBe("PLATINUM");
  });

  it("should set and update location consent preferences", async () => {
    const granted = await trustAndSafetyService.setLocationConsent("GEOFENCE_GATE", true, 101);

    expect(granted).toBeDefined();
    expect(granted.purpose).toBe("GEOFENCE_GATE");
    expect(granted.isGranted).toBe(true);

    const revoked = await trustAndSafetyService.setLocationConsent("GEOFENCE_GATE", false, 101);
    expect(revoked.isGranted).toBe(false);
  });

  it("should verify location access rules according to purpose exemptions", async () => {
    const emergencyCheck = await trustAndSafetyService.verifyLocationAccess(101, "EMERGENCY_SOS");
    expect(emergencyCheck.allowed).toBe(true);
    expect(emergencyCheck.auditReference).toBeDefined();
  });

  it("should include cryptographic SHA-256 hashes in recent audit trail", async () => {
    const overview = trustAndSafetyService.getMockOverview();

    expect(overview.recentAuditTrail.length).toBeGreaterThan(0);
    for (const audit of overview.recentAuditTrail) {
      expect(audit.sha256Hash).toBeDefined();
      expect(audit.sha256Hash.length).toBe(64);
      expect(audit.operatorName).toBeDefined();
    }
  });
});