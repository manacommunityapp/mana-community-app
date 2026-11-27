import { describe, it, expect } from 'vitest';
import {
  base64urlEncode,
  generateTotp,
  verifyTotp,
  getTotpCounter,
  totpSecondsRemaining,
} from './totpUtils';

describe('totpUtils - RFC 6238 TOTP', () => {
  it('generates standard RFC 6238 SHA-1 test vector for 59s', async () => {
    // RFC 6238 test secret: ASCII "12345678901234567890" (20 bytes)
    const secretBytes = new TextEncoder().encode('12345678901234567890');
    const secretB64u = base64urlEncode(secretBytes);

    // At T = 59s, RFC 6238 8-digit SHA-1 value is 94287082, so 6-digit is 287082
    const otp6 = await generateTotp(secretB64u, 59, 6, 30);
    expect(otp6).toBe('287082');

    const otp8 = await generateTotp(secretB64u, 59, 8, 30);
    expect(otp8).toBe('94287082');
  });

  it('verifies OTP within ±1 window and rejects stale OTPs', async () => {
    const secretBytes = new TextEncoder().encode('mana-voucher-totp-secret-key-123');
    const secretB64u = base64urlEncode(secretBytes);

    const now = 1732730010;
    const currentOtp = await generateTotp(secretB64u, now);
    const prevOtp = await generateTotp(secretB64u, now - 30);
    const nextOtp = await generateTotp(secretB64u, now + 30);
    const staleOtp = await generateTotp(secretB64u, now - 90);

    expect(await verifyTotp(secretB64u, currentOtp, now)).toBe(true);
    expect(await verifyTotp(secretB64u, prevOtp, now)).toBe(true);
    expect(await verifyTotp(secretB64u, nextOtp, now)).toBe(true);
    expect(await verifyTotp(secretB64u, staleOtp, now)).toBe(false);
    expect(await verifyTotp(secretB64u, '000000', now)).toBe(staleOtp === '000000' || currentOtp === '000000');
  });

  it('computes counter and remaining seconds cleanly', () => {
    expect(getTotpCounter(60, 30)).toBe(2);
    expect(getTotpCounter(89, 30)).toBe(2);
    expect(getTotpCounter(90, 30)).toBe(3);

    const rem = totpSecondsRemaining(30);
    expect(rem).toBeGreaterThanOrEqual(1);
    expect(rem).toBeLessThanOrEqual(30);
  });
});
