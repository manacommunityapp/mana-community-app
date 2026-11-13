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

export type PlayoffRoundType =
  | 'ROUND_OF_64'
  | 'ROUND_OF_32'
  | 'ROUND_OF_16'
  | 'QUARTER_FINAL'
  | 'SEMI_FINAL'
  | 'FINAL'
  | 'THIRD_PLACE';

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
  /** Rest / court collision warnings if any. */
  conflicts?: string[];
};

import type { TournamentBreak } from './breakScheduleUtils';
import {
  parseTimeToMinutes,
  formatMinutesToTime,
  getNextAvailableSlotAfterBreaks,
  advanceDateToAllowedDay,
  isMatchExceedingDayEnd,
} from './breakScheduleUtils';

export type RoundTimingAnchor = {
  date: string;
  startTime?: string;
  courtIds?: number[];
};

export type PlayoffScheduleInput = {
  numGroups: number;
  proceedersPerGroup: number;
  seedingOrder: PlayoffSeedingOrder;
  thirdPlaceMatch: boolean;
  startDate: string;
  startTime: string;
  endTime?: string;
  matchDurationMinutes: number;
  breakMinutes: number;
  breaks?: TournamentBreak[];
  venueId: number | null;
  courtId: string | number | null;
  /** Seeded players for the player-aware knockout draw (knockout-only). */
  participants?: Array<{ id: string; name: string; flatNumber: string | null; rating?: number | null }>;
  /** Selected court IDs for parallel allocation (Rule 4). */
  courtIds?: number[];
  matchDays?: number[];
  roundTimings?: Record<string, RoundTimingAnchor>;
  /**
   * When true, every BYE is consumed in the first knockout round (top seeds skip it) so all
   * later rounds (qualifiers/quarter-finals, semi-finals, final) are fully played with no byes.
   */
  byesFirstRoundOnly?: boolean;
  /** When true, preserves BYE fixtures in round 1 so visual brackets show the full 16/32/64/128 draw. */
  includeByesInBracket?: boolean;
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

/**
 * Returns true if a participant is a dummy BYE slot.
 * BYE matches are strictly forbidden in playoff / knockout brackets.
 */
export function isByeParticipant(participant?: { id?: string | null; name?: string | null } | null): boolean {
  if (!participant) return false;
  const name = participant.name?.trim().toUpperCase();
  const id = participant.id?.trim().toLowerCase();
  return id === 'bye' || name === 'BYE';
}

/**
 * Strips any dummy BYE / AUTO_ADVANCED matches from a playoff match list,
 * resolving any downstream winner-references directly to the non-BYE participant.
 */
export function sanitizePlayoffMatches(
  matches: PlayoffMatchDraft[],
  preserveFirstRoundByes = false
): PlayoffMatchDraft[] {
  if (!matches || matches.length === 0) return [];

  const autoAdvancedWinners = new Map<string, PlayoffParticipantRef>();

  for (const m of matches) {
    const homeIsBye = isByeParticipant(m.home);
    const awayIsBye = isByeParticipant(m.away);
    const isAutoAdv = m.status === 'AUTO_ADVANCED' || homeIsBye || awayIsBye;

    if (isAutoAdv) {
      const advanced = homeIsBye ? m.away : m.home;
      if (advanced && !isByeParticipant(advanced)) {
        autoAdvancedWinners.set(m.id, advanced);
        autoAdvancedWinners.set(`${m.id}-winner`, advanced);
      }
    }
  }

  const koMatches = matches.filter(m => m.round !== 'THIRD_PLACE');
  const earliestRoundIndex = koMatches.length > 0
    ? Math.min(...koMatches.map(m => m.roundIndex))
    : 0;

  const realMatches = matches.filter(m => {
    const homeIsBye = isByeParticipant(m.home);
    const awayIsBye = isByeParticipant(m.away);
    const isByeMatch = homeIsBye || awayIsBye || m.status === 'AUTO_ADVANCED';
    if (!isByeMatch) return true;
    // When preserveFirstRoundByes is requested, keep the earliest round BYE matches for the visual draw
    return preserveFirstRoundByes && m.roundIndex === earliestRoundIndex;
  });

  if (autoAdvancedWinners.size === 0) {
    return realMatches;
  }

  return realMatches.map(m => {
    // If it's a preserved earliest round BYE match, don't overwrite its participants
    if (preserveFirstRoundByes && m.roundIndex === earliestRoundIndex && (isByeParticipant(m.home) || isByeParticipant(m.away) || m.status === 'AUTO_ADVANCED')) {
      return m;
    }
    let home = m.home;
    let away = m.away;
    if (home && autoAdvancedWinners.has(home.id)) {
      home = autoAdvancedWinners.get(home.id)!;
    }
    if (away && autoAdvancedWinners.has(away.id)) {
      away = autoAdvancedWinners.get(away.id)!;
    }
    return { ...m, home, away };
  });
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
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export interface ScheduleCursor {
  (): { date: string; time: string };
  next(): { date: string; time: string };
  anchor(newDate?: string, newTime?: string): void;
  currentDate(): string;
}

export function createScheduleCursor(
  startDate: string,
  startTime: string,
  matchDurationMinutes: number,
  breakMinutes: number,
  breaks?: TournamentBreak[],
  endTime?: string,
  matchDays?: number[]
): ScheduleCursor {
  let slotDate = advanceDateToAllowedDay(startDate, matchDays);
  let slotTime = startTime;
  const dayStartTime = startTime;
  const enabledBreaks = breaks?.filter(b => b.enabled) || [];
  const endMin = (endTime && endTime.trim()) ? parseTimeToMinutes(endTime) : 1440;

  const rollToNextDay = () => {
    slotDate = advanceDateToAllowedDay(addDaysToDateString(slotDate, 1), matchDays);
    slotTime = dayStartTime;
    if (enabledBreaks.length > 0) {
      const startMins = parseTimeToMinutes(slotTime);
      const { nextTimeMin } = getNextAvailableSlotAfterBreaks(startMins, matchDurationMinutes, enabledBreaks);
      if (nextTimeMin !== startMins) {
        slotTime = formatMinutesToTime(nextTimeMin);
      }
    }
  };

  const nextSlot = () => {
    // 1. If slotTime overlaps with any break, advance past the break
    if (enabledBreaks.length > 0) {
      const curMins = parseTimeToMinutes(slotTime);
      const { nextTimeMin } = getNextAvailableSlotAfterBreaks(curMins, matchDurationMinutes, enabledBreaks);
      if (nextTimeMin !== curMins) {
        slotTime = formatMinutesToTime(nextTimeMin);
      }
    }

    if (isMatchExceedingDayEnd(parseTimeToMinutes(slotTime), matchDurationMinutes, endMin)) {
      rollToNextDay();
    }

    const current = { date: slotDate, time: slotTime };

    // Advance for next match
    slotTime = addMinutesToTime(slotTime, matchDurationMinutes + breakMinutes);

    // If next slot lands inside a break or would overlap it, push it past
    if (enabledBreaks.length > 0) {
      const nextMins = parseTimeToMinutes(slotTime);
      const { nextTimeMin } = getNextAvailableSlotAfterBreaks(nextMins, matchDurationMinutes, enabledBreaks);
      if (nextTimeMin !== nextMins) {
        slotTime = formatMinutesToTime(nextTimeMin);
      }
    }

    if (isMatchExceedingDayEnd(parseTimeToMinutes(slotTime), matchDurationMinutes, endMin) || parseTime12h(slotTime).hours < 6) {
      rollToNextDay();
    }
    return current;
  };

  return Object.assign(nextSlot, {
    next: nextSlot,
    anchor(newDate?: string, newTime?: string) {
      if (newDate && newDate.trim()) {
        slotDate = advanceDateToAllowedDay(newDate, matchDays);
      }
      if (newTime && newTime.trim()) {
        slotTime = newTime;
        if (enabledBreaks.length > 0) {
          const curMins = parseTimeToMinutes(slotTime);
          const { nextTimeMin } = getNextAvailableSlotAfterBreaks(curMins, matchDurationMinutes, enabledBreaks);
          if (nextTimeMin !== curMins) {
            slotTime = formatMinutesToTime(nextTimeMin);
          }
        }
      }
    },
    currentDate: () => slotDate,
  });
}

function roundLabel(type: PlayoffRoundType | string, indexInRound: number): string {
  switch (type) {
    case 'ROUND_OF_64': return `Round of 64 Match ${indexInRound + 1}`;
    case 'ROUND_OF_32': return `Round of 32 Match ${indexInRound + 1}`;
    case 'ROUND_OF_16': return `Round of 16 Match ${indexInRound + 1}`;
    case 'QUARTER_FINAL': return `Quarter Final ${indexInRound + 1}`;
    case 'SEMI_FINAL': return `Semi-Final ${indexInRound + 1}`;
    case 'FINAL': return 'Final';
    case 'THIRD_PLACE': return 'Third Place';
    default: return `${type} Match ${indexInRound + 1}`;
  }
}

function roundTypeForTeamCount(teamCount: number, roundIndex: number, totalRounds: number): PlayoffRoundType {
  const roundsFromFinal = totalRounds - 1 - roundIndex;
  switch (roundsFromFinal) {
    case 0: return 'FINAL';
    case 1: return 'SEMI_FINAL';
    case 2: return 'QUARTER_FINAL';
    case 3: return 'ROUND_OF_16';
    case 4: return 'ROUND_OF_32';
    case 5: return 'ROUND_OF_64';
    default: return 'ROUND_OF_16';
  }
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
    endTime,
    matchDays,
    roundTimings,
  } = input;

  const scheduleSlot = createScheduleCursor(
    startDate,
    startTime,
    matchDurationMinutes,
    breakMinutes,
    input.breaks,
    endTime,
    matchDays
  );

  const anchorRound = (roundName: string) => {
    if (roundTimings && roundTimings[roundName]) {
      const timing = roundTimings[roundName];
      scheduleSlot.anchor(timing.date, timing.startTime);
    }
  };

  const getCourtId = (roundName: string) => {
    if (roundTimings?.[roundName]?.courtIds?.length) {
      return String(roundTimings[roundName].courtIds![0]);
    }
    return courtId ? String(courtId) : null;
  };

  const base = {
    duration: matchDurationMinutes,
    venueId,
    courtId: courtId ? String(courtId) : null,
    moveSubsMatches: false,
  };

  let sf1Pair: [ProceederSlot, ProceederSlot];
  let sf2Pair: [ProceederSlot, ProceederSlot];

  if (seedingOrder === 'RANDOM') {
    const slots: ProceederSlot[] = [
      { groupIndex: 0, rank: 1 },
      { groupIndex: 0, rank: 2 },
      { groupIndex: 1, rank: 1 },
      { groupIndex: 1, rank: 2 },
    ];
    for (let i = slots.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [slots[i], slots[j]] = [slots[j], slots[i]];
    }
    sf1Pair = [slots[0], slots[1]];
    sf2Pair = [slots[2], slots[3]];
  } else if (seedingOrder === 'SEQUENTIAL') {
    sf1Pair = [{ groupIndex: 0, rank: 1 }, { groupIndex: 1, rank: 1 }];
    sf2Pair = [{ groupIndex: 0, rank: 2 }, { groupIndex: 1, rank: 2 }];
  } else {
    sf1Pair = [{ groupIndex: 0, rank: 1 }, { groupIndex: 1, rank: 2 }];
    sf2Pair = [{ groupIndex: 0, rank: 2 }, { groupIndex: 1, rank: 1 }];
  }

  const sf1Id = 'playoff-sf1';
  const sf2Id = 'playoff-sf2';
  const finalId = 'playoff-final';

  anchorRound('SEMI_FINAL');
  const s1 = scheduleSlot();
  const s2 = scheduleSlot();

  anchorRound('FINAL');
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
      courtId: getCourtId('SEMI_FINAL'),
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
      courtId: getCourtId('SEMI_FINAL'),
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
      courtId: getCourtId('FINAL'),
    },
  ];

  if (thirdPlaceMatch) {
    anchorRound('THIRD_PLACE');
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
      courtId: getCourtId('THIRD_PLACE'),
    });
  }

  return matches;
}

function buildKnockoutFromPlayers(input: PlayoffScheduleInput): PlayoffMatchDraft[] {
  const rawPlayers = input.participants || [];
  // Exclude any BYE dummy participants. Playoff brackets strictly prohibit BYE matches.
  const players = rawPlayers.filter(p => !isByeParticipant(p));
  const n = players.length;
  if (n < 2) return [];

  const seedingOrder = input.seedingOrder || 'TRADITIONAL';
  let orderedPlayers = [...players];

  if (seedingOrder === 'RANDOM') {
    // Fisher-Yates shuffle for true random matchups
    for (let i = orderedPlayers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = orderedPlayers[i];
      orderedPlayers[i] = orderedPlayers[j];
      orderedPlayers[j] = tmp;
    }
  } else if (seedingOrder === 'RANKING') {
    // Order by skill rating descending: highest rating -> Seed 1
    orderedPlayers.sort((a, b) => {
      const rA = a.rating != null ? Number(a.rating) : -Infinity;
      const rB = b.rating != null ? Number(b.rating) : -Infinity;
      if (rB !== rA) return rB - rA;
      return 0;
    });
  }

  const seeds: PlayoffParticipantRef[] = orderedPlayers.map(p => ({
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
    input.breakMinutes,
    input.breaks,
    input.endTime,
    input.matchDays
  );

  const anchorRound = (roundName: string) => {
    if (input.roundTimings && input.roundTimings[roundName]) {
      const timing = input.roundTimings[roundName];
      scheduleSlot.anchor(timing.date, timing.startTime);
    }
  };

  const getCourtId = (roundName: string) => {
    if (input.roundTimings?.[roundName]?.courtIds?.length) {
      return String(input.roundTimings[roundName].courtIds![0]);
    }
    return input.courtId ? String(input.courtId) : null;
  };

  const matches: PlayoffMatchDraft[] = [];
  const numByes = power - n;
  let currentRoundParticipants: PlayoffParticipantRef[] = [];
  let roundIndex = 0;

  if (seedingOrder === 'SEQUENTIAL') {
    // Sequential mode: pairs consecutive adjacent players: (0 vs 1), (2 vs 3)...
    if (numByes > 0) {
      const round1Byes = seeds.slice(0, numByes);
      const round1Players = seeds.slice(numByes);

      const roundType = roundTypeForTeamCount(power, roundIndex, totalRounds);
      anchorRound(roundType);
      const numMatchesInRound = Math.floor(round1Players.length / 2);
      const round1Winners: PlayoffParticipantRef[] = [];

      for (let m = 0; m < numMatchesInRound; m++) {
        const home = round1Players[2 * m];
        const away = round1Players[2 * m + 1];
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
          courtId: getCourtId(roundType),
          moveSubsMatches: false,
        });

        round1Winners.push(winnerRef(id, name));
      }

      const nextRound: PlayoffParticipantRef[] = [];
      const maxLen = Math.max(round1Byes.length, round1Winners.length);
      for (let i = 0; i < maxLen; i++) {
        if (i < round1Byes.length) nextRound.push(round1Byes[i]);
        if (i < round1Winners.length) nextRound.push(round1Winners[i]);
      }
      currentRoundParticipants = nextRound;
      roundIndex++;
    } else {
      currentRoundParticipants = [...seeds];
    }

    while (currentRoundParticipants.length > 1) {
      const roundType = roundTypeForTeamCount(power, roundIndex, totalRounds);
      anchorRound(roundType);
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
          courtId: getCourtId(roundType),
          moveSubsMatches: false,
        });

        nextRoundParticipants.push(winnerRef(id, name));
      }

      currentRoundParticipants = nextRoundParticipants;
      roundIndex++;
    }
  } else {
    // TRADITIONAL, RANKING, and RANDOM: standard tournament bracket tree.
    // Places Seed 1 at the top of the bracket and Seed 2 at the bottom, so they can only meet in the Final.
    let order: number[] = [1, 2];
    while (order.length < power) {
      const nextSum = order.length * 2 + 1;
      const expanded: number[] = [];
      for (let i = 0; i < order.length; i += 2) {
        expanded.push(order[i], nextSum - order[i], order[i + 1], nextSum - order[i + 1]);
      }
      order = expanded;
    }

    const roundType = roundTypeForTeamCount(power, roundIndex, totalRounds);
    anchorRound(roundType);
    const nextRound: PlayoffParticipantRef[] = [];
    let m = 0;
    for (let i = 0; i < order.length; i += 2) {
      const x = order[i];
      const y = order[i + 1];
      const name = roundType === 'FINAL' ? 'Final' : roundLabel(roundType, m);
      const id = roundType === 'FINAL' ? 'playoff-final' : `playoff-r${roundIndex}-m${m}`;

      if (Math.max(x, y) > n) {
        const seededPlayer = seeds[Math.min(x, y) - 1];
        if (input.includeByesInBracket) {
          const home = x <= n ? seeds[x - 1] : { id: 'bye', name: 'BYE' };
          const away = y <= n ? seeds[y - 1] : { id: 'bye', name: 'BYE' };
          matches.push({
            id,
            name: `${name} (BYE)`,
            round: roundType,
            roundIndex,
            home,
            away,
            date: input.startDate,
            time: '',
            duration: input.matchDurationMinutes,
            venueId: input.venueId,
            courtId: null,
            moveSubsMatches: false,
            status: 'AUTO_ADVANCED',
          });
          nextRound.push(winnerRef(id, name));
        } else {
          nextRound.push(seededPlayer);
        }
        m++;
        continue;
      }
      const home = seeds[x - 1];
      const away = seeds[y - 1];
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
        courtId: getCourtId(roundType),
        moveSubsMatches: false,
      });
      nextRound.push(winnerRef(id, name));
      m++;
    }
    currentRoundParticipants = nextRound;
    roundIndex++;

    while (currentRoundParticipants.length > 1) {
      const currentRoundType = roundTypeForTeamCount(power, roundIndex, totalRounds);
      anchorRound(currentRoundType);
      const numMatchesInRound = Math.floor(currentRoundParticipants.length / 2);
      const nextRoundParticipants: PlayoffParticipantRef[] = [];

      for (let m = 0; m < numMatchesInRound; m++) {
        const home = currentRoundParticipants[2 * m];
        const away = currentRoundParticipants[2 * m + 1];
        const name = currentRoundType === 'FINAL' ? 'Final' : roundLabel(currentRoundType, m);
        const id = currentRoundType === 'FINAL' ? 'playoff-final' : `playoff-r${roundIndex}-m${m}`;
        const { date, time } = scheduleSlot();

        matches.push({
          id,
          name,
          round: currentRoundType,
          roundIndex,
          home,
          away,
          date,
          time,
          duration: input.matchDurationMinutes,
          venueId: input.venueId,
          courtId: getCourtId(currentRoundType),
          moveSubsMatches: false,
        });

        nextRoundParticipants.push(winnerRef(id, name));
      }

      currentRoundParticipants = nextRoundParticipants;
      roundIndex++;
    }
  }

    if (input.thirdPlaceMatch) {
    anchorRound('THIRD_PLACE');
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
        courtId: getCourtId('THIRD_PLACE'),
        moveSubsMatches: false,
      });
    }
  }

  return sanitizePlayoffMatches(matches, Boolean(input.includeByesInBracket));
}

export function buildPlayoffBracket(input: PlayoffScheduleInput): PlayoffMatchDraft[] {
  let matches: PlayoffMatchDraft[] = [];

  if (input.participants && input.participants.length >= 2) {
    matches = buildKnockoutFromPlayers(input);
  } else if (input.numGroups === 2 && input.proceedersPerGroup === 2) {
    matches = buildTwoGroupTwoProceederBracket(input);
  } else {
    const slots = buildProceederSlots(input.numGroups, input.proceedersPerGroup);
    const teamCount = slots.length;
    if (teamCount < 2) return [];

    const slotParticipants: PlayoffParticipantRef[] = slots.map(toSlotParticipant);
    matches = buildKnockoutFromPlayers({
      ...input,
      participants: slotParticipants.map(s => ({ id: s.id, name: s.name, flatNumber: null })),
    });
  }

  return sanitizePlayoffMatches(matches, Boolean(input.includeByesInBracket));
}

// ═══════════════════════════════════════════════════════════════════════
// TOURNAMENT BYE RECONSTRUCTION ENGINE
// Reconstructs missing first-round BYEs for legacy/saved tournament matches
// so the visual bracket tree and list/table views maintain complete parity
// with Setup Schedule.
// ═══════════════════════════════════════════════════════════════════════

import {
  getMatchStage,
  extractTeamNames,
  extractFlatDetails,
  type TournamentStageKey,
} from '../sports/admin/ScheduleExportModal';

const KO_ROUNDS_ORDER: TournamentStageKey[] = [
  'ROUND_OF_64',
  'ROUND_OF_32',
  'ROUND_OF_16',
  'QUARTER_FINAL',
  'SEMI_FINAL',
  'FINAL',
];

const STAGE_DISPLAY_LABELS: Record<TournamentStageKey, string> = {
  ALL: 'All Stages',
  GROUP: 'Group Stage',
  ROUND_OF_64: 'Round of 64',
  ROUND_OF_32: 'Round of 32',
  ROUND_OF_16: 'Round of 16',
  QUARTER_FINAL: 'Quarter-Finals',
  SEMI_FINAL: 'Semi-Finals',
  FINAL: 'Final',
  THIRD_PLACE: '3rd Place',
};

/**
 * Reconstructs missing first-round BYE matches for single-elimination knockout tournaments.
 * If the earliest knockout round has fewer matches than required by the next round (2 * N),
 * it synthesizes the auto-advanced BYE matches and orders them so that feeder slots
 * (2 * idx and 2 * idx + 1) connect directly to each next-round match.
 */
export function reconstructKnockoutByes(
  matches: any[],
  config?: { totalTeams?: number; tournamentType?: string } | null
): any[] {
  if (!matches || matches.length === 0) return matches;

  // Filter out any invalid items
  const validMatches = matches.filter(Boolean);

  // Group knockout matches by stage
  const matchesByStage = new Map<TournamentStageKey, any[]>();
  KO_ROUNDS_ORDER.forEach(r => matchesByStage.set(r, []));
  const otherMatches: any[] = [];

  for (const m of validMatches) {
    const stage = getMatchStage(m);
    if (stage === 'GROUP' || stage === 'THIRD_PLACE' || stage === 'ALL') {
      otherMatches.push(m);
    } else if (matchesByStage.has(stage)) {
      matchesByStage.get(stage)!.push(m);
    } else {
      otherMatches.push(m);
    }
  }

  // Find the earliest knockout round that has matches
  let earliestIdx = -1;
  for (let i = 0; i < KO_ROUNDS_ORDER.length; i++) {
    if ((matchesByStage.get(KO_ROUNDS_ORDER[i])?.length ?? 0) > 0) {
      earliestIdx = i;
      break;
    }
  }

  // If no knockout matches or only Final exists, nothing to reconstruct
  if (earliestIdx === -1 || earliestIdx >= KO_ROUNDS_ORDER.length - 1) {
    return matches;
  }

  const earliestStage = KO_ROUNDS_ORDER[earliestIdx];
  const nextStage = KO_ROUNDS_ORDER[earliestIdx + 1];
  const earliestMatches = matchesByStage.get(earliestStage) || [];
  const nextMatches = matchesByStage.get(nextStage) || [];

  if (nextMatches.length === 0) {
    return matches;
  }

  // Next round has N matches. A complete binary tree requires 2 * N matches in the preceding round.
  const expectedCount = nextMatches.length * 2;
  if (earliestMatches.length >= expectedCount) {
    // Earliest round already has the complete draw (BYEs are already stored)
    return matches;
  }

  const earliestDate =
    earliestMatches[0]?.scheduledAt ||
    earliestMatches[0]?.matchDate ||
    earliestMatches[0]?.date ||
    nextMatches[0]?.matchDate ||
    '';
  const earliestSport =
    earliestMatches[0]?.sport ||
    earliestMatches[0]?.sportName ||
    nextMatches[0]?.sport ||
    nextMatches[0]?.sportName ||
    '';
  const earliestTourn =
    earliestMatches[0]?.tournamentName ||
    nextMatches[0]?.tournamentName ||
    '';
  const earliestVenueId = earliestMatches[0]?.venueId ?? nextMatches[0]?.venueId ?? null;
  const earliestVenueName = earliestMatches[0]?.venueName || nextMatches[0]?.venueName || '';

  const availableRealMatches = [...earliestMatches];
  const orderedEarliest: any[] = [];

  nextMatches.forEach((nextM, nextIdx) => {
    const { team1: nextHome, team2: nextAway } = extractTeamNames(nextM);
    const { team1Flat: nextHomeFlat, team2Flat: nextAwayFlat } = extractFlatDetails(nextM);

    // Slot 2 * nextIdx (feeds nextHome)
    const homePlayedIdx = availableRealMatches.findIndex(rm => {
      const { team1, team2 } = extractTeamNames(rm);
      const hClean = (nextHome || '').trim().toLowerCase();
      if (!hClean || hClean === 'tbd' || hClean === 'bye') return false;
      return (
        (team1 && team1.trim().toLowerCase() === hClean) ||
        (team2 && team2.trim().toLowerCase() === hClean)
      );
    });

    if (homePlayedIdx !== -1) {
      // Real match produced nextHome
      const realMatch = availableRealMatches.splice(homePlayedIdx, 1)[0];
      orderedEarliest.push({
        ...realMatch,
        bracketSlot: nextIdx * 2,
      });
    } else {
      // nextHome did not play in earliest round => received a BYE!
      const playerObj = typeof nextM.home === 'object' ? nextM.home : null;
      orderedEarliest.push({
        matchId: `bye-${earliestStage}-${nextIdx * 2}`,
        id: `bye-${earliestStage}-${nextIdx * 2}`,
        matchNumber: 0,
        stage: earliestStage,
        round: earliestStage,
        roundType: earliestStage,
        roundIndex: earliestIdx,
        roundName: STAGE_DISPLAY_LABELS[earliestStage],
        groupName: STAGE_DISPLAY_LABELS[earliestStage],
        team1: nextHome || 'TBD',
        team2: 'BYE',
        homeName: nextHome || 'TBD',
        awayName: 'BYE',
        team1Flat: nextHomeFlat !== '—' ? nextHomeFlat : undefined,
        team2Flat: undefined,
        homeFlat: nextHomeFlat !== '—' ? nextHomeFlat : undefined,
        awayFlat: undefined,
        home: {
          id: playerObj?.id || `p-bye-${nextIdx * 2}`,
          name: nextHome || 'TBD',
          flatNumber: nextHomeFlat !== '—' ? nextHomeFlat : undefined,
        },
        away: { id: 'bye', name: 'BYE' },
        status: 'AUTO_ADVANCED',
        matchDate: earliestDate,
        date: earliestDate,
        scheduledAt: earliestDate
          ? (String(earliestDate).includes('T') ? String(earliestDate) : `${earliestDate}T00:00:00`)
          : undefined,
        matchTime: '',
        time: '',
        duration: 30,
        venueId: earliestVenueId,
        courtId: null,
        venueName: earliestVenueName,
        courtName: '',
        sport: earliestSport,
        sportName: earliestSport,
        tournamentName: earliestTourn,
        isPlayoff: true,
        bracketSlot: nextIdx * 2,
      });
    }

    // Slot 2 * nextIdx + 1 (feeds nextAway)
    const awayPlayedIdx = availableRealMatches.findIndex(rm => {
      const { team1, team2 } = extractTeamNames(rm);
      const aClean = (nextAway || '').trim().toLowerCase();
      if (!aClean || aClean === 'tbd' || aClean === 'bye') return false;
      return (
        (team1 && team1.trim().toLowerCase() === aClean) ||
        (team2 && team2.trim().toLowerCase() === aClean)
      );
    });

    if (awayPlayedIdx !== -1) {
      // Real match produced nextAway
      const realMatch = availableRealMatches.splice(awayPlayedIdx, 1)[0];
      orderedEarliest.push({
        ...realMatch,
        bracketSlot: nextIdx * 2 + 1,
      });
    } else {
      // nextAway did not play in earliest round => received a BYE!
      const playerObj = typeof nextM.away === 'object' ? nextM.away : null;
      orderedEarliest.push({
        matchId: `bye-${earliestStage}-${nextIdx * 2 + 1}`,
        id: `bye-${earliestStage}-${nextIdx * 2 + 1}`,
        matchNumber: 0,
        stage: earliestStage,
        round: earliestStage,
        roundType: earliestStage,
        roundIndex: earliestIdx,
        roundName: STAGE_DISPLAY_LABELS[earliestStage],
        groupName: STAGE_DISPLAY_LABELS[earliestStage],
        team1: nextAway || 'TBD',
        team2: 'BYE',
        homeName: nextAway || 'TBD',
        awayName: 'BYE',
        team1Flat: nextAwayFlat !== '—' ? nextAwayFlat : undefined,
        team2Flat: undefined,
        homeFlat: nextAwayFlat !== '—' ? nextAwayFlat : undefined,
        awayFlat: undefined,
        home: {
          id: playerObj?.id || `p-bye-${nextIdx * 2 + 1}`,
          name: nextAway || 'TBD',
          flatNumber: nextAwayFlat !== '—' ? nextAwayFlat : undefined,
        },
        away: { id: 'bye', name: 'BYE' },
        status: 'AUTO_ADVANCED',
        matchDate: earliestDate,
        date: earliestDate,
        scheduledAt: earliestDate
          ? (String(earliestDate).includes('T') ? String(earliestDate) : `${earliestDate}T00:00:00`)
          : undefined,
        matchTime: '',
        time: '',
        duration: 30,
        venueId: earliestVenueId,
        courtId: null,
        venueName: earliestVenueName,
        courtName: '',
        sport: earliestSport,
        sportName: earliestSport,
        tournamentName: earliestTourn,
        isPlayoff: true,
        bracketSlot: nextIdx * 2 + 1,
      });
    }
  });

  // Append any extra real matches if present
  if (availableRealMatches.length > 0) {
    orderedEarliest.push(...availableRealMatches);
  }

  // Update matchesByStage
  matchesByStage.set(earliestStage, orderedEarliest);

  // Combine back in round order: earliest -> next -> ... -> final, followed by group/3rd-place
  const result: any[] = [];
  KO_ROUNDS_ORDER.forEach(r => {
    result.push(...(matchesByStage.get(r) || []));
  });
  result.push(...otherMatches);

  // Renumber matches sequentially
  result.forEach((m, idx) => {
    m.matchNumber = idx + 1;
  });

  return result;
}
// ═══════════════════════════════════════════════════════════════════════
// Saved matches -> PlayoffMatchDraft[]
// Rebuilds the COMPLETE knockout bracket exactly as it was saved (including
// auto-advanced BYE slots), ordered by bracketSlot so feeder matches line up
// with the next round. Shared by Setup Schedule (edit mode) and the Config
// bracket view so both always show identical brackets.
// ═══════════════════════════════════════════════════════════════════════

const SAVED_KO_ROUND_INDEX: Record<string, number> = {
  ROUND_OF_64: 0,
  ROUND_OF_32: 1,
  ROUND_OF_16: 2,
  QUARTER_FINAL: 3,
  SEMI_FINAL: 4,
  FINAL: 5,
  THIRD_PLACE: 6,
};

const isByeName = (n?: string | null) => !!n && n.trim().toUpperCase() === 'BYE';
const isBlankName = (n?: string | null) => !n || ['', 'TBD'].includes(n.trim().toUpperCase());

export function buildPlayoffDraftFromSavedMatches(
  savedMatches: any[],
  config?: { totalTeams?: number; tournamentType?: string } | null
): PlayoffMatchDraft[] {
  if (!Array.isArray(savedMatches) || savedMatches.length === 0) return [];

  const completed = reconstructKnockoutByes(savedMatches.filter(Boolean), config);
  const knockout = completed
    .map((m, order) => ({ m, order, stage: getMatchStage(m) }))
    .filter(x => x.stage !== 'GROUP' && x.stage !== 'ALL' && (x.stage in SAVED_KO_ROUND_INDEX || x.stage === 'THIRD_PLACE'));

  // Normalize stages present in this tournament in chronological order: 0, 1, 2, ...
  const presentStages = KO_ROUNDS_ORDER.filter(s => knockout.some(x => x.stage === s));
  const stageRoundIndexMap = new Map<string, number>();
  presentStages.forEach((s, idx) => stageRoundIndexMap.set(s, idx));
  if (knockout.some(x => x.stage === 'THIRD_PLACE')) {
    stageRoundIndexMap.set('THIRD_PLACE', presentStages.length);
  }

  knockout.sort((a, b) => {
    const ra = stageRoundIndexMap.get(a.stage) ?? SAVED_KO_ROUND_INDEX[a.stage] ?? 99;
    const rb = stageRoundIndexMap.get(b.stage) ?? SAVED_KO_ROUND_INDEX[b.stage] ?? 99;
    if (ra !== rb) return ra - rb;
    const sa = Number(a.m.bracketSlot ?? Number.MAX_SAFE_INTEGER);
    const sb = Number(b.m.bracketSlot ?? Number.MAX_SAFE_INTEGER);
    if (sa !== sb) return sa - sb;
    const numA = Number(a.m.matchNumber ?? Number.MAX_SAFE_INTEGER);
    const numB = Number(b.m.matchNumber ?? Number.MAX_SAFE_INTEGER);
    if (numA !== numB) return numA - numB;
    return a.order - b.order;
  });

  const byRound = new Map<number, PlayoffMatchDraft[]>();
  const drafts: PlayoffMatchDraft[] = [];

  knockout.forEach(({ m, stage }, idx) => {
    const roundIndex = stageRoundIndexMap.get(stage) ?? (SAVED_KO_ROUND_INDEX[stage] ?? 0);
    const { team1, team2 } = extractTeamNames(m);
    const { team1Flat, team2Flat } = extractFlatDetails(m);
    const status = String(m.status || '').toUpperCase();
    const byeStatus = status === 'AUTO_ADVANCED' || status === 'BYE';

    let homeBye = isByeName(team1) || (typeof m.home === 'object' && m.home?.id === 'bye');
    let awayBye = isByeName(team2) || (typeof m.away === 'object' && m.away?.id === 'bye');
    if (byeStatus && !homeBye && !awayBye) {
      if (isBlankName(team2)) awayBye = true;
      else if (isBlankName(team1)) homeBye = true;
      else awayBye = true;
    }
    const isBye = homeBye || awayBye;

    let date = '';
    let time = '';
    if (m.scheduledAt) {
      const [d, t] = String(m.scheduledAt).split('T');
      date = d || '';
      if (t && !isBye) {
        const [hh, mm] = t.substring(0, 5).split(':').map(Number);
        time = !isNaN(hh) && !isNaN(mm) ? formatMinutesToTime(hh * 60 + mm) : t.substring(0, 5);
      }
    } else {
      date = m.matchDate || m.date || '';
      time = isBye ? '' : (m.matchTime || m.time || '');
    }

    const id = String(m.matchId ?? m.id ?? `saved-${idx}`);
    const posInRound = (byRound.get(roundIndex) || []).length;
    const prev = byRound.get(roundIndex - 1) || [];
    const prevIds = new Set(prev.flatMap(pm => [pm.home.id, pm.away.id]));

    const resolveRef = (
      rawId: unknown,
      name: string,
      flat: string,
      bye: boolean,
      feederIdx: number
    ) => {
      if (bye) return { id: 'bye', name: 'BYE' };
      const hasRealId = rawId !== null && rawId !== undefined && String(rawId) !== '';
      const realId = hasRealId ? String(rawId) : '';
      let refId = realId;
      let refName = name;
      let refFlat = flat && flat !== '—' ? flat : undefined;

      if (roundIndex > 0 && stage !== 'THIRD_PLACE' && prev.length > feederIdx) {
        const feederMatch = prev[feederIdx];
        if (!realId || !prevIds.has(realId)) {
          refId = `${feederMatch.id}-winner`;
        }
        if (isBlankName(refName)) {
          const homeIsBye = isByeParticipant(feederMatch.home);
          const awayIsBye = isByeParticipant(feederMatch.away);
          if (feederMatch.status === 'AUTO_ADVANCED' || homeIsBye || awayIsBye) {
            const adv = homeIsBye ? feederMatch.away : feederMatch.home;
            if (adv && !isByeParticipant(adv)) {
              refName = adv.name;
              if (adv.flatNumber) refFlat = adv.flatNumber;
            }
          }
        }
      } else if (!realId) {
        refId = `${id}-${feederIdx === posInRound * 2 ? 'h' : 'a'}`;
      }

      return {
        id: refId,
        name: isBlankName(refName) ? 'TBD' : refName,
        flatNumber: refFlat,
      };
    };

    const homeObjId = typeof m.home === 'object' ? m.home?.id : undefined;
    const awayObjId = typeof m.away === 'object' ? m.away?.id : undefined;

    const draft: PlayoffMatchDraft = {
      id,
      name: `${stage.replace(/_/g, ' ')} Match ${posInRound + 1}`,
      round: stage as PlayoffRoundType,
      roundIndex,
      home: resolveRef(m.teamAId ?? homeObjId, team1, team1Flat, homeBye, posInRound * 2),
      away: resolveRef(m.teamBId ?? awayObjId, team2, team2Flat, awayBye, posInRound * 2 + 1),
      date,
      time,
      duration: m.duration || m.durationMinutes || 30,
      venueId: isBye ? null : (m.venueId ?? null),
      courtId: isBye ? null : (m.courtId != null ? String(m.courtId) : null),
      moveSubsMatches: false,
      status: isBye ? 'AUTO_ADVANCED' : (m.status ?? null),
    };

    drafts.push(draft);
    byRound.set(roundIndex, [...(byRound.get(roundIndex) || []), draft]);
  });

  return drafts;
}
