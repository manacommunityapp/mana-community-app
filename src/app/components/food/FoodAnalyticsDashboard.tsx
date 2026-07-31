import { useState, useEffect } from "react";
import {
  BarChart3, TrendingUp, ShoppingCart, IndianRupee, Users,
  ChefHat, Truck, Star, ArrowUpRight, ArrowDownRight,
  Calendar, Filter, Download, PieChart, Activity
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Skeleton } from "../ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Progress } from "../ui/progress";

function formatPrice(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

const mockOverviewStats = {
  totalOrders: { value: 1284, change: 12.5, trend: "up" },
  totalRevenue: { value: 1856400, change: 8.3, trend: "up" },
  activeVendors: { value: 42, change: 5.0, trend: "up" },
  deliverySuccessRate: { value: 97.2, change: -0.3, trend: "down" },
  avgOrderValue: { value: 445, change: 3.2, trend: "up" },
  activeUsers: { value: 856, change: 15.7, trend: "up" },
};

const mockOrdersByDay = [
  { day: "Mon", orders: 165, revenue: 73425 },
  { day: "Tue", orders: 142, revenue: 63190 },
  { day: "Wed", orders: 178, revenue: 79210 },
  { day: "Thu", orders: 195, revenue: 86775 },
  { day: "Fri", orders: 220, revenue: 97900 },
  { day: "Sat", orders: 248, revenue: 110360 },
  { day: "Sun", orders: 236, revenue: 105540 },
];

const mockCuisinePopularity = [
  { cuisine: "North Indian", orders: 385, pct: 30, color: "bg-orange-500" },
  { cuisine: "South Indian", orders: 257, pct: 20, color: "bg-amber-500" },
  { cuisine: "Chinese", orders: 193, pct: 15, color: "bg-red-500" },
  { cuisine: "Street Food", orders: 167, pct: 13, color: "bg-pink-500" },
  { cuisine: "Healthy/Salads", orders: 128, pct: 10, color: "bg-green-500" },
  { cuisine: "Italian", orders: 90, pct: 7, color: "bg-blue-500" },
  { cuisine: "Others", orders: 64, pct: 5, color: "bg-slate-400" },
];

const mockRevenueTrend = [
  { month: "Feb", revenue: 1120000 },
  { month: "Mar", revenue: 1345000 },
  { month: "Apr", revenue: 1280000 },
  { month: "May", revenue: 1490000 },
  { month: "Jun", revenue: 1680000 },
  { month: "Jul", revenue: 1856400 },
];

const mockTopRestaurants = [
  { rank: 1, name: "Spice Garden", orders: 245, revenue: 122500, rating: 4.5, cuisine: "North Indian" },
  { rank: 2, name: "The Biryani House", orders: 198, revenue: 138600, rating: 4.7, cuisine: "Hyderabadi" },
  { rank: 3, name: "South Spice", orders: 176, revenue: 70400, rating: 4.3, cuisine: "South Indian" },
  { rank: 4, name: "Green Bowl", orders: 152, revenue: 60800, rating: 4.4, cuisine: "Healthy" },
  { rank: 5, name: "Tandoori Nights", orders: 134, revenue: 100500, rating: 4.6, cuisine: "Tandoori" },
];

const mockTopChefs = [
  { rank: 1, name: "Priya's Kitchen", orders: 89, revenue: 35600, rating: 4.8, speciality: "Home-style Rajasthani" },
  { rank: 2, name: "Amma's Tiffin", orders: 76, revenue: 22800, rating: 4.7, speciality: "South Indian Breakfast" },
  { rank: 3, name: "Chef Arjun's Lab", orders: 62, revenue: 31000, rating: 4.6, speciality: "Fusion Indian" },
  { rank: 4, name: "Dadi Ka Zaika", orders: 54, revenue: 16200, rating: 4.9, speciality: "Traditional Punjabi" },
  { rank: 5, name: "Bengali Bites", orders: 48, revenue: 19200, rating: 4.5, speciality: "Bengali Cuisine" },
];

export function FoodAnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("this_month");
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const statCards = [
    { label: "Total Orders", value: mockOverviewStats.totalOrders.value.toLocaleString(), change: mockOverviewStats.totalOrders.change, trend: mockOverviewStats.totalOrders.trend, icon: ShoppingCart, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
    { label: "Total Revenue", value: formatPrice(mockOverviewStats.totalRevenue.value), change: mockOverviewStats.totalRevenue.change, trend: mockOverviewStats.totalRevenue.trend, icon: IndianRupee, color: "text-green-600", bg: "bg-green-50 dark:bg-green-950/30" },
    { label: "Active Vendors", value: mockOverviewStats.activeVendors.value.toString(), change: mockOverviewStats.activeVendors.change, trend: mockOverviewStats.activeVendors.trend, icon: ChefHat, color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-950/30" },
    { label: "Delivery Success", value: `${mockOverviewStats.deliverySuccessRate.value}%`, change: mockOverviewStats.deliverySuccessRate.change, trend: mockOverviewStats.deliverySuccessRate.trend, icon: Truck, color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-950/30" },
    { label: "Avg Order Value", value: formatPrice(mockOverviewStats.avgOrderValue.value), change: mockOverviewStats.avgOrderValue.change, trend: mockOverviewStats.avgOrderValue.trend, icon: TrendingUp, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30" },
    { label: "Active Users", value: mockOverviewStats.activeUsers.value.toLocaleString(), change: mockOverviewStats.activeUsers.change, trend: mockOverviewStats.activeUsers.trend, icon: Users, color: "text-pink-600", bg: "bg-pink-50 dark:bg-pink-950/30" },
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

  const maxOrders = Math.max(...mockOrdersByDay.map((d) => d.orders));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Food Analytics</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Platform performance and insights</p>
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

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((s) => {
          const Icon = s.icon;
          const isUp = s.trend === "up";
          return (
            <Card key={s.label} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${s.color}`} />
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-semibold ${isUp ? "text-green-600" : "text-red-500"}`}>
                    {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {Math.abs(s.change)}%
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
          <TabsTrigger value="restaurants">Top Restaurants</TabsTrigger>
          <TabsTrigger value="chefs">Top Home Chefs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Orders by Day - Bar Chart */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-500" /> Orders by Day
                </CardTitle>
                <CardDescription>Daily order distribution this week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-3 h-48">
                  {mockOrdersByDay.map((d) => {
                    const height = (d.orders / maxOrders) * 100;
                    return (
                      <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[10px] font-semibold">{d.orders}</span>
                        <div className="w-full rounded-t-md bg-blue-500 dark:bg-blue-400 transition-all hover:bg-blue-600" style={{ height: `${height}%` }} />
                        <span className="text-xs text-slate-500 dark:text-slate-400">{d.day}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Cuisine Popularity - Horizontal Bar / Pie representation */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-pink-500" /> Cuisine Popularity
                </CardTitle>
                <CardDescription>Order distribution by cuisine type</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {mockCuisinePopularity.map((c) => (
                  <div key={c.cuisine}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium">{c.cuisine}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{c.orders} orders ({c.pct}%)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div className={`h-full rounded-full ${c.color} transition-all`} style={{ width: `${c.pct}%` }} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Revenue Trend - Line Chart representation */}
            <Card className="border-0 shadow-sm lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="w-4 h-4 text-green-500" /> Revenue Trend
                </CardTitle>
                <CardDescription>Monthly revenue for the last 6 months</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-4 h-48">
                  {mockRevenueTrend.map((m, idx) => {
                    const maxRev = Math.max(...mockRevenueTrend.map((r) => r.revenue));
                    const height = (m.revenue / maxRev) * 100;
                    const prevHeight = idx > 0 ? (mockRevenueTrend[idx - 1].revenue / maxRev) * 100 : height;
                    return (
                      <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[10px] font-semibold">{formatPrice(m.revenue / 100000)}L</span>
                        <div className="w-full rounded-t-md bg-gradient-to-t from-green-500 to-emerald-400 dark:from-green-600 dark:to-emerald-500 transition-all hover:from-green-600 hover:to-emerald-500" style={{ height: `${height}%` }} />
                        <span className="text-xs text-slate-500 dark:text-slate-400">{m.month}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="restaurants" className="mt-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Top Performing Restaurants</CardTitle>
              <CardDescription>Ranked by total orders this month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Restaurant</TableHead>
                      <TableHead>Cuisine</TableHead>
                      <TableHead className="text-right">Orders</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Rating</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockTopRestaurants.map((r) => (
                      <TableRow key={r.rank}>
                        <TableCell className="font-bold">{r.rank}</TableCell>
                        <TableCell className="font-semibold">{r.name}</TableCell>
                        <TableCell><Badge variant="secondary" className="text-[10px]">{r.cuisine}</Badge></TableCell>
                        <TableCell className="text-right font-semibold">{r.orders}</TableCell>
                        <TableCell className="text-right font-semibold">{formatPrice(r.revenue)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span className="text-sm font-semibold">{r.rating}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chefs" className="mt-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Top Home Chefs</CardTitle>
              <CardDescription>Community's favorite home chefs this month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Chef/Kitchen</TableHead>
                      <TableHead>Speciality</TableHead>
                      <TableHead className="text-right">Orders</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Rating</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockTopChefs.map((c) => (
                      <TableRow key={c.rank}>
                        <TableCell className="font-bold">{c.rank}</TableCell>
                        <TableCell className="font-semibold">{c.name}</TableCell>
                        <TableCell><Badge variant="secondary" className="text-[10px]">{c.speciality}</Badge></TableCell>
                        <TableCell className="text-right font-semibold">{c.orders}</TableCell>
                        <TableCell className="text-right font-semibold">{formatPrice(c.revenue)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span className="text-sm font-semibold">{c.rating}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
