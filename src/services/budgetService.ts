import { apiClient } from "./apiClient";

export interface BudgetAllocation {
  id: number;
  financialYear: string;
  category: string;
  allocatedAmount: number;
  spentAmount: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export const budgetService = {
  async getBudgets(financialYear?: string): Promise<BudgetAllocation[]> {
    let url = "/finance/budget";
    if (financialYear) {
      url += `?financialYear=${financialYear}`;
    }
    return apiClient.get<BudgetAllocation[]>(url);
  },

  async allocateBudget(data: {
    financialYear: string;
    category: string;
    amount: number;
    notes?: string;
  }): Promise<BudgetAllocation> {
    let url = `/finance/budget?financialYear=${encodeURIComponent(data.financialYear)}&category=${encodeURIComponent(
      data.category
    )}&amount=${data.amount}`;
    if (data.notes) {
      url += `&notes=${encodeURIComponent(data.notes)}`;
    }
    return apiClient.post<BudgetAllocation>(url);
  },

  async deleteAllocation(id: number): Promise<void> {
    return apiClient.delete<void>(`/finance/budget/${id}`);
  },
};
