import { apiClient } from "../common/apiClient";
import type { PagedResponse } from "./commerceOrderService";

export interface CommerceSettlementDto {
  id: number;
  settlementNumber: string;
  vendorId?: string;
  sellerId?: number;
  communityId?: number;
  cycleStartDate?: string;
  cycleEndDate?: string;
  totalOrdersCount: number;
  grossAmount: number;
  platformFee: number;
  deductions: number;
  netPayout: number;
  status: "PENDING" | "PAID" | "PROCESSING";
  payoutUtr?: string;
  payoutDate?: string;
}

export interface SettlementRunRequest {
  cycleStart: string;
  cycleEnd: string;
  sellerId?: number;
  vendorId?: string;
  platformFeePercent?: number;
  adminNote?: string;
}

export interface SettlementMarkPaidRequest {
  payoutUtr: string;
  adminNote?: string;
}

export const commerceSettlementService = {
  getMySettlements(): Promise<CommerceSettlementDto[]> {
    return apiClient.get<CommerceSettlementDto[]>("/commerce/settlements/my");
  },

  runCycle(req: SettlementRunRequest): Promise<CommerceSettlementDto> {
    return apiClient.post<CommerceSettlementDto>("/commerce/settlements/run", req);
  },

  markPaid(settlementNumber: string, req: SettlementMarkPaidRequest): Promise<CommerceSettlementDto> {
    return apiClient.post<CommerceSettlementDto>(`/commerce/settlements/${settlementNumber}/pay`, req);
  },

  getAdminSettlements(status?: string, page = 0, size = 20): Promise<PagedResponse<CommerceSettlementDto>> {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (status) params.set("status", status);
    return apiClient.get<PagedResponse<CommerceSettlementDto>>(`/commerce/settlements/admin?${params}`);
  },
};
