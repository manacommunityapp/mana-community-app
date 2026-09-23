import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiClient } from "../common/apiClient";
import { sportsDashboardService } from "./sportsDashboardService";
import { sportsService } from "./sportsService";
import { sportsEventService } from "./sportsEventService";
import { auctionService } from "./auctionService";

vi.mock("../common/apiClient", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("Sports Services API Test Suite", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("1. sportsDashboardService", () => {
    it("fetches dashboard stats correctly", async () => {
      const mockStats = {
        yourRegistrations: 3,
        liveEvents: 2,
        openRegistrations: 5,
        upcomingTournaments: 1,
      };
      (apiClient.get as any).mockResolvedValueOnce(mockStats);

      const res = await sportsDashboardService.getStats();
      expect(apiClient.get).toHaveBeenCalledWith("/sports/dashboard/stats");
      expect(res).toEqual(mockStats);
    });

    it("fetches upcoming events list", async () => {
      const mockUpcoming = [
        {
          id: 101,
          name: "Annual Badminton Championship",
          sportName: "Badminton",
          venueName: "Court 1",
          eventDateStart: "2026-10-01",
          startTime: "09:00 AM",
        },
      ];
      (apiClient.get as any).mockResolvedValueOnce(mockUpcoming);

      const res = await sportsDashboardService.getUpcomingEvents();
      expect(apiClient.get).toHaveBeenCalledWith("/sports/dashboard/upcoming");
      expect(res).toHaveLength(1);
      expect(res[0].sportName).toBe("Badminton");
    });

    it("fetches open tournaments", async () => {
      const mockTournaments = [
        {
          id: 1,
          name: "Monsoon Cricket Cup",
          bannerImage: null,
          eventDateStart: "2026-10-01",
          eventDateEnd: "2026-10-10",
          registrationStatus: "OPEN",
          communityId: 4,
          communityName: "Mana Palm Bliss",
          events: [],
        },
      ];
      (apiClient.get as any).mockResolvedValueOnce(mockTournaments);

      const res = await sportsDashboardService.getOpenTournaments();
      expect(apiClient.get).toHaveBeenCalledWith("/sports/dashboard/open-tournaments");
      expect(res).toEqual(mockTournaments);
    });
  });

  describe("2. sportsEventService & sportsService", () => {
    it("maps backend event payload accurately via mapEvent", () => {
      const rawEvent = {
        id: 42,
        uuid: "evt-uuid-42",
        name: "Table Tennis Singles",
        sportName: "Table Tennis",
        format: "SINGLES",
        minPlayers: 1,
        maxPlayers: 1,
        minAge: 12,
        maxAge: 60,
        auctionEnabled: true,
        adminApprovalRequired: false,
        mandatoryMixedDoubles: false,
        status: "OPEN",
      };

      const mapped = sportsEventService.mapEvent(rawEvent as any);
      expect(mapped.id).toBe(42);
      expect(mapped.name).toBe("Table Tennis Singles");
      expect(mapped.auctionEnabled).toBe(true);
      expect(mapped.format).toBe("SINGLES");
    });

    it("submits event registration request", async () => {
      const mockRegistrationResponse = {
        id: 501,
        eventId: 42,
        userId: 12,
        status: "REGISTERED",
      };
      (apiClient.post as any).mockResolvedValueOnce(mockRegistrationResponse);

      const payload = {
        eventId: 42,
        partnerId: 88,
        contactNumber: "9876543210",
        dateOfBirth: "1995-05-15",
      };

      const res = await sportsEventService.registerForEvent(payload as any);
      expect(apiClient.post).toHaveBeenCalledWith("/sports/register", payload);
      expect(res).toEqual(mockRegistrationResponse);
    });

    it("handles partner invitation responses (ACCEPT / DECLINE)", async () => {
      const mockResponse = { id: 202, partnerConfirmed: true };
      (apiClient.put as any).mockResolvedValueOnce(mockResponse);

      const res = await sportsEventService.respondToPartnerInvitation(202, true);
      expect(apiClient.put).toHaveBeenCalledWith(
        "/sports/registrations/202/partner-confirm?accept=true"
      );
      expect(res).toEqual(mockResponse);
    });

    it("fetches schedule stats via sportsService", async () => {
      const mockStats = { totalGames: 24, liveNow: 2, upcoming: 18, completed: 4 };
      (apiClient.get as any).mockResolvedValueOnce(mockStats);

      const res = await sportsService.getScheduleStats();
      expect(apiClient.get).toHaveBeenCalledWith("/sports/schedule/stats");
      expect(res).toEqual(mockStats);
    });
  });

  describe("3. auctionService", () => {
    it("fetches auction config and teams summary", async () => {
      const mockSummary = [{ id: 1, teamName: "Bliss Blasters", totalPurse: 50000, purseRemaining: 35000 }];
      (apiClient.get as any).mockResolvedValueOnce(mockSummary);

      const res = await auctionService.getTeamsSummary(10);
      expect(apiClient.get).toHaveBeenCalledWith("/auction/teams/10");
      expect(res).toEqual(mockSummary);
    });

    it("submits bid request via auctionService", async () => {
      const bidPayload = { eventId: 10, teamId: 2, playerId: 55, bidAmount: 5000 };
      const mockBidRes = { id: 999, teamId: 2, playerId: 55, bidAmount: 5000 };
      (apiClient.post as any).mockResolvedValueOnce(mockBidRes);

      const res = await auctionService.placeBid(bidPayload as any);
      expect(apiClient.post).toHaveBeenCalledWith("/auction/live/bid", bidPayload);
      expect(res).toEqual(mockBidRes);
    });
  });

  describe("4. Error Handling & Rejection Propagation", () => {
    it("propagates API rejection when registering for full event", async () => {
      const errorResponse = new Error("Event capacity has been reached");
      (apiClient.post as any).mockRejectedValueOnce(errorResponse);

      await expect(
        sportsEventService.registerForEvent({ eventId: 99, dateOfBirth: "1995-05-15", contactNumber: "9876543210" } as any)
      ).rejects.toThrow("Event capacity has been reached");
    });

    it("propagates error when auction bid is rejected by server", async () => {
      const errorResponse = new Error("Bid must exceed current highest bid");
      (apiClient.post as any).mockRejectedValueOnce(errorResponse);

      await expect(
        auctionService.placeBid({ eventId: 10, teamId: 1, playerId: 55, bidAmount: 100 } as any)
      ).rejects.toThrow("Bid must exceed current highest bid");
    });
  });
});
