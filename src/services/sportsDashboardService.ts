import { apiClient } from "./apiClient";

// ── Lean dashboard payload (mirrors SportsDashboardResponse on the backend) ──

export interface DashboardStats {
  yourRegistrations: number;
  liveEvents: number;
  openRegistrations: number;
  upcomingTournaments: number;
}

export interface DashboardEventCard {
  id: number;
  /** Public, non-sequential id used in shareable registration links. */
  uuid: string | null;
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
  tournamentId?: number | null;
  tournamentName?: string | null;
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

export interface DashboardTournamentCard {
  id: number;
  name: string;
  bannerImage: string | null;
  eventDateStart: string | null;
  eventDateEnd: string | null;
  registrationStatus: string | null;
  communityId: number | null;
  communityName: string | null;
  events: DashboardEventCard[];
}

export interface SportsDashboardResponse {
  stats: DashboardStats;
  openRegistrations: DashboardEventCard[];
  closedRegistrations: DashboardEventCard[];
  myUpcomingEvents: DashboardUpcomingEvent[];
  myRegistrations: DashboardMyRegistration[];
  openTournaments: DashboardTournamentCard[];
}

export interface DashboardNotification {
  id: number;
  type: string | null;
  category: string | null;
  title: string;
  body: string | null;
  icon: string | null;
  actionUrl: string | null;
  referenceType: string | null;
  referenceId: number | null;
  priority: string | null;
  read: boolean;
  readAt: string | null;
  createdAt: string;
}

export const sportsDashboardService = {
  async getStats(): Promise<DashboardStats> {
    return apiClient.get<DashboardStats>("/sports/dashboard/stats");
  },
  async getUpcomingEvents(): Promise<DashboardUpcomingEvent[]> {
    return apiClient.get<DashboardUpcomingEvent[]>("/sports/dashboard/upcoming");
  },
  async getOpenTournaments(): Promise<DashboardTournamentCard[]> {
    return apiClient.get<DashboardTournamentCard[]>("/sports/dashboard/open-tournaments");
  },
  async getClosedTournaments(): Promise<DashboardTournamentCard[]> {
    return apiClient.get<DashboardTournamentCard[]>("/sports/dashboard/closed-tournaments");
  },
  async getMyRegistrations(): Promise<DashboardMyRegistration[]> {
    return apiClient.get<DashboardMyRegistration[]>("/sports/dashboard/my-registrations");
  },
  async getNotifications(): Promise<DashboardNotification[]> {
    return apiClient.get<DashboardNotification[]>("/sports/dashboard/notifications");
  }
};
