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

const SAMPLE_PRODUCTS: VendorProductDto[] = [
  {
    id: 'vp-1',
    vendorId: 'v1',
    productName: 'Aashirvaad Shudh Chakki Atta',
    brand: 'ITC Aashirvaad',
    category: 'Grocery',
    subCategory: 'Atta & Flour',
    description: '100% pure whole wheat flour processed with traditional chakki process.',
    images: ['https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500'],
    hsnCode: '11010000',
    taxRatePercent: 0,
    status: 'ACTIVE',
    variants: [
      { id: 'vpv-1', variantName: '5 KG Pack', sku: 'AASH-ATTA-5KG', packSize: '5 KG', unitOfMeasure: 'KG', mrp: 350, costPrice: 280, communityPrice: 310, availableStock: 180, reservedStock: 35, committedStock: 65, status: 'ACTIVE' },
      { id: 'vpv-2', variantName: '10 KG Bulk Bag', sku: 'AASH-ATTA-10KG', packSize: '10 KG', unitOfMeasure: 'KG', mrp: 680, costPrice: 530, communityPrice: 585, availableStock: 320, reservedStock: 50, committedStock: 120, status: 'ACTIVE' },
    ],
  },
  {
    id: 'vp-2',
    vendorId: 'v1',
    productName: 'Fortune Sunlite Refined Sunflower Oil',
    brand: 'Fortune',
    category: 'Grocery',
    subCategory: 'Edible Oils',
    description: 'Light, healthy cooking oil enriched with Vitamins A & D.',
    images: ['https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500'],
    hsnCode: '15121910',
    taxRatePercent: 5,
    status: 'ACTIVE',
    variants: [
      { id: 'vpv-3', variantName: '1 Litre Pouch', sku: 'FORT-OIL-1L', packSize: '1 L', unitOfMeasure: 'L', mrp: 165, costPrice: 132, communityPrice: 145, availableStock: 450, reservedStock: 80, committedStock: 150, status: 'ACTIVE' },
      { id: 'vpv-4', variantName: '5 Litre Jar', sku: 'FORT-OIL-5L', packSize: '5 L', unitOfMeasure: 'L', mrp: 750, costPrice: 590, communityPrice: 649, availableStock: 95, reservedStock: 20, committedStock: 45, status: 'ACTIVE' },
    ],
  },
  {
    id: 'vp-3',
    vendorId: 'v1',
    productName: 'Ratnagiri GI Alphonso Mangoes (Export Grade)',
    brand: 'Konkan Farms Direct',
    category: 'Fresh Produce',
    subCategory: 'Fruits',
    description: 'Naturally ripened, chemical-free GI tagged Ratnagiri Alphonso mangoes.',
    images: ['https://images.unsplash.com/photo-1553279768-865429fa0078?w=500'],
    hsnCode: '08045020',
    taxRatePercent: 0,
    status: 'ACTIVE',
    variants: [
      { id: 'vpv-5', variantName: 'Box of 1 Dozen (3.5 KG)', sku: 'ALPH-BOX-12', packSize: '12 pcs', unitOfMeasure: 'BOX', mrp: 1300, costPrice: 850, communityPrice: 1050, availableStock: 60, reservedStock: 25, committedStock: 35, status: 'ACTIVE' },
    ],
  },
];

const SAMPLE_BATCHES: InventoryBatchDto[] = [
  { id: 'b1', batchNumber: 'BAT-2026-ATT-09', variantId: 'vpv-2', variantName: '10 KG Bulk Bag', productName: 'Aashirvaad Shudh Chakki Atta', mfgDate: '2026-09-15', expiryDate: '2026-12-15', initialQuantity: 500, remainingQuantity: 320, unitCost: 530, status: 'ACTIVE' },
  { id: 'b2', batchNumber: 'BAT-2026-OIL-08', variantId: 'vpv-4', variantName: '5 Litre Jar', productName: 'Fortune Sunlite Refined Sunflower Oil', mfgDate: '2026-08-01', expiryDate: '2027-02-01', initialQuantity: 200, remainingQuantity: 95, unitCost: 590, status: 'ACTIVE' },
  { id: 'b3', batchNumber: 'BAT-2026-MNG-10', variantId: 'vpv-5', variantName: 'Box of 1 Dozen (3.5 KG)', productName: 'Ratnagiri GI Alphonso Mangoes', mfgDate: '2026-10-01', expiryDate: '2026-10-10', initialQuantity: 120, remainingQuantity: 60, unitCost: 850, status: 'EXPIRING_SOON' },
];

export const vendorCommerceService = {
  async getProducts(): Promise<VendorProductDto[]> {
    try {
      return await apiClient.get<VendorProductDto[]>('/vendor/commerce/products');
    } catch {
      return SAMPLE_PRODUCTS;
    }
  },

  async createProduct(data: CreateProductRequest): Promise<VendorProductDto> {
    try {
      return await apiClient.post<VendorProductDto>('/vendor/commerce/products', data);
    } catch {
      const newProd: VendorProductDto = {
        id: 'vp-' + Date.now(),
        vendorId: 'v1',
        ...data,
        status: 'ACTIVE',
        variants: data.variants.map((v, i) => ({
          ...v,
          id: 'vpv-' + Date.now() + '-' + i,
          availableStock: 100,
          reservedStock: 0,
          committedStock: 0,
          status: 'ACTIVE',
        })),
        createdAt: new Date().toISOString(),
      };
      SAMPLE_PRODUCTS.push(newProd);
      return newProd;
    }
  },

  async getBatches(): Promise<InventoryBatchDto[]> {
    try {
      return await apiClient.get<InventoryBatchDto[]>('/vendor/commerce/inventory/batches');
    } catch {
      return SAMPLE_BATCHES;
    }
  },

  async getStats(): Promise<VendorCommerceStats> {
    try {
      return await apiClient.get<VendorCommerceStats>('/vendor/commerce/stats');
    } catch {
      return {
        totalProducts: SAMPLE_PRODUCTS.length,
        activeProducts: SAMPLE_PRODUCTS.filter(p => p.status === 'ACTIVE').length,
        totalVariants: SAMPLE_PRODUCTS.reduce((acc, p) => acc + p.variants.length, 0),
        totalAvailableStock: 655,
        totalReservedStock: 135,
        totalCommittedStock: 265,
        lowStockCount: 1,
        expiringBatchesCount: 1,
        activeGroupDealsCount: 4,
        monthlyCommerceRevenue: 284500,
      };
    }
  },
};
