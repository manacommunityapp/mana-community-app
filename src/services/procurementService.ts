import { apiClient } from "./apiClient";

export interface Vendor {
  id: number;
  name: string;
  gstNumber?: string;
  pan?: string;
  contactPerson?: string;
  mobile?: string;
  email?: string;
  bankDetails?: string;
  categories?: string;
  rating?: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PurchaseRequest {
  id: number;
  title: string;
  description: string;
  category: string;
  estimatedAmount: number;
  status:
    | "REQUESTED"
    | "COMMITTEE_APPROVED"
    | "QUOTATIONS_COLLECTED"
    | "VENDOR_SELECTED"
    | "PURCHASE_ORDERED"
    | "GOODS_RECEIVED"
    | "INVOICED"
    | "INVENTORY_CREATED"
    | "REJECTED"
    | "CANCELLED";
  selectedVendor?: Vendor;
  requestedBy: string;
  neededBy?: string;
  approvalNotes?: string;
  purchaseOrderNumber?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const procurementService = {
  async getPurchaseRequests(): Promise<PurchaseRequest[]> {
    return apiClient.get<PurchaseRequest[]>("/procurement/requests");
  },

  async createPurchaseRequest(data: Partial<PurchaseRequest>): Promise<PurchaseRequest> {
    return apiClient.post<PurchaseRequest>("/procurement/requests", data);
  },

  async updateRequestStatus(
    id: number,
    status: PurchaseRequest["status"],
    approvalNotes?: string,
    poNumber?: string
  ): Promise<PurchaseRequest> {
    let url = `/procurement/requests/${id}/status?status=${status}`;
    if (approvalNotes) {
      url += `&approvalNotes=${encodeURIComponent(approvalNotes)}`;
    }
    if (poNumber) {
      url += `&poNumber=${encodeURIComponent(poNumber)}`;
    }
    return apiClient.post<PurchaseRequest>(url);
  },

  async getVendors(activeOnly = false): Promise<Vendor[]> {
    return apiClient.get<Vendor[]>(`/asset-finance/vendors?activeOnly=${activeOnly}`);
  },

  async createVendor(data: Partial<Vendor>): Promise<Vendor> {
    return apiClient.post<Vendor>("/asset-finance/vendors", data);
  },

  async updateVendor(id: number, data: Partial<Vendor>): Promise<Vendor> {
    return apiClient.put<Vendor>(`/asset-finance/vendors/${id}`, data);
  },
};
