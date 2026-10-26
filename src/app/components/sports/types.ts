export type TabId = "dashboard" | "create-tournament" | "sports-event" | "create-venue" | "player-category" | "sports-meta";

export interface SportEventState {
  id: string;
  name: string;
  gender: string;
  playersBorn: string;
  format?: string;
  minPlayers?: number;
  maxPlayers?: number;
  tournamentType?: string;
  minAge?: number;
  maxAge?: number;
  adminApprovalRequired?: boolean;
  mandatoryMixedDoubles?: boolean;
}

export interface SportFormEvent {
  id: string;
  eventName: string;
  startDate: string;
  endDate: string;
  gender: string;
  playersBorn: string;
  format: string;
  formats: string[];
  minPlayers: string;
  maxPlayers: string;
  minAge: string;
  maxAge: string;
  tournamentType: string;
  venueId?: string | number;
  contactName?: string;
  contactNumber?: string;
  contactEmail?: string;
  otherContacts?: any[];
  auctionEnabled?: boolean;
  adminApprovalRequired?: boolean;
  mandatoryMixedDoubles?: boolean;
}

export interface SportFormEntry {
  id: string;
  name: string;
  icon: string;
  iconUrl?: string;
  sportId: number;
  editingSportId: number | null;
  events: SportFormEvent[];
}

export interface SelectedSportWithEvents {
  sportId: number;
  sportName: string;
  sportIcon?: string;
  sportIconUrl?: string;
  events: SportEventState[];
}
