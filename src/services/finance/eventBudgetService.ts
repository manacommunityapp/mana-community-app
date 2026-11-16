import { apiClient } from "../common/apiClient";

export interface EventBudgetLineItem {
  id: number;
  category: string;
  description: string | null;
  plannedAmount: number;
  createdAt: string;
}

export interface EventBudget {
  id: number;
  eventId: number;
  eventTitle: string;
  communityId: number;
  totalPlannedAmount: number;
  totalActualAmount: number;
  variance: number;
  currency: string;
  notes: string | null;
  lineItems: EventBudgetLineItem[];
  createdAt: string;
  updatedAt: string;
}

export interface EventBudgetLineItemRequest {
  category: string;
  description?: string;
  plannedAmount: number;
}

export interface EventBudgetRequest {
  communityId: number;
  totalPlannedAmount: number;
  notes?: string;
  lineItems?: EventBudgetLineItemRequest[];
}

export const eventBudgetService = {
  async listByCommunity(communityId: number): Promise<EventBudget[]> {
    return apiClient.get<EventBudget[]>(`/events/budgets?communityId=${communityId}`);
  },

  async getByEvent(eventId: number): Promise<EventBudget> {
    return apiClient.get<EventBudget>(`/events/budgets/event/${eventId}`);
  },

  async save(eventId: number, request: EventBudgetRequest): Promise<EventBudget> {
    return apiClient.put<EventBudget>(`/events/budgets/event/${eventId}`, request);
  },

  async delete(eventId: number): Promise<void> {
    return apiClient.delete(`/events/budgets/event/${eventId}`);
  },
};
