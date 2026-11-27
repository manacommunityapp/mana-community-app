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

export interface EnrollBiometricRequest {
  userId: number;
  communityId: number;
  personType: BiometricPersonType;
  personName: string;
  unitNumber?: string;
  faceEmbeddingHash: string;
  faceFeatureVersion?: string;
  timeWindowStart?: string;
  timeWindowEnd?: string;
  allowedDays?: string;
}

export type KioskPunchType = "CLOCK_IN" | "CLOCK_OUT" | "GATE_ACCESS" | "VISITOR_CHECKIN";

export interface OfflinePunchRecord {
  id: string;
  turnstileIdentifier: string;
  timestamp: string;
  faceEmbeddingHash: string;
  confidenceScore: number;
  snapshotUrl?: string;
  punchType: KioskPunchType;
  personName?: string;
  personType?: BiometricPersonType;
  unitOrDept?: string;
  isLivenessVerified: boolean;
  synced: boolean;
  syncedAt?: string;
  decision?: AccessDecision;
}

export interface KioskConfig {
  turnstileIdentifier: string;
  kioskName: string;
  mode: "TURNSTILE_GATE" | "STAFF_ATTENDANCE" | "VISITOR_KIOSK";
  minConfidenceThreshold: number;
  relayUnlockDurationMs: number;
  livenessDetectionEnabled: boolean;
  audioFeedbackEnabled: boolean;
  autoCaptureIntervalMs: number;
  offlineModeAllowed: boolean;
  adminPin: string;
}

export interface KioskAttendancePunchRequest {
  turnstileIdentifier: string;
  faceEmbeddingHash: string;
  confidenceScore: number;
  punchType: KioskPunchType;
  snapshotUrl?: string;
  isLivenessVerified: boolean;
  deviceTimestamp: string;
}

export interface KioskAttendancePunchResult extends VerifyFaceResult {
  attendanceRecordId?: number;
  shiftName?: string;
  workHoursToday?: string;
  punchType: KioskPunchType;
  contractorAgencyName?: string;
  autoAssignedShift?: boolean;
}

const OFFLINE_STORAGE_KEY = "mana_kiosk_offline_punches";

export const turnstileService = {
  async getTurnstiles(communityId: number): Promise<BiometricTurnstileDto[]> {
    return apiClient.get<BiometricTurnstileDto[]>(`/v1/access/turnstiles/community/${communityId}`);
  },

  async enrollUser(req: EnrollBiometricRequest): Promise<void> {
    return apiClient.post<void>("/v1/access/turnstiles/enroll", req);
  },

  async verifyFace(req: VerifyFaceRequest): Promise<VerifyFaceResult> {
    return apiClient.post<VerifyFaceResult>("/v1/access/turnstiles/verify-face", req);
  },

  async recordKioskAttendance(req: KioskAttendancePunchRequest): Promise<KioskAttendancePunchResult> {
    return apiClient.post<KioskAttendancePunchResult>("/v1/access/turnstiles/kiosk-attendance", req);
  },

  async getAccessLogs(communityId: number, page = 0, size = 15): Promise<AccessLogPage> {
    return apiClient.get<AccessLogPage>(`/v1/access/turnstiles/logs/${communityId}?page=${page}&size=${size}`);
  },

  async updateStatus(turnstileId: number, status: TurnstileStatus): Promise<void> {
    return apiClient.put<void>(`/v1/access/turnstiles/${turnstileId}/status?status=${status}`, {});
  },

  // ── Offline Punch Queue Management ──────────────────────────────────────────
  getOfflinePunches(): OfflinePunchRecord[] {
    try {
      const raw = localStorage.getItem(OFFLINE_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  saveOfflinePunch(punch: OfflinePunchRecord): void {
    try {
      const list = this.getOfflinePunches();
      list.push(punch);
      localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.error("Failed to save offline punch", e);
    }
  },

  clearSyncedOfflinePunches(): void {
    try {
      const remaining = this.getOfflinePunches().filter((p) => !p.synced);
      localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(remaining));
    } catch (e) {
      console.error("Failed to clear synced offline punches", e);
    }
  },

  async syncOfflinePunches(): Promise<{ synced: number; failed: number }> {
    const punches = this.getOfflinePunches().filter((p) => !p.synced);
    if (punches.length === 0) return { synced: 0, failed: 0 };

    let synced = 0;
    let failed = 0;

    try {
      // Send batch to backend sync endpoint
      const result = await apiClient.post<{ syncedCount: number; failedCount: number }>(
        "/v1/access/turnstiles/sync-offline-punches",
        { punches }
      );
      synced = result.syncedCount ?? punches.length;
    } catch {
      // If batch endpoint is not yet deployed, fallback to individual verify / simulated mark
      for (const p of punches) {
        try {
          await this.verifyFace({
            turnstileIdentifier: p.turnstileIdentifier,
            faceEmbeddingHash: p.faceEmbeddingHash,
            confidenceScore: p.confidenceScore,
            snapshotUrl: p.snapshotUrl,
          });
          p.synced = true;
          p.syncedAt = new Date().toISOString();
          synced++;
        } catch {
          failed++;
        }
      }
    }

    // Update stored records
    const all = this.getOfflinePunches();
    const updated = all.map((item) => {
      const match = punches.find((p) => p.id === item.id);
      return match && match.synced ? { ...item, synced: true, syncedAt: match.syncedAt } : item;
    });
    localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(updated.filter((p) => !p.synced)));

    return { synced, failed };
  },

  async getBiometricDeltasSince(communityId: number, sinceVersion = 0): Promise<any[]> {
    return apiClient.get<any[]>(`/v1/access/turnstiles/deltas/${communityId}?sinceVersion=${sinceVersion}`);
  },

  async revokeBiometricKillSwitch(userId: number, reason?: string): Promise<any> {
    return apiClient.post<any>(`/v1/access/turnstiles/revoke/${userId}`, { reason });
  },

  async evaluateApbSwipe(payload: {
    communityId?: number;
    zoneId?: string;
    credentialId: string;
    direction?: "ENTRY" | "EXIT";
    turnstileId?: string;
    irPersonsDetected?: number;
  }): Promise<any> {
    return apiClient.post<any>("/v1/access/turnstiles/apb-swipe", payload);
  },
};
