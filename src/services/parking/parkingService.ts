import { apiClient } from "../common/apiClient";
import { safeStorage } from "../../utils/storage";

export interface ParkingSlotResponse {
  id: number;
  slotNumber: string;
  zone: string;
  floor: string;
  slotType: string;
  status: string;
  assignedToId: number | null;
  assignedToName: string | null;
  vehicleId: number | null;
  vehicleNumberPlate: string | null;
  notes: string | null;
  createdAt: string;
}

export interface ParkingSlotRequest {
  slotNumber: string;
  zone?: string;
  floor?: string;
  slotType?: string;
  notes?: string;
}

export interface ResidentVehicleResponse {
  id: number;
  ownerId: number;
  ownerName: string;
  vehicleType: string;
  make: string;
  model: string;
  color: string;
  numberPlate: string;
  parkingSlotId: number | null;
  parkingSlotNumber: string | null;
  stickerNumber: string | null;
  primary: boolean;
  status: string;
  createdAt: string;
}

export interface ResidentVehicleRequest {
  vehicleType?: string;
  make?: string;
  model?: string;
  color?: string;
  numberPlate: string;
  parkingSlotId?: number | null;
  stickerNumber?: string;
  primary?: boolean;
}

// ── Mobile Parity DTOs ────────────────────────────────────────────────────────

export type MarketplacePricingType = "DAILY_RATE" | "FREE_GOOD_NEIGHBOR" | "MONTHLY_RATE";

export interface ParkingMarketplaceListingDto {
  id: string;
  spotId?: number;
  spotNumber: string;
  level: string;
  spotType: "CAR" | "BIKE" | "EV";
  hasEVCharger?: boolean;
  ownerName: string;
  ownerFlat: string;
  startDate: string;
  endDate: string;
  pricingType: MarketplacePricingType;
  rateINR: number;
  status: "AVAILABLE" | "BOOKED" | "EXPIRED";
  notes?: string;
  createdAt: string;
}

export interface CreateMarketplaceListingRequest {
  spotNumber: string;
  level: string;
  spotType?: "CAR" | "BIKE" | "EV";
  hasEVCharger?: boolean;
  startDate: string;
  endDate: string;
  pricingType: MarketplacePricingType;
  rateINR: number;
  notes?: string;
}

export interface ParkingMarketplaceBookingDto {
  id: string;
  listingId: string;
  spotNumber: string;
  level: string;
  ownerFlat: string;
  ownerName: string;
  borrowerFlat: string;
  borrowerName: string;
  vehicleNumber: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  totalAmountINR: number;
  status: "CONFIRMED" | "COMPLETED" | "CANCELLED";
  anprWhitelisted: boolean;
  bookingCode: string;
  createdAt: string;
}

export interface BookMarketplaceSlotRequest {
  listingId: string;
  vehicleNumber: string;
  startDate: string;
  endDate: string;
}

export type ViolationType =
  | "WRONG_SLOT"
  | "BLOCKING_DRIVEWAY"
  | "NO_STICKER"
  | "NON_EV_ON_CHARGER"
  | "SPEEDING_IN_BASEMENT";

export interface ParkingViolationReportDto {
  id: string;
  spotNumber: string;
  level: string;
  offendingVehicleNumber: string;
  offenderFlat?: string;
  reporterFlat: string;
  violationType: ViolationType;
  severity: "MINOR" | "MODERATE" | "MAJOR";
  status: "REPORTED" | "WARNED" | "FINED" | "RESOLVED";
  fineAmountINR?: number;
  timestamp: string;
  remarks: string;
  imageUrl?: string;
}

export interface ReportViolationRequest {
  spotNumber: string;
  level: string;
  offendingVehicleNumber: string;
  violationType: ViolationType;
  remarks: string;
  imageUrl?: string;
}

export interface ParkingSlotSwapRequestDto {
  id: string;
  requesterName: string;
  requesterFlat: string;
  currentSpotNumber: string;
  currentLevel: string;
  targetSpotNumber: string;
  targetLevel: string;
  targetOwnerFlat: string;
  reason: string;
  status: "PENDING_NEIGHBOR" | "ACCEPTED" | "REJECTED" | "ADMIN_APPROVED";
  createdAt: string;
}

export interface CreateSwapRequest {
  targetSpotNumber: string;
  targetLevel: string;
  targetOwnerFlat: string;
  reason: string;
}

export interface ParkingWaitlistEntryDto {
  id: string;
  residentName: string;
  residentFlat: string;
  vehicleType: "CAR" | "BIKE" | "EV";
  preferredLevel: string;
  queuePosition: number;
  requestDate: string;
  status: "QUEUED" | "OFFERED" | "ALLOCATED" | "CANCELLED";
}

// ── Initial Mock Fallback Dataset ─────────────────────────────────────────────

const FALLBACK_MARKETPLACE: ParkingMarketplaceListingDto[] = [
  {
    id: "mkt-01",
    spotNumber: "B1-P14",
    level: "Basement 1",
    spotType: "CAR",
    hasEVCharger: false,
    ownerName: "Sunil Rao",
    ownerFlat: "Tower A2 - 104",
    startDate: "2026-10-12",
    endDate: "2026-10-26",
    pricingType: "DAILY_RATE",
    rateINR: 80,
    status: "AVAILABLE",
    notes: "Traveling out of town for 2 weeks. Prime spot right near Tower A lift.",
    createdAt: "2026-10-10T10:00:00Z",
  },
  {
    id: "mkt-02",
    spotNumber: "B2-P30",
    level: "Basement 2",
    spotType: "CAR",
    hasEVCharger: false,
    ownerName: "Vikram Joshi",
    ownerFlat: "Tower C1 - 501",
    startDate: "2026-10-11",
    endDate: "2026-10-18",
    pricingType: "FREE_GOOD_NEIGHBOR",
    rateINR: 0,
    status: "AVAILABLE",
    notes: "Lending to any verified neighbor for free while we are on holiday! Please keep clean.",
    createdAt: "2026-10-09T14:30:00Z",
  },
  {
    id: "mkt-03",
    spotNumber: "B2-P08",
    level: "Basement 2",
    spotType: "CAR",
    hasEVCharger: true,
    ownerName: "Ananya Sharma",
    ownerFlat: "Tower B1 - 802",
    startDate: "2026-10-15",
    endDate: "2026-10-31",
    pricingType: "DAILY_RATE",
    rateINR: 120,
    status: "AVAILABLE",
    notes: "Covered spot with 15A socket for trickle charging. Spacious parking.",
    createdAt: "2026-10-10T08:00:00Z",
  },
];

const FALLBACK_MY_BOOKINGS: ParkingMarketplaceBookingDto[] = [
  {
    id: "bk-mkt-01",
    listingId: "mkt-00",
    spotNumber: "B1-P24",
    level: "Basement 1",
    ownerFlat: "Tower B2 - 304",
    ownerName: "Karthik N.",
    borrowerFlat: "Tower A1 - 302",
    borrowerName: "You",
    vehicleNumber: "KA-01-AB-1234",
    startDate: "2026-10-01",
    endDate: "2026-10-04",
    totalDays: 3,
    totalAmountINR: 240,
    status: "COMPLETED",
    anprWhitelisted: true,
    bookingCode: "MKT-8921",
    createdAt: "2026-09-30T18:00:00Z",
  },
];

const FALLBACK_VIOLATIONS: ParkingViolationReportDto[] = [
  {
    id: "viol-01",
    spotNumber: "B1-P12",
    level: "Basement 1",
    offendingVehicleNumber: "KA-04-XX-4321",
    offenderFlat: "Tower C2 - 1102",
    reporterFlat: "Tower A1 - 302 (You)",
    violationType: "WRONG_SLOT",
    severity: "MINOR",
    status: "WARNED",
    fineAmountINR: 250,
    timestamp: "Yesterday at 7:30 PM",
    remarks: "Parked in private slot without permission. Guard notified.",
  },
  {
    id: "viol-02",
    spotNumber: "B1-EV1",
    level: "Basement 1",
    offendingVehicleNumber: "MH-02-CD-9988",
    offenderFlat: "Tower B1 - 404",
    reporterFlat: "Society Security",
    violationType: "NON_EV_ON_CHARGER",
    severity: "MAJOR",
    status: "FINED",
    fineAmountINR: 500,
    timestamp: "2 days ago",
    remarks: "ICE vehicle blocking EV charging bay for 6+ hours.",
  },
];

const FALLBACK_SWAPS: ParkingSlotSwapRequestDto[] = [
  {
    id: "swap-01",
    requesterName: "Pooja Iyer",
    requesterFlat: "Tower A1-304",
    currentSpotNumber: "B2-P10",
    currentLevel: "Basement 2",
    targetSpotNumber: "B1-P12",
    targetLevel: "Basement 1",
    targetOwnerFlat: "Tower A1-302 (You)",
    reason: "Elderly parents visiting, requesting B1 level closer to lift.",
    status: "PENDING_NEIGHBOR",
    createdAt: "2026-10-08T12:00:00Z",
  },
];

const FALLBACK_WAITLIST: ParkingWaitlistEntryDto[] = [
  {
    id: "wl-01",
    residentName: "You (Tower A1-302)",
    residentFlat: "A1-302",
    vehicleType: "CAR",
    preferredLevel: "Basement 1",
    queuePosition: 2,
    requestDate: "2026-08-15",
    status: "QUEUED",
  },
  {
    id: "wl-02",
    residentName: "Deepak Verma",
    residentFlat: "Tower B2-901",
    vehicleType: "CAR",
    preferredLevel: "Basement 1",
    queuePosition: 1,
    requestDate: "2026-07-20",
    status: "OFFERED",
  },
];

const STORE_KEY = "mana_parking_extended_store_v1";

interface ExtendedParkingStore {
  marketplaceListings: ParkingMarketplaceListingDto[];
  marketplaceBookings: ParkingMarketplaceBookingDto[];
  violations: ParkingViolationReportDto[];
  swaps: ParkingSlotSwapRequestDto[];
  waitlist: ParkingWaitlistEntryDto[];
}

let inMemoryStore: ExtendedParkingStore | null = null;

function loadStore(): ExtendedParkingStore {
  try {
    const raw = safeStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  if (inMemoryStore) return inMemoryStore;
  return JSON.parse(
    JSON.stringify({
      marketplaceListings: FALLBACK_MARKETPLACE,
      marketplaceBookings: FALLBACK_MY_BOOKINGS,
      violations: FALLBACK_VIOLATIONS,
      swaps: FALLBACK_SWAPS,
      waitlist: FALLBACK_WAITLIST,
    })
  );
}

function saveStore(store: ExtendedParkingStore) {
  inMemoryStore = store;
  try {
    safeStorage.setItem(STORE_KEY, JSON.stringify(store));
  } catch {}
}

export const parkingService = {
  // ── Existing Endpoints ──
  async getSlots(): Promise<ParkingSlotResponse[]> {
    try {
      return await apiClient.get<ParkingSlotResponse[]>("/parking/slots");
    } catch {
      return [
        { id: 1, slotNumber: "B1-P12", zone: "Zone A", floor: "Basement 1", slotType: "COVERED", status: "OCCUPIED", assignedToId: 101, assignedToName: "You (Tower A1-302)", vehicleId: 1, vehicleNumberPlate: "KA-01-AB-1234", notes: "Near Lift A", createdAt: "2026-01-01" },
        { id: 2, slotNumber: "B1-P13", zone: "Zone A", floor: "Basement 1", slotType: "COVERED", status: "OCCUPIED", assignedToId: 101, assignedToName: "You (Tower A1-302)", vehicleId: 2, vehicleNumberPlate: "KA-01-CD-5678", notes: "Bike Bay", createdAt: "2026-01-01" },
        { id: 3, slotNumber: "B1-EV1", zone: "Zone EV", floor: "Basement 1", slotType: "RESERVED", status: "AVAILABLE", assignedToId: null, assignedToName: null, vehicleId: null, vehicleNumberPlate: null, notes: "22kW AC Charger", createdAt: "2026-01-01" },
        { id: 4, slotNumber: "B1-P08", zone: "Zone B", floor: "Basement 1", slotType: "OPEN", status: "AVAILABLE", assignedToId: null, assignedToName: null, vehicleId: null, vehicleNumberPlate: null, notes: "Open bike spot", createdAt: "2026-01-01" },
        { id: 5, slotNumber: "B1-P14", zone: "Zone A", floor: "Basement 1", slotType: "COVERED", status: "OCCUPIED", assignedToId: 102, assignedToName: "Sunil Rao", vehicleId: 3, vehicleNumberPlate: "KA-02-EE-9011", notes: "Listed in Marketplace", createdAt: "2026-01-01" },
        { id: 6, slotNumber: "B2-P05", zone: "Zone C", floor: "Basement 2", slotType: "COVERED", status: "AVAILABLE", assignedToId: null, assignedToName: null, vehicleId: null, vehicleNumberPlate: null, notes: "Spacious", createdAt: "2026-01-01" },
      ];
    }
  },

  async getAvailableSlots(): Promise<ParkingSlotResponse[]> {
    try {
      return await apiClient.get<ParkingSlotResponse[]>("/parking/slots/available");
    } catch {
      const slots = await this.getSlots();
      return slots.filter((s) => s.status === "AVAILABLE");
    }
  },

  async createSlot(data: ParkingSlotRequest): Promise<ParkingSlotResponse> {
    try {
      return await apiClient.post<ParkingSlotResponse>("/parking/slots", data);
    } catch {
      return {
        id: Date.now(),
        slotNumber: data.slotNumber,
        zone: data.zone || "Zone A",
        floor: data.floor || "Basement 1",
        slotType: data.slotType || "COVERED",
        status: "AVAILABLE",
        assignedToId: null,
        assignedToName: null,
        vehicleId: null,
        vehicleNumberPlate: null,
        notes: data.notes || null,
        createdAt: new Date().toISOString(),
      };
    }
  },

  async updateSlot(id: number, data: ParkingSlotRequest): Promise<ParkingSlotResponse> {
    try {
      return await apiClient.put<ParkingSlotResponse>(`/parking/slots/${id}`, data);
    } catch {
      return {
        id,
        slotNumber: data.slotNumber,
        zone: data.zone || "Zone A",
        floor: data.floor || "Basement 1",
        slotType: data.slotType || "COVERED",
        status: "AVAILABLE",
        assignedToId: null,
        assignedToName: null,
        vehicleId: null,
        vehicleNumberPlate: null,
        notes: data.notes || null,
        createdAt: new Date().toISOString(),
      };
    }
  },

  async assignSlot(id: number, userId: number): Promise<ParkingSlotResponse> {
    return apiClient.post<ParkingSlotResponse>(`/parking/slots/${id}/assign?userId=${userId}`, {});
  },

  async releaseSlot(id: number): Promise<ParkingSlotResponse> {
    return apiClient.post<ParkingSlotResponse>(`/parking/slots/${id}/release`, {});
  },

  async deleteSlot(id: number): Promise<void> {
    try {
      await apiClient.delete(`/parking/slots/${id}`);
    } catch {}
  },

  async getVehicles(): Promise<ResidentVehicleResponse[]> {
    try {
      return await apiClient.get<ResidentVehicleResponse[]>("/parking/vehicles");
    } catch {
      return [
        { id: 1, ownerId: 101, ownerName: "You", vehicleType: "CAR", make: "Hyundai", model: "Creta", color: "Polar White", numberPlate: "KA-01-AB-1234", parkingSlotId: 1, parkingSlotNumber: "B1-P12", stickerNumber: "STK-901", primary: true, status: "ACTIVE", createdAt: "2026-01-01" },
        { id: 2, ownerId: 101, ownerName: "You", vehicleType: "BIKE", make: "Royal Enfield", model: "Hunter 350", color: "Dapper Grey", numberPlate: "KA-01-CD-5678", parkingSlotId: 2, parkingSlotNumber: "B1-P13", stickerNumber: "STK-902", primary: false, status: "ACTIVE", createdAt: "2026-01-01" },
        { id: 3, ownerId: 102, ownerName: "Sunil Rao", vehicleType: "CAR", make: "Tata", model: "Nexon EV", color: "Teal Blue", numberPlate: "KA-02-EE-9011", parkingSlotId: 5, parkingSlotNumber: "B1-P14", stickerNumber: "STK-741", primary: true, status: "ACTIVE", createdAt: "2026-01-01" },
      ];
    }
  },

  async getMyVehicles(): Promise<ResidentVehicleResponse[]> {
    try {
      return await apiClient.get<ResidentVehicleResponse[]>("/parking/vehicles/mine");
    } catch {
      const all = await this.getVehicles();
      return all.filter((v) => v.ownerName === "You");
    }
  },

  async registerVehicle(data: ResidentVehicleRequest): Promise<ResidentVehicleResponse> {
    try {
      return await apiClient.post<ResidentVehicleResponse>("/parking/vehicles", data);
    } catch {
      return {
        id: Date.now(),
        ownerId: 101,
        ownerName: "You",
        vehicleType: data.vehicleType || "CAR",
        make: data.make || "Generic",
        model: data.model || "Model",
        color: data.color || "Black",
        numberPlate: data.numberPlate.toUpperCase(),
        parkingSlotId: data.parkingSlotId || null,
        parkingSlotNumber: data.parkingSlotId ? "B1-P" + data.parkingSlotId : null,
        stickerNumber: data.stickerNumber || "STK-" + Math.floor(100 + Math.random() * 900),
        primary: data.primary || false,
        status: "ACTIVE",
        createdAt: new Date().toISOString(),
      };
    }
  },

  async updateVehicle(id: number, data: ResidentVehicleRequest): Promise<ResidentVehicleResponse> {
    try {
      return await apiClient.put<ResidentVehicleResponse>(`/parking/vehicles/${id}`, data);
    } catch {
      return {
        id,
        ownerId: 101,
        ownerName: "You",
        vehicleType: data.vehicleType || "CAR",
        make: data.make || "Generic",
        model: data.model || "Model",
        color: data.color || "Black",
        numberPlate: data.numberPlate.toUpperCase(),
        parkingSlotId: data.parkingSlotId || null,
        parkingSlotNumber: null,
        stickerNumber: data.stickerNumber || "STK-100",
        primary: data.primary || false,
        status: "ACTIVE",
        createdAt: new Date().toISOString(),
      };
    }
  },

  async deleteVehicle(id: number): Promise<void> {
    try {
      await apiClient.delete(`/parking/vehicles/${id}`);
    } catch {}
  },

  // ── Mobile Parity Features (Marketplace, Swaps, Waitlist, Violations) ───────

  async getMarketplaceListings(): Promise<ParkingMarketplaceListingDto[]> {
    try {
      return await apiClient.get<ParkingMarketplaceListingDto[]>("/parking/marketplace/listings");
    } catch {
      return loadStore().marketplaceListings;
    }
  },

  async createMarketplaceListing(data: CreateMarketplaceListingRequest): Promise<ParkingMarketplaceListingDto> {
    try {
      return await apiClient.post<ParkingMarketplaceListingDto>("/parking/marketplace/listings", data);
    } catch {
      const store = loadStore();
      const newListing: ParkingMarketplaceListingDto = {
        id: `mkt-${Date.now()}`,
        spotNumber: data.spotNumber,
        level: data.level,
        spotType: data.spotType || "CAR",
        hasEVCharger: data.hasEVCharger || false,
        ownerName: "You",
        ownerFlat: "Tower A1 - 302",
        startDate: data.startDate,
        endDate: data.endDate,
        pricingType: data.pricingType,
        rateINR: data.rateINR,
        status: "AVAILABLE",
        notes: data.notes,
        createdAt: new Date().toISOString(),
      };
      store.marketplaceListings.unshift(newListing);
      saveStore(store);
      return newListing;
    }
  },

  async getMyMarketplaceBookings(): Promise<ParkingMarketplaceBookingDto[]> {
    try {
      return await apiClient.get<ParkingMarketplaceBookingDto[]>("/parking/marketplace/bookings/my");
    } catch {
      return loadStore().marketplaceBookings;
    }
  },

  async bookMarketplaceSlot(data: BookMarketplaceSlotRequest): Promise<ParkingMarketplaceBookingDto> {
    try {
      return await apiClient.post<ParkingMarketplaceBookingDto>("/parking/marketplace/bookings", data);
    } catch {
      const store = loadStore();
      const listing = store.marketplaceListings.find((l) => l.id === data.listingId);
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      const diffDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
      const rate = listing ? listing.rateINR : 80;

      const newBooking: ParkingMarketplaceBookingDto = {
        id: `bk-${Date.now()}`,
        listingId: data.listingId,
        spotNumber: listing?.spotNumber || "B1-P14",
        level: listing?.level || "Basement 1",
        ownerFlat: listing?.ownerFlat || "Neighbor",
        ownerName: listing?.ownerName || "Neighbor",
        borrowerFlat: "Tower A1 - 302",
        borrowerName: "You",
        vehicleNumber: data.vehicleNumber.toUpperCase(),
        startDate: data.startDate,
        endDate: data.endDate,
        totalDays: diffDays,
        totalAmountINR: listing?.pricingType === "FREE_GOOD_NEIGHBOR" ? 0 : rate * diffDays,
        status: "CONFIRMED",
        anprWhitelisted: true,
        bookingCode: `MKT-${Math.floor(1000 + Math.random() * 9000)}`,
        createdAt: new Date().toISOString(),
      };

      if (listing) {
        listing.status = "BOOKED";
      }

      store.marketplaceBookings.unshift(newBooking);
      saveStore(store);
      return newBooking;
    }
  },

  async getViolations(): Promise<ParkingViolationReportDto[]> {
    try {
      return await apiClient.get<ParkingViolationReportDto[]>("/parking/violations");
    } catch {
      return loadStore().violations;
    }
  },

  async reportViolation(data: ReportViolationRequest): Promise<ParkingViolationReportDto> {
    try {
      return await apiClient.post<ParkingViolationReportDto>("/parking/violations", data);
    } catch {
      const store = loadStore();
      const newViol: ParkingViolationReportDto = {
        id: `viol-${Date.now()}`,
        spotNumber: data.spotNumber,
        level: data.level,
        offendingVehicleNumber: data.offendingVehicleNumber.toUpperCase(),
        reporterFlat: "Tower A1 - 302 (You)",
        violationType: data.violationType,
        severity: data.violationType === "NON_EV_ON_CHARGER" ? "MAJOR" : "MINOR",
        status: "REPORTED",
        fineAmountINR: 250,
        timestamp: "Just now",
        remarks: data.remarks,
        imageUrl: data.imageUrl,
      };
      store.violations.unshift(newViol);
      saveStore(store);
      return newViol;
    }
  },

  async getSwapRequests(): Promise<ParkingSlotSwapRequestDto[]> {
    try {
      return await apiClient.get<ParkingSlotSwapRequestDto[]>("/parking/swaps");
    } catch {
      return loadStore().swaps;
    }
  },

  async createSwapRequest(data: CreateSwapRequest): Promise<ParkingSlotSwapRequestDto> {
    try {
      return await apiClient.post<ParkingSlotSwapRequestDto>("/parking/swaps", data);
    } catch {
      const store = loadStore();
      const newSwap: ParkingSlotSwapRequestDto = {
        id: `swap-${Date.now()}`,
        requesterName: "You",
        requesterFlat: "Tower A1-302",
        currentSpotNumber: "B1-P12",
        currentLevel: "Basement 1",
        targetSpotNumber: data.targetSpotNumber,
        targetLevel: data.targetLevel,
        targetOwnerFlat: data.targetOwnerFlat,
        reason: data.reason,
        status: "PENDING_NEIGHBOR",
        createdAt: new Date().toISOString(),
      };
      store.swaps.unshift(newSwap);
      saveStore(store);
      return newSwap;
    }
  },

  async getWaitlist(): Promise<ParkingWaitlistEntryDto[]> {
    try {
      return await apiClient.get<ParkingWaitlistEntryDto[]>("/parking/waitlist");
    } catch {
      return loadStore().waitlist;
    }
  },

  async joinWaitlist(preferredLevel = "Basement 1"): Promise<ParkingWaitlistEntryDto> {
    try {
      return await apiClient.post<ParkingWaitlistEntryDto>("/parking/waitlist", { preferredLevel });
    } catch {
      const store = loadStore();
      const newEntry: ParkingWaitlistEntryDto = {
        id: `wl-${Date.now()}`,
        residentName: "You (Tower A1-302)",
        residentFlat: "A1-302",
        vehicleType: "CAR",
        preferredLevel,
        queuePosition: store.waitlist.length + 1,
        requestDate: new Date().toISOString().split("T")[0],
        status: "QUEUED",
      };
      store.waitlist.push(newEntry);
      saveStore(store);
      return newEntry;
    }
  },
};
