import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  Sparkles,
  Check,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Popover, PopoverTrigger, PopoverContent } from "./popover";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface DatePickerProps {
  value?: string | Date;
  onChange: (dateStr: string) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  min?: string;
  max?: string;
  size?: "sm" | "md" | "lg";
  presets?: boolean;
  required?: boolean;
  id?: string;
  name?: string;
  align?: "start" | "center" | "end";
  autoCloseOnSelect?: boolean;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

/**
 * Formats a Date object or YYYY-MM-DD string to "YYYY-MM-DD"
 */
export function formatToDateString(d?: Date | string | null): string {
  if (!d) return "";
  if (typeof d === "string") {
    const match = d.match(/^\d{4}-\d{2}-\d{2}$/);
    if (match) return d;
    const parsed = new Date(d);
    if (!isNaN(parsed.getTime())) {
      const year = parsed.getFullYear();
      const month = String(parsed.getMonth() + 1).padStart(2, "0");
      const day = String(parsed.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
    return d;
  }
  if (d instanceof Date && !isNaN(d.getTime())) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  return "";
}

/**
 * Formats a date string (YYYY-MM-DD) to readable format: "Wed, 26 Aug 2026"
 */
export function formatReadableDate(dateStr?: string | Date | null): string {
  if (!dateStr) return "";
  const iso = formatToDateString(dateStr);
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const dateObj = new Date(y, m - 1, d);
  if (isNaN(dateObj.getTime())) return iso;

  return dateObj.toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function useIsMobile(breakpoint = 640): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < breakpoint;
  });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [breakpoint]);

  return isMobile;
}

export function DatePicker({
  value,
  onChange,
  className,
  placeholder = "Select date...",
  disabled = false,
  min,
  max,
  size = "md",
  presets = true,
  required = false,
  id,
  name,
  align = "start",
  autoCloseOnSelect = true,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showMonthSelect, setShowMonthSelect] = useState(false);
  const [showYearSelect, setShowYearSelect] = useState(false);
  const isMobile = useIsMobile(640);

  const selectedDateStr = useMemo(() => formatToDateString(value), [value]);

  // Current browsing month and year in calendar view
  const [viewDate, setViewDate] = useState<Date>(() => {
    if (selectedDateStr) {
      const [y, m, d] = selectedDateStr.split("-").map(Number);
      if (y && m && d) return new Date(y, m - 1, 1);
    }
    if (min) {
      const [y, m, d] = min.split("-").map(Number);
      if (y && m && d) return new Date(y, m - 1, 1);
    }
    return new Date();
  });

  // Sync viewDate when value or min changes from external source
  useEffect(() => {
    if (selectedDateStr) {
      const [y, m, d] = selectedDateStr.split("-").map(Number);
      if (y && m && d) {
        setViewDate(new Date(y, m - 1, 1));
      }
    } else if (min) {
      const [y, m, d] = min.split("-").map(Number);
      if (y && m && d) {
        setViewDate(new Date(y, m - 1, 1));
      }
    }
  }, [selectedDateStr, min]);

  // Reset dropdown sub-menus on close
  useEffect(() => {
    if (!isOpen) {
      setShowMonthSelect(false);
      setShowYearSelect(false);
    }
  }, [isOpen]);

  // Lock background scroll when DatePicker is open
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
      document.body.style.paddingRight = originalPaddingRight;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(viewYear, viewMonth - 1, 1));
    setShowMonthSelect(false);
    setShowYearSelect(false);
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(viewYear, viewMonth + 1, 1));
    setShowMonthSelect(false);
    setShowYearSelect(false);
  };

  const handleSelectDate = (dateString: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onChange(dateString);
    if (autoCloseOnSelect) {
      setIsOpen(false);
      setShowMonthSelect(false);
      setShowYearSelect(false);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  // Generate day matrix for current view month
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
    const totalDaysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();

    const days: Array<{
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
      isDisabled: boolean;
    }> = [];

    const todayStr = formatToDateString(new Date());

    // Previous month trailing days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const prevDate = new Date(viewYear, viewMonth - 1, d);
      const str = formatToDateString(prevDate);
      days.push({
        dateStr: str,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: str === todayStr,
        isSelected: str === selectedDateStr,
        isDisabled: (min ? str < min : false) || (max ? str > max : false),
      });
    }

    // Current month days
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const curDate = new Date(viewYear, viewMonth, d);
      const str = formatToDateString(curDate);
      days.push({
        dateStr: str,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: str === todayStr,
        isSelected: str === selectedDateStr,
        isDisabled: (min ? str < min : false) || (max ? str > max : false),
      });
    }

    // Next month leading days (to complete 42 grid cells)
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const nextDate = new Date(viewYear, viewMonth + 1, d);
      const str = formatToDateString(nextDate);
      days.push({
        dateStr: str,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: str === todayStr,
        isSelected: str === selectedDateStr,
        isDisabled: (min ? str < min : false) || (max ? str > max : false),
      });
    }

    return days;
  }, [viewYear, viewMonth, selectedDateStr, min, max]);

  const selectedYearRef = useRef<HTMLButtonElement | null>(null);

  // Year options list for fast jumping (supported back to 1940 for DOB / historical dates)
  const yearOptions = useMemo(() => {
    const currentYr = new Date().getFullYear();
    const minBound = min ? Math.min(1940, parseInt(min.split("-")[0], 10)) : 1940;
    const start = Math.min(minBound, viewYear - 10);
    const maxBound = max ? Math.max(currentYr + 20, parseInt(max.split("-")[0], 10)) : currentYr + 20;
    const end = Math.max(viewYear + 20, maxBound);
    const years: number[] = [];
    for (let y = start; y <= end; y++) {
      years.push(y);
    }
    return years;
  }, [viewYear, min, max]);

  useEffect(() => {
    if (showYearSelect && selectedYearRef.current) {
      selectedYearRef.current.scrollIntoView({ block: "center", behavior: "auto" });
    }
  }, [showYearSelect]);

  // Relative day badge
  const relativeBadge = useMemo(() => {
    if (!selectedDateStr) return null;
    const [y, m, d] = selectedDateStr.split("-").map(Number);
    if (!y || !m || !d) return null;

    const sel = new Date(y, m - 1, d);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffDays = Math.round((sel.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays === -1) return "Yesterday";
    if (diffDays > 1 && diffDays <= 7) return `In ${diffDays}d`;
    if (diffDays < -1 && diffDays >= -7) return `${Math.abs(diffDays)}d ago`;
    return null;
  }, [selectedDateStr]);

  // Preset date shortcuts
  const handlePreset = (type: "today" | "tomorrow" | "weekend" | "next_week", e: React.MouseEvent) => {
    e.stopPropagation();
    const d = new Date();
    if (type === "tomorrow") {
      d.setDate(d.getDate() + 1);
    } else if (type === "weekend") {
      const day = d.getDay();
      const diff = day === 6 ? 0 : 6 - day;
      d.setDate(d.getDate() + diff);
    } else if (type === "next_week") {
      const day = d.getDay();
      const diff = (8 - day) % 7 || 7;
      d.setDate(d.getDate() + diff);
    }
    const str = formatToDateString(d);
    if (min && str < min) return;
    if (max && str > max) return;
    handleSelectDate(str);
  };

  const sizeClasses = {
    sm: "h-8.5 text-xs px-2.5 rounded-lg",
    md: "h-9 text-xs sm:text-[13px] px-3 rounded-xl",
    lg: "h-10 text-sm px-3.5 rounded-xl",
  };

  // Reusable Calendar Inner Content
  const renderCalendarContent = (isInMobileModal = false) => (
    <div
      className={cn(
        "space-y-3 select-none",
        isInMobileModal && "w-full"
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Mobile Top Sheet Bar & Header */}
      {isInMobileModal && (
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-black text-foreground">Select Date</p>
              <p className="text-[11px] text-muted-foreground font-medium">
                {selectedDateStr ? formatReadableDate(selectedDateStr) : "No date selected"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 rounded-xl bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Preset Shortcuts */}
      {presets && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-border/80 hide-scrollbar" style={{ scrollbarWidth: "none" }}>
          <button
            type="button"
            onClick={(e) => handlePreset("today", e)}
            className="px-2.5 py-1 rounded-lg text-[10.5px] font-bold bg-muted/80 hover:bg-primary/10 hover:text-primary transition-all cursor-pointer shrink-0"
          >
            Today
          </button>
          <button
            type="button"
            onClick={(e) => handlePreset("tomorrow", e)}
            className="px-2.5 py-1 rounded-lg text-[10.5px] font-bold bg-muted/80 hover:bg-primary/10 hover:text-primary transition-all cursor-pointer shrink-0"
          >
            Tomorrow
          </button>
          <button
            type="button"
            onClick={(e) => handlePreset("weekend", e)}
            className="px-2.5 py-1 rounded-lg text-[10.5px] font-bold bg-muted/80 hover:bg-primary/10 hover:text-primary transition-all cursor-pointer shrink-0"
          >
            Weekend
          </button>
          <button
            type="button"
            onClick={(e) => handlePreset("next_week", e)}
            className="px-2.5 py-1 rounded-lg text-[10.5px] font-bold bg-muted/80 hover:bg-primary/10 hover:text-primary transition-all cursor-pointer shrink-0"
          >
            Next Mon
          </button>
        </div>
      )}

      {/* Month & Year Navigation Header */}
      <div className="flex items-center justify-between gap-1 relative">
        <div className="flex items-center gap-1">
          {/* Month Selector Toggle */}
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowMonthSelect((prev) => !prev);
                setShowYearSelect(false);
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-muted/50 hover:bg-muted text-xs font-black text-foreground transition-all cursor-pointer border border-transparent hover:border-border"
            >
              <span>{MONTH_NAMES[viewMonth]}</span>
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            </button>

            {/* Month Dropdown List */}
            {showMonthSelect && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute top-full left-0 mt-1 z-[100000] w-48 bg-popover border border-border rounded-2xl shadow-xl p-2 grid grid-cols-3 gap-1 animate-in fade-in duration-100"
              >
                {MONTH_NAMES.map((mName, idx) => (
                  <button
                    key={mName}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewDate(new Date(viewYear, idx, 1));
                      setShowMonthSelect(false);
                    }}
                    className={cn(
                      "px-2 py-1.5 rounded-xl text-[11px] font-bold text-center transition-all cursor-pointer",
                      idx === viewMonth
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "hover:bg-muted text-foreground"
                    )}
                  >
                    {MONTH_SHORT[idx]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Year Selector Toggle */}
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowYearSelect((prev) => !prev);
                setShowMonthSelect(false);
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-muted/50 hover:bg-muted text-xs font-black text-foreground transition-all cursor-pointer border border-transparent hover:border-border"
            >
              <span>{viewYear}</span>
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            </button>

            {/* Year Dropdown List */}
            {showYearSelect && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute top-full left-0 mt-1 z-[100000] w-40 max-h-52 overflow-y-auto bg-popover border border-border rounded-2xl shadow-xl p-2 grid grid-cols-2 gap-1 animate-in fade-in duration-100 hide-scrollbar"
              >
                {yearOptions.map((yr) => (
                  <button
                    key={yr}
                    ref={yr === viewYear ? selectedYearRef : undefined}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewDate(new Date(yr, viewMonth, 1));
                      setShowYearSelect(false);
                    }}
                    className={cn(
                      "px-2 py-1 rounded-lg text-[11px] font-bold text-center transition-all cursor-pointer",
                      yr === viewYear
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "hover:bg-muted text-foreground"
                    )}
                  >
                    {yr}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Prev / Next Month Arrow Buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="w-8 h-8 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
            title="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="w-8 h-8 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
            title="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday Header */}
      <div className="grid grid-cols-7 gap-1 text-center border-b border-border/60 pb-1.5">
        {WEEKDAYS.map((wd, i) => (
          <span
            key={wd}
            className={cn(
              "text-[10.5px] font-extrabold uppercase",
              i === 0 || i === 6 ? "text-amber-500/80" : "text-muted-foreground"
            )}
          >
            {wd}
          </span>
        ))}
      </div>

      {/* Days 7-column Grid */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {calendarDays.map((day) => {
          return (
            <button
              key={day.dateStr}
              type="button"
              data-date={day.dateStr}
              data-testid={id ? `${id}-day-${day.dateStr}` : undefined}
              disabled={day.isDisabled}
              onClick={(e) => !day.isDisabled && handleSelectDate(day.dateStr, e)}
              className={cn(
                "relative h-8.5 w-8.5 sm:h-8 sm:w-8 mx-auto rounded-xl flex items-center justify-center text-xs font-bold transition-all cursor-pointer select-none",
                day.isSelected
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/25 font-extrabold scale-105"
                  : day.isCurrentMonth
                  ? "text-foreground hover:bg-primary/10 hover:text-primary"
                  : "text-muted-foreground/40 hover:bg-muted/50",
                day.isToday && !day.isSelected && "border border-primary/50 text-primary font-black",
                day.isDisabled && "opacity-20 cursor-not-allowed hover:bg-transparent hover:text-inherit"
              )}
            >
              <span>{day.dayNumber}</span>
              {day.isToday && !day.isSelected && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Quick Action Bar */}
      <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={(e) => {
            const todayStr = formatToDateString(new Date());
            if (min && todayStr < min) return;
            if (max && todayStr > max) return;
            handleSelectDate(todayStr, e);
          }}
          className="text-[11px] font-bold text-primary hover:underline cursor-pointer flex items-center gap-1"
        >
          <Sparkles className="w-3.5 h-3.5" /> Set Today
        </button>

        <div className="flex items-center gap-2">
          {selectedDateStr && (
            <button
              type="button"
              onClick={handleClear}
              className="text-[11px] font-bold text-rose-500 hover:underline cursor-pointer"
            >
              Clear
            </button>
          )}

          {isInMobileModal && (
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-lg shadow-sm hover:opacity-90 transition-opacity"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // Trigger Button
  const triggerButton = (
    <button
      type="button"
      id={id}
      name={name}
      data-testid={id}
      disabled={disabled}
      onClick={() => !disabled && setIsOpen((prev) => !prev)}
      className={cn(
        "w-full flex items-center justify-between border bg-card text-foreground transition-all cursor-pointer shadow-2xs group text-left",
        sizeClasses[size],
        isOpen
          ? "border-primary ring-2 ring-primary/20 bg-accent/10 shadow-xs"
          : "border-input hover:border-primary/50 hover:bg-accent/5",
        disabled && "opacity-50 cursor-not-allowed bg-muted hover:border-input",
        !selectedDateStr && "text-muted-foreground",
        className
      )}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <div
          className={cn(
            "w-5.5 h-5.5 rounded-md flex items-center justify-center shrink-0 transition-colors",
            selectedDateStr
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground group-hover:text-primary"
          )}
        >
          <CalendarIcon className="w-3.5 h-3.5" />
        </div>

        <div className="truncate flex-1">
          {selectedDateStr ? (
            <span className="font-bold text-foreground text-xs sm:text-[12.5px]">
              {formatReadableDate(selectedDateStr)}
            </span>
          ) : (
            <span className="font-normal text-muted-foreground text-xs">{placeholder}</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0 ml-1.5">
        {relativeBadge && (
          <span className="hidden sm:inline-flex px-1.5 py-0.5 rounded text-[9.5px] font-extrabold bg-primary/10 text-primary border border-primary/20">
            {relativeBadge}
          </span>
        )}

        {selectedDateStr && !disabled && (
          <span
            role="button"
            tabIndex={0}
            onClick={handleClear}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.stopPropagation();
                onChange("");
              }
            }}
            className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-rose-600 transition-colors cursor-pointer"
            title="Clear date"
          >
            <X className="w-3 h-3" />
          </span>
        )}

        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180 text-primary"
          )}
        />
      </div>
    </button>
  );

  // If on mobile: Render trigger + Portal Bottom Sheet / Center Modal
  if (isMobile) {
    return (
      <>
        {triggerButton}
        {isOpen &&
          typeof document !== "undefined" &&
          createPortal(
            <div
              className="fixed inset-0 z-[999999] bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
              onClick={() => setIsOpen(false)}
              onTouchMove={(e) => e.stopPropagation()}
            >
              <div
                className="w-full max-w-sm bg-card border border-border rounded-3xl shadow-2xl p-4 text-card-foreground outline-none animate-in slide-in-from-bottom-6 duration-200 max-h-[92vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {renderCalendarContent(true)}
              </div>
            </div>,
            document.body
          )}
      </>
    );
  }

  // If on desktop: Render via standard Radix Popover with collision positioning
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
      <PopoverContent
        align={align}
        sideOffset={6}
        className="w-76 sm:w-80 bg-card border border-border rounded-2xl shadow-2xl p-3 text-card-foreground z-[99999] outline-none animate-in fade-in zoom-in-95 duration-150"
      >
        {renderCalendarContent(false)}
      </PopoverContent>
    </Popover>
  );
}

