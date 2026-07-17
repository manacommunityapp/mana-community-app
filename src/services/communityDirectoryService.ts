import { apiClient } from "./apiClient";
import type { CommunityLeaderResponse, CommunityLeaderRequest } from "../types/api";

export const communityDirectoryService = {
  async getDirectory(): Promise<CommunityLeaderResponse[]> {
    return apiClient.get<CommunityLeaderResponse[]>("/community/directory");
  },

  async addLeader(req: CommunityLeaderRequest): Promise<CommunityLeaderResponse> {
    return apiClient.post<CommunityLeaderResponse>("/community/directory", req);
  },

  async updateLeader(id: number, req: CommunityLeaderRequest): Promise<CommunityLeaderResponse> {
    return apiClient.put<CommunityLeaderResponse>(`/community/directory/${id}`, req);
  },

  async removeLeader(id: number): Promise<void> {
    return apiClient.delete<void>(`/community/directory/${id}`);
  },
};
