import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import {
  Flame, Dumbbell, Apple, TrendingUp, Plus, ChevronLeft, ChevronRight,
  Target, Zap, ArrowRight,
} from 'lucide-react';
import { wellnessService } from '../../../services/wellness/wellnessService';
import type { DailyNutritionSummaryDto, MealLogDto } from '../../../types/wellness';

// ─── helpers ──────────────────────────────────────────────────────────────────

function dateStr(d: Date) {
  return d.toISOString().split('T')[0];
}

function addDays(base: string, n: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return dateStr(d);
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const today = dateStr(new Date());
  if (iso === today) return 'Today';
  if (iso === addDays(today, -1)) return 'Yesterday';
  return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

function MacroBar({ label, value, target, color, unit = 'g' }: { label: string; value: number; target?: number; color: string; unit?: string }) {
  const pct = target ? Math.min(100, Math.round((value / target) * 100)) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="font-bold text-slate-700 dark:text-slate-300">{label}</span>
        <span className="text-slate-500">
          <span className={`font-black ${color}`}>{value}</span>
          {target ? <span className="text-slate-400"> / {target}{unit}</span> : <span className="text-slate-400">{unit}</span>}
        </span>
      </div>
      <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color.replace('text-', 'bg-')}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ─── calorie ring ─────────────────────────────────────────────────────────────

function CalorieRing({ consumed, burned, goal }: { consumed: number; burned: number; goal: number }) {
  const R = 54;
  const C = 2 * Math.PI * R;
  const net = Math.max(0, consumed - burned);
  const consumedPct = goal ? Math.min(1, consumed / goal) : 0;
  const burnedPct = goal ? Math.min(1, burned / goal) : 0;
  const netPct = goal ? Math.min(1, net / goal) : 0;

  const isOver = net > goal;
  const remaining = Math.max(0, goal - net);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-36 h-36">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          {/* Background track */}
          <circle cx="60" cy="60" r={R} fill="none" stroke="var(--tw-border-opacity, #e2e8f0)" strokeWidth="10"
            className="stroke-slate-200 dark:stroke-slate-700" />
          {/* Consumed arc */}
          <circle cx="60" cy="60" r={R} fill="none" stroke="#f97316" strokeWidth="10"
            strokeDasharray={C} strokeDashoffset={C - consumedPct * C} strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
          {/* Burned arc (shown as green overlay from start) */}
          <circle cx="60" cy="60" r={R - 12} fill="none" stroke="#22c55e" strokeWidth="8"
            strokeDasharray={C * 0.72} strokeDashoffset={(C * 0.72) - burnedPct * (C * 0.72)} strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-xl font-black tabular-nums ${isOver ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>
            {remaining > 0 ? remaining.toLocaleString() : '+' + Math.abs(remaining).toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">{isOver ? 'over goal' : 'remaining'}</span>
          <span className="text-[9px] text-slate-400 mt-0.5">of {goal.toLocaleString()} kcal</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-[10px]">
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-400 inline-block" />
          <span className="text-slate-500">Consumed <span className="font-black text-orange-500">{consumed.toLocaleString()}</span></span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
          <span className="text-slate-500">Burned <span className="font-black text-emerald-500">{burned.toLocaleString()}</span></span>
        </div>
      </div>
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export default function CalorieTracker() {
  const today = dateStr(new Date());
  const [date, setDate] = useState(today);
  const [summary, setSummary] = useState<DailyNutritionSummaryDto | null>(null);
  const [weekData, setWeekData] = useState<{ day: string; consumed: number; burned: number; goal: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekLoading, setWeekLoading] = useState(true);

  useEffect(() => { loadSummary(); }, [date]);
  useEffect(() => { loadWeek(); }, []);

  async function loadSummary() {
    setLoading(true);
    try {
      setSummary(await wellnessService.getDailySummary(date));
    } catch { setSummary(null); }
    finally { setLoading(false); }
  }

  async function loadWeek() {
    setWeekLoading(true);
    try {
      const end = today;
      const start = addDays(today, -6);
      const meals = await wellnessService.getMealsRange(start, end);
      const workouts = await wellnessService.getWorkoutsRange(start, end);
      const days = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));
      const data = days.map(d => {
        const dayMeals = (meals as MealLogDto[]).filter(m => m.mealDate === d);
        const consumed = dayMeals.reduce((s, m) => s + (m.totalCalories ?? 0), 0);
        const burned = workouts.filter((w: { workoutDate?: string; caloriesBurned?: number }) => w.workoutDate === d).reduce((s: number, w: { caloriesBurned?: number }) => s + (w.caloriesBurned ?? 0), 0);
        return { day: new Date(d).toLocaleDateString([], { weekday: 'short' }), consumed, burned, goal: summary?.calorieTarget ?? 2000 };
      });
      setWeekData(data);
    } catch { /* skip */ }
    finally { setWeekLoading(false); }
  }

  const cal = summary;
  const goal = cal?.calorieTarget ?? 2000;
  const consumed = cal?.totalCalories ?? 0;
  const burned = cal?.caloriesBurned ?? 0;
  const net = consumed - burned;
  const isOver = net > goal;

  return (
    <div className="space-y-5 p-4 sm:p-6 max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white shadow-lg shadow-orange-400/20">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 dark:text-white">Calorie Tracker</h1>
            <p className="text-xs text-slate-500 mt-0.5">Goal vs consumed vs burned</p>
          </div>
        </div>
        <Link to="/wellness/profile" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5">
          Edit Goal <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Date nav */}
      <div className="flex items-center gap-2 justify-center">
        <button type="button" onClick={() => setDate(d => addDays(d, -1))}
          className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-slate-400">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-bold text-slate-800 dark:text-white min-w-32 text-center">{formatDate(date)}</span>
        <button type="button" onClick={() => setDate(d => addDays(d, 1))} disabled={date >= today}
          className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-slate-400 disabled:opacity-30">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-400" />
        </div>
      ) : (
        <>
          {/* Calorie ring + net stat */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <CalorieRing consumed={consumed} burned={burned} goal={goal} />

              {/* Stat tiles */}
              <div className="grid grid-cols-2 gap-3 flex-1 w-full">
                {[
                  { label: 'Goal',     value: goal,     icon: Target,   color: 'text-slate-700 dark:text-slate-200', bg: 'bg-slate-50 dark:bg-slate-800' },
                  { label: 'Consumed', value: consumed, icon: Apple,    color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-950/30' },
                  { label: 'Burned',   value: burned,   icon: Dumbbell, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
                  { label: 'Net',      value: net,      icon: Zap,      color: isOver ? 'text-red-600 dark:text-red-400' : 'text-indigo-600 dark:text-indigo-400', bg: isOver ? 'bg-red-50 dark:bg-red-950/30' : 'bg-indigo-50 dark:bg-indigo-950/30' },
                ].map(t => (
                  <div key={t.label} className={`${t.bg} rounded-xl p-3`}>
                    <div className={`flex items-center gap-1 text-[10px] font-bold ${t.color} mb-1`}>
                      <t.icon className="w-3 h-3" />{t.label}
                    </div>
                    <p className={`text-base font-black tabular-nums ${t.color}`}>
                      {t.value >= 0 ? '' : '−'}{Math.abs(t.value).toLocaleString()}
                    </p>
                    <p className="text-[9px] text-slate-400 mt-0.5">kcal</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Surplus / deficit tag */}
            <div className={`mt-4 text-center text-xs font-bold py-2 rounded-xl ${
              isOver
                ? 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400'
                : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300'
            }`}>
              {isOver
                ? `Calorie surplus of ${(net - goal).toLocaleString()} kcal — consider a workout!`
                : `${(goal - net).toLocaleString()} kcal deficit — ${cal?.workoutCount ?? 0} workout${(cal?.workoutCount ?? 0) !== 1 ? 's' : ''} logged today`
              }
            </div>
          </div>

          {/* Macro breakdown */}
          {cal && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
              <p className="text-xs font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Macros</p>
              <MacroBar label="Protein"       value={Math.round(cal.totalProtein)} color="text-blue-600"   />
              <MacroBar label="Carbohydrates" value={Math.round(cal.totalCarbs)}   color="text-amber-500"  />
              <MacroBar label="Fat"           value={Math.round(cal.totalFat)}     color="text-orange-500" />
              {(cal.totalFiber ?? 0) > 0 && (
                <MacroBar label="Fiber" value={Math.round(cal.totalFiber)} color="text-emerald-600" />
              )}
            </div>
          )}

          {/* Meal breakdown */}
          {cal?.meals && cal.meals.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Today's Meals</p>
                <Link to="/wellness/food-journal" className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline">View all</Link>
              </div>
              {cal.meals.map((meal, i) => (
                <div key={i} className="flex items-center gap-3 py-1.5 border-b border-slate-50 dark:border-slate-800 last:border-0">
                  <div className="w-7 h-7 rounded-lg bg-orange-100 dark:bg-orange-950/30 flex items-center justify-center flex-shrink-0">
                    <Apple className="w-3.5 h-3.5 text-orange-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                      {meal.mealType.charAt(0) + meal.mealType.slice(1).toLowerCase()}
                    </p>
                    <p className="text-[10px] text-slate-400">{meal.items?.length ?? 0} items</p>
                  </div>
                  <p className="text-xs font-black text-orange-500 tabular-nums">{meal.totalCalories ?? 0} kcal</p>
                </div>
              ))}
            </div>
          )}

          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-3">
            <Link to="/wellness/log-meal"
              className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-orange-500 text-white font-bold text-xs hover:bg-orange-600 transition">
              <Plus className="w-4 h-4 flex-shrink-0" />Log Meal
            </Link>
            <Link to="/wellness/log-workout"
              className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition">
              <Dumbbell className="w-4 h-4 flex-shrink-0" />Log Workout
            </Link>
          </div>
        </>
      )}

      {/* Weekly trend */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-indigo-500" />
          <p className="text-xs font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wider">7-Day Calorie Trend</p>
        </div>
        {weekLoading ? (
          <div className="flex items-center justify-center h-24">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-500" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={weekData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barGap={2}>
              <XAxis dataKey="day" tick={{ fontSize: 9, fill: 'var(--tw-text-opacity, #94a3b8)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: 'var(--bg)', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 10 }}
                formatter={(v: number, name: string) => [`${v} kcal`, name === 'consumed' ? 'Consumed' : 'Burned']}
              />
              <ReferenceLine y={goal} stroke="#6366f1" strokeDasharray="3 3" strokeWidth={1} label={{ value: 'Goal', position: 'right', fontSize: 9, fill: '#6366f1' }} />
              <Bar dataKey="consumed" fill="#fb923c" radius={[3, 3, 0, 0]} maxBarSize={28} />
              <Bar dataKey="burned" fill="#22c55e" radius={[3, 3, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        )}
        <div className="flex gap-4 justify-center mt-2 text-[10px]">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-orange-400 inline-block" />Consumed</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-500 inline-block" />Burned</span>
          <span className="flex items-center gap-1"><span className="w-2 h-1 border-t-2 border-dashed border-indigo-500 inline-block" />Goal</span>
        </div>
      </div>
    </div>
  );
}
