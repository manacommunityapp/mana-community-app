import { stompClient } from "../chat/stompClient";
import { offlineSyncService, type SyncChangeItemDto } from "./offlineSyncService";
import { crashSafeQueue } from "./crashSafeQueue";

export type GuardSyncPhase = "IDLE" | "RECONCILING" | "SYNCED" | "OFFLINE_BUFFERED";

export interface GuardSyncStatus {
  phase: GuardSyncPhase;
  pendingMutations: number;
  conflictsCount: number;
  lastSyncedAt: string | null;
  lastAppliedCount: number;
  lastConflictCount: number;
  lastDeltaCount: number;
}

type StatusListener = (status: GuardSyncStatus) => void;
type DeltaListener = (changes: SyncChangeItemDto[]) => void;

class GuardSyncOrchestrator {
  private reconciling = false;
  private statusListeners = new Set<StatusListener>();
  private deltaListeners = new Set<DeltaListener>();
  private unsubConnect: (() => void) | null = null;
  private unsubWal: (() => void) | null = null;
  private walPendingCount = 0;
  private walConflictsCount = 0;
  private status: GuardSyncStatus = {
    phase: "IDLE",
    pendingMutations: 0,
    conflictsCount: 0,
    lastSyncedAt: null,
    lastAppliedCount: 0,
    lastConflictCount: 0,
    lastDeltaCount: 0,
  };

  getStatus(): GuardSyncStatus {
    return {
      ...this.status,
      pendingMutations: offlineSyncService.getPendingQueue().length + this.walPendingCount,
      conflictsCount: this.walConflictsCount,
    };
  }

  onStatusChange(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  onDeltaReconciled(listener: DeltaListener): () => void {
    this.deltaListeners.add(listener);
    return () => this.deltaListeners.delete(listener);
  }

  private async refreshWalCounts(): Promise<void> {
    try {
      const [pending, conflicts] = await Promise.all([
        crashSafeQueue.getPending(),
        crashSafeQueue.getConflicts(),
      ]);
      this.walPendingCount = pending.length;
      this.walConflictsCount = conflicts.length;
    } catch {
      // safe fallback
    }
  }

  private emit(partial: Partial<GuardSyncStatus>) {
    this.status = {
      ...this.status,
      ...partial,
      pendingMutations: offlineSyncService.getPendingQueue().length + this.walPendingCount,
      conflictsCount: this.walConflictsCount,
    };
    const snapshot = this.getStatus();
    this.statusListeners.forEach((l) => l(snapshot));
  }

  /**
   * Starts automatic 3-phase reconciliation whenever the WebSocket transitions
   * back to CONNECTED after a Wi-Fi/Cellular drop or browser online recovery.
   * Immediately rehydrates any IN_FLIGHT entries left over from a prior crash.
   */
  start(userId: number, communityId: number, deviceId = "guard-tablet-web"): () => void {
    this.stop();

    const triggerSync = () => {
      void this.reconcile(userId, communityId, deviceId);
    };

    this.unsubConnect = stompClient.onConnect(triggerSync);
    this.unsubWal = crashSafeQueue.subscribe(() => {
      void this.refreshWalCounts().then(() => {
        const totalPending = this.getStatus().pendingMutations;
        this.emit({
          phase: this.reconciling
            ? "RECONCILING"
            : totalPending > 0
              ? "OFFLINE_BUFFERED"
              : stompClient.connected
                ? "SYNCED"
                : "IDLE",
        });
      });
    });

    // Crash recovery sweep + initial pending counts
    void crashSafeQueue.rehydrateInFlight().then(() => this.refreshWalCounts()).then(() => {
      const totalPending = this.getStatus().pendingMutations;
      this.emit({ phase: totalPending > 0 ? "OFFLINE_BUFFERED" : stompClient.connected ? "SYNCED" : "IDLE" });
    });

    return () => this.stop();
  }

  stop() {
    this.unsubConnect?.();
    this.unsubConnect = null;
    this.unsubWal?.();
    this.unsubWal = null;
  }

  /**
   * Executes Phases 2 & 3 of the reconciliation protocol:
   * - Drain IndexedDB WAL under Web Lock in strict FIFO `seqId` order
   * - Drain any legacy localStorage queue entries (`pushBatch`)
   * - Pull server changes since `lastKnownChangeId` (`pullDelta`)
   * - Notify subscribers so the Guard UI reconciles smoothly
   */
  async reconcile(
    userId: number,
    communityId: number,
    deviceId = "guard-tablet-web"
  ): Promise<GuardSyncStatus> {
    if (this.reconciling) return this.getStatus();
    this.reconciling = true;
    this.emit({ phase: "RECONCILING" });

    let applied = 0;
    let conflicts = 0;
    let deltas: SyncChangeItemDto[] = [];

    try {
      // Phase 2A: Drain durable IndexedDB WAL in strict FIFO order
      const walResult = await offlineSyncService.pushDurableFifo(userId, communityId, deviceId);
      applied += walResult.applied;
      conflicts += walResult.conflicts;

      // Phase 2B: Push any legacy queued items
      const pushResult = await offlineSyncService.pushBatch(userId, communityId, deviceId);
      if (pushResult) {
        applied += pushResult.appliedCount ?? 0;
        conflicts += pushResult.conflictCount ?? 0;
      }

      // Phase 3: Pull delta stream since last checkpoint
      const pullResult = await offlineSyncService.pullDelta(userId, communityId, deviceId);
      deltas = pullResult?.changes ?? [];

      if (deltas.length > 0) {
        this.deltaListeners.forEach((cb) => cb(deltas));
      }

      await this.refreshWalCounts();
      const remaining = offlineSyncService.getPendingQueue().length + this.walPendingCount;
      this.emit({
        phase: remaining > 0 ? "OFFLINE_BUFFERED" : "SYNCED",
        lastSyncedAt: new Date().toISOString(),
        lastAppliedCount: applied,
        lastConflictCount: conflicts,
        lastDeltaCount: deltas.length,
      });
    } catch {
      await this.refreshWalCounts();
      const remaining = offlineSyncService.getPendingQueue().length + this.walPendingCount;
      this.emit({
        phase: remaining > 0 ? "OFFLINE_BUFFERED" : "IDLE",
      });
    } finally {
      this.reconciling = false;
    }

    return this.getStatus();
  }
}

export const guardSyncOrchestrator = new GuardSyncOrchestrator();
