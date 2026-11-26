import { apiClient } from "../common/apiClient";

// ── Types ────────────────────────────────────────────────────────────────────

export interface BillingRunRequest {
  month: number;
  year: number;
  maintenancePerSqft: number;
  sinkingFund: number;
  waterCharges: number;
  parkingCharges: number;
  applyGst: boolean;
  applyPenalty: boolean;
  dueDays: number;
}

export interface BillingRunResponse {
  runId: number;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  totalFlats: number;
  processedFlats: number;
  failedFlats: number;
  totalAmount: number;
  gstAmount: number;
  penaltyAmount: number;
  idempotencyKey: string;
}

export interface BillingRun {
  id: number;
  idempotencyKey: string;
  billingMonth: number;
  billingYear: number;
  runType: string;
  status: string;
  totalFlats: number;
  processedFlats: number;
  failedFlats: number;
  totalAmount: number;
  gstAmount: number;
  penaltyAmount: number;
  startedAt: string;
  completedAt?: string;
  errorLog?: string;
}

export interface BillingLineItem {
  id: number;
  flatNo: string;
  maintenanceAmount: number;
  sinkingFund: number;
  waterCharges: number;
  parkingCharges: number;
  penaltyAmount: number;
  cgst: number;
  sgst: number;
  totalAmount: number;
  dueDate: string;
  status: string;
  errorMessage?: string;
}

export interface LedgerAccount {
  id: number;
  accountCode: string;
  accountName: string;
  accountType: "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";
  currentBalance: number;
  isSystemAccount: boolean;
  description?: string;
}

export interface LedgerEntry {
  id: number;
  journalId: string;
  entryType: "DEBIT" | "CREDIT";
  amount: number;
  referenceType?: string;
  referenceId?: number;
  narration?: string;
  postedAt: string;
  fiscalYear: number;
  fiscalPeriod: number;
  isReversed: boolean;
}

export interface JournalLineInput {
  accountId: number;
  entryType: "DEBIT" | "CREDIT";
  amount: number;
}

export interface TrialBalance {
  accounts: {
    accountCode: string;
    accountName: string;
    accountType: string;
    debit: number;
    credit: number;
  }[];
  totalDebits: number;
  totalCredits: number;
  balanced: boolean;
  fiscalYear: number;
}

export interface TenantQuota {
  id: number;
  resourceType: string;
  maxConcurrentQueries: number;
  maxRowsPerExport: number;
  rateLimitPerMinute: number;
  priorityWeight: number;
}

export interface TenantMetrics {
  communityId: number;
  quotas: TenantQuota[];
  activeConnections: number;
}

export interface UserSocietyRoleInfo {
  societyRoleId: number;
  communityId: number;
  communityName: string;
  communityType: string;
  roleType: string;
  flatNo: string;
  isPrimary: boolean;
}

export interface SwitchResult {
  communityId: number;
  communityName: string;
  roleType: string;
  flatNo: string;
  permissions: string[];
  switched: boolean;
}

// ── Service ──────────────────────────────────────────────────────────────────

export const societyErpService = {
  // ── Billing ──
  async startBillingRun(data: BillingRunRequest): Promise<BillingRunResponse> {
    return apiClient.post<BillingRunResponse>("/society-erp/billing/run", data);
  },

  async getBillingRuns(): Promise<BillingRun[]> {
    return apiClient.get<BillingRun[]>("/society-erp/billing/runs");
  },

  async getBillingRunDetail(runId: number): Promise<BillingRun> {
    return apiClient.get<BillingRun>(`/society-erp/billing/runs/${runId}`);
  },

  async getBillingRunLineItems(runId: number): Promise<BillingLineItem[]> {
    return apiClient.get<BillingLineItem[]>(`/society-erp/billing/runs/${runId}/items`);
  },

  // ── Ledger ──
  async initializeLedger(): Promise<{ initialized: boolean }> {
    return apiClient.post("/society-erp/ledger/init", {});
  },

  async getChartOfAccounts(): Promise<LedgerAccount[]> {
    return apiClient.get<LedgerAccount[]>("/society-erp/ledger/accounts");
  },

  async postJournalEntry(lines: JournalLineInput[], narration: string,
                          referenceType?: string, referenceId?: number): Promise<{ journalId: string; lines: number }> {
    return apiClient.post("/society-erp/ledger/journal", {
      lines, narration, referenceType, referenceId,
    });
  },

  async getJournalEntries(page = 0, size = 20): Promise<{ content: LedgerEntry[]; totalPages: number; totalElements: number }> {
    return apiClient.get(`/society-erp/ledger/journal?page=${page}&size=${size}`);
  },

  async getTrialBalance(fiscalYear?: number): Promise<TrialBalance> {
    const fy = fiscalYear || new Date().getFullYear();
    return apiClient.get<TrialBalance>(`/society-erp/ledger/trial-balance?fiscalYear=${fy}`);
  },

  async reverseJournal(journalId: string): Promise<{ reversalJournalId: string }> {
    return apiClient.post(`/society-erp/ledger/reverse/${journalId}`, {});
  },

  // ── Tenant Isolation ──
  async getTenantMetrics(): Promise<TenantMetrics> {
    return apiClient.get<TenantMetrics>("/society-erp/tenant/metrics");
  },

  async getTenantQuotas(): Promise<TenantQuota[]> {
    return apiClient.get<TenantQuota[]>("/society-erp/tenant/quotas");
  },

  async updateQuota(resourceType: string, updates: Partial<TenantQuota>): Promise<TenantQuota> {
    return apiClient.put<TenantQuota>(`/society-erp/tenant/quotas/${resourceType}`, updates);
  },

  // ── RBAC Role Switching ──
  async getMySocieties(): Promise<UserSocietyRoleInfo[]> {
    return apiClient.get<UserSocietyRoleInfo[]>("/society-erp/roles/my-societies");
  },

  async switchSociety(communityId: number, roleType: string): Promise<SwitchResult> {
    return apiClient.post<SwitchResult>("/society-erp/roles/switch", { communityId, roleType });
  },

  async assignRole(userId: number, communityId: number, roleType: string, flatNo?: string): Promise<unknown> {
    return apiClient.post("/society-erp/roles/assign", { userId, communityId, roleType, flatNo });
  },

  async removeRole(userId: number, communityId: number, roleType: string): Promise<unknown> {
    return apiClient.delete(`/society-erp/roles/${userId}/${communityId}/${roleType}`);
  },

  async getCommunityMembers(): Promise<{ members: { userId: number; userName: string; roleType: string; flatNo: string }[] }> {
    return apiClient.get("/society-erp/roles/community-members");
  },
};
