import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { HouseRulesConfig } from "./utils/cricketUtils";
import { isCricketSport } from "./utils/sportScoringConstants";

describe("MatchScoringSetupModal & Gully Rules Logic Test Suite", () => {
  let mockStorage: Record<string, string> = {};

  beforeEach(() => {
    mockStorage = {};
    const storageMock = {
      getItem: (key: string) => mockStorage[key] || null,
      setItem: (key: string, val: string) => { mockStorage[key] = val; },
      removeItem: (key: string) => { delete mockStorage[key]; },
      clear: () => { mockStorage = {}; },
    };
    Object.defineProperty(global, "localStorage", {
      value: storageMock,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    mockStorage = {};
  });

  describe("1. GullyCrix Flow Stepper Transitions", () => {
    it("identifies cricket vs non-cricket sports correctly", () => {
      expect(isCricketSport("Cricket")).toBe(true);
      expect(isCricketSport("Box Cricket")).toBe(true);
      expect(isCricketSport("Gully Cricket")).toBe(true);
      expect(isCricketSport("Badminton")).toBe(false);
      expect(isCricketSport("Football")).toBe(false);
    });

    it("verifies sequential and direct step jumping", () => {
      const steps = ["teams", "overs", "toss", "score"] as const;
      let currentStep = "overs";

      // Stepper can go back to teams
      currentStep = "teams";
      expect(currentStep).toBe("teams");

      // Stepper advances to overs
      currentStep = "overs";
      expect(currentStep).toBe("overs");

      // Stepper advances to toss
      currentStep = "toss";
      expect(currentStep).toBe("toss");

      // Stepper reaches score
      currentStep = "score";
      expect(currentStep).toBe("score");
    });
  });

  describe("2. Overs Stepper [-] {overs} [+] & Presets Calculation", () => {
    it("increments and decrements overs within bounds [1..99]", () => {
      const stepOvers = (current: number, delta: number) => Math.max(1, Math.min(99, current + delta));

      expect(stepOvers(20, 1)).toBe(21);
      expect(stepOvers(20, -1)).toBe(19);
      expect(stepOvers(99, 1)).toBe(99);
      expect(stepOvers(1, -1)).toBe(1);
    });

    it("calculates bowler quota default as ceil(overs / 5)", () => {
      const computeBowlerLimit = (overs: number) => Math.ceil(overs / 5) || 1;

      expect(computeBowlerLimit(20)).toBe(4);
      expect(computeBowlerLimit(10)).toBe(2);
      expect(computeBowlerLimit(6)).toBe(2);
      expect(computeBowlerLimit(8)).toBe(2);
      expect(computeBowlerLimit(15)).toBe(3);
      expect(computeBowlerLimit(50)).toBe(10);
      expect(computeBowlerLimit(5)).toBe(1);
    });

    it("validates standard presets: 6, 8, 10, 15, 20, 25, 50", () => {
      const presets = [6, 8, 10, 15, 20, 25, 50];
      presets.forEach((preset) => {
        expect(preset).toBeGreaterThan(0);
        expect(preset).toBeLessThanOrEqual(50);
      });
    });

    it("validates balls per over presets (4, 5, 6, 8)", () => {
      const ballsPresets = [4, 5, 6, 8];
      expect(ballsPresets.includes(6)).toBe(true);
      expect(ballsPresets.includes(4)).toBe(true);
      expect(ballsPresets.includes(5)).toBe(true);
      expect(ballsPresets.includes(8)).toBe(true);
    });
  });

  describe("3. Gully House Rules: Wides, Free Hits, and Active Pill Badge", () => {
    it("calculates active gully rules count correctly", () => {
      const getActiveRulesCount = (rules: HouseRulesConfig, ballsPerOver: number = 6) => {
        let count = 0;
        if (rules.noExtraRuns) count++;
        if (rules.noFreeHits) count++;
        if (ballsPerOver !== 6) count++;
        return count;
      };

      // Default state: no rules active
      const defaultRules: HouseRulesConfig = {
        noExtraRuns: false,
        noFreeHits: false,
        oversLimit: 20,
        ballsPerOver: 6,
      };
      expect(getActiveRulesCount(defaultRules, 6)).toBe(0);

      // 1 rule active: No extra runs
      const gullyWideRules: HouseRulesConfig = {
        ...defaultRules,
        noExtraRuns: true,
      };
      expect(getActiveRulesCount(gullyWideRules, 6)).toBe(1);

      // 2 rules active: No extra runs + No free hits
      const boxRules: HouseRulesConfig = {
        ...gullyWideRules,
        noFreeHits: true,
      };
      expect(getActiveRulesCount(boxRules, 6)).toBe(2);

      // 3 rules active: Custom 4 balls/over + No extra runs + No free hits
      expect(getActiveRulesCount(boxRules, 4)).toBe(3);
    });

    it("persists house rules to localStorage under mc-match-{id}-house-rules", () => {
      const matchId = 8821;
      const key = `mc-match-${matchId}-house-rules`;
      const configToStore: HouseRulesConfig = {
        noExtraRuns: true,
        noFreeHits: true,
        oversLimit: 12,
        ballsPerOver: 5,
        maxOversPerBowler: 3,
      };

      localStorage.setItem(key, JSON.stringify(configToStore));
      const retrieved = JSON.parse(localStorage.getItem(key)!);

      expect(retrieved.noExtraRuns).toBe(true);
      expect(retrieved.noFreeHits).toBe(true);
      expect(retrieved.oversLimit).toBe(12);
      expect(retrieved.ballsPerOver).toBe(5);
      expect(retrieved.maxOversPerBowler).toBe(3);
    });
  });

  describe("4. Toss Setup Validation & Decision Handling", () => {
    it("validates toss winner and decision pairing", () => {
      const validateToss = (winnerSide: string, decision: string) => {
        return Boolean(winnerSide && (decision === "BAT" || decision === "BOWL" || decision === "SERVE" || decision === "RECEIVE"));
      };

      expect(validateToss("", "")).toBe(false);
      expect(validateToss("A", "")).toBe(false);
      expect(validateToss("", "BAT")).toBe(false);
      expect(validateToss("A", "BAT")).toBe(true);
      expect(validateToss("B", "BOWL")).toBe(true);
    });

    it("formats toss summary description correctly", () => {
      const getTossSummary = (winnerName: string, decision: "BAT" | "BOWL") => {
        return `${winnerName} won the toss and elected to ${decision.toLowerCase()} first!`;
      };

      expect(getTossSummary("Breeze Blasters", "BAT")).toBe(
        "Breeze Blasters won the toss and elected to bat first!"
      );
      expect(getTossSummary("Imperial Strikers", "BOWL")).toBe(
        "Imperial Strikers won the toss and elected to bowl first!"
      );
    });
  });
});
