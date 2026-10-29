import type { SportType } from "./sportsVendor";

export type OfficialRole =
  | "UMPIRE"
  | "REFEREE"
  | "SCORER"
  | "PHOTOGRAPHER"
  | "COMMENTATOR"
  | "LINE_JUDGE";

export type OfficialAssignmentStatus =
  | "REQUESTED"
  | "CONFIRMED"
  | "COMPLETED"
  | "SETTLED"
  | "CANCELLED";

export interface SportsOfficial {
  id: string;
  vendorId?: string;
  fullName: string;
  phone: string;
  email: string;
  role: OfficialRole;
  sports: SportType[];
  certification: string; // e.g., "BCCI Level 1 Umpire", "FIFA State Referee"
  experienceYears: number;
  matchFee: number; // In INR per match/session
  travelRadiusKm: number;
  rating: number;
  totalMatches: number;
  status: "ACTIVE" | "BUSY" | "INACTIVE";
}

export interface OfficialAssignment {
  id: string;
  tournamentId?: string;
  tournamentTitle: string;
  matchId?: string;
  matchTitle: string;
  sport: SportType;
  officialId: string;
  officialName: string;
  role: OfficialRole;
  venueName: string;
  courtOrPitch: string;
  matchDate: string;
  startTime: string;
  matchFee: number;
  status: OfficialAssignmentStatus;
  notes?: string;
  createdAt: string;
}

export type MerchandiseCategory =
  | "JERSEY_CUSTOM"
  | "TROPHY_MEDAL"
  | "EQUIPMENT_RENTAL"
  | "MATCH_BALLS_GEAR"
  | "STRINGING_REPAIR";

export interface SportsMerchandiseItem {
  id: string;
  vendorId: string;
  title: string;
  category: MerchandiseCategory;
  sport: SportType;
  description: string;
  basePrice: number;
  rentalDeposit?: number; // For rental equipment
  rentalDailyPrice?: number;
  availableStock: number;
  unitOfMeasure: string; // e.g., "Piece", "Kit", "Set"
  leadTimeDays: number;
  images: string[];
  options?: {
    sizes?: string[]; // e.g., ["S", "M", "L", "XL", "XXL"]
    fabrics?: string[]; // e.g., ["Dry-Fit Poly", "Honeycomb Mesh"]
    printTypes?: string[]; // e.g., ["Sublimation", "Vinyl", "Embroidery"]
  };
  isActive: boolean;
}

export type QuoteStatus =
  | "PENDING_REVIEW"
  | "QUOTE_PROVIDED"
  | "APPROVED_DEPOSIT_PAID"
  | "IN_PRODUCTION"
  | "DISPATCHED"
  | "DELIVERED";

export interface SupplierQuoteRequest {
  id: string;
  vendorId: string;
  organizerName: string;
  organizerPhone: string;
  tournamentTitle: string;
  itemType: MerchandiseCategory;
  quantity: number;
  targetBudget?: number;
  quotedAmount?: number;
  specifications: string;
  requiredByDate: string;
  status: QuoteStatus;
  mockupProofUrl?: string;
  createdAt: string;
}

export interface TournamentOrganizerEvent {
  id: string;
  vendorId: string;
  title: string;
  sport: SportType;
  tournamentFormat: "KNOCKOUT" | "LEAGUE_CUM_KNOCKOUT" | "ROUND_ROBIN";
  facilityId: string;
  facilityName: string;
  startDate: string;
  endDate: string;
  teamsLimit: number;
  teamsRegistered: number;
  entryFeePerTeam: number;
  totalPrizePool: number;
  status: "DRAFT" | "REGISTRATION_OPEN" | "ONGOING" | "COMPLETED";
  sponsorsCount: number;
  officialsAssignedCount: number;
  totalRevenue: number;
  createdAt: string;
}
