import { apiClient } from "./apiClient";
import type { PaginatedResponse } from "../types/api";

export interface ListingResponse {
  id: number;
  title: string;
  description: string;
  price: number;
  priceUnit: string;
  category: string;
  status: string;
  transactionMode: string;
  visibility: string;
  location: string;
  imageUrls: string[];
  seller: { id: number; fullName: string; verified: boolean };
  communityId: number;
  createdAt: string;
  updatedAt: string;
}

export interface ListingRequest {
  title: string;
  description?: string;
  price: number;
  priceUnit?: string;
  category: string;
  transactionMode?: string;
  visibility?: string;
  location?: string;
  imageUrls?: string[];
}

export const listingService = {
  async getListings(category?: string, search?: string, page = 0, size = 12): Promise<PaginatedResponse<ListingResponse>> {
    const params = new URLSearchParams();
    if (category && category !== "All") params.set("category", category);
    if (search) params.set("search", search);
    params.set("page", String(page));
    params.set("size", String(size));
    return apiClient.get<PaginatedResponse<ListingResponse>>(`/marketplace/listings?${params.toString()}`);
  },

  async getMyListings(): Promise<ListingResponse[]> {
    return apiClient.get<ListingResponse[]>("/marketplace/listings/mine");
  },

  async getById(id: number): Promise<ListingResponse> {
    return apiClient.get<ListingResponse>(`/marketplace/listings/${id}`);
  },

  async create(data: ListingRequest): Promise<ListingResponse> {
    return apiClient.post<ListingResponse>("/marketplace/listings", data);
  },

  async update(id: number, data: ListingRequest): Promise<ListingResponse> {
    return apiClient.put<ListingResponse>(`/marketplace/listings/${id}`, data);
  },

  async updateStatus(id: number, status: string): Promise<void> {
    await apiClient.put<void>(`/marketplace/listings/${id}/status?status=${status}`, {});
  },

  async deleteListing(id: number): Promise<void> {
    await apiClient.delete<void>(`/marketplace/listings/${id}`);
  },
};
