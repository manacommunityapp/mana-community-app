import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import {
  computeObjectDiff,
  writeDraftToStore,
  readDraftFromStore,
  deleteDraftFromStore,
} from "./useDraftAutosave";

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

describe("useDraftAutosave & Ledger Diff Tracker", () => {
  beforeEach(() => {
    memStorage.clear();
  });

  it("computes exact changed fields across invoice headers and multi-line items", () => {
    const baseline = {
      customerName: "Apex Services",
      dueDate: "2026-07-10",
      lines: [{ item: "Security", qty: 1, cost: 5000 }],
    };
    const current = {
      customerName: "Apex Services",
      dueDate: "2026-07-15",
      lines: [
        { item: "Security", qty: 2, cost: 5000 },
        { item: "Maintenance", qty: 1, cost: 1200 },
      ],
    };

    const diffs = computeObjectDiff(baseline, current);
    expect(diffs.map((d) => d.field)).toEqual(["dueDate", "lines"]);
  });

  it("persists, retrieves, and clears invoice drafts safely", async () => {
    await writeDraftToStore("invoice_credit", {
      customerName: "Fresh Mart",
      lines: [{ item: "Water Tanker", qty: 4, cost: 1500 }],
    });

    const restored = await readDraftFromStore<{ customerName: string; lines: unknown[] }>("invoice_credit");
    expect(restored).not.toBeNull();
    expect(restored?.data.customerName).toBe("Fresh Mart");
    expect(restored?.data.lines).toHaveLength(1);

    await deleteDraftFromStore("invoice_credit");
    const afterDelete = await readDraftFromStore("invoice_credit");
    expect(afterDelete).toBeNull();
  });
});
