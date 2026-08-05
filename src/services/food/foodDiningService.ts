import { apiClient } from "../common/apiClient";
import type {
  DiningReservation, DiningReservationRequest, FoodPageResponse,
} from "../../types/food";

export const foodDiningService = {
  // ── Reservations ──
  async createReservation(data: DiningReservationRequest): Promise<DiningReservation> {
    return apiClient.post<DiningReservation>("/food/dining/reservations", data);
  },
  async getMyReservations(page = 0, size = 20): Promise<FoodPageResponse<DiningReservation>> {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    return apiClient.get<FoodPageResponse<DiningReservation>>(`/food/dining/reservations/mine?${params}`);
  },
  async getReservationById(id: number): Promise<DiningReservation> {
    return apiClient.get<DiningReservation>(`/food/dining/reservations/${id}`);
  },
  async getRestaurantReservations(restaurantId: number, date?: string): Promise<DiningReservation[]> {
    const params = date ? `?date=${date}` : "";
    return apiClient.get<DiningReservation[]>(`/food/dining/reservations/restaurant/${restaurantId}${params}`);
  },
  async updateReservationStatus(id: number, status: string): Promise<DiningReservation> {
    return apiClient.patch<DiningReservation>(`/food/dining/reservations/${id}/status`, { status });
  },
  async checkIn(id: number): Promise<DiningReservation> {
    return apiClient.put<DiningReservation>(`/food/dining/reservations/${id}/check-in`, {});
  },
  async cancelReservation(id: number, reason?: string): Promise<void> {
    await apiClient.put<void>(`/food/dining/reservations/${id}/cancel`, { reason });
  },

  // ── Waitlist ──
  async joinWaitlist(restaurantId: number, partySize: number, date: string, time: string): Promise<unknown> {
    return apiClient.post<unknown>("/food/dining/waitlist", { restaurantId, partySize, date, time });
  },
  async getWaitlist(restaurantId: number): Promise<unknown[]> {
    return apiClient.get<unknown[]>(`/food/dining/waitlist/restaurant/${restaurantId}`);
  },

  // ── Dining Events ──
  async getDiningEvents(): Promise<unknown[]> {
    return apiClient.get<unknown[]>("/food/dining/events");
  },

  // ── Feedback ──
  async submitFeedback(reservationId: number, data: { rating: number; comment?: string }): Promise<void> {
    await apiClient.post<void>(`/food/dining/reservations/${reservationId}/feedback`, data);
  },
};
