import { AlertCircle, RefreshCw } from "lucide-react";

interface ErrorBannerProps {
  message: string;
  variant?: "error" | "warning";
  onRetry?: () => void;
  className?: string;
}

export function ErrorBanner({ message, variant = "error", onRetry, className = "" }: ErrorBannerProps) {
  const styles = variant === "error"
    ? "bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-300"
    : "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-300";

  return (
    <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm ${styles} ${className}`}>
      <AlertCircle className="w-4 h-4 flex-shrink-0" />
      <span className="flex-1">{message}</span>
      {onRetry && (
        <button onClick={onRetry}
          className="flex items-center gap-1 text-xs font-semibold underline-offset-2 hover:underline ml-2 flex-shrink-0">
          <RefreshCw className="w-3 h-3" /> Retry
        </button>
      )}
    </div>
  );
}
