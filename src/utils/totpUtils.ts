/**
 * Client-side TOTP implementation (RFC 6238)
 * Uses Web Crypto API HMAC-SHA-1 for HOTP generation.
 * 30-second time window, 6-digit output.
 */

function getSubtle(): SubtleCrypto {
  if (typeof window !== 'undefined' && window.crypto?.subtle) return window.crypto.subtle;
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.subtle) return globalThis.crypto.subtle;
  throw new Error('SubtleCrypto not available');
}

/** Decode base64url string to Uint8Array */
function base64urlDecode(str: string): Uint8Array<ArrayBuffer> {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** Encode Uint8Array to base64url */
export function base64urlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/** HOTP counter to 8-byte big-endian buffer */
function counterToBuffer(counter: number): Uint8Array<ArrayBuffer> {
  const buf = new Uint8Array(8);
  let val = counter;
  for (let i = 7; i >= 0; i--) {
    buf[i] = val & 0xff;
    val = Math.floor(val / 256);
  }
  return buf;
}

/**
 * Generate a TOTP code for the given base64url-encoded secret and unix timestamp.
 * @param secretBase64url - base64url TOTP secret
 * @param unixSeconds - current time in seconds (default: Date.now()/1000)
 * @param digits - number of digits (default: 6)
 * @param period - time window in seconds (default: 30)
 */
export async function generateTotp(
  secretBase64url: string,
  unixSeconds: number = Math.floor(Date.now() / 1000),
  digits = 6,
  period = 30,
): Promise<string> {
  const subtle = getSubtle();
  const secretBytes = base64urlDecode(secretBase64url);
  const counter = Math.floor(unixSeconds / period);
  const counterBytes = counterToBuffer(counter);

  const key = await subtle.importKey(
    'raw',
    secretBytes,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign'],
  );

  const signature = await subtle.sign('HMAC', key, counterBytes);
  const hash = new Uint8Array(signature);

  // Dynamic truncation (RFC 4226 §5.4)
  const offset = hash[hash.length - 1] & 0x0f;
  const code =
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff);

  const otp = code % Math.pow(10, digits);
  return otp.toString().padStart(digits, '0');
}

/**
 * Returns the TOTP counter value at a given time (useful for clock-skew tolerance checks).
 */
export function getTotpCounter(unixSeconds: number, period = 30): number {
  return Math.floor(unixSeconds / period);
}

/**
 * Seconds remaining in the current TOTP window.
 */
export function totpSecondsRemaining(period = 30): number {
  return period - (Math.floor(Date.now() / 1000) % period);
}

/**
 * Verify a TOTP code with ±1 step tolerance for clock skew.
 * Returns true if the code is valid for the current, previous, or next window.
 */
export async function verifyTotp(
  secretBase64url: string,
  candidateCode: string,
  unixSeconds: number = Math.floor(Date.now() / 1000),
  digits = 6,
  period = 30,
): Promise<boolean> {
  for (const offset of [-1, 0, 1]) {
    const expected = await generateTotp(secretBase64url, unixSeconds + offset * period, digits, period);
    if (expected === candidateCode) return true;
  }
  return false;
}
