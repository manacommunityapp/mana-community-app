import { useState, useEffect, useCallback, useRef } from "react";
import { feedService, type CursorFeedItem } from "../../services/community/feedService";

interface UseInfiniteFeedOptions {
  limit?: number;
  rootMargin?: string;
}

export function useInfiniteFeed(options: UseInfiniteFeedOptions = {}) {
  const { limit = 20, rootMargin = "600px 0px" } = options;

  const [items, setItems] = useState<CursorFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // Critical refs to prevent race conditions and stale closure loops
  const cursorRef = useRef<string | null>(null);
  const isFetchingRef = useRef<boolean>(false);
  const hasMoreRef = useRef<boolean>(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const fetchPage = useCallback(async (isInitial = false) => {
    if (isFetchingRef.current) return;
    if (!isInitial && !hasMoreRef.current) return;

    isFetchingRef.current = true;
    if (isInitial) {
      setLoading(true);
      cursorRef.current = null;
      hasMoreRef.current = true;
      setHasMore(true);
    } else {
      setLoadingMore(true);
    }
    setError(null);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const currentCursor = isInitial ? null : cursorRef.current;
      const res = await feedService.getCursorFeed(currentCursor, limit);

      if (!controller.signal.aborted) {
        const newItems = res.items || [];
        setItems((prev) => (isInitial ? newItems : [...prev, ...newItems]));

        cursorRef.current = res.nextCursor;
        const moreAvailable = Boolean(res.nextCursor);
        hasMoreRef.current = moreAvailable;
        setHasMore(moreAvailable);
      }
    } catch (err: any) {
      if (!controller.signal.aborted) {
        setError(err?.message || "Failed to load feed items.");
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
        setLoadingMore(false);
        isFetchingRef.current = false;
      }
    }
  }, [limit]);

  // Initial load
  useEffect(() => {
    fetchPage(true);
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchPage]);

  // IntersectionObserver for prefetching near bottom
  useEffect(() => {
    const sentinelEl = sentinelRef.current;
    if (!sentinelEl) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && !isFetchingRef.current && hasMoreRef.current) {
          fetchPage(false);
        }
      },
      {
        root: null,
        rootMargin,
        threshold: 0.1,
      }
    );

    observer.observe(sentinelEl);

    return () => {
      observer.disconnect();
    };
  }, [fetchPage, rootMargin]);

  const refresh = useCallback(() => {
    fetchPage(true);
  }, [fetchPage]);

  const retry = useCallback(() => {
    if (items.length === 0) {
      fetchPage(true);
    } else {
      fetchPage(false);
    }
  }, [fetchPage, items.length]);

  return {
    items,
    loading,
    loadingMore,
    error,
    hasMore,
    sentinelRef,
    refresh,
    retry,
  };
}
