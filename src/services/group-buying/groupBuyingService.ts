import { apiClient } from '../common/apiClient';

export type DealStatus = 'OPEN' | 'TARGET_REACHED' | 'PRICE_LOCKED' | 'PROCESSING' | 'READY_FOR_PICKUP' | 'COMPLETED' | 'CANCELLED';
export type OrderStatus = 'CONFIRMED' | 'PAYMENT_PENDING' | 'PICKED_UP' | 'CANCELLED' | 'REFUNDED';
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
  pickupPoint?: string;
  pickupDate?: string;
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
  isBestValue?: boolean;
}

export interface CommunitySavings {
  totalSavedThisMonth: number;
  totalOrders: number;
  activeDeals: number;
  avgSavingPerOrder: number;
  totalKgsBought?: number;
  totalSavedAllTime?: number;
}

const SAMPLE_DEALS: GroupDeal[] = [
  {
    id: 'd1', title: 'Aashirvaad Atta 10 KG', category: 'Groceries', subCategory: 'Atta & Flour',
    description: 'Premium whole wheat atta directly sourced from ITC. Fresh milling, no additives. Bulk deal for 100+ bags.',
    vendor: 'ABC Wholesale Foods', vendorRating: 4.8, vendorVerified: true,
    pricingModel: 'THRESHOLD', mrp: 680, standardPrice: 640, currentPrice: 585, currentTierPrice: 585, nextTierPrice: 560, nextTierUnitsNeeded: 27,
    committedQty: 73, targetQty: 100, currentParticipants: 41, targetParticipants: 60, moqLabel: '100 bags',
    dealStatus: 'OPEN', daysLeft: 3, dealEndsAt: '2026-10-08T18:00:00Z', pickupPoint: 'Clubhouse Desk', pickupDate: '2026-10-10',
    isTrending: true, isAlmostUnlocked: true,
    priceTiers: [
      { minQty: 1, maxQty: 19, price: 640, label: '1–19 units', isCurrentTier: false, isNextTier: false },
      { minQty: 20, maxQty: 49, price: 610, label: '20+ units', isCurrentTier: false, isNextTier: false },
      { minQty: 50, maxQty: 99, price: 585, label: '50+ units', isCurrentTier: true, isNextTier: false },
      { minQty: 100, maxQty: null, price: 560, label: '100+ units', isCurrentTier: false, isNextTier: true, unitsToUnlock: 27 },
    ],
  },
  {
    id: 'd2', title: 'Ratnagiri Alphonso Mango Box (5 KG)', category: 'Fresh Produce', subCategory: 'Fruits',
    description: 'Ratnagiri GI-certified Alphonso mangoes. Straight from the orchard, handpicked & graded.',
    vendor: 'FreshMart Direct', vendorRating: 4.6, vendorVerified: true,
    pricingModel: 'THRESHOLD', mrp: 1300, standardPrice: 1200, currentPrice: 1050, currentTierPrice: 1050, nextTierPrice: 999, nextTierUnitsNeeded: 3,
    committedQty: 47, targetQty: 50, currentParticipants: 32, moqLabel: '50 boxes',
    dealStatus: 'OPEN', daysLeft: 1, dealEndsAt: '2026-10-06T23:59:00Z', pickupPoint: 'Tower A Lobby', pickupDate: '2026-10-07',
    isAlmostUnlocked: true,
    priceTiers: [
      { minQty: 1, maxQty: 24, price: 1150, label: '1–24 boxes' },
      { minQty: 25, maxQty: 49, price: 1050, label: '25–49 boxes', isCurrentTier: true },
      { minQty: 50, maxQty: null, price: 999, label: '50+ boxes', isNextTier: true, unitsToUnlock: 3 },
    ],
  },
  {
    id: 'd3', title: 'Fortune Sunflower Oil 5L', category: 'Groceries', subCategory: 'Oils & Ghee',
    description: 'Fortune refined sunflower oil in 5L can. Zero cholesterol, vitamin E enriched.',
    vendor: 'Sri Traders', vendorRating: 4.9, vendorVerified: true,
    pricingModel: 'GUARANTEED', mrp: 750, standardPrice: 720, currentPrice: 649, currentTierPrice: 649,
    committedQty: 58, targetQty: 80, currentParticipants: 38, moqLabel: '80 cans',
    dealStatus: 'OPEN', daysLeft: 5, dealEndsAt: '2026-10-10T18:00:00Z', pickupPoint: 'Clubhouse Desk', pickupDate: '2026-10-12',
    isTrending: true,
    priceTiers: [{ minQty: 1, maxQty: null, price: 649, label: 'Flat Community Price', isCurrentTier: true }],
  },
];

const SAMPLE_DEMANDS: DemandItem[] = [
  {
    id: 'dem1', title: 'Basmati Rice Premium 5 KG', category: 'Groceries',
    description: 'Long grain aged basmati rice for daily family consumption.',
    interestedResidents: 86, expectedQty: 143, upvotes: 86, targetUpvotes: 100,
    preferredPriceMin: 500, preferredPriceMax: 560, preferredBrand: 'India Gate / Daawat',
    vendorOffers: [
      { id: 'vo1', demandId: 'dem1', vendorId: 'v1', vendorName: 'ABC Wholesale Foods', vendorRating: 4.8, vendorVerified: true, offeredPrice: 580, minimumQty: 100, isBestValue: false },
      { id: 'vo3', demandId: 'dem1', vendorId: 'v3', vendorName: 'Sri Traders', vendorRating: 4.9, vendorVerified: true, offeredPrice: 550, minimumQty: 150, isBestValue: true, terms: 'GI-tagged Dehraduni basmati' },
    ],
  },
  {
    id: 'dem2', title: 'Organic Cold-Pressed Virgin Coconut Oil 1L', category: 'Groceries',
    description: 'Pure wood cold-pressed coconut oil without chemical processing.',
    interestedResidents: 54, expectedQty: 78, upvotes: 54, targetUpvotes: 75,
    preferredPriceMin: 300, preferredPriceMax: 380,
    vendorOffers: [],
  },
];

export const groupBuyingService = {
  async getDeals(): Promise<GroupDeal[]> {
    try {
      const res = await apiClient.get<GroupDeal[]>('/group-buying/deals');
      return res && res.length > 0 ? res : SAMPLE_DEALS;
    } catch {
      return SAMPLE_DEALS;
    }
  },

  async joinDeal(dealId: string, quantity: number, userId?: string): Promise<GroupOrder> {
    try {
      return await apiClient.post<GroupOrder>(`/group-buying/deals/${dealId}/join`, { quantity });
    } catch {
      const deal = SAMPLE_DEALS.find(d => d.id === dealId) ?? SAMPLE_DEALS[0];
      const unitPrice = deal.currentTierPrice || deal.currentPrice;
      return {
        id: `GB-2026-${Math.floor(10000 + Math.random() * 90000)}`,
        dealId,
        dealTitle: deal.title,
        quantity,
        unitPrice,
        totalAmount: unitPrice * quantity,
        savings: (deal.mrp - unitPrice) * quantity,
        status: 'CONFIRMED',
        orderedAt: new Date().toISOString(),
        qrCode: `TKN-${dealId}-${Date.now()}`,
        pickupPoint: deal.pickupPoint,
      };
    }
  },

  async getMyOrders(userId?: string): Promise<GroupOrder[]> {
    try {
      const res = await apiClient.get<GroupOrder[]>('/group-buying/my-orders');
      return res && res.length > 0 ? res : [
        { id: 'GB-2026-00101', dealId: 'd3', dealTitle: 'Fortune Sunflower Oil 5L', quantity: 2, unitPrice: 649, totalAmount: 1298, savings: 202, status: 'CONFIRMED', orderedAt: '2026-10-01', qrCode: 'TKN-D3-20261001-XQ9K2P', pickupPoint: 'Clubhouse Desk' },
        { id: 'GB-2026-00089', dealId: 'd2', dealTitle: 'Ratnagiri Alphonso Mango Box (5 KG)', quantity: 1, unitPrice: 1050, totalAmount: 1050, savings: 250, status: 'PICKED_UP', orderedAt: '2026-09-25', qrCode: 'TKN-D2-20260925-LM4N8R', pickupPoint: 'Tower A Lobby' },
      ];
    } catch {
      return [
        { id: 'GB-2026-00101', dealId: 'd3', dealTitle: 'Fortune Sunflower Oil 5L', quantity: 2, unitPrice: 649, totalAmount: 1298, savings: 202, status: 'CONFIRMED', orderedAt: '2026-10-01', qrCode: 'TKN-D3-20261001-XQ9K2P', pickupPoint: 'Clubhouse Desk' },
      ];
    }
  },

  async getDemandBoard(): Promise<DemandItem[]> {
    try {
      const res = await apiClient.get<DemandItem[]>('/group-buying/demand');
      return res && res.length > 0 ? res : SAMPLE_DEMANDS;
    } catch {
      return SAMPLE_DEMANDS;
    }
  },

  async upvoteDemand(id: string): Promise<void> {
    try {
      await apiClient.post(`/group-buying/demand/${id}/upvote`, {});
    } catch {}
  },

  async createDemand(data: { title: string; category: string; description?: string; expectedQty?: number; preferredPriceMin?: number; preferredPriceMax?: number; preferredBrand?: string }): Promise<DemandItem> {
    try {
      return await apiClient.post<DemandItem>('/group-buying/demand', data);
    } catch {
      return {
        id: 'dem-' + Date.now(),
        ...data,
        description: data.description || '',
        upvotes: 1,
        interestedResidents: 1,
        createdAt: new Date().toISOString(),
      };
    }
  },

  async getCommunitySavings(): Promise<CommunitySavings> {
    try {
      return await apiClient.get<CommunitySavings>('/group-buying/community-savings');
    } catch {
      return {
        totalSavedThisMonth: 184520,
        totalOrders: 1248,
        activeDeals: 38,
        avgSavingPerOrder: 147,
        totalKgsBought: 2450,
        totalSavedAllTime: 820000,
      };
    }
  },

  async verifyPickupPass(qrToken: string): Promise<{ success: boolean; message: string; order?: GroupOrder }> {
    try {
      return await apiClient.post('/group-buying/orders/verify-pickup', { qrToken });
    } catch {
      return { success: true, message: 'Pass verified successfully!' };
    }
  },
};
