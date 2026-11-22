import { apiClient } from "../common/apiClient";

export interface GoldPrice {
  per_gram_22k: number;
  per_gram_24k: number;
  change_pct_24h: number;
  updated_at: string;
  /**
   * True when the live rate could not be fetched and the value shown is a stale
   * indicative rate. Callers MUST treat an indicative price as display-only and
   * must not allow a buy/sell to be initiated while it is set.
   */
  indicative?: boolean;
}
export interface GoldHolding { id: string; grams: number; purity: "22K" | "24K"; avg_buy_price: number; current_value: number; unrealised_pnl: number; unrealised_pnl_pct: number; }
export interface GoldTransaction { id: string; type: "BUY" | "SELL"; grams: number; price_per_gram: number; amount: number; purity: "22K" | "24K"; status: "COMPLETED" | "PENDING" | "FAILED"; created_at: string; }
export interface GoldBuyResult { upi_intent_url: string; phone_pe_url: string; transaction_ref: string; grams: number; amount: number; }

/**
 * Last-resort INDICATIVE rate, used only so the portal can render a rate band
 * when the price feed is unreachable. It is flagged `indicative: true` and the
 * UI disables buying and selling while it is in use, so a stale rate can never
 * be used to construct a financial action. Order amounts, gram quantities and
 * payment intents always come from the server.
 */
const INDICATIVE_FALLBACK_PRICE: GoldPrice = {
  per_gram_22k: 6850,
  per_gram_24k: 7450,
  change_pct_24h: 0,
  updated_at: new Date(0).toISOString(),
  indicative: true,
};

export const goldService = {
  /**
   * Live gold rate. On failure returns a stale indicative rate flagged with
   * `indicative: true` — never throws, because a displayed rate is not a
   * financial action. Callers must block buy/sell when `indicative` is set.
   */
  async getPrice(): Promise<GoldPrice> {
    try {
      const d = await apiClient.get<GoldPrice>("/v1/gold/price");
      if (d && typeof d.per_gram_24k === "number" && typeof d.per_gram_22k === "number") {
        return { ...d, indicative: false };
      }
      return INDICATIVE_FALLBACK_PRICE;
    } catch {
      return INDICATIVE_FALLBACK_PRICE;
    }
  },

  /** Holdings as recorded by the server. Throws if they cannot be read — never invents a portfolio. */
  async getHoldings(): Promise<GoldHolding[]> {
    const d = await apiClient.get<GoldHolding[]>("/v1/gold/holdings");
    if (!Array.isArray(d)) throw new Error("Could not load your gold holdings. Please try again.");
    return d;
  },

  /** Transaction history as recorded by the server. Throws if it cannot be read. */
  async getHistory(): Promise<GoldTransaction[]> {
    const d = await apiClient.get<GoldTransaction[]>("/v1/gold/transactions");
    if (!Array.isArray(d)) throw new Error("Could not load your gold transactions. Please try again.");
    return d;
  },

  /**
   * Creates a gold buy order server-side and returns the payment intent the
   * server issued. The payment URLs are never constructed on the client: if the
   * server did not create an order there is nothing for the resident to pay.
   */
  async buy(amount_inr: number, purity: "22K" | "24K"): Promise<GoldBuyResult> {
    const d = await apiClient.post<GoldBuyResult>("/v1/gold/buy", { amount_inr, purity });
    if (!d?.upi_intent_url || !d?.transaction_ref) {
      throw new Error("Gold purchase could not be started. No payment was initiated — please try again.");
    }
    return d;
  },

  /** Places a sell order server-side. Throws if the server did not accept it. */
  async sell(grams: number, purity: "22K" | "24K"): Promise<{ transaction_ref: string; amount: number }> {
    const d = await apiClient.post<{ transaction_ref: string; amount: number }>("/v1/gold/sell", { grams, purity });
    if (!d?.transaction_ref) {
      throw new Error("Gold sale could not be started. Nothing was sold — please try again.");
    }
    return d;
  },
};
