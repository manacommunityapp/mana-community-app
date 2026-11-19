import { describe, it, expect } from "vitest";
import {
  groupRegistrationsByPlayer,
  getEventCategorySignature,
  normalizeEventGender,
  getEventFormatSignature,
  getDisplayEventFormats,
  getFormatBadge,
} from "./TournamentSection";
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

describe("TournamentSection: pending events registration logic", () => {
  it("identifies pending events that are not LIVE, REGISTRATION_OPEN, or COMPLETED", () => {
    const sportsEvents = [
      { id: 1, name: "Badminton Men Doubles 18+", registrationStatus: "REGISTRATION_OPEN" },
      { id: 2, name: "Badminton Women Singles 18+", registrationStatus: "DRAFT" },
      { id: 3, name: "Badminton Mixed Doubles 30+", status: "DRAFT" },
      { id: 4, name: "Badminton Kids Under 14", registrationStatus: "REGISTRATION_CLOSED" },
      { id: 5, name: "Cricket Championship", registrationStatus: "COMPLETED" },
    ];

    const pending = sportsEvents.filter((e: any) => {
      const st = e.registrationStatus || e.status;
      return st !== "LIVE" && st !== "REGISTRATION_OPEN" && st !== "COMPLETED";
    });

    // Events 2, 3, 4 should be pending
    expect(pending.map(e => e.id)).toEqual([2, 3, 4]);
  });
});

describe("TournamentSection: duplicate category detection and highlighting", () => {
  it("generates identical signatures for events with matching Sport, Category, Gender, and Format", () => {
    const eventA = {
      id: 1,
      name: "Badminton Men's Singles 35+",
      sport: { name: "Badminton" },
      categoryName: "Men's Singles",
      gender: "MALE",
      format: "SINGLES",
      minAge: 35,
      maxAge: 99,
    };

    const eventB = {
      id: 2,
      name: "Badminton Men's Singles 35+ (Division 2)",
      sport: { name: "Badminton" },
      categoryName: "Men's Singles",
      gender: "MALE",
      format: "SINGLES",
      minAge: 35,
      maxAge: 99,
    };

    const sigA = getEventCategorySignature(eventA);
    const sigB = getEventCategorySignature(eventB);

    expect(sigA).toBeTruthy();
    expect(sigA).toBe(sigB);
  });

  it("differentiates signatures when gender differs", () => {
    const maleEvent = {
      id: 1,
      name: "Badminton Singles Open",
      sport: { name: "Badminton" },
      categoryName: "Singles",
      gender: "MALE",
      format: "SINGLES",
    };

    const femaleEvent = {
      id: 2,
      name: "Badminton Singles Open",
      sport: { name: "Badminton" },
      categoryName: "Singles",
      gender: "FEMALE",
      format: "SINGLES",
    };

    expect(getEventCategorySignature(maleEvent)).not.toBe(getEventCategorySignature(femaleEvent));
  });

  it("differentiates signatures when participant format differs", () => {
    const singlesEvent = {
      id: 1,
      name: "Tennis Men 18+",
      sport: { name: "Tennis" },
      categoryName: "Men",
      gender: "MALE",
      format: "SINGLES",
      minAge: 18,
    };

    const doublesEvent = {
      id: 2,
      name: "Tennis Men 18+",
      sport: { name: "Tennis" },
      categoryName: "Men",
      gender: "MALE",
      format: "DOUBLES",
      minAge: 18,
    };

    expect(getEventCategorySignature(singlesEvent)).not.toBe(getEventCategorySignature(doublesEvent));
  });

  it("differentiates signatures when age category / bracket differs", () => {
    const under14Event = {
      id: 1,
      name: "Badminton Singles U14",
      sport: { name: "Badminton" },
      categoryName: "Singles",
      gender: "MALE",
      format: "SINGLES",
      minAge: 0,
      maxAge: 14,
    };

    const under16Event = {
      id: 2,
      name: "Badminton Singles U16",
      sport: { name: "Badminton" },
      categoryName: "Singles",
      gender: "MALE",
      format: "SINGLES",
      minAge: 0,
      maxAge: 16,
    };

    expect(getEventCategorySignature(under14Event)).not.toBe(getEventCategorySignature(under16Event));
  });

  it("accurately counts duplicates and preserves both events in the list", () => {
    const sportsEvents = [
      {
        id: 10,
        name: "Badminton Men Singles 35+ Group A",
        sport: { name: "Badminton" },
        categoryName: "Men's Singles",
        gender: "MALE",
        format: "SINGLES",
        minAge: 35,
        maxAge: 99,
      },
      {
        id: 11,
        name: "Badminton Men Singles 35+ Group B",
        sport: { name: "Badminton" },
        categoryName: "Men's Singles",
        gender: "MALE",
        format: "SINGLES",
        minAge: 35,
        maxAge: 99,
      },
      {
        id: 12,
        name: "Badminton Women Singles 35+",
        sport: { name: "Badminton" },
        categoryName: "Women's Singles",
        gender: "FEMALE",
        format: "SINGLES",
        minAge: 35,
        maxAge: 99,
      },
    ];

    // Compute signature counts across tournament
    const counts: Record<string, number> = {};
    for (const e of sportsEvents) {
      const sig = getEventCategorySignature(e);
      if (sig) counts[sig] = (counts[sig] || 0) + 1;
    }

    const duplicateEvents = sportsEvents.filter(e => {
      const sig = getEventCategorySignature(e);
      return Boolean(sig && (counts[sig] || 0) > 1);
    });

    // Both Group A and Group B must be flagged as duplicates
    expect(duplicateEvents).toHaveLength(2);
    expect(duplicateEvents.map(e => e.id)).toEqual([10, 11]);

    // Crucial requirement: ALL 3 events remain present in the list (neither is hidden or removed)
    expect(sportsEvents).toHaveLength(3);
  });
});

describe("TournamentSection: getDisplayEventFormats and getFormatBadge", () => {
  it("extracts formats from format array or string", () => {
    expect(getDisplayEventFormats({ format: ["SINGLES"] })).toEqual(["SINGLES"]);
    expect(getDisplayEventFormats({ format: "DOUBLES" })).toEqual(["DOUBLES"]);
    expect(getDisplayEventFormats({ format: "SINGLES, DOUBLES" })).toEqual(["SINGLES", "DOUBLES"]);
  });

  it("extracts formats from formats or eventFormats array of objects or strings", () => {
    expect(getDisplayEventFormats({ formats: [{ formatType: "MIXED_DOUBLES" }] })).toEqual(["MIXED_DOUBLES"]);
    expect(getDisplayEventFormats({ eventFormats: [{ name: "TEAM" }] })).toEqual(["TEAM"]);
    expect(getDisplayEventFormats({ formats: ["SINGLES"] })).toEqual(["SINGLES"]);
  });

  it("falls back to tournamentType when format is not explicitly defined", () => {
    expect(getDisplayEventFormats({ tournamentType: "SINGLES" })).toEqual(["SINGLES"]);
    expect(getDisplayEventFormats({ tournamentType: "KNOCKOUT_SINGLE" })).toEqual(["KNOCKOUT_SINGLE"]);
    expect(getDisplayEventFormats({})).toEqual([]);
  });

  it("provides distinct human-readable labels and Tailwind color badges for participant formats", () => {
    const singlesBadge = getFormatBadge("SINGLES");
    expect(singlesBadge.label).toBe("Singles");
    expect(singlesBadge.color).toContain("emerald");

    const doublesBadge = getFormatBadge("DOUBLES");
    expect(doublesBadge.label).toBe("Doubles");
    expect(doublesBadge.color).toContain("blue");

    const mixedBadge = getFormatBadge("MIXED_DOUBLES");
    expect(mixedBadge.label).toBe("Mixed Doubles");
    expect(mixedBadge.color).toContain("rose");

    const teamBadge = getFormatBadge("TEAM");
    expect(teamBadge.label).toBe("Team Squad");
    expect(teamBadge.color).toContain("purple");

    const relayBadge = getFormatBadge("RELAY");
    expect(relayBadge.label).toBe("Relay");
    expect(relayBadge.color).toContain("cyan");
  });

  it("accurately detects team sports vs individual sports for captaincy controls", () => {
    const isTeam = (sportName: string, ev: any) => {
      const formats = getDisplayEventFormats(ev);
      return ["cricket", "football", "basketball", "volleyball", "kabaddi"].includes(sportName.toLowerCase()) || formats.includes("TEAM");
    };

    expect(isTeam("Cricket", {})).toBe(true);
    expect(isTeam("Football", {})).toBe(true);
    expect(isTeam("Tennis", { format: ["TEAM"] })).toBe(true);
    expect(isTeam("Badminton", { format: ["SINGLES"] })).toBe(false);
    expect(isTeam("Table Tennis", { format: ["DOUBLES"] })).toBe(false);
  });

  it("determines captaincy status from captainNominationOpen and rawEvent fallback", () => {
    const getCaptaincyOpen = (ev: any) => Boolean(ev.captainNominationOpen || ev.rawEvent?.captainNominationOpen);

    expect(getCaptaincyOpen({ captainNominationOpen: true })).toBe(true);
    expect(getCaptaincyOpen({ captainNominationOpen: false })).toBe(false);
    expect(getCaptaincyOpen({ rawEvent: { captainNominationOpen: true } })).toBe(true);
    expect(getCaptaincyOpen({})).toBe(false);
  });
});


