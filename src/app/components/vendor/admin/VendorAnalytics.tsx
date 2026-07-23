import { useState, useEffect } from "react";
import {
  Loader2,
  Star,
  TrendingUp,
  DollarSign,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import { vendorAnalyticsService } from "../../../../services/vendorService";
import { showError } from "../../../../utils/ToastUtils";
import type { VendorDashboardStats } from "../../../../types/api";

export function VendorAnalytics() {
  const [stats, setStats] = useState<VendorDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Leaderboard pagination (client-side)
  const [page, setPage] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await vendorAnalyticsService.getDashboardStats();
        setStats(data);
      } catch {
        showError("Failed to load analytics data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-muted-foreground">No analytics data available</p>
      </div>
    );
  }

  const topVendors = stats.topVendors ?? [];
  const totalPages = Math.max(1, Math.ceil(topVendors.length / pageSize));
  const paginatedVendors = topVendors.slice(page * pageSize, (page + 1) * pageSize);
  const categoryDistribution = stats.categoryDistribution ?? [];

  function formatCurrency(value: number): string {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Vendor Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Performance insights and vendor leaderboard
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Vendors</p>
                <p className="text-lg font-bold text-foreground">{stats.totalVendors}</p>
                <p className="text-xs text-muted-foreground">{stats.activeVendors} active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Bookings</p>
                <p className="text-lg font-bold text-foreground">{stats.totalBookings}</p>
                <p className="text-xs text-muted-foreground">{stats.completedBookings} completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Revenue</p>
                <p className="text-lg font-bold text-foreground">{formatCurrency(stats.totalRevenue)}</p>
                <p className="text-xs text-muted-foreground">{formatCurrency(stats.monthlyRevenue)} this month</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Star className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Avg Rating</p>
                <p className="text-lg font-bold text-foreground">{stats.avgRating?.toFixed(1) ?? "--"}</p>
                <p className="text-xs text-muted-foreground">{stats.openWorkOrders} open work orders</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Performance Leaderboard</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {topVendors.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground">No vendor performance data available</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead className="hidden md:table-cell">Bookings</TableHead>
                    <TableHead className="hidden lg:table-cell">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedVendors.map((v, idx) => (
                    <TableRow key={v.vendorId}>
                      <TableCell>
                        <span className="text-sm font-medium text-muted-foreground">
                          {page * pageSize + idx + 1}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                            {v.vendorName.charAt(0)}
                          </div>
                          <span className="text-sm font-medium text-foreground truncate max-w-[180px]">
                            {v.vendorName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          <span className="text-sm font-medium">{v.rating?.toFixed(1) ?? "--"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="text-sm text-foreground">{v.bookings}</span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <span className="text-sm font-medium text-foreground">
                          {formatCurrency(v.revenue)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Leaderboard pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page + 1} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page + 1 >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* Category distribution */}
      {categoryDistribution.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Category Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {categoryDistribution.map((cat) => {
                const total = categoryDistribution.reduce((s, c) => s + c.count, 0);
                const pct = total > 0 ? ((cat.count / total) * 100).toFixed(1) : "0";
                return (
                  <div
                    key={cat.category}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{cat.category}</p>
                      <p className="text-xs text-muted-foreground">{pct}% of vendors</p>
                    </div>
                    <Badge variant="secondary">{cat.count}</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
