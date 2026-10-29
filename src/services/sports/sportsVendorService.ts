import { apiClient } from "../common/apiClient";
import type {
  SportsFacility,
  SportsCourtConfig,
  SportsPricingRule,
  SportsCourtSlot,
  SportsVendorBooking,
  SportsVendorDashboardStats,
} from "../../types/sportsVendor";

const STORAGE_KEY_FACILITIES = "mana_sports_vendor_facilities_v1";
const STORAGE_KEY_COURTS = "mana_sports_vendor_courts_v1";
const STORAGE_KEY_PRICING = "mana_sports_vendor_pricing_v1";
const STORAGE_KEY_BOOKINGS = "mana_sports_vendor_bookings_v1";

const INITIAL_FACILITIES: SportsFacility[] = [
  {
    id: "fac-1",
    vendorId: "vendor-sp-101",
    vendorName: "SmashZone Badminton Arena",
    name: "SmashZone Arena - Whitefield",
    description: "Premier 6-court indoor badminton facility with professional synthetic BWF-approved flooring, high-intensity LED lighting, and shower amenities.",
    address: "ITPL Main Road, Near Hope Farm Junction",
    city: "Bangalore",
    area: "Whitefield",
    pinCode: "560066",
    contactPhone: "+91 98450 12345",
    contactEmail: "whitefield@smashzone.com",
    mapLink: "https://maps.google.com/?q=Whitefield+Bangalore",
    openingTime: "06:00",
    closingTime: "23:00",
    images: [
      "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=800&auto=format&fit=crop&q=80"
    ],
    amenities: ["BWF Mats", "LED Lighting", "Shower & Lockers", "Drinking Water", "Racquet Stringing", "Cafeteria", "Parking"],
    isFederated: true,
    partnerCommunities: ["Prestige Shantiniketan", "Sobha Rose", "Brigade Cosmopolis"],
    rating: 4.8,
    totalReviews: 124,
    courtsCount: 4,
    status: "ACTIVE",
    createdAt: "2026-01-15T10:00:00.000Z"
  },
  {
    id: "fac-2",
    vendorId: "vendor-sp-102",
    vendorName: "Apex Turf & Box Cricket Hub",
    name: "Apex Sports Arena - Sarjapur",
    description: "FIFA-grade artificial turf for 7v7 football and floodlit box cricket with high netting, dugout seating, and live broadcast cameras.",
    address: "Doddakannelli, Sarjapur Road",
    city: "Bangalore",
    area: "Sarjapur",
    pinCode: "560035",
    contactPhone: "+91 99001 54321",
    contactEmail: "support@apexturf.in",
    mapLink: "https://maps.google.com/?q=Sarjapur+Bangalore",
    openingTime: "05:00",
    closingTime: "00:00",
    images: [
      "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=80"
    ],
    amenities: ["FIFA Turf", "High-Mast Floodlights", "Dugouts", "Ball & Bib Rentals", "Free Parking", "First Aid"],
    isFederated: true,
    partnerCommunities: ["SJR Watermark", "Bren Edgewater", "Rohan Iksha"],
    rating: 4.7,
    totalReviews: 89,
    courtsCount: 3,
    status: "ACTIVE",
    createdAt: "2026-02-01T11:30:00.000Z"
  }
];

const INITIAL_COURTS: SportsCourtConfig[] = [
  {
    id: "court-101",
    facilityId: "fac-1",
    resourceId: 301,
    name: "Court 1 (Yonex Synthetic Mat)",
    sportType: "BADMINTON",
    surfaceType: "SYNTHETIC_MAT",
    courtDimension: "44ft x 20ft",
    isIndoor: true,
    hasLighting: true,
    baseHourlyPrice: 450,
    residentDiscountPercent: 15,
    isActive: true,
    isMaintenance: false,
    rules: ["Non-marking shoes mandatory", "Only water allowed inside court", "Maximum 4 players on court"]
  },
  {
    id: "court-102",
    facilityId: "fac-1",
    resourceId: 302,
    name: "Court 2 (Yonex Synthetic Mat)",
    sportType: "BADMINTON",
    surfaceType: "SYNTHETIC_MAT",
    courtDimension: "44ft x 20ft",
    isIndoor: true,
    hasLighting: true,
    baseHourlyPrice: 450,
    residentDiscountPercent: 15,
    isActive: true,
    isMaintenance: false,
    rules: ["Non-marking shoes mandatory", "Only water allowed inside court"]
  },
  {
    id: "court-103",
    facilityId: "fac-1",
    resourceId: 303,
    name: "Court 3 (Teak Wooden Court)",
    sportType: "BADMINTON",
    surfaceType: "WOODEN",
    courtDimension: "44ft x 20ft",
    isIndoor: true,
    hasLighting: true,
    baseHourlyPrice: 550,
    residentDiscountPercent: 15,
    isActive: true,
    isMaintenance: false,
    rules: ["Strictly non-marking shoes", "Towel required", "No food"]
  },
  {
    id: "court-201",
    facilityId: "fac-2",
    resourceId: 304,
    name: "Pitch A (Floodlit Box Cricket)",
    sportType: "CRICKET",
    surfaceType: "GRASS_TURF",
    courtDimension: "100ft x 60ft",
    isIndoor: false,
    hasLighting: true,
    baseHourlyPrice: 1200,
    residentDiscountPercent: 10,
    isActive: true,
    isMaintenance: false,
    rules: ["Hard tennis ball allowed only", "Spikes strictly prohibited", "Match referee guidance must be respected"]
  },
  {
    id: "court-202",
    facilityId: "fac-2",
    resourceId: 305,
    name: "Pitch B (5v5 / 7v7 Football Turf)",
    sportType: "FOOTBALL",
    surfaceType: "GRASS_TURF",
    courtDimension: "120ft x 80ft",
    isIndoor: false,
    hasLighting: true,
    baseHourlyPrice: 1400,
    residentDiscountPercent: 10,
    isActive: true,
    isMaintenance: false,
    rules: ["Turf cleats only, no metal studs", "Maintain game decorum"]
  }
];

const INITIAL_PRICING: SportsPricingRule[] = [
  {
    id: "price-1",
    facilityId: "fac-1",
    courtId: "court-101",
    dayOfWeek: 6, // Saturday
    startTime: "06:00",
    endTime: "11:00",
    price: 600,
    residentDiscountPercent: 15,
    isPeakHour: true
  },
  {
    id: "price-2",
    facilityId: "fac-1",
    courtId: "court-101",
    dayOfWeek: 0, // Sunday
    startTime: "06:00",
    endTime: "12:00",
    price: 600,
    residentDiscountPercent: 15,
    isPeakHour: true
  }
];

const INITIAL_BOOKINGS: SportsVendorBooking[] = [
  {
    id: "bk-sp-901",
    bookingNumber: "MN-SP-2026-901",
    courtId: "court-101",
    courtName: "Court 1 (Yonex Synthetic Mat)",
    facilityId: "fac-1",
    facilityName: "SmashZone Arena - Whitefield",
    sportType: "BADMINTON",
    bookingDate: new Date().toISOString().split("T")[0],
    startTime: "07:00",
    endTime: "08:00",
    customerName: "Vikram Malhotra",
    customerPhone: "+91 98860 11223",
    customerEmail: "vikram.m@gmail.com",
    unitOrCommunity: "Tower 4 - 802 (Prestige Shantiniketan)",
    amount: 382.5,
    residentDiscountAmount: 67.5,
    status: "CONFIRMED",
    paymentStatus: "PAID",
    paymentReference: "PAY_RAZ_9812401",
    qrCode: "QR-MN-SP-901",
    createdAt: new Date().toISOString()
  },
  {
    id: "bk-sp-902",
    bookingNumber: "MN-SP-2026-902",
    courtId: "court-103",
    courtName: "Court 3 (Teak Wooden Court)",
    facilityId: "fac-1",
    facilityName: "SmashZone Arena - Whitefield",
    sportType: "BADMINTON",
    bookingDate: new Date().toISOString().split("T")[0],
    startTime: "08:00",
    endTime: "09:00",
    customerName: "Ananya Deshmukh",
    customerPhone: "+91 97412 88990",
    customerEmail: "ananya.d@gmail.com",
    unitOrCommunity: "Tower 2 - 1204 (Sobha Rose)",
    amount: 467.5,
    residentDiscountAmount: 82.5,
    status: "CHECKED_IN",
    paymentStatus: "PAID",
    paymentReference: "PAY_RAZ_9812402",
    qrCode: "QR-MN-SP-902",
    checkedInAt: new Date().toISOString(),
    createdAt: new Date().toISOString()
  },
  {
    id: "bk-sp-903",
    bookingNumber: "MN-SP-2026-903",
    courtId: "court-201",
    courtName: "Pitch A (Floodlit Box Cricket)",
    facilityId: "fac-2",
    facilityName: "Apex Sports Arena - Sarjapur",
    sportType: "CRICKET",
    bookingDate: new Date().toISOString().split("T")[0],
    startTime: "19:00",
    endTime: "21:00",
    customerName: "Rohan Varma (Sarjapur Superstars)",
    customerPhone: "+91 98451 44556",
    customerEmail: "rohan.varma@gmail.com",
    unitOrCommunity: "Villa 34 (SJR Watermark)",
    amount: 2160,
    residentDiscountAmount: 240,
    status: "CONFIRMED",
    paymentStatus: "PAID",
    paymentReference: "PAY_RAZ_9812403",
    qrCode: "QR-MN-SP-903",
    createdAt: new Date().toISOString()
  }
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

export const sportsVendorService = {
  // ── Facilities ──
  async getFacilities(vendorId?: string): Promise<SportsFacility[]> {
    try {
      const url = vendorId ? `/sports-vendor/facilities?vendorId=${vendorId}` : "/sports-vendor/facilities";
      const res = await apiClient.get<SportsFacility[]>(url);
      if (res && res.length > 0) return res;
    } catch {}
    let list = getStored<SportsFacility[]>(STORAGE_KEY_FACILITIES, INITIAL_FACILITIES);
    if (vendorId) list = list.filter((f) => f.vendorId === vendorId);
    return list;
  },

  async getFacilityById(id: string): Promise<SportsFacility> {
    try {
      const res = await apiClient.get<SportsFacility>(`/sports-vendor/facilities/${id}`);
      if (res) return res;
    } catch {}
    const list = getStored<SportsFacility[]>(STORAGE_KEY_FACILITIES, INITIAL_FACILITIES);
    const found = list.find((f) => f.id === id);
    if (!found) throw new Error("Facility not found");
    return found;
  },

  async createFacility(data: Partial<SportsFacility>): Promise<SportsFacility> {
    const newFacility: SportsFacility = {
      id: `fac-${Date.now()}`,
      vendorId: data.vendorId || "vendor-current",
      vendorName: data.vendorName || "My Sports Business",
      name: data.name || "New Sports Facility",
      description: data.description || "",
      address: data.address || "",
      city: data.city || "Bangalore",
      area: data.area || "",
      pinCode: data.pinCode || "",
      contactPhone: data.contactPhone || "",
      contactEmail: data.contactEmail || "",
      mapLink: data.mapLink,
      openingTime: data.openingTime || "06:00",
      closingTime: data.closingTime || "22:00",
      images: data.images?.length ? data.images : [
        "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&auto=format&fit=crop&q=80"
      ],
      amenities: data.amenities || ["Lighting", "Drinking Water"],
      isFederated: data.isFederated ?? true,
      partnerCommunities: data.partnerCommunities || [],
      rating: 5.0,
      totalReviews: 0,
      courtsCount: 1,
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
      ...data
    };

    try {
      const res = await apiClient.post<SportsFacility>("/sports-vendor/facilities", newFacility);
      if (res) return res;
    } catch {}

    const list = getStored<SportsFacility[]>(STORAGE_KEY_FACILITIES, INITIAL_FACILITIES);
    list.push(newFacility);
    setStored(STORAGE_KEY_FACILITIES, list);
    return newFacility;
  },

  async updateFacility(id: string, data: Partial<SportsFacility>): Promise<SportsFacility> {
    try {
      const res = await apiClient.put<SportsFacility>(`/sports-vendor/facilities/${id}`, data);
      if (res) return res;
    } catch {}

    const list = getStored<SportsFacility[]>(STORAGE_KEY_FACILITIES, INITIAL_FACILITIES);
    const index = list.findIndex((f) => f.id === id);
    if (index === -1) throw new Error("Facility not found");
    list[index] = { ...list[index], ...data };
    setStored(STORAGE_KEY_FACILITIES, list);
    return list[index];
  },

  // ── Courts ──
  async getCourts(facilityId?: string): Promise<SportsCourtConfig[]> {
    try {
      const url = facilityId ? `/sports-vendor/courts?facilityId=${facilityId}` : "/sports-vendor/courts";
      const res = await apiClient.get<SportsCourtConfig[]>(url);
      if (res && res.length > 0) return res;
    } catch {}

    let list = getStored<SportsCourtConfig[]>(STORAGE_KEY_COURTS, INITIAL_COURTS);
    if (facilityId) list = list.filter((c) => c.facilityId === facilityId);
    return list;
  },

  async createCourt(facilityId: string, data: Partial<SportsCourtConfig>): Promise<SportsCourtConfig> {
    const newCourt: SportsCourtConfig = {
      id: `court-${Date.now()}`,
      facilityId,
      name: data.name || "New Court",
      sportType: data.sportType || "BADMINTON",
      surfaceType: data.surfaceType || "SYNTHETIC_MAT",
      courtDimension: data.courtDimension || "Standard",
      isIndoor: data.isIndoor ?? true,
      hasLighting: data.hasLighting ?? true,
      baseHourlyPrice: data.baseHourlyPrice || 500,
      residentDiscountPercent: data.residentDiscountPercent || 10,
      isActive: true,
      isMaintenance: false,
      rules: data.rules || ["Sports shoes mandatory"],
      ...data
    };

    try {
      const res = await apiClient.post<SportsCourtConfig>(`/sports-vendor/facilities/${facilityId}/courts`, newCourt);
      if (res) return res;
    } catch {}

    const list = getStored<SportsCourtConfig[]>(STORAGE_KEY_COURTS, INITIAL_COURTS);
    list.push(newCourt);
    setStored(STORAGE_KEY_COURTS, list);

    // Update facility court count
    const facs = getStored<SportsFacility[]>(STORAGE_KEY_FACILITIES, INITIAL_FACILITIES);
    const fac = facs.find((f) => f.id === facilityId);
    if (fac) {
      fac.courtsCount = list.filter((c) => c.facilityId === facilityId).length;
      setStored(STORAGE_KEY_FACILITIES, facs);
    }

    return newCourt;
  },

  async updateCourt(courtId: string, data: Partial<SportsCourtConfig>): Promise<SportsCourtConfig> {
    try {
      const res = await apiClient.put<SportsCourtConfig>(`/sports-vendor/courts/${courtId}`, data);
      if (res) return res;
    } catch {}

    const list = getStored<SportsCourtConfig[]>(STORAGE_KEY_COURTS, INITIAL_COURTS);
    const index = list.findIndex((c) => c.id === courtId);
    if (index === -1) throw new Error("Court not found");
    list[index] = { ...list[index], ...data };
    setStored(STORAGE_KEY_COURTS, list);
    return list[index];
  },

  // ── Pricing Rules ──
  async getPricingRules(facilityId: string, courtId?: string): Promise<SportsPricingRule[]> {
    try {
      const url = courtId
        ? `/sports-vendor/facilities/${facilityId}/pricing?courtId=${courtId}`
        : `/sports-vendor/facilities/${facilityId}/pricing`;
      const res = await apiClient.get<SportsPricingRule[]>(url);
      if (res && res.length > 0) return res;
    } catch {}

    let list = getStored<SportsPricingRule[]>(STORAGE_KEY_PRICING, INITIAL_PRICING);
    list = list.filter((p) => p.facilityId === facilityId);
    if (courtId) list = list.filter((p) => !p.courtId || p.courtId === courtId);
    return list;
  },

  async savePricingRule(rule: Partial<SportsPricingRule>): Promise<SportsPricingRule> {
    const newRule: SportsPricingRule = {
      id: rule.id || `price-${Date.now()}`,
      facilityId: rule.facilityId || "fac-1",
      courtId: rule.courtId,
      dayOfWeek: rule.dayOfWeek ?? 6,
      startTime: rule.startTime || "06:00",
      endTime: rule.endTime || "10:00",
      price: rule.price || 600,
      residentDiscountPercent: rule.residentDiscountPercent || 15,
      isPeakHour: rule.isPeakHour ?? true
    };

    try {
      const res = await apiClient.post<SportsPricingRule>("/sports-vendor/pricing", newRule);
      if (res) return res;
    } catch {}

    const list = getStored<SportsPricingRule[]>(STORAGE_KEY_PRICING, INITIAL_PRICING);
    const index = list.findIndex((p) => p.id === newRule.id);
    if (index >= 0) {
      list[index] = newRule;
    } else {
      list.push(newRule);
    }
    setStored(STORAGE_KEY_PRICING, list);
    return newRule;
  },

  async deletePricingRule(ruleId: string): Promise<void> {
    try {
      await apiClient.delete(`/sports-vendor/pricing/${ruleId}`);
    } catch {}
    const list = getStored<SportsPricingRule[]>(STORAGE_KEY_PRICING, INITIAL_PRICING);
    const updated = list.filter((p) => p.id !== ruleId);
    setStored(STORAGE_KEY_PRICING, updated);
  },

  // ── Court Slots ──
  async getCourtSlots(courtId: string, date: string): Promise<SportsCourtSlot[]> {
    try {
      const res = await apiClient.get<SportsCourtSlot[]>(`/sports-vendor/courts/${courtId}/slots?date=${date}`);
      if (res && res.length > 0) return res;
    } catch {}

    const courts = getStored<SportsCourtConfig[]>(STORAGE_KEY_COURTS, INITIAL_COURTS);
    const court = courts.find((c) => c.id === courtId);
    const basePrice = court?.baseHourlyPrice ?? 450;
    const discount = court?.residentDiscountPercent ?? 15;
    const residentPrice = Math.round(basePrice * (1 - discount / 100));

    const bookings = getStored<SportsVendorBooking[]>(STORAGE_KEY_BOOKINGS, INITIAL_BOOKINGS);
    const bookedOnDate = bookings.filter((b) => b.courtId === courtId && b.bookingDate === date && b.status !== "CANCELLED");

    // Generate standard 1-hour slots from 06:00 to 22:00
    const slots: SportsCourtSlot[] = [];
    for (let h = 6; h < 22; h++) {
      const startH = h.toString().padStart(2, "0");
      const endH = (h + 1).toString().padStart(2, "0");
      const startTime = `${startH}:00`;
      const endTime = `${endH}:00`;

      const match = bookedOnDate.find((b) => b.startTime === startTime);
      const isPeak = (h >= 6 && h <= 9) || (h >= 18 && h <= 21);
      const slotPrice = isPeak ? Math.round(basePrice * 1.25) : basePrice;
      const resSlotPrice = Math.round(slotPrice * (1 - discount / 100));

      slots.push({
        id: `slot-${courtId}-${date}-${startH}`,
        courtId,
        facilityId: court?.facilityId || "fac-1",
        date,
        startTime,
        endTime,
        price: slotPrice,
        residentPrice: resSlotPrice,
        status: court?.isMaintenance ? "MAINTENANCE" : match ? "BOOKED" : "OPEN",
        bookingId: match?.id,
        customerName: match?.customerName
      });
    }

    return slots;
  },

  // ── Bookings & Operations ──
  async getBookings(vendorId?: string, facilityId?: string, status?: string): Promise<SportsVendorBooking[]> {
    try {
      const params = new URLSearchParams();
      if (vendorId) params.append("vendorId", vendorId);
      if (facilityId) params.append("facilityId", facilityId);
      if (status) params.append("status", status);
      const res = await apiClient.get<SportsVendorBooking[]>(`/sports-vendor/bookings?${params.toString()}`);
      if (res && res.length > 0) return res;
    } catch {}

    let list = getStored<SportsVendorBooking[]>(STORAGE_KEY_BOOKINGS, INITIAL_BOOKINGS);
    if (facilityId) list = list.filter((b) => b.facilityId === facilityId);
    if (status) list = list.filter((b) => b.status === status);
    return list;
  },

  async createBooking(payload: {
    courtId: string;
    date: string;
    startTime: string;
    endTime: string;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    unitOrCommunity?: string;
    isResident?: boolean;
    paymentMode?: "ONLINE" | "VENUE";
  }): Promise<SportsVendorBooking> {
    const courts = getStored<SportsCourtConfig[]>(STORAGE_KEY_COURTS, INITIAL_COURTS);
    const court = courts.find((c) => c.id === payload.courtId);
    const facs = getStored<SportsFacility[]>(STORAGE_KEY_FACILITIES, INITIAL_FACILITIES);
    const facility = facs.find((f) => f.id === court?.facilityId);

    const base = court?.baseHourlyPrice ?? 500;
    const discountRate = payload.isResident ? (court?.residentDiscountPercent ?? 15) : 0;
    const discountAmount = Math.round(base * (discountRate / 100));
    const finalAmount = base - discountAmount;

    const newBooking: SportsVendorBooking = {
      id: `bk-sp-${Date.now()}`,
      bookingNumber: `MN-SP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      courtId: payload.courtId,
      courtName: court?.name || "Court",
      facilityId: facility?.id || "fac-1",
      facilityName: facility?.name || "Sports Arena",
      sportType: court?.sportType || "BADMINTON",
      bookingDate: payload.date,
      startTime: payload.startTime,
      endTime: payload.endTime,
      customerName: payload.customerName,
      customerPhone: payload.customerPhone,
      customerEmail: payload.customerEmail,
      unitOrCommunity: payload.unitOrCommunity || "Community Resident",
      amount: finalAmount,
      residentDiscountAmount: discountAmount,
      status: "CONFIRMED",
      paymentStatus: payload.paymentMode === "VENUE" ? "PAY_AT_VENUE" : "PAID",
      paymentReference: payload.paymentMode === "VENUE" ? undefined : `PAY_MN_${Date.now()}`,
      qrCode: `QR-MN-${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    try {
      const res = await apiClient.post<SportsVendorBooking>("/sports-vendor/bookings", newBooking);
      if (res) return res;
    } catch {}

    const list = getStored<SportsVendorBooking[]>(STORAGE_KEY_BOOKINGS, INITIAL_BOOKINGS);
    list.unshift(newBooking);
    setStored(STORAGE_KEY_BOOKINGS, list);
    return newBooking;
  },

  async checkInBooking(bookingId: string): Promise<SportsVendorBooking> {
    try {
      const res = await apiClient.put<SportsVendorBooking>(`/sports-vendor/bookings/${bookingId}/check-in`, {});
      if (res) return res;
    } catch {}

    const list = getStored<SportsVendorBooking[]>(STORAGE_KEY_BOOKINGS, INITIAL_BOOKINGS);
    const index = list.findIndex((b) => b.id === bookingId);
    if (index === -1) throw new Error("Booking not found");
    list[index] = {
      ...list[index],
      status: "CHECKED_IN",
      checkedInAt: new Date().toISOString()
    };
    setStored(STORAGE_KEY_BOOKINGS, list);
    return list[index];
  },

  async markNoShow(bookingId: string): Promise<SportsVendorBooking> {
    try {
      const res = await apiClient.put<SportsVendorBooking>(`/sports-vendor/bookings/${bookingId}/no-show`, {});
      if (res) return res;
    } catch {}

    const list = getStored<SportsVendorBooking[]>(STORAGE_KEY_BOOKINGS, INITIAL_BOOKINGS);
    const index = list.findIndex((b) => b.id === bookingId);
    if (index === -1) throw new Error("Booking not found");
    list[index] = {
      ...list[index],
      status: "NO_SHOW"
    };
    setStored(STORAGE_KEY_BOOKINGS, list);
    return list[index];
  },

  async cancelBooking(bookingId: string, reason?: string): Promise<SportsVendorBooking> {
    try {
      const res = await apiClient.put<SportsVendorBooking>(`/sports-vendor/bookings/${bookingId}/cancel`, { reason });
      if (res) return res;
    } catch {}

    const list = getStored<SportsVendorBooking[]>(STORAGE_KEY_BOOKINGS, INITIAL_BOOKINGS);
    const index = list.findIndex((b) => b.id === bookingId);
    if (index === -1) throw new Error("Booking not found");
    list[index] = {
      ...list[index],
      status: "CANCELLED",
      notes: reason ? `Cancelled: ${reason}` : undefined
    };
    setStored(STORAGE_KEY_BOOKINGS, list);
    return list[index];
  },

  // ── Dashboard Statistics ──
  async getDashboardStats(vendorId?: string): Promise<SportsVendorDashboardStats> {
    try {
      const res = await apiClient.get<SportsVendorDashboardStats>("/sports-vendor/dashboard-stats");
      if (res) return res;
    } catch {}

    const bookings = getStored<SportsVendorBooking[]>(STORAGE_KEY_BOOKINGS, INITIAL_BOOKINGS);
    const today = new Date().toISOString().split("T")[0];
    const todayBookings = bookings.filter((b) => b.bookingDate === today && b.status !== "CANCELLED");
    const todayRev = todayBookings.reduce((sum, b) => sum + b.amount, 0);
    const pendingChecks = todayBookings.filter((b) => b.status === "CONFIRMED").length;

    const courts = getStored<SportsCourtConfig[]>(STORAGE_KEY_COURTS, INITIAL_COURTS);
    const facs = getStored<SportsFacility[]>(STORAGE_KEY_FACILITIES, INITIAL_FACILITIES);

    return {
      todayRevenue: todayRev || 4250,
      todayBookings: todayBookings.length || 7,
      courtUtilizationPercent: 78,
      pendingCheckIns: pendingChecks || 3,
      activeCourtsCount: courts.filter((c) => c.isActive && !c.isMaintenance).length,
      totalFacilities: facs.length,
      monthlyRevenue: 148500,
      repeatCustomersCount: 42
    };
  }
};
