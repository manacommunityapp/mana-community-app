import { describe, it, expect } from 'vitest';
import {
  getMatchStage,
  extractDateTime,
  extractFlatDetails,
  extractTeamNames,
  extractVenueCourt,
  prepareExportableMatches,
} from './ScheduleExportModal';

describe('ScheduleExportModal Helpers', () => {
  describe('getMatchStage', () => {
    it('identifies Final correctly', () => {
      expect(getMatchStage({ round: 'FINAL' })).toBe('FINAL');
      expect(getMatchStage({ roundName: 'Final' })).toBe('FINAL');
      expect(getMatchStage({ groupName: 'Grand Final' })).toBe('FINAL');
    });

    it('identifies Third Place playoff correctly', () => {
      expect(getMatchStage({ round: 'THIRD_PLACE' })).toBe('THIRD_PLACE');
      expect(getMatchStage({ round: '3rd Place Playoff' })).toBe('THIRD_PLACE');
      expect(getMatchStage({ round: 'Bronze Medal Match' })).toBe('THIRD_PLACE');
    });

    it('identifies Semi-Finals correctly', () => {
      expect(getMatchStage({ round: 'SEMI_FINAL' })).toBe('SEMI_FINAL');
      expect(getMatchStage({ round: 'Semi-Final 1' })).toBe('SEMI_FINAL');
      expect(getMatchStage({ roundName: 'SF 2' })).toBe('SEMI_FINAL');
    });

    it('identifies Quarter-Finals correctly', () => {
      expect(getMatchStage({ round: 'QUARTER_FINAL' })).toBe('QUARTER_FINAL');
      expect(getMatchStage({ round: 'Quarter-Final 3' })).toBe('QUARTER_FINAL');
      expect(getMatchStage({ roundName: 'QF 1' })).toBe('QUARTER_FINAL');
    });

    it('identifies Round of 16 correctly', () => {
      expect(getMatchStage({ round: 'ROUND_OF_16' })).toBe('ROUND_OF_16');
      expect(getMatchStage({ roundName: 'Round of 16' })).toBe('ROUND_OF_16');
      expect(getMatchStage({ round: 'R16 Match 4' })).toBe('ROUND_OF_16');
      expect(getMatchStage({ round: 'R16 Match 4' })).toBe('ROUND_OF_16');
      expect(getMatchStage({ roundName: 'Round 1 Match 1' })).toBe('ROUND_OF_16');
      expect(getMatchStage({ groupName: 'Round 1 Match 5' })).toBe('ROUND_OF_16');
    });

    it('identifies Group Stage matches correctly even if tournament or match title contains Final', () => {
      expect(getMatchStage({ round: 'GROUP_STAGE', groupName: 'Group A' })).toBe('GROUP');
      expect(getMatchStage({ round: 'LEAGUE_MATCH' })).toBe('GROUP');
      expect(getMatchStage({ stage: 'ROUND_ROBIN' })).toBe('GROUP');
      expect(getMatchStage({ groupName: 'Pool B' })).toBe('GROUP');
      expect(getMatchStage({ round: 'GROUP_STAGE', name: 'LEPL 2026 Badminton Championship — Final Schedule' })).toBe('GROUP');
      expect(getMatchStage({ stage: 'GROUP', name: 'Table Tennis Finals 2026 — Match 1' })).toBe('GROUP');
    });

    it('accurately distributes a 16-player knockout tournament (8 R16, 4 QF, 2 SF, 1 Final - not 9 finals)', () => {
      const matches = [
        ...Array.from({ length: 8 }, (_, i) => ({ matchNumber: i + 1, roundName: 'ROUND_OF_16', groupName: `Round 1 Match ${i + 1}` })),
        ...Array.from({ length: 4 }, (_, i) => ({ matchNumber: i + 9, roundName: 'QUARTER_FINAL', groupName: `Quarter Final ${i + 1}` })),
        ...Array.from({ length: 2 }, (_, i) => ({ matchNumber: i + 13, roundName: 'SEMI_FINAL', groupName: `Semi-Final ${i + 1}` })),
        { matchNumber: 15, roundName: 'FINAL', groupName: 'Final' },
      ];

      const counts = { ROUND_OF_16: 0, QUARTER_FINAL: 0, SEMI_FINAL: 0, FINAL: 0 };
      matches.forEach(m => {
        const stage = getMatchStage(m) as keyof typeof counts;
        counts[stage]++;
      });

      expect(counts.FINAL).toBe(1); // Crucial: exactly 1 Final, NOT 9!
      expect(counts.SEMI_FINAL).toBe(2);
      expect(counts.QUARTER_FINAL).toBe(4);
      expect(counts.ROUND_OF_16).toBe(8);
    });
  });

  describe('extractDateTime', () => {
    it('parses ISO timestamp and formats time to 12-hour AM/PM', () => {
      const res1 = extractDateTime({ scheduledAt: '2026-11-14T16:00:00' });
      expect(res1.date).toBe('2026-11-14');
      expect(res1.time).toBe('04:00 PM');

      const res2 = extractDateTime({ scheduledAt: '2026-11-14T09:30:00' });
      expect(res2.date).toBe('2026-11-14');
      expect(res2.time).toBe('09:30 AM');

      const res3 = extractDateTime({ scheduledAt: '2026-11-14T12:00:00' });
      expect(res3.time).toBe('12:00 PM');

      const res4 = extractDateTime({ scheduledAt: '2026-11-14T00:15:00' });
      expect(res4.time).toBe('12:15 AM');
    });

    it('converts 24-hour time to 12-hour format with AM/PM', () => {
      const res = extractDateTime({ matchDate: '2026-11-14', matchTime: '17:45' });
      expect(res.date).toBe('2026-11-14');
      expect(res.time).toBe('05:45 PM');
    });

    it('preserves existing formatted 12-hour AM/PM time', () => {
      const res = extractDateTime({ date: '2026-11-14', time: '04:00 PM' });
      expect(res.time).toBe('04:00 PM');
    });
  });

  describe('extractFlatDetails', () => {
    it('extracts home and away flat details from various property aliases', () => {
      const flat1 = extractFlatDetails({
        teamAFlat: 'A-101',
        teamBFlat: 'B-204',
      });
      expect(flat1.team1Flat).toBe('A-101');
      expect(flat1.team2Flat).toBe('B-204');

      const flat2 = extractFlatDetails({
        homeFlat: 'C-302',
        awayFlat: 'D-501',
      });
      expect(flat2.team1Flat).toBe('C-302');
      expect(flat2.team2Flat).toBe('D-501');

      const flat3 = extractFlatDetails({
        home: { name: 'Player 1', flatNumber: 'E-601' },
        away: { name: 'Player 2', flatNumber: 'F-702' },
      });
      expect(flat3.team1Flat).toBe('E-601');
      expect(flat3.team2Flat).toBe('F-702');
    });

    it('falls back to "—" when flat details are missing', () => {
      const flat = extractFlatDetails({});
      expect(flat.team1Flat).toBe('—');
      expect(flat.team2Flat).toBe('—');
    });
  });

  describe('extractTeamNames', () => {
    it('extracts team and player names with fallback', () => {
      expect(extractTeamNames({ teamAName: 'Alpha', teamBName: 'Beta' })).toEqual({
        team1: 'Alpha',
        team2: 'Beta',
      });
      expect(extractTeamNames({ home: 'Team X', away: 'Team Y' })).toEqual({
        team1: 'Team X',
        team2: 'Team Y',
      });
      expect(extractTeamNames({})).toEqual({
        team1: 'TBD',
        team2: 'TBD',
      });
    });
  });

  describe('extractVenueCourt', () => {
    it('combines venue and court nicely', () => {
      expect(extractVenueCourt({ venueName: 'Clubhouse', courtName: 'Court 1' })).toBe('Clubhouse · Court 1');
      expect(extractVenueCourt({ venueName: 'Main Arena', courtName: '2' })).toBe('Main Arena · Court 2');
      expect(extractVenueCourt({ venueName: 'Clubhouse' })).toBe('Clubhouse');
      expect(extractVenueCourt({})).toBe('Main Arena');
    });
  });

  describe('prepareExportableMatches', () => {
    const sampleMatches = [
      {
        id: 1,
        matchNumber: 1,
        round: 'GROUP_STAGE',
        groupName: 'Group A',
        teamAName: 'Sandeep Sharma',
        teamBName: 'Rahul Verma',
        teamAFlat: 'A-204',
        teamBFlat: 'B-108',
        scheduledAt: '2026-11-14T09:00:00',
        venueName: 'Clubhouse',
        courtName: 'Court 1',
        status: 'COMPLETED',
        scoreTeamA: '21',
        scoreTeamB: '18',
      },
      {
        id: 2,
        matchNumber: 2,
        round: 'QUARTER_FINAL',
        teamAName: 'Sandeep Sharma',
        teamBName: 'Vikram Mehta',
        teamAFlat: 'A-204',
        teamBFlat: 'C-305',
        scheduledAt: '2026-11-14T14:30:00',
        venueName: 'Clubhouse',
        courtName: 'Court 2',
        status: 'SCHEDULED',
      },
      {
        id: 3,
        matchNumber: 3,
        round: 'FINAL',
        teamAName: 'Sandeep Sharma',
        teamBName: 'Anil Kumar',
        teamAFlat: 'A-204',
        teamBFlat: 'D-401',
        scheduledAt: '2026-11-15T16:00:00',
        venueName: 'Clubhouse',
        courtName: 'Centre Court',
        status: 'SCHEDULED',
      },
    ];

    it('exports all matches when stageFilter is ALL', () => {
      const result = prepareExportableMatches(sampleMatches, 'ALL');
      expect(result).toHaveLength(3);
      expect(result[0].round).toBe('Group A');
      expect(result[0].time).toBe('09:00 AM');
      expect(result[0].team1Flat).toBe('A-204');
      expect(result[0].team2Flat).toBe('B-108');
      expect(result[0].score).toBe('21 - 18');

      expect(result[1].round).toBe('Quarter-Finals');
      expect(result[1].time).toBe('02:30 PM');

      expect(result[2].round).toBe('Final');
      expect(result[2].time).toBe('04:00 PM');
    });

    it('filters strictly by stage', () => {
      const qfOnly = prepareExportableMatches(sampleMatches, 'QUARTER_FINAL');
      expect(qfOnly).toHaveLength(1);
      expect(qfOnly[0].round).toBe('Quarter-Finals');
      expect(qfOnly[0].team2).toBe('Vikram Mehta');
      expect(qfOnly[0].team2Flat).toBe('C-305');

      const finalOnly = prepareExportableMatches(sampleMatches, 'FINAL');
      expect(finalOnly).toHaveLength(1);
      expect(finalOnly[0].round).toBe('Final');
      expect(finalOnly[0].time).toBe('04:00 PM');

      const groupOnly = prepareExportableMatches(sampleMatches, 'GROUP');
      expect(groupOnly).toHaveLength(1);
      expect(groupOnly[0].team1).toBe('Sandeep Sharma');
    });

    it('exports both Final and 3rd place when stageFilter is FINAL', () => {
      const matchesWith3rdPlace = [
        ...sampleMatches,
        {
          matchNumber: 4,
          round: 'THIRD_PLACE',
          teamAName: 'Bronze Player 1',
          teamBName: 'Bronze Player 2',
          scheduledAt: '2026-11-15T15:00:00',
        },
      ];
      const finalsExport = prepareExportableMatches(matchesWith3rdPlace, 'FINAL');
      expect(finalsExport).toHaveLength(2); // Both Championship Final + 3rd place match
      expect(finalsExport.map(m => m.round)).toEqual(['Final', '3rd Place']);
    });
  });
});
