import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  UtensilsCrossed, ChefHat, ShoppingCart, Package, BookOpen,
  PartyPopper, TrendingUp, ArrowRight, Star, Clock, Flame,
  Apple, Beef, Wheat, Droplets, Calendar
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { Skeleton } from "../ui/skeleton";
import type { FoodDashboardStats, FoodOrder, FoodRestaurant } from "../../../types/food";

const mockStats: FoodDashboardStats = {
  totalRestaurants: 24, totalHomeChefs: 18, totalOrders: 156,
  totalRevenue: 284500, activeSubscriptions: 42, totalRecipes: 320,
  activeEvents: 5, totalDeliveryPartners: 12,
};

const mockRecentOrders: Partial<FoodOrder>[] = [
  { id: 1, orderNumber: "ORD-1042", providerName: "Spice Garden", totalAmount: 450, status: "DELIVERED", placedAt: "2026-07-24T10:30:00Z", items: [{ id: 1, itemId: 1, itemName: "Butter Chicken", quantity: 1, unitPrice: 280, totalPrice: 280, isVeg: false }, { id: 2, itemId: 2, itemName: "Naan", quantity: 2, unitPrice: 40, totalPrice: 80, isVeg: true }] },
  { id: 2, orderNumber: "ORD-1041", providerName: "Green Bowl", totalAmount: 320, status: "PREPARING", placedAt: "2026-07-24T09:15:00Z", items: [{ id: 3, itemId: 3, itemName: "Quinoa Salad", quantity: 1, unitPrice: 320, totalPrice: 320, isVeg: true }] },
  { id: 3, orderNumber: "ORD-1040", providerName: "Desi Bites", totalAmount: 680, status: "OUT_FOR_DELIVERY", placedAt: "2026-07-24T08:00:00Z", items: [{ id: 4, itemId: 4, itemName: "Thali Special", quantity: 2, unitPrice: 340, totalPrice: 680, isVeg: true }] },
  { id: 4, orderNumber: "ORD-1039", providerName: "Pizza Hub", totalAmount: 550, status: "DELIVERED", placedAt: "2026-07-23T19:30:00Z", items: [{ id: 5, itemId: 5, itemName: "Margherita Pizza", quantity: 1, unitPrice: 350, totalPrice: 350, isVeg: true }] },
];

const mockTrendingRestaurants: Partial<FoodRestaurant>[] = [
  { id: 1, name: "Spice Garden", cuisineTypes: "North Indian, Mughlai", rating: 4.5, totalRatings: 230, avgDeliveryTime: 35, coverImageUrl: "", featured: true },
  { id: 2, name: "Sushi Station", cuisineTypes: "Japanese, Asian", rating: 4.7, totalRatings: 180, avgDeliveryTime: 40, coverImageUrl: "", featured: true },
  { id: 3, name: "Green Bowl", cuisineTypes: "Healthy, Salads", rating: 4.3, totalRatings: 145, avgDeliveryTime: 25, coverImageUrl: "", featured: false },
  { id: 4, name: "Desi Bites", cuisineTypes: "South Indian, Street Food", rating: 4.6, totalRatings: 310, avgDeliveryTime: 30, coverImageUrl: "", featured: true },
];

const statusColors: Record<string, string> = {
  PLACED: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  CONFIRMED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  PREPARING: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  READY: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  OUT_FOR_DELIVERY: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  DELIVERED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

function formatPrice(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

export function FoodDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<FoodDashboardStats | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setStats(mockStats);
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const statCards = [
    { label: "Restaurants", value: stats?.totalRestaurants ?? 0, icon: UtensilsCrossed, color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-950/30" },
    { label: "Home Chefs", value: stats?.totalHomeChefs ?? 0, icon: ChefHat, color: "text-pink-600", bg: "bg-pink-50 dark:bg-pink-950/30" },
    { label: "Active Orders", value: stats?.totalOrders ?? 0, icon: ShoppingCart, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
    { label: "Subscriptions", value: stats?.activeSubscriptions ?? 0, icon: Package, color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-950/30" },
    { label: "Recipes", value: stats?.totalRecipes ?? 0, icon: BookOpen, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
    { label: "Events", value: stats?.activeEvents ?? 0, icon: PartyPopper, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30" },
  ];

  const quickActions = [
    { label: "Order Food", icon: ShoppingCart, path: "/food/restaurants", color: "bg-orange-600 hover:bg-orange-700" },
    { label: "Reserve Table", icon: Calendar, path: "/food/dining", color: "bg-blue-600 hover:bg-blue-700" },
    { label: "Browse Recipes", icon: BookOpen, path: "/food/recipes", color: "bg-emerald-600 hover:bg-emerald-700" },
    { label: "Plan Meals", icon: Apple, path: "/food/nutrition", color: "bg-violet-600 hover:bg-violet-700" },
    { label: "Manage Pantry", icon: Package, path: "/food/pantry", color: "bg-pink-600 hover:bg-pink-700" },
  ];

  const nutritionToday = { calories: { current: 1420, goal: 2000 }, protein: { current: 65, goal: 100 }, carbs: { current: 180, goal: 250 }, fat: { current: 45, goal: 65 } };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 rounded-xl lg:col-span-2" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center mb-3`}>
                  <Icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{s.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {quickActions.map((a) => {
              const Icon = a.icon;
              return (
                <Button key={a.label} onClick={() => navigate(a.path)} className={`${a.color} text-white gap-2`}>
                  <Icon className="w-4 h-4" />
                  {a.label}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <Card className="border-0 shadow-sm lg:col-span-2">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Recent Orders</CardTitle>
              <CardDescription>Your latest food orders</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/food/orders")} className="text-orange-600 dark:text-orange-400">
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockRecentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold truncate">{order.providerName}</p>
                    <Badge variant="secondary" className={`text-[10px] ${statusColors[order.status ?? "PLACED"]}`}>
                      {order.status?.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {order.orderNumber} - {order.items?.map((i) => i.itemName).join(", ")}
                  </p>
                </div>
                <p className="text-sm font-bold ml-4">{formatPrice(order.totalAmount ?? 0)}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Nutrition Summary */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500" />
              Today's Nutrition
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Calories", icon: Flame, current: nutritionToday.calories.current, goal: nutritionToday.calories.goal, unit: "kcal", color: "bg-orange-500" },
              { label: "Protein", icon: Beef, current: nutritionToday.protein.current, goal: nutritionToday.protein.goal, unit: "g", color: "bg-red-500" },
              { label: "Carbs", icon: Wheat, current: nutritionToday.carbs.current, goal: nutritionToday.carbs.goal, unit: "g", color: "bg-amber-500" },
              { label: "Fat", icon: Droplets, current: nutritionToday.fat.current, goal: nutritionToday.fat.goal, unit: "g", color: "bg-blue-500" },
            ].map((n) => {
              const Icon = n.icon;
              const pct = Math.min(100, Math.round((n.current / n.goal) * 100));
              return (
                <div key={n.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium flex items-center gap-1.5">
                      <Icon className="w-3.5 h-3.5" />
                      {n.label}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {n.current} / {n.goal} {n.unit}
                    </span>
                  </div>
                  <Progress value={pct} className="h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Trending Restaurants */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-500" />
              Trending Restaurants
            </CardTitle>
            <CardDescription>Popular in your community</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate("/food/restaurants")} className="text-orange-600 dark:text-orange-400">
            View All <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {mockTrendingRestaurants.map((r) => (
              <div key={r.id} className="group cursor-pointer rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-md transition-all" onClick={() => navigate(`/food/restaurants/${r.id}`)}>
                <div className="h-32 bg-gradient-to-br from-orange-100 to-pink-100 dark:from-orange-900/20 dark:to-pink-900/20 flex items-center justify-center">
                  <UtensilsCrossed className="w-10 h-10 text-orange-300 dark:text-orange-700" />
                </div>
                <div className="p-3">
                  <p className="font-semibold text-sm group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">{r.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{r.cuisineTypes}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-semibold">{r.rating}</span>
                      <span className="text-xs text-slate-400">({r.totalRatings})</span>
                    </div>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {r.avgDeliveryTime} min
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
