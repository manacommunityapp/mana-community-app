import { apiClient } from "../common/apiClient";

export interface TournamentBudgetLineItem {
  id: number;
  category: string;
  description: string | null;
  plannedAmount: number;
  createdAt: string;
}

export interface TournamentBudget {
  id: number;
  tournamentId: number;
  tournamentName: string;
  communityId: number;
  totalPlannedAmount: number;
  totalCollectedAmount: number;
  variance: number;
  currency: string;
  notes: string | null;
  lineItems: TournamentBudgetLineItem[];
  createdAt: string;
  updatedAt: string;
}

export interface TournamentBudgetLineItemRequest {
  category: string;
  description?: string;
  plannedAmount: number;
}

export interface TournamentBudgetRequest {
  communityId: number;
  totalPlannedAmount: number;
  notes?: string;
  lineItems?: TournamentBudgetLineItemRequest[];
}

export const tournamentBudgetService = {
  async listByCommunity(communityId: number): Promise<TournamentBudget[]> {
    return apiClient.get<TournamentBudget[]>(`/sports/budgets?communityId=${communityId}`);
  },

  async getByTournament(tournamentId: number): Promise<TournamentBudget> {
    return apiClient.get<TournamentBudget>(`/sports/budgets/tournament/${tournamentId}`);
  },

  async save(tournamentId: number, request: TournamentBudgetRequest): Promise<TournamentBudget> {
    return apiClient.put<TournamentBudget>(`/sports/budgets/tournament/${tournamentId}`, request);
  },

  async delete(tournamentId: number): Promise<void> {
    return apiClient.delete(`/sports/budgets/tournament/${tournamentId}`);
  },
};
