import { apiClient } from "../common/apiClient";

export interface CouponDto {
  id: number;
  couponCode: string;
  title: string;
  description?: string;
  couponType: string;
  value: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  vendorUserId?: number;
  vendorName?: string;
  category?: string;
  channel?: string;
  maxUses?: number;
  usedCount: number;
  maxUsesPerUser?: number;
  validFrom: string;
  validTo: string;
  active: boolean;
  createdAt?: string;
}

export interface CouponRequest {
  couponCode: string;
  title: string;
  description?: string;
  couponType: "PERCENT" | "FLAT" | "FREE_DELIVERY";
  value: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  vendorUserId?: number;
  category?: string;
  channel?: string;
  maxUses?: number;
  maxUsesPerUser?: number;
  validFrom: string;
  validTo: string;
  active?: boolean;
}

export interface CouponApplyResult {
  valid: boolean;
  message: string;
  discountAmount?: number;
  finalAmount?: number;
  couponCode?: string;
  couponType?: string;
}

export const commerceCouponService = {
  getAdminCoupons(): Promise<CouponDto[]> {
    return apiClient.get<CouponDto[]>("/v1/commerce/coupons/admin");
  },
  createCoupon(req: CouponRequest): Promise<CouponDto> {
    return apiClient.post<CouponDto>("/v1/commerce/coupons/admin", req);
  },
  updateCoupon(id: number, req: Partial<CouponRequest>): Promise<CouponDto> {
    return apiClient.put<CouponDto>(`/v1/commerce/coupons/admin/${id}`, req);
  },
  deleteCoupon(id: number): Promise<void> {
    return apiClient.delete<void>(`/v1/commerce/coupons/admin/${id}`);
  },
  validateCoupon(couponCode: string, orderAmount: number): Promise<CouponApplyResult> {
    return apiClient.post<CouponApplyResult>("/v1/commerce/coupons/validate", { couponCode, orderAmount });
  },
};
