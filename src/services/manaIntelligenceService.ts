import { apiClient } from './common/apiClient';
import type {
  CommunityProfile,
  RecommendationCard,
  OmniSearchResponse,
  UpdateVisibilityRequest,
} from '../types/manaIntelligence';

export const manaIntelligenceService = {
  getPersonalizedFeed: async (): Promise<{ recommendations: RecommendationCard[]; total: number }> => {
    const res = await apiClient.get<any>('/graph/recommendations/feed');
    return res;
  },

  searchDiscoverProfiles: async (q?: string, tower?: string, skill?: string): Promise<CommunityProfile[]> => {
    const params = new URLSearchParams();
    if (q) params.append('q', q);
    if (tower) params.append('tower', tower);
    if (skill) params.append('skill', skill);
    const res = await apiClient.get<CommunityProfile[]>(`/graph/discover/search?${params.toString()}`);
    return res;
  },

  omniSearch: async (query: string, limit = 6): Promise<OmniSearchResponse> => {
    const res = await apiClient.get<OmniSearchResponse>(`/graph/omnisearch?q=${encodeURIComponent(query)}&limit=${limit}`);
    return res;
  },

  getTopSkills: async (): Promise<{ skill: string; count: number }[]> => {
    const res = await apiClient.get<{ skill: string; count: number }[]>('/graph/discover/skills');
    return res;
  },

  updateVisibility: async (req: UpdateVisibilityRequest): Promise<CommunityProfile> => {
    const res = await apiClient.put<CommunityProfile>('/graph/privacy/visibility', req);
    return res;
  },
};
