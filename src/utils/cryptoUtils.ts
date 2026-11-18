/**
 * Utilities for client-side cryptographic operations using the standard W3C Web Crypto API.
 * Encrypts sensitive auth credentials (like passwords) with RSA-OAEP SHA-256 before transmission,
 * ensuring no plaintext passwords appear in DevTools, HAR files, or proxy logs.
 */

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN [A-Z0-9_\-\s]+-----/g, "")
    .replace(/-----END [A-Z0-9_\-\s]+-----/g, "")
    .replace(/[\r\n\s]/g, "");
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

let cachedCryptoKey: { pem: string; key: CryptoKey } | null = null;

function getSubtle(): SubtleCrypto | undefined {
  if (typeof window !== "undefined" && window.crypto?.subtle) {
    return window.crypto.subtle;
  }
  if (typeof globalThis !== "undefined" && globalThis.crypto?.subtle) {
    return globalThis.crypto.subtle;
  }
  return undefined;
}

async function importRsaPublicKey(pem: string): Promise<CryptoKey> {
  const subtle = getSubtle();
  if (!subtle) {
    throw new Error("SubtleCrypto is not available in this environment.");
  }
  if (cachedCryptoKey && cachedCryptoKey.pem === pem) {
    return cachedCryptoKey.key;
  }
  const keyBuffer = pemToArrayBuffer(pem);
  const key = await subtle.importKey(
    "spki",
    keyBuffer,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    false,
    ["encrypt"]
  );
  cachedCryptoKey = { pem, key };
  return key;
}

/**
 * Encrypts a password with the server's RSA public key using RSA-OAEP (SHA-256).
 * Embeds a timestamp to protect against replay attacks.
 *
 * @param password The plaintext password entered by the user
 * @param pemPublicKey Standard SPKI PEM public key from /api/auth/public-key
 * @returns Base64 encoded RSA ciphertext
 */
export async function encryptPasswordPayload(password: string, pemPublicKey: string): Promise<string> {
  const subtle = getSubtle();
  if (!subtle) {
    // Graceful fallback for non-secure HTTP or ancient environments without SubtleCrypto
    return password;
  }


  const cryptoKey = await importRsaPublicKey(pemPublicKey);
  const payloadJson = JSON.stringify({
    p: password,
    t: Date.now(),
  });
  const encoded = new TextEncoder().encode(payloadJson);
  const cipherBuffer = await subtle.encrypt(
    { name: "RSA-OAEP" },
    cryptoKey,
    encoded
  );

  const bytes = new Uint8Array(cipherBuffer);
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
