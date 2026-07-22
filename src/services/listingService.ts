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

export interface CategoryResponse {
  id: number;
  name: string;
  slug: string;
  icon: string;
  parentId: number | null;
  parentName: string | null;
  sortOrder: number;
  active: boolean;
}

export interface WishlistResponse {
  id: number;
  listingId: number;
  listingTitle: string;
  listingPrice: number;
  listingCategory: string;
  listingStatus: string;
  listingImageUrl: string | null;
  sellerName: string;
  addedAt: string;
}

export interface ReviewRequest {
  listingId: number;
  rating: number;
  comment?: string;
}

export interface ReviewResponse {
  id: number;
  listingId: number;
  listingTitle: string;
  reviewer: { id: number; fullName: string; verified: boolean };
  rating: number;
  comment: string;
  sellerReply: string | null;
  createdAt: string;
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
}

export interface OrderRequest {
  listingId: number;
  quantity?: number;
  notes?: string;
  deliveryAddress?: string;
}

export interface OrderResponse {
  id: number;
  orderNumber: string;
  buyer: { id: number; fullName: string };
  seller: { id: number; fullName: string; verified: boolean };
  status: string;
  totalAmount: number;
  notes: string;
  deliveryAddress: string;
  items: OrderItemResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderItemResponse {
  id: number;
  listingId: number;
  listingTitle: string;
  quantity: number;
  unitPrice: number;
  imageUrl: string | null;
}

export interface DonationRequest {
  title: string;
  description?: string;
  category: string;
  condition?: string;
  imageUrl?: string;
}

export interface DonationResponse {
  id: number;
  title: string;
  description: string;
  category: string;
  condition: string;
  status: string;
  imageUrl: string | null;
  donor: { id: number; fullName: string };
  communityId: number;
  claimedByName: string | null;
  createdAt: string;
}

export interface LostAndFoundRequest {
  title: string;
  description?: string;
  type: "LOST" | "FOUND";
  category?: string;
  imageUrl?: string;
  location?: string;
  dateOccurred?: string;
}

export interface LostAndFoundResponse {
  id: number;
  title: string;
  description: string;
  type: string;
  category: string;
  imageUrl: string | null;
  location: string;
  dateOccurred: string | null;
  status: string;
  reporter: { id: number; fullName: string };
  communityId: number;
  createdAt: string;
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

export const categoryService = {
  async getCategories(): Promise<CategoryResponse[]> {
    return apiClient.get<CategoryResponse[]>("/marketplace/categories");
  },
  async create(data: { name: string; icon?: string; parentId?: number; sortOrder?: number }): Promise<CategoryResponse> {
    return apiClient.post<CategoryResponse>("/marketplace/categories", data);
  },
  async update(id: number, data: { name: string; icon?: string; parentId?: number; sortOrder?: number }): Promise<CategoryResponse> {
    return apiClient.put<CategoryResponse>(`/marketplace/categories/${id}`, data);
  },
  async toggleActive(id: number): Promise<void> {
    await apiClient.put<void>(`/marketplace/categories/${id}/toggle`, {});
  },
};

export const wishlistService = {
  async getMyWishlist(): Promise<WishlistResponse[]> {
    return apiClient.get<WishlistResponse[]>("/marketplace/wishlist");
  },
  async add(listingId: number): Promise<WishlistResponse> {
    return apiClient.post<WishlistResponse>(`/marketplace/wishlist/${listingId}`, {});
  },
  async remove(listingId: number): Promise<void> {
    await apiClient.delete<void>(`/marketplace/wishlist/${listingId}`);
  },
  async check(listingId: number): Promise<{ wishlisted: boolean }> {
    return apiClient.get<{ wishlisted: boolean }>(`/marketplace/wishlist/${listingId}/check`);
  },
};

export const reviewService = {
  async getListingReviews(listingId: number, page = 0, size = 10): Promise<PaginatedResponse<ReviewResponse>> {
    return apiClient.get<PaginatedResponse<ReviewResponse>>(`/marketplace/reviews/listing/${listingId}?page=${page}&size=${size}`);
  },
  async create(data: ReviewRequest): Promise<ReviewResponse> {
    return apiClient.post<ReviewResponse>("/marketplace/reviews", data);
  },
  async addSellerReply(reviewId: number, reply: string): Promise<ReviewResponse> {
    return apiClient.put<ReviewResponse>(`/marketplace/reviews/${reviewId}/reply?reply=${encodeURIComponent(reply)}`, {});
  },
  async getListingStats(listingId: number): Promise<ReviewStats> {
    return apiClient.get<ReviewStats>(`/marketplace/reviews/listing/${listingId}/stats`);
  },
  async getSellerRating(sellerId: number): Promise<number> {
    return apiClient.get<number>(`/marketplace/reviews/seller/${sellerId}/rating`);
  },
};

export const orderService = {
  async getMyOrders(page = 0, size = 10): Promise<PaginatedResponse<OrderResponse>> {
    return apiClient.get<PaginatedResponse<OrderResponse>>(`/marketplace/orders/mine?page=${page}&size=${size}`);
  },
  async getSellerOrders(page = 0, size = 10): Promise<PaginatedResponse<OrderResponse>> {
    return apiClient.get<PaginatedResponse<OrderResponse>>(`/marketplace/orders/selling?page=${page}&size=${size}`);
  },
  async getById(id: number): Promise<OrderResponse> {
    return apiClient.get<OrderResponse>(`/marketplace/orders/${id}`);
  },
  async create(data: OrderRequest): Promise<OrderResponse> {
    return apiClient.post<OrderResponse>("/marketplace/orders", data);
  },
  async updateStatus(id: number, status: string): Promise<OrderResponse> {
    return apiClient.put<OrderResponse>(`/marketplace/orders/${id}/status?status=${status}`, {});
  },
  async cancel(id: number): Promise<void> {
    await apiClient.put<void>(`/marketplace/orders/${id}/cancel`, {});
  },
};

export const donationService = {
  async getCommunityDonations(page = 0, size = 12): Promise<PaginatedResponse<DonationResponse>> {
    return apiClient.get<PaginatedResponse<DonationResponse>>(`/marketplace/donations?page=${page}&size=${size}`);
  },
  async getMyDonations(): Promise<DonationResponse[]> {
    return apiClient.get<DonationResponse[]>("/marketplace/donations/mine");
  },
  async create(data: DonationRequest): Promise<DonationResponse> {
    return apiClient.post<DonationResponse>("/marketplace/donations", data);
  },
  async claim(id: number): Promise<DonationResponse> {
    return apiClient.put<DonationResponse>(`/marketplace/donations/${id}/claim`, {});
  },
  async deleteDonation(id: number): Promise<void> {
    await apiClient.delete<void>(`/marketplace/donations/${id}`);
  },
};

export const lostAndFoundService = {
  async getPosts(type?: string, page = 0, size = 12): Promise<PaginatedResponse<LostAndFoundResponse>> {
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    params.set("page", String(page));
    params.set("size", String(size));
    return apiClient.get<PaginatedResponse<LostAndFoundResponse>>(`/marketplace/lost-found?${params.toString()}`);
  },
  async getMyPosts(): Promise<LostAndFoundResponse[]> {
    return apiClient.get<LostAndFoundResponse[]>("/marketplace/lost-found/mine");
  },
  async create(data: LostAndFoundRequest): Promise<LostAndFoundResponse> {
    return apiClient.post<LostAndFoundResponse>("/marketplace/lost-found", data);
  },
  async resolve(id: number): Promise<LostAndFoundResponse> {
    return apiClient.put<LostAndFoundResponse>(`/marketplace/lost-found/${id}/resolve`, {});
  },
  async close(id: number): Promise<void> {
    await apiClient.delete<void>(`/marketplace/lost-found/${id}`);
  },
};
