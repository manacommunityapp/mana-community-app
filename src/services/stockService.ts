import { apiClient } from "./apiClient";

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
    const url = `/inventory/pickings/scrap?productId=${params.productId}&locationId=${params.locationId}&quantity=${params.quantity}&reason=${encodeURIComponent(params.reason)}` + (params.lotId ? `&lotId=${params.lotId}` : "");
    return apiClient.post<void>(url);
  },

  // Reporting
  async getStockLevelReport(): Promise<StockLevelReport[]> {
    return apiClient.get<StockLevelReport[]>("/inventory/reporting/stock");
  },

  async getMoveHistoryReport(): Promise<MoveHistoryReport[]> {
    return apiClient.get<MoveHistoryReport[]>("/inventory/reporting/moves-history");
  }
};
