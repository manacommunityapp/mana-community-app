import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Flame, Droplets, Apple, Trophy, Users, Utensils,
  TrendingUp, Plus, Salad, Dumbbell, Heart
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { wellnessService } from '@/services/wellness/wellnessService';
import type { DailyNutritionSummaryDto, WellnessChallengeDto } from '@/types/wellness';

export default function WellnessDashboard() {
  const [summary, setSummary] = useState<DailyNutritionSummaryDto | null>(null);
  const [challenges, setChallenges] = useState<WellnessChallengeDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [s, c] = await Promise.all([
        wellnessService.getDailySummary(),
        wellnessService.getChallenges('ACTIVE'),
      ]);
      setSummary(s);
      setChallenges(c);
    } catch (e) {
      console.error('Failed to load wellness data', e);
    } finally {
      setLoading(false);
    }
  };

  const caloriePercent = summary ? Math.min(100, Math.round((summary.totalCalories / summary.calorieTarget) * 100)) : 0;
  const waterPercent = summary ? Math.min(100, Math.round((summary.totalWaterMl / summary.waterTargetMl) * 100)) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-500 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Heart className="h-6 w-6" /> Mana Health Buddy
            </h1>
            <p className="text-emerald-100 mt-1">Your AI-powered wellness companion</p>
          </div>
          <Link to="/wellness/log-meal">
            <Button variant="secondary" size="sm" className="gap-1">
              <Plus className="h-4 w-4" /> Log Meal
            </Button>
          </Link>
        </div>
      </div>

      {/* Calorie & Water Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" /> Today's Calories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-1">
              <span className="text-3xl font-bold">{summary?.totalCalories ?? 0}</span>
              <span className="text-muted-foreground text-sm mb-1">/ {summary?.calorieTarget ?? 2000} kcal</span>
            </div>
            <Progress value={caloriePercent} className="mt-3 h-2" />
            <div className="grid grid-cols-3 gap-2 mt-4 text-center">
              <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-2">
                <p className="text-xs text-muted-foreground">Protein</p>
                <p className="font-semibold text-blue-600">{summary?.totalProtein?.toFixed(0) ?? 0}g</p>
              </div>
              <div className="bg-amber-50 dark:bg-amber-950 rounded-lg p-2">
                <p className="text-xs text-muted-foreground">Carbs</p>
                <p className="font-semibold text-amber-600">{summary?.totalCarbs?.toFixed(0) ?? 0}g</p>
              </div>
              <div className="bg-rose-50 dark:bg-rose-950 rounded-lg p-2">
                <p className="text-xs text-muted-foreground">Fat</p>
                <p className="font-semibold text-rose-600">{summary?.totalFat?.toFixed(0) ?? 0}g</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Droplets className="h-4 w-4 text-blue-500" /> Water Intake
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-1">
              <span className="text-3xl font-bold">{((summary?.totalWaterMl ?? 0) / 1000).toFixed(1)}</span>
              <span className="text-muted-foreground text-sm mb-1">/ {((summary?.waterTargetMl ?? 2500) / 1000).toFixed(1)} L</span>
            </div>
            <Progress value={waterPercent} className="mt-3 h-2" />
            <div className="flex gap-2 mt-4">
              <Link to="/wellness/water" className="flex-1">
                <Button variant="outline" size="sm" className="w-full gap-1">
                  <Droplets className="h-3 w-3" /> Track Water
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Meals */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Utensils className="h-4 w-4 text-emerald-500" /> Today's Meals
            </CardTitle>
            <Link to="/wellness/food-journal">
              <Button variant="ghost" size="sm">View Journal</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {summary && summary.meals.length > 0 ? (
            <div className="space-y-3">
              {summary.meals.map((meal) => (
                <div key={meal.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                      <Apple className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{meal.mealType}</p>
                      <p className="text-xs text-muted-foreground">
                        {meal.items?.length ?? 0} items
                        {meal.sourceType?.startsWith('AI') && (
                          <Badge variant="secondary" className="ml-2 text-[10px] px-1 py-0">AI</Badge>
                        )}
                      </p>
                    </div>
                  </div>
                  <span className="font-semibold text-sm">{meal.totalCalories} kcal</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Salad className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No meals logged today</p>
              <Link to="/wellness/log-meal">
                <Button variant="outline" size="sm" className="mt-2">Log your first meal</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Challenges */}
      {challenges.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-500" /> Active Challenges
              </CardTitle>
              <Link to="/wellness/challenges">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {challenges.slice(0, 3).map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-950 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{c.title}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Users className="h-3 w-3" /> {c.participantCount} participants
                    </p>
                  </div>
                  <Badge>{c.challengeType}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { to: '/wellness/food-journal', icon: Utensils, label: 'Food Journal', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950' },
          { to: '/wellness/challenges', icon: Trophy, label: 'Challenges', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950' },
          { to: '/wellness/providers', icon: Dumbbell, label: 'Providers', color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950' },
          { to: '/wellness/profile', icon: TrendingUp, label: 'My Profile', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950' },
        ].map((item) => (
          <Link key={item.to} to={item.to}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4 flex flex-col items-center gap-2">
                <div className={`w-10 h-10 rounded-full ${item.bg} flex items-center justify-center`}>
                  <item.icon className={`h-5 w-5 ${item.color}`} />
                </div>
                <span className="text-xs font-medium">{item.label}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
