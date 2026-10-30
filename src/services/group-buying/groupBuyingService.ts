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

// ── Sample / Seed Data ────────────────────────────────────────────────────────

const SAMPLE_DEALS: GroupDeal[] = [
  {
    id: "sd-1",
    title: "Fresh Devgad Alphonso Mangoes",
    category: "Groceries",
    subCategory: "Fruits",
    description: "GI-tagged Devgad Alphonso mangoes sourced direct from Konkan orchards — sweet, fibre-free, zero wax coating.",
    imageUrl: "https://images.unsplash.com/photo-1553279768-865429fa0078?w=800&auto=format&fit=crop&q=80",
    imagePlaceholderColor: "#f59e0b",
    currentParticipants: 32,
    targetParticipants: 100,
    tiers: [
      { minQty: 1,   maxQty: 49,  pricePerUnit: 850,  label: "1–49 dozen" },
      { minQty: 50,  maxQty: 99,  pricePerUnit: 750,  label: "50–99 dozen" },
      { minQty: 100, maxQty: null, pricePerUnit: 680,  label: "100+ dozen" },
    ],
    vendor: "Konkan Farms Direct",
    vendorId: "vnd-1",
    vendorRating: 4.8,
    vendorVerified: true,
    endDate: new Date(Date.now() + 7 * 86400000).toISOString(),
    status: "ACTIVE",
    deliveryDate: new Date(Date.now() + 10 * 86400000).toISOString(),
    pickupPoints: ["Clubhouse Desk", "Tower A Lobby"],
    pickupPoint: "Clubhouse Desk",
    tags: ["Seasonal", "Farm-Direct", "GI-Tagged"],
    isTrending: true,
    mrp: 1200,
    currentTierPrice: 850,
    nextTierPrice: 750,
    nextTierUnitsNeeded: 18,
    committedQty: 32,
    targetQty: 100,
    daysLeft: 7,
    isAlmostUnlocked: false,
  },
  {
    id: "sd-2",
    title: "Aashirvaad Whole Wheat Atta 10 kg",
    category: "Groceries",
    description: "Community bulk purchase of ITC Aashirvaad Atta — warehouse-direct pricing with zero middlemen.",
    imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80",
    imagePlaceholderColor: "#d97706",
    currentParticipants: 127,
    targetParticipants: 200,
    tiers: [
      { minQty: 1,   maxQty: 99,  pricePerUnit: 590, label: "1–99 bags" },
      { minQty: 100, maxQty: 199, pricePerUnit: 565, label: "100–199 bags" },
      { minQty: 200, maxQty: null, pricePerUnit: 545, label: "200+ bags" },
    ],
    vendor: "Metro Cash & Carry",
    vendorId: "vnd-2",
    vendorRating: 4.6,
    vendorVerified: true,
    endDate: new Date(Date.now() + 5 * 86400000).toISOString(),
    status: "ACTIVE",
    deliveryDate: new Date(Date.now() + 8 * 86400000).toISOString(),
    pickupPoints: ["Tower A Lobby", "Tower B Lobby"],
    pickupPoint: "Tower A Lobby",
    tags: ["Staples", "Bulk"],
    isTrending: false,
    mrp: 680,
    currentTierPrice: 565,
    nextTierPrice: 545,
    nextTierUnitsNeeded: 73,
    committedQty: 127,
    targetQty: 200,
    daysLeft: 5,
    isAlmostUnlocked: false,
  },
  {
    id: "sd-3",
    title: "Diwali Dry Fruits Premium Box 1 kg",
    category: "Food & Festive",
    description: "Celebrate Diwali with premium Afghani almonds, Californian cashews, pistachios & figs — gift-wrapped with community discount.",
    imageUrl: "https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?w=500",
    imagePlaceholderColor: "#8b5cf6",
    currentParticipants: 138,
    targetParticipants: 150,
    tiers: [
      { minQty: 1,   maxQty: 49,  pricePerUnit: 1250, label: "1–49 boxes" },
      { minQty: 50,  maxQty: 149, pricePerUnit: 1150, label: "50–149 boxes" },
      { minQty: 150, maxQty: null, pricePerUnit: 1100, label: "150+ boxes" },
    ],
    vendor: "Diwali Dhamaka Co-op",
    vendorId: "vnd-3",
    vendorRating: 4.9,
    vendorVerified: true,
    endDate: new Date(Date.now() + 3 * 86400000).toISOString(),
    status: "ACTIVE",
    deliveryDate: new Date(Date.now() + 4 * 86400000).toISOString(),
    pickupPoints: ["Clubhouse Desk"],
    pickupPoint: "Clubhouse Desk",
    tags: ["Festival", "Gift", "Premium"],
    isFestival: true,
    festivalName: "Diwali",
    isTrending: true,
    isAlmostUnlocked: true,
    mrp: 1850,
    currentTierPrice: 1150,
    nextTierPrice: 1100,
    nextTierUnitsNeeded: 12,
    committedQty: 138,
    targetQty: 150,
    daysLeft: 3,
  },
  {
    id: "sd-4",
    title: "Philips LED Bulbs Pack of 10 (9W)",
    category: "Household",
    description: "Energy-saving Philips 9W LED bulbs — 2-year warranty, BEE 5-star rated, perfect for all fittings.",
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600",
    imagePlaceholderColor: "#0ea5e9",
    currentParticipants: 56,
    targetParticipants: 80,
    tiers: [
      { minQty: 1,  maxQty: 79,  pricePerUnit: 385, label: "1–79 packs" },
      { minQty: 80, maxQty: null, pricePerUnit: 340, label: "80+ packs" },
    ],
    vendor: "Philips Authorized Dealer",
    vendorId: "vnd-4",
    vendorRating: 4.7,
    vendorVerified: true,
    endDate: new Date(Date.now() + 9 * 86400000).toISOString(),
    status: "ACTIVE",
    deliveryDate: new Date(Date.now() + 12 * 86400000).toISOString(),
    pickupPoints: ["Tower A Lobby", "Clubhouse Desk"],
    pickupPoint: "Tower A Lobby",
    tags: ["Electronics", "Energy-Saving"],
    isTrending: false,
    isAlmostUnlocked: true,
    mrp: 490,
    currentTierPrice: 385,
    nextTierPrice: 340,
    nextTierUnitsNeeded: 24,
    committedQty: 56,
    targetQty: 80,
    daysLeft: 9,
  },
];

const DEMAND_ITEMS: DemandItem[] = [
  {
    id: "dem-1",
    title: "Organic A2 Milk Daily Subscription",
    description: "Looking for certified A2 cow milk with daily doorstep delivery by 7 AM — 500 ml packets, no preservatives.",
    category: "Groceries",
    requestedBy: "Flat 402, Tower B",
    upvotes: 34,
    targetUpvotes: 50,
    hasUpvoted: false,
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    expectedQty: 200,
    preferredPriceMin: 25,
    preferredPriceMax: 35,
    preferredBrand: "Country Delight / Pride of Cows",
    status: "OPEN",
    vendorOffers: [],
  },
  {
    id: "dem-2",
    title: "Himalayan Pink Salt 5 kg Bulk Pack",
    description: "Community request for natural unrefined Himalayan pink salt at wholesale rates — no iodine, no anti-caking agents.",
    category: "Groceries",
    requestedBy: "Flat 104, Tower A",
    upvotes: 22,
    targetUpvotes: 30,
    hasUpvoted: false,
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    expectedQty: 110,
    preferredPriceMin: 120,
    preferredPriceMax: 180,
    status: "MATCHED",
    vendorOffers: [
      { vendorId: "vnd-2", vendorName: "Metro Cash & Carry", price: 145, moq: 50, rating: 4.6, deliveryDays: 3, score: 88 },
    ],
  },
  {
    id: "dem-3",
    title: "Organic Cold-Pressed Groundnut Oil 5L",
    description: "Traditional wooden cold-press (kachi ghani) groundnut oil — no heat treatment, full nutrient retention.",
    category: "Groceries",
    requestedBy: "Flat 205, Tower C",
    upvotes: 18,
    targetUpvotes: 25,
    hasUpvoted: false,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    expectedQty: 90,
    preferredPriceMin: 350,
    preferredPriceMax: 450,
    status: "OPEN",
    vendorOffers: [],
  },
];

const VENDOR_PROFILES: VendorProfile[] = [
  {
    id: "vnd-1",
    name: "Konkan Farms Direct",
    category: "Fruits & Vegetables",
    rating: 4.8,
    totalOrders: 1420,
    onTimeRate: 97.2,
    qualityScore: 4.9,
    responseTime: "< 2 hrs",
    verified: true,
    gstVerified: true,
    fssaiVerified: true,
    since: "2021-04",
    badges: ["Farm-Direct", "Zero Pesticide", "GI Partner"],
    products: [
      { name: "Alphonso Mangoes (1 Dozen)", price: 850, unit: "Dozen" },
      { name: "Kokum Dried (250 g)", price: 180, unit: "Pack" },
      { name: "Cashew W240 (500 g)", price: 420, unit: "Pack" },
    ],
  },
  {
    id: "vnd-2",
    name: "Metro Cash & Carry",
    category: "Grocery & Staples",
    rating: 4.6,
    totalOrders: 6800,
    onTimeRate: 98.5,
    qualityScore: 4.6,
    responseTime: "< 1 hr",
    verified: true,
    gstVerified: true,
    fssaiVerified: true,
    since: "2018-06",
    badges: ["ISO 22000", "ITC Authorized", "Bulk Specialist"],
    products: [
      { name: "Aashirvaad Atta 10 kg", price: 565, unit: "Bag" },
      { name: "Fortune Sunflower Oil 5L", price: 640, unit: "Jar" },
      { name: "Tata Salt 1 kg", price: 22, unit: "Pack" },
    ],
  },
  {
    id: "vnd-3",
    name: "Diwali Dhamaka Co-op",
    category: "Festive & Gifting",
    rating: 4.9,
    totalOrders: 3200,
    onTimeRate: 99.1,
    qualityScore: 4.9,
    responseTime: "< 3 hrs",
    verified: true,
    gstVerified: true,
    fssaiVerified: true,
    since: "2019-09",
    badges: ["Festival Specialist", "FSSAI Certified", "Premium Packaging"],
    products: [
      { name: "Dry Fruits Premium Box 1 kg", price: 1150, unit: "Box" },
      { name: "Kaju Katli 500 g", price: 480, unit: "Box" },
      { name: "Puja Samagri Kit", price: 350, unit: "Kit" },
    ],
  },
  {
    id: "vnd-4",
    name: "Philips Authorized Dealer",
    category: "Electronics & Appliances",
    rating: 4.7,
    totalOrders: 2100,
    onTimeRate: 96.8,
    qualityScore: 4.7,
    responseTime: "< 4 hrs",
    verified: true,
    gstVerified: true,
    fssaiVerified: false,
    since: "2020-01",
    badges: ["Philips Gold Partner", "BEE Certified", "2-Year Warranty"],
    products: [
      { name: "LED Bulb 9W Pack of 10", price: 385, unit: "Pack" },
      { name: "LED Batten 20W", price: 420, unit: "Unit" },
      { name: "Smart LED Strip 5m", price: 1250, unit: "Roll" },
    ],
  },
];

const SAMPLE_COMMUNITY_SAVINGS: CommunitySavings = {
  totalSaved: 1840000,
  totalSavedThisMonth: 184520,
  ordersCompleted: 12480,
  totalOrders: 12480,
  activeDeals: 38,
  avgSavingsPercent: 23.8,
  milestones: [
    { label: "₹10 Lakh Saved", target: 1000000, current: 1840000 },
    { label: "₹25 Lakh Saved", target: 2500000, current: 1840000 },
    { label: "10,000 Orders", target: 10000, current: 12480 },
  ],
  towerLeaderboard: [
    { tower: "Tower A", savings: 62450, orders: 412 },
    { tower: "Tower B", savings: 58200, orders: 386 },
    { tower: "Tower C", savings: 42870, orders: 298 },
    { tower: "Tower D", savings: 21000, orders: 152 },
  ],
  monthlyTrend: [
    { month: "May", savings: 96400 },
    { month: "Jun", savings: 112800 },
    { month: "Jul", savings: 138600 },
    { month: "Aug", savings: 155200 },
    { month: "Sep", savings: 168900 },
    { month: "Oct", savings: 184520 },
  ],
  topCategories: [
    { category: "Groceries & Staples", saved: 72400 },
    { category: "Fresh Produce", saved: 48200 },
    { category: "Household & Home", saved: 35600 },
    { category: "Food & Festive", saved: 28320 },
  ],
};

const BUYING_GROUPS: BuyingGroup[] = [
  { id: "bg-1", name: "Tower A Collective",  type: "TOWER", members: 42, maxMembers: 60, admin: "Priya Sharma (402A)",  activeDealCount: 5, totalSavings: 248600 },
  { id: "bg-2", name: "Tower B Residents",   type: "TOWER", members: 38, maxMembers: 60, admin: "Rohit Mehta (301B)",   activeDealCount: 4, totalSavings: 192300 },
  { id: "bg-3", name: "Tower C Community",   type: "TOWER", members: 31, maxMembers: 60, admin: "Aisha Khan (205C)",    activeDealCount: 3, totalSavings: 142800 },
  { id: "bg-4", name: "Premium Wing Buyers", type: "WING",  members: 18, maxMembers: 30, admin: "Suresh Iyer (108D)",   activeDealCount: 6, totalSavings: 86500 },
  { id: "bg-5", name: "Floor 4 Neighbours",  type: "FLOOR", members: 12, maxMembers: 20, admin: "Kavita Nair (401A)",   activeDealCount: 2, totalSavings: 34200 },
];

const MONTHLY_BASKETS: MonthlyBasket[] = [
  {
    id: "mb-1",
    name: "Essential Monthly Grocery Kit",
    title: "Essential Monthly Grocery Kit",
    description: "Atta, rice, oil, pulses & spices for a family of 4 — sourced in bulk at 15% below retail.",
    items: [
      { name: "Aashirvaad Atta 10 kg", qty: "1 Bag", price: 565 },
      { name: "India Gate Basmati Rice 5 kg", qty: "1 Bag", price: 480 },
      { name: "Fortune Sunflower Oil 5L", qty: "1 Jar", price: 640 },
      { name: "Toor Dal 2 kg", qty: "1 Pack", price: 320 },
      { name: "Spices Combo Pack", qty: "1 Set", price: 180 },
    ],
    totalPrice: 2185,
    regularPrice: 2620,
    communityPrice: 2185,
    savings: 435,
    subscribers: 78,
    targetFamilies: 100,
    enrolledFamilies: 78,
    frequency: "MONTHLY",
    nextDelivery: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
    nextDeliveryDate: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
    vendor: "Metro Cash & Carry",
    vendorRating: 4.6,
  },
  {
    id: "mb-2",
    name: "Fresh Dairy Weekly Box",
    title: "Fresh Dairy Weekly Box",
    description: "Milk, curd, paneer & ghee — farm-fresh, no preservatives, weekly delivery to your door.",
    items: [
      { name: "A2 Milk 500 ml × 7", qty: "7 Packets", price: 196 },
      { name: "Dahi 400 g", qty: "2 Packs", price: 90 },
      { name: "Paneer 200 g", qty: "1 Pack", price: 85 },
      { name: "Desi Ghee 250 ml", qty: "1 Bottle", price: 280 },
    ],
    totalPrice: 651,
    regularPrice: 790,
    communityPrice: 651,
    savings: 139,
    subscribers: 55,
    targetFamilies: 80,
    enrolledFamilies: 55,
    frequency: "WEEKLY",
    nextDelivery: new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0],
    nextDeliveryDate: new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0],
    vendor: "Konkan Farms Direct",
    vendorRating: 4.8,
  },
];

const FESTIVAL_CAMPAIGNS: FestivalCampaign[] = [
  {
    id: "fc-diwali",
    festivalName: "Diwali",
    tagline: "Save up to 40% on Dry Fruits, Sweets & Puja Essentials — biggest community deal of the year!",
    color: "#f59e0b",
    startDate: new Date(Date.now() - 86400000).toISOString(),
    endDate: new Date(Date.now() + 12 * 86400000).toISOString(),
    deals: SAMPLE_DEALS.filter(d => d.isFestival),
  },
  {
    id: "fc-winter",
    festivalName: "Winter Harvest",
    tagline: "Fresh winter produce at farm-gate prices — carrots, peas, strawberries & more in season.",
    color: "#0ea5e9",
    startDate: new Date(Date.now() + 20 * 86400000).toISOString(),
    endDate: new Date(Date.now() + 50 * 86400000).toISOString(),
    deals: [],
  },
];

const FESTIVAL_CATEGORIES: FestivalCategory[] = [
  { id: "fc-cat-1", festivalName: "Diwali Sweets & Snacks",   tagline: "Mithai, Namkeen & Chocolates",      bannerImage: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500", deals: SAMPLE_DEALS.filter(d => d.isFestival) },
  { id: "fc-cat-2", festivalName: "Puja Samagri",             tagline: "Incense, Flowers & Diyas",          bannerImage: "https://images.unsplash.com/photo-1604697964538-2d0e62ae9b2e?w=500", deals: [] },
  { id: "fc-cat-3", festivalName: "Premium Dry Fruits",       tagline: "Almonds, Cashews & Pistachios",     bannerImage: "https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?w=500", deals: SAMPLE_DEALS.filter(d => d.id === "sd-3") },
  { id: "fc-cat-4", festivalName: "Gifting & Hampers",        tagline: "Corporate & Personal Gift Boxes",   bannerImage: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=500", deals: [] },
];

const BUY_AGAIN_ITEMS: BuyAgainItem[] = [
  { dealId: "sd-1", title: "Fresh Devgad Alphonso Mangoes",   category: "Groceries",       lastOrderDate: new Date(Date.now() - 14 * 86400000).toISOString(), vendor: "Konkan Farms Direct",    daysAgo: 14, lastPrice: 850,  currentPrice: 850,  isAvailable: true },
  { dealId: "sd-2", title: "Aashirvaad Whole Wheat Atta 10kg", category: "Groceries",      lastOrderDate: new Date(Date.now() - 30 * 86400000).toISOString(), vendor: "Metro Cash & Carry",     daysAgo: 30, lastPrice: 590,  currentPrice: 565,  isAvailable: true },
  { dealId: "sd-4", title: "Philips LED Bulbs Pack of 10",    category: "Household",        lastOrderDate: new Date(Date.now() - 60 * 86400000).toISOString(), vendor: "Philips Auth. Dealer",   daysAgo: 60, lastPrice: 420,  currentPrice: 385,  isAvailable: true },
];

const SEED_ORDERS: GroupOrder[] = [
  {
    id: "seed-ord-1",
    orderNumber: "ORD-2610-0042",
    dealId: "sd-2",
    dealTitle: "Aashirvaad Whole Wheat Atta 10 kg",
    title: "Aashirvaad Whole Wheat Atta 10 kg",
    quantity: 2,
    pricePerUnit: 565,
    totalAmount: 1130,
    status: "READY",
    orderedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    qrCode: "QR-SD2-SEED-0042",
    fulfillment: "PICKUP",
    paymentMethod: "UPI",
    pickupPoint: "Tower A Lobby",
    vendorName: "Metro Cash & Carry",
    reviewed: false,
  },
  {
    id: "seed-ord-2",
    orderNumber: "ORD-2610-0038",
    dealId: "sd-3",
    dealTitle: "Diwali Dry Fruits Premium Box 1 kg",
    title: "Diwali Dry Fruits Premium Box 1 kg",
    quantity: 1,
    pricePerUnit: 1150,
    totalAmount: 1150,
    status: "CONFIRMED",
    orderedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    qrCode: "QR-SD3-SEED-0038",
    fulfillment: "PICKUP",
    paymentMethod: "UPI",
    pickupPoint: "Clubhouse Desk",
    vendorName: "Diwali Dhamaka Co-op",
    reviewed: false,
  },
  {
    id: "seed-ord-3",
    orderNumber: "ORD-2609-0021",
    dealId: "sd-1",
    dealTitle: "Fresh Devgad Alphonso Mangoes",
    title: "Fresh Devgad Alphonso Mangoes",
    quantity: 1,
    pricePerUnit: 850,
    totalAmount: 850,
    status: "DELIVERED",
    orderedAt: new Date(Date.now() - 16 * 86400000).toISOString(),
    qrCode: "QR-SD1-SEED-0021",
    fulfillment: "PICKUP",
    paymentMethod: "UPI",
    pickupPoint: "Clubhouse Desk",
    vendorName: "Konkan Farms Direct",
    reviewed: false,
  },
];

// ── In-Memory Live State ──────────────────────────────────────────────────────
let liveDeals: GroupDeal[] = [...SAMPLE_DEALS];
let liveDemands: DemandItem[] = [...DEMAND_ITEMS];
let liveSavings: CommunitySavings = { ...SAMPLE_COMMUNITY_SAVINGS };
let liveBuyingGroups: BuyingGroup[] = [...BUYING_GROUPS];

const ORDERS_KEY = "mana_group_orders";
const REVIEWS_KEY = "mana_group_reviews";
const DISPUTES_KEY = "mana_group_disputes";

function loadOrders(): GroupOrder[] {
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    if (raw) {
      const parsed: GroupOrder[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  // Seed with default orders on first load so pickup/review/dispute flows work out-of-the-box
  saveOrders(SEED_ORDERS);
  return SEED_ORDERS;
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
      if (Array.isArray(data) && data.length > 0) {
        liveDeals = data.map(mapBackendDeal);
      }
      // else keep SAMPLE_DEALS already loaded into liveDeals
    } catch {
      // keep SAMPLE_DEALS already in liveDeals
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
      if (Array.isArray(data) && data.length > 0) {
        liveDemands = data.map(mapBackendDemand);
      }
      // else keep DEMAND_ITEMS already in liveDemands
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

  getVendorProfile(id: string): VendorProfile {
    const known = VENDOR_PROFILES.find(v => v.id === id);
    if (known) return known;
    // Construct a dynamic fallback from a deal that references this vendor so the page never crashes
    const deal = liveDeals.find(d => d.vendorId === id);
    return {
      id,
      name: deal?.vendor || "Community Vendor",
      category: deal?.category || "General",
      rating: deal?.vendorRating ?? 4.5,
      totalOrders: 0,
      onTimeRate: 95,
      qualityScore: 4.5,
      responseTime: "< 4 hrs",
      verified: deal?.vendorVerified ?? false,
      gstVerified: false,
      fssaiVerified: false,
      since: new Date().getFullYear() + "-01",
      badges: deal?.vendorVerified ? ["Verified Vendor"] : [],
      products: deal
        ? [{ name: deal.title, price: deal.currentTierPrice ?? 0, unit: "Unit" }]
        : [],
    };
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
    return FESTIVAL_CATEGORIES;
  },

  getFeaturedDeals(): GroupDeal[] {
    const live = liveDeals.filter(d => d.isTrending || d.isAlmostUnlocked);
    return (live.length > 0 ? live : liveDeals).slice(0, 3);
  },

  getMonthlyBaskets(): MonthlyBasket[] {
    return MONTHLY_BASKETS;
  },

  getFestivalCampaigns(): FestivalCampaign[] {
    // Attach live deals tagged as festival to the matching campaign
    return FESTIVAL_CAMPAIGNS.map(c => ({
      ...c,
      deals: liveDeals.filter(d => d.isFestival && (!d.festivalName || d.festivalName === c.festivalName)),
    }));
  },

  getBuyAgainSuggestions(): BuyAgainItem[] {
    return BUY_AGAIN_ITEMS;
  },

  async fetchBuyingGroups(): Promise<BuyingGroup[]> {
    try {
      const data = await apiClient.get<any[]>("/group-buying/tower-groups");
      if (Array.isArray(data) && data.length > 0) {
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
