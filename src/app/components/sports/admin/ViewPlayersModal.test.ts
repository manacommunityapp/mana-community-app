import { describe, it, expect } from "vitest";
import { getSportEmoji } from "./ViewPlayersModal";
import { groupRegistrationsByPlayer } from "./TournamentSection";
import { getPartnerDetails } from "./sportsPartnerUtils";
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

  it("activates export button only when player registrations are available", () => {
    const isExportActive = (regs?: TournamentRegistration[]) => Boolean(regs && regs.length > 0);

    expect(isExportActive(undefined)).toBe(false);
    expect(isExportActive([])).toBe(false);
    expect(isExportActive(sampleRegistrations)).toBe(true);
  });
});

describe("sportsPartnerUtils: getPartnerDetails", () => {
  it("resolves direct partner details with name, flat, phone, email, and status", () => {
    const reg: TournamentRegistration = {
      id: 10,
      playerName: "Aakash Gupta",
      status: "CONFIRMED",
      partnerName: "Kavita Rao",
      partnerFlatNumber: "E-502",
      partnerPhone: "9876543210",
      partnerConfirmationStatus: "CONFIRMED",
    };

    const details = getPartnerDetails(reg);
    expect(details.hasPartner).toBe(true);
    expect(details.name).toBe("Kavita Rao");
    expect(details.flat).toBe("Block E, Flat 502");
    expect(details.phone).toBe("9876543210");
    expect(details.status).toBe("CONFIRMED");
    expect(details.statusLabel).toBe("Partner Confirmed");
    expect(details.isConfirmed).toBe(true);
    expect(details.isDeclined).toBe(false);
  });

  it("resolves nested partner object and family member relation", () => {
    const reg: TournamentRegistration = {
      id: 11,
      playerName: "Vikram Sen",
      status: "CONFIRMED",
      partnerFamilyMember: {
        id: 99,
        name: "Arjun Sen",
        relation: "Son",
        age: 15,
        gender: "Male",
      },
      partnerConfirmationStatus: "INVITED",
    };

    const details = getPartnerDetails(reg);
    expect(details.hasPartner).toBe(true);
    expect(details.name).toBe("Arjun Sen");
    expect(details.relation).toBe("Son");
    expect(details.age).toBe(15);
    expect(details.gender).toBe("Male");
    expect(details.isFamilyMember).toBe(true);
    expect(details.status).toBe("INVITED");
    expect(details.statusLabel).toBe("Partner Invited");
  });

  it("resolves reciprocal pairing when partner named the player in their registration", () => {
    const regA: TournamentRegistration = {
      id: 101,
      playerName: "Aditi Rao",
      user: { id: 501, fullName: "Aditi Rao", email: "aditi@example.com" } as any,
      status: "CONFIRMED",
      flatNumber: "Tower 2-301",
      phone: "9112233445",
      partnerUserId: 502,
      partnerName: "Rajesh Varma",
      partnerConfirmationStatus: "CONFIRMED",
    };

    const regB: TournamentRegistration = {
      id: 102,
      playerName: "Rajesh Varma",
      user: { id: 502, fullName: "Rajesh Varma", email: "rajesh@example.com" } as any,
      status: "CONFIRMED",
      flatNumber: "Tower 3-404",
      phone: "9887766554",
      // regB did not explicitly fill partnerName, but regA pointed to user 502
    };

    const allRegs = [regA, regB];
    const detailsB = getPartnerDetails(regB, allRegs);

    expect(detailsB.hasPartner).toBe(true);
    expect(detailsB.name).toBe("Aditi Rao");
    expect(detailsB.flat).toBe("Tower 2-301");
    expect(detailsB.phone).toBe("9112233445");
    expect(detailsB.isReciprocal).toBe(true);
    expect(detailsB.status).toBe("CONFIRMED");
    expect(detailsB.statusLabel).toBe("Partner Confirmed");
  });

  it("captures decline reason when partner declined invitation", () => {
    const reg: TournamentRegistration = {
      id: 12,
      playerName: "Rohan Kumar",
      status: "PENDING",
      partnerName: "Kiran Shah",
      partnerConfirmationStatus: "DECLINED",
      partnerDeclineReason: "Out of station during tournament dates",
    };

    const details = getPartnerDetails(reg);
    expect(details.hasPartner).toBe(true);
    expect(details.isDeclined).toBe(true);
    expect(details.statusLabel).toBe("Partner Declined");
    expect(details.declineReason).toBe("Out of station during tournament dates");
  });

  it("identifies Open Pairing Pool when player registers for doubles without a partner", () => {
    const reg: TournamentRegistration = {
      id: 13,
      playerName: "Meera Nair",
      status: "CONFIRMED",
      matchFormat: "Mixed Doubles",
    };

    const details = getPartnerDetails(reg, [], { name: "Badminton Mixed Doubles Tournament" });
    expect(details.hasPartner).toBe(false);
    expect(details.isDoublesEvent).toBe(true);
    expect(details.isOpenPool).toBe(true);
  });

  it("enriches partner flat, phone, and email from other tournament registrations", () => {
    const regPartner: TournamentRegistration = {
      id: 201,
      playerName: "Suresh Raina",
      flatNumber: "Block C-101",
      phone: "9870001122",
      email: "suresh@example.com",
      status: "CONFIRMED",
    };

    const regMain: TournamentRegistration = {
      id: 202,
      playerName: "MS Dhoni",
      partnerName: "Suresh Raina",
      status: "CONFIRMED",
    };

    const details = getPartnerDetails(regMain, [regPartner, regMain]);
    expect(details.hasPartner).toBe(true);
    expect(details.name).toBe("Suresh Raina");
    expect(details.flat).toBe("Block C-101");
    expect(details.phone).toBe("9870001122");
    expect(details.email).toBe("suresh@example.com");
  });

  it("prioritizes partnerFamilyMember name over account holder partner.fullName", () => {
    const reg: TournamentRegistration = {
      id: 301,
      playerName: "Karthika Punati",
      status: "CONFIRMED",
      partner: {
        id: 11,
        fullName: "Sandeep Kamarapu",
        email: "sandeep@example.com",
        phone: "9949646636",
        flatNo: "907",
      },
      partnerFamilyMember: {
        id: 19,
        name: "Sindhuja Chinthala",
        relation: "Spouse",
        gender: "Female",
        age: 33,
      },
      partnerConfirmationStatus: "CONFIRMED",
    };

    const details = getPartnerDetails(reg);
    expect(details.hasPartner).toBe(true);
    expect(details.name).toBe("Sindhuja Chinthala");
    expect(details.relation).toBe("Spouse");
    expect(details.age).toBe(33);
    expect(details.gender).toBe("Female");
    expect(details.isConfirmed).toBe(true);
    expect(details.isFamilyMember).toBe(true);
  });

  it("cross-references partnerFamilyMemberId against allRegistrations to get family member name", () => {
    const regHouseholdMember: TournamentRegistration = {
      id: 401,
      playerName: "Sindhuja Chinthala",
      familyMemberId: 19,
      relation: "Spouse",
      flatNumber: "Block B, Flat 907",
      phone: "9949646636",
      status: "CONFIRMED",
      user: { id: 11, fullName: "Sandeep Kamarapu", email: "sandeep@example.com", phone: "9949646636", role: "RESIDENT", kycStatus: "APPROVED" },
    };

    const regMain: TournamentRegistration = {
      id: 402,
      playerName: "Karthika Punati",
      partnerUserId: 11,
      partnerFamilyMemberId: 19,
      partner: {
        id: 11,
        fullName: "Sandeep Kamarapu",
        flatNo: "907",
      },
      status: "CONFIRMED",
      partnerConfirmationStatus: "CONFIRMED",
    };

    const details = getPartnerDetails(regMain, [regHouseholdMember, regMain]);
    expect(details.hasPartner).toBe(true);
    expect(details.name).toBe("Sindhuja Chinthala");
    expect(details.relation).toBe("Spouse");
    expect(details.flat).toBe("Block B, Flat 907");
    expect(details.isConfirmed).toBe(true);
  });
});

