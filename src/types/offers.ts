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
  totalCommissionsEarned?: number;
  totalSettledPayouts?: number;
  totalPendingPayouts?: number;
  categoryDistribution: Record<string, number>;
  dealTypeDistribution: Record<string, number>;
}

export type CouponDiscountType = 'PERCENTAGE' | 'FLAT_AMOUNT' | 'FREE_SERVICE';
export type CouponStatus = 'ACTIVE' | 'EXPIRED' | 'EXHAUSTED' | 'DISABLED';
export type SettlementStatus = 'PENDING' | 'PROCESSING' | 'SETTLED' | 'FAILED' | 'CANCELLED';
export type CommissionStatus = 'PENDING_SETTLEMENT' | 'SETTLED' | 'CANCELLED';

export interface CommunityCoupon {
  id: string;
  code: string;
  title: string;
  description?: string;
  businessId?: string;
  businessName?: string;
  communityId?: string;
  discountType: CouponDiscountType;
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  validFrom?: string;
  validUntil?: string;
  usageLimitTotal?: number;
  usageLimitPerUser?: number;
  totalUsedCount?: number;
  status: CouponStatus;
  active: boolean;
  createdAt?: string;
}

export interface CouponValidationResult {
  valid: boolean;
  couponId?: string;
  code: string;
  message: string;
  discountType?: CouponDiscountType;
  discountValue?: number;
  originalAmount: number;
  calculatedDiscount: number;
  finalPayableAmount: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
}

export interface QrVerificationResult {
  valid: boolean;
  claimId?: string;
  redemptionCode?: string;
  counterPin?: string;
  status?: ClaimStatus;
  offerId?: string;
  offerTitle?: string;
  businessId?: string;
  businessName?: string;
  residentUserId?: string;
  residentName?: string;
  unitNumber?: string;
  dealType?: DealType;
  regularPrice?: number;
  communityPrice?: number;
  savingsSummary?: string;
  validUntil?: string;
  alreadyRedeemed: boolean;
  isExpired: boolean;
  message: string;
}

export interface CommissionRecord {
  id: string;
  businessId: string;
  businessName: string;
  offerId: string;
  offerTitle: string;
  claimId: string;
  redemptionCode: string;
  residentUserId: string;
  billAmount: number;
  discountAmount: number;
  commissionRatePct: number;
  commissionAmount: number;
  netMerchantAmount: number;
  status: CommissionStatus;
  settlementBatchId?: string;
  createdAt: string;
}

export interface SettlementBatch {
  id: string;
  settlementNumber: string;
  businessId: string;
  businessName: string;
  periodStart: string;
  periodEnd: string;
  totalRedemptions: number;
  grossSalesAmount: number;
  totalCommissionAmount: number;
  netPayoutAmount: number;
  bankAccountNumber?: string;
  bankIfscCode?: string;
  bankAccountHolder?: string;
  status: SettlementStatus;
  payoutReference?: string;
  settledAt?: string;
  settledByUserId?: string;
  notes?: string;
  createdAt?: string;
}

export interface CampaignAnalytics {
  offerId: string;
  offerTitle: string;
  businessId: string;
  businessName: string;
  categoryName?: string;
  viewCount: number;
  claimedCount: number;
  redeemedCount: number;
  availableClaims: number;
  claimRatePct: number;
  redemptionRatePct: number;
  totalGmvDiscounted: number;
  totalSalesGmv: number;
  platformCommissionEarned: number;
  validFrom?: string;
  validUntil?: string;
  active: boolean;
}

