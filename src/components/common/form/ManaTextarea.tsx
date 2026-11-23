import React, { useId, forwardRef } from "react";
import { AlertCircle } from "lucide-react";

export interface ManaTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: React.ReactNode;
  error?: string | { message?: string };
  helperText?: React.ReactNode;
  showCount?: boolean;
  containerClassName?: string;
}

export const ManaTextarea = forwardRef<HTMLTextAreaElement, ManaTextareaProps>(
  (
    {
      id,
      label,
      error,
      helperText,
      required,
      disabled,
      maxLength,
      showCount = false,
      value,
      className = "",
      containerClassName = "",
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const textareaId = id || generatedId;
    const errorId = `${textareaId}-error`;
    const helperId = `${textareaId}-helper`;

    const errorMessage = typeof error === "string" ? error : error?.message;
    const hasError = Boolean(errorMessage);

    const describedBy = [
      hasError ? errorId : null,
      helperText ? helperId : null,
    ]
      .filter(Boolean)
      .join(" ") || undefined;

    const currentLength = typeof value === "string" ? value.length : 0;

    return (
      <div className={`flex flex-col space-y-1.5 ${containerClassName}`}>
        <div className="flex items-center justify-between">
          {label && (
            <label
              htmlFor={textareaId}
              className="text-xs font-semibold text-slate-700 dark:text-slate-200"
            >
              {label}
              {required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
            </label>
          )}

          {showCount && maxLength && (
            <span className="text-[11px] text-slate-400">
              {currentLength}/{maxLength}
            </span>
          )}
        </div>

        <textarea
          ref={ref}
          id={textareaId}
          disabled={disabled}
          required={required}
          maxLength={maxLength}
          value={value}
          aria-invalid={hasError ? "true" : "false"}
          aria-describedby={describedBy}
          className={`w-full min-h-[96px] rounded-xl border text-sm transition-all outline-none p-3.5 ${
            hasError
              ? "border-red-400 bg-red-50/30 text-red-900 focus:border-red-500 focus:ring-4 focus:ring-red-500/15"
              : "border-slate-200 bg-white text-slate-900 hover:border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
          } ${
            disabled
              ? "bg-slate-100 dark:bg-slate-800/60 text-slate-400 border-slate-200 cursor-not-allowed select-none"
              : ""
          } ${className}`}
          {...props}
        />

        {hasError && (
          <p
            id={errorId}
            role="alert"
            className="flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400 mt-1"
          >
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{errorMessage}</span>
          </p>
        )}

        {!hasError && helperText && (
          <p
            id={helperId}
            className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

ManaTextarea.displayName = "ManaTextarea";
