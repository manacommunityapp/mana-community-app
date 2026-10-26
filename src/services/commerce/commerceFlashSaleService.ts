import { apiClient } from "../common/apiClient";

export interface FlashSaleItemDto {
  id: number;
  productId: number;
  productTitle: string;
  productSku: string;
  thumbnailUrl?: string;
  originalPrice: number;
  flashPrice: number;
  quantityLimit?: number;
  quantitySold: number;
}

export interface CommerceFlashSaleDto {
  id: number;
  title: string;
  description?: string;
  startsAt: string;
  endsAt: string;
  discountType: "PERCENT" | "FLAT";
  discountValue: number;
  maxQuantity?: number;
  status: "SCHEDULED" | "ACTIVE" | "ENDED" | "CANCELLED";
  items: FlashSaleItemDto[];
  active: boolean;
}

export interface FlashSaleRequest {
  title: string;
  description?: string;
  startsAt: string;  // ISO datetime
  endsAt: string;
  discountType?: "PERCENT" | "FLAT";
  discountValue: number;
  maxQuantity?: number;
  productIds?: number[];
}

export const commerceFlashSaleService = {
  getActive(): Promise<CommerceFlashSaleDto[]> {
    return apiClient.get<CommerceFlashSaleDto[]>("/commerce/flash-sales/active");
  },

  getAll(): Promise<CommerceFlashSaleDto[]> {
    return apiClient.get<CommerceFlashSaleDto[]>("/commerce/flash-sales");
  },

  create(req: FlashSaleRequest): Promise<CommerceFlashSaleDto> {
    return apiClient.post<CommerceFlashSaleDto>("/commerce/flash-sales", req);
  },

  cancel(saleId: number): Promise<CommerceFlashSaleDto> {
    return apiClient.post<CommerceFlashSaleDto>(`/commerce/flash-sales/${saleId}/cancel`);
  },
};
