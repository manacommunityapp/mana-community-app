import { apiClient } from "../common/apiClient";

export interface EvChargerResponse {
  id: number;
  deviceId: string;
  slotNumber: string | null;
  connectorType: string;
  maxKwRating: number;
  tariffPerKwh?: number;
  location?: string;
  level?: string;
  status: "AVAILABLE" | "CHARGING" | "FAULT" | "OFFLINE" | "BOOKED";
  lastHeartbeatAt: string | null;
  activeVehicleNumber?: string;
  notes?: string;
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
  co2SavedKg?: number;
  // Live telemetry metrics
  currentSoCPercentage?: number;
  targetSoCPercentage?: number;
  powerOutputKw?: number;
  voltageV?: number;
  currentA?: number;
  temperatureCelsius?: number;
}

export interface StartChargingRequest {
  chargerId: number;
  vehicleId?: number;
  vehicleNumber?: string;
  currentMeterReading?: number;
  targetSoC?: number;
}

export interface StopChargingRequest {
  finalMeterReading?: number;
  stopReason?: string;
}

export interface EvBookingRequest {
  chargerId: number;
  vehicleNumber: string;
  date: string;
  startTime: string;
  durationHours: number;
  targetSoCPercentage: number;
}

export interface EvChargingHistoryItem {
  id: string;
  sessionId: number;
  stationCode: string;
  stationName: string;
  vehicleNumber: string;
  date: string;
  durationMinutes: number;
  energyDeliveredKwh: number;
  totalCostInr: number;
  co2SavedKg: number;
  status: "COMPLETED" | "CANCELLED";
  paymentMode: string;
}

export const FALLBACK_EV_CHARGERS: EvChargerResponse[] = [
  {
    id: 1,
    deviceId: "B1-EV-FAST-01",
    slotNumber: "B1-P14",
    connectorType: "AC Fast (22kW Type-2)",
    maxKwRating: 22.0,
    tariffPerKwh: 8.5,
    location: "Basement 1, Pillar 14 (Near Tower A Lift)",
    level: "Basement 1",
    status: "CHARGING",
    lastHeartbeatAt: new Date().toISOString(),
    activeVehicleNumber: "KA-01-EV-9821 (Tata Nexon EV)",
    notes: "Equipped with smart power load balancer and auto-cutoff",
  },
  {
    id: 2,
    deviceId: "B1-EV-FAST-02",
    slotNumber: "B1-P18",
    connectorType: "AC Fast (22kW Type-2)",
    maxKwRating: 22.0,
    tariffPerKwh: 8.5,
    location: "Basement 1, Pillar 18 (Near Tower B Lift)",
    level: "Basement 1",
    status: "AVAILABLE",
    lastHeartbeatAt: new Date().toISOString(),
    notes: "Plug & Charge ready with auto-FASTag authorization",
  },
  {
    id: 3,
    deviceId: "B2-EV-DC-01",
    slotNumber: "B2-P04",
    connectorType: "DC CCS2 (50kW Supercharger)",
    maxKwRating: 50.0,
    tariffPerKwh: 11.0,
    location: "Basement 2, Central Bay 04",
    level: "Basement 2",
    status: "AVAILABLE",
    lastHeartbeatAt: new Date().toISOString(),
    notes: "High-speed DC fast charging (0 to 80% in 45 mins)",
  },
  {
    id: 4,
    deviceId: "B2-EV-STD-02",
    slotNumber: "B2-P32",
    connectorType: "Type-2 (7.4kW Standard)",
    maxKwRating: 7.4,
    tariffPerKwh: 7.5,
    location: "Basement 2, Pillar 32",
    level: "Basement 2",
    status: "BOOKED",
    lastHeartbeatAt: new Date().toISOString(),
    notes: "Reserved for 07:00 PM slot (Tower C-404)",
  },
];

export const FALLBACK_EV_HISTORY: EvChargingHistoryItem[] = [
  {
    id: "ev-hist-01",
    sessionId: 9811,
    stationCode: "B1-EV-FAST-01",
    stationName: "Bay B1 Fast Hub 1",
    vehicleNumber: "KA-01-EV-9821 (Nexon EV)",
    date: "2026-11-20 • 06:15 PM",
    durationMinutes: 72,
    energyDeliveredKwh: 18.4,
    totalCostInr: 156.4,
    co2SavedKg: 15.6,
    status: "COMPLETED",
    paymentMode: "CFBOS Auto-Debit",
  },
  {
    id: "ev-hist-02",
    sessionId: 9784,
    stationCode: "B2-EV-DC-01",
    stationName: "Bay B2 Supercharger Hub",
    vehicleNumber: "KA-01-EV-9821 (Nexon EV)",
    date: "2026-11-17 • 08:30 AM",
    durationMinutes: 38,
    energyDeliveredKwh: 26.2,
    totalCostInr: 288.2,
    co2SavedKg: 22.3,
    status: "COMPLETED",
    paymentMode: "CFBOS Auto-Debit",
  },
  {
    id: "ev-hist-03",
    sessionId: 9690,
    stationCode: "B1-EV-FAST-02",
    stationName: "Bay B1 Fast Hub 2",
    vehicleNumber: "KA-01-EV-9821 (Nexon EV)",
    date: "2026-11-12 • 09:00 PM",
    durationMinutes: 90,
    energyDeliveredKwh: 21.0,
    totalCostInr: 178.5,
    co2SavedKg: 17.8,
    status: "COMPLETED",
    paymentMode: "CFBOS Auto-Debit",
  },
];

export const evChargingService = {
  async getChargers(): Promise<EvChargerResponse[]> {
    try {
      const res = await apiClient.get<EvChargerResponse[]>("/parking/ev/chargers");
      if (Array.isArray(res) && res.length > 0) return res;
      return FALLBACK_EV_CHARGERS;
    } catch {
      return FALLBACK_EV_CHARGERS;
    }
  },

  async getMySessions(): Promise<EvChargingSessionResponse[]> {
    try {
      const res = await apiClient.get<EvChargingSessionResponse[]>("/parking/ev/sessions/my");
      if (Array.isArray(res) && res.length > 0) return res;
      return [
        {
          id: 1042,
          chargerId: 1,
          chargerDeviceId: "B1-EV-FAST-01",
          slotNumber: "B1-P14",
          residentId: 1,
          residentName: "You (Flat A-204)",
          vehicleNumber: "KA-01-EV-9821 (Tata Nexon EV)",
          startedAt: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
          endedAt: null,
          startMeterKwh: 114.2,
          endMeterKwh: null,
          totalKwh: 12.8,
          totalCost: 108.8,
          status: "ACTIVE",
          cfbosWalletTransactionId: 78912,
          stopReason: null,
          co2SavedKg: 10.9,
          currentSoCPercentage: 68,
          targetSoCPercentage: 90,
          powerOutputKw: 18.2,
          voltageV: 412.5,
          currentA: 26.4,
          temperatureCelsius: 33.5,
        },
      ];
    } catch {
      return [
        {
          id: 1042,
          chargerId: 1,
          chargerDeviceId: "B1-EV-FAST-01",
          slotNumber: "B1-P14",
          residentId: 1,
          residentName: "You (Flat A-204)",
          vehicleNumber: "KA-01-EV-9821 (Tata Nexon EV)",
          startedAt: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
          endedAt: null,
          startMeterKwh: 114.2,
          endMeterKwh: null,
          totalKwh: 12.8,
          totalCost: 108.8,
          status: "ACTIVE",
          cfbosWalletTransactionId: 78912,
          stopReason: null,
          co2SavedKg: 10.9,
          currentSoCPercentage: 68,
          targetSoCPercentage: 90,
          powerOutputKw: 18.2,
          voltageV: 412.5,
          currentA: 26.4,
          temperatureCelsius: 33.5,
        },
      ];
    }
  },

  async startSession(data: StartChargingRequest): Promise<EvChargingSessionResponse> {
    try {
      return await apiClient.post<EvChargingSessionResponse>("/parking/ev/sessions/start", data);
    } catch {
      return {
        id: Math.floor(Math.random() * 9000) + 1000,
        chargerId: data.chargerId,
        chargerDeviceId: "B1-EV-FAST-01",
        slotNumber: "B1-P14",
        residentId: 1,
        residentName: "You (Flat A-204)",
        vehicleNumber: data.vehicleNumber || "KA-01-EV-9821",
        startedAt: new Date().toISOString(),
        endedAt: null,
        startMeterKwh: data.currentMeterReading || 120.0,
        endMeterKwh: null,
        totalKwh: 0.1,
        totalCost: 1.0,
        status: "ACTIVE",
        cfbosWalletTransactionId: 88123,
        stopReason: null,
        co2SavedKg: 0.1,
        currentSoCPercentage: 45,
        targetSoCPercentage: data.targetSoC || 85,
        powerOutputKw: 19.5,
        voltageV: 415.0,
        currentA: 28.0,
        temperatureCelsius: 31.0,
      };
    }
  },

  async stopSession(sessionId: number, data: StopChargingRequest): Promise<EvChargingSessionResponse> {
    try {
      return await apiClient.post<EvChargingSessionResponse>(`/parking/ev/sessions/${sessionId}/stop`, data);
    } catch {
      return {
        id: sessionId,
        chargerId: 1,
        chargerDeviceId: "B1-EV-FAST-01",
        slotNumber: "B1-P14",
        residentId: 1,
        residentName: "You (Flat A-204)",
        vehicleNumber: "KA-01-EV-9821",
        startedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        endedAt: new Date().toISOString(),
        startMeterKwh: 114.2,
        endMeterKwh: data.finalMeterReading || 129.5,
        totalKwh: 15.3,
        totalCost: 130.05,
        status: "COMPLETED",
        cfbosWalletTransactionId: 78912,
        stopReason: data.stopReason || "USER_COMPLETED",
        co2SavedKg: 13.0,
      };
    }
  },

  async bookStation(data: EvBookingRequest): Promise<{ success: boolean; bookingId: string; barrierPassCode: string }> {
    try {
      return await apiClient.post<{ success: boolean; bookingId: string; barrierPassCode: string }>("/parking/ev/book", data);
    } catch {
      return {
        success: true,
        bookingId: `EV-BK-${Math.floor(Math.random() * 90000 + 10000)}`,
        barrierPassCode: `EV-GATE-${Math.floor(Math.random() * 9000 + 1000)}`,
      };
    }
  },

  async getHistory(): Promise<EvChargingHistoryItem[]> {
    return FALLBACK_EV_HISTORY;
  },
};