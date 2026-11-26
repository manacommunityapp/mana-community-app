import axiosInstance from "../axiosInstance";

// ── Types ──

export interface EdgeGatewayDevice {
  id: number;
  communityId: number;
  serialNumber: string;
  deviceType: string;
  location: string;
  vendor?: string;
  firmwareVersion?: string;
  ipAddress?: string;
  isOnline: boolean;
  lastHeartbeatAt?: string;
  heartbeatIntervalSeconds: number;
  consecutiveMisses: number;
  offlineSince?: string;
  regionTag?: string;
  ispProvider?: string;
}

export interface DeviceStatus {
  serialNumber: string;
  deviceType: string;
  location: string;
  offlineSince?: string;
  consecutiveMisses: number;
}

export interface DeviceHealthSummary {
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
  offlineDeviceDetails: DeviceStatus[];
  suppressedRegions: string[];
  suppressedIsps: string[];
}

export interface SweepResult {
  newlyOffline: number;
  warned: number;
  alertableDevices: string[];
  suppressedDevices: string[];
}

export interface PrepaidMeterAccount {
  id: number;
  meterId: number;
  communityId: number;
  unitNumber?: string;
  balance: number;
  lowBalanceThreshold: number;
  ratePerUnit: number;
  lastDeductionAt?: string;
  lastSequenceNumber: number;
  totalConsumed: number;
  lowBalanceAlertSent: boolean;
  isDisconnected: boolean;
  active: boolean;
}

export interface DeductionResult {
  meterId: number;
  success: boolean;
  message: string;
  amountDeducted: number;
  remainingBalance: number;
  lowBalanceAlert: boolean;
  disconnected: boolean;
}

export interface LowBalanceAlert {
  meterId: number;
  communityId: number;
  unitNumber: string;
  balance: number;
  threshold: number;
}

export interface BarrierDecision {
  action: "OPEN" | "HOLD";
  residentName?: string;
  flatNo?: string;
  cloudVerified: boolean;
  validUntil: string;
  latencyMs: number;
}

export interface CacheStats {
  dbCacheEntries: number;
  hotCacheEntries: number;
}

const BASE = "/api/iot-edge";

// ── Device Heartbeat & Monitoring ──

export const sendHeartbeat = (data: {
  serialNumber: string;
  latencyMs?: number;
  cpuPct?: number;
  memoryPct?: number;
  uptimeSeconds?: number;
  firmwareVersion?: string;
  signalStrength?: number;
}) => axiosInstance.post<{ status: string }>(`${BASE}/heartbeat`, data);

export const runOfflineSweep = () =>
  axiosInstance.post<SweepResult>(`${BASE}/heartbeat/sweep`);

export const getDeviceHealth = (communityId: number) =>
  axiosInstance.get<DeviceHealthSummary>(`${BASE}/devices/${communityId}/health`);

export const getDevices = (communityId: number) =>
  axiosInstance.get<EdgeGatewayDevice[]>(`${BASE}/devices/${communityId}`);

export const registerDevice = (device: Partial<EdgeGatewayDevice>) =>
  axiosInstance.post<EdgeGatewayDevice>(`${BASE}/devices`, device);

// ── Prepaid Meter Deductions ──

export const processTelemetry = (data: {
  meterId: number;
  sequenceNumber: number;
  deltaConsumption: number;
  readingTimestamp: string;
}) => axiosInstance.post<DeductionResult>(`${BASE}/meter/telemetry`, data);

export const rechargeMeter = (meterId: number, amount: number) =>
  axiosInstance.post<PrepaidMeterAccount>(`${BASE}/meter/${meterId}/recharge`, { amount });

export const getMeterAccounts = (communityId: number) =>
  axiosInstance.get<PrepaidMeterAccount[]>(`${BASE}/meter/${communityId}/accounts`);

export const getLowBalanceAlerts = () =>
  axiosInstance.get<LowBalanceAlert[]>(`${BASE}/meter/low-balance-alerts`);

export const createMeterAccount = (account: Partial<PrepaidMeterAccount>) =>
  axiosInstance.post<PrepaidMeterAccount>(`${BASE}/meter/accounts`, account);

// ── Barrier Access Control ──

export const validateBarrierAccess = (communityId: number, credentialType: string, credentialValue: string) =>
  axiosInstance.get<BarrierDecision>(`${BASE}/barrier/validate`, {
    params: { communityId, credentialType, credentialValue },
  });

export const syncBarrierCache = (communityId: number, entries: Array<{
  credentialType: string;
  credentialValue: string;
  residentName: string;
  flatNo: string;
  action: string;
}>) => axiosInstance.post<{ status: string; count: string }>(`${BASE}/barrier/${communityId}/sync-cache`, entries);

export const getBarrierCacheStats = (communityId: number) =>
  axiosInstance.get<CacheStats>(`${BASE}/barrier/${communityId}/cache-stats`);
