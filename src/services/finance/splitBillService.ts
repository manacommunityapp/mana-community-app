import { apiClient } from "../common/apiClient";

export type SplitType = "EQUAL" | "CUSTOM" | "PERCENTAGE";
export interface SplitMember { user_id: string; name: string; flat?: string; share_amount: number; status: "PENDING" | "PAID" | "DECLINED"; paid_at?: string; }
export interface SplitBill { id: string; title: string; description?: string; total_amount: number; split_type: SplitType; created_by: string; created_by_name: string; members: SplitMember[]; settled_amount: number; pending_amount: number; status: "OPEN" | "PARTIALLY_SETTLED" | "SETTLED"; created_at: string; category: "MAINTENANCE" | "EVENT" | "UTILITY" | "FOOD" | "OTHER"; }
export interface SettleResult { upi_intent_url: string; phone_pe_url: string; transaction_ref: string; amount: number; }

export const splitBillService = {
  /** Splits as recorded by the server. Throws if they cannot be read — never invents splits or amounts owed. */
  async getSplits(): Promise<SplitBill[]> {
    const d = await apiClient.get<SplitBill[]>("/v1/split/my-splits");
    if (!Array.isArray(d)) throw new Error("Could not load your split bills. Please try again.");
    return d;
  },

  /** Creates the split server-side. Throws if it was not created, so the UI never reports a split that does not exist. */
  async createSplit(payload: {
    title: string;
    description?: string;
    total_amount: number;
    split_type: SplitType;
    members: { user_id: string; name: string; flat?: string; share_amount: number }[];
    category: SplitBill["category"];
  }): Promise<SplitBill> {
    const d = await apiClient.post<SplitBill>("/v1/split/create", payload);
    if (!d?.id) throw new Error("The split could not be created. Please try again.");
    return d;
  },

  /**
   * Asks the server to open a settlement and returns the payment intent it
   * issued. Payment URLs are never constructed on the client — if the server
   * did not create a settlement there is nothing to pay.
   */
  async settle(splitId: string, memberId: string, amount: number): Promise<SettleResult> {
    const d = await apiClient.post<SettleResult>(`/v1/split/${splitId}/settle`, { member_id: memberId, amount });
    if (!d?.upi_intent_url || !d?.transaction_ref) {
      throw new Error("Settlement could not be started. No payment was initiated — please try again.");
    }
    return d;
  },
};
