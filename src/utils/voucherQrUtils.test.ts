import { describe, it, expect } from 'vitest';
import {
  encodeQrString,
  parseQrString,
  isVoucherExpired,
  formatCountdown,
  QR_PREFIX,
} from './voucherQrUtils';
import type { SignedVoucherToken } from '../types/voucher';

describe('voucherQrUtils - QR Encoding & Parsing', () => {
  const sampleToken: SignedVoucherToken = {
    payload: {
      v: 1,
      vid: 'vch_a3b9c1d2',
      uid: 'res_7a3f2',
      cid: 'camp_001',
      sid: 'soc_hyd_001',
      iat: 1732730000,
      exp: Math.floor(Date.now() / 1000) + 3600,
      nonce: 'k9pX2mQr',
    },
    hmacSuffix: 'dGVzdGhtYWNzdWZmaXg',
    totpSecret: 'dGVzdHRvdHBzZWNyZXQ',
  };

  it('round-trips a signed voucher token and TOTP code', () => {
    const qr = encodeQrString(sampleToken, '482910');
    expect(qr.startsWith(QR_PREFIX)).toBe(true);

    const parsed = parseQrString(qr);
    expect(parsed).not.toBeNull();
    expect(parsed?.payload).toEqual(sampleToken.payload);
    expect(parsed?.hmacSuffix).toBe(sampleToken.hmacSuffix);
    expect(parsed?.totpCode).toBe('482910');
  });

  it('returns null for malformed QR strings', () => {
    expect(parseQrString('')).toBeNull();
    expect(parseQrString('OTHER:v1:abc.def.123456')).toBeNull();
    expect(parseQrString(`${QR_PREFIX}only-two.parts`)).toBeNull();
    expect(parseQrString(`${QR_PREFIX}!!!invalid-b64!!!.hmac.123456`)).toBeNull();
  });

  it('detects voucher expiry accurately', () => {
    expect(isVoucherExpired(sampleToken.payload)).toBe(false);
    expect(
      isVoucherExpired({
        ...sampleToken.payload,
        exp: Math.floor(Date.now() / 1000) - 10,
      })
    ).toBe(true);
  });

  it('formats countdowns as MM:SS', () => {
    expect(formatCountdown(0)).toBe('00:00');
    expect(formatCountdown(30)).toBe('00:30');
    expect(formatCountdown(95)).toBe('01:35');
  });
});
