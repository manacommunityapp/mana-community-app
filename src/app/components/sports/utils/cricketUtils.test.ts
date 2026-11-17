import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  ballColor,
  remainingBalls,
  requiredRunRate,
  getLegalBallsInCurrentOver,
  isFreeHitActive,
  formatMatchShareText,
  canShareFiles,
  shareMatchCardImage,
} from "./cricketUtils";

describe("cricketUtils Test Suite", () => {
  describe("1. ballColor styling helper", () => {
    it("returns rose styling for wickets (W)", () => {
      expect(ballColor("W")).toBe("bg-rose-500 text-white border-rose-600 font-bold shadow-xs");
      expect(ballColor("W+1")).toBe("bg-rose-500 text-white border-rose-600 font-bold shadow-xs");
    });

    it("returns emerald styling for fours (4)", () => {
      expect(ballColor("4")).toBe("bg-emerald-500 text-white border-emerald-600 font-bold shadow-xs");
    });

    it("returns purple styling for sixes (6)", () => {
      expect(ballColor("6")).toBe("bg-purple-600 text-white border-purple-700 font-black shadow-xs");
    });

    it("returns amber styling for extras (wd, nb)", () => {
      expect(ballColor("1wd")).toBe("bg-amber-400 text-amber-950 border-amber-500 font-bold");
      expect(ballColor("nb")).toBe("bg-amber-400 text-amber-950 border-amber-500 font-bold");
      expect(ballColor("wd")).toBe("bg-amber-400 text-amber-950 border-amber-500 font-bold");
    });

    it("returns muted slate styling for dot balls (0)", () => {
      expect(ballColor("0")).toBe("bg-slate-800 text-slate-300 border-slate-700");
      expect(ballColor("•")).toBe("bg-slate-800 text-slate-300 border-slate-700");
    });

    it("returns indigo styling for normal singles, doubles, and triples", () => {
      expect(ballColor("1")).toBe("bg-indigo-600 text-white border-indigo-700 font-semibold");
      expect(ballColor("2")).toBe("bg-indigo-600 text-white border-indigo-700 font-semibold");
      expect(ballColor("3")).toBe("bg-indigo-600 text-white border-indigo-700 font-semibold");
    });
  });

  describe("2. remainingBalls calculation", () => {
    it("calculates remaining balls accurately in a default 20-over T20 match", () => {
      // 0.0 overs bowled -> 120 balls remaining
      expect(remainingBalls("0.0")).toBe(120);

      // 10.0 overs bowled -> 60 balls remaining
      expect(remainingBalls("10.0")).toBe(60);

      // 15.4 overs bowled -> 15*6 + 4 = 94 balls bowled -> 120 - 94 = 26 balls remaining
      expect(remainingBalls("15.4")).toBe(26);

      // 19.5 overs bowled -> 119 balls bowled -> 1 ball remaining
      expect(remainingBalls("19.5")).toBe(1);

      // 20.0 overs bowled -> 0 balls remaining
      expect(remainingBalls("20.0")).toBe(0);
    });

    it("calculates remaining balls with custom max overs (e.g. 10 overs / 50 overs)", () => {
      // 10 overs match, 6.3 bowled -> (6*6 + 3) = 39 bowled -> 60 - 39 = 21 remaining
      expect(remainingBalls("6.3", 10)).toBe(21);

      // 50 overs ODI match, 42.1 bowled -> (42*6 + 1) = 253 bowled -> 300 - 253 = 47 remaining
      expect(remainingBalls("42.1", 50)).toBe(47);
    });

    it("prevents negative balls when overs exceed maxOvers", () => {
      expect(remainingBalls("21.0", 20)).toBe(0);
      expect(remainingBalls("20.4", 20)).toBe(0);
    });

    it("handles invalid or empty strings gracefully", () => {
      expect(remainingBalls("")).toBe(120);
      expect(remainingBalls("abc")).toBe(120);
    });
  });

  describe("3. requiredRunRate (RRR) calculation", () => {
    it("calculates accurate RRR for a standard chase", () => {
      // Target 180, current 120 (need 60 runs), 10.0 overs bowled (60 balls = 10 overs remaining) -> RRR = 6.00
      expect(requiredRunRate(180, 120, "10.0", 20)).toBe("6.00");

      // Target 160, current 100 (need 60 runs), 15.0 overs bowled (30 balls = 5 overs remaining) -> RRR = 12.00
      expect(requiredRunRate(160, 100, "15.0", 20)).toBe("12.00");

      // Target 155, current 130 (need 25 runs), 17.3 overs bowled (15 balls = 2.5 overs remaining) -> 25 / 2.5 = 10.00
      expect(requiredRunRate(155, 130, "17.3", 20)).toBe("10.00");
    });

    it("returns '0.00' when target is reached or surpassed", () => {
      expect(requiredRunRate(150, 150, "16.0", 20)).toBe("0.00");
      expect(requiredRunRate(150, 155, "18.2", 20)).toBe("0.00");
    });

    it("returns '-' when no balls are remaining", () => {
      expect(requiredRunRate(180, 160, "20.0", 20)).toBe("-");
      expect(requiredRunRate(180, 160, "21.0", 20)).toBe("-");
    });
  });

  describe("4. getLegalBallsInCurrentOver", () => {
    it("extracts the ball count in current over from overs string", () => {
      expect(getLegalBallsInCurrentOver("0.0")).toBe(0);
      expect(getLegalBallsInCurrentOver("0.1")).toBe(1);
      expect(getLegalBallsInCurrentOver("3.4")).toBe(4);
      expect(getLegalBallsInCurrentOver("19.5")).toBe(5);
      expect(getLegalBallsInCurrentOver("5")).toBe(0);
      expect(getLegalBallsInCurrentOver("")).toBe(0);
    });
  });

  describe("5. isFreeHitActive", () => {
    it("detects free hit from thisOver array containing nb", () => {
      expect(isFreeHitActive(["0", "1", "1nb"])).toBe(true);
      expect(isFreeHitActive(["nb"])).toBe(true);
      expect(isFreeHitActive(["0", "4", "1wd"])).toBe(false);
      expect(isFreeHitActive(["0", "1", "4"])).toBe(false);
      expect(isFreeHitActive([])).toBe(false);
    });

    it("detects free hit from recentBalls array with NO_BALL", () => {
      expect(isFreeHitActive([], [{ extrasType: "NO_BALL" }])).toBe(true);
      expect(isFreeHitActive([], [{ commentary: "bowler oversteps, no ball called" }])).toBe(true);
      expect(isFreeHitActive([], [{ extrasType: "WIDE" }])).toBe(false);
    });

    it("disables free hit when house rules specify noFreeHits = true", () => {
      expect(isFreeHitActive(["0", "1nb"], undefined, true)).toBe(false);
      expect(isFreeHitActive([], [{ extrasType: "NO_BALL" }], true)).toBe(false);
      expect(isFreeHitActive(["nb"], [{ commentary: "no ball" }], true)).toBe(false);
    });
  });

  describe("6. formatMatchShareText", () => {
    it("formats WhatsApp scorecard message with scores and target", () => {
      const text = formatMatchShareText({
        teamAName: "Breeze Blasters",
        teamBName: "Cyclone Challengers",
        scoreA: "145/6 (20.0 ov)",
        scoreB: "89/3 (12.2 ov)",
        currentInnings: 2,
        target: 146,
        oversLimit: 20,
        matchUrl: "https://community.mana.com/sports/match/42",
      });

      expect(text).toContain("🏏 *Mana Community Cricket Live*");
      expect(text).toContain("🎯 Target: 146 runs from 20 overs");
      expect(text).toContain("• *Breeze Blasters*: 145/6 (20.0 ov)");
      expect(text).toContain("• *Cyclone Challengers*: 89/3 (12.2 ov)");
      expect(text).toContain("Follow ball-by-ball: https://community.mana.com/sports/match/42");
    });

    it("formats scorecard with winner summary when match completed", () => {
      const text = formatMatchShareText({
        teamAName: "Thunderbolts",
        teamBName: "Royal Strikers",
        scoreA: "160/4 (20.0 ov)",
        scoreB: "142/9 (20.0 ov)",
        winnerSummary: "Thunderbolts won by 18 runs",
      });

      expect(text).toContain("🏆 Thunderbolts won by 18 runs");
      expect(text).toContain("• *Thunderbolts*: 160/4 (20.0 ov)");
      expect(text).toContain("• *Royal Strikers*: 142/9 (20.0 ov)");
    });
  });

  describe("7. canShareFiles capability check", () => {
    it("returns false when navigator.share or canShare is not supported", () => {
      expect(canShareFiles()).toBe(false);
    });

    it("returns true when navigator.canShare supports files", () => {
      const originalNav = global.navigator;
      try {
        Object.defineProperty(global, "navigator", {
          value: {
            share: vi.fn(),
            canShare: vi.fn().mockReturnValue(true),
          },
          configurable: true,
          writable: true,
        });

        expect(canShareFiles()).toBe(true);
      } finally {
        Object.defineProperty(global, "navigator", {
          value: originalNav,
          configurable: true,
          writable: true,
        });
      }
    });
  });

  describe("8. shareMatchCardImage", () => {
    it("shares image via navigator.share when files are supported", async () => {
      const originalNav = global.navigator;
      const shareMock = vi.fn().mockResolvedValue(undefined);
      try {
        Object.defineProperty(global, "navigator", {
          value: {
            share: shareMock,
            canShare: vi.fn().mockReturnValue(true),
          },
          configurable: true,
          writable: true,
        });

        const blob = new Blob(["fake-image-bytes"], { type: "image/png" });
        const res = await shareMatchCardImage(blob, "scorecard.png", "Live match update");

        expect(res).toBe("shared");
        expect(shareMock).toHaveBeenCalledWith(
          expect.objectContaining({
            title: "Cricket Match Scorecard",
            text: "Live match update",
          })
        );
      } finally {
        Object.defineProperty(global, "navigator", {
          value: originalNav,
          configurable: true,
          writable: true,
        });
      }
    });
  });
});

