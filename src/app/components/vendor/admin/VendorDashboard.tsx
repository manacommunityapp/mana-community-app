import { useState, useEffect } from "react";
import {
  Store,
  Calendar,
  Wrench,
  IndianRupee,
  Star,
  TrendingUp,
  Users,
  Clock,
  Loader2,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { vendorAnalyticsService } from "../../../../services/vendorService";
import { showError } from "../../../../utils/ToastUtils";
import type { VendorDashboardStats } from "../../../../types/api";
import { useNavigate } from "react-router";

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
  bg,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  bg: string;
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-5">
        <div className="flex items-center justify-between mb-3">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: bg }}>
            <Icon className="h-5 w-5" style={{ color }} />
          </div>
          {sub && (
            <span className="text-xs font-medium text-muted-foreground">{sub}</span>
          )}
        </div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-5">
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 rounded-xl bg-muted" />
                <div className="h-4 w-12 rounded bg-muted" />
              </div>
              <div className="h-7 w-16 rounded bg-muted mb-1" />
              <div className="h-3 w-24 rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

const ACTIVITY_TYPE_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  VENDOR_REGISTERED: { label: "New Vendor", variant: "default" },
  BOOKING_CREATED: { label: "Booking", variant: "secondary" },
  BOOKING_COMPLETED: { label: "Completed", variant: "outline" },
  PAYMENT_RECEIVED: { label: "Payment", variant: "default" },
  REVIEW_ADDED: { label: "Review", variant: "secondary" },
  WORK_ORDER_CREATED: { label: "Work Order", variant: "destructive" },
  CONTRACT_SIGNED: { label: "Contract", variant: "outline" },
};

export function VendorDashboard() {
  const [stats, setStats] = useState<VendorDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    try {
      const data = await vendorAnalyticsService.getDashboardStats();
      setStats(data);
    } catch (err) {
      showError("Failed to load dashboard stats");
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <DashboardSkeleton />;
  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-sm font-medium text-muted-foreground">Unable to load dashboard data</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={loadDashboard}>
          Retry
        </Button>
      </div>
    );
  }

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Vendor Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Overview of vendor operations and key metrics
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Store}        label="Total Vendors"      value={stats.totalVendors}      sub={`${stats.activeVendors} active`}            color="#6366f1" bg="#eef2ff" />
        <StatCard icon={Users}        label="Pending Vendors"    value={stats.pendingVendors}    sub="Awaiting approval"                           color="#f59e0b" bg="#fef3c7" />
        <StatCard icon={Calendar}     label="Total Bookings"     value={stats.totalBookings}     sub={`${stats.activeBookings} active`}            color="#06b6d4" bg="#ecfeff" />
        <StatCard icon={Wrench}       label="Open Work Orders"   value={stats.openWorkOrders}    sub="Requires attention"                          color="#ef4444" bg="#fef2f2" />
        <StatCard icon={IndianRupee}  label="Total Revenue"      value={formatCurrency(stats.totalRevenue)}  sub={`${formatCurrency(stats.monthlyRevenue)} this month`} color="#10b981" bg="#ecfdf5" />
        <StatCard icon={Star}         label="Average Rating"     value={stats.avgRating?.toFixed(1) ?? "N/A"} sub={`${stats.totalBookings} reviews`}   color="#f59e0b" bg="#fffbeb" />
        <StatCard icon={Clock}        label="Overdue Invoices"   value={stats.overdueInvoices}   sub="Needs follow-up"                             color="#ef4444" bg="#fef2f2" />
        <StatCard icon={TrendingUp}   label="Expiring Contracts" value={stats.expiringContracts} sub="Renewal needed"                              color="#8b5cf6" bg="#f5f3ff" />
      </div>

      {/* Bottom row: Recent activity + Top vendors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentActivity && stats.recentActivity.length > 0 ? (
              <div className="space-y-3">
                {stats.recentActivity.slice(0, 8).map((a) => {
                  const cfg = ACTIVITY_TYPE_LABELS[a.type] || { label: a.type, variant: "outline" as const };
                  return (
                    <div key={a.id} className="flex items-start gap-3 text-sm">
                      <Badge variant={cfg.variant} className="mt-0.5 shrink-0 text-[10px]">
                        {cfg.label}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground truncate">{a.message}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(a.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">No recent activity</p>
            )}
          </CardContent>
        </Card>

        {/* Top Vendors */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">Top Vendors</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate("/vendor-admin/analytics")}>
              View All <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent>
            {stats.topVendors && stats.topVendors.length > 0 ? (
              <div className="space-y-3">
                {stats.topVendors.slice(0, 6).map((v, idx) => (
                  <div key={v.vendorId} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-muted-foreground w-5 text-right">
                      #{idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{v.vendorName}</p>
                      <p className="text-xs text-muted-foreground">
                        {v.bookings} bookings &middot; {formatCurrency(v.revenue)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-sm font-medium text-amber-600">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      {v.rating.toFixed(1)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">No vendor data yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
