import { apiClient } from '@/services/common/apiClient';

export type DocumentCategory =
  | 'RENTAL_AGREEMENT'
  | 'DOCTOR_DOCUMENT'
  | 'VENDOR_KYC'
  | 'SPORTS_WAIVER'
  | 'INSURANCE_DOCUMENT'
  | 'INVOICE'
  | 'EVENT_SPONSORSHIP_CONTRACT'
  | 'GOVERNANCE_RECORD'
  | 'OTHER';

export type DocumentStatus = 'PENDING_SCAN' | 'ACTIVE' | 'EXPIRED' | 'ARCHIVED' | 'DELETED';
export type DocScanStatus = 'PENDING' | 'CLEAN' | 'INFECTED' | 'SCAN_FAILED';
export type DocAccessLevel = 'OWNER_ONLY' | 'COMMUNITY_ADMIN' | 'COMMUNITY' | 'PUBLIC';

export interface DocumentDto {
  id: number;
  title: string;
  description?: string;
  category: DocumentCategory;
  entityType?: string;
  entityId?: string;
  status: DocumentStatus;
  accessLevel: DocAccessLevel;
  expiresAt?: string;
  expiryWarning: boolean;
  versionCount: number;
  currentVersionFilename?: string;
  fileSizeBytes?: number;
  scanStatus?: DocScanStatus;
  createdAt: string;
  createdBy: number;
}

export interface DocumentVersionDto {
  id: number;
  versionNumber: number;
  originalFilename: string;
  contentType?: string;
  fileSizeBytes?: number;
  scanStatus: DocScanStatus;
  uploadedAt: string;
  uploadedBy: number;
}

export interface DocumentUploadRequest {
  title: string;
  description?: string;
  category: DocumentCategory;
  entityType?: string;
  entityId?: string;
  accessLevel?: DocAccessLevel;
  expiresAt?: string;
  reminderDaysBefore?: number;
  retentionDays?: number;
}

export interface DownloadLogEntry {
  id: number;
  downloaderUserId: number;
  ipAddress?: string;
  downloadedAt: string;
}

export interface DocumentAccessGrantRequest {
  granteeType: 'USER' | 'ROLE';
  granteeId: string;
  permission: 'VIEW' | 'DOWNLOAD' | 'MANAGE';
  expiresAt?: string;
}

export const documentService = {
  upload: (request: DocumentUploadRequest, file: File): Promise<DocumentDto> => {
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(request)], { type: 'application/json' }));
    form.append('file', file);
    return apiClient.post('/documents', form).then((r: any) => r?.data ?? r);
  },

  get: (id: number): Promise<DocumentDto> =>
    apiClient.get(`/documents/${id}`).then((r: any) => r?.data ?? r),

  download: (id: number): Promise<{ url: string; expiresAt: string }> =>
    apiClient.get(`/documents/${id}/download`).then((r: any) => r?.data ?? r),

  getVersions: (id: number): Promise<DocumentVersionDto[]> =>
    apiClient.get(`/documents/${id}/versions`).then((r: any) => r?.data ?? r),

  addVersion: (id: number, file: File): Promise<DocumentVersionDto> => {
    const form = new FormData();
    form.append('file', file);
    return apiClient.post(`/documents/${id}/versions`, form).then((r: any) => r?.data ?? r);
  },

  listByEntity: (entityType: string, entityId: string | number): Promise<DocumentDto[]> =>
    apiClient.get(`/documents/entity/${entityType}/${entityId}`).then((r: any) => r?.data ?? r),

  list: (category?: DocumentCategory): Promise<DocumentDto[]> =>
    apiClient.get('/documents', { params: category ? { category } : {} }).then((r: any) => r?.data ?? r),

  grantAccess: (id: number, grant: DocumentAccessGrantRequest): Promise<void> =>
    apiClient.post(`/documents/${id}/access-grants`, grant).then(() => {}),

  revokeAccess: (id: number, grantId: number): Promise<void> =>
    apiClient.delete(`/documents/${id}/access-grants/${grantId}`).then(() => {}),

  getAuditLog: (id: number): Promise<DownloadLogEntry[]> =>
    apiClient.get(`/documents/${id}/audit-log`).then((r: any) => r?.data ?? r),

  delete: (id: number): Promise<void> =>
    apiClient.delete(`/documents/${id}`).then(() => {}),
};
