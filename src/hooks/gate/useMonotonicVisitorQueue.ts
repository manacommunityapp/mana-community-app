import { useEffect, useRef, useState } from "react";

export type VisitorApprovalStatus = "PENDING" | "APPROVED" | "DENIED";

export interface VisitorQueueEntry {
  id: string;
  visitorName: string;
  flatNo: string;
  status: VisitorApprovalStatus;
  version: number;
}

/**
 * Pure monotonic state merger: guarantees an out-of-order slow HTTP poll response
 * with an older `version` can never overwrite a fresher WebSocket decision.
 */
export function mergeVisitorRecordsMonotonic(
  prev: Map<string, VisitorQueueEntry>,
  incoming: VisitorQueueEntry[],
): Map<string, VisitorQueueEntry> {
  const next = new Map(prev);
  for (const item of incoming) {
    const existing = next.get(item.id);
    if (!existing || item.version > existing.version) {
      next.set(item.id, item);
    }
  }
  return next;
}

/**
 * Coordinates AbortController cancellation + poll epoch bumps so slow HTTP polls
 * aborted or superseded by WebSocket pushes are dropped cleanly.
 */
export class PollRaceGuard {
  private epoch = 0;
  private activeController: AbortController | null = null;

  beginPoll(): { signal: AbortSignal; epoch: number } {
    this.activeController?.abort();
    const controller = new AbortController();
    this.activeController = controller;
    return { signal: controller.signal, epoch: ++this.epoch };
  }

  bumpEpochOnWebSocketEvent(): void {
    this.epoch += 1;
  }

  isCurrentEpoch(requestEpoch: number): boolean {
    return requestEpoch === this.epoch;
  }

  dispose(): void {
    this.activeController?.abort();
    this.activeController = null;
  }
}

export function useMonotonicVisitorQueue(
  communityId: number,
  fetchPending: (communityId: number, signal: AbortSignal) => Promise<VisitorQueueEntry[]>,
  subscribeWs: (communityId: number, onEvent: (entry: VisitorQueueEntry) => void) => () => void,
  pollIntervalMs = 3000,
): VisitorQueueEntry[] {
  const [visitorMap, setVisitorMap] = useState<Map<string, VisitorQueueEntry>>(() => new Map());
  const guardRef = useRef<PollRaceGuard>(new PollRaceGuard());

  useEffect(() => {
    const guard = guardRef.current;

    const runPoll = async () => {
      const { signal, epoch } = guard.beginPoll();
      try {
        const rows = await fetchPending(communityId, signal);
        if (!guard.isCurrentEpoch(epoch)) return;
        setVisitorMap((prev) => mergeVisitorRecordsMonotonic(prev, rows));
      } catch (err: unknown) {
        if ((err as { name?: string })?.name !== "AbortError") {
          console.error("[useMonotonicVisitorQueue] poll error", err);
        }
      }
    };

    runPoll();
    const intervalId = setInterval(runPoll, pollIntervalMs);

    const unsubscribe = subscribeWs(communityId, (wsEntry) => {
      guard.bumpEpochOnWebSocketEvent();
      setVisitorMap((prev) => mergeVisitorRecordsMonotonic(prev, [wsEntry]));
    });

    return () => {
      clearInterval(intervalId);
      guard.dispose();
      unsubscribe();
    };
  }, [communityId, fetchPending, subscribeWs, pollIntervalMs]);

  return Array.from(visitorMap.values());
}
