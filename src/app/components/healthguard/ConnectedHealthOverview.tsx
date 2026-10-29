import { useNavigate } from 'react-router';
import {
  Activity,
  ArrowLeft,
  HeartPulse,
  Info,
  LockKeyhole,
  ShieldAlert,
  Smartphone,
  Watch,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';

const dataTypes = [
  {
    icon: Activity,
    name: 'Steps and activity',
    use: 'Personal movement goals and opt-in community challenges.',
  },
  {
    icon: Watch,
    name: 'Workouts',
    use: 'A personal activity history for fitness and sports.',
  },
  {
    icon: HeartPulse,
    name: 'Heart-rate history',
    use: 'Personal trends with the source and last sync time shown.',
  },
];

export function ConnectedHealthOverview() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/healthguard')} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> HealthGuard
        </Button>
      </div>

      <header className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-700">
          <HeartPulse className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Connected health</h1>
          <p className="mt-1 text-sm text-muted-foreground">Understand how device syncing will work in Mana.</p>
        </div>
      </header>

      <section className="rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-400" />
          <div>
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-300">Live device syncing is not enabled yet</p>
            <p className="mt-1 text-sm text-amber-900/80 dark:text-amber-200/80">
              This page is an introduction. It does not request health permissions, connect a watch, or sync health data.
            </p>
          </div>
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Smartphone className="h-4 w-4 text-blue-600" /> How a real connection will work
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="grid gap-4 md:grid-cols-3">
            <li className="rounded-lg bg-muted/40 p-4">
              <span className="mb-2 flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">1</span>
              <p className="text-sm font-semibold">Sync your device first</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Your watch usually sends records to its companion app, then to Apple Health or Android Health Connect.
              </p>
            </li>
            <li className="rounded-lg bg-muted/40 p-4">
              <span className="mb-2 flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">2</span>
              <p className="text-sm font-semibold">Choose what Mana may read</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                The mobile app will ask separately for each supported data type. You can allow some and decline others.
              </p>
            </li>
            <li className="rounded-lg bg-muted/40 p-4">
              <span className="mb-2 flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">3</span>
              <p className="text-sm font-semibold">Check the latest sync</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Mana will show the data source and when it last updated. A delayed sync will be marked as stale.
              </p>
            </li>
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Data categories planned for the first release</CardTitle>
          <p className="text-xs text-muted-foreground">Availability depends on the phone, companion app, device, and permission you grant.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {dataTypes.map(({ icon: Icon, name, use }) => (
            <div key={name} className="flex items-start gap-3 rounded-lg border border-border p-3">
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
              <div>
                <p className="text-sm font-medium">{name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{use}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <LockKeyhole className="h-4 w-4 text-emerald-600" /> Your choices stay separate
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs leading-5 text-muted-foreground">
            <p>Allowing Mana to read a metric will not automatically share it with a caregiver or community challenge.</p>
            <p>Caregiver access and challenge participation will have separate opt-in controls.</p>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50/40 dark:border-red-900 dark:bg-red-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm text-red-800 dark:text-red-300">
              <ShieldAlert className="h-4 w-4" /> Need help now?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs leading-5 text-muted-foreground">
              Health-data syncing is not continuous emergency monitoring. Manual SOS remains a separate HealthGuard action.
            </p>
            <Button variant="destructive" className="mt-3" onClick={() => navigate('/healthguard/sos')}>
              Open Emergency SOS
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
