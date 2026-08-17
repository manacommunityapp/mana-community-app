import { apiClient } from "../common/apiClient";
import type { CommunityResponse } from "../../types/api";

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

  async updateModules(id: number, modules: string[]): Promise<CommunityResponse> {
    return apiClient.put<CommunityResponse>(`/communities/${id}/modules`, { modules });
  },

  async getCommunityModules(communityId: number) {
    return apiClient.get<CommunityModuleResponse[]>(`/community-modules/${communityId}`);
  },

  async bulkUpdateModules(communityId: number, modules: { moduleKey: string; isEnabled: boolean }[]) {
    return apiClient.post<CommunityModuleResponse[]>(`/community-modules/bulk`, { communityId, modules });
  },

  async initializeModules(communityId: number): Promise<void> {
    return apiClient.post<void>(`/community-modules/${communityId}/initialize`);
  },

  /** Checks if a block & flat combination is already registered in the specified community. */
  async checkUnitExists(communityIdOrCode: number | string, block: string, flatNo: string): Promise<boolean> {
    try {
      const query = typeof communityIdOrCode === "number"
        ? `communityId=${communityIdOrCode}`
        : `inviteCode=${encodeURIComponent(communityIdOrCode)}`;
      const res = await apiClient.get<{ exists: boolean }>(
        `/communities/check-unit?${query}&block=${encodeURIComponent(block.trim())}&flatNo=${encodeURIComponent(flatNo.trim())}`
      );
      if (res && typeof res.exists === "boolean") return res.exists;
    } catch {
      try {
        if (typeof communityIdOrCode === "number") {
          const users = await apiClient.get<any[]>(`/users/community/${communityIdOrCode}`);
          if (Array.isArray(users)) {
            return users.some(
              (u) =>
                u.block?.toString().trim().toUpperCase() === block.trim().toUpperCase() &&
                u.flatNo?.toString().trim().toUpperCase() === flatNo.trim().toUpperCase()
            );
          }
        }
      } catch {
        // Fallback for public unauthenticated guest
      }
    }
    return false;
  },
};

export interface CommunityModuleResponse {
  id: number;
  communityId: number;
  moduleKey: string;
  moduleLabel: string;
  isEnabled: boolean;
  sortOrder: number;
}
