import { apiClient } from "../common/apiClient";

export interface CommissionRuleDto {
  id: number;
  ruleName: string;
  vendorUserId?: number;
  vendorName?: string;
  category?: string;
  channel?: string;
  feePercent: number;
  gstOnFee: boolean;
  tdsPercent?: number;
  priority: number;
  active: boolean;
  notes?: string;
  createdAt?: string;
}

export interface CommissionRuleRequest {
  ruleName: string;
  vendorUserId?: number;
  category?: string;
  channel?: string;
  feePercent: number;
  gstOnFee?: boolean;
  tdsPercent?: number;
  priority?: number;
  active?: boolean;
  notes?: string;
}

export const commerceCommissionService = {
  getRules(): Promise<CommissionRuleDto[]> {
    return apiClient.get<CommissionRuleDto[]>("/v1/commerce/commission-rules");
  },

  createRule(req: CommissionRuleRequest): Promise<CommissionRuleDto> {
    return apiClient.post<CommissionRuleDto>("/v1/commerce/commission-rules", req);
  },

  updateRule(id: number, req: CommissionRuleRequest): Promise<CommissionRuleDto> {
    return apiClient.put<CommissionRuleDto>(`/v1/commerce/commission-rules/${id}`, req);
  },

  deleteRule(id: number): Promise<void> {
    return apiClient.delete<void>(`/v1/commerce/commission-rules/${id}`);
  },
};
