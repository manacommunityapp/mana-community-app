import { apiClient } from "../common/apiClient";

export interface Product {
  id?: number;
  name: string;
  defaultCode?: string; // SKU
  barcode?: string;
  listPrice?: number;
  standardPrice?: number;
  type?: "STORABLE" | "CONSUMABLE" | "SERVICE";
  tracking?: "NONE" | "LOT" | "SERIAL";
  categId?: number;
  qtyAvailable?: number;
}

export interface Lot {
  id?: number;
  name: string;
  productId: number;
  productName?: string;
  expirationDate?: string;
  notes?: string;
  createdAt?: string;
}

export interface ScrapRecord {
  id?: number;
  productId: number;
  productName?: string;
  lotId?: number;
  lotName?: string;
  sourceLocationName?: string;
  scrapLocationName?: string;
  quantity: number;
  reason?: string;
  state: "DRAFT" | "DONE";
  scrappedByName?: string;
  scrappedAt?: string;
  createdAt?: string;
}

export interface Warehouse {
  id?: number;
  name: string;
  code: string;
  partnerId?: number;
  lotStockId?: number;
  receptionSteps?: "ONE_STEP" | "TWO_STEPS" | "THREE_STEPS";
  deliverySteps?: "ONE_STEP" | "TWO_STEPS" | "THREE_STEPS";
}

export interface Location {
  id?: number;
  completeName: string;
  usage: "VIEW" | "INTERNAL" | "CUSTOMER" | "VENDOR" | "INVENTORY" | "PRODUCTION" | "TRANSIT" | "SCRAP";
  barcode?: string;
  warehouseId?: number;
}

export interface PickingTypeStats {
  id: number;
  name: string;
  code: "INCOMING" | "OUTGOING" | "INTERNAL";
  warehouseId: number;
  toProcessCount: number;
  lateCount: number;
  backorderCount: number;
}

export interface PickingLine {
  id?: number;
  productId: number;
  productName?: string;
  productQty: number; // Demand
  qtyDone: number; // Done
}

export interface Picking {
  id?: number;
  name?: string;
  state?: "DRAFT" | "WAITING" | "CONFIRMED" | "ASSIGNED" | "DONE" | "CANCEL";
  partnerId?: number;
  pickingTypeId: number;
  locationId: number;
  locationDestId: number;
  scheduledDate?: string;
  origin?: string;
  moveLines?: PickingLine[];
}

export interface StockLevelReport {
  productId: number;
  productName: string;
  defaultCode?: string;
  onHand: number;
  reserved: number;
  available: number;
  locationName: string;
}

export interface MoveHistoryReport {
  moveLineId: number;
  date: string;
  reference: string;
  productName: string;
  lotName?: string;
  sourceLocation: string;
  destLocation: string;
  qtyDone: number;
}

export interface StockLedgerReport {
  id: number;
  productId: number;
  productName: string;
  sku?: string;
  locationId: number;
  locationName: string;
  lotName?: string;
  movementType?: string;
  referenceType?: string;
  referenceId?: string;
  quantityChange: number;
  resultingBalance: number;
  unitCost: number;
  totalValue: number;
  createdAt: string;
}

export interface InventoryValuationReport {
  productId: number;
  productName: string;
  defaultCode?: string;
  categoryName: string;
  warehouseId?: number;
  warehouseName: string;
  locationId: number;
  locationName: string;
  quantityOnHand: number;
  unitCost: number;
  totalValuation: number;
}

export interface StockAgingReport {
  productId: number;
  productName: string;
  defaultCode?: string;
  locationName: string;
  quantityOnHand: number;
  ageDays: number;
  agingBucket: string;
  unitCost: number;
  totalValue: number;
  lastMovementDate: string;
}

export interface FefoRecommendation {
  lotId: number;
  lotName: string;
  productId: number;
  productName: string;
  defaultCode?: string;
  locationName: string;
  availableQuantity: number;
  expirationDate: string;
  daysUntilExpiry: number;
  urgency: "CRITICAL" | "HIGH" | "NORMAL";
}

export interface ReorderAlert {
  productId: number;
  productName: string;
  defaultCode?: string;
  currentOnHand: number;
  safetyStock: number;
  reorderQuantity: number;
  deficit: number;
}

export const stockService = {
  // Products Catalog
  async getProducts(): Promise<Product[]> {
    return apiClient.get<Product[]>("/inventory/products");
  },

  async getProduct(id: number): Promise<Product> {
    return apiClient.get<Product>(`/inventory/products/${id}`);
  },

  async createProduct(product: Product): Promise<Product> {
    return apiClient.post<Product>("/inventory/products", product);
  },

  async updateProduct(id: number, product: Product): Promise<Product> {
    return apiClient.put<Product>(`/inventory/products/${id}`, product);
  },

  async deleteProduct(id: number): Promise<void> {
    return apiClient.delete<void>(`/inventory/products/${id}`);
  },

  // Warehouses
  async getWarehouses(): Promise<Warehouse[]> {
    return apiClient.get<Warehouse[]>("/inventory/warehouses");
  },

  async getWarehouse(id: number): Promise<Warehouse> {
    return apiClient.get<Warehouse>(`/inventory/warehouses/${id}`);
  },

  async createWarehouse(warehouse: Warehouse): Promise<Warehouse> {
    return apiClient.post<Warehouse>("/inventory/warehouses", warehouse);
  },

  // Locations
  async getLocations(): Promise<Location[]> {
    return apiClient.get<Location[]>("/inventory/warehouses/locations");
  },

  async createLocation(location: Location): Promise<Location> {
    return apiClient.post<Location>("/inventory/warehouses/locations", location);
  },

  // Overview / Dashboard Stats
  async getPickingTypeStats(): Promise<PickingTypeStats[]> {
    return apiClient.get<PickingTypeStats[]>("/inventory/warehouses/operation-types/stats");
  },

  // Pickings (Transfers)
  async getPickings(): Promise<Picking[]> {
    return apiClient.get<Picking[]>("/inventory/pickings");
  },

  async getPicking(id: number): Promise<Picking> {
    return apiClient.get<Picking>(`/inventory/pickings/${id}`);
  },

  async createPicking(picking: any): Promise<Picking> {
    return apiClient.post<Picking>("/inventory/pickings", picking);
  },

  async confirmPicking(id: number): Promise<Picking> {
    return apiClient.post<Picking>(`/inventory/pickings/${id}/confirm`);
  },

  async validatePicking(id: number, lines?: PickingLine[]): Promise<Picking> {
    return apiClient.post<Picking>(`/inventory/pickings/${id}/validate`, lines || null);
  },

  async scrapStock(params: { productId: number; locationId: number; lotId?: number; quantity: number; reason: string }): Promise<void> {
    await this.quickScrap({
      productId: params.productId,
      locationId: params.locationId,
      lotId: params.lotId,
      quantity: params.quantity,
      reason: params.reason
    });
  },

  // Lots & Serials
  async getLotsByProduct(productId: number): Promise<Lot[]> {
    return apiClient.get<Lot[]>(`/inventory/lots/product/${productId}`);
  },

  async getLot(id: number): Promise<Lot> {
    return apiClient.get<Lot>(`/inventory/lots/${id}`);
  },

  async createLot(lot: Omit<Lot, "id" | "productName" | "createdAt">): Promise<Lot> {
    return apiClient.post<Lot>("/inventory/lots", lot);
  },

  // Scrap Operations
  async getAllScraps(): Promise<ScrapRecord[]> {
    return apiClient.get<ScrapRecord[]>("/inventory/scrap");
  },

  async getScrapsByProduct(productId: number): Promise<ScrapRecord[]> {
    return apiClient.get<ScrapRecord[]>(`/inventory/scrap/product/${productId}`);
  },

  async createDraftScrap(scrap: { productId: number; lotId?: number; locationId: number; quantity: number; reason: string }): Promise<ScrapRecord> {
    return apiClient.post<ScrapRecord>("/inventory/scrap/draft", scrap);
  },

  async confirmScrap(id: number): Promise<ScrapRecord> {
    return apiClient.post<ScrapRecord>(`/inventory/scrap/${id}/confirm`);
  },

  async quickScrap(scrap: { productId: number; lotId?: number; locationId: number; quantity: number; reason: string }): Promise<ScrapRecord> {
    return apiClient.post<ScrapRecord>("/inventory/scrap", scrap);
  },

  // Reporting
  async getStockLevelReport(): Promise<StockLevelReport[]> {
    return apiClient.get<StockLevelReport[]>("/inventory/reporting/stock");
  },

  async getMoveHistoryReport(): Promise<MoveHistoryReport[]> {
    return apiClient.get<MoveHistoryReport[]>("/inventory/reporting/moves-history");
  },

  async getStockLedger(params?: { productId?: number; communityId?: number }): Promise<StockLedgerReport[]> {
    const query = new URLSearchParams();
    if (params?.productId) query.append("productId", String(params.productId));
    if (params?.communityId) query.append("communityId", String(params.communityId));
    const qs = query.toString();
    return apiClient.get<StockLedgerReport[]>(`/inventory/reporting/ledger${qs ? `?${qs}` : ""}`);
  },

  async getValuationReport(): Promise<InventoryValuationReport[]> {
    return apiClient.get<InventoryValuationReport[]>("/inventory/reporting/valuation");
  },

  async getStockAgingReport(): Promise<StockAgingReport[]> {
    return apiClient.get<StockAgingReport[]>("/inventory/reporting/stock-aging");
  },

  async getFefoRecommendations(): Promise<FefoRecommendation[]> {
    return apiClient.get<FefoRecommendation[]>("/inventory/reporting/fefo-recommendations");
  },

  async getReorderAlerts(): Promise<ReorderAlert[]> {
    return apiClient.get<ReorderAlert[]>("/inventory/reporting/reorder-alerts");
  }
};
