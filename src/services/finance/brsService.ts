import { apiClient } from "../common/apiClient";

export interface BrsSession {
  id: number;
  communityId: number;
  bankAccountName: string;
  statementMonth: string;
  statementFromDate?: string;
  statementToDate?: string;
  openingBalance: number;
  closingBalance: number;
  status: "ACTIVE" | "LOCKED";
  lockedAt?: string;
  createdAt: string;
}

export interface BrsLine {
  id: number;
  sessionId: number;
  valueDate: string;
  description: string;
  creditAmount?: number | null;
  debitAmount?: number | null;
  utrReference?: string | null;
  matchStatus: "UNMATCHED" | "MATCHED_INVOICE" | "MATCHED_PAYMENT" | "MATCHED_VENDOR" | "SUSPENSE";
  matchedEntityId?: number | null;
  matchedEntityType?: string | null;
  manualNote?: string | null;
}

export interface BrsSummary {
  totalMatched: number;
  totalUnmatched: number;
  totalSuspense: number;
  totalCredits: number;
  totalDebits: number;
  openingBalance: number;
  closingBalance: number;
  status: string;
}

export interface CreateBrsSessionRequest {
  bankAccountName: string;
  statementMonth: string;
  statementFromDate?: string;
  statementToDate?: string;
  openingBalance: number;
  closingBalance: number;
}

export interface UploadBrsLine {
  valueDate: string;
  description: string;
  creditAmount?: number | null;
  debitAmount?: number | null;
  utrReference?: string;
}

export const brsService = {
  async listSessions(): Promise<BrsSession[]> {
    return apiClient.get<BrsSession[]>("/finance/brs/sessions");
  },

  async createSession(req: CreateBrsSessionRequest): Promise<BrsSession> {
    return apiClient.post<BrsSession>("/finance/brs/sessions", req);
  },

  async getLines(sessionId: number): Promise<BrsLine[]> {
    return apiClient.get<BrsLine[]>(`/finance/brs/sessions/${sessionId}/lines`);
  },

  async uploadLines(sessionId: number, lines: UploadBrsLine[]): Promise<{ uploaded: number }> {
    return apiClient.post<{ uploaded: number }>(`/finance/brs/sessions/${sessionId}/lines/upload`, lines);
  },

  async autoMatch(sessionId: number): Promise<{ matched: number; total: number }> {
    return apiClient.post<{ matched: number; total: number }>(`/finance/brs/sessions/${sessionId}/auto-match`, {});
  },

  async manualMatch(
    sessionId: number,
    lineId: number,
    data: { matchedEntityId?: number; matchedEntityType?: string; manualNote?: string }
  ): Promise<BrsLine> {
    return apiClient.put<BrsLine>(`/finance/brs/sessions/${sessionId}/lines/${lineId}/match`, data);
  },

  async markSuspense(sessionId: number, lineId: number, manualNote?: string): Promise<BrsLine> {
    return apiClient.put<BrsLine>(`/finance/brs/sessions/${sessionId}/lines/${lineId}/suspense`, { manualNote });
  },

  async lockSession(sessionId: number): Promise<BrsSession> {
    return apiClient.post<BrsSession>(`/finance/brs/sessions/${sessionId}/lock`, {});
  },

  async getSessionSummary(sessionId: number): Promise<BrsSummary> {
    return apiClient.get<BrsSummary>(`/finance/brs/sessions/${sessionId}/summary`);
  },
};