import { apiClient } from "../common/apiClient";

export interface UploadedFileDto {
  id: number | null;
  url: string;
  originalName: string;
  contentType: string;
  sizeBytes: number;
}

export const fileUploadService = {
  async upload(file: File): Promise<UploadedFileDto> {
    const form = new FormData();
    form.append("file", file);
    return apiClient.postForm<UploadedFileDto>("/files/upload", form);
  },

  async deleteFile(id: number): Promise<void> {
    await apiClient.delete<void>(`/files/${id}`);
  },
};
