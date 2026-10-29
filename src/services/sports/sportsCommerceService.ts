import { apiClient } from "../common/apiClient";
import type {
  SportsOfficial,
  OfficialAssignment,
  SportsMerchandiseItem,
  SupplierQuoteRequest,
  TournamentOrganizerEvent,
  OfficialAssignmentStatus,
  QuoteStatus,
} from "../../types/sportsCommerce";

const STORAGE_KEY_EVENTS = "mana_sports_organizer_events_v1";
const STORAGE_KEY_OFFICIALS = "mana_sports_officials_v1";
const STORAGE_KEY_ASSIGNMENTS = "mana_sports_official_assignments_v1";
const STORAGE_KEY_MERCHANDISE = "mana_sports_merchandise_v1";
const STORAGE_KEY_QUOTES = "mana_sports_supplier_quotes_v1";

const INITIAL_EVENTS: TournamentOrganizerEvent[] = [
  {
    id: "evt-org-1",
    vendorId: "vendor-sp-101",
    title: "Whitefield Premier Badminton League 2026",
    sport: "BADMINTON",
    tournamentFormat: "LEAGUE_CUM_KNOCKOUT",
    facilityId: "fac-1",
    facilityName: "SmashZone Arena - Whitefield",
    startDate: "2026-11-15",
    endDate: "2026-11-17",
    teamsLimit: 16,
    teamsRegistered: 14,
    entryFeePerTeam: 4500,
    totalPrizePool: 35000,
    status: "REGISTRATION_OPEN",
    sponsorsCount: 3,
    officialsAssignedCount: 4,
    totalRevenue: 63000,
    createdAt: "2026-02-01T10:00:00.000Z",
  },
  {
    id: "evt-org-2",
    vendorId: "vendor-sp-102",
    title: "Sarjapur Corporate Box Cricket Super Cup",
    sport: "CRICKET",
    tournamentFormat: "KNOCKOUT",
    facilityId: "fac-2",
    facilityName: "Apex Sports Arena - Sarjapur",
    startDate: "2026-11-22",
    endDate: "2026-11-23",
    teamsLimit: 12,
    teamsRegistered: 12,
    entryFeePerTeam: 6000,
    totalPrizePool: 40000,
    status: "ONGOING",
    sponsorsCount: 2,
    officialsAssignedCount: 3,
    totalRevenue: 72000,
    createdAt: "2026-02-05T12:00:00.000Z",
  },
];

const INITIAL_OFFICIALS: SportsOfficial[] = [
  {
    id: "off-1",
    fullName: "Nagaraj Sundaram",
    phone: "+91 98450 66778",
    email: "nagaraj.umpire@gmail.com",
    role: "UMPIRE",
    sports: ["CRICKET"],
    certification: "KSCA & BCCI State Level 1 Umpire",
    experienceYears: 10,
    matchFee: 1500,
    travelRadiusKm: 25,
    rating: 4.9,
    totalMatches: 142,
    status: "ACTIVE",
  },
  {
    id: "off-2",
    fullName: "Shalini Venkatesh",
    phone: "+91 97412 55667",
    email: "shalini.referee@gmail.com",
    role: "REFEREE",
    sports: ["BADMINTON"],
    certification: "BAI National Certified Badminton Official",
    experienceYears: 7,
    matchFee: 1200,
    travelRadiusKm: 20,
    rating: 4.8,
    totalMatches: 88,
    status: "ACTIVE",
  },
  {
    id: "off-3",
    fullName: "Prateek Deshmukh",
    phone: "+91 98860 33221",
    email: "prateek.lens@gmail.com",
    role: "PHOTOGRAPHER",
    sports: ["BADMINTON", "FOOTBALL", "CRICKET"],
    certification: "Canon Pro Sports Media Certified",
    experienceYears: 5,
    matchFee: 2500,
    travelRadiusKm: 30,
    rating: 4.9,
    totalMatches: 65,
    status: "ACTIVE",
  },
  {
    id: "off-4",
    fullName: "Karthik Raja",
    phone: "+91 99001 88990",
    email: "karthik.scorer@gmail.com",
    role: "SCORER",
    sports: ["CRICKET", "BADMINTON"],
    certification: "CricHeroes & Generic Digital Scoring Specialist",
    experienceYears: 4,
    matchFee: 800,
    travelRadiusKm: 15,
    rating: 4.7,
    totalMatches: 110,
    status: "ACTIVE",
  },
];

const INITIAL_ASSIGNMENTS: OfficialAssignment[] = [
  {
    id: "asg-1",
    tournamentId: "evt-org-1",
    tournamentTitle: "Whitefield Premier Badminton League 2026",
    matchTitle: "Men's Singles Quarterfinal 1",
    sport: "BADMINTON",
    officialId: "off-2",
    officialName: "Shalini Venkatesh",
    role: "REFEREE",
    venueName: "SmashZone Arena - Whitefield",
    courtOrPitch: "Court 1",
    matchDate: "2026-11-15",
    startTime: "09:00",
    matchFee: 1200,
    status: "CONFIRMED",
    notes: "Follow BWF 21-point rally scoring rules",
    createdAt: "2026-02-15T10:00:00.000Z",
  },
  {
    id: "asg-2",
    tournamentId: "evt-org-2",
    tournamentTitle: "Sarjapur Corporate Box Cricket Super Cup",
    matchTitle: "League Match 1: Tech Titans vs Sarjapur Strikers",
    sport: "CRICKET",
    officialId: "off-1",
    officialName: "Nagaraj Sundaram",
    role: "UMPIRE",
    venueName: "Apex Sports Arena - Sarjapur",
    courtOrPitch: "Pitch A",
    matchDate: "2026-11-22",
    startTime: "10:00",
    matchFee: 1500,
    status: "CONFIRMED",
    createdAt: "2026-02-18T11:00:00.000Z",
  },
];

const INITIAL_MERCHANDISE: SportsMerchandiseItem[] = [
  {
    id: "merch-1",
    vendorId: "vendor-sp-101",
    title: "Custom Sublimated Team Jersey & Shorts Kit",
    category: "JERSEY_CUSTOM",
    sport: "BADMINTON",
    description: "Breathable dry-fit polyester jerseys with player name, custom squad number, team crest, and sponsor logo sublimation printing.",
    basePrice: 550,
    availableStock: 250,
    unitOfMeasure: "Set (Jersey + Shorts)",
    leadTimeDays: 5,
    images: ["https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=500&auto=format&fit=crop&q=80"],
    options: {
      sizes: ["S", "M", "L", "XL", "XXL"],
      fabrics: ["Dry-Fit Poly Interlock", "Micro-Honeycomb Mesh"],
      printTypes: ["Full Sublimation", "Heat Transfer Vinyl"],
    },
    isActive: true,
  },
  {
    id: "merch-2",
    vendorId: "vendor-sp-101",
    title: "Championship Gold Cup & Medals Package",
    category: "TROPHY_MEDAL",
    sport: "CRICKET",
    description: "Heavy metal gold championship trophy (24 inches) with custom engraved tournament name plate + 16 gold & silver runner-up medals.",
    basePrice: 4800,
    availableStock: 15,
    unitOfMeasure: "Set (1 Trophy + 32 Medals)",
    leadTimeDays: 3,
    images: ["https://images.unsplash.com/photo-1578269174936-2709b6aeb913?w=500&auto=format&fit=crop&q=80"],
    isActive: true,
  },
  {
    id: "merch-3",
    vendorId: "vendor-sp-101",
    title: "Yonex BG65 High-Tension Racquet Stringing Service",
    category: "STRINGING_REPAIR",
    sport: "BADMINTON",
    description: "Electronic 4-point precision racquet stringing at 24-30 lbs tension using genuine Yonex BG65/Nanogy strings. Same-day turnaround available.",
    basePrice: 380,
    availableStock: 100,
    unitOfMeasure: "Per Racquet",
    leadTimeDays: 1,
    images: ["https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=500&auto=format&fit=crop&q=80"],
    isActive: true,
  },
  {
    id: "merch-4",
    vendorId: "vendor-sp-102",
    title: "Box Cricket Heavy Match Ball & Dugout Kit (Rental)",
    category: "EQUIPMENT_RENTAL",
    sport: "CRICKET",
    description: "Set of 6 match tennis balls, 4 English willow bats, wicket set, and 12 fluorescent team bibs for match-day rental.",
    basePrice: 600,
    rentalDailyPrice: 600,
    rentalDeposit: 1500,
    availableStock: 8,
    unitOfMeasure: "Full Kit / Day",
    leadTimeDays: 0,
    images: ["https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=500&auto=format&fit=crop&q=80"],
    isActive: true,
  },
];

const INITIAL_QUOTES: SupplierQuoteRequest[] = [
  {
    id: "q-101",
    vendorId: "vendor-sp-101",
    organizerName: "Sandeep Verma (Prestige Sports Committee)",
    organizerPhone: "+91 98860 12345",
    tournamentTitle: "Whitefield Premier Badminton League 2026",
    itemType: "JERSEY_CUSTOM",
    quantity: 48,
    targetBudget: 25000,
    quotedAmount: 24000,
    specifications: "48 Dry-fit jerseys in 4 distinct team colors (Red, Blue, Green, Yellow) with individual player names on back and tournament logo on chest.",
    requiredByDate: "2026-11-10",
    status: "QUOTE_PROVIDED",
    createdAt: "2026-02-12T14:00:00.000Z",
  },
  {
    id: "q-102",
    vendorId: "vendor-sp-101",
    organizerName: "Kunal Patel (Sarjapur Superstars)",
    organizerPhone: "+91 97412 11223",
    tournamentTitle: "Sarjapur Corporate Box Cricket Super Cup",
    itemType: "TROPHY_MEDAL",
    quantity: 1,
    targetBudget: 6000,
    quotedAmount: 5200,
    specifications: "1 Winner trophy, 1 Runner-up trophy, Player of the Tournament, Best Batsman, Best Bowler trophies, and 24 participant medals.",
    requiredByDate: "2026-11-18",
    status: "IN_PRODUCTION",
    createdAt: "2026-02-14T16:00:00.000Z",
  },
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

export const sportsCommerceService = {
  // ── Tournament Organizer Events ──
  async getOrganizerEvents(vendorId?: string): Promise<TournamentOrganizerEvent[]> {
    try {
      const url = vendorId ? `/sports-vendor/events?vendorId=${vendorId}` : "/sports-vendor/events";
      const res = await apiClient.get<TournamentOrganizerEvent[]>(url);
      if (res && res.length > 0) return res;
    } catch {}

    let list = getStored<TournamentOrganizerEvent[]>(STORAGE_KEY_EVENTS, INITIAL_EVENTS);
    if (vendorId) list = list.filter((e) => e.vendorId === vendorId);
    return list;
  },

  async saveOrganizerEvent(data: Partial<TournamentOrganizerEvent>): Promise<TournamentOrganizerEvent> {
    const newEvent: TournamentOrganizerEvent = {
      id: data.id || `evt-org-${Date.now()}`,
      vendorId: data.vendorId || "vendor-sp-101",
      title: data.title || "New Sports League",
      sport: data.sport || "BADMINTON",
      tournamentFormat: data.tournamentFormat || "KNOCKOUT",
      facilityId: data.facilityId || "fac-1",
      facilityName: data.facilityName || "SmashZone Arena",
      startDate: data.startDate || new Date().toISOString().split("T")[0],
      endDate: data.endDate || new Date().toISOString().split("T")[0],
      teamsLimit: data.teamsLimit || 16,
      teamsRegistered: data.teamsRegistered || 0,
      entryFeePerTeam: data.entryFeePerTeam || 3000,
      totalPrizePool: data.totalPrizePool || 20000,
      status: data.status || "REGISTRATION_OPEN",
      sponsorsCount: data.sponsorsCount || 0,
      officialsAssignedCount: data.officialsAssignedCount || 0,
      totalRevenue: (data.teamsRegistered || 0) * (data.entryFeePerTeam || 3000),
      createdAt: new Date().toISOString(),
      ...data,
    };

    const list = getStored<TournamentOrganizerEvent[]>(STORAGE_KEY_EVENTS, INITIAL_EVENTS);
    const idx = list.findIndex((e) => e.id === newEvent.id);
    if (idx >= 0) {
      list[idx] = newEvent;
    } else {
      list.push(newEvent);
    }
    setStored(STORAGE_KEY_EVENTS, list);
    return newEvent;
  },

  // ── Sports Officials ──
  async getOfficials(sport?: string): Promise<SportsOfficial[]> {
    try {
      const url = sport ? `/sports-vendor/officials?sport=${sport}` : "/sports-vendor/officials";
      const res = await apiClient.get<SportsOfficial[]>(url);
      if (res && res.length > 0) return res;
    } catch {}

    let list = getStored<SportsOfficial[]>(STORAGE_KEY_OFFICIALS, INITIAL_OFFICIALS);
    if (sport) list = list.filter((o) => o.sports.includes(sport as any));
    return list;
  },

  async getAssignments(tournamentId?: string): Promise<OfficialAssignment[]> {
    try {
      const url = tournamentId ? `/sports-vendor/official-assignments?tournamentId=${tournamentId}` : "/sports-vendor/official-assignments";
      const res = await apiClient.get<OfficialAssignment[]>(url);
      if (res && res.length > 0) return res;
    } catch {}

    let list = getStored<OfficialAssignment[]>(STORAGE_KEY_ASSIGNMENTS, INITIAL_ASSIGNMENTS);
    if (tournamentId) list = list.filter((a) => a.tournamentId === tournamentId);
    return list;
  },

  async assignOfficial(data: Partial<OfficialAssignment>): Promise<OfficialAssignment> {
    const officials = getStored<SportsOfficial[]>(STORAGE_KEY_OFFICIALS, INITIAL_OFFICIALS);
    const official = officials.find((o) => o.id === data.officialId);

    const newAssignment: OfficialAssignment = {
      id: `asg-${Date.now()}`,
      tournamentId: data.tournamentId || "evt-org-1",
      tournamentTitle: data.tournamentTitle || "Tournament",
      matchTitle: data.matchTitle || "Match",
      sport: data.sport || "BADMINTON",
      officialId: data.officialId || "off-1",
      officialName: official?.fullName || "Match Official",
      role: official?.role || "UMPIRE",
      venueName: data.venueName || "Sports Arena",
      courtOrPitch: data.courtOrPitch || "Court 1",
      matchDate: data.matchDate || new Date().toISOString().split("T")[0],
      startTime: data.startTime || "09:00",
      matchFee: official?.matchFee || 1000,
      status: "CONFIRMED",
      createdAt: new Date().toISOString(),
      ...data,
    };

    const list = getStored<OfficialAssignment[]>(STORAGE_KEY_ASSIGNMENTS, INITIAL_ASSIGNMENTS);
    list.unshift(newAssignment);
    setStored(STORAGE_KEY_ASSIGNMENTS, list);
    return newAssignment;
  },

  async updateAssignmentStatus(id: string, status: OfficialAssignmentStatus): Promise<OfficialAssignment> {
    const list = getStored<OfficialAssignment[]>(STORAGE_KEY_ASSIGNMENTS, INITIAL_ASSIGNMENTS);
    const idx = list.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error("Assignment not found");
    list[idx] = { ...list[idx], status };
    setStored(STORAGE_KEY_ASSIGNMENTS, list);
    return list[idx];
  },

  // ── Sports Merchandise & Rentals ──
  async getMerchandise(vendorId?: string, category?: string): Promise<SportsMerchandiseItem[]> {
    try {
      const params = new URLSearchParams();
      if (vendorId) params.append("vendorId", vendorId);
      if (category) params.append("category", category);
      const res = await apiClient.get<SportsMerchandiseItem[]>(`/sports-vendor/merchandise?${params.toString()}`);
      if (res && res.length > 0) return res;
    } catch {}

    let list = getStored<SportsMerchandiseItem[]>(STORAGE_KEY_MERCHANDISE, INITIAL_MERCHANDISE);
    if (vendorId) list = list.filter((m) => m.vendorId === vendorId);
    if (category && category !== "ALL") list = list.filter((m) => m.category === category);
    return list;
  },

  async saveMerchandise(data: Partial<SportsMerchandiseItem>): Promise<SportsMerchandiseItem> {
    const newItem: SportsMerchandiseItem = {
      id: data.id || `merch-${Date.now()}`,
      vendorId: data.vendorId || "vendor-sp-101",
      title: data.title || "Custom Merchandise",
      category: data.category || "JERSEY_CUSTOM",
      sport: data.sport || "BADMINTON",
      description: data.description || "",
      basePrice: data.basePrice || 500,
      rentalDeposit: data.rentalDeposit,
      rentalDailyPrice: data.rentalDailyPrice,
      availableStock: data.availableStock || 50,
      unitOfMeasure: data.unitOfMeasure || "Piece",
      leadTimeDays: data.leadTimeDays || 3,
      images: data.images?.length ? data.images : [
        "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=500&auto=format&fit=crop&q=80"
      ],
      isActive: true,
      ...data,
    };

    const list = getStored<SportsMerchandiseItem[]>(STORAGE_KEY_MERCHANDISE, INITIAL_MERCHANDISE);
    const idx = list.findIndex((m) => m.id === newItem.id);
    if (idx >= 0) {
      list[idx] = newItem;
    } else {
      list.push(newItem);
    }
    setStored(STORAGE_KEY_MERCHANDISE, list);
    return newItem;
  },

  // ── Quotes & Invoicing ──
  async getQuoteRequests(vendorId?: string): Promise<SupplierQuoteRequest[]> {
    try {
      const url = vendorId ? `/sports-vendor/quotes?vendorId=${vendorId}` : "/sports-vendor/quotes";
      const res = await apiClient.get<SupplierQuoteRequest[]>(url);
      if (res && res.length > 0) return res;
    } catch {}

    let list = getStored<SupplierQuoteRequest[]>(STORAGE_KEY_QUOTES, INITIAL_QUOTES);
    if (vendorId) list = list.filter((q) => q.vendorId === vendorId);
    return list;
  },

  async submitQuote(id: string, quotedAmount: number): Promise<SupplierQuoteRequest> {
    const list = getStored<SupplierQuoteRequest[]>(STORAGE_KEY_QUOTES, INITIAL_QUOTES);
    const idx = list.findIndex((q) => q.id === id);
    if (idx === -1) throw new Error("Quote request not found");
    list[idx] = {
      ...list[idx],
      quotedAmount,
      status: "QUOTE_PROVIDED",
    };
    setStored(STORAGE_KEY_QUOTES, list);
    return list[idx];
  },

  async updateQuoteStatus(id: string, status: QuoteStatus): Promise<SupplierQuoteRequest> {
    const list = getStored<SupplierQuoteRequest[]>(STORAGE_KEY_QUOTES, INITIAL_QUOTES);
    const idx = list.findIndex((q) => q.id === id);
    if (idx === -1) throw new Error("Quote request not found");
    list[idx] = { ...list[idx], status };
    setStored(STORAGE_KEY_QUOTES, list);
    return list[idx];
  },
};
