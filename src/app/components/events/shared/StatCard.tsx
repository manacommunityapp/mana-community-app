import type { ReactNode } from "react";

type Color = "indigo" | "violet" | "emerald" | "amber" | "rose" | "sky" | "orange" | "teal";

const COLOR_MAP: Record<Color, { icon: string; text: string; bg: string }> = {
  indigo:  { icon: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400",  text: "text-indigo-700 dark:text-indigo-300",  bg: "bg-indigo-50 dark:bg-indigo-900/20"  },
  violet:  { icon: "bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400",  text: "text-violet-700 dark:text-violet-300",  bg: "bg-violet-50 dark:bg-violet-900/20"  },
  emerald: { icon: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400", text: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
  amber:   { icon: "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400",    text: "text-amber-700 dark:text-amber-300",    bg: "bg-amber-50 dark:bg-amber-900/20"    },
  rose:    { icon: "bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400",        text: "text-rose-700 dark:text-rose-300",        bg: "bg-rose-50 dark:bg-rose-900/20"      },
  sky:     { icon: "bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-400",            text: "text-sky-700 dark:text-sky-300",            bg: "bg-sky-50 dark:bg-sky-900/20"        },
  orange:  { icon: "bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400", text: "text-orange-700 dark:text-orange-300",  bg: "bg-orange-50 dark:bg-orange-900/20"  },
  teal:    { icon: "bg-teal-100 text-teal-600 dark:bg-teal-900/40 dark:text-teal-400",        text: "text-teal-700 dark:text-teal-300",      bg: "bg-teal-50 dark:bg-teal-900/20"      },
};

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color?: Color;
  loading?: boolean;
  className?: string;
}

export function StatCard({ icon, label, value, sub, color = "indigo", loading, className = "" }: StatCardProps) {
  const c = COLOR_MAP[color];
  return (
    <div className={`${c.bg} rounded-xl p-4 flex items-center gap-3 ${className}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${c.icon}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">{label}</p>
        {loading ? (
          <div className="h-5 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mt-0.5" />
        ) : (
          <p className={`text-lg font-bold leading-tight ${c.text}`}>{value}</p>
        )}
        {sub && <p className="text-[10px] text-slate-400 truncate mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

/** 2-col mobile / 4-col sm grid wrapper for stat cards */
export function StatGrid({ children, cols = 4, className = "" }: {
  children: ReactNode; cols?: 2 | 3 | 4; className?: string;
}) {
  const colClass = { 2: "grid-cols-2", 3: "grid-cols-2 sm:grid-cols-3", 4: "grid-cols-2 sm:grid-cols-4" }[cols];
  return <div className={`grid ${colClass} gap-3 ${className}`}>{children}</div>;
}
