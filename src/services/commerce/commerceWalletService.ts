import { apiClient } from "../common/apiClient";

export interface WalletTxnDto {
  id: number;
  txnRef: string;
  txnType: string;
  amount: number;
  balanceAfter: number;
  referenceId?: string;
  description?: string;
  createdAt?: string;
}

export interface WalletDto {
  id: number;
  userId: number;
  userName: string;
  balance: number;
  currency: string;
  status: string;
  transactions?: WalletTxnDto[];
}

export const commerceWalletService = {
  getWallet(): Promise<WalletDto> {
    return apiClient.get<WalletDto>("/v1/commerce/wallet");
  },
  topUp(amount: number, referenceId?: string): Promise<WalletDto> {
    return apiClient.post<WalletDto>("/v1/commerce/wallet/topup", { amount, referenceId: referenceId ?? "MANUAL" });
  },
  debit(amount: number, referenceId?: string, description?: string): Promise<WalletDto> {
    return apiClient.post<WalletDto>("/v1/commerce/wallet/debit", { amount, referenceId, description });
  },
};
