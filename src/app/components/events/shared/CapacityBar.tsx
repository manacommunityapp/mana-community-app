interface CapacityBarProps {
  current: number;
  total: number;
  showLabel?: boolean;
  size?: "xs" | "sm" | "md";
  className?: string;
}

const HEIGHT = { xs: "h-1", sm: "h-1.5", md: "h-2" } as const;

function barColor(pct: number) {
  if (pct >= 90) return "bg-rose-500";
  if (pct >= 70) return "bg-amber-400";
  return "bg-emerald-500";
}

export function CapacityBar({ current, total, showLabel = false, size = "sm", className = "" }: CapacityBarProps) {
  const pct = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
  return (
    <div className={className}>
      <div className={`w-full ${HEIGHT[size]} bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden`}>
        <div
          className={`${HEIGHT[size]} rounded-full transition-all ${barColor(pct)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <p className="text-[10px] text-slate-400 mt-0.5">{current} / {total} ({pct}%)</p>
      )}
    </div>
  );
}
