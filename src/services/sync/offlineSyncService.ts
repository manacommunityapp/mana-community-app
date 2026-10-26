import { apiClient } from "../common/apiClient";

export type SyncEntityType =
  | "VISITOR_PASS"
  | "PARKING_ENTRY"
  | "SOS_TRIGGER"
  | "HELPDESK_TICKET"
  | "EV_SESSION"
  | "GENERAL";

export type SyncOperation = "CREATE" | "UPDATE" | "DELETE";
export type SyncStatus = "APPLIED" | "CONFLICT_SERVER_WINS" | "REJECTED";

export interface ClientMutationItem {
  clientMutationId: string;
  entityType: SyncEntityType;
  entityId?: number;
  operation: SyncOperation;
  payloadJson: string;
  clientTimestamp: string;
  retryCount?: number;
}

export interface PushSyncBatchRequest {
  userId: number;
  deviceId: string;
  communityId: number;
  clientAppVersion?: string;
  lastKnownChangeId?: number;
  mutations: ClientMutationItem[];
}

export interface MutationSyncAck {
  clientMutationId: string;
  serverChangeId?: number;
  entityId?: number;
  status: SyncStatus;
  message?: string;
}

export interface PushSyncBatchResult {
  deviceId: string;
  totalProcessed: number;
  appliedCount: number;
  conflictCount: number;
  newCheckpointChangeId: number;
  acks: MutationSyncAck[];
}

export interface PullSyncRequest {
  userId: number;
  deviceId: string;
  communityId: number;
  sinceChangeId: number;
}

export interface SyncChangeItemDto {
  changeId: number;
  entityType: SyncEntityType;
  entityId?: number;
  operation: SyncOperation;
  payloadJson: string;
  serverTimestamp: string;
  version: number;
}

export interface PullSyncResponse {
  latestChangeId: number;
  hasMore: boolean;
  changes: SyncChangeItemDto[];
}

const QUEUE_STORAGE_KEY = "mana_offline_sync_queue";
const CHECKPOINT_KEY = "mana_sync_checkpoint_id";

export const offlineSyncService = {
  getPendingQueue(): ClientMutationItem[] {
    try {
      const data = localStorage.getItem(QUEUE_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  enqueueMutation(mutation: Omit<ClientMutationItem, "clientMutationId" | "clientTimestamp">): ClientMutationItem {
    const item: ClientMutationItem = {
      ...mutation,
      clientMutationId: "mut_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now(),
      clientTimestamp: new Date().toISOString(),
      retryCount: 0,
    };

    const queue = this.getPendingQueue();
    queue.push(item);
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
    return item;
  },

  clearQueue(): void {
    localStorage.removeItem(QUEUE_STORAGE_KEY);
  },

  removeQueueItem(mutationId: string): void {
    const queue = this.getPendingQueue().filter((item) => item.clientMutationId !== mutationId);
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
  },

  getLastCheckpoint(): number {
    const val = localStorage.getItem(CHECKPOINT_KEY);
    return val ? parseInt(val, 10) : 0;
  },

  setLastCheckpoint(id: number): void {
    localStorage.setItem(CHECKPOINT_KEY, id.toString());
  },

  async pushBatch(userId: number, communityId: number, deviceId: string): Promise<PushSyncBatchResult | null> {
    const queue = this.getPendingQueue();
    if (queue.length === 0) return null;

    const payload: PushSyncBatchRequest = {
      userId,
      deviceId,
      communityId,
      clientAppVersion: "2.4.0-mobile",
      lastKnownChangeId: this.getLastCheckpoint(),
      mutations: queue,
    };

    const result = await apiClient.post<PushSyncBatchResult>("/v1/sync/push", payload);

    if (result && result.acks) {
      const successfulIds = new Set(
        result.acks.filter((a) => a.status === "APPLIED").map((a) => a.clientMutationId)
      );

      const remaining = queue.filter((item) => !successfulIds.has(item.clientMutationId));
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(remaining));

      if (result.newCheckpointChangeId) {
        this.setLastCheckpoint(result.newCheckpointChangeId);
      }
    }

    return result;
  },

  async pullDelta(userId: number, communityId: number, deviceId: string): Promise<PullSyncResponse> {
    const req: PullSyncRequest = {
      userId,
      deviceId,
      communityId,
      sinceChangeId: this.getLastCheckpoint(),
    };

    const res = await apiClient.post<PullSyncResponse>("/v1/sync/pull", req);
    if (res && res.latestChangeId) {
      this.setLastCheckpoint(res.latestChangeId);
    }
    return res;
  },
};
