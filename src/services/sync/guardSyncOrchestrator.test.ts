import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { computeJitteredBackoff, BACKOFF_MS } from "../chat/stompClient";
import { guardSyncOrchestrator } from "./guardSyncOrchestrator";
import { offlineSyncService } from "./offlineSyncService";

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

describe("Guard Tablet Real-Time State Sync & Exponential Backoff", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    memStorage.clear();
    offlineSyncService.clearQueue();
    localStorage.clear();
  });

  it("computes jittered exponential backoff within 50%-100% of each tier and caps at 60s", () => {
    expect(computeJitteredBackoff(0, () => 0)).toBe(500);
    expect(computeJitteredBackoff(0, () => 0.9999)).toBeLessThanOrEqual(1000);

    expect(computeJitteredBackoff(3, () => 0)).toBe(4000);
    expect(computeJitteredBackoff(3, () => 0.9999)).toBeLessThanOrEqual(8000);

    // Extremely high attempt caps at BACKOFF_MS max (60,000ms)
    const maxCap = BACKOFF_MS[BACKOFF_MS.length - 1];
    expect(computeJitteredBackoff(25, () => 0)).toBe(maxCap * 0.5);
    expect(computeJitteredBackoff(25, () => 0.9999)).toBeLessThanOrEqual(maxCap);
  });

  it("executes 3-phase reconciliation: pushes buffered mutations then pulls missed deltas", async () => {
    offlineSyncService.enqueueMutation({
      entityType: "EXPRESS_DELIVERY",
      operation: "UPDATE",
      payloadJson: JSON.stringify({ passCode: "EXP-4521", status: "CHECKED_IN" }),
    });

    const pushSpy = vi.spyOn(offlineSyncService, "pushBatch").mockResolvedValueOnce({
      deviceId: "guard-tablet-1",
      totalProcessed: 1,
      appliedCount: 1,
      conflictCount: 0,
      newCheckpointChangeId: 42,
      acks: [{ clientMutationId: "mut_1", status: "APPLIED" }],
    });

    const pullSpy = vi.spyOn(offlineSyncService, "pullDelta").mockResolvedValueOnce({
      latestChangeId: 45,
      hasMore: false,
      changes: [
        {
          changeId: 44,
          entityType: "VISITOR_PASS",
          entityId: 901,
          operation: "CREATE",
          payloadJson: '{"visitorName":"Priya"}',
          serverTimestamp: new Date().toISOString(),
          version: 1,
        },
      ],
    });

    // Clear queue when pushBatch succeeds cleanly (simulated)
    pushSpy.mockImplementationOnce(async () => {
      offlineSyncService.clearQueue();
      return {
        deviceId: "guard-tablet-1",
        totalProcessed: 1,
        appliedCount: 1,
        conflictCount: 0,
        newCheckpointChangeId: 42,
        acks: [{ clientMutationId: "mut_1", status: "APPLIED" }],
      };
    });

    // Re-mock cleanly with direct spy calls in order
    pushSpy.mockReset();
    pushSpy.mockImplementation(async () => {
      offlineSyncService.clearQueue();
      return {
        deviceId: "guard-tablet-1",
        totalProcessed: 1,
        appliedCount: 1,
        conflictCount: 0,
        newCheckpointChangeId: 42,
        acks: [{ clientMutationId: "mut_1", status: "APPLIED" }],
      };
    });

    const receivedDeltas: any[] = [];
    const unsubDelta = guardSyncOrchestrator.onDeltaReconciled((deltas) => {
      receivedDeltas.push(...deltas);
    });

    const result = await guardSyncOrchestrator.reconcile(1, 1, "guard-tablet-1");
    unsubDelta();

    expect(pushSpy).toHaveBeenCalledTimes(1);
    expect(pullSpy).toHaveBeenCalledTimes(1);
    expect(result.phase).toBe("SYNCED");
    expect(result.lastAppliedCount).toBe(1);
    expect(result.lastDeltaCount).toBe(1);
    expect(receivedDeltas).toHaveLength(1);
  });

  it("stays in OFFLINE_BUFFERED phase if network fails mid-reconciliation", async () => {
    offlineSyncService.enqueueMutation({
      entityType: "VISITOR_PASS",
      operation: "CREATE",
      payloadJson: JSON.stringify({ visitorName: "Walk-In Guest" }),
    });

    vi.spyOn(offlineSyncService, "pushBatch").mockRejectedValueOnce(new Error("Cellular handoff timeout"));

    const result = await guardSyncOrchestrator.reconcile(1, 1, "guard-tablet-1");
    expect(result.phase).toBe("OFFLINE_BUFFERED");
    expect(result.pendingMutations).toBe(1);
  });
});
