import type { ConfigInfo } from "../../../services/sports/tournamentService";
import { getStoredUser } from "../../../services/common/apiClient";

export interface SampleMatchItem {
  id: number;
  matchId: number;
  configId: number;
  eventId: number;
  round: string;
  roundName: string;
  matchNumber: number;
  teamAName: string;
  teamBName: string;
  teamAId: string | number;
  teamBId: string | number;
  scheduledAt: string;
  matchDate: string;
  matchTime: string;
  venueName: string;
  courtName: string;
  status: "SCHEDULED" | "LIVE" | "COMPLETED" | "IN_PROGRESS";
  scoreTeamA?: string;
  scoreTeamB?: string;
  duration?: number;
}

export const SAMPLE_TOURNAMENT_CONFIGS: ConfigInfo[] = [
  {
    id: 101,
    tournamentName: "Monsoon Badminton Premier Cup 2026",
    tournamentType: "GROUP_PLAYOFF",
    eventName: "Badminton Men's Doubles Championship",
    eventId: 101,
    totalTeams: 8,
    numberOfGroups: 2,
    teamsAdvancingPerGroup: 2,
    startDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    endDate: new Date(Date.now() + 86400000 * 5).toISOString().split("T")[0],
    status: "PUBLISHED",
    venueId: 1,
    matchDurationMinutes: 45,
    breakBetweenMatchesMinutes: 15,
    pointsForWin: 2,
    pointsForDraw: 1,
    pointsForLoss: 0,
    thirdPlaceMatch: true,
  },
  {
    id: 102,
    tournamentName: "Mana Community Box Cricket League Season 4",
    tournamentType: "ROUND_ROBIN",
    eventName: "Box Cricket T10 Championship",
    eventId: 102,
    totalTeams: 6,
    numberOfGroups: 1,
    teamsAdvancingPerGroup: 4,
    startDate: new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0],
    endDate: new Date(Date.now() + 86400000 * 7).toISOString().split("T")[0],
    status: "PUBLISHED",
    venueId: 2,
    matchDurationMinutes: 60,
    breakBetweenMatchesMinutes: 20,
    pointsForWin: 2,
    pointsForDraw: 1,
    pointsForLoss: 0,
    thirdPlaceMatch: true,
  },
  {
    id: 103,
    tournamentName: "Inter-Tower Table Tennis Open",
    tournamentType: "KNOCKOUT_SINGLE",
    eventName: "Men's Singles Open",
    eventId: 103,
    totalTeams: 8,
    startDate: new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0],
    endDate: new Date(Date.now() + 86400000 * 6).toISOString().split("T")[0],
    status: "PUBLISHED",
    venueId: 3,
    matchDurationMinutes: 30,
    breakBetweenMatchesMinutes: 10,
    pointsForWin: 2,
    pointsForDraw: 0,
    pointsForLoss: 0,
    thirdPlaceMatch: false,
  },
];

/**
 * Builds realistic sample matches dynamically adapted to the logged-in user or demo accounts.
 */
export function getSampleMatchesForConfig(configId: number): SampleMatchItem[] {
  const storedUser = getStoredUser();
  const userName = storedUser?.fullName || "Resident Player";
  const now = new Date();

  // Match times: tomorrow morning, afternoon, etc.
  const timeOffset = (hours: number, minutes = 0) => {
    const d = new Date(now.getTime() + 86400000 + hours * 3600000 + minutes * 60000);
    return d.toISOString();
  };

  if (configId === 101) {
    return [
      {
        id: 1001,
        matchId: 1001,
        configId: 101,
        eventId: 101,
        round: "SEMI_FINAL",
        roundName: "Semi-Final 1",
        matchNumber: 1,
        teamAName: `${userName} / Rohit`,
        teamBName: "Arjun / Karthik",
        teamAId: "team-badminton-1",
        teamBId: "team-badminton-2",
        scheduledAt: timeOffset(2, 30), // tomorrow morning
        matchDate: timeOffset(2, 30).split("T")[0],
        matchTime: "10:00 AM",
        venueName: "Community Sports Complex",
        courtName: "Badminton Court 1",
        status: "SCHEDULED",
        duration: 45,
      },
      {
        id: 1002,
        matchId: 1002,
        configId: 101,
        eventId: 101,
        round: "SEMI_FINAL",
        roundName: "Semi-Final 2",
        matchNumber: 2,
        teamAName: "Vikram / Suresh",
        teamBName: "Rahul / Amit",
        teamAId: "team-badminton-3",
        teamBId: "team-badminton-4",
        scheduledAt: timeOffset(3, 30),
        matchDate: timeOffset(3, 30).split("T")[0],
        matchTime: "11:00 AM",
        venueName: "Community Sports Complex",
        courtName: "Badminton Court 2",
        status: "SCHEDULED",
        duration: 45,
      },
      {
        id: 1003,
        matchId: 1003,
        configId: 101,
        eventId: 101,
        round: "FINAL",
        roundName: "Grand Final",
        matchNumber: 3,
        teamAName: `${userName} / Rohit`,
        teamBName: "Winner of SF2",
        teamAId: "team-badminton-1",
        teamBId: "team-tbd",
        scheduledAt: timeOffset(8, 0),
        matchDate: timeOffset(8, 0).split("T")[0],
        matchTime: "04:30 PM",
        venueName: "Community Sports Complex",
        courtName: "Center Court",
        status: "SCHEDULED",
        duration: 60,
      },
    ];
  }

  if (configId === 102) {
    return [
      {
        id: 1004,
        matchId: 1004,
        configId: 102,
        eventId: 102,
        round: "GROUP_STAGE",
        roundName: "Round 1",
        matchNumber: 1,
        teamAName: "Phoenix Blasters",
        teamBName: "Tower Titans",
        teamAId: "pb-team",
        teamBId: "tt-team",
        scheduledAt: timeOffset(4, 0),
        matchDate: timeOffset(4, 0).split("T")[0],
        matchTime: "12:00 PM",
        venueName: "Turf Arena",
        courtName: "Box Cricket Pitch A",
        status: "SCHEDULED",
        duration: 60,
      },
      {
        id: 1005,
        matchId: 1005,
        configId: 102,
        eventId: 102,
        round: "GROUP_STAGE",
        roundName: "Round 2",
        matchNumber: 2,
        teamAName: "Phoenix Blasters",
        teamBName: "Strikers XI",
        teamAId: "pb-team",
        teamBId: "sx-team",
        scheduledAt: timeOffset(10, 0),
        matchDate: timeOffset(10, 0).split("T")[0],
        matchTime: "06:00 PM",
        venueName: "Turf Arena",
        courtName: "Box Cricket Pitch A",
        status: "SCHEDULED",
        duration: 60,
      },
    ];
  }

  if (configId === 103) {
    return [
      {
        id: 1006,
        matchId: 1006,
        configId: 103,
        eventId: 103,
        round: "QUARTER_FINAL",
        roundName: "Quarter-Final",
        matchNumber: 1,
        teamAName: userName,
        teamBName: "Devendra Patel",
        teamAId: "user-tt-1",
        teamBId: "user-tt-2",
        scheduledAt: timeOffset(6, 0),
        matchDate: timeOffset(6, 0).split("T")[0],
        matchTime: "02:00 PM",
        venueName: "Clubhouse Indoor Arena",
        courtName: "TT Table 1",
        status: "SCHEDULED",
        duration: 30,
      },
    ];
  }

  return [];
}
