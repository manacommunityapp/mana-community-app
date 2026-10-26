import { apiClient } from "../common/apiClient";

export type DealStatus = "ACTIVE" | "FUNDED" | "FULFILLED" | "CANCELLED";
export type OrderStatus = "CONFIRMED" | "PROCESSING" | "READY" | "DELIVERED" | "CANCELLED";
export type DisputeStatus = "OPEN" | "UNDER_REVIEW" | "RESOLVED" | "ESCALATED";
export type FulfillmentType = "PICKUP" | "DELIVERY";
export type PaymentMethod = "UPI" | "ESCROW" | "CARD" | "WALLET";

export interface PriceTier {
  minQty: number;
  maxQty: number | null;
  pricePerUnit: number;
  label: string;
}

export interface GroupDeal {
  id: string;
  title: string;
  category: string;
  subCategory?: string;
  description: string;
  imageUrl?: string;
  imagePlaceholderColor?: string;
  currentParticipants: number;
  targetParticipants: number;
  tiers: PriceTier[];
  vendor: string;
  vendorId: string;
  vendorRating: number;
  vendorVerified?: boolean;
  endDate: string;
  dealEndsAt?: string;
  status: DealStatus;
  deliveryDate?: string;
  pickupPoints: string[];
  pickupPoint?: string;
  tags?: string[];
  isFestival?: boolean;
  festivalName?: string;
  isAlmostUnlocked?: boolean;
  isTrending?: boolean;
  savings?: number;
  mrp?: number;
  currentTierPrice?: number;
  nextTierPrice?: number;
  nextTierUnitsNeeded?: number;
  committedQty?: number;
  targetQty?: number;
  daysLeft?: number;
}

export interface GroupOrder {
  id: string;
  orderNumber?: string;
  dealId: string;
  dealTitle: string;
  title?: string;
  quantity: number;
  pricePerUnit: number;
  totalAmount: number;
  status: OrderStatus;
  orderedAt: string;
  qrCode: string;
  fulfillment: FulfillmentType;
  paymentMethod: PaymentMethod;
  pickupPoint?: string;
  deliveryAddress?: string;
  vendorName?: string;
  reviewed?: boolean;
}

export interface DemandItem {
  id: string;
  title: string;
  description: string;
  category: string;
  requestedBy: string;
  upvotes: number;
  targetUpvotes?: number;
  hasUpvoted?: boolean;
  createdAt: string;
  vendorOffers?: VendorOffer[];
  status?: "OPEN" | "MATCHED" | "CONVERTED";
  expectedQty?: number;
  preferredPriceMin?: number;
  preferredPriceMax?: number;
  preferredBrand?: string;
}

export interface VendorOffer {
  vendorId: string;
  vendorName: string;
  price: number;
  moq: number;
  rating: number;
  deliveryDays: number;
  score: number;
}

export interface VendorProfile {
  id: string;
  name: string;
  category: string;
  rating: number;
  totalOrders: number;
  onTimeRate: number;
  qualityScore: number;
  responseTime: string;
  verified: boolean;
  gstVerified: boolean;
  fssaiVerified: boolean;
  since: string;
  badges: string[];
  products: { name: string; price: number; unit: string }[];
}

export interface MonthlyBasketItem {
  name: string;
  qty: string;
  price: number;
}

export interface MonthlyBasket {
  id: string;
  name: string;
  title?: string;
  description: string;
  items: MonthlyBasketItem[] | string[];
  totalPrice: number;
  regularPrice?: number;
  communityPrice?: number;
  subscribers: number;
  frequency: "WEEKLY" | "MONTHLY";
  nextDelivery: string;
  nextDeliveryDate?: string;
  vendor: string;
  vendorRating: number;
  targetFamilies?: number;
  enrolledFamilies?: number;
  savings?: number;
}

export interface FestivalCampaign {
  id: string;
  festivalName: string;
  tagline: string;
  color: string;
  startDate: string;
  endDate: string;
  deals: GroupDeal[];
}

export interface FestivalCategory {
  id: string;
  festivalName: string;
  tagline: string;
  bannerImage: string;
  deals: GroupDeal[];
}

export interface BuyAgainItem {
  dealId: string;
  title: string;
  category: string;
  lastPurchasedAt?: string;
  lastOrderDate?: string;
  vendor?: string;
  daysAgo?: number;
  lastPrice: number;
  currentPrice?: number;
  isAvailable?: boolean;
}

export interface BuyingGroup {
  id: string;
  name: string;
  type: "TOWER" | "BLOCK" | "WING" | "FLOOR";
  members: number;
  maxMembers: number;
  admin: string;
  activeDealCount: number;
  totalSavings: number;
}

export interface CommunitySavings {
  totalSaved: number;
  totalSavedThisMonth?: number;
  ordersCompleted: number;
  totalOrders?: number;
  activeDeals: number;
  avgSavingsPercent: number;
  milestones: { label: string; target: number; current: number }[];
  towerLeaderboard: { tower: string; savings: number; orders: number }[];
  monthlyTrend: { month: string; savings: number }[];
  topCategories?: { category: string; saved: number }[];
}

export interface OrderReview {
  orderId: string;
  dealRating: number;
  vendorRating: number;
  tags: string[];
  comment: string;
  createdAt: string;
}

export interface OrderDispute {
  id: string;
  orderId: string;
  category: "QUALITY" | "QUANTITY" | "WRONG_ITEM" | "DELAYED" | "NOT_RECEIVED";
  description: string;
  status: DisputeStatus;
  resolution?: string;
  createdAt: string;
  escrowProtected: boolean;
}

export interface PickupPass {
  orderId: string;
  qrCode: string;
  dealTitle: string;
  quantity: number;
  pickupPoint: string;
  pickupDate: string;
  authorizedCollectors: { name: string; phone: string }[];
  status: "PENDING" | "COLLECTED" | "EXPIRED";
}

export interface AIDemandMatch {
  query: string;
  matches: { deal: GroupDeal; confidence: number; reason: string }[];
  suggestions: string[];
}

// ── In-Memory Live State (Defaults empty) ──
let liveDeals: GroupDeal[] = [];
let liveDemands: DemandItem[] = [];
let liveSavings: CommunitySavings = {
  totalSaved: 0,
  totalSavedThisMonth: 0,
  ordersCompleted: 0,
  totalOrders: 0,
  activeDeals: 0,
  avgSavingsPercent: 0,
  milestones: [],
  towerLeaderboard: [],
  monthlyTrend: [],
  topCategories: [],
};
let liveBuyingGroups: BuyingGroup[] = [];

const ORDERS_KEY = "mana_group_orders";
const REVIEWS_KEY = "mana_group_reviews";
const DISPUTES_KEY = "mana_group_disputes";

function loadOrders(): GroupOrder[] {
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveOrders(orders: GroupOrder[]) {
  try { localStorage.setItem(ORDERS_KEY, JSON.stringify(orders)); } catch {}
}

function loadReviews(): OrderReview[] {
  try {
    const raw = localStorage.getItem(REVIEWS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveReviews(reviews: OrderReview[]) {
  try { localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews)); } catch {}
}

function loadDisputes(): OrderDispute[] {
  try {
    const raw = localStorage.getItem(DISPUTES_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveDisputes(disputes: OrderDispute[]) {
  try { localStorage.setItem(DISPUTES_KEY, JSON.stringify(disputes)); } catch {}
}

function getCurrentTierPrice(deal: GroupDeal): number {
  if (!deal.tiers || deal.tiers.length === 0) return deal.currentTierPrice || 0;
  const count = (deal.currentParticipants || 0) + 1;
  for (const tier of deal.tiers) {
    if (tier.maxQty === null || count <= tier.maxQty) return tier.pricePerUnit;
  }
  return deal.tiers[deal.tiers.length - 1].pricePerUnit;
}

function mapBackendDeal(d: any): GroupDeal {
  const currentParticipants = d.currentParticipants ?? d.committedQty ?? 0;
  const targetParticipants = d.targetParticipants ?? d.targetQty ?? 10;
  const tiers: PriceTier[] = Array.isArray(d.priceTiers) && d.priceTiers.length > 0
    ? d.priceTiers.map((t: any) => ({
        minQty: t.minQty ?? 1,
        maxQty: t.maxQty ?? null,
        pricePerUnit: Number(t.pricePerUnit ?? t.price ?? 0),
        label: t.label ?? "Tier",
      }))
    : [{ minQty: 1, maxQty: null, pricePerUnit: Number(d.currentPrice ?? d.standardPrice ?? 0), label: "Standard" }];

  const currentPrice = Number(d.currentTierPrice ?? d.currentPrice ?? tiers[0]?.pricePerUnit ?? 0);
  const nextTier = tiers.find(t => t.minQty > currentParticipants);

  return {
    id: String(d.id),
    title: d.title || "Group Deal",
    category: d.category || "General",
    subCategory: d.subCategory,
    description: d.description || "",
    imageUrl: d.imageUrl,
    imagePlaceholderColor: d.imagePlaceholderColor || "#10b981",
    currentParticipants,
    targetParticipants,
    tiers,
    vendor: d.vendor || d.vendorName || "Community Vendor",
    vendorId: d.vendorId ? String(d.vendorId) : "v-1",
    vendorRating: Number(d.vendorRating ?? 4.5),
    vendorVerified: d.vendorVerified ?? false,
    endDate: d.dealEndsAt || d.endDate || new Date(Date.now() + 7 * 86400000).toISOString(),
    status: (d.dealStatus || d.status || "ACTIVE") as DealStatus,
    deliveryDate: d.pickupDate || d.deliveryDate,
    pickupPoints: d.pickupPoint ? [d.pickupPoint] : ["Clubhouse"],
    pickupPoint: d.pickupPoint || "Clubhouse",
    tags: d.tags || [],
    isAlmostUnlocked: d.isAlmostUnlocked ?? (nextTier ? (nextTier.minQty - currentParticipants <= 5) : false),
    isTrending: d.isTrending ?? false,
    isFestival: d.isFestivalDeal ?? d.isFestival ?? false,
    festivalName: d.festivalName,
    mrp: Number(d.mrp || Math.round(currentPrice * 1.3)),
    currentTierPrice: currentPrice,
    nextTierPrice: d.nextTierPrice ? Number(d.nextTierPrice) : nextTier?.pricePerUnit,
    nextTierUnitsNeeded: d.nextTierUnitsNeeded ?? (nextTier ? Math.max(0, nextTier.minQty - currentParticipants) : 0),
    committedQty: currentParticipants,
    targetQty: targetParticipants,
    daysLeft: d.daysLeft ?? Math.max(1, Math.round(((new Date(d.dealEndsAt || d.endDate || Date.now()).getTime()) - Date.now()) / 86400000)),
  };
}

function mapBackendDemand(d: any): DemandItem {
  return {
    id: String(d.id),
    title: d.title || "",
    description: d.description || "",
    category: d.category || "Groceries",
    requestedBy: d.requestedBy || "Resident",
    upvotes: Number(d.upvotes ?? d.interestedResidents ?? 0),
    targetUpvotes: Number(d.targetUpvotes ?? 25),
    hasUpvoted: Boolean(d.hasUpvoted),
    createdAt: d.createdAt || new Date().toISOString(),
    expectedQty: Number(d.expectedQty ?? 1),
    preferredPriceMin: d.preferredPriceMin ? Number(d.preferredPriceMin) : undefined,
    preferredPriceMax: d.preferredPriceMax ? Number(d.preferredPriceMax) : undefined,
    preferredBrand: d.preferredBrand,
    status: d.status || "OPEN",
    vendorOffers: Array.isArray(d.vendorOffers)
      ? d.vendorOffers.map((o: any) => ({
          vendorId: String(o.vendorId),
          vendorName: o.vendorName || "Vendor",
          price: Number(o.price ?? 0),
          moq: Number(o.moq ?? 1),
          rating: Number(o.rating ?? 4.5),
          deliveryDays: Number(o.deliveryDays ?? 3),
          score: Number(o.score ?? 80),
        }))
      : [],
  };
}

export const groupBuyingService = {
  getCategories(): string[] {
    return ["All", "Groceries", "Electronics", "Household", "Food & Festive", "Education", "Appliances", "Energy"];
  },

  async fetchDeals(category?: string, search?: string): Promise<GroupDeal[]> {
    try {
      const data = await apiClient.get<any[]>("/group-buying/deals");
      if (Array.isArray(data)) {
        liveDeals = data.map(mapBackendDeal);
      }
    } catch {
      // Backend returned error or unavailable
    }
    return this.getDeals(category, search);
  },

  getDeals(category?: string, search?: string): GroupDeal[] {
    let deals = liveDeals.map(d => {
      const currentPrice = getCurrentTierPrice(d);
      const nextTier = d.tiers.find(t => t.minQty > d.currentParticipants);
      return {
        ...d,
        currentTierPrice: currentPrice,
        nextTierPrice: nextTier?.pricePerUnit,
        nextTierUnitsNeeded: nextTier ? Math.max(0, nextTier.minQty - d.currentParticipants) : 0,
        committedQty: d.currentParticipants,
        targetQty: d.targetParticipants,
        daysLeft: Math.max(1, Math.round((new Date(d.endDate).getTime() - Date.now()) / 86400000)),
        isAlmostUnlocked: nextTier ? (nextTier.minQty - d.currentParticipants <= 5) : false,
        pickupPoint: d.pickupPoints[0] || "Clubhouse",
        mrp: d.mrp || Math.round(currentPrice * 1.3),
      };
    });
    if (category && category !== "All") deals = deals.filter(d => d.category === category);
    if (search) {
      const q = search.toLowerCase();
      deals = deals.filter(d => d.title.toLowerCase().includes(q) || d.description.toLowerCase().includes(q) || d.vendor.toLowerCase().includes(q));
    }
    return deals;
  },

  async fetchDealById(id: string): Promise<GroupDeal | undefined> {
    try {
      const d = await apiClient.get<any>(`/group-buying/deals/${id}`);
      if (d) {
        const mapped = mapBackendDeal(d);
        const idx = liveDeals.findIndex(x => x.id === mapped.id);
        if (idx >= 0) liveDeals[idx] = mapped;
        else liveDeals.push(mapped);
        return mapped;
      }
    } catch {}
    return this.getDealById(id);
  },

  getDealById(id: string): GroupDeal | undefined {
    return liveDeals.find(d => d.id === id);
  },

  getAlmostUnlockedDeals(): GroupDeal[] {
    return liveDeals.filter(d => {
      if (d.status !== "ACTIVE") return false;
      const nextTier = d.tiers.find(t => t.minQty > d.currentParticipants);
      if (!nextTier) return false;
      return (nextTier.minQty - d.currentParticipants) <= 5;
    });
  },

  getTrendingDeals(): GroupDeal[] {
    return [...liveDeals].sort((a, b) => b.currentParticipants - a.currentParticipants).slice(0, 4);
  },

  getEndingSoonDeals(): GroupDeal[] {
    return liveDeals.filter(d => d.status === "ACTIVE")
      .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())
      .slice(0, 4);
  },

  async joinDeal(
    dealId: string,
    quantity: number,
    userId?: string,
    fulfillment: FulfillmentType = "PICKUP",
    paymentMethod: PaymentMethod = "UPI",
    pickupPoint?: string
  ): Promise<GroupOrder> {
    const deal = liveDeals.find(d => d.id === dealId);
    const price = deal ? getCurrentTierPrice(deal) : 0;
    
    // Attempt backend join if endpoint available
    try {
      const resp = await apiClient.post<any>(`/group-buying/deals/${dealId}/join`, {
        quantity,
        fulfillmentType: fulfillment,
        paymentType: paymentMethod,
        pickupPoint: pickupPoint || deal?.pickupPoints[0] || "Clubhouse",
      });
      if (resp) {
        const order: GroupOrder = {
          id: String(resp.orderNumber || resp.id || `ord-${Date.now()}`),
          orderNumber: resp.orderNumber,
          dealId,
          dealTitle: resp.dealTitle || deal?.title || "Group Buy Order",
          quantity: resp.quantity || quantity,
          pricePerUnit: resp.pricePerUnit || price,
          totalAmount: resp.totalAmount || (price * quantity),
          status: (resp.status || "CONFIRMED") as OrderStatus,
          orderedAt: resp.createdAt || new Date().toISOString(),
          qrCode: resp.qrCode || `QR-${dealId.toUpperCase()}-${Date.now()}`,
          fulfillment,
          paymentMethod,
          pickupPoint: pickupPoint || deal?.pickupPoints[0] || "Clubhouse",
          vendorName: deal?.vendor || "Community Vendor",
        };
        const orders = loadOrders();
        saveOrders([order, ...orders]);
        return order;
      }
    } catch {}

    const order: GroupOrder = {
      id: `ord-${Date.now()}`,
      dealId,
      dealTitle: deal?.title || "Group Buy Order",
      quantity,
      pricePerUnit: price,
      totalAmount: price * quantity,
      status: "CONFIRMED",
      orderedAt: new Date().toISOString(),
      qrCode: `QR-${dealId.toUpperCase()}-${(userId || "GUEST").slice(0, 6).toUpperCase()}-${Date.now()}`,
      fulfillment,
      paymentMethod,
      pickupPoint: pickupPoint || deal?.pickupPoints[0] || "Clubhouse",
      vendorName: deal?.vendor || "Community Vendor",
    };
    const orders = loadOrders();
    saveOrders([order, ...orders]);
    return order;
  },

  async fetchMyOrders(userId?: string): Promise<GroupOrder[]> {
    try {
      const data = await apiClient.get<any[]>("/group-buying/my-orders");
      if (Array.isArray(data) && data.length > 0) {
        return data.map((o: any) => ({
          id: String(o.orderNumber || o.id),
          orderNumber: o.orderNumber,
          dealId: String(o.dealId || ""),
          dealTitle: o.dealTitle || "Group Order",
          quantity: Number(o.quantity || 1),
          pricePerUnit: Number(o.pricePerUnit || 0),
          totalAmount: Number(o.totalAmount || 0),
          status: (o.status || "CONFIRMED") as OrderStatus,
          orderedAt: o.createdAt || new Date().toISOString(),
          qrCode: o.qrCode || `QR-${o.id}`,
          fulfillment: (o.fulfillmentType || "PICKUP") as FulfillmentType,
          paymentMethod: (o.paymentType || "UPI") as PaymentMethod,
          pickupPoint: o.pickupPoint,
          vendorName: o.vendorName,
          reviewed: o.reviewed,
        }));
      }
    } catch {}
    return this.getMyOrders(userId);
  },

  getMyOrders(_userId?: string): GroupOrder[] {
    return loadOrders();
  },

  async fetchDemandBoard(): Promise<DemandItem[]> {
    try {
      const data = await apiClient.get<any[]>("/group-buying/demand");
      if (Array.isArray(data)) {
        liveDemands = data.map(mapBackendDemand);
      }
    } catch {}
    return this.getDemandBoard();
  },

  getDemandBoard(): DemandItem[] {
    return liveDemands;
  },

  getDemandById(id: string): DemandItem | undefined {
    return liveDemands.find(d => d.id === id);
  },

  async upvoteDemand(id: string): Promise<void> {
    const item = liveDemands.find(d => d.id === id);
    if (item) {
      item.upvotes += 1;
      item.hasUpvoted = true;
    }
    try {
      await apiClient.post(`/group-buying/demand/${id}/upvote`);
    } catch {}
  },

  async acceptVendorOffer(demandId: string, vendorId: string): Promise<GroupDeal | undefined> {
    const demand = liveDemands.find(d => d.id === demandId);
    const offer = demand?.vendorOffers?.find(v => v.vendorId === vendorId);
    if (!demand || !offer) return undefined;
    demand.status = "CONVERTED";
    try {
      await apiClient.post(`/group-buying/demand/${demandId}/offers/${vendorId}/accept`);
    } catch {}
    const deal: GroupDeal = {
      id: `deal-${Date.now()}`,
      title: demand.title,
      category: demand.category,
      description: demand.description,
      imagePlaceholderColor: "#10b981",
      currentParticipants: demand.upvotes,
      targetParticipants: offer.moq,
      tiers: [{ minQty: 1, maxQty: null, pricePerUnit: offer.price, label: "Group" }],
      vendor: offer.vendorName,
      vendorId: offer.vendorId,
      vendorRating: offer.rating,
      endDate: new Date(Date.now() + 14 * 86400000).toISOString(),
      status: "ACTIVE",
      deliveryDate: new Date(Date.now() + (14 + offer.deliveryDays) * 86400000).toISOString(),
      pickupPoints: ["Clubhouse", "Tower A Lobby"],
    };
    liveDeals.unshift(deal);
    return deal;
  },

  getVendorProfile(_id: string): VendorProfile | undefined {
    return undefined;
  },

  async createDemand(demand: Partial<DemandItem>): Promise<DemandItem> {
    try {
      const resp = await apiClient.post<any>("/group-buying/demand", {
        title: demand.title,
        description: demand.description,
        category: demand.category,
        expectedQty: demand.expectedQty,
        preferredPriceMin: demand.preferredPriceMin,
        preferredPriceMax: demand.preferredPriceMax,
        preferredBrand: demand.preferredBrand,
      });
      if (resp) {
        const mapped = mapBackendDemand(resp);
        liveDemands.unshift(mapped);
        return mapped;
      }
    } catch {}

    const item: DemandItem = {
      id: `d-${Date.now()}`,
      title: demand.title || "",
      description: demand.description || "",
      category: demand.category || "Groceries",
      requestedBy: demand.requestedBy || "Resident",
      upvotes: 1,
      targetUpvotes: 25,
      hasUpvoted: false,
      createdAt: new Date().toISOString(),
      expectedQty: demand.expectedQty || 1,
      preferredPriceMin: demand.preferredPriceMin,
      preferredPriceMax: demand.preferredPriceMax,
      status: "OPEN",
    };
    liveDemands.unshift(item);
    return item;
  },

  getFestivalCategories(): FestivalCategory[] {
    return [];
  },

  getFeaturedDeals(): GroupDeal[] {
    return liveDeals.slice(0, 3);
  },

  getMonthlyBaskets(): MonthlyBasket[] {
    return [];
  },

  getFestivalCampaigns(): FestivalCampaign[] {
    return [];
  },

  getBuyAgainSuggestions(): BuyAgainItem[] {
    return [];
  },

  async fetchBuyingGroups(): Promise<BuyingGroup[]> {
    try {
      const data = await apiClient.get<any[]>("/group-buying/tower-groups");
      if (Array.isArray(data)) {
        liveBuyingGroups = data.map((g: any) => ({
          id: String(g.id || g.groupCode),
          name: g.groupName || g.name || "Buying Group",
          type: g.type || "TOWER",
          members: Number(g.memberCount || g.members || 0),
          maxMembers: Number(g.maxMembers || 50),
          admin: g.adminName || g.admin || "Lead",
          activeDealCount: Number(g.activeDealCount || 0),
          totalSavings: Number(g.totalSavings || 0),
        }));
      }
    } catch {}
    return this.getBuyingGroups();
  },

  getBuyingGroups(): BuyingGroup[] {
    return liveBuyingGroups;
  },

  async fetchCommunitySavings(): Promise<CommunitySavings> {
    try {
      const s = await apiClient.get<any>("/group-buying/community-savings");
      if (s) {
        liveSavings = {
          totalSaved: Number(s.totalSavedAllTime ?? s.totalSaved ?? s.totalSavedThisMonth ?? 0),
          totalSavedThisMonth: Number(s.totalSavedThisMonth ?? 0),
          ordersCompleted: Number(s.totalOrders ?? s.ordersCompleted ?? 0),
          totalOrders: Number(s.totalOrders ?? s.ordersCompleted ?? 0),
          activeDeals: Number(s.activeDeals ?? 0),
          avgSavingsPercent: Number(s.collectiveDiscountPercent ?? s.avgSavingsPercent ?? 0),
          milestones: [],
          towerLeaderboard: Array.isArray(s.towerLeaderboard)
            ? s.towerLeaderboard.map((t: any) => ({
                tower: t.tower || "Tower",
                savings: Number(t.totalSaved ?? t.savings ?? 0),
                orders: Number(t.orders ?? 0),
              }))
            : [],
          monthlyTrend: [],
          topCategories: s.topCategory ? [{ category: s.topCategory, saved: 0 }] : [],
        };
      }
    } catch {}
    return this.getCommunitySavings();
  },

  getCommunitySavings(): CommunitySavings {
    return liveSavings;
  },

  getPickupPass(orderId: string): PickupPass | undefined {
    const order = loadOrders().find(o => o.id === orderId);
    if (!order) return undefined;
    return {
      orderId: order.id,
      qrCode: order.qrCode,
      dealTitle: order.dealTitle,
      quantity: order.quantity,
      pickupPoint: order.pickupPoint || "Clubhouse",
      pickupDate: new Date(Date.now() + 3 * 86400000).toISOString(),
      authorizedCollectors: [],
      status: order.status === "DELIVERED" ? "COLLECTED" : "PENDING",
    };
  },

  verifyPickupToken(token: string): { valid: boolean; orderDetails?: GroupOrder } {
    const orders = loadOrders();
    const order = orders.find(o => o.qrCode === token);
    return { valid: !!order, orderDetails: order };
  },

  confirmHandover(orderId: string): void {
    const orders = loadOrders();
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx >= 0) {
      orders[idx].status = "DELIVERED";
      saveOrders(orders);
    }
  },

  submitReview(review: OrderReview): void {
    const reviews = loadReviews();
    saveReviews([...reviews, review]);
    const orders = loadOrders();
    const idx = orders.findIndex(o => o.id === review.orderId);
    if (idx >= 0) {
      orders[idx].reviewed = true;
      saveOrders(orders);
    }
  },

  getReviews(): OrderReview[] {
    return loadReviews();
  },

  raiseDispute(dispute: Omit<OrderDispute, "id" | "status" | "createdAt">): OrderDispute {
    const full: OrderDispute = {
      ...dispute,
      id: `disp-${Date.now()}`,
      status: "OPEN",
      createdAt: new Date().toISOString(),
    };
    const disputes = loadDisputes();
    saveDisputes([...disputes, full]);
    return full;
  },

  getDisputes(): OrderDispute[] {
    return loadDisputes();
  },

  askCommunityAI(query: string): AIDemandMatch {
    const q = query.toLowerCase();
    const matches = liveDeals
      .filter(d => d.title.toLowerCase().includes(q) || d.category.toLowerCase().includes(q) || d.description.toLowerCase().includes(q))
      .map(d => ({ deal: d, confidence: 85, reason: `Matches "${query}" in ${d.category}` }));
    return {
      query,
      matches: matches.slice(0, 3),
      suggestions: matches.length === 0
        ? ["Post on Demand Board", "Check active categories"]
        : ["Join now for best price", "Share with neighbours"],
    };
  },
};
