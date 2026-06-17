import { useCallback, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { useIdleTimeout } from "../../../hooks/useIdleTimeout";
import { userService } from "../../../services/userService";

// Policy: warn at 25 min idle, auto-logout at 30 min idle.
const WARN_AFTER_MS = 25 * 60 * 1000;
const LOGOUT_AFTER_MS = 30 * 60 * 1000;

function formatCountdown(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Watches for inactivity while a user is logged in. At 25 minutes idle it shows
 * a warning with a live countdown; at 30 minutes it logs the user out. Mount it
 * once, inside both the auth provider and the router.
 */
export function SessionTimeoutManager() {
  const { isAuthenticated, logout } = useAuth();
  const [showWarning, setShowWarning] = useState(false);

  const handleTimeout = useCallback(() => {
    setShowWarning(false);
    logout();
  }, [logout]);

  const { secondsLeft, reset } = useIdleTimeout({
    enabled: isAuthenticated,
    warnAfterMs: WARN_AFTER_MS,
    logoutAfterMs: LOGOUT_AFTER_MS,
    onWarn: () => setShowWarning(true),
    onTimeout: handleTimeout,
  });

  const stayLoggedIn = useCallback(() => {
    setShowWarning(false);
    reset();
    // Touch a protected endpoint so the access token is refreshed if needed,
    // keeping the session genuinely alive (not just the idle timer).
    void userService.getMe().catch(() => {
      /* a refresh failure will surface as a 401 on the next real request */
    });
  }, [reset]);

  if (!isAuthenticated || !showWarning) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-timeout-title"
    >
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="inline-flex items-center justify-center rounded-full bg-amber-100 p-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <h2 id="session-timeout-title" className="text-lg font-semibold text-foreground">
            Session expiring
          </h2>
        </div>

        <p className="text-sm text-muted-foreground">
          You&apos;ve been inactive for a while. For your security, you&apos;ll be logged out in{" "}
          <span className="font-semibold text-foreground tabular-nums">
            {formatCountdown(secondsLeft)}
          </span>
          .
        </p>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={stayLoggedIn}
            className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
          >
            Stay logged in
          </button>
          <button
            type="button"
            onClick={handleTimeout}
            className="flex-1 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
          >
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}
