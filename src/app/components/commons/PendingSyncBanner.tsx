import { WifiOff } from 'lucide-react';
import { useRequestQueue } from '../../../hooks/useRequestQueue';

export function PendingSyncBanner() {
  const { pendingCount, isSyncing } = useRequestQueue();

  if (pendingCount === 0 && !isSyncing) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 bg-amber-500/90 text-white text-sm font-medium rounded-full shadow-lg backdrop-blur-sm">
      <WifiOff className="w-4 h-4 shrink-0" />
      {isSyncing
        ? 'Syncing pending requests…'
        : `${pendingCount} request${pendingCount === 1 ? '' : 's'} pending sync`}
    </div>
  );
}
