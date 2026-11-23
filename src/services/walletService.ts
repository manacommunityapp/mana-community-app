import { apiClient } from "./common/apiClient";

export interface ResidentWallet {
  id: number;
  balance: number;
  creditLimit: number;
  currency: string;
  status: string;
  upiVirtualId?: string;
}

export interface WalletTransaction {
  id: number;
  txnType: string;
  direction: "DEBIT" | "CREDIT";
  amount: number;
  balanceAfter: number;
  description?: string;
  paymentMethod?: string;
  status: string;
  initiatedAt: string;
}

export const walletService = {
  async getMyWallet(communityId: number): Promise<ResidentWallet> {
    return apiClient.get<ResidentWallet>(`/api/wallet?communityId=${communityId}`);
  },

  async getTransactions(
    communityId: number,
    page = 0
  ): Promise<{ content: WalletTransaction[]; hasNext: boolean }> {
    return apiClient.get<{ content: WalletTransaction[]; hasNext: boolean }>(
      `/api/wallet/transactions?communityId=${communityId}&page=${page}&size=20`
    );
  },

  async initiateTopup(
    amount: number,
    paymentMethod: string
  ): Promise<{ paymentUrl: string; txnRef: string }> {
    return apiClient.post<{ paymentUrl: string; txnRef: string }>("/api/wallet/topup", {
      amount,
      paymentMethod,
    });
  },

  async payInvoice(invoiceId: number, amount: number): Promise<WalletTransaction> {
    return apiClient.post<WalletTransaction>("/api/wallet/pay-invoice", { invoiceId, amount });
  },

  async getCommunityLedger(
    communityId: number,
    type?: string
  ): Promise<WalletTransaction[]> {
    const params = new URLSearchParams({ communityId: String(communityId) });
    if (type) params.set("type", type);
    return apiClient.get<WalletTransaction[]>(`/api/wallet/community-ledger?${params}`);
  },
};
