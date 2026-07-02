import { apiClient } from "./apiClient";
import type { Asset } from "./assetService";

export interface AssetAuditLog {
  id: number;
  asset?: Asset;
  auditedAt: string;
  auditedBy: string;
  expectedStatus: string;
  actualStatus: string;
  expectedQuantity: number;
  actualQuantity: number;
  variance: number;
  notes?: string;
}

export const assetAuditService = {
  async getAuditLogs(): Promise<AssetAuditLog[]> {
    return apiClient.get<AssetAuditLog[]>("/inventory/audit");
  },

  async getAssetAuditLogs(assetId: string | number): Promise<AssetAuditLog[]> {
    return apiClient.get<AssetAuditLog[]>(`/inventory/audit/asset/${assetId}`);
  },

  async recordAudit(
    assetId: string | number,
    data: {
      auditedBy: string;
      actualStatus?: string;
      expectedQuantity: number;
      actualQuantity: number;
      notes?: string;
    }
  ): Promise<AssetAuditLog> {
    const params = new URLSearchParams();
    params.set("auditedBy", data.auditedBy);
    if (data.actualStatus) params.set("actualStatus", data.actualStatus);
    params.set("expectedQuantity", String(data.expectedQuantity));
    params.set("actualQuantity", String(data.actualQuantity));
    if (data.notes) params.set("notes", data.notes);

    return apiClient.post<AssetAuditLog>(`/inventory/audit/asset/${assetId}?${params.toString()}`);
  }
};
