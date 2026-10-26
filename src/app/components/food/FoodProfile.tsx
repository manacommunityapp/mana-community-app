import { useState, useEffect } from "react";
import {
  User, Heart, AlertTriangle, Target, Wallet,
  Award, Edit, Save, X, ChefHat, Gauge,
  Star, AlertCircle
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
import { foodProfileService } from "../../../services/food/foodProfileService";
import { foodPaymentService } from "../../../services/food/foodPaymentService";
import { foodLoyaltyService } from "../../../services/food/foodLoyaltyService";
import type { ResidentFoodProfile, FoodProfileRequest, FoodWallet, LoyaltyMember } from "../../../types/food";

function formatPrice(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

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
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const [profile, setProfile] = useState<ResidentFoodProfile | null>(null);
  const [wallet, setWallet] = useState<FoodWallet | null>(null);
  const [loyalty, setLoyalty] = useState<LoyaltyMember | null>(null);

  // Form editable states
  const [dietType, setDietType] = useState<string>("VEGETARIAN");
  const [calorieGoal, setCalorieGoal] = useState<number>(2000);
  const [proteinGoal, setProteinGoal] = useState<number>(80);
  const [waterIntakeGoal, setWaterIntakeGoal] = useState<number>(8);
  const [weightGoal, setWeightGoal] = useState<number>(65);
  const [coffeeLimit, setCoffeeLimit] = useState<number>(2);
  const [healthGoal, setHealthGoal] = useState<string>("");
  const [fitnessGoal, setFitnessGoal] = useState<string>("");
  const [spiceLevel, setSpiceLevel] = useState([3]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [profRes, wallRes, loyRes] = await Promise.allSettled([
        foodProfileService.getProfile(),
        foodPaymentService.getWallet(),
        foodLoyaltyService.getMyInfo(),
      ]);

      if (profRes.status === "fulfilled" && profRes.value) {
        const p = profRes.value;
        setProfile(p);
        setDietType(p.dietType || "VEGETARIAN");
        setCalorieGoal(p.calorieGoal || 2000);
        setProteinGoal(p.proteinGoal || 80);
        setWaterIntakeGoal(p.waterIntakeGoal || 8);
        setWeightGoal(p.weightGoal || 65);
        setCoffeeLimit(p.coffeeLimit || 2);
        setHealthGoal(p.healthGoal || "");
        setFitnessGoal(p.fitnessGoal || "");
      }
      if (wallRes.status === "fulfilled" && wallRes.value) {
        setWallet(wallRes.value);
      }
      if (loyRes.status === "fulfilled" && loyRes.value) {
        setLoyalty(loyRes.value);
      }
    } catch (err) {
      console.error("Failed to load food profile data:", err);
      setError("Failed to load food profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const req: FoodProfileRequest = {
        dietType,
        calorieGoal,
        proteinGoal,
        waterIntakeGoal,
        weightGoal,
        coffeeLimit,
        healthGoal,
        fitnessGoal,
      };
      const updated = await foodProfileService.updateProfile(req);
      setProfile(updated);
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to update profile:", err);
      alert("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

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

  const currentTier = loyalty?.tier || "BRONZE";
  const points = loyalty?.pointsBalance || 0;

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-center gap-3 text-amber-700 dark:text-amber-300 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Profile Header */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shrink-0">
                <User className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-xl font-bold">My Food Profile</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">{dietType.replace(/_/g, " ")}</Badge>
                  {loyalty && (
                    <Badge className={`text-xs ${tierColors[currentTier] || "bg-slate-500"}`}>
                      <Award className="w-3 h-3 mr-1" />{currentTier}
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400">
                  {profile?.bmi ? <span>BMI: {profile.bmi}</span> : null}
                  {profile?.dailyNutritionScore ? <span>Nutrition Score: {profile.dailyNutritionScore}/100</span> : null}
                  {profile?.aiLifestyleScore ? <span>Lifestyle Score: {profile.aiLifestyleScore}/100</span> : null}
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
                {profile?.allergies && profile.allergies.length > 0 ? (
                  profile.allergies.map((allergy) => (
                    <div key={allergy.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <div>
                        <p className="text-sm font-medium">{allergy.allergyName}</p>
                        {allergy.notes && <p className="text-[10px] text-slate-400">{allergy.notes}</p>}
                      </div>
                      <Badge className={`text-[10px] ${severityColors[allergy.severity] || ""}`}>{allergy.severity}</Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 py-4 text-center">No allergies registered</p>
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
                  {profile?.cuisinePreferences && profile.cuisinePreferences.length > 0 ? (
                    profile.cuisinePreferences.map((cuisine) => (
                      <Badge key={cuisine} variant="secondary" className="text-xs px-3 py-1">
                        {cuisine}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 py-2">No cuisine preferences set</p>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Spice Level Preference</p>
                  <div className="flex items-center gap-3">
                    <Gauge className="w-4 h-4 text-red-500" />
                    <Slider value={spiceLevel} onValueChange={setSpiceLevel} max={5} step={1} className="flex-1" disabled={!isEditing} />
                    <span className="text-sm font-semibold w-12 text-right">{["Mild", "Light", "Medium", "Spicy", "Hot", "Fiery"][spiceLevel[0]]}</span>
                  </div>
                </div>
                {profile?.favoritesCount ? (
                  <div className="mt-4">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Favorites Saved</p>
                    <p className="text-lg font-bold flex items-center gap-2">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      {profile.favoritesCount} items
                    </p>
                  </div>
                ) : null}
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
                {profile?.mealTimings && profile.mealTimings.length > 0 ? (
                  profile.mealTimings.map((timing) => (
                    <div key={timing.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <div>
                        <p className="text-sm font-semibold">{timing.mealType}</p>
                        {timing.flexibilityMinutes ? <p className="text-xs text-slate-400">+/- {timing.flexibilityMinutes} min</p> : null}
                      </div>
                      <span className="text-sm font-bold">{timing.preferredTime}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 py-4 text-center">No custom meal timings configured</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="preferences" className="mt-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Dietary Preferences</CardTitle>
              <CardDescription>Update your food preferences and nutrition targets</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">Diet Type</Label>
                  <Select value={dietType} onValueChange={setDietType} disabled={!isEditing}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {dietTypes.map((d) => <SelectItem key={d} value={d}>{d.replace(/_/g, " ")}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Calorie Goal (kcal/day)</Label>
                  <Input type="number" value={calorieGoal} onChange={(e) => setCalorieGoal(Number(e.target.value))} disabled={!isEditing} className="text-sm" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Protein Goal (g/day)</Label>
                  <Input type="number" value={proteinGoal} onChange={(e) => setProteinGoal(Number(e.target.value))} disabled={!isEditing} className="text-sm" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Water Intake Goal (glasses/day)</Label>
                  <Input type="number" value={waterIntakeGoal} onChange={(e) => setWaterIntakeGoal(Number(e.target.value))} disabled={!isEditing} className="text-sm" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Target Weight (kg)</Label>
                  <Input type="number" value={weightGoal} onChange={(e) => setWeightGoal(Number(e.target.value))} disabled={!isEditing} className="text-sm" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Coffee Limit (cups/day)</Label>
                  <Input type="number" value={coffeeLimit} onChange={(e) => setCoffeeLimit(Number(e.target.value))} disabled={!isEditing} className="text-sm" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Health Goal</Label>
                <Input value={healthGoal} onChange={(e) => setHealthGoal(e.target.value)} disabled={!isEditing} className="text-sm" placeholder="e.g. Lose weight, maintain vitals..." />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Fitness Goal</Label>
                <Input value={fitnessGoal} onChange={(e) => setFitnessGoal(e.target.value)} disabled={!isEditing} className="text-sm" placeholder="e.g. Run 5K, increase stamina..." />
              </div>
              {isEditing && (
                <Button disabled={saving} className="bg-orange-600 hover:bg-orange-700 text-white gap-2" onClick={handleSaveProfile}>
                  <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Changes"}
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
                  <p className="text-3xl font-bold mt-1">{formatPrice(wallet?.balance ?? 0)}</p>
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
                      <p className="text-3xl font-bold mt-1">{points.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <Badge className={`${tierColors[currentTier] || "bg-slate-500"} text-xs`}>{currentTier}</Badge>
                      {loyalty?.lifetimePoints ? <p className="text-xs mt-1 opacity-80">Lifetime: {loyalty.lifetimePoints.toLocaleString()}</p> : null}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="goals" className="mt-4 space-y-4">
          {profile?.goals && profile.goals.length > 0 ? (
            profile.goals.map((goal) => {
              const progress = goal.targetValue > 0 ? Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100)) : 0;
              return (
                <Card key={goal.id} className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-orange-500" />
                        <span className="text-sm font-semibold">{goal.goalType}</span>
                        <Badge className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">{goal.status}</Badge>
                      </div>
                      {goal.targetDate && <span className="text-xs text-slate-400">Due: {new Date(goal.targetDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</span>}
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
            })
          ) : (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-8 text-center text-slate-400">
                <Target className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-medium">No nutrition goals set</p>
                <p className="text-xs mt-1">Configure your calorie and protein targets in the Preferences tab.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
