import { apiClient } from "../common/apiClient";
import type { CommunityResponse } from "../../types/api";

// ── Overview (Dashboard / Sports Event tabs) ─────────────────────────────

export interface AdminSportRef {
  name: string | null;
  icon: string | null;
  iconUrl: string | null;
}

export interface AdminEventRow {
  id: number;
  name: string;
  eventDateStart: string | null;
  eventDateEnd: string | null;
  format: string[] | null;
  tournamentType: string | null;
  gender: string | null;
  minAge: number | null;
  maxAge: number | null;
  maxParticipants: number | null;
  registrationStatus: string | null;
  auctionStatus: string | null;
  sport: AdminSportRef | null;
  tournamentId: number | null;
  venue?: { name?: string; city?: string } | null;
}

export interface AdminTournamentRow {
  id: number;
  name: string;
  registrationStatus: string | null;
  maxParticipants: number | null;
  eventDateStart: string | null;
  eventDateEnd: string | null;
  events: AdminEventRow[];
}

/** Shape returned by SportsAdminOverviewResponse.RegistrationRow in mana-community-service. */
export interface AdminRegistrationRow {
  id: number;
  playerName: string | null;
  email: string | null;
  flatNumber: string | null;
  role: string | null;
  relation: string | null;
  age: number | null;
  status: string | null;
  eventName: string | null;
  sportName: string | null;
  registeredAt: string | null;
  proposedTeamName: string | null;
}

export interface SportsAdminOverview {
  tournaments: AdminTournamentRow[];
  events: AdminEventRow[];
  pendingRegistrations: AdminRegistrationRow[];
  confirmedRegistrations: AdminRegistrationRow[];
}

// ── Form data (Create Tournament / Create Venue tabs) ────────────────────

export interface AdminSportOption {
  id: number;
  name: string;
  icon: string | null;
  iconUrl: string | null;
  formats: string[] | null;
  communityId: number | null;
}

export interface AdminCategoryOption {
  id: number;
  name: string;
  type: string | null;
  categoryType: string | null;
  description: string | null;
  minAge: number | null;
  maxAge: number | null;
  gender: string | null;
}

export interface SportsAdminFormData {
  sports: AdminSportOption[];
  categories: AdminCategoryOption[];
  communities: CommunityResponse[];
}

export const sportsAdminService = {
  /** GET /api/sports/admin/overview — lean tournaments + events lists for the admin list tabs. */
  async getOverview(communityId?: number): Promise<SportsAdminOverview> {
    const query = communityId ? `?communityId=${communityId}` : "";
    return apiClient.get<SportsAdminOverview>(`/sports/admin/overview${query}`);
  },

  /** GET /api/sports/admin/form-data — sports + categories + communities for the create forms. */
  async getFormData(): Promise<SportsAdminFormData> {
    return apiClient.get<SportsAdminFormData>("/sports/admin/form-data");
  },
};
