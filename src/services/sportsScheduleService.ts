import { apiClient } from "./apiClient";

export interface EventListItem {
  id: number;
  uuid: string | null;
  name: string;
  sportName: string | null;
  venueName: string | null;
  venueCity: string | null;
  eventDateStart: string | null;
  eventDateEnd: string | null;
  registrationStatus: string | null;
  auctionStatus: string | null;
  format: string[] | null;
  categoryName: string | null;
  maxParticipants: number | null;
  startTime: string | null;
}

export interface RegistrationListItem {
  id: number;
  status: string;
  eventId: number | null;
  eventName: string | null;
  sportName: string | null;
  categoryName: string | null;
  age: number | null;
  flatNumber: string | null;
  registeredAt: string | null;
  captainNomination: boolean | null;
  captainConfirmation: boolean | null;
  proposedTeamName: string | null;
}

export const sportsScheduleService = {
  async getOpenEvents(communityId: number): Promise<EventListItem[]> {
    return apiClient.get<EventListItem[]>(`/sports/schedule/events/open?communityId=${communityId}`);
  },

  async getMyEvents(): Promise<EventListItem[]> {
    return apiClient.get<EventListItem[]>("/sports/schedule/events/mine");
  },

  async getAllOpenEvents(): Promise<EventListItem[]> {
    return apiClient.get<EventListItem[]>("/sports/schedule/events/open-all");
  },

  async getMyRegistrations(): Promise<RegistrationListItem[]> {
    return apiClient.get<RegistrationListItem[]>("/sports/schedule/registrations/mine");
  },
};
