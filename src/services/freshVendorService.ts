import { apiClient } from './common/apiClient';
import type {
  VendorCapabilityDto,
  ApplyCapabilityRequest,
  ApproveCapabilityRequest,
  VendorStaffDto,
  InviteStaffRequest,
  FreshVendorDashboardSummaryDto,
} from '../types/freshVendor';

export const freshVendorService = {
  // ── Vendor Endpoints ───────────────────────────────────────────────
  applyForCapability: async (data: ApplyCapabilityRequest): Promise<VendorCapabilityDto> => {
    return apiClient.post<VendorCapabilityDto>('/v1/fresh/vendor/capabilities/apply', data);
  },

  getVendorCapabilities: async (vendorId: number): Promise<VendorCapabilityDto[]> => {
    return apiClient.get<VendorCapabilityDto[]>(`/v1/fresh/vendor/capabilities?vendorId=${vendorId}`);
  },

  assignStaff: async (data: InviteStaffRequest): Promise<VendorStaffDto> => {
    return apiClient.post<VendorStaffDto>('/v1/fresh/vendor/staff', data);
  },

  getVendorStaff: async (vendorId: number): Promise<VendorStaffDto[]> => {
    return apiClient.get<VendorStaffDto[]>(`/v1/fresh/vendor/staff?vendorId=${vendorId}`);
  },

  deactivateStaff: async (vendorId: number, staffUserId: number): Promise<void> => {
    return apiClient.delete<void>(`/v1/fresh/vendor/staff/${staffUserId}?vendorId=${vendorId}`);
  },

  getDashboardSummary: async (vendorId: number): Promise<FreshVendorDashboardSummaryDto> => {
    return apiClient.get<FreshVendorDashboardSummaryDto>(`/v1/fresh/vendor/dashboard/summary?vendorId=${vendorId}`);
  },

  // ── Admin Endpoints ────────────────────────────────────────────────
  getPendingCapabilities: async (): Promise<VendorCapabilityDto[]> => {
    return apiClient.get<VendorCapabilityDto[]>('/v1/fresh/admin/capabilities/pending');
  },

  getAdminVendorCapabilities: async (vendorId: number): Promise<VendorCapabilityDto[]> => {
    return apiClient.get<VendorCapabilityDto[]>(`/v1/fresh/admin/vendors/${vendorId}/capabilities`);
  },

  reviewCapability: async (capabilityId: number, data: ApproveCapabilityRequest): Promise<VendorCapabilityDto> => {
    return apiClient.post<VendorCapabilityDto>(`/v1/fresh/admin/capabilities/${capabilityId}/review`, data);
  },

  suspendCapability: async (capabilityId: number, reason: string): Promise<VendorCapabilityDto> => {
    return apiClient.post<VendorCapabilityDto>(`/v1/fresh/admin/capabilities/${capabilityId}/suspend`, { reason });
  },
};