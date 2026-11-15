export type BreakType = 'LUNCH' | 'DINNER' | 'DRINKS' | 'TEA' | 'CEREMONY' | 'MAINTENANCE' | 'CUSTOM';

export interface TournamentBreak {
  id: string;
  name: string;
  type: BreakType;
  startTime: string; // e.g. "01:00 PM"
  endTime: string;   // e.g. "02:00 PM"
  durationMinutes: number; // e.g. 60
  enabled: boolean;
  applicableDays?: number[]; // [0, 6] for weekends, undefined for all
  description?: string;
}

export const DEFAULT_TOURNAMENT_BREAKS: TournamentBreak[] = [
  {
    id: 'break-lunch',
    name: 'Lunch Break',
    type: 'LUNCH',
    startTime: '01:00 PM',
    endTime: '02:00 PM',
    durationMinutes: 60,
    enabled: true,
    description: 'Midday meal & rest pause for players, umpires, and staff',
  },
  {
    id: 'break-drinks',
    name: 'Tea / Drinks Break',
    type: 'DRINKS',
    startTime: '04:30 PM',
    endTime: '05:00 PM',
    durationMinutes: 30,
    enabled: false,
    description: 'Afternoon hydration and snack break',
  },
  {
    id: 'break-dinner',
    name: 'Dinner Break',
    type: 'DINNER',
    startTime: '08:00 PM',
    endTime: '09:00 PM',
    durationMinutes: 60,
    enabled: false,
    description: 'Evening dinner pause before night playoff matches',
  },
];

/** Parses 12-hour or 24-hour time string into minutes since midnight (0..1439). */
export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const match12 = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (match12) {
    let h = parseInt(match12[1], 10);
    const m = parseInt(match12[2], 10);
    const meridiem = match12[3]?.toUpperCase();
    if (meridiem === 'PM' && h !== 12) h += 12;
    if (meridiem === 'AM' && h === 12) h = 0;
    return h * 60 + m;
  }
  return 0;
}

/** Converts minutes since midnight into 12-hour formatted time ("01:00 PM"). */
export function formatMinutesToTime(totalMinutes: number): string {
  const mins = ((totalMinutes % 1440) + 1440) % 1440;
  const h24 = Math.floor(mins / 60);
  const m = mins % 60;
  const meridiem = h24 >= 12 ? 'PM' : 'AM';
  let h12 = h24 % 12;
  if (h12 === 0) h12 = 12;
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${meridiem}`;
}

/** Calculates duration in minutes between start and end times. */
export function calcBreakDuration(startTime: string, endTime: string): number {
  const s = parseTimeToMinutes(startTime);
  const e = parseTimeToMinutes(endTime);
  return e >= s ? e - s : (1440 - s) + e;
}

/**
 * Checks whether a candidate match slot [slotStartMin, slotStartMin + durationMin]
 * intersects with any enabled break window.
 * Returns the conflicting TournamentBreak, or null if clear.
 */
export function isSlotOverlappingBreak(
  slotStartMin: number,
  slotDurationMin: number,
  breaks: TournamentBreak[],
  dayOfWeek?: number
): TournamentBreak | null {
  const slotEndMin = slotStartMin + slotDurationMin;

  for (const b of breaks) {
    if (!b.enabled) continue;
    if (dayOfWeek !== undefined && b.applicableDays && b.applicableDays.length > 0) {
      if (!b.applicableDays.includes(dayOfWeek)) continue;
    }

    const bStart = parseTimeToMinutes(b.startTime);
    const bEnd = parseTimeToMinutes(b.endTime);

    // Overlap condition: max(start) < min(end)
    if (Math.max(slotStartMin, bStart) < Math.min(slotEndMin, bEnd)) {
      return b;
    }
  }

  return null;
}

/**
 * Given a proposed start time, pushes it past any break window that would be overlapped
 * by the match. If the match finishes comfortably before a break, it is kept. If it would
 * spill into the break, it jumps to the break's endTime.
 */
export function getNextAvailableSlotAfterBreaks(
  currentTimeMin: number,
  matchDurationMin: number,
  breaks: TournamentBreak[],
  dayOfWeek?: number
): { nextTimeMin: number; skippedBreaks: TournamentBreak[] } {
  let timeMin = currentTimeMin;
  const skippedBreaks: TournamentBreak[] = [];
  let guard = 0;

  while (guard < 10) {
    const conflict = isSlotOverlappingBreak(timeMin, matchDurationMin, breaks, dayOfWeek);
    if (!conflict) break;

    const bEnd = parseTimeToMinutes(conflict.endTime);
    if (bEnd > timeMin) {
      timeMin = bEnd;
      if (!skippedBreaks.some(b => b.id === conflict.id)) {
        skippedBreaks.push(conflict);
      }
    } else {
      // Midnight wrap-around guard
      break;
    }
    guard++;
  }

  return { nextTimeMin: timeMin, skippedBreaks };
}

/** Returns visual theme metadata for a break type. */
export function getBreakVisualTheme(type: BreakType): {
  icon: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  bannerBg: string;
  bannerBorder: string;
} {
  switch (type) {
    case 'LUNCH':
      return {
        icon: '🥪',
        badgeBg: 'bg-amber-100',
        badgeBorder: 'border-amber-300',
        badgeText: 'text-amber-800',
        bannerBg: 'bg-gradient-to-r from-amber-50/90 via-orange-50/70 to-amber-50/90',
        bannerBorder: 'border-amber-200',
      };
    case 'DINNER':
      return {
        icon: '🍽️',
        badgeBg: 'bg-indigo-100',
        badgeBorder: 'border-indigo-300',
        badgeText: 'text-indigo-800',
        bannerBg: 'bg-gradient-to-r from-indigo-50/90 via-purple-50/70 to-indigo-50/90',
        bannerBorder: 'border-indigo-200',
      };
    case 'DRINKS':
    case 'TEA':
      return {
        icon: '☕',
        badgeBg: 'bg-teal-100',
        badgeBorder: 'border-teal-300',
        badgeText: 'text-teal-800',
        bannerBg: 'bg-gradient-to-r from-teal-50/90 via-emerald-50/70 to-teal-50/90',
        bannerBorder: 'border-teal-200',
      };
    case 'CEREMONY':
      return {
        icon: '🎉',
        badgeBg: 'bg-purple-100',
        badgeBorder: 'border-purple-300',
        badgeText: 'text-purple-800',
        bannerBg: 'bg-gradient-to-r from-purple-50/90 via-pink-50/70 to-purple-50/90',
        bannerBorder: 'border-purple-200',
      };
    case 'MAINTENANCE':
      return {
        icon: '🧹',
        badgeBg: 'bg-slate-100',
        badgeBorder: 'border-slate-300',
        badgeText: 'text-slate-800',
        bannerBg: 'bg-gradient-to-r from-slate-50 via-slate-100/70 to-slate-50',
        bannerBorder: 'border-slate-200',
      };
    default:
      return {
        icon: '⏸️',
        badgeBg: 'bg-blue-100',
        badgeBorder: 'border-blue-300',
        badgeText: 'text-blue-800',
        bannerBg: 'bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-blue-50/90',
        bannerBorder: 'border-blue-200',
      };
  }
}

/**
 * Advances a date string (YYYY-MM-DD) until its day of week is in allowedDays (0=Sun..6=Sat).
 * If allowedDays is not specified, empty, or contains all 7 days, returns dateStr unchanged.
 */
export function advanceDateToAllowedDay(dateStr: string, allowedDays?: number[]): string {
  if (!allowedDays || allowedDays.length === 0 || allowedDays.length === 7) return dateStr;
  const parts = dateStr.split('-');
  const d = parts.length === 3
    ? new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
    : new Date(dateStr);
  let guard = 0;
  while (!allowedDays.includes(d.getDay()) && guard < 14) {
    d.setDate(d.getDate() + 1);
    guard++;
  }
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Checks if a proposed match starting at startMin with durationMin would end after endTimeMin.
 */
export function isMatchExceedingDayEnd(startMin: number, durationMin: number, endTimeMin: number): boolean {
  return startMin + durationMin > endTimeMin;
}
