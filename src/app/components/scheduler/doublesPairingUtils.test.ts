import { describe, it, expect } from "vitest";
import {
  combineFlats,
  partitionDoublesRegistrations,
  pairOpenPoolPlayers,
  getRegistrationPlayerName,
} from "./doublesPairingUtils";
import type { EventRegistration } from "../../../types/api";

describe("doublesPairingUtils", () => {
  describe("combineFlats", () => {
    it("combines two distinct flats", () => {
      expect(combineFlats("A-101", "B-202")).toBe("A-101 / B-202");
    });

    it("does not duplicate when both flats are identical", () => {
      expect(combineFlats("A-101", "A-101")).toBe("A-101");
    });

    it("handles null or undefined gracefully", () => {
      expect(combineFlats("A-101", null)).toBe("A-101");
      expect(combineFlats(null, "B-202")).toBe("B-202");
      expect(combineFlats(null, undefined)).toBeUndefined();
    });
  });

  describe("partitionDoublesRegistrations", () => {
    it("separates confirmed partner registrations from solo open pool players", () => {
      const regFixed1: Partial<EventRegistration> = {
        id: 1,
        playerName: "Player One",
        partnerName: "Partner One",
        partnerConfirmationStatus: "CONFIRMED",
        flatNumber: "A-101",
      };
      const regOpen1: Partial<EventRegistration> = {
        id: 2,
        playerName: "Solo Player A",
        flatNumber: "C-301",
      };
      const regOpen2: Partial<EventRegistration> = {
        id: 3,
        playerName: "Solo Player B",
        flatNumber: "D-401",
      };

      const event = { name: "Badminton Doubles Tournament" };
      const result = partitionDoublesRegistrations(
        [regFixed1, regOpen1, regOpen2] as EventRegistration[],
        event
      );

      expect(result.fixedPairs).toHaveLength(1);
      expect(result.fixedPairs[0].name).toBe("Player One / Partner One");
      expect(result.openPool).toHaveLength(2);
      expect(result.openPool.map(r => r.playerName)).toEqual(["Solo Player A", "Solo Player B"]);
    });

    it("deduplicates reciprocal registrations in fixed pairs", () => {
      const reg1: Partial<EventRegistration> = {
        id: 10,
        user: { id: 100, fullName: "Alice" } as any,
        partnerUserId: 200,
        flatNumber: "A-101",
      };
      const reg2: Partial<EventRegistration> = {
        id: 20,
        user: { id: 200, fullName: "Bob" } as any,
        partnerUserId: 100,
        flatNumber: "B-202",
      };

      const event = { name: "Tennis Doubles" };
      const result = partitionDoublesRegistrations(
        [reg1, reg2] as EventRegistration[],
        event
      );

      expect(result.fixedPairs).toHaveLength(1);
      expect(result.openPool).toHaveLength(0);
    });
  });

  describe("pairOpenPoolPlayers", () => {
    it("pairs even number of open-pool players into complete 2-player teams", () => {
      const players: Partial<EventRegistration>[] = [
        { id: 1, playerName: "Player A", flatNumber: "A-101" },
        { id: 2, playerName: "Player B", flatNumber: "B-202" },
        { id: 3, playerName: "Player C", flatNumber: "C-303" },
        { id: 4, playerName: "Player D", flatNumber: "D-404" },
      ];

      const result = pairOpenPoolPlayers(players as EventRegistration[]);
      expect(result.pairedTeams).toHaveLength(2);
      expect(result.unpairedPlayers).toHaveLength(0);

      // Verify every team has 2 distinct players and is marked auto-paired
      result.pairedTeams.forEach(team => {
        expect(team.isAutoPaired).toBe(true);
        expect(team.player1).toBeDefined();
        expect(team.player2).toBeDefined();
        expect(team.player1.id).not.toBe(team.player2?.id);
        expect(team.name).toContain(" / ");
      });
    });

    it("handles odd number of open-pool players by leaving exactly 1 in unpaired/standby", () => {
      const players: Partial<EventRegistration>[] = [
        { id: 1, playerName: "P1" },
        { id: 2, playerName: "P2" },
        { id: 3, playerName: "P3" },
        { id: 4, playerName: "P4" },
        { id: 5, playerName: "P5" },
      ];

      const result = pairOpenPoolPlayers(players as EventRegistration[]);
      expect(result.pairedTeams).toHaveLength(2);
      expect(result.unpairedPlayers).toHaveLength(1);
    });

    it("pairs 1 Male and 1 Female when isMixedDoubles is specified", () => {
      const players: Partial<EventRegistration>[] = [
        { id: 1, playerName: "Man 1", gender: "MALE" },
        { id: 2, playerName: "Woman 1", gender: "FEMALE" },
        { id: 3, playerName: "Man 2", gender: "MALE" },
        { id: 4, playerName: "Woman 2", gender: "FEMALE" },
      ];

      const result = pairOpenPoolPlayers(players as EventRegistration[], { isMixedDoubles: true });
      expect(result.pairedTeams).toHaveLength(2);
      expect(result.unpairedPlayers).toHaveLength(0);

      result.pairedTeams.forEach(team => {
        const genders = [team.player1.gender, team.player2?.gender];
        expect(genders).toContain("MALE");
        expect(genders).toContain("FEMALE");
      });
    });
  });
});
