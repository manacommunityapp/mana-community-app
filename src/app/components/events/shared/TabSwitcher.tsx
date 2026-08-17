import { useState, useEffect, type ReactNode, type ElementType } from "react";
import { useSearchParams } from "react-router";

export interface TabDef {
  id: string;
  label: string;
  /** Lucide icon component — rendered with responsive sizing */
  icon?: ElementType;
  content: ReactNode;
  /** Tab is hidden from the bar but still activatable via defaultTab */
  hidden?: boolean;
}

type TabVariant = "pill" | "underline" | "gradient";

interface TabSwitcherProps {
  tabs: TabDef[];
  defaultTab?: string;
  className?: string;
  variant?: TabVariant;
}

export function TabSwitcher({ tabs, defaultTab, className = "", variant = "gradient" }: TabSwitcherProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");

  const visible = tabs.filter(t => !t.hidden);
  const resolveInitialTab = () => {
    if (tabParam && tabs.some(t => t.id === tabParam)) {
      return tabParam;
    }
    return defaultTab ?? visible[0]?.id ?? "";
  };

  const [active, setActive] = useState(resolveInitialTab);

  useEffect(() => {
    if (tabParam && tabs.some(t => t.id === tabParam)) {
      setActive(tabParam);
    }
  }, [tabParam, tabs]);

  const handleSelect = (id: string) => {
    setActive(id);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set("tab", id);
      return next;
    }, { replace: true });
  };

  const current = tabs.find(t => t.id === active) ?? tabs[0];

  if (visible.length <= 1) return <div className={className}>{current?.content}</div>;

  return (
    <div className={`space-y-5 ${className}`}>
      <TabBar tabs={visible} active={active} onSelect={handleSelect} variant={variant} />
      <div>{current?.content}</div>
    </div>
  );
}

// ─── Shared bar renderer ──────────────────────────────────────────────────────
function TabBar({ tabs, active, onSelect, variant }: {
  tabs: TabDef[]; active: string; onSelect: (id: string) => void; variant: TabVariant;
}) {
  if (variant === "gradient") {
    return (
      <div className="flex items-center gap-0.5 sm:gap-1 p-0.5 sm:p-1 bg-white dark:bg-slate-800 rounded-lg sm:rounded-xl border border-slate-100 dark:border-slate-700 shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-x-auto hide-scrollbar">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => onSelect(t.id)}
              className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-md sm:rounded-lg text-[10px] sm:text-sm font-semibold transition-all whitespace-nowrap flex-1 sm:flex-none justify-center
                ${active === t.id
                  ? "bg-gradient-to-r from-indigo-600 to-violet-500 text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"}`}>
              {Icon && <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />}
              {t.label}
            </button>
          );
        })}
      </div>
    );
  }

  if (variant === "underline") {
    return (
      <div className="flex gap-0 border-b border-slate-200 dark:border-slate-700 overflow-x-auto hide-scrollbar">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => onSelect(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all -mb-px whitespace-nowrap
                ${active === t.id
                  ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}>
              {Icon && <Icon className="w-4 h-4" />}
              {t.label}
            </button>
          );
        })}
      </div>
    );
  }

  // pill
  return (
    <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit overflow-x-auto hide-scrollbar">
      {tabs.map(t => {
        const Icon = t.icon;
        return (
          <button
            key={t.id}
            onClick={() => onSelect(t.id)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap
              ${active === t.id
                ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}>
            {Icon && <Icon className="w-3.5 h-3.5" />}
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
