import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE = { sm: "w-4 h-4", md: "w-5 h-5", lg: "w-7 h-7" } as const;

export function LoadingSpinner({ label = "Loading…", size = "md", className = "" }: LoadingSpinnerProps) {
  return (
    <div className={`flex items-center justify-center gap-2 py-8 text-slate-400 ${className}`}>
      <Loader2 className={`${SIZE[size]} animate-spin flex-shrink-0`} />
      {label && <span className="text-sm">{label}</span>}
    </div>
  );
}
