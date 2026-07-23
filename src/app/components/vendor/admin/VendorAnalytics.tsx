import { useState, useEffect } from "react";
import {
  BarChart3,
  Star,
  TrendingUp,
  Clock,
  Loader2,
  AlertCircle,
  Award,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import { vendorAnalyticsService, vendorService } from "../../../../services/vendorService";
import { showError } from "../../../../utils/ToastUtils";
import type { VendorDashboardStats, VendorPerformanceResponse, VendorResponse, PaginatedResponse } from "../../../../types/api";

const TIER_COLORS: Record<string, string> = {
  PLATINUM: "bg-slate-100 text-slate-800 border-slate-300",
  GOLD: "bg-amber-50 text-amber-800 border-amber-300",
  SILVER: "bg-gray-50 text-gray-700 border-gray-300",
  BRONZE: "bg-orange-50 text-orange-700 border-orange-300",
};

export function VendorAnalytics() {
  const [stats, setStats] = useState<VendorDashboardStats | null>(null);
  const [vendors, setVendors] = useState<VendorResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVendorId, setSelectedVendorId] = useState<number | null>(null);
  const [performance, setPerformance] = useState<VendorPerformanceResponse | null>(null);
  const [perfLoading, setPerfLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [dashStats, vendorList] = await Promise.all([
        vendorAnalyticsService.getDashboardStats(),
        vendorService.getVendors({ status: "ACTIVE" as any, size: 50 }),
      ]);
      setStats(dashStats);
      setVendors(vendorList.content);
    } catch {
      showError("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  }

  async function loadPerformance(vendorId: number) {
    setSelectedVendorId(vendorId);
    setPerfLoading(true);
    try {
      const data = await vendorAnalyticsService.getVendorPerformance(vendorId);
      setPerformance(data);
    } catch {
      showError("Failed to load vendor performance");
      setPerformance(null);
    } finally {
      setPerfLoading(false);
    }
  }

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

  const formatPercent = (n: number) => `${(n * 100).toFixed(1)}%`;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Vendor Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Performance metrics and vendor leaderboard
        </p>
      </div>

      {/* Summary cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.totalRevenue)}</p>
                  <p className="text-xs text-muted-foreground">Total Revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-green-50 flex items-center justify-center">
                  <Star className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.avgRating?.toFixed(1) ?? "N/A"}</p>
                  <p className="text-xs text-muted-foreground">Average Rating</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-cyan-50 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-cyan-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.completedBookings}</p>
                  <p className="text-xs text-muted-foreground">Completed Bookings</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <Award className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.activeVendors}</p>
                  <p className="text-xs text-muted-foreground">Active Vendors</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts placeholder + Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        {stats?.categoryDistribution && stats.categoryDistribution.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Category Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.categoryDistribution.map((item) => {
                  const total = stats.categoryDistribution.reduce((s, i) => s + i.count, 0);
                  const pct = total > 0 ? (item.count / total) * 100 : 0;
                  return (
                    <div key={item.category}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-foreground">{item.category}</span>
                        <span className="text-muted-foreground">{item.count}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Monthly Revenue Trend */}
        {stats?.monthlyRevenueTrend && stats.monthlyRevenueTrend.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Monthly Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.monthlyRevenueTrend.map((item, idx) => {
                  const max = Math.max(...stats.monthlyRevenueTrend.map((i) => i.amount), 1);
                  const pct = (item.amount / max) * 100;
                  const prev = idx > 0 ? stats.monthlyRevenueTrend[idx - 1].amount : item.amount;
                  const trending = item.amount >= prev;
                  return (
                    <div key={item.month} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-16 shrink-0">{item.month}</span>
                      <div className="flex-1 h-4 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary/80 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex items-center gap-1 w-24 justify-end">
                        {trending ? (
                          <ArrowUp className="h-3 w-3 text-green-600" />
                        ) : (
                          <ArrowDown className="h-3 w-3 text-red-500" />
                        )}
                        <span className="text-xs font-medium text-foreground">{formatCurrency(item.amount)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Performance Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Vendor Performance Leaderboard</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {stats?.topVendors && stats.topVendors.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead className="hidden md:table-cell">Bookings</TableHead>
                    <TableHead className="hidden md:table-cell">Revenue</TableHead>
                    <TableHead className="text-right">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.topVendors.map((v, idx) => (
                    <TableRow key={v.vendorId} className={selectedVendorId === v.vendorId ? "bg-primary/5" : ""}>
                      <TableCell>
                        <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold ${
                          idx === 0 ? "bg-amber-100 text-amber-800" :
                          idx === 1 ? "bg-slate-100 text-slate-700" :
                          idx === 2 ? "bg-orange-100 text-orange-700" :
                          "bg-muted text-muted-foreground"
                        }`}>
                          {idx + 1}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium text-foreground">{v.vendorName}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          <span className="text-sm font-medium">{v.rating.toFixed(1)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="text-sm text-foreground">{v.bookings}</span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="text-sm text-foreground">{formatCurrency(v.revenue)}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => loadPerformance(v.vendorId)}
                        >
                          {perfLoading && selectedVendorId === v.vendorId ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            "View"
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-10">
              <BarChart3 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No performance data available yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected vendor performance detail */}
      {performance && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">
              Performance Detail: {performance.vendorName}
              <span className="ml-2 text-xs text-muted-foreground">({performance.period})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">Total Bookings</p>
                <p className="text-lg font-bold text-foreground">{performance.totalBookings}</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">Completion Rate</p>
                <p className="text-lg font-bold text-foreground">{formatPercent(performance.completionRate)}</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">Avg Rating</p>
                <p className="text-lg font-bold text-foreground">{performance.avgRating.toFixed(1)}</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">Total Revenue</p>
                <p className="text-lg font-bold text-foreground">{formatCurrency(performance.totalRevenue)}</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">Avg Response Time</p>
                <p className="text-lg font-bold text-foreground">{performance.avgResponseTime} min</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">On-Time Rate</p>
                <p className="text-lg font-bold text-foreground">{formatPercent(performance.onTimeRate)}</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">Repeat Customer Rate</p>
                <p className="text-lg font-bold text-foreground">{formatPercent(performance.repeatCustomerRate)}</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">SLA Compliance</p>
                <p className="text-lg font-bold text-foreground">{formatPercent(performance.slaCompliance)}</p>
              </div>
            </div>

            {/* Monthly Trend */}
            {performance.monthlyTrend && performance.monthlyTrend.length > 0 && (
              <div className="mt-6">
                <p className="text-sm font-semibold text-foreground mb-3">Monthly Trend</p>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Month</TableHead>
                        <TableHead>Bookings</TableHead>
                        <TableHead>Revenue</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Completion</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {performance.monthlyTrend.map((m) => (
                        <TableRow key={m.month}>
                          <TableCell className="text-sm text-foreground">{m.month}</TableCell>
                          <TableCell className="text-sm text-foreground">{m.bookings}</TableCell>
                          <TableCell className="text-sm text-foreground">{formatCurrency(m.revenue)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                              <span className="text-sm">{m.rating.toFixed(1)}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-foreground">{formatPercent(m.completionRate)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
