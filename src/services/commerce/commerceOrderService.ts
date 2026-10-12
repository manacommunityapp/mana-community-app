import { apiClient } from "../common/apiClient";

export type CommerceOrderStatus =
  | "PENDING"
  | "PAYMENT_AUTHORIZED"
  | "CONFIRMED"
  | "PROCESSING"
  | "ALLOCATED"
  | "PICKED"
  | "READY_FOR_PICKUP"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED"
  | "REFUNDED"
  | "DISPUTED";

export interface CommerceOrderItemDto {
  sku?: string;
  title: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  imageUrl?: string;
}

export interface CommerceOrderDto {
  id: number;
  orderNumber: string;
  channel: string;
  buyerId?: number;
  buyerName?: string;
  buyerFlat?: string;
  vendorName?: string;
  status: CommerceOrderStatus;
  subtotalAmount: number;
  discountAmount: number;
  deliveryFee: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod?: string;
  fulfillmentType?: string;
  deliveryAddress?: string;
  pickupSlot?: string;
  handoverOtp?: string;
  qrToken?: string;
  items: CommerceOrderItemDto[];
  notes?: string;
  vendorNotes?: string;
  estimatedDeliveryDate?: string;
  actualDeliveryAt?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt?: string;
  invoiceDocumentId?: number;
}

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export const commerceOrderService = {
  getMyOrders(): Promise<CommerceOrderDto[]> {
    return apiClient.get<CommerceOrderDto[]>("/commerce/orders/my");
  },

  getOrderByNumber(orderNumber: string): Promise<CommerceOrderDto> {
    return apiClient.get<CommerceOrderDto>(`/commerce/orders/${orderNumber}`);
  },

  cancelOrder(orderNumber: string, reason: string): Promise<CommerceOrderDto> {
    return apiClient.post<CommerceOrderDto>(`/commerce/orders/${orderNumber}/cancel`, { reason });
  },

  processOrder(orderNumber: string, vendorNote?: string): Promise<CommerceOrderDto> {
    return apiClient.post<CommerceOrderDto>(`/commerce/orders/${orderNumber}/process`, { vendorNote });
  },

  markReady(orderNumber: string): Promise<CommerceOrderDto> {
    return apiClient.post<CommerceOrderDto>(`/commerce/orders/${orderNumber}/ready`);
  },

  dispatchOrder(orderNumber: string, estimatedDeliveryDate?: string): Promise<CommerceOrderDto> {
    return apiClient.post<CommerceOrderDto>(`/commerce/orders/${orderNumber}/dispatch`, { estimatedDeliveryDate });
  },

  markDelivered(orderNumber: string): Promise<CommerceOrderDto> {
    return apiClient.post<CommerceOrderDto>(`/commerce/orders/${orderNumber}/delivered`);
  },

  getVendorOrders(status?: CommerceOrderStatus): Promise<CommerceOrderDto[]> {
    const q = status ? `?status=${status}` : "";
    return apiClient.get<CommerceOrderDto[]>(`/commerce/orders/vendor${q}`);
  },

  getAdminOrders(status?: CommerceOrderStatus, page = 0, size = 20): Promise<PagedResponse<CommerceOrderDto>> {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (status) params.set("status", status);
    return apiClient.get<PagedResponse<CommerceOrderDto>>(`/commerce/orders/admin?${params}`);
  },

  getOrderInvoice(orderNumber: string): Promise<CommerceInvoiceDto | null> {
    return apiClient.get<CommerceInvoiceDto | null>(`/commerce/orders/${orderNumber}/invoice`).catch(() => null);
  },
};

export interface CommerceInvoiceLine {
  item: string;
  description?: string;
  qty: number;
  cost: number;
  disc?: number;
  tax?: number;
  lineTotal: number;
}

export interface CommerceInvoiceDto {
  id: number;
  code: string;
  type: string;
  status: string;
  customerId?: number;
  customerName?: string;
  docDate: string;
  currency: string;
  taxInclusive: boolean;
  subtotal: number;
  discount?: number;
  tax?: number;
  otherCharges?: number;
  grandTotal: number;
  notes?: string;
  items: CommerceInvoiceLine[];
}
