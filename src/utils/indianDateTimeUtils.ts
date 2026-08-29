/**
 * indianDateTimeUtils.ts
 *
 * Centralized utility module for:
 * 1. Indian Standard Time (IST, UTC+05:30) date & time operations.
 * 2. 12-hour AM / PM time formatting (e.g. 09:00 AM, 06:30 PM).
 * 3. Indian standard date formatting (e.g. 29 Aug 2026, 29/08/2026).
 * 4. Validation of slot dates, times, and ranges in IST.
 */

/**
 * Returns a JS Date object representing the current instant in Asia/Kolkata (IST).
 */
/**
 * indianDateTimeUtils.ts
 *
 * Centralized utility module for:
 * 1. Indian Standard Time (IST, UTC+05:30) date & time operations.
 * 2. 12-hour AM / PM time formatting (e.g. "09:00 AM", "06:30 PM").
 * 3. Indian standard date formatting (e.g. "29 Aug 2026", "29/08/2026").
 * 4. Validation of slot dates, times, and ranges in IST.
 */

/**
 * Returns a JS Date object representing the current instant in Asia/Kolkata (IST).
 */
export function getNowInIST(): Date {
  const now = new Date();
  const istString = now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
  return new Date(istString);
}

/**
 * Parses time components { hours, minutes, seconds } from any time string or ISO string.
 * Supports "09:00", "18:30:00", "09:00 AM", "6:30 pm", "2026-08-29T18:30:00.000Z".
 */
export function parseTimeComponents(timeStr?: string | Date | null): { hours: number; minutes: number; seconds: number } | null {
  if (!timeStr) return null;

  if (timeStr instanceof Date) {
    if (isNaN(timeStr.getTime())) return null;
    const istString = timeStr.toLocaleString("en-US", { timeZone: "Asia/Kolkata", hour12: false });
    const match = istString.match(/(\d{1,2}):(\d{2}):(\d{2})/);
    if (match) {
      return {
        hours: parseInt(match[1], 10),
        minutes: parseInt(match[2], 10),
        seconds: parseInt(match[3], 10),
      };
    }
    return {
      hours: timeStr.getHours(),
      minutes: timeStr.getMinutes(),
      seconds: timeStr.getSeconds(),
    };
  }

  if (typeof timeStr !== "string") return null;
  const clean = timeStr.trim();
  if (!clean) return null;

  // Handle ISO string with T
  if (clean.includes("T")) {
    const d = new Date(clean);
    if (!isNaN(d.getTime())) {
      return parseTimeComponents(d);
    }
    const afterT = clean.split("T")[1];
    return parseTimeComponents(afterT);
  }

  // Regex matching "HH:mm[:ss] [AM|PM]" or "H:mm [am|pm]"
  const isPM = /pm/i.test(clean);
  const isAM = /am/i.test(clean);

  const match = clean.match(/(\d{1,2})[:.](\d{2})(?::(\d{2}))?/);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const seconds = match[3] ? parseInt(match[3], 10) : 0;

    if (isPM && hours < 12) hours += 12;
    if (isAM && hours === 12) hours = 0;

    if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
      return { hours, minutes, seconds };
    }
  }

  // Hour only e.g. "6 PM"
  const hourMatch = clean.match(/^(\d{1,2})\s*(am|pm)$/i);
  if (hourMatch) {
    let hours = parseInt(hourMatch[1], 10);
    const meridian = hourMatch[2].toLowerCase();
    if (meridian === "pm" && hours < 12) hours += 12;
    if (meridian === "am" && hours === 12) hours = 0;
    return { hours, minutes: 0, seconds: 0 };
  }

  return null;
}

/**
 * Formats any time string into Indian 12-hour format with AM / PM (e.g. "09:00 AM", "06:30 PM", "12:00 PM").
 * If the input is a range (e.g. "09:00 - 10:30" or "09:00 – 10:30"), both ends will be formatted (e.g. "09:00 AM – 10:30 AM").
 */
export function formatIndianTime(
  timeStr?: string | Date | null,
  options?: { padHours?: boolean }
): string {
  if (!timeStr) return "";

  if (typeof timeStr === "string") {
    const clean = timeStr.trim();
    if (!clean) return "";

    // Handle range e.g. "09:00 - 10:30" or "09:00 – 10:30"
    if (clean.includes("–")) {
      const parts = clean.split("–");
      return `${formatIndianTime(parts[0], options)} – ${formatIndianTime(parts[1], options)}`;
    }
    if (clean.includes(" - ") || (clean.includes("-") && !clean.includes("T") && !clean.match(/^\d{4}-\d{2}-\d{2}/))) {
      const parts = clean.split(/-|\bto\b/i);
      if (parts.length === 2 && parts[0].trim() && parts[1].trim()) {
        return `${formatIndianTime(parts[0], options)} – ${formatIndianTime(parts[1], options)}`;
      }
    }
  }

  const comp = parseTimeComponents(timeStr);
  if (!comp) {
    return typeof timeStr === "string" ? timeStr.trim() : "";
  }

  const { hours, minutes } = comp;
  const meridian = hours >= 12 ? "PM" : "AM";
  const displayHours12 = hours % 12 === 0 ? 12 : hours % 12;
  const pad = options?.padHours !== false;
  const hourFormatted = pad ? String(displayHours12).padStart(2, "0") : String(displayHours12);
  const minFormatted = String(minutes).padStart(2, "0");

  return `${hourFormatted}:${minFormatted} ${meridian}`;
}

/**
 * Formats a Date or date string in Indian standard format.
 * Defaults to "29 Aug 2026" (style="short") or "29/08/2026" (style="numeric").
 */
export function formatIndianDate(
  dateStr?: string | Date | null,
  style: "short" | "medium" | "long" | "numeric" = "short"
): string {
  if (!dateStr) return "";

  let d: Date;
  if (dateStr instanceof Date) {
    d = dateStr;
  } else if (typeof dateStr === "string") {
    const clean = dateStr.trim();
    if (!clean) return "";
    if (clean.includes("T")) {
      d = new Date(clean);
    } else {
      // YYYY-MM-DD parse in local / IST
      const match = clean.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
      if (match) {
        d = new Date(parseInt(match[1], 10), parseInt(match[2], 10) - 1, parseInt(match[3], 10));
      } else {
        d = new Date(clean);
      }
    }
  } else {
    return "";
  }

  if (isNaN(d.getTime())) return typeof dateStr === "string" ? dateStr : "";

  if (style === "numeric") {
    return d.toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  if (style === "medium") {
    return d.toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  if (style === "long") {
    return d.toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  return d.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Formats a combined Date and Time in Indian standard format (e.g. "29 Aug 2026, 09:30 AM").
 */
export function formatIndianDateTime(
  dateStr?: string | Date | null,
  timeStr?: string | null,
  options?: { padHours?: boolean }
): string {
  if (!dateStr) return "";
  const dateFormatted = formatIndianDate(dateStr, "short");
  const timeFormatted = timeStr ? formatIndianTime(timeStr, options) : "";
  if (!timeFormatted) return dateFormatted;
  return `${dateFormatted}, ${timeFormatted}`;
}

/**
 * Checks whether an end time is earlier than or equal to start time.
 */
export function isEndTimeBeforeOrEqualStartTime(startTime?: string, endTime?: string): boolean {
  if (!startTime || !endTime) return false;
  const startComp = parseTimeComponents(startTime);
  const endComp = parseTimeComponents(endTime);
  if (!startComp || !endComp) return false;

  const startMins = startComp.hours * 60 + startComp.minutes;
  const endMins = endComp.hours * 60 + endComp.minutes;
  return endMins <= startMins;
}

/**
 * Validates a time range in IST.
 */
export function validateTimeRangeIST(
  startTime?: string,
  endTime?: string
): { isValid: boolean; error?: string } {
  if (!startTime) {
    return { isValid: false, error: "Start time is required" };
  }
  if (!endTime) {
    return { isValid: false, error: "End time is required" };
  }
  if (isEndTimeBeforeOrEqualStartTime(startTime, endTime)) {
    return { isValid: false, error: "End time must be after start time" };
  }
  return { isValid: true };
}

/**
 * Checks if a slot with date and time has passed according to current Indian Standard Time (Asia/Kolkata).
 */
export function isSlotPassedIST(slotDate?: string, slotTime?: string): boolean {
  if (!slotDate) return false;
  const nowIST = getNowInIST();

  let targetDate: Date | null = null;
  const trimmed = slotDate.trim();
  const match = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (match) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const day = parseInt(match[3], 10);
    const timeComp = parseTimeComponents(slotTime);
    const hours = timeComp ? timeComp.hours : 23;
    const minutes = timeComp ? timeComp.minutes : 59;
    targetDate = new Date(year, month, day, hours, minutes, 0);
  } else {
    targetDate = new Date(trimmed);
    if (slotTime) {
      const timeComp = parseTimeComponents(slotTime);
      if (timeComp) {
        targetDate.setHours(timeComp.hours, timeComp.minutes, 0, 0);
      }
    }
  }

  if (!targetDate || isNaN(targetDate.getTime())) return false;
  return nowIST.getTime() > targetDate.getTime();
}
