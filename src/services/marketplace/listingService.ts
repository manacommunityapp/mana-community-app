import { apiClient } from "../common/apiClient";
import type { PaginatedResponse } from "../../types/api";

/**
 * Mapped to Database Table: `marketplace_listings`
 * Java Entity: `com.mana.community.marketplace.entity.MarketListing`
 */
export interface ListingResponse {
  id: number;
  title: string;
  description: string;
  price: number;
  priceUnit: string;
  category: string;
  condition?: "NEW" | "LIKE_NEW" | "GOOD" | "FAIR";
  warranty?: string;
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
export type MarketListingResponse = ListingResponse;

/**
 * Mapped to Java DTO: `com.mana.community.marketplace.dto.request.MarketListingRequest`
 */
export interface ListingRequest {
  title: string;
  description?: string;
  price: number;
  priceUnit?: string;
  category: string;
  condition?: "NEW" | "LIKE_NEW" | "GOOD" | "FAIR";
  warranty?: string;
  transactionMode?: string;
  visibility?: string;
  location?: string;
  imageUrls?: string[];
}
export type MarketListingRequest = ListingRequest;

/**
 * Mapped to Database Table: `marketplace_listing_categories`
 * Java Entity: `com.mana.community.marketplace.entity.MarketListingCategory`
 */
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
export type MarketCategoryResponse = CategoryResponse;

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
  deliveryMethod?: string;
  paymentMode?: string;
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
  deliveryMethod?: string;
  paymentMode?: string;
  paymentStatus?: "PAID" | "PENDING" | "REFUNDED";
  pickupOtp?: string; // 4-digit security handover OTP
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

export interface OfferRequest {
  listingId: number;
  offerPrice: number;
  note?: string;
}

export interface OfferResponse {
  id: number;
  listingId: number;
  listingTitle: string;
  originalPrice: number;
  offerPrice: number;
  buyer: { id: number; fullName: string; verified?: boolean };
  sellerId: number;
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "COUNTERED";
  counterPrice?: number;
  note?: string;
  createdAt: string;
}

export interface ReportedListingResponse {
  id: number;
  listingId: number;
  listingTitle: string;
  sellerName: string;
  category: string;
  price: number;
  reason: string;
  details?: string;
  reportedBy: string;
  createdAt: string;
  status: "PENDING_REVIEW" | "DISMISSED" | "ACTION_TAKEN";
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

export const offerService = {
  async submitOffer(data: OfferRequest): Promise<OfferResponse> {
    return apiClient.post<OfferResponse>("/marketplace/offers", data);
  },
  async getOffersForMyListings(): Promise<OfferResponse[]> {
    return apiClient.get<OfferResponse[]>("/marketplace/offers/received");
  },
  async getMySentOffers(): Promise<OfferResponse[]> {
    return apiClient.get<OfferResponse[]>("/marketplace/offers/sent");
  },
  async respondToOffer(offerId: number, status: "ACCEPTED" | "DECLINED", counterPrice?: number): Promise<OfferResponse> {
    return apiClient.put<OfferResponse>(`/marketplace/offers/${offerId}/respond`, { status, counterPrice });
  },
};

export const moderationService = {
  async reportListing(listingId: number, reason: string, details?: string): Promise<void> {
    await apiClient.post<void>("/marketplace/moderation/report", { listingId, reason, details });
  },
  async getReportedListings(): Promise<ReportedListingResponse[]> {
    return apiClient.get<ReportedListingResponse[]>("/marketplace/moderation/reports");
  },
  async dismissReport(reportId: number): Promise<void> {
    await apiClient.put<void>(`/marketplace/moderation/reports/${reportId}/dismiss`, {});
  },
  async takeAction(reportId: number, action: "REMOVE_LISTING" | "BAN_USER"): Promise<void> {
    await apiClient.put<void>(`/marketplace/moderation/reports/${reportId}/action?action=${action}`, {});
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
  async verifyOtp(orderId: number, otp: string): Promise<OrderResponse> {
    return apiClient.post<OrderResponse>(`/marketplace/orders/${orderId}/verify-otp?otp=${otp}`, {});
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

export interface ProductRequestItem {
  id: number;
  title: string;
  category: string;
  description: string;
  budget: number;
  neededBy: string;
  requester: { id: number; fullName: string; tower: string; verified: boolean };
  status: "OPEN" | "RESPONDED" | "NEGOTIATING" | "FULFILLED" | "EXPIRED" | "CANCELLED";
  responsesCount: number;
  responses?: {
    id: number;
    seller: { id: number; fullName: string; verified: boolean };
    offeredPrice: number;
    message: string;
    createdAt: string;
  }[];
  createdAt: string;
}

export interface GroupOrderTier {
  minQuantity: number;
  discountedPrice: number;
}

export interface GroupOrderItem {
  id: number;
  title: string;
  category: string;
  description: string;
  imageUrl: string;
  regularPrice: number;
  tiers: GroupOrderTier[];
  currentQuantity: number;
  targetQuantity: number;
  closesAt: string;
  supplierName: string;
  status: "OPEN" | "MINIMUM_REACHED" | "CLOSED" | "ORDERED" | "FULFILLED" | "CANCELLED";
  participantsCount: number;
}

export interface CouponItem {
  code: string;
  discountType: "PERCENTAGE" | "FIXED" | "FREE_DELIVERY";
  discountValue: number;
  minOrderAmount: number;
  maxDiscount?: number;
  validUntil: string;
  description: string;
}

export interface DisputeItem {
  id: number;
  orderNumber: string;
  orderId: number;
  complainant: { id: number; fullName: string; tower: string };
  respondent: { id: number; fullName: string };
  reason: "ITEM_NOT_RECEIVED" | "WRONG_ITEM" | "DAMAGED_ITEM" | "PAYMENT_ISSUE" | "SELLER_NO_SHOW" | "BUYER_NO_SHOW" | "SERVICE_NOT_COMPLETED" | "RENTAL_DAMAGE" | "DEPOSIT_DISPUTE" | "OTHER";
  description: string;
  evidenceUrls?: string[];
  claimAmount: number;
  refundAmount?: number;
  status: "OPEN" | "UNDER_REVIEW" | "RESOLVED_REFUNDED" | "RESOLVED_DISMISSED" | "CLOSED";
  adminNotes?: string;
  createdAt: string;
}

export interface MarketplaceAuditLog {
  id: number;
  actorName: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string | number;
  details: string;
  timestamp: string;
}

export interface SellerAnalytics {
  activeListings: number;
  offersReceived: number;
  ordersCount: number;
  completedTransactions: number;
  totalRevenue: number;
  viewsCount: number;
  wishlistSaves: number;
  averageRating: number;
  responseRatePercent: number;
}

export const requestService = {
  async getRequests(): Promise<ProductRequestItem[]> {
    return apiClient.get<ProductRequestItem[]>("/marketplace/requests");
  },
  async createRequest(data: { title: string; category: string; description: string; budget: number; neededBy: string }): Promise<ProductRequestItem> {
    return apiClient.post<ProductRequestItem>("/marketplace/requests", data);
  },
  async submitOffer(requestId: number, data: { offeredPrice: number; message: string }): Promise<void> {
    await apiClient.post<void>(`/marketplace/requests/${requestId}/offers`, data);
  },
  async fulfillRequest(requestId: number): Promise<void> {
    await apiClient.put<void>(`/marketplace/requests/${requestId}/fulfill`, {});
  },
};

export const groupOrderService = {
  async getGroupOrders(): Promise<GroupOrderItem[]> {
    return apiClient.get<GroupOrderItem[]>("/marketplace/group-orders");
  },
  async joinGroupOrder(groupOrderId: number, quantity: number): Promise<{ success: boolean; message: string }> {
    return apiClient.post<{ success: boolean; message: string }>(`/marketplace/group-orders/${groupOrderId}/join`, { quantity });
  },
};

export const couponService = {
  async validateCoupon(code: string, orderSubtotal: number): Promise<{ valid: boolean; coupon?: CouponItem; discount: number; message?: string }> {
    return apiClient.post<{ valid: boolean; coupon?: CouponItem; discount: number; message?: string }>("/marketplace/coupons/validate", { code, orderSubtotal });
  },
};

export const disputeService = {
  async getDisputes(): Promise<DisputeItem[]> {
    return apiClient.get<DisputeItem[]>("/marketplace/disputes");
  },
  async createDispute(data: { orderId: number; orderNumber: string; reason: string; description: string; claimAmount: number; evidenceUrls?: string[] }): Promise<DisputeItem> {
    return apiClient.post<DisputeItem>("/marketplace/disputes", data);
  },
  async resolveDispute(disputeId: number, status: string, refundAmount?: number, adminNotes?: string): Promise<void> {
    await apiClient.put<void>(`/marketplace/disputes/${disputeId}/resolve`, { status, refundAmount, adminNotes });
  },
};

export const adminMarketplaceService = {
  async getAuditLogs(): Promise<MarketplaceAuditLog[]> {
    return apiClient.get<MarketplaceAuditLog[]>("/marketplace/admin/audit-logs");
  },
  async getMetrics(): Promise<{ totalGMV: number; activeListings: number; activeOrders: number; pendingDisputes: number; completedOrders: number }> {
    return apiClient.get<{ totalGMV: number; activeListings: number; activeOrders: number; pendingDisputes: number; completedOrders: number }>("/marketplace/admin/metrics");
  },
};

export const privacyService = {
  async requestDataDeletion(reason: string): Promise<{ success: boolean; requestId: number; message: string }> {
    return apiClient.post<{ success: boolean; requestId: number; message: string }>("/marketplace/privacy/deletion-request", { reason });
  },
};

// ── Market* Prefixed Service Aliases (matching Backend Java Service Naming) ──
export const MarketListingService = listingService;
export const MarketOfferService = offerService;
export const MarketModerationService = moderationService;
export const MarketCategoryService = categoryService;
export const MarketWishlistService = wishlistService;
export const MarketReviewService = reviewService;
export const MarketOrderService = orderService;
export const MarketDonationService = donationService;
export const MarketLostAndFoundService = lostAndFoundService;
export const MarketRequestService = requestService;
export const MarketGroupOrderService = groupOrderService;
export const MarketCouponService = couponService;
export const MarketDisputeService = disputeService;
export const MarketAdminService = adminMarketplaceService;
export const MarketPrivacyService = privacyService;
