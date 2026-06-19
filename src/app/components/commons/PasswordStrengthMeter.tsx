import { useMemo } from "react";
import { ShieldCheck, ShieldAlert } from "lucide-react";
import { evaluatePassword } from "../../../utils/passwordStrength";

interface Props {
  password: string;
  /** Personal tokens (email, name, phone) to penalise if present. */
  userInputs?: string[];
  className?: string;
}

const BAR_COLORS = ["#dc2626", "#f97316", "#eab308", "#22c55e", "#16a34a"]; // weak → very strong

/**
 * Live password-strength meter. Uses the shared evaluator so it agrees with the
 * backend gate. Renders nothing for an empty password.
 */
export function PasswordStrengthMeter({ password, userInputs = [], className }: Props) {
  const result = useMemo(() => evaluatePassword(password, userInputs), [password, userInputs]);

  if (!password) return null;

  const color = BAR_COLORS[result.score];
  const filledBars = result.score + 1; // 1..5 segments lit

  return (
    <div className={className} aria-live="polite">
      <div className="flex gap-1 mt-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-1.5 flex-1 rounded-full transition-colors"
            style={{ background: i < filledBars ? color : "rgba(99,102,241,0.15)" }}
          />
        ))}
      </div>

      <div className="flex items-center gap-1.5 mt-1.5">
        {result.acceptable ? (
          <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" style={{ color }} />
        ) : (
          <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" style={{ color }} />
        )}
        <span className="text-xs font-medium" style={{ color }}>
          {result.label}
        </span>
        {result.warning && (
          <span className="text-xs text-muted-foreground truncate">· {result.warning}</span>
        )}
      </div>

      {!result.acceptable && result.suggestions.length > 0 && (
        <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
          {result.suggestions[0]}
        </p>
      )}
    </div>
  );
}
