import { useEffect, useState } from 'react';
import { Droplets, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { wellnessService } from '@/services/wellness/wellnessService';
import type { WaterLogDto } from '@/types/wellness';

const QUICK_ADD = [
  { label: '1 Glass', ml: 250, emoji: '🥛' },
  { label: '1 Bottle', ml: 500, emoji: '🍶' },
  { label: 'Small Sip', ml: 100, emoji: '💧' },
  { label: 'Large Bottle', ml: 1000, emoji: '🫗' },
];

export default function WaterTracker() {
  const today = new Date().toISOString().split('T')[0];
  const [logs, setLogs] = useState<WaterLogDto[]>([]);
  const [totalMl, setTotalMl] = useState(0);
  const targetMl = 2500;
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await wellnessService.getWaterLogs(today);
      setLogs(data);
      setTotalMl(data.reduce((sum, l) => sum + l.amountMl, 0));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const addWater = async (ml: number) => {
    try {
      await wellnessService.logWater({ logDate: today, amountMl: ml });
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const percent = Math.min(100, Math.round((totalMl / targetMl) * 100));
  const glasses = Math.floor(totalMl / 250);

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <h1 className="text-xl font-bold flex items-center gap-2">
        <Droplets className="h-5 w-5 text-blue-500" /> Water Tracker
      </h1>

      {/* Progress */}
      <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950">
        <CardContent className="pt-6 text-center">
          <div className="relative w-32 h-32 mx-auto mb-4">
            <svg className="w-full h-full" viewBox="0 0 128 128">
              <circle cx="64" cy="64" r="56" fill="none" stroke="currentColor" strokeWidth="8" className="text-blue-100 dark:text-blue-900" />
              <circle
                cx="64" cy="64" r="56" fill="none" stroke="currentColor" strokeWidth="8"
                className="text-blue-500"
                strokeDasharray={`${percent * 3.52} 352`}
                strokeLinecap="round"
                transform="rotate(-90 64 64)"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold">{percent}%</span>
              <span className="text-xs text-muted-foreground">{glasses} glasses</span>
            </div>
          </div>
          <p className="text-lg font-semibold">{(totalMl / 1000).toFixed(1)} / {(targetMl / 1000).toFixed(1)} L</p>
          <Progress value={percent} className="h-2 mt-3" />
        </CardContent>
      </Card>

      {/* Quick Add */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Quick Add</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {QUICK_ADD.map((item) => (
              <Button
                key={item.ml}
                variant="outline"
                className="h-14 flex-col gap-0.5"
                onClick={() => addWater(item.ml)}
              >
                <span>{item.emoji} {item.label}</span>
                <span className="text-[10px] text-muted-foreground">{item.ml} ml</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Today's Log */}
      {logs.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Today's Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {logs.map((log) => (
                <div key={log.id} className="flex justify-between text-sm p-2 bg-muted/50 rounded">
                  <span className="text-muted-foreground">{log.logTime?.substring(0, 5) ?? '--:--'}</span>
                  <span className="font-medium">{log.amountMl} ml</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
