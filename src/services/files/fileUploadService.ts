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
      const msg = err?.response?.data?.message || err?.message || "Failed to upload file to S3 cloud storage.";
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
