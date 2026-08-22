import { apiClient } from "../common/apiClient";

export interface TicketCategoryMasterResponse {
  id: number;
  communityId?: number | null;
  name: string;
  description?: string | null;
  displayOrder?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const ticketCategoryService = {
  async getAll(): Promise<TicketCategoryMasterResponse[]> {
    return apiClient.get<TicketCategoryMasterResponse[]>("/events/ticket-categories");
  },

  async create(name: string, description?: string, displayOrder?: number): Promise<TicketCategoryMasterResponse> {
    return apiClient.post<TicketCategoryMasterResponse>("/events/ticket-categories", {
      name,
      description,
      displayOrder: displayOrder || 0,
    });
  },

  async delete(id: number): Promise<void> {
    return apiClient.delete<void>(`/events/ticket-categories/${id}`);
  },
};
