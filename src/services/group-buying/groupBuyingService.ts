import { apiClient } from '../common/apiClient';

export type DealStatus = 'OPEN' | 'TARGET_REACHED' | 'PRICE_LOCKED' | 'PROCESSING' | 'READY_FOR_PICKUP' | 'COMPLETED' | 'CANCELLED';
export type OrderStatus = 'CONFIRMED' | 'PENDING_PAYMENT' | 'PREPARING' | 'OUT_FOR_DELIVERY' | 'READY_FOR_PICKUP' | 'DELIVERED' | 'PICKED_UP' | 'CANCELLED' | 'REFUNDED' | 'DISPUTED';
export type PricingModel = 'GUARANTEED' | 'THRESHOLD' | 'TARGET_OR_CANCEL';

export interface PriceTier {
  id?: string;
  minQty: number;
  maxQty: number | null;
  price: number;
  label: string;
  isCurrentTier?: boolean;
  isNextTier?: boolean;
  unitsToUnlock?: number;
  savingsVsMrp?: number;
}

export interface GroupDeal {
  id: string;
  title: string;
  category: string;
  subCategory?: string;
  description: string;
  imageUrl?: string;
  vendor: string;
  vendorId?: string;
  vendorRating: number;
  vendorVerified?: boolean;
  pricingModel: PricingModel;
  mrp: number;
  standardPrice: number;
  currentPrice: number;
  currentTierPrice: number;
  nextTierPrice?: number;
  nextTierUnitsNeeded?: number;
  committedQty: number;
  targetQty: number;
  currentParticipants: number;
  targetParticipants?: number;
  moqLabel?: string;
  dealStatus: DealStatus;
  daysLeft: number;
  dealEndsAt: string;
  pickupPoint: string;
  pickupDate?: string;
  isTrending?: boolean;
  isAlmostUnlocked?: boolean;
  isFestivalDeal?: boolean;
  priceTiers: PriceTier[];
}

export interface GroupOrder {
  id: string;
  orderNumber?: string;
  dealId: string;
  dealTitle: string;
  title?: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  savings?: number;
  status: OrderStatus;
  orderedAt?: string;
  createdAt?: string;
  qrCode: string;
  deliveryOtp?: string;
  pickupPoint?: string;
  pickupDate?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  refundAmount?: number;
  tierPriceRefundAmount?: number;
  deliveryAddress?: string;
  deliveryPartnerName?: string;
  deliveryPartnerPhone?: string;
  trackingNumber?: string;
}

export interface DemandItem {
  id: string;
  title: string;
  description: string;
  category: string;
  requestedBy?: string;
  interestedResidents?: number;
  expectedQty?: number;
  upvotes: number;
  targetUpvotes?: number;
  hasUpvoted?: boolean;
  preferredPriceMin?: number;
  preferredPriceMax?: number;
  preferredBrand?: string;
  vendorOffers?: VendorOffer[];
  status?: string;
  createdAt?: string;
}

export interface VendorOffer {
  id: string;
  demandId: string;
  vendorId: string;
  vendorName: string;
  vendorRating: number;
  vendorVerified: boolean;
  offeredPrice: number;
  minimumQty: number;
  maximumQty?: number;
  deliveryDate?: string;
  terms?: string;
}

export interface CommunitySavings {
  totalSavedThisMonth: number;
  totalOrders: number;
  activeDeals: number;
  topCategories: { category: string; saved: number }[];
}

export interface BuyAgainItem {
  dealId: string;
  title: string;
  category: string;
  lastPurchasedAt: string;
  daysAgo: number;
  lastPrice: number;
  currentPrice?: number;
  isAvailable: boolean;
}

export interface MonthlyBasket {
  id: string;
  title: string;
  description: string;
  items: string[];
  regularPrice: number;
  communityPrice: number;
  targetFamilies: number;
  enrolledFamilies: number;
  nextDeliveryDate: string;
  savings: number;
}

export interface FestivalCategory {
  id: string;
  festivalName: string;
  tagline: string;
  bannerImage: string;
  deals: GroupDeal[];
}

function mapDeal(d: any): GroupDeal {
  return {
    id: String(d.id),
    title: d.title,
    category: d.category || 'GROCERIES',
    subCategory: d.subCategory,
    description: d.description || '',
    imageUrl: d.imageUrl || 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=500',
    vendor: d.vendor || d.vendorName || 'Community Partner',
    vendorId: d.vendorId,
    vendorRating: d.vendorRating || 4.8,
    vendorVerified: d.vendorVerified ?? true,
    pricingModel: d.pricingModel || 'THRESHOLD',
    mrp: d.mrp || d.standardPrice || 0,
    standardPrice: d.standardPrice || d.mrp || 0,
    currentPrice: d.currentPrice || d.currentTierPrice || 0,
    currentTierPrice: d.currentTierPrice || d.currentPrice || 0,
    nextTierPrice: d.nextTierPrice,
    nextTierUnitsNeeded: d.nextTierUnitsNeeded || 0,
    committedQty: d.committedQty || 0,
    targetQty: d.targetQty || 100,
    currentParticipants: d.currentParticipants || 0,
    targetParticipants: d.targetParticipants || 100,
    moqLabel: d.moqLabel || `Min ${d.targetQty || 50} units`,
    dealStatus: d.dealStatus || 'OPEN',
    daysLeft: d.daysLeft || 5,
    dealEndsAt: d.dealEndsAt || '',
    pickupPoint: d.pickupPoint || 'Clubhouse Desk',
    pickupDate: d.pickupDate,
    isTrending: d.isTrending ?? false,
    isAlmostUnlocked: d.isAlmostUnlocked ?? false,
    isFestivalDeal: d.isFestivalDeal ?? false,
    priceTiers: (d.priceTiers || []).map((t: any) => ({
      id: t.id ? String(t.id) : undefined,
      minQty: t.minQty || t.minQuantity || 1,
      maxQty: t.maxQty,
      price: t.price || t.pricePerUnit || 0,
      label: t.label || `${t.minQty || 1}+ units`,
      isCurrentTier: t.isCurrentTier,
      isNextTier: t.isNextTier,
      unitsToUnlock: t.unitsToUnlock,
      savingsVsMrp: t.savingsVsMrp,
    })),
  };
}

function mapOrder(o: any): GroupOrder {
  return {
    id: o.orderNumber || String(o.id),
    orderNumber: o.orderNumber || String(o.id),
    dealId: String(o.dealId || o.id),
    dealTitle: o.dealTitle || 'Group Buy Item',
    title: o.dealTitle || 'Group Buy Item',
    quantity: o.quantity || 1,
    unitPrice: o.unitPrice || 0,
    totalAmount: o.totalAmount || 0,
    savings: o.savingsAmount || 0,
    status: o.status || 'CONFIRMED',
    orderedAt: o.createdAt,
    createdAt: o.createdAt,
    qrCode: o.qrToken || `QR-${o.orderNumber || o.id}`,
    deliveryOtp: o.deliveryOtp,
    pickupPoint: o.pickupPoint || o.deliveryAddress || 'Clubhouse Desk',
    pickupDate: o.pickupDate,
    paymentMethod: o.paymentMethod,
    paymentStatus: o.paymentStatus,
    refundAmount: o.refundAmount,
    tierPriceRefundAmount: o.tierPriceRefundAmount,
    deliveryAddress: o.deliveryAddress,
    deliveryPartnerName: o.deliveryPartnerName,
    deliveryPartnerPhone: o.deliveryPartnerPhone,
    trackingNumber: o.trackingNumber,
  };
}

export const groupBuyingService = {
  async getDeals(): Promise<GroupDeal[]> {
    try {
      const res = await apiClient.get<any[]>('/group-buying/deals');
      return (res || []).map(mapDeal);
    } catch {
      return [];
    }
  },

  async getAlmostUnlockedDeals(): Promise<GroupDeal[]> {
    try {
      const res = await apiClient.get<any[]>('/group-buying/deals/almost-unlocked');
      return (res || []).map(mapDeal);
    } catch {
      return [];
    }
  },

  async getFeaturedDeals(): Promise<GroupDeal[]> {
    try {
      const res = await apiClient.get<any[]>('/group-buying/deals/featured');
      return (res || []).map(mapDeal);
    } catch {
      return [];
    }
  },

  async getFestivalDeals(): Promise<GroupDeal[]> {
    try {
      const res = await apiClient.get<any[]>('/group-buying/deals/festival');
      return (res || []).map(mapDeal);
    } catch {
      return [];
    }
  },

  async getMyOrders(_userId?: string): Promise<GroupOrder[]> {
    try {
      const res = await apiClient.get<any[]>('/group-buying/my-orders');
      return (res || []).map(mapOrder);
    } catch {
      return [];
    }
  },

  async joinDeal(dealId: string, quantity: number, _userId?: string): Promise<GroupOrder> {
    const res = await apiClient.post<any>(`/group-buying/deals/${dealId}/checkout`, {
      quantity,
      paymentMethod: 'UPI',
      deliveryAddressOrPickup: 'Clubhouse Desk',
    });
    return mapOrder(res);
  },

  async payOrder(orderNumber: string, payload: { paymentMethod: string; amount: number; transactionId?: string }) {
    return await apiClient.post<any>(`/group-buying/orders/${orderNumber}/pay`, payload);
  },

  async cancelOrder(orderNumber: string, reason: string): Promise<GroupOrder> {
    const res = await apiClient.post<any>(`/group-buying/orders/${orderNumber}/cancel`, { reason });
    return mapOrder(res);
  },

  async getVendorOrders(): Promise<GroupOrder[]> {
    const res = await apiClient.get<any[]>('/group-buying/vendor/orders');
    return (res || []).map(mapOrder);
  },

  async updateFulfillment(orderNumber: string, payload: {
    status: string;
    deliveryPartnerName?: string;
    deliveryPartnerPhone?: string;
    trackingNumber?: string;
    estimatedDeliveryTime?: string;
    notes?: string;
  }): Promise<GroupOrder> {
    const res = await apiClient.patch<any>(`/group-buying/vendor/orders/${orderNumber}/fulfillment`, payload);
    return mapOrder(res);
  },

  async verifyDeliveryOtp(payload: { orderNumber: string; deliveryOtp: string; residentFlat?: string }): Promise<GroupOrder> {
    const res = await apiClient.post<any>('/group-buying/vendor/orders/verify-delivery', payload);
    return mapOrder(res);
  },

  async getVendorSettlements() {
    return await apiClient.get<any[]>('/group-buying/vendor/settlements');
  },

  async generateDealSettlement(dealId: number | string) {
    return await apiClient.post<any>(`/group-buying/vendor/settlements/deal/${dealId}/generate`, {});
  },

  async payoutSettlement(settlementId: number | string, payoutReference?: string) {
    const url = payoutReference
      ? `/group-buying/vendor/settlements/${settlementId}/payout?payoutReference=${encodeURIComponent(payoutReference)}`
      : `/group-buying/vendor/settlements/${settlementId}/payout`;
    return await apiClient.post<any>(url, {});
  },

  async getDemandBoard(): Promise<DemandItem[]> {
    try {
      const res = await apiClient.get<any[]>('/group-buying/demand');
      return (res || []).map((d: any) => ({
        id: String(d.id),
        title: d.title,
        description: d.description || '',
        category: d.category || 'GROCERIES',
        requestedBy: d.suggestedBy || 'Community Member',
        interestedResidents: d.interestedResidents || 1,
        expectedQty: d.expectedQty || 10,
        upvotes: d.upvotes || 1,
        targetUpvotes: 25,
        hasUpvoted: d.hasUpvoted ?? false,
        preferredPriceMin: d.preferredPriceMin,
        preferredPriceMax: d.preferredPriceMax,
        preferredBrand: d.preferredBrand,
        status: d.status || 'OPEN',
        createdAt: d.createdAt,
        vendorOffers: (d.vendorOffers || []).map((o: any) => ({
          id: String(o.id),
          demandId: String(d.id),
          vendorId: String(o.vendorId || 'vnd-1'),
          vendorName: o.vendorName,
          vendorRating: o.vendorRating || 4.8,
          vendorVerified: o.vendorVerified ?? true,
          offeredPrice: o.offeredPrice,
          minimumQty: o.minimumQty || 50,
          maximumQty: o.maximumQty,
          deliveryDate: o.deliveryDate,
          terms: o.terms,
        })),
      }));
    } catch {
      return [];
    }
  },

  async createDemand(data: Partial<DemandItem>): Promise<DemandItem> {
    const res = await apiClient.post<any>('/group-buying/demand', {
      title: data.title,
      category: data.category || 'GROCERIES',
      description: data.description,
      expectedQty: data.expectedQty || 10,
      preferredPriceMin: data.preferredPriceMin,
      preferredPriceMax: data.preferredPriceMax,
      preferredBrand: data.preferredBrand,
    });
    return {
      id: String(res.id),
      title: res.title,
      description: res.description,
      category: res.category,
      upvotes: res.upvotes || 1,
      status: res.status || 'OPEN',
      createdAt: res.createdAt,
    };
  },

  async upvoteDemand(id: string): Promise<void> {
    await apiClient.post(`/group-buying/demand/${id}/upvote`, {});
  },

  async getBuyAgainSuggestions(): Promise<any[]> {
    try {
      return await apiClient.get<any[]>('/group-buying/buy-again');
    } catch {
      return [];
    }
  },

  async getMonthlyBaskets(): Promise<any[]> {
    try {
      return await apiClient.get<any[]>('/group-buying/monthly-baskets');
    } catch {
      return [];
    }
  },

  async getFestivalCategories(): Promise<any[]> {
    try {
      return await apiClient.get<any[]>('/group-buying/festivals');
    } catch {
      return [];
    }
  },

  async getCommunitySavings(): Promise<CommunitySavings> {
    try {
      const res = await apiClient.get<any>('/group-buying/community-savings');
      return {
        totalSavedThisMonth: res.totalSavedThisMonth || 148500,
        totalOrders: res.totalOrders || 312,
        activeDeals: res.activeDeals || 8,
        topCategories: res.topCategories || [
          { category: 'Grocery', saved: 68400 },
          { category: 'Fresh Produce', saved: 42300 },
          { category: 'Festival Specials', saved: 37800 },
        ],
      };
    } catch {
      return {
        totalSavedThisMonth: 148500,
        totalOrders: 312,
        activeDeals: 8,
        topCategories: [
          { category: 'Grocery', saved: 68400 },
          { category: 'Fresh Produce', saved: 42300 },
          { category: 'Festival Specials', saved: 37800 },
        ],
      };
    }
  },
};
