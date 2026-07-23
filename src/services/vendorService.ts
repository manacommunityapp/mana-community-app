import { apiClient } from "./apiClient";
import type {
  PaginatedResponse,
  VendorResponse,
  VendorRequest,
  VendorCategoryResponse,
  VendorCategoryRequest,
  VendorRegistrationResponse,
  VendorRegistrationRequest,
  VendorServiceResponse,
  VendorServiceRequest,
  VendorAvailability,
  VendorOperatingHours,
  VendorHoliday,
  VendorBookingResponse,
  VendorBookingRequest,
  WorkOrderResponse,
  WorkOrderRequest,
  PurchaseRequestResponse,
  PurchaseRequestRequest,
  QuotationResponse,
  PurchaseOrderResponse,
  GoodsReceiptResponse,
  ContractResponse,
  ContractRequest,
  VendorInvoiceResponse,
  VendorInvoiceRequest,
  VendorPaymentResponse,
  VendorPaymentRequest,
  VendorRatingResponse,
  VendorRatingRequest,
  VendorPerformanceResponse,
  VendorDashboardStats,
  VendorFavoriteResponse,
  VendorSearchParams,
  VendorPortalStats,
  VendorDocument,
} from "../types/api";

function toQueryString(params: Record<string, unknown>): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      qs.set(key, String(value));
    }
  }
  return qs.toString();
}

// ─── Vendor CRUD ────────────────────────────────────────────────────────────

export const vendorService = {
  async getVendors(params: VendorSearchParams = {}): Promise<PaginatedResponse<VendorResponse>> {
    const qs = toQueryString({ ...params, page: params.page ?? 0, size: params.size ?? 12 });
    return apiClient.get<PaginatedResponse<VendorResponse>>(`/vendor/vendors?${qs}`);
  },

  async getVendorById(id: number): Promise<VendorResponse> {
    return apiClient.get<VendorResponse>(`/vendor/vendors/${id}`);
  },

  async createVendor(data: VendorRequest): Promise<VendorResponse> {
    return apiClient.post<VendorResponse>("/vendor/vendors", data);
  },

  async updateVendor(id: number, data: VendorRequest): Promise<VendorResponse> {
    return apiClient.put<VendorResponse>(`/vendor/vendors/${id}`, data);
  },

  async deleteVendor(id: number): Promise<void> {
    await apiClient.delete<void>(`/vendor/vendors/${id}`);
  },

  async approveVendor(id: number): Promise<VendorResponse> {
    return apiClient.put<VendorResponse>(`/vendor/vendors/${id}/approve`, {});
  },

  async rejectVendor(id: number, reason: string): Promise<VendorResponse> {
    return apiClient.put<VendorResponse>(`/vendor/vendors/${id}/reject`, { reason });
  },

  async suspendVendor(id: number, reason: string): Promise<VendorResponse> {
    return apiClient.put<VendorResponse>(`/vendor/vendors/${id}/suspend`, { reason });
  },

  async reactivateVendor(id: number): Promise<VendorResponse> {
    return apiClient.put<VendorResponse>(`/vendor/vendors/${id}/reactivate`, {});
  },

  async searchVendors(query: string, page = 0, size = 12): Promise<PaginatedResponse<VendorResponse>> {
    return apiClient.get<PaginatedResponse<VendorResponse>>(`/vendor/vendors/search?q=${encodeURIComponent(query)}&page=${page}&size=${size}`);
  },

  async getMyVendorProfile(): Promise<VendorResponse> {
    return apiClient.get<VendorResponse>("/vendor/vendors/me");
  },

  async updateMyVendorProfile(data: VendorRequest): Promise<VendorResponse> {
    return apiClient.put<VendorResponse>("/vendor/vendors/me", data);
  },
};

// ─── Vendor Categories ──────────────────────────────────────────────────────

export const vendorCategoryService = {
  async getCategories(): Promise<VendorCategoryResponse[]> {
    return apiClient.get<VendorCategoryResponse[]>("/vendor/categories");
  },

  async getCategoryById(id: number): Promise<VendorCategoryResponse> {
    return apiClient.get<VendorCategoryResponse>(`/vendor/categories/${id}`);
  },

  async createCategory(data: VendorCategoryRequest): Promise<VendorCategoryResponse> {
    return apiClient.post<VendorCategoryResponse>("/vendor/categories", data);
  },

  async updateCategory(id: number, data: VendorCategoryRequest): Promise<VendorCategoryResponse> {
    return apiClient.put<VendorCategoryResponse>(`/vendor/categories/${id}`, data);
  },

  async deleteCategory(id: number): Promise<void> {
    await apiClient.delete<void>(`/vendor/categories/${id}`);
  },

  async reorderCategories(orderedIds: number[]): Promise<void> {
    await apiClient.put<void>("/vendor/categories/reorder", { orderedIds });
  },
};

// ─── Vendor Registrations ───────────────────────────────────────────────────

export const vendorRegistrationService = {
  async getRegistrations(status?: string, page = 0, size = 10): Promise<PaginatedResponse<VendorRegistrationResponse>> {
    const qs = toQueryString({ status, page, size });
    return apiClient.get<PaginatedResponse<VendorRegistrationResponse>>(`/vendor/registrations?${qs}`);
  },

  async getRegistrationById(id: number): Promise<VendorRegistrationResponse> {
    return apiClient.get<VendorRegistrationResponse>(`/vendor/registrations/${id}`);
  },

  async submitRegistration(data: VendorRegistrationRequest): Promise<VendorRegistrationResponse> {
    return apiClient.post<VendorRegistrationResponse>("/vendor/registrations", data);
  },

  async approveRegistration(id: number, notes?: string): Promise<VendorRegistrationResponse> {
    return apiClient.put<VendorRegistrationResponse>(`/vendor/registrations/${id}/approve`, { notes });
  },

  async rejectRegistration(id: number, reason: string): Promise<VendorRegistrationResponse> {
    return apiClient.put<VendorRegistrationResponse>(`/vendor/registrations/${id}/reject`, { reason });
  },
};

// ─── Vendor Services Catalog ────────────────────────────────────────────────

export const vendorServiceCatalog = {
  async getServicesByVendor(vendorId: number, page = 0, size = 20): Promise<PaginatedResponse<VendorServiceResponse>> {
    return apiClient.get<PaginatedResponse<VendorServiceResponse>>(`/vendor/vendors/${vendorId}/services?page=${page}&size=${size}`);
  },

  async getMyServices(page = 0, size = 20): Promise<PaginatedResponse<VendorServiceResponse>> {
    return apiClient.get<PaginatedResponse<VendorServiceResponse>>(`/vendor/services/mine?page=${page}&size=${size}`);
  },

  async getServiceById(id: number): Promise<VendorServiceResponse> {
    return apiClient.get<VendorServiceResponse>(`/vendor/services/${id}`);
  },

  async createService(data: VendorServiceRequest): Promise<VendorServiceResponse> {
    return apiClient.post<VendorServiceResponse>("/vendor/services", data);
  },

  async updateService(id: number, data: VendorServiceRequest): Promise<VendorServiceResponse> {
    return apiClient.put<VendorServiceResponse>(`/vendor/services/${id}`, data);
  },

  async toggleServiceActive(id: number): Promise<void> {
    await apiClient.put<void>(`/vendor/services/${id}/toggle`, {});
  },

  async deleteService(id: number): Promise<void> {
    await apiClient.delete<void>(`/vendor/services/${id}`);
  },

  async browseServices(categoryId?: number, search?: string, sortBy?: string, page = 0, size = 12): Promise<PaginatedResponse<VendorServiceResponse>> {
    const qs = toQueryString({ categoryId, search, sortBy, page, size });
    return apiClient.get<PaginatedResponse<VendorServiceResponse>>(`/vendor/services/browse?${qs}`);
  },
};

// ─── Vendor Availability ────────────────────────────────────────────────────

export const vendorAvailabilityService = {
  async getAvailability(vendorId: number): Promise<VendorAvailability> {
    return apiClient.get<VendorAvailability>(`/vendor/vendors/${vendorId}/availability`);
  },

  async getMyAvailability(): Promise<VendorAvailability> {
    return apiClient.get<VendorAvailability>("/vendor/availability/mine");
  },

  async updateOperatingHours(hours: VendorOperatingHours): Promise<VendorAvailability> {
    return apiClient.put<VendorAvailability>("/vendor/availability/hours", hours);
  },

  async addHoliday(holiday: Omit<VendorHoliday, "id" | "vendorId">): Promise<VendorHoliday> {
    return apiClient.post<VendorHoliday>("/vendor/availability/holidays", holiday);
  },

  async removeHoliday(holidayId: number): Promise<void> {
    await apiClient.delete<void>(`/vendor/availability/holidays/${holidayId}`);
  },

  async setVacationMode(enabled: boolean, start?: string, end?: string): Promise<VendorAvailability> {
    return apiClient.put<VendorAvailability>("/vendor/availability/vacation", { enabled, start, end });
  },

  async getAvailableSlots(vendorId: number, serviceId: number, date: string): Promise<string[]> {
    return apiClient.get<string[]>(`/vendor/vendors/${vendorId}/slots?serviceId=${serviceId}&date=${date}`);
  },
};

// ─── Bookings ───────────────────────────────────────────────────────────────

export const vendorBookingService = {
  async getBookings(params: { status?: string; vendorId?: number; page?: number; size?: number } = {}): Promise<PaginatedResponse<VendorBookingResponse>> {
    const qs = toQueryString({ ...params, page: params.page ?? 0, size: params.size ?? 10 });
    return apiClient.get<PaginatedResponse<VendorBookingResponse>>(`/vendor/bookings?${qs}`);
  },

  async getMyBookings(status?: string, page = 0, size = 10): Promise<PaginatedResponse<VendorBookingResponse>> {
    const qs = toQueryString({ status, page, size });
    return apiClient.get<PaginatedResponse<VendorBookingResponse>>(`/vendor/bookings/mine?${qs}`);
  },

  async getVendorBookings(status?: string, page = 0, size = 10): Promise<PaginatedResponse<VendorBookingResponse>> {
    const qs = toQueryString({ status, page, size });
    return apiClient.get<PaginatedResponse<VendorBookingResponse>>(`/vendor/bookings/vendor?${qs}`);
  },

  async getBookingById(id: number): Promise<VendorBookingResponse> {
    return apiClient.get<VendorBookingResponse>(`/vendor/bookings/${id}`);
  },

  async createBooking(data: VendorBookingRequest): Promise<VendorBookingResponse> {
    return apiClient.post<VendorBookingResponse>("/vendor/bookings", data);
  },

  async acceptBooking(id: number): Promise<VendorBookingResponse> {
    return apiClient.put<VendorBookingResponse>(`/vendor/bookings/${id}/accept`, {});
  },

  async startBooking(id: number): Promise<VendorBookingResponse> {
    return apiClient.put<VendorBookingResponse>(`/vendor/bookings/${id}/start`, {});
  },

  async completeBooking(id: number): Promise<VendorBookingResponse> {
    return apiClient.put<VendorBookingResponse>(`/vendor/bookings/${id}/complete`, {});
  },

  async cancelBooking(id: number, reason: string): Promise<VendorBookingResponse> {
    return apiClient.put<VendorBookingResponse>(`/vendor/bookings/${id}/cancel`, { reason });
  },

  async rescheduleBooking(id: number, newDate: string, newTime: string): Promise<VendorBookingResponse> {
    return apiClient.put<VendorBookingResponse>(`/vendor/bookings/${id}/reschedule`, { scheduledDate: newDate, scheduledTime: newTime });
  },
};

// ─── Work Orders ────────────────────────────────────────────────────────────

export const vendorWorkOrderService = {
  async getWorkOrders(params: { status?: string; priority?: string; vendorId?: number; page?: number; size?: number } = {}): Promise<PaginatedResponse<WorkOrderResponse>> {
    const qs = toQueryString({ ...params, page: params.page ?? 0, size: params.size ?? 10 });
    return apiClient.get<PaginatedResponse<WorkOrderResponse>>(`/vendor/work-orders?${qs}`);
  },

  async getWorkOrderById(id: number): Promise<WorkOrderResponse> {
    return apiClient.get<WorkOrderResponse>(`/vendor/work-orders/${id}`);
  },

  async createWorkOrder(data: WorkOrderRequest): Promise<WorkOrderResponse> {
    return apiClient.post<WorkOrderResponse>("/vendor/work-orders", data);
  },

  async updateWorkOrder(id: number, data: Partial<WorkOrderRequest>): Promise<WorkOrderResponse> {
    return apiClient.put<WorkOrderResponse>(`/vendor/work-orders/${id}`, data);
  },

  async updateWorkOrderStatus(id: number, status: string, comment?: string): Promise<WorkOrderResponse> {
    return apiClient.put<WorkOrderResponse>(`/vendor/work-orders/${id}/status`, { status, comment });
  },

  async assignWorkOrder(id: number, vendorId: number): Promise<WorkOrderResponse> {
    return apiClient.put<WorkOrderResponse>(`/vendor/work-orders/${id}/assign`, { vendorId });
  },

  async deleteWorkOrder(id: number): Promise<void> {
    await apiClient.delete<void>(`/vendor/work-orders/${id}`);
  },
};

// ─── Procurement ────────────────────────────────────────────────────────────

export const vendorProcurementService = {
  // Purchase Requests
  async getPurchaseRequests(status?: string, page = 0, size = 10): Promise<PaginatedResponse<PurchaseRequestResponse>> {
    const qs = toQueryString({ status, page, size });
    return apiClient.get<PaginatedResponse<PurchaseRequestResponse>>(`/vendor/procurement/requests?${qs}`);
  },

  async createPurchaseRequest(data: PurchaseRequestRequest): Promise<PurchaseRequestResponse> {
    return apiClient.post<PurchaseRequestResponse>("/vendor/procurement/requests", data);
  },

  async approvePurchaseRequest(id: number): Promise<PurchaseRequestResponse> {
    return apiClient.put<PurchaseRequestResponse>(`/vendor/procurement/requests/${id}/approve`, {});
  },

  async rejectPurchaseRequest(id: number, reason: string): Promise<PurchaseRequestResponse> {
    return apiClient.put<PurchaseRequestResponse>(`/vendor/procurement/requests/${id}/reject`, { reason });
  },

  // Quotations
  async getQuotations(purchaseRequestId?: number, page = 0, size = 10): Promise<PaginatedResponse<QuotationResponse>> {
    const qs = toQueryString({ purchaseRequestId, page, size });
    return apiClient.get<PaginatedResponse<QuotationResponse>>(`/vendor/procurement/quotations?${qs}`);
  },

  async submitQuotation(data: unknown): Promise<QuotationResponse> {
    return apiClient.post<QuotationResponse>("/vendor/procurement/quotations", data);
  },

  async acceptQuotation(id: number): Promise<QuotationResponse> {
    return apiClient.put<QuotationResponse>(`/vendor/procurement/quotations/${id}/accept`, {});
  },

  async rejectQuotation(id: number): Promise<QuotationResponse> {
    return apiClient.put<QuotationResponse>(`/vendor/procurement/quotations/${id}/reject`, {});
  },

  // Purchase Orders
  async getPurchaseOrders(status?: string, page = 0, size = 10): Promise<PaginatedResponse<PurchaseOrderResponse>> {
    const qs = toQueryString({ status, page, size });
    return apiClient.get<PaginatedResponse<PurchaseOrderResponse>>(`/vendor/procurement/orders?${qs}`);
  },

  async createPurchaseOrder(data: unknown): Promise<PurchaseOrderResponse> {
    return apiClient.post<PurchaseOrderResponse>("/vendor/procurement/orders", data);
  },

  async updatePurchaseOrderStatus(id: number, status: string): Promise<PurchaseOrderResponse> {
    return apiClient.put<PurchaseOrderResponse>(`/vendor/procurement/orders/${id}/status?status=${status}`, {});
  },

  // Goods Receipts
  async getGoodsReceipts(poId?: number, page = 0, size = 10): Promise<PaginatedResponse<GoodsReceiptResponse>> {
    const qs = toQueryString({ purchaseOrderId: poId, page, size });
    return apiClient.get<PaginatedResponse<GoodsReceiptResponse>>(`/vendor/procurement/grn?${qs}`);
  },

  async createGoodsReceipt(data: unknown): Promise<GoodsReceiptResponse> {
    return apiClient.post<GoodsReceiptResponse>("/vendor/procurement/grn", data);
  },
};

// ─── Contracts ──────────────────────────────────────────────────────────────

export const vendorContractService = {
  async getContracts(params: { status?: string; vendorId?: number; page?: number; size?: number } = {}): Promise<PaginatedResponse<ContractResponse>> {
    const qs = toQueryString({ ...params, page: params.page ?? 0, size: params.size ?? 10 });
    return apiClient.get<PaginatedResponse<ContractResponse>>(`/vendor/contracts?${qs}`);
  },

  async getContractById(id: number): Promise<ContractResponse> {
    return apiClient.get<ContractResponse>(`/vendor/contracts/${id}`);
  },

  async createContract(data: ContractRequest): Promise<ContractResponse> {
    return apiClient.post<ContractResponse>("/vendor/contracts", data);
  },

  async updateContract(id: number, data: Partial<ContractRequest>): Promise<ContractResponse> {
    return apiClient.put<ContractResponse>(`/vendor/contracts/${id}`, data);
  },

  async renewContract(id: number, newEndDate: string): Promise<ContractResponse> {
    return apiClient.put<ContractResponse>(`/vendor/contracts/${id}/renew`, { newEndDate });
  },

  async terminateContract(id: number, reason: string): Promise<ContractResponse> {
    return apiClient.put<ContractResponse>(`/vendor/contracts/${id}/terminate`, { reason });
  },
};

// ─── Payments & Invoices ────────────────────────────────────────────────────

export const vendorInvoiceService = {
  async getInvoices(params: { status?: string; vendorId?: number; page?: number; size?: number } = {}): Promise<PaginatedResponse<VendorInvoiceResponse>> {
    const qs = toQueryString({ ...params, page: params.page ?? 0, size: params.size ?? 10 });
    return apiClient.get<PaginatedResponse<VendorInvoiceResponse>>(`/vendor/invoices?${qs}`);
  },

  async getInvoiceById(id: number): Promise<VendorInvoiceResponse> {
    return apiClient.get<VendorInvoiceResponse>(`/vendor/invoices/${id}`);
  },

  async createInvoice(data: VendorInvoiceRequest): Promise<VendorInvoiceResponse> {
    return apiClient.post<VendorInvoiceResponse>("/vendor/invoices", data);
  },

  async updateInvoiceStatus(id: number, status: string): Promise<VendorInvoiceResponse> {
    return apiClient.put<VendorInvoiceResponse>(`/vendor/invoices/${id}/status?status=${status}`, {});
  },

  async getMyInvoices(page = 0, size = 10): Promise<PaginatedResponse<VendorInvoiceResponse>> {
    return apiClient.get<PaginatedResponse<VendorInvoiceResponse>>(`/vendor/invoices/mine?page=${page}&size=${size}`);
  },
};

export const vendorPaymentService = {
  async getPayments(params: { status?: string; vendorId?: number; page?: number; size?: number } = {}): Promise<PaginatedResponse<VendorPaymentResponse>> {
    const qs = toQueryString({ ...params, page: params.page ?? 0, size: params.size ?? 10 });
    return apiClient.get<PaginatedResponse<VendorPaymentResponse>>(`/vendor/payments?${qs}`);
  },

  async processPayment(data: VendorPaymentRequest): Promise<VendorPaymentResponse> {
    return apiClient.post<VendorPaymentResponse>("/vendor/payments", data);
  },

  async getMyPayments(page = 0, size = 10): Promise<PaginatedResponse<VendorPaymentResponse>> {
    return apiClient.get<PaginatedResponse<VendorPaymentResponse>>(`/vendor/payments/mine?page=${page}&size=${size}`);
  },

  async getMyEarningsSummary(): Promise<{ totalEarnings: number; monthlyEarnings: number; pendingAmount: number; walletBalance: number }> {
    return apiClient.get("/vendor/payments/earnings-summary");
  },
};

// ─── Ratings & Reviews ──────────────────────────────────────────────────────

export const vendorRatingService = {
  async getRatings(params: { vendorId?: number; moderated?: boolean; page?: number; size?: number } = {}): Promise<PaginatedResponse<VendorRatingResponse>> {
    const qs = toQueryString({ ...params, page: params.page ?? 0, size: params.size ?? 10 });
    return apiClient.get<PaginatedResponse<VendorRatingResponse>>(`/vendor/ratings?${qs}`);
  },

  async createRating(data: VendorRatingRequest): Promise<VendorRatingResponse> {
    return apiClient.post<VendorRatingResponse>("/vendor/ratings", data);
  },

  async replyToRating(id: number, reply: string): Promise<VendorRatingResponse> {
    return apiClient.put<VendorRatingResponse>(`/vendor/ratings/${id}/reply`, { reply });
  },

  async moderateRating(id: number, status: string): Promise<VendorRatingResponse> {
    return apiClient.put<VendorRatingResponse>(`/vendor/ratings/${id}/moderate`, { status });
  },

  async reportRating(id: number, reason: string): Promise<void> {
    await apiClient.post<void>(`/vendor/ratings/${id}/report`, { reason });
  },

  async getMyRatings(page = 0, size = 10): Promise<PaginatedResponse<VendorRatingResponse>> {
    return apiClient.get<PaginatedResponse<VendorRatingResponse>>(`/vendor/ratings/mine?page=${page}&size=${size}`);
  },
};

// ─── Analytics ──────────────────────────────────────────────────────────────

export const vendorAnalyticsService = {
  async getDashboardStats(): Promise<VendorDashboardStats> {
    return apiClient.get<VendorDashboardStats>("/vendor/analytics/dashboard");
  },

  async getVendorPerformance(vendorId: number, period?: string): Promise<VendorPerformanceResponse> {
    const qs = period ? `?period=${period}` : "";
    return apiClient.get<VendorPerformanceResponse>(`/vendor/analytics/performance/${vendorId}${qs}`);
  },

  async getPortalStats(): Promise<VendorPortalStats> {
    return apiClient.get<VendorPortalStats>("/vendor/analytics/portal");
  },

  async getRevenueReport(startDate: string, endDate: string): Promise<{ labels: string[]; data: number[] }> {
    return apiClient.get(`/vendor/analytics/revenue?startDate=${startDate}&endDate=${endDate}`);
  },
};

// ─── Favorites ──────────────────────────────────────────────────────────────

export const vendorFavoriteService = {
  async getMyFavorites(): Promise<VendorFavoriteResponse[]> {
    return apiClient.get<VendorFavoriteResponse[]>("/vendor/favorites");
  },

  async addFavorite(vendorId: number): Promise<VendorFavoriteResponse> {
    return apiClient.post<VendorFavoriteResponse>(`/vendor/favorites/${vendorId}`, {});
  },

  async removeFavorite(vendorId: number): Promise<void> {
    await apiClient.delete<void>(`/vendor/favorites/${vendorId}`);
  },

  async checkFavorite(vendorId: number): Promise<{ favorited: boolean }> {
    return apiClient.get<{ favorited: boolean }>(`/vendor/favorites/${vendorId}/check`);
  },
};

// ─── Documents ──────────────────────────────────────────────────────────────

export const vendorDocumentService = {
  async getDocuments(vendorId: number): Promise<VendorDocument[]> {
    return apiClient.get<VendorDocument[]>(`/vendor/vendors/${vendorId}/documents`);
  },

  async getMyDocuments(): Promise<VendorDocument[]> {
    return apiClient.get<VendorDocument[]>("/vendor/documents/mine");
  },

  async uploadDocument(data: FormData): Promise<VendorDocument> {
    return apiClient.postForm<VendorDocument>("/vendor/documents", data);
  },

  async deleteDocument(id: number): Promise<void> {
    await apiClient.delete<void>(`/vendor/documents/${id}`);
  },

  async verifyDocument(id: number): Promise<VendorDocument> {
    return apiClient.put<VendorDocument>(`/vendor/documents/${id}/verify`, {});
  },
};
