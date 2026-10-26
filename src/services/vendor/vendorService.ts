import { apiClient } from "../common/apiClient";
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
} from "../../types/api";

function mapInvoice(value: any): VendorInvoiceResponse {
  return {
    ...value,
    balanceAmount: value.balanceAmount ?? value.balanceDue ?? 0,
    issueDate: value.issueDate ?? value.createdAt,
    updatedAt: value.updatedAt ?? value.createdAt,
    items: (value.items ?? []).map((item: any) => ({ ...item, totalPrice: item.totalPrice ?? item.total, taxRate: item.taxRate ?? item.taxPercent })),
  } as VendorInvoiceResponse;
}

function mapPayment(value: any): VendorPaymentResponse {
  return {
    ...value,
    invoiceId: value.invoiceId ?? 0,
    invoiceNumber: value.invoiceNumber ?? "",
    method: value.method ?? value.paymentMethod,
    paidAt: value.paidAt ?? value.paymentDate,
    remarks: value.remarks ?? value.notes,
  } as VendorPaymentResponse;
}

function mapRating(value: any): VendorRatingResponse {
  const status = String(value.moderationStatus ?? value.status ?? "PENDING").toUpperCase();
  return {
    ...value,
    rating: Number(value.rating ?? value.overallRating ?? 0),
    customer: value.customer ?? { id: value.user?.id ?? 0, fullName: value.user?.fullName ?? "Anonymous" },
    moderationStatus: status === "PUBLISHED" ? "APPROVED" : status === "HIDDEN" ? "REJECTED" : status,
    reply: value.reply ?? undefined,
    repliedAt: value.repliedAt ?? undefined,
    reported: Boolean(value.reported),
    helpful: value.helpful ?? 0,
    updatedAt: value.updatedAt ?? value.createdAt,
  } as VendorRatingResponse;
}

function mapContract(value: any): ContractResponse {
  return { ...value, value: value.value ?? value.totalValue, scope: value.scope ?? value.description,
    renewalPeriod: value.renewalPeriod ?? value.renewalNoticeDays, updatedAt: value.updatedAt ?? value.createdAt } as ContractResponse;
}

function mapVendorService(value: any): VendorServiceResponse {
  return {
    ...value,
    vendorId: value.vendorId ?? value.vendor?.id,
    vendorName: value.vendorName ?? value.vendor?.businessName,
    price: Number(value.price ?? value.basePrice ?? 0),
    duration: value.duration ?? value.durationMinutes,
    active: value.active ?? value.isAvailable ?? value.status === "ACTIVE",
    featured: value.featured ?? false,
    avgRating: value.avgRating ?? 0,
    totalBookings: value.totalBookings ?? 0,
    updatedAt: value.updatedAt ?? value.createdAt,
  } as VendorServiceResponse;
}

function toServicePage(rows: unknown[], page: number, size: number): PaginatedResponse<VendorServiceResponse> {
  const normalized = rows.map(mapVendorService);
  const start = page * size;
  const content = normalized.slice(start, start + size);
  return {
    content,
    totalElements: normalized.length,
    totalPages: Math.ceil(normalized.length / size),
    number: page,
    size,
    first: page === 0,
    last: start + size >= rows.length,
    empty: content.length === 0,
  } as PaginatedResponse<VendorServiceResponse>;
}

function toContractRequest(data: Partial<ContractRequest>): Record<string, unknown> {
  return { title: data.title, vendorId: data.vendorId, startDate: data.startDate, endDate: data.endDate,
    contractType: (data as any).contractType ?? "SERVICE", description: data.scope ?? (data as any).description,
    totalValue: data.value ?? (data as any).totalValue, paymentTerms: data.paymentTerms,
    autoRenew: data.autoRenew, renewalNoticeDays: data.renewalPeriod ?? (data as any).renewalNoticeDays };
}

function toVendorRequest(data: VendorRequest): Record<string, unknown> {
  const { pinCode, ...rest } = data;
  return { ...rest, pincode: pinCode };
}

function toServiceRequest(data: VendorServiceRequest & { active?: boolean }): Record<string, unknown> {
  return {
    name: data.name,
    description: data.description,
    categoryId: data.categoryId,
    basePrice: data.price,
    priceUnit: data.priceUnit,
    durationMinutes: data.duration,
    isAvailable: data.active,
  };
}

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
    return apiClient.post<VendorResponse>("/vendor/vendors", toVendorRequest(data));
  },

  async updateVendor(id: number, data: VendorRequest): Promise<VendorResponse> {
    return apiClient.put<VendorResponse>(`/vendor/vendors/${id}`, toVendorRequest(data));
  },

  async deleteVendor(id: number): Promise<void> {
    await apiClient.delete<void>(`/vendor/vendors/${id}`);
  },

  async approveVendor(id: number): Promise<void> {
    await apiClient.put<void>(`/vendor/vendors/${id}/status?status=APPROVED`, {});
  },

  async rejectVendor(id: number, _reason: string): Promise<void> {
    await apiClient.put<void>(`/vendor/vendors/${id}/status?status=REJECTED`, {});
  },

  async suspendVendor(id: number, _reason: string): Promise<void> {
    await apiClient.put<void>(`/vendor/vendors/${id}/status?status=SUSPENDED`, {});
  },

  async reactivateVendor(id: number): Promise<void> {
    await apiClient.put<void>(`/vendor/vendors/${id}/status?status=APPROVED`, {});
  },

  async searchVendors(query: string, page = 0, size = 12): Promise<PaginatedResponse<VendorResponse>> {
    const qs = toQueryString({ search: query, page, size });
    return apiClient.get<PaginatedResponse<VendorResponse>>(`/vendor/vendors?${qs}`);
  },

  async getMyVendorProfile(): Promise<VendorResponse> {
    return apiClient.get<VendorResponse>("/vendor/vendors/my-profile");
  },

  async updateMyVendorProfile(data: VendorRequest): Promise<VendorResponse> {
    return apiClient.put<VendorResponse>("/vendor/profile", toVendorRequest(data));
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
  async getMyRegistrations(): Promise<VendorRegistrationResponse[]> {
    return apiClient.get<VendorRegistrationResponse[]>("/vendor/registrations/mine");
  },

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
    void notes;
    return apiClient.put<VendorRegistrationResponse>(`/vendor/registrations/${id}/approve`, {});
  },

  async rejectRegistration(id: number, reason: string): Promise<VendorRegistrationResponse> {
    return apiClient.put<VendorRegistrationResponse>(`/vendor/registrations/${id}/reject?reason=${encodeURIComponent(reason)}`, {});
  },
};

// ─── Vendor Services Catalog ────────────────────────────────────────────────

export const vendorServiceCatalog = {
  async getServicesByVendor(vendorId: number, page = 0, size = 20): Promise<PaginatedResponse<VendorServiceResponse>> {
    const rows = await apiClient.get<VendorServiceResponse[]>(`/vendor/services/vendor/${vendorId}`);
    return toServicePage(rows, page, size);
  },

  async getMyServices(page = 0, size = 20): Promise<PaginatedResponse<VendorServiceResponse>> {
    const vendor = await vendorService.getMyVendorProfile();
    return this.getServicesByVendor(vendor.id, page, size);
  },

  async getServiceById(id: number): Promise<VendorServiceResponse> {
    const response = await apiClient.get<any>(`/vendor/services/${id}`);
    return mapVendorService(response);
  },

  async createService(data: VendorServiceRequest): Promise<VendorServiceResponse> {
    const vendor = await vendorService.getMyVendorProfile();
    const response = await apiClient.post<any>(`/vendor/services/vendor/${vendor.id}`, toServiceRequest(data));
    return mapVendorService(response);
  },

  async updateService(id: number, data: VendorServiceRequest): Promise<VendorServiceResponse> {
    const response = await apiClient.put<any>(`/vendor/services/${id}`, toServiceRequest(data));
    return mapVendorService(response);
  },

  async toggleServiceActive(id: number): Promise<void> {
    const current = await this.getServiceById(id);
    await apiClient.put<void>(`/vendor/services/${id}`, toServiceRequest({
      name: current.name,
      categoryId: current.categoryId,
      price: current.price,
      priceUnit: current.priceUnit,
      duration: current.duration,
      durationUnit: current.durationUnit,
      active: !current.active,
    }));
  },

  async deleteService(id: number): Promise<void> {
    await apiClient.delete<void>(`/vendor/services/${id}`);
  },

  async browseServices(categoryId?: number, search?: string, sortBy?: string, page = 0, size = 12): Promise<PaginatedResponse<VendorServiceResponse>> {
    const qs = toQueryString({ categoryId, search, sortBy, page, size });
    const response = await apiClient.get<any>(`/vendor/services?${qs}`);
    return {
      ...response,
      content: (response.content ?? []).map(mapVendorService),
    } as PaginatedResponse<VendorServiceResponse>;
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
    const qs = toQueryString({ status: params.status, page: params.page ?? 0, size: params.size ?? 10 });
    const path = params.vendorId != null
      ? `/vendor/bookings/vendor/${params.vendorId}?${qs}`
      : `/vendor/bookings?${qs}`;
    return apiClient.get<PaginatedResponse<VendorBookingResponse>>(path);
  },

  async getMyBookings(status?: string, page = 0, size = 10): Promise<PaginatedResponse<VendorBookingResponse>> {
    const qs = toQueryString({ status, page, size });
    return apiClient.get<PaginatedResponse<VendorBookingResponse>>(`/vendor/bookings/mine?${qs}`);
  },

  async getVendorBookings(status?: string, page = 0, size = 10): Promise<PaginatedResponse<VendorBookingResponse>> {
    const qs = toQueryString({ status, page, size });
    const vendor = await vendorService.getMyVendorProfile();
    return apiClient.get<PaginatedResponse<VendorBookingResponse>>(`/vendor/bookings/vendor/${vendor.id}?${qs}`);
  },

  async getBookingById(id: number): Promise<VendorBookingResponse> {
    return apiClient.get<VendorBookingResponse>(`/vendor/bookings/${id}`);
  },

  async createBooking(data: VendorBookingRequest): Promise<VendorBookingResponse> {
    return apiClient.post<VendorBookingResponse>("/vendor/bookings", data);
  },

  async acceptBooking(id: number): Promise<VendorBookingResponse> {
    return apiClient.put<VendorBookingResponse>(`/vendor/bookings/${id}/status?status=CONFIRMED`, {});
  },

  async startBooking(id: number): Promise<VendorBookingResponse> {
    return apiClient.put<VendorBookingResponse>(`/vendor/bookings/${id}/status?status=IN_PROGRESS`, {});
  },

  async completeBooking(id: number): Promise<VendorBookingResponse> {
    return apiClient.put<VendorBookingResponse>(`/vendor/bookings/${id}/status?status=COMPLETED`, {});
  },

  async cancelBooking(id: number, reason: string): Promise<VendorBookingResponse> {
    return apiClient.put<VendorBookingResponse>(`/vendor/bookings/${id}/status?${toQueryString({ status: "CANCELLED", reason })}`, {});
  },

  async rescheduleBooking(id: number, newDate: string, newTime: string): Promise<VendorBookingResponse> {
    return apiClient.put<VendorBookingResponse>(`/vendor/bookings/${id}/reschedule`, { scheduledDate: newDate, scheduledTime: newTime });
  },
};

// ─── Work Orders ────────────────────────────────────────────────────────────

export const vendorWorkOrderService = {
  async getWorkOrders(params: { status?: string; priority?: string; vendorId?: number; page?: number; size?: number } = {}): Promise<PaginatedResponse<WorkOrderResponse>> {
    const qs = toQueryString({ status: params.status, page: params.page ?? 0, size: params.size ?? 10 });
    const path = params.vendorId != null
      ? `/vendor/work-orders/vendor/${params.vendorId}?${qs}`
      : `/vendor/work-orders?${qs}`;
    return apiClient.get<PaginatedResponse<WorkOrderResponse>>(path);
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
    return apiClient.put<WorkOrderResponse>(`/vendor/work-orders/${id}/status?${toQueryString({ status })}`, {});
  },

  async assignWorkOrder(id: number, vendorId: number): Promise<WorkOrderResponse> {
    return apiClient.put<WorkOrderResponse>(`/vendor/work-orders/${id}/assign?${toQueryString({ vendorId })}`, {});
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
    const path = params.vendorId != null ? `/vendor/contracts/vendor/${params.vendorId}?page=${params.page ?? 0}&size=${params.size ?? 10}` : `/vendor/contracts?${qs}`;
    const response = await apiClient.get<any>(path);
    return { ...response, content: (response.content ?? []).map(mapContract) } as PaginatedResponse<ContractResponse>;
  },

  async getContractById(id: number): Promise<ContractResponse> {
    return mapContract(await apiClient.get<any>(`/vendor/contracts/${id}`));
  },

  async createContract(data: ContractRequest): Promise<ContractResponse> {
    return mapContract(await apiClient.post<any>("/vendor/contracts", toContractRequest(data)));
  },

  async updateContract(id: number, data: Partial<ContractRequest>): Promise<ContractResponse> {
    return mapContract(await apiClient.put<any>(`/vendor/contracts/${id}`, toContractRequest(data)));
  },

  async renewContract(id: number, newEndDate: string): Promise<ContractResponse> {
    return mapContract(await apiClient.put<any>(`/vendor/contracts/${id}/renew`, { newEndDate }));
  },

  async terminateContract(id: number, reason: string): Promise<ContractResponse> {
    return mapContract(await apiClient.put<any>(`/vendor/contracts/${id}/terminate`, { reason }));
  },
};

// ─── Payments & Invoices ────────────────────────────────────────────────────

export const vendorInvoiceService = {
  async getInvoices(params: { status?: string; vendorId?: number; page?: number; size?: number } = {}): Promise<PaginatedResponse<VendorInvoiceResponse>> {
    const qs = toQueryString({ ...params, page: params.page ?? 0, size: params.size ?? 10 });
    const response = await apiClient.get<any>(`/vendor/invoices?${qs}`);
    return { ...response, content: (response.content ?? []).map(mapInvoice) } as PaginatedResponse<VendorInvoiceResponse>;
  },

  async getInvoiceById(id: number): Promise<VendorInvoiceResponse> {
    return mapInvoice(await apiClient.get<any>(`/vendor/invoices/${id}`));
  },

  async createInvoice(data: VendorInvoiceRequest): Promise<VendorInvoiceResponse> {
    const payload = { ...data, items: data.items.map((item) => ({ description: item.description, quantity: item.quantity,
      unitPrice: item.unitPrice, taxPercent: item.taxRate, discountPercent: 0 })) };
    return mapInvoice(await apiClient.post<any>("/vendor/invoices", payload));
  },

  async updateInvoiceStatus(id: number, status: string): Promise<VendorInvoiceResponse> {
    return mapInvoice(await apiClient.put<any>(`/vendor/invoices/${id}/status?status=${encodeURIComponent(status)}`, {}));
  },

  async getMyInvoices(page = 0, size = 10): Promise<PaginatedResponse<VendorInvoiceResponse>> {
    const response = await apiClient.get<any>(`/vendor/invoices/mine?page=${page}&size=${size}`);
    return { ...response, content: (response.content ?? []).map(mapInvoice) } as PaginatedResponse<VendorInvoiceResponse>;
  },
};

export const vendorPaymentService = {
  async getPayments(params: { status?: string; vendorId?: number; page?: number; size?: number } = {}): Promise<PaginatedResponse<VendorPaymentResponse>> {
    const qs = toQueryString({ ...params, page: params.page ?? 0, size: params.size ?? 10 });
    const path = params.vendorId != null ? `/vendor/payments/vendor/${params.vendorId}?page=${params.page ?? 0}&size=${params.size ?? 10}` : `/vendor/payments?${qs}`;
    const response = await apiClient.get<any>(path);
    return { ...response, content: (response.content ?? []).map(mapPayment) } as PaginatedResponse<VendorPaymentResponse>;
  },

  async processPayment(data: VendorPaymentRequest): Promise<VendorPaymentResponse> {
    return mapPayment(await apiClient.post<any>("/vendor/payments", data));
  },

  async getMyPayments(page = 0, size = 10): Promise<PaginatedResponse<VendorPaymentResponse>> {
    const response = await apiClient.get<any>(`/vendor/payments/mine?page=${page}&size=${size}`);
    return { ...response, content: (response.content ?? []).map(mapPayment) } as PaginatedResponse<VendorPaymentResponse>;
  },

  async getMyEarningsSummary(): Promise<{ totalEarnings: number; monthlyEarnings: number; pendingAmount: number; walletBalance: number }> {
    return apiClient.get("/vendor/payments/earnings-summary");
  },
};

// ─── Ratings & Reviews ──────────────────────────────────────────────────────

export const vendorRatingService = {
  async getRatings(params: { vendorId?: number; moderated?: boolean; page?: number; size?: number } = {}): Promise<PaginatedResponse<VendorRatingResponse>> {
    const qs = toQueryString({ ...params, page: params.page ?? 0, size: params.size ?? 10 });
    const path = params.vendorId != null
      ? `/vendor/ratings/vendor/${params.vendorId}?${qs}`
      : `/vendor/reviews?${qs}`;
    const response = await apiClient.get<any>(path);
    return { ...response, content: (response.content ?? []).map(mapRating) } as PaginatedResponse<VendorRatingResponse>;
  },

  async createRating(data: VendorRatingRequest): Promise<VendorRatingResponse> {
    return mapRating(await apiClient.post<any>("/vendor/ratings", { ...data, overallRating: data.rating }));
  },

  async replyToRating(id: number, reply: string): Promise<VendorRatingResponse> {
    return mapRating(await apiClient.put<any>(`/vendor/ratings/${id}/reply`, { reply }));
  },

  async moderateRating(id: number, status: string): Promise<VendorRatingResponse> {
    return mapRating(await apiClient.put<any>(`/vendor/ratings/${id}/moderate`, { status }));
  },

  async reportRating(id: number, reason: string): Promise<void> {
    await apiClient.post<void>(`/vendor/ratings/${id}/report`, { reason });
  },

  async getMyRatings(page = 0, size = 10): Promise<PaginatedResponse<VendorRatingResponse>> {
    const vendor = await vendorService.getMyVendorProfile();
    const response = await apiClient.get<any>(`/vendor/ratings/vendor/${vendor.id}?page=${page}&size=${size}`);
    return { ...response, content: (response.content ?? []).map(mapRating) } as PaginatedResponse<VendorRatingResponse>;
  },
};

// ─── Analytics ──────────────────────────────────────────────────────────────

export const vendorAnalyticsService = {
  async getDashboardStats(): Promise<VendorDashboardStats> {
    const [summary, leaderboard, vendors, suspended, cancelledBookings, invoices, payments, contracts] = await Promise.all([
      apiClient.get<any>("/vendor/dashboard"),
      apiClient.get<any>("/vendor/dashboard/performance?page=0&size=100"),
      vendorService.getVendors({ page: 0, size: 100 }),
      vendorService.getVendors({ status: "SUSPENDED", page: 0, size: 100 }),
      vendorBookingService.getBookings({ status: "CANCELLED", page: 0, size: 100 }),
      vendorInvoiceService.getInvoices({ page: 0, size: 100 }),
      vendorPaymentService.getPayments({ page: 0, size: 100 }),
      vendorContractService.getContracts({ status: "ACTIVE", page: 0, size: 100 }),
    ]);
    const rawPerformance = leaderboard.content ?? [];
    const performers = rawPerformance.map((row: any) => ({
      vendorId: Number(row.vendorId), vendorName: row.businessName ?? "",
      rating: Number(row.avgRating ?? 0), bookings: Number(row.totalBookings ?? 0),
      revenue: Number(row.totalRevenue ?? 0),
    }));
    const categoryCounts = new Map<string, number>();
    for (const vendor of vendors.content ?? []) {
      const name = vendor.category?.name ?? "Uncategorized";
      categoryCounts.set(name, (categoryCounts.get(name) ?? 0) + 1);
    }
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyRevenue = (payments.content ?? []).filter((payment: any) => {
      const paidAt = payment.paidAt ?? payment.createdAt;
      return paidAt && new Date(paidAt) >= monthStart && ["COMPLETED", "SUCCESS"].includes(String(payment.status).toUpperCase());
    }).reduce((sum: number, payment: any) => sum + Number(payment.amount ?? 0), 0);
    const ratingCount = rawPerformance.reduce((sum: number, row: any) => sum + Number(row.totalRatings ?? 0), 0);
    const ratingTotal = rawPerformance.reduce((sum: number, row: any) => sum + Number(row.avgRating ?? 0) * Number(row.totalRatings ?? 0), 0);
    const expiringCutoff = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return {
      totalVendors: Number(summary.totalVendors ?? 0), activeVendors: Number(summary.activeVendors ?? 0),
      pendingVendors: Number(summary.pendingRegistrations ?? 0), suspendedVendors: Number(suspended.totalElements ?? 0),
      totalBookings: Number(summary.totalBookings ?? 0), activeBookings: Number(summary.activeBookings ?? 0),
      completedBookings: Number(summary.completedBookings ?? 0), cancelledBookings: Number(cancelledBookings.totalElements ?? 0),
      totalRevenue: performers.reduce((sum: number, row: any) => sum + row.revenue, 0), monthlyRevenue,
      avgRating: ratingCount ? ratingTotal / ratingCount : 0,
      openWorkOrders: Number(summary.openWorkOrders ?? 0),
      overdueInvoices: (invoices.content ?? []).filter((invoice: any) => String(invoice.status).toUpperCase() === "OVERDUE").length,
      expiringContracts: (contracts.content ?? []).filter((contract: any) => contract.endDate && new Date(contract.endDate) <= expiringCutoff).length,
      categoryDistribution: Array.from(categoryCounts, ([category, count]) => ({ category, count })),
      monthlyBookingTrend: [], monthlyRevenueTrend: [], recentActivity: [], topVendors: performers,
    };
  },

  async getVendorPerformance(vendorId: number, _period?: string): Promise<VendorPerformanceResponse> {
    const page = await apiClient.get<any>("/vendor/dashboard/performance?page=0&size=100");
    const row = (page.content ?? []).find((item: any) => Number(item.vendorId) === vendorId);
    if (!row) throw new Error("Vendor performance record was not found");
    return row as VendorPerformanceResponse;
  },

  async getPortalStats(): Promise<VendorPortalStats> {
    const [bookingPage, paymentPage, earnings, ratingPage, profile] = await Promise.all([
      vendorBookingService.getMyBookings(undefined, 0, 100),
      vendorPaymentService.getMyPayments(0, 100),
      vendorPaymentService.getMyEarningsSummary(),
      vendorRatingService.getMyRatings(0, 100),
      vendorService.getMyVendorProfile(),
    ]);
    const bookings = bookingPage.content ?? [];
    const payments = paymentPage.content ?? [];
    const ratings = ratingPage.content ?? [];
    const today = new Date().toISOString().slice(0, 10);
    const upcoming = bookings.filter((booking) => booking.scheduledDate >= today && !["COMPLETED", "CANCELLED", "NO_SHOW"].includes(booking.status));
    const ratingBreakdown = [1, 2, 3, 4, 5].map((stars) => ({ stars, count: ratings.filter((rating) => Math.round(rating.rating) === stars).length }));
    return {
      todayBookings: bookings.filter((booking) => booking.scheduledDate === today).length,
      pendingBookings: bookings.filter((booking) => booking.status === "PENDING").length,
      completedBookings: bookings.filter((booking) => booking.status === "COMPLETED").length,
      totalEarnings: Number(earnings.totalEarnings ?? 0), monthlyEarnings: Number(earnings.monthlyEarnings ?? 0),
      pendingPayments: Number(earnings.pendingAmount ?? 0), avgRating: Number((profile as any).averageRating ?? 0),
      totalReviews: Number(ratingPage.totalElements ?? ratings.length),
      upcomingBookings: upcoming, recentPayments: payments,
      ratingBreakdown,
    };
  },

  async getRevenueReport(startDate: string, endDate: string): Promise<{ labels: string[]; data: number[] }> {
    const page = await vendorPaymentService.getPayments({ page: 0, size: 100 });
    const from = new Date(`${startDate}T00:00:00`);
    const through = new Date(`${endDate}T23:59:59.999`);
    const totals = new Map<string, number>();
    for (const payment of page.content ?? []) {
      const stamp = payment.paidAt ?? payment.createdAt;
      if (!stamp || !["COMPLETED", "SUCCESS"].includes(String(payment.status).toUpperCase())) continue;
      const paidAt = new Date(stamp);
      if (paidAt < from || paidAt > through) continue;
      const label = paidAt.toISOString().slice(0, 10);
      totals.set(label, (totals.get(label) ?? 0) + Number(payment.amount ?? 0));
    }
    const labels = Array.from(totals.keys()).sort();
    return { labels, data: labels.map((label) => totals.get(label) ?? 0) };
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
