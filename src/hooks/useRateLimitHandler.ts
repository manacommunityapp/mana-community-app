import { useState, useEffect, useCallback } from 'react';
import { ApiError } from '../services/common/apiTypes';

interface RateLimitState {
  isLimited: boolean;
  secondsRemaining: number;
  type: string;
}

function extractRetryAfter(error: ApiError): number | undefined {
  // Try to parse retryAfterSeconds from the error message (backend sends JSON in message)
  try {
    const parsed = JSON.parse(error.message);
    if (typeof parsed?.retryAfterSeconds === 'number') return parsed.retryAfterSeconds;
  } catch {
    // not JSON — try regex
  }
  const match = error.message.match(/retry[_\s]?after[_\s]?seconds["\s:]+(\d+)/i);
  if (match) return parseInt(match[1], 10);
  return undefined;
}

function extractType(error: ApiError): string | undefined {
  try {
    const parsed = JSON.parse(error.message);
    if (typeof parsed?.type === 'string') return parsed.type;
  } catch {
    // ignore
  }
  return undefined;
}

export function useRateLimitHandler() {
  const [rateLimitState, setRateLimitState] = useState<RateLimitState | null>(null);

  useEffect(() => {
    if (!rateLimitState?.isLimited || rateLimitState.secondsRemaining <= 0) return;
    const timer = setInterval(() => {
      setRateLimitState(prev =>
        prev && prev.secondsRemaining > 1
          ? { ...prev, secondsRemaining: prev.secondsRemaining - 1 }
          : null
      );
    }, 1000);
    return () => clearInterval(timer);
  }, [rateLimitState?.isLimited, rateLimitState?.secondsRemaining]);

  const handleError = useCallback((error: unknown): boolean => {
    if (error instanceof ApiError && error.statusCode === 429) {
      const seconds = extractRetryAfter(error) ?? 60;
      const type = extractType(error) ?? 'REQUEST';
      setRateLimitState({ isLimited: true, secondsRemaining: seconds, type });
      return true;
    }
    return false;
  }, []);

  return {
    rateLimitState,
    handleError,
    isLimited: !!rateLimitState?.isLimited,
  };
}
