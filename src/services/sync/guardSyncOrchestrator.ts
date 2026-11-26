import { stompClient } from "../chat/stompClient";
import { offlineSyncService, type SyncChangeItemDto } from "./offlineSyncService";

export type GuardSyncPhase = "IDLE" | "RECONCILING" | "SYNCED" | "OFFLINE_BUFFERED";

export interface GuardSyncStatus {
  phase: GuardSyncPhase;
  pendingMutations: number;
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
  private status: GuardSyncStatus = {
    phase: "IDLE",
    pendingMutations: 0,
    lastSyncedAt: null,
    lastAppliedCount: 0,
    lastConflictCount: 0,
    lastDeltaCount: 0,
  };

  getStatus(): GuardSyncStatus {
    return {
      ...this.status,
      pendingMutations: offlineSyncService.getPendingQueue().length,
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

  private emit(partial: Partial<GuardSyncStatus>) {
    this.status = {
      ...this.status,
      ...partial,
      pendingMutations: offlineSyncService.getPendingQueue().length,
    };
    const snapshot = this.getStatus();
    this.statusListeners.forEach((l) => l(snapshot));
  }

  /**
   * Starts automatic 3-phase reconciliation whenever the WebSocket transitions
   * back to CONNECTED after a Wi-Fi/Cellular drop or browser online recovery.
   */
  start(userId: number, communityId: number, deviceId = "guard-tablet-web"): () => void {
    this.stop();

    const triggerSync = () => {
      void this.reconcile(userId, communityId, deviceId);
    };

    this.unsubConnect = stompClient.onConnect(triggerSync);

    // Refresh initial pending count
    const pending = offlineSyncService.getPendingQueue().length;
    this.emit({ phase: pending > 0 ? "OFFLINE_BUFFERED" : stompClient.connected ? "SYNCED" : "IDLE" });

    return () => this.stop();
  }

  stop() {
    this.unsubConnect?.();
    this.unsubConnect = null;
  }

  /**
   * Executes Phases 2 & 3 of the reconciliation protocol:
   * - Push queued local mutations created while offline (`pushBatch`)
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
      // Phase 2: Push buffered offline actions
      const pushResult = await offlineSyncService.pushBatch(userId, communityId, deviceId);
      if (pushResult) {
        applied = pushResult.appliedCount ?? 0;
        conflicts = pushResult.conflictCount ?? 0;
      }

      // Phase 3: Pull delta stream since last checkpoint
      const pullResult = await offlineSyncService.pullDelta(userId, communityId, deviceId);
      deltas = pullResult?.changes ?? [];

      if (deltas.length > 0) {
        this.deltaListeners.forEach((cb) => cb(deltas));
      }

      const remaining = offlineSyncService.getPendingQueue().length;
      this.emit({
        phase: remaining > 0 ? "OFFLINE_BUFFERED" : "SYNCED",
        lastSyncedAt: new Date().toISOString(),
        lastAppliedCount: applied,
        lastConflictCount: conflicts,
        lastDeltaCount: deltas.length,
      });
    } catch {
      const remaining = offlineSyncService.getPendingQueue().length;
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
