import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Target, Footprints, Clock, Dumbbell, ArrowLeft, Check, Flame, Trophy, Watch } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Progress } from '../ui/progress';
import { wellnessService } from '../../../services/wellness/wellnessService';
import type { ActivityGoalDto, FitnessStreakDto } from '../../../types/wellness';

export default function ActivityGoalSettings() {
  const navigate = useNavigate();
  const [goal, setGoal] = useState<ActivityGoalDto>({ dailyStepsTarget: 8000, activeMinutesTarget: 30, weeklyWorkoutsTarget: 4 });
  const [streak, setStreak] = useState<FitnessStreakDto | null>(null);
  const [form, setForm] = useState({ dailyStepsTarget: '', activeMinutesTarget: '', weeklyWorkoutsTarget: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    Promise.all([
      wellnessService.getActivityGoal(),
      wellnessService.getStreak(),
    ]).then(([g, s]) => {
      setGoal(g);
      setStreak(s);
      setForm({
        dailyStepsTarget: String(g.dailyStepsTarget ?? 8000),
        activeMinutesTarget: String(g.activeMinutesTarget ?? 30),
        weeklyWorkoutsTarget: String(g.weeklyWorkoutsTarget ?? 4),
      });
    }).catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await wellnessService.saveActivityGoal({
        dailyStepsTarget: parseInt(form.dailyStepsTarget) || 8000,
        activeMinutesTarget: parseInt(form.activeMinutesTarget) || 30,
        weeklyWorkoutsTarget: parseInt(form.weeklyWorkoutsTarget) || 4,
      });
      setGoal(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      console.error('Failed to save goal', e);
    } finally {
      setSaving(false);
    }
  };

  const weeklyPct = streak && goal.weeklyWorkoutsTarget
    ? Math.min(100, Math.round((streak.weeklyWorkoutsCompleted / (goal.weeklyWorkoutsTarget || 4)) * 100))
    : 0;

  return (
    <div className="space-y-5 max-w-xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/wellness')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Target className="h-5 w-5 text-emerald-600" /> Activity Goals
          </h1>
          <p className="text-sm text-muted-foreground">Set your fitness targets and track progress</p>
        </div>
      </div>

      {/* Streak card */}
      {streak && (
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 border-amber-200 dark:border-amber-800">
            <CardContent className="p-4 text-center">
              <Flame className="h-6 w-6 text-orange-500 mx-auto mb-1" />
              <p className="text-3xl font-bold text-orange-600">{streak.currentStreakDays}</p>
              <p className="text-xs text-muted-foreground">Day streak</p>
              {streak.longestStreakDays > 0 && (
                <p className="text-xs text-orange-500 mt-1">Best: {streak.longestStreakDays} days</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Trophy className="h-4 w-4 text-amber-500" />
                <p className="text-xs font-medium">This Week</p>
              </div>
              <div className="flex items-end gap-1 mb-2">
                <span className="text-2xl font-bold text-emerald-600">{streak.weeklyWorkoutsCompleted}</span>
                <span className="text-sm text-muted-foreground mb-0.5">/ {goal.weeklyWorkoutsTarget ?? 4}</span>
              </div>
              <Progress value={weeklyPct} className="h-1.5" />
              <p className="text-xs text-muted-foreground mt-1">workouts completed</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Today's steps */}
      {streak && (streak.todaySteps ?? 0) > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Footprints className="h-4 w-4 text-blue-500" />
              <p className="text-xs font-medium">Today's Steps</p>
            </div>
            <div className="flex items-end gap-1 mb-2">
              <span className="text-2xl font-bold text-blue-600">{(streak.todaySteps ?? 0).toLocaleString()}</span>
              <span className="text-sm text-muted-foreground mb-0.5">/ {(streak.stepGoal ?? 8000).toLocaleString()}</span>
            </div>
            <Progress value={Math.min(100, Math.round(((streak.todaySteps ?? 0) / (streak.stepGoal ?? 8000)) * 100))} className="h-1.5" />
          </CardContent>
        </Card>
      )}

      {/* Stats summary */}
      {streak && streak.totalActiveDays > 0 && (
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="text-center flex-1">
              <p className="text-xs text-muted-foreground">Total Active Days</p>
              <p className="text-2xl font-bold text-emerald-600">{streak.totalActiveDays}</p>
            </div>
            <div className="text-center flex-1">
              <p className="text-xs text-muted-foreground">Longest Streak</p>
              <p className="text-2xl font-bold text-amber-600">{streak.longestStreakDays}</p>
            </div>
            <div className="text-center flex-1">
              <p className="text-xs text-muted-foreground">This Week</p>
              <p className="text-2xl font-bold text-blue-600">{streak.weeklyWorkoutsCompleted}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Goal settings form */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Adjust Your Goals</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium flex items-center gap-1.5 mb-2">
              <Footprints className="h-4 w-4 text-blue-500" /> Daily Steps Target
            </label>
            <Input
              type="number"
              placeholder="8000"
              value={form.dailyStepsTarget}
              onChange={e => setForm(f => ({ ...f, dailyStepsTarget: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground mt-1">WHO recommends 8,000–10,000 steps/day</p>
          </div>
          <div>
            <label className="text-sm font-medium flex items-center gap-1.5 mb-2">
              <Clock className="h-4 w-4 text-green-500" /> Active Minutes / Day
            </label>
            <Input
              type="number"
              placeholder="30"
              value={form.activeMinutesTarget}
              onChange={e => setForm(f => ({ ...f, activeMinutesTarget: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground mt-1">WHO recommends 150 min/week (≈ 22 min/day)</p>
          </div>
          <div>
            <label className="text-sm font-medium flex items-center gap-1.5 mb-2">
              <Dumbbell className="h-4 w-4 text-purple-500" /> Weekly Workouts Target
            </label>
            <div className="flex gap-2">
              {[2, 3, 4, 5, 6].map(n => (
                <button
                  key={n}
                  onClick={() => setForm(f => ({ ...f, weeklyWorkoutsTarget: String(n) }))}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors border ${
                    form.weeklyWorkoutsTarget === String(n)
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-background text-foreground border-border hover:border-emerald-400'
                  }`}
                >
                  {n}x
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Aim for at least 3–4 sessions per week</p>
          </div>

          <Button className="w-full gap-2" onClick={handleSave} disabled={saving}>
            {saved ? (
              <><Check className="h-4 w-4" /> Goals saved!</>
            ) : saving ? 'Saving…' : (
              <><Target className="h-4 w-4" /> Save Goals</>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
