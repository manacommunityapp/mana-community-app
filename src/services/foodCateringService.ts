import { apiClient } from "./apiClient";
import type {
  Caterer, CateringPackage, CateringRequest, CateringRequestDto,
  CateringQuotation, FoodPageResponse,
} from "../types/food";

export const foodCateringService = {
  // ── Caterers ──
  async getCaterers(page = 0, size = 20): Promise<FoodPageResponse<Caterer>> {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    return apiClient.get<FoodPageResponse<Caterer>>(`/food/catering/caterers?${params}`);
  },
  async getCatererById(id: number): Promise<Caterer> {
    return apiClient.get<Caterer>(`/food/catering/caterers/${id}`);
  },
  async registerCaterer(data: Partial<Caterer>): Promise<Caterer> {
    return apiClient.post<Caterer>("/food/catering/caterers", data);
  },
  async getPackages(catererId: number): Promise<CateringPackage[]> {
    return apiClient.get<CateringPackage[]>(`/food/catering/caterers/${catererId}/packages`);
  },

  // ── Catering Requests ──
  async createCateringRequest(data: CateringRequestDto): Promise<CateringRequest> {
    return apiClient.post<CateringRequest>("/food/catering/requests", data);
  },
  async getMyCateringRequests(page = 0, size = 20): Promise<FoodPageResponse<CateringRequest>> {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    return apiClient.get<FoodPageResponse<CateringRequest>>(`/food/catering/requests/mine?${params}`);
  },

  // ── Quotations ──
  async submitQuotation(requestId: number, data: Partial<CateringQuotation>): Promise<CateringQuotation> {
    return apiClient.post<CateringQuotation>(`/food/catering/requests/${requestId}/quotations`, data);
  },
  async getQuotations(requestId: number): Promise<CateringQuotation[]> {
    return apiClient.get<CateringQuotation[]>(`/food/catering/requests/${requestId}/quotations`);
  },
  async acceptQuotation(requestId: number, quotationId: number): Promise<CateringRequest> {
    return apiClient.put<CateringRequest>(`/food/catering/requests/${requestId}/quotations/${quotationId}/accept`, {});
  },

  // ── Orders ──
  async getCateringOrders(page = 0, size = 20): Promise<FoodPageResponse<unknown>> {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    return apiClient.get<FoodPageResponse<unknown>>(`/food/catering/orders?${params}`);
  },
};
