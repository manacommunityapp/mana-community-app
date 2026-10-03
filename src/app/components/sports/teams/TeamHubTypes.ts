export type PlayerRoleType =
  | 'BATSMAN'
  | 'BOWLER'
  | 'ALL_ROUNDER'
  | 'WICKET_KEEPER'
  | 'FORWARD'
  | 'MIDFIELDER'
  | 'DEFENDER'
  | 'GOALKEEPER'
  | 'SINGLES'
  | 'DOUBLES'
  | 'ALL_ROUNDER_RACQUET'
  | 'PLAYER';

export type PlayerAcquisitionStatus =
  | 'CAPTAIN'
  | 'VICE_CAPTAIN'
  | 'RETAINED'
  | 'AUCTION_BUY'
  | 'DRAFT'
  | 'UNSOLD';

export interface SquadMemberStats {
  matches?: number;
  runs?: number;
  wickets?: number;
  strikeRate?: number;
  economy?: number;
  highestScore?: string | number;
  bestBowling?: string;
  points?: number;
  goals?: number;
  assists?: number;
}

export interface SquadMember {
  id: number | string;
  name: string;
  avatarUrl?: string;
  role: PlayerRoleType;
  category?: string; // e.g. 'Icon', 'Gold', 'Silver', 'Tier 1', 'Open'
  jerseyNumber?: number | string;
  acquiredPrice: number; // in ₹
  status: PlayerAcquisitionStatus;
  flatNumber?: string;
  isCommunityResident?: boolean;
  stats?: SquadMemberStats;
}

export interface TeamProfile {
  id: number;
  name: string;
  shortName?: string;
  logoUrl?: string;
  colorHex: string;
  secondaryColor?: string;
  emoji: string;
  ownerName?: string;
  ownerAvatar?: string;
  ownerCompany?: string;
  captainName?: string;
  captainAvatar?: string;
  captainId?: number | string;
  captainConfirmed?: boolean;
  viceCaptainName?: string;
  homeGround?: string;
  motto?: string;
  sportName?: string;
  tournamentId?: number;
  tournamentName?: string;
  season?: string;
  totalBudget: number;
  spentBudget: number;
  remainingBudget: number;
  maxSquadSize: number;
  squad: SquadMember[];
  titlesCount?: number;
  winLossRatio?: string;
}

export interface TeamFilterState {
  role: 'ALL' | PlayerRoleType;
  searchQuery: string;
  minPrice?: number;
  maxPrice?: number;
  statusFilter?: 'ALL' | PlayerAcquisitionStatus;
}
