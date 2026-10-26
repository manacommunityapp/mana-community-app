import { apiClient } from "../common/apiClient";

export type SplitMethod = "EQUAL" | "PERCENTAGE" | "EXACT" | "QUANTITY" | "SHARES";
export type MyMoneyMode = "OFF" | "SHARE" | "SETTLEMENTS";

export interface ParticipantInput {
  userId: number;
  weight?: number;
  quantity?: number;
  percentage?: number;
  amount?: number;
}

export interface ExpenseRequest {
  categoryCode: string;
  description: string;
  totalAmount: number;
  paidByUserId?: number;
  expenseDate?: string;
  currency?: string;
  receiptUrl?: string;
  splitMethod?: SplitMethod | "";
  participants?: ParticipantInput[];
}

export interface ShareView {
  userId: number;
  userName: string;
  share: number;
}

export interface ExpenseView {
  id: number;
  tripId: string;
  categoryCode: string;
  description: string;
  totalAmount: number;
  currency: string;
  paidByUserId: number;
  paidByName: string;
  expenseDate: string;
  status: "ACTIVE" | "UNSPLIT" | "VOIDED";
  splitMethod?: string;
  receiptUrl?: string;
  shares: ShareView[];
}

export interface BalanceView {
  userId: number;
  userName: string;
  paid: number;
  share: number;
  settledSent: number;
  settledReceived: number;
  net: number;
  position: "RECEIVES" | "OWES" | "SETTLED";
}

export interface SummaryView {
  tripId: string;
  totalSpent: number;
  unsplitAmount: number;
  balances: BalanceView[];
}

export interface TransferView {
  fromUserId: number;
  fromName: string;
  toUserId: number;
  toName: string;
  amount: number;
}

export interface PaymentRequest {
  toUserId: number;
  amount: number;
  method?: string;
  reference?: string;
}

export interface PaymentView {
  id: number;
  fromUserId: number;
  fromName: string;
  toUserId: number;
  toName: string;
  amount: number;
  status: "PENDING" | "CONFIRMED" | "REJECTED";
  method?: string;
  reference?: string;
  createdAt: string;
  confirmedAt?: string;
}

export interface BudgetRequest {
  estimatedAmount: number;
  currency?: string;
}

export interface DashboardView {
  estimated?: number;
  spent: number;
  remaining?: number;
  unsplit: number;
  yourShare: number;
  youPaid: number;
  youReceive: number;
  youOwe: number;
  spentByCategory: Record<string, number>;
}

export interface PrefRequest {
  mode: MyMoneyMode;
}

export interface PrefView {
  mode: MyMoneyMode;
}

export const tripSplitService = {
  async getExpenses(tripId: string): Promise<ExpenseView[]> {
    return apiClient.get<ExpenseView[]>(`/v1/trips/${tripId}/split/expenses`);
  },

  async createExpense(tripId: string, req: ExpenseRequest): Promise<ExpenseView> {
    return apiClient.post<ExpenseView>(`/v1/trips/${tripId}/split/expenses`, req);
  },

  async getExpense(tripId: string, id: number): Promise<ExpenseView> {
    return apiClient.get<ExpenseView>(`/v1/trips/${tripId}/split/expenses/${id}`);
  },

  async updateExpense(tripId: string, id: number, req: ExpenseRequest): Promise<ExpenseView> {
    return apiClient.put<ExpenseView>(`/v1/trips/${tripId}/split/expenses/${id}`, req);
  },

  async voidExpense(tripId: string, id: number): Promise<ExpenseView> {
    return apiClient.delete<ExpenseView>(`/v1/trips/${tripId}/split/expenses/${id}`);
  },

  async getSummary(tripId: string): Promise<SummaryView> {
    return apiClient.get<SummaryView>(`/v1/trips/${tripId}/split/summary`);
  },

  async getSettlements(tripId: string): Promise<TransferView[]> {
    return apiClient.get<TransferView[]>(`/v1/trips/${tripId}/split/settlements`);
  },

  async getPayments(tripId: string): Promise<PaymentView[]> {
    return apiClient.get<PaymentView[]>(`/v1/trips/${tripId}/split/payments`);
  },

  async recordPayment(tripId: string, req: PaymentRequest): Promise<PaymentView> {
    return apiClient.post<PaymentView>(`/v1/trips/${tripId}/split/payments`, req);
  },

  async confirmPayment(tripId: string, id: number): Promise<PaymentView> {
    return apiClient.post<PaymentView>(`/v1/trips/${tripId}/split/payments/${id}/confirm`, {});
  },

  async rejectPayment(tripId: string, id: number): Promise<PaymentView> {
    return apiClient.post<PaymentView>(`/v1/trips/${tripId}/split/payments/${id}/reject`, {});
  },

  async getBudget(tripId: string): Promise<DashboardView> {
    return apiClient.get<DashboardView>(`/v1/trips/${tripId}/split/budget`);
  },

  async setBudget(tripId: string, req: BudgetRequest): Promise<DashboardView> {
    return apiClient.put<DashboardView>(`/v1/trips/${tripId}/split/budget`, req);
  },

  async getMyMoneyPrefs(tripId: string): Promise<PrefView> {
    return apiClient.get<PrefView>(`/v1/trips/${tripId}/split/my-money-prefs`);
  },

  async setMyMoneyPrefs(tripId: string, mode: MyMoneyMode): Promise<PrefView> {
    return apiClient.put<PrefView>(`/v1/trips/${tripId}/split/my-money-prefs`, { mode });
  },
};
