import { apiClient } from "../common/apiClient";
import { familyService } from "../common/familyService";

export interface TicketTypeItem {
  id?: string;
  name: string;
  price: string | number;
  qty?: string | number;
  seats?: string | number;
  capacity?: string | number;
  description?: string;
}

export interface EventContactPerson {
  id?: string;
  name: string;
  phone: string;
  role?: string;
  notes?: string;
  email?: string;
}

export interface EventResponse {
  id: number;
  title: string;
  description: string;
  type: string;
  category?: string | null;
  startDate: string;
  endDate: string | null;
  startTime: string | null;
  endTime: string | null;
  locationType: string;
  location: string;
  venueId?: number | null;
  venue?: string | null;
  city?: string | null;
  visibility?: string | null;
  status?: string | null;
  priceType: string;
  price: number | null;
  capacity: number | null;
  maxAttendees?: number | null;
  imageUrl: string | null;
  coverImageUrl?: string | null;
  coverImage?: string | null;
  organizerName: string;
  organizerContact: string;
  createdById: number;
  createdByName: string;
  communityId: number;
  attendees: number;
  isRegistered: boolean;
  createdAt: string;
  ticketTypes?: TicketTypeItem[];
  ticketTypesJson?: string | null;
  paymentModes?: string[] | string;
  upiId?: string | null;
  scannerUrl?: string | null;
  scannerImage?: string | null;
  notes?: string | null;
  contactsJson?: string | null;
  contacts?: EventContactPerson[];
  contactDetails?: EventContactPerson[];
  paymentInstructions?: string | null;
}

export interface EventVenue {
  id?: number;
  name: string;
  code?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  capacity?: number;
  amenities?: string;
  gateInfo?: string;
  mapCoordinates?: string;
  contactPerson?: string;
  contactPhone?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface EventRequest {
  title: string;
  description?: string;
  type?: string;
  startDate: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  locationType?: string;
  location?: string;
  priceType?: string;
  price?: number;
  capacity?: number;
  imageUrl?: string;
  organizerName?: string;
  organizerContact?: string;
  venueId?: number;
  venue?: string;
  city?: string;
  category?: string;
  status?: string;
  maxAttendees?: number;
  ticketTypes?: TicketTypeItem[];
  ticketTypesJson?: string;
  paymentModes?: string[] | string;
  upiId?: string;
  scannerUrl?: string;
  scannerImage?: string;
  notes?: string;
  contactsJson?: string;
  contacts?: EventContactPerson[];
  paymentInstructions?: string;
  registrationDeadline?: string;
  draftStep?: number;
}

export interface DashboardStatsResponse {
  totalEvents: number;
  upcomingEvents: number;
  totalRegistrations: number;
  totalVolunteers: number;
  totalRevenue: number;
  totalExpenses: number;
  donationTotal?: number;
  sponsorTotal?: number;
  activeSponsorCount?: number;
  pendingSponsorCount?: number;
  foodPreparedPercentage?: number;
  foodPlatesCount?: number;
  auctionRevenue?: number;
  auctionItemCount?: number;
  todaysScheduleCount?: number;
  todaysDutyCount?: number;
  pendingActionItemsCount?: number;
}

export interface DashboardAnalyticsResponse {
  dailyRegistrations: { day: string; count: number; vip: number }[];
  passCategories: { name: string; value: number; color: string }[];
  todaysScheduleDuty: { time: string; programs: number; volunteers: number }[];
  budgetVsExpenses: { cat: string; budget: number; spent: number }[];
}

export interface RegistrationResponse {
  id: number;
  eventId: number;
  eventTitle: string;
  userId: number;
  userName: string;
  userEmail: string;
  status: string;
  registeredAt: string;
  checkedIn?: boolean;
  checkedInAt?: string;
}

export interface PoojaRegistrationRequest {
  eventId: number;
  mainEventId?: number;
  activityId?: string;
  eventName: string;
  activityTitle: string;
  category: "Pooja";
  primaryName: string;
  participantName: string;
  phone?: string;
  email?: string;
  gotram?: string;
  flatNo?: string;
  devoteeCount: 1;
  passType?: string;
  poojaSlot: string;
  poojaSlotDate: string;
  poojaSlotTime: string;
  poojaSlotName: string;
  slotDate: string;
  slotTime: string;
  timeSlot: string;
  timeSlotName: string;
  eventDate: string;
  eventDateDisplay: string;
  eventTime: string;
  eventTimeDisplay: string;
  venue?: string;
  bookingFee: number;
  paymentStatus: "FREE" | "PAID" | "PENDING";
  paymentMethod?: string;
  prasadamMode?: string;
  status?: string;
  scheduleId?: number;
  reservationId?: number;
  poojaSevaTimeSlotsId?: number;
  targetUserId?: number;
  // Audit fields (set by backend; present on responses)
  registrationSource?: "SELF" | "ADMIN" | "IMPORT";
  registeredBy?: number;
  overrideUsed?: boolean;
  overrideReason?: string;
}

/** Request body for POST /api/events/pooja-registrations/admin-create */
export interface AdminPoojaRegistrationRequest {
  targetUserId: number;
  overrideReason?: string;
  eventId?: number;
  scheduleId?: number;
  reservationId?: number;
  poojaSevaTimeSlotsId?: number;
  poojaSlotName?: string;
  poojaSlotDate?: string;
  poojaSlotTime?: string;
  participantName: string;
  gotram?: string;
  phone?: string;
  email?: string;
  flatNo?: string;
  devoteeCount?: number;
  attendingDevotees?: string;
  venue?: string;
  mandap?: string;
  panditName?: string;
  bookingFee?: number;
  paymentStatus?: string;
  paymentMethod?: string;
  prasadamMode?: string;
  status?: string;
  notes?: string;
}

/** A single devotee row from event_pooja_booking_participants */
export interface PoojaBookingParticipant {
  id: number;
  registrationId: number;
  name: string;
  gotram?: string;
  nakshatra?: string;
  relation?: string;
  qrCodeUrl?: string;
  checkedIn: boolean;
  checkedInAt?: string;
  createdAt: string;
}

/** Minimal user projection returned by GET /api/events/pooja-registrations/admin/user-search */
export interface UserSearchResult {
  id: number;
  fullName?: string;
  name?: string;
  email?: string;
  phone?: string;
  flatNo?: string;
}

export interface PoojaScheduleDto {
  id: number;
  poojaId: number;
  poojaName: string;
  scheduleDate: string;
  startTime: string;
  endTime: string;
  familyCapacity: number;
  devoteeCapacity: number;
  status: "OPEN" | "LIMITED" | "FULL" | "BLOCKED" | "CLOSED";
  availableFamilies: number;
  availableDevotees: number;
  nextTokenSeq: number;
  timeSlotConfigId?: number;
}

export interface PoojaReserveRequest {
  idempotencyKey: string;
  familyCount?: number;
  devoteeCount?: number;
}

export interface PoojaReserveResponse {
  reservationId: number;
  scheduleId: number;
  idempotencyKey: string;
  reservedFamilyCount: number;
  reservedDevoteeCount: number;
  expiresAt: string;
  status: string;
  tokenNumber: number;
}

export interface EventAuctionItemResponse {
  id: number;
  eventId?: number | null;
  eventTitle?: string | null;
  name: string;
  description?: string | null;
  category?: string | null;
  basePrice: number;
  currentBid: number;
  minIncrement: number;
  imageEmoji?: string | null;
  imageUrl?: string | null;
  status: "UPCOMING" | "LIVE" | "CLOSED";
  sortOrder: number;
  bidCount: number;
  leaderName?: string | null;
  closedAt?: string | null;
  createdAt?: string | null;
}

export interface EventAuctionItemRequest {
  eventId?: number | null;
  name: string;
  description?: string;
  category?: string;
  basePrice: number;
  minIncrement?: number;
  imageEmoji?: string;
  imageUrl?: string;
  status?: "UPCOMING" | "LIVE" | "CLOSED";
  sortOrder?: number;
}

export interface EventAuctionBidResponse {
  id: number;
  itemId: number;
  itemName: string;
  eventId?: number | null;
  bidderUserId?: number | null;
  bidderName: string;
  amount: number;
  bidAt: string;
  timeAgo: string;
}

export interface EventAuctionStatsResponse {
  totalRevenue: number;
  totalItems: number;
  liveItemsCount: number;
  closedItemsCount: number;
  upcomingItemsCount: number;
  totalBidsCount: number;
  leaderboard: {
    rank: number;
    name: string;
    totalAmount: number;
    bidCount: number;
  }[];
}

export interface PendingActionItemResponse {
  id: string;
  task: string;
  due: string;
  priority: string;
  category: string;
  done: boolean;
}

function parseNumericId(id: number | string | undefined | null): number | null {
  if (id === undefined || id === null) return null;
  if (typeof id === "number") return isNaN(id) || id <= 0 ? null : id;
  const digitsOnly = String(id).replace(/\D/g, "");
  if (!digitsOnly) return null;
  const num = Number(digitsOnly);
  return isNaN(num) || num <= 0 ? null : num;
}

export const eventService = {
  async getUpcomingEvents(type?: string): Promise<EventResponse[]> {
    const qs = type && type !== "All" ? `?type=${type}` : "";
    return apiClient.get<EventResponse[]>(`/events${qs}`);
  },

  async getAllEvents(): Promise<EventResponse[]> {
    return apiClient.get<EventResponse[]>("/events/all");
  },

  async getAll(): Promise<EventResponse[]> {
    return this.getAllEvents();
  },

  async getMyEvents(): Promise<EventResponse[]> {
    return apiClient.get<EventResponse[]>("/events/mine");
  },

  async getById(id: number | string): Promise<EventResponse> {
    const numericId = parseNumericId(id);
    if (!numericId) {
      throw new Error(`Invalid event ID: ${id}`);
    }
    return apiClient.get<EventResponse>(`/events/${numericId}`);
  },

  async getEventById(id: number | string): Promise<EventResponse> {
    return this.getById(id);
  },

  async create(data: EventRequest): Promise<EventResponse> {
    return apiClient.post<EventResponse>("/events", data);
  },

  async update(id: number | string, data: EventRequest): Promise<EventResponse> {
    const numericId = parseNumericId(id);
    if (!numericId) throw new Error(`Invalid event ID: ${id}`);
    return apiClient.put<EventResponse>(`/events/${numericId}`, data);
  },

  async deleteEvent(id: number | string): Promise<void> {
    const numericId = parseNumericId(id);
    if (!numericId) throw new Error(`Invalid event ID: ${id}`);
    await apiClient.delete<void>(`/events/${numericId}`);
  },

  async register(id: number | string): Promise<EventResponse> {
    const numericId = parseNumericId(id);
    if (!numericId) throw new Error(`Invalid event ID: ${id}`);
    return apiClient.post<EventResponse>(`/events/${numericId}/register`, {});
  },

  async unregister(id: number | string): Promise<EventResponse> {
    const numericId = parseNumericId(id);
    if (!numericId) throw new Error(`Invalid event ID: ${id}`);
    return apiClient.delete<EventResponse>(`/events/${numericId}/register`);
  },

  async getDashboardStats(): Promise<DashboardStatsResponse> {
    return apiClient.get<DashboardStatsResponse>("/events/dashboard/stats");
  },

  async getDashboardAnalytics(): Promise<DashboardAnalyticsResponse> {
    return apiClient.get<DashboardAnalyticsResponse>("/events/dashboard/analytics");
  },

  async getPendingActionItems(): Promise<PendingActionItemResponse[]> {
    return apiClient.get<PendingActionItemResponse[]>("/events/dashboard/pending-actions");
  },

  async getEventRegistrations(eventId: number | string): Promise<RegistrationResponse[]> {
    const numericId = parseNumericId(eventId);
    if (!numericId) return [];
    return apiClient.get<RegistrationResponse[]>(`/events/${numericId}/registrations`);
  },

  async confirmRegistration(regId: number | string): Promise<RegistrationResponse> {
    const numericId = parseNumericId(regId);
    if (!numericId) throw new Error(`Invalid registration ID: ${regId}`);
    return apiClient.put<RegistrationResponse>(`/events/registrations/${numericId}/confirm`, {});
  },

  async rejectRegistration(regId: number | string): Promise<RegistrationResponse> {
    const numericId = parseNumericId(regId);
    if (!numericId) throw new Error(`Invalid registration ID: ${regId}`);
    return apiClient.put<RegistrationResponse>(`/events/registrations/${numericId}/reject`, {});
  },

  async toggleCheckIn(regId: number | string, checkedIn: boolean): Promise<RegistrationResponse> {
    const numericId = parseNumericId(regId);
    if (!numericId) throw new Error(`Invalid registration ID: ${regId}`);
    return apiClient.put<RegistrationResponse>(`/events/registrations/${numericId}/check-in?checkedIn=${checkedIn}`, {});
  },

  async getPoojaTypes(): Promise<{ id: number; name: string; description?: string }[]> {
    try {
      const res = await apiClient.get<{ id: number; name: string; description?: string }[]>("/events/pooja-types");
      if (Array.isArray(res) && res.length > 0) return res;
    } catch {
      // Fallback
    }
    return [
      { id: 1, name: "Ganesh Puja" },
      { id: 2, name: "Ganapati Homam" },
      { id: 3, name: "Abhishekam" },
      { id: 4, name: "Maha Aarti" },
      { id: 5, name: "Satyanarayan Puja" },
      { id: 6, name: "Laghu Rudra" },
      { id: 7, name: "Navagraha Puja" },
      { id: 8, name: "Sahasranama Archana" },
    ];
  },

  async createPoojaType(name: string, description?: string): Promise<{ id: number; name: string; description?: string }> {
    try {
      return await apiClient.post<{ id: number; name: string; description?: string }>("/events/pooja-types", { name, description });
    } catch {
      return { id: Date.now(), name, description };
    }
  },

  async getCulturalCategories(): Promise<{ id: number; name: string; description?: string }[]> {
    try {
      const res = await apiClient.get<{ id: number; name: string; description?: string }[]>("/events/cultural-categories");
      if (Array.isArray(res) && res.length > 0) return res;
    } catch {
      // Fallback
    }
    return [
      { id: 1, name: "Classical Dance" },
      { id: 2, name: "Folk Dance" },
      { id: 3, name: "Vocal Music" },
      { id: 4, name: "Instrumental Music" },
      { id: 5, name: "Drama / Skit" },
      { id: 6, name: "Devotional Chanting" },
    ];
  },

  async createCulturalCategory(name: string, description?: string): Promise<{ id: number; name: string; description?: string }> {
    try {
      return await apiClient.post<{ id: number; name: string; description?: string }>("/events/cultural-categories", { name, description });
    } catch {
      return { id: Date.now(), name, description };
    }
  },

  async getCulturalPerformanceTypes(): Promise<{ id: number; name: string; description?: string }[]> {
    try {
      const res = await apiClient.get<{ id: number; name: string; description?: string }[]>("/events/cultural-performance-types");
      if (Array.isArray(res) && res.length > 0) return res;
    } catch {
      // Fallback
    }
    return [
      { id: 1, name: "Solo Performance" },
      { id: 2, name: "Duet" },
      { id: 3, name: "Group Performance (3-8 members)" },
      { id: 4, name: "Mega Group Performance (8+ members)" },
    ];
  },

  async createCulturalPerformanceType(name: string, description?: string): Promise<{ id: number; name: string; description?: string }> {
    try {
      return await apiClient.post<{ id: number; name: string; description?: string }>("/events/cultural-performance-types", { name, description });
    } catch {
      return { id: Date.now(), name, description };
    }
  },

  async getCompetitionCategories(): Promise<{ id: number; name: string; description?: string }[]> {
    return apiClient.get<{ id: number; name: string; description?: string }[]>("/events/competition-categories");
  },

  async createCompetitionCategory(name: string, description?: string): Promise<{ id: number; name: string; description?: string }> {
    return apiClient.post<{ id: number; name: string; description?: string }>("/events/competition-categories", { name, description });
  },

  async getCompetitionAgeGroups(): Promise<{ id: number; name: string; description?: string }[]> {
    return apiClient.get<{ id: number; name: string; description?: string }[]>("/events/competition-age-groups");
  },

  async createCompetitionAgeGroup(name: string, description?: string): Promise<{ id: number; name: string; description?: string }> {
    return apiClient.post<{ id: number; name: string; description?: string }>("/events/competition-age-groups", { name, description });
  },

  async getPoojaSevas(eventId?: number): Promise<any[]> {
    const qs = eventId ? `?mainEventId=${eventId}&eventId=${eventId}` : "";
    return apiClient.get<any[]>(`/events/pooja-sevas${qs}`);
  },

  async createPoojaSeva(data: any): Promise<any> {
    return apiClient.post<any>("/events/pooja-sevas", data);
  },

  async updatePoojaSeva(id: number, data: any): Promise<any> {
    return apiClient.put<any>(`/events/pooja-sevas/${id}`, data);
  },

  async deletePoojaSeva(id: number): Promise<void> {
    return apiClient.delete<void>(`/events/pooja-sevas/${id}`);
  },

  async getCulturalEvents(eventId?: number): Promise<any[]> {
    const qs = eventId ? `?mainEventId=${eventId}&eventId=${eventId}` : "";
    return apiClient.get<any[]>(`/events/cultural-events${qs}`);
  },

  async createCulturalEvent(data: any): Promise<any> {
    return apiClient.post<any>("/events/cultural-events", data);
  },

  async updateCulturalEvent(id: number, data: any): Promise<any> {
    return apiClient.put<any>(`/events/cultural-events/${id}`, data);
  },

  async deleteCulturalEvent(id: number): Promise<void> {
    return apiClient.delete<void>(`/events/cultural-events/${id}`);
  },

  async getCompetitions(eventId?: number): Promise<any[]> {
    const qs = eventId ? `?mainEventId=${eventId}&eventId=${eventId}` : "";
    return apiClient.get<any[]>(`/events/competitions${qs}`);
  },

  async createCompetition(data: any): Promise<any> {
    return apiClient.post<any>("/events/competitions", data);
  },

  async updateCompetition(id: number, data: any): Promise<any> {
    return apiClient.put<any>(`/events/competitions/${id}`, data);
  },

  async deleteCompetition(id: number): Promise<void> {
    return apiClient.delete<void>(`/events/competitions/${id}`);
  },

  async getLunchDinners(mainEventId?: number): Promise<any[]> {
    const qs = mainEventId ? `?mainEventId=${mainEventId}&eventId=${mainEventId}` : "";
    return apiClient.get<any[]>(`/events/lunch-dinners${qs}`);
  },

  async createLunchDinner(data: any): Promise<any> {
    return apiClient.post<any>("/events/lunch-dinners", data);
  },

  async updateLunchDinner(id: number, data: any): Promise<any> {
    return apiClient.put<any>(`/events/lunch-dinners/${id}`, data);
  },

  async deleteLunchDinner(id: number): Promise<void> {
    return apiClient.delete<void>(`/events/lunch-dinners/${id}`);
  },

  async getVenues(status?: string): Promise<EventVenue[]> {
    const qs = status ? `?status=${encodeURIComponent(status)}` : "";
    return apiClient.get<EventVenue[]>(`/events/venues${qs}`);
  },

  async getVenueById(id: number): Promise<EventVenue> {
    return apiClient.get<EventVenue>(`/events/venues/${id}`);
  },

  async createVenue(data: Partial<EventVenue>): Promise<EventVenue> {
    return apiClient.post<EventVenue>("/events/venues", data);
  },

  async updateVenue(id: number, data: Partial<EventVenue>): Promise<EventVenue> {
    return apiClient.put<EventVenue>(`/events/venues/${id}`, data);
  },

  async deleteVenue(id: number): Promise<void> {
    return apiClient.delete<void>(`/events/venues/${id}`);
  },

  async getFamilyMembers(_eventId?: number): Promise<any[]> {
    return familyService.getFamilyMembers();
  },

  async addFamilyMember(data: any, _eventId?: number | string): Promise<any> {
    return familyService.addFamilyMember(data);
  },

  async updateFamilyMember(id: number | string, data: any): Promise<any> {
    return familyService.updateFamilyMember(id, data);
  },

  async deleteFamilyMember(id: number | string): Promise<void> {
    return familyService.deleteFamilyMember(id);
  },

  async createRegistration(data: any): Promise<any> {
    return apiClient.post<any>("/events/registrations", data);
  },

  async createPoojaRegistration(data: PoojaRegistrationRequest): Promise<any> {
    return apiClient.post<any>("/events/pooja-registrations", data);
  },

  async getPoojaRegistrations(): Promise<any[]> {
    return apiClient.get<any[]>("/events/pooja-registrations");
  },

  async getMyPoojaRegistrations(): Promise<any[]> {
    return apiClient.get<any[]>("/events/pooja-registrations/my");
  },

  async getMyRegistrations(): Promise<any[]> {
    const [generalRegs, poojaRegs] = await Promise.allSettled([
      apiClient.get<any[]>("/events/registrations/my"),
      apiClient.get<any[]>("/events/pooja-registrations/my"),
    ]);

    const general = generalRegs.status === "fulfilled" && Array.isArray(generalRegs.value) ? generalRegs.value : [];
    const pooja = poojaRegs.status === "fulfilled" && Array.isArray(poojaRegs.value) ? poojaRegs.value : [];

    const normalizedPooja = pooja.map((p) => ({
      ...p,
      activityId: (() => {
        if (p.activityId) {
          const s = String(p.activityId);
          return s.startsWith("pooja-") ? s : `pooja-${s}`;
        }
        return p.eventId ? `pooja-${p.eventId}` : `pooja-${p.id}`;
      })(),
      activityTitle: p.activityTitle || p.eventName || p.poojaSlotName || "Pooja Seva",
      category: p.category || "Pooja",
      passType: p.passType || "Pooja Registration Pass",
      eventDate: p.eventDate || p.poojaSlotDate,
      eventTime: p.eventTime || p.poojaSlotTime,
    }));

    const seen = new Set<string>();
    const combined: any[] = [];
    for (const r of [...normalizedPooja, ...general]) {
      const key = r.regCode || (r.id ? `${r.category || 'REG'}-${r.id}` : JSON.stringify(r));
      if (!seen.has(key)) {
        seen.add(key);
        combined.push(r);
      }
    }
    return combined;
  },

  async getAllRegistrations(): Promise<any[]> {
    const [generalRegs, poojaRegs] = await Promise.allSettled([
      apiClient.get<any[]>("/events/registrations"),
      apiClient.get<any[]>("/events/pooja-registrations"),
    ]);

    const general = generalRegs.status === "fulfilled" && Array.isArray(generalRegs.value) ? generalRegs.value : [];
    const pooja = poojaRegs.status === "fulfilled" && Array.isArray(poojaRegs.value) ? poojaRegs.value : [];

    const normalizedPooja = pooja.map((p) => ({
      ...p,
      activityId: (() => {
        if (p.activityId) {
          const s = String(p.activityId);
          return s.startsWith("pooja-") ? s : `pooja-${s}`;
        }
        return p.eventId ? `pooja-${p.eventId}` : `pooja-${p.id}`;
      })(),
      activityTitle: p.activityTitle || p.eventName || p.poojaSlotName || "Pooja Seva",
      category: p.category || "Pooja",
      passType: p.passType || "Pooja Registration Pass",
      eventDate: p.eventDate || p.poojaSlotDate,
      eventTime: p.eventTime || p.poojaSlotTime,
    }));

    const seen = new Set<string>();
    const combined: any[] = [];
    for (const r of [...normalizedPooja, ...general]) {
      const key = r.regCode || (r.id ? `${r.category || 'REG'}-${r.id}` : JSON.stringify(r));
      if (!seen.has(key)) {
        seen.add(key);
        combined.push(r);
      }
    }
    return combined;
  },

  async updateRegistration(id: number | string, data: any): Promise<any> {
    const numericId = parseNumericId(id);
    if (!numericId) throw new Error(`Invalid registration ID: ${id}`);
    try {
      return await apiClient.put<any>(`/events/registrations/${numericId}`, data);
    } catch {
      return await apiClient.put<any>(`/events/pooja-registrations/${numericId}`, data);
    }
  },

  async updatePoojaRegistration(id: number | string, data: PoojaRegistrationRequest): Promise<any> {
    const numericId = parseNumericId(id);
    if (!numericId) throw new Error(`Invalid registration ID: ${id}`);
    return apiClient.put<any>(`/events/pooja-registrations/${numericId}`, data);
  },

  async cancelRegistration(id: number | string, reason?: string): Promise<void> {
    const numericId = parseNumericId(id);
    if (!numericId) throw new Error(`Invalid registration ID: ${id}`);
    const qs = reason ? `?reason=${encodeURIComponent(reason)}` : "";
    await apiClient.delete<void>(`/events/pooja-registrations/${numericId}${qs}`);
  },

  async deleteRegistrationPermanent(id: number | string): Promise<void> {
    const numericId = parseNumericId(id);
    if (!numericId) throw new Error(`Invalid registration ID: ${id}`);
    await apiClient.delete<void>(`/events/pooja-registrations/${numericId}?permanent=true`);
  },

  async adminCreateRegistration(data: any): Promise<any> {
    if (data?.category?.toLowerCase() === "pooja") {
      // Use the dedicated admin-create endpoint so targetUserId/overrideReason travel in the body
      const body: AdminPoojaRegistrationRequest = {
        targetUserId: data.targetUserId,
        overrideReason: data.overrideReason,
        eventId: data.eventId,
        scheduleId: data.scheduleId,
        reservationId: data.reservationId,
        poojaSevaTimeSlotsId: data.poojaSevaTimeSlotsId,
        poojaSlotName: data.poojaSlotName || data.activityTitle,
        poojaSlotDate: data.poojaSlotDate || data.eventDate,
        poojaSlotTime: data.poojaSlotTime || data.eventTime,
        participantName: data.participantName || data.primaryName || "",
        gotram: data.gotram,
        phone: data.phone,
        email: data.email,
        flatNo: data.flatNo,
        devoteeCount: data.devoteeCount,
        attendingDevotees: data.attendingDevotees,
        venue: data.venue,
        bookingFee: data.bookingFee,
        paymentStatus: data.paymentStatus,
        paymentMethod: data.paymentMethod,
        prasadamMode: data.prasadamMode,
        status: data.status,
        notes: data.notes,
      };
      return apiClient.post<any>("/events/pooja-registrations/admin-create", body);
    }
    return apiClient.post<any>("/events/registrations?adminOverride=true", data);
  },

  /** Search community members by name — used by admin manual registration picker. */
  async searchCommunityUsers(query: string, communityId?: number): Promise<UserSearchResult[]> {
    const qs = new URLSearchParams({ q: query || "" });
    if (communityId) qs.set("communityId", String(communityId));
    return apiClient.get<UserSearchResult[]>(`/events/pooja-registrations/admin/user-search?${qs}`);
  },

  /** Fetch the normalized participant rows for a Pooja registration. */
  async getPoojaRegistrationParticipants(registrationId: number): Promise<PoojaBookingParticipant[]> {
    return apiClient.get<PoojaBookingParticipant[]>(`/events/pooja-registrations/${registrationId}/participants`);
  },

  /** Update the status of a config-level time slot (OPEN / BLOCKED / CLOSED). */
  async updatePoojaTimeSlotStatus(slotId: number, status: "OPEN" | "BLOCKED" | "CLOSED"): Promise<any> {
    return apiClient.patch<any>(`/events/pooja-sevas/time-slots/${slotId}/status`, { status });
  },

  async getSchedulesByPooja(poojaId: number): Promise<PoojaScheduleDto[]> {
    return apiClient.get<PoojaScheduleDto[]>(`/events/pooja-schedules?poojaId=${poojaId}`);
  },

  async reserveSlot(scheduleId: number, body: PoojaReserveRequest): Promise<PoojaReserveResponse> {
    return apiClient.post<PoojaReserveResponse>(`/events/pooja-schedules/${scheduleId}/reserve`, body);
  },

  async createPoojaSchedule(data: {
    poojaId: number;
    scheduleDate: string;
    startTime: string;
    endTime: string;
    familyCapacity: number;
    devoteeCapacity: number;
  }): Promise<PoojaScheduleDto> {
    return apiClient.post<PoojaScheduleDto>("/events/pooja-schedules", data);
  },

  async updatePoojaSchedule(id: number, data: {
    scheduleDate?: string;
    startTime?: string;
    endTime?: string;
    familyCapacity?: number;
    devoteeCapacity?: number;
  }): Promise<PoojaScheduleDto> {
    return apiClient.put<PoojaScheduleDto>(`/events/pooja-schedules/${id}`, data);
  },

  async updatePoojaScheduleStatus(id: number, status: string): Promise<PoojaScheduleDto> {
    return apiClient.patch<PoojaScheduleDto>(`/events/pooja-schedules/${id}/status`, { status });
  },

  async deletePoojaSchedule(id: number): Promise<void> {
    return apiClient.delete<void>(`/events/pooja-schedules/${id}`);
  },

  async getScheduleAvailableDates(poojaId: number): Promise<string[]> {
    return apiClient.get<string[]>(`/events/pooja-schedules/available-dates?poojaId=${poojaId}`);
  },

  async rescheduleRegistration(registrationId: number, newScheduleId: number, idempotencyKey: string): Promise<any> {
    return apiClient.post<any>(`/events/pooja-registrations/${registrationId}/reschedule`, {
      newScheduleId,
      idempotencyKey,
    });
  },

  async getScheduleReservations(scheduleId: number): Promise<any[]> {
    return apiClient.get<any[]>(`/events/pooja-schedules/${scheduleId}/reservations`);
  },

  async getAuctionItems(eventId?: number): Promise<EventAuctionItemResponse[]> {
    const qs = eventId ? `?eventId=${eventId}` : "";
    return apiClient.get<EventAuctionItemResponse[]>(`/events/auction-items${qs}`);
  },

  async getAuctionItem(id: number): Promise<EventAuctionItemResponse> {
    return apiClient.get<EventAuctionItemResponse>(`/events/auction-items/${id}`);
  },

  async createAuctionItem(data: EventAuctionItemRequest): Promise<EventAuctionItemResponse> {
    return apiClient.post<EventAuctionItemResponse>("/events/auction-items", data);
  },

  async updateAuctionItem(id: number, data: EventAuctionItemRequest): Promise<EventAuctionItemResponse> {
    return apiClient.put<EventAuctionItemResponse>(`/events/auction-items/${id}`, data);
  },

  async deleteAuctionItem(id: number): Promise<void> {
    return apiClient.delete<void>(`/events/auction-items/${id}`);
  },

  async placeAuctionBid(itemId: number, amount: number): Promise<EventAuctionItemResponse> {
    return apiClient.post<EventAuctionItemResponse>(`/events/auction-items/${itemId}/bid`, { itemId, amount });
  },

  async getAuctionBids(itemId: number): Promise<EventAuctionBidResponse[]> {
    return apiClient.get<EventAuctionBidResponse[]>(`/events/auction-items/${itemId}/bids`);
  },

  async getRecentAuctionBids(): Promise<EventAuctionBidResponse[]> {
    return apiClient.get<EventAuctionBidResponse[]>("/events/auction-items/recent-bids");
  },

  async getAuctionStats(eventId?: number): Promise<EventAuctionStatsResponse> {
    const qs = eventId ? `?eventId=${eventId}` : "";
    return apiClient.get<EventAuctionStatsResponse>(`/events/auction-items/stats${qs}`);
  },
};
