import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { crashSafeQueue, type GuardWalEntry } from "./crashSafeQueue";

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

describe("Crash-Safe FIFO Guard WAL Queue (IndexedDB/WAL + Rehydration + DLQ)", () => {
  beforeEach(async () => {
    memStorage.clear();
    await crashSafeQueue.clearAll();
  });

  it("assigns strictly monotonic seqId and drains guard operations in strict FIFO order", async () => {
    const e1 = await crashSafeQueue.enqueue({
      entityType: "VISITOR_PASS",
      entityId: 101,
      operation: "CREATE",
      payloadJson: '{"visitorName":"Asha","action":"CHECK_IN"}',
    });
    const e2 = await crashSafeQueue.enqueue({
      entityType: "EXPRESS_DELIVERY",
      entityId: 202,
      operation: "UPDATE",
      payloadJson: '{"passCode":"EXP-9012","action":"CHECK_IN"}',
    });
    const e3 = await crashSafeQueue.enqueue({
      entityType: "VISITOR_PASS",
      entityId: 101,
      operation: "UPDATE",
      payloadJson: '{"visitorName":"Asha","action":"CHECK_OUT"}',
    });

    expect(e1.seqId).toBeLessThan(e2.seqId);
    expect(e2.seqId).toBeLessThan(e3.seqId);

    const executionOrder: number[] = [];
    const summary = await crashSafeQueue.drainFifo(async (entry) => {
      executionOrder.push(entry.seqId);
      return { outcome: "APPLIED" };
    });

    expect(executionOrder).toEqual([e1.seqId, e2.seqId, e3.seqId]);
    expect(summary.applied).toBe(3);
    expect(summary.conflicts).toBe(0);
    expect(await crashSafeQueue.getPending()).toHaveLength(0);
  });

  it("halts FIFO drain immediately on transient error so later entries never overtake head", async () => {
    const first = await crashSafeQueue.enqueue({
      entityType: "VISITOR_PASS",
      operation: "CREATE",
      payloadJson: '{"step":1}',
    });
    const second = await crashSafeQueue.enqueue({
      entityType: "VISITOR_PASS",
      operation: "UPDATE",
      payloadJson: '{"step":2}',
    });

    const dispatchedSeqs: number[] = [];
    const summary = await crashSafeQueue.drainFifo(async (entry) => {
      dispatchedSeqs.push(entry.seqId);
      return { outcome: "RETRYABLE_ERROR", errorMessage: "Cellular 504 timeout" };
    });

    // Strict FIFO guarantees item #2 was NEVER dispatched after #1 failed transiently
    expect(dispatchedSeqs).toEqual([first.seqId]);
    expect(summary.haltedOnTransientError).toBe(true);
    expect(summary.applied).toBe(0);

    const remaining = await crashSafeQueue.getPending();
    expect(remaining.map((r) => r.seqId)).toEqual([first.seqId, second.seqId]);
    expect(remaining[0].status).toBe("PENDING");
    expect(remaining[0].retryCount).toBe(1);
  });

  it("isolates 409 conflicts into Dead-Letter Queue (DLQ) without blocking subsequent vehicles", async () => {
    const poisoned = await crashSafeQueue.enqueue({
      entityType: "VISITOR_PASS",
      entityId: 500,
      operation: "UPDATE",
      payloadJson: '{"action":"CHECK_IN","revokedOffline":true}',
    });
    const nextCar = await crashSafeQueue.enqueue({
      entityType: "EXPRESS_DELIVERY",
      entityId: 501,
      operation: "UPDATE",
      payloadJson: '{"passCode":"EXP-4455"}',
    });

    const summary = await crashSafeQueue.drainFifo(async (entry) => {
      if (entry.seqId === poisoned.seqId) {
        return { outcome: "CONFLICT", errorMessage: "Pass cancelled by resident" };
      }
      return { outcome: "APPLIED" };
    });

    expect(summary.conflicts).toBe(1);
    expect(summary.applied).toBe(1);
    expect(summary.haltedOnTransientError).toBe(false);

    // Next vehicle drained cleanly; poisoned item stays inspectable in DLQ
    expect(await crashSafeQueue.getPending()).toHaveLength(0);
    const dlq = await crashSafeQueue.getConflicts();
    expect(dlq).toHaveLength(1);
    expect(dlq[0].seqId).toBe(poisoned.seqId);
    expect(dlq[0].status).toBe("CONFLICT");

    // Guard can retry or dismiss DLQ entry
    await crashSafeQueue.retryConflict(poisoned.seqId);
    const pendingAfterRetry = await crashSafeQueue.getPending();
    expect(pendingAfterRetry).toHaveLength(1);
    expect(pendingAfterRetry[0].seqId).toBe(poisoned.seqId);
    expect(nextCar.seqId).toBeGreaterThan(poisoned.seqId);
  });

  it("rehydrates stuck IN_FLIGHT entries left by an unexpected app crash back to PENDING", async () => {
    const entry = await crashSafeQueue.enqueue({
      entityType: "EXPRESS_DELIVERY",
      operation: "UPDATE",
      payloadJson: '{"passCode":"EXP-7711"}',
      clientMutationId: "mut_crash_recovery_test",
    });

    // Simulate app crash mid-flight by persisting status: "IN_FLIGHT"
    const raw = JSON.parse(localStorage.getItem("mana_guard_wal_fallback_v1") || "[]") as GuardWalEntry[];
    raw[0].status = "IN_FLIGHT";
    localStorage.setItem("mana_guard_wal_fallback_v1", JSON.stringify(raw));

    const recovered = await crashSafeQueue.rehydrateInFlight();
    expect(recovered).toBe(1);

    const pending = await crashSafeQueue.getPending();
    expect(pending).toHaveLength(1);
    expect(pending[0].status).toBe("PENDING");
    expect(pending[0].clientMutationId).toBe("mut_crash_recovery_test");
    expect(pending[0].seqId).toBe(entry.seqId);
  });
});
