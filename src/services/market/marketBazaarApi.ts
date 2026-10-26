import { apiClient } from "../common/apiClient";

export interface MarketEvent {
  id: number;
  title: string;
  description?: string;
  communityId: number;
  communityName: string;
  city?: string;
  venue: string;
  startsAt: string;
  endsAt?: string;
  status: "PUBLISHED" | "LIVE" | string;
  category?: string;
  bannerUrl?: string;
  vendorCount: number;
  availableStallCount: number;
}

export interface MarketStall {
  id: number;
  eventId: number;
  stallNumber: string;
  zone?: string;
  packageId?: number;
  packageName: string;
  description?: string;
  size?: string;
  price: number;
  currency: string;
  facilities: string[];
  allowedCategories: string[];
  floorRow?: number;
  floorColumn?: number;
  status: "AVAILABLE" | "HELD" | "BOOKED" | "UNAVAILABLE" | string;
}

export interface MarketApplication {
  id: number;
  eventId: number;
  eventTitle: string;
  stallId: number;
  stallNumber: string;
  vendorName: string;
  businessName: string;
  category: string;
  phone: string;
  products: string;
  complianceDocuments: string[];
  status: string;
  requestedAt: string;
  amountDue?: number;
  currency?: string;
  bookingId?: number;
  paymentOrderId?: string;
  rejectionReason?: string;
}

export interface MarketApplicationRequest {
  stallId: number;
  vendorName: string;
  businessName: string;
  category: string;
  phone: string;
  products: string;
  complianceDocuments: string[];
}

export interface CashfreeCheckoutOrder {
  id: number;
  manaOrderId: string;
  amount: number;
  currency: string;
  status: string;
  referenceType: string;
  referenceId: number;
  paymentSessionId?: string;
  appId?: string;
  failureReason?: string;
}

export interface MarketCreateEventRequest {
  title: string;
  description?: string;
  venue: string;
  city?: string;
  startsAt: string;
  endsAt?: string;
  category?: string;
  bannerUrl?: string;
}

export interface MarketCreateStallRequest {
  stallNumber: string;
  zone?: string;
  packageName: string;
  description?: string;
  size?: string;
  price: number;
  currency?: string;
  facilities: string[];
  allowedCategories: string[];
  floorRow?: number;
  floorColumn?: number;
}

export const marketBazaarApi = {
  organizerEvents: () => apiClient.get<MarketEvent[]>("/market/organizer/events"),
  createEvent: (request: MarketCreateEventRequest) => apiClient.post<MarketEvent>("/market/events", request),
  createStall: (eventId: number, request: MarketCreateStallRequest) =>
    apiClient.post<MarketStall>(`/market/events/${eventId}/stalls`, request),
  listApplications: (eventId: number) =>
    apiClient.get<MarketApplication[]>(`/market/events/${eventId}/applications`),
  approve: (applicationId: number, stallId: number) =>
    apiClient.post<MarketApplication>(`/market/applications/${applicationId}/approve`, { stallId }),
  reject: (applicationId: number, reason: string) =>
    apiClient.post<MarketApplication>(`/market/applications/${applicationId}/reject`, { reason }),
  listEvents: (params: { query?: string; city?: string; category?: string } = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => value && query.set(key, value));
    const suffix = query.size ? `?${query.toString()}` : "";
    return apiClient.get<MarketEvent[]>(`/market/events${suffix}`);
  },
  listStalls: (eventId: number) => apiClient.get<MarketStall[]>(`/market/events/${eventId}/stalls`),
  apply: (eventId: number, request: MarketApplicationRequest) =>
    apiClient.post<MarketApplication>(`/market/events/${eventId}/applications`, request),
  myApplications: () => apiClient.get<MarketApplication[]>("/market/vendors/me/bookings"),
  checkout: (bookingId: number) =>
    apiClient.post<CashfreeCheckoutOrder>(`/market/bookings/${bookingId}/checkout`, {}),
};




