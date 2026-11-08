import { describe, it, expect } from "vitest";
import {
  deduplicateReciprocalRegistrations,
  formatParticipantDisplayName,
} from "./SetupSchedule";
import { getPlayerInitials } from "../sports/SportsSchedule";
import type { EventRegistration } from "../../../types/api";

describe("SetupSchedule & SportsSchedule Doubles Category Support", () => {
  describe("formatParticipantDisplayName", () => {
    it("formats a standard singles participant correctly", () => {
      const reg: Partial<EventRegistration> = {
        id: 1,
        playerName: "Sandeep Kamarapu",
        flatNumber: "A-101",
      };
      const partnerInfo = {
        hasPartner: false,
        isOpenPool: false,
        name: null,
        relation: null,
        isDoublesEvent: false,
        status: null,
        notes: null,
      };

      const result = formatParticipantDisplayName(reg as EventRegistration, partnerInfo, false, 1);
      expect(result.displayName).toBe("Sandeep Kamarapu");
      expect(result.flatDisplay).toBe("A-101");
    });

    it("formats a singles participant with a proposed team name", () => {
      const reg: Partial<EventRegistration> = {
        id: 1,
        playerName: "Sandeep Kamarapu",
        proposedTeamName: "Smashers",
        flatNumber: "A-101",
      };
      const partnerInfo = {
        hasPartner: false,
        isOpenPool: false,
        name: null,
        relation: null,
        isDoublesEvent: false,
        status: null,
        notes: null,
      };

      const result = formatParticipantDisplayName(reg as EventRegistration, partnerInfo, false, 1);
      expect(result.displayName).toBe("Smashers (Sandeep Kamarapu)");
      expect(result.flatDisplay).toBe("A-101");
    });

    it("formats a doubles pair as 'Player 1 / Player 2' when partner is assigned", () => {
      const reg: Partial<EventRegistration> = {
        id: 1,
        playerName: "Sandeep Kamarapu",
        flatNumber: "A-101",
      };
      const partnerInfo = {
        hasPartner: true,
        isOpenPool: false,
        name: "Rahul Sharma",
        relation: "Neighbor",
        flat: "B-202",
        isDoublesEvent: true,
        status: "CONFIRMED",
        notes: null,
      };

      const result = formatParticipantDisplayName(reg as EventRegistration, partnerInfo, true, 1);
      expect(result.displayName).toBe("Sandeep Kamarapu / Rahul Sharma");
      expect(result.flatDisplay).toBe("A-101 / B-202");
    });

    it("does not duplicate flat number if both doubles partners share the same flat", () => {
      const reg: Partial<EventRegistration> = {
        id: 1,
        playerName: "Sandeep Kamarapu",
        flatNumber: "A-101",
      };
      const partnerInfo = {
        hasPartner: true,
        isOpenPool: false,
        name: "Ananya Kamarapu",
        relation: "Spouse",
        flat: "A-101",
        isDoublesEvent: true,
        status: "CONFIRMED",
        notes: null,
      };

      const result = formatParticipantDisplayName(reg as EventRegistration, partnerInfo, true, 1);
      expect(result.displayName).toBe("Sandeep Kamarapu / Ananya Kamarapu");
      expect(result.flatDisplay).toBe("A-101");
    });

    it("formats doubles pair with proposed team name: 'TeamName (Player 1 / Player 2)'", () => {
      const reg: Partial<EventRegistration> = {
        id: 1,
        playerName: "Sandeep Kamarapu",
        proposedTeamName: "Thunderbolts",
        flatNumber: "A-101",
      };
      const partnerInfo = {
        hasPartner: true,
        isOpenPool: false,
        name: "Rahul Sharma",
        relation: null,
        flat: "B-202",
        isDoublesEvent: true,
        status: "CONFIRMED",
        notes: null,
      };

      const result = formatParticipantDisplayName(reg as EventRegistration, partnerInfo, true, 1);
      expect(result.displayName).toBe("Thunderbolts (Sandeep Kamarapu / Rahul Sharma)");
    });

    it("formats doubles participant in open pool as 'Player / [Seeking Partner]'", () => {
      const reg: Partial<EventRegistration> = {
        id: 1,
        playerName: "Sandeep Kamarapu",
        flatNumber: "A-101",
      };
      const partnerInfo = {
        hasPartner: false,
        isOpenPool: true,
        name: null,
        relation: null,
        isDoublesEvent: true,
        status: null,
        notes: null,
      };

      const result = formatParticipantDisplayName(reg as EventRegistration, partnerInfo, true, 1);
      expect(result.displayName).toBe("Sandeep Kamarapu / [Seeking Partner]");
    });

    it("formats doubles participant with pending invited partner as 'Player / [Partner Invited]'", () => {
      const reg: Partial<EventRegistration> = {
        id: 1,
        playerName: "Sandeep Kamarapu",
        flatNumber: "A-101",
      };
      const partnerInfo = {
        hasPartner: false,
        isOpenPool: false,
        name: null,
        relation: null,
        isDoublesEvent: true,
        status: "INVITED",
        notes: null,
      };

      const result = formatParticipantDisplayName(reg as EventRegistration, partnerInfo, true, 1);
      expect(result.displayName).toBe("Sandeep Kamarapu / [Partner Invited]");
    });
  });

  describe("deduplicateReciprocalRegistrations", () => {
    it("returns registrations untouched when not a doubles event", () => {
      const regs: Partial<EventRegistration>[] = [
        { id: 1, partnerUserId: 2 },
        { id: 2, partnerUserId: 1 },
      ];
      const result = deduplicateReciprocalRegistrations(regs as EventRegistration[], false);
      expect(result).toHaveLength(2);
    });

    it("deduplicates reciprocal registrations in doubles events", () => {
      // User 1 registered selecting User 2
      const reg1: Partial<EventRegistration> = {
        id: 101,
        user: { id: 10, fullName: "Player 1" } as any,
        partnerUserId: 20,
      };
      // User 2 registered selecting User 1
      const reg2: Partial<EventRegistration> = {
        id: 102,
        user: { id: 20, fullName: "Player 2" } as any,
        partnerUserId: 10,
      };
      // Third distinct pair
      const reg3: Partial<EventRegistration> = {
        id: 103,
        user: { id: 30, fullName: "Player 3" } as any,
        partnerUserId: 40,
      };

      const result = deduplicateReciprocalRegistrations([reg1, reg2, reg3] as EventRegistration[], true);
      expect(result).toHaveLength(2);
      expect(result.map(r => r.id)).toEqual([101, 103]);
    });

    it("handles reciprocal registrations referenced by registration ID directly", () => {
      const reg1: Partial<EventRegistration> = {
        id: 201,
        partnerUserId: 202,
      };
      const reg2: Partial<EventRegistration> = {
        id: 202,
        partnerUserId: 201,
      };

      const result = deduplicateReciprocalRegistrations([reg1, reg2] as EventRegistration[], true);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(201);
    });
  });

  describe("getPlayerInitials (SportsSchedule)", () => {
    it("handles single and multi-word single player names", () => {
      expect(getPlayerInitials("Sandeep Kamarapu")).toBe("SK");
      expect(getPlayerInitials("Sandeep")).toBe("S");
      expect(getPlayerInitials("John Michael Doe")).toBe("JM");
    });

    it("handles doubles pair names delimited by ' / '", () => {
      expect(getPlayerInitials("Sandeep Kamarapu / Rahul Sharma")).toBe("SK / RS");
      expect(getPlayerInitials("Alice Smith / Bob Jones")).toBe("AS / BJ");
      expect(getPlayerInitials("Alice / Bob")).toBe("A / B");
    });

    it("handles doubles pair names delimited by ' & '", () => {
      expect(getPlayerInitials("Sandeep Kamarapu & Rahul Sharma")).toBe("SK & RS");
      expect(getPlayerInitials("Alice Smith & Bob Jones")).toBe("AS & BJ");
    });

    it("handles empty or null string gracefully", () => {
      expect(getPlayerInitials("")).toBe("");
      expect(getPlayerInitials(null as any)).toBe("");
    });
  });

  describe("Flat details preservation in Match payload & Schedule entries", () => {
    it("preserves homeFlat and awayFlat in singles match payloads", () => {
      const match = {
        home: { id: "P1", name: "Sandeep Kamarapu", flatNumber: "A-101" },
        away: { id: "P2", name: "Rahul Sharma", flatNumber: "B-202" },
      };

      const matchPayload = {
        homeName: match.home.name,
        homeId: match.home.id,
        homeFlat: match.home.flatNumber || null,
        awayName: match.away.name,
        awayId: match.away.id,
        awayFlat: match.away.flatNumber || null,
      };

      expect(matchPayload.homeFlat).toBe("A-101");
      expect(matchPayload.awayFlat).toBe("B-202");
    });

    it("handles combined flat in doubles match payloads", () => {
      const match = {
        home: { id: "P1", name: "Player 1 / Player 2", flatNumber: "A-101 / B-202" },
        away: { id: "P2", name: "Player 3 / Player 4", flatNumber: "C-303" },
      };

      const matchPayload = {
        homeName: match.home.name,
        homeId: match.home.id,
        homeFlat: match.home.flatNumber || null,
        awayName: match.away.name,
        awayId: match.away.id,
        awayFlat: match.away.flatNumber || null,
      };

      expect(matchPayload.homeFlat).toBe("A-101 / B-202");
      expect(matchPayload.awayFlat).toBe("C-303");
    });
  });
});

