import { apiClient } from "./apiClient";
import type { PlayoffScheduleInput, PlayoffMatchDraft } from "../app/components/scheduler/playoffSchedule";
import type { ScheduleGenerationLog, PaginatedResponse } from "../types/api";

export interface TournamentTypeInfo {
  id: string;
  name: string;
  description: string;
  teamRange: string;
  formatNote: string;
}

export interface EventInfo {
  id: number;
  name: string;
  sportId: number;
  sportName: string;
  communityId: number;
  communityName: string;
  eventDateStart: string;
  eventDateEnd: string;
  status: string;
  totalTeams: number;
  venueId?: number;
}

export interface ConfigInfo {
  id: number;
  tournamentName: string;
  tournamentType: string;
  eventName: string;
  eventId: number;
  totalTeams: number;
  startDate: string;
  endDate: string;
  status: string;
  numberOfGroups?: number;
  teamsAdvancingPerGroup?: number;
  swissRounds?: number;
  matchDurationMinutes?: number;
  breakBetweenMatchesMinutes?: number;
  venueId?: number;
  pointsForWin?: number;
  pointsForDraw?: number;
  pointsForLoss?: number;
  thirdPlaceMatch?: boolean;
  hasSeeding?: boolean;
}

// ─── Match Result Types ──────────────────────────────────────────────────────

export interface MatchResultRequestData {
  matchId: number;
  winnerTeamId?: number | null;
  scoreTeamA?: string;
  scoreTeamB?: string;
  matchNotes?: string;
  runsTeamA?: number;
  runsTeamB?: number;
  oversTeamA?: number;
  oversTeamB?: number;
}

export interface MatchResultDetailRequestData {
  matchId: number;
  winnerTeamId?: number | null;
  resultType?: string;
  scoreTeamA?: string;
  scoreTeamB?: string;
  winMargin?: string;
  matchNotes?: string;
  matchSummary?: string;
  tossWinnerTeamId?: number | null;
  tossDecision?: string;
  manOfMatchPlayerId?: number | null;
  bestBatterPlayerId?: number | null;
  bestBowlerPlayerId?: number | null;
  umpires?: string;
  runsTeamA?: number;
  runsTeamB?: number;
  oversTeamA?: number;
  oversTeamB?: number;
  innings?: InningsRequestData[];
}

export interface InningsRequestData {
  inningsNumber: number;
  battingTeamId: number;
  bowlingTeamId: number;
  totalRuns: number;
  totalWickets: number;
  totalOvers: string;
  extras: number;
  extrasDetail?: string;
  target?: number;
  batting?: BattingEntryData[];
  bowling?: BowlingEntryData[];
  fallOfWickets?: string;
}

export interface BattingEntryData {
  playerId: number;
  battingPosition: number;
  runsScored: number;
  ballsFaced: number;
  fours: number;
  sixes: number;
  dismissalType?: string;
  dismissedByPlayerId?: number;
  fielderPlayerId?: number;
}

export interface BowlingEntryData {
  playerId: number;
  bowlingOrder: number;
  oversBowled: string;
  maidens: number;
  runsConceded: number;
  wicketsTaken: number;
  dotBalls: number;
  wides: number;
  noBalls: number;
}

export interface MatchDetailData {
  matchId: number;
  roundName: string;
  matchNumber: number;
  scheduledAt: string;
  status: string;
  teamA: { id: number | null; name: string; color: string };
  teamB: { id: number | null; name: string; color: string };
  resultType?: string;
  scoreTeamA?: string;
  scoreTeamB?: string;
  winMargin?: string;
  winnerName?: string;
  matchSummary?: string;
  matchNotes?: string;
  tossWinnerName?: string;
  tossDecision?: string;
  manOfMatch?: { id: number; name: string; teamName: string };
  bestBatter?: { id: number; name: string; teamName: string };
  bestBowler?: { id: number; name: string; teamName: string };
  umpires?: string;
  venueName?: string;
  courtName?: string;
  innings?: InningsDetailData[];
  topRunScorers?: PlayerStatsData[];
  topWicketTakers?: PlayerStatsData[];
}

export interface InningsDetailData {
  inningsNumber: number;
  battingTeamName: string;
  bowlingTeamName: string;
  totalRuns: number;
  totalWickets: number;
  totalOvers: string;
  extras: number;
  extrasDetail?: string;
  target?: number;
  runRate: string;
  batting: BattingRowData[];
  bowling: BowlingRowData[];
  fallOfWickets?: string;
}

export interface BattingRowData {
  playerId: number;
  playerName: string;
  battingPosition: number;
  runsScored: number;
  ballsFaced: number;
  fours: number;
  sixes: number;
  strikeRate: string;
  dismissalType?: string;
  dismissedBy?: string;
  fielder?: string;
}

export interface BowlingRowData {
  playerId: number;
  playerName: string;
  bowlingOrder: number;
  oversBowled: string;
  maidens: number;
  runsConceded: number;
  wicketsTaken: number;
  economyRate: string;
  dotBalls: number;
  wides: number;
  noBalls: number;
}

export interface PlayerStatsData {
  playerId: number;
  playerName: string;
  teamName: string;
  matchesPlayed: number;
  totalRuns: number;
  totalWickets: number;
  battingAverage: string;
  strikeRate: string;
  economyRate: string;
  manOfMatchCount: number;
}

export const tournamentService = {
  /** GET /api/tournament/types */
  async getTournamentTypes(): Promise<TournamentTypeInfo[]> {
    return apiClient.get<TournamentTypeInfo[]>("/tournament/types");
  },

  /** GET /api/tournament/events */
  async getEventsForDropdown(): Promise<EventInfo[]> {
    return apiClient.get<EventInfo[]>("/tournament/events");
  },

  /** GET /api/tournament/configs */
  async getConfigs(): Promise<ConfigInfo[]> {
    return apiClient.get<ConfigInfo[]>("/tournament/configs");
  },

  /** POST /api/tournament/config */
  async createConfig(data: any): Promise<ConfigInfo> {
    return apiClient.post<ConfigInfo>("/tournament/config", data);
  },

  /** PUT /api/tournament/config/{id} */
  async updateConfig(id: number, data: any): Promise<ConfigInfo> {
    return apiClient.put<ConfigInfo>(`/tournament/config/${id}`, data);
  },

  /** GET /api/tournament/{configId}/teams */
  async getConfigTeams(configId: number): Promise<any[]> {
    return apiClient.get<any[]>(`/tournament/${configId}/teams`);
  },

  /** POST /api/tournament/{configId}/manual/groups/assign */
  async assignTeamsToGroups(configId: number, assignments: { teamId: string, groupId: string }[]): Promise<string> {
    return apiClient.post<string>(`/tournament/${configId}/manual/groups/assign`, assignments);
  },

  /** POST /api/tournament/{configId}/manual/matches */
  async scheduleManualMatch(configId: number, matchData: { homeTeamId: string, awayTeamId: string, matchType: string, stage: string, startTime: string }): Promise<string> {
    return apiClient.post<string>(`/tournament/${configId}/manual/matches`, matchData);
  },

  /** POST /api/tournament/{configId}/matches/bulk - Save all generated matches */
  async saveMatchesBulk(configId: number, matches: any[]): Promise<any> {
    return apiClient.post<any>(`/tournament/${configId}/matches/bulk`, { matches });
  },

  /** GET /api/tournament/{configId}/matches - Fetch all matches for a config */
  async getMatchesByConfigId(configId: number): Promise<any[]> {
    return apiClient.get<any[]>(`/tournament/${configId}/matches`);
  },

  /** PUT /api/tournament/{configId}/matches/status - Update status of all matches */
  async updateMatchesStatus(configId: number, status: 'SCHEDULED' | 'DRAFT' | 'PUBLISHED'): Promise<any> {
    return apiClient.put<any>(`/tournament/${configId}/matches/status`, { status });
  },

  /** DELETE /api/tournament/{configId}/matches - Delete all matches for a config */
  async deleteMatchesByConfigId(configId: number): Promise<any> {
    return apiClient.delete<any>(`/tournament/${configId}/matches`);
  },

  /** POST /api/tournament/playoff/generate - Stateless: generate the playoff (rounds-to-final) bracket */
  async generatePlayoffBracket(input: PlayoffScheduleInput): Promise<PlayoffMatchDraft[]> {
    return apiClient.post<PlayoffMatchDraft[]>("/tournament/playoff/generate", input);
  },

  /**
   * POST /api/tournament/schedule/save - Unified, deferred transactional save.
   * Persists the config + all customized matches together in one transaction.
   * Replaces the separate createConfig + saveMatchesBulk + updateMatchesStatus calls.
   */
  async saveSchedule(payload: {
    configId: number | null;
    status: "DRAFT" | "PUBLISHED";
    config: any;
    matches: any[];
  }): Promise<{ config: ConfigInfo; savedMatches: number }> {
    return apiClient.post<{ config: ConfigInfo; savedMatches: number }>(
      "/tournament/schedule/save",
      payload
    );
  },

  /** POST /api/tournament/match/result — basic result (scores + winner) */
  async recordResult(data: MatchResultRequestData): Promise<any> {
    return apiClient.post<any>("/tournament/match/result", data);
  },

  /** POST /api/tournament/match/result/detail — detailed result with scorecard */
  async recordDetailedResult(data: MatchResultDetailRequestData): Promise<MatchDetailData> {
    return apiClient.post<MatchDetailData>("/tournament/match/result/detail", data);
  },

  /** GET /api/tournament/match/{matchId}/detail — full match detail with scorecard */
  async getMatchDetail(matchId: number): Promise<MatchDetailData> {
    return apiClient.get<MatchDetailData>(`/tournament/match/${matchId}/detail`);
  },

  /** GET /api/tournament/{configId}/leaderboard?type=runs|wickets|mvp */
  async getLeaderboard(configId: number, type: string = "runs"): Promise<PlayerStatsData[]> {
    return apiClient.get<PlayerStatsData[]>(`/tournament/${configId}/leaderboard?type=${type}`);
  },

  /** GET /api/tournament/player/{playerId}/stats — career stats across tournaments */
  async getPlayerStats(playerId: number): Promise<PlayerStatsData[]> {
    return apiClient.get<PlayerStatsData[]>(`/tournament/player/${playerId}/stats`);
  }
};
