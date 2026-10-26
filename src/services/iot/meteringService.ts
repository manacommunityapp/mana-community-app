import { apiClient } from "../common/apiClient";

export type MeterType = "WATER_METER" | "ELECTRICITY_METER" | "GAS_METER" | "DIESEL_GENERATOR";
export type MeterProtocol = "MQTT" | "MODBUS_TCP" | "MODBUS_RTU" | "HTTP_PULSE";
export type MeterStatus = "ACTIVE" | "TAMPERED" | "OFFLINE" | "FAULT";
export type MeterBillingStatus = "PENDING_SYNC" | "BILLED_IN_CFBOS" | "DISPUTED";

export interface SmartMeterDto {
  id: number;
  meterSerialNumber: string;
  meterType: MeterType;
  communityId: number;
  unitNumber?: string;
  blockName?: string;
  protocol: MeterProtocol;
  pulseMultiplier: number;
  lastReading: number;
  lastTelemetryTime?: string;
  status: MeterStatus;
  batteryLevel?: number;
  leakDetected: boolean;
}

export interface MeterBillingCycleDto {
  id: number;
  meterId: number;
  meterSerialNumber: string;
  unitNumber: string;
  meterType: MeterType;
  billingMonth: string;
  startReading: number;
  endReading: number;
  totalUnitsConsumed: number;
  slabAmount: number;
  cfbosInvoiceId?: number;
  billingStatus: MeterBillingStatus;
}

export interface IngestTelemetryRequest {
  meterSerialNumber: string;
  pulseCount: number;
  instantaneousFlow?: number;
  voltage?: number;
  current?: number;
  powerFactor?: number;
  batteryLevel?: number;
  signalRssi?: number;
  tamperFlag?: boolean;
}

export interface IngestTelemetryResult {
  meterSerialNumber: string;
  meterType: MeterType;
  deltaConsumed: number;
  cumulativeReading: number;
  anomalyDetected: boolean;
  alertMessage?: string;
  status: MeterStatus;
}

export const meteringService = {
  async getCommunityMeters(communityId: number): Promise<SmartMeterDto[]> {
    return apiClient.get<SmartMeterDto[]>(`/v1/iot/metering/community/${communityId}`);
  },

  async ingestTelemetry(req: IngestTelemetryRequest): Promise<IngestTelemetryResult> {
    return apiClient.post<IngestTelemetryResult>("/v1/iot/metering/telemetry/ingest", req);
  },

  async closeMonthBilling(meterId: number, billingMonth: string): Promise<MeterBillingCycleDto> {
    return apiClient.post<MeterBillingCycleDto>(
      `/v1/iot/metering/billing/${meterId}/close-month?billingMonth=${billingMonth}`,
      {}
    );
  },

  async syncToCfbos(communityId: number, billingMonth: string): Promise<MeterBillingCycleDto[]> {
    return apiClient.post<MeterBillingCycleDto[]>(
      `/v1/iot/metering/billing/cfbos-sync/${communityId}?billingMonth=${billingMonth}`,
      {}
    );
  },
};
