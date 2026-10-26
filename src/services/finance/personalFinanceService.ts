import { apiClient } from "../common/apiClient";
import { safeStorage } from "../../utils/storage";

// ─── DTOs & Types ────────────────────────────────────────────────────────────

export type AccountType =
  | "SAVINGS"
  | "CURRENT"
  | "CREDIT_CARD"
  | "WALLET"
  | "CASH"
  | "INVESTMENT"
  | "LOAN";

export type TransactionType = "INCOME" | "EXPENSE" | "TRANSFER";
export type BudgetPeriod = "MONTHLY" | "QUARTERLY" | "YEARLY";

export interface PersonalAccountDto {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  creditLimit?: number;
  currency: string;
  bankName?: string;
  accountNumber?: string;
  billingDay?: number;
  paymentDueDay?: number;
  color: string;
  icon: string;
  isActive: boolean;
  createdAt: string;
}

export interface PersonalCategoryDto {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: "INCOME" | "EXPENSE";
  subcategories?: { id: string; name: string; icon: string; parentId: string }[];
}

export interface PersonalSpendingCategoryDto {
  key: string;
  label: string;
  icon: string;
  color: string;
  amount: number;
  percentage: number;
  transactionCount: number;
}

export interface PersonalTransactionDto {
  id: string;
  type: TransactionType;
  amount: number;
  currency: string;
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  subcategoryName?: string;
  accountId: string;
  accountName: string;
  toAccountId?: string;
  toAccountName?: string;
  description: string;
  notes?: string;
  receiptUrl?: string;
  receiptUrls?: string[];
  tags?: string;
  splitDetails?: string;
  date: string;
  isManaProjection: boolean;
  sourceModule?: string;
  sourceType?: string;
  sourceId?: string;
  sourceLabel?: string;
  createdAt: string;
}

export interface CreatePersonalTransactionDto {
  type: TransactionType;
  amount: number;
  categoryId?: string;
  subcategoryId?: string;
  subcategoryName?: string;
  accountId: string;
  toAccountId?: string;
  description: string;
  notes?: string;
  receiptUrl?: string;
  receiptUrls?: string[];
  tags?: string;
  splitDetails?: string;
  date?: string;
}

export interface PersonalBudgetDto {
  id: string;
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  period: BudgetPeriod;
  limitAmount: number;
  spentAmount: number;
  remainingAmount: number;
  percentUsed: number;
  alertThreshold: number;
  month: string;
  isOverspent: boolean;
  expectedPacePercent?: number;
}

export interface PersonalRecurringDto {
  id: string;
  name: string;
  type: TransactionType;
  amount: number;
  categoryId?: string;
  categoryName?: string;
  categoryIcon?: string;
  categoryColor?: string;
  accountId: string;
  frequency: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
  nextDueDate: string;
  isActive: boolean;
  detectedCadenceDays?: number;
  confidenceScore?: number;
}

export interface PersonalBillDto {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  categoryId?: string;
  categoryName?: string;
  categoryIcon?: string;
  categoryColor?: string;
  isPaid: boolean;
  isAutoPay?: boolean;
  reminderDaysBefore: number;
  isManaInvoice?: boolean;
  invoiceId?: string;
}

export interface PersonalGoalDto {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  remainingAmount: number;
  percentAchieved: number;
  requiredMonthlySavings: number;
  monthsRemaining: number;
  targetDate?: string;
  icon?: string;
  color?: string;
  categoryId?: string;
  notes?: string;
  isCompleted: boolean;
}

export interface PersonalReceiptDto {
  id: string;
  merchantName: string;
  amount: number;
  date: string;
  category: string;
  imageUrl: string;
  ocrExtracted: boolean;
  taxAmount?: number;
  itemsCount?: number;
  transactionId?: string;
  notes?: string;
  createdAt: string;
}

export interface DashboardSummaryDto {
  month: string;
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  savingsRate: number;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  totalCommunitySpending?: number;
  communitySpendingBreakdown?: PersonalSpendingCategoryDto[];
  totalOtherSpending?: number;
  otherSpendingBreakdown?: PersonalSpendingCategoryDto[];
  recentTransactions: PersonalTransactionDto[];
  manaProjections: PersonalTransactionDto[];
  budgetAlerts: PersonalBudgetDto[];
}

// ── CRED-Inspired Insights DTOs ──────────────────────────────────────────────

export interface DuplicateSpendAlert {
  id: string;
  transaction1: PersonalTransactionDto;
  transaction2: PersonalTransactionDto;
  amount: number;
  description: string;
  timeGapHours: number;
  confidence: "HIGH" | "MEDIUM";
  status: "UNRESOLVED" | "CONFIRMED_DUPLICATE" | "DISMISSED";
}

export interface LifestyleCategoryInsight {
  category: "HEALTHCARE" | "SPORTS" | "TRAVEL" | "SHOPPING" | "HOUSING" | "OTHER";
  label: string;
  icon: string;
  color: string;
  amount: number;
  percentage: number;
  transactionCount: number;
  transactions: PersonalTransactionDto[];
}

export interface TripExpenseReport {
  tripName: string;
  tripId?: string;
  destination: string;
  totalSpent: number;
  expenseCount: number;
  breakdown: { category: string; amount: number }[];
  transactions: PersonalTransactionDto[];
}

export interface UpcomingBillItem {
  id: string;
  title: string;
  biller: string;
  amount: number;
  dueDate: string;
  daysRemaining: number;
  status: "DUE_SOON" | "UPCOMING" | "PAID";
  hasAutoPay: boolean;
  source: "SOCIETY_INVOICE" | "CREDIT_CARD" | "UTILITY" | "SUBSCRIPTION";
}

export interface CredInsightsSummaryDto {
  month: string;
  cashFlowBurnRate: number; // Daily spend rate
  cashFlowRunwayMonths: number; // Liquid assets / monthly burn
  lifestyleCategories: LifestyleCategoryInsight[];
  duplicateWarnings: DuplicateSpendAlert[];
  detectedRecurring: PersonalRecurringDto[];
  upcomingBills: UpcomingBillItem[];
  tripReports: TripExpenseReport[];
  budgetVariance: {
    category: string;
    budgetAmount: number;
    actualAmount: number;
    varianceAmount: number;
    variancePercent: number;
    status: "UNDER" | "OVER" | "ON_PACE";
  }[];
}

// ─── Initial Fallback Data ───────────────────────────────────────────────────

const INITIAL_ACCOUNTS: PersonalAccountDto[] = [
  {
    id: "acc-1",
    name: "HDFC Salary Account",
    type: "SAVINGS",
    balance: 78500,
    currency: "₹",
    bankName: "HDFC Bank",
    accountNumber: "••••4821",
    color: "#3B82F6",
    icon: "Landmark",
    isActive: true,
    createdAt: "2026-01-01",
  },
  {
    id: "acc-2",
    name: "ICICI Amazon Pay CC",
    type: "CREDIT_CARD",
    balance: -18400,
    creditLimit: 150000,
    currency: "₹",
    bankName: "ICICI Bank",
    accountNumber: "••••9033",
    billingDay: 15,
    paymentDueDay: 5,
    color: "#8B5CF6",
    icon: "CreditCard",
    isActive: true,
    createdAt: "2026-01-01",
  },
  {
    id: "acc-3",
    name: "Cash in Hand",
    type: "CASH",
    balance: 5500,
    currency: "₹",
    color: "#10B981",
    icon: "Wallet",
    isActive: true,
    createdAt: "2026-01-01",
  },
  {
    id: "acc-4",
    name: "Zerodha Demat Portfolio",
    type: "INVESTMENT",
    balance: 345000,
    currency: "₹",
    color: "#F59E0B",
    icon: "TrendingUp",
    isActive: true,
    createdAt: "2026-01-01",
  },
];

const INITIAL_CATEGORIES: PersonalCategoryDto[] = [
  {
    id: "cat-1",
    name: "Housing & Society",
    icon: "Home",
    color: "#6366F1",
    type: "EXPENSE",
    subcategories: [
      { id: "sub-1", name: "Maintenance Dues", icon: "Building", parentId: "cat-1" },
      { id: "sub-2", name: "Amenity Bookings", icon: "Trophy", parentId: "cat-1" },
      { id: "sub-3", name: "EV Charging", icon: "Zap", parentId: "cat-1" },
    ],
  },
  {
    id: "cat-2",
    name: "Food & Groceries",
    icon: "ShoppingCart",
    color: "#10B981",
    type: "EXPENSE",
    subcategories: [
      { id: "sub-4", name: "Supermarket", icon: "ShoppingBag", parentId: "cat-2" },
      { id: "sub-5", name: "Dining Out", icon: "Utensils", parentId: "cat-2" },
    ],
  },
  {
    id: "cat-3",
    name: "Utilities & Bills",
    icon: "Receipt",
    color: "#F59E0B",
    type: "EXPENSE",
    subcategories: [
      { id: "sub-6", name: "Electricity", icon: "Zap", parentId: "cat-3" },
      { id: "sub-7", name: "Internet / Wi-Fi", icon: "Wifi", parentId: "cat-3" },
    ],
  },
  {
    id: "cat-4",
    name: "Salary & Professional",
    icon: "Briefcase",
    color: "#3B82F6",
    type: "INCOME",
    subcategories: [
      { id: "sub-8", name: "Base Salary", icon: "Banknote", parentId: "cat-4" },
      { id: "sub-9", name: "Freelance & Consulting", icon: "Laptop", parentId: "cat-4" },
    ],
  },
  {
    id: "cat-5",
    name: "Investments & Returns",
    icon: "TrendingUp",
    color: "#8B5CF6",
    type: "INCOME",
  },
  {
    id: "cat-health",
    name: "Healthcare & Pharmacy",
    icon: "Stethoscope",
    color: "#EC4899",
    type: "EXPENSE",
  },
  {
    id: "cat-sports",
    name: "Sports & Fitness",
    icon: "Trophy",
    color: "#06B6D4",
    type: "EXPENSE",
  },
  {
    id: "cat-travel",
    name: "Travel & Trips",
    icon: "Compass",
    color: "#F97316",
    type: "EXPENSE",
  },
];

const INITIAL_TRANSACTIONS: PersonalTransactionDto[] = [
  {
    id: "txn-1",
    type: "EXPENSE",
    amount: 3500,
    currency: "₹",
    categoryId: "cat-1",
    categoryName: "Housing & Society",
    categoryIcon: "Home",
    categoryColor: "#6366F1",
    subcategoryName: "Maintenance Dues",
    accountId: "acc-1",
    accountName: "HDFC Salary Account",
    description: "October Maintenance Bill (Flat 302)",
    date: "2026-10-01",
    isManaProjection: true,
    sourceModule: "COMMUNITY_FINANCE",
    sourceType: "INVOICE",
    sourceId: "inv-oct-302",
    sourceLabel: "Mana Society Invoice #OCT-302",
    createdAt: "2026-10-01T10:00:00Z",
  },
  {
    id: "txn-2",
    type: "EXPENSE",
    amount: 2450,
    currency: "₹",
    categoryId: "cat-2",
    categoryName: "Food & Groceries",
    categoryIcon: "ShoppingCart",
    categoryColor: "#10B981",
    subcategoryName: "Supermarket",
    accountId: "acc-2",
    accountName: "ICICI Amazon Pay CC",
    description: "Weekly Groceries — Community Organic Hub",
    date: "2026-10-03",
    isManaProjection: false,
    createdAt: "2026-10-03T14:30:00Z",
  },
  {
    id: "txn-3",
    type: "INCOME",
    amount: 95000,
    currency: "₹",
    categoryId: "cat-4",
    categoryName: "Salary & Professional",
    categoryIcon: "Briefcase",
    categoryColor: "#3B82F6",
    subcategoryName: "Base Salary",
    accountId: "acc-1",
    accountName: "HDFC Salary Account",
    description: "Monthly Salary Credit",
    date: "2026-10-01",
    isManaProjection: false,
    createdAt: "2026-10-01T09:00:00Z",
  },
  {
    id: "txn-4",
    type: "EXPENSE",
    amount: 1199,
    currency: "₹",
    categoryId: "cat-3",
    categoryName: "Utilities & Bills",
    categoryIcon: "Receipt",
    categoryColor: "#F59E0B",
    subcategoryName: "Internet / Wi-Fi",
    accountId: "acc-2",
    accountName: "ICICI Amazon Pay CC",
    description: "Fiber Broadband Bill",
    date: "2026-10-05",
    isManaProjection: false,
    createdAt: "2026-10-05T11:00:00Z",
  },
  {
    id: "txn-5",
    type: "EXPENSE",
    amount: 800,
    currency: "₹",
    categoryId: "cat-sports",
    categoryName: "Sports & Fitness",
    categoryIcon: "Trophy",
    categoryColor: "#06B6D4",
    subcategoryName: "Amenity Bookings",
    accountId: "acc-1",
    accountName: "HDFC Salary Account",
    description: "Badminton Court Booking Slot (Weekend)",
    date: "2026-10-07",
    isManaProjection: true,
    sourceModule: "AMENITY_BOOKINGS",
    sourceLabel: "Clubhouse Booking #BM-449",
    createdAt: "2026-10-07T16:00:00Z",
  },
  {
    id: "txn-6",
    type: "EXPENSE",
    amount: 1450,
    currency: "₹",
    categoryId: "cat-health",
    categoryName: "Healthcare & Pharmacy",
    categoryIcon: "Stethoscope",
    categoryColor: "#EC4899",
    accountId: "acc-2",
    accountName: "ICICI Amazon Pay CC",
    description: "Apollo Pharmacy — Routine Family Prescriptions",
    date: "2026-10-06",
    isManaProjection: false,
    createdAt: "2026-10-06T19:00:00Z",
  },
  {
    id: "txn-7",
    type: "EXPENSE",
    amount: 3500,
    currency: "₹",
    categoryId: "cat-travel",
    categoryName: "Travel & Trips",
    categoryIcon: "Compass",
    categoryColor: "#F97316",
    accountId: "acc-1",
    accountName: "HDFC Salary Account",
    description: "Wayanad Weekend Trek & Homestay Share",
    date: "2026-10-02",
    isManaProjection: true,
    sourceModule: "TRIPS",
    sourceLabel: "Trip TRP-1 Share",
    createdAt: "2026-10-02T10:00:00Z",
  },
  {
    id: "txn-8",
    type: "EXPENSE",
    amount: 649,
    currency: "₹",
    categoryId: "cat-3",
    categoryName: "Utilities & Bills",
    categoryIcon: "Receipt",
    categoryColor: "#F59E0B",
    accountId: "acc-2",
    accountName: "ICICI Amazon Pay CC",
    description: "Netflix 4K Premium Subscription",
    date: "2026-10-04",
    isManaProjection: false,
    createdAt: "2026-10-04T08:00:00Z",
  },
  // Suspicious duplicate example
  {
    id: "txn-9",
    type: "EXPENSE",
    amount: 450,
    currency: "₹",
    categoryId: "cat-2",
    categoryName: "Food & Groceries",
    categoryIcon: "ShoppingCart",
    categoryColor: "#10B981",
    accountId: "acc-2",
    accountName: "ICICI Amazon Pay CC",
    description: "Starbucks Coffee Terminal 2",
    date: "2026-10-08",
    isManaProjection: false,
    createdAt: "2026-10-08T14:15:00Z",
  },
  {
    id: "txn-10",
    type: "EXPENSE",
    amount: 450,
    currency: "₹",
    categoryId: "cat-2",
    categoryName: "Food & Groceries",
    categoryIcon: "ShoppingCart",
    categoryColor: "#10B981",
    accountId: "acc-2",
    accountName: "ICICI Amazon Pay CC",
    description: "Starbucks Coffee Terminal 2",
    date: "2026-10-08",
    isManaProjection: false,
    createdAt: "2026-10-08T14:16:30Z",
  },
];

const INITIAL_BUDGETS: PersonalBudgetDto[] = [
  {
    id: "bgt-1",
    categoryId: "cat-1",
    categoryName: "Housing & Society",
    categoryIcon: "Home",
    categoryColor: "#6366F1",
    period: "MONTHLY",
    limitAmount: 6000,
    spentAmount: 4300,
    remainingAmount: 1700,
    percentUsed: 71,
    alertThreshold: 80,
    month: "2026-10",
    isOverspent: false,
    expectedPacePercent: 65,
  },
  {
    id: "bgt-2",
    categoryId: "cat-2",
    categoryName: "Food & Groceries",
    categoryIcon: "ShoppingCart",
    categoryColor: "#10B981",
    period: "MONTHLY",
    limitAmount: 18000,
    spentAmount: 3350,
    remainingAmount: 14650,
    percentUsed: 19,
    alertThreshold: 80,
    month: "2026-10",
    isOverspent: false,
    expectedPacePercent: 30,
  },
  {
    id: "bgt-3",
    categoryId: "cat-3",
    categoryName: "Utilities & Bills",
    categoryIcon: "Receipt",
    categoryColor: "#F59E0B",
    period: "MONTHLY",
    limitAmount: 4000,
    spentAmount: 1848,
    remainingAmount: 2152,
    percentUsed: 46,
    alertThreshold: 80,
    month: "2026-10",
    isOverspent: false,
    expectedPacePercent: 50,
  },
  {
    id: "bgt-4",
    categoryId: "cat-travel",
    categoryName: "Travel & Trips",
    categoryIcon: "Compass",
    categoryColor: "#F97316",
    period: "MONTHLY",
    limitAmount: 8000,
    spentAmount: 3500,
    remainingAmount: 4500,
    percentUsed: 44,
    alertThreshold: 80,
    month: "2026-10",
    isOverspent: false,
  },
];

const INITIAL_GOALS: PersonalGoalDto[] = [
  {
    id: "goal-1",
    name: "Emergency Fund (6 Months)",
    targetAmount: 300000,
    currentAmount: 195000,
    remainingAmount: 105000,
    percentAchieved: 65,
    requiredMonthlySavings: 15000,
    monthsRemaining: 7,
    targetDate: "2027-05-31",
    icon: "ShieldCheck",
    color: "#10B981",
    notes: "High liquidity savings for unforeseen medical or work gaps",
    isCompleted: false,
  },
  {
    id: "goal-2",
    name: "Clubhouse EV Car Down Payment",
    targetAmount: 200000,
    currentAmount: 85000,
    remainingAmount: 115000,
    percentAchieved: 42,
    requiredMonthlySavings: 12000,
    monthsRemaining: 10,
    targetDate: "2027-08-31",
    icon: "Zap",
    color: "#3B82F6",
    notes: "Planning electric vehicle switch with basement charger point",
    isCompleted: false,
  },
];

const INITIAL_RECEIPTS: PersonalReceiptDto[] = [
  {
    id: "rec-1",
    merchantName: "Nature's Basket Community Store",
    amount: 2450,
    date: "2026-10-03",
    category: "Groceries",
    imageUrl: "https://images.unsplash.com/photo-1554415707-9e49017a1430?w=600&auto=format&fit=crop&q=80",
    ocrExtracted: true,
    itemsCount: 7,
    notes: "Vegetables, olive oil, bread, dairy",
    createdAt: "2026-10-03T14:30:00Z",
  },
  {
    id: "rec-2",
    merchantName: "Mana Society Clubhouse Office",
    amount: 3500,
    date: "2026-10-01",
    category: "Housing",
    imageUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80",
    ocrExtracted: true,
    itemsCount: 1,
    notes: "Maintenance invoice receipt #REC-302-OCT",
    createdAt: "2026-10-01T10:05:00Z",
  },
];

const STORAGE_KEY = "mana_personal_finance_store_v1";

interface PersonalFinanceStore {
  accounts: PersonalAccountDto[];
  categories: PersonalCategoryDto[];
  transactions: PersonalTransactionDto[];
  budgets: PersonalBudgetDto[];
  goals: PersonalGoalDto[];
  receipts: PersonalReceiptDto[];
}

let inMemoryFallbackStore: PersonalFinanceStore | null = null;

function loadStore(): PersonalFinanceStore {
  try {
    const raw = safeStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  if (inMemoryFallbackStore) {
    return inMemoryFallbackStore;
  }
  return JSON.parse(
    JSON.stringify({
      accounts: INITIAL_ACCOUNTS,
      categories: INITIAL_CATEGORIES,
      transactions: INITIAL_TRANSACTIONS,
      budgets: INITIAL_BUDGETS,
      goals: INITIAL_GOALS,
      receipts: INITIAL_RECEIPTS,
    })
  );
}

function saveStore(store: PersonalFinanceStore) {
  inMemoryFallbackStore = store;
  try {
    safeStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {}
}

// ─── Service API ─────────────────────────────────────────────────────────────

export const personalFinanceService = {
  getAccounts(): PersonalAccountDto[] {
    return loadStore().accounts;
  },

  createAccount(dto: Omit<PersonalAccountDto, "id" | "createdAt" | "isActive">): PersonalAccountDto {
    const store = loadStore();
    const newAcc: PersonalAccountDto = {
      ...dto,
      id: `acc-${Date.now()}`,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    store.accounts.push(newAcc);
    saveStore(store);
    return newAcc;
  },

  getCategories(): PersonalCategoryDto[] {
    return loadStore().categories;
  },

  getTransactions(): PersonalTransactionDto[] {
    const store = loadStore();
    return store.transactions.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  },

  createTransaction(dto: CreatePersonalTransactionDto): PersonalTransactionDto {
    const store = loadStore();
    const cat = store.categories.find((c) => c.id === dto.categoryId);
    const acc = store.accounts.find((a) => a.id === dto.accountId);

    const newTxn: PersonalTransactionDto = {
      id: `txn-${Date.now()}`,
      type: dto.type,
      amount: dto.amount,
      currency: "₹",
      categoryId: dto.categoryId || "cat-other",
      categoryName: cat?.name || "General Expenses",
      categoryIcon: cat?.icon || "CircleDollarSign",
      categoryColor: cat?.color || "#6B7280",
      subcategoryName: dto.subcategoryName,
      accountId: dto.accountId,
      accountName: acc?.name || "Cash",
      description: dto.description,
      notes: dto.notes,
      tags: dto.tags,
      splitDetails: dto.splitDetails,
      date: dto.date || new Date().toISOString().split("T")[0],
      isManaProjection: false,
      createdAt: new Date().toISOString(),
    };

    if (acc) {
      if (dto.type === "INCOME") acc.balance += dto.amount;
      else if (dto.type === "EXPENSE") acc.balance -= dto.amount;
    }

    if (dto.type === "EXPENSE" && dto.categoryId) {
      const budget = store.budgets.find((b) => b.categoryId === dto.categoryId);
      if (budget) {
        budget.spentAmount += dto.amount;
        budget.remainingAmount = Math.max(0, budget.limitAmount - budget.spentAmount);
        budget.percentUsed = Math.round((budget.spentAmount / budget.limitAmount) * 100);
        budget.isOverspent = budget.spentAmount > budget.limitAmount;
      }
    }

    store.transactions.unshift(newTxn);
    saveStore(store);
    return newTxn;
  },

  getBudgets(): PersonalBudgetDto[] {
    return loadStore().budgets;
  },

  createBudget(dto: Partial<PersonalBudgetDto>): PersonalBudgetDto {
    const store = loadStore();
    const cat = store.categories.find((c) => c.id === dto.categoryId);
    const limit = dto.limitAmount || 5000;
    const newBgt: PersonalBudgetDto = {
      id: `bgt-${Date.now()}`,
      categoryId: dto.categoryId || "cat-1",
      categoryName: cat?.name || "Category",
      categoryIcon: cat?.icon || "Home",
      categoryColor: cat?.color || "#6366F1",
      period: dto.period || "MONTHLY",
      limitAmount: limit,
      spentAmount: 0,
      remainingAmount: limit,
      percentUsed: 0,
      alertThreshold: dto.alertThreshold || 80,
      month: "2026-10",
      isOverspent: false,
    };
    store.budgets.push(newBgt);
    saveStore(store);
    return newBgt;
  },

  getGoals(): PersonalGoalDto[] {
    return loadStore().goals;
  },

  createGoal(dto: Partial<PersonalGoalDto>): PersonalGoalDto {
    const store = loadStore();
    const target = dto.targetAmount || 50000;
    const current = dto.currentAmount || 0;
    const remaining = Math.max(0, target - current);
    const months = dto.monthsRemaining || 6;
    const newGoal: PersonalGoalDto = {
      id: `goal-${Date.now()}`,
      name: dto.name || "Savings Target",
      targetAmount: target,
      currentAmount: current,
      remainingAmount: remaining,
      percentAchieved: Math.round((current / target) * 100),
      requiredMonthlySavings: Math.round(remaining / months),
      monthsRemaining: months,
      targetDate: dto.targetDate || "2027-04-30",
      icon: dto.icon || "ShieldCheck",
      color: dto.color || "#10B981",
      notes: dto.notes,
      isCompleted: current >= target,
    };
    store.goals.push(newGoal);
    saveStore(store);
    return newGoal;
  },

  contributeToGoal(id: string, amount: number, accountId?: string): PersonalGoalDto | null {
    const store = loadStore();
    const goal = store.goals.find((g) => g.id === id);
    if (!goal) return null;
    goal.currentAmount += amount;
    goal.remainingAmount = Math.max(0, goal.targetAmount - goal.currentAmount);
    goal.percentAchieved = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
    goal.isCompleted = goal.currentAmount >= goal.targetAmount;

    if (accountId) {
      const acc = store.accounts.find((a) => a.id === accountId);
      if (acc) acc.balance -= amount;
    }

    saveStore(store);
    return goal;
  },

  getReceipts(): PersonalReceiptDto[] {
    return loadStore().receipts;
  },

  uploadReceipt(dto: Partial<PersonalReceiptDto>): PersonalReceiptDto {
    const store = loadStore();
    const newRec: PersonalReceiptDto = {
      id: `rec-${Date.now()}`,
      merchantName: dto.merchantName || "Receipt Entry",
      amount: dto.amount || 0,
      date: dto.date || new Date().toISOString().split("T")[0],
      category: dto.category || "General",
      imageUrl:
        dto.imageUrl ||
        "https://images.unsplash.com/photo-1554415707-9e49017a1430?w=600&auto=format&fit=crop&q=80",
      ocrExtracted: true,
      notes: dto.notes,
      createdAt: new Date().toISOString(),
    };
    store.receipts.unshift(newRec);
    saveStore(store);
    return newRec;
  },

  getDashboardSummary(): DashboardSummaryDto {
    const store = loadStore();
    const txns = store.transactions;

    let income = 0;
    let expenses = 0;
    let commSpend = 0;
    let otherSpend = 0;

    const commMap: Record<string, { label: string; icon: string; color: string; amount: number; count: number }> = {};
    const otherMap: Record<string, { label: string; icon: string; color: string; amount: number; count: number }> = {};

    txns.forEach((t) => {
      if (t.type === "INCOME") {
        income += t.amount;
      } else if (t.type === "EXPENSE") {
        expenses += t.amount;
        if (t.isManaProjection || t.sourceModule || t.categoryId === "cat-1") {
          commSpend += t.amount;
          if (!commMap[t.categoryName]) {
            commMap[t.categoryName] = { label: t.categoryName, icon: t.categoryIcon, color: t.categoryColor, amount: 0, count: 0 };
          }
          commMap[t.categoryName].amount += t.amount;
          commMap[t.categoryName].count += 1;
        } else {
          otherSpend += t.amount;
          if (!otherMap[t.categoryName]) {
            otherMap[t.categoryName] = { label: t.categoryName, icon: t.categoryIcon, color: t.categoryColor, amount: 0, count: 0 };
          }
          otherMap[t.categoryName].amount += t.amount;
          otherMap[t.categoryName].count += 1;
        }
      }
    });

    const assets = store.accounts
      .filter((a) => a.balance > 0)
      .reduce((s, a) => s + a.balance, 0);

    const liabilities = Math.abs(
      store.accounts
        .filter((a) => a.balance < 0)
        .reduce((s, a) => s + a.balance, 0)
    );

    const netWorth = assets - liabilities;
    const netSavings = income - expenses;
    const savingsRate = income > 0 ? Math.max(0, Math.round((netSavings / income) * 100)) : 0;

    const communityBreakdown: PersonalSpendingCategoryDto[] = Object.entries(commMap).map(
      ([key, val]) => ({
        key,
        label: val.label,
        icon: val.icon,
        color: val.color,
        amount: val.amount,
        percentage: commSpend > 0 ? Math.round((val.amount / commSpend) * 100) : 0,
        transactionCount: val.count,
      })
    );

    const otherBreakdown: PersonalSpendingCategoryDto[] = Object.entries(otherMap).map(
      ([key, val]) => ({
        key,
        label: val.label,
        icon: val.icon,
        color: val.color,
        amount: val.amount,
        percentage: otherSpend > 0 ? Math.round((val.amount / otherSpend) * 100) : 0,
        transactionCount: val.count,
      })
    );

    return {
      month: "October 2026",
      totalIncome: income,
      totalExpenses: expenses,
      netSavings,
      savingsRate,
      totalAssets: assets,
      totalLiabilities: liabilities,
      netWorth,
      totalCommunitySpending: commSpend,
      communitySpendingBreakdown: communityBreakdown,
      totalOtherSpending: otherSpend,
      otherSpendingBreakdown: otherBreakdown,
      recentTransactions: txns.slice(0, 6),
      manaProjections: txns.filter((t) => t.isManaProjection),
      budgetAlerts: store.budgets.filter((b) => b.percentUsed >= b.alertThreshold || b.isOverspent),
    };
  },

  // ── CRED-Inspired Personal Insights Engine ─────────────────────────────────

  detectDuplicateSpends(): DuplicateSpendAlert[] {
    const txns = this.getTransactions().filter((t) => t.type === "EXPENSE");
    const alerts: DuplicateSpendAlert[] = [];

    for (let i = 0; i < txns.length; i++) {
      for (let j = i + 1; j < txns.length; j++) {
        const t1 = txns[i];
        const t2 = txns[j];

        // Same amount and matching description or exact merchant
        if (
          t1.amount === t2.amount &&
          (t1.description.toLowerCase() === t2.description.toLowerCase() ||
           t1.accountId === t2.accountId)
        ) {
          const d1 = new Date(t1.createdAt || t1.date).getTime();
          const d2 = new Date(t2.createdAt || t2.date).getTime();
          const gapHours = Math.abs(d1 - d2) / (1000 * 60 * 60);

          if (gapHours <= 48) {
            alerts.push({
              id: `dup-${t1.id}-${t2.id}`,
              transaction1: t1,
              transaction2: t2,
              amount: t1.amount,
              description: t1.description,
              timeGapHours: Math.round(gapHours * 10) / 10,
              confidence: gapHours <= 2 ? "HIGH" : "MEDIUM",
              status: "UNRESOLVED",
            });
          }
        }
      }
    }

    return alerts;
  },

  detectRecurringSubscriptions(): PersonalRecurringDto[] {
    const txns = this.getTransactions().filter((t) => t.type === "EXPENSE");
    const detected: PersonalRecurringDto[] = [
      {
        id: "rec-broadband",
        name: "Fiber Broadband Bill",
        type: "EXPENSE",
        amount: 1199,
        categoryName: "Utilities & Bills",
        accountId: "acc-2",
        frequency: "MONTHLY",
        nextDueDate: "2026-11-05",
        isActive: true,
        detectedCadenceDays: 30,
        confidenceScore: 98,
      },
      {
        id: "rec-netflix",
        name: "Netflix 4K Premium",
        type: "EXPENSE",
        amount: 649,
        categoryName: "Utilities & Bills",
        accountId: "acc-2",
        frequency: "MONTHLY",
        nextDueDate: "2026-11-04",
        isActive: true,
        detectedCadenceDays: 30,
        confidenceScore: 99,
      },
      {
        id: "rec-maintenance",
        name: "Mana Society Maintenance",
        type: "EXPENSE",
        amount: 3500,
        categoryName: "Housing & Society",
        accountId: "acc-1",
        frequency: "MONTHLY",
        nextDueDate: "2026-11-01",
        isActive: true,
        detectedCadenceDays: 30,
        confidenceScore: 100,
      },
    ];

    return detected;
  },

  getLifestyleCategoryBreakdown(): LifestyleCategoryInsight[] {
    const txns = this.getTransactions().filter((t) => t.type === "EXPENSE");
    let total = txns.reduce((s, t) => s + t.amount, 0);
    if (total === 0) total = 1;

    const map: Record<LifestyleCategoryInsight["category"], { label: string; icon: string; color: string; amount: number; txns: PersonalTransactionDto[] }> = {
      HEALTHCARE: { label: "Healthcare & Pharmacy", icon: "Stethoscope", color: "#EC4899", amount: 0, txns: [] },
      SPORTS: { label: "Sports & Fitness", icon: "Trophy", color: "#06B6D4", amount: 0, txns: [] },
      TRAVEL: { label: "Travel & Community Trips", icon: "Compass", color: "#F97316", amount: 0, txns: [] },
      SHOPPING: { label: "Shopping & Groceries", icon: "ShoppingBag", color: "#10B981", amount: 0, txns: [] },
      HOUSING: { label: "Housing & Society Living", icon: "Home", color: "#6366F1", amount: 0, txns: [] },
      OTHER: { label: "Other Living Utilities", icon: "Receipt", color: "#6B7280", amount: 0, txns: [] },
    };

    txns.forEach((t) => {
      const desc = t.description.toLowerCase();
      const cat = t.categoryName.toLowerCase();

      if (cat.includes("health") || desc.includes("pharmacy") || desc.includes("doctor") || desc.includes("clinic") || desc.includes("hospital")) {
        map.HEALTHCARE.amount += t.amount;
        map.HEALTHCARE.txns.push(t);
      } else if (cat.includes("sport") || desc.includes("badminton") || desc.includes("court") || desc.includes("tournament") || desc.includes("gym")) {
        map.SPORTS.amount += t.amount;
        map.SPORTS.txns.push(t);
      } else if (cat.includes("travel") || cat.includes("trip") || desc.includes("trip") || desc.includes("trek") || desc.includes("resort") || desc.includes("toll")) {
        map.TRAVEL.amount += t.amount;
        map.TRAVEL.txns.push(t);
      } else if (cat.includes("food") || cat.includes("grocer") || desc.includes("supermarket") || desc.includes("organic") || desc.includes("mart") || desc.includes("coffee")) {
        map.SHOPPING.amount += t.amount;
        map.SHOPPING.txns.push(t);
      } else if (cat.includes("housing") || desc.includes("maintenance") || desc.includes("society") || desc.includes("clubhouse")) {
        map.HOUSING.amount += t.amount;
        map.HOUSING.txns.push(t);
      } else {
        map.OTHER.amount += t.amount;
        map.OTHER.txns.push(t);
      }
    });

    return (Object.keys(map) as (keyof typeof map)[]).map((key) => {
      const item = map[key];
      return {
        category: key,
        label: item.label,
        icon: item.icon,
        color: item.color,
        amount: item.amount,
        percentage: Math.round((item.amount / total) * 100),
        transactionCount: item.txns.length,
        transactions: item.txns,
      };
    });
  },

  getTripExpenseReports(): TripExpenseReport[] {
    const txns = this.getTransactions().filter(
      (t) => t.type === "EXPENSE" && (t.sourceModule === "TRIPS" || t.categoryName.toLowerCase().includes("travel") || t.description.toLowerCase().includes("trek") || t.description.toLowerCase().includes("trip"))
    );

    return [
      {
        tripName: "Wayanad Weekend Trek & Camp",
        tripId: "TRP-1",
        destination: "Wayanad, Kerala",
        totalSpent: 3500,
        expenseCount: 1,
        breakdown: [
          { category: "Homestay & Safari Share", amount: 3500 },
        ],
        transactions: txns,
      },
    ];
  },

  getUpcomingBillCalendar(): UpcomingBillItem[] {
    return [
      {
        id: "bill-1",
        title: "Mana Society Maintenance Bill",
        biller: "Mana Resident Welfare Association",
        amount: 3500,
        dueDate: "2026-11-01",
        daysRemaining: 20,
        status: "UPCOMING",
        hasAutoPay: true,
        source: "SOCIETY_INVOICE",
      },
      {
        id: "bill-2",
        title: "ICICI Amazon Pay Credit Card",
        biller: "ICICI Bank",
        amount: 18400,
        dueDate: "2026-10-15",
        daysRemaining: 3,
        status: "DUE_SOON",
        hasAutoPay: false,
        source: "CREDIT_CARD",
      },
      {
        id: "bill-3",
        title: "Fiber Broadband High Speed",
        biller: "Airtel Xstream Fiber",
        amount: 1199,
        dueDate: "2026-11-05",
        daysRemaining: 24,
        status: "UPCOMING",
        hasAutoPay: true,
        source: "UTILITY",
      },
      {
        id: "bill-4",
        title: "Netflix 4K Premium Plan",
        biller: "Netflix India",
        amount: 649,
        dueDate: "2026-11-04",
        daysRemaining: 23,
        status: "UPCOMING",
        hasAutoPay: true,
        source: "SUBSCRIPTION",
      },
    ];
  },

  getCredInsightsSummary(): CredInsightsSummaryDto {
    const summary = this.getDashboardSummary();
    const lifestyle = this.getLifestyleCategoryBreakdown();
    const duplicates = this.detectDuplicateSpends();
    const recurring = this.detectRecurringSubscriptions();
    const upcomingBills = this.getUpcomingBillCalendar();
    const tripReports = this.getTripExpenseReports();
    const budgets = this.getBudgets();

    const burnRate = Math.round(summary.totalExpenses / 11); // Oct 1 to 11
    const runwayMonths = burnRate > 0 ? Math.round((summary.totalAssets / (burnRate * 30)) * 10) / 10 : 12;

    const budgetVariance = budgets.map((b) => {
      const variance = b.limitAmount - b.spentAmount;
      const status: "UNDER" | "OVER" | "ON_PACE" = b.isOverspent ? "OVER" : b.percentUsed > b.alertThreshold ? "ON_PACE" : "UNDER";
      return {
        category: b.categoryName,
        budgetAmount: b.limitAmount,
        actualAmount: b.spentAmount,
        varianceAmount: variance,
        variancePercent: Math.round((variance / b.limitAmount) * 100),
        status,
      };
    });

    return {
      month: "October 2026",
      cashFlowBurnRate: burnRate,
      cashFlowRunwayMonths: runwayMonths,
      lifestyleCategories: lifestyle,
      duplicateWarnings: duplicates,
      detectedRecurring: recurring,
      upcomingBills,
      tripReports,
      budgetVariance,
    };
  },
};
