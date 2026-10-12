import { apiClient } from "../common/apiClient";

export type ProductType =
  | "PHYSICAL_PRODUCT"
  | "DIGITAL_PRODUCT"
  | "SERVICE"
  | "FOOD"
  | "BOOKING"
  | "SUBSCRIPTION";

export interface ProductVariantDto {
  id: string;
  variantName: string;
  sku: string;
  barcode?: string;
  packSize: string;
  mrp: number;
  vendorCost: number;
  defaultCommunityPrice: number;
  memberPrice?: number;
  bulkMinQty?: number;
  bulkPrice?: number;
  promotionalPrice?: number;
  promotionalEndDate?: string;
  festivalTag?: string;
  festivalPrice?: number;
  isActive: boolean;
  availableStock: number;
  reservedStock: number;
  committedStock: number;
}

export interface VendorProductDto {
  id: string;
  name: string;
  productType?: ProductType;
  category: string;
  subCategory?: string;
  commerceCategoryId?: number;
  commerceCategoryName?: string;
  brand?: string;
  description?: string;
  hsnCode?: string;
  gstRate?: number;
  status: string;
  imageUrl?: string;
  additionalImages?: string;
  communityOnly?: boolean;
  weightGrams?: number;
  dimensionsCm?: string;
  productCode?: string;
  tags?: string;
  variants: ProductVariantDto[];
  totalStock: number;
}

export interface CreateVariantRequest {
  variantName: string;
  sku: string;
  barcode?: string;
  packSize: string;
  mrp?: number;
  vendorCost?: number;
  defaultCommunityPrice?: number;
  memberPrice?: number;
  bulkMinQty?: number;
  bulkPrice?: number;
  promotionalPrice?: number;
  promotionalEndDate?: string;
  festivalTag?: string;
  festivalPrice?: number;
  initialStock?: number;
}

export interface CreateProductRequest {
  name: string;
  productType?: ProductType;
  category: string;
  subCategory?: string;
  commerceCategoryId?: number;
  brand?: string;
  description?: string;
  hsnCode?: string;
  gstRate?: number;
  imageUrl?: string;
  additionalImages?: string;
  communityOnly?: boolean;
  weightGrams?: number;
  dimensionsCm?: string;
  productCode?: string;
  tags?: string;
  variants: CreateVariantRequest[];
}

export interface CommerceProductCategoryResponse {
  id: number;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  parentId?: number;
  parentName?: string;
  active: boolean;
  displayOrder: number;
  children?: CommerceProductCategoryResponse[];
}

export const vendorProductService = {
  getMyProducts(): Promise<VendorProductDto[]> {
    return apiClient.get<VendorProductDto[]>("/v1/commerce/vendor/products");
  },

  createProduct(data: CreateProductRequest): Promise<VendorProductDto> {
    return apiClient.post<VendorProductDto>("/v1/commerce/vendor/products", data);
  },

  deactivateProduct(id: number): Promise<void> {
    return apiClient.patch<void>(`/v1/commerce/vendor/products/${id}/deactivate`);
  },

  activateProduct(id: number): Promise<void> {
    return apiClient.patch<void>(`/v1/commerce/vendor/products/${id}/activate`);
  },

  getCategories(): Promise<CommerceProductCategoryResponse[]> {
    return apiClient.get<CommerceProductCategoryResponse[]>("/v1/commerce/categories");
  },

  getAllCategories(): Promise<CommerceProductCategoryResponse[]> {
    return apiClient.get<CommerceProductCategoryResponse[]>("/v1/commerce/categories/all");
  },
};
