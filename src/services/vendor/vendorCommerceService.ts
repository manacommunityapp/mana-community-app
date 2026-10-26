import { apiClient } from '../common/apiClient';

export interface VendorProductVariantDto {
  id?: string;
  variantName: string;
  sku: string;
  barcode?: string;
  packSize: string;
  unitOfMeasure: string;
  mrp: number;
  costPrice: number;
  communityPrice: number;
  availableStock?: number;
  reservedStock?: number;
  committedStock?: number;
  status?: string;
}

export interface VendorProductDto {
  id: string;
  vendorId: string;
  productName: string;
  brand: string;
  category: string;
  subCategory?: string;
  description: string;
  images: string[];
  hsnCode?: string;
  taxRatePercent?: number;
  status: string;
  variants: VendorProductVariantDto[];
  createdAt?: string;
}

export interface CreateProductRequest {
  productName: string;
  productType?: string;
  foodGroceryStoreId?: number;
  foodGroceryCategoryId?: number;
  brand: string;
  category: string;
  subCategory?: string;
  description: string;
  images: string[];
  hsnCode?: string;
  taxRatePercent?: number;
  variants: VendorProductVariantDto[];
}

export interface InventoryBatchDto {
  id: string;
  batchNumber: string;
  variantId: string;
  variantName?: string;
  productName?: string;
  mfgDate: string;
  expiryDate: string;
  initialQuantity: number;
  remainingQuantity: number;
  unitCost: number;
  status: string;
}

export interface VendorCommerceStats {
  totalProducts: number;
  activeProducts: number;
  totalVariants: number;
  totalAvailableStock: number;
  totalReservedStock: number;
  totalCommittedStock: number;
  lowStockCount: number;
  expiringBatchesCount: number;
  activeGroupDealsCount: number;
  monthlyCommerceRevenue: number;
}

export const vendorCommerceService = {
  async getGroceryStores(): Promise<{ id: number; name: string }[]> {
    return await apiClient.get<{ id: number; name: string }[]>('/vendor/commerce/grocery-stores');
  },

  async getGroceryCategories(storeId: number): Promise<{ id: number; name: string }[]> {
    return await apiClient.get<{ id: number; name: string }[]>(`/vendor/commerce/grocery-stores/${storeId}/categories`);
  },

  async getProducts(): Promise<VendorProductDto[]> {
    return await apiClient.get<VendorProductDto[]>('/vendor/commerce/products');
  },

  async createProduct(data: CreateProductRequest): Promise<VendorProductDto> {
    return await apiClient.post<VendorProductDto>('/vendor/commerce/products', data);
  },

  async getBatches(): Promise<InventoryBatchDto[]> {
    return await apiClient.get<InventoryBatchDto[]>('/vendor/commerce/inventory/batches');
  },

  async getStats(): Promise<VendorCommerceStats> {
    const res = await apiClient.get<any>('/vendor/commerce/stats');
    return {
      totalProducts: res.totalProducts ?? 0,
      activeProducts: res.activeProducts ?? 0,
      totalVariants: res.totalVariants ?? 0,
      totalAvailableStock: res.totalAvailableStock ?? res.totalInventoryUnits ?? 0,
      totalReservedStock: res.totalReservedStock ?? res.reservedUnits ?? 0,
      totalCommittedStock: res.totalCommittedStock ?? res.committedUnits ?? 0,
      lowStockCount: res.lowStockCount ?? res.outOfStockProducts ?? 0,
      expiringBatchesCount: res.expiringBatchesCount ?? 0,
      activeGroupDealsCount: res.activeGroupDealsCount ?? 0,
      monthlyCommerceRevenue: res.monthlyCommerceRevenue ?? 0,
    };
  },
};
