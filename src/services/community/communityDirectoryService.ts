import { apiClient, getStoredUser } from "../common/apiClient";
import type {
  CommunityLeaderResponse,
  CommunityLeaderRequest,
  CommunityLeaderHistoryResponse,
} from "../../types/api";

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

const LEADER_HISTORY_STORAGE_KEY = "mana_leader_history_log";

function getLocalLeaderHistory(): CommunityLeaderHistoryResponse[] {
  try {
    const raw = localStorage.getItem(LEADER_HISTORY_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error("Failed to parse leader history cache", e);
  }
  return [];
}

function saveLocalLeaderHistory(list: CommunityLeaderHistoryResponse[]) {
  try {
    localStorage.setItem(LEADER_HISTORY_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.error("Failed to save leader history cache", e);
  }
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

  /** Get community-wide or leader-specific Council & Committee Leadership history */
  async getLeaderHistory(leaderId?: number): Promise<CommunityLeaderHistoryResponse[]> {
    try {
      const url = leaderId ? `/community/directory/${leaderId}/history` : `/community/directory/history`;
      const res = await apiClient.get<CommunityLeaderHistoryResponse[]>(url);
      if (Array.isArray(res) && res.length > 0) {
        return res;
      }
    } catch {
      // fallback to local storage history
    }

    const localList = getLocalLeaderHistory();
    if (leaderId) {
      return localList.filter((h) => h.leaderId === leaderId || h.userId === leaderId);
    }
    return localList;
  },

  /** Record a new Council & Committee Leader change history event */
  async recordLeaderHistory(entry: Partial<CommunityLeaderHistoryResponse>): Promise<CommunityLeaderHistoryResponse> {
    const currentUser = getStoredUser();
    const newEntry: CommunityLeaderHistoryResponse = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      leaderId: entry.leaderId,
      userId: entry.userId || 0,
      communityId: entry.communityId || currentUser?.communityId || 1,
      fullName: entry.fullName || "Council Leader",
      designation: entry.designation || "Member",
      committee: entry.committee || "",
      contactPhone: entry.contactPhone || "",
      contactEmail: entry.contactEmail || "",
      action: entry.action || "UPDATED",
      changedByUserId: Number(currentUser?.userId) || 1,
      changedByName: currentUser?.fullName || "Admin",
      changeSummary: entry.changeSummary || "",
      previousDesignation: entry.previousDesignation,
      previousCommittee: entry.previousCommittee,
      tenureStart: entry.tenureStart || new Date().toISOString(),
      tenureEnd: entry.tenureEnd,
      createdAt: entry.createdAt || new Date().toISOString(),
    };

    try {
      await apiClient.post<CommunityLeaderHistoryResponse>("/community/directory/history", newEntry);
    } catch {
      // offline / client-side storage
    }

    const currentList = getLocalLeaderHistory();
    const updatedList = [newEntry, ...currentList];
    saveLocalLeaderHistory(updatedList);
    return newEntry;
  },
};
