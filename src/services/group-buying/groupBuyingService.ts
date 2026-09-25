export type DealStatus = "ACTIVE" | "FUNDED" | "FULFILLED" | "CANCELLED";
export type OrderStatus = "CONFIRMED" | "PROCESSING" | "READY" | "DELIVERED" | "CANCELLED";

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
  description: string;
  imagePlaceholderColor: string;
  currentParticipants: number;
  targetParticipants: number;
  tiers: PriceTier[];
  vendor: string;
  vendorRating: number;
  endDate: string;
  status: DealStatus;
  deliveryDate: string;
  pickupPoints: string[];
}

export interface GroupOrder {
  id: string;
  dealId: string;
  dealTitle: string;
  quantity: number;
  pricePerUnit: number;
  totalAmount: number;
  status: OrderStatus;
  orderedAt: string;
  qrCode: string;
}

export interface DemandItem {
  id: string;
  title: string;
  description: string;
  category: string;
  requestedBy: string;
  upvotes: number;
  createdAt: string;
}

const SAMPLE_DEALS: GroupDeal[] = [
  {
    id: "deal-001",
    title: "Fresh Organic Produce Box",
    category: "Groceries",
    description: "Weekly farm-to-door organic vegetables and fruits sourced directly from certified organic farms in Pune.",
    imagePlaceholderColor: "#4ade80",
    currentParticipants: 34,
    targetParticipants: 50,
    tiers: [
      { minQty: 1, maxQty: 19, pricePerUnit: 850, label: "Standard" },
      { minQty: 20, maxQty: 39, pricePerUnit: 750, label: "Group" },
      { minQty: 40, maxQty: null, pricePerUnit: 650, label: "Bulk" },
    ],
    vendor: "Green Earth Farms",
    vendorRating: 4.7,
    endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    status: "ACTIVE",
    deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    pickupPoints: ["Tower A Lobby", "Tower B Lobby", "Clubhouse"],
  },
  {
    id: "deal-002",
    title: "Premium Air Purifier - Dyson V3",
    category: "Electronics",
    description: "Hospital-grade HEPA air purifier with WiFi control. CADR 500 m³/hr, covers up to 800 sq ft.",
    imagePlaceholderColor: "#60a5fa",
    currentParticipants: 18,
    targetParticipants: 25,
    tiers: [
      { minQty: 1, maxQty: 9, pricePerUnit: 28000, label: "Standard" },
      { minQty: 10, maxQty: 19, pricePerUnit: 24000, label: "Group" },
      { minQty: 20, maxQty: null, pricePerUnit: 21000, label: "Bulk" },
    ],
    vendor: "TechMart Electronics",
    vendorRating: 4.4,
    endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: "ACTIVE",
    deliveryDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
    pickupPoints: ["Security Gate", "Clubhouse"],
  },
  {
    id: "deal-003",
    title: "Household Cleaning Bundle",
    category: "Household",
    description: "3-month supply of eco-friendly cleaning products: floor cleaner, dishwash, laundry pods & surface spray.",
    imagePlaceholderColor: "#f472b6",
    currentParticipants: 67,
    targetParticipants: 60,
    tiers: [
      { minQty: 1, maxQty: 29, pricePerUnit: 599, label: "Standard" },
      { minQty: 30, maxQty: 59, pricePerUnit: 499, label: "Group" },
      { minQty: 60, maxQty: null, pricePerUnit: 399, label: "Bulk" },
    ],
    vendor: "CleanCo Supplies",
    vendorRating: 4.6,
    endDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    status: "FUNDED",
    deliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    pickupPoints: ["Tower A Lobby", "Tower B Lobby"],
  },
  {
    id: "deal-004",
    title: "Festive Sweets Hamper - Diwali",
    category: "Food & Festive",
    description: "Curated Diwali hamper with 16 varieties of premium dry fruits, mithai, and chocolate assortments. Gift-wrapped.",
    imagePlaceholderColor: "#fb923c",
    currentParticipants: 45,
    targetParticipants: 40,
    tiers: [
      { minQty: 1, maxQty: 19, pricePerUnit: 1499, label: "Standard" },
      { minQty: 20, maxQty: 39, pricePerUnit: 1299, label: "Group" },
      { minQty: 40, maxQty: null, pricePerUnit: 1099, label: "Bulk" },
    ],
    vendor: "Mithai Palace",
    vendorRating: 4.8,
    endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    status: "FUNDED",
    deliveryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    pickupPoints: ["Clubhouse", "Tower A Lobby"],
  },
];

const DEMAND_ITEMS: DemandItem[] = [
  { id: "d-1", title: "Organic A2 Milk - Monthly Subscription", description: "Need vendor for daily A2 cow milk delivery", category: "Groceries", requestedBy: "Priya K, Flat 204", upvotes: 42, createdAt: new Date(Date.now() - 5 * 86400000).toISOString() },
  { id: "d-2", title: "Premium Water Purifier (RO+UV)", description: "Group deal on Kent or Livpure purifiers with AMC", category: "Appliances", requestedBy: "Ravi M, Flat 501", upvotes: 31, createdAt: new Date(Date.now() - 3 * 86400000).toISOString() },
  { id: "d-3", title: "Solar Panel Installation", description: "Community solar rooftop with shared billing", category: "Energy", requestedBy: "Sanjay T, Flat 102", upvotes: 28, createdAt: new Date(Date.now() - 7 * 86400000).toISOString() },
];

const ORDERS_KEY = "mana_group_orders";

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

function getCurrentTierPrice(deal: GroupDeal): number {
  const count = deal.currentParticipants + 1;
  for (const tier of deal.tiers) {
    if (tier.maxQty === null || count <= tier.maxQty) return tier.pricePerUnit;
  }
  return deal.tiers[deal.tiers.length - 1].pricePerUnit;
}

export const groupBuyingService = {
  getDeals(): GroupDeal[] {
    return SAMPLE_DEALS;
  },

  getDealById(id: string): GroupDeal | undefined {
    return SAMPLE_DEALS.find(d => d.id === id);
  },

  joinDeal(dealId: string, quantity: number, userId: string): GroupOrder {
    const deal = SAMPLE_DEALS.find(d => d.id === dealId);
    if (!deal) throw new Error("Deal not found");
    const price = getCurrentTierPrice(deal);
    const order: GroupOrder = {
      id: `ord-${Date.now()}`,
      dealId,
      dealTitle: deal.title,
      quantity,
      pricePerUnit: price,
      totalAmount: price * quantity,
      status: "CONFIRMED",
      orderedAt: new Date().toISOString(),
      qrCode: `QR-${dealId.toUpperCase()}-${userId.slice(0, 6).toUpperCase()}-${Date.now()}`,
    };
    const orders = loadOrders();
    saveOrders([...orders, order]);
    return order;
  },

  getMyOrders(_userId: string): GroupOrder[] {
    return loadOrders();
  },

  getDemandBoard(): DemandItem[] {
    return DEMAND_ITEMS;
  },

  upvoteDemand(id: string): void {
    const item = DEMAND_ITEMS.find(d => d.id === id);
    if (item) item.upvotes += 1;
  },
};
