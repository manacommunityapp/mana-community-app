import { apiClient } from "../common/apiClient";

export type MediaModule =
  | "EVENT"
  | "USER"
  | "MARKETPLACE"
  | "SPORTS"
  | "HEALTHCARE"
  | "COMMUNITY"
  | "VISITOR"
  | "FINANCE"
  | "COMPLAINT"
  | "ANNOUNCEMENT"
  | "DOCUMENT";

export type MediaType = "IMAGE" | "VIDEO" | "DOCUMENT" | "AUDIO" | "CERTIFICATE" | "QR_CODE";

export type MediaStatus = "PENDING" | "PROCESSING" | "ACTIVE" | "REJECTED" | "DELETED" | "ARCHIVED";

export interface MediaUploadRequest {
  module: MediaModule;
  moduleId: string;
  communityId: number;
  subContext?: string;
  caption?: string;
  altText?: string;
  approvalRequired?: boolean;
  featured?: boolean;
  sortOrder?: number;
}

export interface PresignedUploadRequest {
  module: MediaModule;
  moduleId: string;
  communityId: number;
  subContext?: string;
  mediaType: MediaType;
  mimeType: string;
  originalFileName: string;
  fileSize?: number;
  approvalRequired?: boolean;
  featured?: boolean;
  caption?: string;
  altText?: string;
  sortOrder?: number;
}

export interface MediaResponse {
  id: string; // UUID
  module: MediaModule;
  moduleId: string;
  communityId: number;
  subContext?: string;
  mediaType: MediaType;
  fileSize: number;
  mimeType: string;
  originalFileName: string;
  caption?: string;
  altText?: string;
  featured: boolean;
  sortOrder: number;
  status: MediaStatus;
  url: string;
  thumbnailUrl?: string;
  compressedUrl?: string;
  mediumUrl?: string;
  width?: number;
  height?: number;
  durationSeconds?: number;
  uploadedBy: number;
  uploadedAt: string;
  createdAt: string;
}

export interface PresignedUrlResponse {
  sessionId: string;
  presignedUploadUrl: string;
  httpMethod: string;
  s3Key: string;
  contentType: string;
  expiresAt: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export const mediaService = {
  /**
   * Direct multipart upload through Spring Boot to S3 (for images, documents, certificates).
   */
  async upload(file: File, request: MediaUploadRequest): Promise<MediaResponse> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("request", new Blob([JSON.stringify(request)], { type: "application/json" }));
    return apiClient.postForm<MediaResponse>("/media/upload", formData);
  },

  /**
   * Request a presigned S3 PUT URL for direct browser -> S3 upload (for videos / large files).
   */
  async getPresignedUploadUrl(request: PresignedUploadRequest): Promise<PresignedUrlResponse> {
    return apiClient.post<PresignedUrlResponse>("/media/presigned-upload", request);
  },

  /**
   * Confirm presigned upload completion after client PUT directly to S3.
   */
  async confirmPresignedUpload(sessionId: string): Promise<MediaResponse> {
    return apiClient.post<MediaResponse>(`/media/presigned-upload/confirm/${sessionId}`);
  },

  /**
   * Direct browser to S3 upload helper: obtains presigned URL, executes PUT, and confirms.
   */
  async uploadDirectToS3(file: File, request: Omit<PresignedUploadRequest, "mimeType" | "originalFileName" | "fileSize">): Promise<MediaResponse> {
    const presigned = await this.getPresignedUploadUrl({
      ...request,
      mimeType: file.type || "application/octet-stream",
      originalFileName: file.name,
      fileSize: file.size,
    });

    const uploadRes = await fetch(presigned.presignedUploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": presigned.contentType,
      },
      body: file,
    });

    if (!uploadRes.ok) {
      throw new Error(`Direct AWS S3 Cloud Storage upload failed with HTTP ${uploadRes.status}. Database record was NOT created.`);
    }

    return this.confirmPresignedUpload(presigned.sessionId);
  },

  /**
   * Fetch a single media item by UUID.
   */
  async getById(id: string): Promise<MediaResponse> {
    return apiClient.get<MediaResponse>(`/media/${id}`);
  },

  /**
   * Fetch paginated list of media items for a specific module entity.
   */
  async getByModule(module: MediaModule, moduleId: string, page = 0, size = 20): Promise<PageResponse<MediaResponse>> {
    return apiClient.get<PageResponse<MediaResponse>>(`/media/module/${module}/${moduleId}?page=${page}&size=${size}`);
  },

  /**
   * Fetch all active media items for a module entity (unpaginated).
   */
  async getActiveByModule(module: MediaModule, moduleId: string): Promise<MediaResponse[]> {
    return apiClient.get<MediaResponse[]>(`/media/module/${module}/${moduleId}/active`);
  },

  /**
   * Fetch media items by sub-context (e.g., "gallery", "banner", "sponsor").
   */
  async getBySubContext(module: MediaModule, moduleId: string, subContext: string): Promise<MediaResponse[]> {
    return apiClient.get<MediaResponse[]>(`/media/module/${module}/${moduleId}/context/${subContext}`);
  },

  /**
   * Soft-delete a media item.
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete<void>(`/media/${id}`);
  },

  /**
   * Restore a soft-deleted media item.
   */
  async restore(id: string): Promise<MediaResponse> {
    return apiClient.post<MediaResponse>(`/media/${id}/restore`);
  },

  /**
   * Approve a pending media item.
   */
  async approve(id: string): Promise<MediaResponse> {
    return apiClient.post<MediaResponse>(`/media/${id}/approve`);
  },

  /**
   * Reject a pending media item.
   */
  async reject(id: string, reason: string): Promise<MediaResponse> {
    return apiClient.post<MediaResponse>(`/media/${id}/reject?reason=${encodeURIComponent(reason)}`);
  },
};
