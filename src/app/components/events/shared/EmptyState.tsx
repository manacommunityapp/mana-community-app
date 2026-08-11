import { type ReactNode } from "react";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  icon?: ReactNode;
  label: string;
  sub?: string;
  action?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({ icon, label, sub, action, onAction, className = "" }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-14 text-center ${className}`}>
      <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-600">
        {icon ?? <Inbox className="w-7 h-7" />}
      </div>
      <div>
        <p className="font-semibold text-slate-600 dark:text-slate-300">{label}</p>
        {sub && <p className="text-sm text-slate-400 mt-0.5">{sub}</p>}
      </div>
      {action && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm">
          {action}
        </button>
      )}
    </div>
  );
}
