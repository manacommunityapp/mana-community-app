import { apiClient } from "./apiClient";
import type { EngagementScoreResponse, TrendingResponse, GroupResponse, PaginatedResponse } from "../types/api";

export const engagementService = {
  async getMyScore(): Promise<EngagementScoreResponse> {
    return apiClient.get<EngagementScoreResponse>("/engagement/score");
  },

  async getLeaderboard(limit = 20): Promise<EngagementScoreResponse[]> {
    return apiClient.get<EngagementScoreResponse[]>(`/engagement/leaderboard?limit=${limit}`);
  },

  async getTrending(limit = 10): Promise<TrendingResponse[]> {
    return apiClient.get<TrendingResponse[]>(`/engagement/trending?limit=${limit}`);
  },
};

export const groupService = {
  async getGroups(page = 0, size = 20, category?: string, search?: string): Promise<PaginatedResponse<GroupResponse>> {
    let url = `/groups?page=${page}&size=${size}`;
    if (category) url += `&category=${encodeURIComponent(category)}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    return apiClient.get<PaginatedResponse<GroupResponse>>(url);
  },

  async getMyGroups(): Promise<GroupResponse[]> {
    return apiClient.get<GroupResponse[]>("/groups/my");
  },

  async getGroup(id: number): Promise<GroupResponse> {
    return apiClient.get<GroupResponse>(`/groups/${id}`);
  },

  async createGroup(data: { name: string; description?: string; groupType?: string; category?: string; coverImageUrl?: string; iconUrl?: string; requiresApproval?: boolean; rules?: string; tags?: string }): Promise<GroupResponse> {
    return apiClient.post<GroupResponse>("/groups", data);
  },

  async joinGroup(id: number): Promise<GroupResponse> {
    return apiClient.post<GroupResponse>(`/groups/${id}/join`);
  },

  async leaveGroup(id: number): Promise<void> {
    return apiClient.delete<void>(`/groups/${id}/leave`);
  },
};
