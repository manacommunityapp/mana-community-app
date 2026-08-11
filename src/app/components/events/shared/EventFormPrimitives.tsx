import { type ReactNode, type ElementType } from "react";
import { Switch } from "../../ui/switch";
import { Label } from "../../ui/label";
import { cn } from "../../ui/utils";

// ─── Section Header ───────────────────────────────────────────────────────────
export function SectionHeader({ icon: Icon, title, subtitle }: {
  icon: ElementType; title: string; subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-5">
      <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}>
        <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
      </div>
      <div>
        <h3 className="text-xs sm:text-sm font-bold text-slate-800">{title}</h3>
        {subtitle && <p className="text-[10px] sm:text-[11px] text-slate-400">{subtitle}</p>}
      </div>
    </div>
  );
}

// ─── Field Label ─────────────────────────────────────────────────────────────
export function FieldLabel({ children, required, hint, htmlFor }: {
  children: ReactNode; required?: boolean; hint?: string; htmlFor?: string;
}) {
  return (
    <div className="flex items-baseline justify-between mb-1.5">
      <Label htmlFor={htmlFor} className="block text-xs font-bold text-slate-500 uppercase tracking-[0.08em]">
        {children}{required && <span className="text-rose-500 ml-0.5">*</span>}
      </Label>
      {hint && <span className="text-[10px] text-slate-400">{hint}</span>}
    </div>
  );
}

// ─── Toggle Row ──────────────────────────────────────────────────────────────
export function ToggleRow({ checked, onChange, label, description }: {
  checked: boolean; onChange: (v: boolean) => void; label: string; description?: string;
}) {
  return (
    <div className={cn(
      "flex items-center justify-between p-3 sm:p-4 rounded-xl border transition-all",
      checked ? "bg-indigo-50/50 border-indigo-200" : "bg-slate-50 border-slate-100"
    )}>
      <div>
        <span className="text-xs sm:text-sm font-medium text-slate-700">{label}</span>
        {description && <p className="text-[10px] text-slate-400 mt-0.5">{description}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
