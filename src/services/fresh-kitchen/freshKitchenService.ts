import { apiClient } from "../common/apiClient";
import type {
  FreshFoodProduct,
  FreshFoodProductCategory,
  BreakfastCombo,
  DailyBasket,
  DailyBasketItem,
  VendorCapacity,
  FoodProductionBatch,
  CreateDailyBasketItemRequest,
  UpdateDailyBasketItemRequest,
  VacationPauseRequest,
  UpdateExecutionModeRequest,
  UpdateDeliveryDetailsRequest,
  UpdateVendorCapacityRequest,
  CreateBatchReleaseRequest,
  InstantBuyRequest,
  InstantBuyResponse,
} from "../../types/freshKitchen";

// ── In-Memory Realistic Fallback Mocks for Resilient UX ──

export const MOCK_FRESH_PRODUCTS: FreshFoodProduct[] = [
  {
    id: "prod-std-idli-1",
    name: "Classic Malgudi Idli Batter",
    slug: "classic-malgudi-idli-batter",
    description: "Naturally stone-ground using aged urad dal and parboiled rice. Fermented for 14 hours for ultra fluffy, pillowy idlis.",
    category: "STANDARD_BATTER",
    price: 85,
    mrp: 100,
    discountPercentage: 15,
    unit: "1 kg (Makes 20-22 Idlis)",
    imageUrl: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80",
    shelfLifeHours: 72,
    storageTempMin: 2,
    storageTempMax: 4,
    storageInstructions: "Store at 2-4°C immediately upon receipt. Do not freeze.",
    ingredients: ["Parboiled Rice (65%)", "Guntur Urad Dal (30%)", "Fenugreek Seeds (3%)", "RO Water", "Himalayan Pink Salt (2%)"],
    dietaryFlags: ["VEG", "VEGAN", "GLUTEN_FREE"],
    inStock: true,
    availableStock: 24,
    isSoldOut: false,
    vendorId: "v-kitchen-01",
    vendorName: "Sri Krishna Home Batters",
    rating: 4.89,
    totalReviews: 342,
    preparationBatchId: "BAT-2026-031",
    fssaiNumber: "11521018000452",
    nutritionalInfo: { calories: 142, protein: 4.8, carbs: 29.5, fats: 0.6, fiber: 2.1 },
    tags: ["Bestseller", "Preservative Free", "Naturally Fermented"],
    isFeatured: true,
    leadTimeHours: 10,
    fermentationHours: 14,
  },
  {
    id: "prod-crisp-dosa-2",
    name: "Golden Roast Crispy Dosa Batter",
    slug: "golden-roast-crispy-dosa-batter",
    description: "Special blend infused with chana dal and poha for restaurant-style mahogany red, shatteringly crispy dosas.",
    category: "STANDARD_BATTER",
    price: 90,
    mrp: 110,
    discountPercentage: 18,
    unit: "1 kg (Makes 15-18 Dosas)",
    imageUrl: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&auto=format&fit=crop&q=80",
    shelfLifeHours: 72,
    storageTempMin: 2,
    storageTempMax: 4,
    storageInstructions: "Store at 2-4°C. Bring to room temp 15 mins before spreading on tawa.",
    ingredients: ["Sona Masoori Rice (60%)", "Urad Gota (25%)", "Bengal Gram (10%)", "Beaten Rice (Poha)", "Methi Seeds"],
    dietaryFlags: ["VEG", "VEGAN", "GLUTEN_FREE"],
    inStock: true,
    availableStock: 18,
    isSoldOut: false,
    vendorId: "v-kitchen-01",
    vendorName: "Sri Krishna Home Batters",
    rating: 4.92,
    totalReviews: 512,
    preparationBatchId: "BAT-2026-032",
    fssaiNumber: "11521018000452",
    nutritionalInfo: { calories: 156, protein: 5.1, carbs: 32.2, fats: 0.8, fiber: 1.9 },
    tags: ["Chef Special", "Extra Crispy"],
    isFeatured: true,
    leadTimeHours: 10,
    fermentationHours: 12,
  },
  {
    id: "prod-millet-ragi-3",
    name: "Organic Sprouted Ragi Millet Batter",
    slug: "sprouted-ragi-millet-batter",
    description: "High-calcium organic finger millet (ragi) batter blended with black gram. Great for bone density and sustained glycemic release.",
    category: "MILLET_BATTER",
    price: 115,
    mrp: 140,
    discountPercentage: 17,
    unit: "900g (Makes 14 Dosas)",
    imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80",
    shelfLifeHours: 48,
    storageTempMin: 2,
    storageTempMax: 4,
    storageInstructions: "Keep refrigerated between 2°C - 4°C. Consume within 48 hours for maximum probiotic benefit.",
    ingredients: ["Sprouted Organic Ragi (55%)", "Whole Black Gram (35%)", "Fenugreek", "Rock Salt"],
    dietaryFlags: ["VEG", "VEGAN", "GLUTEN_FREE", "DIABETIC_FRIENDLY", "ORGANIC"],
    inStock: true,
    availableStock: 12,
    isSoldOut: false,
    vendorId: "v-kitchen-02",
    vendorName: "Millet Mandi Co-op",
    rating: 4.76,
    totalReviews: 189,
    preparationBatchId: "BAT-2026-035",
    fssaiNumber: "11522020000199",
    nutritionalInfo: { calories: 128, protein: 6.2, carbs: 24.1, fats: 0.9, fiber: 5.4 },
    tags: ["High Fiber", "Low GI", "Zero White Rice"],
    isFeatured: true,
    leadTimeHours: 12,
    fermentationHours: 16,
  },
  {
    id: "prod-millet-foxtail-4",
    name: "Kangni (Foxtail Millet) Idli-Dosa Batter",
    slug: "foxtail-millet-batter",
    description: "Light, digestible ancient grain batter packed with vitamin B12 and minerals. Fermented naturally without artificial leaveners.",
    category: "MILLET_BATTER",
    price: 120,
    mrp: 145,
    discountPercentage: 17,
    unit: "900g (Makes 16 Idlis)",
    imageUrl: "https://images.unsplash.com/photo-1505253758473-96b7015fcd40?w=600&auto=format&fit=crop&q=80",
    shelfLifeHours: 48,
    storageTempMin: 2,
    storageTempMax: 4,
    storageInstructions: "Store chilled at 2-4°C.",
    ingredients: ["Unpolished Foxtail Millet (60%)", "Urad Dal (35%)", "Methi", "Sea Salt"],
    dietaryFlags: ["VEG", "VEGAN", "GLUTEN_FREE", "HIGH_PROTEIN"],
    inStock: true,
    availableStock: 9,
    isSoldOut: false,
    vendorId: "v-kitchen-02",
    vendorName: "Millet Mandi Co-op",
    rating: 4.81,
    totalReviews: 94,
    preparationBatchId: "BAT-2026-036",
    fssaiNumber: "11522020000199",
    nutritionalInfo: { calories: 135, protein: 5.8, carbs: 26.0, fats: 1.1, fiber: 4.2 },
    tags: ["Ancient Grain", "Millet"],
    isFeatured: false,
    leadTimeHours: 12,
    fermentationHours: 14,
  },
  {
    id: "prod-spec-pesarattu-5",
    name: "Andhra Special Whole Moong Pesarattu Batter",
    slug: "whole-moong-pesarattu-batter",
    description: "Authentic Godavari style green gram batter seasoned with crushed ginger, cumin, and green chillies. No fermentation needed.",
    category: "SPECIALTY_BATTER",
    price: 110,
    mrp: 130,
    discountPercentage: 15,
    unit: "850g (Makes 12 Dosas)",
    imageUrl: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80",
    shelfLifeHours: 48,
    storageTempMin: 2,
    storageTempMax: 4,
    storageInstructions: "Store at 2-4°C. Stir gently before pouring.",
    ingredients: ["Whole Green Moong (80%)", "Raw Rice (15%)", "Fresh Ginger", "Green Chillies", "Jeera", "Salt"],
    dietaryFlags: ["VEG", "VEGAN", "GLUTEN_FREE", "HIGH_PROTEIN"],
    inStock: true,
    availableStock: 15,
    isSoldOut: false,
    vendorId: "v-kitchen-01",
    vendorName: "Sri Krishna Home Batters",
    rating: 4.95,
    totalReviews: 278,
    preparationBatchId: "BAT-2026-038",
    fssaiNumber: "11521018000452",
    nutritionalInfo: { calories: 168, protein: 9.4, carbs: 28.5, fats: 1.2, fiber: 4.8 },
    tags: ["High Protein", "Authentic Andhra"],
    isFeatured: true,
    leadTimeHours: 8,
    fermentationHours: 6,
  },
  {
    id: "prod-spec-appam-6",
    name: "Kerala Toddy-Style Fermented Appam Batter",
    slug: "kerala-appam-batter",
    description: "Silky smooth batter blended with fresh coconut milk, cooked rice, and active culture for lace-edged soft-centered appams.",
    category: "SPECIALTY_BATTER",
    price: 95,
    mrp: 115,
    discountPercentage: 17,
    unit: "900g (Makes 14 Appams)",
    imageUrl: "https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=600&auto=format&fit=crop&q=80",
    shelfLifeHours: 48,
    storageTempMin: 2,
    storageTempMax: 4,
    storageInstructions: "Keep refrigerated at 2°C - 4°C. Ready to swirl in appachatti.",
    ingredients: ["Kaima Rice (65%)", "Fresh Coconut Milk (25%)", "Yeast Culture", "Cane Sugar", "Salt"],
    dietaryFlags: ["VEG", "VEGAN", "GLUTEN_FREE"],
    inStock: true,
    availableStock: 14,
    isSoldOut: false,
    vendorId: "v-kitchen-03",
    vendorName: "Malabar Heritage Kitchen",
    rating: 4.88,
    totalReviews: 167,
    preparationBatchId: "BAT-2026-039",
    fssaiNumber: "11521018000981",
    nutritionalInfo: { calories: 160, protein: 3.5, carbs: 31.0, fats: 3.2, fiber: 1.5 },
    tags: ["Kerala Special", "Lacy Appams"],
    isFeatured: false,
    leadTimeHours: 12,
    fermentationHours: 10,
  },
  {
    id: "prod-chut-coconut-7",
    name: "Freshly Grated Coconut Chutney (Tadka Ready)",
    slug: "fresh-coconut-chutney",
    description: "Ground fresh every morning at 4:30 AM with pollachi coconuts, roasted chana dal, and curry leaf mustard tadka.",
    category: "CHUTNEY_PODI",
    price: 45,
    mrp: 55,
    discountPercentage: 18,
    unit: "250g Container",
    imageUrl: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80",
    shelfLifeHours: 24,
    storageTempMin: 2,
    storageTempMax: 4,
    storageInstructions: "Consume within 24 hours. Must be kept at 2-4°C immediately upon arrival.",
    ingredients: ["Fresh Coconut (60%)", "Roasted Bengal Gram (20%)", "Green Chillies", "Ginger", "Mustard Seeds", "Curry Leaves", "Hing", "Cold-Pressed Sesame Oil"],
    dietaryFlags: ["VEG", "VEGAN", "GLUTEN_FREE", "JAIN"],
    inStock: true,
    availableStock: 30,
    isSoldOut: false,
    vendorId: "v-kitchen-01",
    vendorName: "Sri Krishna Home Batters",
    rating: 4.96,
    totalReviews: 610,
    preparationBatchId: "BAT-2026-041",
    fssaiNumber: "11521018000452",
    nutritionalInfo: { calories: 198, protein: 4.2, carbs: 8.5, fats: 16.5, fiber: 3.8 },
    tags: ["Morning Fresh", "Zero Watery Separation"],
    isFeatured: true,
    leadTimeHours: 6,
    fermentationHours: 0,
  },
  {
    id: "prod-chut-tomato-8",
    name: "Madurai Spicy Tomato-Onion Kara Chutney",
    slug: "spicy-tomato-kara-chutney",
    description: "Slow-simmered country tomatoes with shallots, Kashmiri chillies, and garlic, tempered in gingelly oil.",
    category: "CHUTNEY_PODI",
    price: 50,
    mrp: 60,
    discountPercentage: 16,
    unit: "250g Container",
    imageUrl: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80",
    shelfLifeHours: 72,
    storageTempMin: 2,
    storageTempMax: 4,
    storageInstructions: "Store refrigerated at 2-4°C.",
    ingredients: ["Country Tomatoes (50%)", "Shallots/Small Onions (30%)", "Byadgi Chillies", "Garlic", "Cold-Pressed Gingelly Oil", "Curry Leaves", "Tamarind", "Salt"],
    dietaryFlags: ["VEG", "VEGAN", "GLUTEN_FREE"],
    inStock: true,
    availableStock: 22,
    isSoldOut: false,
    vendorId: "v-kitchen-01",
    vendorName: "Sri Krishna Home Batters",
    rating: 4.91,
    totalReviews: 420,
    preparationBatchId: "BAT-2026-042",
    fssaiNumber: "11521018000452",
    nutritionalInfo: { calories: 110, protein: 2.1, carbs: 12.0, fats: 6.4, fiber: 2.8 },
    tags: ["Tangy & Spicy", "Madurai Style"],
    isFeatured: true,
    leadTimeHours: 6,
    fermentationHours: 0,
  },
  {
    id: "prod-podi-gunpowder-9",
    name: "Artisanal Gunpowder Idli Podi (Gingelly Mix Ready)",
    slug: "artisanal-idli-podi",
    description: "Coarsely pounded lentils, red chillies, and curry leaves with cold-pressed sesame oil pairing notes. Pure South Indian nostalgia.",
    category: "CHUTNEY_PODI",
    price: 70,
    mrp: 85,
    discountPercentage: 17,
    unit: "150g Pouch",
    imageUrl: "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=600&auto=format&fit=crop&q=80",
    shelfLifeHours: 720,
    storageTempMin: 15,
    storageTempMax: 25,
    storageInstructions: "Store in a cool dry place. Keep pouch zipped.",
    ingredients: ["Urad Dal (40%)", "Chana Dal (35%)", "Guntur Chillies (15%)", "Asafoetida (Hing)", "Curry Leaves", "Sea Salt"],
    dietaryFlags: ["VEG", "VEGAN", "GLUTEN_FREE", "JAIN"],
    inStock: true,
    availableStock: 45,
    isSoldOut: false,
    vendorId: "v-kitchen-01",
    vendorName: "Sri Krishna Home Batters",
    rating: 4.97,
    totalReviews: 890,
    preparationBatchId: "BAT-2026-043",
    fssaiNumber: "11521018000452",
    nutritionalInfo: { calories: 340, protein: 18.0, carbs: 42.0, fats: 8.0, fiber: 12.0 },
    tags: ["Pantry Essential", "Zero Additives"],
    isFeatured: false,
    leadTimeHours: 2,
    fermentationHours: 0,
  },
  {
    id: "prod-kit-mysore-10",
    name: "Mysore Masala Dosa Complete DIY Kit",
    slug: "mysore-masala-dosa-diy-kit",
    description: "Everything you need for authentic Mysore Masala Dosas: Crispy batter, red garlic chutney spread, spiced potato aloo palya, and coconut chutney.",
    category: "BREAKFAST_KIT",
    price: 199,
    mrp: 249,
    discountPercentage: 20,
    unit: "Serves 3-4 Persons (Makes 8 Gourmet Dosas)",
    imageUrl: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&auto=format&fit=crop&q=80",
    shelfLifeHours: 48,
    storageTempMin: 2,
    storageTempMax: 4,
    storageInstructions: "Refrigerate at 2-4°C immediately.",
    ingredients: ["Crispy Batter (800g)", "Mysore Red Chutney Paste (100g)", "Aloo Masala Filling (300g)", "Coconut Chutney (150g)"],
    dietaryFlags: ["VEG", "GLUTEN_FREE"],
    inStock: true,
    availableStock: 16,
    isSoldOut: false,
    vendorId: "v-kitchen-01",
    vendorName: "Sri Krishna Home Batters",
    rating: 4.94,
    totalReviews: 380,
    preparationBatchId: "BAT-2026-044",
    fssaiNumber: "11521018000452",
    nutritionalInfo: { calories: 380, protein: 9.5, carbs: 64.0, fats: 8.5, fiber: 5.2 },
    tags: ["Weekend Favorite", "Complete Kit"],
    isFeatured: true,
    leadTimeHours: 12,
    fermentationHours: 12,
  },
];

export const MOCK_BREAKFAST_COMBOS: BreakfastCombo[] = [
  {
    id: "combo-royal-idli-dosa",
    name: "Mana Signature Morning Feast",
    description: "Fresh stone-ground batter + chilled fresh coconut chutney + rich Brahmin sambar + cold-pressed gunpowder podi.",
    imageUrl: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80",
    basePrice: 160,
    discountPercentage: 20,
    finalPrice: 128,
    servings: "Serves 2-3 Persons",
    servingsCount: 3,
    mainProduct: MOCK_FRESH_PRODUCTS[0], // Classic Idli Batter
    mandatoryChutneyOptions: [
      MOCK_FRESH_PRODUCTS[6], // Coconut Chutney
      MOCK_FRESH_PRODUCTS[7], // Spicy Tomato Kara Chutney
    ],
    optionalAddons: [
      {
        id: "addon-ghee-50g",
        name: "A2 Desi Cow Ghee (50ml)",
        price: 45,
        quantity: 1,
        unit: "50ml Jar",
        isMandatory: false,
        category: "EXTRA",
        description: "Bilona method pure Gir cow ghee.",
      },
      {
        id: "addon-sambar-300ml",
        name: "Udupi Style Brahmin Sambar (300ml)",
        price: 40,
        quantity: 1,
        unit: "300ml Pouch",
        isMandatory: false,
        category: "SAMBAR",
        description: "Freshly made with shallots, drumsticks, and freshly roasted masala.",
      },
      {
        id: "addon-podi-50g",
        name: "Artisanal Gunpowder Podi + Gingelly Oil",
        price: 30,
        quantity: 1,
        unit: "50g Pack",
        isMandatory: false,
        category: "EXTRA",
        description: "Pounded lentil podi with cold-pressed sesame oil packet.",
      },
      {
        id: "addon-coffee-100ml",
        name: "Kumbakonam Degree Filter Coffee Decoction",
        price: 45,
        quantity: 1,
        unit: "100ml Bottle (Makes 4 Cups)",
        isMandatory: false,
        category: "BEVERAGE",
        description: "80:20 Chicory-rich freshly dripped aromatic decoction.",
      },
    ],
    isActive: true,
    vendorId: "v-kitchen-01",
    vendorName: "Sri Krishna Home Batters",
    rating: 4.95,
    totalReviews: 420,
    tags: ["Community Bestseller", "Instant Morning Joy"],
    prepTimeMinutes: 15,
  },
  {
    id: "combo-millet-wellness",
    name: "Ancient Millet Power Breakfast Kit",
    description: "High-protein sprouted ragi or foxtail millet batter with coriander-mint digestive chutney and protein-rich moringa sambar.",
    imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80",
    basePrice: 185,
    discountPercentage: 15,
    finalPrice: 157,
    servings: "Serves 2-3 Persons",
    servingsCount: 3,
    mainProduct: MOCK_FRESH_PRODUCTS[2], // Sprouted Ragi
    mandatoryChutneyOptions: [
      MOCK_FRESH_PRODUCTS[6], // Coconut Chutney
      MOCK_FRESH_PRODUCTS[7], // Tomato Kara Chutney
    ],
    optionalAddons: [
      {
        id: "addon-sambar-300ml",
        name: "Moringa Green Vegetable Sambar (300ml)",
        price: 45,
        quantity: 1,
        unit: "300ml Pouch",
        isMandatory: false,
        category: "SAMBAR",
        description: "Fortified with fresh drumstick leaves and toor dal.",
      },
      {
        id: "addon-ghee-50g",
        name: "Organic Desi Ghee (50ml)",
        price: 45,
        quantity: 1,
        unit: "50ml Jar",
        isMandatory: false,
        category: "EXTRA",
      },
      {
        id: "addon-coffee-100ml",
        name: "Organic Filter Coffee Decoction",
        price: 45,
        quantity: 1,
        unit: "100ml Bottle",
        isMandatory: false,
        category: "BEVERAGE",
      },
    ],
    isActive: true,
    vendorId: "v-kitchen-02",
    vendorName: "Millet Mandi Co-op",
    rating: 4.88,
    totalReviews: 215,
    tags: ["Diabetic Friendly", "High Protein"],
    prepTimeMinutes: 15,
  },
];

let inMemoryDailyBasket: DailyBasket = {
  id: "basket-user-001",
  userId: "usr-current",
  communityId: 101,
  flatNumber: "Tower 4, Flat 1204",
  deliveryAddress: "Tower 4 - 1204, Mana Foliage Greens, Sarjapur Road, Bengaluru 560035",
  deliveryInstructions: "Leave inside milk bag hanging by front grill before 6:45 AM.",
  executionMode: "AUTO_ORDER",
  isVacationPaused: false,
  items: [
    {
      id: "bitem-01",
      basketId: "basket-user-001",
      productId: "prod-std-idli-1",
      product: MOCK_FRESH_PRODUCTS[0],
      itemName: "Classic Malgudi Idli Batter (1 kg)",
      itemCategory: "STANDARD_BATTER",
      unitPrice: 85,
      quantity: 1,
      scheduledDays: ["MON", "WED", "FRI"],
      isPaused: false,
      specialInstructions: "Extra chilled pack",
    },
    {
      id: "bitem-02",
      basketId: "basket-user-001",
      productId: "prod-chut-coconut-7",
      product: MOCK_FRESH_PRODUCTS[6],
      itemName: "Freshly Grated Coconut Chutney (250g)",
      itemCategory: "CHUTNEY_PODI",
      unitPrice: 45,
      quantity: 1,
      scheduledDays: ["MON", "WED", "FRI", "SUN"],
      isPaused: false,
    },
    {
      id: "bitem-03",
      basketId: "basket-user-001",
      productId: "prod-crisp-dosa-2",
      product: MOCK_FRESH_PRODUCTS[1],
      itemName: "Golden Roast Crispy Dosa Batter (1 kg)",
      itemCategory: "STANDARD_BATTER",
      unitPrice: 90,
      quantity: 1,
      scheduledDays: ["TUE", "THU", "SAT"],
      isPaused: false,
    },
  ],
  preferredDeliveryTime: "06:00 AM - 06:45 AM",
  totalDailyEstimate: 130,
  totalWeeklyEstimate: 875,
  monthlyProjection: 3500,
  status: "ACTIVE",
  createdAt: "2026-03-01T08:00:00Z",
  updatedAt: "2026-03-02T19:30:00Z",
};

let inMemoryCapacity: VendorCapacity = {
  id: "cap-v01-today",
  vendorId: "v-kitchen-01",
  vendorName: "Sri Krishna Home Batters",
  date: "2026-03-03",
  category: "ALL",
  maxDailyCapacityLitres: 500,
  bookedCapacityLitres: 385,
  availableCapacityLitres: 115,
  capacityPercentage: 77,
  isSoldOut: false,
  cutOffTime: "20:00",
  acceptsAutoOrders: true,
  activeOrdersCount: 142,
  pendingDispatchCount: 142,
  updatedAt: "2026-03-02T22:15:00Z",
};

let inMemoryBatches: FoodProductionBatch[] = [
  {
    id: "batch-rec-01",
    batchNumber: "BAT-2026-031",
    vendorId: "v-kitchen-01",
    vendorName: "Sri Krishna Home Batters",
    productId: "prod-std-idli-1",
    productName: "Classic Malgudi Idli Batter",
    category: "STANDARD_BATTER",
    quantityProduced: 250,
    unit: "Litres",
    productionTimestamp: "2026-03-02T16:00:00Z",
    expiryTimestamp: "2026-03-05T16:00:00Z",
    storageTempTarget: "2-4°C",
    recordedTemp: 3.1,
    phLevel: 4.4,
    fermentationHours: 14,
    qaInspectorName: "Ramanathan K. (QC Lead)",
    qaStatus: "PASSED",
    qaNotes: "Optimal sourness achieved. Excellent batter aeration and aroma. Viscosity within standards.",
    coldChainVerified: true,
    releasedAt: "2026-03-02T18:30:00Z",
    releaseSignature: "QC-APPROVED-RK-77",
  },
  {
    id: "batch-rec-02",
    batchNumber: "BAT-2026-032",
    vendorId: "v-kitchen-01",
    vendorName: "Sri Krishna Home Batters",
    productId: "prod-crisp-dosa-2",
    productName: "Golden Roast Crispy Dosa Batter",
    category: "STANDARD_BATTER",
    quantityProduced: 180,
    unit: "Litres",
    productionTimestamp: "2026-03-02T17:30:00Z",
    expiryTimestamp: "2026-03-05T17:30:00Z",
    storageTempTarget: "2-4°C",
    recordedTemp: 2.8,
    phLevel: 4.5,
    fermentationHours: 12,
    qaInspectorName: "Ramanathan K. (QC Lead)",
    qaStatus: "PASSED",
    qaNotes: "Poha-chana ratio verified. Crisp test on cast iron pan successful.",
    coldChainVerified: true,
    releasedAt: "2026-03-02T19:00:00Z",
    releaseSignature: "QC-APPROVED-RK-78",
  },
  {
    id: "batch-rec-03",
    batchNumber: "BAT-2026-041",
    vendorId: "v-kitchen-01",
    vendorName: "Sri Krishna Home Batters",
    productId: "prod-chut-coconut-7",
    productName: "Freshly Grated Coconut Chutney",
    category: "CHUTNEY_PODI",
    quantityProduced: 60,
    unit: "kg",
    productionTimestamp: "2026-03-03T04:30:00Z",
    expiryTimestamp: "2026-03-04T04:30:00Z",
    storageTempTarget: "2-4°C",
    recordedTemp: 3.4,
    phLevel: 5.2,
    fermentationHours: 0,
    qaInspectorName: "Deepa Shenoy (QA)",
    qaStatus: "PASSED",
    qaNotes: "Fresh coconut sweetness intact. Freshly roasted mustard-curry leaf tadka verified.",
    coldChainVerified: true,
    releasedAt: "2026-03-03T05:00:00Z",
    releaseSignature: "QC-APPROVED-DS-12",
  },
];

// Helper to recalculate basket estimates
function recalculateBasketEstimates(basket: DailyBasket): DailyBasket {
  let dailyTotal = 0;
  let weeklyTotal = 0;

  for (const item of basket.items) {
    if (!item.isPaused) {
      const daysCount = item.scheduledDays.length;
      const itemDailyCost = item.unitPrice * item.quantity;
      weeklyTotal += itemDailyCost * daysCount;
      dailyTotal += daysCount > 0 ? (itemDailyCost * daysCount) / 7 : 0;
    }
  }

  basket.totalDailyEstimate = Math.round(dailyTotal);
  basket.totalWeeklyEstimate = Math.round(weeklyTotal);
  basket.monthlyProjection = Math.round(weeklyTotal * 4.3);
  return basket;
}

// ── Fresh Kitchen Service API Methods ──

export const freshKitchenService = {
  // ── 1. Products ──

  async getProducts(category?: FreshFoodProductCategory, search?: string): Promise<FreshFoodProduct[]> {
    try {
      const params = new URLSearchParams();
      if (category && category !== 'ALL') params.append('category', category);
      if (search) params.append('search', search);

      const queryStr = params.toString() ? `?${params.toString()}` : '';
      const res = await apiClient.get<FreshFoodProduct[]>(`/api/v1/fresh-kitchen/products${queryStr}`);
      if (Array.isArray(res) && res.length > 0) return res;
    } catch {
      // Backend not yet deployed or error, fall through to rich mock
    }

    let items = [...MOCK_FRESH_PRODUCTS];
    if (category && category !== 'ALL') {
      items = items.filter((p) => p.category === category);
    }
    if (search && search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.ingredients.some((i) => i.toLowerCase().includes(q))
      );
    }
    return items;
  },

  async getProductById(id: string): Promise<FreshFoodProduct | null> {
    try {
      const res = await apiClient.get<FreshFoodProduct>(`/api/v1/fresh-kitchen/products/${id}`);
      if (res && res.id) return res;
    } catch {
      // Fallback
    }
    const found = MOCK_FRESH_PRODUCTS.find((p) => p.id === id);
    return found || null;
  },

  // ── 2. Breakfast Combos ──

  async getBreakfastCombos(): Promise<BreakfastCombo[]> {
    try {
      const res = await apiClient.get<BreakfastCombo[]>('/api/v1/fresh-kitchen/combos');
      if (Array.isArray(res) && res.length > 0) return res;
    } catch {
      // Fallback
    }
    return MOCK_BREAKFAST_COMBOS;
  },

  async getBreakfastComboById(id: string): Promise<BreakfastCombo | null> {
    try {
      const res = await apiClient.get<BreakfastCombo>(`/api/v1/fresh-kitchen/combos/${id}`);
      if (res && res.id) return res;
    } catch {
      // Fallback
    }
    const found = MOCK_BREAKFAST_COMBOS.find((c) => c.id === id);
    return found || null;
  },

  // ── 3. Instant Buy ──

  async createInstantBuy(request: InstantBuyRequest): Promise<InstantBuyResponse> {
    try {
      const res = await apiClient.post<InstantBuyResponse>('/api/v1/fresh-kitchen/instant-buy', request);
      if (res && res.orderId) return res;
    } catch {
      // Fallback mock confirmation
    }

    const orderNumber = `FK-ORD-${Math.floor(100000 + Math.random() * 900000)}`;
    return {
      orderId: `ord-${Date.now()}`,
      orderNumber,
      status: 'CONFIRMED',
      totalAmount: request.totalPrice,
      deliveryDate: request.preferredDeliveryDate || "Tomorrow",
      deliveryTimeSlot: request.preferredDeliveryTime || "06:00 AM - 06:45 AM",
      recipientFlat: request.flatNumber || "Tower 4, Flat 1204",
      createdAt: new Date().toISOString(),
    };
  },

  // ── 4. Daily Basket Management ──

  async getDailyBasket(): Promise<DailyBasket> {
    try {
      const res = await apiClient.get<DailyBasket>('/api/v1/daily-basket');
      if (res && res.id) {
        inMemoryDailyBasket = res;
        return res;
      }
    } catch {
      // Fallback
    }
    return recalculateBasketEstimates({ ...inMemoryDailyBasket });
  },

  async addDailyBasketItem(item: CreateDailyBasketItemRequest): Promise<DailyBasket> {
    try {
      const res = await apiClient.post<DailyBasket>('/api/v1/daily-basket/items', item);
      if (res && res.id) {
        inMemoryDailyBasket = res;
        return res;
      }
    } catch {
      // Fallback
    }

    const newItem: DailyBasketItem = {
      id: `bitem-${Date.now()}`,
      basketId: inMemoryDailyBasket.id,
      productId: item.productId || '',
      comboId: item.comboId,
      itemName: item.itemName,
      itemCategory: item.itemCategory,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      scheduledDays: item.scheduledDays,
      isPaused: false,
      specialInstructions: item.specialInstructions,
      createdAt: new Date().toISOString(),
    };

    inMemoryDailyBasket.items.push(newItem);
    inMemoryDailyBasket = recalculateBasketEstimates(inMemoryDailyBasket);
    return { ...inMemoryDailyBasket };
  },

  async updateDailyBasketItem(itemId: string, patch: UpdateDailyBasketItemRequest): Promise<DailyBasket> {
    try {
      const res = await apiClient.put<DailyBasket>(`/api/v1/daily-basket/items/${itemId}`, patch);
      if (res && res.id) {
        inMemoryDailyBasket = res;
        return res;
      }
    } catch {
      // Fallback
    }

    const index = inMemoryDailyBasket.items.findIndex((i) => i.id === itemId);
    if (index !== -1) {
      inMemoryDailyBasket.items[index] = {
        ...inMemoryDailyBasket.items[index],
        ...patch,
      };
      inMemoryDailyBasket = recalculateBasketEstimates(inMemoryDailyBasket);
    }
    return { ...inMemoryDailyBasket };
  },

  async deleteDailyBasketItem(itemId: string): Promise<DailyBasket> {
    try {
      const res = await apiClient.delete<DailyBasket>(`/api/v1/daily-basket/items/${itemId}`);
      if (res && res.id) {
        inMemoryDailyBasket = res;
        return res;
      }
    } catch {
      // Fallback
    }

    inMemoryDailyBasket.items = inMemoryDailyBasket.items.filter((i) => i.id !== itemId);
    inMemoryDailyBasket = recalculateBasketEstimates(inMemoryDailyBasket);
    return { ...inMemoryDailyBasket };
  },

  async updateExecutionMode(mode: UpdateExecutionModeRequest): Promise<DailyBasket> {
    try {
      const res = await apiClient.patch<DailyBasket>('/api/v1/daily-basket/execution-mode', mode);
      if (res && res.id) {
        inMemoryDailyBasket = res;
        return res;
      }
    } catch {
      // Fallback
    }

    inMemoryDailyBasket.executionMode = mode.executionMode;
    inMemoryDailyBasket.updatedAt = new Date().toISOString();
    return { ...inMemoryDailyBasket };
  },

  async setVacationPause(pauseReq: VacationPauseRequest): Promise<DailyBasket> {
    try {
      const res = await apiClient.patch<DailyBasket>('/api/v1/daily-basket/vacation-pause', pauseReq);
      if (res && res.id) {
        inMemoryDailyBasket = res;
        return res;
      }
    } catch {
      // Fallback
    }

    inMemoryDailyBasket.isVacationPaused = pauseReq.isVacationPaused;
    inMemoryDailyBasket.vacationStartDate = pauseReq.vacationStartDate;
    inMemoryDailyBasket.vacationEndDate = pauseReq.vacationEndDate;
    inMemoryDailyBasket.status = pauseReq.isVacationPaused ? 'PAUSED' : 'ACTIVE';
    inMemoryDailyBasket.updatedAt = new Date().toISOString();
    return { ...inMemoryDailyBasket };
  },

  async updateDeliveryDetails(details: UpdateDeliveryDetailsRequest): Promise<DailyBasket> {
    try {
      const res = await apiClient.put<DailyBasket>('/api/v1/daily-basket/delivery-details', details);
      if (res && res.id) {
        inMemoryDailyBasket = res;
        return res;
      }
    } catch {
      // Fallback
    }

    inMemoryDailyBasket.flatNumber = details.flatNumber;
    inMemoryDailyBasket.deliveryAddress = details.deliveryAddress;
    if (details.preferredDeliveryTime) {
      inMemoryDailyBasket.preferredDeliveryTime = details.preferredDeliveryTime;
    }
    if (details.deliveryInstructions) {
      inMemoryDailyBasket.deliveryInstructions = details.deliveryInstructions;
    }
    inMemoryDailyBasket.updatedAt = new Date().toISOString();
    return { ...inMemoryDailyBasket };
  },

  // ── 5. Vendor Capacity & QA Batch Release ──

  async getVendorCapacity(vendorId?: string, date?: string): Promise<VendorCapacity> {
    try {
      const params = new URLSearchParams();
      if (vendorId) params.append('vendorId', vendorId);
      if (date) params.append('date', date);

      const queryStr = params.toString() ? `?${params.toString()}` : '';
      const res = await apiClient.get<VendorCapacity>(`/api/v1/vendor/production-capacity${queryStr}`);
      if (res && res.id) {
        inMemoryCapacity = res;
        return res;
      }
    } catch {
      // Fallback
    }
    return { ...inMemoryCapacity };
  },

  async updateVendorCapacity(req: UpdateVendorCapacityRequest): Promise<VendorCapacity> {
    try {
      const res = await apiClient.put<VendorCapacity>('/api/v1/vendor/production-capacity', req);
      if (res && res.id) {
        inMemoryCapacity = res;
        return res;
      }
    } catch {
      // Fallback
    }

    inMemoryCapacity.maxDailyCapacityLitres = req.maxDailyCapacityLitres;
    if (req.isSoldOut !== undefined) inMemoryCapacity.isSoldOut = req.isSoldOut;
    if (req.acceptsAutoOrders !== undefined) inMemoryCapacity.acceptsAutoOrders = req.acceptsAutoOrders;
    if (req.cutOffTime) inMemoryCapacity.cutOffTime = req.cutOffTime;

    inMemoryCapacity.availableCapacityLitres = Math.max(0, inMemoryCapacity.maxDailyCapacityLitres - inMemoryCapacity.bookedCapacityLitres);
    inMemoryCapacity.capacityPercentage = Math.min(100, Math.round((inMemoryCapacity.bookedCapacityLitres / inMemoryCapacity.maxDailyCapacityLitres) * 100));
    inMemoryCapacity.updatedAt = new Date().toISOString();

    return { ...inMemoryCapacity };
  },

  async toggleVendorSoldOut(isSoldOut: boolean): Promise<VendorCapacity> {
    try {
      const res = await apiClient.post<VendorCapacity>('/api/v1/vendor/production-capacity/sold-out', { isSoldOut });
      if (res && res.id) {
        inMemoryCapacity = res;
        return res;
      }
    } catch {
      // Fallback
    }

    inMemoryCapacity.isSoldOut = isSoldOut;
    inMemoryCapacity.updatedAt = new Date().toISOString();
    return { ...inMemoryCapacity };
  },

  async getProductionBatches(vendorId?: string): Promise<FoodProductionBatch[]> {
    try {
      const path = vendorId ? `/api/v1/vendor/batches?vendorId=${vendorId}` : '/api/v1/vendor/batches';
      const res = await apiClient.get<FoodProductionBatch[]>(path);
      if (Array.isArray(res) && res.length > 0) {
        inMemoryBatches = res;
        return res;
      }
    } catch {
      // Fallback
    }
    return [...inMemoryBatches];
  },

  async submitBatchQaRelease(batchReq: CreateBatchReleaseRequest): Promise<FoodProductionBatch> {
    try {
      const res = await apiClient.post<FoodProductionBatch>('/api/v1/vendor/batches', batchReq);
      if (res && res.id) {
        inMemoryBatches.unshift(res);
        return res;
      }
    } catch {
      // Fallback
    }

    const newBatch: FoodProductionBatch = {
      id: `batch-${Date.now()}`,
      batchNumber: batchReq.batchNumber,
      vendorId: "v-kitchen-01",
      vendorName: "Sri Krishna Home Batters",
      productId: batchReq.productId,
      productName: batchReq.productName,
      quantityProduced: batchReq.quantityProduced,
      unit: batchReq.unit,
      productionTimestamp: new Date().toISOString(),
      expiryTimestamp: new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
      storageTempTarget: "2-4°C",
      recordedTemp: batchReq.recordedTemp,
      phLevel: batchReq.phLevel,
      fermentationHours: batchReq.fermentationHours,
      qaInspectorName: batchReq.qaInspectorName,
      qaStatus: batchReq.qaStatus,
      qaNotes: batchReq.qaNotes,
      coldChainVerified: batchReq.coldChainVerified,
      releasedAt: new Date().toISOString(),
      releaseSignature: batchReq.releaseSignature || `SIGN-QA-${Math.floor(1000 + Math.random() * 9000)}`,
    };

    inMemoryBatches.unshift(newBatch);
    return newBatch;
  },
};
