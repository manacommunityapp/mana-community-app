import { apiClient } from "../common/apiClient";

export interface EventMediaCategoryResponse {
  id: number;
  name: string;
  sortOrder: number;
}

export interface EventMediaCategoryRequest {
  name: string;
  sortOrder?: number;
}

export const eventMediaCategoryService = {
  async getAll(): Promise<EventMediaCategoryResponse[]> {
    return apiClient.get<EventMediaCategoryResponse[]>("/events/media-categories");
  },

  async create(data: EventMediaCategoryRequest): Promise<EventMediaCategoryResponse> {
    return apiClient.post<EventMediaCategoryResponse>("/events/media-categories", data);
  },

  async deleteCategory(id: number): Promise<void> {
    await apiClient.delete<void>(`/events/media-categories/${id}`);
  },
};
