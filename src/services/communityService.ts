import { apiClient } from "./apiClient";
import type { CommunityResponse } from "../types/api";

export const communityService = {
  async getCommunities(type?: string): Promise<CommunityResponse[]> {
    const url = type ? `/communities?type=${type}` : "/communities";
    return apiClient.get<CommunityResponse[]>(url);
  },

  async createCommunity(community: Omit<CommunityResponse, "id">): Promise<CommunityResponse> {
    return apiClient.post<CommunityResponse>("/communities", community);
  },

  async updateCommunity(id: number, community: Omit<CommunityResponse, "id">): Promise<CommunityResponse> {
    return apiClient.put<CommunityResponse>(`/communities/${id}`, community);
  },

  /** Soft-delete: backend flags the community inactive (row preserved). */
  async deleteCommunity(id: number): Promise<void> {
    return apiClient.delete<void>(`/communities/${id}`);
  },
};
