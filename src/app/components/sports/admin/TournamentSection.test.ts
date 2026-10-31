import { describe, it, expect } from "vitest";
import { groupRegistrationsByPlayer } from "./TournamentSection";
import type { TournamentRegistration } from "../../../../types/api";

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
        user: { id: 10, fullName: "Chetan Kumar Reddy", email: "chetan@example.com", role: "RESIDENT" },
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
        user: { id: 20, fullName: "Sunil Kumar Reddy K", email: "sunil@example.com", role: "RESIDENT" },
        status: "WITHDRAWN",
        flatNumber: "Block B, Flat 504",
        relation: "SELF",
        registeredAt: "2026-10-29T08:57:00Z",
      },
      {
        id: 102,
        playerName: "Sunil Kumar Reddy K",
        user: { id: 20, fullName: "Sunil Kumar Reddy K", email: "sunil@example.com", role: "RESIDENT" },
        status: "WITHDRAWN",
        flatNumber: "Block B, Flat 504",
        relation: "SELF",
        registeredAt: "2026-10-29T08:58:00Z",
      },
      {
        id: 103,
        playerName: "Sunil Kumar Reddy K",
        user: { id: 20, fullName: "Sunil Kumar Reddy K", email: "sunil@example.com", role: "RESIDENT" },
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
        user: { id: 20, fullName: "Sunil Kumar Reddy K", email: "sunil@example.com", role: "RESIDENT" },
        status: "WITHDRAWN",
        flatNumber: "Block B, Flat 504",
        registeredAt: "2026-10-28T10:00:00Z",
      },
      {
        id: 202,
        playerName: "Sunil Kumar Reddy K",
        user: { id: 20, fullName: "Sunil Kumar Reddy K", email: "sunil@example.com", role: "RESIDENT" },
        status: "CONFIRMED",
        flatNumber: "Block B, Flat 504",
        registeredAt: "2026-10-29T12:00:00Z",
      },
      {
        id: 200,
        playerName: "Sunil Kumar Reddy K",
        user: { id: 20, fullName: "Sunil Kumar Reddy K", email: "sunil@example.com", role: "RESIDENT" },
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
        user: { id: 20, fullName: "Sunil Kumar Reddy K", email: "sunil@example.com", role: "RESIDENT" },
        status: "CONFIRMED",
        relation: "SELF",
        flatNumber: "Block B, Flat 504",
      },
      {
        id: 302,
        playerName: "Aarav Reddy",
        user: { id: 20, fullName: "Sunil Kumar Reddy K", email: "sunil@example.com", role: "RESIDENT" },
        status: "CONFIRMED",
        relation: "CHILD",
        flatNumber: "Block B, Flat 504",
      },
      {
        id: 300,
        playerName: "Sunil Kumar Reddy K",
        user: { id: 20, fullName: "Sunil Kumar Reddy K", email: "sunil@example.com", role: "RESIDENT" },
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
});
