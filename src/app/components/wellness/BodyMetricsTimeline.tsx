import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { Scale, TrendingDown, TrendingUp, ArrowLeft, Plus, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { wellnessService } from '../../../services/wellness/wellnessService';
import type { BodyMetricLogDto } from '../../../types/wellness';

const RANGE_OPTIONS = [
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
  { label: '6m', days: 180 },
  { label: '1y', days: 365 },
];

function bmiCategory(bmi: number) {
  if (bmi < 18.5) return { label: 'Underweight', color: 'text-blue-600' };
  if (bmi < 25)   return { label: 'Normal', color: 'text-emerald-600' };
  if (bmi < 30)   return { label: 'Overweight', color: 'text-amber-600' };
  return { label: 'Obese', color: 'text-red-600' };
}

export default function BodyMetricsTimeline() {
  const navigate = useNavigate();
  const [days, setDays] = useState(90);
  const [metrics, setMetrics] = useState<BodyMetricLogDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [logMode, setLogMode] = useState(false);
  const [form, setForm] = useState({ weightKg: '', waistCm: '', bodyFatPct: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<{ targetWeightKg?: number } | null>(null);

  useEffect(() => {
    loadData();
  }, [days]);

  useEffect(() => {
    wellnessService.getProfile().then(p => setProfile(p)).catch(() => {});
  }, []);

  const loadData = () => {
    setLoading(true);
    wellnessService.getBodyMetrics(days)
      .then(setMetrics)
      .catch(() => setMetrics([]))
      .finally(() => setLoading(false));
  };

  const handleLog = async () => {
    if (!form.weightKg && !form.waistCm) return;
    setSaving(true);
    try {
      await wellnessService.logBodyMetric({
        weightKg: form.weightKg ? parseFloat(form.weightKg) : undefined,
        waistCm: form.waistCm ? parseFloat(form.waistCm) : undefined,
        bodyFatPct: form.bodyFatPct ? parseFloat(form.bodyFatPct) : undefined,
        notes: form.notes || undefined,
        source: 'MANUAL',
      });
      setForm({ weightKg: '', waistCm: '', bodyFatPct: '', notes: '' });
      setLogMode(false);
      loadData();
    } catch (e) {
      console.error('Failed to log body metric', e);
    } finally {
      setSaving(false);
    }
  };

  const chartData = metrics.map(m => ({
    date: m.loggedDate ? new Date(m.loggedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '',
    weight: m.weightKg ? parseFloat(m.weightKg.toString()) : null,
    bmi: m.bmi ? parseFloat(m.bmi.toString()) : null,
    waist: m.waistCm ? parseFloat(m.waistCm.toString()) : null,
  }));

  const latest = metrics[metrics.length - 1];
  const first = metrics[0];
  const weightChange = (latest?.weightKg && first?.weightKg)
    ? parseFloat(latest.weightKg.toString()) - parseFloat(first.weightKg.toString())
    : null;

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/wellness')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Scale className="h-5 w-5 text-emerald-600" /> Body Metrics
          </h1>
          <p className="text-sm text-muted-foreground">Track weight, BMI, and measurements over time</p>
        </div>
        <Button size="sm" className="gap-1" onClick={() => setLogMode(v => !v)}>
          <Plus className="h-3 w-3" /> {logMode ? 'Cancel' : 'Log'}
        </Button>
      </div>

      {/* Quick log form */}
      {logMode && (
        <Card className="border-emerald-400">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Log Today's Measurements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Weight (kg)</label>
                <Input type="number" placeholder="72.5" value={form.weightKg} onChange={e => setForm(f => ({ ...f, weightKg: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Waist (cm)</label>
                <Input type="number" placeholder="82" value={form.waistCm} onChange={e => setForm(f => ({ ...f, waistCm: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Body Fat (%)</label>
                <Input type="number" placeholder="22" value={form.bodyFatPct} onChange={e => setForm(f => ({ ...f, bodyFatPct: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Notes</label>
                <Input placeholder="Morning, fasted…" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <Button className="w-full" onClick={handleLog} disabled={saving || (!form.weightKg && !form.waistCm)}>
              {saving ? 'Saving…' : 'Save Measurement'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats summary */}
      {latest && (
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">Current</p>
              <p className="text-2xl font-bold text-emerald-600">{latest.weightKg} kg</p>
              {profile?.targetWeightKg && (
                <p className="text-xs text-muted-foreground flex items-center justify-center gap-0.5 mt-0.5">
                  <Target className="h-3 w-3" /> {profile.targetWeightKg} kg goal
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">BMI</p>
              {latest.bmi ? (
                <>
                  <p className="text-2xl font-bold">{latest.bmi}</p>
                  <Badge variant="secondary" className={`text-[10px] ${bmiCategory(parseFloat(latest.bmi.toString())).color}`}>
                    {bmiCategory(parseFloat(latest.bmi.toString())).label}
                  </Badge>
                </>
              ) : <p className="text-sm text-muted-foreground">—</p>}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">{days}d Change</p>
              {weightChange !== null ? (
                <div className="flex items-center justify-center gap-1">
                  {weightChange < 0
                    ? <TrendingDown className="h-5 w-5 text-emerald-600" />
                    : <TrendingUp className="h-5 w-5 text-amber-600" />}
                  <p className={`text-xl font-bold ${weightChange < 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)}
                  </p>
                </div>
              ) : <p className="text-sm text-muted-foreground">—</p>}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Range selector */}
      <div className="flex gap-2">
        {RANGE_OPTIONS.map(o => (
          <Button
            key={o.days}
            variant={days === o.days ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDays(o.days)}
          >
            {o.label}
          </Button>
        ))}
      </div>

      {/* Weight chart */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-emerald-500" />
        </div>
      ) : chartData.filter(d => d.weight !== null).length > 1 ? (
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-sm font-medium">Weight Trend (kg)</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ background: 'var(--background)', border: '1px solid var(--border)', borderRadius: 8 }}
                  formatter={(v: any) => [`${v ?? ''} kg`, 'Weight']}
                />
                {profile?.targetWeightKg && (
                  <ReferenceLine y={profile.targetWeightKg} stroke="#16a34a" strokeDasharray="4 4" label={{ value: 'Goal', position: 'right', fontSize: 10, fill: '#16a34a' }} />
                )}
                <Line type="monotone" dataKey="weight" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-14 text-muted-foreground">
          <Scale className="h-12 w-12 mx-auto mb-3 opacity-25" />
          <p className="font-medium">Not enough data yet</p>
          <p className="text-sm mt-1">Log at least 2 measurements to see your trend</p>
          <Button className="mt-4 gap-1" onClick={() => setLogMode(true)}>
            <Plus className="h-4 w-4" /> Log First Measurement
          </Button>
        </div>
      )}
    </div>
  );
}
