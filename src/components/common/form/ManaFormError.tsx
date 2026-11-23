import React from "react";
import { AlertTriangle, RefreshCw, X } from "lucide-react";

export interface ManaFormErrorProps {
  error?: string | Error | { message?: string; correlationId?: string; error?: string } | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
  title?: string;
}

export const ManaFormError: React.FC<ManaFormErrorProps> = ({
  error,
  onRetry,
  onDismiss,
  className = "",
  title = "There was a problem with your request",
}) => {
  if (!error) return null;

  let message = "";
  let correlationId: string | undefined;

  if (typeof error === "string") {
    message = error;
  } else if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === "object") {
    message = error.message || error.error || "An unexpected error occurred.";
    correlationId = error.correlationId;
  }

  if (!message) return null;

  return (
    <div
      role="alert"
      className={`rounded-2xl border border-red-200 bg-red-50/80 p-4 text-red-900 shadow-sm dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200 ${className}`}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />

        <div className="flex-1 space-y-1">
          <h4 className="text-xs font-bold text-red-900 dark:text-red-200">
            {title}
          </h4>
          <p className="text-xs text-red-700 dark:text-red-300 leading-relaxed">
            {message}
          </p>

          {correlationId && (
            <p className="text-[10px] text-red-600/80 font-mono mt-1">
              Trace ID: {correlationId}
            </p>
          )}

          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-red-800 hover:text-red-950 underline mt-2"
            >
              <RefreshCw className="w-3 h-3" />
              Try again
            </button>
          )}
        </div>

        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss error"
            className="text-red-400 hover:text-red-600 dark:hover:text-red-300 p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
