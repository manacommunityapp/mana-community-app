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

const SAMPLE_DEALS: GroupDeal[] = [
  {
    id: 'd1',
    title: 'Aashirvaad Shudh Chakki Atta 10 KG',
    category: 'Grocery',
    subCategory: 'Atta & Flour',
    description: '100% pure whole wheat flour processed with traditional chakki process. Premium bulk society procurement.',
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500',
    vendor: 'ABC Wholesale Foods',
    vendorId: 'v1',
    vendorRating: 4.8,
    vendorVerified: true,
    pricingModel: 'THRESHOLD',
    mrp: 680,
    standardPrice: 640,
    currentPrice: 585,
    currentTierPrice: 585,
    nextTierPrice: 560,
    nextTierUnitsNeeded: 18,
    committedQty: 73,
    targetQty: 100,
    currentParticipants: 41,
    targetParticipants: 60,
    moqLabel: '100 bags',
    dealStatus: 'OPEN',
    daysLeft: 3,
    dealEndsAt: '2026-10-08T18:00:00Z',
    pickupPoint: 'Clubhouse Desk',
    pickupDate: '2026-10-10',
    isTrending: true,
    isAlmostUnlocked: true,
    priceTiers: [
      { id: 't1', minQty: 1, maxQty: 24, price: 640, label: '1–24 bags', isCurrentTier: false, isNextTier: false },
      { id: 't2', minQty: 25, maxQty: 49, price: 610, label: '25–49 bags', isCurrentTier: false, isNextTier: false },
      { id: 't3', minQty: 50, maxQty: 99, price: 585, label: '50–99 bags', isCurrentTier: true, isNextTier: false },
      { id: 't4', minQty: 100, maxQty: null, price: 560, label: '100+ bags', isCurrentTier: false, isNextTier: true, unitsToUnlock: 18 },
    ],
  },
  {
    id: 'd2',
    title: 'Ratnagiri GI Alphonso Mango Box (5 KG)',
    category: 'Fresh Produce',
    subCategory: 'Fruits & Seasonal',
    description: 'Ratnagiri GI-certified Alphonso mangoes straight from the orchard. Season ending soon.',
    imageUrl: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=500',
    vendor: 'Konkan Farms Direct',
    vendorId: 'v2',
    vendorRating: 4.9,
    vendorVerified: true,
    pricingModel: 'THRESHOLD',
    mrp: 1300,
    standardPrice: 1200,
    currentPrice: 1050,
    currentTierPrice: 1050,
    nextTierPrice: 999,
    nextTierUnitsNeeded: 3,
    committedQty: 47,
    targetQty: 50,
    currentParticipants: 32,
    targetParticipants: 35,
    moqLabel: '50 boxes',
    dealStatus: 'OPEN',
    daysLeft: 1,
    dealEndsAt: '2026-10-06T23:59:00Z',
    pickupPoint: 'Tower A Lobby',
    pickupDate: '2026-10-07',
    isTrending: true,
    isAlmostUnlocked: true,
    priceTiers: [
      { id: 't1', minQty: 1, maxQty: 24, price: 1150, label: '1–24 boxes', isCurrentTier: false, isNextTier: false },
      { id: 't2', minQty: 25, maxQty: 49, price: 1050, label: '25–49 boxes', isCurrentTier: true, isNextTier: false },
      { id: 't3', minQty: 50, maxQty: null, price: 999, label: '50+ boxes', isCurrentTier: false, isNextTier: true, unitsToUnlock: 3 },
    ],
  },
  {
    id: 'd3',
    title: 'Fortune Sunlite Refined Sunflower Oil 5L',
    category: 'Grocery',
    subCategory: 'Edible Oils',
    description: 'Fortune refined sunflower oil in 5L jar. Zero cholesterol, enriched with Vitamins A & D.',
    imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500',
    vendor: 'Sri Traders',
    vendorId: 'v3',
    vendorRating: 4.7,
    vendorVerified: true,
    pricingModel: 'GUARANTEED',
    mrp: 750,
    standardPrice: 720,
    currentPrice: 649,
    currentTierPrice: 649,
    committedQty: 58,
    targetQty: 80,
    currentParticipants: 38,
    moqLabel: '80 jars',
    dealStatus: 'OPEN',
    daysLeft: 5,
    dealEndsAt: '2026-10-10T18:00:00Z',
    pickupPoint: 'Clubhouse Entrance',
    pickupDate: '2026-10-12',
    isTrending: false,
    isAlmostUnlocked: false,
    priceTiers: [
      { id: 't1', minQty: 1, maxQty: null, price: 649, label: 'Flat Community Price', isCurrentTier: true, isNextTier: false },
    ],
  },
  {
    id: 'd4',
    title: 'Diwali Special Dry Fruits Royal Hamper (1 KG)',
    category: 'Festival Buying',
    subCategory: 'Diwali Specials',
    description: 'Premium Almonds, Cashews, Pistachios & Kishmish in festive velvet gift box.',
    imageUrl: 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=500',
    vendor: 'Royal Sweets & Dryfruits',
    vendorId: 'v4',
    vendorRating: 4.9,
    vendorVerified: true,
    pricingModel: 'THRESHOLD',
    mrp: 1650,
    standardPrice: 1450,
    currentPrice: 1199,
    currentTierPrice: 1199,
    nextTierPrice: 1099,
    nextTierUnitsNeeded: 12,
    committedQty: 68,
    targetQty: 80,
    currentParticipants: 45,
    moqLabel: '80 hampers',
    dealStatus: 'OPEN',
    daysLeft: 7,
    dealEndsAt: '2026-10-12T18:00:00Z',
    pickupPoint: 'Society Multi-Purpose Hall',
    pickupDate: '2026-10-14',
    isFestivalDeal: true,
    isTrending: true,
    priceTiers: [
      { id: 't1', minQty: 1, maxQty: 39, price: 1350, label: '1–39 hampers', isCurrentTier: false, isNextTier: false },
      { id: 't2', minQty: 40, maxQty: 79, price: 1199, label: '40–79 hampers', isCurrentTier: true, isNextTier: false },
      { id: 't3', minQty: 80, maxQty: null, price: 1099, label: '80+ hampers', isCurrentTier: false, isNextTier: true, unitsToUnlock: 12 },
    ],
  },
];

const SAMPLE_BUY_AGAIN: BuyAgainItem[] = [
  { dealId: 'd1', title: 'Aashirvaad Shudh Chakki Atta 10 KG', category: 'Grocery', lastPurchasedAt: '2026-09-11', daysAgo: 24, lastPrice: 590, currentPrice: 585, isAvailable: true },
  { dealId: 'd3', title: 'Fortune Sunlite Refined Sunflower Oil 5L', category: 'Grocery', lastPurchasedAt: '2026-09-04', daysAgo: 31, lastPrice: 660, currentPrice: 649, isAvailable: true },
  { dealId: 'd4', title: 'California Jumbo Almonds (1 KG)', category: 'Dry Fruits', lastPurchasedAt: '2026-08-21', daysAgo: 45, lastPrice: 820, currentPrice: 780, isAvailable: true },
  { dealId: 'd5', title: 'Surf Excel Matic Liquid 4L Detergent', category: 'Household', lastPurchasedAt: '2026-08-05', daysAgo: 60, lastPrice: 620, currentPrice: undefined, isAvailable: false },
];

const SAMPLE_BASKETS: MonthlyBasket[] = [
  {
    id: 'mb-1',
    title: 'Mana Monthly Family Essential Basket',
    description: 'Complete household monthly staple kit direct from wholesale millers and FMCG distributors.',
    items: [
      '5 KG Sona Masoori Rice',
      '5 KG Aashirvaad Atta',
      '2 KG Toor Dal (Unpolished)',
      '2 Litre Fortune Sunflower Oil',
      '1 KG Sugar (Sulphur Free)',
      'Surf Excel Matic Liquid 2L',
      'Vim Dishwash Liquid 750ml',
    ],
    regularPrice: 2850,
    communityPrice: 2499,
    targetFamilies: 100,
    enrolledFamilies: 74,
    nextDeliveryDate: '1st of Every Month',
    savings: 351,
  },
  {
    id: 'mb-2',
    title: 'Farm Fresh Organic Veggie & Greens Basket (Weekly x 4)',
    description: '4 deliveries of weekly curated chemical-free vegetables directly harvested from verified local hydroponic farms.',
    items: [
      '3 KG Potatoes & 2 KG Onions',
      '2 KG Country Tomatoes',
      '1 KG Seasonal Gourd / Bhindi',
      '500g Paneer (Fresh Dairy)',
      '4 Bunches Organic Palak & Methi',
      '500g Green Peas & Carrots',
    ],
    regularPrice: 2100,
    communityPrice: 1750,
    targetFamilies: 50,
    enrolledFamilies: 41,
    nextDeliveryDate: 'Every Saturday Morning',
    savings: 350,
  },
];

const SAMPLE_FESTIVALS: FestivalCategory[] = [
  {
    id: 'fest-diwali',
    festivalName: 'Diwali Grand Community Procurement',
    tagline: 'Bulk sweets, dry fruit gift boxes, artisanal clay diyas and festive LED decor direct from master craftsmen.',
    bannerImage: 'https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?w=800',
    deals: [
      SAMPLE_DEALS[3],
      {
        id: 'd5',
        title: 'Handmade Terracotta Diya Box (Set of 21 Designer Diyas)',
        category: 'Festival Buying',
        subCategory: 'Decor',
        description: 'Traditional hand-painted terracotta oil lamps crafted by rural artisans.',
        imageUrl: 'https://images.unsplash.com/photo-1605647540924-852290f6b0d5?w=500',
        vendor: 'Mitti Crafts Collective',
        vendorId: 'v5',
        vendorRating: 4.8,
        vendorVerified: true,
        pricingModel: 'GUARANTEED',
        mrp: 450,
        standardPrice: 380,
        currentPrice: 299,
        currentTierPrice: 299,
        committedQty: 112,
        targetQty: 150,
        currentParticipants: 84,
        moqLabel: '150 sets',
        dealStatus: 'OPEN',
        daysLeft: 6,
        dealEndsAt: '2026-10-11T18:00:00Z',
        pickupPoint: 'Clubhouse Reception',
        isFestivalDeal: true,
        priceTiers: [
          { id: 't1', minQty: 1, maxQty: null, price: 299, label: 'Flat Community Rate', isCurrentTier: true, isNextTier: false },
        ],
      },
    ],
  },
  {
    id: 'fest-sankranti',
    festivalName: 'Makar Sankranti & Pongal Harvest Specials',
    tagline: 'Traditional Til-Gud, Chikki, Fresh Sugarcane, Puja Flowers and harvest jaggery pots.',
    bannerImage: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=800',
    deals: [],
  },
];

export const groupBuyingService = {
  async getDeals(): Promise<GroupDeal[]> {
    try {
      const res = await apiClient.get<GroupDeal[]>('/group-buying/deals');
      return res;
    } catch {
      return SAMPLE_DEALS;
    }
  },

  async getAlmostUnlockedDeals(): Promise<GroupDeal[]> {
    try {
      const res = await apiClient.get<GroupDeal[]>('/group-buying/deals/almost-unlocked');
      return res;
    } catch {
      return SAMPLE_DEALS.filter(d => d.isAlmostUnlocked);
    }
  },

  async getBuyAgainSuggestions(): Promise<BuyAgainItem[]> {
    try {
      const res = await apiClient.get<BuyAgainItem[]>('/group-buying/buy-again');
      return res;
    } catch {
      return SAMPLE_BUY_AGAIN;
    }
  },

  async getMonthlyBaskets(): Promise<MonthlyBasket[]> {
    try {
      const res = await apiClient.get<MonthlyBasket[]>('/group-buying/baskets');
      return res;
    } catch {
      return SAMPLE_BASKETS;
    }
  },

  async getFestivalCategories(): Promise<FestivalCategory[]> {
    try {
      const res = await apiClient.get<FestivalCategory[]>('/group-buying/festival');
      return res;
    } catch {
      return SAMPLE_FESTIVALS;
    }
  },

  async getMyOrders(userId?: string): Promise<GroupOrder[]> {
    try {
      const res = await apiClient.get<GroupOrder[]>('/group-buying/my-orders');
      return res;
    } catch {
      return [
        {
          id: 'GB-2026-00089',
          dealId: 'd1',
          dealTitle: 'Aashirvaad Shudh Chakki Atta 10 KG',
          quantity: 2,
          unitPrice: 585,
          totalAmount: 1170,
          savings: 190,
          status: 'CONFIRMED',
          orderedAt: '2026-10-04T12:00:00Z',
          qrCode: 'TKN-d1-1728043200-8891',
          pickupPoint: 'Clubhouse Desk',
          pickupDate: '2026-10-10',
        },
      ];
    }
  },

  async getDemandBoard(): Promise<DemandItem[]> {
    try {
      return await apiClient.get<DemandItem[]>('/group-buying/demand');
    } catch {
      return [
        {
          id: 'dem-1',
          title: 'Direct Sourced Organic A2 Cow Ghee (5 Litre Tin)',
          description: 'Desi Gir Cow Bilona Ghee made using traditional earthen pot churning. Looking for 30 families to get 25% bulk discount.',
          category: 'Dairy & Ghee',
          requestedBy: 'Pooja Hegde (B-302)',
          interestedResidents: 18,
          expectedQty: 24,
          upvotes: 18,
          targetUpvotes: 25,
          preferredPriceMin: 3200,
          preferredPriceMax: 3600,
          preferredBrand: 'Gir Organic / Two Brothers',
          status: 'GATHERING_DEMAND',
        },
      ];
    }
  },

  async getCommunitySavings(): Promise<CommunitySavings> {
    try {
      return await apiClient.get<CommunitySavings>('/group-buying/community-savings');
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

  async joinDeal(dealId: string, quantity: number, userId?: string): Promise<GroupOrder> {
    try {
      return await apiClient.post<GroupOrder>(`/group-buying/deals/${dealId}/checkout`, {
        quantity,
        userId,
      });
    } catch {
      const deal = SAMPLE_DEALS.find(d => d.id === dealId) ?? SAMPLE_DEALS[0];
      return {
        id: 'GB-2026-' + Math.floor(10000 + Math.random() * 90000),
        dealId,
        dealTitle: deal.title,
        quantity,
        unitPrice: deal.currentTierPrice,
        totalAmount: deal.currentTierPrice * quantity,
        savings: (deal.mrp - deal.currentTierPrice) * quantity,
        status: 'CONFIRMED',
        qrCode: 'TKN-' + dealId + '-' + Date.now() + '-9901',
        pickupPoint: deal.pickupPoint,
        pickupDate: deal.pickupDate,
      };
    }
  },

  async createDemand(data: Partial<DemandItem>): Promise<DemandItem> {
    try {
      return await apiClient.post<DemandItem>('/group-buying/demand', data);
    } catch {
      return {
        id: 'dem-' + Date.now(),
        title: data.title || 'New Demand',
        description: data.description || '',
        category: data.category || 'General',
        upvotes: 1,
        targetUpvotes: 25,
        status: 'GATHERING_DEMAND',
      };
    }
  },

  async upvoteDemand(id: string): Promise<void> {
    try {
      await apiClient.post(`/group-buying/demand/${id}/upvote`, {});
    } catch {
      // Mock upvote
    }
  },
};
