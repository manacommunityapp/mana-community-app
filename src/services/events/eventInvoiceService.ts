import { apiClient } from "../common/apiClient";

export interface EventInvoiceResponse {
  id: number;
  eventId: number;
  eventTitle: string;
  invoiceNumber: string | null;
  vendorName: string;
  invoiceDate: string | null;
  dueDate: string | null;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  category: string;
  status: string;
  invoiceUrl: string | null;
  fileId: number | null;
  notes: string | null;
  createdByName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EventInvoiceRequest {
  eventId: number;
  vendorName: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  dueDate?: string;
  amount: number;
  taxAmount?: number;
  totalAmount?: number;
  category?: string;
  status?: string;
  invoiceUrl?: string;
  fileId?: number;
  notes?: string;
}

export const eventInvoiceService = {
  async getAll(eventId?: number): Promise<EventInvoiceResponse[]> {
    const qs = eventId ? `?eventId=${eventId}` : "";
    return apiClient.get<EventInvoiceResponse[]>(`/events/invoices${qs}`);
  },

  async create(data: EventInvoiceRequest): Promise<EventInvoiceResponse> {
    return apiClient.post<EventInvoiceResponse>("/events/invoices", data);
  },

  async update(id: number, data: EventInvoiceRequest): Promise<EventInvoiceResponse> {
    return apiClient.put<EventInvoiceResponse>(`/events/invoices/${id}`, data);
  },

  async updateStatus(id: number, status: string): Promise<EventInvoiceResponse> {
    return apiClient.patch<EventInvoiceResponse>(`/events/invoices/${id}/status`, { status });
  },

  async deleteInvoice(id: number): Promise<void> {
    await apiClient.delete<void>(`/events/invoices/${id}`);
  },
};
