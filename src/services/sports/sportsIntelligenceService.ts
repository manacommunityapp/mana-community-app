import { apiClient } from "../common/apiClient";
import type {
  DemandForecast,
  WaitlistRecoveryItem,
  MultiBranchAnalytics,
  DynamicOfferRule,
  FederatedCommunityPass,
} from "../../types/sportsIntelligence";

const STORAGE_KEY_OFFERS = "mana_sports_dynamic_offers_v1";
const STORAGE_KEY_WAITLIST_RECOVERY = "mana_sports_waitlist_recovery_v1";
const STORAGE_KEY_FEDERATED_PASSES = "mana_sports_federated_passes_v1";

const INITIAL_OFFERS: DynamicOfferRule[] = [
  {
    id: "off-rule-1",
    facilityId: "fac-1",
    name: "Weekday Afternoon Flash Discount",
    condition: "OCCUPANCY_BELOW_40",
    timeWindowStart: "12:00",
    timeWindowEnd: "16:00",
    discountPercentage: 25,
    autoApply: true,
    isActive: true,
  },
  {
    id: "off-rule-2",
    facilityId: "fac-1",
    name: "Last-Minute 2-Hour Fill Deal",
    condition: "LAST_MINUTE_2_HOURS",
    timeWindowStart: "06:00",
    timeWindowEnd: "22:00",
    discountPercentage: 20,
    autoApply: true,
    isActive: true,
  },
];

const INITIAL_WAITLIST_RECOVERY: WaitlistRecoveryItem[] = [
  {
    id: "wl-rec-1",
    facilityId: "fac-1",
    facilityName: "SmashZone Arena - Whitefield",
    courtName: "Court 1 (Yonex Synthetic Mat)",
    sport: "BADMINTON",
    date: new Date().toISOString().split("T")[0],
    slotTime: "19:00 - 20:00",
    waitlistedUsersCount: 3,
    status: "CONVERTED",
    recoveredRevenue: 550,
    cancelledByCustomer: "Amitabh Sen (Prestige)",
    convertedToCustomer: "Nikhil Kamath (Sobha Rose)",
    notificationSentAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "wl-rec-2",
    facilityId: "fac-1",
    facilityName: "SmashZone Arena - Whitefield",
    courtName: "Court 3 (Teak Wooden Court)",
    sport: "BADMINTON",
    date: new Date().toISOString().split("T")[0],
    slotTime: "20:00 - 21:00",
    waitlistedUsersCount: 4,
    status: "NOTIFIED",
    recoveredRevenue: 0,
    cancelledByCustomer: "Gaurav Mehta",
    notificationSentAt: new Date(Date.now() - 600000).toISOString(),
  },
  {
    id: "wl-rec-3",
    facilityId: "fac-2",
    facilityName: "Apex Sports Arena - Sarjapur",
    courtName: "Pitch A (Box Cricket)",
    sport: "CRICKET",
    date: new Date().toISOString().split("T")[0],
    slotTime: "21:00 - 22:00",
    waitlistedUsersCount: 2,
    status: "ACTIVE",
    recoveredRevenue: 0,
    cancelledByCustomer: "SJR Cricket Club",
  },
];

const INITIAL_BRANCHES: MultiBranchAnalytics[] = [
  {
    branchId: "fac-1",
    branchName: "SmashZone Arena - Whitefield",
    city: "Bangalore",
    area: "Whitefield (Hope Farm)",
    courtsCount: 4,
    monthlyRevenue: 148500,
    revenueGrowthPercent: 18.4,
    utilizationPercent: 82.5,
    repeatCustomerRate: 64,
    rating: 4.8,
    totalReviews: 124,
    primarySport: "BADMINTON",
  },
  {
    branchId: "fac-2",
    branchName: "Apex Sports Arena - Sarjapur",
    city: "Bangalore",
    area: "Sarjapur Road",
    courtsCount: 3,
    monthlyRevenue: 182000,
    revenueGrowthPercent: 24.1,
    utilizationPercent: 78.0,
    repeatCustomerRate: 58,
    rating: 4.7,
    totalReviews: 89,
    primarySport: "CRICKET",
  },
  {
    branchId: "fac-3",
    branchName: "Velocity Turf & Smash Club - HSR",
    city: "Bangalore",
    area: "HSR Layout Sector 2",
    courtsCount: 5,
    monthlyRevenue: 210000,
    revenueGrowthPercent: 15.2,
    utilizationPercent: 86.4,
    repeatCustomerRate: 71,
    rating: 4.9,
    totalReviews: 210,
    primarySport: "BADMINTON",
  },
];

const INITIAL_FEDERATED_PASSES: FederatedCommunityPass[] = [
  {
    id: "pass-fed-1",
    passName: "East Bangalore Resident All-Sports Pass",
    partnerCommunities: ["Prestige Shantiniketan", "Sobha Rose", "Brigade Cosmopolis", "SJR Watermark"],
    eligibleFacilities: [
      {
        facilityId: "fac-1",
        facilityName: "SmashZone Arena - Whitefield",
        sportsIncluded: ["BADMINTON"],
      },
      {
        facilityId: "fac-2",
        facilityName: "Apex Sports Arena - Sarjapur",
        sportsIncluded: ["CRICKET", "FOOTBALL"],
      },
      {
        facilityId: "fac-3",
        facilityName: "Velocity Turf & Smash Club - HSR",
        sportsIncluded: ["BADMINTON", "TABLE_TENNIS"],
      },
    ],
    monthlyPrice: 3499,
    residentDiscountPercent: 25,
    activeSubscribersCount: 86,
    monthlySettlementPool: 300914,
    status: "ACTIVE",
  },
];

function getStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setStored<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {}
}

export const sportsIntelligenceService = {
  // ── Demand Forecasts ──
  async getDemandForecasts(facilityId: string, date?: string): Promise<DemandForecast[]> {
    const targetDate = date || new Date().toISOString().split("T")[0];
    const forecasts: DemandForecast[] = [];

    // Generate predictive demand metrics for key hours
    const hours = ["06:00", "07:00", "08:00", "09:00", "12:00", "14:00", "16:00", "18:00", "19:00", "20:00", "21:00"];

    hours.forEach((h) => {
      const hNum = parseInt(h.split(":")[0], 10);
      const isPrime = (hNum >= 6 && hNum <= 9) || (hNum >= 18 && hNum <= 21);
      const isMidday = hNum >= 12 && hNum <= 15;

      const demandLevel: "HIGH" | "MEDIUM" | "LOW" = isPrime ? "HIGH" : isMidday ? "LOW" : "MEDIUM";
      const occupancy = isPrime ? 94 : isMidday ? 32 : 68;
      const base = 500;
      const rec = isPrime ? 650 : isMidday ? 380 : 500;
      const uplift = isPrime ? 30 : isMidday ? 18 : 0;

      forecasts.push({
        date: targetDate,
        hour: h,
        courtId: "court-101",
        courtName: "Court 1 (Yonex Synthetic)",
        predictedDemand: demandLevel,
        historicalOccupancyPercent: occupancy,
        currentBasePrice: base,
        recommendedPrice: rec,
        expectedRevenueUpliftPercent: uplift,
        isPeakSuggested: isPrime,
      });
    });

    return forecasts;
  },

  // ── Waitlist Recovery ──
  async getWaitlistRecovery(facilityId?: string): Promise<WaitlistRecoveryItem[]> {
    let list = getStored<WaitlistRecoveryItem[]>(STORAGE_KEY_WAITLIST_RECOVERY, INITIAL_WAITLIST_RECOVERY);
    if (facilityId) list = list.filter((w) => w.facilityId === facilityId);
    return list;
  },

  async triggerWaitlistRecovery(recoveryId: string): Promise<WaitlistRecoveryItem> {
    const list = getStored<WaitlistRecoveryItem[]>(STORAGE_KEY_WAITLIST_RECOVERY, INITIAL_WAITLIST_RECOVERY);
    const idx = list.findIndex((w) => w.id === recoveryId);
    if (idx === -1) throw new Error("Recovery item not found");

    list[idx] = {
      ...list[idx],
      status: "CONVERTED",
      recoveredRevenue: 500,
      convertedToCustomer: "Vikrant Varma (Priority Waitlist Pass)",
      notificationSentAt: new Date().toISOString(),
    };
    setStored(STORAGE_KEY_WAITLIST_RECOVERY, list);
    return list[idx];
  },

  // ── Dynamic Offers ──
  async getDynamicOffers(facilityId?: string): Promise<DynamicOfferRule[]> {
    let list = getStored<DynamicOfferRule[]>(STORAGE_KEY_OFFERS, INITIAL_OFFERS);
    if (facilityId) list = list.filter((o) => o.facilityId === facilityId);
    return list;
  },

  async saveDynamicOffer(data: Partial<DynamicOfferRule>): Promise<DynamicOfferRule> {
    const newOffer: DynamicOfferRule = {
      id: data.id || `off-rule-${Date.now()}`,
      facilityId: data.facilityId || "fac-1",
      name: data.name || "Smart Dynamic Offer",
      condition: data.condition || "OCCUPANCY_BELOW_40",
      timeWindowStart: data.timeWindowStart || "12:00",
      timeWindowEnd: data.timeWindowEnd || "16:00",
      discountPercentage: data.discountPercentage || 20,
      autoApply: data.autoApply ?? true,
      isActive: true,
      ...data,
    };

    const list = getStored<DynamicOfferRule[]>(STORAGE_KEY_OFFERS, INITIAL_OFFERS);
    const idx = list.findIndex((o) => o.id === newOffer.id);
    if (idx >= 0) {
      list[idx] = newOffer;
    } else {
      list.push(newOffer);
    }
    setStored(STORAGE_KEY_OFFERS, list);
    return newOffer;
  },

  // ── Multi-Branch Analytics ──
  async getMultiBranchAnalytics(): Promise<MultiBranchAnalytics[]> {
    return INITIAL_BRANCHES;
  },

  // ── Federated Passes ──
  async getFederatedPasses(): Promise<FederatedCommunityPass[]> {
    return getStored<FederatedCommunityPass[]>(STORAGE_KEY_FEDERATED_PASSES, INITIAL_FEDERATED_PASSES);
  },

  async saveFederatedPass(data: Partial<FederatedCommunityPass>): Promise<FederatedCommunityPass> {
    const newPass: FederatedCommunityPass = {
      id: data.id || `pass-fed-${Date.now()}`,
      passName: data.passName || "Multi-Community Sports Pass",
      partnerCommunities: data.partnerCommunities || ["Prestige Shantiniketan", "Sobha Rose"],
      eligibleFacilities: data.eligibleFacilities || [],
      monthlyPrice: data.monthlyPrice || 2999,
      residentDiscountPercent: data.residentDiscountPercent || 20,
      activeSubscribersCount: data.activeSubscribersCount || 0,
      monthlySettlementPool: (data.activeSubscribersCount || 0) * (data.monthlyPrice || 2999),
      status: "ACTIVE",
      ...data,
    };

    const list = getStored<FederatedCommunityPass[]>(STORAGE_KEY_FEDERATED_PASSES, INITIAL_FEDERATED_PASSES);
    const idx = list.findIndex((p) => p.id === newPass.id);
    if (idx >= 0) {
      list[idx] = newPass;
    } else {
      list.push(newPass);
    }
    setStored(STORAGE_KEY_FEDERATED_PASSES, list);
    return newPass;
  },
};
