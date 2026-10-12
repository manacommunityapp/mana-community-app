import React, { useEffect, useState } from "react";
import { apiClient } from "../../../../services/common/apiClient";

interface TopProduct {
  sku: string;
  title: string;
  quantitySold: number;
}

interface CommerceAnalyticsDto {
  periodFrom: string;
  periodTo: string;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  fulfillmentRate: number;
  totalRevenue: number;
  averageOrderValue: number;
  topProducts: TopProduct[];
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function CommerceAnalyticsDashboard() {
  const today = new Date().toISOString().slice(0, 10);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600000).toISOString().slice(0, 10);

  const [from, setFrom] = useState(thirtyDaysAgo);
  const [to, setTo] = useState(today);
  const [data, setData] = useState<CommerceAnalyticsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    apiClient
      .get<CommerceAnalyticsDto>(`/commerce/analytics?from=${from}&to=${to}`)
      .then((d) => setData(d))
      .catch(() => setError("Failed to load analytics."))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  return (
    <div className="p-6 space-y-5">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-end gap-3">
        <div>
          <label className="text-xs text-gray-500 font-medium">From</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
            className="mt-1 block rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
        </div>
        <div>
          <label className="text-xs text-gray-500 font-medium">To</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
            className="mt-1 block rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
        </div>
        <button onClick={load}
          className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium">
          Refresh
        </button>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {loading ? (
        <div className="py-16 text-center text-sm text-gray-400">Loading analytics…</div>
      ) : data && (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="Total Orders" value={data.totalOrders.toLocaleString("en-IN")} />
            <StatCard label="Revenue" value={`₹${Number(data.totalRevenue).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`} />
            <StatCard label="Fulfillment Rate" value={`${data.fulfillmentRate.toFixed(1)}%`}
              sub={`${data.completedOrders} completed`} />
            <StatCard label="Avg Order Value" value={`₹${Number(data.averageOrderValue).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`} />
          </div>

          {/* Additional metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <StatCard label="Cancelled Orders" value={data.cancelledOrders.toLocaleString("en-IN")} />
            <StatCard label="Completed Orders" value={data.completedOrders.toLocaleString("en-IN")} />
            <StatCard label="Cancellation Rate"
              value={data.totalOrders > 0 ? `${((data.cancelledOrders / data.totalOrders) * 100).toFixed(1)}%` : "0%"} />
          </div>

          {/* Top products */}
          {data.topProducts.length > 0 && (
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <p className="px-4 py-3 text-sm font-semibold text-gray-700 border-b border-gray-100">Top Products by Quantity</p>
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {["#", "SKU", "Product", "Qty Sold"].map((h) => (
                      <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.topProducts.map((p, i) => (
                    <tr key={p.sku} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 text-sm text-gray-400">{i + 1}</td>
                      <td className="px-4 py-2.5 text-xs font-mono text-gray-600">{p.sku}</td>
                      <td className="px-4 py-2.5 text-sm text-gray-700">{p.title}</td>
                      <td className="px-4 py-2.5 text-sm font-semibold text-violet-700">{p.quantitySold.toLocaleString("en-IN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
