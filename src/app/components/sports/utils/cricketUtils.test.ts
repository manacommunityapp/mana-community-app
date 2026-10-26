import { describe, it, expect } from "vitest";
import { ballColor, remainingBalls, requiredRunRate } from "./cricketUtils";

describe("cricketUtils Test Suite", () => {
  describe("1. ballColor styling helper", () => {
    it("returns red styling for wickets (W)", () => {
      expect(ballColor("W")).toBe("bg-red-100 text-red-700");
    });

    it("returns emerald styling for fours (4)", () => {
      expect(ballColor("4")).toBe("bg-emerald-100 text-emerald-700");
    });

    it("returns purple styling for sixes (6)", () => {
      expect(ballColor("6")).toBe("bg-purple-100 text-purple-700");
    });

    it("returns amber styling for extras (wd, nb)", () => {
      expect(ballColor("1wd")).toBe("bg-amber-100 text-amber-700");
      expect(ballColor("nb")).toBe("bg-amber-100 text-amber-700");
      expect(ballColor("wd")).toBe("bg-amber-100 text-amber-700");
    });

    it("returns muted slate styling for dot balls (0)", () => {
      expect(ballColor("0")).toBe("bg-slate-100 text-slate-400");
    });

    it("returns blue styling for normal singles, doubles, and triples", () => {
      expect(ballColor("1")).toBe("bg-blue-100 text-blue-700");
      expect(ballColor("2")).toBe("bg-blue-100 text-blue-700");
      expect(ballColor("3")).toBe("bg-blue-100 text-blue-700");
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
});
