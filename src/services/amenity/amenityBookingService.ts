import axiosInstance from "../axiosInstance";

// ── Types ──

export interface Facility {
  id: number;
  communityId: number;
  facilityCode: string;
  name: string;
  description?: string;
  facilityType: string;
  capacity?: number;
  slotDurationMinutes: number;
  openHour: number;
  closeHour: number;
  peakStartHour: number;
  peakEndHour: number;
  hourlyRate: number;
  maxBookingsPerFlatPerWeek: number;
  maxConcurrentPeakBookings: number;
  advanceBookingDays: number;
  cancellationCutoffHours: number;
  active: boolean;
}

export interface FacilitySlot {
  id: number;
  facilityId: number;
  communityId: number;
  slotDate: string;
  startTime: string;
  endTime: string;
  status: "AVAILABLE" | "BOOKED" | "HELD";
  bookedByResidentId?: number;
  bookedByFlatNo?: string;
  bookingReference?: string;
  isPeakHour: boolean;
}

export interface BookingResult {
  success: boolean;
  message: string;
  bookingReference?: string;
  slotId: number;
}

export interface CancelResult {
  success: boolean;
  message: string;
  cancelledReference?: string;
}

export interface BookingWaitlistEntry {
  id: number;
  slotId: number;
  facilityId: number;
  communityId: number;
  residentId: number;
  flatNo?: string;
  position: number;
  status: "WAITING" | "OFFERED" | "ACCEPTED" | "EXPIRED" | "CANCELLED";
  offeredAt?: string;
  offerExpiresAt?: string;
  createdAt: string;
}

export interface WaitlistResult {
  success: boolean;
  message: string;
  position?: number;
}

const BASE = "/api/amenity-booking";

// ── Facilities ──

export const getFacilities = (communityId: number) =>
  axiosInstance.get<Facility[]>(`${BASE}/facilities/${communityId}`);

export const createFacility = (facility: Partial<Facility>) =>
  axiosInstance.post<Facility>(`${BASE}/facilities`, facility);

// ── Slots ──

export const getSlots = (facilityId: number, date: string) =>
  axiosInstance.get<FacilitySlot[]>(`${BASE}/slots/${facilityId}`, { params: { date } });

export const getAvailableSlots = (facilityId: number, date: string) =>
  axiosInstance.get<FacilitySlot[]>(`${BASE}/slots/${facilityId}/available`, { params: { date } });

export const generateSlots = (facilityId: number, date: string) =>
  axiosInstance.post<FacilitySlot[]>(`${BASE}/slots/${facilityId}/generate`, null, { params: { date } });

// ── Booking ──

export const bookSlot = (slotId: number, residentId: number, flatNo: string) =>
  axiosInstance.post<BookingResult>(`${BASE}/book/${slotId}`, { residentId, flatNo });

export const cancelBooking = (slotId: number, residentId: number) =>
  axiosInstance.post<CancelResult>(`${BASE}/cancel/${slotId}`, { residentId });

// ── Waitlist ──

export const joinWaitlist = (slotId: number, residentId: number, flatNo: string) =>
  axiosInstance.post<WaitlistResult>(`${BASE}/waitlist/${slotId}/join`, { residentId, flatNo });

export const acceptWaitlistOffer = (slotId: number, residentId: number) =>
  axiosInstance.post<BookingResult>(`${BASE}/waitlist/${slotId}/accept`, { residentId });

export const cancelWaitlist = (slotId: number, residentId: number) =>
  axiosInstance.post<{ status: string }>(`${BASE}/waitlist/${slotId}/cancel`, { residentId });

export const getWaitlistSize = (slotId: number) =>
  axiosInstance.get<{ size: number }>(`${BASE}/waitlist/${slotId}/size`);

export const processExpiredOffers = () =>
  axiosInstance.post<{ promotedCount: number }>(`${BASE}/waitlist/process-expired`);

export const getMyWaitlistEntries = (residentId: number) =>
  axiosInstance.get<BookingWaitlistEntry[]>(`${BASE}/waitlist/my-entries/${residentId}`);
