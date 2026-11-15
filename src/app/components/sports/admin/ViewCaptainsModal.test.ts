import { describe, it, expect } from "vitest";
import type { AuctionTeam } from "../../../../types/api";

// Helper function replicating modal filtering logic for test isolation
function filterCaptains(
  captains: Partial<AuctionTeam>[],
  statusFilter: "ALL" | "CONFIRMED" | "PENDING",
  searchQuery: string
): Partial<AuctionTeam>[] {
  const q = searchQuery.trim().toLowerCase();
  return captains.filter((team) => {
    if (statusFilter === "CONFIRMED" && !team.captainConfirmation) return false;
    if (statusFilter === "PENDING" && team.captainConfirmation) return false;

    if (q) {
      const ownerName = (team.ownerName || team.ownerUser?.fullName || "").toLowerCase();
      const teamName = (team.teamName || "").toLowerCase();
      const flat = (team.ownerUser?.flatNumber || "").toLowerCase();
      const phone = (team.ownerUser?.phone || "").toLowerCase();
      const email = (team.ownerUser?.email || "").toLowerCase();
      const budget = String(team.totalBudget || "");

      const match =
        ownerName.includes(q) ||
        teamName.includes(q) ||
        flat.includes(q) ||
        phone.includes(q) ||
        email.includes(q) ||
        budget.includes(q);

      if (!match) return false;
    }

    return true;
  });
}

function computeCounts(captains: Partial<AuctionTeam>[]) {
  let confirmed = 0;
  let pending = 0;
  for (const team of captains) {
    if (team.captainConfirmation) {
      confirmed++;
    } else {
      pending++;
    }
  }
  return {
    total: captains.length,
    confirmed,
    pending,
  };
}

describe("ViewCaptainsModal: counts calculation", () => {
  it("computes 0 counts for an empty captains list", () => {
    const counts = computeCounts([]);
    expect(counts).toEqual({ total: 0, confirmed: 0, pending: 0 });
  });

  it("accurately calculates confirmed and pending counts", () => {
    const sampleCaptains: Partial<AuctionTeam>[] = [
      {
        id: 1,
        teamName: "Super Strikers",
        ownerName: "Virat Kohli",
        captainConfirmation: true,
        totalBudget: 100000,
      },
      {
        id: 2,
        teamName: "Royal Challengers",
        ownerName: "Faf du Plessis",
        captainConfirmation: false,
        totalBudget: 120000,
      },
      {
        id: 3,
        teamName: "Mumbai Titans",
        ownerName: "Rohit Sharma",
        captainConfirmation: true,
        totalBudget: 100000,
      },
      {
        id: 4,
        teamName: "Chennai Super Kings",
        ownerName: "MS Dhoni",
        captainConfirmation: false,
        totalBudget: 150000,
      },
    ];

    const counts = computeCounts(sampleCaptains);
    expect(counts.total).toBe(4);
    expect(counts.confirmed).toBe(2);
    expect(counts.pending).toBe(2);
  });
});

describe("ViewCaptainsModal: status filter", () => {
  const sampleCaptains: Partial<AuctionTeam>[] = [
    {
      id: 1,
      teamName: "Thunderbolts",
      ownerName: "Sandeep Reddy",
      captainConfirmation: true,
      ownerUser: {
        id: 101,
        fullName: "Sandeep Reddy",
        flatNumber: "Block A 101",
        phone: "9876543210",
        email: "sandeep@example.com",
      } as any,
    },
    {
      id: 2,
      teamName: "Blasters",
      ownerName: "Arun Kumar",
      captainConfirmation: false,
      ownerUser: {
        id: 102,
        fullName: "Arun Kumar",
        flatNumber: "Block B 204",
        phone: "9812345678",
        email: "arun@example.com",
      } as any,
    },
    {
      id: 3,
      teamName: "Warriors",
      ownerName: "Kiran Rao",
      captainConfirmation: false,
      ownerUser: {
        id: 103,
        fullName: "Kiran Rao",
        flatNumber: "Block C 305",
        phone: "9833445566",
        email: "kiran@example.com",
      } as any,
    },
  ];

  it("returns all captains when statusFilter is ALL", () => {
    const result = filterCaptains(sampleCaptains, "ALL", "");
    expect(result).toHaveLength(3);
  });

  it("returns only confirmed captains when statusFilter is CONFIRMED", () => {
    const result = filterCaptains(sampleCaptains, "CONFIRMED", "");
    expect(result).toHaveLength(1);
    expect(result[0].teamName).toBe("Thunderbolts");
    expect(result[0].captainConfirmation).toBe(true);
  });

  it("returns only pending captains when statusFilter is PENDING", () => {
    const result = filterCaptains(sampleCaptains, "PENDING", "");
    expect(result).toHaveLength(2);
    expect(result.map((t) => t.teamName)).toEqual(["Blasters", "Warriors"]);
  });
});

describe("ViewCaptainsModal: search filtering", () => {
  const sampleCaptains: Partial<AuctionTeam>[] = [
    {
      id: 10,
      teamName: "Falcon Riders",
      ownerName: "Prashant Varma",
      captainConfirmation: true,
      totalBudget: 150000,
      ownerUser: {
        id: 201,
        fullName: "Prashant Varma",
        flatNumber: "Tower 2 - 1204",
        phone: "9800112233",
        email: "prashant.v@domain.com",
      } as any,
    },
    {
      id: 20,
      teamName: "Solar Flare",
      ownerName: "Deepak Patel",
      captainConfirmation: false,
      totalBudget: 80000,
      ownerUser: {
        id: 202,
        fullName: "Deepak Patel",
        flatNumber: "Tower 1 - 402",
        phone: "9844556677",
        email: "deepak.p@domain.com",
      } as any,
    },
  ];

  it("filters captains by captain name", () => {
    const result = filterCaptains(sampleCaptains, "ALL", "prashant");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(10);
  });

  it("filters captains by proposed team name", () => {
    const result = filterCaptains(sampleCaptains, "ALL", "solar");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(20);
  });

  it("filters captains by flat number", () => {
    const result = filterCaptains(sampleCaptains, "ALL", "1204");
    expect(result).toHaveLength(1);
    expect(result[0].ownerName).toBe("Prashant Varma");
  });

  it("filters captains by phone number", () => {
    const result = filterCaptains(sampleCaptains, "ALL", "9844556677");
    expect(result).toHaveLength(1);
    expect(result[0].ownerName).toBe("Deepak Patel");
  });

  it("filters captains by email address", () => {
    const result = filterCaptains(sampleCaptains, "ALL", "deepak.p");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(20);
  });

  it("combines status filter and search query correctly", () => {
    const confirmedDomain = filterCaptains(sampleCaptains, "CONFIRMED", "domain.com");
    expect(confirmedDomain).toHaveLength(1);
    expect(confirmedDomain[0].id).toBe(10);

    const pendingDomain = filterCaptains(sampleCaptains, "PENDING", "domain.com");
    expect(pendingDomain).toHaveLength(1);
    expect(pendingDomain[0].id).toBe(20);
  });

  it("returns empty when query does not match any captain", () => {
    const result = filterCaptains(sampleCaptains, "ALL", "nonexistent-query");
    expect(result).toHaveLength(0);
  });
});
