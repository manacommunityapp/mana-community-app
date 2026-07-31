import { useState, useEffect } from "react";
import {
  Flame, Beef, Wheat, Droplets, GlassWater, Weight, Calendar,
  Plus, Target, TrendingUp, Clock, Apple, User
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { Skeleton } from "../ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Input } from "../ui/input";
import type { DailyNutritionSummary, WeightLog, MealPlan, Nutritionist } from "../../../types/food";

function formatPrice(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

const mockNutrition: DailyNutritionSummary = {
  date: "2026-07-24",
  totalCalories: 1420,
  totalProtein: 65,
  totalCarbs: 180,
  totalFat: 45,
  totalFiber: 18,
  calorieGoal: 2000,
  proteinGoal: 100,
  mealBreakdown: [
    { mealType: "Breakfast", calories: 380, items: 3 },
    { mealType: "Lunch", calories: 620, items: 4 },
    { mealType: "Snack", calories: 180, items: 2 },
    { mealType: "Dinner", calories: 240, items: 1 },
  ],
};

const mockWaterIntake = { current: 5, goal: 8 };

const mockWeightLog: WeightLog[] = [
  { id: 1, date: "2026-07-18", weight: 74.2, unit: "KG", bodyFatPct: 22.1 },
  { id: 2, date: "2026-07-19", weight: 74.0, unit: "KG", bodyFatPct: 22.0 },
  { id: 3, date: "2026-07-20", weight: 73.8, unit: "KG", bodyFatPct: 21.8 },
  { id: 4, date: "2026-07-21", weight: 73.5, unit: "KG", bodyFatPct: 21.7 },
  { id: 5, date: "2026-07-22", weight: 73.7, unit: "KG", bodyFatPct: 21.9 },
  { id: 6, date: "2026-07-23", weight: 73.3, unit: "KG", bodyFatPct: 21.5 },
  { id: 7, date: "2026-07-24", weight: 73.1, unit: "KG", bodyFatPct: 21.4 },
];

const mockMealPlan: MealPlan = {
  id: 1, userId: 1, nutritionistId: 1, name: "Weight Loss Plan - Week 4",
  description: "High protein, moderate carb plan", startDate: "2026-07-01", endDate: "2026-07-31",
  goal: "Lose 2kg", dailyCalories: 2000, dailyProtein: 100, status: "ACTIVE",
  items: [
    { id: 1, dayOfWeek: 4, mealType: "Breakfast", itemName: "Masala Oats with Vegetables", calories: 280, protein: 12, carbs: 45, fat: 6, portionSize: "1 bowl" },
    { id: 2, dayOfWeek: 4, mealType: "Lunch", itemName: "Dal Tadka + Brown Rice + Raita", calories: 520, protein: 22, carbs: 68, fat: 14, portionSize: "1 plate" },
    { id: 3, dayOfWeek: 4, mealType: "Snack", itemName: "Sprouts Chaat + Green Tea", calories: 180, protein: 10, carbs: 22, fat: 4, portionSize: "1 cup" },
    { id: 4, dayOfWeek: 4, mealType: "Dinner", itemName: "Grilled Paneer Tikka + Salad", calories: 420, protein: 28, carbs: 18, fat: 24, portionSize: "6 pcs" },
  ],
  createdAt: "2026-07-01T00:00:00Z",
};

const mockNutritionists: Partial<Nutritionist>[] = [
  { id: 1, qualification: "M.Sc Nutrition", specialization: "Weight Management", experienceYears: 8, consultationFee: 800, rating: 4.8, profileImageUrl: "" },
  { id: 2, qualification: "PGDND", specialization: "Sports Nutrition", experienceYears: 5, consultationFee: 600, rating: 4.6, profileImageUrl: "" },
];

export function NutritionTracker() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [waterGlasses, setWaterGlasses] = useState(mockWaterIntake.current);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const macros = [
    { label: "Calories", icon: Flame, current: mockNutrition.totalCalories, goal: mockNutrition.calorieGoal, unit: "kcal", color: "bg-orange-500", textColor: "text-orange-600" },
    { label: "Protein", icon: Beef, current: mockNutrition.totalProtein, goal: mockNutrition.proteinGoal, unit: "g", color: "bg-red-500", textColor: "text-red-600" },
    { label: "Carbs", icon: Wheat, current: mockNutrition.totalCarbs, goal: 250, unit: "g", color: "bg-amber-500", textColor: "text-amber-600" },
    { label: "Fat", icon: Droplets, current: mockNutrition.totalFat, goal: 65, unit: "g", color: "bg-blue-500", textColor: "text-blue-600" },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Nutrition Tracker</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Track your daily nutrition and goals</p>
        </div>
        <Button className="bg-orange-600 hover:bg-orange-700 text-white gap-2">
          <Plus className="w-4 h-4" /> Log Meal
        </Button>
      </div>

      {/* Macro Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {macros.map((m) => {
          const Icon = m.icon;
          const pct = Math.min(100, Math.round((m.current / m.goal) * 100));
          return (
            <Card key={m.label} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <Icon className={`w-5 h-5 ${m.textColor}`} />
                  <span className="text-xs text-slate-500 dark:text-slate-400">{pct}%</span>
                </div>
                <p className="text-2xl font-bold">{m.current}<span className="text-sm font-normal text-slate-400 ml-1">{m.unit}</span></p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Goal: {m.goal} {m.unit}</p>
                <Progress value={pct} className="h-2 mt-2" />
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-100 dark:bg-slate-800">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="weight">Weight Log</TabsTrigger>
          <TabsTrigger value="mealplan">Meal Plan</TabsTrigger>
          <TabsTrigger value="consult">Consult</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Water Tracker */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <GlassWater className="w-4 h-4 text-blue-500" /> Water Intake
                </CardTitle>
                <CardDescription>{waterGlasses} of {mockWaterIntake.goal} glasses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 flex-wrap mb-4">
                  {Array.from({ length: mockWaterIntake.goal }).map((_, i) => (
                    <button key={i} onClick={() => setWaterGlasses(i + 1)}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                        i < waterGlasses
                          ? "bg-blue-500 text-white shadow-sm"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                      }`}>
                      <GlassWater className="w-4 h-4" />
                    </button>
                  ))}
                </div>
                <Progress value={(waterGlasses / mockWaterIntake.goal) * 100} className="h-2" />
              </CardContent>
            </Card>

            {/* Meal Breakdown */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Apple className="w-4 h-4 text-green-500" /> Meal Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {mockNutrition.mealBreakdown.map((meal) => {
                  const pct = Math.round((meal.calories / mockNutrition.calorieGoal) * 100);
                  return (
                    <div key={meal.mealType} className="flex items-center gap-3">
                      <span className="text-sm font-medium w-20">{meal.mealType}</span>
                      <div className="flex-1">
                        <Progress value={pct} className="h-2" />
                      </div>
                      <span className="text-sm font-semibold w-20 text-right">{meal.calories} kcal</span>
                      <Badge variant="secondary" className="text-[10px]">{meal.items} items</Badge>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="weight" className="mt-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Weight className="w-4 h-4 text-violet-500" /> Weight Log
                </CardTitle>
                <CardDescription>Last 7 days</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="gap-2"><Plus className="w-3 h-3" /> Log Weight</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {mockWeightLog.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="text-sm">{new Date(entry.date).toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-bold">{entry.weight} kg</span>
                      {entry.bodyFatPct && <Badge variant="secondary" className="text-[10px]">{entry.bodyFatPct}% BF</Badge>}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-4 rounded-lg bg-violet-50 dark:bg-violet-950/20 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">Weekly Change</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">From {mockWeightLog[0].weight} kg to {mockWeightLog[mockWeightLog.length - 1].weight} kg</p>
                </div>
                <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-bold">-{(mockWeightLog[0].weight - mockWeightLog[mockWeightLog.length - 1].weight).toFixed(1)} kg</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mealplan" className="mt-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">{mockMealPlan.name}</CardTitle>
                  <CardDescription>{mockMealPlan.description} - {mockMealPlan.dailyCalories} kcal/day</CardDescription>
                </div>
                <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">{mockMealPlan.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockMealPlan.items.map((item) => (
                <div key={item.id} className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="text-xs">{item.mealType}</Badge>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{item.portionSize}</span>
                  </div>
                  <p className="text-sm font-semibold">{item.itemName}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>{item.calories} kcal</span>
                    <span>P: {item.protein}g</span>
                    <span>C: {item.carbs}g</span>
                    <span>F: {item.fat}g</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="consult" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockNutritionists.map((n) => (
              <Card key={n.id} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
                      <User className="w-7 h-7 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{n.qualification}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{n.specialization}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-[10px]">{n.experienceYears} yrs exp</Badge>
                        <span className="text-xs font-semibold text-amber-600">{n.rating} rating</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold">{formatPrice(n.consultationFee ?? 0)}<span className="text-xs font-normal text-slate-400"> /session</span></span>
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                      <Clock className="w-3 h-3" /> Book Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
