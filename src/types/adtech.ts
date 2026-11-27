// Resident targeting segment
export interface ResidentSegment {
  userId: string;
  societyId: string;
  city: 'Hyderabad' | 'Bengaluru' | string;
  flatType: '1BHK' | '2BHK' | '3BHK' | '4BHK' | 'Villa' | string;
  tier: 'standard' | 'premium' | 'ultra-premium';
  segments: string[];
}

// Campaign targeting rules
export interface CampaignTargeting {
  cities?: string[];
  flatTypes?: string[];
  segments?: string[];
  societyIds?: string[];
}

// Ad creative
export type AdCreativeType = 'BANNER' | 'INTERSTITIAL' | 'VIDEO' | 'NATIVE';

export interface AdCreative {
  creativeId: string;
  campaignId: string;
  type: AdCreativeType;
  assetUrl: string;
  ctaUrl: string;
  ctaText?: string;
  weight: number;
  widthPx?: number;
  heightPx?: number;
  brandName?: string;
  brandLogoUrl?: string;
  headline?: string;
  bodyText?: string;
}

// Campaign
export type CampaignStatus = 'ACTIVE' | 'PAUSED' | 'EXHAUSTED' | 'COMPLETED' | 'DRAFT';

export interface AdCampaign {
  campaignId: string;
  brandId: string;
  brandName: string;
  name: string;
  totalBudgetPaise: number;       // budget in paise (₹10L = 1000000000)
  spentPaise: number;
  cpmPaise: number;               // cost per 1000 impressions in paise
  startAt: string;                // ISO
  endAt: string;
  status: CampaignStatus;
  dailyCapPaise?: number;
  freqCapPerDay: number;          // e.g. 3
  targeting: CampaignTargeting;
  creatives: AdCreative[];
}

// Ad request / response
export interface AdRequest {
  userId: string;
  societyId: string;
  city: string;
  flatType: string;
  placementId: string;            // e.g. 'home_banner', 'discover_top'
  appContext?: Record<string, unknown>;
}

export interface AdResponse {
  impressionId: string;           // UUID v4 — stable for this render
  campaignId: string;
  creative: AdCreative;
  impressionTrackUrl: string;
  clickTrackUrl: string;
  freqCapRemaining: number;       // how many impressions left today
  budgetPacingDelayMs?: number;   // if pacer throttled, suggested delay
}

export type ImpressionStatus = 'PENDING' | 'FIRED' | 'DEDUPLICATED' | 'ERROR';

export interface ImpressionEvent {
  impressionId: string;
  campaignId: string;
  userId: string;
  societyId: string;
  placementId: string;
  firedAt: string;
  status: ImpressionStatus;
}

// Budget pacing state (client-side mirror)
export interface BudgetPacingState {
  campaignId: string;
  totalBudgetPaise: number;
  spentPaise: number;
  remainingPaise: number;
  utilizationPct: number;
  isHalted: boolean;
  lastUpdatedAt: string;
}

// Frequency cap state (client-side cache)
export interface FreqCapState {
  campaignId: string;
  userId: string;
  date: string;                   // YYYYMMDD
  impressionCount: number;
  capLimit: number;
  isCapHit: boolean;
}
