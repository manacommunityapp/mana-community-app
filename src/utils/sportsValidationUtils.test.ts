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
  formatFlatLabel,
  formatUnitDisplay,
  isByeMatch,
  isExplicitTime,
  isPlaceholderOrTbd,
  propagateByeAdvancements,
} from "./sportsValidationUtils";
import { checkCategoryEligibility } from "../app/components/sports/SportsRegister";

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

  describe("5. checkCategoryEligibility Integration Tests", () => {
    it("blocks participant under minimum age (e.g. 15yo on 19+ event)", () => {
      const event = {
        id: 1,
        name: "Men's Singles 19+",
        minAge: 19,
        maxAge: null,
        gender: "MALE",
        categories: [{ id: 101, name: "Singles" }],
      };
      const result = checkCategoryEligibility(event, 15, "Male");
      expect(result.eligible).toBe(false);
      expect(result.isUnderAge).toBe(true);
      expect(result.warningMsg).toContain("below minimum age requirement (19+ yrs)");
    });

    it("blocks participant with unverified or 0 age when minimum age is required (e.g. 0yo on 19+ event)", () => {
      const event = {
        id: 2,
        name: "Badminton 19+",
        minAge: 19,
        maxAge: null,
        gender: "ALL",
      };
      const result = checkCategoryEligibility(event, 0, "Male");
      expect(result.eligible).toBe(false);
      expect(result.isAgeUnknown).toBe(true);
      expect(result.warningMsg).toContain("Age not set in profile");
    });

    it("blocks participant over maximum age limit (e.g. 25yo on Under 16 event)", () => {
      const event = {
        id: 3,
        name: "Carrom Under 16",
        minAge: null,
        maxAge: 16,
        gender: "ALL",
      };
      const result = checkCategoryEligibility(event, 25, "Female");
      expect(result.eligible).toBe(false);
      expect(result.isOverAge).toBe(true);
      expect(result.warningMsg).toContain("exceeds maximum limit");
    });

    it("allows eligible participant (e.g. 25yo on 19+ event)", () => {
      const event = {
        id: 4,
        name: "Tennis Men's Singles (19+)",
        minAge: 19,
        maxAge: null,
        gender: "MALE",
        categories: [{ id: 102, name: "Singles" }],
      };
      const result = checkCategoryEligibility(event, 25, "Male");
      expect(result.eligible).toBe(true);
      expect(result.isUnderAge).toBe(false);
      expect(result.isOverAge).toBe(false);
      expect(result.isGenderMismatch).toBe(false);
    });

    it("blocks gender mismatch (e.g. Female on Men Only category)", () => {
      const event = {
        id: 5,
        name: "Badminton Men's Doubles",
        minAge: 19,
        maxAge: null,
        gender: "MALE",
      };
      const result = checkCategoryEligibility(event, 25, "Female");
      expect(result.eligible).toBe(false);
      expect(result.isGenderMismatch).toBe(true);
      expect(result.warningMsg).toContain("Category requires Male participant, but selected profile is Female");
    });
  });

  describe("6. Standardized Block & Flat Address Formatting", () => {
    it("formats block and flat into standard 'Block B, Flat 1008'", () => {
      expect(formatFlatLabel("1008", "Block B")).toBe("Block B, Flat 1008");
      expect(formatFlatLabel("1008", "B")).toBe("Block B, Flat 1008");
      expect(formatFlatLabel("401", "Tower 2")).toBe("Tower 2, Flat 401");
      expect(formatFlatLabel("102", "Wing A")).toBe("Wing A, Flat 102");
    });

    it("preserves already formatted addresses without duplicate prefixes", () => {
      expect(formatFlatLabel("Block B, Flat 1008")).toBe("Block B, Flat 1008");
      expect(formatFlatLabel("Block B, Flat 1008", "Block B")).toBe("Block B, Flat 1008");
      expect(formatFlatLabel("Villa 42")).toBe("Villa 42");
      expect(formatFlatLabel("Row House 7")).toBe("Row House 7");
    });

    it("normalizes hyphenated and spaced unit strings", () => {
      expect(formatFlatLabel("B-1008")).toBe("Block B, Flat 1008");
      expect(formatFlatLabel("Tower 1-302")).toBe("Tower 1, Flat 302");
      expect(formatFlatLabel("Block B 1008")).toBe("Block B, Flat 1008");
    });

    it("handles single-attribute cases cleanly", () => {
      expect(formatFlatLabel("1008")).toBe("Flat 1008");
      expect(formatFlatLabel("Flat 1008")).toBe("Flat 1008");
      expect(formatFlatLabel(null, "Block B")).toBe("Block B");
      expect(formatFlatLabel("", "")).toBe("");
      expect(formatFlatLabel(null, null)).toBe("");
    });

    it("formatUnitDisplay eliminates double prefixes", () => {
      expect(formatUnitDisplay("Flat Block B, Flat 1008")).toBe("Block B, Flat 1008");
      expect(formatUnitDisplay("Flat Flat 1008")).toBe("Flat 1008");
      expect(formatUnitDisplay("Flat Tower 2, Flat 401")).toBe("Tower 2, Flat 401");
      expect(formatUnitDisplay("Flat 1008")).toBe("Flat 1008");
    });
  });

  describe("7. BYE Match Detection & Explicit Time Checks", () => {
    it("identifies BYE matches by status", () => {
      expect(isByeMatch({ status: "BYE" })).toBe(true);
      expect(isByeMatch({ status: "AUTO_ADVANCED" })).toBe(true);
      expect(isByeMatch({ status: "auto_advanced" })).toBe(true);
      expect(isByeMatch({ status: "SCHEDULED" })).toBe(false);
      expect(isByeMatch(null)).toBe(false);
    });

    it("identifies BYE matches by opponent name", () => {
      expect(isByeMatch({ teamAName: "Player 1", teamBName: "BYE" })).toBe(true);
      expect(isByeMatch({ homeName: "BYE", awayName: "Player 2" })).toBe(true);
      expect(isByeMatch({ team1: "Player 1", team2: "bye" })).toBe(true);
      expect(isByeMatch({ home: { name: "Player 1" }, away: { name: "BYE" } })).toBe(true);
      expect(isByeMatch({ teamAName: "Player 1", teamBName: "Player 2" })).toBe(false);
    });

    it("identifies BYE matches by opponent ID or isBye flag", () => {
      expect(isByeMatch({ teamBId: "bye" })).toBe(true);
      expect(isByeMatch({ away: { id: "bye", name: "BYE" } })).toBe(true);
      expect(isByeMatch({ isBye: true })).toBe(true);
      expect(isByeMatch({ teamAId: 10, teamBId: 20 })).toBe(false);
    });

    it("validates whether a match has an explicitly scheduled time", () => {
      expect(isExplicitTime("10:00 AM")).toBe(true);
      expect(isExplicitTime("14:30")).toBe(true);
      expect(isExplicitTime("")).toBe(false);
      expect(isExplicitTime(null)).toBe(false);
      expect(isExplicitTime("00:00")).toBe(false);
      expect(isExplicitTime("00:00:00")).toBe(false);
      expect(isExplicitTime("12:00 AM")).toBe(false);
    });

    it("validates datetime ISO strings for explicit time versus midnight default", () => {
      expect(isExplicitTime(undefined, "2026-11-20T10:00:00")).toBe(true);
      expect(isExplicitTime(undefined, "2026-11-20T14:30:00Z")).toBe(true);
      expect(isExplicitTime(undefined, "2026-11-20T00:00:00")).toBe(false);
      expect(isExplicitTime(undefined, "2026-11-20T00:00:00Z")).toBe(false);
      expect(isExplicitTime(undefined, "2026-11-20")).toBe(false);
      expect(isExplicitTime(undefined, "")).toBe(false);
    });
  });

  describe("8. Placeholder Detection & BYE Advancement Propagation", () => {
    it("identifies placeholder and TBD participant names", () => {
      expect(isPlaceholderOrTbd("")).toBe(true);
      expect(isPlaceholderOrTbd(null)).toBe(true);
      expect(isPlaceholderOrTbd("—")).toBe(true);
      expect(isPlaceholderOrTbd("TBD")).toBe(true);
      expect(isPlaceholderOrTbd("TBA")).toBe(true);
      expect(isPlaceholderOrTbd("BYE")).toBe(true);
      expect(isPlaceholderOrTbd("Winner of Match 1")).toBe(true);
      expect(isPlaceholderOrTbd("Winner of QF 2")).toBe(true);
      expect(isPlaceholderOrTbd("Match 1 Winner")).toBe(true);
      expect(isPlaceholderOrTbd("Loser of Match 3")).toBe(true);
      expect(isPlaceholderOrTbd("John Doe")).toBe(false);
      expect(isPlaceholderOrTbd("Warriors FC")).toBe(false);
      expect(isPlaceholderOrTbd("Alice Smith")).toBe(false);
    });

    it("propagates a BYE player into downstream match using winnerAdvancesToMatchId", () => {
      const matches = [
        {
          id: 101,
          roundIndex: 0,
          matchNumber: 1,
          teamAName: "Roger Federer",
          teamAId: 5,
          teamAFlat: "Tower A-101",
          teamBName: "BYE",
          teamBId: "bye",
          status: "BYE",
          winnerAdvancesToMatchId: 201,
        },
        {
          id: 102,
          roundIndex: 0,
          matchNumber: 2,
          teamAName: "Novak Djokovic",
          teamAId: 6,
          teamBName: "Andy Murray",
          teamBId: 7,
          status: "SCHEDULED",
          winnerAdvancesToMatchId: 201,
        },
        {
          id: 201,
          roundIndex: 1,
          matchNumber: 3,
          teamAName: "Winner of Match 1",
          teamBName: "Winner of Match 2",
          winnerFeedFromMatchA: 101,
          winnerFeedFromMatchB: 102,
          status: "SCHEDULED",
          scheduledAt: "2026-11-22T10:00:00",
        },
      ];

      const result = propagateByeAdvancements(matches);

      // Downstream match 201 should have Team A populated with Roger Federer
      const nextMatch = result.find(m => m.id === 201);
      expect(nextMatch).toBeDefined();
      expect(nextMatch?.teamAName).toBe("Roger Federer");
      expect(nextMatch?.teamAId).toBe(5);
      expect(nextMatch?.teamAFlat).toBe("Tower A-101");

      // Team B in match 201 should still be un-advanced (Match 102 is not a BYE match)
      expect(nextMatch?.teamBName).toBe("Winner of Match 2");
    });

    it("propagates a BYE player when player is on side B (teamBName) of BYE match", () => {
      const matches = [
        {
          id: 101,
          roundIndex: 0,
          matchNumber: 1,
          teamAName: "BYE",
          teamAId: "bye",
          teamBName: "Serena Williams",
          teamBId: 99,
          status: "BYE",
          winnerAdvancesToMatchId: 201,
        },
        {
          id: 201,
          roundIndex: 1,
          matchNumber: 2,
          teamAName: "TBD",
          teamBName: "Venus Williams",
          teamBId: 100,
          winnerFeedFromMatchA: 101,
          status: "SCHEDULED",
        },
      ];

      const result = propagateByeAdvancements(matches);
      const nextMatch = result.find(m => m.id === 201);
      expect(nextMatch).toBeDefined();
      expect(nextMatch?.teamAName).toBe("Serena Williams");
      expect(nextMatch?.teamAId).toBe(99);
      expect(nextMatch?.teamBName).toBe("Venus Williams");
    });

    it("propagates a BYE player into downstream match using knockout round position", () => {
      // 4 matches in R1, 2 matches in R2
      const matches = [
        {
          id: 1,
          roundIndex: 0,
          matchNumber: 1,
          teamAName: "Player 1",
          teamBName: "BYE",
          status: "BYE",
        },
        {
          id: 2,
          roundIndex: 0,
          matchNumber: 2,
          teamAName: "Player 2",
          teamBName: "Player 3",
          status: "SCHEDULED",
        },
        {
          id: 3,
          roundIndex: 0,
          matchNumber: 3,
          teamAName: "Player 4",
          teamBName: "Player 5",
          status: "SCHEDULED",
        },
        {
          id: 4,
          roundIndex: 0,
          matchNumber: 4,
          teamAName: "BYE",
          teamBName: "Player 6",
          status: "AUTO_ADVANCED",
        },
        // Round 2
        {
          id: 5,
          roundIndex: 1,
          matchNumber: 5,
          teamAName: "Winner of Match 1",
          teamBName: "Winner of Match 2",
          status: "SCHEDULED",
        },
        {
          id: 6,
          roundIndex: 1,
          matchNumber: 6,
          teamAName: "Winner of Match 3",
          teamBName: "Winner of Match 4",
          status: "SCHEDULED",
        },
      ];

      const result = propagateByeAdvancements(matches);

      // Match 5: Team A should be Player 1, Team B should still be Winner of Match 2
      const m5 = result.find(m => m.id === 5);
      expect(m5).toBeDefined();
      expect(m5?.teamAName).toBe("Player 1");
      expect(m5?.teamBName).toBe("Winner of Match 2");

      // Match 6: Team A should still be Winner of Match 3, Team B should be Player 6
      const m6 = result.find(m => m.id === 6);
      expect(m6).toBeDefined();
      expect(m6?.teamAName).toBe("Winner of Match 3");
      expect(m6?.teamBName).toBe("Player 6");
    });

    it("handles cascading multi-round BYEs", () => {
      // Player 1 has a BYE in R1 and also a BYE in R2, advancing to R3 Final
      const matches = [
        {
          id: 1,
          roundIndex: 0,
          matchNumber: 1,
          teamAName: "Top Seed",
          teamBName: "BYE",
          status: "BYE",
          winnerAdvancesToMatchId: 2,
        },
        {
          id: 2,
          roundIndex: 1,
          matchNumber: 2,
          teamAName: "TBD",
          teamBName: "BYE",
          status: "BYE",
          winnerAdvancesToMatchId: 3,
        },
        {
          id: 3,
          roundIndex: 2,
          matchNumber: 3,
          teamAName: "TBD",
          teamBName: "Challenger",
          status: "SCHEDULED",
        },
      ];

      const result = propagateByeAdvancements(matches);
      const finalMatch = result.find(m => m.id === 3);
      expect(finalMatch).toBeDefined();
      expect(finalMatch?.teamAName).toBe("Top Seed");
      expect(finalMatch?.teamBName).toBe("Challenger");
    });
  });
});
