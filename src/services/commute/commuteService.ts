import { apiClient } from "../common/apiClient";

// ── Types ──────────────────────────────────────────────────────────────────

export interface CommuteRide {
  id: number;
  driverId: number;
  driverName: string;
  driverFlat: string;
  driverPhoto?: string;
  driverRating: number;
  fromLocation: string;
  toLocation: string;
  departureTime: string;
  rideType: string;
  totalSeats: number;
  availableSeats: number;
  pricePerSeat?: number;
  free: boolean;
  vehicleType?: string;
  vehicleNumber?: string;
  notes?: string;
  status: string;
  recurring: boolean;
  ladiesOnly: boolean;
  distanceKm?: number;
  bookingCount: number;
  isMyRide: boolean;
  hasBooked: boolean;
  myBookingStatus?: string;
}

export interface CommuteBooking {
  id: number;
  passengerId: number;
  passengerName: string;
  passengerFlat: string;
  seatsBooked: number;
  status: string;
}

export interface CommuteStats {
  activeRides: number;
  myOfferedRides: number;
  myBookedRides: number;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

export interface CreateRideRequest {
  fromLocation: string;
  toLocation: string;
  departureTime: string;
  rideType: string;
  totalSeats: number;
  pricePerSeat?: number;
  free: boolean;
  vehicleType?: string;
  notes?: string;
  ladiesOnly: boolean;
}

// ── Service ────────────────────────────────────────────────────────────────

export const commuteService = {
  getStats(): Promise<CommuteStats> {
    return apiClient.get("/commute/stats");
  },

  getUpcomingRides(page = 0, size = 20): Promise<PageResponse<CommuteRide>> {
    return apiClient.get(`/commute/rides?page=${page}&size=${size}`);
  },

  searchRides(destination: string, page = 0, size = 20): Promise<PageResponse<CommuteRide>> {
    return apiClient.get(
      `/commute/rides/search?destination=${encodeURIComponent(destination)}&page=${page}&size=${size}`
    );
  },

  getMyOffers(page = 0, size = 20): Promise<PageResponse<CommuteRide>> {
    return apiClient.get(`/commute/rides/my-offers?page=${page}&size=${size}`);
  },

  getMyBookings(page = 0, size = 20): Promise<PageResponse<CommuteRide>> {
    return apiClient.get(`/commute/rides/my-bookings?page=${page}&size=${size}`);
  },

  createRide(req: CreateRideRequest): Promise<CommuteRide> {
    return apiClient.post("/commute/rides", req);
  },

  bookRide(rideId: number, seatsBooked = 1): Promise<CommuteBooking> {
    return apiClient.post(`/commute/rides/${rideId}/book`, { seatsBooked });
  },

  cancelBooking(rideId: number): Promise<void> {
    return apiClient.delete(`/commute/rides/${rideId}/book`);
  },

  cancelRide(rideId: number): Promise<void> {
    return apiClient.delete(`/commute/rides/${rideId}`);
  },
};
