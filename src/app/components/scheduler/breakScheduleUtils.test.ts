import { describe, it, expect } from 'vitest';
import {
  parseTimeToMinutes,
  formatMinutesToTime,
  calcBreakDuration,
  isSlotOverlappingBreak,
  getNextAvailableSlotAfterBreaks,
  DEFAULT_TOURNAMENT_BREAKS,
  type TournamentBreak,
  advanceDateToAllowedDay,
  isMatchExceedingDayEnd,
} from './breakScheduleUtils';

describe('breakScheduleUtils', () => {
  it('parses 12-hour and 24-hour time strings correctly', () => {
    expect(parseTimeToMinutes('12:00 AM')).toBe(0);
    expect(parseTimeToMinutes('08:00 AM')).toBe(480);
    expect(parseTimeToMinutes('01:00 PM')).toBe(780);
    expect(parseTimeToMinutes('02:00 PM')).toBe(840);
    expect(parseTimeToMinutes('11:59 PM')).toBe(1439);
  });

  it('formats minutes to 12-hour time correctly', () => {
    expect(formatMinutesToTime(0)).toBe('12:00 AM');
    expect(formatMinutesToTime(480)).toBe('08:00 AM');
    expect(formatMinutesToTime(780)).toBe('01:00 PM');
    expect(formatMinutesToTime(840)).toBe('02:00 PM');
  });

  it('calculates break durations accurately', () => {
    expect(calcBreakDuration('01:00 PM', '02:00 PM')).toBe(60);
    expect(calcBreakDuration('04:30 PM', '05:00 PM')).toBe(30);
  });

  it('detects slot overlapping with Lunch break', () => {
    const lunchBreak: TournamentBreak = {
      id: 'lunch',
      name: 'Lunch Break',
      type: 'LUNCH',
      startTime: '01:00 PM', // 780
      endTime: '02:00 PM',   // 840
      durationMinutes: 60,
      enabled: true,
    };

    // Match 12:00 PM to 12:45 PM (720 to 765) -> finishes before lunch -> clear
    expect(isSlotOverlappingBreak(720, 45, [lunchBreak])).toBeNull();

    // Match 12:30 PM to 01:15 PM (750 to 795) -> spills into lunch -> conflict!
    expect(isSlotOverlappingBreak(750, 45, [lunchBreak])).toEqual(lunchBreak);

    // Match 01:15 PM to 01:45 PM (795 to 825) -> inside lunch -> conflict!
    expect(isSlotOverlappingBreak(795, 30, [lunchBreak])).toEqual(lunchBreak);

    // Match 02:00 PM to 02:45 PM (840 to 885) -> starts right after lunch -> clear
    expect(isSlotOverlappingBreak(840, 45, [lunchBreak])).toBeNull();
  });

  it('skips break window and advances slot to end of break', () => {
    const lunchBreak: TournamentBreak = {
      id: 'lunch',
      name: 'Lunch Break',
      type: 'LUNCH',
      startTime: '01:00 PM', // 780
      endTime: '02:00 PM',   // 840
      durationMinutes: 60,
      enabled: true,
    };

    // Proposed start at 12:45 PM for 45 min match (would end at 01:30 PM)
    const proposedStart = parseTimeToMinutes('12:45 PM'); // 765
    const { nextTimeMin, skippedBreaks } = getNextAvailableSlotAfterBreaks(proposedStart, 45, [lunchBreak]);

    // Should push to 02:00 PM (840)
    expect(nextTimeMin).toBe(840);
    expect(formatMinutesToTime(nextTimeMin)).toBe('02:00 PM');
    expect(skippedBreaks).toHaveLength(1);
    expect(skippedBreaks[0].name).toBe('Lunch Break');
  });

  it('preserves matches that comfortably finish before break', () => {
    const lunchBreak: TournamentBreak = {
      id: 'lunch',
      name: 'Lunch Break',
      type: 'LUNCH',
      startTime: '01:00 PM',
      endTime: '02:00 PM',
      durationMinutes: 60,
      enabled: true,
    };

    // Proposed start at 12:00 PM for 45 min match (ends 12:45 PM)
    const proposedStart = parseTimeToMinutes('12:00 PM'); // 720
    const { nextTimeMin, skippedBreaks } = getNextAvailableSlotAfterBreaks(proposedStart, 45, [lunchBreak]);

    expect(nextTimeMin).toBe(720);
    expect(skippedBreaks).toHaveLength(0);
  });

  it('ignores disabled breaks', () => {
    const disabledBreak: TournamentBreak = {
      id: 'dinner',
      name: 'Dinner Break',
      type: 'DINNER',
      startTime: '08:00 PM',
      endTime: '09:00 PM',
      durationMinutes: 60,
      enabled: false,
    };

    const slotStart = parseTimeToMinutes('08:15 PM');
    expect(isSlotOverlappingBreak(slotStart, 30, [disabledBreak])).toBeNull();
  });

  it('advances dates correctly for Weekends Only ([0, 6])', () => {
    // 2026-06-20 is Saturday (day 6) -> stays Saturday
    expect(advanceDateToAllowedDay('2026-06-20', [0, 6])).toBe('2026-06-20');
    // 2026-06-21 is Sunday (day 0) -> stays Sunday
    expect(advanceDateToAllowedDay('2026-06-21', [0, 6])).toBe('2026-06-21');
    // 2026-06-22 is Monday (day 1) -> jumps to next Saturday 2026-06-27 (+5 days)
    expect(advanceDateToAllowedDay('2026-06-22', [0, 6])).toBe('2026-06-27');
    // 2026-06-24 is Wednesday (day 3) -> jumps to next Saturday 2026-06-27
    expect(advanceDateToAllowedDay('2026-06-24', [0, 6])).toBe('2026-06-27');
  });

  it('advances dates correctly for Weekdays Only ([1, 2, 3, 4, 5])', () => {
    // 2026-06-22 is Monday (day 1) -> stays Monday
    expect(advanceDateToAllowedDay('2026-06-22', [1, 2, 3, 4, 5])).toBe('2026-06-22');
    // 2026-06-26 is Friday (day 5) -> stays Friday
    expect(advanceDateToAllowedDay('2026-06-26', [1, 2, 3, 4, 5])).toBe('2026-06-26');
    // 2026-06-27 is Saturday (day 6) -> jumps to next Monday 2026-06-29
    expect(advanceDateToAllowedDay('2026-06-27', [1, 2, 3, 4, 5])).toBe('2026-06-29');
    // 2026-06-28 is Sunday (day 0) -> jumps to next Monday 2026-06-29
    expect(advanceDateToAllowedDay('2026-06-28', [1, 2, 3, 4, 5])).toBe('2026-06-29');
  });

  it('checks if match spills past daily end time', () => {
    const endMin = parseTimeToMinutes('08:00 PM'); // 1200
    // 07:15 PM (1155) + 30 min duration = 1185 <= 1200 -> OK
    expect(isMatchExceedingDayEnd(1155, 30, endMin)).toBe(false);
    // 07:45 PM (1185) + 30 min duration = 1215 > 1200 -> Exceeds day end!
    expect(isMatchExceedingDayEnd(1185, 30, endMin)).toBe(true);
  });
});
