import { apiClient } from "../common/apiClient";
import { vendorInvoiceService, vendorPaymentService } from "./vendorService";
import type { VendorInvoiceResponse, VendorPaymentResponse } from "../../types/api";

export interface VendorMerchantProfileDto {
  vendorId: number;
  tradeName: string;
  vpa?: string;
  upiEnabled: boolean;
  onboardingStatus: string;
}

export interface SettlementBatchDto {
  batchId: string;
  periodStart: string;
  periodEnd: string;
  grossAmount: number;
  deductions: number;
  netSettledAmount: number;
  bankUtr?: string;
  settledAt?: string;
  status: string;
  transactionCount: number;
}

export const vendorMerchantPaymentService = {
  async getMerchantProfile(): Promise<VendorMerchantProfileDto> {
    const profile = await apiClient.get<any>("/v1/commerce/vendors/my-profile");
    return {
      vendorId: Number(profile.vendorId),
      tradeName: String(profile.vendorName ?? "Vendor"),
      vpa: profile.upiId || undefined,
      upiEnabled: Boolean(profile.upiEnabled),
      onboardingStatus: String(profile.commerceStatus ?? "DRAFT"),
    };
  },

  async getInvoices(): Promise<VendorInvoiceResponse[]> {
    const page = await vendorInvoiceService.getMyInvoices(0, 100);
    return page.content ?? [];
  },

  async getPayments(): Promise<VendorPaymentResponse[]> {
    const page = await vendorPaymentService.getMyPayments(0, 100);
    return page.content ?? [];
  },

  async getSettlements(): Promise<SettlementBatchDto[]> {
    const rows = await apiClient.get<any[]>("/commerce/settlements/my");
    return (rows ?? []).map((row) => ({
      batchId: String(row.settlementNumber ?? row.id),
      periodStart: String(row.cycleStartDate ?? ""),
      periodEnd: String(row.cycleEndDate ?? ""),
      grossAmount: Number(row.grossAmount ?? 0),
      deductions: Number(row.deductions ?? 0) + Number(row.platformFee ?? 0),
      netSettledAmount: Number(row.netPayout ?? 0),
      bankUtr: row.payoutUtr || undefined,
      settledAt: row.payoutDate || undefined,
      status: String(row.status ?? "PENDING"),
      transactionCount: Number(row.totalOrdersCount ?? 0),
    }));
  },

  getUpiPayload(profile: VendorMerchantProfileDto, amount?: number): string | null {
    if (!profile.upiEnabled || !profile.vpa) return null;
    const params = new URLSearchParams({ pa: profile.vpa, pn: profile.tradeName, cu: "INR" });
    if (amount && amount > 0) params.set("am", amount.toFixed(2));
    return `upi://pay?${params.toString()}`;
  },
};
