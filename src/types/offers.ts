export type DealType =
  | 'DISCOUNT'
  | 'FIXED_PRICE'
  | 'PERCENTAGE_OFF'
  | 'BUY_ONE_GET_ONE'
  | 'FREE_SERVICE'
  | 'BUNDLE'
  | 'COMMUNITY_PRICE'
  | 'FIRST_VISIT'
  | 'MEMBERSHIP_OFFER'
  | 'EVENT_OFFER'
  | 'GROUP_OFFER';

export type OfferStatus =
  | 'DRAFT'
  | 'PENDING_COMMUNITY_APPROVAL'
  | 'APPROVED'
  | 'PUBLISHED'
  | 'PAUSED'
  | 'EXPIRED'
  | 'REJECTED';

export type BusinessVerificationStatus =
  | 'PENDING'
  | 'VERIFIED'
  | 'COMMUNITY_PARTNER'
  | 'SUSPENDED'
  | 'REJECTED';

export type PartnershipTier =
  | 'NONE'
  | 'SILVER_PARTNER'
  | 'GOLD_PARTNER'
  | 'PLATINUM_PARTNER';

export type ClaimStatus = 'ACTIVE' | 'REDEEMED' | 'EXPIRED' | 'CANCELLED';

export type BoothPackageType =
  | 'BASIC_BOOTH'
  | 'PREMIUM_BOOTH'
  | 'FOOD_STALL'
  | 'ACTIVITY_ZONE'
  | 'CATEGORY_SPONSOR'
  | 'TITLE_SPONSOR';

export type MarketEventStatus =
  | 'DRAFT'
  | 'UPCOMING'
  | 'LIVE_NOW'
  | 'COMPLETED'
  | 'CANCELLED';

export type VendorApplicationStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'BOOTH_ASSIGNED'
  | 'PAYMENT_COMPLETED'
  | 'REJECTED'
  | 'CANCELLED';

export type DemandStatus = 'OPEN' | 'FULFILLED' | 'EXPIRED' | 'ARCHIVED';

export interface CommerceCategory {
  id: string;
  name: string;
  code: string;
  description?: string;
  icon?: string;
  displayOrder?: number;
  active: boolean;
}

export interface BusinessPartner {
  id: string;
  name: string;
  registeredEntityName?: string;
  categoryId: string;
  categoryName?: string;
  description?: string;
  tagline?: string;
  logoUrl?: string;
  bannerUrl?: string;
  address?: string;
  city?: string;
  pincode?: string;
  phone?: string;
  email?: string;
  websiteUrl?: string;
  googleMapsUrl?: string;
  distanceKm?: number;
  verificationStatus: BusinessVerificationStatus;
  partnershipTier: PartnershipTier;
  averageRating: number;
  reviewCount: number;
  activeDealsCount: number;
  totalRedemptions: number;
  ownerUserId?: string;
  createdAt?: string;
}

export interface CommunityOffer {
  id: string;
  businessId: string;
  businessName: string;
  businessLogoUrl?: string;
  categoryId: string;
  categoryName?: string;
  title: string;
  tagline?: string;
  description?: string;
  coverImageUrl?: string;
  dealType: DealType;
  regularPrice?: number;
  communityPrice?: number;
  discountPercentage?: number;
  savingsSummary?: string;
  termsAndConditions?: string;
  eligibilityNote?: string;
  targetCommunityIds?: string[];
  targetCommunityNames?: string[];
  estimatedAudience?: number;
  validFrom?: string;
  validUntil?: string;
  maxClaims?: number;
  claimedCount: number;
  redeemedCount: number;
  availableClaims: number;
  isClaimable: boolean;
  status: OfferStatus;
  featured: boolean;
  viewCount: number;
  createdAt?: string;
}

export interface OfferClaim {
  id: string;
  offerId: string;
  offerTitle: string;
  dealType?: DealType;
  regularPrice?: number;
  communityPrice?: number;
  savingsSummary?: string;
  businessId: string;
  businessName: string;
  businessLogoUrl?: string;
  businessAddress?: string;
  businessPhone?: string;
  communityId: string;
  residentUserId: string;
  residentName?: string;
  unitNumber?: string;
  redemptionCode: string;
  qrPayload?: string;
  status: ClaimStatus;
  validUntil?: string;
  claimedAt?: string;
  redeemedAt?: string;
}

export interface MarketBooth {
  id: string;
  marketEventId: string;
  boothNumber: string;
  zone: string;
  packageType: BoothPackageType;
  price?: number;
  isOccupied: boolean;
  assignedBusinessId?: string;
  assignedBusinessName?: string;
  assignedCategory?: string;
  todaysSpecialOffer?: string;
  displayRow?: number;
  displayCol?: number;
}

export interface CommunityMarketEvent {
  id: string;
  communityId: string;
  communityName: string;
  title: string;
  theme?: string;
  description?: string;
  bannerImageUrl?: string;
  eventDate: string;
  startTime?: string;
  endTime?: string;
  venue?: string;
  status: MarketEventStatus;
  totalBooths: number;
  allocatedBooths: number;
  availableBooths: number;
  expectedVisitors?: number;
  eventGuidelines?: string;
  entertainmentHighlights?: string;
  booths: MarketBooth[];
  createdAt?: string;
}

export interface CommunityDemand {
  id: string;
  communityId: string;
  communityName: string;
  title: string;
  categoryId: string;
  categoryName?: string;
  description?: string;
  expectedFrequency?: string;
  preferredTiming?: string;
  interestedFamiliesCount: number;
  userHasExpressedInterest: boolean;
  status: DemandStatus;
  createdByName?: string;
  fulfilledByBusinessName?: string;
  resultingOfferId?: string;
  createdAt?: string;
}

export interface CommerceAnalytics {
  totalActiveBusinesses: number;
  totalActiveOffers: number;
  totalMarketEvents: number;
  totalClaims: number;
  totalRedemptions: number;
  redemptionRate: number;
  totalEstimatedSavings: number;
  categoryDistribution: Record<string, number>;
  dealTypeDistribution: Record<string, number>;
}
