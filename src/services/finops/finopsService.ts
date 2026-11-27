import apiClient from '../apiClient';
import type {
  DeliveryEvent,
  DeliveryRoutePlan,
  StorageFinOpsSummary,
  StorageTierPolicy,
  TelecomFinOpsSummary,
} from '../../types/finops';

export async function dispatchGateAlert(payload: {
  societyId: number;
  residentId: string;
  visitorType: string;
  slaMs: number;
  wsOnlineOverride: boolean;
  aggressiveDozeOverride: boolean;
  waOptInOverride?: boolean;
  forceExplorationProbe?: boolean;
}): Promise<DeliveryRoutePlan> {
  return apiClient.post<DeliveryRoutePlan>('/finops/delivery/dispatch', payload);
}

export async function escalateGateAlert(alertId: string): Promise<DeliveryEvent> {
  return apiClient.post<DeliveryEvent>(`/finops/delivery/${alertId}/escalate`);
}

export async function ackGateAlert(alertId: string, channel: string, latencyMs: number): Promise<DeliveryEvent> {
  return apiClient.post<DeliveryEvent>(`/finops/delivery/${alertId}/ack`, { channel, latencyMs });
}

export async function getTelecomSummary(societyId: number): Promise<TelecomFinOpsSummary> {
  return apiClient.get<TelecomFinOpsSummary>('/finops/delivery/summary', { params: { societyId } });
}

export async function listDeliveryEvents(societyId: number): Promise<DeliveryEvent[]> {
  return apiClient.get<DeliveryEvent[]>('/finops/delivery/events', { params: { societyId } });
}

export async function listStoragePolicies(): Promise<StorageTierPolicy[]> {
  return apiClient.get<StorageTierPolicy[]>('/finops/storage/policies');
}

export async function recordCompressionAudit(payload: {
  societyId: number;
  assetClass: string;
  originalBytes: number;
  compressedBytes: number;
  format: string;
}): Promise<StorageFinOpsSummary> {
  return apiClient.post<StorageFinOpsSummary>('/finops/storage/compression-audit', payload);
}

export async function getStorageSummary(societyId: number): Promise<StorageFinOpsSummary> {
  return apiClient.get<StorageFinOpsSummary>('/finops/storage/summary', { params: { societyId } });
}
