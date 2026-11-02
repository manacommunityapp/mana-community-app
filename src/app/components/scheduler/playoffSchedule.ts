// Playoff ("rounds to final") bracket TYPES and UI-side helpers.
//
// NOTE: The bracket GENERATION algorithm (buildPlayoffBracket and friends) now
// lives in the backend — PlayoffScheduleGenerator.java, exposed via
// POST /api/tournament/playoff/generate (tournamentService.generatePlayoffBracket).
// This file keeps only the shared types and the UI-state helpers that build the
// generate request and post-process the returned draft (overrides, placeholders).

export type PlayoffSeedingOrder = 'TRADITIONAL' | 'SEQUENTIAL' | 'RANDOM' | 'RANKING';

export type PlayoffParticipantRef = {
  id: string;
  name: string;
  flatNumber?: string;
};

export type PlayoffRoundType = 'QUARTER_FINAL' | 'SEMI_FINAL' | 'FINAL' | 'THIRD_PLACE';

export type PlayoffMatchDraft = {
  id: string;
  name: string;
  round: PlayoffRoundType;
  roundIndex: number;
  home: PlayoffParticipantRef;
  away: PlayoffParticipantRef;
  date: string;
  time: string;
  duration: number;
  venueId: number | null;
  courtId: string | null;
  moveSubsMatches: boolean;
  /** "AUTO_ADVANCED" for auto-advanced BYE matches; otherwise null/undefined. */
  status?: string | null;
};

export type PlayoffScheduleInput = {
  numGroups: number;
  proceedersPerGroup: number;
  seedingOrder: PlayoffSeedingOrder;
  thirdPlaceMatch: boolean;
  startDate: string;
  startTime: string;
  matchDurationMinutes: number;
  breakMinutes: number;
  venueId: number | null;
  courtId: string | number | null;
  /** Seeded players for the player-aware knockout draw (knockout-only). */
  participants?: Array<{ id: string; name: string; flatNumber: string | null; rating?: number | null }>;
  /** Selected court IDs for parallel allocation (Rule 4). */
  courtIds?: number[];
  matchDays?: number[];
};

export function parseBreakMinutes(breakTime: string): number {
  const match = breakTime.match(/(\d+)/);
  return match ? Number(match[1]) : 10;
}

export function parseTime12h(time: string): { hours: number; minutes: number } {
  const m = time.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return { hours: 8, minutes: 0 };
  let hours = Number(m[1]);
  const minutes = Number(m[2]);
  const meridiem = m[3].toUpperCase();
  if (meridiem === 'PM' && hours !== 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;
  return { hours, minutes };
}

export function formatTime12h(hours: number, minutes: number): string {
  const meridiem = hours >= 12 ? 'PM' : 'AM';
  let h = hours % 12;
  if (h === 0) h = 12;
  return `${String(h).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${meridiem}`;
}

export function addMinutesToTime(time: string, minutesToAdd: number): string {
  const { hours, minutes } = parseTime12h(time);
  const total = hours * 60 + minutes + minutesToAdd;
  const newHours = Math.floor(total / 60) % 24;
  const newMinutes = total % 60;
  return formatTime12h(newHours, newMinutes);
}

export type GroupMatchSlot = { date: string; time: string; duration: number };

/** Latest group-stage slot end (date + time + duration). Feeds the playoff start. */
export function getGroupStageEnd(
  groupMatches: GroupMatchSlot[],
  fallbackDate: string,
  fallbackTime: string
): { date: string; time: string } {
  if (groupMatches.length === 0) {
    return { date: fallbackDate, time: fallbackTime };
  }

  let best: GroupMatchSlot = groupMatches[0];
  let bestKey = -1;

  for (const m of groupMatches) {
    const { hours, minutes } = parseTime12h(m.time);
    const endMinutes = hours * 60 + minutes + (m.duration || 30);
    const key = new Date(m.date).getTime() * 10000 + endMinutes;
    if (key > bestKey) {
      bestKey = key;
      best = m;
    }
  }

  return {
    date: best.date,
    time: addMinutesToTime(best.time, best.duration || 30),
  };
}

export function applyPlayoffOverrides(
  matches: PlayoffMatchDraft[],
  overrides: Record<string, Partial<PlayoffMatchDraft>>
): PlayoffMatchDraft[] {
  return matches.map(m => {
    const o = overrides[m.id];
    if (!o) return m;
    return {
      ...m,
      ...o,
      home: o.home || m.home,
      away: o.away || m.away,
    };
  });
}

export function collectPlayoffPlaceholderOptions(matches: PlayoffMatchDraft[]): PlayoffParticipantRef[] {
  const seen = new Set<string>();
  const list: PlayoffParticipantRef[] = [];
  const add = (p: PlayoffParticipantRef) => {
    if (!seen.has(p.id)) {
      seen.add(p.id);
      list.push(p);
    }
  };
  for (const m of matches) {
    add(m.home);
    add(m.away);
  }
  return list;
}

// ═══════════════════════════════════════════════════════════════════════
// RESILIENT CLIENT-SIDE BRACKET GENERATION (Fallback engine)
// ═══════════════════════════════════════════════════════════════════════

export type ProceederSlot = { groupIndex: number; rank: number };

function proceederLabel(groupIndex: number, rank: number): string {
  return `Winner ${rank} of Group ${groupIndex + 1}`;
}

function matchWinnerLabel(matchName: string): string {
  return `${matchName} (Winner)`;
}

function slotId(groupIndex: number, rank: number): string {
  return `G${groupIndex + 1}-W${rank}`;
}

function buildProceederSlots(numGroups: number, proceedersPerGroup: number): ProceederSlot[] {
  const slots: ProceederSlot[] = [];
  for (let g = 0; g < numGroups; g++) {
    for (let r = 1; r <= proceedersPerGroup; r++) {
      slots.push({ groupIndex: g, rank: r });
    }
  }
  return slots;
}

function toSlotParticipant(slot: ProceederSlot): PlayoffParticipantRef {
  return {
    id: slotId(slot.groupIndex, slot.rank),
    name: proceederLabel(slot.groupIndex, slot.rank),
  };
}

function winnerRef(matchId: string, matchName: string): PlayoffParticipantRef {
  return {
    id: `${matchId}-winner`,
    name: matchWinnerLabel(matchName),
  };
}

function loserRef(matchId: string, matchName: string): PlayoffParticipantRef {
  return {
    id: `${matchId}-loser`,
    name: `Loser Of ${matchName}`,
  };
}

export function addDaysToDateString(dateStr: string, days: number): string {
  const parts = dateStr.split('-');
  const d = parts.length === 3
    ? new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
    : new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function createScheduleCursor(
  startDate: string,
  startTime: string,
  matchDurationMinutes: number,
  breakMinutes: number
) {
  let slotDate = startDate;
  let slotTime = startTime;
  const dayStartTime = startTime;

  return () => {
    const current = { date: slotDate, time: slotTime };
    slotTime = addMinutesToTime(slotTime, matchDurationMinutes + breakMinutes);
    if (parseTime12h(slotTime).hours < 6) {
      slotDate = addDaysToDateString(slotDate, 1);
      slotTime = dayStartTime;
    }
    return current;
  };
}

function roundLabel(type: PlayoffRoundType | string, indexInRound: number): string {
  switch (type) {
    case 'QUARTER_FINAL': return `Quarter Final ${indexInRound + 1}`;
    case 'SEMI_FINAL': return `Semi-Final ${indexInRound + 1}`;
    case 'FINAL': return 'Final';
    case 'THIRD_PLACE': return 'Third Place';
    default: return `${type} Match ${indexInRound + 1}`;
  }
}

function roundTypeForTeamCount(teamCount: number, roundIndex: number, totalRounds: number): PlayoffRoundType {
  if (roundIndex === totalRounds - 1) return 'FINAL';
  if (roundIndex === totalRounds - 2) return 'SEMI_FINAL';
  if (roundIndex === totalRounds - 3) return 'QUARTER_FINAL';
  return 'QUARTER_FINAL';
}

function buildFirstRoundPairings(
  slots: ProceederSlot[],
  seedingOrder: PlayoffSeedingOrder,
  numGroups: number
): Array<[ProceederSlot, ProceederSlot]> {
  if (slots.length < 2) return [];

  if (seedingOrder === 'SEQUENTIAL' && numGroups >= 2) {
    const pairs: Array<[ProceederSlot, ProceederSlot]> = [];
    for (let g = 0; g < numGroups; g += 2) {
      const left = slots.filter(s => s.groupIndex === g);
      const right = slots.filter(s => s.groupIndex === g + 1);
      const len = Math.min(left.length, right.length);
      for (let i = 0; i < len; i++) {
        pairs.push([left[i], right[i]]);
      }
    }
    if (pairs.length > 0) return pairs;
  }

  let ordered = [...slots];
  if (seedingOrder === 'RANDOM') {
    ordered = [...slots].sort(() => Math.random() - 0.5);
  }

  const pairs: Array<[ProceederSlot, ProceederSlot]> = [];
  let lo = 0;
  let hi = ordered.length - 1;
  while (lo < hi) {
    pairs.push([ordered[lo], ordered[hi]]);
    lo++;
    hi--;
  }
  return pairs;
}

function buildTwoGroupTwoProceederBracket(input: PlayoffScheduleInput): PlayoffMatchDraft[] {
  const {
    seedingOrder,
    thirdPlaceMatch,
    startDate,
    startTime,
    matchDurationMinutes,
    breakMinutes,
    venueId,
    courtId,
  } = input;

  const scheduleSlot = createScheduleCursor(startDate, startTime, matchDurationMinutes, breakMinutes);
  const base = {
    duration: matchDurationMinutes,
    venueId,
    courtId: courtId ? String(courtId) : null,
    moveSubsMatches: false,
  };

  let sf1Pair: [ProceederSlot, ProceederSlot];
  let sf2Pair: [ProceederSlot, ProceederSlot];

  if (seedingOrder === 'SEQUENTIAL') {
    sf1Pair = [{ groupIndex: 0, rank: 1 }, { groupIndex: 1, rank: 1 }];
    sf2Pair = [{ groupIndex: 0, rank: 2 }, { groupIndex: 1, rank: 2 }];
  } else {
    sf1Pair = [{ groupIndex: 0, rank: 1 }, { groupIndex: 1, rank: 2 }];
    sf2Pair = [{ groupIndex: 0, rank: 2 }, { groupIndex: 1, rank: 1 }];
  }

  const sf1Id = 'playoff-sf1';
  const sf2Id = 'playoff-sf2';
  const finalId = 'playoff-final';
  const s1 = scheduleSlot();
  const s2 = scheduleSlot();
  const sFinal = scheduleSlot();

  const matches: PlayoffMatchDraft[] = [
    {
      id: sf1Id,
      name: 'Semi-Final 1',
      round: 'SEMI_FINAL',
      roundIndex: 0,
      home: toSlotParticipant(sf1Pair[0]),
      away: toSlotParticipant(sf1Pair[1]),
      date: s1.date,
      time: s1.time,
      ...base,
    },
    {
      id: sf2Id,
      name: 'Semi-Final 2',
      round: 'SEMI_FINAL',
      roundIndex: 0,
      home: toSlotParticipant(sf2Pair[0]),
      away: toSlotParticipant(sf2Pair[1]),
      date: s2.date,
      time: s2.time,
      ...base,
    },
    {
      id: finalId,
      name: 'Final',
      round: 'FINAL',
      roundIndex: 1,
      home: winnerRef(sf1Id, 'Semi-Final 1'),
      away: winnerRef(sf2Id, 'Semi-Final 2'),
      date: sFinal.date,
      time: sFinal.time,
      ...base,
    },
  ];

  if (thirdPlaceMatch) {
    const s3 = scheduleSlot();
    matches.push({
      id: 'playoff-third-place',
      name: 'Third Place',
      round: 'THIRD_PLACE',
      roundIndex: 2,
      home: loserRef(sf1Id, 'Semi-Final 1'),
      away: loserRef(sf2Id, 'Semi-Final 2'),
      date: s3.date,
      time: s3.time,
      ...base,
    });
  }

  return matches;
}

function buildKnockoutFromPlayers(input: PlayoffScheduleInput): PlayoffMatchDraft[] {
  const players = input.participants || [];
  const n = players.length;
  if (n < 2) return [];

  const seeds: PlayoffParticipantRef[] = players.map(p => ({
    id: p.id,
    name: p.name,
    flatNumber: p.flatNumber || undefined,
  }));

  let power = 1;
  while (power < n) power <<= 1;
  const totalRounds = Math.max(1, Math.round(Math.log2(power)));

  const scheduleSlot = createScheduleCursor(
    input.startDate,
    input.startTime,
    input.matchDurationMinutes,
    input.breakMinutes
  );

  const matches: PlayoffMatchDraft[] = [];
  let currentRoundParticipants: PlayoffParticipantRef[] = [...seeds];
  let roundIndex = 0;

  while (currentRoundParticipants.length > 1) {
    const roundType = roundTypeForTeamCount(power, roundIndex, totalRounds);
    const numMatchesInRound = Math.floor(currentRoundParticipants.length / 2);
    const nextRoundParticipants: PlayoffParticipantRef[] = [];

    for (let m = 0; m < numMatchesInRound; m++) {
      const home = currentRoundParticipants[2 * m];
      const away = currentRoundParticipants[2 * m + 1];
      const name = roundType === 'FINAL' ? 'Final' : roundLabel(roundType, m);
      const id = roundType === 'FINAL' ? 'playoff-final' : `playoff-r${roundIndex}-m${m}`;
      const { date, time } = scheduleSlot();

      matches.push({
        id,
        name,
        round: roundType,
        roundIndex,
        home,
        away,
        date,
        time,
        duration: input.matchDurationMinutes,
        venueId: input.venueId,
        courtId: input.courtId ? String(input.courtId) : null,
        moveSubsMatches: false,
      });

      nextRoundParticipants.push(winnerRef(id, name));
    }

    if (currentRoundParticipants.length % 2 !== 0) {
      nextRoundParticipants.push(currentRoundParticipants[currentRoundParticipants.length - 1]);
    }

    currentRoundParticipants = nextRoundParticipants;
    roundIndex++;
  }

  if (input.thirdPlaceMatch) {
    const semiMatches = matches.filter(m => m.round === 'SEMI_FINAL');
    if (semiMatches.length >= 2) {
      const { date, time } = scheduleSlot();
      matches.push({
        id: 'playoff-third-place',
        name: 'Third Place',
        round: 'THIRD_PLACE',
        roundIndex,
        home: loserRef(semiMatches[0].id, semiMatches[0].name),
        away: loserRef(semiMatches[1].id, semiMatches[1].name),
        date,
        time,
        duration: input.matchDurationMinutes,
        venueId: input.venueId,
        courtId: input.courtId ? String(input.courtId) : null,
        moveSubsMatches: false,
      });
    }
  }

  return matches;
}

export function buildPlayoffBracket(input: PlayoffScheduleInput): PlayoffMatchDraft[] {
  if (input.participants && input.participants.length >= 2) {
    return buildKnockoutFromPlayers(input);
  }

  if (input.numGroups === 2 && input.proceedersPerGroup === 2) {
    return buildTwoGroupTwoProceederBracket(input);
  }

  const slots = buildProceederSlots(input.numGroups, input.proceedersPerGroup);
  const teamCount = slots.length;
  if (teamCount < 2) return [];

  const firstRoundPairs = buildFirstRoundPairings(slots, input.seedingOrder, input.numGroups);
  const totalRounds = Math.max(1, Math.ceil(Math.log2(teamCount)));
  const matches: PlayoffMatchDraft[] = [];

  let pending = firstRoundPairs.map(([home, away]) => ({
    home: toSlotParticipant(home),
    away: toSlotParticipant(away),
  }));

  let roundIndex = 0;
  const scheduleSlot = createScheduleCursor(
    input.startDate,
    input.startTime,
    input.matchDurationMinutes,
    input.breakMinutes
  );

  while (pending.length > 1) {
    const roundType = roundTypeForTeamCount(teamCount, roundIndex, totalRounds);
    const winners: PlayoffParticipantRef[] = [];

    pending.forEach((pair, matchIdx) => {
      const name = roundLabel(roundType, matchIdx);
      const id = `playoff-r${roundIndex}-m${matchIdx}`;
      const { date, time } = scheduleSlot();

      matches.push({
        id,
        name,
        round: roundType,
        roundIndex,
        home: pair.home,
        away: pair.away,
        date,
        time,
        duration: input.matchDurationMinutes,
        venueId: input.venueId,
        courtId: input.courtId ? String(input.courtId) : null,
        moveSubsMatches: false,
      });

      winners.push(winnerRef(id, name));
    });

    const nextPending: Array<{ home: PlayoffParticipantRef; away: PlayoffParticipantRef }> = [];
    for (let i = 0; i < winners.length; i += 2) {
      if (i + 1 < winners.length) {
        nextPending.push({ home: winners[i], away: winners[i + 1] });
      }
    }

    pending = nextPending;
    roundIndex++;
  }

  if (pending.length === 1) {
    const pair = pending[0];
    const name = 'Final';
    const id = 'playoff-final';
    const { date, time } = scheduleSlot();
    matches.push({
      id,
      name,
      round: 'FINAL',
      roundIndex,
      home: pair.home,
      away: pair.away,
      date,
      time,
      duration: input.matchDurationMinutes,
      venueId: input.venueId,
      courtId: input.courtId ? String(input.courtId) : null,
      moveSubsMatches: false,
    });
  }

  if (input.thirdPlaceMatch) {
    const semiMatches = matches.filter(m => m.round === 'SEMI_FINAL');
    if (semiMatches.length >= 2) {
      const { date, time } = scheduleSlot();
      matches.push({
        id: 'playoff-third-place',
        name: 'Third Place',
        round: 'THIRD_PLACE',
        roundIndex,
        home: loserRef(semiMatches[0].id, semiMatches[0].name),
        away: loserRef(semiMatches[1].id, semiMatches[1].name),
        date,
        time,
        duration: input.matchDurationMinutes,
        venueId: input.venueId,
        courtId: input.courtId ? String(input.courtId) : null,
        moveSubsMatches: false,
      });
    }
  }

  return matches;
}