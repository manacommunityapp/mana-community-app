// Voucher token payload (embedded in QR)
export interface VoucherTokenPayload {
  v: 1;                           // schema version
  vid: string;                    // voucher ID
  uid: string;                    // resident user ID
  cid: string;                    // campaign ID
  sid: string;                    // society ID
  iat: number;                    // issued-at epoch seconds
  exp: number;                    // expiry epoch seconds
  nonce: string;                  // 8-char random
}

// Full signed voucher token (what gets QR-encoded)
export interface SignedVoucherToken {
  payload: VoucherTokenPayload;
  hmacSuffix: string;             // base64url(HMAC-SHA256[:16])
  totpSecret: string;             // base64url TOTP secret (from server, stored encrypted)
}

// Voucher as displayed to resident
export type VoucherStatus = 'UNCLAIMED' | 'CLAIMED' | 'REDEEMED' | 'EXPIRED' | 'CANCELLED';

export interface SampleVoucher {
  id: string;
  campaignId: string;
  campaignName: string;
  brandName: string;
  brandLogoUrl?: string;
  productName: string;
  productImageUrl?: string;
  description?: string;
  validFrom: string;
  validUntil: string;
  claimDeadline?: string;
  societyId: string;
  kioskLocation?: string;         // e.g. "Clubhouse Ground Floor"
  kioskOpenFrom?: string;         // ISO time
  kioskOpenUntil?: string;
  status: VoucherStatus;
  claimedAt?: string;
  redeemedAt?: string;
  signedToken?: SignedVoucherToken; // present after claim
}

// What the kiosk scanner sends back after a scan attempt
export type KioskVerificationStatus =
  | 'ACCEPTED'
  | 'REJECTED_SIGNATURE'
  | 'REJECTED_EXPIRED'
  | 'REJECTED_OTP_MISMATCH'
  | 'REJECTED_ALREADY_REDEEMED'
  | 'REJECTED_CAMPAIGN_ENDED'
  | 'CONFLICT_MULTI_KIOSK';

export interface KioskScanResult {
  status: KioskVerificationStatus;
  vid?: string;
  uid?: string;
  residentName?: string;
  unitNumber?: string;
  productName?: string;
  campaignName?: string;
  redeemedAt?: string;
  kioskId?: string;
  conflictKioskId?: string;       // if CONFLICT_MULTI_KIOSK
  message: string;
}

// Local redemption record (SQLite equivalent in-memory/IndexedDB for web kiosk)
export interface LocalRedemptionRecord {
  vid: string;
  uid: string;
  redeemedAt: number;             // epoch ms
  kioskId: string;
  synced: boolean;
  conflicted: boolean;
}

// Offline sync payload
export interface RedemptionSyncPayload {
  kioskId: string;
  records: LocalRedemptionRecord[];
  syncedAt: string;
}

export interface RedemptionSyncResult {
  accepted: string[];             // vids accepted by backend
  conflicts: Array<{ vid: string; firstKioskId: string; firstRedeemedAt: string }>;
  errors: string[];
}
