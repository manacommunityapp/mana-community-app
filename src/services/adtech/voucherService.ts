import apiClient from '../apiClient';
import type {
  SampleVoucher,
  KioskScanResult,
  RedemptionSyncPayload,
  RedemptionSyncResult,
  LocalRedemptionRecord,
} from '../../types/voucher';

// --- Resident-facing ---

export async function listAvailableVouchers(societyId: string): Promise<SampleVoucher[]> {
  return apiClient.get<SampleVoucher[]>('/vouchers', { params: { societyId } });
}

export async function getVoucher(voucherId: string): Promise<SampleVoucher> {
  return apiClient.get<SampleVoucher>(`/vouchers/${voucherId}`);
}

/**
 * Claim a voucher for the authenticated resident.
 * Returns the voucher with signedToken populated (contains TOTP secret for QR generation).
 * One claim per resident per campaign — backend enforces this.
 */
export async function claimVoucher(voucherId: string): Promise<SampleVoucher> {
  return apiClient.post<SampleVoucher>(`/vouchers/${voucherId}/claim`);
}

export async function getMyClaimedVouchers(): Promise<SampleVoucher[]> {
  return apiClient.get<SampleVoucher[]>('/vouchers/my-claims');
}

// --- Kiosk-facing ---

/**
 * Online verification: kiosk sends scanned QR string to backend for authoritative check.
 * Use when online; falls back to offline local verify when offline.
 */
export async function verifyQrOnline(qrString: string, kioskId: string): Promise<KioskScanResult> {
  return apiClient.post<KioskScanResult>('/vouchers/kiosk/verify', { qrString, kioskId });
}

/**
 * Sync offline redemptions to backend.
 * Backend returns conflicts (same voucher redeemed at another kiosk earlier).
 */
export async function syncRedemptions(payload: RedemptionSyncPayload): Promise<RedemptionSyncResult> {
  return apiClient.post<RedemptionSyncResult>('/vouchers/kiosk/sync', payload);
}

// --- Local offline redemption store (localStorage-backed for web kiosk) ---

const DB_KEY = 'mana_kiosk_redemptions';
const CAMPAIGN_KEYS_STORAGE = 'mana_kiosk_campaign_totp_seeds';

export function loadLocalRedemptions(): LocalRedemptionRecord[] {
  try {
    const raw = localStorage.getItem(DB_KEY);
    return raw ? (JSON.parse(raw) as LocalRedemptionRecord[]) : [];
  } catch {
    return [];
  }
}

export function saveLocalRedemption(record: LocalRedemptionRecord): void {
  const existing = loadLocalRedemptions();
  const idx = existing.findIndex(r => r.vid === record.vid);
  if (idx >= 0) {
    existing[idx] = record;
  } else {
    existing.push(record);
  }
  localStorage.setItem(DB_KEY, JSON.stringify(existing));
}

export function isRedeemedLocally(vid: string): LocalRedemptionRecord | null {
  return loadLocalRedemptions().find(r => r.vid === vid) ?? null;
}

export function markSynced(vid: string): void {
  const records = loadLocalRedemptions();
  const record = records.find(r => r.vid === vid);
  if (record) {
    record.synced = true;
    localStorage.setItem(DB_KEY, JSON.stringify(records));
  }
}

export function applySyncResult(result: RedemptionSyncResult): void {
  const records = loadLocalRedemptions();
  const acceptedSet = new Set(result.accepted);
  const conflictSet = new Set(result.conflicts.map(c => c.vid));

  let changed = false;
  for (const record of records) {
    if (acceptedSet.has(record.vid)) {
      record.synced = true;
      record.conflicted = false;
      changed = true;
    } else if (conflictSet.has(record.vid)) {
      record.synced = true;
      record.conflicted = true;
      changed = true;
    }
  }

  if (changed) {
    localStorage.setItem(DB_KEY, JSON.stringify(records));
  }
}

export function getPendingSyncRecords(): LocalRedemptionRecord[] {
  return loadLocalRedemptions().filter(r => !r.synced);
}

export function getCachedCampaignTotpSecret(campaignId: string): string | null {
  try {
    const raw = localStorage.getItem(CAMPAIGN_KEYS_STORAGE);
    if (!raw) return null;
    const map = JSON.parse(raw) as Record<string, string>;
    return map[campaignId] ?? null;
  } catch {
    return null;
  }
}
