import { describe, it, expect } from "vitest";
import {
  validateAuctionConfigForm,
  calculateNextBidAmount,
  computeSquadMetrics,
  getSportCategoryPreset,
  parseDisputeCommitteeIds,
  SPORT_OPTIONS,
  DEFAULT_CATEGORY_PRESETS,
} from "./AuctionConfigModal";

describe("AuctionConfigModal validation & business logic", () => {
  const validForm = {
    seasonName: "LEPL Season 2 (2026)",
    totalTeams: 8,
    totalPlayers: 40,
    budgetPerTeam: 100000,
    basePrice: 1000,
    bidIncrementDefault: 1000,
    bidIncrementThreshold: 10000,
    bidIncrementAbove: 5000,
    bidTimerSeconds: 30,
    categories: ["Batsmen", "Bowlers", "All-rounders", "Wicket-Keepers"],
  };

  describe("Form Validation", () => {
    it("accepts a valid auction configuration", () => {
      expect(validateAuctionConfigForm(validForm)).toBeNull();
    });

    it("rejects missing or empty season names", () => {
      expect(validateAuctionConfigForm({ ...validForm, seasonName: "" })).toMatch(/Season Name is required/i);
      expect(validateAuctionConfigForm({ ...validForm, seasonName: "   " })).toMatch(/Season Name is required/i);
      expect(validateAuctionConfigForm({ ...validForm, seasonName: undefined as any })).toMatch(/Season Name is required/i);
    });

    it("enforces participating teams range [2, 20]", () => {
      expect(validateAuctionConfigForm({ ...validForm, totalTeams: 1 })).toMatch(/between 2 and 20/i);
      expect(validateAuctionConfigForm({ ...validForm, totalTeams: 0 })).toMatch(/between 2 and 20/i);
      expect(validateAuctionConfigForm({ ...validForm, totalTeams: 21 })).toMatch(/between 2 and 20/i);
      expect(validateAuctionConfigForm({ ...validForm, totalTeams: 2 })).toBeNull();
      expect(validateAuctionConfigForm({ ...validForm, totalTeams: 20 })).toBeNull();
    });

    it("enforces positive player pool", () => {
      expect(validateAuctionConfigForm({ ...validForm, totalPlayers: 0 })).toMatch(/at least 1/i);
      expect(validateAuctionConfigForm({ ...validForm, totalPlayers: -5 })).toMatch(/at least 1/i);
      expect(validateAuctionConfigForm({ ...validForm, totalPlayers: 1 })).toBeNull();
    });

    it("enforces minimum budget per team of ₹1,000", () => {
      expect(validateAuctionConfigForm({ ...validForm, budgetPerTeam: 500 })).toMatch(/at least ₹1,000/i);
      expect(validateAuctionConfigForm({ ...validForm, budgetPerTeam: 1000 })).toBeNull();
    });

    it("validates base price constraints", () => {
      expect(validateAuctionConfigForm({ ...validForm, basePrice: 50 })).toMatch(/at least ₹100/i);
      expect(validateAuctionConfigForm({ ...validForm, basePrice: 150000, budgetPerTeam: 100000 })).toMatch(
        /cannot exceed total team budget/i
      );
    });

    it("validates bid increments and threshold", () => {
      expect(validateAuctionConfigForm({ ...validForm, bidIncrementDefault: 50 })).toMatch(/Default bid increment must be at least ₹100/i);
      expect(validateAuctionConfigForm({ ...validForm, bidIncrementThreshold: -100 })).toMatch(/cannot be negative/i);
      expect(validateAuctionConfigForm({ ...validForm, bidIncrementAbove: 50 })).toMatch(/Increment above threshold must be at least ₹100/i);
    });

    it("validates real-time countdown timer between 10s and 120s", () => {
      expect(validateAuctionConfigForm({ ...validForm, bidTimerSeconds: 5 })).toMatch(/between 10 and 120 seconds/i);
      expect(validateAuctionConfigForm({ ...validForm, bidTimerSeconds: 150 })).toMatch(/between 10 and 120 seconds/i);
      expect(validateAuctionConfigForm({ ...validForm, bidTimerSeconds: 10 })).toBeNull();
      expect(validateAuctionConfigForm({ ...validForm, bidTimerSeconds: 120 })).toBeNull();
    });

    it("requires at least one player category", () => {
      expect(validateAuctionConfigForm({ ...validForm, categories: [] })).toMatch(/At least one player category/i);
      expect(validateAuctionConfigForm({ ...validForm, categories: ["Open"] })).toBeNull();
    });
  });

  describe("Bidding Ladder Calculations", () => {
    const threshold = 10000;
    const defaultInc = 1000;
    const aboveInc = 5000;

    it("applies default increment when below threshold", () => {
      const calc1 = calculateNextBidAmount(1000, threshold, defaultInc, aboveInc);
      expect(calc1.nextBid).toBe(2000);
      expect(calc1.incrementApplied).toBe(1000);
      expect(calc1.isAboveThreshold).toBe(false);

      const calc2 = calculateNextBidAmount(9000, threshold, defaultInc, aboveInc);
      expect(calc2.nextBid).toBe(10000);
      expect(calc2.incrementApplied).toBe(1000);
      expect(calc2.isAboveThreshold).toBe(false);
    });

    it("applies higher increment at or above threshold", () => {
      const calcAtThreshold = calculateNextBidAmount(10000, threshold, defaultInc, aboveInc);
      expect(calcAtThreshold.nextBid).toBe(15000);
      expect(calcAtThreshold.incrementApplied).toBe(5000);
      expect(calcAtThreshold.isAboveThreshold).toBe(true);

      const calcAbove = calculateNextBidAmount(25000, threshold, defaultInc, aboveInc);
      expect(calcAbove.nextBid).toBe(30000);
      expect(calcAbove.incrementApplied).toBe(5000);
      expect(calcAbove.isAboveThreshold).toBe(true);
    });
  });

  describe("Squad & Purse Allocation Calculations", () => {
    it("computes average squad size and average spend per player accurately", () => {
      const metrics = computeSquadMetrics(8, 40, 100000);
      expect(metrics.avgSquadSize).toBe(5.0);
      expect(metrics.totalCombinedPurse).toBe(800000);
      expect(metrics.avgSpendPerPlayer).toBe(20000);
    });

    it("handles uneven pool divisions gracefully", () => {
      const metrics = computeSquadMetrics(6, 43, 150000);
      expect(metrics.avgSquadSize).toBe(7.2);
      expect(metrics.totalCombinedPurse).toBe(900000);
      expect(metrics.avgSpendPerPlayer).toBe(Math.round(900000 / 43));
    });

    it("handles zero edge cases without crashing", () => {
      const metrics = computeSquadMetrics(0, 0, 100000);
      expect(metrics.avgSquadSize).toBe(0);
      expect(metrics.avgSpendPerPlayer).toBe(0);
      expect(metrics.totalCombinedPurse).toBe(0);
    });
  });

  describe("Sport Presets & Options", () => {
    it("returns correct presets for supported sports", () => {
      expect(getSportCategoryPreset("cricket")).toEqual(["Batsmen", "Bowlers", "All-rounders", "Wicket-Keepers"]);
      expect(getSportCategoryPreset("Cricket")).toEqual(["Batsmen", "Bowlers", "All-rounders", "Wicket-Keepers"]);
      expect(getSportCategoryPreset("badminton")).toEqual(["Men's Singles", "Women's Singles", "Men's Doubles", "Mixed Doubles"]);
      expect(getSportCategoryPreset("football")).toEqual(["Forwards", "Midfielders", "Defenders", "Goalkeepers"]);
      expect(getSportCategoryPreset("volleyball")).toEqual(["Attackers / Spikers", "Setters", "Blockers", "Liberos"]);
    });

    it("falls back to general category for unrecognized sports", () => {
      expect(getSportCategoryPreset("curling")).toEqual(["General"]);
      expect(getSportCategoryPreset("")).toEqual(["General"]);
    });

    it("provides all key community sports in SPORT_OPTIONS with emojis", () => {
      expect(SPORT_OPTIONS.length).toBeGreaterThanOrEqual(5);
      const names = SPORT_OPTIONS.map(s => s.name.toLowerCase());
      expect(names).toContain("cricket");
      expect(names).toContain("badminton");
      expect(names).toContain("football");
    });
  });

  describe("Auction State Machine Lifecycle Transitions", () => {
    // Mimics the backend SportsAuctionConfig.AuctionStatus state machine
    const ALLOWED_TRANSITIONS: Record<string, string[]> = {
      DRAFT: ["ACTIVE", "CANCELLED"],
      ACTIVE: ["LIVE", "DRAFT", "COMPLETED", "CANCELLED"],
      LIVE: ["ACTIVE", "COMPLETED", "CANCELLED"],
      COMPLETED: [],
      CANCELLED: [],
    };

    function canTransition(current: string, next: string): boolean {
      return ALLOWED_TRANSITIONS[current]?.includes(next) ?? false;
    }

    it("allows DRAFT to transition to ACTIVE and CANCELLED", () => {
      expect(canTransition("DRAFT", "ACTIVE")).toBe(true);
      expect(canTransition("DRAFT", "CANCELLED")).toBe(true);
      expect(canTransition("DRAFT", "LIVE")).toBe(false);
      expect(canTransition("DRAFT", "COMPLETED")).toBe(false);
    });

    it("allows ACTIVE to transition to LIVE, DRAFT, COMPLETED, and CANCELLED", () => {
      expect(canTransition("ACTIVE", "LIVE")).toBe(true);
      expect(canTransition("ACTIVE", "DRAFT")).toBe(true);
      expect(canTransition("ACTIVE", "COMPLETED")).toBe(true);
      expect(canTransition("ACTIVE", "CANCELLED")).toBe(true);
    });

    it("allows LIVE to transition to ACTIVE (pause), COMPLETED, and CANCELLED", () => {
      expect(canTransition("LIVE", "ACTIVE")).toBe(true);
      expect(canTransition("LIVE", "COMPLETED")).toBe(true);
      expect(canTransition("LIVE", "CANCELLED")).toBe(true);
      expect(canTransition("LIVE", "DRAFT")).toBe(false);
    });

    it("treats COMPLETED and CANCELLED as terminal states", () => {
      expect(canTransition("COMPLETED", "DRAFT")).toBe(false);
      expect(canTransition("COMPLETED", "ACTIVE")).toBe(false);
      expect(canTransition("COMPLETED", "LIVE")).toBe(false);
      expect(canTransition("CANCELLED", "ACTIVE")).toBe(false);
    });
  });

  describe("parseDisputeCommitteeIds", () => {
    it("handles array of numbers returned by backend", () => {
      expect(parseDisputeCommitteeIds([1, 2, 3])).toEqual([1, 2, 3]);
    });

    it("handles array of string numbers", () => {
      expect(parseDisputeCommitteeIds(["10", "20", "30"])).toEqual([10, 20, 30]);
    });

    it("handles comma-separated string", () => {
      expect(parseDisputeCommitteeIds("4, 8, 15, 16")).toEqual([4, 8, 15, 16]);
    });

    it("handles single number", () => {
      expect(parseDisputeCommitteeIds(42)).toEqual([42]);
    });

    it("filters out invalid numbers or NaN values", () => {
      expect(parseDisputeCommitteeIds(["abc", -1, 0, 5, NaN])).toEqual([5]);
      expect(parseDisputeCommitteeIds("foo, -3, 0, 99")).toEqual([99]);
    });

    it("handles null, undefined, or empty values safely without throwing", () => {
      expect(parseDisputeCommitteeIds(null)).toEqual([]);
      expect(parseDisputeCommitteeIds(undefined)).toEqual([]);
      expect(parseDisputeCommitteeIds("")).toEqual([]);
      expect(parseDisputeCommitteeIds([])).toEqual([]);
      expect(parseDisputeCommitteeIds({})).toEqual([]);
    });
  });
});
