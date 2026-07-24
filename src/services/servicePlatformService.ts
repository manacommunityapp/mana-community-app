import { apiClient } from "./apiClient";
import type {
  PaginatedResponse,
  ServiceDomainResponse,
  ServiceCategoryResponse,
  ServiceProviderResponse,
  ServiceOfferingResponse,
  ServiceRequestResponse,
  CspWorkOrderResponse,
  ServiceSearchResult,
  CreateServiceDomainRequest,
  CreateServiceCategoryRequest,
  RegisterProviderRequest,
  CreateOfferingRequest,
  CreateServiceRequestDto,
  AssignProviderRequest,
  UpdateWorkOrderStatusRequest,
} from "../types/api";

const BASE = "/service-platform";

export const serviceCatalogService = {
  async listDomains(): Promise<ServiceDomainResponse[]> {
    return apiClient.get<ServiceDomainResponse[]>(`${BASE}/domains`);
  },
  async getDomain(id: number): Promise<ServiceDomainResponse> {
    return apiClient.get<ServiceDomainResponse>(`${BASE}/domains/${id}`);
  },
  async createDomain(data: CreateServiceDomainRequest): Promise<ServiceDomainResponse> {
    return apiClient.post<ServiceDomainResponse>(`${BASE}/domains`, data);
  },
  async updateDomain(id: number, data: CreateServiceDomainRequest): Promise<ServiceDomainResponse> {
    return apiClient.put<ServiceDomainResponse>(`${BASE}/domains/${id}`, data);
  },
  async deleteDomain(id: number): Promise<void> {
    return apiClient.delete<void>(`${BASE}/domains/${id}`);
  },
  async listCategories(domainId: number): Promise<ServiceCategoryResponse[]> {
    return apiClient.get<ServiceCategoryResponse[]>(`${BASE}/categories?domainId=${domainId}`);
  },
  async getCategory(id: number): Promise<ServiceCategoryResponse> {
    return apiClient.get<ServiceCategoryResponse>(`${BASE}/categories/${id}`);
  },
  async createCategory(data: CreateServiceCategoryRequest): Promise<ServiceCategoryResponse> {
    return apiClient.post<ServiceCategoryResponse>(`${BASE}/categories`, data);
  },
  async updateCategory(id: number, data: CreateServiceCategoryRequest): Promise<ServiceCategoryResponse> {
    return apiClient.put<ServiceCategoryResponse>(`${BASE}/categories/${id}`, data);
  },
  async deleteCategory(id: number): Promise<void> {
    return apiClient.delete<void>(`${BASE}/categories/${id}`);
  },
};

export const serviceSearchService = {
  async search(
    params: { q?: string; domainId?: number; categoryId?: number; page?: number; size?: number }
  ): Promise<PaginatedResponse<ServiceSearchResult>> {
    const qs = new URLSearchParams();
    if (params.q) qs.set("q", params.q);
    if (params.domainId) qs.set("domainId", String(params.domainId));
    if (params.categoryId) qs.set("categoryId", String(params.categoryId));
    qs.set("page", String(params.page ?? 0));
    qs.set("size", String(params.size ?? 20));
    return apiClient.get<PaginatedResponse<ServiceSearchResult>>(`${BASE}/search?${qs}`);
  },
};

export const serviceRequestService = {
  async create(data: CreateServiceRequestDto): Promise<ServiceRequestResponse> {
    return apiClient.post<ServiceRequestResponse>(`${BASE}/requests`, data);
  },
  async listMine(page = 0, size = 20, status?: string): Promise<PaginatedResponse<ServiceRequestResponse>> {
    const qs = new URLSearchParams();
    qs.set("page", String(page));
    qs.set("size", String(size));
    if (status) qs.set("status", status);
    return apiClient.get<PaginatedResponse<ServiceRequestResponse>>(`${BASE}/requests/my?${qs}`);
  },
  async getById(id: number): Promise<ServiceRequestResponse> {
    return apiClient.get<ServiceRequestResponse>(`${BASE}/requests/${id}`);
  },
  async submit(id: number): Promise<ServiceRequestResponse> {
    return apiClient.patch<ServiceRequestResponse>(`${BASE}/requests/${id}/submit`);
  },
  async cancel(id: number, reason?: string): Promise<ServiceRequestResponse> {
    const qs = reason ? `?reason=${encodeURIComponent(reason)}` : "";
    return apiClient.patch<ServiceRequestResponse>(`${BASE}/requests/${id}/cancel${qs}`);
  },
};

export const serviceProviderService = {
  async register(data: RegisterProviderRequest): Promise<ServiceProviderResponse> {
    return apiClient.post<ServiceProviderResponse>(`${BASE}/providers/register`, data);
  },
  async getMyProfile(): Promise<ServiceProviderResponse> {
    return apiClient.get<ServiceProviderResponse>(`${BASE}/providers/me`);
  },
  async updateMyProfile(data: RegisterProviderRequest): Promise<ServiceProviderResponse> {
    return apiClient.put<ServiceProviderResponse>(`${BASE}/providers/me`, data);
  },
  async getProvider(id: number): Promise<ServiceProviderResponse> {
    return apiClient.get<ServiceProviderResponse>(`${BASE}/providers/${id}`);
  },
  async listMyOfferings(): Promise<ServiceOfferingResponse[]> {
    return apiClient.get<ServiceOfferingResponse[]>(`${BASE}/providers/me/offerings`);
  },
  async createOffering(data: CreateOfferingRequest): Promise<ServiceOfferingResponse> {
    return apiClient.post<ServiceOfferingResponse>(`${BASE}/providers/me/offerings`, data);
  },
  async updateOffering(id: number, data: CreateOfferingRequest): Promise<ServiceOfferingResponse> {
    return apiClient.put<ServiceOfferingResponse>(`${BASE}/providers/me/offerings/${id}`, data);
  },
  async deleteOffering(id: number): Promise<void> {
    return apiClient.delete<void>(`${BASE}/providers/me/offerings/${id}`);
  },
  async listMyRequests(page = 0, size = 20): Promise<PaginatedResponse<ServiceRequestResponse>> {
    return apiClient.get<PaginatedResponse<ServiceRequestResponse>>(`${BASE}/providers/me/requests?page=${page}&size=${size}`);
  },
  async acceptRequest(id: number): Promise<ServiceRequestResponse> {
    return apiClient.patch<ServiceRequestResponse>(`${BASE}/providers/me/requests/${id}/accept`);
  },
  async declineRequest(id: number): Promise<ServiceRequestResponse> {
    return apiClient.patch<ServiceRequestResponse>(`${BASE}/providers/me/requests/${id}/decline`);
  },
  async listMyWorkOrders(page = 0, size = 20): Promise<PaginatedResponse<CspWorkOrderResponse>> {
    return apiClient.get<PaginatedResponse<CspWorkOrderResponse>>(`${BASE}/providers/me/work-orders?page=${page}&size=${size}`);
  },
  async updateWorkOrderStatus(id: number, data: UpdateWorkOrderStatusRequest): Promise<CspWorkOrderResponse> {
    return apiClient.patch<CspWorkOrderResponse>(`${BASE}/providers/me/work-orders/${id}/status`, data);
  },
  async signoffWorkOrder(id: number): Promise<CspWorkOrderResponse> {
    return apiClient.patch<CspWorkOrderResponse>(`${BASE}/work-orders/${id}/signoff`);
  },
};

export const serviceAdminService = {
  async listProviders(
    params: { status?: string; page?: number; size?: number }
  ): Promise<PaginatedResponse<ServiceProviderResponse>> {
    const qs = new URLSearchParams();
    if (params.status) qs.set("status", params.status);
    qs.set("page", String(params.page ?? 0));
    qs.set("size", String(params.size ?? 20));
    return apiClient.get<PaginatedResponse<ServiceProviderResponse>>(`${BASE}/admin/providers?${qs}`);
  },
  async verifyProvider(id: number, action: string): Promise<ServiceProviderResponse> {
    return apiClient.patch<ServiceProviderResponse>(`${BASE}/admin/providers/${id}/verify?action=${action}`);
  },
  async listAllRequests(
    params: { status?: string; page?: number; size?: number }
  ): Promise<PaginatedResponse<ServiceRequestResponse>> {
    const qs = new URLSearchParams();
    if (params.status) qs.set("status", params.status);
    qs.set("page", String(params.page ?? 0));
    qs.set("size", String(params.size ?? 20));
    return apiClient.get<PaginatedResponse<ServiceRequestResponse>>(`${BASE}/admin/requests?${qs}`);
  },
  async assignProvider(requestId: number, data: AssignProviderRequest): Promise<ServiceRequestResponse> {
    return apiClient.patch<ServiceRequestResponse>(`${BASE}/admin/requests/${requestId}/assign`, data);
  },
  async listAllWorkOrders(
    params: { status?: string; page?: number; size?: number }
  ): Promise<PaginatedResponse<CspWorkOrderResponse>> {
    const qs = new URLSearchParams();
    if (params.status) qs.set("status", params.status);
    qs.set("page", String(params.page ?? 0));
    qs.set("size", String(params.size ?? 20));
    return apiClient.get<PaginatedResponse<CspWorkOrderResponse>>(`${BASE}/admin/work-orders?${qs}`);
  },
};
