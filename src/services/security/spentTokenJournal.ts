/**
 * Persistent Spent-Token Anti-Replay Journal for offline Web Guard Kiosks.
 * Prevents screenshot replays of single-use visitor QR codes while offline.
 */
export interface SpentQrEntry {
  jti: string;
  passCode: string;
  gate: string;
  spentAt: string;
  expiresAtEpochSec: number;
}

const STORAGE_KEY = "mana_guard_spent_qr_v1";

function readAll(): Record<string, SpentQrEntry> {
  if (typeof localStorage === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, SpentQrEntry>) : {};
  } catch {
    return {};
  }
}

function writeAll(map: Record<string, SpentQrEntry>): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export const spentTokenJournal = {
  /**
   * Checks if a scanned QR `jti` (or `passCode`) was already consumed locally
   * (prevents screenshot replay on offline tablets).
   */
  isAlreadySpent(tokenId: string): SpentQrEntry | null {
    if (!tokenId) return null;
    const all = readAll();
    return all[tokenId] ?? null;
  },

  /**
   * Atomically commits the token as spent BEFORE flashing Gate Cleared UI.
   * Returns `{ allowed: true }` on first scan, or `{ allowed: false, prior }` on replay.
   */
  consumeOnce(params: {
    jti: string;
    passCode: string;
    gate: string;
    expiresAtEpochSec?: number;
  }): { allowed: boolean; prior?: SpentQrEntry } {
    const existing = this.isAlreadySpent(params.jti);
    if (existing) {
      return { allowed: false, prior: existing };
    }

    const nowSec = Math.floor(Date.now() / 1000);
    const all = readAll();

    // Prune already-expired JTIs to keep journal compact
    for (const [k, v] of Object.entries(all)) {
      if (v.expiresAtEpochSec > 0 && v.expiresAtEpochSec < nowSec) {
        delete all[k];
      }
    }

    const entry: SpentQrEntry = {
      jti: params.jti,
      passCode: params.passCode,
      gate: params.gate,
      spentAt: new Date().toISOString(),
      expiresAtEpochSec: params.expiresAtEpochSec ?? nowSec + 43_200,
    };
    all[params.jti] = entry;
    writeAll(all);
    return { allowed: true };
  },

  clear(): void {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
  },
};
