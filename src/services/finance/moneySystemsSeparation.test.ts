import { describe, it, expect, vi, beforeEach } from "vitest";

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

// communityFinanceService and manaPayService are HTTP-backed now, so the api
// client is stubbed per endpoint. Nothing here hits the network, and the
// stubbed bodies use the backend's {success, data, ...} envelope so the
// service's real (tolerant) unwrapping path is exercised rather than bypassed.
vi.mock("../common/apiClient", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
  getStoredUser: vi.fn(() => ({ userId: "user-me", phone: "+91 90000 11111", role: "RESIDENT" })),
}));

import { communityFinanceService, type MaintenanceBill } from "../finance/communityFinanceService";
import { personalFinanceService } from "../finance/personalFinanceService";
import { manaSplitService } from "../split/manaSplitService";
import { manaRewardsService } from "../rewards/manaRewardsService";
import { manaPayService } from "../payments/manaPayService";
import { apiClient } from "../common/apiClient";
import type { Mock } from "vitest";
import type { ManaPaymentIntentResponse } from "../../types/manaPay";

const postMock = apiClient.post as unknown as Mock;
const getMock = apiClient.get as unknown as Mock;

const COMMUNITY_ID = 1;

interface PaymentRequestBody {
  amount?: number;
  paymentMode?: string;
  communityId?: number;
}

/** The standard backend response envelope. */
function envelope<T>(data: T) {
  return {
    success: true,
    data,
    message: "OK",
    correlationId: "test-correlation-id",
    timestamp: new Date().toISOString(),
  };
}

const ISSUED_BILL: MaintenanceBill = {
  id: "bill-302-2026-10",
  billNumber: "INV-202610-302A",
  flatNumber: "302",
  tower: "Tower A",
  month: 10,
  year: 2026,
  charges: [
    { item: "Maintenance", amount: 1500, componentType: "MAINTENANCE" },
    { item: "Sinking Fund", amount: 500, componentType: "SINKING_FUND" },
  ],
  subtotal: 2000,
  penaltyAmount: 0,
  discountAmount: 0,
  totalAmount: 2000,
  paidAmount: 0,
  dueAmount: 2000,
  dueDate: "2026-10-15",
  status: "ISSUED",
  generatedAt: "2026-10-01T00:00:00.000Z",
};

/** Server-issued payment intent: the client mints no identifiers of its own. */
const SERVER_INTENT: ManaPaymentIntentResponse = {
  intentId: "PI_SRV_MAINT_4500",
  idempotencyKey: "stubbed-idempotency-key",
  domain: "MAINTENANCE_BILL",
  orderReferenceId: "ORD-TEST-101",
  amount: 4500,
  currency: "INR",
  status: "PENDING",
  preferredRail: "UPI_INTENT",
  upiVpa: "rwa-collections@hdfcbank",
  upiIntentUri: "upi://pay?pa=rwa-collections@hdfcbank&am=4500.00&tr=PI_SRV_MAINT_4500",
  expiresAt: "2026-11-22T12:00:00.000Z",
  createdAt: "2026-11-22T11:45:00.000Z",
};

describe("Money Systems Strict Separation & Authoritative Boundaries", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();

    getMock.mockImplementation(async (path: string) => {
      if (path.startsWith("/billing/my-bill")) {
        return envelope(ISSUED_BILL);
      }
      throw new Error(`Unstubbed GET ${path}`);
    });

    postMock.mockImplementation(async (path: string, body?: PaymentRequestBody) => {
      // Community Finance: record a payment against a maintenance invoice.
      if (/^\/billing\/invoices\/[^/]+\/pay$/.test(path)) {
        const amount = body?.amount ?? 0;
        const paidAmount = ISSUED_BILL.paidAmount + amount;
        const dueAmount = ISSUED_BILL.totalAmount - paidAmount;
        return envelope({
          bill: {
            ...ISSUED_BILL,
            paidAmount,
            dueAmount,
            status: dueAmount > 0 ? "PARTIAL" : "PAID",
            receiptNumber: "SRV-CRCP-2026-4410",
          },
          receipt: {
            receiptNumber: "SRV-CRCP-2026-4410",
            receiptDate: "2026-11-22T11:50:00.000Z",
            invoiceNumber: ISSUED_BILL.billNumber,
            flatNumber: ISSUED_BILL.flatNumber,
            tower: ISSUED_BILL.tower,
            amountPaid: amount,
            paymentMode: body?.paymentMode ?? "UPI",
            transactionRef: "SRV-TXNREF-77120",
            payerName: "Resident User",
            allocations: [{ item: "Maintenance", amount }],
          },
        });
      }
      // Mana Pay: create a payment intent.
      if (path === "/payments/intents") {
        return SERVER_INTENT;
      }
      throw new Error(`Unstubbed POST ${path}`);
    });
  });

  it("1. Community Finance: Paying a maintenance bill does NOT automatically create a My Money transaction", async () => {
    const initialTxCount = personalFinanceService.getTransactions().length;

    // Record payment in Community Finance
    const bill = await communityFinanceService.getMyBill(COMMUNITY_ID, "302");
    expect(bill).not.toBeNull();
    if (!bill) return;
    // The envelope was unwrapped, so the payload is the bill itself.
    expect(bill.billNumber).toBe("INV-202610-302A");
    expect((bill as unknown as Record<string, unknown>).success).toBeUndefined();

    const result = await communityFinanceService.recordPayment(bill.id, 500, "UPI", COMMUNITY_ID);
    expect(apiClient.post).toHaveBeenCalledWith(`/billing/invoices/${bill.id}/pay`, {
      amount: 500,
      paymentMode: "UPI",
      communityId: COMMUNITY_ID,
    });
    expect(result).not.toBeNull();
    expect(result?.bill.status).toBe("PARTIAL");
    expect(result?.bill.dueAmount).toBe(1500);
    expect(result?.receipt.amountPaid).toBe(500);
    // Receipt identifiers come from the server, not from the client.
    expect(result?.receipt.receiptNumber).toBe("SRV-CRCP-2026-4410");

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

    // No community-finance endpoint was touched by the rewards ledger.
    expect(apiClient.post).not.toHaveBeenCalled();
    expect(apiClient.get).not.toHaveBeenCalled();

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

    expect(intent.intentId).toBe("PI_SRV_MAINT_4500");
    expect(intent.status).toBe("PENDING");

    // Creating an intent is only a Mana Pay call: no community billing write.
    expect(apiClient.post).toHaveBeenCalledTimes(1);
    expect(apiClient.post).toHaveBeenCalledWith("/payments/intents", expect.objectContaining({
      domain: "MAINTENANCE_BILL",
      orderReferenceId: "ORD-TEST-101",
      amount: 4500,
    }));

    // Pure payment orchestration does not mutate resident's personal finance ledger
    expect(personalFinanceService.getTransactions().length).toBe(initialTxCount);
  });
});
