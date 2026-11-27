export interface TaxRuleVersion {
  ruleVersionId: string;
  ruleFamily: 'GST_MAINTENANCE' | 'TDS_194C' | 'TDS_194J' | 'TDS_194I' | string;
  fyCode: string;
  versionNo: number;
  effectiveFrom: string;
  effectiveTo: string | null;
  gazetteRef?: string;
  ruleSpec: Record<string, unknown>;
  specSha256: string;
}

export interface MaintenanceChargeLine {
  code: string;
  label: string;
  amountPaise: number;
  pureAgentPassThrough: boolean;
}

export interface MaintenanceGstRequest {
  societyId: number;
  fyCode: string;
  supplyDate: string;
  flatNumber: string;
  voucherNumber: string;
  societyGstRegistered: boolean;
  societyTurnoverPaise: number;
  lines: MaintenanceChargeLine[];
  persistSnapshot: boolean;
}

export interface MaintenanceGstResult {
  ruleVersionId: string;
  fyCode: string;
  supplyDate: string;
  totalBilledPaise: number;
  maintenanceBasePaise: number;
  pureAgentExcludedPaise: number;
  gstApplicable: boolean;
  reason: string;
  appliedRateBps: number;
  cgstPaise: number;
  sgstPaise: number;
  totalGstPaise: number;
  grandTotalPaise: number;
  snapshotSha256: string;
}

export interface PanValidationResult {
  pan: string;
  formatValid: boolean;
  entityTypeChar: string;
  entityCategory: string;
  status: string;
  penal206aaTriggered: boolean;
}

export interface VendorTdsRequest {
  societyId: number;
  fyCode: string;
  creditOrPaymentDate: string;
  voucherNumber: string;
  vendorPan: string;
  panStatusOverride?: string;
  tdsSection: '194C' | '194J_PROF' | '194J_TECH' | '194I_EQUIP' | '194I_LAND' | string;
  grossAmountPaise: number;
  persistSnapshot: boolean;
}

export interface VendorTdsResult {
  ruleVersionId: string;
  tdsSection: string;
  panValidation: PanValidationResult;
  grossAmountPaise: number;
  priorCumulativeGrossPaise: number;
  newCumulativeGrossPaise: number;
  thresholdCrossed: boolean;
  catchUpApplied: boolean;
  appliedRateBps: number;
  tdsDeductedPaise: number;
  netPayablePaise: number;
  reason: string;
}

export interface TaxAdjustmentNote {
  noteId: string;
  originalVoucherId: string;
  noteType: 'DEBIT_NOTE' | 'CREDIT_NOTE' | string;
  noteNumber: string;
  deltaPaise: number;
  ruleVersionId: string;
}

export interface RecalculationBatch {
  batchId: string;
  societyId: number;
  fyCode: string;
  ruleFamily: string;
  targetRuleVersionId: string;
  evaluatedCount: number;
  adjustedCount: number;
  netDeltaPaise: number;
  notes: TaxAdjustmentNote[];
}

export interface LedgerLine {
  ledgerCode: string;
  ledgerName: string;
  debitPaise: number;
  creditPaise: number;
  costCategory?: string;
  costCenter?: string;
}

export interface AuditLedgerEntry {
  entryId: string;
  societyId: number;
  seqNo: number;
  voucherId: string;
  voucherNumber: string;
  voucherType: string;
  postingDate: string;
  sourceSystem: string;
  reversesEntryId?: string | null;
  lines: LedgerLine[];
  taxSnapshotSha256: string;
  prevEntryHash: string;
  entryHash: string;
  createdAt: string;
}

export interface AuditChainVerification {
  societyId: number;
  totalEntries: number;
  chainValid: boolean;
  merkleRoot: string;
  brokenAtSeqNo: number | null;
  message: string;
}

export interface TallyOutboxItem {
  voucherId: string;
  tallyGuid: string;
  voucherNumber: string;
  cloudEntryHash: string;
  syncedPayloadHash: string;
  syncStatus: string;
  tallyXml: string;
}

export interface TallySyncConflict {
  conflictId: string;
  societyId: number;
  voucherId: string;
  tallyGuid: string;
  cloudSnapshot: Record<string, unknown>;
  tallySnapshot: Record<string, unknown>;
  resolutionStatus: string;
  createdAt: string;
}

export interface TallySyncSummary {
  societyId: number;
  pendingOutboxCount: number;
  syncedCount: number;
  openConflictsCount: number;
}
