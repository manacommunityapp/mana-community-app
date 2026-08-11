import { X } from "lucide-react";

interface FilterChipProps {
  label: string;
  active: boolean;
  onSelect: () => void;
  count?: number;
  onRemove?: () => void;
  className?: string;
}

export function FilterChip({ label, active, onSelect, count, onRemove, className = "" }: FilterChipProps) {
  return (
    <span
      onClick={onSelect}
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border cursor-pointer select-none transition-all
        ${active
          ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
          : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-300 hover:text-indigo-600"}
        ${className}`}
    >
      {label}
      {count !== undefined && (
        <span className={`text-[10px] px-1 rounded-full font-bold ${active ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-500"}`}>
          {count}
        </span>
      )}
      {onRemove && (
        <button
          onClick={e => { e.stopPropagation(); onRemove(); }}
          className="ml-0.5 hover:text-rose-400 transition-colors">
          <X className="w-2.5 h-2.5" />
        </button>
      )}
    </span>
  );
}

interface FilterChipRowProps {
  children: React.ReactNode;
  className?: string;
}

export function FilterChipRow({ children, className = "" }: FilterChipRowProps) {
  return (
    <div className={`flex flex-wrap gap-1.5 items-center ${className}`}>
      {children}
    </div>
  );
}
