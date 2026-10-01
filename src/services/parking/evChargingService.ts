import { apiClient } from "../common/apiClient";

export interface EvChargerResponse {
  id: number;
  deviceId: string;
  slotNumber: string | null;
  connectorType: string;
  maxKwRating: number;
  status: "AVAILABLE" | "CHARGING" | "FAULT" | "OFFLINE";
  lastHeartbeatAt: string | null;
}

export interface EvChargingSessionResponse {
  id: number;
  chargerId: number;
  chargerDeviceId: string;
  slotNumber: string | null;
  residentId: number;
  residentName: string;
  vehicleNumber: string | null;
  startedAt: string;
  endedAt: string | null;
  startMeterKwh: number;
  endMeterKwh: number | null;
  totalKwh: number | null;
  totalCost: number | null;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED" | "FAILED";
  cfbosWalletTransactionId: number | null;
  stopReason: string | null;
}

export interface StartChargingRequest {
  chargerId: number;
  vehicleId?: number;
  currentMeterReading?: number;
}

export interface StopChargingRequest {
  finalMeterReading?: number;
  stopReason?: string;
}

export const evChargingService = {
  async getChargers(): Promise<EvChargerResponse[]> {
    return apiClient.get<EvChargerResponse[]>("/parking/ev/chargers");
  },

  async getMySessions(): Promise<EvChargingSessionResponse[]> {
    return apiClient.get<EvChargingSessionResponse[]>("/parking/ev/sessions/my");
  },

  async startSession(data: StartChargingRequest): Promise<EvChargingSessionResponse> {
    return apiClient.post<EvChargingSessionResponse>("/parking/ev/sessions/start", data);
  },

  async stopSession(sessionId: number, data: StopChargingRequest): Promise<EvChargingSessionResponse> {
    return apiClient.post<EvChargingSessionResponse>(`/parking/ev/sessions/${sessionId}/stop`, data);
  }
};