import { Wifi, WifiOff, AlertTriangle, Loader2, ShieldOff } from 'lucide-react';
import { useWebSocketHealth } from '../../hooks/useWebSocketHealth';

const MESSAGES: Record<string, { icon: React.ReactNode; label: string; cls: string }> = {
  CONNECTED: {
    icon: <Wifi className="w-3.5 h-3.5" />,
    label: 'Live',
    cls: 'text-emerald-600 dark:text-emerald-400',
  },
  CONNECTING: {
    icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
    label: 'Connecting…',
    cls: 'text-amber-500',
  },
  RECONNECTING: {
    icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
    label: 'Reconnecting…',
    cls: 'text-amber-500',
  },
  RATE_LIMITED: {
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
    label: 'Too many connections',
    cls: 'text-orange-500',
  },
  CONNECTION_LIMIT: {
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
    label: 'Connection limit reached',
    cls: 'text-red-500',
  },
  UNAUTHORIZED: {
    icon: <ShieldOff className="w-3.5 h-3.5" />,
    label: 'Session expired',
    cls: 'text-red-500',
  },
  DISCONNECTED: {
    icon: <WifiOff className="w-3.5 h-3.5" />,
    label: 'Offline',
    cls: 'text-muted-foreground',
  },
  IDLE: {
    icon: <WifiOff className="w-3.5 h-3.5" />,
    label: 'Offline',
    cls: 'text-muted-foreground',
  },
};

export function ConnectionStatusIndicator() {
  const { state } = useWebSocketHealth();
  const config = MESSAGES[state] ?? MESSAGES.DISCONNECTED;

  if (state === 'CONNECTED') return null; // hide when healthy

  return (
    <div
      className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full bg-background/80 border border-border/60 ${config.cls}`}
      title={`WebSocket: ${state}`}
    >
      {config.icon}
      <span>{config.label}</span>
    </div>
  );
}
