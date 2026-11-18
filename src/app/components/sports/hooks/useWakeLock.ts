import { useEffect, useRef, useState, useCallback } from "react";

export function useWakeLock(enabled: boolean = true) {
  const sentinelRef = useRef<any>(null);
  const [isLocked, setIsLocked] = useState(false);

  const requestLock = useCallback(async () => {
    if (!enabled || typeof navigator === "undefined" || !("wakeLock" in navigator)) {
      return;
    }
    try {
      sentinelRef.current = await (navigator as any).wakeLock.request("screen");
      setIsLocked(true);
      sentinelRef.current.addEventListener("release", () => {
        setIsLocked(false);
      });
    } catch {
      setIsLocked(false);
    }
  }, [enabled]);

  const releaseLock = useCallback(async () => {
    if (sentinelRef.current) {
      try {
        await sentinelRef.current.release();
      } catch {}
      sentinelRef.current = null;
    }
    setIsLocked(false);
  }, []);

  useEffect(() => {
    if (!enabled) {
      releaseLock();
      return;
    }

    requestLock();

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        requestLock();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      releaseLock();
    };
  }, [enabled, requestLock, releaseLock]);

  return { isLocked };
}
