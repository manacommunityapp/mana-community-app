import { describe, it, expect, vi } from "vitest";
import { vendorMerchantPaymentService } from "./vendorMerchantPaymentService";
import { apiClient } from "../common/apiClient";
import { vendorInvoiceService, vendorPaymentService } from "./vendorService";

vi.mock("../common/apiClient", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock("./vendorService", () => ({
  vendorInvoiceService: {
    getMyInvoices: vi.fn(),
  },
  vendorPaymentService: {
    getMyPayments: vi.fn(),
  },
}));

describe("vendorMerchantPaymentService", () => {
  it("getMerchantProfile maps backend commerce profile correctly", async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      vendorId: 101,
      vendorName: "Fresh Bakery",
      upiId: "bakery@upi",
      upiEnabled: true,
      commerceStatus: "ACTIVE",
    });

    const profile = await vendorMerchantPaymentService.getMerchantProfile();
    expect(profile.vendorId).toBe(101);
    expect(profile.tradeName).toBe("Fresh Bakery");
    expect(profile.vpa).toBe("bakery@upi");
    expect(profile.upiEnabled).toBe(true);
    expect(profile.onboardingStatus).toBe("ACTIVE");
  });

  it("getInvoices retrieves vendor invoice content", async () => {
    vi.mocked(vendorInvoiceService.getMyInvoices).mockResolvedValueOnce({
      content: [{ id: 1, invoiceNumber: "INV-001", totalAmount: 1500 }] as any,
      totalElements: 1,
    } as any);

    const invoices = await vendorMerchantPaymentService.getInvoices();
    expect(invoices.length).toBe(1);
    expect(invoices[0].invoiceNumber).toBe("INV-001");
  });

  it("getPayments retrieves vendor payments content", async () => {
    vi.mocked(vendorPaymentService.getMyPayments).mockResolvedValueOnce({
      content: [{ id: 2, paymentNumber: "PAY-002", amount: 1500 }] as any,
      totalElements: 1,
    } as any);

    const payments = await vendorMerchantPaymentService.getPayments();
    expect(payments.length).toBe(1);
    expect(payments[0].paymentNumber).toBe("PAY-002");
  });

  it("getSettlements maps settlement batches with deductions and UTR", async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce([
      {
        settlementNumber: "SET-881",
        cycleStartDate: "2026-10-01",
        cycleEndDate: "2026-10-07",
        grossAmount: 50000,
        deductions: 500,
        platformFee: 250,
        netPayout: 49250,
        payoutUtr: "UTR992144",
        payoutDate: "2026-10-08",
        status: "SETTLED",
        totalOrdersCount: 24,
      },
    ]);

    const settlements = await vendorMerchantPaymentService.getSettlements();
    expect(settlements.length).toBe(1);
    expect(settlements[0].batchId).toBe("SET-881");
    expect(settlements[0].grossAmount).toBe(50000);
    expect(settlements[0].deductions).toBe(750);
    expect(settlements[0].netSettledAmount).toBe(49250);
    expect(settlements[0].bankUtr).toBe("UTR992144");
  });

  it("getUpiPayload generates valid UPI URLs", () => {
    const profile = {
      vendorId: 101,
      tradeName: "Fresh Bakery",
      vpa: "bakery@okhdfcbank",
      upiEnabled: true,
      onboardingStatus: "ACTIVE",
    };

    const payload = vendorMerchantPaymentService.getUpiPayload(profile, 750);
    expect(payload).toContain("upi://pay");
    expect(payload).toContain("pa=bakery%40okhdfcbank");
    expect(payload).toContain("am=750.00");
  });

  it("getUpiPayload returns null when upi is not enabled", () => {
    const profile = {
      vendorId: 101,
      tradeName: "Fresh Bakery",
      vpa: undefined,
      upiEnabled: false,
      onboardingStatus: "ACTIVE",
    };

    expect(vendorMerchantPaymentService.getUpiPayload(profile)).toBeNull();
  });
});
