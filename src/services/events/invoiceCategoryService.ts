import { apiClient } from "../common/apiClient";

export interface InvoiceCategoryResponse {
  id: number;
  communityId?: number | null;
  name: string;
  code?: string;
  description?: string;
  active: boolean;
}

export interface InvoiceCategoryRequest {
  communityId?: number;
  name: string;
  code?: string;
  description?: string;
}

export const invoiceCategoryService = {
  async getCategories(communityId?: number): Promise<InvoiceCategoryResponse[]> {
    const qs = communityId ? `?communityId=${communityId}` : "";
    return apiClient.get<InvoiceCategoryResponse[]>(`/finance/categories${qs}`);
  },

  async createCategory(data: InvoiceCategoryRequest): Promise<InvoiceCategoryResponse> {
    return apiClient.post<InvoiceCategoryResponse>("/finance/categories", data);
  },

  async deleteCategory(id: number): Promise<void> {
    await apiClient.delete<void>(`/finance/categories/${id}`);
  },
};
