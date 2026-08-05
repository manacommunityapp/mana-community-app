import { apiClient } from "../common/apiClient";

export interface EventExpenseResponse {
  id: number;
  eventId: number;
  eventTitle: string;
  description: string;
  category: string | null;
  amount: number;
  vendorName: string | null;
  receiptUrl: string | null;
  expenseDate: string | null;
  status: string;
  createdByName: string;
  createdAt: string;
}

export interface EventExpenseRequest {
  eventId: number;
  description: string;
  category?: string;
  amount: number;
  vendorName?: string;
  receiptUrl?: string;
  expenseDate?: string;
  status?: string;
}

export const eventExpenseService = {
  async getAll(eventId?: number): Promise<EventExpenseResponse[]> {
    const qs = eventId ? `?eventId=${eventId}` : "";
    return apiClient.get<EventExpenseResponse[]>(`/events/expenses${qs}`);
  },

  async create(data: EventExpenseRequest): Promise<EventExpenseResponse> {
    return apiClient.post<EventExpenseResponse>("/events/expenses", data);
  },

  async update(id: number, data: EventExpenseRequest): Promise<EventExpenseResponse> {
    return apiClient.put<EventExpenseResponse>(`/events/expenses/${id}`, data);
  },

  async deleteExpense(id: number): Promise<void> {
    await apiClient.delete<void>(`/events/expenses/${id}`);
  },
};
