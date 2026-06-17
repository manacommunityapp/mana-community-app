import { useCallback, useEffect, useRef, useState } from "react";
import { safeStorage } from "../utils/storage";

/** Activity events that count as the user being "present". */
const ACTIVITY_EVENTS: Array<keyof WindowEventMap> = [
  "mousemove",
  "mousedown",
  "keydown",
  "touchstart",
  "scroll",
  "click",
  "focus",
];

const LAST_ACTIVITY_KEY = "mana_last_activity";

export interface UseIdleTimeoutOptions {
  /** When false, the timer is disabled (e.g. user not logged in). */
  enabled: boolean;
  /** Idle ms after which {@link onWarn} fires (default 25 min). */
  warnAfterMs?: number;
  /** Idle ms after which {@link onTimeout} fires (default 30 min). */
  logoutAfterMs?: number;
  /** Fired once when crossing the warn threshold. */
  onWarn: () => void;
  /** Fired when crossing the logout threshold. */
  onTimeout: () => void;
}

export interface UseIdleTimeoutResult {
  /** Seconds remaining until logout, valid while the warning is showing. */
  secondsLeft: number;
  /** Reset the idle timer (e.g. when the user clicks "Stay logged in"). */
  reset: () => void;
}

/**
 * Tracks user inactivity and fires a warning then a logout. Activity across any
 * tab is shared via {@code localStorage} so the session is consistent app-wide,
 * and a stale {@code lastActivity} from a previously-closed tab triggers an
 * immediate logout on the next load (covers the "browser closed" case safely
 * without a destructive {@code beforeunload} that would break a simple refresh).
 */
export function useIdleTimeout(options: UseIdleTimeoutOptions): UseIdleTimeoutResult {
  const {
    enabled,
    warnAfterMs = 25 * 60 * 1000,
    logoutAfterMs = 30 * 60 * 1000,
    onWarn,
    onTimeout,
  } = options;

  const [secondsLeft, setSecondsLeft] = useState(0);
  const warnedRef = useRef(false);
  const lastActivityRef = useRef<number>(Date.now());

  // Keep the latest callbacks without re-subscribing the interval/listeners.
  const onWarnRef = useRef(onWarn);
  const onTimeoutRef = useRef(onTimeout);
  onWarnRef.current = onWarn;
  onTimeoutRef.current = onTimeout;

  const markActivity = useCallback(() => {
    const now = Date.now();
    lastActivityRef.current = now;
    safeStorage.setItem(LAST_ACTIVITY_KEY, String(now));
  }, []);

  const reset = useCallback(() => {
    warnedRef.current = false;
    setSecondsLeft(0);
    markActivity();
  }, [markActivity]);

  useEffect(() => {
    if (!enabled) return;

    // Seed from shared storage so all tabs agree on the last activity time.
    const stored = Number(safeStorage.getItem(LAST_ACTIVITY_KEY));
    lastActivityRef.current = Number.isFinite(stored) && stored > 0 ? stored : Date.now();

    // If the session has already been idle past the limit (e.g. tab reopened
    // hours later), log out right away rather than granting a fresh window.
    if (Date.now() - lastActivityRef.current >= logoutAfterMs) {
      onTimeoutRef.current();
      return;
    }

    const onActivity = () => {
      // Don't let activity dismiss an active warning automatically — the user
      // must explicitly choose "Stay logged in". Only refresh while not warned.
      if (!warnedRef.current) markActivity();
    };

    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, onActivity, { passive: true }));

    const interval = window.setInterval(() => {
      const idle = Date.now() - lastActivityRef.current;
      if (idle >= logoutAfterMs) {
        onTimeoutRef.current();
        return;
      }
      if (idle >= warnAfterMs) {
        if (!warnedRef.current) {
          warnedRef.current = true;
          onWarnRef.current();
        }
        setSecondsLeft(Math.max(0, Math.ceil((logoutAfterMs - idle) / 1000)));
      }
    }, 1000);

    return () => {
      ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, onActivity));
      window.clearInterval(interval);
    };
  }, [enabled, warnAfterMs, logoutAfterMs, markActivity]);

  return { secondsLeft, reset };
}
