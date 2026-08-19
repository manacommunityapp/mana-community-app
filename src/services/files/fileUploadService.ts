import { apiClient, getStoredUser } from "../common/apiClient";
import { mediaService, type MediaModule } from "./mediaService";

export interface UploadedFileDto {
  id: number | string | null;
  url: string;
  originalName: string;
  contentType: string;
  sizeBytes: number;
}

export const fileUploadService = {
  /**
   * Uploads a file to AWS S3 via the centralized Media Service (/api/media/upload).
   * Returns only persisted URLs that can safely be saved on feature records.
   */
  async upload(
    file: File,
    module: MediaModule = "EVENT",
    moduleId: string = "1",
    communityId?: number,
    subContext = "gallery"
  ): Promise<UploadedFileDto> {
    try {
      const resolvedCommunityId = communityId ?? getStoredUser()?.communityId ?? 1001;
      const media = await mediaService.upload(file, {
        module,
        moduleId,
        communityId: resolvedCommunityId,
        subContext,
      });
      return {
        id: media.id,
        url: media.url,
        originalName: media.originalFileName,
        contentType: media.mimeType,
        sizeBytes: media.fileSize,
      };
    } catch (err: any) {
      let msg = err?.response?.data?.message || err?.message || "Failed to upload file to S3 cloud storage.";
      const lower = msg.toLowerCase();
      if (lower.includes("301") || lower.includes("specified endpoint") || lower.includes("permanentredirect")) {
        msg = "Unable to save file to AWS S3: S3 bucket region misconfigured. Please check S3_REGION settings.";
      } else if (lower.includes("access key") || lower.includes("accessdenied") || lower.includes("403") || lower.includes("invalidaccesskeyid")) {
        msg = "Unable to save file to AWS S3: Invalid S3 Access Key or Secret Key. Please verify S3_ACCESS_KEY and S3_SECRET_KEY environment variables.";
      }
      console.error("S3 Media Service upload failed:", msg);
      throw new Error(msg);
    }
  },

  async uploadEventPaymentScreenshot(
    file: File,
    meta: {
      eventId?: string | number;
      eventName?: string;
      block?: string;
      flatNo?: string;
    }
  ): Promise<UploadedFileDto> {
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (meta.eventId) formData.append("eventId", String(meta.eventId));
      if (meta.eventName) formData.append("eventName", meta.eventName);
      if (meta.block) formData.append("block", meta.block);
      if (meta.flatNo) formData.append("flatNo", meta.flatNo);

      return await apiClient.postForm<UploadedFileDto>("/files/upload/event-payment", formData);
    } catch (err: any) {
      console.warn("Server S3 payment screenshot upload failed, using fallback:", err);
      // Fallback to local object URL or standard upload
      return {
        id: null,
        url: URL.createObjectURL(file),
        originalName: file.name,
        contentType: file.type,
        sizeBytes: file.size,
      };
    }
  },

  async deleteFile(id: number | string): Promise<void> {
    if (typeof id === "string") {
      await mediaService.delete(id);
    } else {
      await apiClient.delete<void>(`/files/${id}`);
    }
  },
};
