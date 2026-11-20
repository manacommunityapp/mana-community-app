import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, RefreshCw, AlertCircle, SlidersHorizontal, RotateCcw, Info } from "lucide-react";
import {
  pilotKpiService,
  PILOT_THRESHOLDS,
  DEFAULT_COST_CALIBRATION,
  recalculateModuleCost,
  activationRate,
  paymentSuccessRate,
  bookingToPaymentCompletion,
  takeRate,
  churnRate,
  contributionMargin,
  ticketsPer100Residents,
  moduleRecommendation,
  type PilotKpis,
  type Recommendation,
  type CostCalibration,
} from "../../../../services/analytics/pilotKpiService";
import { usePilot } from "../../../../contexts/PilotContext";

interface Props {
  communityId?: number;
}

const pct = (v: number | null) => (v === null ? "—" : `${(v * 100).toFixed(1)}%`);
const num = (v: number | null, d = 1) => (v === null ? "—" : v.toFixed(d));
const money = (v: number) => `₹${Math.round(v).toLocaleString("en-IN")}`;

const REC_STYLE: Record<Recommendation, string> = {
  EXPAND: "bg-emerald-100 text-emerald-700",
  HOLD: "bg-amber-100 text-amber-700",
  SUNSET: "bg-red-100 text-red-700",
  INSUFFICIENT_DATA: "bg-gray-100 text-gray-600",
};

function isoDaysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function Stat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${warn ? "text-red-600" : "text-gray-900"}`}>{value}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
      {children}
    </section>
  );
}

export function PilotKpiDashboard({ communityId }: Props) {
  const { pilot, cohort } = usePilot();
  const [days, setDays] = useState(30);
  const [data, setData] = useState<PilotKpis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Operational Cost Model Calibration State (Finance/Ops inputs)
  const [showCostCalibration, setShowCostCalibration] = useState(false);
  const [gatewayMdrPct, setGatewayMdrPct] = useState(2.0); // Calibrated default: 2.0% PG MDR
  const [perTxnCost, setPerTxnCost] = useState(2.0); // Calibrated default: ₹2.00 messaging/infra
  const [hostingAllocation, setHostingAllocation] = useState(0); // Calibrated default: ₹0/module

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await pilotKpiService.getKpis({
        communityId,
        from: isoDaysAgo(days),
        to: isoDaysAgo(0),
        gatewayMdrRate: gatewayMdrPct / 100,
        perTxnFixedCost: perTxnCost,
        moduleHostingAllocation: hostingAllocation,
      });
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load pilot KPIs");
    } finally {
      setLoading(false);
    }
  }, [communityId, days, gatewayMdrPct, perTxnCost, hostingAllocation]);

  useEffect(() => {
    void load();
  }, [load]);

  const scorecard = useMemo(() => {
    const calibration: CostCalibration = {
      gatewayMdrRate: gatewayMdrPct / 100,
      perTxnFixedCost: perTxnCost,
      moduleHostingAllocation: hostingAllocation,
    };
    return (data?.modules ?? []).map((m) => {
      const orders = m.orderCount ?? (m.activeUsers > 0 ? Math.max(1, m.activeUsers * 2) : 0);
      const calibratedCost = recalculateModuleCost(m.revenue, orders, calibration);
      const moduleItem = {
        ...m,
        orderCount: orders,
        cost: calibratedCost,
      };
      return {
        ...moduleItem,
        adoption: data && data.activeResidents > 0 ? m.activeUsers / data.activeResidents : null,
        margin: contributionMargin(moduleItem),
        recommendation: moduleRecommendation(moduleItem, data?.activeResidents ?? 0),
      };
    });
  }, [data, gatewayMdrPct, perTxnCost, hostingAllocation]);

  const resetCostModel = () => {
    setGatewayMdrPct(DEFAULT_COST_CALIBRATION.gatewayMdrRate * 100);
    setPerTxnCost(DEFAULT_COST_CALIBRATION.perTxnFixedCost);
    setHostingAllocation(DEFAULT_COST_CALIBRATION.moduleHostingAllocation);
  };

  const exportCsv = () => {
    const rows = [
      ["module", "orders", "activeUsers", "adoption", "revenue", "cost", "contributionMargin", "recommendation"],
      ...scorecard.map((m) => [
        m.module, m.orderCount, m.activeUsers, m.adoption ?? "", m.revenue, m.cost, m.margin ?? "", m.recommendation,
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `pilot-module-scorecard-${isoDaysAgo(0)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Pilot KPIs</h2>
          <p className="text-xs text-gray-500">
            {pilot ? `Pilot community${cohort ? ` · cohort ${cohort}` : ""}` : "Not flagged as a pilot community"}
          </p>
        </div>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="ml-auto rounded-lg border border-gray-300 px-2 py-1 text-sm"
        >
          {[7, 30, 90].map((d) => (
            <option key={d} value={d}>Last {d} days</option>
          ))}
        </select>
        <button onClick={load} className="flex items-center gap-1 rounded-lg border px-3 py-1 text-sm">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle size={16} /> {error}
          <span className="text-xs text-red-500">
            (The /admin/analytics/pilot-kpis endpoint may not be available yet.)
          </span>
        </div>
      )}

      {data && (
        <>
          <Section title="Onboarding and activation">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Stat label="Signups" value={String(data.signups)} />
              <Stat label="Activated residents" value={String(data.activatedResidents)} />
              <Stat
                label={`Activation rate (target ${pct(PILOT_THRESHOLDS.activationRate)})`}
                value={pct(activationRate(data))}
                warn={(activationRate(data) ?? 1) < PILOT_THRESHOLDS.activationRate}
              />
              <Stat label="Active residents" value={String(data.activeResidents)} />
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-gray-600">
              {data.funnel.map((f) => (
                <span key={f.stage} className="rounded-full bg-gray-100 px-3 py-1">
                  {f.stage}: <b>{f.count}</b>
                </span>
              ))}
            </div>
          </Section>

          <Section title="Booking, payment and transaction completion">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Stat label="Bookings created" value={String(data.transactions.bookingsCreated)} />
              <Stat
                label={`Payment success (target ${pct(PILOT_THRESHOLDS.paymentSuccessRate)})`}
                value={pct(paymentSuccessRate(data.transactions))}
                warn={(paymentSuccessRate(data.transactions) ?? 1) < PILOT_THRESHOLDS.paymentSuccessRate}
              />
              <Stat label="Booking → payment" value={pct(bookingToPaymentCompletion(data.transactions))} />
              <Stat label="Failed payments" value={String(data.transactions.paymentsFailed)} />
            </div>
          </Section>

          <Section title="Vendor performance and support burden">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Stat label="Tickets / 100 residents" value={num(ticketsPer100Residents(data))} />
              <Stat label="Avg first response (h)" value={num(data.support.avgFirstResponseHours)} />
              <Stat label="Avg resolution (h)" value={num(data.support.avgResolutionHours)} />
              <Stat label="Tickets" value={String(data.support.tickets)} />
            </div>
            <div className="overflow-x-auto rounded-xl border bg-white">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-gray-500">
                  <tr>
                    <th className="p-2">Vendor</th><th>Orders</th><th>Accept</th><th>On-time</th>
                    <th>Cancel</th><th>Dispute</th>
                  </tr>
                </thead>
                <tbody>
                  {data.vendors.map((v) => (
                    <tr key={v.vendorId} className="border-t">
                      <td className="p-2 font-medium">{v.name}</td>
                      <td>{v.orders}</td>
                      <td>{pct(v.acceptanceRate)}</td>
                      <td>{pct(v.onTimeRate)}</td>
                      <td>{pct(v.cancellationRate)}</td>
                      <td>{pct(v.disputeRate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="Subscription and commission">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
              <Stat label="GMV" value={money(data.revenue.gmv)} />
              <Stat label="Commission" value={money(data.revenue.commission)} />
              <Stat label="Take rate" value={pct(takeRate(data.revenue))} />
              <Stat label="Subscription MRR" value={money(data.revenue.subscriptionMrr)} />
              <Stat label="Subscriber churn" value={pct(churnRate(data.revenue))} />
            </div>
          </Section>

          <Section title="Module scorecard (expand by adoption and contribution margin)">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs text-gray-500">
                Model: <b>{(gatewayMdrPct).toFixed(1)}%</b> MDR + <b>₹{perTxnCost.toFixed(2)}</b>/txn
                {hostingAllocation > 0 ? ` + ₹${hostingAllocation} hosting/mo` : ""}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowCostCalibration((prev) => !prev)}
                  className={`flex items-center gap-1.5 rounded-lg border px-3 py-1 text-sm font-medium transition ${
                    showCostCalibration
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <SlidersHorizontal size={14} />
                  {showCostCalibration ? "Hide Cost Controls" : "Calibrate Cost Model"}
                </button>
                <button onClick={exportCsv} className="flex items-center gap-1 rounded-lg border px-3 py-1 text-sm">
                  <Download size={14} /> Export CSV
                </button>
              </div>
            </div>

            {showCostCalibration && (
              <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-blue-900">
                    <Info size={16} className="text-blue-600" />
                    <span>Operational Cost Model Calibration (Finance & Ops Inputs)</span>
                  </div>
                  <button
                    type="button"
                    onClick={resetCostModel}
                    className="flex items-center gap-1 text-xs text-blue-700 hover:underline"
                  >
                    <RotateCcw size={12} /> Reset to Standard Defaults (2% + ₹2)
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-gray-200 bg-white p-2.5">
                    <label className="block text-xs font-medium text-gray-700">
                      Payment Gateway MDR (%)
                    </label>
                    <span className="text-[11px] text-gray-400">Blended card/UPI/netbanking rate</span>
                    <div className="mt-1 flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        value={gatewayMdrPct}
                        onChange={(e) => setGatewayMdrPct(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-full rounded border border-gray-300 px-2 py-1 text-sm font-semibold"
                      />
                      <span className="text-xs text-gray-500">%</span>
                    </div>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-white p-2.5">
                    <label className="block text-xs font-medium text-gray-700">
                      Messaging & Infra Fee (₹ / txn)
                    </label>
                    <span className="text-[11px] text-gray-400">SMS, WhatsApp & cloud compute</span>
                    <div className="mt-1 flex items-center gap-1">
                      <span className="text-xs text-gray-500">₹</span>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        step="0.25"
                        value={perTxnCost}
                        onChange={(e) => setPerTxnCost(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-full rounded border border-gray-300 px-2 py-1 text-sm font-semibold"
                      />
                    </div>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-white p-2.5">
                    <label className="block text-xs font-medium text-gray-700">
                      Module Fixed Hosting (₹ / mo)
                    </label>
                    <span className="text-[11px] text-gray-400">Dedicated compute/storage allocation</span>
                    <div className="mt-1 flex items-center gap-1">
                      <span className="text-xs text-gray-500">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="50"
                        value={hostingAllocation}
                        onChange={(e) => setHostingAllocation(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-full rounded border border-gray-300 px-2 py-1 text-sm font-semibold"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-blue-800">
                  <span>
                    Formula: <b>Direct Cost = (GMV × {gatewayMdrPct.toFixed(1)}%) + (Orders × ₹{perTxnCost.toFixed(2)}) + ₹{hostingAllocation}</b>
                  </span>
                  <button
                    type="button"
                    onClick={load}
                    className="rounded bg-blue-600 px-2.5 py-1 text-xs font-medium text-white shadow-sm hover:bg-blue-700"
                  >
                    Sync from Backend
                  </button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto rounded-xl border bg-white">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-gray-500">
                  <tr>
                    <th className="p-2">Module</th><th>Orders</th><th>Adoption</th><th>Revenue</th><th>Direct Cost</th>
                    <th>Margin</th><th>Recommendation</th>
                  </tr>
                </thead>
                <tbody>
                  {scorecard.map((m) => (
                    <tr key={m.module} className="border-t">
                      <td className="p-2 font-medium">{m.module}</td>
                      <td>{m.orderCount}</td>
                      <td>{pct(m.adoption)}</td>
                      <td>{money(m.revenue)}</td>
                      <td>{money(m.cost)}</td>
                      <td>{pct(m.margin)}</td>
                      <td>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${REC_STYLE[m.recommendation]}`}>
                          {m.recommendation.replace("_", " ")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-500">
              Thresholds: expand at ≥{pct(PILOT_THRESHOLDS.expandAdoption)} adoption and ≥
              {pct(PILOT_THRESHOLDS.expandMargin)} margin; sunset below {pct(PILOT_THRESHOLDS.sunsetAdoption)} adoption
              with negative margin. Operational costs dynamically recalibrate based on actual Finance/Ops PG MDR and infrastructure inputs.
            </p>
          </Section>
        </>
      )}
    </div>
  );
}
