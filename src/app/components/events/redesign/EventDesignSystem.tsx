import React from "react";
import { Sparkles, X } from "lucide-react";

// Colors defined by spec & app theme
export const EVENT_COLORS = {
  primary: "#4F46E5",     // Signature Indigo
  primaryHover: "#4338CA",
  primaryLight: "rgba(79, 70, 229, 0.12)",
  secondary: "#7C3AED",   // Violet / Purple
  secondaryLight: "rgba(124, 58, 237, 0.12)",
  accent: "#FF6B00",      // Warm Amber Accent
  success: "#16A34A",     // Emerald Green
  warning: "#F59E0B",     // Amber
  danger: "#EF4444",      // Rose Red
  info: "#2563EB",        // Royal Blue
  bgLight: "#F8FAFC",     // Light slate
  bgDark: "#0F172A",      // Dark slate
  cardLight: "rgba(255, 255, 255, 0.85)",
  cardDark: "rgba(30, 41, 59, 0.85)",
};

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  isDark?: boolean;
  hoverScale?: boolean;
  gradientBorder?: boolean;
  onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = "",
  isDark = false,
  hoverScale = true,
  gradientBorder = false,
  onClick,
  style,
  ...props
}) => {
  return (
    <div
      onClick={onClick}
      style={{
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderRadius: "20px",
        background: isDark
          ? "rgba(30, 41, 59, 0.75)"
          : "rgba(255, 255, 255, 0.85)",
        border: gradientBorder
          ? "1px solid transparent"
          : isDark
          ? "1px solid rgba(255, 255, 255, 0.08)"
          : "1px solid rgba(79, 70, 229, 0.12)",
        boxShadow: isDark
          ? "0 10px 30px -10px rgba(0, 0, 0, 0.5)"
          : "0 10px 30px -10px rgba(79, 70, 229, 0.08)",
        ...style,
      }}
      className={`transition-all duration-300 ${
        hoverScale ? "hover:-translate-y-1 hover:shadow-xl cursor-pointer" : ""
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

interface TouchButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "glass" | "danger";
  size?: "sm" | "md" | "lg";
  icon?: React.ElementType;
  isDark?: boolean;
  fullWidth?: boolean;
}

export const TouchButton: React.FC<TouchButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  icon: Icon,
  isDark = false,
  fullWidth = false,
  className = "",
  disabled,
  ...props
}) => {
  const sizeStyles = {
    sm: "h-10 px-4 text-xs font-semibold rounded-xl gap-1.5",
    md: "h-12 px-5 text-sm font-bold rounded-2xl gap-2",
    lg: "h-14 px-7 text-base font-bold rounded-2xl gap-2.5",
  };

  const getVariantStyles = () => {
    switch (variant) {
      case "primary":
        return {
          background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
          color: "#FFFFFF",
          boxShadow: "0 6px 20px -4px rgba(79, 70, 229, 0.4)",
          border: "none",
        };
      case "secondary":
        return {
          background: "linear-gradient(135deg, #7C3AED 0%, #9333EA 100%)",
          color: "#FFFFFF",
          boxShadow: "0 6px 20px -4px rgba(124, 58, 237, 0.4)",
          border: "none",
        };
      case "outline":
        return {
          background: "transparent",
          color: isDark ? "#F8FAFC" : "#4F46E5",
          border: `1.5px solid ${isDark ? "rgba(255, 255, 255, 0.2)" : "#4F46E5"}`,
        };
      case "glass":
        return {
          background: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(79, 70, 229, 0.08)",
          color: isDark ? "#F8FAFC" : "#1E293B",
          border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(79, 70, 229, 0.2)"}`,
          backdropFilter: "blur(12px)",
        };
      case "danger":
        return {
          background: "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)",
          color: "#FFFFFF",
          boxShadow: "0 6px 20px -4px rgba(239, 68, 68, 0.4)",
          border: "none",
        };
      case "ghost":
      default:
        return {
          background: "transparent",
          color: isDark ? "#CBD5E1" : "#475569",
          border: "none",
        };
    }
  };

  return (
    <button
      disabled={disabled}
      style={{
        ...getVariantStyles(),
        minHeight: "48px", // Mobile touch target spec min 48px
      }}
      className={`inline-flex items-center justify-center transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer ${
        fullWidth ? "w-full" : ""
      } ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {Icon && <Icon className={size === "sm" ? "w-4 h-4" : size === "lg" ? "w-6 h-6" : "w-5 h-5"} />}
      <span>{children}</span>
    </button>
  );
};

interface StatusChipProps {
  status: "live" | "upcoming" | "completed" | "pending" | "warning" | string;
  isDark?: boolean;
  label?: string;
}

export const StatusChip: React.FC<StatusChipProps> = ({ status, isDark = false, label }) => {
  const norm = status.toLowerCase();

  let bg = "rgba(79, 70, 229, 0.15)";
  let text = "#4F46E5";
  let border = "rgba(79, 70, 229, 0.3)";
  let dotColor = "#4F46E5";
  let pulse = false;

  if (norm.includes("live") || norm.includes("active") || norm.includes("open")) {
    bg = "rgba(22, 163, 74, 0.15)";
    text = isDark ? "#4ADE80" : "#16A34A";
    border = "rgba(22, 163, 74, 0.3)";
    dotColor = "#22C55E";
    pulse = true;
  } else if (norm.includes("upcoming") || norm.includes("on track") || norm.includes("ready")) {
    bg = "rgba(255, 107, 0, 0.15)";
    text = isDark ? "#FF9D42" : "#FF6B00";
    border = "rgba(255, 107, 0, 0.3)";
    dotColor = "#FF6B00";
  } else if (norm.includes("pending") || norm.includes("planning") || norm.includes("draft")) {
    bg = "rgba(245, 158, 11, 0.15)";
    text = isDark ? "#FBBF24" : "#D97706";
    border = "rgba(245, 158, 11, 0.3)";
    dotColor = "#F59E0B";
  } else if (norm.includes("completed") || norm.includes("closed") || norm.includes("past")) {
    bg = "rgba(100, 116, 139, 0.15)";
    text = isDark ? "#94A3B8" : "#64748B";
    border = "rgba(100, 116, 139, 0.3)";
    dotColor = "#64748B";
  } else if (norm.includes("danger") || norm.includes("urgent") || norm.includes("high")) {
    bg = "rgba(239, 68, 68, 0.15)";
    text = isDark ? "#F87171" : "#EF4444";
    border = "rgba(239, 68, 68, 0.3)";
    dotColor = "#EF4444";
    pulse = true;
  }

  return (
    <span
      style={{
        backgroundColor: bg,
        color: text,
        border: `1px solid ${border}`,
      }}
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap shadow-xs"
    >
      <span
        style={{ backgroundColor: dotColor }}
        className={`w-2 h-2 rounded-full ${pulse ? "animate-ping opacity-75" : ""}`}
      />
      <span>{label || status.toUpperCase()}</span>
    </span>
  );
};

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  isDark?: boolean;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  isDark = false,
}) => {
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs transition-opacity duration-300 animate-fadeIn">
      {/* Backdrop click */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Sheet Container */}
      <div
        style={{
          background: isDark ? "#0F172A" : "#FFFFFF",
          borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 107, 0, 0.15)",
        }}
        className="relative z-10 w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-t-[32px] p-6 shadow-2xl border-t transition-transform duration-300 animate-slideUp hide-scrollbar"
      >
        {/* Handle Bar */}
        <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-4 cursor-pointer" onClick={onClose} />

        {/* Header */}
        {(title || subtitle) && (
          <div className="flex items-start justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              {title && (
                <h3 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#FF6B00]" />
                  {title}
                </h3>
              )}
              {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Body Content */}
        <div>{children}</div>
      </div>
    </div>
  );
};

export const SkeletonLoader: React.FC<{ isDark?: boolean; height?: string }> = ({
  isDark = false,
  height = "h-24",
}) => {
  return (
    <div
      className={`w-full ${height} rounded-2xl animate-pulse ${
        isDark ? "bg-slate-800/80" : "bg-slate-200/80"
      } my-2`}
    />
  );
};
