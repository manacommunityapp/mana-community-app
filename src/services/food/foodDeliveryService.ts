import { apiClient } from "../common/apiClient";
import type {
  DeliveryPartner, DeliveryAssignment, FoodPageResponse,
} from "../../types/food";

export const foodDeliveryService = {
  // ── Partners ──
  async registerPartner(data: { vehicleType: string; vehicleNumber?: string }): Promise<DeliveryPartner> {
    return apiClient.post<DeliveryPartner>("/food/delivery/partners", data);
  },
  async getAvailablePartners(): Promise<DeliveryPartner[]> {
    return apiClient.get<DeliveryPartner[]>("/food/delivery/partners/available");
  },

  // ── Assignments ──
  async assignDelivery(data: { orderId: number; partnerId: number }): Promise<DeliveryAssignment> {
    return apiClient.post<DeliveryAssignment>("/food/delivery/assignments", data);
  },
  async updateAssignmentStatus(assignmentId: number, status: string): Promise<DeliveryAssignment> {
    return apiClient.patch<DeliveryAssignment>(`/food/delivery/assignments/${assignmentId}/status`, { status });
  },
  async verifyOtp(assignmentId: number, otp: string): Promise<DeliveryAssignment> {
    return apiClient.post<DeliveryAssignment>(`/food/delivery/assignments/${assignmentId}/verify-otp`, { otp });
  },
  async getMyDeliveries(page = 0, size = 20): Promise<FoodPageResponse<DeliveryAssignment>> {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    return apiClient.get<FoodPageResponse<DeliveryAssignment>>(`/food/delivery/assignments/mine?${params}`);
  },

  // ── Location ──
  async updatePartnerLocation(latitude: number, longitude: number): Promise<void> {
    await apiClient.put<void>("/food/delivery/partners/location", { latitude, longitude });
  },

  // ── Zones ──
  async getDeliveryZones(): Promise<unknown[]> {
    return apiClient.get<unknown[]>("/food/delivery/zones");
  },
};
