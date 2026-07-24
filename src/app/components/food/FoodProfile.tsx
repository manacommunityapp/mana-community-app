import { useState, useEffect } from "react";
import {
  User, Heart, AlertTriangle, Flame, Target, Wallet,
  Award, Edit, Save, X, ChefHat, Gauge, Droplets,
  Star, Shield
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Skeleton } from "../ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Label } from "../ui/label";
import { Slider } from "../ui/slider";
import { Progress } from "../ui/progress";
import type { ResidentFoodProfile, FoodAllergy, FoodWallet, LoyaltyMember } from "../../../types/food";

function formatPrice(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

const mockProfile: ResidentFoodProfile = {
  id: 1, userId: 1,
  dietType: "NON_VEGETARIAN",
  calorieGoal: 2000, proteinGoal: 100, weightGoal: 70,
  healthGoal: "Lose weight and build lean muscle",
  fitnessGoal: "Run 5K under 25 minutes",
  waterIntakeGoal: 8, coffeeLimit: 2,
  dailyNutritionScore: 82, aiLifestyleScore: 78, bmi: 23.4,
  allergies: [
    { id: 1, allergyName: "Peanuts", severity: "SEVERE", notes: "Carry EpiPen" },
    { id: 2, allergyName: "Shellfish", severity: "MODERATE" },
    { id: 3, allergyName: "Lactose", severity: "MILD", notes: "Can tolerate small amounts" },
  ],
  cuisinePreferences: ["North Indian", "South Indian", "Chinese", "Italian", "Japanese"],
  mealTimings: [
    { id: 1, mealType: "BREAKFAST", preferredTime: "08:00", flexibilityMinutes: 30 },
    { id: 2, mealType: "LUNCH", preferredTime: "13:00", flexibilityMinutes: 45 },
    { id: 3, mealType: "DINNER", preferredTime: "20:00", flexibilityMinutes: 30 },
  ],
  favoritesCount: 24,
  goals: [
    { id: 1, goalType: "Weight Loss", targetValue: 70, currentValue: 73.1, unit: "kg", startDate: "2026-07-01", targetDate: "2026-09-30", status: "ACTIVE" },
    { id: 2, goalType: "Daily Protein", targetValue: 100, currentValue: 65, unit: "g", startDate: "2026-07-01", targetDate: "2026-07-31", status: "ACTIVE" },
  ],
  createdAt: "2026-01-15T10:00:00Z",
  updatedAt: "2026-07-24T10:00:00Z",
};

const mockWallet: FoodWallet = { id: 1, userId: 1, balance: 2450 };

const mockLoyalty: LoyaltyMember = {
  id: 1, programId: 1, userId: 1,
  pointsBalance: 3200, lifetimePoints: 8500,
  tier: "GOLD", joinedAt: "2026-01-15T10:00:00Z",
};

const severityColors: Record<string, string> = {
  MILD: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  MODERATE: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  SEVERE: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const tierColors: Record<string, string> = {
  BRONZE: "bg-amber-700 text-white",
  SILVER: "bg-slate-400 text-white",
  GOLD: "bg-amber-500 text-white",
  PLATINUM: "bg-violet-600 text-white",
};

const dietTypes = ["VEGETARIAN", "NON_VEGETARIAN", "VEGAN", "JAIN", "HALAL", "EGGITARIAN", "GLUTEN_FREE", "LACTOSE_FREE"];

export function FoodProfile() {
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [spiceLevel, setSpiceLevel] = useState([3]);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 rounded-xl lg:col-span-2" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                <User className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-xl font-bold">My Food Profile</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">{mockProfile.dietType.replace(/_/g, " ")}</Badge>
                  <Badge className={`text-xs ${tierColors[mockLoyalty.tier]}`}>
                    <Award className="w-3 h-3 mr-1" />{mockLoyalty.tier}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>BMI: {mockProfile.bmi}</span>
                  <span>Nutrition Score: {mockProfile.dailyNutritionScore}/100</span>
                  <span>Lifestyle Score: {mockProfile.aiLifestyleScore}/100</span>
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setIsEditing(!isEditing)}>
              {isEditing ? <><X className="w-3 h-3" /> Cancel</> : <><Edit className="w-3 h-3" /> Edit Profile</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-100 dark:bg-slate-800">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Allergies */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" /> Allergies
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {mockProfile.allergies.map((allergy) => (
                  <div key={allergy.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <div>
                      <p className="text-sm font-medium">{allergy.allergyName}</p>
                      {allergy.notes && <p className="text-[10px] text-slate-400">{allergy.notes}</p>}
                    </div>
                    <Badge className={`text-[10px] ${severityColors[allergy.severity]}`}>{allergy.severity}</Badge>
                  </div>
                ))}
                {isEditing && (
                  <Button variant="outline" size="sm" className="w-full text-xs mt-2">+ Add Allergy</Button>
                )}
              </CardContent>
            </Card>

            {/* Favorite Cuisines */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Heart className="w-4 h-4 text-pink-500" /> Favorite Cuisines
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {mockProfile.cuisinePreferences.map((cuisine) => (
                    <Badge key={cuisine} variant="secondary" className="text-xs px-3 py-1">
                      {cuisine}
                      {isEditing && <X className="w-3 h-3 ml-1 cursor-pointer" />}
                    </Badge>
                  ))}
                  {isEditing && <Badge variant="outline" className="text-xs px-3 py-1 cursor-pointer">+ Add</Badge>}
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Spice Level Preference</p>
                  <div className="flex items-center gap-3">
                    <Gauge className="w-4 h-4 text-red-500" />
                    <Slider value={spiceLevel} onValueChange={setSpiceLevel} max={5} step={1} className="flex-1" disabled={!isEditing} />
                    <span className="text-sm font-semibold w-12 text-right">{["Mild", "Light", "Medium", "Spicy", "Hot", "Fiery"][spiceLevel[0]]}</span>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Favorites Saved</p>
                  <p className="text-lg font-bold flex items-center gap-2">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    {mockProfile.favoritesCount} items
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Meal Timings */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ChefHat className="w-4 h-4 text-violet-500" /> Meal Timings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {mockProfile.mealTimings.map((timing) => (
                  <div key={timing.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <div>
                      <p className="text-sm font-semibold">{timing.mealType}</p>
                      <p className="text-xs text-slate-400">+/- {timing.flexibilityMinutes} min</p>
                    </div>
                    {isEditing ? (
                      <Input type="time" defaultValue={timing.preferredTime} className="w-28 text-sm" />
                    ) : (
                      <span className="text-sm font-bold">{timing.preferredTime}</span>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="preferences" className="mt-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Dietary Preferences</CardTitle>
              <CardDescription>Update your food preferences and restrictions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">Diet Type</Label>
                  <Select defaultValue={mockProfile.dietType} disabled={!isEditing}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {dietTypes.map((d) => <SelectItem key={d} value={d}>{d.replace(/_/g, " ")}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Calorie Goal (kcal/day)</Label>
                  <Input type="number" defaultValue={mockProfile.calorieGoal} disabled={!isEditing} className="text-sm" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Protein Goal (g/day)</Label>
                  <Input type="number" defaultValue={mockProfile.proteinGoal} disabled={!isEditing} className="text-sm" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Water Intake Goal (glasses/day)</Label>
                  <Input type="number" defaultValue={mockProfile.waterIntakeGoal} disabled={!isEditing} className="text-sm" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Target Weight (kg)</Label>
                  <Input type="number" defaultValue={mockProfile.weightGoal} disabled={!isEditing} className="text-sm" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Coffee Limit (cups/day)</Label>
                  <Input type="number" defaultValue={mockProfile.coffeeLimit} disabled={!isEditing} className="text-sm" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Health Goal</Label>
                <Input defaultValue={mockProfile.healthGoal} disabled={!isEditing} className="text-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Fitness Goal</Label>
                <Input defaultValue={mockProfile.fitnessGoal} disabled={!isEditing} className="text-sm" />
              </div>
              {isEditing && (
                <Button className="bg-orange-600 hover:bg-orange-700 text-white gap-2" onClick={() => setIsEditing(false)}>
                  <Save className="w-4 h-4" /> Save Changes
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accounts" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Wallet */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-green-500" /> Food Wallet
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white mb-4">
                  <p className="text-xs opacity-80">Available Balance</p>
                  <p className="text-3xl font-bold mt-1">{formatPrice(mockWallet.balance)}</p>
                </div>
                <div className="flex gap-3">
                  <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700 text-white">Add Money</Button>
                  <Button variant="outline" size="sm" className="flex-1">Transaction History</Button>
                </div>
              </CardContent>
            </Card>

            {/* Loyalty */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" /> Loyalty Points
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs opacity-80">Points Balance</p>
                      <p className="text-3xl font-bold mt-1">{mockLoyalty.pointsBalance.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <Badge className={`${tierColors[mockLoyalty.tier]} text-xs`}>{mockLoyalty.tier}</Badge>
                      <p className="text-xs mt-1 opacity-80">Lifetime: {mockLoyalty.lifetimePoints.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">Next Tier: PLATINUM</span>
                    <span className="font-semibold">{mockLoyalty.pointsBalance}/5000 pts</span>
                  </div>
                  <Progress value={(mockLoyalty.pointsBalance / 5000) * 100} className="h-2" />
                </div>
                <Button variant="outline" size="sm" className="w-full mt-3">Redeem Points</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="goals" className="mt-4 space-y-4">
          {mockProfile.goals.map((goal) => {
            const progress = Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));
            return (
              <Card key={goal.id} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-orange-500" />
                      <span className="text-sm font-semibold">{goal.goalType}</span>
                      <Badge className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">{goal.status}</Badge>
                    </div>
                    <span className="text-xs text-slate-400">Due: {new Date(goal.targetDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">Current: <strong>{goal.currentValue} {goal.unit}</strong></span>
                    <span className="text-sm">Target: <strong>{goal.targetValue} {goal.unit}</strong></span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{progress}% complete</p>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
}
