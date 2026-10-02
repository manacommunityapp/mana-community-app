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
  }
};