import { apiClient } from "./apiClient";

export interface NoticeResponse {
  id: number;
  title: string;
  body: string;
  category: string;
  priority: string;
  pinned: boolean;
  expiresOn: string | null;
  authorId: number;
  authorName: string;
  communityId: number;
  createdAt: string;
  updatedAt: string;
}

export interface NoticeRequest {
  title: string;
  body: string;
  category?: string;
  priority?: string;
  pinned?: boolean;
  expiresOn?: string;
}

export const noticeService = {
  async getNotices(category?: string): Promise<NoticeResponse[]> {
    const qs = category && category !== "All" ? `?category=${category}` : "";
    return apiClient.get<NoticeResponse[]>(`/notices${qs}`);
  },

  async getAllNotices(): Promise<NoticeResponse[]> {
    return apiClient.get<NoticeResponse[]>("/notices/all");
  },

  async getMyNotices(): Promise<NoticeResponse[]> {
    return apiClient.get<NoticeResponse[]>("/notices/mine");
  },

  async getById(id: number): Promise<NoticeResponse> {
    return apiClient.get<NoticeResponse>(`/notices/${id}`);
  },

  async create(data: NoticeRequest): Promise<NoticeResponse> {
    return apiClient.post<NoticeResponse>("/notices", data);
  },

  async update(id: number, data: NoticeRequest): Promise<NoticeResponse> {
    return apiClient.put<NoticeResponse>(`/notices/${id}`, data);
  },

  async togglePin(id: number): Promise<NoticeResponse> {
    return apiClient.put<NoticeResponse>(`/notices/${id}/pin`, {});
  },

  async deleteNotice(id: number): Promise<void> {
    await apiClient.delete<void>(`/notices/${id}`);
  },
};
