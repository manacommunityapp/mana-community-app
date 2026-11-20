interface WorkflowStatusBadgeProps {
  status: string;
  workflowId?: string;
  size?: "sm" | "md";
  className?: string;
}

const SUCCESS_TERMINAL = new Set([
  "COMPLETED", "DELIVERED", "RESOLVED", "CLOSED", "PAID", "REFUNDED",
]);
const IN_PROGRESS = new Set([
  "IN_PROGRESS", "PROCESSING", "OUT_FOR_DELIVERY", "ACCEPTED", "PREPARING", "READY",
]);
const PENDING = new Set([
  "PENDING", "DRAFT", "CREATED", "OPEN", "PENDING_REVIEW", "READY", "PLACED", "SCHEDULED",
]);
const BAD_TERMINAL = new Set([
  "CANCELLED", "DISPUTED", "REOPENED", "FAILED", "REJECTED", "EXPIRED",
]);

function statusColor(status: string): string {
  if (SUCCESS_TERMINAL.has(status))
    return "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300";
  if (IN_PROGRESS.has(status))
    return "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300";
  if (PENDING.has(status))
    return "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300";
  if (BAD_TERMINAL.has(status))
    return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";
  return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300";
}

function toLabel(status: string): string {
  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function WorkflowStatusBadge({
  status,
  size = "sm",
  className = "",
}: WorkflowStatusBadgeProps) {
  const sizeClass = size === "md" ? "px-2.5 py-1 text-sm" : "px-2 py-0.5 text-xs";
  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold ${sizeClass} ${statusColor(status)} ${className}`}
    >
      {toLabel(status)}
    </span>
  );
}

export default WorkflowStatusBadge;
