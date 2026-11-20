import { apiClient } from "../common/apiClient";

export type P2PDebtStatus =
  | "PENDING_VPA"
  | "COLLECT_INITIATED"
  | "COLLECT_APPROVED"
  | "COLLECT_REJECTED"
  | "COLLECT_EXPIRED"
  | "CANCELLED";

export interface P2PDebt {
  id: number;
  tripId: number;
  creditorUserId: number;
  creditorName?: string;
  debtorUserId: number;
  debtorName?: string;
  amount: number;
  upiVpa?: string;
  status: P2PDebtStatus;
  description?: string;
  initiatedAt?: string;
  settledAt?: string;
}

interface CreateDebtRequest {
  debtorUserId: number;
  amount: number;
  description: string;
}

interface InitiateCollectRequest {
  upiVpa: string;
}

export const tripP2PService = {
  listDebts: (tripId: number) =>
    apiClient.get<P2PDebt[]>(`/trips/${tripId}/p2p/debts`),

  createDebt: (tripId: number, req: CreateDebtRequest) =>
    apiClient.post<P2PDebt>(`/trips/${tripId}/p2p/debts`, req),

  initiateCollect: (debtId: number, req: InitiateCollectRequest) =>
    apiClient.post<P2PDebt>(`/trips/p2p/debts/${debtId}/collect`, req),

  cancelDebt: (debtId: number) =>
    apiClient.delete<void>(`/trips/p2p/debts/${debtId}`),
};
