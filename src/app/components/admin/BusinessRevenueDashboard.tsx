import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  Activity, AlertCircle, ArrowDownRight, ArrowUpRight, Building2, CalendarClock,
  CheckCircle2, CreditCard, Download, RefreshCw, RotateCcw, Store, Wallet,
} from "lucide-react";
import { moduleContributionProxy, businessRevenueService, type BusinessRevenueKpis } from "../../../services/analytics/businessRevenueService";
import { BusinessRevenueAdminInputs } from "./BusinessRevenueAdminInputs";

const money = (value: number | null | undefined) => value == null || !Number.isFinite(value)
  ? "—" : `₹${Math.round(value).toLocaleString("en-IN")}`;
const count = (value: number | null | undefined) => value == null || !Number.isFinite(value)
  ? "—" : value.toLocaleString("en-IN");
const percent = (value: number | null | undefined) => value == null || !Number.isFinite(value)
  ? "—" : `${(value * 100).toFixed(1)}%`;
const ratio = (numerator: number | null | undefined, denominator: number | null | undefined) =>
  numerator == null || denominator == null || denominator <= 0 ? null : numerator / denominator;

function dateDaysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

function MetricCard({ label, value, note, icon: Icon, accent = "indigo" }: {
  label: string; value: string; note: string; icon: typeof Activity; accent?: string;
}) {
  const accents: Record<string, string> = {
    violet: "bg-violet-500/10 text-violet-600", emerald: "bg-emerald-500/10 text-emerald-600",
    blue: "bg-blue-500/10 text-blue-600", green: "bg-green-500/10 text-green-600",
    orange: "bg-orange-500/10 text-orange-600", cyan: "bg-cyan-500/10 text-cyan-600",
    rose: "bg-rose-500/10 text-rose-600", amber: "bg-amber-500/10 text-amber-600",
    pink: "bg-pink-500/10 text-pink-600", indigo: "bg-indigo-500/10 text-indigo-600",
  };
  return <article className="rounded-xl border border-border/70 bg-card p-4 shadow-2xs">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0"><p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-2 truncate text-2xl font-bold tracking-tight text-foreground">{value}</p>
      </div>
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${accents[accent] ?? accents.indigo}`}><Icon className="h-4 w-4" /></span>
    </div>
    <p className="mt-2 text-[11px] text-muted-foreground">{note}</p>
  </article>;
}

export function BusinessRevenueDashboard() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<BusinessRevenueKpis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [financeEntry, setFinanceEntry] = useState({ moduleCode: "MARKETPLACE_ORDER", reportDate: dateDaysAgo(0), commissionRevenue: "", directCost: "" });
  const [savingFinance, setSavingFinance] = useState(false);
  const [financeError, setFinanceError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await businessRevenueService.getSummary({ from: dateDaysAgo(days), to: dateDaysAgo(0) }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load business metrics.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    let active = true;
    businessRevenueService.getSummary({ from: dateDaysAgo(days), to: dateDaysAgo(0) })
      .then((result) => { if (active) setData(result); })
      .catch((e: unknown) => {
        if (active) {
          setError(e instanceof Error ? e.message : "Unable to load business metrics.");
          setData(null);
        }
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [days]);

  const business = data?.business;
  const tx = data?.transactions;
  const paymentFailureRate = ratio(tx?.paymentsFailed, tx?.paymentsStarted);
  const repeatPurchaseRate = ratio(business?.repeatBuyers, business?.uniqueBuyers);
  const refundRate = ratio(business?.refundCount, tx?.paymentsSucceeded);
  const margins = (data?.modules ?? []).map((module) => ({
    ...module,
    margin: moduleContributionProxy(module),
    marginAmount: module.marginSource === "ACTUAL" && module.actualCommissionRevenue != null && module.actualDirectCost != null
      ? module.actualCommissionRevenue - module.actualDirectCost
      : module.grossPaymentVolume - module.estimatedDirectCost,
  }))
    .sort((a, b) => (b.margin ?? -Infinity) - (a.margin ?? -Infinity));

  const exportCsv = () => {
    if (!data) return;
    const rows = [
      ["module", "gross_payment_volume", "commission_revenue_actual", "direct_cost_actual_or_estimated", "contribution_margin_amount", "contribution_margin_rate", "margin_source"],
      ...margins.map((m) => [m.module, m.grossPaymentVolume, m.actualCommissionRevenue ?? "", m.actualDirectCost ?? m.estimatedDirectCost, m.marginAmount, m.margin == null ? "" : `${(m.margin * 100).toFixed(1)}%`, m.marginSource]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `mana-business-modules-${dateDaysAgo(0)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const saveFinanceEntry = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const commissionRevenue = Number(financeEntry.commissionRevenue);
    const directCost = Number(financeEntry.directCost);
    if (!Number.isFinite(commissionRevenue) || !Number.isFinite(directCost)) {
      setFinanceError("Enter valid commission revenue and direct cost amounts.");
      return;
    }
    setSavingFinance(true);
    setFinanceError(null);
    try {
      await businessRevenueService.upsertModuleFinance({ ...financeEntry, commissionRevenue, directCost });
      setFinanceEntry((current) => ({ ...current, commissionRevenue: "", directCost: "" }));
      await load();
    } catch (e) {
      setFinanceError(e instanceof Error ? e.message : "Unable to save module finance actuals.");
    } finally {
      setSavingFinance(false);
    }
  };
  const metrics = [
    { label: "Active paying communities", value: count(business?.activePayingCommunities), note: "Communities with an active paid subscription", icon: Building2, accent: "violet" },
    { label: "Monthly recurring revenue", value: money(data?.revenue.subscriptionMrr), note: `${count(data?.revenue.subscribers)} active subscribers`, icon: Wallet, accent: "emerald" },
    { label: "Gross merchandise value", value: money(data?.revenue.gmv), note: `Last ${days} days`, icon: CreditCard, accent: "blue" },
    { label: "Commission revenue", value: money(data?.revenue.commission), note: "Marketplace and service take", icon: ArrowUpRight, accent: "green" },
    { label: "Active vendors", value: count(business?.activeVendors), note: "Vendors currently marked active", icon: Store, accent: "orange" },
    { label: "Completed orders + bookings", value: count(business?.completedOrders == null || business?.completedBookings == null ? undefined : business.completedOrders + business.completedBookings), note: `${count(business?.completedOrders)} orders · ${count(business?.completedBookings)} bookings`, icon: CheckCircle2, accent: "cyan" },
    { label: "Payment failure rate", value: percent(paymentFailureRate), note: `${count(tx?.paymentsFailed)} failed of ${count(tx?.paymentsStarted)} started attempts`, icon: ArrowDownRight, accent: "rose" },
    { label: "Refund rate", value: percent(refundRate), note: `${count(business?.refundCount)} refunds of successful payment orders`, icon: RotateCcw, accent: "amber" },
    { label: "Repeat purchase rate", value: percent(repeatPurchaseRate), note: `${count(business?.repeatBuyers)} repeat buyers of ${count(business?.uniqueBuyers)}`, icon: Activity, accent: "pink" },
    { label: "Average vendor settlement delay", value: business?.averageSettlementDelayDays == null ? "—" : `${business.averageSettlementDelayDays.toFixed(1)} days`, note: `${count(business?.overdueSettlements)} overdue · ${business?.settlementSlaDays == null ? "SLA not configured" : `${business.settlementSlaDays}-day SLA`}`, icon: CalendarClock, accent: "indigo" },
  ];

  return <main className="mx-auto w-full max-w-7xl space-y-5 px-4 py-5 sm:px-6">
    <header className="flex flex-col justify-between gap-4 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 p-5 text-white sm:flex-row sm:items-end sm:p-7">
      <div><p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-200"><Wallet className="h-4 w-4" /> Mana platform · business operations</p>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Business &amp; Revenue Dashboard</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-300">Platform-wide subscriptions, marketplace performance, payment quality and unit economics.</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor="business-range">Reporting range</label>
        <select id="business-range" value={days} onChange={(event) => { setLoading(true); setError(null); setDays(Number(event.target.value)); }} className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white">
          {[7, 30, 90].map((value) => <option className="text-slate-900" value={value} key={value}>Last {value} days</option>)}
        </select>
        <button onClick={() => void load()} className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-blue-50"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh</button>
      </div>
    </header>

    {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><div><p className="font-semibold">Business metrics are unavailable</p><p className="mt-0.5 text-xs">{error}. The dashboard reads the platform KPI endpoint; no sample values are substituted.</p></div></div>}

    {!!data?.unavailableMetrics?.length && <div role="status" className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-950">
      <p className="font-semibold">Some metrics need additional business data</p>
      <ul className="mt-1 list-inside list-disc text-xs">
        {data.unavailableMetrics.map((metric) => <li key={metric}>{metric.split(":").slice(1).join(":").trim() || metric}</li>)}
      </ul>
    </div>}

    <BusinessRevenueAdminInputs onSaved={() => void load()} />

    <section aria-label="Business performance metrics" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {metrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}
    </section>

    <section className="overflow-hidden rounded-2xl border border-border/70 bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 px-4 py-4 sm:px-5">
        <div><h2 className="text-sm font-bold text-foreground">Contribution margin by module</h2><p className="mt-1 text-xs text-muted-foreground">Actual rows use recorded commission revenue and direct cost. Other rows use a GMV based cost proxy.</p></div>
        <button onClick={exportCsv} disabled={!data} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"><Download className="h-3.5 w-3.5" /> Export CSV</button>
      </div>
      <details className="border-b border-border/70 px-4 py-3 sm:px-5">
        <summary className="cursor-pointer text-xs font-semibold text-primary">Record module finance actuals</summary>
        <form onSubmit={saveFinanceEntry} className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="text-xs text-muted-foreground">Module<select required value={financeEntry.moduleCode} onChange={(e) => setFinanceEntry((v) => ({ ...v, moduleCode: e.target.value }))} className="mt-1 w-full rounded-md border border-border bg-background px-2 py-2 text-foreground">{(data?.modules ?? []).map((module) => <option key={module.module} value={module.module}>{module.module}</option>)}</select></label>
          <label className="text-xs text-muted-foreground">Finance date<input required type="date" value={financeEntry.reportDate} onChange={(e) => setFinanceEntry((v) => ({ ...v, reportDate: e.target.value }))} className="mt-1 w-full rounded-md border border-border bg-background px-2 py-2 text-foreground" /></label>
          <label className="text-xs text-muted-foreground">Commission revenue (₹)<input required type="number" min="0" step="0.01" value={financeEntry.commissionRevenue} onChange={(e) => setFinanceEntry((v) => ({ ...v, commissionRevenue: e.target.value }))} className="mt-1 w-full rounded-md border border-border bg-background px-2 py-2 text-foreground" /></label>
          <label className="text-xs text-muted-foreground">Direct cost (₹)<input required type="number" min="0" step="0.01" value={financeEntry.directCost} onChange={(e) => setFinanceEntry((v) => ({ ...v, directCost: e.target.value }))} className="mt-1 w-full rounded-md border border-border bg-background px-2 py-2 text-foreground" /></label>
          <button type="submit" disabled={savingFinance || !data} className="self-end rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50">{savingFinance ? "Saving…" : "Save actuals"}</button>
        </form>
        <p className="mt-2 text-[11px] text-muted-foreground">Saving the same module and date replaces that day’s finance entry.</p>
        {financeError && <p role="alert" className="mt-2 text-xs text-rose-700">{financeError}</p>}
      </details>
      {loading && !data ? <div className="p-8 text-center text-sm text-muted-foreground">Loading platform revenue metrics…</div> : margins.length === 0 ? <div className="p-8 text-center text-sm text-muted-foreground">Module contribution data is not available for this period.</div> : <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] text-left text-sm"><thead className="bg-muted/40 text-[11px] uppercase tracking-wide text-muted-foreground"><tr><th className="px-5 py-3">Module</th><th className="px-5 py-3 text-right">Gross payment volume</th><th className="px-5 py-3 text-right">Commission revenue</th><th className="px-5 py-3 text-right">Direct cost</th><th className="px-5 py-3 text-right">Contribution ₹</th><th className="px-5 py-3 text-right">Margin rate</th><th className="px-5 py-3">Basis</th></tr></thead>
          <tbody className="divide-y divide-border/60">{margins.map((module) => <tr key={module.module}>
            <td className="px-5 py-3 font-semibold text-foreground">{module.module}</td><td className="px-5 py-3 text-right tabular-nums">{money(module.grossPaymentVolume)}</td><td className="px-5 py-3 text-right tabular-nums">{money(module.actualCommissionRevenue)}</td><td className="px-5 py-3 text-right tabular-nums">{money(module.actualDirectCost ?? module.estimatedDirectCost)}</td><td className="px-5 py-3 text-right font-semibold tabular-nums">{money(module.marginAmount)}</td><td className="px-5 py-3 text-right tabular-nums">{percent(module.margin)}</td><td className="px-5 py-3 text-xs">{module.marginSource === "ACTUAL" ? "Actual finance data" : "GMV proxy"}</td>
          </tr>)}</tbody>
        </table>
      </div>}
      <div className="border-t border-border/70 bg-muted/20 px-4 py-3 text-[11px] text-muted-foreground sm:px-5">{data?.costCalibration ? `GMV proxy cost model: ${(data.costCalibration.gatewayMdrRate * 100).toFixed(1)}% processing + ₹${data.costCalibration.perTxnFixedCost.toFixed(2)} per transaction + ₹${data.costCalibration.moduleHostingAllocation.toLocaleString("en-IN")} hosting allocation.` : "Rows without finance entries use the configured GMV cost proxy."}</div>
    </section>
    {!loading && data && <p className="text-center text-[11px] text-muted-foreground">Company-level metrics follow the selected {days}-day reporting window. MRR is the current monthly recurring run rate.</p>}
  </main>;
}
