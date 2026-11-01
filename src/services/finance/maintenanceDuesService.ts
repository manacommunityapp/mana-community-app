import { apiClient } from "../common/apiClient";

export interface MaintenanceSummary {
  totalDue: number;
  totalPaid: number;
  pendingCount: number;
  overdueCount: number;
}

export interface MaintenanceDue {
  id: number;
  unitNumber: string;
  ownerName: string;
  amount: number;
  dueDate: string;
  status: "PAID" | "PENDING" | "OVERDUE" | "PARTIAL";
  paidAmount?: number;
  paidDate?: string;
  month?: string;
}

export interface MaintenancePayment {
  id: number;
  unitNumber: string;
  amount: number;
  paymentDate: string;
  paymentMode: string;
  transactionId?: string;
  receiptNumber?: string;
  remarks?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export const maintenanceDuesService = {
  async getSummary(societyId: number): Promise<MaintenanceSummary> {
    return apiClient.get<MaintenanceSummary>(`/finance/maintenance/summary?societyId=${societyId}`);
  },

  async getDues(societyId: number, page = 0, size = 20, status?: string): Promise<PageResponse<MaintenanceDue>> {
    const params = new URLSearchParams({ societyId: String(societyId), page: String(page), size: String(size) });
    if (status) params.set("status", status);
    return apiClient.get<PageResponse<MaintenanceDue>>(`/finance/maintenance/dues?${params}`);
  },

  async getMyDues(page = 0, size = 20): Promise<PageResponse<MaintenanceDue>> {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    return apiClient.get<PageResponse<MaintenanceDue>>(`/finance/maintenance/dues/mine?${params}`);
  },

  async getDueById(id: number): Promise<MaintenanceDue> {
    return apiClient.get<MaintenanceDue>(`/finance/maintenance/dues/${id}`);
  },

  async recordPayment(dueId: number, data: {
    amount: number;
    paymentMode: string;
    transactionId?: string;
    remarks?: string;
  }): Promise<MaintenancePayment> {
    return apiClient.post<MaintenancePayment>(`/finance/maintenance/dues/${dueId}/pay`, data);
  },

  async getPayments(societyId: number, page = 0, size = 20): Promise<PageResponse<MaintenancePayment>> {
    const params = new URLSearchParams({ societyId: String(societyId), page: String(page), size: String(size) });
    return apiClient.get<PageResponse<MaintenancePayment>>(`/finance/maintenance/payments?${params}`);
  },

  async getMyPayments(page = 0, size = 20): Promise<PageResponse<MaintenancePayment>> {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    return apiClient.get<PageResponse<MaintenancePayment>>(`/finance/maintenance/payments/mine?${params}`);
  },

  async generateBulkDues(societyId: number, month: string, amount: number): Promise<void> {
    await apiClient.post<void>(`/finance/maintenance/dues/generate`, { societyId, month, amount });
  },

  async sendReminders(societyId: number, dueIds?: number[]): Promise<{ sent: number }> {
    return apiClient.post<{ sent: number }>(`/finance/maintenance/dues/remind`, { societyId, dueIds });
  },
};
