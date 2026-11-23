import React, { useId, forwardRef } from "react";
import { AlertCircle } from "lucide-react";

export interface ManaCheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: React.ReactNode;
  description?: React.ReactNode;
  error?: string | { message?: string };
  containerClassName?: string;
}

export const ManaCheckbox = forwardRef<HTMLInputElement, ManaCheckboxProps>(
  (
    {
      id,
      label,
      description,
      error,
      disabled,
      required,
      className = "",
      containerClassName = "",
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const checkboxId = id || generatedId;
    const errorId = `${checkboxId}-error`;
    const descId = `${checkboxId}-desc`;

    const errorMessage = typeof error === "string" ? error : error?.message;
    const hasError = Boolean(errorMessage);

    const describedBy = [
      hasError ? errorId : null,
      description ? descId : null,
    ]
      .filter(Boolean)
      .join(" ") || undefined;

    return (
      <div className={`flex flex-col space-y-1 ${containerClassName}`}>
        <div className="flex items-start gap-3">
          <input
            ref={ref}
            type="checkbox"
            id={checkboxId}
            disabled={disabled}
            required={required}
            aria-invalid={hasError ? "true" : "false"}
            aria-describedby={describedBy}
            className={`mt-0.5 h-4 w-4 rounded-md border transition-colors outline-none cursor-pointer ${
              hasError
                ? "border-red-400 text-red-600 focus:ring-red-500/20"
                : "border-slate-300 text-emerald-600 focus:ring-emerald-500/20 dark:border-slate-700"
            } ${
              disabled
                ? "bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200"
                : ""
            } ${className}`}
            {...props}
          />

          <div className="flex flex-col text-xs">
            <label
              htmlFor={checkboxId}
              className={`font-semibold cursor-pointer select-none ${
                disabled
                  ? "text-slate-400 cursor-not-allowed"
                  : "text-slate-800 dark:text-slate-200"
              }`}
            >
              {label}
              {required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
            </label>

            {description && (
              <p
                id={descId}
                className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5"
              >
                {description}
              </p>
            )}
          </div>
        </div>

        {hasError && (
          <p
            id={errorId}
            role="alert"
            className="flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400 pl-7"
          >
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{errorMessage}</span>
          </p>
        )}
      </div>
    );
  }
);

ManaCheckbox.displayName = "ManaCheckbox";
