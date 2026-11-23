import React, { forwardRef, useState } from "react";
import { Loader2 } from "lucide-react";

export type ManaButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "danger"
  | "ghost";

export type ManaButtonSize = "sm" | "md" | "lg";

export interface ManaButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Explicit button type is required to prevent accidental form submit surprises. */
  type: "button" | "submit" | "reset";
  variant?: ManaButtonVariant;
  size?: ManaButtonSize;
  isLoading?: boolean;
  loadingText?: React.ReactNode;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  /** Automatically suppresses duplicate clicks within 500ms */
  preventDoubleClick?: boolean;
}

const variantStyles: Record<ManaButtonVariant, string> = {
  primary:
    "bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm shadow-emerald-700/20 active:bg-emerald-800 focus:ring-emerald-500/25",
  secondary:
    "bg-slate-800 hover:bg-slate-900 text-white font-bold shadow-sm active:bg-slate-950 focus:ring-slate-500/25 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white",
  outline:
    "bg-white hover:bg-slate-50 text-slate-700 font-semibold border border-slate-300 active:bg-slate-100 focus:ring-slate-400/20 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800",
  danger:
    "bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-sm active:bg-rose-800 focus:ring-rose-500/25",
  ghost:
    "bg-transparent hover:bg-slate-100 text-slate-700 font-medium active:bg-slate-200 focus:ring-slate-400/20 dark:text-slate-300 dark:hover:bg-slate-800",
};

const sizeStyles: Record<ManaButtonSize, string> = {
  sm: "text-xs px-3 py-1.5 rounded-lg gap-1.5",
  md: "text-sm px-4 py-2.5 rounded-xl gap-2",
  lg: "text-base px-5 py-3 rounded-2xl gap-2.5",
};

export const ManaButton = forwardRef<HTMLButtonElement, ManaButtonProps>(
  (
    {
      type,
      variant = "primary",
      size = "md",
      isLoading = false,
      loadingText,
      startIcon,
      endIcon,
      disabled,
      preventDoubleClick = true,
      onClick,
      className = "",
      children,
      ...props
    },
    ref
  ) => {
    const [isDebouncing, setIsDebouncing] = useState(false);

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (isLoading || disabled || isDebouncing) {
        e.preventDefault();
        return;
      }

      if (preventDoubleClick) {
        setIsDebouncing(true);
        setTimeout(() => setIsDebouncing(false), 500);
      }

      if (onClick) {
        onClick(e);
      }
    };

    const isDisabled = disabled || isLoading || isDebouncing;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={isLoading ? "true" : "false"}
        onClick={handleClick}
        className={`inline-flex items-center justify-center font-semibold transition-all outline-none focus:ring-4 cursor-pointer select-none ${
          variantStyles[variant]
        } ${sizeStyles[size]} ${
          isDisabled
            ? "opacity-60 cursor-not-allowed pointer-events-none"
            : "hover:scale-[1.01] active:scale-[0.99]"
        } ${className}`}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
            <span>{loadingText || children}</span>
          </>
        ) : (
          <>
            {startIcon && <span className="flex-shrink-0">{startIcon}</span>}
            <span>{children}</span>
            {endIcon && <span className="flex-shrink-0">{endIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

ManaButton.displayName = "ManaButton";
