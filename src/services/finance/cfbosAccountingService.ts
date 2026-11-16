import { apiClient } from "../common/apiClient";

// ── Types ────────────────────────────────────────────────────────────────────

export type AccountType = "ASSET" | "LIABILITY" | "EQUITY" | "INCOME" | "EXPENSE";
export type JournalEntryStatus = "DRAFT" | "POSTED" | "REVERSED";
export type JournalEntryType = "MANUAL" | "SYSTEM" | "REVERSAL";
export type SourceModule =
  | "BILLING" | "PAYMENT" | "EXPENSE" | "VENDOR" | "FUND" | "TAX" | "TREASURY"
  | "MANUAL" | "EVENTS" | "SPORTS" | "MARKETPLACE" | "RESOURCE_BOOKING"
  | "DONATIONS" | "HOME_SERVICES" | "TRIPS" | "SOCIAL_CIRCLES" | "MAINTENANCE";

export interface AccountTreeNode {
  id: number;
  code: string;
  name: string;
  accountType: AccountType;
  currentBalance: number;
  isSystemAccount: boolean;
  children: AccountTreeNode[];
}

export interface JournalLine {
  id: number;
  accountCode: string;
  accountName: string;
  debitAmount: number;
  creditAmount: number;
  narration: string;
}

export interface JournalEntry {
  id: number;
  entryNumber: string;
  entryDate: string;
  entryType: JournalEntryType;
  sourceModule: SourceModule;
  sourceDocumentType: string;
  sourceDocumentId: number;
  narration: string;
  totalDebit: number;
  totalCredit: number;
  status: JournalEntryStatus;
  postedAt: string;
  lines: JournalLine[];
}

export interface JournalEntriesPage {
  content: JournalEntry[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface TrialBalanceLine {
  accountCode: string;
  accountName: string;
  accountType: string;
  debitBalance: number;
  creditBalance: number;
}

export interface TrialBalance {
  fiscalYearName: string;
  generatedAt: string;
  totalDebit: number;
  totalCredit: number;
  lines: TrialBalanceLine[];
}

export interface FiscalYear {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
  isCurrent: boolean;
}

// ── Service ──────────────────────────────────────────────────────────────────

export const cfbosAccountingService = {
  async getAccountTree(): Promise<AccountTreeNode[]> {
    return apiClient.get<AccountTreeNode[]>("/cfbos/v1/accounting/accounts");
  },

  async getJournalEntries(
    from: string,
    to: string,
    page = 0,
    size = 20
  ): Promise<JournalEntriesPage> {
    return apiClient.get<JournalEntriesPage>(
      `/cfbos/v1/accounting/journal-entries?from=${from}&to=${to}&page=${page}&size=${size}&sort=entryDate,desc`
    );
  },

  async getJournalEntry(id: number): Promise<JournalEntry> {
    return apiClient.get<JournalEntry>(`/cfbos/v1/accounting/journal-entries/${id}`);
  },

  async reverseJournalEntry(id: number, reason: string): Promise<JournalEntry> {
    return apiClient.post<JournalEntry>(
      `/cfbos/v1/accounting/journal-entries/${id}/reverse?reason=${encodeURIComponent(reason)}`
    );
  },

  async getFiscalYears(): Promise<FiscalYear[]> {
    return apiClient.get<FiscalYear[]>("/cfbos/v1/accounting/fiscal-years");
  },

  async getTrialBalance(fiscalYearId: number): Promise<TrialBalance> {
    return apiClient.get<TrialBalance>(
      `/cfbos/v1/accounting/trial-balance?fiscalYearId=${fiscalYearId}`
    );
  },
};
