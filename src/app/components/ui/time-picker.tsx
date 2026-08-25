import React, { useState, useEffect } from "react";
import { Clock, Check, ChevronDown } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Popover, PopoverTrigger, PopoverContent } from "./popover";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface TimePickerProps {
  value?: string;
  onChange: (value24: string) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  minuteStep?: number;
  presets?: string[];
  id?: string;
}

const HOURS = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
const MINUTES = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];

/**
 * Parses any time string (24h "14:30", 12h "02:30 PM", ISO timestamp) into { hour12, minute, period, value24 }
 */
export function parseTimeToComponents(timeStr?: string): {
  hour12: string;
  minute: string;
  period: "AM" | "PM";
  value24: string;
} {
  if (!timeStr || typeof timeStr !== "string") {
    return { hour12: "08", minute: "00", period: "AM", value24: "08:00" };
  }

  const clean = timeStr.includes("T") ? (timeStr.split("T")[1] || "").slice(0, 5) : timeStr.trim();

  // Match 12-hour format e.g. "08:30 PM" or "8:30pm"
  const match12 = clean.match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/i);
  if (match12) {
    let hr = parseInt(match12[1], 10);
    const min = match12[2].padStart(2, "0");
    const rawPeriod = (match12[3] || "").toUpperCase();

    let period: "AM" | "PM" = rawPeriod === "PM" ? "PM" : "AM";
    if (!rawPeriod) {
      period = hr >= 12 ? "PM" : "AM";
    }

    let h12 = hr;
    if (h12 > 12) h12 = h12 - 12;
    if (h12 === 0) h12 = 12;

    const hour12Str = String(h12).padStart(2, "0");
    const val24 = formatTo24(hour12Str, min, period);

    return {
      hour12: hour12Str,
      minute: min,
      period,
      value24: val24,
    };
  }

  // Match 24-hour format "14:30"
  const match24 = clean.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    const hr = parseInt(match24[1], 10);
    const min = match24[2].padStart(2, "0");
    const period: "AM" | "PM" = hr >= 12 ? "PM" : "AM";

    let h12 = hr % 12;
    if (h12 === 0) h12 = 12;

    const hour12Str = String(h12).padStart(2, "0");
    const hr24Str = String(hr).padStart(2, "0");

    return {
      hour12: hour12Str,
      minute: min,
      period,
      value24: `${hr24Str}:${min}`,
    };
  }

  return { hour12: "08", minute: "00", period: "AM", value24: "08:00" };
}

/**
 * Formats 12h components into 24h string "HH:MM"
 */
export function formatTo24(hour12: string, minute: string, period: "AM" | "PM"): string {
  let hr = parseInt(hour12, 10);
  if (period === "PM" && hr < 12) hr += 12;
  if (period === "AM" && hr === 12) hr = 0;
  return `${String(hr).padStart(2, "0")}:${minute.padStart(2, "0")}`;
}

/**
 * Formats any time string into clean 12-hour format e.g. "08:30 AM"
 */
export function formatTime12Hour(timeStr?: string): string {
  if (!timeStr) return "";
  const comp = parseTimeToComponents(timeStr);
  return `${comp.hour12}:${comp.minute} ${comp.period}`;
}

/**
 * ─── TimePicker Component with Popover Portal & Quick Presets ───
 */
export function TimePicker({
  value,
  onChange,
  className,
  placeholder = "Select Time",
  disabled = false,
  size = "md",
}: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const comp = parseTimeToComponents(value);
  const [selectedHour, setSelectedHour] = useState(comp.hour12);
  const [selectedMinute, setSelectedMinute] = useState(comp.minute);
  const [selectedPeriod, setSelectedPeriod] = useState<"AM" | "PM">(comp.period);

  useEffect(() => {
    if (value) {
      const parsed = parseTimeToComponents(value);
      setSelectedHour(parsed.hour12);
      setSelectedMinute(parsed.minute);
      setSelectedPeriod(parsed.period);
    }
  }, [value]);

  const handleTimeChange = (h: string, m: string, p: "AM" | "PM") => {
    setSelectedHour(h);
    setSelectedMinute(m);
    setSelectedPeriod(p);
    const val24 = formatTo24(h, m, p);
    onChange(val24);
  };

  const displayTime = value ? formatTime12Hour(value) : "";

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "w-full flex items-center justify-between gap-2 px-2.5 rounded-xl border bg-white text-slate-800 transition-all cursor-pointer select-none text-left focus:outline-none focus:ring-2 focus:ring-amber-400/50 shadow-2xs hover:border-amber-400/80",
            size === "sm" && "py-1 text-xs h-7.5",
            size === "md" && "py-1.5 text-xs sm:text-sm h-8.5",
            size === "lg" && "py-2 text-sm h-10",
            disabled && "opacity-50 cursor-not-allowed bg-slate-50",
            isOpen ? "border-amber-500 ring-2 ring-amber-400/20" : "border-slate-200",
            className
          )}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <Clock className={cn("text-amber-500 shrink-0", size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5")} />
            <span className={cn("font-semibold text-xs truncate", !displayTime && "text-slate-400 font-normal")}>
              {displayTime || placeholder}
            </span>
          </div>
          <ChevronDown className={cn("w-3 h-3 text-slate-400 transition-transform duration-200 shrink-0", isOpen && "rotate-180")} />
        </button>
      </PopoverTrigger>

      {/* Popover Content (Portal Overlay Above All Other Divs/Fields) */}
      <PopoverContent
        align="start"
        sideOffset={6}
        className="z-[9999] w-60 sm:w-64 p-3 bg-white rounded-2xl border border-slate-200 shadow-2xl space-y-2.5 outline-none"
      >
        {/* Header & Selected Live Preview */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>Select Time</span>
          </div>
          <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
            {selectedHour}:{selectedMinute} {selectedPeriod}
          </span>
        </div>

        {/* Hour, Minute & Period Columns */}
        <div className="grid grid-cols-3 gap-1.5 bg-slate-50 p-2 rounded-xl border border-slate-100">
          {/* Hours Column */}
          <div className="space-y-1">
            <label className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 block text-center">
              Hour
            </label>
            <div className="max-h-32 overflow-y-auto space-y-0.5 custom-scrollbar pr-0.5">
              {HOURS.map((h) => {
                const isSelected = selectedHour === h;
                return (
                  <button
                    key={h}
                    type="button"
                    onClick={() => handleTimeChange(h, selectedMinute, selectedPeriod)}
                    className={cn(
                      "w-full py-1 text-xs font-bold rounded-lg transition-all cursor-pointer text-center",
                      isSelected
                        ? "bg-amber-500 text-white shadow-xs"
                        : "text-slate-600 hover:bg-white hover:text-slate-900"
                    )}
                  >
                    {h}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Minutes Column */}
          <div className="space-y-1">
            <label className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 block text-center">
              Min
            </label>
            <div className="max-h-32 overflow-y-auto space-y-0.5 custom-scrollbar pr-0.5">
              {MINUTES.map((m) => {
                const isSelected = selectedMinute === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleTimeChange(selectedHour, m, selectedPeriod)}
                    className={cn(
                      "w-full py-1 text-xs font-bold rounded-lg transition-all cursor-pointer text-center",
                      isSelected
                        ? "bg-amber-500 text-white shadow-xs"
                        : "text-slate-600 hover:bg-white hover:text-slate-900"
                    )}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          </div>

          {/* AM / PM Toggle */}
          <div className="space-y-1 flex flex-col">
            <label className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 block text-center">
              Period
            </label>
            <div className="space-y-1.5 my-auto">
              <button
                type="button"
                onClick={() => handleTimeChange(selectedHour, selectedMinute, "AM")}
                className={cn(
                  "w-full py-2 text-xs font-black rounded-xl transition-all cursor-pointer border",
                  selectedPeriod === "AM"
                    ? "bg-amber-500 text-white border-amber-600 shadow-xs"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                )}
              >
                AM
              </button>
              <button
                type="button"
                onClick={() => handleTimeChange(selectedHour, selectedMinute, "PM")}
                className={cn(
                  "w-full py-2 text-xs font-black rounded-xl transition-all cursor-pointer border",
                  selectedPeriod === "PM"
                    ? "bg-amber-500 text-white border-amber-600 shadow-xs"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                )}
              >
                PM
              </button>
            </div>
          </div>
        </div>

        {/* Done Button */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" /> Done
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/**
 * ─── Inline TimeSelect Component (Hour, Minute, AM/PM Select Boxes) ───
 */
export function TimeSelect({
  value,
  onChange,
  className,
  disabled = false,
  size = "md",
}: {
  value?: string;
  onChange: (value24: string) => void;
  className?: string;
  disabled?: boolean;
  size?: "sm" | "md";
}) {
  const comp = parseTimeToComponents(value);

  const handleHourChange = (h: string) => {
    onChange(formatTo24(h, comp.minute, comp.period));
  };

  const handleMinuteChange = (m: string) => {
    onChange(formatTo24(comp.hour12, m, comp.period));
  };

  const handlePeriodChange = (p: "AM" | "PM") => {
    onChange(formatTo24(comp.hour12, comp.minute, p));
  };

  const selectCls = cn(
    "border border-slate-200 rounded-lg font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-amber-300 cursor-pointer shadow-2xs",
    size === "sm" ? "px-1.5 py-1 text-xs h-7.5" : "px-2 py-1.5 text-xs h-9",
    disabled && "opacity-50 cursor-not-allowed bg-slate-50"
  );

  return (
    <div className={cn("inline-flex items-center gap-1.5 flex-nowrap", className)}>
      <Clock className={cn("text-amber-500 shrink-0", size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5")} />

      {/* Hour Select */}
      <select
        disabled={disabled}
        value={comp.hour12}
        onChange={(e) => handleHourChange(e.target.value)}
        className={selectCls}
        title="Hour"
      >
        {HOURS.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>

      <span className="font-black text-slate-400 text-xs">:</span>

      {/* Minute Select */}
      <select
        disabled={disabled}
        value={comp.minute}
        onChange={(e) => handleMinuteChange(e.target.value)}
        className={selectCls}
        title="Minute"
      >
        {MINUTES.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>

      {/* AM / PM Toggle */}
      <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 shadow-2xs shrink-0">
        <button
          type="button"
          disabled={disabled}
          onClick={() => handlePeriodChange("AM")}
          className={cn(
            "px-2 py-0.5 text-[10.5px] font-black rounded-md transition-all cursor-pointer",
            comp.period === "AM"
              ? "bg-amber-500 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          )}
        >
          AM
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => handlePeriodChange("PM")}
          className={cn(
            "px-2 py-0.5 text-[10.5px] font-black rounded-md transition-all cursor-pointer",
            comp.period === "PM"
              ? "bg-amber-500 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          )}
        >
          PM
        </button>
      </div>
    </div>
  );
}
