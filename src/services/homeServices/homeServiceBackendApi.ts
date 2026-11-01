/**
 * Home Services — real backend API calls.
 * Maps the simpler backend model (categories, providers, bookings) to the
 * frontend types used by existing components.
 */
import { apiClient, getStoredUser } from "../common/apiClient";

export interface BackendCategory {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  isActive: boolean;
}

export interface BackendProvider {
  id: number;
  communityId: number;
  categoryId: number;
  categoryName: string | null;
  providerName: string;
  phone: string | null;
  phoneMasked: string | null;
  experienceYears: number | null;
  verificationStatus: string;
  rating: number | null;
  reviewCount: number;
  status: string;
  bio: string | null;
}

export interface BackendBooking {
  id: number;
  communityId: number;
  providerId: number;
  providerName: string | null;
  categoryId: number | null;
  categoryName: string | null;
  bookingDate: string;
  timeSlot: string | null;
  status: string;
  notes: string | null;
  amount: number | null;
  rating: number | null;
  review: string | null;
  userId: number | null;
  userName: string | null;
  createdAt: string;
}

export interface CreateBookingRequest {
  communityId: number;
  providerId: number;
  bookingDate: string;
  timeSlot?: string;
  notes?: string;
}

export interface CompleteBookingRequest {
  rating: number;
  review?: string;
  amount?: number;
}

function communityId(): number {
  return getStoredUser()?.communityId ?? 0;
}

export const homeServiceBackendApi = {
  async getCategories(): Promise<BackendCategory[]> {
    return apiClient.get<BackendCategory[]>("/home-services/categories");
  },

  async getProviders(params?: { categoryId?: number; search?: string }): Promise<BackendProvider[]> {
    const cid = communityId();
    const q = new URLSearchParams({ communityId: String(cid) });
    if (params?.categoryId) q.set("categoryId", String(params.categoryId));
    return apiClient.get<BackendProvider[]>(`/home-services/providers?${q}`);
  },

  async getProvider(id: number): Promise<BackendProvider> {
    return apiClient.get<BackendProvider>(`/home-services/providers/${id}`);
  },

  async createBooking(data: CreateBookingRequest): Promise<BackendBooking> {
    return apiClient.post<BackendBooking>("/home-services/bookings", data);
  },

  async getMyBookings(): Promise<BackendBooking[]> {
    const cid = communityId();
    return apiClient.get<BackendBooking[]>(`/home-services/bookings/my?communityId=${cid}`);
  },

  async updateBookingStatus(id: number, status: string): Promise<BackendBooking> {
    return apiClient.put<BackendBooking>(`/home-services/bookings/${id}/status`, { status });
  },

  async completeBooking(id: number, data: CompleteBookingRequest): Promise<BackendBooking> {
    return apiClient.post<BackendBooking>(`/home-services/bookings/${id}/complete`, data);
  },

  async cancelBooking(id: number): Promise<BackendBooking> {
    return apiClient.put<BackendBooking>(`/home-services/bookings/${id}/cancel`, {});
  },
};
