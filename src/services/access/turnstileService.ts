import { apiClient } from "../common/apiClient";

export type TurnstileDirection = "ENTRY" | "EXIT" | "BIDIRECTIONAL";
export type TurnstileStatus = "ONLINE" | "OFFLINE" | "MAINTENANCE" | "LOCKDOWN";
export type BiometricPersonType = "RESIDENT" | "DOMESTIC_STAFF" | "VENDOR_WORKER" | "SECURITY_GUARD";
export type AccessDecision =
  | "GRANTED_OPEN"
  | "DENIED_UNENROLLED"
  | "DENIED_OUTSIDE_HOURS"
  | "DENIED_REVOKED"
  | "DENIED_LOCKDOWN";

export interface BiometricTurnstileDto {
  id: number;
  turnstileIdentifier: string;
  turnstileName: string;
  communityId: number;
  gateLocation: string;
  direction: TurnstileDirection;
  status: TurnstileStatus;
  relayUnlockMs: number;
  lastHeartbeat?: string;
}

export interface VerifyFaceRequest {
  turnstileIdentifier: string;
  faceEmbeddingHash: string;
  confidenceScore: number;
  snapshotUrl?: string;
}

export interface VerifyFaceResult {
  turnstileIdentifier: string;
  decision: AccessDecision;
  relayUnlock: boolean;
  relayUnlockDurationMs: number;
  personName: string;
  personType: BiometricPersonType;
  unitNumber?: string;
  confidenceScore: number;
  message: string;
}

export interface BiometricAccessLogDto {
  id: number;
  turnstileId: number;
  turnstileName: string;
  personName: string;
  personType: BiometricPersonType;
  unitNumber?: string;
  confidenceScore: number;
  accessDecision: AccessDecision;
  failureReason?: string;
  snapshotUrl?: string;
  timestamp: string;
}

export interface AccessLogPage {
  content: BiometricAccessLogDto[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export const turnstileService = {
  async getTurnstiles(communityId: number): Promise<BiometricTurnstileDto[]> {
    return apiClient.get<BiometricTurnstileDto[]>(`/v1/access/turnstiles/community/${communityId}`);
  },

  async verifyFace(req: VerifyFaceRequest): Promise<VerifyFaceResult> {
    return apiClient.post<VerifyFaceResult>("/v1/access/turnstiles/verify-face", req);
  },

  async getAccessLogs(communityId: number, page = 0, size = 15): Promise<AccessLogPage> {
    return apiClient.get<AccessLogPage>(`/v1/access/turnstiles/logs/${communityId}?page=${page}&size=${size}`);
  },

  async updateStatus(turnstileId: number, status: TurnstileStatus): Promise<void> {
    return apiClient.put<void>(`/v1/access/turnstiles/${turnstileId}/status?status=${status}`, {});
  },
};
