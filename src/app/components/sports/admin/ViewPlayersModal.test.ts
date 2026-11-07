import { describe, it, expect } from "vitest";
import { getSportEmoji } from "./ViewPlayersModal";
import { groupRegistrationsByPlayer } from "./TournamentSection";
import type { TournamentRegistration } from "../../../../types/api";

describe("ViewPlayersModal: getSportEmoji", () => {
  it("returns correct emoji for predefined sports by event.sport.name", () => {
    expect(getSportEmoji({ sport: { name: "Table Tennis" } })).toBe("\u{1F3D3}");
    expect(getSportEmoji({ sport: { name: "Badminton" } })).toBe("\u{1F3F8}");
    expect(getSportEmoji({ sport: { name: "Basketball" } })).toBe("\u{1F3C0}");
    expect(getSportEmoji({ sport: { name: "Cricket (Tennis Ball)" } })).toBe("\u{1F3CF}");
    expect(getSportEmoji({ sport: { name: "Volleyball" } })).toBe("\u{1F3D0}");
    expect(getSportEmoji({ sport: { name: "Chess" } })).toBe("♟️");
  });

  it("returns correct emoji inferred from event name", () => {
    expect(getSportEmoji({ name: "Table Tennis - 19+ Men" })).toBe("\u{1F3D3}");
    expect(getSportEmoji({ name: "Annual Badminton Championship - Mixed Doubles" })).toBe("\u{1F3F8}");
    expect(getSportEmoji({ name: "Community Football League" })).toBe("⚽");
  });

  it("falls back to trophy emoji for unknown sports", () => {
    expect(getSportEmoji({ name: "Custom Obstacle Course Challenge" })).toBe("🏆");
    expect(getSportEmoji(null)).toBe("🏆");
  });
});

describe("ViewPlayersModal: Registration grouping and search filtering for modal", () => {
  const sampleRegistrations: TournamentRegistration[] = [
    {
      id: 1,
      playerName: "Rahul Sharma",
      status: "CONFIRMED",
      flatNumber: "A-101",
      phone: "9876543210",
      category: { id: 1, name: "TT Men (19+)" } as any,
      partnerName: "Amit Kumar",
      partnerConfirmationStatus: "CONFIRMED",
    },
    {
      id: 2,
      playerName: "Sunil Kumar",
      status: "PENDING",
      flatNumber: "B-204",
      phone: "9811223344",
      category: { id: 1, name: "TT Men (19+)" } as any,
      partnerName: "Vikram Sen",
      partnerConfirmationStatus: "INVITED",
    },
    {
      id: 3,
      playerName: "Vikram Sen",
      status: "CONFIRMED",
      flatNumber: "C-305",
      phone: "9877001122",
      category: { id: 1, name: "TT Men (19+)" } as any,
      partnerName: "Sunil Kumar",
      partnerConfirmationStatus: "DECLINED",
    },
    {
      id: 4,
      playerName: "Deepak Verma",
      status: "WITHDRAWN",
      flatNumber: "D-401",
      phone: "9988776655",
      category: { id: 1, name: "TT Men (19+)" } as any,
    },
  ];

  it("groups registrations accurately and extracts count statistics", () => {
    const grouped = groupRegistrationsByPlayer(sampleRegistrations);
    expect(grouped).toHaveLength(4);

    let confirmed = 0;
    let pending = 0;
    let withdrawn = 0;
    for (const g of grouped) {
      if (g.primary.status === "CONFIRMED") confirmed++;
      else if (g.primary.status === "PENDING") pending++;
      else if (g.primary.status === "WITHDRAWN") withdrawn++;
    }

    expect(confirmed).toBe(2);
    expect(pending).toBe(1);
    expect(withdrawn).toBe(1);
  });

  it("filters registrations by search query matching player name, flat, phone, or partner", () => {
    const grouped = groupRegistrationsByPlayer(sampleRegistrations);

    // Search by player name
    const filterByName = grouped.filter(g =>
      (g.primary.playerName || "").toLowerCase().includes("rahul")
    );
    expect(filterByName).toHaveLength(1);
    expect(filterByName[0].primary.playerName).toBe("Rahul Sharma");

    // Search by flat number
    const filterByFlat = grouped.filter(g =>
      (g.primary.flatNumber || "").toLowerCase().includes("b-204")
    );
    expect(filterByFlat).toHaveLength(1);
    expect(filterByFlat[0].primary.playerName).toBe("Sunil Kumar");

    // Search by partner name
    const filterByPartner = grouped.filter(g =>
      (g.primary.partnerName || "").toLowerCase().includes("vikram")
    );
    expect(filterByPartner).toHaveLength(1);
    expect(filterByPartner[0].primary.partnerName).toBe("Vikram Sen");
  });

  it("filters registrations by status tabs (CONFIRMED, PENDING, WITHDRAWN)", () => {
    const grouped = groupRegistrationsByPlayer(sampleRegistrations);

    const confirmedOnly = grouped.filter(g => g.primary.status === "CONFIRMED");
    expect(confirmedOnly).toHaveLength(2);
    expect(confirmedOnly.map(g => g.primary.playerName)).toEqual(["Rahul Sharma", "Vikram Sen"]);

    const pendingOnly = grouped.filter(g => g.primary.status === "PENDING" || g.primary.status === "REGISTERED");
    expect(pendingOnly).toHaveLength(1);
    expect(pendingOnly[0].primary.playerName).toBe("Sunil Kumar");

    const withdrawnOnly = grouped.filter(g => g.primary.status === "WITHDRAWN");
    expect(withdrawnOnly).toHaveLength(1);
    expect(withdrawnOnly[0].primary.playerName).toBe("Deepak Verma");
  });

  it("detects doubles partner confirmation states properly", () => {
    const r1 = sampleRegistrations[0];
    const r2 = sampleRegistrations[1];
    const r3 = sampleRegistrations[2];

    const getPartnerBadge = (reg: TournamentRegistration) => {
      const s = (reg.partnerConfirmationStatus || "").toUpperCase();
      if (s === "CONFIRMED" || s === "ACCEPTED") return "Partner Confirmed";
      if (s === "DECLINED" || s === "REJECTED") return "Partner Declined";
      return "Partner Invited";
    };

    expect(getPartnerBadge(r1)).toBe("Partner Confirmed");
    expect(getPartnerBadge(r2)).toBe("Partner Invited");
    expect(getPartnerBadge(r3)).toBe("Partner Declined");
  });
});
