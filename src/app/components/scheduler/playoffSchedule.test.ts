import { describe, it, expect } from 'vitest';
import {
  createScheduleCursor,
  buildPlayoffBracket,
  reconstructKnockoutByes,
  buildPlayoffDraftFromSavedMatches,
  sanitizePlayoffMatches,
} from './playoffSchedule';

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

  it('correctly produces distinct matchups for TRADITIONAL, SEQUENTIAL, RANKING, and RANDOM sequences', () => {
    const players = [
      { id: 'p1', name: 'Alice', flatNumber: 'A101', rating: 1100 },
      { id: 'p2', name: 'Bob', flatNumber: 'B101', rating: 1200 },
      { id: 'p3', name: 'Charlie', flatNumber: 'C101', rating: 1300 },
      { id: 'p4', name: 'David', flatNumber: 'D101', rating: 1400 },
      { id: 'p5', name: 'Eve', flatNumber: 'E101', rating: 1500 },
      { id: 'p6', name: 'Frank', flatNumber: 'F101', rating: 1600 },
      { id: 'p7', name: 'Grace', flatNumber: 'G101', rating: 1700 },
      { id: 'p8', name: 'Heidi', flatNumber: 'H101', rating: 1800 },
    ];

    const baseConfig = {
      numGroups: 1,
      proceedersPerGroup: 8,
      thirdPlaceMatch: false,
      startDate: '2026-06-20',
      startTime: '08:00 AM',
      matchDurationMinutes: 30,
      breakMinutes: 10,
      venueId: null,
      courtId: null,
      participants: players,
    };

    // 1. TRADITIONAL: seed 1 (Alice) vs seed 8 (Heidi), seed 4 (David) vs seed 5 (Eve), seed 2 (Bob) vs seed 7 (Grace), seed 3 (Charlie) vs seed 6 (Frank)
    const trad = buildPlayoffBracket({ ...baseConfig, seedingOrder: 'TRADITIONAL' });
    const tradR1 = trad.filter(m => m.round === 'QUARTER_FINAL');
    expect(tradR1).toHaveLength(4);
    expect(tradR1[0].home.name).toBe('Alice');
    expect(tradR1[0].away.name).toBe('Heidi');
    expect(tradR1[1].home.name).toBe('David');
    expect(tradR1[1].away.name).toBe('Eve');
    expect(tradR1[2].home.name).toBe('Bob');
    expect(tradR1[2].away.name).toBe('Grace');
    expect(tradR1[3].home.name).toBe('Charlie');
    expect(tradR1[3].away.name).toBe('Frank');

    // 2. SEQUENTIAL: consecutive adjacent pairs (P1 vs P2, P3 vs P4, P5 vs P6, P7 vs P8)
    const seq = buildPlayoffBracket({ ...baseConfig, seedingOrder: 'SEQUENTIAL' });
    const seqR1 = seq.filter(m => m.round === 'QUARTER_FINAL');
    expect(seqR1).toHaveLength(4);
    expect(seqR1[0].home.name).toBe('Alice');
    expect(seqR1[0].away.name).toBe('Bob');
    expect(seqR1[1].home.name).toBe('Charlie');
    expect(seqR1[1].away.name).toBe('David');
    expect(seqR1[2].home.name).toBe('Eve');
    expect(seqR1[2].away.name).toBe('Frank');
    expect(seqR1[3].home.name).toBe('Grace');
    expect(seqR1[3].away.name).toBe('Heidi');

    // 3. RANKING: sorted by rating descending (Heidi=1800, Grace=1700, Frank=1600, Eve=1500, David=1400, Charlie=1300, Bob=1200, Alice=1100)
    // Seed 1 (Heidi) vs Seed 8 (Alice) in Match 0, Seed 4 (Eve) vs Seed 5 (David) in Match 1, Seed 2 (Grace) vs Seed 7 (Bob) in Match 2, Seed 3 (Frank) vs Seed 6 (Charlie) in Match 3
    const rank = buildPlayoffBracket({ ...baseConfig, seedingOrder: 'RANKING' });
    const rankR1 = rank.filter(m => m.round === 'QUARTER_FINAL');
    expect(rankR1).toHaveLength(4);
    expect(rankR1[0].home.name).toBe('Heidi');
    expect(rankR1[0].away.name).toBe('Alice');
    expect(rankR1[1].home.name).toBe('Eve');
    expect(rankR1[1].away.name).toBe('David');
    expect(rankR1[2].home.name).toBe('Grace');
    expect(rankR1[2].away.name).toBe('Bob');
    expect(rankR1[3].home.name).toBe('Frank');
    expect(rankR1[3].away.name).toBe('Charlie');

    // 4. RANDOM: matches all 8 players in 4 quarter-finals
    const rand = buildPlayoffBracket({ ...baseConfig, seedingOrder: 'RANDOM' });
    const randR1 = rand.filter(m => m.round === 'QUARTER_FINAL');
    expect(randR1).toHaveLength(4);
    const scheduledNames = new Set(randR1.flatMap(m => [m.home.name, m.away.name]));
    expect(scheduledNames.size).toBe(8);
  });

  it('renders initial 16 draw with BYEs for odd number of players (e.g. 11 players in a 16-draw bracket)', () => {
    const players11 = [
      { id: 'P1', name: 'Player 1', flatNumber: 'A101' },
      { id: 'P2', name: 'Player 2', flatNumber: 'A102' },
      { id: 'P3', name: 'Player 3', flatNumber: 'A103' },
      { id: 'P4', name: 'Player 4', flatNumber: 'A104' },
      { id: 'P5', name: 'Player 5', flatNumber: 'A105' },
      { id: 'P6', name: 'Player 6', flatNumber: 'A106' },
      { id: 'P7', name: 'Player 7', flatNumber: 'A107' },
      { id: 'P8', name: 'Player 8', flatNumber: 'A108' },
      { id: 'P9', name: 'Player 9', flatNumber: 'A109' },
      { id: 'P10', name: 'Player 10', flatNumber: 'A110' },
      { id: 'P11', name: 'Player 11', flatNumber: 'A111' },
    ];

    // With includeByesInBracket: true -> R1 (ROUND_OF_16) has 8 matches (3 regular + 5 with BYEs)
    const bracketWithByes = buildPlayoffBracket({
      numGroups: 1,
      proceedersPerGroup: 11,
      seedingOrder: 'TRADITIONAL',
      thirdPlaceMatch: false,
      startDate: '2026-06-20',
      startTime: '08:00 AM',
      matchDurationMinutes: 30,
      breakMinutes: 10,
      venueId: null,
      courtId: null,
      participants: players11,
      includeByesInBracket: true,
    });

    const r1WithByes = bracketWithByes.filter(m => m.round === 'ROUND_OF_16');
    expect(r1WithByes).toHaveLength(8);

    const byeMatches = r1WithByes.filter(m => m.home.name === 'BYE' || m.away.name === 'BYE');
    expect(byeMatches).toHaveLength(5); // 16 - 11 = 5 byes

    // Without includeByesInBracket: false -> R1 has only 3 real matches
    const compactBracket = buildPlayoffBracket({
      numGroups: 1,
      proceedersPerGroup: 11,
      seedingOrder: 'TRADITIONAL',
      thirdPlaceMatch: false,
      startDate: '2026-06-20',
      startTime: '08:00 AM',
      matchDurationMinutes: 30,
      breakMinutes: 10,
      venueId: null,
      courtId: null,
      participants: players11,
      includeByesInBracket: false,
    });

    const compactR1 = compactBracket.filter(m => m.round === 'ROUND_OF_16');
    expect(compactR1).toHaveLength(3);
  });
});

describe('reconstructKnockoutByes', () => {
  it('reconstructs missing Round of 32 BYE matches for a 24-player knockout saved without BYEs', () => {
    // In a 24-player knockout (32 draw), Round of 16 has 8 matches (16 players).
    // Round of 32 originally has 8 played matches (16 players -> 8 winners).
    // The other 8 players in R16 received BYEs in R32.
    // If the database only stored the 8 played R32 matches, reconstructKnockoutByes should reconstruct the 8 BYE matches, making 16 total R32 matches.
    const r16Matches: any[] = [];
    const r32PlayedMatches: any[] = [];

    for (let i = 0; i < 8; i++) {
      const winnerFromR32 = { id: `winner-${i}`, name: `Winner ${i}` };
      const byePlayer = { id: `seed-${i}`, name: `Top Seed ${i}` };

      // In Round of 16, match i is between Winner i and Top Seed i
      r16Matches.push({
        matchId: `r16-${i}`,
        roundIndex: 1,
        roundType: 'ROUND_OF_16',
        stage: 'PLAYOFF',
        home: winnerFromR32,
        away: byePlayer,
        team1: winnerFromR32.name,
        team2: byePlayer.name,
        homeId: winnerFromR32.id,
        awayId: byePlayer.id,
      });

      // In Round of 32, Winner i played against Loser i
      r32PlayedMatches.push({
        matchId: `r32-${i}`,
        roundIndex: 0,
        roundType: 'ROUND_OF_32',
        stage: 'PLAYOFF',
        home: winnerFromR32,
        away: { id: `loser-${i}`, name: `Loser ${i}` },
        team1: winnerFromR32.name,
        team2: `Loser ${i}`,
        homeId: winnerFromR32.id,
        awayId: `loser-${i}`,
        scheduledAt: '2026-06-20T09:00:00',
      });
    }

    const savedMatches = [...r32PlayedMatches, ...r16Matches];

    const result = reconstructKnockoutByes(savedMatches, { tournamentType: 'KNOCKOUT', totalTeams: 24 });

    const r32After = result.filter((m: any) => m.roundType === 'ROUND_OF_32' || m.roundIndex === 0);
    expect(r32After).toHaveLength(16);

    const byeMatches = r32After.filter((m: any) => m.status === 'AUTO_ADVANCED' || m.team1 === 'BYE' || m.team2 === 'BYE');
    expect(byeMatches).toHaveLength(8);

    // Each bye match should have the top seed paired with BYE
    const byePlayerNames = byeMatches.map((m: any) => m.team1 === 'BYE' ? m.team2 : m.team1);
    for (let i = 0; i < 8; i++) {
      expect(byePlayerNames).toContain(`Top Seed ${i}`);
    }

    // Verify ordering: each R16 match i corresponds to slot 2*i and 2*i + 1
    for (let i = 0; i < 8; i++) {
      const slotA = r32After[2 * i];
      const slotB = r32After[2 * i + 1];
      const slotPlayers = [slotA.team1, slotA.team2, slotB.team1, slotB.team2];
      expect(slotPlayers).toContain(`Winner ${i}`);
      expect(slotPlayers).toContain(`Top Seed ${i}`);
    }
  });

  it('leaves matches intact when all BYE matches are already present', () => {
    const r32Matches: any[] = [];
    for (let i = 0; i < 16; i++) {
      r32Matches.push({
        matchId: `r32-${i}`,
        roundIndex: 0,
        roundType: 'ROUND_OF_32',
        stage: 'PLAYOFF',
        team1: i < 8 ? `Player ${i}` : 'BYE',
        team2: `Player ${i + 16}`,
      });
    }
    const r16Matches: any[] = [];
    for (let i = 0; i < 8; i++) {
      r16Matches.push({
        matchId: `r16-${i}`,
        roundIndex: 1,
        roundType: 'ROUND_OF_16',
        stage: 'PLAYOFF',
        team1: `Adv ${i}`,
        team2: `Adv ${i + 8}`,
      });
    }

    const input = [...r32Matches, ...r16Matches];
    const result = reconstructKnockoutByes(input, { tournamentType: 'KNOCKOUT' });
    expect(result).toHaveLength(input.length);
  });

  it('returns original matches untouched for non-knockout stage or group stages', () => {
    const groupMatches = [
      { matchId: 'g1', stage: 'GROUP', roundIndex: 0, roundType: 'ROUND_1', team1: 'A', team2: 'B' },
      { matchId: 'g2', stage: 'GROUP', roundIndex: 0, roundType: 'ROUND_1', team1: 'C', team2: 'D' },
    ];
    const result = reconstructKnockoutByes(groupMatches, { tournamentType: 'ROUND_ROBIN' });
    expect(result).toEqual(groupMatches);
  });
});

describe('buildPlayoffDraftFromSavedMatches', () => {
  it('normalizes roundIndex consecutively starting at 0 and links parent feeder matches', () => {
    // 6-team single elimination knockout tournament starting at Quarter-Finals
    // Quarter-Finals: 2 played matches, 2 BYE matches to feed 2 Semi-Finals
    // Semi-Finals: 2 matches
    // Final: 1 match
    const savedMatches = [
      // QF played matches
      {
        matchId: 'qf-1',
        stage: 'QUARTER_FINAL',
        roundName: 'Quarter-Finals',
        matchNumber: 1,
        team1: 'Player C',
        team2: 'Player D',
        scheduledAt: '2026-06-20T10:00:00',
      },
      {
        matchId: 'qf-2',
        stage: 'QUARTER_FINAL',
        roundName: 'Quarter-Finals',
        matchNumber: 2,
        team1: 'Player E',
        team2: 'Player F',
        scheduledAt: '2026-06-20T10:30:00',
      },
      // SF matches (Player A & Player B received BYEs in QF and were saved in SF)
      {
        matchId: 'sf-1',
        stage: 'SEMI_FINAL',
        roundName: 'Semi-Finals',
        matchNumber: 3,
        team1: 'Player A',
        team2: 'Player C',
        scheduledAt: '2026-06-20T14:00:00',
      },
      {
        matchId: 'sf-2',
        stage: 'SEMI_FINAL',
        roundName: 'Semi-Finals',
        matchNumber: 4,
        team1: 'Player B',
        team2: 'Player E',
        scheduledAt: '2026-06-20T14:30:00',
      },
      // Final match
      {
        matchId: 'final-1',
        stage: 'FINAL',
        roundName: 'Final',
        matchNumber: 5,
        team1: '',
        team2: '',
        scheduledAt: '2026-06-20T17:00:00',
      },
    ];

    const draft = buildPlayoffDraftFromSavedMatches(savedMatches, {
      totalTeams: 6,
      tournamentType: 'KNOCKOUT',
    });

    // 4 QF + 2 SF + 1 Final = 7 matches
    expect(draft).toHaveLength(7);

    // QF matches should have roundIndex = 0
    const qfMatches = draft.filter(m => m.round === 'QUARTER_FINAL');
    expect(qfMatches).toHaveLength(4);
    qfMatches.forEach(m => expect(m.roundIndex).toBe(0));

    // SF matches should have roundIndex = 1
    const sfMatches = draft.filter(m => m.round === 'SEMI_FINAL');
    expect(sfMatches).toHaveLength(2);
    sfMatches.forEach(m => expect(m.roundIndex).toBe(1));

    // Final match should have roundIndex = 2
    const finalMatches = draft.filter(m => m.round === 'FINAL');
    expect(finalMatches).toHaveLength(1);
    expect(finalMatches[0].roundIndex).toBe(2);

    // Final should have feeder links ending in -winner pointing to SF matches
    expect(finalMatches[0].home.id).toBe(`${sfMatches[0].id}-winner`);
    expect(finalMatches[0].away.id).toBe(`${sfMatches[1].id}-winner`);

    // Preserving BYEs: sanitizePlayoffMatches with preserveFirstRoundByes: true keeps all 4 QF matches
    const withByes = sanitizePlayoffMatches(draft, true);
    expect(withByes).toHaveLength(7);
    expect(withByes.filter(m => m.round === 'QUARTER_FINAL')).toHaveLength(4);

    // Hiding BYEs: sanitizePlayoffMatches with preserveFirstRoundByes: false strips the 2 BYE matches
    const withoutByes = sanitizePlayoffMatches(draft, false);
    expect(withoutByes).toHaveLength(5);
    expect(withoutByes.filter(m => m.round === 'QUARTER_FINAL')).toHaveLength(2);
  });
});



