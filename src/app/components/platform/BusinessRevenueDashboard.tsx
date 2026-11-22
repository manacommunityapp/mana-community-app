import { useState, useEffect, useCallback, useRef } from "react";
import {
  TrendingUp, TrendingDown, RefreshCw, Loader2, AlertTriangle,
  Users, ShoppingBag, CreditCard, BarChart2, Building2,
  ArrowUpRight, ArrowDownRight, Clock, CheckCircle,
} from "lucide-react";
import {
  fetchBusinessRevenueSnapshot,
  refreshBusinessRevenueSnapshot,
  type BusinessRevenueSnapshot,
  type ModuleMargin,
} from "../../../services/businessRevenueService";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatINR(val: number): string {
  if (val >= 10_000_000) return `₹${(val / 10_000_000).toFixed(2)}Cr`;
  if (val >= 100_000) return `₹${(val / 100_000).toFixed(2)}L`;
  if (val >= 1_000) return `₹${(val / 1_000).toFixed(1)}K`;
  return `₹${val.toFixed(0)}`;
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

function timeAgo(iso: string): string {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 10) return "just now";
  if (secs < 60) return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  return `${Math.floor(secs / 3600)}h ago`;
}

// ── Shared UI ─────────────────────────────────────────────────────────────────

type Severity = "ok" | "warn" | "crit" | "neutral";

function kpiColors(s: Severity): string {
  if (s === "ok") return "bg-emerald-50 border-emerald-200 text-emerald-800";
  if (s === "warn") return "bg-amber-50 border-amber-200 text-amber-900";
  if (s === "crit") return "bg-red-50 border-red-200 text-red-800";
  return "bg-white border-slate-200 text-slate-800";
}

function KpiTile({
  label, value, sub, severity = "neutral", icon,
}: {
  label: string; value: string | number; sub?: string;
  severity?: Severity; icon?: React.ReactNode;
}) {
  const cls = kpiColors(severity);
  return (
    <div className={`rounded-xl border p-3 flex flex-col gap-1 ${cls}`}>
      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
        {icon}{label}
      </div>
      <div className="text-xl font-bold font-mono leading-none">{value}</div>
      {sub && <div className="text-xs text-slate-500">{sub}</div>}
    </div>
  );
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-slate-400">{icon}</span>
      <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">{title}</h2>
    </div>
  );
}

function ProgressBar({ pct, color = "bg-blue-500" }: { pct: number; color?: string }) {
  return (
    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
      <div
        className={`h-2 rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${Math.min(pct, 100)}%` }}
      />
    </div>
  );
}

function GrowthBadge({ pct }: { pct: number }) {
  const positive = pct >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold ${
      positive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
    }`}>
      {positive ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
      {Math.abs(pct).toFixed(1)}%
    </span>
  );
}

function BigMetric({
  value, label, badge,
}: {
  value: string; label: string; badge?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="text-3xl font-bold font-mono text-slate-900">{value}</span>
        {badge}
      </div>
      <span className="text-xs text-slate-500">{label}</span>
    </div>
  );
}

function marginColor(pct: number): string {
  if (pct > 50) return "text-emerald-700 bg-emerald-50";
  if (pct > 20) return "text-amber-700 bg-amber-50";
  return "text-red-700 bg-red-50";
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function BusinessRevenueDashboard() {
  const [snap, setSnap] = useState<BusinessRevenueSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const data = await fetchBusinessRevenueSnapshot();
      setSnap(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not load revenue snapshot");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      const data = await refreshBusinessRevenueSnapshot();
      setSnap(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Refresh failed");
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    intervalRef.current = setInterval(() => load(true), 5 * 60 * 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 gap-3 text-slate-500">
        <Loader2 className="animate-spin" size={20} /> Loading revenue data…
      </div>
    );
  }

  if (error || !snap) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-red-500">
        <AlertTriangle size={24} />
        <span>{error ?? "No data available"}</span>
        <button onClick={() => load()} className="text-sm text-blue-600 underline">Retry</button>
      </div>
    );
  }

  // Status pill helpers
  const activationPct = snap.communityActivationRatePct;
  const activationSev = activationPct > 50 ? "ok" : activationPct > 20 ? "warn" : "crit";
  const failureSev: Severity = snap.paymentFailureRatePct > 5 ? "crit" : snap.paymentFailureRatePct > 2 ? "warn" : "ok";
  const refundSev: Severity = snap.refundRatePct > 3 ? "crit" : snap.refundRatePct > 1 ? "warn" : "ok";

  const pillColors: Record<string, string> = {
    ok: "bg-emerald-100 text-emerald-700 border-emerald-200",
    warn: "bg-amber-100 text-amber-700 border-amber-200",
    crit: "bg-red-100 text-red-700 border-red-200",
    neutral: "bg-slate-100 text-slate-600 border-slate-200",
  };

  const sortedModules: ModuleMargin[] = [...snap.moduleMargins].sort((a, b) => b.revenue - a.revenue);

  const settlementEmpty = snap.avgSettlementDelayDays === 0 && snap.overdueSettlements === 0;

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* ── Header ── */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 py-3">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <TrendingUp size={20} className="text-indigo-600" />
            <div>
              <h1 className="text-base font-bold text-slate-900">Business & Revenue</h1>
              <p className="text-xs text-slate-400">Platform business operations</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
            <span className="flex items-center gap-1">
              <Clock size={12} /> Updated {timeAgo(snap.asOf)}
            </span>
            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
              Period: {fmtDate(snap.periodStart)} – {fmtDate(snap.periodEnd)}
            </span>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 disabled:opacity-60 transition-colors"
            >
              <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} /> Refresh
            </button>
          </div>
        </div>

        {/* Status pill bar */}
        <div className="max-w-screen-xl mx-auto mt-3 flex flex-wrap gap-2">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium ${pillColors[activationSev]}`}>
            <Building2 size={11} />
            {snap.activePayingCommunities}/{snap.totalCommunities} communities ({activationPct.toFixed(0)}%)
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-200 bg-emerald-100 text-emerald-700 text-xs font-medium">
            <TrendingUp size={11} />
            MRR: {formatINR(snap.monthlyRecurringRevenue)}
            {snap.mrrGrowthPct >= 0 ? (
              <span className="text-emerald-600 font-semibold">▲{snap.mrrGrowthPct.toFixed(1)}%</span>
            ) : (
              <span className="text-red-600 font-semibold">▼{Math.abs(snap.mrrGrowthPct).toFixed(1)}%</span>
            )}
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-blue-200 bg-blue-100 text-blue-700 text-xs font-medium">
            <ShoppingBag size={11} />
            GMV: {formatINR(snap.grossMerchandiseValue)}
            {snap.gmvGrowthPct >= 0 ? (
              <span className="text-emerald-600 font-semibold">▲{snap.gmvGrowthPct.toFixed(1)}%</span>
            ) : (
              <span className="text-red-600 font-semibold">▼{Math.abs(snap.gmvGrowthPct).toFixed(1)}%</span>
            )}
          </span>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium ${pillColors[failureSev]}`}>
            <CreditCard size={11} />
            Failure rate: {snap.paymentFailureRatePct.toFixed(1)}%
          </span>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium ${pillColors[refundSev]}`}>
            <ArrowDownRight size={11} />
            Refund rate: {snap.refundRatePct.toFixed(1)}%
          </span>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 pt-6 space-y-6">

        {/* ── ROW 1: Communities · MRR · GMV ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Communities */}
          <section className="bg-white rounded-2xl border border-slate-200 p-5">
            <SectionHeader icon={<Building2 size={16} />} title="Communities" />
            <div className="mb-3">
              <BigMetric
                value={String(snap.activePayingCommunities)}
                label={`of ${snap.totalCommunities} total communities`}
              />
            </div>
            <div className="text-xs text-slate-500 mb-1.5 flex justify-between">
              <span>Activation rate</span>
              <span className="font-semibold text-slate-700">{activationPct.toFixed(1)}%</span>
            </div>
            <ProgressBar
              pct={activationPct}
              color={activationPct > 50 ? "bg-emerald-500" : activationPct > 20 ? "bg-amber-400" : "bg-red-500"}
            />
          </section>

          {/* MRR */}
          <section className="bg-white rounded-2xl border border-slate-200 p-5">
            <SectionHeader icon={<TrendingUp size={16} />} title="MRR" />
            <BigMetric
              value={formatINR(snap.monthlyRecurringRevenue)}
              label="Subscription revenue this month"
              badge={<GrowthBadge pct={snap.mrrGrowthPct} />}
            />
          </section>

          {/* GMV */}
          <section className="bg-white rounded-2xl border border-slate-200 p-5">
            <SectionHeader icon={<ShoppingBag size={16} />} title="GMV" />
            <BigMetric
              value={formatINR(snap.grossMerchandiseValue)}
              label="Gross merchandise value"
              badge={<GrowthBadge pct={snap.gmvGrowthPct} />}
            />
          </section>
        </div>

        {/* ── ROW 2: Commission · Vendors ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Commission Revenue */}
          <section className="bg-white rounded-2xl border border-slate-200 p-5">
            <SectionHeader icon={<BarChart2 size={16} />} title="Commission Revenue" />
            <div className="grid grid-cols-2 gap-3 mb-3">
              <KpiTile
                label="Commission"
                value={formatINR(snap.commissionRevenue)}
                severity="ok"
                icon={<TrendingUp size={11} />}
              />
              <KpiTile
                label="Margin %"
                value={`${snap.commissionMarginPct.toFixed(1)}%`}
                severity={snap.commissionMarginPct > 50 ? "ok" : snap.commissionMarginPct > 20 ? "warn" : "crit"}
                icon={<BarChart2 size={11} />}
              />
            </div>
            <p className="text-xs text-slate-400 italic">Platform take-rate on GMV</p>
          </section>

          {/* Vendors */}
          <section className="bg-white rounded-2xl border border-slate-200 p-5">
            <SectionHeader icon={<Users size={16} />} title="Vendors" />
            <div className="grid grid-cols-2 gap-3">
              <KpiTile
                label="Active Vendors"
                value={snap.activeVendors}
                severity="ok"
                icon={<Users size={11} />}
              />
              <KpiTile
                label="New This Month"
                value={snap.newVendorsThisMonth}
                severity={snap.newVendorsThisMonth > 0 ? "ok" : "neutral"}
                icon={<ArrowUpRight size={11} />}
              />
              <KpiTile
                label="Completed Orders"
                value={snap.completedOrders}
                severity="neutral"
                icon={<CheckCircle size={11} />}
              />
              <KpiTile
                label="Completed Bookings"
                value={snap.completedBookings}
                severity="neutral"
                icon={<CheckCircle size={11} />}
              />
            </div>
          </section>
        </div>

        {/* ── ROW 3: Payment Health · Refunds · Repeat Purchase ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Payment Health */}
          <section className="bg-white rounded-2xl border border-slate-200 p-5">
            <SectionHeader icon={<CreditCard size={16} />} title="Payment Health" />
            <div className={`text-3xl font-bold font-mono mb-1 ${
              snap.paymentFailureRatePct > 5 ? "text-red-600" :
              snap.paymentFailureRatePct > 2 ? "text-amber-700" : "text-emerald-700"
            }`}>
              {snap.paymentFailureRatePct.toFixed(1)}%
            </div>
            <div className="text-xs text-slate-500 mb-3">
              Failed: {snap.failedPayments} of {snap.totalPayments} payments
            </div>
            <div className="text-xs text-slate-500 mb-1.5 flex justify-between">
              <span>Success rate</span>
              <span className="font-semibold text-slate-700">
                {(100 - snap.paymentFailureRatePct).toFixed(1)}%
              </span>
            </div>
            <ProgressBar
              pct={100 - snap.paymentFailureRatePct}
              color={snap.paymentFailureRatePct > 5 ? "bg-red-400" : snap.paymentFailureRatePct > 2 ? "bg-amber-400" : "bg-emerald-500"}
            />
          </section>

          {/* Refunds */}
          <section className="bg-white rounded-2xl border border-slate-200 p-5">
            <SectionHeader icon={<ArrowDownRight size={16} />} title="Refunds" />
            <div className={`text-3xl font-bold font-mono mb-1 ${
              snap.refundRatePct > 3 ? "text-red-600" :
              snap.refundRatePct > 1 ? "text-amber-700" : "text-emerald-700"
            }`}>
              {snap.refundRatePct.toFixed(1)}%
            </div>
            <div className="text-sm font-semibold text-slate-700 mb-0.5">
              {formatINR(snap.totalRefundedAmount)}
            </div>
            <div className="text-xs text-slate-400">of GMV refunded</div>
          </section>

          {/* Repeat Purchase */}
          <section className="bg-white rounded-2xl border border-slate-200 p-5">
            <SectionHeader icon={<TrendingUp size={16} />} title="Repeat Purchase" />
            <div className="text-3xl font-bold font-mono text-slate-900 mb-1">
              {snap.repeatPurchaseRatePct.toFixed(1)}%
            </div>
            <div className="text-xs text-slate-500 mb-3">
              {snap.repeatBuyers} of {snap.totalBuyers} buyers returned
            </div>
            <div className="text-xs text-slate-500 mb-1.5 flex justify-between">
              <span>Repeat rate</span>
              <span className="font-semibold text-slate-700">{snap.repeatPurchaseRatePct.toFixed(1)}%</span>
            </div>
            <ProgressBar
              pct={snap.repeatPurchaseRatePct}
              color={snap.repeatPurchaseRatePct > 50 ? "bg-emerald-500" : snap.repeatPurchaseRatePct > 20 ? "bg-amber-400" : "bg-red-400"}
            />
          </section>
        </div>

        {/* ── ROW 4: Vendor Settlements ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Settlements */}
          <section className="bg-white rounded-2xl border border-slate-200 p-5">
            <SectionHeader icon={<BarChart2 size={16} />} title="Vendor Settlements" />
            {settlementEmpty ? (
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-700">
                <AlertTriangle size={14} />
                No settlement data yet — settlement tracking not yet wired
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <KpiTile
                  label="Avg Delay"
                  value={`${snap.avgSettlementDelayDays.toFixed(1)}d`}
                  severity={
                    snap.avgSettlementDelayDays > 7 ? "crit" :
                    snap.avgSettlementDelayDays > 3 ? "warn" : "ok"
                  }
                  sub="Average settlement days"
                  icon={<Clock size={11} />}
                />
                <KpiTile
                  label="Overdue Settlements"
                  value={snap.overdueSettlements}
                  severity={snap.overdueSettlements > 0 ? "crit" : "ok"}
                  sub={snap.overdueSettlements > 0 ? "Immediate attention" : "All clear"}
                  icon={<AlertTriangle size={11} />}
                />
              </div>
            )}
          </section>

          {/* Settlement info card when no data */}
          <section className="bg-white rounded-2xl border border-slate-200 p-5">
            <SectionHeader icon={<CheckCircle size={16} />} title="Settlement Summary" />
            {settlementEmpty ? (
              <div className="space-y-2 text-sm text-slate-600">
                <p className="text-slate-500 text-xs">
                  Vendor settlements will appear here once the settlement tracking service is wired.
                  Contact the platform engineering team.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between p-2.5 bg-slate-50 rounded-lg">
                  <span className="text-xs text-slate-600">Avg settlement delay</span>
                  <span className={`text-sm font-semibold font-mono ${
                    snap.avgSettlementDelayDays > 7 ? "text-red-600" :
                    snap.avgSettlementDelayDays > 3 ? "text-amber-700" : "text-emerald-700"
                  }`}>{snap.avgSettlementDelayDays.toFixed(1)} days</span>
                </div>
                <div className="flex justify-between p-2.5 bg-slate-50 rounded-lg">
                  <span className="text-xs text-slate-600">Overdue</span>
                  <span className={`text-sm font-semibold font-mono ${snap.overdueSettlements > 0 ? "text-red-600" : "text-emerald-700"}`}>
                    {snap.overdueSettlements}
                  </span>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* ── ROW 5: Module Margins ── */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5">
          <SectionHeader icon={<BarChart2 size={16} />} title="Module Margins" />
          {sortedModules.length === 0 ? (
            <div className="text-sm text-slate-400 text-center py-6">
              No module margin data for this period
            </div>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wide">
                  <tr>
                    {["Module", "Revenue", "Cost", "Contribution Margin", "Margin %"].map((h) => (
                      <th key={h} className="px-4 py-2 text-left font-semibold whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedModules.map((m) => (
                    <tr key={m.module} className="hover:bg-slate-50">
                      <td className="px-4 py-2 font-semibold text-slate-800 whitespace-nowrap">{m.module}</td>
                      <td className="px-4 py-2 font-mono text-slate-700">{formatINR(m.revenue)}</td>
                      <td className="px-4 py-2 font-mono text-slate-500">{formatINR(m.cost)}</td>
                      <td className="px-4 py-2 font-mono text-slate-700">{formatINR(m.contributionMargin)}</td>
                      <td className="px-4 py-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${marginColor(m.marginPct)}`}>
                          {m.marginPct.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
