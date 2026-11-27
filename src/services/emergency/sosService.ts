import { apiClient } from "../common/apiClient";

export type EmergencyType = "MEDICAL" | "FIRE" | "SECURITY_INTRUDER" | "GAS_LEAK" | "LIFT_STUCK" | "GENERAL_PANIC" | "THEFT";
export type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
export type IncidentStatus = "TRIGGERED" | "ACKNOWLEDGED" | "DISPATCHED" | "ON_SITE" | "RESOLVED" | "FALSE_ALARM";
export type LockdownDirective = "LOCKDOWN_CLOSE_ALL" | "EVACUATION_OPEN_ALL" | "NORMAL_RESTORE";

export interface SosIncidentResponse {
  id: number;
  communityId: number;
  residentId: number;
  residentName: string;
  residentPhone: string;
  flatNumber: string | null;
  buildingBlock: string | null;
  emergencyType: EmergencyType;
  severity: Severity;
  status: IncidentStatus;
  latitude: number | null;
  longitude: number | null;
  locationDetails: string | null;
  notes: string | null;
  lockdownInitiated: boolean;
  slaTargetSeconds: number;
  triggeredAt: string;
  acknowledgedAt: string | null;
  arrivedAt: string | null;
  resolvedAt: string | null;
  resolutionNotes: string | null;
}

export interface SosTriggerRequest {
  emergencyType: EmergencyType;
  severity?: Severity;
  flatNumber?: string;
  buildingBlock?: string;
  latitude?: number;
  longitude?: number;
  locationDetails?: string;
  notes?: string;
  triggerGateLockdown?: boolean;
}

export interface SosResolveRequest {
  status?: "RESOLVED" | "FALSE_ALARM";
  resolutionNotes?: string;
  restoreGatesToNormal?: boolean;
}

export interface GateLockdownRequest {
  directive: LockdownDirective;
  affectedGates?: string;
  reason?: string;
  incidentId?: number;
}

export const sosService = {
  async trigger(data: SosTriggerRequest): Promise<SosIncidentResponse> {
    return apiClient.post<SosIncidentResponse>("/emergency/sos/trigger", data);
  },

  async getActive(): Promise<SosIncidentResponse[]> {
    return apiClient.get<SosIncidentResponse[]>("/emergency/sos/active");
  },

  async getMy(): Promise<SosIncidentResponse[]> {
    return apiClient.get<SosIncidentResponse[]>("/emergency/sos/my");
  },

  async acknowledge(id: number): Promise<SosIncidentResponse> {
    return apiClient.post<SosIncidentResponse>(`/emergency/sos/${id}/acknowledge`, {});
  },

  async dispatch(id: number, notes?: string): Promise<SosIncidentResponse> {
    const params = new URLSearchParams();
    if (notes) params.append("notes", notes);
    return apiClient.post<SosIncidentResponse>(`/emergency/sos/${id}/dispatch?${params.toString()}`, {});
  },

  async markArrived(id: number, notes?: string): Promise<SosIncidentResponse> {
    const params = new URLSearchParams();
    if (notes) params.append("notes", notes);
    return apiClient.post<SosIncidentResponse>(`/emergency/sos/${id}/arrived?${params.toString()}`, {});
  },

  async resolve(id: number, data: SosResolveRequest): Promise<SosIncidentResponse> {
    return apiClient.post<SosIncidentResponse>(`/emergency/sos/${id}/resolve`, data);
  },

  async executeLockdown(data: GateLockdownRequest): Promise<void> {
    return apiClient.post<void>("/emergency/lockdown", data);
  },

  encodeCompactSosFrame(params: {
    communityId: number;
    residentId: number;
    towerBlock: string;
    locationCode: string;
    typeCode: string;
    epochSec?: number;
    idempotencyKey: string;
  }): string {
    const ts = params.epochSec ?? Math.floor(Date.now() / 1000);
    return `SOS1|${params.communityId}|${params.residentId}|${params.towerBlock}|${params.locationCode}|${params.typeCode}|${ts}|${params.idempotencyKey}`;
  },

  async triggerCompactSos(
    rawFrame: string,
    ingestChannel: "COMPACT_2G" | "SMS_FALLBACK" = "COMPACT_2G",
    nearestGuardId?: number
  ): Promise<any> {
    return apiClient.post<any>("/emergency/sos/compact", { rawFrame, ingestChannel, nearestGuardId });
  },

  async broadcastTowerEvacuation(payload: {
    towerBlock: string;
    emergencyType: string;
    message: string;
    assemblyPoint?: string;
  }): Promise<any> {
    return apiClient.post<any>("/emergency/evacuation/broadcast", payload);
  },

  async getEvacuationMuster(broadcastId: number): Promise<any> {
    return apiClient.get<any>(`/emergency/evacuation/${broadcastId}/muster`);
  },

  async markEvacueeSafe(entryId: number): Promise<any> {
    return apiClient.post<any>(`/emergency/evacuation/muster/${entryId}/safe`, {});
  },
};