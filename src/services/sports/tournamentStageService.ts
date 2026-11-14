import { apiClient } from "../common/apiClient";
import type {
  TournamentStage,
  TournamentStageCreateRequest,
  TournamentStageUpdateRequest,
  ScheduleVersion,
  StagePublicationRecord,
  MatchPostponement,
  ReserveDay,
  ReserveDayCreateRequest,
  QualificationRule,
  ScheduleImpactAnalysis,
  TournamentScheduleDashboard,
  PostponementReason,
  PostponementScope,
  SchedulingMode,
} from "../../types/tournamentStage";

export const tournamentStageService = {

  // ─── Stage CRUD ─────────────────────────────────────────────────────────────

  async getStages(configId: number): Promise<TournamentStage[]> {
    try {
      const data = await apiClient.get<TournamentStage[]>(`/tournament/${configId}/stages`);
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  async createStage(req: TournamentStageCreateRequest): Promise<TournamentStage> {
    return apiClient.post<TournamentStage>(
      `/tournament/${req.tournamentConfigId}/stages`,
      req
    );
  },

  async updateStage(stageId: number, req: TournamentStageUpdateRequest): Promise<TournamentStage> {
    return apiClient.put<TournamentStage>(`/tournament/stages/${stageId}`, req);
  },

  async deleteStage(stageId: number): Promise<void> {
    return apiClient.delete<void>(`/tournament/stages/${stageId}`);
  },

  // ─── Stage Schedule Generation ──────────────────────────────────────────────

  async generateStageSchedule(stageId: number, options?: {
    schedulingMode?: SchedulingMode;
    courtIds?: number[];
    matchDays?: number[];
  }): Promise<{ matchCount: number; conflicts: string[] }> {
    return apiClient.post(`/tournament/stages/${stageId}/schedule/generate`, options ?? {});
  },

  async validateStageSchedule(stageId: number): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    return apiClient.post(`/tournament/stages/${stageId}/schedule/validate`, {});
  },

  async approveStageSchedule(stageId: number): Promise<TournamentStage> {
    return apiClient.post<TournamentStage>(`/tournament/stages/${stageId}/schedule/approve`, {});
  },

  // ─── Stage Publication ──────────────────────────────────────────────────────

  async publishStage(stageId: number): Promise<StagePublicationRecord> {
    return apiClient.post<StagePublicationRecord>(`/tournament/stages/${stageId}/publish`, {});
  },

  async unpublishStage(stageId: number, reason: string): Promise<TournamentStage> {
    return apiClient.post<TournamentStage>(`/tournament/stages/${stageId}/unpublish`, { reason });
  },

  async publishMultipleStages(configId: number, stageIds: number[]): Promise<StagePublicationRecord[]> {
    return apiClient.post<StagePublicationRecord[]>(
      `/tournament/${configId}/publish-stages`,
      { stageIds }
    );
  },

  // ─── Schedule Versions ──────────────────────────────────────────────────────

  async getScheduleVersions(configId: number, stageId?: number): Promise<ScheduleVersion[]> {
    const qs = stageId ? `?stageId=${stageId}` : "";
    try {
      const data = await apiClient.get<ScheduleVersion[]>(`/tournament/${configId}/schedule/history${qs}`);
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  async getScheduleVersion(versionId: number): Promise<ScheduleVersion> {
    return apiClient.get<ScheduleVersion>(`/tournament/schedule/version/${versionId}`);
  },

  // ─── Match Postponement & Rescheduling ──────────────────────────────────────

  async postponeMatch(matchId: number, req: {
    reasonCode: PostponementReason;
    reasonDescription: string;
    proposedStartAt?: string;
    reserveDayId?: number;
  }): Promise<MatchPostponement> {
    return apiClient.post<MatchPostponement>(`/tournament/matches/${matchId}/postpone`, req);
  },

  async rescheduleMatch(matchId: number, req: {
    newStartAt: string;
    newVenueId?: number;
    newCourtId?: number;
    reason: string;
  }): Promise<MatchPostponement> {
    return apiClient.post<MatchPostponement>(`/tournament/matches/${matchId}/reschedule`, req);
  },

  async suspendMatch(matchId: number, reason: string): Promise<void> {
    return apiClient.post(`/tournament/matches/${matchId}/suspend`, { reason });
  },

  async resumeMatch(matchId: number): Promise<void> {
    return apiClient.post(`/tournament/matches/${matchId}/resume`, {});
  },

  async abandonMatch(matchId: number, reason: string): Promise<void> {
    return apiClient.post(`/tournament/matches/${matchId}/abandon`, { reason });
  },

  async bulkPostpone(req: {
    matchIds: number[];
    scope: PostponementScope;
    reasonCode: PostponementReason;
    reasonDescription: string;
  }): Promise<MatchPostponement[]> {
    return apiClient.post<MatchPostponement[]>("/tournament/matches/bulk-postpone", req);
  },

  async getPostponementHistory(matchId: number): Promise<MatchPostponement[]> {
    try {
      const data = await apiClient.get<MatchPostponement[]>(`/tournament/matches/${matchId}/postponements`);
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  // ─── Reserve Days ───────────────────────────────────────────────────────────

  async getReserveDays(configId: number): Promise<ReserveDay[]> {
    try {
      const data = await apiClient.get<ReserveDay[]>(`/tournament/${configId}/reserve-days`);
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  async createReserveDay(req: ReserveDayCreateRequest): Promise<ReserveDay> {
    return apiClient.post<ReserveDay>(
      `/tournament/${req.tournamentConfigId}/reserve-days`,
      req
    );
  },

  async activateReserveDay(reserveDayId: number, matchId: number): Promise<ReserveDay> {
    return apiClient.post<ReserveDay>(
      `/tournament/reserve-days/${reserveDayId}/activate`,
      { matchId }
    );
  },

  async deleteReserveDay(reserveDayId: number): Promise<void> {
    return apiClient.delete<void>(`/tournament/reserve-days/${reserveDayId}`);
  },

  // ─── Impact Analysis ────────────────────────────────────────────────────────

  async getScheduleImpact(matchId: number, proposedChanges: {
    newStartAt?: string;
    newVenueId?: number;
    newCourtId?: number;
  }): Promise<ScheduleImpactAnalysis> {
    return apiClient.post<ScheduleImpactAnalysis>(
      `/tournament/matches/${matchId}/impact`,
      proposedChanges
    );
  },

  async advanceQualification(configId: number): Promise<{ configId: number; seededMatchCount: number; message: string }> {
    return apiClient.post(`/tournament/${configId}/advance-qualification`, {});
  },

  async calculateQualification(stageId: number): Promise<{
    qualifiedTeams: { teamId: number; teamName: string; rank: number }[];
    ties: { teamIds: number[]; reason: string }[];
    status: string;
  }> {
    return apiClient.post(`/tournament/stages/${stageId}/qualification/calculate`, {});
  },

  async confirmQualification(stageId: number, qualifiedTeamIds: number[]): Promise<void> {
    return apiClient.post(`/tournament/stages/${stageId}/qualification/confirm`, { qualifiedTeamIds });
  },

  async getQualificationRules(stageId: number): Promise<QualificationRule | null> {
    try {
      return await apiClient.get<QualificationRule>(`/tournament/stages/${stageId}/qualification-rules`);
    } catch {
      return null;
    }
  },

  async setQualificationRules(stageId: number, rules: Partial<QualificationRule>): Promise<QualificationRule> {
    return apiClient.post<QualificationRule>(`/tournament/stages/${stageId}/qualification-rules`, rules);
  },

  // ─── Dashboard ──────────────────────────────────────────────────────────────

  async getScheduleDashboard(configId: number): Promise<TournamentScheduleDashboard> {
    return apiClient.get<TournamentScheduleDashboard>(`/tournament/${configId}/schedule/dashboard`);
  },

  // ─── Notifications ──────────────────────────────────────────────────────────

  async sendStageNotification(stageId: number, type: "SCHEDULE_PUBLISHED" | "SCHEDULE_UPDATED" | "MATCH_POSTPONED"): Promise<{
    sent: number;
    failed: number;
  }> {
    return apiClient.post(`/tournament/stages/${stageId}/notify`, { type });
  },
};
