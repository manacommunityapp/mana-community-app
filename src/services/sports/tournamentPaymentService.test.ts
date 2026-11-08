import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiClient } from "../common/apiClient";
import {
  tournamentPaymentService,
  type UniqueTournamentPlayer,
  type TournamentPlayerPayment,
} from "./tournamentPaymentService";
import type { TournamentRegistration } from "../../types/api";

describe("tournamentPaymentService.deduplicatePlayers", () => {
  it("deduplicates primary players registering across multiple events", () => {
    const eventsWithRegistrations = [
      {
        event: { id: 1, name: "Badminton Singles", sportName: "Badminton" },
        registrations: [
          {
            id: 101,
            user: { id: 1, fullName: "Alice Smith", flatNo: "A-101", phone: "9876543210" },
            playerName: "Alice Smith",
            flatNumber: "A-101",
            phone: "9876543210",
            status: "CONFIRMED",
            matchType: "SINGLES",
          } as unknown as TournamentRegistration,
        ],
      },
      {
        event: { id: 2, name: "Table Tennis Singles", sportName: "Table Tennis" },
        registrations: [
          {
            id: 102,
            user: { id: 1, fullName: "Alice Smith", flatNo: "A-101", phone: "9876543210" },
            playerName: "Alice Smith",
            flatNumber: "A-101",
            phone: "9876543210",
            status: "CONFIRMED",
            matchType: "SINGLES",
          } as unknown as TournamentRegistration,
        ],
      },
    ];

    const result = tournamentPaymentService.deduplicatePlayers(eventsWithRegistrations, {});
    expect(result).toHaveLength(1);
    expect(result[0].playerKey).toBe("user_1");
    expect(result[0].playerName).toBe("Alice Smith");
    expect(result[0].registeredEvents).toHaveLength(2);
    expect(result[0].isPartnerOnly).toBe(false);
  });

  it("extracts and includes doubles partner who has NO individual registrations", () => {
    const eventsWithRegistrations = [
      {
        event: { id: 10, name: "Badminton Men Doubles", sportName: "Badminton" },
        registrations: [
          {
            id: 201,
            user: { id: 10, fullName: "Rahul Verma", flatNo: "A-101", phone: "9999911111" },
            playerName: "Rahul Verma",
            flatNumber: "A-101",
            phone: "9999911111",
            status: "CONFIRMED",
            matchType: "DOUBLES",
            partnerUserId: 20,
            partnerName: "Suresh Kumar",
            partnerFlatNumber: "B-202",
            partnerPhone: "9999922222",
            partnerConfirmationStatus: "CONFIRMED",
            partner: { id: 20, fullName: "Suresh Kumar", flatNo: "B-202", phone: "9999922222" },
          } as unknown as TournamentRegistration,
        ],
      },
    ];

    const paymentsMap: Record<string, TournamentPlayerPayment> = {
      user_20: {
        tournamentId: 1,
        playerKey: "user_20",
        playerName: "Suresh Kumar",
        flatNumber: "B-202",
        paymentStatus: "PAID",
        amount: 200,
        paymentMode: "UPI",
      },
    };

    const result = tournamentPaymentService.deduplicatePlayers(eventsWithRegistrations, paymentsMap);

    // Both Rahul and Suresh must be present
    expect(result).toHaveLength(2);

    const rahul = result.find((p) => p.playerKey === "user_10")!;
    const suresh = result.find((p) => p.playerKey === "user_20")!;

    expect(rahul).toBeDefined();
    expect(rahul.isPartnerOnly).toBe(false);
    expect(rahul.registeredEvents[0].partnerName).toBe("Suresh Kumar");
    expect(rahul.registeredEvents[0].isPartner).toBe(false);

    expect(suresh).toBeDefined();
    expect(suresh.playerName).toBe("Suresh Kumar");
    expect(suresh.flatNumber).toBe("B-202");
    expect(suresh.phone).toBe("9999922222");
    expect(suresh.isPartnerOnly).toBe(true);
    expect(suresh.paymentStatus).toBe("PAID");
    expect(suresh.payment?.amount).toBe(200);

    expect(suresh.registeredEvents).toHaveLength(1);
    expect(suresh.registeredEvents[0].eventName).toBe("Badminton Men Doubles");
    expect(suresh.registeredEvents[0].isPartner).toBe(true);
    expect(suresh.registeredEvents[0].partnerName).toBe("Rahul Verma");
    expect(suresh.registeredEvents[0].partnerPhone).toBe("9999911111");
  });

  it("merges partner who ALSO registered as primary player into a single player entry", () => {
    const eventsWithRegistrations = [
      {
        event: { id: 10, name: "Badminton Doubles", sportName: "Badminton" },
        registrations: [
          {
            id: 301,
            user: { id: 10, fullName: "Rahul Verma", flatNo: "A-101" },
            playerName: "Rahul Verma",
            flatNumber: "A-101",
            status: "CONFIRMED",
            matchType: "DOUBLES",
            partnerUserId: 20,
            partnerName: "Suresh Kumar",
            partnerConfirmationStatus: "CONFIRMED",
            partner: { id: 20, fullName: "Suresh Kumar", flatNo: "B-202", phone: "9999922222" },
          } as unknown as TournamentRegistration,
        ],
      },
      {
        event: { id: 20, name: "Table Tennis Singles", sportName: "Table Tennis" },
        registrations: [
          {
            id: 302,
            user: { id: 20, fullName: "Suresh Kumar", flatNo: "B-202" },
            playerName: "Suresh Kumar",
            flatNumber: "B-202",
            phone: "9999922222",
            status: "CONFIRMED",
            matchType: "SINGLES",
          } as unknown as TournamentRegistration,
        ],
      },
    ];

    const result = tournamentPaymentService.deduplicatePlayers(eventsWithRegistrations, {});
    expect(result).toHaveLength(2);

    const suresh = result.find((p) => p.playerKey === "user_20")!;
    expect(suresh).toBeDefined();
    expect(suresh.isPartnerOnly).toBe(false);
    expect(suresh.registeredEvents).toHaveLength(2);

    const doublesEvent = suresh.registeredEvents.find((e) => e.eventId === 10)!;
    const singlesEvent = suresh.registeredEvents.find((e) => e.eventId === 20)!;

    expect(doublesEvent.isPartner).toBe(true);
    expect(doublesEvent.partnerName).toBe("Rahul Verma");

    expect(singlesEvent.isPartner).toBe(false);
  });

  it("extracts confirmed household family member partner and inherits flat if unassigned", () => {
    const eventsWithRegistrations = [
      {
        event: { id: 10, name: "Tennis Mixed Doubles", sportName: "Tennis" },
        registrations: [
          {
            id: 401,
            user: { id: 15, fullName: "Deepak Patel", flatNo: "C-303", phone: "9871100000" },
            playerName: "Deepak Patel",
            flatNumber: "C-303",
            phone: "9871100000",
            status: "CONFIRMED",
            matchType: "MIXED_DOUBLES",
            partnerFamilyMemberId: 55,
            partnerConfirmationStatus: "CONFIRMED",
            partnerFamilyMember: {
              id: 55,
              name: "Pooja Patel",
              relation: "SPOUSE",
            },
          } as unknown as TournamentRegistration,
        ],
      },
    ];

    const result = tournamentPaymentService.deduplicatePlayers(eventsWithRegistrations, {});
    expect(result).toHaveLength(2);

    const pooja = result.find((p) => p.playerKey === "fam_55")!;
    expect(pooja).toBeDefined();
    expect(pooja.playerName).toBe("Pooja Patel");
    expect(pooja.relation).toBe("SPOUSE");
    expect(pooja.flatNumber).toBe("C-303");
    expect(pooja.phone).toBe("9871100000");
    expect(pooja.isPartnerOnly).toBe(true);
  });

  it("does NOT include partners who declined or withdrew", () => {
    const eventsWithRegistrations = [
      {
        event: { id: 10, name: "Badminton Doubles", sportName: "Badminton" },
        registrations: [
          {
            id: 501,
            user: { id: 10, fullName: "Rahul Verma", flatNo: "A-101" },
            playerName: "Rahul Verma",
            flatNumber: "A-101",
            status: "CONFIRMED",
            matchType: "DOUBLES",
            partnerUserId: 99,
            partnerName: "Declined Partner",
            partnerConfirmationStatus: "DECLINED",
            partner: { id: 99, fullName: "Declined Partner" },
          } as unknown as TournamentRegistration,
        ],
      },
    ];

    const result = tournamentPaymentService.deduplicatePlayers(eventsWithRegistrations, {});
    expect(result).toHaveLength(1);
    expect(result[0].playerKey).toBe("user_10");
  });
});

describe("tournamentPaymentService.loadTournamentPlayers & SWR Caching", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    tournamentPaymentService.invalidateRosterCache();
  });

  const mockTournament = {
    id: 100,
    events: [
      { id: 101, name: "Singles A", sportName: "Badminton" },
      { id: 102, name: "Doubles B", sportName: "Badminton" },
    ],
  };

  const mockBatchRegistrations = [
    {
      id: 1,
      event: { id: 101 },
      user: { id: 50, fullName: "Player Fifty", flatNo: "F-50" },
      playerName: "Player Fifty",
      flatNumber: "F-50",
      status: "CONFIRMED",
    },
    {
      id: 2,
      event: { id: 102 },
      user: { id: 50, fullName: "Player Fifty", flatNo: "F-50" },
      playerName: "Player Fifty",
      flatNumber: "F-50",
      status: "CONFIRMED",
      matchType: "DOUBLES",
      partnerUserId: 60,
      partnerName: "Partner Sixty",
      partnerConfirmationStatus: "CONFIRMED",
      partner: { id: 60, fullName: "Partner Sixty", flatNo: "S-60" },
    },
  ];

  it("loads via single batch registrations endpoint and caches the result", async () => {
    const getSpy = vi.spyOn(apiClient, "get").mockImplementation(async (url: string) => {
      if (url.includes("/all-registrations")) {
        return mockBatchRegistrations as any;
      }
      if (url.includes("/payments")) {
        return [] as any;
      }
      throw new Error(`Unexpected url: ${url}`);
    });

    // 1st call: Cold load, hits API
    const players = await tournamentPaymentService.loadTournamentPlayers(mockTournament);

    expect(getSpy).toHaveBeenCalledWith(
      expect.stringContaining("/sports/tournaments/100/all-registrations?eventIds=101,102")
    );
    expect(getSpy).toHaveBeenCalledWith(
      expect.stringContaining("/sports/tournaments/100/payments")
    );
    expect(players).toHaveLength(2); // Player 50 + Partner 60

    // Cache should now have the entry
    const cached = tournamentPaymentService.getCachedPlayers(100);
    expect(cached).not.toBeNull();
    expect(cached).toHaveLength(2);

    // 2nd call: Warm load, should return cached result WITHOUT calling apiClient.get again
    getSpy.mockClear();
    const warmPlayers = await tournamentPaymentService.loadTournamentPlayers(mockTournament);
    expect(warmPlayers).toEqual(players);
    expect(getSpy).not.toHaveBeenCalled();

    // Force refresh should bypass cache and call API again
    await tournamentPaymentService.loadTournamentPlayers(mockTournament, { forceRefresh: true });
    expect(getSpy).toHaveBeenCalled();
  });

  it("falls back to individual event registration endpoints if batch endpoint fails", async () => {
    const getSpy = vi.spyOn(apiClient, "get").mockImplementation(async (url: string) => {
      if (url.includes("/all-registrations")) {
        throw new Error("404 Batch Not Found");
      }
      if (url.includes("/tournaments/101/registrations")) {
        return [mockBatchRegistrations[0]] as any;
      }
      if (url.includes("/tournaments/102/registrations")) {
        return [mockBatchRegistrations[1]] as any;
      }
      if (url.includes("/payments")) {
        return [] as any;
      }
      return [] as any;
    });

    const players = await tournamentPaymentService.loadTournamentPlayers(mockTournament);

    // Should have attempted batch first, then called individual endpoints
    expect(getSpy).toHaveBeenCalledWith(
      expect.stringContaining("/sports/tournaments/100/all-registrations")
    );
    expect(getSpy).toHaveBeenCalledWith("/sports/tournaments/101/registrations");
    expect(getSpy).toHaveBeenCalledWith("/sports/tournaments/102/registrations");
    expect(players).toHaveLength(2);
  });

  it("invalidates cache on invalidateRosterCache", async () => {
    vi.spyOn(apiClient, "get").mockImplementation(async (url: string) => {
      if (url.includes("/all-registrations")) return mockBatchRegistrations as any;
      if (url.includes("/payments")) return [] as any;
      return [] as any;
    });

    await tournamentPaymentService.loadTournamentPlayers(mockTournament);
    expect(tournamentPaymentService.getCachedPlayers(100)).not.toBeNull();

    tournamentPaymentService.invalidateRosterCache(100);
    expect(tournamentPaymentService.getCachedPlayers(100)).toBeNull();
  });

  it("prefetchTournamentData loads data in background and warms cache", async () => {
    vi.spyOn(apiClient, "get").mockImplementation(async (url: string) => {
      if (url.includes("/all-registrations")) return mockBatchRegistrations as any;
      if (url.includes("/payments")) return [] as any;
      return [] as any;
    });

    tournamentPaymentService.prefetchTournamentData(mockTournament);

    // Give microtask/promise a tick to resolve
    await new Promise((resolve) => setTimeout(resolve, 50));

    const cached = tournamentPaymentService.getCachedPlayers(100);
    expect(cached).not.toBeNull();
    expect(cached).toHaveLength(2);
  });
});

