import { describe, it, expect } from "vitest";
import { groupRegistrationsByPlayer } from "./TournamentSection";
import type { TournamentRegistration } from "../../../../types/api";

const createMockUser = (id: number, fullName: string) => ({
  id,
  fullName,
  email: `${fullName.toLowerCase().replace(/\s+/g, ".")}@example.com`,
  role: "RESIDENT",
  phone: "9876543210",
  kycStatus: "VERIFIED",
});

describe("TournamentSection: groupRegistrationsByPlayer", () => {
  it("returns empty array when registrations is empty or undefined", () => {
    expect(groupRegistrationsByPlayer([])).toEqual([]);
    expect(groupRegistrationsByPlayer(undefined as any)).toEqual([]);
  });

  it("handles a single registration without history", () => {
    const regs: TournamentRegistration[] = [
      {
        id: 1,
        playerName: "Chetan Kumar Reddy",
        user: createMockUser(10, "Chetan Kumar Reddy") as any,
        status: "CONFIRMED",
        flatNumber: "Block B, Flat 504",
        relation: "SELF",
        registeredAt: "2026-10-29T08:57:00Z",
      },
    ];

    const grouped = groupRegistrationsByPlayer(regs);
    expect(grouped).toHaveLength(1);
    expect(grouped[0].primary.id).toBe(1);
    expect(grouped[0].primary.playerName).toBe("Chetan Kumar Reddy");
    expect(grouped[0].history).toHaveLength(0);
  });

  it("deduplicates repeated withdrawn registrations for the same player into primary + history", () => {
    const regs: TournamentRegistration[] = [
      {
        id: 101,
        playerName: "Sunil Kumar Reddy K",
        user: createMockUser(20, "Sunil Kumar Reddy K") as any,
        status: "WITHDRAWN",
        flatNumber: "Block B, Flat 504",
        relation: "SELF",
        registeredAt: "2026-10-29T08:57:00Z",
      },
      {
        id: 102,
        playerName: "Sunil Kumar Reddy K",
        user: createMockUser(20, "Sunil Kumar Reddy K") as any,
        status: "WITHDRAWN",
        flatNumber: "Block B, Flat 504",
        relation: "SELF",
        registeredAt: "2026-10-29T08:58:00Z",
      },
      {
        id: 103,
        playerName: "Sunil Kumar Reddy K",
        user: createMockUser(20, "Sunil Kumar Reddy K") as any,
        status: "WITHDRAWN",
        flatNumber: "Block B, Flat 504",
        relation: "SELF",
        registeredAt: "2026-10-29T08:59:00Z",
      },
    ];

    const grouped = groupRegistrationsByPlayer(regs);
    expect(grouped).toHaveLength(1);
    // Primary is latest withdrawn
    expect(grouped[0].primary.id).toBe(103);
    expect(grouped[0].primary.status).toBe("WITHDRAWN");
    // History contains previous 2 withdrawn attempts sorted descending
    expect(grouped[0].history).toHaveLength(2);
    expect(grouped[0].history.map(h => h.id)).toEqual([102, 101]);
  });

  it("prioritizes active registration as primary when previous withdrawn records exist", () => {
    const regs: TournamentRegistration[] = [
      {
        id: 201,
        playerName: "Sunil Kumar Reddy K",
        user: createMockUser(20, "Sunil Kumar Reddy K") as any,
        status: "WITHDRAWN",
        flatNumber: "Block B, Flat 504",
        registeredAt: "2026-10-28T10:00:00Z",
      },
      {
        id: 202,
        playerName: "Sunil Kumar Reddy K",
        user: createMockUser(20, "Sunil Kumar Reddy K") as any,
        status: "CONFIRMED",
        flatNumber: "Block B, Flat 504",
        registeredAt: "2026-10-29T12:00:00Z",
      },
      {
        id: 200,
        playerName: "Sunil Kumar Reddy K",
        user: createMockUser(20, "Sunil Kumar Reddy K") as any,
        status: "WITHDRAWN",
        flatNumber: "Block B, Flat 504",
        registeredAt: "2026-10-27T10:00:00Z",
      },
    ];

    const grouped = groupRegistrationsByPlayer(regs);
    expect(grouped).toHaveLength(1);
    expect(grouped[0].primary.id).toBe(202);
    expect(grouped[0].primary.status).toBe("CONFIRMED");
    expect(grouped[0].history).toHaveLength(2);
    expect(grouped[0].history[0].id).toBe(201);
    expect(grouped[0].history[1].id).toBe(200);
  });

  it("distinguishes family members registered under the same resident user", () => {
    const regs: TournamentRegistration[] = [
      {
        id: 301,
        playerName: "Sunil Kumar Reddy K",
        user: createMockUser(20, "Sunil Kumar Reddy K") as any,
        status: "CONFIRMED",
        relation: "SELF",
        flatNumber: "Block B, Flat 504",
      },
      {
        id: 302,
        playerName: "Aarav Reddy",
        user: createMockUser(20, "Sunil Kumar Reddy K") as any,
        status: "CONFIRMED",
        relation: "CHILD",
        flatNumber: "Block B, Flat 504",
      },
      {
        id: 300,
        playerName: "Sunil Kumar Reddy K",
        user: createMockUser(20, "Sunil Kumar Reddy K") as any,
        status: "WITHDRAWN",
        relation: "SELF",
        flatNumber: "Block B, Flat 504",
      },
    ];

    const grouped = groupRegistrationsByPlayer(regs);
    // Should be 2 distinct players: Sunil and Aarav
    expect(grouped).toHaveLength(2);
    const sunil = grouped.find(g => g.primary.playerName === "Sunil Kumar Reddy K");
    const aarav = grouped.find(g => g.primary.playerName === "Aarav Reddy");

    expect(sunil).toBeDefined();
    expect(sunil?.primary.id).toBe(301);
    expect(sunil?.history).toHaveLength(1);
    expect(sunil?.history[0].id).toBe(300);

    expect(aarav).toBeDefined();
    expect(aarav?.primary.id).toBe(302);
    expect(aarav?.history).toHaveLength(0);
  });

  it("strictly produces 1 card when a participant has multiple PENDING registrations (user scenario: Mady, Sunil Kanthala)", () => {
    const regs: TournamentRegistration[] = [
      // Mady (2 PENDING registrations)
      {
        id: 401,
        playerName: "Mady",
        user: createMockUser(50, "Mady") as any,
        status: "PENDING",
        relation: "SELF",
        flatNumber: "Block D, Flat 107",
        registeredAt: "2026-09-26T01:17:00Z",
      },
      {
        id: 402,
        playerName: "Mady",
        user: createMockUser(50, "Mady") as any,
        status: "PENDING",
        relation: "SELF",
        flatNumber: "Block D, Flat 107",
        registeredAt: "2026-09-23T10:28:00Z",
      },
      // Sunil Kanthala (2 PENDING registrations)
      {
        id: 403,
        playerName: "Sunil Kanthala",
        user: createMockUser(60, "Sunil Kanthala") as any,
        status: "PENDING",
        relation: "SELF",
        flatNumber: "Block C, Flat 212",
        registeredAt: "2026-10-19T23:08:00Z",
      },
      {
        id: 404,
        playerName: "Sunil Kanthala",
        user: createMockUser(60, "Sunil Kanthala") as any,
        status: "PENDING",
        relation: "SELF",
        flatNumber: "Block C, Flat 212",
        registeredAt: "2026-10-19T23:07:00Z",
      },
      // Sandeep Kamarapu (1 PENDING, 1 WITHDRAWN)
      {
        id: 405,
        playerName: "Sandeep Kamarapu",
        user: createMockUser(70, "Sandeep Kamarapu") as any,
        status: "PENDING",
        relation: "SELF",
        flatNumber: "Block B, Flat 806",
        registeredAt: "2026-10-31T16:27:00Z",
      },
      {
        id: 406,
        playerName: "Sandeep Kamarapu",
        user: createMockUser(70, "Sandeep Kamarapu") as any,
        status: "WITHDRAWN",
        relation: "SELF",
        flatNumber: "Block B, Flat 806",
        registeredAt: "2026-10-31T15:00:00Z",
      },
    ];

    const grouped = groupRegistrationsByPlayer(regs);

    // MUST be strictly 3 unique player cards from 6 records
    expect(grouped).toHaveLength(3);

    const mady = grouped.find(g => g.primary.playerName === "Mady");
    expect(mady).toBeDefined();
    expect(mady?.primary.id).toBe(401); // latest PENDING
    expect(mady?.history).toHaveLength(1);
    expect(mady?.history[0].id).toBe(402); // older PENDING

    const sunil = grouped.find(g => g.primary.playerName === "Sunil Kanthala");
    expect(sunil).toBeDefined();
    expect(sunil?.primary.id).toBe(403); // latest PENDING
    expect(sunil?.history).toHaveLength(1);
    expect(sunil?.history[0].id).toBe(404); // older PENDING

    const sandeep = grouped.find(g => g.primary.playerName === "Sandeep Kamarapu");
    expect(sandeep).toBeDefined();
    expect(sandeep?.primary.id).toBe(405); // PENDING
    expect(sandeep?.history).toHaveLength(1);
    expect(sandeep?.history[0].id).toBe(406); // WITHDRAWN
  });
});
