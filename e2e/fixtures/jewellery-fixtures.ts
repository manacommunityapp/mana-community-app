import { type Page, type Route } from "@playwright/test";

// ── Mock Data Models ─────────────────────────────────────────────────────────

export interface MockJewelleryProduct {
  id: string;
  vendorId: string;
  vendorName: string;
  name: string;
  category: "EARRINGS" | "NECKLACE" | "RING" | "BANGLE" | "BRACELET" | "MAANG_TIKKA" | "PENDANT";
  material: "GOLD" | "DIAMOND" | "SILVER" | "ARTIFICIAL" | "GEMSTONE";
  purity: string;
  netWeightG: number;
  totalPrice: number;
  goldRatePerGram?: number;
  makingCharges?: number;
  stoneCost?: number;
  gstPercent?: number;
  stockQuantity: number;
  status: "ACTIVE" | "OUT_OF_STOCK" | "DRAFT";
  isWishlisted?: boolean;
  huid?: string;
  imageUrls: string[];
  tryOnAssetUrl?: string;
  description?: string;
}

export interface MockJewelleryVendor {
  id: string;
  shopName: string;
  ownerName: string;
  phoneNumber: string;
  email: string;
  address: string;
  serviceAreas?: string;
  specialties?: string;
  bisHallmarkLicense: string;
  rating: number;
  reviewCount: number;
  openHours: string;
  isVerified: boolean;
  distance?: string;
  imageUrl?: string;
}

export interface MockAppointment {
  id: string;
  vendorId: string;
  vendorName: string;
  shopAddress: string;
  date: string;
  time: string;
  purpose: string;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
  notes?: string;
  cancellationReason?: string;
}

export interface MockFitProfile {
  faceShape: "round" | "oval" | "square" | "heart" | "oblong" | "unknown";
  widthRatio: number;
  neckRatio?: number | null;
  confidence: number;
}

export interface MockRecommendation {
  productId: number;
  name: string;
  price: number;
  score: number;
  reason: string;
}

// ── Seed Mock Data ───────────────────────────────────────────────────────────

export const MOCK_JEWELLERY_VENDORS: MockJewelleryVendor[] = [
  {
    id: "101",
    shopName: "Kalyan Jewellers Heritage",
    ownerName: "T.S. Kalyanaraman",
    phoneNumber: "+919876543210",
    email: "heritage@kalyanjewellers.test",
    address: "Shop 4, Gold Souk Mall, MG Road, Bengaluru",
    serviceAreas: "Bengaluru, Mysuru",
    specialties: "Temple Jewellery, Antique Kundan, Bridal Chokers",
    bisHallmarkLicense: "HM-KA-88912-2024",
    rating: 4.8,
    reviewCount: 342,
    openHours: "10:00 AM - 08:30 PM",
    isVerified: true,
    distance: "1.2 km away",
    imageUrl: "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=600",
  },
  {
    id: "102",
    shopName: "Tanishq Flagship Studio",
    ownerName: " Titan Company Ltd",
    phoneNumber: "+919876543211",
    email: "indiranagar@tanishq.test",
    address: "100ft Road, Indiranagar, Bengaluru",
    serviceAreas: "Bengaluru East",
    specialties: "Diamond Solitaires, Polki Sets, Everyday Modern Gold",
    bisHallmarkLicense: "HM-KA-77210-2023",
    rating: 4.9,
    reviewCount: 512,
    openHours: "10:30 AM - 09:00 PM",
    isVerified: true,
    distance: "2.8 km away",
    imageUrl: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600",
  },
];

export const MOCK_JEWELLERY_PRODUCTS: MockJewelleryProduct[] = [
  {
    id: "201",
    vendorId: "101",
    vendorName: "Kalyan Jewellers Heritage",
    name: "Royal Peacock Jhumkas with Ruby Accents",
    category: "EARRINGS",
    material: "GOLD",
    purity: "22K (916)",
    netWeightG: 18.45,
    goldRatePerGram: 6850,
    makingCharges: 8500,
    stoneCost: 4200,
    gstPercent: 3.0,
    totalPrice: 143242,
    stockQuantity: 4,
    status: "ACTIVE",
    isWishlisted: false,
    huid: "K22M9981A",
    imageUrls: [
      "https://images.unsplash.com/photo-1635767798638-3e25273a8236?w=600",
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600",
    ],
    tryOnAssetUrl: "https://cdn.manacommunity.test/tryon/assets/earrings-201-ar.png",
    description: "Handcrafted 22K temple jhumkas featuring filigree peacock motifs and natural Burmese rubies.",
  },
  {
    id: "202",
    vendorId: "101",
    vendorName: "Kalyan Jewellers Heritage",
    name: "Maharani Polki & Emerald Bridal Choker",
    category: "NECKLACE",
    material: "GOLD",
    purity: "22K (916)",
    netWeightG: 62.8,
    goldRatePerGram: 6850,
    makingCharges: 32000,
    stoneCost: 48000,
    gstPercent: 3.0,
    totalPrice: 525484,
    stockQuantity: 2,
    status: "ACTIVE",
    isWishlisted: true,
    huid: "K22N4419B",
    imageUrls: [
      "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600",
    ],
    tryOnAssetUrl: "https://cdn.manacommunity.test/tryon/assets/necklace-202-ar.png",
    description: "Grand bridal necklace handcrafted in pure gold with uncut diamonds (polki) and Zambian emerald beads.",
  },
  {
    id: "203",
    vendorId: "102",
    vendorName: "Tanishq Flagship Studio",
    name: "Celestial Solitaire Diamond Ring",
    category: "RING",
    material: "DIAMOND",
    purity: "18K Gold + VVS1 Diamond",
    netWeightG: 4.2,
    goldRatePerGram: 5600,
    makingCharges: 6000,
    stoneCost: 85000,
    gstPercent: 3.0,
    totalPrice: 118018,
    stockQuantity: 7,
    status: "ACTIVE",
    isWishlisted: false,
    huid: "T18R1122C",
    imageUrls: [
      "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600",
    ],
    tryOnAssetUrl: "https://cdn.manacommunity.test/tryon/assets/ring-203-ar.png",
    description: "0.75 carat round brilliant-cut solitaire set on an 18K white-and-rose gold cathedral band.",
  },
  {
    id: "204",
    vendorId: "101",
    vendorName: "Kalyan Jewellers Heritage",
    name: "Classic Nakshi Antique Gold Bangles (Pair)",
    category: "BANGLE",
    material: "GOLD",
    purity: "22K (916)",
    netWeightG: 48.0,
    goldRatePerGram: 6850,
    makingCharges: 21000,
    totalPrice: 360294,
    stockQuantity: 0,
    status: "OUT_OF_STOCK",
    isWishlisted: false,
    huid: "K22B7711D",
    imageUrls: [
      "https://images.unsplash.com/photo-1611591475870-8b43171f11a8?w=600",
    ],
    description: "Intricately carved Nakshi bangles with screw clasps. Out of stock - pre-orders available.",
  },
];

export const MOCK_TIME_SLOTS = [
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "02:00 PM",
  "03:00 PM",
  "04:00 PM",
  "05:00 PM",
];

export const MOCK_APPOINTMENTS: MockAppointment[] = [
  {
    id: "301",
    vendorId: "101",
    vendorName: "Kalyan Jewellers Heritage",
    shopAddress: "Shop 4, Gold Souk Mall, MG Road, Bengaluru",
    date: "2026-11-05",
    time: "03:00 PM",
    purpose: "BRIDAL",
    status: "CONFIRMED",
    notes: "Reviewing bridal choker and matching earrings.",
  },
  {
    id: "302",
    vendorId: "102",
    vendorName: "Tanishq Flagship Studio",
    shopAddress: "100ft Road, Indiranagar, Bengaluru",
    date: "2026-10-15",
    time: "11:00 AM",
    purpose: "VALUATION",
    status: "COMPLETED",
    notes: "Old family gold exchange assessment.",
  },
];

export const MOCK_RECOMMENDATIONS: MockRecommendation[] = [
  {
    productId: 201,
    name: "Royal Peacock Jhumkas with Ruby Accents",
    price: 143242,
    score: 2.0,
    reason: "Suits your proportions (elongates round face shape)",
  },
  {
    productId: 202,
    name: "Maharani Polki & Emerald Bridal Choker",
    price: 525484,
    score: 1.5,
    reason: "Balances neckline and collar proportions",
  },
];

// ── Mock Route Handlers ──────────────────────────────────────────────────────

export async function mockJewelleryCatalogueRoutes(page: Page): Promise<void> {
  // GET /api/jewellery/products
  await page.route("**/api/jewellery/products**", async (route: Route) => {
    const url = new URL(route.request().url());
    const category = url.searchParams.get("category");
    const material = url.searchParams.get("material");
    const search = url.searchParams.get("search")?.toLowerCase();
    const vendorId = url.searchParams.get("vendorId");

    let filtered = [...MOCK_JEWELLERY_PRODUCTS];
    if (vendorId) filtered = filtered.filter((p) => p.vendorId === vendorId);
    if (category && category !== "ALL") filtered = filtered.filter((p) => p.category === category);
    if (material && material !== "ALL") filtered = filtered.filter((p) => p.material === material);
    if (search) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(search) ||
          p.description?.toLowerCase().includes(search) ||
          p.category.toLowerCase().includes(search)
      );
    }
    await route.fulfill({ status: 200, json: filtered });
  });

  // GET /api/jewellery/products/featured
  await page.route("**/api/jewellery/products/featured", async (route: Route) => {
    await route.fulfill({ status: 200, json: MOCK_JEWELLERY_PRODUCTS.slice(0, 3) });
  });

  // GET /api/jewellery/products/:id
  await page.route(/\/api\/jewellery\/products\/\d+$/, async (route: Route) => {
    const segments = route.request().url().split("/");
    const id = segments[segments.length - 1];
    const product = MOCK_JEWELLERY_PRODUCTS.find((p) => p.id === id);
    if (product) {
      await route.fulfill({ status: 200, json: product });
    } else {
      await route.fulfill({ status: 404, json: { message: "Product not found" } });
    }
  });
}

export async function mockJewelleryVendorRoutes(page: Page): Promise<void> {
  // GET /api/jewellery/vendors/nearby
  await page.route("**/api/jewellery/vendors/nearby**", async (route: Route) => {
    await route.fulfill({ status: 200, json: MOCK_JEWELLERY_VENDORS });
  });

  // GET /api/jewellery/vendors/:id/available-slots
  await page.route(/\/api\/jewellery\/vendors\/\d+\/available-slots/, async (route: Route) => {
    await route.fulfill({ status: 200, json: MOCK_TIME_SLOTS.slice(1, 6) }); // simulates some booked slots
  });

  // GET /api/jewellery/vendors/:id
  await page.route(/\/api\/jewellery\/vendors\/\d+$/, async (route: Route) => {
    const segments = route.request().url().split("/");
    const id = segments[segments.length - 1];
    const vendor = MOCK_JEWELLERY_VENDORS.find((v) => v.id === id);
    if (vendor) {
      await route.fulfill({ status: 200, json: vendor });
    } else {
      await route.fulfill({ status: 404, json: { message: "Vendor not found" } });
    }
  });
}

export async function mockJewelleryTryOnRoutes(page: Page): Promise<void> {
  let photoJobState: "QUEUED" | "PROCESSING" | "COMPLETED" = "QUEUED";

  // POST /api/jewellery/try-on/uploads
  await page.route("**/api/jewellery/try-on/uploads", async (route: Route) => {
    await route.fulfill({
      status: 200,
      json: {
        sessionId: "sess-uuid-4412-9988",
        presignedUploadUrl: "https://s3.ap-south-1.amazonaws.com/mana-media/mock-upload",
        httpMethod: "PUT",
        s3Key: "marketplace/jewellery-tryon/test-user-photo-1001.jpg",
        contentType: "image/jpeg",
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      },
    });
  });

  // Mock S3 direct PUT upload
  await page.route("https://s3.ap-south-1.amazonaws.com/mana-media/mock-upload**", async (route: Route) => {
    await route.fulfill({ status: 200, body: "" });
  });

  // POST /api/jewellery/try-on/sessions
  await page.route("**/api/jewellery/try-on/sessions", async (route: Route) => {
    await route.fulfill({
      status: 200,
      json: {
        id: "sess-8899",
        productId: "201",
        mode: "PHOTO",
        platform: "web",
        status: "ACTIVE",
        startedAt: new Date().toISOString(),
      },
    });
  });

  // POST /api/jewellery/try-on/sessions/:id/photo-jobs
  await page.route(/\/api\/jewellery\/try-on\/sessions\/.*\/photo-jobs/, async (route: Route) => {
    photoJobState = "QUEUED";
    await route.fulfill({
      status: 200,
      json: {
        id: "job-7711",
        status: "QUEUED",
        createdAt: new Date().toISOString(),
      },
    });
  });

  // GET /api/jewellery/try-on/photo-jobs/:id
  await page.route(/\/api\/jewellery\/try-on\/photo-jobs\/\w+/, async (route: Route) => {
    if (photoJobState === "QUEUED") {
      photoJobState = "PROCESSING";
      await route.fulfill({
        status: 200,
        json: { id: "job-7711", status: "PROCESSING", createdAt: new Date().toISOString() },
      });
    } else {
      photoJobState = "COMPLETED";
      await route.fulfill({
        status: 200,
        json: {
          id: "job-7711",
          status: "COMPLETED",
          outputUrl: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600",
          createdAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
        },
      });
    }
  });

  // DELETE /api/jewellery/try-on/photos/:id
  await page.route(/\/api\/jewellery\/try-on\/photos\/\d+/, async (route: Route) => {
    await route.fulfill({ status: 204 });
  });
}

export async function mockJewelleryAppointmentsRoutes(page: Page): Promise<void> {
  const appointments = [...MOCK_APPOINTMENTS];

  // GET /api/jewellery/appointments
  await page.route("**/api/jewellery/appointments", async (route: Route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({ status: 200, json: appointments });
    } else if (route.request().method() === "POST") {
      const body = route.request().postDataJSON();
      const newAppt: MockAppointment = {
        id: String(Date.now()),
        vendorId: String(body.vendorId),
        vendorName: "Kalyan Jewellers Heritage",
        shopAddress: "Shop 4, Gold Souk Mall, MG Road, Bengaluru",
        date: body.date,
        time: body.time,
        purpose: body.purpose,
        status: "PENDING",
        notes: body.notes,
      };
      appointments.unshift(newAppt);
      await route.fulfill({ status: 200, json: newAppt });
    }
  });

  // PATCH /api/jewellery/appointments/:id/cancel
  await page.route(/\/api\/jewellery\/appointments\/\d+\/cancel/, async (route: Route) => {
    await route.fulfill({ status: 204 });
  });

  // GET /api/jewellery/vendor/appointments
  await page.route("**/api/jewellery/vendor/appointments", async (route: Route) => {
    await route.fulfill({ status: 200, json: appointments });
  });

  // PATCH /api/jewellery/vendor/appointments/:id/status
  await page.route(/\/api\/jewellery\/vendor\/appointments\/\d+\/status/, async (route: Route) => {
    await route.fulfill({ status: 204 });
  });
}

export async function mockJewelleryWishlistRoutes(page: Page): Promise<void> {
  const wishlist = [
    {
      id: "w-1",
      productId: "202",
      product: MOCK_JEWELLERY_PRODUCTS[1],
      savedAt: new Date().toISOString(),
    },
  ];

  // GET & POST /api/jewellery/wishlist
  await page.route("**/api/jewellery/wishlist", async (route: Route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({ status: 200, json: wishlist });
    } else if (route.request().method() === "POST") {
      const body = route.request().postDataJSON();
      const prod = MOCK_JEWELLERY_PRODUCTS.find((p) => p.id === String(body.productId));
      if (prod) {
        wishlist.push({ id: `w-${Date.now()}`, productId: prod.id, product: prod, savedAt: new Date().toISOString() });
      }
      await route.fulfill({ status: 200, json: { success: true } });
    }
  });

  // DELETE /api/jewellery/wishlist/:id
  await page.route(/\/api\/jewellery\/wishlist\/\d+/, async (route: Route) => {
    await route.fulfill({ status: 204 });
  });
}

export async function mockJewelleryFitProfileRoutes(page: Page): Promise<void> {
  let profile: MockFitProfile | null = {
    faceShape: "round",
    widthRatio: 0.88,
    neckRatio: 0.62,
    confidence: 0.95,
  };

  // PUT /api/jewellery/fit-profile
  await page.route("**/api/jewellery/fit-profile", async (route: Route) => {
    if (route.request().method() === "PUT") {
      profile = route.request().postDataJSON();
      await route.fulfill({ status: 204 });
    } else if (route.request().method() === "GET") {
      if (profile) {
        await route.fulfill({ status: 200, json: profile });
      } else {
        await route.fulfill({ status: 204 });
      }
    } else if (route.request().method() === "DELETE") {
      profile = null;
      await route.fulfill({ status: 204 });
    }
  });

  // GET /api/jewellery/recommendations
  await page.route("**/api/jewellery/recommendations**", async (route: Route) => {
    if (profile) {
      await route.fulfill({ status: 200, json: MOCK_RECOMMENDATIONS });
    } else {
      await route.fulfill({ status: 204 });
    }
  });
}

export async function mockAllJewelleryRoutes(page: Page): Promise<void> {
  await mockJewelleryCatalogueRoutes(page);
  await mockJewelleryVendorRoutes(page);
  await mockJewelleryTryOnRoutes(page);
  await mockJewelleryAppointmentsRoutes(page);
  await mockJewelleryWishlistRoutes(page);
  await mockJewelleryFitProfileRoutes(page);
}
