import apiClient from "@/services/apiClient";

export type CustomerStatus = "ACTIVE" | "INACTIVE" | "BLACKLISTED";
export type AddressLabel = "HOME" | "WORK" | "OTHER";

export interface CommerceCustomerAddressResponse {
  id: number;
  label: AddressLabel;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
  createdAt: string;
}

export interface CommerceCustomerProfileResponse {
  id: number;
  userId: number;
  displayName?: string;
  email?: string;
  phoneNumber?: string;
  customerStatus: CustomerStatus;
  loyaltyPoints: number;
  totalOrders: number;
  totalSpend: number;
  isMember: boolean;
  preferredCategories?: string;
  kycVerified: boolean;
  kycVerifiedAt?: string;
  defaultAddressId?: number;
  addresses: CommerceCustomerAddressResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface CommerceCustomerProfileUpdateRequest {
  displayName?: string;
  phoneNumber?: string;
  preferredCategories?: string;
}

export interface CommerceCustomerAddressRequest {
  label?: AddressLabel;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
}

export const commerceCustomerService = {
  getMyProfile(): Promise<CommerceCustomerProfileResponse> {
    return apiClient.get("/v1/commerce/customer/me").then((r) => r.data);
  },

  updateMyProfile(
    data: CommerceCustomerProfileUpdateRequest
  ): Promise<CommerceCustomerProfileResponse> {
    return apiClient.put("/v1/commerce/customer/me", data).then((r) => r.data);
  },

  addAddress(
    data: CommerceCustomerAddressRequest
  ): Promise<CommerceCustomerAddressResponse> {
    return apiClient
      .post("/v1/commerce/customer/me/addresses", data)
      .then((r) => r.data);
  },

  updateAddress(
    id: number,
    data: CommerceCustomerAddressRequest
  ): Promise<CommerceCustomerAddressResponse> {
    return apiClient
      .put(`/v1/commerce/customer/me/addresses/${id}`, data)
      .then((r) => r.data);
  },

  deleteAddress(id: number): Promise<void> {
    return apiClient
      .delete(`/v1/commerce/customer/me/addresses/${id}`)
      .then(() => {});
  },
};
