import { describe, it, expect, vi, beforeEach } from "vitest";
import { tournamentService, invalidateMatchesCache } from "./tournamentService";
import { apiClient } from "../common/apiClient";

describe("tournamentService - getMatchesByConfigId deduplication & caching", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    invalidateMatchesCache();
  });

  it("deduplicates simultaneous in-flight calls to getMatchesByConfigId", async () => {
    const mockMatches = [
      { matchId: 101, configId: 54, homeTeamName: "Alpha", awayTeamName: "Bravo" },
      { matchId: 102, configId: 54, homeTeamName: "Charlie", awayTeamName: "Delta" },
    ];

    let resolveApi: (data: any) => void;
    const pendingPromise = new Promise((resolve) => {
      resolveApi = resolve;
    });

    const getSpy = vi.spyOn(apiClient, "get").mockImplementation(() => pendingPromise as any);

    // Fire 3 simultaneous calls for config 54
    const p1 = tournamentService.getMatchesByConfigId(54);
    const p2 = tournamentService.getMatchesByConfigId(54);
    const p3 = tournamentService.getMatchesByConfigId(54);

    // Only 1 network call should have been triggered
    expect(getSpy).toHaveBeenCalledTimes(1);
    expect(getSpy).toHaveBeenCalledWith("/tournament/54/matches");

    // Resolve the single network call
    resolveApi!(mockMatches);

    const [res1, res2, res3] = await Promise.all([p1, p2, p3]);

    expect(res1).toEqual(mockMatches);
    expect(res2).toEqual(mockMatches);
    expect(res3).toEqual(mockMatches);
    expect(getSpy).toHaveBeenCalledTimes(1);
  });

  it("serves subsequent calls from TTL cache without additional network requests", async () => {
    const mockMatches = [{ matchId: 201, configId: 54, roundName: "Final" }];
    const getSpy = vi.spyOn(apiClient, "get").mockResolvedValue(mockMatches);

    const firstCall = await tournamentService.getMatchesByConfigId(54);
    expect(firstCall).toEqual(mockMatches);
    expect(getSpy).toHaveBeenCalledTimes(1);

    // Immediate second call should be served from memory cache
    const secondCall = await tournamentService.getMatchesByConfigId(54);
    expect(secondCall).toEqual(mockMatches);
    expect(getSpy).toHaveBeenCalledTimes(1);

    // Third call via getMatchesByConfigIdForAnalytics should also share the cache
    const analyticsCall = await tournamentService.getMatchesByConfigIdForAnalytics(54);
    expect(analyticsCall).toEqual(mockMatches);
    expect(getSpy).toHaveBeenCalledTimes(1);
  });

  it("bypasses cache when forceRefresh is true", async () => {
    const mockInitial = [{ matchId: 301, configId: 54, status: "SCHEDULED" }];
    const mockRefreshed = [{ matchId: 301, configId: 54, status: "LIVE" }];

    const getSpy = vi
      .spyOn(apiClient, "get")
      .mockResolvedValueOnce(mockInitial)
      .mockResolvedValueOnce(mockRefreshed);

    const firstCall = await tournamentService.getMatchesByConfigId(54);
    expect(firstCall).toEqual(mockInitial);
    expect(getSpy).toHaveBeenCalledTimes(1);

    // Forced refresh should hit the network again
    const forcedCall = await tournamentService.getMatchesByConfigId(54, true);
    expect(forcedCall).toEqual(mockRefreshed);
    expect(getSpy).toHaveBeenCalledTimes(2);
  });

  it("invalidates cache when invalidateMatchesCache is called", async () => {
    const mockMatches = [{ matchId: 401, configId: 54 }];
    const getSpy = vi.spyOn(apiClient, "get").mockResolvedValue(mockMatches);

    await tournamentService.getMatchesByConfigId(54);
    expect(getSpy).toHaveBeenCalledTimes(1);

    // Invalidate config 54
    invalidateMatchesCache(54);

    // Next call should query network again
    await tournamentService.getMatchesByConfigId(54);
    expect(getSpy).toHaveBeenCalledTimes(2);
  });

  it("invalidates cache when matches status is updated", async () => {
    const mockMatches = [{ matchId: 501, configId: 54 }];
    const getSpy = vi.spyOn(apiClient, "get").mockResolvedValue(mockMatches);
    vi.spyOn(apiClient, "put").mockResolvedValue({ success: true });

    await tournamentService.getMatchesByConfigId(54);
    expect(getSpy).toHaveBeenCalledTimes(1);

    // Mutating call
    await tournamentService.updateMatchesStatus(54, "PUBLISHED");

    // Next get call should refetch
    await tournamentService.getMatchesByConfigId(54);
    expect(getSpy).toHaveBeenCalledTimes(2);
  });

  it("cleans up in-flight promise map even if network call rejects", async () => {
    const getSpy = vi
      .spyOn(apiClient, "get")
      .mockRejectedValueOnce(new Error("Network Error"))
      .mockResolvedValueOnce([{ matchId: 601, configId: 54 }]);

    const failedCall = await tournamentService.getMatchesByConfigId(54);
    expect(failedCall).toEqual([]); // Safe fallback
    expect(getSpy).toHaveBeenCalledTimes(1);

    // In-flight entry should have been cleaned up so retry works
    const retryCall = await tournamentService.getMatchesByConfigId(54);
    expect(retryCall).toEqual([{ matchId: 601, configId: 54 }]);
    expect(getSpy).toHaveBeenCalledTimes(2);
  });
});
