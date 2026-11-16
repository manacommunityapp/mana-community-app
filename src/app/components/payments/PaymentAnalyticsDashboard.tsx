import { useState, useEffect, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { TrendingUp, ShoppingCart, CheckCircle, RefreshCw, AlertCircle } from "lucide-react";
import {
  paymentAnalyticsService,
  type PaymentAnalytics,
} from "../../../services/payments/paymentAnalyticsService";

const MODULE_LABELS: Record<string, string> = {
  EVENT_REGISTRATION: "Event Registrations",
  SPORTS_REGISTRATION: "Sports",
  AMENITY_BOOKING: "Amenity Bookings",
  HEALTH_BOOKING: "Health",
  FOOD_ORDER: "Food Orders",
  FOOD_GROCERY_ORDER: "Grocery Orders",
  MARKETPLACE_ORDER: "Marketplace",
  TRIP_SETTLEMENT: "Trips",
  BBPS_BILL: "BBPS Bills",
  MAINTENANCE_BILL: "Maintenance",
  MANUAL: "Manual",
};

const GATEWAY_COLORS: Record<string, string> = {
  CASHFREE: "bg-blue-100 text-blue-700",
  RAZORPAY: "bg-indigo-100 text-indigo-700",
  MANA_PAY: "bg-violet-100 text-violet-700",
  UPI_DIRECT: "bg-teal-100 text-teal-700",
  MANUAL: "bg-amber-100 text-amber-700",
};

function formatCurrency(n: number) {
  return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

function successRateColor(rate: number) {
  if (rate >= 80) return "text-green-600";
  if (rate >= 60) return "text-amber-600";
  return "text-red-600";
}

function defaultDateRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

interface Props {
  communityId: number;
}

export function PaymentAnalyticsDashboard({ communityId }: Props) {
  const [range, setRange] = useState(defaultDateRange);
  const [draft, setDraft] = useState(range);
  const [data, setData] = useState<PaymentAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await paymentAnalyticsService.getAnalytics({ communityId, ...range });
      setData(result);
    } catch {
      setError("Failed to load payment analytics. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [communityId, range]);

  useEffect(() => { fetch(); }, [fetch]);

  return (
    <div className="space-y-6">
      {/* Date range picker */}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
          <input
            type="date"
            value={draft.from}
            max={draft.to}
            onChange={(e) => setDraft((d) => ({ ...d, from: e.target.value }))}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
          <input
            type="date"
            value={draft.to}
            min={draft.from}
            onChange={(e) => setDraft((d) => ({ ...d, to: e.target.value }))}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-400"
          />
        </div>
        <button
          onClick={() => setRange(draft)}
          className="flex items-center gap-1.5 text-sm font-semibold px-4 py-1.5 rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Apply
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
          <button onClick={fetch} className="ml-auto font-semibold underline">Retry</button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-16">
          <RefreshCw className="w-6 h-6 animate-spin text-violet-500" />
        </div>
      )}

      {!loading && data && (
        <>
          {/* KPI tiles */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <ShoppingCart className="w-4 h-4 text-gray-400" />
                <span className="text-xs font-medium text-gray-500">Total Orders</span>
              </div>
              <p className="text-2xl font-bold text-gray-800">{data.totalOrders.toLocaleString()}</p>
              <p className="text-xs text-gray-400 mt-0.5">{data.totalSuccessful} successful · {data.totalFailed} failed</p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-4 h-4 text-gray-400" />
                <span className="text-xs font-medium text-gray-500">Success Rate</span>
              </div>
              <p className={`text-2xl font-bold ${successRateColor(data.successRate)}`}>
                {data.successRate.toFixed(1)}%
              </p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-gray-400" />
                <span className="text-xs font-medium text-gray-500">Total Volume</span>
              </div>
              <p className="text-2xl font-bold text-gray-800">{formatCurrency(data.totalAmount)}</p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <RefreshCw className="w-4 h-4 text-gray-400" />
                <span className="text-xs font-medium text-gray-500">Total Refunded</span>
              </div>
              <p className="text-2xl font-bold text-red-500">{formatCurrency(data.totalRefunded)}</p>
            </div>
          </div>

          {/* Gateway breakdown */}
          {data.breakdownByGateway.length > 0 && (
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">By Payment Gateway</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs font-semibold text-gray-400 border-b border-gray-100">
                      <th className="pb-2 pr-4">Gateway</th>
                      <th className="pb-2 pr-4 text-right">Orders</th>
                      <th className="pb-2 pr-4 text-right">Volume</th>
                      <th className="pb-2 text-right">Success Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.breakdownByGateway.map((row) => (
                      <tr key={row.gateway}>
                        <td className="py-2.5 pr-4">
                          <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-semibold ${GATEWAY_COLORS[row.gateway] ?? "bg-gray-100 text-gray-700"}`}>
                            {row.gateway}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4 text-right text-gray-700">{row.count.toLocaleString()}</td>
                        <td className="py-2.5 pr-4 text-right text-gray-700">{formatCurrency(row.amount)}</td>
                        <td className={`py-2.5 text-right font-semibold ${successRateColor(row.successRate)}`}>
                          {row.successRate.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Module breakdown */}
          {data.breakdownByModule.length > 0 && (
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">By Module</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs font-semibold text-gray-400 border-b border-gray-100">
                      <th className="pb-2 pr-4">Module</th>
                      <th className="pb-2 pr-4 text-right">Orders</th>
                      <th className="pb-2 text-right">Volume</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.breakdownByModule.map((row) => (
                      <tr key={row.referenceType}>
                        <td className="py-2.5 pr-4 text-gray-700">
                          {MODULE_LABELS[row.referenceType] ?? row.referenceType}
                        </td>
                        <td className="py-2.5 pr-4 text-right text-gray-700">{row.count.toLocaleString()}</td>
                        <td className="py-2.5 text-right text-gray-700">{formatCurrency(row.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Daily trend chart */}
          {data.dailyTrend.length > 0 && (
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Daily Volume Trend</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.dailyTrend} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(d: string) => d.slice(5)}
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v: number) => "₹" + (v >= 1000 ? (v / 1000).toFixed(0) + "k" : v)}
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), "Volume"]}
                    labelFormatter={(label: string) => label}
                    contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
                  />
                  <Bar dataKey="amount" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
}
