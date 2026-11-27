import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { spentTokenJournal } from "./spentTokenJournal";

const memStorage = new Map<string, string>();
beforeAll(() => {
  if (typeof globalThis.localStorage === "undefined") {
    Object.defineProperty(globalThis, "localStorage", {
      value: {
        getItem: (k: string) => memStorage.get(k) ?? null,
        setItem: (k: string, v: string) => memStorage.set(k, String(v)),
        removeItem: (k: string) => memStorage.delete(k),
        clear: () => memStorage.clear(),
      },
      configurable: true,
    });
  }
});

describe("Guard Tablet Spent-Token Anti-Replay Journal", () => {
  beforeEach(() => {
    memStorage.clear();
    spentTokenJournal.clear();
  });

  it("allows first QR check-in and rejects screenshot replay immediately offline", () => {
    const first = spentTokenJournal.consumeOnce({
      jti: "jti_9911aabb",
      passCode: "MANA-4411",
      gate: "Main Gate",
      expiresAtEpochSec: Math.floor(Date.now() / 1000) + 3600,
    });
    expect(first.allowed).toBe(true);

    // Screenshot replay 5 seconds later on same offline tablet
    const replay = spentTokenJournal.consumeOnce({
      jti: "jti_9911aabb",
      passCode: "MANA-4411",
      gate: "South Gate",
    });
    expect(replay.allowed).toBe(false);
    expect(replay.prior?.gate).toBe("Main Gate");
  });
});
