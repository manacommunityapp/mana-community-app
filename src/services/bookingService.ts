import { apiClient } from "./apiClient";
import type {
  ResourceCategoryRequest, ResourceCategoryResponse,
  ResourceRequest, ResourceResponse,
  ResourceBookingRequest, ResourceBookingResponse,
  SlotResponse, BusinessRuleRequest, BusinessRuleResponse,
  PricingRuleRequest, PricingRuleResponse,
  ApprovalWorkflowResponse, MaintenanceRequest, MaintenanceResponse,
  WaitlistResponse, CouponRequest, CouponResponse,
  BookingAnalyticsResponse, DashboardStatsResponse, PageResponse,
} from "../types/booking";

export const resourceBookingService = {
  // ── Resource Categories ──
  async getCategories(): Promise<ResourceCategoryResponse[]> {
    return apiClient.get<ResourceCategoryResponse[]>("/resource-booking/categories");
  },
  async createCategory(data: ResourceCategoryRequest): Promise<ResourceCategoryResponse> {
    return apiClient.post<ResourceCategoryResponse>("/resource-booking/categories", data);
  },
  async updateCategory(id: number, data: ResourceCategoryRequest): Promise<ResourceCategoryResponse> {
    return apiClient.put<ResourceCategoryResponse>(`/resource-booking/categories/${id}`, data);
  },
  async deleteCategory(id: number): Promise<void> {
    await apiClient.delete<void>(`/resource-booking/categories/${id}`);
  },

  // ── Resources ──
  async getResources(categoryId?: number): Promise<ResourceResponse[]> {
    const params = categoryId ? `?categoryId=${categoryId}` : "";
    return apiClient.get<ResourceResponse[]>(`/resource-booking/resources${params}`);
  },
  async getResource(id: number): Promise<ResourceResponse> {
    return apiClient.get<ResourceResponse>(`/resource-booking/resources/${id}`);
  },
  async createResource(data: ResourceRequest): Promise<ResourceResponse> {
    return apiClient.post<ResourceResponse>("/resource-booking/resources", data);
  },
  async updateResource(id: number, data: ResourceRequest): Promise<ResourceResponse> {
    return apiClient.put<ResourceResponse>(`/resource-booking/resources/${id}`, data);
  },
  async deleteResource(id: number): Promise<void> {
    await apiClient.delete<void>(`/resource-booking/resources/${id}`);
  },

  // ── Slots & Availability ──
  async getSlots(resourceId: number, date: string): Promise<SlotResponse[]> {
    return apiClient.get<SlotResponse[]>(`/resource-booking/resources/${resourceId}/slots?date=${date}`);
  },

  // ── Bookings ──
  async createBooking(data: ResourceBookingRequest): Promise<ResourceBookingResponse> {
    return apiClient.post<ResourceBookingResponse>("/resource-booking/bookings", data);
  },
  async getMyBookings(status?: string): Promise<ResourceBookingResponse[]> {
    const params = status ? `?status=${status}` : "";
    return apiClient.get<ResourceBookingResponse[]>(`/resource-booking/bookings/mine${params}`);
  },
  async getTodaysBookings(): Promise<ResourceBookingResponse[]> {
    return apiClient.get<ResourceBookingResponse[]>("/resource-booking/bookings/today");
  },
  async getAllBookings(page = 0, size = 20, status?: string): Promise<PageResponse<ResourceBookingResponse>> {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (status) params.set("status", status);
    return apiClient.get<PageResponse<ResourceBookingResponse>>(`/resource-booking/bookings?${params}`);
  },
  async getBooking(id: number): Promise<ResourceBookingResponse> {
    return apiClient.get<ResourceBookingResponse>(`/resource-booking/bookings/${id}`);
  },
  async cancelBooking(id: number, reason?: string): Promise<void> {
    await apiClient.put<void>(`/resource-booking/bookings/${id}/cancel`, { reason });
  },
  async approveBooking(id: number, comments?: string): Promise<ResourceBookingResponse> {
    return apiClient.put<ResourceBookingResponse>(`/resource-booking/bookings/${id}/approve`, { comments });
  },
  async rejectBooking(id: number, comments?: string): Promise<ResourceBookingResponse> {
    return apiClient.put<ResourceBookingResponse>(`/resource-booking/bookings/${id}/reject`, { comments });
  },
  async checkIn(id: number): Promise<ResourceBookingResponse> {
    return apiClient.put<ResourceBookingResponse>(`/resource-booking/bookings/${id}/check-in`, {});
  },
  async checkOut(id: number): Promise<ResourceBookingResponse> {
    return apiClient.put<ResourceBookingResponse>(`/resource-booking/bookings/${id}/check-out`, {});
  },
  async rateBooking(id: number, rating: number, comment?: string): Promise<void> {
    await apiClient.put<void>(`/resource-booking/bookings/${id}/rate`, { rating, comment });
  },
  async getBookingsByResource(resourceId: number, date: string): Promise<ResourceBookingResponse[]> {
    return apiClient.get<ResourceBookingResponse[]>(`/resource-booking/resources/${resourceId}/bookings?date=${date}`);
  },

  // ── Waitlist ──
  async joinWaitlist(resourceId: number, date: string, startTime: string, endTime: string): Promise<WaitlistResponse> {
    return apiClient.post<WaitlistResponse>("/resource-booking/waitlist", { resourceId, requestedDate: date, requestedStartTime: startTime, requestedEndTime: endTime });
  },
  async getMyWaitlist(): Promise<WaitlistResponse[]> {
    return apiClient.get<WaitlistResponse[]>("/resource-booking/waitlist/mine");
  },
  async cancelWaitlist(id: number): Promise<void> {
    await apiClient.delete<void>(`/resource-booking/waitlist/${id}`);
  },

  // ── Business Rules ──
  async getRules(resourceId?: number): Promise<BusinessRuleResponse[]> {
    const params = resourceId ? `?resourceId=${resourceId}` : "";
    return apiClient.get<BusinessRuleResponse[]>(`/resource-booking/rules${params}`);
  },
  async createRule(data: BusinessRuleRequest): Promise<BusinessRuleResponse> {
    return apiClient.post<BusinessRuleResponse>("/resource-booking/rules", data);
  },
  async updateRule(id: number, data: BusinessRuleRequest): Promise<BusinessRuleResponse> {
    return apiClient.put<BusinessRuleResponse>(`/resource-booking/rules/${id}`, data);
  },
  async deleteRule(id: number): Promise<void> {
    await apiClient.delete<void>(`/resource-booking/rules/${id}`);
  },

  // ── Pricing ──
  async getPricingRules(resourceId?: number): Promise<PricingRuleResponse[]> {
    const params = resourceId ? `?resourceId=${resourceId}` : "";
    return apiClient.get<PricingRuleResponse[]>(`/resource-booking/pricing${params}`);
  },
  async createPricingRule(data: PricingRuleRequest): Promise<PricingRuleResponse> {
    return apiClient.post<PricingRuleResponse>("/resource-booking/pricing", data);
  },
  async updatePricingRule(id: number, data: PricingRuleRequest): Promise<PricingRuleResponse> {
    return apiClient.put<PricingRuleResponse>(`/resource-booking/pricing/${id}`, data);
  },
  async deletePricingRule(id: number): Promise<void> {
    await apiClient.delete<void>(`/resource-booking/pricing/${id}`);
  },

  // ── Approval Workflows ──
  async getWorkflows(resourceId?: number): Promise<ApprovalWorkflowResponse[]> {
    const params = resourceId ? `?resourceId=${resourceId}` : "";
    return apiClient.get<ApprovalWorkflowResponse[]>(`/resource-booking/workflows${params}`);
  },

  // ── Maintenance ──
  async getMaintenanceRecords(resourceId?: number): Promise<MaintenanceResponse[]> {
    const params = resourceId ? `?resourceId=${resourceId}` : "";
    return apiClient.get<MaintenanceResponse[]>(`/resource-booking/maintenance${params}`);
  },
  async createMaintenance(data: MaintenanceRequest): Promise<MaintenanceResponse> {
    return apiClient.post<MaintenanceResponse>("/resource-booking/maintenance", data);
  },
  async updateMaintenance(id: number, data: MaintenanceRequest): Promise<MaintenanceResponse> {
    return apiClient.put<MaintenanceResponse>(`/resource-booking/maintenance/${id}`, data);
  },

  // ── Coupons ──
  async getCoupons(): Promise<CouponResponse[]> {
    return apiClient.get<CouponResponse[]>("/resource-booking/coupons");
  },
  async createCoupon(data: CouponRequest): Promise<CouponResponse> {
    return apiClient.post<CouponResponse>("/resource-booking/coupons", data);
  },
  async validateCoupon(code: string): Promise<CouponResponse> {
    return apiClient.get<CouponResponse>(`/resource-booking/coupons/validate?code=${code}`);
  },

  // ── Analytics & Dashboard ──
  async getDashboardStats(): Promise<DashboardStatsResponse> {
    return apiClient.get<DashboardStatsResponse>("/resource-booking/dashboard");
  },
  async getAnalytics(from: string, to: string, resourceId?: number): Promise<BookingAnalyticsResponse[]> {
    const params = new URLSearchParams({ from, to });
    if (resourceId) params.set("resourceId", String(resourceId));
    return apiClient.get<BookingAnalyticsResponse[]>(`/resource-booking/analytics?${params}`);
  },
};
