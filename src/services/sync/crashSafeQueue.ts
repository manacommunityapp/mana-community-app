import type { SyncEntityType, SyncOperation } from "./offlineSyncService";

export type QueueEntryStatus = "PENDING" | "IN_FLIGHT" | "CONFLICT" | "FAILED";

export interface GuardWalEntry {
  seqId: number;
  clientMutationId: string;
  entityType: SyncEntityType;
  entityId?: number;
  operation: SyncOperation;
  payloadJson: string;
  clientTimestamp: string;
  status: QueueEntryStatus;
  retryCount: number;
  lastError?: string;
  conflictAt?: string;
}

export type DrainOutcome = "APPLIED" | "CONFLICT" | "RETRYABLE_ERROR";

export interface DrainSummary {
  processed: number;
  applied: number;
  conflicts: number;
  haltedOnTransientError: boolean;
}

const DB_NAME = "mana_guard_wal_v1";
const DB_VERSION = 1;
const STORE_NAME = "fifo_queue";
const FALLBACK_QUEUE_KEY = "mana_guard_wal_fallback_v1";
const FALLBACK_SEQ_KEY = "mana_guard_wal_seq_v1";
const MAX_TRANSIENT_RETRIES = 10;

let inProcessMutex: Promise<void> = Promise.resolve();

function runWithInProcessMutex<T>(fn: () => Promise<T>): Promise<T> {
  const res = inProcessMutex.then(fn);
  inProcessMutex = res.then(() => {}, () => {});
  return res;
}

/**
 * Acquires a cross-tab exclusive Web Lock (`navigator.locks`) when running in
 * a browser so two guard kiosk tabs cannot drain the same FIFO queue concurrently.
 */
async function withDrainLock<T>(fn: () => Promise<T>): Promise<T> {
  const nav = typeof navigator !== "undefined" ? (navigator as unknown as { locks?: { request: (name: string, cb: () => Promise<T>) => Promise<T> } }) : undefined;
  if (nav?.locks && typeof nav.locks.request === "function") {
    return nav.locks.request("mana_guard_fifo_drain", () => runWithInProcessMutex(fn));
  }
  return runWithInProcessMutex(fn);
}

function hasIndexedDb(): boolean {
  return typeof indexedDB !== "undefined";
}

function openWalDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "seqId", autoIncrement: true });
        store.createIndex("status", "status", { unique: false });
        store.createIndex("clientMutationId", "clientMutationId", { unique: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("Failed to open IndexedDB WAL"));
  });
}

function readFallbackAll(): GuardWalEntry[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(FALLBACK_QUEUE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.sort((a, b) => a.seqId - b.seqId) : [];
  } catch {
    return [];
  }
}

function writeFallbackAll(entries: GuardWalEntry[]): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(FALLBACK_QUEUE_KEY, JSON.stringify(entries.sort((a, b) => a.seqId - b.seqId)));
}

function nextFallbackSeqId(): number {
  if (typeof localStorage === "undefined") return Date.now();
  const prev = parseInt(localStorage.getItem(FALLBACK_SEQ_KEY) ?? "0", 10) || 0;
  const next = prev + 1;
  localStorage.setItem(FALLBACK_SEQ_KEY, String(next));
  return next;
}

class CrashSafeFifoQueue {
  private listeners = new Set<() => void>();

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((fn) => {
      try { fn(); } catch {}
    });
  }

  async getAll(): Promise<GuardWalEntry[]> {
    if (!hasIndexedDb()) {
      return readFallbackAll();
    }
    const db = await openWalDb();
    try {
      return await new Promise<GuardWalEntry[]>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => {
          const items = (req.result as GuardWalEntry[]) ?? [];
          resolve(items.sort((a, b) => a.seqId - b.seqId));
        };
        req.onerror = () => reject(req.error);
      });
    } finally {
      db.close();
    }
  }

  async getPending(): Promise<GuardWalEntry[]> {
    const all = await this.getAll();
    return all.filter((e) => e.status === "PENDING" || e.status === "IN_FLIGHT");
  }

  async getConflicts(): Promise<GuardWalEntry[]> {
    const all = await this.getAll();
    return all.filter((e) => e.status === "CONFLICT" || e.status === "FAILED");
  }

  async enqueue(input: {
    entityType: SyncEntityType;
    entityId?: number;
    operation: SyncOperation;
    payloadJson: string;
    clientMutationId?: string;
    clientTimestamp?: string;
  }): Promise<GuardWalEntry> {
    const baseRecord: Omit<GuardWalEntry, "seqId"> = {
      clientMutationId: input.clientMutationId ?? `mut_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`,
      entityType: input.entityType,
      entityId: input.entityId,
      operation: input.operation,
      payloadJson: input.payloadJson,
      clientTimestamp: input.clientTimestamp ?? new Date().toISOString(),
      status: "PENDING",
      retryCount: 0,
    };

    const inserted = await runWithInProcessMutex(async () => {
      if (!hasIndexedDb()) {
        const entry: GuardWalEntry = { ...baseRecord, seqId: nextFallbackSeqId() };
        const list = readFallbackAll();
        list.push(entry);
        writeFallbackAll(list);
        return entry;
      }

      const db = await openWalDb();
      try {
        return await new Promise<GuardWalEntry>((resolve, reject) => {
          const tx = db.transaction(STORE_NAME, "readwrite");
          const store = tx.objectStore(STORE_NAME);
          const req = store.add(baseRecord);
          req.onsuccess = () => {
            const seqId = Number(req.result);
            resolve({ ...baseRecord, seqId });
          };
          req.onerror = () => reject(req.error);
        });
      } finally {
        db.close();
      }
    });

    this.notify();
    return inserted;
  }

  private async putEntry(entry: GuardWalEntry): Promise<void> {
    if (!hasIndexedDb()) {
      const list = readFallbackAll().filter((x) => x.seqId !== entry.seqId);
      list.push(entry);
      writeFallbackAll(list);
      return;
    }
    const db = await openWalDb();
    try {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        tx.objectStore(STORE_NAME).put(entry);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } finally {
      db.close();
    }
  }

  async removeBySeqId(seqId: number): Promise<void> {
    if (!hasIndexedDb()) {
      writeFallbackAll(readFallbackAll().filter((e) => e.seqId !== seqId));
      this.notify();
      return;
    }
    const db = await openWalDb();
    try {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        tx.objectStore(STORE_NAME).delete(seqId);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } finally {
      db.close();
    }
    this.notify();
  }

  async clearAll(): Promise<void> {
    if (!hasIndexedDb()) {
      writeFallbackAll([]);
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem(FALLBACK_SEQ_KEY);
      }
      this.notify();
      return;
    }
    const db = await openWalDb();
    try {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        tx.objectStore(STORE_NAME).clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } finally {
      db.close();
    }
    this.notify();
  }

  /**
   * Crash Recovery: resets any WAL records stuck in `IN_FLIGHT` from a killed
   * process or battery drop back to `PENDING` so they re-enter FIFO draining
   * at the head with their original `clientMutationId`.
   */
  async rehydrateInFlight(): Promise<number> {
    const all = await this.getAll();
    let recovered = 0;
    for (const item of all) {
      if (item.status === "IN_FLIGHT") {
        await this.putEntry({ ...item, status: "PENDING" });
        recovered++;
      }
    }
    if (recovered > 0) this.notify();
    return recovered;
  }

  /**
   * Moves a Dead-Letter Queue conflict back into FIFO queue for retry.
   */
  async retryConflict(seqId: number): Promise<void> {
    const all = await this.getAll();
    const target = all.find((x) => x.seqId === seqId);
    if (!target) return;
    await this.putEntry({
      ...target,
      status: "PENDING",
      retryCount: 0,
      lastError: undefined,
      conflictAt: undefined,
    });
    this.notify();
  }

  /**
   * Drains the queue in strict monotonic `seqId ASC` FIFO order under a
   * cross-tab Web Lock. Halts immediately on transient network/5xx failure so
   * later operations cannot overtake earlier ones; isolates 409/4xx conflicts
   * into the Dead-Letter Queue so gate traffic remains unblocked.
   */
  async drainFifo(
    executor: (entry: GuardWalEntry) => Promise<{ outcome: DrainOutcome; errorMessage?: string }>
  ): Promise<DrainSummary> {
    return withDrainLock(async () => {
      await this.rehydrateInFlight();

      const pending = (await this.getAll())
        .filter((e) => e.status === "PENDING")
        .sort((a, b) => a.seqId - b.seqId);

      const summary: DrainSummary = {
        processed: 0,
        applied: 0,
        conflicts: 0,
        haltedOnTransientError: false,
      };

      for (const entry of pending) {
        summary.processed++;

        // Transition to IN_FLIGHT atomically before network dispatch
        const inFlightEntry: GuardWalEntry = { ...entry, status: "IN_FLIGHT" };
        await this.putEntry(inFlightEntry);

        let result: { outcome: DrainOutcome; errorMessage?: string };
        try {
          result = await executor(inFlightEntry);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Network or transport failure";
          result = { outcome: "RETRYABLE_ERROR", errorMessage: msg };
        }

        if (result.outcome === "APPLIED") {
          await this.removeBySeqId(entry.seqId);
          summary.applied++;
          continue;
        }

        if (result.outcome === "CONFLICT") {
          await this.putEntry({
            ...inFlightEntry,
            status: "CONFLICT",
            retryCount: entry.retryCount + 1,
            lastError: result.errorMessage ?? "Server conflict (moved to Dead-Letter Queue)",
            conflictAt: new Date().toISOString(),
          });
          summary.conflicts++;
          this.notify();
          // Non-blocking: subsequent visitors/deliveries can drain now that poison item is isolated
          continue;
        }

        // Transient failure -> increment retryCount, reset to PENDING (or FAILED if exhausted), and HALT FIFO
        const nextRetry = entry.retryCount + 1;
        await this.putEntry({
          ...inFlightEntry,
          status: nextRetry >= MAX_TRANSIENT_RETRIES ? "FAILED" : "PENDING",
          retryCount: nextRetry,
          lastError: result.errorMessage ?? "Transient error awaiting retry",
        });
        summary.haltedOnTransientError = true;
        this.notify();
        break;
      }

      return summary;
    });
  }
}

export const crashSafeQueue = new CrashSafeFifoQueue();
