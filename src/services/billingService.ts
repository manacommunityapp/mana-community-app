import { apiClient } from "./apiClient";

export interface BillingExpense {
  id: number;
  title: string;
  amount: number;
  category: string;
  description?: string;
  receiptFileName?: string;
  receiptUrl?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdBy?: string;
  createdAt: string;
}

export interface BillingInvoice {
  id: number;
  invoiceNumber: string;
  residentName: string;
  residentId: number;
  flatNo: string;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  totalAmount: number;
  dueDate: string;
  status: "PAID" | "UNPAID" | "OVERDUE" | "PARTIAL";
  pdfUrl?: string;
  eventTitle?: string;
  generatedAt: string;
  paidAt?: string;
}

export interface PagedResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

export const billingService = {
  async getExpenses(page = 0, size = 20, status?: string): Promise<PagedResponse<BillingExpense>> {
    // Dedicated expense module (was /billing/expenses; migrated to the ExpenseController).
    let url = `/expenses?page=${page}&size=${size}`;
    if (status && status !== "all") {
      url += `&status=${status}`;
    }
    return apiClient.get<PagedResponse<BillingExpense>>(url);
  },

  async createExpense(formData: FormData): Promise<BillingExpense> {
    return apiClient.postForm<BillingExpense>("/expenses", formData);
  },

  async approveExpense(id: number): Promise<BillingExpense> {
    return apiClient.post<BillingExpense>(`/expenses/${id}/approve`);
  },

  async rejectExpense(id: number): Promise<BillingExpense> {
    return apiClient.post<BillingExpense>(`/expenses/${id}/reject`);
  },

  async getInvoices(page = 0, size = 20, status?: string): Promise<PagedResponse<BillingInvoice>> {
    let url = `/billing/invoices?page=${page}&size=${size}`;
    if (status && status !== "all") {
      url += `&status=${status}`;
    }
    return apiClient.get<PagedResponse<BillingInvoice>>(url);
  },

  async getMyInvoices(): Promise<BillingInvoice[]> {
    return apiClient.get<BillingInvoice[]>("/billing/invoices/my");
  },

  async payInvoice(id: number): Promise<BillingInvoice> {
    return apiClient.post<BillingInvoice>(`/billing/invoices/${id}/pay`);
  },

  async getGstPreview(amount: number): Promise<{ taxableAmount: number; cgst: number; sgst: number; totalAmount: number }> {
    return apiClient.get(`/billing/gst-preview?amount=${amount}`);
  },
};
