import { apiClient } from "../common/apiClient";

export type PinCategory =
  | "ALL"
  | "ALERTS"
  | "SPORTS"
  | "HELP_NEEDED"
  | "OFFERS"
  | "CARPOOL"
  | "LOST_FOUND"
  | "GENERAL";

export interface CommunityPin {
  id: number;
  communityId: number;
  authorId: number;
  authorName: string;
  flatNumber?: string;
  category: string;
  content: string;
  imageUrl?: string;
  externalLink?: string;
  expiresAt: string;
  isClosed: boolean;
  closedAt?: string;
  likesCount: number;
  createdAt: string;
  isExpired?: boolean;
}

export interface CreatePinPayload {
  category: string;
  content: string;
  imageUrl?: string;
  externalLink?: string;
  durationHours?: number;
}

export const communityPinService = {
  async getPins(communityId: number, category?: string): Promise<CommunityPin[]> {
    const params = category && category !== "ALL" ? { category } : undefined;
    const res = await apiClient.get<CommunityPin[]>(`/communities/${communityId}/pins`, { params });
    return res.data || [];
  },

  async createPin(communityId: number, payload: CreatePinPayload): Promise<CommunityPin> {
    const res = await apiClient.post<CommunityPin>(`/communities/${communityId}/pins`, payload);
    return res.data;
  },

  async closePin(communityId: number, pinId: number): Promise<CommunityPin> {
    const res = await apiClient.post<CommunityPin>(`/communities/${communityId}/pins/${pinId}/close`, {});
    return res.data;
  },

  async likePin(communityId: number, pinId: number): Promise<CommunityPin> {
    const res = await apiClient.post<CommunityPin>(`/communities/${communityId}/pins/${pinId}/like`, {});
    return res.data;
  },
};
