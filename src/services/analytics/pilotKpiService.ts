import { apiClient } from "../common/apiClient";

/** Shape returned by GET /admin/analytics/pilot-kpis (backend to implement). */
export interface FunnelStage { stage: string; count: number }
export interface VendorKpi {
  vendorId: number;
  name: string;
  orders: number;
  acceptanceRate: number;
  onTimeRate: number;
  cancellationRate: number;
  disputeRate: number;
}
export interface ModuleKpi {
  module: string;
  activeUsers: number;
  orderCount?: number;
  revenue: number;
  /** Estimated direct cost (gateway fees, messaging, support time, hosting). */
  cost: number;
}
export interface CostCalibration {
  gatewayMdrRate: number;
  perTxnFixedCost: number;
  moduleHostingAllocation: number;
}
export interface PilotKpis {
  activeResidents: number;
  signups: number;
  activatedResidents: number;
  funnel: FunnelStage[];
  costCalibration?: CostCalibration;
  transactions: {
    bookingsCreated: number;
    paymentsStarted: number;
    paymentsSucceeded: number;
    paymentsFailed: number;
  };
  vendors: VendorKpi[];
  support: {
    tickets: number;
    avgFirstResponseHours: number | null;
    avgResolutionHours: number | null;
  };
  revenue: {
    gmv: number;
    commission: number;
    subscriptionMrr: number;
    subscribers: number;
    churnedSubscribers: number;
  };
  modules: ModuleKpi[];
}

/**
 * Starting thresholds (plan open question 3). These are defaults, not business
 * decisions: adjust once the pilot success criteria are agreed.
 */
export const PILOT_THRESHOLDS = {
  activationRate: 0.4,
  paymentSuccessRate: 0.95,
  expandAdoption: 0.25,
  expandMargin: 0.2,
  sunsetAdoption: 0.1,
} as const;

const ratio = (n: number, d: number): number | null => (d > 0 ? n / d : null);

export const activationRate = (k: Pick<PilotKpis, "signups" | "activatedResidents">) =>
  ratio(k.activatedResidents, k.signups);

export const paymentSuccessRate = (t: PilotKpis["transactions"]) =>
  ratio(t.paymentsSucceeded, t.paymentsSucceeded + t.paymentsFailed);

/** Share of created bookings that ended in a successful payment (paid flows). */
export const bookingToPaymentCompletion = (t: PilotKpis["transactions"]) =>
  ratio(t.paymentsSucceeded, t.bookingsCreated);

export const takeRate = (r: Pick<PilotKpis["revenue"], "gmv" | "commission">) =>
  ratio(r.commission, r.gmv);

export const churnRate = (r: Pick<PilotKpis["revenue"], "subscribers" | "churnedSubscribers">) =>
  ratio(r.churnedSubscribers, r.subscribers);

export const ticketsPer100Residents = (k: Pick<PilotKpis, "support" | "activeResidents">) => {
  const v = ratio(k.support.tickets, k.activeResidents);
  return v === null ? null : v * 100;
};

export const DEFAULT_COST_CALIBRATION: CostCalibration = {
  gatewayMdrRate: 0.02,
  perTxnFixedCost: 2.0,
  moduleHostingAllocation: 0,
};

export function recalculateModuleCost(
  revenue: number,
  orders: number,
  calibration: CostCalibration = DEFAULT_COST_CALIBRATION,
): number {
  const mdr = revenue * calibration.gatewayMdrRate;
  const txn = orders * calibration.perTxnFixedCost;
  const host = orders > 0 || revenue > 0 ? calibration.moduleHostingAllocation : 0;
  return Math.round((mdr + txn + host) * 100) / 100;
}

export const contributionMargin = (m: Pick<ModuleKpi, "revenue" | "cost">) =>
  ratio(m.revenue - m.cost, m.revenue);

export type Recommendation = "EXPAND" | "HOLD" | "SUNSET" | "INSUFFICIENT_DATA";

export function moduleRecommendation(m: ModuleKpi, activeResidents: number): Recommendation {
  const adoption = ratio(m.activeUsers, activeResidents);
  const margin = contributionMargin(m);
  if (adoption === null || margin === null) return "INSUFFICIENT_DATA";
  if (adoption >= PILOT_THRESHOLDS.expandAdoption && margin >= PILOT_THRESHOLDS.expandMargin) {
    return "EXPAND";
  }
  if (adoption < PILOT_THRESHOLDS.sunsetAdoption && margin < 0) return "SUNSET";
  return "HOLD";
}

export const pilotKpiService = {
  async getKpis(params: {
    communityId?: number;
    from: string;
    to: string;
    gatewayMdrRate?: number;
    perTxnFixedCost?: number;
    moduleHostingAllocation?: number;
  }): Promise<PilotKpis> {
    const q = new URLSearchParams({ from: params.from, to: params.to });
    if (params.communityId != null) q.set("communityId", String(params.communityId));
    if (params.gatewayMdrRate != null) q.set("gatewayMdrRate", String(params.gatewayMdrRate));
    if (params.perTxnFixedCost != null) q.set("perTxnFixedCost", String(params.perTxnFixedCost));
    if (params.moduleHostingAllocation != null) q.set("moduleHostingAllocation", String(params.moduleHostingAllocation));
    return apiClient.get<PilotKpis>(`/admin/analytics/pilot-kpis?${q}`);
  },
};
