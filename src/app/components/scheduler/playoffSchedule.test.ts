import { describe, it, expect } from 'vitest';
import { createScheduleCursor, buildPlayoffBracket } from './playoffSchedule';

describe('playoffSchedule - ScheduleCursor & Bracket Generation', () => {
  it('rolls over to next day when match would spill past endTime', () => {
    // 2026-06-20 (Saturday), 45-min match + 15-min break, daily window 09:00 AM - 10:30 AM
    // Match 1: 09:00 AM - 09:45 AM (ends at or before 10:30 AM -> OK)
    // Next slot: 10:00 AM. Match duration is 45 min -> ends at 10:45 AM > 10:30 AM -> must roll to next day!
    const cursor = createScheduleCursor(
      '2026-06-20',
      '09:00 AM',
      45,
      15,
      [],
      '10:30 AM',
      [0, 1, 2, 3, 4, 5, 6]
    );

    const s1 = cursor.next();
    expect(s1.date).toBe('2026-06-20');
    expect(s1.time).toBe('09:00 AM');

    const s2 = cursor.next();
    expect(s2.date).toBe('2026-06-21');
    expect(s2.time).toBe('09:00 AM');
  });

  it('weekends-only rollover jumps Sunday past weekdays to next Saturday', () => {
    // 2026-06-21 (Sunday) at 09:00 AM with cut-off 10:00 AM.
    // Match duration: 50 min.
    // Match 1: 09:00 AM - 09:50 AM.
    // Next candidate: 10:00 AM, would end 10:50 AM > 10:00 AM -> rolls!
    // Next allowed day for weekends [0, 6] from Sunday (0) must be Saturday 2026-06-27 (6).
    const cursor = createScheduleCursor(
      '2026-06-21',
      '09:00 AM',
      50,
      10,
      [],
      '10:00 AM',
      [0, 6]
    );

    const s1 = cursor.next();
    expect(s1.date).toBe('2026-06-21');

    const s2 = cursor.next();
    expect(s2.date).toBe('2026-06-27');
    expect(s2.time).toBe('09:00 AM');
  });

  it('weekdays-only rollover jumps Friday past weekend to next Monday', () => {
    // 2026-06-26 is a Friday.
    // Allowed days: [1, 2, 3, 4, 5] (Mon..Fri)
    // Next allowed day after Friday 2026-06-26 must be Monday 2026-06-29.
    const cursor = createScheduleCursor(
      '2026-06-26',
      '09:00 AM',
      50,
      10,
      [],
      '10:00 AM',
      [1, 2, 3, 4, 5]
    );

    const s1 = cursor.next();
    expect(s1.date).toBe('2026-06-26');

    const s2 = cursor.next();
    expect(s2.date).toBe('2026-06-29');
    expect(s2.time).toBe('09:00 AM');
  });

  it('anchor() re-positions date and time for designated rounds', () => {
    const cursor = createScheduleCursor(
      '2026-06-20',
      '09:00 AM',
      30,
      10,
      [],
      '08:00 PM',
      [0, 1, 2, 3, 4, 5, 6]
    );

    const s1 = cursor.next();
    expect(s1.date).toBe('2026-06-20');
    expect(s1.time).toBe('09:00 AM');

    // Anchor to Sunday 2026-06-21 at 04:00 PM for the Final
    cursor.anchor('2026-06-21', '04:00 PM');
    const s2 = cursor.next();
    expect(s2.date).toBe('2026-06-21');
    expect(s2.time).toBe('04:00 PM');
  });

  it('buildPlayoffBracket anchors rounds according to roundTimings configuration', () => {
    const matches = buildPlayoffBracket({
      numGroups: 2,
      proceedersPerGroup: 2,
      seedingOrder: 'TRADITIONAL',
      thirdPlaceMatch: true,
      startDate: '2026-06-20',
      startTime: '08:00 AM',
      endTime: '06:00 PM',
      matchDurationMinutes: 30,
      breakMinutes: 10,
      venueId: null,
      courtId: null,
      roundTimings: {
        SEMI_FINAL: { date: '2026-06-27', startTime: '10:00 AM' },
        FINAL: { date: '2026-06-28', startTime: '04:00 PM' },
        THIRD_PLACE: { date: '2026-06-28', startTime: '02:00 PM' },
      },
    });

    const sfMatches = matches.filter(m => m.round === 'SEMI_FINAL');
    expect(sfMatches).toHaveLength(2);
    expect(sfMatches[0].date).toBe('2026-06-27');
    expect(sfMatches[0].time).toBe('10:00 AM');
    expect(sfMatches[1].date).toBe('2026-06-27');
    expect(sfMatches[1].time).toBe('10:40 AM');

    const finalMatch = matches.find(m => m.round === 'FINAL');
    expect(finalMatch).toBeDefined();
    expect(finalMatch?.date).toBe('2026-06-28');
    expect(finalMatch?.time).toBe('04:00 PM');

    const thirdPlaceMatch = matches.find(m => m.round === 'THIRD_PLACE');
    expect(thirdPlaceMatch).toBeDefined();
    expect(thirdPlaceMatch?.date).toBe('2026-06-28');
    expect(thirdPlaceMatch?.time).toBe('02:00 PM');
  });

  it('guarantees playoffs have zero BYE matches when given odd participant count', () => {
    // 5 players entered into single elimination knockout
    const matches = buildPlayoffBracket({
      numGroups: 1,
      proceedersPerGroup: 5,
      seedingOrder: 'TRADITIONAL',
      thirdPlaceMatch: false,
      startDate: '2026-06-20',
      startTime: '08:00 AM',
      matchDurationMinutes: 30,
      breakMinutes: 10,
      venueId: null,
      courtId: null,
      participants: [
        { id: 'p1', name: 'Player 1', flatNumber: null },
        { id: 'p2', name: 'Player 2', flatNumber: null },
        { id: 'p3', name: 'Player 3', flatNumber: null },
        { id: 'p4', name: 'Player 4', flatNumber: null },
        { id: 'p5', name: 'Player 5', flatNumber: null },
      ],
    });

    // For 5 players in single elimination without 3rd place, total matches = 5 - 1 = 4
    expect(matches).toHaveLength(4);

    // Verify absolutely no match has BYE home/away or AUTO_ADVANCED status
    for (const m of matches) {
      expect(m.home.name).not.toBe('BYE');
      expect(m.home.id).not.toBe('bye');
      expect(m.away.name).not.toBe('BYE');
      expect(m.away.id).not.toBe('bye');
      expect(m.status).not.toBe('AUTO_ADVANCED');
    }
  });

  it('filters out any BYE participants passed in input seeds', () => {
    const matches = buildPlayoffBracket({
      numGroups: 1,
      proceedersPerGroup: 4,
      seedingOrder: 'TRADITIONAL',
      thirdPlaceMatch: false,
      startDate: '2026-06-20',
      startTime: '08:00 AM',
      matchDurationMinutes: 30,
      breakMinutes: 10,
      venueId: null,
      courtId: null,
      participants: [
        { id: 'p1', name: 'Player 1', flatNumber: null },
        { id: 'p2', name: 'Player 2', flatNumber: null },
        { id: 'p3', name: 'Player 3', flatNumber: null },
        { id: 'bye', name: 'BYE', flatNumber: null },
      ],
    });

    // 3 real players -> 2 matches (Semi-Final + Final)
    expect(matches).toHaveLength(2);
    for (const m of matches) {
      expect(m.home.name).not.toBe('BYE');
      expect(m.away.name).not.toBe('BYE');
    }
  });
});

