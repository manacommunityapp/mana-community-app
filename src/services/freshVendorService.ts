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

  seedPilotEnvironment: async (): Promise<{ status: string; message: string; pilotVendorsCount: number; pilotCommunities: string[] }> => {
    return apiClient.post('/v1/fresh/admin/pilot/seed', {});
  },

  getPilotMetrics: async (): Promise<import('../types/freshVendor').FreshPilotMetricsDto> => {
    return apiClient.get('/v1/fresh/admin/pilot/metrics');
  },

  // ── Multi-Document Compliance Endpoints ────────────────────────────
  uploadVendorDocument: async (data: import('../types/freshVendor').UploadVendorDocumentRequest): Promise<import('../types/freshVendor').VendorDocumentDto> => {
    return apiClient.post<import('../types/freshVendor').VendorDocumentDto>('/v1/fresh/vendor/documents', data);
  },

  getVendorDocuments: async (vendorId: number): Promise<import('../types/freshVendor').VendorDocumentDto[]> => {
    return apiClient.get<import('../types/freshVendor').VendorDocumentDto[]>(`/v1/fresh/vendor/documents?vendorId=${vendorId}`);
  },

  getAdminVendorDocuments: async (vendorId: number): Promise<import('../types/freshVendor').VendorDocumentDto[]> => {
    return apiClient.get<import('../types/freshVendor').VendorDocumentDto[]>(`/v1/fresh/admin/vendors/${vendorId}/documents`);
  },

  verifyVendorDocument: async (documentId: number, data: import('../types/freshVendor').VerifyVendorDocumentRequest): Promise<import('../types/freshVendor').VendorDocumentDto> => {
    return apiClient.post<import('../types/freshVendor').VendorDocumentDto>(`/v1/fresh/admin/documents/${documentId}/verify`, data);
  },

  // ── Multi-City & Serviceability Endpoints ──────────────────────────
  getActiveCities: async (): Promise<import('../types/freshVendor').FreshCityDto[]> => {
    return apiClient.get<import('../types/freshVendor').FreshCityDto[]>('/v1/fresh/cities');
  },

  getServiceZones: async (cityId?: number): Promise<import('../types/freshVendor').FreshServiceZoneDto[]> => {
    const url = cityId ? `/v1/fresh/service-zones?cityId=${cityId}` : '/v1/fresh/service-zones';
    return apiClient.get<import('../types/freshVendor').FreshServiceZoneDto[]>(url);
  },

  resolveServiceability: async (postalCode?: string, communityId?: number): Promise<import('../types/freshVendor').ServiceabilityResolutionDto> => {
    const params = new URLSearchParams();
    if (postalCode) params.append('postalCode', postalCode);
    if (communityId) params.append('communityId', String(communityId));
    return apiClient.get<import('../types/freshVendor').ServiceabilityResolutionDto>(`/v1/fresh/serviceability?${params.toString()}`);
  },

  // ── Fulfilment Group & Order Splitting Endpoints ───────────────────
  splitOrderIntoGroups: async (orderId: number): Promise<import('../types/freshVendor').FulfilmentGroupDto[]> => {
    return apiClient.post<import('../types/freshVendor').FulfilmentGroupDto[]>(`/v1/fresh/fulfilment/orders/${orderId}/split`, {});
  },

  getOrderFulfilmentGroups: async (orderId: number): Promise<import('../types/freshVendor').FulfilmentGroupDto[]> => {
    return apiClient.get<import('../types/freshVendor').FulfilmentGroupDto[]>(`/v1/fresh/fulfilment/orders/${orderId}/groups`);
  },

  getVendorFulfilmentGroups: async (vendorId: number): Promise<import('../types/freshVendor').FulfilmentGroupDto[]> => {
    return apiClient.get<import('../types/freshVendor').FulfilmentGroupDto[]>(`/v1/fresh/fulfilment/vendors/${vendorId}/groups`);
  },

  updateFulfilmentGroupStatus: async (groupId: number, status: string, trackingReference?: string): Promise<import('../types/freshVendor').FulfilmentGroupDto> => {
    return apiClient.post<import('../types/freshVendor').FulfilmentGroupDto>(`/v1/fresh/fulfilment/groups/${groupId}/status`, { status, trackingReference });
  },

  verifyFulfilmentHandover: async (groupId: number, otp: string, qrCodeToken?: string): Promise<import('../types/freshVendor').FulfilmentGroupDto> => {
    return apiClient.post<import('../types/freshVendor').FulfilmentGroupDto>(`/v1/fresh/fulfilment/groups/${groupId}/verify-handover`, { otp, qrCodeToken });
  },

  // ── Weight Variation Ledger Endpoints ──────────────────────────────
  recordActualWeight: async (data: import('../types/freshVendor').RecordWeightRequest): Promise<import('../types/freshVendor').WeightAdjustmentDto> => {
    return apiClient.post<import('../types/freshVendor').WeightAdjustmentDto>('/v1/fresh/weight/adjust', data);
  },

  getOrderWeightAdjustments: async (orderId: number): Promise<import('../types/freshVendor').WeightAdjustmentDto[]> => {
    return apiClient.get<import('../types/freshVendor').WeightAdjustmentDto[]>(`/v1/fresh/weight/order/${orderId}`);
  },

  // ── Product Recall Engine Endpoints ────────────────────────────────
  initiateProductRecall: async (data: import('../types/freshVendor').InitiateRecallRequest): Promise<import('../types/freshVendor').ProductRecallDto> => {
    return apiClient.post<import('../types/freshVendor').ProductRecallDto>('/v1/fresh/recalls/initiate', data);
  },

  getAllProductRecalls: async (): Promise<import('../types/freshVendor').ProductRecallDto[]> => {
    return apiClient.get<import('../types/freshVendor').ProductRecallDto[]>('/v1/fresh/recalls');
  },

  getProductRecallById: async (recallId: number): Promise<import('../types/freshVendor').ProductRecallDto> => {
    return apiClient.get<import('../types/freshVendor').ProductRecallDto>(`/v1/fresh/recalls/${recallId}`);
  },

  processRecallRefunds: async (recallId: number): Promise<import('../types/freshVendor').ProductRecallDto> => {
    return apiClient.post<import('../types/freshVendor').ProductRecallDto>(`/v1/fresh/recalls/${recallId}/process-refunds`, {});
  },

  // ── Wastage & Stock Movement Endpoints ─────────────────────────────
  recordStockMovement: async (data: import('../types/freshVendor').RecordStockMovementRequest): Promise<import('../types/freshVendor').StockMovementDto> => {
    return apiClient.post<import('../types/freshVendor').StockMovementDto>('/v1/fresh/inventory/movement', data);
  },

  getProductStockMovements: async (productId: number): Promise<import('../types/freshVendor').StockMovementDto[]> => {
    return apiClient.get<import('../types/freshVendor').StockMovementDto[]>(`/v1/fresh/inventory/movements/product/${productId}`);
  },

  recordProductWastage: async (data: import('../types/freshVendor').RecordWastageRequest): Promise<import('../types/freshVendor').ProductWastageDto> => {
    return apiClient.post<import('../types/freshVendor').ProductWastageDto>('/v1/fresh/inventory/wastage', data);
  },

  getAllProductWastages: async (): Promise<import('../types/freshVendor').ProductWastageDto[]> => {
    return apiClient.get<import('../types/freshVendor').ProductWastageDto[]>('/v1/fresh/inventory/wastage');
  },
};