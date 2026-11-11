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
});
