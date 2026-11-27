import apiClient from '../apiClient';
import type {
  AuditChainVerification,
  AuditLedgerEntry,
  MaintenanceGstRequest,
  MaintenanceGstResult,
  RecalculationBatch,
  TallyOutboxItem,
  TallySyncConflict,
  TallySyncSummary,
  TaxRuleVersion,
  VendorTdsRequest,
  VendorTdsResult,
} from '../../types/accounting';

export async function listTaxRules(ruleFamily?: string, fyCode?: string): Promise<TaxRuleVersion[]> {
  return apiClient.get<TaxRuleVersion[]>('/accounting/tax-rules', {
    params: { ruleFamily, fyCode },
  });
}

export async function publishTaxRule(payload: {
  ruleFamily: string;
  fyCode: string;
  effectiveFrom: string;
  gazetteRef?: string;
  ruleSpec: Record<string, unknown>;
}): Promise<TaxRuleVersion> {
  return apiClient.post<TaxRuleVersion>('/accounting/tax-rules', payload);
}

export async function calculateMaintenanceGst(req: MaintenanceGstRequest): Promise<MaintenanceGstResult> {
  return apiClient.post<MaintenanceGstResult>('/accounting/gst/calculate', req);
}

export async function calculateVendorTds(req: VendorTdsRequest): Promise<VendorTdsResult> {
  return apiClient.post<VendorTdsResult>('/accounting/tds/calculate', req);
}

export async function recalculateMidFy(payload: {
  societyId: number;
  fyCode: string;
  ruleFamily: string;
  targetRuleVersionId: string;
  fromDate: string;
  toDate: string;
}): Promise<RecalculationBatch> {
  return apiClient.post<RecalculationBatch>('/accounting/recalculate', payload);
}

export async function listAuditEntries(societyId: number): Promise<AuditLedgerEntry[]> {
  return apiClient.get<AuditLedgerEntry[]>('/accounting/audit-chain/entries', {
    params: { societyId },
  });
}

export async function verifyAuditChain(societyId: number): Promise<AuditChainVerification> {
  return apiClient.get<AuditChainVerification>('/accounting/audit-chain/verify', {
    params: { societyId },
  });
}

export async function getTallySummary(societyId: number): Promise<TallySyncSummary> {
  return apiClient.get<TallySyncSummary>('/accounting/tally-sync/summary', {
    params: { societyId },
  });
}

export async function getTallyOutbox(societyId: number): Promise<TallyOutboxItem[]> {
  return apiClient.get<TallyOutboxItem[]>('/accounting/tally-sync/outbox', {
    params: { societyId },
  });
}

export async function acknowledgeTallyPush(payload: {
  societyId: number;
  voucherId: string;
  tallyGuid: string;
  tallyAlterId: number;
}): Promise<void> {
  await apiClient.post<void>('/accounting/tally-sync/ack', payload);
}

export async function listTallyConflicts(societyId: number): Promise<TallySyncConflict[]> {
  return apiClient.get<TallySyncConflict[]>('/accounting/tally-sync/conflicts', {
    params: { societyId },
  });
}

export async function resolveTallyConflict(
  conflictId: string,
  societyId: number,
  resolutionAction: 'REVERT_TALLY' | 'ACCEPT_REVERSAL',
): Promise<void> {
  await apiClient.post<void>(`/accounting/tally-sync/conflicts/${conflictId}/resolve`, {
    societyId,
    resolutionAction,
  });
}
