import { describe, it, expect } from 'vitest';
import {
  calculateRoundTimeline,
  computePlayoffRoundMatches,
  to24HourTime,
} from './SetupSchedule';
import type { PlayoffMatchDraft } from './playoffSchedule';
import type { TournamentBreak } from './breakScheduleUtils';

describe('SetupSchedule Playoff Timing & Sequencing', () => {
  const sampleBreaks: TournamentBreak[] = [
    {
      id: 'break-lunch',
      name: 'Lunch Break',
      type: 'LUNCH',
      startTime: '01:00 PM',
      endTime: '02:00 PM',
      durationMinutes: 60,
      enabled: true,
    },
  ];

  describe('calculateRoundTimeline', () => {
    it('calculates sequential slots with match duration and break time', () => {
      // 4 matches, 30 min duration, 10 min break, starting at 10:00 AM
      const timeline = calculateRoundTimeline(
        '10:00 AM',
        4,
        30,
        10,
        [],
        'sequential'
      );

      expect(timeline.slots).toHaveLength(4);
      expect(timeline.slots[0].startTime).toBe('10:00 AM');
      expect(timeline.slots[0].endTime).toBe('10:30 AM');

      expect(timeline.slots[1].startTime).toBe('10:40 AM');
      expect(timeline.slots[1].endTime).toBe('11:10 AM');

      expect(timeline.slots[2].startTime).toBe('11:20 AM');
      expect(timeline.slots[2].endTime).toBe('11:50 AM');

      expect(timeline.slots[3].startTime).toBe('12:00 PM');
      expect(timeline.slots[3].endTime).toBe('12:30 PM');

      expect(timeline.roundEndTime).toBe('12:30 PM');
      expect(timeline.nextAvailableTime).toBe('12:40 PM');
    });

    it('calculates same_time slots where all matches start concurrently', () => {
      // 4 matches, 30 min duration, starting at 10:00 AM
      const timeline = calculateRoundTimeline(
        '10:00 AM',
        4,
        30,
        10,
        [],
        'same_time'
      );

      expect(timeline.slots).toHaveLength(4);
      timeline.slots.forEach(slot => {
        expect(slot.startTime).toBe('10:00 AM');
        expect(slot.endTime).toBe('10:30 AM');
      });

      expect(timeline.roundEndTime).toBe('10:30 AM');
      expect(timeline.nextAvailableTime).toBe('10:40 AM');
    });

    it('jumps over scheduled tournament breaks during sequential scheduling', () => {
      // Starting at 12:40 PM, duration 30m, break 10m.
      // Match 1 would run 12:40 PM - 01:10 PM, but overlaps Lunch (01:00 PM - 02:00 PM).
      // So Match 1 jumps to 02:00 PM -> 02:30 PM.
      // Match 2 starts at 02:40 PM -> 03:10 PM.
      const timeline = calculateRoundTimeline(
        '12:40 PM',
        2,
        30,
        10,
        sampleBreaks,
        'sequential'
      );

      expect(timeline.slots).toHaveLength(2);
      expect(timeline.slots[0].startTime).toBe('02:00 PM');
      expect(timeline.slots[0].endTime).toBe('02:30 PM');

      expect(timeline.slots[1].startTime).toBe('02:40 PM');
      expect(timeline.slots[1].endTime).toBe('03:10 PM');

      expect(timeline.roundEndTime).toBe('03:10 PM');
      expect(timeline.nextAvailableTime).toBe('03:20 PM');
    });

    it('returns empty slots and safe fallback for matchCount <= 0', () => {
      const timeline = calculateRoundTimeline('09:00 AM', 0, 30);
      expect(timeline.slots).toHaveLength(0);
      expect(timeline.roundEndTime).toBe('09:00 AM');
      expect(timeline.nextAvailableTime).toBe('09:00 AM');
    });
  });

  describe('computePlayoffRoundMatches', () => {
    const mockMatches: PlayoffMatchDraft[] = [
      {
        id: 'qf-1',
        name: 'Quarter Final 1',
        round: 'QUARTER_FINAL',
        roundIndex: 0,
        home: { id: 'p1', name: 'Alice' },
        away: { id: 'p2', name: 'Bob' },
        date: '2026-11-20',
        time: '08:00 AM',
        duration: 30,
        venueId: 1,
        courtId: 'Court 1',
        moveSubsMatches: false,
      },
      {
        id: 'qf-2',
        name: 'Quarter Final 2',
        round: 'QUARTER_FINAL',
        roundIndex: 0,
        home: { id: 'p3', name: 'Charlie' },
        away: { id: 'p4', name: 'Diana' },
        date: '2026-11-20',
        time: '08:00 AM',
        duration: 30,
        venueId: 1,
        courtId: 'Court 2',
        moveSubsMatches: false,
      },
      {
        id: 'sf-1',
        name: 'Semi Final 1',
        round: 'SEMI_FINAL',
        roundIndex: 1,
        home: { id: 'w1', name: 'Winner QF1' },
        away: { id: 'w2', name: 'Winner QF2' },
        date: '2026-11-20',
        time: '08:00 AM',
        duration: 30,
        venueId: 1,
        courtId: 'Court 1',
        moveSubsMatches: false,
      },
      {
        id: 'fn-1',
        name: 'Final',
        round: 'FINAL',
        roundIndex: 2,
        home: { id: 'wsf1', name: 'Winner SF1' },
        away: { id: 'wsf2', name: 'Winner SF2' },
        date: '2026-11-20',
        time: '08:00 AM',
        duration: 30,
        venueId: 1,
        courtId: 'Court 1',
        moveSubsMatches: false,
      },
    ];

    it('schedules Quarter-Finals sequentially with staggered times instead of flattening to same time', () => {
      const result = computePlayoffRoundMatches(mockMatches, {
        roundDates: { QUARTER_FINAL: '2026-11-20' },
        roundTimes: { QUARTER_FINAL: '10:00 AM' },
        roundDurations: { QUARTER_FINAL: '30' },
        roundModes: { QUARTER_FINAL: 'sequential' },
        globalDuration: 30,
        breakMins: 10,
      });

      const qf1 = result.find(m => m.id === 'qf-1');
      const qf2 = result.find(m => m.id === 'qf-2');

      expect(qf1).toBeDefined();
      expect(qf2).toBeDefined();
      expect(qf1?.time).toBe('10:00 AM');
      expect(qf2?.time).toBe('10:40 AM'); // 10:00 AM + 30m duration + 10m break
      expect(qf1?.duration).toBe(30);
      expect(qf2?.duration).toBe(30);
    });

    it('schedules Quarter-Finals at same time when same_time mode is selected', () => {
      const result = computePlayoffRoundMatches(mockMatches, {
        roundDates: { QUARTER_FINAL: '2026-11-20' },
        roundTimes: { QUARTER_FINAL: '10:00 AM' },
        roundDurations: { QUARTER_FINAL: '30' },
        roundModes: { QUARTER_FINAL: 'same_time' },
        globalDuration: 30,
        breakMins: 10,
      });

      const qf1 = result.find(m => m.id === 'qf-1');
      const qf2 = result.find(m => m.id === 'qf-2');

      expect(qf1?.time).toBe('10:00 AM');
      expect(qf2?.time).toBe('10:00 AM');
    });

    it('supports round-specific durations across QF, SF, and Final progression', () => {
      // QF: 20 mins, SF: 35 mins, Final: 60 mins
      const result = computePlayoffRoundMatches(mockMatches, {
        roundDates: {
          QUARTER_FINAL: '2026-11-21',
          SEMI_FINAL: '2026-11-21',
          FINAL: '2026-11-21',
        },
        roundTimes: {
          QUARTER_FINAL: '09:00 AM',
          SEMI_FINAL: '10:30 AM',
          FINAL: '02:00 PM',
        },
        roundDurations: {
          QUARTER_FINAL: '20',
          SEMI_FINAL: '35',
          FINAL: '60',
        },
        roundModes: {
          QUARTER_FINAL: 'sequential',
          SEMI_FINAL: 'sequential',
          FINAL: 'sequential',
        },
        globalDuration: 30,
        breakMins: 10,
      });

      const qf1 = result.find(m => m.id === 'qf-1');
      const qf2 = result.find(m => m.id === 'qf-2');
      const sf1 = result.find(m => m.id === 'sf-1');
      const fn1 = result.find(m => m.id === 'fn-1');

      expect(qf1?.time).toBe('09:00 AM');
      expect(qf1?.duration).toBe(20);

      expect(qf2?.time).toBe('09:30 AM'); // 09:00 AM + 20m + 10m break
      expect(qf2?.duration).toBe(20);

      expect(sf1?.time).toBe('10:30 AM');
      expect(sf1?.duration).toBe(35);

      expect(fn1?.time).toBe('02:00 PM');
      expect(fn1?.duration).toBe(60);
    });

    it('advances dates according to allowed playoffDays when enabled', () => {
      // 2026-11-20 is a Friday (day 5).
      // If allowed playoffDays are [0, 6] (Saturday & Sunday), date should advance to Saturday 2026-11-21.
      const result = computePlayoffRoundMatches(mockMatches, {
        roundDates: {},
        roundTimes: {},
        roundDurations: {},
        roundModes: {},
        globalDuration: 30,
        breakMins: 10,
        usePlayoffDays: true,
        playoffDays: [0, 6], // Weekends only
      });

      const qf1 = result.find(m => m.id === 'qf-1');
      expect(qf1?.date).toBe('2026-11-21'); // Advanced to Saturday
    });
  });

  describe('to24HourTime', () => {
    it('converts 12-hour PM times correctly to 24-hour HH:mm', () => {
      expect(to24HourTime('04:00 PM')).toBe('16:00');
      expect(to24HourTime('12:00 PM')).toBe('12:00');
      expect(to24HourTime('01:30 PM')).toBe('13:30');
      expect(to24HourTime('11:45 PM')).toBe('23:45');
    });

    it('converts 12-hour AM times correctly to 24-hour HH:mm', () => {
      expect(to24HourTime('10:00 AM')).toBe('10:00');
      expect(to24HourTime('12:00 AM')).toBe('00:00');
      expect(to24HourTime('08:15 AM')).toBe('08:15');
    });

    it('handles already-24-hour or empty strings gracefully', () => {
      expect(to24HourTime('16:00')).toBe('16:00');
      expect(to24HourTime('09:30')).toBe('09:30');
      expect(to24HourTime('')).toBe('00:00');
    });
  });
});
