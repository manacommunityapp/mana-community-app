import * as React from "react";

import { cn } from "./utils";

function Input({ className, type, onChange, onKeyDown, ...props }: React.ComponentProps<"input">) {
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e);

    const val = e.target.value;
    const target = e.target;

    if (type === "date") {
      // Date is selected with a single day selection in calendar
      if (val && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
        target.blur();
      }
    } else if (type === "time") {
      // Time requires BOTH hour and minute (e.g. 14:30).
      // Debounce slightly so user can select both hour and minute without premature dismissal
      if (timerRef.current) clearTimeout(timerRef.current);
      if (val && /^\d{2}:\d{2}(:\d{2})?$/.test(val)) {
        timerRef.current = setTimeout(() => {
          target.blur();
        }, 700);
      }
    } else if (type === "datetime-local") {
      // Datetime-local requires Date, Hour, and Minute
      if (timerRef.current) clearTimeout(timerRef.current);
      if (val && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(val)) {
        timerRef.current = setTimeout(() => {
          target.blur();
        }, 700);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(e);
    if ((type === "date" || type === "time" || type === "datetime-local") && e.key === "Enter") {
      if (timerRef.current) clearTimeout(timerRef.current);
      e.currentTarget.blur();
    }
  };

  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base bg-input-background transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className,
      )}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      {...props}
    />
  );
}

export { Input };
