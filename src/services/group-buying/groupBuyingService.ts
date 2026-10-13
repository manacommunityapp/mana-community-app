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
  products: { name: string; price: number; unit: string }[];
  badges: string[];
}

export interface MonthlyBasket {
  id: string;
  name: string;
  title?: string;
  description: string;
  items: { name: string; qty: string; price: number }[];
  totalPrice: number;
  regularPrice?: number;
  communityPrice?: number;
  subscribers: number;
  targetFamilies?: number;
  enrolledFamilies?: number;
  frequency: "WEEKLY" | "MONTHLY";
  nextDelivery: string;
  nextDeliveryDate?: string;
  vendor: string;
  vendorRating: number;
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
  bannerImage?: string;
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

const SAMPLE_DEALS: GroupDeal[] = [
  {
    id: "deal-001", title: "Fresh Organic Produce Box", category: "Groceries",
    description: "Weekly farm-to-door organic vegetables and fruits sourced directly from certified organic farms in Pune.",
    imagePlaceholderColor: "#4ade80", currentParticipants: 34, targetParticipants: 50,
    tiers: [
      { minQty: 1, maxQty: 19, pricePerUnit: 850, label: "Standard" },
      { minQty: 20, maxQty: 39, pricePerUnit: 750, label: "Group" },
      { minQty: 40, maxQty: null, pricePerUnit: 650, label: "Bulk" },
    ],
    vendor: "Green Earth Farms", vendorId: "v-001", vendorRating: 4.7,
    endDate: new Date(Date.now() + 3 * 86400000).toISOString(), status: "ACTIVE",
    deliveryDate: new Date(Date.now() + 7 * 86400000).toISOString(),
    pickupPoints: ["Tower A Lobby", "Tower B Lobby", "Clubhouse"],
    tags: ["Organic", "Weekly"], mrp: 1100, savings: 29,
  },
  {
    id: "deal-002", title: "Premium Air Purifier - Dyson V3", category: "Electronics",
    description: "Hospital-grade HEPA air purifier with WiFi control. CADR 500 m³/hr, covers up to 800 sq ft.",
    imagePlaceholderColor: "#60a5fa", currentParticipants: 18, targetParticipants: 25,
    tiers: [
      { minQty: 1, maxQty: 9, pricePerUnit: 28000, label: "Standard" },
      { minQty: 10, maxQty: 19, pricePerUnit: 24000, label: "Group" },
      { minQty: 20, maxQty: null, pricePerUnit: 21000, label: "Bulk" },
    ],
    vendor: "TechMart Electronics", vendorId: "v-002", vendorRating: 4.4,
    endDate: new Date(Date.now() + 5 * 86400000).toISOString(), status: "ACTIVE",
    deliveryDate: new Date(Date.now() + 12 * 86400000).toISOString(),
    pickupPoints: ["Security Gate", "Clubhouse"],
    tags: ["Premium", "Electronics"], mrp: 35000, savings: 40,
  },
  {
    id: "deal-003", title: "Household Cleaning Bundle", category: "Household",
    description: "3-month supply of eco-friendly cleaning products: floor cleaner, dishwash, laundry pods & surface spray.",
    imagePlaceholderColor: "#f472b6", currentParticipants: 67, targetParticipants: 60,
    tiers: [
      { minQty: 1, maxQty: 29, pricePerUnit: 599, label: "Standard" },
      { minQty: 30, maxQty: 59, pricePerUnit: 499, label: "Group" },
      { minQty: 60, maxQty: null, pricePerUnit: 399, label: "Bulk" },
    ],
    vendor: "CleanCo Supplies", vendorId: "v-003", vendorRating: 4.6,
    endDate: new Date(Date.now() + 1 * 86400000).toISOString(), status: "FUNDED",
    deliveryDate: new Date(Date.now() + 5 * 86400000).toISOString(),
    pickupPoints: ["Tower A Lobby", "Tower B Lobby"],
    tags: ["Eco-Friendly", "Bulk"], mrp: 899, savings: 56,
  },
  {
    id: "deal-004", title: "Festive Sweets Hamper - Diwali", category: "Food & Festive",
    description: "Curated Diwali hamper with 16 varieties of premium dry fruits, mithai, and chocolate assortments.",
    imagePlaceholderColor: "#fb923c", currentParticipants: 45, targetParticipants: 40,
    tiers: [
      { minQty: 1, maxQty: 19, pricePerUnit: 1499, label: "Standard" },
      { minQty: 20, maxQty: 39, pricePerUnit: 1299, label: "Group" },
      { minQty: 40, maxQty: null, pricePerUnit: 1099, label: "Bulk" },
    ],
    vendor: "Mithai Palace", vendorId: "v-004", vendorRating: 4.8,
    endDate: new Date(Date.now() + 10 * 86400000).toISOString(), status: "FUNDED",
    deliveryDate: new Date(Date.now() + 14 * 86400000).toISOString(),
    pickupPoints: ["Clubhouse", "Tower A Lobby"],
    tags: ["Festive", "Gift"], isFestival: true, festivalName: "Diwali", mrp: 2200, savings: 50,
  },
  {
    id: "deal-005", title: "Basmati Rice 25kg - Premium", category: "Groceries",
    description: "Aged 2-year premium Basmati rice from Dehradun. Perfect for biryani and pulao.",
    imagePlaceholderColor: "#fbbf24", currentParticipants: 28, targetParticipants: 30,
    tiers: [
      { minQty: 1, maxQty: 14, pricePerUnit: 2200, label: "Standard" },
      { minQty: 15, maxQty: 29, pricePerUnit: 1900, label: "Group" },
      { minQty: 30, maxQty: null, pricePerUnit: 1700, label: "Bulk" },
    ],
    vendor: "Kisan Direct", vendorId: "v-005", vendorRating: 4.5,
    endDate: new Date(Date.now() + 2 * 86400000).toISOString(), status: "ACTIVE",
    deliveryDate: new Date(Date.now() + 6 * 86400000).toISOString(),
    pickupPoints: ["Gate 2 Lobby", "Clubhouse"],
    tags: ["Staples", "Bulk"], mrp: 3000, savings: 43,
  },
  {
    id: "deal-006", title: "Diwali Crackers Family Pack", category: "Food & Festive",
    description: "Safe & eco-friendly cracker assortment: sparklers, flower pots, chakris, anars. PESO certified.",
    imagePlaceholderColor: "#ef4444", currentParticipants: 52, targetParticipants: 50,
    tiers: [
      { minQty: 1, maxQty: 24, pricePerUnit: 1800, label: "Standard" },
      { minQty: 25, maxQty: 49, pricePerUnit: 1500, label: "Group" },
      { minQty: 50, maxQty: null, pricePerUnit: 1200, label: "Bulk" },
    ],
    vendor: "Festival Mart", vendorId: "v-006", vendorRating: 4.3,
    endDate: new Date(Date.now() + 8 * 86400000).toISOString(), status: "FUNDED",
    deliveryDate: new Date(Date.now() + 11 * 86400000).toISOString(),
    pickupPoints: ["Gate 1 Parking"],
    tags: ["Festive", "Eco-Friendly"], isFestival: true, festivalName: "Diwali", mrp: 2800, savings: 57,
  },
  {
    id: "deal-007", title: "Kids School Supplies Kit", category: "Education",
    description: "Complete school kit: notebooks, geometry set, pens, pencils, art supplies for the new term.",
    imagePlaceholderColor: "#8b5cf6", currentParticipants: 12, targetParticipants: 40,
    tiers: [
      { minQty: 1, maxQty: 19, pricePerUnit: 750, label: "Standard" },
      { minQty: 20, maxQty: 39, pricePerUnit: 600, label: "Group" },
      { minQty: 40, maxQty: null, pricePerUnit: 480, label: "Bulk" },
    ],
    vendor: "StudyMate India", vendorId: "v-007", vendorRating: 4.2,
    endDate: new Date(Date.now() + 15 * 86400000).toISOString(), status: "ACTIVE",
    deliveryDate: new Date(Date.now() + 20 * 86400000).toISOString(),
    pickupPoints: ["Tower A Lobby", "Clubhouse"],
    tags: ["Education", "Kids"], mrp: 1100, savings: 56,
  },
];

const DEMAND_ITEMS: DemandItem[] = [
  { id: "d-1", title: "Organic A2 Milk - Monthly Subscription", description: "Need vendor for daily A2 cow milk delivery", category: "Groceries", requestedBy: "Priya K, Flat 204", upvotes: 42, createdAt: new Date(Date.now() - 5 * 86400000).toISOString(), status: "OPEN",
    vendorOffers: [
      { vendorId: "v-010", vendorName: "GoFarm Dairy", price: 85, moq: 30, rating: 4.6, deliveryDays: 1, score: 92 },
      { vendorId: "v-011", vendorName: "A2 Pure Farms", price: 90, moq: 20, rating: 4.8, deliveryDays: 1, score: 88 },
    ],
  },
  { id: "d-2", title: "Premium Water Purifier (RO+UV)", description: "Group deal on Kent or Livpure purifiers with AMC", category: "Appliances", requestedBy: "Ravi M, Flat 501", upvotes: 31, createdAt: new Date(Date.now() - 3 * 86400000).toISOString(), status: "MATCHED",
    vendorOffers: [
      { vendorId: "v-012", vendorName: "AquaPure Services", price: 14500, moq: 10, rating: 4.5, deliveryDays: 5, score: 85 },
    ],
  },
  { id: "d-3", title: "Solar Panel Installation", description: "Community solar rooftop with shared billing", category: "Energy", requestedBy: "Sanjay T, Flat 102", upvotes: 28, createdAt: new Date(Date.now() - 7 * 86400000).toISOString(), status: "OPEN" },
  { id: "d-4", title: "EV Charging Station (Shared)", description: "2-point EV charger for basement parking", category: "Energy", requestedBy: "Amit R, Flat 301", upvotes: 19, createdAt: new Date(Date.now() - 2 * 86400000).toISOString(), status: "OPEN" },
];

const VENDOR_PROFILES: VendorProfile[] = [
  {
    id: "v-001", name: "Green Earth Farms", category: "Organic Produce", rating: 4.7,
    totalOrders: 342, onTimeRate: 96, qualityScore: 94, responseTime: "< 1 hour",
    verified: true, gstVerified: true, fssaiVerified: true, since: "2023-03",
    badges: ["Top Rated", "Community Favourite", "Eco Certified"],
    products: [
      { name: "Organic Veggie Box", price: 650, unit: "box" },
      { name: "Fruit Basket (2kg)", price: 450, unit: "basket" },
      { name: "Salad Greens Pack", price: 180, unit: "pack" },
    ],
  },
  {
    id: "v-002", name: "TechMart Electronics", category: "Electronics & Appliances", rating: 4.4,
    totalOrders: 187, onTimeRate: 91, qualityScore: 89, responseTime: "< 2 hours",
    verified: true, gstVerified: true, fssaiVerified: false, since: "2024-01",
    badges: ["Verified Seller", "Fast Response"],
    products: [
      { name: "Dyson V3 Purifier", price: 21000, unit: "unit" },
      { name: "Samsung AC 1.5T", price: 34000, unit: "unit" },
      { name: "LG Washing Machine", price: 28000, unit: "unit" },
    ],
  },
  {
    id: "v-004", name: "Mithai Palace", category: "Food & Sweets", rating: 4.8,
    totalOrders: 520, onTimeRate: 98, qualityScore: 97, responseTime: "< 30 mins",
    verified: true, gstVerified: true, fssaiVerified: true, since: "2022-06",
    badges: ["Top Rated", "FSSAI Certified", "Festival Specialist"],
    products: [
      { name: "Diwali Premium Hamper", price: 1099, unit: "hamper" },
      { name: "Kaju Katli 500g", price: 650, unit: "box" },
      { name: "Dry Fruit Gift Box", price: 899, unit: "box" },
    ],
  },
];

const MONTHLY_BASKETS: MonthlyBasket[] = [
  {
    id: "basket-001", name: "Monthly Staples Basket", description: "Essential groceries for a family of 4",
    items: [
      { name: "Rice (5kg)", qty: "1", price: 450 },
      { name: "Atta (5kg)", qty: "1", price: 280 },
      { name: "Toor Dal (1kg)", qty: "2", price: 340 },
      { name: "Cooking Oil (1L)", qty: "2", price: 380 },
      { name: "Sugar (1kg)", qty: "1", price: 55 },
      { name: "Salt (1kg)", qty: "1", price: 25 },
    ],
    totalPrice: 1530, subscribers: 78, frequency: "MONTHLY",
    nextDelivery: new Date(Date.now() + 5 * 86400000).toISOString(),
    vendor: "Kisan Direct", vendorRating: 4.5,
  },
  {
    id: "basket-002", name: "Organic Veggie Weekly", description: "Fresh seasonal vegetables delivered weekly",
    items: [
      { name: "Seasonal Veggies (2kg)", qty: "1", price: 220 },
      { name: "Leafy Greens Bundle", qty: "1", price: 80 },
      { name: "Onion-Potato-Tomato (1kg each)", qty: "1", price: 150 },
      { name: "Herbs & Garnish Pack", qty: "1", price: 60 },
    ],
    totalPrice: 510, subscribers: 124, frequency: "WEEKLY",
    nextDelivery: new Date(Date.now() + 2 * 86400000).toISOString(),
    vendor: "Green Earth Farms", vendorRating: 4.7,
  },
  {
    id: "basket-003", name: "Baby Essentials Pack", description: "Diapers, wipes, and baby food monthly bundle",
    items: [
      { name: "Diapers (L, 50pcs)", qty: "1", price: 680 },
      { name: "Baby Wipes (3 packs)", qty: "1", price: 250 },
      { name: "Cerelac Mixed Fruit", qty: "2", price: 440 },
      { name: "Baby Lotion & Soap", qty: "1", price: 320 },
    ],
    totalPrice: 1690, subscribers: 34, frequency: "MONTHLY",
    nextDelivery: new Date(Date.now() + 8 * 86400000).toISOString(),
    vendor: "MomCare India", vendorRating: 4.6,
  },
];

const FESTIVAL_CAMPAIGNS: FestivalCampaign[] = [
  {
    id: "fest-001", festivalName: "Diwali Dhamaka", tagline: "Light up your savings this Diwali",
    color: "#f59e0b", startDate: new Date(Date.now() - 2 * 86400000).toISOString(),
    endDate: new Date(Date.now() + 12 * 86400000).toISOString(),
    deals: SAMPLE_DEALS.filter(d => d.isFestival),
  },
  {
    id: "fest-002", festivalName: "Winter Ready Sale", tagline: "Cozy up with community bulk deals",
    color: "#3b82f6", startDate: new Date(Date.now() + 20 * 86400000).toISOString(),
    endDate: new Date(Date.now() + 35 * 86400000).toISOString(),
    deals: [],
  },
];

const BUYING_GROUPS: BuyingGroup[] = [
  { id: "bg-001", name: "Tower A Buyers", type: "TOWER", members: 42, maxMembers: 80, admin: "Priya K", activeDealCount: 3, totalSavings: 28500 },
  { id: "bg-002", name: "Tower B Buyers", type: "TOWER", members: 38, maxMembers: 80, admin: "Ravi M", activeDealCount: 2, totalSavings: 22300 },
  { id: "bg-003", name: "Wing C - Floor 3-5", type: "WING", members: 15, maxMembers: 30, admin: "Anita S", activeDealCount: 1, totalSavings: 8900 },
  { id: "bg-004", name: "Block D Families", type: "BLOCK", members: 28, maxMembers: 50, admin: "Sanjay T", activeDealCount: 4, totalSavings: 31200 },
];

const COMMUNITY_SAVINGS: CommunitySavings = {
  totalSaved: 487500, ordersCompleted: 1240, activeDeals: 7, avgSavingsPercent: 32,
  milestones: [
    { label: "₹5 Lakh Saved", target: 500000, current: 487500 },
    { label: "1500 Orders", target: 1500, current: 1240 },
    { label: "100 Families", target: 100, current: 84 },
  ],
  towerLeaderboard: [
    { tower: "Tower A", savings: 142000, orders: 380 },
    { tower: "Tower B", savings: 128500, orders: 340 },
    { tower: "Block D", savings: 98200, orders: 260 },
    { tower: "Wing C", savings: 67800, orders: 150 },
    { tower: "Tower E", savings: 51000, orders: 110 },
  ],
  monthlyTrend: [
    { month: "May", savings: 42000 },
    { month: "Jun", savings: 58000 },
    { month: "Jul", savings: 63000 },
    { month: "Aug", savings: 71000 },
    { month: "Sep", savings: 85000 },
    { month: "Oct", savings: 92000 },
  ],
};

const BUY_AGAIN_ITEMS = [
  { dealId: "deal-past-1", title: "Organic Produce Box", lastPrice: 750, currentPrice: 650, lastOrderDate: new Date(Date.now() - 30 * 86400000).toISOString(), vendor: "Green Earth Farms", category: "Groceries" },
  { dealId: "deal-past-2", title: "Cleaning Bundle", lastPrice: 499, currentPrice: 399, lastOrderDate: new Date(Date.now() - 45 * 86400000).toISOString(), vendor: "CleanCo Supplies", category: "Household" },
  { dealId: "deal-past-3", title: "Basmati Rice 25kg", lastPrice: 1900, currentPrice: 1700, lastOrderDate: new Date(Date.now() - 60 * 86400000).toISOString(), vendor: "Kisan Direct", category: "Groceries" },
];

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
  const count = deal.currentParticipants + 1;
  for (const tier of deal.tiers) {
    if (tier.maxQty === null || count <= tier.maxQty) return tier.pricePerUnit;
  }
  return deal.tiers[deal.tiers.length - 1].pricePerUnit;
}

export const groupBuyingService = {
  getCategories(): string[] {
    return ["All", "Groceries", "Electronics", "Household", "Food & Festive", "Education", "Appliances", "Energy"];
  },

  getDeals(category?: string, search?: string): GroupDeal[] {
    let deals = SAMPLE_DEALS.map(d => {
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
        pickupPoint: d.pickupPoints[0] || 'Clubhouse',
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

  getDealById(id: string): GroupDeal | undefined {
    return SAMPLE_DEALS.find(d => d.id === id);
  },

  getAlmostUnlockedDeals(): GroupDeal[] {
    return SAMPLE_DEALS.filter(d => {
      if (d.status !== "ACTIVE") return false;
      const nextTier = d.tiers.find(t => t.minQty > d.currentParticipants);
      if (!nextTier) return false;
      return (nextTier.minQty - d.currentParticipants) <= 5;
    });
  },

  getTrendingDeals(): GroupDeal[] {
    return [...SAMPLE_DEALS].sort((a, b) => b.currentParticipants - a.currentParticipants).slice(0, 4);
  },

  getEndingSoonDeals(): GroupDeal[] {
    return SAMPLE_DEALS.filter(d => d.status === "ACTIVE")
      .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())
      .slice(0, 4);
  },

  joinDeal(dealId: string, quantity: number, userId?: string, fulfillment: FulfillmentType = "PICKUP", paymentMethod: PaymentMethod = "UPI", pickupPoint?: string): GroupOrder {
    const deal = SAMPLE_DEALS.find(d => d.id === dealId);
    if (!deal) throw new Error("Deal not found");
    const price = getCurrentTierPrice(deal);
    const order: GroupOrder = {
      id: `ord-${Date.now()}`, dealId, dealTitle: deal.title, quantity,
      pricePerUnit: price, totalAmount: price * quantity, status: "CONFIRMED",
      orderedAt: new Date().toISOString(),
      qrCode: `QR-${dealId.toUpperCase()}-${(userId || 'GUEST').slice(0, 6).toUpperCase()}-${Date.now()}`,
      fulfillment, paymentMethod,
      pickupPoint: pickupPoint || deal.pickupPoints[0],
      vendorName: deal.vendor,
    };
    const orders = loadOrders();
    saveOrders([...orders, order]);
    return order;
  },

  getMyOrders(_userId?: string): GroupOrder[] {
    return loadOrders();
  },

  getDemandBoard(): DemandItem[] {
    return DEMAND_ITEMS;
  },

  getDemandById(id: string): DemandItem | undefined {
    return DEMAND_ITEMS.find(d => d.id === id);
  },

  upvoteDemand(id: string): void {
    const item = DEMAND_ITEMS.find(d => d.id === id);
    if (item) item.upvotes += 1;
  },

  acceptVendorOffer(demandId: string, vendorId: string): GroupDeal | undefined {
    const demand = DEMAND_ITEMS.find(d => d.id === demandId);
    const offer = demand?.vendorOffers?.find(v => v.vendorId === vendorId);
    if (!demand || !offer) return undefined;
    demand.status = "CONVERTED";
    return {
      id: `deal-${Date.now()}`, title: demand.title, category: demand.category,
      description: demand.description, imagePlaceholderColor: "#10b981",
      currentParticipants: demand.upvotes, targetParticipants: offer.moq,
      tiers: [{ minQty: 1, maxQty: null, pricePerUnit: offer.price, label: "Group" }],
      vendor: offer.vendorName, vendorId: offer.vendorId, vendorRating: offer.rating,
      endDate: new Date(Date.now() + 14 * 86400000).toISOString(), status: "ACTIVE",
      deliveryDate: new Date(Date.now() + (14 + offer.deliveryDays) * 86400000).toISOString(),
      pickupPoints: ["Clubhouse", "Tower A Lobby"],
    };
  },

  getVendorProfile(id: string): VendorProfile | undefined {
    return VENDOR_PROFILES.find(v => v.id === id);
  },

  createDemand(demand: Partial<DemandItem>): DemandItem {
    const item: DemandItem = {
      id: `d-${Date.now()}`,
      title: demand.title || '',
      description: demand.description || '',
      category: demand.category || 'Groceries',
      requestedBy: demand.requestedBy || 'Resident',
      upvotes: 1,
      targetUpvotes: 25,
      hasUpvoted: false,
      createdAt: new Date().toISOString(),
      expectedQty: demand.expectedQty || 1,
      preferredPriceMin: demand.preferredPriceMin,
      preferredPriceMax: demand.preferredPriceMax,
      status: 'OPEN',
    };
    DEMAND_ITEMS.unshift(item);
    return item;
  },

  getFestivalCategories(): FestivalCategory[] {
    return FESTIVAL_CAMPAIGNS.map(c => ({
      id: c.id,
      festivalName: c.festivalName,
      tagline: c.tagline,
      bannerImage: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500",
      deals: c.deals,
    }));
  },

  getFeaturedDeals(): GroupDeal[] {
    return SAMPLE_DEALS.slice(0, 3);
  },

  getMonthlyBaskets(): MonthlyBasket[] {
    return MONTHLY_BASKETS.map(b => ({
      ...b,
      title: b.name,
      regularPrice: Math.round(b.totalPrice * 1.25),
      communityPrice: b.totalPrice,
      targetFamilies: 50,
      enrolledFamilies: b.subscribers,
      nextDeliveryDate: b.nextDelivery,
      savings: Math.round(b.totalPrice * 0.25),
    }));
  },

  getFestivalCampaigns(): FestivalCampaign[] {
    return FESTIVAL_CAMPAIGNS;
  },

  getBuyAgainSuggestions(): typeof BUY_AGAIN_ITEMS {
    return BUY_AGAIN_ITEMS;
  },

  getBuyingGroups(): BuyingGroup[] {
    return BUYING_GROUPS;
  },

  getCommunitySavings(): CommunitySavings {
    return {
      ...COMMUNITY_SAVINGS,
      totalSavedThisMonth: COMMUNITY_SAVINGS.totalSaved,
      totalOrders: COMMUNITY_SAVINGS.ordersCompleted,
      topCategories: [
        { category: 'Groceries', saved: 68400 },
        { category: 'Fresh Produce', saved: 42300 },
        { category: 'Festival Specials', saved: 37800 },
      ],
    };
  },

  getPickupPass(orderId: string): PickupPass | undefined {
    const order = loadOrders().find(o => o.id === orderId);
    if (!order) return undefined;
    return {
      orderId: order.id, qrCode: order.qrCode, dealTitle: order.dealTitle,
      quantity: order.quantity, pickupPoint: order.pickupPoint || "Clubhouse",
      pickupDate: new Date(Date.now() + 3 * 86400000).toISOString(),
      authorizedCollectors: [], status: order.status === "DELIVERED" ? "COLLECTED" : "PENDING",
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
      ...dispute, id: `disp-${Date.now()}`, status: "OPEN", createdAt: new Date().toISOString(),
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
    const matches = SAMPLE_DEALS
      .filter(d => d.title.toLowerCase().includes(q) || d.category.toLowerCase().includes(q) || d.description.toLowerCase().includes(q))
      .map(d => ({ deal: d, confidence: Math.round(60 + Math.random() * 35), reason: `Matches "${query}" in ${d.category}` }))
      .sort((a, b) => b.confidence - a.confidence);
    return {
      query, matches: matches.slice(0, 3),
      suggestions: matches.length === 0
        ? ["Try broader terms", "Post on Demand Board", "Check Festival Deals"]
        : ["Join now for best price", "Share with neighbours"],
    };
  },
};
