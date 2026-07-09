import { apiClient } from "./apiClient";

export interface AmenityResponse {
  id: number;
  name: string;
  description: string;
  type: string;
  maxCapacity: number | null;
  openTime: string | null;
  closeTime: string | null;
  slotDurationMinutes: number;
  active: boolean;
  communityId: number;
}

export interface AmenityRequest {
  name: string;
  description?: string;
  type: string;
  maxCapacity?: number;
  openTime?: string;
  closeTime?: string;
  slotDurationMinutes?: number;
}

export interface BookingResponse {
  id: number;
  amenityId: number;
  amenityName: string;
  amenityType: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  purpose: string;
  status: string;
  bookedById: number;
  bookedByName: string;
  createdAt: string;
}

export interface BookingRequest {
  amenityId: number;
  bookingDate: string;
  startTime: string;
  endTime: string;
  purpose?: string;
}

export const bookingService = {
  async getAmenities(): Promise<AmenityResponse[]> {
    return apiClient.get<AmenityResponse[]>("/bookings/amenities");
  },

  async createAmenity(data: AmenityRequest): Promise<AmenityResponse> {
    return apiClient.post<AmenityResponse>("/bookings/amenities", data);
  },

  async updateAmenity(id: number, data: AmenityRequest): Promise<AmenityResponse> {
    return apiClient.put<AmenityResponse>(`/bookings/amenities/${id}`, data);
  },

  async getSlots(amenityId: number, date: string): Promise<BookingResponse[]> {
    return apiClient.get<BookingResponse[]>(`/bookings/amenities/${amenityId}/slots?date=${date}`);
  },

  async getMyBookings(): Promise<BookingResponse[]> {
    return apiClient.get<BookingResponse[]>("/bookings/mine");
  },

  async getTodaysBookings(): Promise<BookingResponse[]> {
    return apiClient.get<BookingResponse[]>("/bookings/today");
  },

  async createBooking(data: BookingRequest): Promise<BookingResponse> {
    return apiClient.post<BookingResponse>("/bookings", data);
  },

  async cancelBooking(id: number): Promise<void> {
    await apiClient.put<void>(`/bookings/${id}/cancel`, {});
  },

  async adminCancel(id: number): Promise<void> {
    await apiClient.delete<void>(`/bookings/${id}`);
  },
};
