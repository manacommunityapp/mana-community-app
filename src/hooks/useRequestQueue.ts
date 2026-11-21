import { useState, useEffect, useCallback } from 'react';
import { requestQueue, type QueuedRequest } from '../lib/requestQueue';

export function useRequestQueue() {
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  const refresh = useCallback(async () => {
    const all = await requestQueue.getAll();
    setPendingCount(all.length);
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 10_000);
    return () => clearInterval(interval);
  }, [refresh]);

  const enqueue = useCallback(
    async (req: Omit<QueuedRequest, 'id' | 'retryCount' | 'createdAt'>) => {
      const id = await requestQueue.enqueue(req);
      await refresh();
      return id;
    },
    [refresh],
  );

  const sync = useCallback(
    async (executor: (req: QueuedRequest) => Promise<void>) => {
      setIsSyncing(true);
      try {
        await requestQueue.processQueue(executor);
      } finally {
        setIsSyncing(false);
        await refresh();
      }
    },
    [refresh],
  );

  return { enqueue, pendingCount, isSyncing, isOnline, sync };
}
