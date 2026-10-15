import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Apple, ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { wellnessService } from '@/services/wellness/wellnessService';
import type { DailyNutritionSummaryDto } from '@/types/wellness';

export default function FoodJournal() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [summary, setSummary] = useState<DailyNutritionSummaryDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [date]);

  const loadData = async () => {
    setLoading(true);
    try {
      setSummary(await wellnessService.getDailySummary(date));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const changeDate = (offset: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + offset);
    setDate(d.toISOString().split('T')[0]);
  };

  const handleDelete = async (id: number) => {
    try {
      await wellnessService.deleteMeal(id);
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const macros = [
    { label: 'Protein', value: summary?.totalProtein ?? 0, color: 'bg-blue-500' },
    { label: 'Carbs', value: summary?.totalCarbs ?? 0, color: 'bg-amber-500' },
    { label: 'Fat', value: summary?.totalFat ?? 0, color: 'bg-rose-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Food Journal</h1>
        <Link to="/wellness/log-meal">
          <Button size="sm" className="gap-1">
            <Plus className="h-4 w-4" /> Log Meal
          </Button>
        </Link>
      </div>

      {/* Date Navigation */}
      <div className="flex items-center justify-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => changeDate(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="font-medium">{new Date(date + 'T00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
        <Button variant="ghost" size="icon" onClick={() => changeDate(1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500" />
        </div>
      ) : (
        <>
          {/* Daily Summary */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center mb-4">
                <span className="text-3xl font-bold">{summary?.totalCalories ?? 0}</span>
                <span className="text-muted-foreground"> / {summary?.calorieTarget ?? 2000} kcal</span>
              </div>
              <Progress value={Math.min(100, ((summary?.totalCalories ?? 0) / (summary?.calorieTarget ?? 2000)) * 100)} className="h-2 mb-4" />
              <div className="grid grid-cols-3 gap-3">
                {macros.map((m) => (
                  <div key={m.label} className="text-center">
                    <div className={`h-1.5 ${m.color} rounded-full mb-1`} style={{ width: `${Math.min(100, (Number(m.value) / 100) * 100)}%`, margin: '0 auto' }} />
                    <p className="text-xs text-muted-foreground">{m.label}</p>
                    <p className="font-semibold text-sm">{Number(m.value).toFixed(0)}g</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Meals */}
          <div className="space-y-3">
            {summary?.meals && summary.meals.length > 0 ? (
              summary.meals.map((meal) => (
                <Card key={meal.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Apple className="h-4 w-4 text-emerald-500" />
                        {meal.mealType}
                        {meal.sourceType?.startsWith('AI') && (
                          <Badge variant="secondary" className="text-[10px]">AI</Badge>
                        )}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{meal.totalCalories} kcal</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => meal.id && handleDelete(meal.id)}>
                          <Trash2 className="h-3 w-3 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {meal.items && meal.items.length > 0 && (
                      <div className="space-y-1">
                        {meal.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm py-1 border-b last:border-0 border-border/50">
                            <span className="text-muted-foreground">
                              {item.foodName}
                              {item.quantity && ` (${item.quantity} ${item.unit ?? ''})`}
                            </span>
                            <span className="font-medium">{item.calories} kcal</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>No meals logged for this date</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
