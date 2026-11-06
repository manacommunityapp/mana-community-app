import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Dumbbell, Flame, Clock, Trash2, ArrowLeft, Plus, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { wellnessService } from '../../../services/wellness/wellnessService';
import type { WorkoutLogDto } from '../../../types/wellness';

const CATEGORY_COLORS: Record<string, string> = {
  CARDIO: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
  STRENGTH: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  HIIT: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
  YOGA: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
  SPORTS: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
  FLEXIBILITY: 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300',
  BALANCE: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
};

function fmt(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function WorkoutHistory() {
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [workouts, setWorkouts] = useState<WorkoutLogDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    wellnessService.getWorkouts(date)
      .then(setWorkouts)
      .catch(() => setWorkouts([]))
      .finally(() => setLoading(false));
  }, [date]);

  const totalCalories = workouts.reduce((s, w) => s + (w.caloriesBurned ?? 0), 0);
  const totalMinutes = workouts.reduce((s, w) => s + (w.durationMin ?? 0), 0);

  const handleDelete = async (id: number) => {
    setDeleting(id);
    try {
      await wellnessService.deleteWorkout(id);
      setWorkouts(prev => prev.filter(w => w.id !== id));
    } catch (e) {
      console.error('Failed to delete workout', e);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/wellness')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-emerald-600" /> Workout History
          </h1>
        </div>
        <Button size="sm" className="gap-1" onClick={() => navigate('/wellness/log-workout')}>
          <Plus className="h-3 w-3" /> Log
        </Button>
      </div>

      {/* Date picker */}
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <input
          type="date"
          value={date}
          max={today}
          onChange={e => setDate(e.target.value)}
          className="text-sm border rounded-md px-3 py-1.5 bg-background text-foreground"
        />
        <span className="text-sm text-muted-foreground">{fmt(date)}</span>
      </div>

      {/* Stats row */}
      {workouts.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">Workouts</p>
              <p className="text-2xl font-bold text-emerald-600">{workouts.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">Calories</p>
              <p className="text-2xl font-bold text-orange-600">{totalCalories}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">Minutes</p>
              <p className="text-2xl font-bold text-blue-600">{totalMinutes}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Workout list */}
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-emerald-500" />
        </div>
      ) : workouts.length > 0 ? (
        <div className="space-y-3">
          {workouts.map(w => (
            <Card key={w.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center shrink-0">
                      <Dumbbell className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{w.exerciseName}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {w.exerciseCategory && (
                          <Badge variant="secondary" className={`text-[10px] ${CATEGORY_COLORS[w.exerciseCategory] ?? ''}`}>
                            {w.exerciseCategory}
                          </Badge>
                        )}
                        {w.durationMin && (
                          <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                            <Clock className="h-3 w-3" /> {w.durationMin} min
                          </span>
                        )}
                        {w.caloriesBurned != null && w.caloriesBurned > 0 && (
                          <span className="text-xs text-orange-600 flex items-center gap-0.5">
                            <Flame className="h-3 w-3" /> {w.caloriesBurned} kcal
                          </span>
                        )}
                        {w.sets && <span className="text-xs text-muted-foreground">{w.sets}×{w.repsPerSet}</span>}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive shrink-0"
                    disabled={deleting === w.id}
                    onClick={() => w.id && handleDelete(w.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {w.notes && <p className="text-xs text-muted-foreground mt-2 ml-13 pl-13">{w.notes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-14 text-muted-foreground">
          <Dumbbell className="h-12 w-12 mx-auto mb-3 opacity-25" />
          <p className="font-medium">No workouts logged</p>
          <p className="text-sm mt-1">Start your fitness journey today!</p>
          <Button className="mt-4 gap-1" onClick={() => navigate('/wellness/log-workout')}>
            <Plus className="h-4 w-4" /> Log First Workout
          </Button>
        </div>
      )}
    </div>
  );
}
