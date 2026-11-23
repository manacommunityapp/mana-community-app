import { apiClient } from '../common/apiClient';

export type SearchModule =
  | 'PERSON'
  | 'EVENT' | 'POOJA'
  | 'SPORTS_EVENT' | 'COACHING'
  | 'FOOD_RESTAURANT' | 'FOOD_MENU_ITEM' | 'GROCERY_PRODUCT' | 'HOME_CHEF'
  | 'HOME_SERVICE' | 'VENDOR'
  | 'MARKETPLACE_LISTING'
  | 'HEALTH_DOCTOR' | 'HEALTH_CLINIC'
  | 'COURSE' | 'WORKSHOP'
  | 'TRIP' | 'RIDE'
  | 'JOB' | 'PROFESSIONAL_SERVICE';

// Runtime constants for bundler/Babel compatibility when imported as values
export const SearchModule = {};
export const SearchResultDto = {};
export const SearchResponse = {};

export interface SearchResultDto {
  id: string;
  module: SearchModule;
  title: string;
  subtitle?: string;
  description?: string;
  imageUrl?: string;
  tags?: string[];
  deepLinkType: string;
  deepLinkId: string;
  rank: number;
  metadata?: Record<string, unknown>;
}

export interface SearchResponse {
  results: SearchResultDto[];
  facets: Record<string, number>;
  total: number;
  page: number;
  size: number;
}

export const searchService = {
  search: (params: {
    q: string;
    modules?: SearchModule[];
    page?: number;
    size?: number;
  }): Promise<SearchResponse> => {
    const qs = new URLSearchParams();
    qs.set('q', params.q);
    if (params.modules?.length) qs.set('modules', params.modules.join(','));
    qs.set('page', String(params.page ?? 0));
    qs.set('size', String(params.size ?? 20));
    return apiClient.get<SearchResponse>(`/search?${qs.toString()}`);
  },
};

export default searchService;
