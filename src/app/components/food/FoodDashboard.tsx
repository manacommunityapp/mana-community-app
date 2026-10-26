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

import { foodAnalyticsService } from "../../../services/food/foodAnalyticsService";
import { foodOrderService } from "../../../services/food/foodOrderService";
import { foodRestaurantService } from "../../../services/food/foodRestaurantService";
import { foodNutritionService } from "../../../services/food/foodNutritionService";

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
  const [recentOrders, setRecentOrders] = useState<FoodOrder[]>([]);
  const [trendingRestaurants, setTrendingRestaurants] = useState<FoodRestaurant[]>([]);
  const [nutrition, setNutrition] = useState({
    calories: { current: 0, goal: 2000 },
    protein: { current: 0, goal: 100 },
    carbs: { current: 0, goal: 250 },
    fat: { current: 0, goal: 65 },
  });

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const todayStr = new Date().toISOString().slice(0, 10);
        const [statsRes, ordersRes, restRes, nutrRes] = await Promise.allSettled([
          foodAnalyticsService.getDashboardStats(),
          foodOrderService.getMyOrders(0, 5),
          foodRestaurantService.getFeaturedRestaurants(),
          foodNutritionService.getDailyNutrition(todayStr),
        ]);

        if (!isMounted) return;

        if (statsRes.status === "fulfilled" && statsRes.value) {
          setStats(statsRes.value);
        } else {
          setStats({
            totalRestaurants: 0,
            totalHomeChefs: 0,
            totalOrders: 0,
            totalRevenue: 0,
            activeSubscriptions: 0,
            totalRecipes: 0,
            activeEvents: 0,
            totalDeliveryPartners: 0,
          });
        }

        if (ordersRes.status === "fulfilled" && ordersRes.value) {
          const raw = ordersRes.value as any;
          const items = Array.isArray(raw) ? raw : (raw.content || raw.items || []);
          setRecentOrders(items);
        }

        if (restRes.status === "fulfilled" && restRes.value && (restRes.value as any[]).length > 0) {
          setTrendingRestaurants(restRes.value as FoodRestaurant[]);
        } else {
          // fallback to general restaurants list
          try {
            const listRes = await foodRestaurantService.getRestaurants(0, 4);
            if (isMounted && listRes) {
              const raw = listRes as any;
              setTrendingRestaurants(Array.isArray(raw) ? raw : (raw.content || raw.items || []));
            }
          } catch {
            // ignore
          }
        }

        if (nutrRes.status === "fulfilled" && nutrRes.value) {
          const n = nutrRes.value;
          setNutrition({
            calories: { current: n.totalCalories ?? 0, goal: n.calorieGoal ?? 2000 },
            protein: { current: n.totalProtein ?? 0, goal: n.proteinGoal ?? 100 },
            carbs: { current: n.totalCarbs ?? 0, goal: n.carbsGoal ?? 250 },
            fat: { current: n.totalFat ?? 0, goal: n.fatGoal ?? 65 },
          });
        }
      } catch (err) {
        console.error("Failed to load food dashboard data:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
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
            {recentOrders.length === 0 ? (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-40 text-orange-500" />
                <p className="text-sm font-medium">No recent orders found</p>
                <Button variant="outline" size="sm" className="mt-3 text-xs" onClick={() => navigate("/food/restaurants")}>
                  Browse Restaurants
                </Button>
              </div>
            ) : (
              recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold truncate">{order.providerName || "Restaurant Order"}</p>
                      <Badge variant="secondary" className={`text-[10px] ${statusColors[order.status ?? "PLACED"]}`}>
                        {order.status?.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      {order.orderNumber} {order.items && order.items.length > 0 ? ` - ${order.items.map((i) => i.itemName).join(", ")}` : ""}
                    </p>
                  </div>
                  <p className="text-sm font-bold ml-4">{formatPrice(order.totalAmount ?? 0)}</p>
                </div>
              ))
            )}
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
              { label: "Calories", icon: Flame, current: nutrition.calories.current, goal: nutrition.calories.goal, unit: "kcal", color: "bg-orange-500" },
              { label: "Protein", icon: Beef, current: nutrition.protein.current, goal: nutrition.protein.goal, unit: "g", color: "bg-red-500" },
              { label: "Carbs", icon: Wheat, current: nutrition.carbs.current, goal: nutrition.carbs.goal, unit: "g", color: "bg-amber-500" },
              { label: "Fat", icon: Droplets, current: nutrition.fat.current, goal: nutrition.fat.goal, unit: "g", color: "bg-blue-500" },
            ].map((n) => {
              const Icon = n.icon;
              const pct = n.goal > 0 ? Math.min(100, Math.round((n.current / n.goal) * 100)) : 0;
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
          {trendingRestaurants.length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              <UtensilsCrossed className="w-8 h-8 mx-auto mb-2 opacity-40 text-orange-500" />
              <p className="text-sm font-medium">No restaurants available in this community yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {trendingRestaurants.map((r) => (
                <div key={r.id} className="group cursor-pointer rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-md transition-all" onClick={() => navigate(`/food/restaurants/${r.id}`)}>
                  <div className="h-32 bg-gradient-to-br from-orange-100 to-pink-100 dark:from-orange-900/20 dark:to-pink-900/20 flex items-center justify-center">
                    <UtensilsCrossed className="w-10 h-10 text-orange-300 dark:text-orange-700" />
                  </div>
                  <div className="p-3">
                    <p className="font-semibold text-sm group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors truncate">{r.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{r.cuisineTypes || "Multi-Cuisine"}</p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-xs font-semibold">{r.rating ?? 0}</span>
                        {r.totalRatings != null && <span className="text-xs text-slate-400">({r.totalRatings})</span>}
                      </div>
                      {r.avgDeliveryTime != null && (
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {r.avgDeliveryTime} min
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
  );
}
