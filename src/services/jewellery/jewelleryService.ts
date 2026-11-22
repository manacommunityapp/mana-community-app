import { apiClient } from "../common/apiClient";

export type JewelleryCategory =
  | "EARRINGS"
  | "NECKLACE"
  | "RING"
  | "BANGLE"
  | "BRACELET"
  | "PENDANT"
  | "NOSE_RING"
  | "MAANG_TIKKA"
  | "OTHER";

export type JewelleryMaterial = "GOLD" | "SILVER" | "DIAMOND" | "PLATINUM" | "ARTIFICIAL" | "GEMSTONE";

export interface JewelleryProduct {
  id: string;
  vendorId: string;
  vendorName: string;
  sku: string;
  name: string;
  category: JewelleryCategory;
  material: JewelleryMaterial;
  purity?: string;
  netWeightG?: number;
  description?: string;
  imageUrls: string[];
  tryOnAssetUrl?: string;
  goldRatePerGram?: number;
  makingCharges?: number;
  stoneCost?: number;
  totalPrice: number;
  gstPercent?: number;
  stockQuantity: number;
  status: "ACTIVE" | "OUT_OF_STOCK" | "ARCHIVED";
  isWishlisted?: boolean;
  tags?: string[];
  huid?: string;
}

export interface JewelleryVendor {
  id: string;
  shopName: string;
  ownerName: string;
  rating: number;
  reviewCount: number;
  specialties: string[];
  address: string;
  distance?: string;
  isVerified: boolean;
  phoneNumber?: string;
  imageUrl?: string;
  openNow?: boolean;
  openHours?: string;
  bisHallmarkLicense?: string;
}

export interface JewelleryAppointment {
  id: string;
  vendorId: string;
  vendorName: string;
  shopAddress: string;
  date: string;
  time: string;
  purpose: string;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
  notes?: string;
}

export interface TryOnUploadSlot {
  sessionId: string;
  presignedUploadUrl: string;
  httpMethod: string;
  s3Key: string;
  contentType: string;
  expiresAt: string;
}

export interface FitProfile {
  faceShape: "round" | "oval" | "square" | "heart" | "oblong" | "unknown";
  confidence: number;
}

export interface RecommendationItem {
  productId: number;
  name: string;
  price: number;
  score: number;
  reason: string;
}

export const jewelleryService = {
  async getProducts(params?: { category?: string; material?: string; vendorId?: string; search?: string }): Promise<JewelleryProduct[]> {
    try {
      const res = await apiClient.get<JewelleryProduct[]>("/jewellery/products", { params });
      return Array.isArray(res) ? res : [];
    } catch {
      return [];
    }
  },

  async getProductById(id: string): Promise<JewelleryProduct | null> {
    try {
      return await apiClient.get<JewelleryProduct>(`/jewellery/products/${id}`);
    } catch {
      return null;
    }
  },

  async getNearbyVendors(): Promise<JewelleryVendor[]> {
    try {
      const res = await apiClient.get<JewelleryVendor[]>("/jewellery/vendors/nearby");
      return Array.isArray(res) ? res : [];
    } catch {
      return [];
    }
  },

  async getVendorById(vendorId: string): Promise<JewelleryVendor | null> {
    try {
      return await apiClient.get<JewelleryVendor>(`/jewellery/vendors/${vendorId}`);
    } catch {
      return null;
    }
  },

  async getVendorProducts(vendorId: string): Promise<JewelleryProduct[]> {
    try {
      const res = await apiClient.get<JewelleryProduct[]>(`/jewellery/vendors/${vendorId}/products`);
      return Array.isArray(res) ? res : [];
    } catch {
      return [];
    }
  },

  async getAvailableSlots(vendorId: string, date: string): Promise<string[]> {
    try {
      const res = await apiClient.get<string[]>(`/jewellery/vendors/${vendorId}/available-slots`, { params: { date } });
      return Array.isArray(res) ? res : [];
    } catch {
      return [];
    }
  },

  async bookAppointment(req: { vendorId: string; date: string; time: string; purpose: string; notes?: string }): Promise<JewelleryAppointment> {
    return await apiClient.post<JewelleryAppointment>("/jewellery/appointments", req);
  },

  async getMyAppointments(): Promise<JewelleryAppointment[]> {
    try {
      const res = await apiClient.get<JewelleryAppointment[]>("/jewellery/appointments");
      return Array.isArray(res) ? res : [];
    } catch {
      return [];
    }
  },

  async cancelAppointment(appointmentId: string, reason?: string): Promise<void> {
    await apiClient.patch(`/jewellery/appointments/${appointmentId}/cancel`, { reason });
  },

  async requestPhotoUploadUrl(): Promise<TryOnUploadSlot> {
    return await apiClient.post<TryOnUploadSlot>("/jewellery/try-on/uploads");
  },

  async startTryOnSession(req: { productId: string; mode: string; platform: string }): Promise<{ id: string }> {
    return await apiClient.post<{ id: string }>("/jewellery/try-on/sessions", req);
  },

  async submitPhotoJob(sessionId: string, sourceS3Key: string): Promise<{ id: string; status: string }> {
    return await apiClient.post<{ id: string; status: string }>(`/jewellery/try-on/sessions/${sessionId}/photo-jobs`, { sourceS3Key });
  },

  async getPhotoJobStatus(jobId: string): Promise<{ id: string; status: string; outputUrl?: string }> {
    return await apiClient.get<{ id: string; status: string; outputUrl?: string }>(`/jewellery/try-on/photo-jobs/${jobId}`);
  },

  async getWishlist(): Promise<any[]> {
    try {
      const res = await apiClient.get<any[]>("/jewellery/wishlist");
      return Array.isArray(res) ? res : [];
    } catch {
      return [];
    }
  },

  async addToWishlist(productId: string): Promise<void> {
    await apiClient.post(`/jewellery/wishlist/${productId}`);
  },

  async removeFromWishlist(productId: string): Promise<void> {
    await apiClient.delete(`/jewellery/wishlist/${productId}`);
  },

  async getFitProfile(): Promise<FitProfile | null> {
    try {
      return await apiClient.get<FitProfile>("/jewellery/fit-profile");
    } catch {
      return null;
    }
  },

  async getRecommendations(category = "EARRINGS", limit = 6): Promise<RecommendationItem[]> {
    try {
      const res = await apiClient.get<RecommendationItem[]>("/jewellery/recommendations", { params: { category, limit } });
      return Array.isArray(res) ? res : [];
    } catch {
      return [];
    }
  },

  async deleteFitProfile(): Promise<void> {
    await apiClient.delete("/jewellery/fit-profile");
  },
};
