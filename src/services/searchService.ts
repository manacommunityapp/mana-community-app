import { apiClient } from './common/apiClient';

export interface GlobalSearchResult {
  type: 'RESIDENT' | 'MAINTENANCE' | 'EVENT' | 'NOTICE' | 'VISITOR';
  id: number;
  title: string;
  subtitle: string;
  url: string;
}

export async function globalSearch(query: string, limit = 20): Promise<GlobalSearchResult[]> {
  if (!query.trim()) return [];
  const params = new URLSearchParams({ q: query, limit: String(limit) });
  const response = await apiClient.get<{ success: boolean; data: GlobalSearchResult[] }>(
    `/search?${params.toString()}`
  );
  return response.data as GlobalSearchResult[];
}
