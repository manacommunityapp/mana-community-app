import { apiClient } from "../common/apiClient";

// ── Types ─────────────────────────────────────────────────────────────────────

export type BillStatus = "PAID" | "PARTIAL" | "OVERDUE" | "PENDING" | "ISSUED" | "CANCELLED";
export type CalculationType = "FIXED_PER_FLAT" | "PER_SQUARE_FEET" | "HYBRID" | "FLAT_TYPE" | "TOWER" | "PARKING";
export type PaymentMode = "UPI" | "CARD" | "NET_BANKING" | "BANK_TRANSFER" | "WALLET" | "CHEQUE" | "CASH";
export type AccountType = "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";
export type EntryType = "DEBIT" | "CREDIT";

export interface BillCharge {
  item: string;
  amount: number;
  componentType?: string;
}

export interface MaintenanceBill {
  id: string;
  billNumber: string;
  flatNumber: string;
  tower: string;
  month: number;
  year: number;
  charges: BillCharge[];
  subtotal: number;
  penaltyAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  dueDate: string;
  status: BillStatus;
  generatedAt: string;
  paidAt?: string;
  receiptNumber?: string;
  pdfUrl?: string;
}

export interface MaintenancePlan {
  id: string;
  name: string;
  calculationType: CalculationType;
  fixedAmountPerFlat: number;
  ratePerSqFt: number;
  billingFrequency: string;
  isActive: boolean;
}

export interface ChargeRule {
  id: string;
  ruleName: string;
  componentType: string;
  calculationType: string;
  rate: number;
  tower?: string;
  flatType?: string;
  isActive: boolean;
}

export interface PenaltyConfig {
  gracePeriodDays: number;
  penaltyType: string;
  penaltyValue: number;
  maxPenaltyCap: number;
}

export interface AgingBucket {
  period: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface FinanceSummary {
  totalCollected: number;
  totalDue: number;
  totalOverdue: number;
  collectionPercent: number;
  activeFlats: number;
  paidFlats: number;
  overdueFlats: number;
  agingBuckets: AgingBucket[];
  towerPerformance: { tower: string; billed: number; collected: number; percent: number }[];
}

export interface GeneralLedgerEntry {
  id: string;
  accountCode: string;
  accountName: string;
  entryType: EntryType;
  amount: number;
  notes?: string;
}

export interface GeneralLedgerTransaction {
  id: string;
  transactionRef: string;
  transactionDate: string;
  referenceType: string;
  referenceId: string;
  narration: string;
  totalAmount: number;
  entries: GeneralLedgerEntry[];
}

export interface TrialBalanceItem {
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  debitAmount: number;
  creditAmount: number;
}

export interface AdvanceWallet {
  flatNumber: string;
  balanceAmount: number;
  totalDeposited: number;
  totalUtilized: number;
  lastUpdated: string;
}

export interface CommunityReceipt {
  receiptNumber: string;
  receiptDate: string;
  invoiceNumber: string;
  flatNumber: string;
  tower: string;
  amountPaid: number;
  paymentMode: PaymentMode;
  transactionRef: string;
  payerName: string;
  allocations: { item: string; amount: number }[];
}

// ── API-backed service ────────────────────────────────────────────────────────

export const communityFinanceService = {
  // ── Resident Bills & Invoices ─────────────────────────────────────────────

  async getMyBill(communityId: number, flatNumber?: string): Promise<MaintenanceBill | null> {
    try {
      const params = new URLSearchParams({ communityId: String(communityId) });
      if (flatNumber) params.append("flatNumber", flatNumber);
      return await apiClient.get<MaintenanceBill>(`/billing/my-bill?${params}`);
    } catch {
      return null;
    }
  },

  async getAllBills(
    communityId: number,
    filter?: { tower?: string; status?: BillStatus; month?: number; year?: number; page?: number; size?: number }
  ): Promise<{ content: MaintenanceBill[]; totalElements: number }> {
    const params = new URLSearchParams({ communityId: String(communityId) });
    if (filter?.tower) params.append("tower", filter.tower);
    if (filter?.status) params.append("status", filter.status);
    if (filter?.month) params.append("month", String(filter.month));
    if (filter?.year) params.append("year", String(filter.year));
    params.append("page", String(filter?.page ?? 0));
    params.append("size", String(filter?.size ?? 20));
    return apiClient.get(`/billing/invoices?${params}`);
  },

  async getMyBillHistory(communityId: number, flatNumber?: string): Promise<MaintenanceBill[]> {
    const params = new URLSearchParams({ communityId: String(communityId) });
    if (flatNumber) params.append("flatNumber", flatNumber);
    return apiClient.get<MaintenanceBill[]>(`/billing/invoices/my?${params}`);
  },

  // ── Summary & Aging Analytics ─────────────────────────────────────────────

  async getSummary(communityId: number): Promise<FinanceSummary> {
    return apiClient.get<FinanceSummary>(`/cfbos/dashboard/summary?communityId=${communityId}`);
  },

  // ── Payment Processing & Receipts ─────────────────────────────────────────

  async recordPayment(
    billId: string,
    amount: number,
    mode: PaymentMode,
    communityId: number
  ): Promise<{ bill: MaintenanceBill; receipt: CommunityReceipt }> {
    return apiClient.post(`/billing/invoices/${billId}/pay`, { amount, paymentMode: mode, communityId });
  },

  async getReceipt(receiptNumber: string): Promise<CommunityReceipt> {
    return apiClient.get<CommunityReceipt>(`/cfbos/receipts/by-number/${receiptNumber}`);
  },

  // ── Advance Wallet ────────────────────────────────────────────────────────

  async getAdvanceWallet(communityId: number, flatNumber: string): Promise<AdvanceWallet> {
    return apiClient.get<AdvanceWallet>(
      `/cfbos/wallet?communityId=${communityId}&flatNumber=${encodeURIComponent(flatNumber)}`
    );
  },

  async depositAdvance(communityId: number, flatNumber: string, amount: number): Promise<AdvanceWallet> {
    return apiClient.post<AdvanceWallet>(`/cfbos/wallet/deposit`, { communityId, flatNumber, amount });
  },

  // ── Rules & Plans ─────────────────────────────────────────────────────────

  async getPlans(communityId: number): Promise<MaintenancePlan[]> {
    return apiClient.get<MaintenancePlan[]>(`/cfbos/billing/schedules?communityId=${communityId}`);
  },

  async getRules(communityId: number): Promise<ChargeRule[]> {
    return apiClient.get<ChargeRule[]>(`/cfbos/charges?communityId=${communityId}`);
  },

  async getPenaltyConfig(communityId: number): Promise<PenaltyConfig> {
    return apiClient.get<PenaltyConfig>(`/cfbos/penalty/config?communityId=${communityId}`);
  },

  async generateMonthlyCycle(
    communityId: number,
    month: number,
    year: number
  ): Promise<{ generatedCount: number; totalBilled: number }> {
    return apiClient.post(`/cfbos/billing/runs/generate`, { communityId, month, year });
  },

  // ── General Ledger & Double Entry ─────────────────────────────────────────

  async getLedgerTransactions(
    communityId: number,
    page = 0,
    size = 20
  ): Promise<{ content: GeneralLedgerTransaction[]; totalElements: number }> {
    return apiClient.get(
      `/cfbos/v1/accounting/journal-entries?communityId=${communityId}&page=${page}&size=${size}`
    );
  },

  async getTrialBalance(communityId: number): Promise<TrialBalanceItem[]> {
    return apiClient.get<TrialBalanceItem[]>(`/cfbos/v1/accounting/trial-balance?communityId=${communityId}`);
  },
};
