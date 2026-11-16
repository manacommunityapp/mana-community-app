import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  Dumbbell, Search, Clock, Flame, ChevronDown, Check, ArrowLeft, Plus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { wellnessService } from '../../../services/wellness/wellnessService';
import type { ExerciseCatalogItem, WorkoutLogDto, ExerciseCategory } from '../../../types/wellness';

const CATEGORIES: { value: ExerciseCategory | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'CARDIO', label: 'Cardio' },
  { value: 'STRENGTH', label: 'Strength' },
  { value: 'HIIT', label: 'HIIT' },
  { value: 'YOGA', label: 'Yoga' },
  { value: 'SPORTS', label: 'Sports' },
  { value: 'FLEXIBILITY', label: 'Flexibility' },
];

const CATEGORY_COLORS: Record<string, string> = {
  CARDIO: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
  STRENGTH: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  HIIT: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
  YOGA: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
  SPORTS: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
  FLEXIBILITY: 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300',
  BALANCE: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
};

export default function WorkoutLogger() {
  const navigate = useNavigate();
  const [exercises, setExercises] = useState<ExerciseCatalogItem[]>([]);
  const [filtered, setFiltered] = useState<ExerciseCatalogItem[]>([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<ExerciseCategory | 'ALL'>('ALL');
  const [selected, setSelected] = useState<ExerciseCatalogItem | null>(null);
  const [form, setForm] = useState({ durationMin: '', sets: '', repsPerSet: '', weightKg: '', distanceKm: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [estimatedCal, setEstimatedCal] = useState(0);

  useEffect(() => {
    wellnessService.searchExercises().then(setExercises).catch(() => {});
  }, []);

  useEffect(() => {
    let list = exercises;
    if (category !== 'ALL') list = list.filter(e => e.category === category);
    if (query.trim()) list = list.filter(e =>
      e.name.toLowerCase().includes(query.toLowerCase()) ||
      (e.nameLocal && e.nameLocal.includes(query))
    );
    setFiltered(list);
  }, [exercises, query, category]);

  useEffect(() => {
    if (!selected || !form.durationMin) { setEstimatedCal(0); return; }
    const cal = Math.round(selected.metValue * 70 * (parseInt(form.durationMin) / 60));
    setEstimatedCal(isNaN(cal) ? 0 : cal);
  }, [selected, form.durationMin]);

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const dto: WorkoutLogDto = {
        exerciseCatalogId: selected.id,
        exerciseName: selected.name,
        workoutDate: new Date().toISOString().split('T')[0],
        durationMin: form.durationMin ? parseInt(form.durationMin) : undefined,
        sets: form.sets ? parseInt(form.sets) : undefined,
        repsPerSet: form.repsPerSet ? parseInt(form.repsPerSet) : undefined,
        weightKg: form.weightKg ? parseFloat(form.weightKg) : undefined,
        distanceKm: form.distanceKm ? parseFloat(form.distanceKm) : undefined,
        notes: form.notes || undefined,
        source: 'MANUAL',
      };
      await wellnessService.logWorkout(dto);
      setSaved(true);
      setTimeout(() => navigate('/wellness'), 1200);
    } catch (e) {
      console.error('Failed to log workout', e);
    } finally {
      setSaving(false);
    }
  };

  if (saved) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
          <Check className="h-8 w-8 text-emerald-600" />
        </div>
        <p className="text-lg font-semibold">Workout logged!</p>
        <p className="text-sm text-muted-foreground">Redirecting to dashboard…</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/wellness')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-emerald-600" /> Log Workout
          </h1>
          <p className="text-sm text-muted-foreground">Pick an exercise and fill in your session details</p>
        </div>
      </div>

      {!selected ? (
        <>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search exercises (e.g. Running, Push-ups, योग)…"
              className="pl-9"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>

          {/* Category filters */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {CATEGORIES.map(c => (
              <Button
                key={c.value}
                variant={category === c.value ? 'default' : 'outline'}
                size="sm"
                className="shrink-0"
                onClick={() => setCategory(c.value)}
              >
                {c.label}
              </Button>
            ))}
          </div>

          {/* Exercise list */}
          <div className="space-y-2">
            {filtered.map(ex => (
              <Card
                key={ex.id}
                className="cursor-pointer hover:border-emerald-400 transition-colors"
                onClick={() => setSelected(ex)}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center shrink-0">
                      <Dumbbell className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{ex.name}</p>
                      {ex.nameLocal && <p className="text-xs text-muted-foreground">{ex.nameLocal}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <Badge variant="secondary" className={`text-[10px] ${CATEGORY_COLORS[ex.category] ?? ''}`}>
                      {ex.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground">MET {ex.metValue}</span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground rotate-[-90deg]" />
                  </div>
                </CardContent>
              </Card>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-10 text-muted-foreground">
                <Dumbbell className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No exercises found</p>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Selected exercise + form */}
          <Card className="border-emerald-400">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Dumbbell className="h-4 w-4 text-emerald-600" />
                  {selected.name}
                  {selected.nameLocal && <span className="text-muted-foreground font-normal">· {selected.nameLocal}</span>}
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>Change</Button>
              </div>
              <Badge variant="secondary" className={`w-fit text-[10px] ${CATEGORY_COLORS[selected.category] ?? ''}`}>
                {selected.category}
              </Badge>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                <Clock className="h-3 w-3" /> Duration (min)
              </label>
              <Input
                type="number"
                placeholder="30"
                value={form.durationMin}
                onChange={e => setForm(f => ({ ...f, durationMin: e.target.value }))}
              />
            </div>
            {(selected.category === 'STRENGTH') && (
              <>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Sets</label>
                  <Input type="number" placeholder="3" value={form.sets} onChange={e => setForm(f => ({ ...f, sets: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Reps / Set</label>
                  <Input type="number" placeholder="12" value={form.repsPerSet} onChange={e => setForm(f => ({ ...f, repsPerSet: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Weight (kg)</label>
                  <Input type="number" placeholder="20" value={form.weightKg} onChange={e => setForm(f => ({ ...f, weightKg: e.target.value }))} />
                </div>
              </>
            )}
            {(selected.category === 'CARDIO' || selected.category === 'SPORTS') && (
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Distance (km)</label>
                <Input type="number" placeholder="5" value={form.distanceKm} onChange={e => setForm(f => ({ ...f, distanceKm: e.target.value }))} />
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Notes (optional)</label>
            <Input placeholder="Felt great, PB on squat…" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>

          {estimatedCal > 0 && (
            <div className="flex items-center gap-2 p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
                Est. {estimatedCal} kcal burned
              </span>
              <span className="text-xs text-muted-foreground">(MET × 70 kg × time)</span>
            </div>
          )}

          <Button
            className="w-full gap-2"
            onClick={handleSave}
            disabled={saving || !form.durationMin}
          >
            <Plus className="h-4 w-4" />
            {saving ? 'Saving…' : 'Log Workout'}
          </Button>
        </>
      )}
    </div>
  );
}
