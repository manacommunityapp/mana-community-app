export type LedgerEventType =
  | 'MAINTENANCE_INVOICE'
  | 'PAYMENT_RECEIVED'
  | 'CHEQUE_CLEARED'
  | 'CHEQUE_BOUNCED_NSF'
  | 'CREDIT_NOTE_BACKDATED'
  | 'PENALTY_LEVIED'
  | 'PENALTY_WAIVED';

export type SensitiveActionType =
  | 'PENALTY_WAIVER'
  | 'VENDOR_BLACKLIST'
  | 'VISITOR_SOFT_DELETED'
  | 'GUARD_SHIFT_OVERRIDE'
  | 'CREDIT_NOTE_BACKDATED';

export type AuditRiskTier = 'STANDARD' | 'HIGH' | 'CRITICAL';

export interface BitemporalLedgerEvent {
  eventId: string;
  societyId: number;
  flatId: number;
  unitCode: string;
  streamVersion: number;
  globalSeq: number;
  eventType: LedgerEventType;
  effectiveDate: string;
  recordedAt: string;
  signedAmountPaise: number;
  causesEventId?: string | null;
  reasonCode: string;
  actorName: string;
  idempotencyKey: string;
  linesJson: string;
  prevEventHash: string;
  eventHash: string;
}

export interface LedgerCheckpoint {
  checkpointId: string;
  societyId: number;
  flatId: number;
  unitCode: string;
  checkpointDate: string;
  recordedCutoff: string;
  streamVersion: number;
  balancePaise: number;
  stateHash: string;
  createdAt: string;
}

export interface TimeTravelReconstruction {
  societyId: number;
  flatId: number;
  unitCode: string;
  asOfEffectiveDate: string;
  asOfRecordedAt: string;
  asKnownBalancePaise: number;
  restatedBalancePaise: number;
  liveCurrentBalancePaise: number;
  retroactiveVariancePaise: number;
  checkpointUsed: LedgerCheckpoint | null;
  eventsReplayedFromCheckpoint: number;
  asKnownTimeline: BitemporalLedgerEvent[];
  retroactiveAdjustments: BitemporalLedgerEvent[];
}

export interface WormAuditEvent {
  auditId: string;
  societyId: number;
  seqNo: number;
  actionType: SensitiveActionType;
  riskTier: AuditRiskTier;
  resourceType: string;
  resourceId: string;
  actorId: number;
  actorName: string;
  checkerId?: number | null;
  checkerName?: string | null;
  reason: string;
  oldValueJson: string;
  newValueJson: string;
  tombstoned: boolean;
  ipAddress: string;
  correlationId: string;
  prevHash: string;
  recordHash: string;
  ecdsaSignature: string;
  recordedAt: string;
}

export interface ExternalMerkleAnchor {
  anchorId: string;
  societyId: number;
  seqFrom: number;
  seqTo: number;
  eventCount: number;
  headHash: string;
  merkleRoot: string;
  ecdsaSignature: string;
  wormBucketUri: string;
  objectLockMode: string;
  retentionUntil: string;
  anchoredAt: string;
}

export interface ForensicVerificationReport {
  societyId: number;
  totalLocalEvents: number;
  totalExternalAnchors: number;
  chainValid: boolean;
  signaturesValid: boolean;
  externalAnchorMatch: boolean;
  tailTruncationDetected: boolean;
  firstBrokenSeqNo?: number | null;
  failureReason: string;
  latestLocalHeadHash: string;
  latestAnchoredMerkleRoot?: string | null;
  verifiedAt: string;
}
