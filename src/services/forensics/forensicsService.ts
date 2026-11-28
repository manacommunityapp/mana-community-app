import apiClient from '../apiClient';
import type {
  BitemporalLedgerEvent,
  ExternalMerkleAnchor,
  ForensicVerificationReport,
  LedgerEventType,
  SensitiveActionType,
  TimeTravelReconstruction,
  WormAuditEvent,
} from '../../types/forensics';

export function formatRupees(paise: number): string {
  const sign = paise < 0 ? '-' : '';
  return `${sign}₹${(Math.abs(paise) / 100).toFixed(2)}`;
}

export function validateDualControlRequirement(
  actionType: SensitiveActionType,
  monetaryImpactPaise: number,
  actorId: number,
  checkerId?: number,
): void {
  const highRisk =
    (actionType === 'PENALTY_WAIVER' && monetaryImpactPaise >= 500_000) ||
    actionType === 'VENDOR_BLACKLIST';
  if (highRisk) {
    if (!checkerId) {
      throw new Error(`Dual-control checker approval is required for ${actionType}`);
    }
    if (checkerId === actorId) {
      throw new Error('Maker and Checker must be different administrators');
    }
  }
}

export async function seedFlatB902Scenario(societyId: number): Promise<TimeTravelReconstruction> {
  return apiClient.post<TimeTravelReconstruction>('/forensics/ledger/seed-b902', undefined, {
    params: { societyId },
  });
}

export async function reconstructAtPointInTime(payload: {
  societyId: number;
  flatId: number;
  asOfEffectiveDate: string;
  asOfRecordedAt: string;
}): Promise<TimeTravelReconstruction> {
  return apiClient.post<TimeTravelReconstruction>('/forensics/ledger/time-travel', payload);
}

export async function listFlatLedgerEvents(
  societyId: number,
  flatId: number,
): Promise<BitemporalLedgerEvent[]> {
  return apiClient.get<BitemporalLedgerEvent[]>('/forensics/ledger/events', {
    params: { societyId, flatId },
  });
}

export async function appendLedgerEvent(payload: {
  societyId: number;
  flatId: number;
  unitCode: string;
  eventType: LedgerEventType;
  effectiveDate: string;
  recordedAt?: string;
  signedAmountPaise: number;
  reasonCode: string;
  actorName: string;
  idempotencyKey: string;
}): Promise<BitemporalLedgerEvent> {
  return apiClient.post<BitemporalLedgerEvent>('/forensics/ledger/events', payload);
}

export async function recordSensitiveAudit(payload: {
  societyId: number;
  actionType: SensitiveActionType;
  resourceType: string;
  resourceId: string;
  actorId: number;
  actorName: string;
  checkerId?: number;
  checkerName?: string;
  monetaryImpactPaise?: number;
  reason: string;
  oldValueJson: string;
  newValueJson: string;
  tombstoneDelete?: boolean;
}): Promise<WormAuditEvent> {
  validateDualControlRequirement(
    payload.actionType,
    payload.monetaryImpactPaise ?? 0,
    payload.actorId,
    payload.checkerId,
  );
  return apiClient.post<WormAuditEvent>('/forensics/audit/events', payload);
}

export async function listWormAuditEvents(societyId: number): Promise<WormAuditEvent[]> {
  return apiClient.get<WormAuditEvent[]>('/forensics/audit/events', { params: { societyId } });
}

export async function anchorMerkleBatch(societyId: number): Promise<ExternalMerkleAnchor> {
  return apiClient.post<ExternalMerkleAnchor>('/forensics/audit/anchors', undefined, {
    params: { societyId },
  });
}

export async function listExternalAnchors(societyId: number): Promise<ExternalMerkleAnchor[]> {
  return apiClient.get<ExternalMerkleAnchor[]>('/forensics/audit/anchors', { params: { societyId } });
}

export async function verifyWormIntegrity(societyId: number): Promise<ForensicVerificationReport> {
  return apiClient.get<ForensicVerificationReport>('/forensics/audit/verify', { params: { societyId } });
}

export async function simulateRogueDbaTamper(payload: {
  societyId: number;
  mode: 'MODIFY_ROW' | 'TRUNCATE_TAIL';
  targetSeqNo?: number;
  forgedNewValueJson?: string;
}): Promise<ForensicVerificationReport> {
  return apiClient.post<ForensicVerificationReport>('/forensics/audit/simulate-tamper', payload);
}
