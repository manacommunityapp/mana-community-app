import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Plus, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { wellnessService } from '@/services/wellness/wellnessService';
import type { MealItemDto, MealType } from '@/types/wellness';

const MEAL_TYPES: { value: MealType; label: string; emoji: string }[] = [
  { value: 'BREAKFAST', label: 'Breakfast', emoji: '🌅' },
  { value: 'LUNCH', label: 'Lunch', emoji: '☀️' },
  { value: 'DINNER', label: 'Dinner', emoji: '🌙' },
  { value: 'SNACK', label: 'Snack', emoji: '🍪' },
];

export default function MealLogger() {
  const navigate = useNavigate();
  const [mealType, setMealType] = useState<MealType>('LUNCH');
  const [textInput, setTextInput] = useState('');
  const [items, setItems] = useState<MealItemDto[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleAnalyze = async () => {
    if (!textInput.trim()) return;
    setAnalyzing(true);
    try {
      // Client-side estimation for common Indian foods
      const words = textInput.toLowerCase().split(/[,\n]+/).map(w => w.trim()).filter(Boolean);
      const analyzed: MealItemDto[] = words.map(food => {
        const base = estimateNutrition(food);
        return { foodName: base.name, quantity: 1, unit: 'serving', ...base };
      });
      setItems(analyzed);
    } catch (e) {
      console.error(e);
    } finally {
      setAnalyzing(false);
    }
  };

  const estimateNutrition = (food: string): { name: string; calories: number; protein: number; carbs: number; fat: number } => {
    const db: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
      'idli': { calories: 65, protein: 2, carbs: 13, fat: 0.5 },
      'dosa': { calories: 168, protein: 4, carbs: 28, fat: 5 },
      'roti': { calories: 120, protein: 3.5, carbs: 20, fat: 3.5 },
      'rice': { calories: 200, protein: 4, carbs: 44, fat: 0.5 },
      'dal': { calories: 180, protein: 9, carbs: 24, fat: 5.5 },
      'sambar': { calories: 130, protein: 6.5, carbs: 18, fat: 3.5 },
      'chicken': { calories: 240, protein: 28, carbs: 0, fat: 14 },
      'biryani': { calories: 490, protein: 22, carbs: 55, fat: 18 },
      'paneer': { calories: 265, protein: 18, carbs: 4, fat: 20 },
      'chai': { calories: 100, protein: 3, carbs: 12, fat: 4 },
      'egg': { calories: 78, protein: 6, carbs: 0.6, fat: 5 },
      'salad': { calories: 50, protein: 2, carbs: 8, fat: 1 },
      'chapati': { calories: 120, protein: 3.5, carbs: 20, fat: 3.5 },
      'poha': { calories: 250, protein: 5.5, carbs: 40, fat: 7 },
      'upma': { calories: 210, protein: 5, carbs: 32, fat: 7 },
    };
    const key = Object.keys(db).find(k => food.includes(k));
    return key ? { name: food, ...db[key] } : { name: food, calories: 200, protein: 5, carbs: 30, fat: 8 };
  };

  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));

  const totals = items.reduce(
    (acc, item) => ({
      calories: acc.calories + (item.calories ?? 0),
      protein: acc.protein + (item.protein ?? 0),
      carbs: acc.carbs + (item.carbs ?? 0),
      fat: acc.fat + (item.fat ?? 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const handleSave = async () => {
    if (items.length === 0) return;
    setSaving(true);
    try {
      await wellnessService.logMeal({
        mealType,
        mealDate: new Date().toISOString().split('T')[0],
        sourceType: 'AI_TEXT',
        originalInput: textInput,
        totalCalories: totals.calories,
        totalProtein: totals.protein,
        totalCarbs: totals.carbs,
        totalFat: totals.fat,
        status: 'CONFIRMED',
        items,
      });
      navigate('/wellness/food-journal');
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold">Log a Meal</h1>

      {/* Meal Type */}
      <div className="flex gap-2 flex-wrap">
        {MEAL_TYPES.map((mt) => (
          <Button
            key={mt.value}
            variant={mealType === mt.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMealType(mt.value)}
          >
            {mt.emoji} {mt.label}
          </Button>
        ))}
      </div>

      {/* AI Text Input */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-500" /> Describe your meal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="e.g. 2 idli with sambar, 1 cup chai"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            rows={3}
          />
          <Button onClick={handleAnalyze} disabled={analyzing || !textInput.trim()} className="gap-1">
            <Sparkles className="h-4 w-4" />
            {analyzing ? 'Analyzing...' : 'Analyze with AI'}
          </Button>
        </CardContent>
      </Card>

      {/* Analyzed Items */}
      {items.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Detected Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm capitalize">{item.foodName}</p>
                    <p className="text-xs text-muted-foreground">
                      P: {item.protein}g · C: {item.carbs}g · F: {item.fat}g
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{item.calories} kcal</Badge>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeItem(idx)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="mt-4 pt-4 border-t flex items-center justify-between">
              <div className="text-sm">
                <span className="font-bold text-lg">{totals.calories}</span> kcal total
                <span className="text-muted-foreground ml-2">
                  P: {totals.protein}g · C: {totals.carbs}g · F: {totals.fat}g
                </span>
              </div>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Meal'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
