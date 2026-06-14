import { apiClient } from "./apiClient";

// ── Lean dashboard payload (mirrors SportsDashboardResponse on the backend) ──

export interface DashboardStats {
  yourRegistrations: number;
  liveEvents: number;
  openRegistrations: number;
  communityPlayers: number;
}

export interface DashboardEventCard {
  id: number;
  name: string;
  eventDateStart: string | null;
  eventDateEnd: string | null;
  sportName: string | null;
  categoryName: string | null;
  venueName: string | null;
  maxParticipants: number | null;
  registrationStatus: string | null;
  auctionStatus: string | null;
  teamSport: boolean;
  myRegistrationId: number | null;
  myRegistrationStatus: string | null;
}

export interface DashboardUpcomingEvent {
  id: number;
  name: string;
  sportName: string | null;
  venueName: string | null;
  categoryName: string | null;
  registrationStatus: string | null;
  eventDateStart: string | null;
  startTime: string | null;
}

export interface DashboardMyRegistration {
  id: number;
  eventId: number | null;
  eventName: string | null;
  eventDateStart: string | null;
  sportName: string | null;
  categoryName: string | null;
  eventRegistrationStatus: string | null;
  status: string | null;
  matchType: string | null;
  captainNomination: boolean | null;
  captainConfirmation: boolean | null;
}

export interface SportsDashboardResponse {
  stats: DashboardStats;
  openRegistrations: DashboardEventCard[];
  closedRegistrations: DashboardEventCard[];
  myUpcomingEvents: DashboardUpcomingEvent[];
  myRegistrations: DashboardMyRegistration[];
}

export const sportsDashboardService = {
  /** GET /api/sports/dashboard — single aggregated payload for the Sports Dashboard page. */
  async getDashboard(): Promise<SportsDashboardResponse> {
    return apiClient.get<SportsDashboardResponse>("/sports/dashboard");
  },
};
