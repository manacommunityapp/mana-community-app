import { apiClient } from "../common/apiClient";
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
   * Falls back to legacy /files/upload if needed.
   */
  async upload(
    file: File,
    module: MediaModule = "EVENT",
    moduleId: string = "1",
    communityId: number = 1001
  ): Promise<UploadedFileDto> {
    try {
      const media = await mediaService.upload(file, {
        module,
        moduleId,
        communityId,
        subContext: "gallery",
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

  async deleteFile(id: number | string): Promise<void> {
    if (typeof id === "string") {
      await mediaService.delete(id);
    } else {
      await apiClient.delete<void>(`/files/${id}`);
    }
  },
};
