import { apiClient } from "./apiClient";

export interface ApiEndpoint {
  method: string;
  path: string;
  handler: string;
}

export interface ApiGroup {
  tag: string;
  endpoints: ApiEndpoint[];
}

export const apiCatalogService = {
  getApiCatalog(): Promise<ApiGroup[]> {
    return apiClient.get<ApiGroup[]>("/admin/api-catalog");
  },
};
