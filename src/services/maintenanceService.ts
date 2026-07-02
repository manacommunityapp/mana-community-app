import { apiClient } from "./apiClient";
import type { Asset } from "./assetService";

export interface MaintenanceRecord {
  id: number;
  asset?: Asset;
  maintenanceDate: string;
  type: "PREVENTIVE" | "REPAIR" | "INSPECTION";
  description?: string;
  cost: number;
  performedBy?: string;
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  createdAt?: string;
  updatedAt?: string;
}

export const maintenanceService = {
  async getMaintenanceRecords(): Promise<MaintenanceRecord[]> {
    return apiClient.get<MaintenanceRecord[]>("/inventory/maintenance");
  },

  async getAssetMaintenanceRecords(assetId: string | number): Promise<MaintenanceRecord[]> {
    return apiClient.get<MaintenanceRecord[]>(`/inventory/maintenance/asset/${assetId}`);
  },

  async createMaintenanceRecord(
    assetId: string | number,
    record: Omit<MaintenanceRecord, "id" | "asset" | "createdAt" | "updatedAt">
  ): Promise<MaintenanceRecord> {
    return apiClient.post<MaintenanceRecord>(`/inventory/maintenance/asset/${assetId}`, record);
  },

  async updateMaintenanceStatus(
    id: string | number,
    status: MaintenanceRecord["status"]
  ): Promise<MaintenanceRecord> {
    return apiClient.put<MaintenanceRecord>(`/inventory/maintenance/${id}/status?status=${encodeURIComponent(status)}`);
  }
};
