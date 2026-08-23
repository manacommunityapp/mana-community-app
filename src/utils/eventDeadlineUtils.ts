/**
 * eventDeadlineUtils.ts
 *
 * Utilities to evaluate registration status, deadlines, and date/time expiry for
 * Events, Pooja Sevas, Cultural Activities, and Individual Time Slots.
 */

/**
 * Extracts the latest time from a time string or range.
 * Examples:
 *   "08:30 AM – 10:00 AM" => { hours: 10, minutes: 0 }
 *   "06:30 PM" => { hours: 18, minutes: 30 }
 *   "18:00" => { hours: 18, minutes: 0 }
 *   "09:00 AM onwards" => { hours: 9, minutes: 0 }
 */
export function extractTimeComponents(timeStr?: string): { hours: number; minutes: number } | null {
  if (!timeStr || typeof timeStr !== "string") return null;

  const clean = timeStr.trim();
  if (!clean) return null;

  // If time range (e.g. "08:30 AM – 10:00 AM" or "08:30 - 10:00"), pick the second part (end time)
  let target = clean;
  if (clean.includes("–")) {
    const parts = clean.split("–");
    target = parts[parts.length - 1].trim();
  } else if (clean.includes(" - ") || (clean.includes("-") && !clean.includes("T"))) {
    const parts = clean.split(/-|\bto\b/i);
    target = parts[parts.length - 1].trim();
  }

  // Remove trailing "onwards", "pm", "am" tags cleanly
  const isPM = /pm/i.test(target);
  const isAM = /am/i.test(target);

  const match = target.match(/(\d{1,2})[:.](\d{2})(?::\d{2})?/);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);

    if (isPM && hours < 12) hours += 12;
    if (isAM && hours === 12) hours = 0;

    return { hours, minutes };
  }

  // Simple hour only e.g. "6 PM"
  const hourMatch = target.match(/(\d{1,2})\s*(am|pm)/i);
  if (hourMatch) {
    let hours = parseInt(hourMatch[1], 10);
    const meridian = hourMatch[2].toLowerCase();
    if (meridian === "pm" && hours < 12) hours += 12;
    if (meridian === "am" && hours === 12) hours = 0;
    return { hours, minutes: 0 };
  }

  return null;
}

/**
 * Flexible Date + Time parser supporting ISO strings, textual dates ("28 Aug 2026", "28 August 2026"),
 * and various time formats.
 */
export function parseFlexibleDateTime(dateStr?: string, timeStr?: string): Date | null {
  if (!dateStr || typeof dateStr !== "string") return null;

  const trimmedDate = dateStr.trim();
  if (!trimmedDate) return null;

  // If already an ISO string with time (e.g. "2026-08-28T18:00:00" or "2026-08-28 18:00")
  if (trimmedDate.includes("T") || (/\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/.test(trimmedDate))) {
    const parsed = new Date(trimmedDate.replace(" ", "T"));
    if (!isNaN(parsed.getTime())) return parsed;
  }

  let year: number = new Date().getFullYear();
  let monthIndex: number = -1;
  let day: number = -1;

  // 1. Check YYYY-MM-DD
  const isoMatch = trimmedDate.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    year = parseInt(isoMatch[1], 10);
    monthIndex = parseInt(isoMatch[2], 10) - 1;
    day = parseInt(isoMatch[3], 10);
  } else {
    // 2. Check Textual month e.g. "28 Aug 2026", "28 August", "Aug 28 2026"
    const months = [
      "jan", "feb", "mar", "apr", "may", "jun",
      "jul", "aug", "sep", "oct", "nov", "dec"
    ];
    const lower = trimmedDate.toLowerCase();
    for (let i = 0; i < months.length; i++) {
      if (lower.includes(months[i])) {
        monthIndex = i;
        break;
      }
    }

    const numbers = trimmedDate.match(/\d+/g);
    if (numbers && numbers.length > 0) {
      if (numbers.length === 1) {
        day = parseInt(numbers[0], 10);
      } else if (numbers.length >= 2) {
        // e.g. ["28", "2026"] or ["2026", "08", "28"]
        if (numbers[0].length === 4) {
          year = parseInt(numbers[0], 10);
          if (monthIndex === -1 && numbers[1]) monthIndex = parseInt(numbers[1], 10) - 1;
          if (numbers[2]) day = parseInt(numbers[2], 10);
        } else {
          day = parseInt(numbers[0], 10);
          const possibleYear = numbers.find((n) => n.length === 4);
          if (possibleYear) year = parseInt(possibleYear, 10);
        }
      }
    }
  }

  if (monthIndex === -1 || day === -1) {
    // Standard JS Date fallback parse
    const fallback = new Date(trimmedDate);
    if (!isNaN(fallback.getTime())) {
      if (timeStr) {
        const timeComp = extractTimeComponents(timeStr);
        if (timeComp) {
          fallback.setHours(timeComp.hours, timeComp.minutes, 0, 0);
        }
      }
      return fallback;
    }
    return null;
  }

  const timeComp = extractTimeComponents(timeStr);
  const hours = timeComp ? timeComp.hours : 23;
  const minutes = timeComp ? timeComp.minutes : 59;
  const seconds = timeComp ? 0 : 59;

  return new Date(year, monthIndex, day, hours, minutes, seconds);
}

/**
 * Returns true if the registration for an event, pooja, or activity has closed.
 */
export function isRegistrationClosed(item: any): boolean {
  if (!item) return false;

  // 1. Explicit closed flags
  if (
    item.registrationClosed === true ||
    item.isRegistrationClosed === true ||
    item.isClosed === true ||
    item.is_registration_closed === true ||
    item.is_closed === true ||
    item.isExpired === true
  ) {
    return true;
  }
  if (
    item.registrationOpen === false ||
    item.registrationEnabled === false ||
    item.isRegistrationOpen === false ||
    item.registration_open === false ||
    item.is_open === false
  ) {
    return true;
  }
  if (item.status) {
    const s = String(item.status).toUpperCase();
    if (s === "CLOSED" || s === "COMPLETED" || s === "EXPIRED" || s === "ENDED" || s === "CANCELLED") {
      return true;
    }
  }

  const now = new Date();

  // 2. Explicit Registration Deadline / End Date & Time
  const regDeadline =
    item.registrationDeadline ||
    item.registration_deadline ||
    item.regDeadline ||
    item.deadline;
  if (regDeadline) {
    const deadlineDate = parseFlexibleDateTime(
      regDeadline,
      item.registrationEndTime || item.registration_end_time || item.regEndTime
    );
    if (deadlineDate && !isNaN(deadlineDate.getTime())) {
      if (now.getTime() > deadlineDate.getTime()) return true;
    }
  }

  const regEndDate =
    item.registrationEndDate ||
    item.registration_end_date ||
    item.regEndDate;
  if (regEndDate) {
    const regEndTime =
      item.registrationEndTime ||
      item.registration_end_time ||
      item.regEndTime ||
      item.endTime;
    const deadlineDate = parseFlexibleDateTime(regEndDate, regEndTime);
    if (deadlineDate && !isNaN(deadlineDate.getTime())) {
      if (now.getTime() > deadlineDate.getTime()) return true;
    }
  }

  // 3. Event / Pooja Activity Schedule End Date & Time
  // If the activity or event itself has completed/ended
  const targetEndDate =
    item.endDate ||
    item.end_date ||
    item.date ||
    item.eventDate ||
    item.event_date ||
    item.startDate ||
    item.start_date ||
    item.slotDate;
  const targetEndTime =
    item.endTime ||
    item.end_time ||
    item.time ||
    item.eventTime ||
    item.event_time ||
    item.startTime ||
    item.start_time ||
    item.slotTime;

  if (targetEndDate) {
    const eventEndDateTime = parseFlexibleDateTime(targetEndDate, targetEndTime);
    if (eventEndDateTime && !isNaN(eventEndDateTime.getTime())) {
      if (now.getTime() > eventEndDateTime.getTime()) return true;
    }
  }

  return false;
}

/**
 * Checks if a specific pooja time slot or date has already passed.
 */
export function isPoojaSlotPassed(slotDate?: string, slotTime?: string): boolean {
  if (!slotDate) return false;
  const slotDateTime = parseFlexibleDateTime(slotDate, slotTime);
  if (!slotDateTime || isNaN(slotDateTime.getTime())) return false;
  return new Date().getTime() > slotDateTime.getTime();
}

/**
 * Formats a user-friendly badge or message for closed registrations.
 */
export function getRegistrationStatusLabel(item: any): { isClosed: boolean; label: string } {
  if (isRegistrationClosed(item)) {
    return { isClosed: true, label: "Registration Closed" };
  }
  return { isClosed: false, label: "Open" };
}

/**
 * Checks whether an end date is earlier than a start date.
 */
export function isEndDateBeforeStartDate(startDate?: string, endDate?: string): boolean {
  if (!startDate || !endDate) return false;
  return endDate.trim() < startDate.trim();
}

/**
 * Checks whether an end time is earlier than or equal to a start time on the same day.
 */
export function isEndTimeBeforeStartTime(startTime?: string, endTime?: string): boolean {
  if (!startTime || !endTime) return false;
  const startComp = extractTimeComponents(startTime);
  const endComp = extractTimeComponents(endTime);
  if (!startComp || !endComp) return false;
  const startMins = startComp.hours * 60 + startComp.minutes;
  const endMins = endComp.hours * 60 + endComp.minutes;
  return endMins <= startMins;
}

/**
 * Checks whether a registration deadline date is after the event start date.
 */
export function isRegistrationDeadlineAfterStartDate(startDate?: string, deadline?: string): boolean {
  if (!startDate || !deadline) return false;
  return deadline.trim() > startDate.trim();
}

