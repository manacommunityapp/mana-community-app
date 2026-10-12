import { apiClient } from "../common/apiClient";

export interface BulkOrderDto {
  id: number;
  bulkOrderCode: string;
  customerId: number;
  customerName: string;
  vendorId?: number;
  vendorName?: string;
  itemsJson: string;
  quotedAmount?: number;
  finalAmount?: number;
  deliveryAddress?: string;
  requestedDate?: string;
  status: string;
  customerNote?: string;
  adminNote?: string;
  vendorNote?: string;
  createdAt?: string;
}

export interface BulkOrderRequest {
  vendorUserId?: number;
  itemsJson: string;
  deliveryAddress?: string;
  requestedDate?: string;
  customerNote?: string;
}

export const commerceBulkOrderService = {
  create(req: BulkOrderRequest): Promise<BulkOrderDto> {
    return apiClient.post<BulkOrderDto>("/v1/commerce/bulk-orders", req);
  },
  getMyBulkOrders(): Promise<BulkOrderDto[]> {
    return apiClient.get<BulkOrderDto[]>("/v1/commerce/bulk-orders/my");
  },
  cancel(code: string): Promise<BulkOrderDto> {
    return apiClient.post<BulkOrderDto>(`/v1/commerce/bulk-orders/${code}/cancel`);
  },
  getAdminBulkOrders(): Promise<BulkOrderDto[]> {
    return apiClient.get<BulkOrderDto[]>("/v1/commerce/bulk-orders/admin");
  },
  updateStatus(code: string, status: string): Promise<BulkOrderDto> {
    return apiClient.patch<BulkOrderDto>(`/v1/commerce/bulk-orders/admin/${code}/status`, { status });
  },
  updateBulkOrder(code: string, req: Partial<BulkOrderRequest> & { quotedAmount?: number; adminNote?: string }): Promise<BulkOrderDto> {
    return apiClient.patch<BulkOrderDto>(`/v1/commerce/bulk-orders/admin/${code}`, req);
  },
};
