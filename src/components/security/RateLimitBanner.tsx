import { ShieldAlert, Clock } from 'lucide-react';

interface RateLimitBannerProps {
  secondsRemaining: number;
  type?: string;
  initialSeconds?: number;
}

export function RateLimitBanner({ secondsRemaining, type, initialSeconds = 60 }: RateLimitBannerProps) {
  const isLogin = type === 'LOGIN';
  const progress = Math.max(0, (secondsRemaining / initialSeconds) * 100);

  return (
    <div className="rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/30 p-3 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-start gap-2.5">
        <div className="flex-shrink-0 p-1.5 bg-amber-100 dark:bg-amber-900/40 rounded-lg">
          <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-xs font-bold text-amber-800 dark:text-amber-300 mb-0.5">
            {isLogin ? 'Too many login attempts' : 'Too many attempts'}
          </h3>
          <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80 leading-relaxed mb-2">
            {isLogin
              ? 'For your security, login has been temporarily locked.'
              : 'Please wait before trying again.'}
            {' '}Try again in <strong>{secondsRemaining}s</strong>.
          </p>
          {isLogin && (
            <p className="text-[10px] text-amber-600/70 dark:text-amber-500/70">
              If you did not make these attempts, consider changing your password.
            </p>
          )}
          {/* Draining progress bar */}
          <div className="mt-2 h-1 w-full bg-amber-200/60 dark:bg-amber-800/40 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 dark:bg-amber-400 rounded-full transition-[width] duration-1000 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <div className="flex-shrink-0 flex items-center gap-1 text-amber-600 dark:text-amber-400">
          <Clock className="w-3.5 h-3.5" />
          <span className="text-xs font-bold tabular-nums">{secondsRemaining}s</span>
        </div>
      </div>
    </div>
  );
}
