import type { SportType } from "./sportsVendor";

export type DemandLevel = "HIGH" | "MEDIUM" | "LOW";

export interface DemandForecast {
  date: string;
  hour: string; // HH:mm
  courtId: string;
  courtName: string;
  predictedDemand: DemandLevel;
  historicalOccupancyPercent: number;
  currentBasePrice: number;
  recommendedPrice: number;
  expectedRevenueUpliftPercent: number;
  isPeakSuggested: boolean;
}

export interface WaitlistRecoveryItem {
  id: string;
  facilityId: string;
  facilityName: string;
  courtName: string;
  sport: SportType;
  date: string;
  slotTime: string;
  waitlistedUsersCount: number;
  status: "ACTIVE" | "NOTIFIED" | "CONVERTED" | "EXPIRED";
  recoveredRevenue: number;
  cancelledByCustomer?: string;
  convertedToCustomer?: string;
  notificationSentAt?: string;
}

export interface MultiBranchAnalytics {
  branchId: string;
  branchName: string;
  city: string;
  area: string;
  courtsCount: number;
  monthlyRevenue: number;
  revenueGrowthPercent: number;
  utilizationPercent: number;
  repeatCustomerRate: number;
  rating: number;
  totalReviews: number;
  primarySport: SportType;
}

export interface DynamicOfferRule {
  id: string;
  facilityId: string;
  name: string; // e.g., "Weekday Afternoon Flash Discount"
  condition: "OCCUPANCY_BELOW_40" | "LAST_MINUTE_2_HOURS" | "OFF_PEAK_MORNING";
  timeWindowStart: string;
  timeWindowEnd: string;
  discountPercentage: number;
  autoApply: boolean;
  isActive: boolean;
}

export interface FederatedCommunityPass {
  id: string;
  passName: string; // e.g., "East Bangalore Resident All-Access Pass"
  partnerCommunities: string[];
  eligibleFacilities: {
    facilityId: string;
    facilityName: string;
    sportsIncluded: SportType[];
  }[];
  monthlyPrice: number;
  residentDiscountPercent: number;
  activeSubscribersCount: number;
  monthlySettlementPool: number;
  status: "ACTIVE" | "UPCOMING" | "PAUSED";
}
