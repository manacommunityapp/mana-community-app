import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import {
  Flame, Footprints, Dumbbell, Droplets, Trophy, TrendingUp,
  Scale, Target, Zap, ChevronLeft, ChevronRight, RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { wellnessService } from '../../../services/wellness/wellnessService';
import type { DailyFitnessSummaryDto, WeeklyFitnessPointDto } from '../../../types/wellness';

function ScoreRing({ score }: { score: number }) {
  const R = 44, C = 2 * Math.PI * R;
  const offset = C - (score / 100) * C;
  const color = score >= 75 ? '#16a34a' : score >= 50 ? '#f59e0b' : score >= 25 ? '#3b82f6' : '#e5e7eb';
  return (
    <div className="relative w-28 h-28">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r={R} fill="none" stroke="var(--muted)" strokeWidth="8" />
        <circle cx="50" cy="50" r={R} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={C} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold leading-none">{score}</span>
        <span className="text-[10px] text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
}

function PillarPill({ icon: Icon, label, value, target, unit, color }: {
  icon: React.ElementType; label: string; value: number; target?: number; unit: string; color: string;
}) {
  const pct = target ? Math.min(100, Math.round((value / target) * 100)) : 0;
  return (
    <div className="flex flex-col gap-1 flex-1 min-w-0">
      <div className={`flex items-center gap-1 text-xs font-medium ${color}`}>
        <Icon className="h-3 w-3" /> {label}
      </div>
      <span className="text-base font-bold leading-none">{value.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">{unit}</span></span>
      {target ? <Progress value={pct} className="h-1" /> : null}
    </div>
  );
}

export default function UnifiedFitnessDashboard() {
  const navigate = useNavigate();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [summary, setSummary] = useState<DailyFitnessSummaryDto | null>(null);
  const [trend, setTrend] = useState<WeeklyFitnessPointDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [trendLoading, setTrendLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    wellnessService.getFitnessSummary(date)
      .then(setSummary)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [date]);

  useEffect(() => {
    setTrendLoading(true);
    wellnessService.getWeeklyFitnessTrend()
      .then(setTrend)
      .catch(() => {})
      .finally(() => setTrendLoading(false));
  }, []);

  const changeDate = (delta: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + delta);
    if (d <= new Date()) setDate(d.toISOString().split('T')[0]);
  };

  const isToday = date === new Date().toISOString().split('T')[0];
  const displayDate = new Date(date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });

  const chartData = trend.map(t => ({
    date: new Date(t.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }),
    'Calories In': t.caloriesConsumed,
    'Burned': t.caloriesBurned,
    'Steps': Math.round(t.stepCount / 100),
    Score: t.fitnessScore,
  }));

  const scoreLabel = !summary ? '' :
    summary.fitnessScore >= 75 ? 'Great day!' :
    summary.fitnessScore >= 50 ? 'Good progress' :
    summary.fitnessScore >= 25 ? 'Getting started' : 'Log your day';

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {/* Header nav */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate('/wellness')}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 text-center">
          <h1 className="text-lg font-bold flex items-center justify-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" /> Fitness Dashboard
          </h1>
        </div>
        <Button variant="ghost" size="icon" onClick={() => { setLoading(true); wellnessService.getFitnessSummary(date).then(setSummary).finally(() => setLoading(false)); }}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Date nav */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="icon" onClick={() => changeDate(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium">{displayDate}</span>
        <Button variant="outline" size="icon" onClick={() => changeDate(1)} disabled={isToday}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
        </div>
      ) : summary && (
        <>
          {/* Score + 4 pillars */}
          <Card className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
            <CardContent className="p-5">
              <div className="flex items-center gap-6">
                <div className="flex flex-col items-center gap-1">
                  <ScoreRing score={summary.fitnessScore} />
                  <Badge variant="secondary" className="text-[10px]">{scoreLabel}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 flex-1">
                  <PillarPill icon={Flame} label="Calories" value={summary.totalCalories} target={summary.calorieTarget} unit="kcal" color="text-orange-500" />
                  <PillarPill icon={Footprints} label="Steps" value={summary.stepCount} target={summary.stepGoal} unit="steps" color="text-blue-500" />
                  <PillarPill icon={Dumbbell} label="Workouts" value={summary.workoutCount} unit="done" color="text-emerald-500" />
                  <PillarPill icon={Droplets} label="Water" value={Math.round(summary.totalWaterMl / 100) / 10} target={summary.waterTargetMl / 1000} unit="L" color="text-cyan-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Calorie balance */}
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground">Consumed</p>
                <p className="text-xl font-bold text-orange-500">{summary.totalCalories}</p>
                <p className="text-[10px] text-muted-foreground">target {summary.calorieTarget}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground">Burned</p>
                <p className="text-xl font-bold text-green-500">-{summary.caloriesBurned}</p>
                <p className="text-[10px] text-muted-foreground">{summary.totalWorkoutMinutes} min</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground">Net</p>
                <p className={`text-xl font-bold ${summary.netCalories > summary.calorieTarget * 1.1 ? 'text-red-500' : 'text-emerald-600'}`}>
                  {summary.netCalories}
                </p>
                <p className="text-[10px] text-muted-foreground">kcal</p>
              </CardContent>
            </Card>
          </div>

          {/* Macro breakdown */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Macros Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-2 text-center">
                {[
                  { label: 'Protein', value: summary.totalProtein, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950' },
                  { label: 'Carbs', value: summary.totalCarbs, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950' },
                  { label: 'Fat', value: summary.totalFat, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-950' },
                  { label: 'Fiber', value: summary.totalFiber, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950' },
                ].map(m => (
                  <div key={m.label} className={`${m.bg} rounded-lg p-2`}>
                    <p className="text-[10px] text-muted-foreground">{m.label}</p>
                    <p className={`font-bold text-sm ${m.color}`}>{(m.value ?? 0).toFixed(0)}g</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Activity row */}
          {(summary.stepCount > 0 || summary.activeMinutes) && (
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Footprints className="h-3.5 w-3.5 text-blue-500" />
                    <p className="text-xs font-medium">Steps</p>
                    {summary.stepGoalMet && <Badge variant="default" className="text-[9px] px-1 py-0 ml-auto bg-emerald-500">Goal!</Badge>}
                  </div>
                  <p className="text-xl font-bold text-blue-600">{summary.stepCount.toLocaleString()}</p>
                  <Progress value={Math.min(100, Math.round((summary.stepCount / summary.stepGoal) * 100))} className="h-1 mt-1" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <TrendingUp className="h-3.5 w-3.5 text-purple-500" />
                    <p className="text-xs font-medium">Active Min</p>
                  </div>
                  <p className="text-xl font-bold text-purple-600">{summary.activeMinutes ?? 0}</p>
                  <Progress value={Math.min(100, Math.round(((summary.activeMinutes ?? 0) / summary.activeMinutesGoal) * 100))} className="h-1 mt-1" />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Streak + body */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-3 flex items-center gap-3">
                <Flame className="h-8 w-8 text-orange-400" />
                <div>
                  <p className="text-2xl font-bold text-orange-500">{summary.currentStreakDays}</p>
                  <p className="text-xs text-muted-foreground">day streak</p>
                </div>
              </CardContent>
            </Card>
            {summary.latestWeightKg && (
              <Card>
                <CardContent className="p-3 flex items-center gap-3">
                  <Scale className="h-8 w-8 text-teal-400" />
                  <div>
                    <p className="text-2xl font-bold text-teal-600">{summary.latestWeightKg} kg</p>
                    {summary.latestBmi && <p className="text-xs text-muted-foreground">BMI {summary.latestBmi}</p>}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}

      {/* 7-day trend chart */}
      {!trendLoading && trend.length > 0 && (
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              7-Day Trend
              <span className="text-[10px] text-muted-foreground font-normal">Bars = calories · Line = score</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <ResponsiveContainer width="100%" height={200}>
              <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                <YAxis yAxisId="cal" tick={{ fontSize: 9 }} />
                <YAxis yAxisId="score" orientation="right" domain={[0, 100]} tick={{ fontSize: 9 }} />
                <Tooltip contentStyle={{ background: 'var(--background)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11 }} />
                <Bar yAxisId="cal" dataKey="Calories In" fill="#fb923c" radius={[2, 2, 0, 0]} />
                <Bar yAxisId="cal" dataKey="Burned" fill="#4ade80" radius={[2, 2, 0, 0]} />
                <Line yAxisId="score" type="monotone" dataKey="Score" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Quick nav */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { to: '/wellness/log-workout', icon: Dumbbell, label: 'Log Workout', color: 'text-emerald-600' },
          { to: '/wellness/steps', icon: Footprints, label: 'Log Steps', color: 'text-blue-600' },
          { to: '/wellness/goals', icon: Target, label: 'Goals', color: 'text-orange-600' },
        ].map(item => (
          <Link key={item.to} to={item.to}>
            <Button variant="outline" className="w-full gap-1.5 text-xs h-9">
              <item.icon className={`h-3.5 w-3.5 ${item.color}`} />
              {item.label}
            </Button>
          </Link>
        ))}
      </div>
    </div>
  );
}
