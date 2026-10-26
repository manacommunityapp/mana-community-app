import { apiClient } from "../common/apiClient";

export interface UserPrivacySettings {
  id?: number;
  userId?: number;
  showPhoneToNeighbours: boolean;
  showEmailToNeighbours: boolean;
  showFlatInDirectory: boolean;
  showFamilyMembers: boolean;
  showVehicleInDirectory?: boolean;
  emergencyContactRestricted?: boolean;
  allowMarketplaceContact: boolean;
  allowEventTagging: boolean;
  activityVisibility: "PRIVATE" | "COMMUNITY" | "PUBLIC" | string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserProfileExport {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  kycStatus: string;
  flatNo?: string;
  block?: string;
  tower?: string;
  occupancyStatus?: string;
  residentType?: string;
  createdAt?: string;
}

export interface FamilyMemberExport {
  id: number;
  name: string;
  relation: string;
  age?: number;
  gender?: string;
  phone?: string;
  email?: string;
}

export interface VisitorPassExport {
  id: number;
  passCode: string;
  visitorName: string;
  visitorPhone?: string;
  purpose?: string;
  status: string;
  expectedAt?: string;
  checkedInAt?: string;
  checkedOutAt?: string;
  createdAt?: string;
}

export interface MarketplaceOrderExport {
  id: number;
  orderNumber?: string;
  totalAmount?: number;
  status: string;
  role: string;
  createdAt?: string;
}

export interface UserDataExport {
  user: UserProfileExport;
  familyMembers: FamilyMemberExport[];
  visitorPasses: VisitorPassExport[];
  marketplaceOrders: MarketplaceOrderExport[];
  exportedAt: string;
}

export interface DataDeletionRequest {
  id: number;
  userId: number;
  communityId?: number;
  status: "PENDING" | "VERIFIED" | "PROCESSING" | "COMPLETED" | "REJECTED" | "CANCELLED" | string;
  reason?: string;
  requestedAt: string;
  processedAt?: string;
  processedBy?: number;
  notes?: string;
}

export interface DataRetentionPolicy {
  id: number;
  communityId?: number | null;
  dataCategory: string;
  retentionPeriodDays: number;
  actionOnExpiry: "DELETE" | "ANONYMIZE" | "ARCHIVE" | string;
  isActive: boolean;
  description?: string;
  updatedAt?: string;
}

export const privacyService = {
  /**
   * Get current user's privacy settings
   */
  async getPrivacySettings(): Promise<UserPrivacySettings> {
    return apiClient.get<UserPrivacySettings>("/privacy/settings");
  },

  /**
   * Update current user's privacy settings
   */
  async updatePrivacySettings(settings: Partial<UserPrivacySettings>): Promise<UserPrivacySettings> {
    return apiClient.put<UserPrivacySettings>("/privacy/settings", settings);
  },

  /**
   * Export all personal data for the logged-in user (GDPR Right of Access & Portability)
   */
  async getMyData(): Promise<UserDataExport> {
    return apiClient.get<UserDataExport>("/privacy/my-data");
  },

  /**
   * Submit an account and data deletion request
   */
  async submitDeletionRequest(reason?: string): Promise<DataDeletionRequest> {
    return apiClient.post<DataDeletionRequest>("/privacy/deletion-request", { reason });
  },

  /**
   * Get current user's deletion request status
   */
  async getDeletionRequestStatus(): Promise<DataDeletionRequest | null> {
    return apiClient.get<DataDeletionRequest | null>("/privacy/deletion-request/status");
  },

  /**
   * Cancel pending deletion request
   */
  async cancelDeletionRequest(requestId?: number): Promise<{ success: boolean; message: string }> {
    return apiClient.post<{ success: boolean; message: string }>("/privacy/deletion-request/cancel", { requestId });
  },

  /**
   * Admin: Get all deletion requests
   */
  async getAdminDeletionRequests(): Promise<DataDeletionRequest[]> {
    return apiClient.get<DataDeletionRequest[]>("/privacy/admin/deletion-requests");
  },

  /**
   * Admin: Process & execute deletion request (anonymizes PII)
   */
  async processAdminDeletionRequest(requestId: number, notes?: string): Promise<DataDeletionRequest> {
    return apiClient.post<DataDeletionRequest>(`/privacy/admin/deletion-requests/${requestId}/process`, { notes });
  },

  /**
   * Admin: Reject deletion request
   */
  async rejectAdminDeletionRequest(requestId: number, notes?: string): Promise<DataDeletionRequest> {
    return apiClient.post<DataDeletionRequest>(`/privacy/admin/deletion-requests/${requestId}/reject`, { notes });
  },

  /**
   * Admin: Get all data retention policies
   */
  async getAdminRetentionPolicies(): Promise<DataRetentionPolicy[]> {
    return apiClient.get<DataRetentionPolicy[]>("/privacy/admin/retention-policies");
  },

  /**
   * Admin: Update data retention policy
   */
  async updateAdminRetentionPolicy(policyId: number, policy: Partial<DataRetentionPolicy>): Promise<DataRetentionPolicy> {
    return apiClient.put<DataRetentionPolicy>(`/privacy/admin/retention-policies/${policyId}`, policy);
  },
};
