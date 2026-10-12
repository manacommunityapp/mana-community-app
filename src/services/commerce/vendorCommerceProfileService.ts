import { apiClient } from "../common/apiClient";

export interface VmsVendorCommerceProfileResponse {
  id: number | null;
  vendorId: number;
  vendorName: string;
  commerceStatus: "DRAFT" | "PENDING_VERIFICATION" | "VERIFIED" | "SUSPENDED" | "REJECTED" | "INACTIVE";
  upiEnabled: boolean;
  upiId: string | null;
  deliveryAvailable: boolean;
  deliveryRadiusKm: number;
  avgDeliveryTimeMinutes: number;
  minOrderAmount: number;
  pickupAvailable: boolean;
  pickupAddress: string | null;
  storefrontEnabled: boolean;
  storefrontDescription: string | null;
  storefrontBannerUrl: string | null;
  communityVisible: boolean;
  verifiedAt: string | null;
  rejectionReason: string | null;
  submittedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface VmsVendorCommerceProfileRequest {
  upiEnabled?: boolean;
  upiId?: string;
  deliveryAvailable?: boolean;
  deliveryRadiusKm?: number;
  avgDeliveryTimeMinutes?: number;
  minOrderAmount?: number;
  pickupAvailable?: boolean;
  pickupAddress?: string;
  storefrontEnabled?: boolean;
  storefrontDescription?: string;
  storefrontBannerUrl?: string;
  communityVisible?: boolean;
}

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export const vendorCommerceProfileService = {
  /** Vendor Portal: get own commerce profile */
  async getMyProfile(): Promise<VmsVendorCommerceProfileResponse> {
    return apiClient.get("/v1/commerce/vendors/my-profile");
  },

  /** Admin: list all commerce profiles in community */
  async listProfiles(
    params: { status?: string; page?: number; size?: number } = {}
  ): Promise<PagedResponse<VmsVendorCommerceProfileResponse>> {
    const { status, page = 0, size = 20 } = params;
    const query = new URLSearchParams({ page: String(page), size: String(size) });
    if (status) query.set("status", status);
    return apiClient.get(`/v1/commerce/vendors?${query}`);
  },

  /** Admin: get profile for a specific vendor */
  async getProfile(vendorId: number): Promise<VmsVendorCommerceProfileResponse> {
    return apiClient.get(`/v1/commerce/vendors/${vendorId}/profile`);
  },

  /** Vendor Portal: save / update commerce profile */
  async upsertProfile(
    vendorId: number,
    data: VmsVendorCommerceProfileRequest
  ): Promise<VmsVendorCommerceProfileResponse> {
    return apiClient.put(`/v1/commerce/vendors/${vendorId}/profile`, data);
  },

  /** Vendor Portal: submit for verification */
  async submitForVerification(vendorId: number): Promise<VmsVendorCommerceProfileResponse> {
    return apiClient.post(`/v1/commerce/vendors/${vendorId}/profile/submit`);
  },

  /** Admin: verify / approve a profile */
  async verifyProfile(vendorId: number): Promise<VmsVendorCommerceProfileResponse> {
    return apiClient.post(`/v1/commerce/vendors/${vendorId}/profile/verify`);
  },

  /** Admin: reject a profile */
  async rejectProfile(vendorId: number, reason: string): Promise<VmsVendorCommerceProfileResponse> {
    return apiClient.post(`/v1/commerce/vendors/${vendorId}/profile/reject`, { reason });
  },

  /** Admin: suspend a profile */
  async suspendProfile(vendorId: number): Promise<VmsVendorCommerceProfileResponse> {
    return apiClient.post(`/v1/commerce/vendors/${vendorId}/profile/suspend`);
  },
};
