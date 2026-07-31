import { useState, useEffect } from "react";
import {
  Package, Calendar, Clock, Users, Check, Pause, XCircle,
  Sun, Coffee, Moon, Utensils, Star, ArrowRight, Zap, Play
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Skeleton } from "../ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import type { SubscriptionPlan, FoodSubscription } from "../../../types/food";

const mockPlans: Partial<SubscriptionPlan>[] = [
  { id: 1, name: "Healthy Breakfast Box", planType: "BREAKFAST", targetAudience: "Health Conscious", monthlyPrice: 3500, pricePerMeal: 150, minDays: 20, includesWeekends: false, active: true, description: "Start your day right with nutritious breakfast options" },
  { id: 2, name: "Office Lunch Plan", planType: "LUNCH", targetAudience: "Office Goers", monthlyPrice: 5000, pricePerMeal: 200, minDays: 22, includesWeekends: false, active: true, description: "Delicious lunch delivered to your office" },
  { id: 3, name: "Gym Protein Pack", planType: "LUNCH", targetAudience: "Gym & Fitness", monthlyPrice: 6000, pricePerMeal: 250, minDays: 26, includesWeekends: true, active: true, description: "High-protein meals for your fitness goals" },
  { id: 4, name: "Kids Tiffin Service", planType: "LUNCH", targetAudience: "Kids", monthlyPrice: 3000, pricePerMeal: 120, minDays: 22, includesWeekends: false, active: true, description: "Healthy, kid-friendly meals for school" },
  { id: 5, name: "Full Day Meal Plan", planType: "FULL_DAY", targetAudience: "Families", monthlyPrice: 12000, pricePerMeal: 400, minDays: 30, includesWeekends: true, active: true, description: "Complete meal solution for your family" },
  { id: 6, name: "Diet Dinner Plan", planType: "DINNER", targetAudience: "Diet & Weight Loss", monthlyPrice: 4500, pricePerMeal: 180, minDays: 25, includesWeekends: true, active: true, description: "Low-calorie dinner options for weight management" },
];

const mockSubscriptions: Partial<FoodSubscription>[] = [
  { id: 1, planId: 2, planName: "Office Lunch Plan", status: "ACTIVE", startDate: "2026-07-01", endDate: "2026-07-31", autoRenew: true, createdAt: "2026-06-28T10:00:00Z" },
  { id: 2, planId: 1, planName: "Healthy Breakfast Box", status: "PAUSED", startDate: "2026-07-01", endDate: "2026-07-31", autoRenew: false, createdAt: "2026-06-25T10:00:00Z" },
];

const mealTypeIcons: Record<string, typeof Sun> = { BREAKFAST: Coffee, LUNCH: Sun, DINNER: Moon, FULL_DAY: Utensils };
const audienceColors: Record<string, string> = {
  "Health Conscious": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  "Office Goers": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  "Gym & Fitness": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  "Kids": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  "Families": "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  "Diet & Weight Loss": "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
};

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  PAUSED: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  EXPIRED: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
};

function formatPrice(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

export function MealSubscriptions() {
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [audienceFilter, setAudienceFilter] = useState("all");
  const [subscribeDialog, setSubscribeDialog] = useState<Partial<SubscriptionPlan> | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const filteredPlans = mockPlans.filter((p) => {
    if (typeFilter !== "all" && p.planType !== typeFilter) return false;
    if (audienceFilter !== "all" && p.targetAudience !== audienceFilter) return false;
    return true;
  });

  // Mock calendar delivery days
  const deliveryDays = [1, 2, 3, 4, 7, 8, 9, 10, 11, 14, 15, 16, 17, 18, 21, 22, 23, 24, 25, 28, 29, 30, 31];

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48 rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Meal Subscriptions</h2>

      <Tabs defaultValue="plans">
        <TabsList>
          <TabsTrigger value="plans">Available Plans</TabsTrigger>
          <TabsTrigger value="my">My Subscriptions ({mockSubscriptions.length})</TabsTrigger>
          <TabsTrigger value="calendar">Delivery Calendar</TabsTrigger>
        </TabsList>

        {/* Available Plans */}
        <TabsContent value="plans" className="mt-4 space-y-4">
          <div className="flex flex-wrap gap-3">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Meal Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="BREAKFAST">Breakfast</SelectItem>
                <SelectItem value="LUNCH">Lunch</SelectItem>
                <SelectItem value="DINNER">Dinner</SelectItem>
                <SelectItem value="FULL_DAY">Full Day</SelectItem>
              </SelectContent>
            </Select>
            <Select value={audienceFilter} onValueChange={setAudienceFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Audience" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Audiences</SelectItem>
                <SelectItem value="Health Conscious">Health Conscious</SelectItem>
                <SelectItem value="Office Goers">Office Goers</SelectItem>
                <SelectItem value="Gym & Fitness">Gym & Fitness</SelectItem>
                <SelectItem value="Kids">Kids</SelectItem>
                <SelectItem value="Families">Families</SelectItem>
                <SelectItem value="Diet & Weight Loss">Diet & Weight Loss</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPlans.map((plan) => {
              const MealIcon = mealTypeIcons[plan.planType ?? "LUNCH"];
              return (
                <Card key={plan.id} className="border-0 shadow-sm hover:shadow-lg transition-all group">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-12 h-12 rounded-xl bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center">
                        <MealIcon className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                      </div>
                      <Badge className={`text-[10px] border-0 ${audienceColors[plan.targetAudience ?? ""]}`}>
                        {plan.targetAudience}
                      </Badge>
                    </div>
                    <h4 className="font-bold text-sm group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">{plan.name}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{plan.description}</p>
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">Monthly</span>
                        <span className="font-bold text-lg">{formatPrice(plan.monthlyPrice ?? 0)}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Per meal</span>
                        <span>{formatPrice(plan.pricePerMeal ?? 0)}</span>
                      </div>
                    </div>
                    <ul className="mt-4 space-y-1.5">
                      <li className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-green-600" /> {plan.minDays} meals per month
                      </li>
                      <li className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-green-600" /> {plan.includesWeekends ? "Weekends included" : "Weekdays only"}
                      </li>
                      <li className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-green-600" /> Flexible pause/cancel
                      </li>
                    </ul>
                    <Button className="w-full mt-4 bg-orange-600 hover:bg-orange-700 text-white" onClick={() => setSubscribeDialog(plan)}>
                      Subscribe Now
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* My Subscriptions */}
        <TabsContent value="my" className="mt-4 space-y-4">
          {mockSubscriptions.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No active subscriptions</p>
              <p className="text-sm mt-1">Browse plans to get started</p>
            </div>
          ) : (
            mockSubscriptions.map((sub) => (
              <Card key={sub.id} className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm">{sub.planName}</h4>
                        <Badge className={`text-[10px] border-0 ${statusColors[sub.status ?? "ACTIVE"]}`}>
                          {sub.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {sub.startDate} to {sub.endDate} | Auto-renew: {sub.autoRenew ? "Yes" : "No"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {sub.status === "ACTIVE" && (
                        <Button variant="outline" size="sm" className="text-amber-600 border-amber-200 gap-1">
                          <Pause className="w-3 h-3" /> Pause
                        </Button>
                      )}
                      {sub.status === "PAUSED" && (
                        <Button variant="outline" size="sm" className="text-green-600 border-green-200 gap-1">
                          <Play className="w-3 h-3" /> Resume
                        </Button>
                      )}
                      {sub.status !== "CANCELLED" && (
                        <Button variant="outline" size="sm" className="text-red-600 border-red-200 gap-1">
                          <XCircle className="w-3 h-3" /> Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Calendar */}
        <TabsContent value="calendar" className="mt-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">July 2026 - Delivery Schedule</CardTitle>
              <CardDescription>Days with scheduled meal deliveries</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                  <div key={d} className="text-center text-xs font-semibold text-slate-400 py-2">{d}</div>
                ))}
                {/* Offset for July 2026 (Wednesday) */}
                {Array.from({ length: 2 }).map((_, i) => <div key={`empty-${i}`} />)}
                {Array.from({ length: 31 }).map((_, i) => {
                  const day = i + 1;
                  const hasDelivery = deliveryDays.includes(day);
                  const isToday = day === 24;
                  return (
                    <div key={day} className={`text-center py-3 rounded-lg text-sm font-medium transition-colors ${isToday ? "bg-orange-600 text-white ring-2 ring-orange-300" : hasDelivery ? "bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400" : "text-slate-400 dark:text-slate-500"}`}>
                      {day}
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-orange-600" /> Today</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800" /> Delivery Day</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Subscribe Dialog */}
      <Dialog open={!!subscribeDialog} onOpenChange={() => setSubscribeDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Subscribe to {subscribeDialog?.name}</DialogTitle>
            <DialogDescription>{subscribeDialog?.description}</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <div className="flex justify-between text-sm"><span>Monthly Price</span><span className="font-bold">{formatPrice(subscribeDialog?.monthlyPrice ?? 0)}</span></div>
            <div className="flex justify-between text-sm"><span>Per Meal</span><span>{formatPrice(subscribeDialog?.pricePerMeal ?? 0)}</span></div>
            <div className="flex justify-between text-sm"><span>Meals</span><span>{subscribeDialog?.minDays} per month</span></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubscribeDialog(null)}>Cancel</Button>
            <Button className="bg-orange-600 hover:bg-orange-700 text-white" onClick={() => setSubscribeDialog(null)}>Confirm Subscription</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
