import { Wifi, WifiOff, AlertTriangle, Loader2, ShieldOff, RefreshCw, CloudUpload } from 'lucide-react';
import { useWebSocketHealth } from '../../hooks/useWebSocketHealth';

const MESSAGES: Record<string, { icon: React.ReactNode; label: string; cls: string }> = {
  CONNECTED: {
    icon: <Wifi className="w-3.5 h-3.5" />,
    label: 'Live Sync',
    cls: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  },
  CONNECTING: {
    icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
    label: 'Connecting…',
    cls: 'text-amber-700 bg-amber-50 border-amber-200',
  },
  RECONNECTING: {
    icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
    label: 'Reconnecting…',
    cls: 'text-amber-700 bg-amber-50 border-amber-200',
  },
  RATE_LIMITED: {
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
    label: 'Too many connections',
    cls: 'text-orange-700 bg-orange-50 border-orange-200',
  },
  CONNECTION_LIMIT: {
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
    label: 'Connection limit reached',
    cls: 'text-red-700 bg-red-50 border-red-200',
  },
  UNAUTHORIZED: {
    icon: <ShieldOff className="w-3.5 h-3.5" />,
    label: 'Session expired',
    cls: 'text-red-700 bg-red-50 border-red-200',
  },
  DISCONNECTED: {
    icon: <WifiOff className="w-3.5 h-3.5" />,
    label: 'Offline',
    cls: 'text-slate-600 bg-slate-100 border-slate-200',
  },
  IDLE: {
    icon: <WifiOff className="w-3.5 h-3.5" />,
    label: 'Standby',
    cls: 'text-slate-600 bg-slate-100 border-slate-200',
  },
};

export function ConnectionStatusIndicator({ showWhenHealthy = false }: { showWhenHealthy?: boolean }) {
  const { state, networkType, reconnectAttempt, syncStatus, forceReconnect } = useWebSocketHealth();
  const config = MESSAGES[state] ?? MESSAGES.DISCONNECTED;

  const isHealthy = state === 'CONNECTED' && syncStatus.pendingMutations === 0 && syncStatus.phase !== 'RECONCILING';
  if (isHealthy && !showWhenHealthy) return null;

  const netLabel =
    networkType === 'cellular' ? '4G/5G' :
    networkType === 'wifi' ? 'Wi-Fi' :
    networkType === 'offline' ? 'No Net' : null;

  return (
    <div
      className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${config.cls}`}
      title={`WebSocket: ${state}${netLabel ? ` (${netLabel})` : ''}${syncStatus.lastSyncedAt ? ` · Synced: ${new Date(syncStatus.lastSyncedAt).toLocaleTimeString()}` : ''}`}
    >
      {syncStatus.phase === 'RECONCILING' ? (
        <>
          <RefreshCw className="w-3 h-3 animate-spin" />
          <span>Reconciling deltas…</span>
        </>
      ) : (
        <>
          {config.icon}
          <span>
            {config.label}
            {state === 'RECONNECTING' && reconnectAttempt > 0 ? ` (#${reconnectAttempt})` : ''}
          </span>
        </>
      )}

      {netLabel && (
        <span className="px-1.5 py-0.5 rounded bg-black/5 text-[9px] uppercase tracking-wider">
          {netLabel}
        </span>
      )}

      {syncStatus.pendingMutations > 0 && (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-800 text-[10px]">
          <CloudUpload className="w-2.5 h-2.5" />
          {syncStatus.pendingMutations} queued
        </span>
      )}

      {(state === 'DISCONNECTED' || state === 'RECONNECTING') && (
        <button
          type="button"
          onClick={forceReconnect}
          className="ml-1 underline hover:opacity-80 cursor-pointer text-[10px]"
          title="Force immediate WebSocket reconnect"
        >
          Retry
        </button>
      )}
    </div>
  );
}
