import { describe, it, expect, beforeEach } from "vitest";
import { communityFinanceService } from "../finance/communityFinanceService";
import { personalFinanceService } from "../finance/personalFinanceService";
import { manaSplitService } from "../split/manaSplitService";
import { manaRewardsService } from "../rewards/manaRewardsService";
import { manaPayService } from "../payments/manaPayService";

// Mock localStorage in Node/Vitest environment
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

describe("Money Systems Strict Separation & Authoritative Boundaries", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("1. Community Finance: Paying a maintenance bill does NOT automatically create a My Money transaction", () => {
    const initialTxCount = personalFinanceService.getTransactions().length;

    // Record payment in Community Finance
    const bill = communityFinanceService.getMyBill("302");
    expect(bill).toBeDefined();

    const result = communityFinanceService.recordPayment(bill.id, 500, "UPI");
    expect(result).not.toBeNull();
    expect(result?.bill.status).toBe("PARTIAL");
    expect(result?.receipt.amountPaid).toBe(500);

    // Assert My Money remains untouched by default
    const afterTxCount = personalFinanceService.getTransactions().length;
    expect(afterTxCount).toBe(initialTxCount);
  });

  it("2. Mana Split: Creating an expense or collection contribution does NOT write to My Money unless explicitly opted in", () => {
    const initialTxCount = personalFinanceService.getTransactions().length;

    // Create expense without recordInMyMoney (default: false)
    const expense = manaSplitService.createExpense({
      groupId: "grp-trip-01",
      category: "FUEL",
      description: "Highway Toll & Fuel",
      totalAmount: 1000,
      paidByMemberId: "user-me",
      splitMethod: "EQUAL",
      // recordInMyMoney is omitted (defaults to false)
    });

    expect(expense.id).toBeDefined();

    // Verify personalFinanceService transactions count has NOT changed
    expect(personalFinanceService.getTransactions().length).toBe(initialTxCount);

    // Now create expense WITH explicit recordInMyMoney: true
    manaSplitService.createExpense({
      groupId: "grp-trip-01",
      category: "FOOD",
      description: "Resort Lunch",
      totalAmount: 1200,
      paidByMemberId: "user-me",
      splitMethod: "EQUAL",
      recordInMyMoney: true,
      accountId: "acc-1",
    });

    // Now personalFinanceService should have recorded exactly 1 transaction
    expect(personalFinanceService.getTransactions().length).toBe(initialTxCount + 1);
    const latestTx = personalFinanceService.getTransactions()[0];
    expect(latestTx.description).toContain("Resort Lunch");
    expect(latestTx.amount).toBe(1200);
  });

  it("3. Mana Rewards: Awarding and redeeming points operates strictly on its own ledger without altering personal accounts or community ledger", () => {
    const initialBalance = manaRewardsService.getAccount("user-me").currentPoints;
    const initialPersonalAccounts = personalFinanceService.getAccounts().map(a => a.balance);

    // Award loyalty reward points
    const { account, entry } = manaRewardsService.awardPoints({
      userId: "user-me",
      points: 150,
      ruleTag: "TIMELY_MAINTENANCE_PAY",
      narration: "Early maintenance payment discount points",
      referenceDomain: "COMMUNITY_FINANCE",
    });

    expect(entry.points).toBe(188); // 150 * 1.25 (GOLD tier multiplier)
    expect(account.currentPoints).toBe(initialBalance + 188);

    // Personal finance accounts balances should be unchanged
    const currentPersonalAccounts = personalFinanceService.getAccounts().map(a => a.balance);
    expect(currentPersonalAccounts).toEqual(initialPersonalAccounts);

    // Redeem item
    const rewardItem = manaRewardsService.getCatalog()[0];
    const redeemRes = manaRewardsService.redeemPoints(rewardItem.id, "user-me");
    expect(redeemRes.success).toBe(true);
    expect(redeemRes.account?.currentPoints).toBe(account.currentPoints - rewardItem.pointsCost);
  });

  it("4. Mana Pay: Creates isolated payment intent without modifying My Money, Community, or Split until invoked by their workflows", async () => {
    const initialTxCount = personalFinanceService.getTransactions().length;

    const intent = await manaPayService.createPaymentIntent({
      idempotencyKey: "test-idem-" + Date.now(),
      domain: "MAINTENANCE_BILL",
      orderReferenceId: "ORD-TEST-101",
      title: "Q3 Club House Maintenance",
      totalAmount: 4500,
      preferredRail: "UPI_INTENT",
      payer: {
        id: "user-me",
        name: "Resident User",
        email: "user@mana.app",
        unit: "302",
        tower: "Tower A1",
      },
    });

    expect(intent.intentId).toBeDefined();
    expect(intent.status).toBe("PENDING");

    // Pure payment orchestration does not mutate resident's personal finance ledger
    expect(personalFinanceService.getTransactions().length).toBe(initialTxCount);
  });
});
