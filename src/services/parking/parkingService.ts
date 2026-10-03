import { apiClient } from "../common/apiClient";

export interface ParkingSlotResponse {
  id: number;
  slotNumber: string;
  zone: string;
  floor: string;
  slotType: string;
  status: string;
  assignedToId: number | null;
  assignedToName: string | null;
  vehicleId: number | null;
  vehicleNumberPlate: string | null;
  notes: string | null;
  createdAt: string;
}

export interface ParkingSlotRequest {
  slotNumber: string;
  zone?: string;
  floor?: string;
  slotType?: string;
  notes?: string;
}

export interface ResidentVehicleResponse {
  id: number;
  ownerId: number;
  ownerName: string;
  vehicleType: string;
  make: string;
  model: string;
  color: string;
  numberPlate: string;
  parkingSlotId: number | null;
  parkingSlotNumber: string | null;
  stickerNumber: string | null;
  primary: boolean;
  status: string;
  createdAt: string;
}

export interface ResidentVehicleRequest {
  vehicleType?: string;
  make?: string;
  model?: string;
  color?: string;
  numberPlate: string;
  parkingSlotId?: number | null;
  stickerNumber?: string;
  primary?: boolean;
}

export const parkingService = {
  async getSlots(): Promise<ParkingSlotResponse[]> {
    return apiClient.get<ParkingSlotResponse[]>("/parking/slots");
  },

  async getAvailableSlots(): Promise<ParkingSlotResponse[]> {
    return apiClient.get<ParkingSlotResponse[]>("/parking/slots/available");
  },

  async createSlot(data: ParkingSlotRequest): Promise<ParkingSlotResponse> {
    return apiClient.post<ParkingSlotResponse>("/parking/slots", data);
  },

  async updateSlot(id: number, data: ParkingSlotRequest): Promise<ParkingSlotResponse> {
    return apiClient.put<ParkingSlotResponse>(`/parking/slots/${id}`, data);
  },

  async assignSlot(id: number, userId: number): Promise<ParkingSlotResponse> {
    return apiClient.post<ParkingSlotResponse>(`/parking/slots/${id}/assign?userId=${userId}`, {});
  },

  async releaseSlot(id: number): Promise<ParkingSlotResponse> {
    return apiClient.post<ParkingSlotResponse>(`/parking/slots/${id}/release`, {});
  },

  async deleteSlot(id: number): Promise<void> {
    return apiClient.delete(`/parking/slots/${id}`);
  },

  async getVehicles(): Promise<ResidentVehicleResponse[]> {
    return apiClient.get<ResidentVehicleResponse[]>("/parking/vehicles");
  },

  async getMyVehicles(): Promise<ResidentVehicleResponse[]> {
    return apiClient.get<ResidentVehicleResponse[]>("/parking/vehicles/mine");
  },

  async registerVehicle(data: ResidentVehicleRequest): Promise<ResidentVehicleResponse> {
    return apiClient.post<ResidentVehicleResponse>("/parking/vehicles", data);
  },

  async updateVehicle(id: number, data: ResidentVehicleRequest): Promise<ResidentVehicleResponse> {
    return apiClient.put<ResidentVehicleResponse>(`/parking/vehicles/${id}`, data);
  },

  async deleteVehicle(id: number): Promise<void> {
    return apiClient.delete(`/parking/vehicles/${id}`);
  },
};
