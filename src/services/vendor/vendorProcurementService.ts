import { apiClient } from "../common/apiClient";

export interface PurchaseRequestDto {
  id: number;
  requestNumber: string;
  title: string;
  description: string;
  category: string;
  estimatedAmount: number;
  priority: string;
  status: string;
  requestedBy: string;
  approvedBy?: string;
  approvalNotes?: string;
  createdAt: string;
}

export interface QuotationDto {
  id: number;
  purchaseRequestId: number;
  quotationNumber: string;
  vendorId: number;
  vendorName: string;
  totalAmount: number;
  deliveryTimelineDays: number;
  paymentTerms?: string;
  validUntil?: string;
  status: string;
  notes?: string;
  createdAt: string;
}

export interface PurchaseOrderItemDto {
  id?: number;
  itemName: string;
  description?: string;
  hsnCode?: string;
  quantity: number;
  unitOfMeasure?: string;
  unitPrice: number;
  taxPercent?: number;
  totalAmount: number;
  receivedQuantity?: number;
}

export interface PurchaseOrderDto {
  id: number;
  poNumber: string;
  vendorId: number;
  vendorName: string;
  quotationId?: number;
  orderDate: string;
  deliveryDueDate?: string;
  billingAddress?: string;
  shippingAddress?: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  status: string;
  notes?: string;
  items: PurchaseOrderItemDto[];
  createdAt: string;
}

export interface GoodsReceiptItemDto {
  id?: number;
  poItemId?: number;
  itemName: string;
  orderedQuantity: number;
  receivedQuantity: number;
  acceptedQuantity: number;
  rejectedQuantity: number;
  rejectionReason?: string;
  unitPrice: number;
  batchNumber?: string;
  expiryDate?: string;
}

export interface GoodsReceiptDto {
  id: number;
  grnNumber: string;
  purchaseOrderId: number;
  poNumber: string;
  vendorId: number;
  vendorName: string;
  vehicleNumber?: string;
  challanNumber?: string;
  invoiceNumber?: string;
  receivedDate: string;
  receivedBy: string;
  status: string;
  remarks?: string;
  items: GoodsReceiptItemDto[];
  createdAt: string;
}

export interface ThreeWayMatchLineResult {
  poItemId?: number;
  itemName: string;
  poQuantity: number;
  grnAcceptedQuantity: number;
  invoiceQuantity: number;
  poUnitPrice: number;
  invoiceUnitPrice: number;
  status: "MATCHED" | "QUANTITY_MISMATCH" | "PRICE_MISMATCH" | "UNRECEIVED_ITEM";
  remarks: string;
}

export interface ThreeWayMatchResultDto {
  invoiceId: number;
  invoiceNumber: string;
  purchaseOrderId: number;
  poNumber: string;
  matched: boolean;
  totalPoAmount: number;
  totalGrnAmount: number;
  totalInvoiceAmount: number;
  quantityDiscrepancy: boolean;
  priceDiscrepancy: boolean;
  notes: string;
  lineMatches: ThreeWayMatchLineResult[];
}

export const vendorProcurementService = {
  async getRequests(): Promise<PurchaseRequestDto[]> {
    return apiClient.get<PurchaseRequestDto[]>("/vendor/procurement/requests");
  },

  async createRequest(data: Partial<PurchaseRequestDto>): Promise<PurchaseRequestDto> {
    return apiClient.post<PurchaseRequestDto>("/vendor/procurement/requests", data);
  },

  async approveRequest(id: number, approvalNotes?: string): Promise<PurchaseRequestDto> {
    const url = `/vendor/procurement/requests/${id}/approve${approvalNotes ? `?approvalNotes=${encodeURIComponent(approvalNotes)}` : ""}`;
    return apiClient.post<PurchaseRequestDto>(url);
  },

  async getQuotations(requestId?: number): Promise<QuotationDto[]> {
    const url = requestId ? `/vendor/procurement/quotations?requestId=${requestId}` : "/vendor/procurement/quotations";
    return apiClient.get<QuotationDto[]>(url);
  },

  async createQuotation(data: Partial<QuotationDto>): Promise<QuotationDto> {
    return apiClient.post<QuotationDto>("/vendor/procurement/quotations", data);
  },

  async getOrders(): Promise<PurchaseOrderDto[]> {
    return apiClient.get<PurchaseOrderDto[]>("/vendor/procurement/orders");
  },

  async createOrder(data: Partial<PurchaseOrderDto>): Promise<PurchaseOrderDto> {
    return apiClient.post<PurchaseOrderDto>("/vendor/procurement/orders", data);
  },

  async updateOrderStatus(id: number, status: string): Promise<PurchaseOrderDto> {
    return apiClient.post<PurchaseOrderDto>(`/vendor/procurement/orders/${id}/status?status=${encodeURIComponent(status)}`);
  },

  async getGoodsReceipts(orderId?: number): Promise<GoodsReceiptDto[]> {
    const url = orderId ? `/vendor/procurement/grn?orderId=${orderId}` : "/vendor/procurement/grn";
    return apiClient.get<GoodsReceiptDto[]>(url);
  },

  async createGoodsReceipt(data: {
    purchaseOrderId: number;
    vehicleNumber?: string;
    challanNumber?: string;
    invoiceNumber?: string;
    remarks?: string;
    items: Array<{
      poItemId?: number;
      itemName: string;
      orderedQuantity: number;
      receivedQuantity: number;
      acceptedQuantity: number;
      rejectedQuantity?: number;
      rejectionReason?: string;
      unitPrice: number;
      batchNumber?: string;
      expiryDate?: string;
    }>;
  }): Promise<GoodsReceiptDto> {
    return apiClient.post<GoodsReceiptDto>("/vendor/procurement/grn", data);
  },

  async verifyThreeWayMatch(invoiceId: number): Promise<ThreeWayMatchResultDto> {
    return apiClient.post<ThreeWayMatchResultDto>(`/vendor/procurement/invoices/${invoiceId}/match-3way`);
  },
};
