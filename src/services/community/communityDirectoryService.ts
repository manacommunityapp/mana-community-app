import { apiClient } from "../common/apiClient";
import type { CommunityLeaderResponse, CommunityLeaderRequest } from "../../types/api";

export interface CommunityDesignationResponse {
  id: number;
  name: string;
  communityId?: number | null;
  displayOrder?: number;
  isDefault?: boolean;
}

export interface CommunityDesignationRequest {
  name: string;
  displayOrder?: number;
}

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

  async getDesignations(): Promise<CommunityDesignationResponse[]> {
    return apiClient.get<CommunityDesignationResponse[]>("/community/directory/designations");
  },

  async addDesignation(req: CommunityDesignationRequest | string): Promise<CommunityDesignationResponse> {
    const payload = typeof req === "string" ? { name: req } : req;
    return apiClient.post<CommunityDesignationResponse>("/community/directory/designations", payload);
  },
};
