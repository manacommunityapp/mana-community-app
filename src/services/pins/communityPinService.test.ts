import { describe, it, expect, vi, beforeEach } from "vitest";
import { communityPinService } from "./communityPinService";
import { apiClient } from "../common/apiClient";

vi.mock("../common/apiClient", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe("communityPinService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getPins calls correct endpoint and returns data", async () => {
    const mockPins = [
      {
        id: 1,
        communityId: 101,
        authorId: 5,
        authorName: "John Doe",
        category: "ALERTS",
        content: "Water pump repair in progress",
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        isClosed: false,
        likesCount: 2,
        createdAt: new Date().toISOString(),
      },
    ];

    (apiClient.get as any).mockResolvedValue({ data: mockPins });

    const result = await communityPinService.getPins(101, "ALERTS");

    expect(apiClient.get).toHaveBeenCalledWith("/communities/101/pins", {
      params: { category: "ALERTS" },
    });
    expect(result).toEqual(mockPins);
  });

  it("createPin posts payload to correct endpoint", async () => {
    const payload = {
      category: "SPORTS",
      content: "Need 2 players for cricket",
      durationHours: 12,
    };

    const mockCreated = { id: 2, ...payload, communityId: 101 };
    (apiClient.post as any).mockResolvedValue({ data: mockCreated });

    const result = await communityPinService.createPin(101, payload);

    expect(apiClient.post).toHaveBeenCalledWith("/communities/101/pins", payload);
    expect(result.id).toBe(2);
  });

  it("closePin and likePin trigger corresponding POST actions", async () => {
    (apiClient.post as any).mockResolvedValue({ data: { id: 1, isClosed: true } });

    const closed = await communityPinService.closePin(101, 1);
    expect(apiClient.post).toHaveBeenCalledWith("/communities/101/pins/1/close", {});
    expect(closed.isClosed).toBe(true);

    (apiClient.post as any).mockResolvedValue({ data: { id: 1, likesCount: 5 } });
    const liked = await communityPinService.likePin(101, 1);
    expect(apiClient.post).toHaveBeenCalledWith("/communities/101/pins/1/like", {});
    expect(liked.likesCount).toBe(5);
  });
});
