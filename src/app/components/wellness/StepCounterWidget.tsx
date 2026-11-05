import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { Footprints, ArrowLeft, Plus, Flame } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Progress } from '../ui/progress';
import { wellnessService } from '../../../services/wellness/wellnessService';
import type { StepLogDto, ActivityGoalDto } from '../../../types/wellness';

const QUICK_ADD = [500, 1000, 2000, 5000];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
}

export default function StepCounterWidget() {
  const navigate = useNavigate();
  const [today, setToday] = useState<StepLogDto>({ stepCount: 0 });
  const [goal, setGoal] = useState<ActivityGoalDto>({ dailyStepsTarget: 8000 });
  const [week, setWeek] = useState<StepLogDto[]>([]);
  const [customSteps, setCustomSteps] = useState('');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0];
    const [t, g, w] = await Promise.all([
      wellnessService.getSteps(),
      wellnessService.getActivityGoal(),
      wellnessService.getStepsRange(weekAgo, todayStr),
    ]).catch(() => [{ stepCount: 0 }, { dailyStepsTarget: 8000 }, []] as [StepLogDto, ActivityGoalDto, StepLogDto[]]);
    setToday(t as StepLogDto);
    setGoal(g as ActivityGoalDto);
    setWeek(w as StepLogDto[]);
  };

  const addSteps = async (n: number) => {
    setSaving(true);
    try {
      const updated = await wellnessService.logSteps({
        stepCount: (today.stepCount ?? 0) + n,
        source: 'MANUAL',
      });
      setToday(updated);
      loadData();
    } catch (e) {
      console.error('Failed to log steps', e);
    } finally {
      setSaving(false);
      setCustomSteps('');
    }
  };

  const handleCustom = () => {
    const n = parseInt(customSteps);
    if (n > 0) addSteps(n);
  };

  const steps = today.stepCount ?? 0;
  const target = goal.dailyStepsTarget ?? 8000;
  const pct = Math.min(100, Math.round((steps / target) * 100));
  const distKm = today.distanceKm ?? (steps * 0.0007).toFixed(2);

  // Fill in missing days in the 7-day chart
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000);
    const dateStr = d.toISOString().split('T')[0];
    const found = week.find(w => w.logDate === dateStr);
    return {
      date: d.toLocaleDateString('en-IN', { weekday: 'short' }),
      steps: found?.stepCount ?? 0,
    };
  });

  // Radius calc for SVG ring
  const R = 56, C = 2 * Math.PI * R;
  const offset = C - (pct / 100) * C;

  return (
    <div className="space-y-5 max-w-xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/wellness')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Footprints className="h-5 w-5 text-blue-600" /> Step Counter
          </h1>
          <p className="text-sm text-muted-foreground">Track your daily steps toward your goal</p>
        </div>
      </div>

      {/* Ring + stats */}
      <Card>
        <CardContent className="p-6 flex flex-col items-center">
          {/* SVG ring */}
          <div className="relative w-36 h-36 mb-4">
            <svg viewBox="0 0 128 128" className="w-full h-full -rotate-90">
              <circle cx="64" cy="64" r={R} fill="none" stroke="var(--muted)" strokeWidth="10" />
              <circle
                cx="64" cy="64" r={R} fill="none"
                stroke={pct >= 100 ? '#16a34a' : '#3b82f6'}
                strokeWidth="10"
                strokeDasharray={C}
                strokeDashoffset={offset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.5s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold">{steps.toLocaleString()}</span>
              <span className="text-xs text-muted-foreground">steps</span>
            </div>
          </div>

          <Progress value={pct} className="w-full h-2 mb-3" />
          <p className="text-sm text-muted-foreground mb-4">{pct}% of {target.toLocaleString()} step goal</p>

          <div className="grid grid-cols-2 gap-4 w-full text-center">
            <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Distance</p>
              <p className="font-bold text-blue-600">{distKm} km</p>
            </div>
            <div className="bg-orange-50 dark:bg-orange-950 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Calories</p>
              <p className="font-bold text-orange-600 flex items-center justify-center gap-0.5">
                <Flame className="h-3.5 w-3.5" /> {Math.round(steps * 0.04)} kcal
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick add */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Add Steps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-4 gap-2">
            {QUICK_ADD.map(n => (
              <Button key={n} variant="outline" size="sm" onClick={() => addSteps(n)} disabled={saving}>
                +{n >= 1000 ? `${n / 1000}k` : n}
              </Button>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              type="number"
              placeholder="Custom steps…"
              value={customSteps}
              onChange={e => setCustomSteps(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCustom()}
            />
            <Button onClick={handleCustom} disabled={saving || !customSteps} className="gap-1">
              <Plus className="h-4 w-4" /> Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 7-day chart */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-sm font-medium">Last 7 Days</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{ background: 'var(--background)', border: '1px solid var(--border)', borderRadius: 8 }}
                formatter={(v: number) => [v.toLocaleString(), 'Steps']}
              />
              <ReferenceLine y={target} stroke="#3b82f6" strokeDasharray="4 4" label={{ value: 'Goal', position: 'right', fontSize: 10, fill: '#3b82f6' }} />
              <Bar dataKey="steps" fill="#3b82f6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
