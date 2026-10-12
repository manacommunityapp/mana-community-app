import { apiClient } from "../common/apiClient";

export interface ReturnDto {
  id: number;
  returnCode: string;
  orderId: number;
  orderNumber: string;
  customerId: number;
  customerName: string;
  returnType: string;
  reason: string;
  description?: string;
  itemsJson?: string;
  refundAmount?: number;
  status: string;
  adminNote?: string;
  resolvedByName?: string;
  resolvedAt?: string;
  createdAt?: string;
}

export interface ReturnRequest {
  orderNumber: string;
  returnType: "RETURN" | "EXCHANGE";
  reason: string;
  description?: string;
  itemsJson?: string;
  refundAmount?: number;
}

export const commerceReturnService = {
  createReturn(req: ReturnRequest): Promise<ReturnDto> {
    return apiClient.post<ReturnDto>("/v1/commerce/returns", req);
  },
  getMyReturns(): Promise<ReturnDto[]> {
    return apiClient.get<ReturnDto[]>("/v1/commerce/returns/my");
  },
  getAdminReturns(status?: string): Promise<ReturnDto[]> {
    const q = status ? `?status=${status}` : "";
    return apiClient.get<ReturnDto[]>(`/v1/commerce/returns/admin${q}`);
  },
  resolveReturn(returnCode: string, status: string, adminNote: string): Promise<ReturnDto> {
    return apiClient.post<ReturnDto>(`/v1/commerce/returns/${returnCode}/resolve`, { status, adminNote });
  },
};
