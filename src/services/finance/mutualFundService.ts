import { apiClient } from "../common/apiClient";

export type FundCategory = "ELSS" | "LARGE_CAP" | "MID_CAP" | "SMALL_CAP" | "INDEX" | "LIQUID" | "HYBRID";
export interface MutualFund { id: string; name: string; short_name: string; category: FundCategory; amc: string; nav: number; nav_change_pct: number; returns_1y: number; returns_3y: number; returns_5y: number; risk: "LOW" | "MODERATE" | "HIGH"; min_sip: number; min_lumpsum: number; rating: number; }
export interface MFHolding { fund_id: string; fund_name: string; units: number; avg_nav: number; current_nav: number; invested_amount: number; current_value: number; pnl: number; pnl_pct: number; }
export interface SipMandate { id: string; fund_id: string; fund_name: string; amount: number; sip_date: number; status: "ACTIVE" | "PAUSED" | "CANCELLED"; next_installment: string; total_invested: number; current_value: number; }
export interface InvestResult { upi_intent_url: string; phone_pe_url: string; transaction_ref: string; units: number; amount: number; }

export const mutualFundService = {
  /** Fund catalogue with live NAVs. Throws rather than showing invented NAVs or returns that a resident might invest against. */
  async getFunds(category?: FundCategory): Promise<MutualFund[]> {
    const path = category ? `/v1/mf/funds?category=${encodeURIComponent(category)}` : "/v1/mf/funds";
    const d = await apiClient.get<MutualFund[]>(path);
    if (!Array.isArray(d)) throw new Error("Could not load mutual funds. Please try again.");
    return d;
  },

  /** Holdings as recorded by the registrar. Throws if they cannot be read — never invents a portfolio. */
  async getHoldings(): Promise<MFHolding[]> {
    const d = await apiClient.get<MFHolding[]>("/v1/mf/holdings");
    if (!Array.isArray(d)) throw new Error("Could not load your mutual fund holdings. Please try again.");
    return d;
  },

  /** Active SIP mandates as recorded by the server. Throws if they cannot be read. */
  async getSips(): Promise<SipMandate[]> {
    const d = await apiClient.get<SipMandate[]>("/v1/mf/sips");
    if (!Array.isArray(d)) throw new Error("Could not load your SIPs. Please try again.");
    return d;
  },

  /**
   * Places the investment order server-side and returns the payment intent it
   * issued. Payment URLs and unit counts are never computed on the client — if
   * the server did not create an order there is nothing to pay.
   */
  async invest(fund_id: string, amount: number, type: "SIP" | "LUMPSUM", sip_date?: number): Promise<InvestResult> {
    const d = await apiClient.post<InvestResult>("/v1/mf/invest", { fund_id, amount, type, sip_date });
    if (!d?.upi_intent_url || !d?.transaction_ref) {
      throw new Error("The investment could not be started. No payment was initiated — please try again.");
    }
    return d;
  },

  /** Cancels a SIP mandate server-side. Throws on any non-success response, so the UI cannot report a cancellation that did not happen. */
  async cancelSip(sipId: string): Promise<void> {
    await apiClient.delete<void>(`/v1/mf/sips/${sipId}/cancel`);
  },
};
