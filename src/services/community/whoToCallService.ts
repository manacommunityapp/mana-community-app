import { apiClient } from "../common/apiClient";
import type {
  CommunityWhoToCallResponse,
  CommunityWhoToCallRequest,
  CommunityWhoToCallHistoryResponse,
} from "../../types/api";

const BASE_URL = "/community/who-to-call";

export const whoToCallService = {
  /** Get active Who to Call contacts for the current user's community */
  getWhoToCallList: async (): Promise<CommunityWhoToCallResponse[]> => {
    return apiClient.get<CommunityWhoToCallResponse[]>(BASE_URL);
  },

  /** Admin: Get all Who to Call contacts (active + inactive) */
  getAllWhoToCallList: async (): Promise<CommunityWhoToCallResponse[]> => {
    return apiClient.get<CommunityWhoToCallResponse[]>(`${BASE_URL}/all`);
  },

  /** Get contact details by ID */
  getWhoToCallById: async (id: number): Promise<CommunityWhoToCallResponse> => {
    return apiClient.get<CommunityWhoToCallResponse>(`${BASE_URL}/${id}`);
  },

  /** Admin: Create new Who to Call contact */
  createWhoToCall: async (
    req: CommunityWhoToCallRequest
  ): Promise<CommunityWhoToCallResponse> => {
    return apiClient.post<CommunityWhoToCallResponse>(BASE_URL, req);
  },

  /** Admin: Update an existing Who to Call contact */
  updateWhoToCall: async (
    id: number,
    req: CommunityWhoToCallRequest
  ): Promise<CommunityWhoToCallResponse> => {
    return apiClient.put<CommunityWhoToCallResponse>(`${BASE_URL}/${id}`, req);
  },

  /** Admin: Toggle active/inactive status */
  toggleStatus: async (id: number): Promise<void> => {
    return apiClient.put<void>(`${BASE_URL}/${id}/toggle-status`, {});
  },

  /** Admin: Soft-delete / deactivate contact */
  deleteWhoToCall: async (id: number): Promise<void> => {
    return apiClient.delete<void>(`${BASE_URL}/${id}`);
  },

  /** Admin: Restore deactivated contact */
  restoreWhoToCall: async (id: number): Promise<CommunityWhoToCallResponse> => {
    return apiClient.put<CommunityWhoToCallResponse>(`${BASE_URL}/${id}/restore`, {});
  },

  /** Admin: Get community-wide change history audit log */
  getCommunityHistory: async (): Promise<CommunityWhoToCallHistoryResponse[]> => {
    return apiClient.get<CommunityWhoToCallHistoryResponse[]>(`${BASE_URL}/history`);
  },

  /** Admin: Get change history for a specific contact */
  getContactHistory: async (
    id: number
  ): Promise<CommunityWhoToCallHistoryResponse[]> => {
    return apiClient.get<CommunityWhoToCallHistoryResponse[]>(`${BASE_URL}/${id}/history`);
  },
};
