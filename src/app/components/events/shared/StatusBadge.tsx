type BadgeVariant = "success" | "warning" | "error" | "info" | "neutral" | "pending";

const VARIANT_STYLES: Record<BadgeVariant, string> = {
  success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  error:   "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  info:    "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
  neutral: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400",
  pending: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
};

const STATUS_MAP: Record<string, BadgeVariant> = {
  // positive
  confirmed: "success", active: "success", approved: "success", completed: "success",
  checked_in: "success", "checked in": "success", paid: "success", published: "success",
  available: "success", open: "success", ready: "success",
  // warning
  pending: "warning", upcoming: "warning", draft: "warning", waitlisted: "warning",
  low: "warning", partial: "warning", "in progress": "warning",
  // error
  cancelled: "error", rejected: "error", failed: "error", overdue: "error",
  "no show": "error", "no-show": "error", "checked out": "error", checked_out: "error",
  // info
  online: "info", virtual: "info", live: "info",
  // pending
  assigned: "pending", registered: "pending", processing: "pending",
};

function resolveVariant(status: string): BadgeVariant {
  const key = status.toLowerCase().trim();
  return STATUS_MAP[key] ?? "neutral";
}

interface StatusBadgeProps {
  status: string;
  /** Override automatic color resolution */
  variant?: BadgeVariant;
  size?: "sm" | "md";
  className?: string;
}

export function StatusBadge({ status, variant, size = "sm", className = "" }: StatusBadgeProps) {
  const v = variant ?? resolveVariant(status);
  const sizeClass = size === "sm" ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-1";
  return (
    <span className={`inline-block rounded-full font-semibold capitalize ${sizeClass} ${VARIANT_STYLES[v]} ${className}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}
