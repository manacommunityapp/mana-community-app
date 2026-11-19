import { describe, it, expect } from "vitest";
import type { FeedScorecard } from "../../../types/sportsSocial";
import { sportsSocialService } from "../../../services/sports/sportsSocialService";

// Test helper to verify resolveWinner logic matching WinnerScorecard
function testResolveWinner(sc: FeedScorecard): {
  winnerSide: "A" | "B" | "TIE" | "UNKNOWN";
  winningName: string;
  isTie: boolean;
} {
  const normWinner = sc.winner?.toUpperCase().trim();
  const teamA = sc.teamA || "Team A";
  const teamB = sc.teamB || "Team B";
  const res = (sc.result || "").toLowerCase();

  let side: "A" | "B" | "TIE" | "UNKNOWN" = "UNKNOWN";

  if (normWinner === "A") side = "A";
  else if (normWinner === "B") side = "B";
  else if (normWinner === "TIE" || res.includes("tied") || res.includes("draw")) side = "TIE";
  else if (sc.winnerName) {
    if (sc.winnerName.toLowerCase().includes(teamA.toLowerCase())) side = "A";
    else if (sc.winnerName.toLowerCase().includes(teamB.toLowerCase())) side = "B";
  } else if (res) {
    const aInResult = res.includes(teamA.toLowerCase());
    const bInResult = res.includes(teamB.toLowerCase());
    const hasWinWord = /won|defend|beat|victory|claim/.test(res);
    if (aInResult && hasWinWord && !bInResult) side = "A";
    else if (bInResult && hasWinWord && !aInResult) side = "B";
  }

  if (side === "UNKNOWN") {
    const numA = parseInt(sc.scoreA, 10);
    const numB = parseInt(sc.scoreB, 10);
    if (!isNaN(numA) && !isNaN(numB) && !sc.scoreA.includes("/") && !sc.scoreB.includes("/")) {
      if (numA > numB) side = "A";
      else if (numB > numA) side = "B";
      else if (numA === numB) side = "TIE";
    }
  }

  return {
    winnerSide: side,
    winningName: side === "B" ? teamB : teamA,
    isTie: side === "TIE",
  };
}

describe("WinnerScorecard Logic & Sports Feed Presentation", () => {
  it("resolves explicit winner 'A' and 'B'", () => {
    const cardA: FeedScorecard = {
      teamA: "Lions",
      teamB: "Tigers",
      scoreA: "150/4",
      scoreB: "140/8",
      result: "Lions won by 10 runs",
      venue: "Ground 1",
      date: "2026-10-30",
      winner: "A",
    };
    expect(testResolveWinner(cardA).winnerSide).toBe("A");
    expect(testResolveWinner(cardA).winningName).toBe("Lions");

    const cardB: FeedScorecard = {
      ...cardA,
      winner: "B",
      winnerName: "Tigers",
      result: "Tigers won by 2 wickets",
    };
    expect(testResolveWinner(cardB).winnerSide).toBe("B");
    expect(testResolveWinner(cardB).winningName).toBe("Tigers");
  });

  it("infers winner from result narrative when winner flag is omitted", () => {
    const card: FeedScorecard = {
      teamA: "Whitefield Warriors",
      teamB: "Sarjapur Strikers",
      scoreA: "142/6 (20 ov)",
      scoreB: "139/8 (20 ov)",
      result: "Whitefield Warriors won by 3 runs",
      venue: "SmashZone",
      date: "2026-10-28",
    };
    const outcome = testResolveWinner(card);
    expect(outcome.winnerSide).toBe("A");
    expect(outcome.winningName).toBe("Whitefield Warriors");
    expect(outcome.isTie).toBe(false);
  });

  it("infers winner for generic sports from numeric scores (e.g. football)", () => {
    const footballMatch: FeedScorecard = {
      teamA: "HSR FC",
      teamB: "Koramangala United",
      scoreA: "3",
      scoreB: "1",
      result: "Full time: 3 - 1",
      venue: "HSR Ground",
      date: "2026-10-27",
    };
    const outcome = testResolveWinner(footballMatch);
    expect(outcome.winnerSide).toBe("A");
    expect(outcome.winningName).toBe("HSR FC");
  });

  it("correctly handles tied matches", () => {
    const tiedMatch: FeedScorecard = {
      teamA: "Team Alpha",
      teamB: "Team Beta",
      scoreA: "145/8",
      scoreB: "145/9",
      result: "Match Tied (Super over next)",
      venue: "Main Stadium",
      date: "2026-10-29",
      winner: "TIE",
    };
    const outcome = testResolveWinner(tiedMatch);
    expect(outcome.isTie).toBe(true);
    expect(outcome.winnerSide).toBe("TIE");
  });

  it("sportsSocialService seed feed contains rich winner metadata and player of match stats", () => {
    const feed = sportsSocialService.getFeed();
    const cricketPost = feed.find((p) => p.id === "fp-1");
    expect(cricketPost).toBeDefined();
    expect(cricketPost?.scorecard).toBeDefined();
    expect(cricketPost?.scorecard?.winner).toBe("A");
    expect(cricketPost?.scorecard?.winnerName).toBe("Whitefield Warriors");
    expect(cricketPost?.scorecard?.playerOfMatch).toBe("Deepak Nair");
    expect(cricketPost?.scorecard?.playerOfMatchStats).toContain("4/18");
    expect(cricketPost?.scorecard?.stage).toContain("Quarter-Final");

    const footballPost = feed.find((p) => p.id === "fp-3");
    expect(footballPost).toBeDefined();
    expect(footballPost?.scorecard?.winner).toBe("A");
    expect(footballPost?.scorecard?.playerOfMatch).toBe("Vikram Singh");
    expect(footballPost?.scorecard?.playerOfMatchStats).toContain("2 Goals");
  });
});
