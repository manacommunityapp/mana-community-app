import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Watch, Bluetooth, ArrowLeft, RefreshCw, Shield, Wifi, WifiOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { wellnessService } from '../../../services/wellness/wellnessService';
import type { WearableDeviceDto, WearableType } from '../../../types/wellness';

const DEVICE_ICONS: Record<WearableType, string> = {
  APPLE_WATCH: '⌚',
  FITBIT: '🏃',
  GARMIN: '🗺️',
  SAMSUNG_GALAXY_WATCH: '⌚',
  GENERIC_BLUETOOTH: '📡',
  MANUAL: '📝',
};

const DEVICE_LABELS: Record<WearableType, string> = {
  APPLE_WATCH: 'Apple Watch',
  FITBIT: 'Fitbit',
  GARMIN: 'Garmin',
  SAMSUNG_GALAXY_WATCH: 'Galaxy Watch',
  GENERIC_BLUETOOTH: 'Bluetooth Device',
  MANUAL: 'Manual Entry',
};

function timeAgo(dateStr?: string) {
  if (!dateStr) return 'Never synced';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function WearableDevices() {
  const navigate = useNavigate();
  const [devices, setDevices] = useState<WearableDeviceDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    wellnessService.getWearableDevices()
      .then(setDevices)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5 max-w-xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/wellness')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Watch className="h-5 w-5 text-indigo-600" /> Connected Devices
          </h1>
          <p className="text-sm text-muted-foreground">Wearables syncing fitness data</p>
        </div>
      </div>

      {/* Health Connect info banner */}
      <Card className="border-blue-300 bg-blue-50 dark:bg-blue-950 dark:border-blue-700">
        <CardContent className="p-4 flex gap-3">
          <Bluetooth className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-blue-800 dark:text-blue-200">Health Connect Sync</p>
            <p className="text-blue-600 dark:text-blue-300 text-xs mt-0.5">
              Connect your wearable in the HealthGuard module to automatically sync steps, heart rate, and
              active minutes. Fitness data will appear here once synced.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2 border-blue-400 text-blue-700 dark:text-blue-300"
              onClick={() => navigate('/healthguard')}
            >
              <Shield className="h-3 w-3 mr-1" /> Open HealthGuard
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Device list */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-indigo-500" />
        </div>
      ) : error ? (
        <div className="text-center py-12 text-muted-foreground">
          <WifiOff className="h-10 w-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Could not load devices</p>
        </div>
      ) : devices.length === 0 ? (
        <div className="text-center py-14 text-muted-foreground">
          <Watch className="h-12 w-12 mx-auto mb-3 opacity-25" />
          <p className="font-medium">No devices registered</p>
          <p className="text-sm mt-1">Register your wearable in HealthGuard to start syncing</p>
          <Button className="mt-4 gap-1" onClick={() => navigate('/healthguard')}>
            <Shield className="h-4 w-4" /> Go to HealthGuard
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {devices.map(d => (
            <Card key={d.id}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="text-3xl">{DEVICE_ICONS[d.deviceType] ?? '📡'}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{d.deviceName || DEVICE_LABELS[d.deviceType]}</p>
                    <Badge variant={d.isActive ? 'default' : 'secondary'} className="text-[10px] shrink-0">
                      {d.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{DEVICE_LABELS[d.deviceType]}</p>
                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                    {d.isActive
                      ? <Wifi className="h-3 w-3 text-emerald-500" />
                      : <WifiOff className="h-3 w-3" />}
                    Last sync: {timeAgo(d.lastSyncAt)}
                  </div>
                </div>
                <Button variant="ghost" size="icon" title="Sync">
                  <RefreshCw className="h-4 w-4 text-muted-foreground" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Manual sync note */}
      {!loading && !error && devices.length > 0 && (
        <p className="text-xs text-center text-muted-foreground">
          Automatic sync happens when you open the app after connecting your device via HealthGuard.
        </p>
      )}
    </div>
  );
}
