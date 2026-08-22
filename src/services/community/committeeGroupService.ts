import { apiClient } from "../common/apiClient";
import type { CommitteeGroupResponse, CommitteeGroupRequest } from "../../types/api";

export const committeeGroupService = {
  async getAll(): Promise<CommitteeGroupResponse[]> {
    return apiClient.get<CommitteeGroupResponse[]>("/community/committee-groups/all");
  },

  async getActive(): Promise<CommitteeGroupResponse[]> {
    return apiClient.get<CommitteeGroupResponse[]>("/community/committee-groups");
  },

  async create(req: CommitteeGroupRequest): Promise<CommitteeGroupResponse> {
    return apiClient.post<CommitteeGroupResponse>("/community/committee-groups", req);
  },

  async update(id: number, req: CommitteeGroupRequest): Promise<CommitteeGroupResponse> {
    return apiClient.put<CommitteeGroupResponse>(`/community/committee-groups/${id}`, req);
  },

  async toggleStatus(id: number): Promise<CommitteeGroupResponse> {
    return apiClient.put<CommitteeGroupResponse>(`/community/committee-groups/${id}/toggle-status`, {});
  },

  async delete(id: number): Promise<void> {
    return apiClient.delete<void>(`/community/committee-groups/${id}`);
  },
};
