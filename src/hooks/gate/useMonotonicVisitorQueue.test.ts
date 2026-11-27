import { describe, it, expect } from "vitest";
import {
  mergeVisitorRecordsMonotonic,
  PollRaceGuard,
  type VisitorQueueEntry,
} from "./useMonotonicVisitorQueue";

describe("Guard Dashboard Polling Race & Monotonic Version Merge", () => {
  it("prevents an out-of-order slow HTTP poll from reverting a fresher WebSocket APPROVED state", () => {
    const initial = new Map<string, VisitorQueueEntry>([
      ["v-42", { id: "v-42", visitorName: "Ramesh", flatNo: "A-101", status: "PENDING", version: 4 }],
    ]);

    // Step 1: WebSocket delivers fresher APPROVED decision at version 5
    const afterWs = mergeVisitorRecordsMonotonic(initial, [
      { id: "v-42", visitorName: "Ramesh", flatNo: "A-101", status: "APPROVED", version: 5 },
    ]);
    expect(afterWs.get("v-42")?.status).toBe("APPROVED");

    // Step 2: Delayed HTTP poll completes late with stale PENDING (version 4) -> ignored cleanly
    const afterStalePoll = mergeVisitorRecordsMonotonic(afterWs, [
      { id: "v-42", visitorName: "Ramesh", flatNo: "A-101", status: "PENDING", version: 4 },
      { id: "v-43", visitorName: "Swiggy", flatNo: "B-202", status: "PENDING", version: 1 },
    ]);

    expect(afterStalePoll.get("v-42")?.status).toBe("APPROVED");
    expect(afterStalePoll.get("v-42")?.version).toBe(5);
    expect(afterStalePoll.get("v-43")?.status).toBe("PENDING");
  });

  it("aborts superseded HTTP polls via AbortController and invalidates stale epochs on WebSocket bumps", () => {
    const guard = new PollRaceGuard();

    const p1 = guard.beginPoll();
    expect(p1.signal.aborted).toBe(false);
    expect(guard.isCurrentEpoch(p1.epoch)).toBe(true);

    // Starting p2 cancels p1 signal cleanly
    const p2 = guard.beginPoll();
    expect(p1.signal.aborted).toBe(true);
    expect(p2.signal.aborted).toBe(false);
    expect(guard.isCurrentEpoch(p1.epoch)).toBe(false);
    expect(guard.isCurrentEpoch(p2.epoch)).toBe(true);

    // WebSocket push bumps epoch, causing an in-flight p2 HTTP completion to be discarded cleanly
    guard.bumpEpochOnWebSocketEvent();
    expect(guard.isCurrentEpoch(p2.epoch)).toBe(false);

    guard.dispose();
    expect(p2.signal.aborted).toBe(true);
  });
});
