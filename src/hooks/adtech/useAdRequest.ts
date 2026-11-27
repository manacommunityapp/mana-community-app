import { useState, useEffect, useCallback, useRef } from 'react';
import { requestAd } from '../../services/adtech/adCampaignService';
import type { AdResponse } from '../../types/adtech';

interface UseAdRequestParams {
  placementId: string;
  userId: string;
  societyId: string;
  city: string;
  flatType: string;
  enabled?: boolean;
}

interface UseAdRequestResult {
  ad: AdResponse | null;
  loading: boolean;
  error: Error | null;
  impressionId: string | null;
  refetch: () => void;
}

export function useAdRequest({
  placementId,
  userId,
  societyId,
  city,
  flatType,
  enabled = true,
}: UseAdRequestParams): UseAdRequestResult {
  const [ad, setAd] = useState<AdResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [impressionId, setImpressionId] = useState<string | null>(null);
  const pacingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fetchCountRef = useRef(0);

  const fetch = useCallback(async () => {
    if (!enabled) return;

    // Cancel any pending pacing timer from a previous fetch
    if (pacingTimerRef.current !== null) {
      clearTimeout(pacingTimerRef.current);
      pacingTimerRef.current = null;
    }

    const fetchId = ++fetchCountRef.current;

    setLoading(true);
    setError(null);
    setAd(null);
    setImpressionId(null);

    try {
      const response = await requestAd({
        placementId,
        userId,
        societyId,
        city,
        flatType,
      });

      // Guard against stale responses if refetch was called again
      if (fetchId !== fetchCountRef.current) return;

      if (!response) {
        setAd(null);
        setLoading(false);
        return;
      }

      const newImpressionId = crypto.randomUUID();
      const delay = response.budgetPacingDelayMs ?? 0;

      if (delay > 0) {
        pacingTimerRef.current = setTimeout(() => {
          if (fetchId !== fetchCountRef.current) return;
          setAd(response);
          setImpressionId(newImpressionId);
          setLoading(false);
          pacingTimerRef.current = null;
        }, delay);
      } else {
        setAd(response);
        setImpressionId(newImpressionId);
        setLoading(false);
      }
    } catch (err) {
      if (fetchId !== fetchCountRef.current) return;
      setError(err instanceof Error ? err : new Error('Failed to load ad'));
      setLoading(false);
    }
  }, [placementId, userId, societyId, city, flatType, enabled]);

  useEffect(() => {
    if (enabled) {
      fetch();
    }
    return () => {
      if (pacingTimerRef.current !== null) {
        clearTimeout(pacingTimerRef.current);
      }
    };
  }, [fetch, enabled]);

  return { ad, loading, error, impressionId, refetch: fetch };
}
