import { apiClient } from '../common/apiClient';

const BASE = '/api/home-services';

// Runtime constants for bundler/Babel compatibility when imported as values
export const HsWorker = {};
export const HsWorkerAvailability = {};
export const HsServicePackage = {};
export const HsBooking = {};
export const HsBookingPhoto = {};
export const HsWarranty = {};
export const HsReworkRequest = {};
export const HsBookingRating = {};
export const HsWorkerPayout = {};
export const HsRecurringPlan = {};

export interface HsWorker {
  id: number;
  communityId: number;
  name: string;
  phone?: string;
  rating?: number;
  totalJobs: number;
  isActive: boolean;
}

export interface HsWorkerAvailability {
  id: number;
  workerId: number;
  availableDate: string;
  slotStart: string;
  slotEnd: string;
  isBooked: boolean;
}

export interface HsServicePackage {
  id: number;
  name: string;
  category: string;
  description?: string;
  durationMinutes: number;
  basePrice: number;
  isActive: boolean;
}

export interface HsBooking {
  id: number;
  userId: number;
  workerId?: number;
  packageId?: number;
  category: string;
  bookingType: 'INSTANT' | 'SCHEDULED';
  scheduledAt?: string;
  status: string;
  flatNumber?: string;
  description?: string;
  quotedPrice?: number;
  finalPrice?: number;
  createdAt: string;
}

export interface HsBookingPhoto {
  id: number;
  bookingId: number;
  stage: 'PRE_WORK' | 'POST_WORK' | 'ISSUE';
  photoUrl: string;
  caption?: string;
  uploadedAt: string;
}

export interface HsWarranty {
  id: number;
  bookingId: number;
  warrantyDays: number;
  expiresAt: string;
  status: string;
  claimReason?: string;
}

export interface HsReworkRequest {
  id: number;
  bookingId: number;
  reason: string;
  status: string;
  createdAt: string;
}

export interface HsBookingRating {
  id: number;
  bookingId: number;
  workerId: number;
  overall: number;
  punctuality?: number;
  quality?: number;
  comment?: string;
}

export interface HsWorkerPayout {
  id: number;
  workerId: number;
  amount: number;
  deductions: number;
  netAmount: number;
  paid: boolean;
  paidAt?: string;
}

export interface HsRecurringPlan {
  id: number;
  category: string;
  frequency: string;
  nextServiceDate: string;
  status: string;
}

export const homeServicesService = {
  listWorkers: (category?: string) => {
    const q = category ? `?category=${category}` : '';
    return apiClient.get<HsWorker[]>(`${BASE}/workers${q}`);
  },
  availableSlots: (date: string) => apiClient.get<HsWorkerAvailability[]>(`${BASE}/workers/available?date=${date}`),
  listPackages: (category?: string) => {
    const q = category ? `?category=${category}` : '';
    return apiClient.get<HsServicePackage[]>(`${BASE}/packages${q}`);
  },
  createBooking: (data: Partial<HsBooking>) => apiClient.post<HsBooking>(`${BASE}/bookings`, data),
  myBookings: () => apiClient.get<HsBooking[]>(`${BASE}/bookings/my`),
  cancelBooking: (id: number) => apiClient.delete<HsBooking>(`${BASE}/bookings/${id}`),
  photos: (bookingId: number) => apiClient.get<HsBookingPhoto[]>(`${BASE}/quality/photos/${bookingId}`),
  warranty: (bookingId: number) => apiClient.get<HsWarranty>(`${BASE}/quality/warranty/${bookingId}`),
  claimWarranty: (bookingId: number, reason: string) => apiClient.post<HsWarranty>(`${BASE}/quality/warranty/${bookingId}/claim`, { reason }),
  requestRework: (data: Partial<HsReworkRequest>) => apiClient.post<HsReworkRequest>(`${BASE}/quality/rework`, data),
  rateBooking: (data: Partial<HsBookingRating>) => apiClient.post<HsBookingRating>(`${BASE}/ratings`, data),
  myPlans: () => apiClient.get<HsRecurringPlan[]>(`${BASE}/plans/my`),
  createPlan: (data: Partial<HsRecurringPlan>) => apiClient.post<HsRecurringPlan>(`${BASE}/plans`, data),
  pausePlan: (id: number) => apiClient.put<HsRecurringPlan>(`${BASE}/plans/${id}/pause`, {}),
  cancelPlan: (id: number) => apiClient.delete<HsRecurringPlan>(`${BASE}/plans/${id}`),
  upsertMorningOverride: (planId: number, deliveryDate: string, overrideQty: number, paused = false) =>
    apiClient.put<any>(`${BASE}/plans/${planId}/override`, { deliveryDate, overrideQty, paused }),
  freezeMorningManifest: (vendorId: number, deliveryDate?: string) =>
    apiClient.post<any>(`${BASE}/plans/manifest/${vendorId}`, deliveryDate ? { deliveryDate } : {}),
  settleMorningDelivery: (instanceId: number, delivered: boolean, failureReason?: string) =>
    apiClient.post<any>(`${BASE}/plans/deliveries/${instanceId}/settle`, { delivered, failureReason }),
  quoteDynamicSlot: (payload: { basePrice: number; isWeekend: boolean; zoneUtilizationPct: number; sameCommunityCluster: boolean }) =>
    apiClient.post<any>(`${BASE}/bookings/quote-dynamic`, payload),
  holdSlot: (slotId: number, holdToken: string) =>
    apiClient.post<any>(`${BASE}/bookings/slots/${slotId}/hold`, { holdToken }),
  confirmHeldSlot: (slotId: number, payload: { holdToken: string; flatNumber: string; category: string; quotedPrice: number }) =>
    apiClient.post<any>(`${BASE}/bookings/slots/${slotId}/confirm`, payload),
  initiateSplitOrder: (payload: {
    orderRef: string;
    bookingId?: number;
    vendorId: number;
    grossAmount: number;
    pointsUsed: number;
    couponCode?: string;
    couponDiscount: number;
    upiAmount: number;
  }) => apiClient.post<any>(`${BASE}/payouts/multi-tender/initiate`, payload),
  completeSplitOrder: (orderRef: string, jobCompleted = true) =>
    apiClient.post<any>(`${BASE}/payouts/multi-tender/${encodeURIComponent(orderRef)}/complete`, { jobCompleted }),
  compensateSplitOrder: (orderRef: string, reason = 'UPI_TIMEOUT') =>
    apiClient.post<any>(`${BASE}/payouts/multi-tender/${encodeURIComponent(orderRef)}/compensate`, { reason }),
};

export default homeServicesService;
