import { describe, it, expect } from "vitest";
import {
  getEventEffectiveStatus,
  resolveSportName,
  tournamentMatchesSport,
  eventMatchesSport,
} from "./SportsTournamentBrowse";
import type { SportsEvent, EventRegistration, AuctionTeam } from "../../../types/api";
import type { DashboardTournamentCard } from "../../../services/sports/sportsDashboardService";

// Pure helper function reflecting exact event registration matching logic
export function filterRegistrationsForEvent(
  registrations: EventRegistration[],
  eventId: number
): EventRegistration[] {
  return registrations.filter(r => {
    const rEvId = (r as any).eventId ?? r.event?.id ?? (r as any).sportsEventId;
    return rEvId != null && eventId != null && Number(rEvId) === Number(eventId);
  });
}

// Pure helper function reflecting exact auction team matching logic
export function findAuctionTeamForEvent(
  auctionTeams: AuctionTeam[],
  eventId: number
): AuctionTeam | null {
  return (
    auctionTeams.find(t => {
      return t.eventId != null && eventId != null && Number(t.eventId) === Number(eventId);
    }) || null
  );
}

describe("SportsTournamentBrowse - Strict Event Scoping", () => {
  const chessUnder12Event: SportsEvent = {
    id: 101,
    name: "Chess — Under 12",
    sportName: "Chess",
    eventDateStart: "2026-12-01",
    eventDateEnd: "2026-12-03",
    tournament: { id: 50, name: "Winter Sports Fest 2026" },
  };

  const tennisDoublesEvent: SportsEvent = {
    id: 102,
    name: "Tennis — Men's Doubles",
    sportName: "Tennis",
    eventDateStart: "2026-12-01",
    eventDateEnd: "2026-12-03",
    tournament: { id: 50, name: "Winter Sports Fest 2026" },
  };

  const allUserRegistrations: EventRegistration[] = [
    {
      id: 1001,
      status: "CONFIRMED",
      playerName: "Aarav Sharma",
      relation: "SON",
      flatNumber: "A-401",
      category: { id: 1, name: "Under 12", categoryType: "KIDS", minAge: 5, maxAge: 12, gender: "ALL" },
      matchFormat: "SINGLES",
      event: { id: 101, name: "Chess — Under 12" } as any,
    },
    {
      id: 1002,
      status: "CONFIRMED",
      playerName: "Rajesh Sharma",
      relation: "SELF",
      flatNumber: "A-401",
      category: { id: 2, name: "Men's Open", categoryType: "MENS", minAge: 18, maxAge: 100, gender: "MALE" },
      matchFormat: "DOUBLES",
      partnerName: "Vikram Malhotra",
      partnerFlatNumber: "B-204",
      partnerConfirmationStatus: "CONFIRMED",
      event: { id: 102, name: "Tennis — Men's Doubles" } as any,
    },
  ];

  const auctionTeams: AuctionTeam[] = [
    {
      id: 501,
      name: "Court Smashers",
      teamName: "Court Smashers",
      eventId: 102,
      captainConfirmation: true,
    } as any,
  ];

  it("strictly scopes registrations to the exact event ID and prevents sibling event pollution", () => {
    // Chess Under 12 must ONLY have the Son's registration, NOT the Tennis doubles partner
    const chessRegs = filterRegistrationsForEvent(allUserRegistrations, chessUnder12Event.id);
    expect(chessRegs).toHaveLength(1);
    expect(chessRegs[0].playerName).toBe("Aarav Sharma");
    expect(chessRegs[0].relation).toBe("SON");
    expect(chessRegs[0].partnerName).toBeUndefined();

    // Tennis Doubles must ONLY have the Tennis registration with partner Vikram
    const tennisRegs = filterRegistrationsForEvent(allUserRegistrations, tennisDoublesEvent.id);
    expect(tennisRegs).toHaveLength(1);
    expect(tennisRegs[0].playerName).toBe("Rajesh Sharma");
    expect(tennisRegs[0].partnerName).toBe("Vikram Malhotra");
    expect(tennisRegs[0].partnerFlatNumber).toBe("B-204");
  });

  it("strictly scopes auction teams so sibling events do not display unrelated teams", () => {
    // Chess Under 12 has NO auction team
    const chessTeam = findAuctionTeamForEvent(auctionTeams, chessUnder12Event.id);
    expect(chessTeam).toBeNull();

    // Tennis Doubles has Court Smashers
    const tennisTeam = findAuctionTeamForEvent(auctionTeams, tennisDoublesEvent.id);
    expect(tennisTeam).not.toBeNull();
    expect(tennisTeam?.teamName).toBe("Court Smashers");
    expect(tennisTeam?.captainConfirmation).toBe(true);
  });

  it("handles eventId represented either on event object or direct field (sportsDashboardService compatibility)", () => {
    const mixedRegs = [
      { id: 2001, eventId: 101, status: "CONFIRMED" } as any,
      { id: 2002, event: { id: 101 }, status: "CONFIRMED" } as any,
      { id: 2003, sportsEventId: 101, status: "CONFIRMED" } as any,
      { id: 2004, eventId: 999, status: "CONFIRMED" } as any,
    ];

    const matching = filterRegistrationsForEvent(mixedRegs, 101);
    expect(matching).toHaveLength(3);
    expect(matching.map(r => r.id)).toEqual([2001, 2002, 2003]);
  });
});

describe("getEventEffectiveStatus helper", () => {
  it("correctly identifies closed events", () => {
    const closedEv: SportsEvent = {
      id: 1,
      name: "Event 1",
      eventDateStart: "2026-10-01",
      eventDateEnd: "2026-10-02",
      registrationStatus: "REGISTRATION_CLOSED",
    };
    const res = getEventEffectiveStatus(closedEv);
    expect(res.isClosed).toBe(true);
    expect(res.isOpen).toBe(false);
  });

  it("correctly identifies completed events", () => {
    const completedEv: SportsEvent = {
      id: 2,
      name: "Event 2",
      eventDateStart: "2026-09-01",
      eventDateEnd: "2026-09-02",
      registrationStatus: "COMPLETED",
    };
    const res = getEventEffectiveStatus(completedEv);
    expect(res.isCompleted).toBe(true);
    expect(res.isClosed).toBe(true);
  });

  it("correctly identifies live events", () => {
    const liveEv: SportsEvent = {
      id: 3,
      name: "Event 3",
      eventDateStart: "2026-11-13",
      eventDateEnd: "2026-11-15",
      registrationStatus: "LIVE",
    };
    const res = getEventEffectiveStatus(liveEv);
    expect(res.isLive).toBe(true);
  });

  it("correctly identifies open events", () => {
    const openEv: SportsEvent = {
      id: 4,
      name: "Event 4",
      eventDateStart: "2026-12-13",
      eventDateEnd: "2026-12-15",
      registrationStatus: "REGISTRATION_OPEN",
    };
    const res = getEventEffectiveStatus(openEv);
    expect(res.isOpen).toBe(true);
    expect(res.isClosed).toBe(false);
  });
});

describe("resolveSportName helper", () => {
  it("resolves from sportName direct property", () => {
    expect(resolveSportName({ sportName: "Cricket" })).toBe("Cricket");
  });

  it("resolves from nested sport.name object (Spring Boot entity shape)", () => {
    expect(resolveSportName({ sport: { name: "Chess" } })).toBe("Chess");
  });

  it("resolves from sport_name snake_case property", () => {
    expect(resolveSportName({ sport_name: "Badminton" } as any)).toBe("Badminton");
  });

  it("detects sport from name/title when direct sport field is missing", () => {
    expect(resolveSportName({ name: "Under 14 Chess Championship" })).toBe("Chess");
    expect(resolveSportName({ title: "Annual Badminton Open 2026" })).toBe("Badminton");
    expect(resolveSportName({ name: "Community Table Tennis League" })).toBe("Table Tennis");
  });

  it("returns undefined for empty/unrecognized items", () => {
    expect(resolveSportName(null)).toBeUndefined();
    expect(resolveSportName(undefined)).toBeUndefined();
    expect(resolveSportName({ name: "General Community Gathering" })).toBeUndefined();
  });
});

describe("tournamentMatchesSport helper", () => {
  const cricketTournament: DashboardTournamentCard = {
    id: 1,
    name: "Winter Premier League",
    sportName: "Cricket",
    bannerImage: null,
    eventDateStart: "2026-12-01",
    eventDateEnd: "2026-12-03",
    registrationStatus: "REGISTRATION_OPEN",
    communityId: 1,
    communityName: "Green Valley",
    events: [],
  };

  const multiSportTournament: DashboardTournamentCard = {
    id: 2,
    name: "Summer Sports Extravaganza",
    bannerImage: null,
    eventDateStart: "2026-12-01",
    eventDateEnd: "2026-12-03",
    registrationStatus: "REGISTRATION_OPEN",
    communityId: 1,
    communityName: "Green Valley",
    events: [
      { id: 201, name: "Singles Match", sport: { name: "Chess" } } as any,
      { id: 202, name: "Doubles Match", sportName: "Badminton" } as any,
    ],
  };

  const titleOnlyTournament: DashboardTournamentCard = {
    id: 3,
    name: "Annual Football Cup",
    bannerImage: null,
    eventDateStart: "2026-12-01",
    eventDateEnd: "2026-12-03",
    registrationStatus: "REGISTRATION_OPEN",
    communityId: 1,
    communityName: "Green Valley",
    events: [],
  };

  it("returns true for 'All' or empty filter", () => {
    expect(tournamentMatchesSport(cricketTournament, "All")).toBe(true);
    expect(tournamentMatchesSport(cricketTournament, "")).toBe(true);
  });

  it("matches tournament by direct sportName", () => {
    expect(tournamentMatchesSport(cricketTournament, "Cricket")).toBe(true);
    expect(tournamentMatchesSport(cricketTournament, "cricket")).toBe(true);
    expect(tournamentMatchesSport(cricketTournament, "Chess")).toBe(false);
  });

  it("matches tournament by child event sport (both sport.name and sportName)", () => {
    expect(tournamentMatchesSport(multiSportTournament, "Chess")).toBe(true);
    expect(tournamentMatchesSport(multiSportTournament, "Badminton")).toBe(true);
    expect(tournamentMatchesSport(multiSportTournament, "Cricket")).toBe(false);
  });

  it("matches tournament by inferred title when sport field is missing", () => {
    expect(tournamentMatchesSport(titleOnlyTournament, "Football")).toBe(true);
    expect(tournamentMatchesSport(titleOnlyTournament, "Chess")).toBe(false);
  });
});

describe("eventMatchesSport helper", () => {
  const chessEvent: SportsEvent = {
    id: 10,
    name: "Under 12 Singles",
    eventDateStart: "2026-12-01",
    eventDateEnd: "2026-12-03",
    sport: { name: "Chess" } as any,
  };

  const tennisEventWithParent: SportsEvent = {
    id: 11,
    name: "Doubles Trophy",
    eventDateStart: "2026-12-01",
    eventDateEnd: "2026-12-03",
    tournament: { id: 1, name: "Tennis Cup", sportName: "Tennis" },
  };

  const titleOnlyEvent: SportsEvent = {
    id: 12,
    name: "Box Cricket Championship",
    eventDateStart: "2026-12-01",
    eventDateEnd: "2026-12-03",
  };

  it("returns true for 'All' or empty filter", () => {
    expect(eventMatchesSport(chessEvent, "All")).toBe(true);
    expect(eventMatchesSport(chessEvent, "")).toBe(true);
  });

  it("matches event with nested sport.name (backend entity format)", () => {
    expect(eventMatchesSport(chessEvent, "Chess")).toBe(true);
    expect(eventMatchesSport(chessEvent, "chess")).toBe(true);
    expect(eventMatchesSport(chessEvent, "Cricket")).toBe(false);
  });

  it("matches event via parent tournament sport", () => {
    expect(eventMatchesSport(tennisEventWithParent, "Tennis")).toBe(true);
    expect(eventMatchesSport(tennisEventWithParent, "Cricket")).toBe(false);
  });

  it("matches event by sport keyword in event title", () => {
    expect(eventMatchesSport(titleOnlyEvent, "Cricket")).toBe(true);
    expect(eventMatchesSport(titleOnlyEvent, "Chess")).toBe(false);
  });
});