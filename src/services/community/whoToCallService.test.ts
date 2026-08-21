import { describe, it, expect, vi, beforeEach } from "vitest";
import { whoToCallService } from "./whoToCallService";
import { apiClient } from "../common/apiClient";
import type { CommunityWhoToCallRequest, CommunityWhoToCallResponse, CommunityWhoToCallHistoryResponse } from "../../types/api";

vi.mock("../common/apiClient", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("whoToCallService - Frontend API Client Test Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getWhoToCallList calls GET /community/who-to-call", async () => {
    const mockList: CommunityWhoToCallResponse[] = [
      {
        id: 1,
        communityId: 10,
        department: "Maintenance",
        contactPerson: "Rajesh Kumar",
        phoneNumber: "9876543210",
        isEmergency: false,
        icon: "Wrench",
        color: "text-orange-700",
        displayOrder: 1,
        isActive: true,
      },
    ];

    (apiClient.get as any).mockResolvedValueOnce(mockList);

    const result = await whoToCallService.getWhoToCallList();

    expect(apiClient.get).toHaveBeenCalledWith("/community/who-to-call");
    expect(result).toEqual(mockList);
  });

  it("createWhoToCall calls POST /community/who-to-call with payload", async () => {
    const payload: CommunityWhoToCallRequest = {
      department: "Lift Emergency",
      contactPerson: "Security Desk",
      phoneNumber: "9876500000",
      isEmergency: true,
      availability: "24/7 Available",
    };

    const mockSaved: CommunityWhoToCallResponse = {
      id: 2,
      communityId: 10,
      ...payload,
      isEmergency: true,
      icon: "HelpCircle",
      color: "text-indigo-600",
      displayOrder: 0,
      isActive: true,
    };

    (apiClient.post as any).mockResolvedValueOnce(mockSaved);

    const result = await whoToCallService.createWhoToCall(payload);

    expect(apiClient.post).toHaveBeenCalledWith("/community/who-to-call", payload);
    expect(result).toEqual(mockSaved);
  });

  it("getCommunityHistory calls GET /community/who-to-call/history", async () => {
    const mockHistory: CommunityWhoToCallHistoryResponse[] = [
      {
        id: 1,
        whoToCallId: 2,
        communityId: 10,
        action: "CREATED",
        changedByName: "Admin",
        department: "Lift Emergency",
        contactPerson: "Security Desk",
        phoneNumber: "9876500000",
        createdAt: "2026-08-21T01:30:00Z",
      },
    ];

    (apiClient.get as any).mockResolvedValueOnce(mockHistory);

    const result = await whoToCallService.getCommunityHistory();

    expect(apiClient.get).toHaveBeenCalledWith("/community/who-to-call/history");
    expect(result).toEqual(mockHistory);
  });
});
