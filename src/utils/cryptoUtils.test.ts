import { describe, it, expect } from "vitest";
import { encryptPasswordPayload } from "./cryptoUtils";

describe("cryptoUtils - Client-Side Password Encryption", () => {
  it("encrypts password using RSA public key into an RSA-OAEP ciphertext", async () => {
    const subtle = globalThis.crypto?.subtle;
    expect(subtle).toBeDefined();

    // Generate a test RSA-2048 key pair using Web Crypto API in Node test environment
    const keyPair = await subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["encrypt", "decrypt"]
    );

    const exportedSpki = await subtle.exportKey("spki", keyPair.publicKey);

    const b64 = btoa(String.fromCharCode(...new Uint8Array(exportedSpki)));
    const pem = `-----BEGIN PUBLIC KEY-----\n${b64}\n-----END PUBLIC KEY-----`;

    const rawPassword = "SuperSecretPassword123!@#";
    const encrypted = await encryptPasswordPayload(rawPassword, pem);

    expect(encrypted).toBeDefined();
    expect(encrypted).not.toEqual(rawPassword);
    expect(typeof encrypted).toBe("string");
    expect(encrypted.length).toBeGreaterThan(100);

    // Verify it can be decrypted back with the private key
    const cipherBytes = Uint8Array.from(atob(encrypted), (c) => c.charCodeAt(0));
    const decryptedBuffer = await subtle.decrypt(
      { name: "RSA-OAEP" },
      keyPair.privateKey,
      cipherBytes
    );
    const decryptedJson = JSON.parse(new TextDecoder().decode(decryptedBuffer));
    expect(decryptedJson.p).toEqual(rawPassword);
    expect(typeof decryptedJson.t).toBe("number");
    expect(Date.now() - decryptedJson.t).toBeLessThan(1000);
  });
});
