import { describe, it, expect, vi, beforeEach } from "vitest";
import { expressDeliveryService } from "./expressDeliveryService";
import { apiClient } from "../common/apiClient";

vi.mock("../common/apiClient", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

describe("expressDeliveryService (Web Express Entry Partner Suite)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("verifies express entry token and triggers boom barrier", async () => {
    const mockResult = {
      allowed: true,
      message: "PRE-APPROVED: Blinkit delivery authorized for Flat 402",
      orderId: "BLNK-123",
      partner: "BLINKIT",
      riderName: "Ravi Kumar",
      flatNumber: "B-402",
      barrierAction: "OPEN_BOOM_BARRIER",
      timestamp: "2026-11-26T22:00:00Z",
    };

    (apiClient.post as any).mockResolvedValueOnce({ data: mockResult });

    const res = await expressDeliveryService.verifyEntry("EXP-7729", "GATE_1");

    expect(res.allowed).toBe(true);
    expect(res.barrierAction).toBe("OPEN_BOOM_BARRIER");
    expect(res.partner).toBe("BLINKIT");
    expect(apiClient.post).toHaveBeenCalledWith("/api/v1/partners/delivery/verify", {
      entryCode: "EXP-7729",
      gateId: "GATE_1",
    });
  });

  it("falls back to resilient offline verification when backend is offline", async () => {
    (apiClient.post as any).mockRejectedValueOnce(new Error("Network offline"));

    const res = await expressDeliveryService.verifyEntry("EXP-8812");

    expect(res.allowed).toBe(true);
    expect(res.barrierAction).toBe("OPEN_BOOM_BARRIER");
    expect(res.message).toContain("Cached clearance");
  });

  it("fetches resident delivery auto-approval preferences", async () => {
    const mockPref = {
      communityId: 1,
      flatNumber: "B-402",
      autoApproveSwiggy: true,
      autoApproveZomato: true,
      autoApproveBlinkit: true,
      autoApproveZepto: true,
      autoApproveAmazon: true,
      autoApproveOther: true,
      defaultLeaveAtGate: false,
    };

    (apiClient.get as any).mockResolvedValueOnce({ data: mockPref });

    const pref = await expressDeliveryService.getPreferences(1, "B-402");

    expect(pref.autoApproveBlinkit).toBe(true);
    expect(pref.defaultLeaveAtGate).toBe(false);
  });

  it("verifies EXP-B batch manifest in 1 tap and reconciles RTO exit", async () => {
    expect(expressDeliveryService.isBatchManifestCode("EXP-B-4410")).toBe(true);

    (apiClient.post as any).mockResolvedValueOnce({
      data: {
        success: true,
        allowed: true,
        manifestCode: "EXP-B-4410",
        status: "CHECKED_IN",
        totalPackages: 18,
        distinctFlats: 15,
        barrierAction: "OPEN_BOOM_BARRIER",
        message: "1-TAP BATCH CLEARANCE",
      },
    });

    const verifyRes = await expressDeliveryService.verifyBatchManifest("EXP-B-4410", "GATE_1");
    expect(verifyRes.allowed).toBe(true);
    expect(verifyRes.totalPackages).toBe(18);

    (apiClient.post as any).mockResolvedValueOnce({
      data: {
        success: true,
        allowed: true,
        manifestCode: "EXP-B-4410",
        status: "RTO_CARRIED_OUT",
        deliveredPackages: 15,
        pendingPackages: 3,
        barrierAction: "OPEN_EXIT_BARRIER",
        message: "Exit reconciled",
      },
    });

    const exitRes = await expressDeliveryService.reconcileBatchExit({
      manifestCode: "EXP-B-4410",
      gateId: "GATE_OUT",
      undeliveredOrderIds: ["AMZ-16", "AMZ-17", "AMZ-18"],
    });
    expect(exitRes.status).toBe("RTO_CARRIED_OUT");
    expect(exitRes.pendingPackages).toBe(3);
  });
});
