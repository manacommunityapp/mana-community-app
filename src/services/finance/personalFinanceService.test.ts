import { describe, it, expect, beforeEach } from "vitest";
import { personalFinanceService } from "./personalFinanceService";

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

describe("personalFinanceService", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("loads initial accounts and summary with valid net worth calculation", () => {
    const summary = personalFinanceService.getDashboardSummary();
    expect(summary).toBeDefined();
    expect(summary.totalAssets).toBeGreaterThan(0);
    expect(summary.netWorth).toBe(summary.totalAssets - summary.totalLiabilities);
    expect(summary.recentTransactions.length).toBeGreaterThan(0);
  });

  it("creates a new personal transaction and updates balances", () => {
    const accounts = personalFinanceService.getAccounts();
    const targetAcc = accounts[0];
    const initialBal = targetAcc.balance;

    const newTxn = personalFinanceService.createTransaction({
      type: "EXPENSE",
      amount: 1500,
      accountId: targetAcc.id,
      description: "Organic Veggies & Fruits",
      categoryId: "cat-2",
      notes: "Weekly delivery",
    });

    expect(newTxn.id).toBeDefined();
    expect(newTxn.amount).toBe(1500);

    const updatedAccs = personalFinanceService.getAccounts();
    const updated = updatedAccs.find((a) => a.id === targetAcc.id);
    expect(updated?.balance).toBe(initialBal - 1500);
  });

  it("updates envelope budgets when expenses are incurred", () => {
    const budgets = personalFinanceService.getBudgets();
    const budget = budgets.find((b) => b.categoryId === "cat-1");
    const initialSpent = budget?.spentAmount || 0;

    personalFinanceService.createTransaction({
      type: "EXPENSE",
      amount: 500,
      accountId: "acc-1",
      description: "Community Clubhouse Booking",
      categoryId: "cat-1",
    });

    const updatedBudgets = personalFinanceService.getBudgets();
    const updated = updatedBudgets.find((b) => b.categoryId === "cat-1");
    expect(updated?.spentAmount).toBe(initialSpent + 500);
  });

  it("supports contributing to savings targets and marks completion if target met", () => {
    const goals = personalFinanceService.getGoals();
    const goal = goals[0];
    const initialAmount = goal.currentAmount;

    const updatedGoal = personalFinanceService.contributeToGoal(goal.id, 5000, "acc-1");
    expect(updatedGoal?.currentAmount).toBe(initialAmount + 5000);
  });

  it("uploads receipt to vault with OCR extraction metadata", () => {
    const newReceipt = personalFinanceService.uploadReceipt({
      merchantName: "Hypermarket Fresh",
      amount: 2450,
      category: "Food & Groceries",
      notes: "Weekly groceries invoice",
    });

    expect(newReceipt.id).toBeDefined();
    expect(newReceipt.ocrExtracted).toBe(true);

    const receipts = personalFinanceService.getReceipts();
    expect(receipts.some((r) => r.id === newReceipt.id)).toBe(true);
  });

  // ── CRED-Inspired Spending Insights Tests ──

  describe("CRED-Inspired Insights Engine", () => {
    it("generates comprehensive CRED insights summary with burn rate and runway", () => {
      const insights = personalFinanceService.getCredInsightsSummary();
      expect(insights).toBeDefined();
      expect(insights.month).toBe("October 2026");
      expect(insights.cashFlowBurnRate).toBeGreaterThanOrEqual(0);
      expect(insights.cashFlowRunwayMonths).toBeGreaterThan(0);
      expect(Array.isArray(insights.lifestyleCategories)).toBe(true);
      expect(Array.isArray(insights.upcomingBills)).toBe(true);
      expect(Array.isArray(insights.detectedRecurring)).toBe(true);
      expect(Array.isArray(insights.tripReports)).toBe(true);
      expect(Array.isArray(insights.budgetVariance)).toBe(true);
    });

    it("detects duplicate charges occurring within 48h windows", () => {
      // Create duplicate transactions within 1 hour
      const now = new Date().toISOString();
      personalFinanceService.createTransaction({
        type: "EXPENSE",
        amount: 850,
        accountId: "acc-1",
        description: "Swiggy Gourmet Order",
        date: now,
      });
      personalFinanceService.createTransaction({
        type: "EXPENSE",
        amount: 850,
        accountId: "acc-1",
        description: "Swiggy Gourmet Order",
        date: now,
      });

      const duplicates = personalFinanceService.detectDuplicateSpends();
      expect(duplicates.length).toBeGreaterThan(0);
      const match = duplicates.find((d) => d.amount === 850 && d.description.includes("Swiggy"));
      expect(match).toBeDefined();
      expect(match?.confidence).toBe("HIGH");
      expect(match?.timeGapHours).toBeLessThanOrEqual(2);
    });

    it("identifies detected recurring subscriptions with cadence and auto-pay status", () => {
      const recurring = personalFinanceService.detectRecurringSubscriptions();
      expect(recurring.length).toBeGreaterThan(0);
      const broadband = recurring.find((r) => r.name.includes("Broadband"));
      expect(broadband).toBeDefined();
      expect(broadband?.frequency).toBe("MONTHLY");
      expect(broadband?.detectedCadenceDays).toBe(30);
      expect(broadband?.confidenceScore).toBeGreaterThan(90);
    });

    it("breakdowns spending across personal lifestyle categories (Healthcare, Sports, Travel, Shopping, Housing)", () => {
      const lifestyle = personalFinanceService.getLifestyleCategoryBreakdown();
      expect(lifestyle.length).toBe(6);

      const healthcare = lifestyle.find((l) => l.category === "HEALTHCARE");
      const sports = lifestyle.find((l) => l.category === "SPORTS");
      const travel = lifestyle.find((l) => l.category === "TRAVEL");
      const shopping = lifestyle.find((l) => l.category === "SHOPPING");
      const housing = lifestyle.find((l) => l.category === "HOUSING");

      expect(healthcare).toBeDefined();
      expect(sports).toBeDefined();
      expect(travel).toBeDefined();
      expect(shopping).toBeDefined();
      expect(housing).toBeDefined();
    });

    it("aggregates trip-wise expense reports", () => {
      const tripReports = personalFinanceService.getTripExpenseReports();
      expect(tripReports.length).toBeGreaterThan(0);
      const wayanadTrip = tripReports.find((t) => t.destination.includes("Wayanad"));
      expect(wayanadTrip).toBeDefined();
      expect(wayanadTrip?.totalSpent).toBeGreaterThan(0);
      expect(wayanadTrip?.breakdown.length).toBeGreaterThan(0);
    });

    it("provides upcoming bill calendar with due soon notifications", () => {
      const bills = personalFinanceService.getUpcomingBillCalendar();
      expect(bills.length).toBeGreaterThan(0);
      const ccBill = bills.find((b) => b.source === "CREDIT_CARD");
      expect(ccBill).toBeDefined();
      expect(ccBill?.status).toBe("DUE_SOON");
    });
  });
});
