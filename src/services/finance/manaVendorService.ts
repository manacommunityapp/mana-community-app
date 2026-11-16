import { apiClient } from "../common/apiClient";

// ── Types ─────────────────────────────────────────────────────────────────────

export type VendorStatus = "ACTIVE" | "INACTIVE";
export type VendorSourceModule = "FINANCE" | "PROCUREMENT" | "MANUAL";

export interface ManaVendor {
  id: number;
  communityId: number | null;
  name: string;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  gstin: string | null;
  pan: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  bankDetails: string | null;
  categories: string | null;
  rating: number | null;
  sourceModule: VendorSourceModule;
  status: VendorStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateManaVendorRequest {
  communityId: number;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  gstin?: string;
  pan?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  bankDetails?: string;
  categories?: string;
  rating?: number;
  sourceModule?: VendorSourceModule;
}

export interface UpdateManaVendorRequest {
  name?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  gstin?: string;
  pan?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  bankDetails?: string;
  categories?: string;
  rating?: number;
  status?: VendorStatus;
}

export interface VendorPage {
  content: ManaVendor[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

// ── Service ───────────────────────────────────────────────────────────────────

export const manaVendorService = {
  async list(communityId: number): Promise<ManaVendor[]> {
    return apiClient.get<ManaVendor[]>(`/vendors/master?communityId=${communityId}`);
  },

  async listActive(communityId: number): Promise<ManaVendor[]> {
    return apiClient.get<ManaVendor[]>(`/vendors/master/active?communityId=${communityId}`);
  },

  async search(communityId: number, q: string): Promise<ManaVendor[]> {
    return apiClient.get<ManaVendor[]>(
      `/vendors/master/search?communityId=${communityId}&q=${encodeURIComponent(q)}`
    );
  },

  async page(communityId: number, page = 0, size = 20): Promise<VendorPage> {
    return apiClient.get<VendorPage>(
      `/vendors/master/page?communityId=${communityId}&page=${page}&size=${size}`
    );
  },

  async getById(communityId: number, id: number): Promise<ManaVendor> {
    return apiClient.get<ManaVendor>(`/vendors/master/${id}?communityId=${communityId}`);
  },

  async create(request: CreateManaVendorRequest): Promise<ManaVendor> {
    return apiClient.post<ManaVendor>("/vendors/master", request);
  },

  async update(communityId: number, id: number, request: UpdateManaVendorRequest): Promise<ManaVendor> {
    return apiClient.patch<ManaVendor>(`/vendors/master/${id}?communityId=${communityId}`, request);
  },

  async deactivate(communityId: number, id: number): Promise<void> {
    return apiClient.delete(`/vendors/master/${id}?communityId=${communityId}`);
  },
};
