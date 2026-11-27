import { apiClient } from "../common/apiClient";

export interface HouseholdVehicle {
  id: number;
  householdId?: number;
  vehicleNumber: string;
  vehicleType: "CAR" | "MOTORCYCLE" | "SCOOTER" | "SUV" | "TRUCK" | "OTHER";
  brandModel?: string;
  color?: string;
  rfidTag?: string;
  isActive: boolean;
  createdAt?: string;
}

export type HouseholdVehicleRequest = Omit<HouseholdVehicle, "id" | "householdId" | "createdAt">;

function unwrapList(res: any): any[] {
  if (Array.isArray(res)) return res;
  const nested = res?.data ?? res?.vehicles ?? res?.content;
  if (Array.isArray(nested)) return nested;
  return [];
}

function unwrapOne(res: any): any {
  return res?.data ?? res?.vehicle ?? res;
}

export const householdService = {
  async getMyVehicles(): Promise<HouseholdVehicle[]> {
    try {
      const res = await apiClient.get<any>("/households/my/vehicles");
      return unwrapList(res);
    } catch {
      return [];
    }
  },

  async addVehicle(data: HouseholdVehicleRequest): Promise<HouseholdVehicle> {
    const res = await apiClient.post<any>("/households/my/vehicles", data);
    return unwrapOne(res);
  },

  async updateVehicle(vehicleId: number, data: Partial<HouseholdVehicleRequest>): Promise<HouseholdVehicle> {
    const res = await apiClient.put<any>(`/households/my/vehicles/${vehicleId}`, data);
    return unwrapOne(res);
  },

  async removeVehicle(vehicleId: number): Promise<void> {
    await apiClient.delete<void>(`/households/my/vehicles/${vehicleId}`);
  },
};
