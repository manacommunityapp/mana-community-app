import apiClient from '../apiClient';
import type {
  FlatTabAccount,
  GuestAccessPass,
  GuestPassQuote,
  IssueGuestPassesResponse,
  OfflineOrderQueueItem,
  OfflineSyncResult,
  PosAuthMethod,
  PosAuthorizationResponse,
  PosDailyBatch,
  PosOrder,
  PosTabChallenge,
  SettlementMode,
  TurnstileValidateResponse,
} from '../../types/clubhouse';

const OFFLINE_OUTBOX_KEY = 'mana_clubhouse_pos_offline_outbox_v1';

export function formatRupees(paise: number): string {
  return `₹${(paise / 100).toFixed(2)}`;
}

export function loadOfflinePosOutbox(): OfflineOrderQueueItem[] {
  try {
    const raw = localStorage.getItem(OFFLINE_OUTBOX_KEY);
    return raw ? (JSON.parse(raw) as OfflineOrderQueueItem[]) : [];
  } catch {
    return [];
  }
}

export function enqueueOfflinePosOrder(
  item: OfflineOrderQueueItem,
  cachedAvailablePaise: number,
  offlineFloorCapPaise: number,
): OfflineOrderQueueItem[] {
  const totalPaise = item.subtotalPaise + item.gstPaise;
  const maxAllowed = Math.min(Math.floor(cachedAvailablePaise * 0.5), offlineFloorCapPaise);
  if (totalPaise > maxAllowed) {
    throw new Error(
      `Offline cap exceeded (${formatRupees(totalPaise)} > ${formatRupees(maxAllowed)} floor limit)`,
    );
  }
  const current = loadOfflinePosOutbox();
  if (!current.some((x) => x.clientTxUuid === item.clientTxUuid)) {
    const updated = [item, ...current];
    localStorage.setItem(OFFLINE_OUTBOX_KEY, JSON.stringify(updated));
    return updated;
  }
  return current;
}

export function clearOfflinePosOutbox(): void {
  try {
    localStorage.removeItem(OFFLINE_OUTBOX_KEY);
  } catch {
    // ignore storage errors
  }
}

export async function getFlatTabAccount(
  societyId: number,
  flatId: number,
  unitCode = 'Tower A - 1204',
): Promise<FlatTabAccount> {
  return apiClient.get<FlatTabAccount>('/clubhouse/pos/account', {
    params: { societyId, flatId, unitCode },
  });
}

export async function authorizePosOrder(payload: {
  societyId: number;
  flatId: number;
  unitCode: string;
  terminalId: string;
  outletName: string;
  clientTxUuid: string;
  itemsSummary: string;
  subtotalPaise: number;
  gstPaise: number;
  settlementMode: SettlementMode;
  authMethod: PosAuthMethod;
  pin?: string;
  offlineTotpQr?: string;
}): Promise<PosAuthorizationResponse> {
  return apiClient.post<PosAuthorizationResponse>('/clubhouse/pos/authorize', payload);
}

export async function listPendingChallenges(
  societyId: number,
  flatId: number,
): Promise<PosTabChallenge[]> {
  return apiClient.get<PosTabChallenge[]>('/clubhouse/pos/challenges', {
    params: { societyId, flatId },
  });
}

export async function resolvePushChallenge(
  challengeId: string,
  approvedBy: string,
  approve: boolean,
): Promise<PosAuthorizationResponse> {
  return apiClient.post<PosAuthorizationResponse>(`/clubhouse/pos/challenges/${challengeId}/approve`, {
    approvedBy,
    approve,
  });
}

export async function syncOfflinePosOrders(
  societyId: number,
  items: OfflineOrderQueueItem[],
): Promise<OfflineSyncResult> {
  const result = await apiClient.post<OfflineSyncResult>('/clubhouse/pos/offline-sync', {
    societyId,
    items,
  });
  clearOfflinePosOutbox();
  return result;
}

export async function listPosOrders(societyId: number): Promise<PosOrder[]> {
  return apiClient.get<PosOrder[]>('/clubhouse/pos/orders', { params: { societyId } });
}

export async function reconcileDailyBatch(
  societyId: number,
  terminalId: string,
  businessDate: string,
): Promise<PosDailyBatch> {
  return apiClient.post<PosDailyBatch>('/clubhouse/pos/batches/reconcile', {
    societyId,
    terminalId,
    businessDate,
  });
}

export async function listDailyBatches(societyId: number): Promise<PosDailyBatch[]> {
  return apiClient.get<PosDailyBatch[]>('/clubhouse/pos/batches', { params: { societyId } });
}

export async function quoteGuestPasses(payload: {
  societyId: number;
  facilityCode: string;
  flatId: number;
  visitDate: string;
  guestCount: number;
}): Promise<GuestPassQuote> {
  return apiClient.post<GuestPassQuote>('/clubhouse/passes/quote', payload);
}

export async function issueGuestPasses(payload: {
  societyId: number;
  facilityCode: string;
  flatId: number;
  unitCode: string;
  visitDate: string;
  guestNames: string[];
  guestPhone?: string;
  paymentMode?: string;
}): Promise<IssueGuestPassesResponse> {
  return apiClient.post<IssueGuestPassesResponse>('/clubhouse/passes/issue', payload);
}

export async function listGuestPasses(
  societyId: number,
  flatId: number,
  billingMonth?: string,
): Promise<GuestAccessPass[]> {
  return apiClient.get<GuestAccessPass[]>('/clubhouse/passes', {
    params: { societyId, flatId, billingMonth },
  });
}

export async function cancelGuestPass(passId: string): Promise<GuestAccessPass> {
  return apiClient.post<GuestAccessPass>(`/clubhouse/passes/${passId}/cancel`);
}

export async function validateTurnstileScan(payload: {
  societyId: number;
  facilityCode: string;
  turnstileId: string;
  qrToken: string;
}): Promise<TurnstileValidateResponse> {
  return apiClient.post<TurnstileValidateResponse>('/clubhouse/turnstile/validate', payload);
}
