import { Check } from "lucide-react";

export interface StepDef {
  id: string;
  label: string;
  sublabel?: string;
}

interface StepIndicatorProps {
  steps: StepDef[];
  /** 1-based current step index */
  currentStep: number;
  variant?: "circles" | "compact";
}

export function StepIndicator({ steps, currentStep, variant = "circles" }: StepIndicatorProps) {
  if (variant === "compact") {
    return (
      <div className="flex items-center gap-1">
        {steps.map((s, i) => {
          const done = i + 1 < currentStep;
          const active = i + 1 === currentStep;
          return (
            <div key={s.id} className="flex items-center gap-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all
                ${done ? "bg-emerald-500 text-white" : active ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-400"}`}>
                {done ? <Check className="w-3 h-3" /> : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className={`h-px w-4 ${done ? "bg-emerald-300" : "bg-slate-200 dark:bg-slate-700"}`} />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex items-start justify-center gap-0">
      {steps.map((s, i) => {
        const done = i + 1 < currentStep;
        const active = i + 1 === currentStep;
        return (
          <div key={s.id} className="flex items-start flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all
                ${done
                  ? "bg-emerald-500 border-emerald-500 text-white"
                  : active
                    ? "bg-indigo-600 border-indigo-600 text-white"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-400"}`}>
                {done ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <p className={`text-[10px] font-semibold mt-1 text-center leading-tight max-w-[60px]
                ${active ? "text-indigo-600 dark:text-indigo-400" : done ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`}>
                {s.label}
              </p>
              {s.sublabel && <p className="text-[9px] text-slate-400 text-center">{s.sublabel}</p>}
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-px mt-4 mx-1 transition-all ${done ? "bg-emerald-300" : "bg-slate-200 dark:bg-slate-700"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
