import React, { useId, forwardRef } from "react";
import { AlertCircle, ChevronDown } from "lucide-react";

export interface ManaSelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface ManaSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: React.ReactNode;
  error?: string | { message?: string };
  helperText?: React.ReactNode;
  options?: ManaSelectOption[];
  containerClassName?: string;
  placeholder?: string;
}

export const ManaSelect = forwardRef<HTMLSelectElement, ManaSelectProps>(
  (
    {
      id,
      label,
      error,
      helperText,
      required,
      disabled,
      options,
      placeholder,
      className = "",
      containerClassName = "",
      children,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const selectId = id || generatedId;
    const errorId = `${selectId}-error`;
    const helperId = `${selectId}-helper`;

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
            htmlFor={selectId}
            className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-between"
          >
            <span>
              {label}
              {required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
            </span>
          </label>
        )}

        <div className="relative flex items-center">
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            required={required}
            aria-invalid={hasError ? "true" : "false"}
            aria-describedby={describedBy}
            className={`w-full appearance-none rounded-xl border text-sm transition-all outline-none py-2.5 pl-3.5 pr-10 ${
              hasError
                ? "border-red-400 bg-red-50/30 text-red-900 focus:border-red-500 focus:ring-4 focus:ring-red-500/15"
                : "border-slate-200 bg-white text-slate-900 hover:border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
            } ${
              disabled
                ? "bg-slate-100 dark:bg-slate-800/60 text-slate-400 border-slate-200 cursor-not-allowed select-none"
                : "cursor-pointer"
            } ${className}`}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options
              ? options.map((opt) => (
                  <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                    {opt.label}
                  </option>
                ))
              : children}
          </select>

          <div className="absolute right-3.5 pointer-events-none text-slate-400">
            <ChevronDown className="w-4 h-4" />
          </div>
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

ManaSelect.displayName = "ManaSelect";
