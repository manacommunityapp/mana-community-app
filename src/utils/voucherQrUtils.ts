/**
 * Voucher QR string format:
 *   MANA:v1:{payloadB64url}.{hmacSuffix}.{totpCode}
 *
 * - payloadB64url: base64url(JSON.stringify(VoucherTokenPayload))
 * - hmacSuffix:    first 16 bytes of HMAC-SHA256, base64url encoded (issued by backend)
 * - totpCode:      current 6-digit TOTP (rotates every 30s)
 */

import type { VoucherTokenPayload, SignedVoucherToken } from '../types/voucher';

export const QR_PREFIX = 'MANA:v1:';

/** Encode the signed token + live TOTP into a QR string */
export function encodeQrString(token: SignedVoucherToken, totpCode: string): string {
  const payloadJson = JSON.stringify(token.payload);
  const payloadB64 = btoa(payloadJson)
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  return `${QR_PREFIX}${payloadB64}.${token.hmacSuffix}.${totpCode}`;
}

/** Parse a QR string back into its three parts; returns null if malformed */
export interface ParsedQr {
  payloadB64: string;
  hmacSuffix: string;
  totpCode: string;
  payload: VoucherTokenPayload;
}

export function parseQrString(qrString: string): ParsedQr | null {
  try {
    if (!qrString.startsWith(QR_PREFIX)) return null;
    const body = qrString.slice(QR_PREFIX.length);
    const parts = body.split('.');
    if (parts.length !== 3) return null;
    const [payloadB64, hmacSuffix, totpCode] = parts;
    const base64 = payloadB64.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const payload: VoucherTokenPayload = JSON.parse(atob(padded));
    return { payloadB64, hmacSuffix, totpCode, payload };
  } catch {
    return null;
  }
}

/** Check if a voucher token is expired */
export function isVoucherExpired(payload: VoucherTokenPayload): boolean {
  return Math.floor(Date.now() / 1000) > payload.exp;
}

/** Format seconds-remaining into a MM:SS countdown string */
export function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}
