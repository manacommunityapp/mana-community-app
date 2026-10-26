import { useState, useEffect } from "react";
import {
  BarChart3, TrendingUp, ShoppingCart, IndianRupee, Users,
  ChefHat, Truck, Star, ArrowUpRight,
  Download, PieChart, Activity, AlertCircle, Utensils
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Skeleton } from "../ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { foodAnalyticsService } from "../../../services/food/foodAnalyticsService";
import { foodRestaurantService } from "../../../services/food/foodRestaurantService";
import type { FoodDashboardStats, ConsumptionTrend, FoodRestaurant } from "../../../types/food";

function formatPrice(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

export function FoodAnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState("this_month");
  const [activeTab, setActiveTab] = useState("overview");

  const [stats, setStats] = useState<FoodDashboardStats | null>(null);
  const [trends, setTrends] = useState<ConsumptionTrend[]>([]);
  const [restaurants, setRestaurants] = useState<FoodRestaurant[]>([]);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const [statsData, trendsData, restPage] = await Promise.allSettled([
          foodAnalyticsService.getDashboardStats(),
          foodAnalyticsService.getCommunityTrends(6),
          foodRestaurantService.getRestaurants(0, 10),
        ]);

        if (!isMounted) return;

        if (statsData.status === "fulfilled") {
          setStats(statsData.value);
        }
        if (trendsData.status === "fulfilled" && Array.isArray(trendsData.value)) {
          setTrends(trendsData.value);
        }
        if (restPage.status === "fulfilled" && restPage.value?.content) {
          setRestaurants(restPage.value.content);
        }
      } catch (err) {
        console.error("Failed to load food analytics:", err);
        if (isMounted) setError("Failed to load analytics. Please try again.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, [dateRange]);

  const statCards = [
    { label: "Total Orders", value: (stats?.totalOrders ?? 0).toLocaleString(), icon: ShoppingCart, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
    { label: "Total Revenue", value: formatPrice(stats?.totalRevenue ?? 0), icon: IndianRupee, color: "text-green-600", bg: "bg-green-50 dark:bg-green-950/30" },
    { label: "Active Restaurants", value: (stats?.totalRestaurants ?? 0).toString(), icon: ChefHat, color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-950/30" },
    { label: "Home Chefs", value: (stats?.totalHomeChefs ?? 0).toString(), icon: Users, color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-950/30" },
    { label: "Subscriptions", value: (stats?.activeSubscriptions ?? 0).toLocaleString(), icon: TrendingUp, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30" },
    { label: "Delivery Partners", value: (stats?.totalDeliveryPartners ?? 0).toLocaleString(), icon: Truck, color: "text-pink-600", bg: "bg-pink-50 dark:bg-pink-950/30" },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64 rounded-lg" />
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
    );
  }

  const maxRevenue = trends.length > 0 ? Math.max(...trends.map((t) => t.totalRevenue || 0), 1) : 1;
  const maxOrders = trends.length > 0 ? Math.max(...trends.map((t) => t.totalOrders || 0), 1) : 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Food Analytics</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Platform performance and live community insights</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="this_week">This Week</SelectItem>
              <SelectItem value="this_month">This Month</SelectItem>
              <SelectItem value="last_month">Last Month</SelectItem>
              <SelectItem value="this_quarter">This Quarter</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" /> Export
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-center gap-3 text-amber-700 dark:text-amber-300 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${s.color}`} />
                  </div>
                </div>
                <p className="text-xl font-bold">{s.value}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{s.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-100 dark:bg-slate-800">
          <TabsTrigger value="overview">Charts</TabsTrigger>
          <TabsTrigger value="restaurants">Active Restaurants ({restaurants.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Orders by Month - Bar Chart */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-500" /> Orders Trend
                </CardTitle>
                <CardDescription>Monthly order distribution</CardDescription>
              </CardHeader>
              <CardContent>
                {trends.length === 0 ? (
                  <div className="h-48 flex flex-col items-center justify-center text-slate-400 gap-2">
                    <BarChart3 className="w-8 h-8 stroke-1 text-slate-300" />
                    <p className="text-xs">No order trend data available</p>
                  </div>
                ) : (
                  <div className="flex items-end gap-3 h-48">
                    {trends.map((d) => {
                      const height = Math.max(((d.totalOrders || 0) / maxOrders) * 100, 6);
                      return (
                        <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-[10px] font-semibold">{d.totalOrders || 0}</span>
                          <div className="w-full rounded-t-md bg-blue-500 dark:bg-blue-400 transition-all hover:bg-blue-600" style={{ height: `${height}%` }} />
                          <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[48px]">{d.month}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Diet Preferences breakdown */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-pink-500" /> Veg / Non-Veg Breakdown
                </CardTitle>
                <CardDescription>Average preference across orders</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {trends.length === 0 ? (
                  <div className="h-48 flex flex-col items-center justify-center text-slate-400 gap-2">
                    <PieChart className="w-8 h-8 stroke-1 text-slate-300" />
                    <p className="text-xs">No consumption data recorded</p>
                  </div>
                ) : (
                  (() => {
                    const latest = trends[trends.length - 1];
                    const veg = latest.vegPct || 0;
                    const nonVeg = latest.nonVegPct || 0;
                    return (
                      <div className="space-y-4 pt-4">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium">Vegetarian</span>
                            <span className="text-xs text-slate-500">{veg}%</span>
                          </div>
                          <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div className="h-full bg-emerald-500 transition-all" style={{ width: `${veg}%` }} />
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium">Non-Vegetarian</span>
                            <span className="text-xs text-slate-500">{nonVeg}%</span>
                          </div>
                          <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div className="h-full bg-rose-500 transition-all" style={{ width: `${nonVeg}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })()
                )}
              </CardContent>
            </Card>

            {/* Revenue Trend */}
            <Card className="border-0 shadow-sm lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="w-4 h-4 text-green-500" /> Revenue Trend
                </CardTitle>
                <CardDescription>Monthly platform revenue</CardDescription>
              </CardHeader>
              <CardContent>
                {trends.length === 0 ? (
                  <div className="h-48 flex flex-col items-center justify-center text-slate-400 gap-2">
                    <Activity className="w-8 h-8 stroke-1 text-slate-300" />
                    <p className="text-xs">No revenue data available</p>
                  </div>
                ) : (
                  <div className="flex items-end gap-4 h-48">
                    {trends.map((m) => {
                      const height = Math.max(((m.totalRevenue || 0) / maxRevenue) * 100, 6);
                      return (
                        <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-[10px] font-semibold">{formatPrice(m.totalRevenue || 0)}</span>
                          <div className="w-full rounded-t-md bg-gradient-to-t from-green-500 to-emerald-400 dark:from-green-600 dark:to-emerald-500 transition-all hover:from-green-600 hover:to-emerald-500" style={{ height: `${height}%` }} />
                          <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[64px]">{m.month}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="restaurants" className="mt-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Community Restaurants & Kitchens</CardTitle>
              <CardDescription>Active food partners and cloud kitchens</CardDescription>
            </CardHeader>
            <CardContent>
              {restaurants.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2 text-center">
                  <Utensils className="w-10 h-10 stroke-1 text-slate-300" />
                  <p className="text-sm font-medium">No restaurants registered yet</p>
                  <p className="text-xs text-slate-400 max-w-sm">When community restaurants or home chefs onboard, their profiles and performance metrics will appear here.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Restaurant</TableHead>
                        <TableHead>Cuisine</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Rating</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {restaurants.map((r, idx) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-bold">{idx + 1}</TableCell>
                          <TableCell className="font-semibold">{r.name}</TableCell>
                          <TableCell><Badge variant="secondary" className="text-[10px]">{r.cuisineTypes || "General"}</Badge></TableCell>
                          <TableCell><Badge variant="outline" className="text-[10px]">{r.status}</Badge></TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              <span className="text-sm font-semibold">{r.rating ? r.rating.toFixed(1) : "—"}</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
