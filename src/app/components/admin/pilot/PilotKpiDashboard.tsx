import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, RefreshCw, AlertCircle } from "lucide-react";
import {
  pilotKpiService,
  PILOT_THRESHOLDS,
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

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await pilotKpiService.getKpis({ communityId, from: isoDaysAgo(days), to: isoDaysAgo(0) }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load pilot KPIs");
    } finally {
      setLoading(false);
    }
  }, [communityId, days]);

  useEffect(() => {
    void load();
  }, [load]);

  const scorecard = useMemo(
    () =>
      (data?.modules ?? []).map((m) => ({
        ...m,
        adoption: data && data.activeResidents > 0 ? m.activeUsers / data.activeResidents : null,
        margin: contributionMargin(m),
        recommendation: moduleRecommendation(m, data?.activeResidents ?? 0),
      })),
    [data],
  );

  const exportCsv = () => {
    const rows = [
      ["module", "activeUsers", "adoption", "revenue", "cost", "contributionMargin", "recommendation"],
      ...scorecard.map((m) => [
        m.module, m.activeUsers, m.adoption ?? "", m.revenue, m.cost, m.margin ?? "", m.recommendation,
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
            <div className="flex justify-end">
              <button onClick={exportCsv} className="flex items-center gap-1 rounded-lg border px-3 py-1 text-sm">
                <Download size={14} /> Export CSV
              </button>
            </div>
            <div className="overflow-x-auto rounded-xl border bg-white">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-gray-500">
                  <tr>
                    <th className="p-2">Module</th><th>Adoption</th><th>Revenue</th><th>Cost</th>
                    <th>Margin</th><th>Recommendation</th>
                  </tr>
                </thead>
                <tbody>
                  {scorecard.map((m) => (
                    <tr key={m.module} className="border-t">
                      <td className="p-2 font-medium">{m.module}</td>
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
              Thresholds are starting defaults: expand at ≥{pct(PILOT_THRESHOLDS.expandAdoption)} adoption and ≥
              {pct(PILOT_THRESHOLDS.expandMargin)} margin; sunset below {pct(PILOT_THRESHOLDS.sunsetAdoption)} adoption
              with negative margin. Cost is only as accurate as the backend inputs.
            </p>
          </Section>
        </>
      )}
    </div>
  );
}
