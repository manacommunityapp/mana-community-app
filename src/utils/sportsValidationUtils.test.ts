import { describe, it, expect } from "vitest";
import {
  isTournamentDateRangeValid,
  isEventWithinTournamentWindow,
  calculateAge,
  isPlayerAgeEligible,
  validateTeamRoster,
  validateAuctionBid,
  calculateRemainingPurse,
  evaluateRegistrationStatus,
} from "./sportsValidationUtils";

describe("sportsValidationUtils Test Suite", () => {
  describe("1. Tournament & Event Date Range Boundaries", () => {
    it("validates valid tournament start and end dates", () => {
      expect(isTournamentDateRangeValid("2026-10-01", "2026-10-10")).toBe(true);
      expect(isTournamentDateRangeValid("2026-10-01", "2026-10-01")).toBe(true);
    });

    it("rejects invalid tournament dates where end date precedes start date", () => {
      expect(isTournamentDateRangeValid("2026-10-10", "2026-10-01")).toBe(false);
      expect(isTournamentDateRangeValid(null, "2026-10-01")).toBe(false);
      expect(isTournamentDateRangeValid("invalid-date", "2026-10-01")).toBe(false);
    });

    it("validates that event date ranges strictly fall within tournament window", () => {
      const tournament = { startDate: "2026-10-01", endDate: "2026-10-15" };

      // Valid: inside tournament window
      expect(
        isEventWithinTournamentWindow(
          { startDate: "2026-10-02", endDate: "2026-10-05" },
          tournament
        )
      ).toBe(true);

      // Valid: exactly matching tournament dates
      expect(
        isEventWithinTournamentWindow(
          { startDate: "2026-10-01", endDate: "2026-10-15" },
          tournament
        )
      ).toBe(true);

      // Invalid: event starts before tournament
      expect(
        isEventWithinTournamentWindow(
          { startDate: "2026-09-30", endDate: "2026-10-05" },
          tournament
        )
      ).toBe(false);

      // Invalid: event ends after tournament
      expect(
        isEventWithinTournamentWindow(
          { startDate: "2026-10-10", endDate: "2026-10-20" },
          tournament
        )
      ).toBe(false);

      // Invalid: event end date before event start date
      expect(
        isEventWithinTournamentWindow(
          { startDate: "2026-10-10", endDate: "2026-10-05" },
          tournament
        )
      ).toBe(false);
    });
  });

  describe("2. Age Calculation & Eligibility Checks", () => {
    it("calculates age accurately given a reference date", () => {
      const ref = "2026-09-14";
      expect(calculateAge("2010-09-14", ref)).toBe(16);
      expect(calculateAge("2010-09-15", ref)).toBe(15); // birthday tomorrow
      expect(calculateAge("2010-09-13", ref)).toBe(16); // birthday yesterday
      expect(calculateAge("invalid-date", ref)).toBe(-1);
    });

    it("verifies player eligibility for Under-16 category (maxAge: 16)", () => {
      const ref = "2026-09-14";
      const resultEligible = isPlayerAgeEligible({
        birthDate: "2012-05-10",
        minAge: 10,
        maxAge: 16,
        referenceDate: ref,
      });
      expect(resultEligible.eligible).toBe(true);

      const resultOverAge = isPlayerAgeEligible({
        birthDate: "2008-01-01", // age 18
        maxAge: 16,
        referenceDate: ref,
      });
      expect(resultOverAge.eligible).toBe(false);
      expect(resultOverAge.reason).toContain("exceeds maximum allowed age of 16");

      const resultUnderAge = isPlayerAgeEligible({
        birthDate: "2020-01-01", // age 6
        minAge: 10,
        referenceDate: ref,
      });
      expect(resultUnderAge.eligible).toBe(false);
      expect(resultUnderAge.reason).toContain("below minimum required age of 10");
    });

    it("verifies playersBornAfter cutoff dates", () => {
      const resultPass = isPlayerAgeEligible({
        birthDate: "2015-06-01",
        playersBornAfter: "2015-01-01",
      });
      expect(resultPass.eligible).toBe(true);

      const resultFail = isPlayerAgeEligible({
        birthDate: "2014-12-31",
        playersBornAfter: "2015-01-01",
      });
      expect(resultFail.eligible).toBe(false);
      expect(resultFail.reason).toContain("Player must be born on or after 2015-01-01");
    });
  });

  describe("3. Team Roster & Mixed Doubles Validation", () => {
    it("validates team player count against min and max thresholds", () => {
      const players = [
        { id: 1, name: "Alice", gender: "Female" },
        { id: 2, name: "Bob", gender: "Male" },
        { id: 3, name: "Charlie", gender: "Male" },
      ];

      // Valid: 3 players within [2, 5]
      const validCheck = validateTeamRoster({ minPlayers: 2, maxPlayers: 5, players });
      expect(validCheck.valid).toBe(true);
      expect(validCheck.errors).toHaveLength(0);

      // Too few players
      const tooFew = validateTeamRoster({ minPlayers: 4, players });
      expect(tooFew.valid).toBe(false);
      expect(tooFew.errors[0]).toContain("minimum required is 4");

      // Too many players
      const tooMany = validateTeamRoster({ maxPlayers: 2, players });
      expect(tooMany.valid).toBe(false);
      expect(tooMany.errors[0]).toContain("exceeds maximum limit of 2");
    });

    it("enforces mixed doubles gender requirements", () => {
      const mixedTeam = [
        { id: 1, name: "Rahul", gender: "Male" },
        { id: 2, name: "Sneha", gender: "Female" },
      ];
      const validMixed = validateTeamRoster({
        minPlayers: 2,
        maxPlayers: 2,
        players: mixedTeam,
        mandatoryMixedDoubles: true,
      });
      expect(validMixed.valid).toBe(true);

      const allMaleTeam = [
        { id: 1, name: "Rahul", gender: "Male" },
        { id: 2, name: "Amit", gender: "Male" },
      ];
      const invalidMixed = validateTeamRoster({
        players: allMaleTeam,
        mandatoryMixedDoubles: true,
      });
      expect(invalidMixed.valid).toBe(false);
      expect(invalidMixed.errors[0]).toContain("requires at least one Male and one Female player");
    });
  });

  describe("4. Auction Bid & Purse Engine", () => {
    it("accepts valid bids with required minimum increment within purse limit", () => {
      const bidCheck = validateAuctionBid({
        currentBid: 1000,
        newBid: 1200,
        minIncrement: 100,
        teamAvailablePurse: 5000,
        reservePrice: 500,
      });
      expect(bidCheck.valid).toBe(true);
    });

    it("rejects bids that fail minimum increment rule", () => {
      const bidCheck = validateAuctionBid({
        currentBid: 1000,
        newBid: 1050,
        minIncrement: 100,
        teamAvailablePurse: 5000,
      });
      expect(bidCheck.valid).toBe(false);
      expect(bidCheck.error).toContain("must be at least 1100");
    });

    it("rejects bids exceeding team available purse budget", () => {
      const bidCheck = validateAuctionBid({
        currentBid: 4500,
        newBid: 5500,
        minIncrement: 100,
        teamAvailablePurse: 5000,
      });
      expect(bidCheck.valid).toBe(false);
      expect(bidCheck.error).toContain("exceeds team's available purse budget of 5000");
    });

    it("calculates remaining purse accurately", () => {
      const totalPurse = 100000;
      const spent = 45000;
      const currentWinningBid = 15000;
      expect(calculateRemainingPurse(totalPurse, spent, currentWinningBid)).toBe(40000);
      expect(calculateRemainingPurse(10000, 9000, 2000)).toBe(0); // non-negative floor
    });
  });

  describe("5. Registration Status & Capacity Determination", () => {
    const fixedNow = new Date("2026-09-14T10:00:00Z");

    it("returns 'FULL' when confirmed participants reach max capacity", () => {
      const status = evaluateRegistrationStatus({
        maxParticipants: 16,
        confirmedCount: 16,
        now: fixedNow,
      });
      expect(status).toBe("FULL");
    });

    it("returns 'UPCOMING' when registration start date is in the future", () => {
      const status = evaluateRegistrationStatus({
        startDate: "2026-09-20T00:00:00Z",
        endDate: "2026-09-30T00:00:00Z",
        now: fixedNow,
      });
      expect(status).toBe("UPCOMING");
    });

    it("returns 'CLOSED' when registration deadline has expired or status is explicitly CLOSED", () => {
      const statusExpired = evaluateRegistrationStatus({
        startDate: "2026-09-01T00:00:00Z",
        endDate: "2026-09-10T00:00:00Z",
        now: fixedNow,
      });
      expect(statusExpired).toBe("CLOSED");

      const statusExplicit = evaluateRegistrationStatus({
        registrationStatus: "CLOSED",
        now: fixedNow,
      });
      expect(statusExplicit).toBe("CLOSED");
    });

    it("returns 'OPEN' when currently active with capacity available", () => {
      const status = evaluateRegistrationStatus({
        startDate: "2026-09-01T00:00:00Z",
        endDate: "2026-09-30T00:00:00Z",
        maxParticipants: 32,
        confirmedCount: 10,
        now: fixedNow,
      });
      expect(status).toBe("OPEN");
    });
  });
});
