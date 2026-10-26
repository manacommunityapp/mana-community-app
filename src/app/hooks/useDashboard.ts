import { useState, useEffect, useCallback, useRef } from "react";
import { feedService, type DashboardStatItem } from "../../services/community/feedService";

interface DashboardCache {
  data: DashboardStatItem[];
  timestamp: number;
}

// Module-level cache with 30-second TTL
let dashboardCache: DashboardCache | null = null;
const CACHE_TTL_MS = 30 * 1000;

export function useDashboard() {
  const [stats, setStats] = useState<DashboardStatItem[]>(() => {
    if (dashboardCache && Date.now() - dashboardCache.timestamp < CACHE_TTL_MS) {
      return dashboardCache.data;
    }
    return [];
  });
  const [loading, setLoading] = useState<boolean>(() => {
    return !(dashboardCache && Date.now() - dashboardCache.timestamp < CACHE_TTL_MS);
  });
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchStats = useCallback(async (ignoreCache = false) => {
    if (!ignoreCache && dashboardCache && Date.now() - dashboardCache.timestamp < CACHE_TTL_MS) {
      setStats(dashboardCache.data);
      setLoading(false);
      setError(null);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const res = await feedService.getDashboardStats();
      if (!controller.signal.aborted) {
        const fetchedStats = res.stats || [];
        dashboardCache = {
          data: fetchedStats,
          timestamp: Date.now(),
        };
        setStats(fetchedStats);
      }
    } catch (err: any) {
      if (!controller.signal.aborted) {
        setError(err?.message || "Failed to load dashboard statistics.");
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchStats();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchStats]);

  const retry = useCallback(() => {
    fetchStats(true);
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    retry,
  };
}
