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
});
