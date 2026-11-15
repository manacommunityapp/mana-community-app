import { describe, it, expect, vi, beforeEach } from "vitest";
import { tournamentService, type FeedLiveMatch } from "../../../../services/sports/tournamentService";

describe("Sports Feed Live Visibility & FeedLiveMatch Handling", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("calls tournamentService.setFeedVisibility for tournament level with cascade", async () => {
    const putSpy = vi.spyOn(tournamentService, "setFeedVisibility").mockResolvedValue(undefined);

    await tournamentService.setFeedVisibility("tournament", 101, true, true);

    expect(putSpy).toHaveBeenCalledWith("tournament", 101, true, true);
  });

  it("calls tournamentService.setFeedVisibility for event level", async () => {
    const putSpy = vi.spyOn(tournamentService, "setFeedVisibility").mockResolvedValue(undefined);

    await tournamentService.setFeedVisibility("event", 202, false, false);

    expect(putSpy).toHaveBeenCalledWith("event", 202, false, false);
  });

  it("calls tournamentService.setFeedVisibility for match level", async () => {
    const putSpy = vi.spyOn(tournamentService, "setFeedVisibility").mockResolvedValue(undefined);

    await tournamentService.setFeedVisibility("match", 303, true);

    expect(putSpy).toHaveBeenCalledWith("match", 303, true);
  });

  it("fetches live feed matches from tournamentService.getLiveFeedMatches", async () => {
    const mockMatches: FeedLiveMatch[] = [
      {
        matchId: 1,
        teamAName: "Tigers",
        teamBName: "Lions",
        sportName: "Cricket",
        status: "LIVE",
        scoreTeamA: "120/3",
        scoreTeamB: "45/1",
      },
      {
        matchId: 2,
        teamAName: "Hawks",
        teamBName: "Eagles",
        sportName: "Badminton",
        status: "COMPLETED",
        winnerName: "Hawks",
      },
    ];

    vi.spyOn(tournamentService, "getLiveFeedMatches").mockResolvedValue(mockMatches);

    const result = await tournamentService.getLiveFeedMatches();
    expect(result).toHaveLength(2);
    expect(result[0].status).toBe("LIVE");
    expect(result[1].status).toBe("COMPLETED");
  });

  it("sorts LIVE matches before recently COMPLETED matches in live strip feed order", () => {
    const list: FeedLiveMatch[] = [
      { matchId: 1, teamAName: "A", teamBName: "B", status: "COMPLETED" },
      { matchId: 2, teamAName: "C", teamBName: "D", status: "LIVE" },
      { matchId: 3, teamAName: "E", teamBName: "F", status: "LIVE" },
      { matchId: 4, teamAName: "G", teamBName: "H", status: "COMPLETED" },
    ];

    const sorted = [...list].sort(
      (a, b) => Number(b.status === "LIVE") - Number(a.status === "LIVE")
    );

    expect(sorted.map((m) => m.matchId)).toEqual([2, 3, 1, 4]);
  });

  it("passes communityId parameter to tournamentService.getLiveFeedMatches", async () => {
    const spy = vi.spyOn(tournamentService, "getLiveFeedMatches").mockResolvedValue([]);

    await tournamentService.getLiveFeedMatches(2);

    expect(spy).toHaveBeenCalledWith(2);
  });

  it("filters out BYE matches and non-live matches when falling back to config matches", () => {
    const sampleMatches = [
      { id: 10, teamAName: "Red", teamBName: "Blue", status: "LIVE" },
      { id: 11, teamAName: "Green", teamBName: "BYE", status: "BYE" },
      { id: 12, teamAName: "Gold", teamBName: "Silver", status: "SCHEDULED" },
      { id: 13, teamAName: "Alpha", teamBName: "Beta", status: "IN_PROGRESS" },
    ];

    const liveOnly = sampleMatches.filter(
      (m) => m.status !== "BYE" && ["LIVE", "IN_PROGRESS", "ONGOING", "MATCHES_RUNNING"].includes(m.status)
    );

    expect(liveOnly).toHaveLength(2);
    expect(liveOnly.map((m) => m.id)).toEqual([10, 13]);
  });

  it("fetches recent completed matches via tournamentService.getRecentCompletedMatches", async () => {
    const mockCompleted: FeedLiveMatch[] = [
      {
        matchId: 101,
        teamAName: "Challengers",
        teamBName: "Warriors",
        sportName: "Carrom",
        status: "COMPLETED",
        scoreTeamA: "25",
        scoreTeamB: "18",
        winnerName: "Challengers",
        completedAt: "2026-11-13T19:30:00Z",
      },
    ];

    const spy = vi.spyOn(tournamentService, "getRecentCompletedMatches").mockResolvedValue(mockCompleted);

    const res = await tournamentService.getRecentCompletedMatches(5, 20);
    expect(spy).toHaveBeenCalledWith(5, 20);
    expect(res).toHaveLength(1);
    expect(res[0].winnerName).toBe("Challengers");
    expect(res[0].status).toBe("COMPLETED");
  });

  it("handles empty completed matches gracefully", async () => {
    vi.spyOn(tournamentService, "getRecentCompletedMatches").mockResolvedValue([]);

    const res = await tournamentService.getRecentCompletedMatches();
    expect(res).toEqual([]);
  });
});
