import { describe, it, expect, beforeEach } from "vitest";
import { manaSplitService } from "./manaSplitService";

if (typeof globalThis.localStorage === "undefined") {
  const store = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    length: 0,
  } as unknown as Storage;
}

describe("manaSplitService - Shared Expenses & Collections", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("calculates equal split with zero lost paise (largest-remainder arithmetic)", () => {
    const expense = manaSplitService.createExpense({
      groupId: "grp-trip-01",
      category: "FOOD",
      description: "Highway Dhaba Lunch",
      totalAmount: 1000,
      paidByMemberId: "user-me",
      splitMethod: "EQUAL",
    });

    expect(expense.id).toBeDefined();
    expect(expense.totalAmount).toBe(1000);

    const sumShares = expense.shares.reduce((sum, s) => sum + s.amount, 0);
    expect(Math.round(sumShares * 100) / 100).toBe(1000);
  });

  it("calculates percentage split accurately across participants", () => {
    const expense = manaSplitService.createExpense({
      groupId: "grp-trip-01",
      category: "STAY",
      description: "Resort Extra Suite",
      totalAmount: 5000,
      paidByMemberId: "user-me",
      splitMethod: "PERCENTAGE",
      participants: [
        { memberId: "user-me", percentage: 60 },
        { memberId: "user-2", percentage: 40 },
      ],
    });

    expect(expense.shares.find((s) => s.memberId === "user-me")?.amount).toBe(3000);
    expect(expense.shares.find((s) => s.memberId === "user-2")?.amount).toBe(2000);
  });

  it("computes greedy optimized transfers minimizing multi-way debts", () => {
    const settlements = manaSplitService.getOptimizedSettlements("grp-trip-01");
    expect(Array.isArray(settlements)).toBe(true);

    settlements.forEach((s) => {
      expect(s.amount).toBeGreaterThan(0);
      expect(s.fromMemberId).not.toBe(s.toMemberId);
    });
  });

  it("records payment settlements and marks them confirmed", () => {
    const payment = manaSplitService.recordPayment({
      groupId: "grp-trip-01",
      toMemberId: "user-2",
      amount: 1200,
      paymentMethod: "UPI",
      referenceNote: "Settled via PhonePe UPI",
    });

    expect(payment.id).toBeDefined();
    expect(payment.status).toBe("CONFIRMED");
    expect(payment.amount).toBe(1200);
  });

  it("supports contributing to verified community collection drives", () => {
    const initialCollections = manaSplitService.getVerifiedCollections();
    const targetCol = initialCollections[0];
    const initialAmt = targetCol.collectedAmount;

    const updated = manaSplitService.contributeToCollection(targetCol.id, 500);
    expect(updated?.collectedAmount).toBe(initialAmt + 500);
  });
});
