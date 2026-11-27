import React, { useId, forwardRef } from "react";
import { AlertCircle } from "lucide-react";

export interface ManaInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
  error?: string | { message?: string };
  helperText?: React.ReactNode;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  containerClassName?: string;
}

export const ManaInput = forwardRef<HTMLInputElement, ManaInputProps>(
  (
    {
      id,
      label,
      error,
      helperText,
      required,
      disabled,
      startIcon,
      endIcon,
      className = "",
      containerClassName = "",
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    const errorMessage = typeof error === "string" ? error : error?.message;
    const hasError = Boolean(errorMessage);

    const describedBy = [
      hasError ? errorId : null,
      helperText ? helperId : null,
    ]
      .filter(Boolean)
      .join(" ") || undefined;

    return (
      <div className={`flex flex-col space-y-1.5 ${containerClassName}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-between"
          >
            <span>
              {label}
              {required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
            </span>
          </label>
        )}

        <div className="relative flex items-center">
          {startIcon && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400">
              {startIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            required={required}
            aria-invalid={hasError ? "true" : "false"}
            aria-describedby={describedBy}
            className={`w-full rounded-xl border text-sm transition-all outline-none py-2.5 ${
              startIcon ? "pl-10" : "pl-3.5"
            } ${endIcon ? "pr-10" : "pr-3.5"} ${
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

          {endIcon && (
            <div className="absolute right-3.5 flex items-center text-slate-400">
              {endIcon}
            </div>
          )}
        </div>

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

ManaInput.displayName = "ManaInput";
