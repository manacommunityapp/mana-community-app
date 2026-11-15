// ─── Tournament Stage Types ─────────────────────────────────────────────────
// Core types for the Stage-Based Tournament Scheduling & Publication Engine.

export type StageType =
  | "GROUP_STAGE"
  | "ROUND_OF_64"
  | "ROUND_OF_32"
  | "ROUND_OF_16"
  | "QUARTER_FINAL"
  | "SEMI_FINAL"
  | "THIRD_PLACE"
  | "FINAL"
  | "LEAGUE_MATCH"
  | "SWISS_ROUND"
  | "ELIMINATOR"
  | "QUALIFIER"
  | "SUPER_FINAL";

export type StageStatus =
  | "NOT_GENERATED"
  | "DRAFT"
  | "VALIDATED"
  | "APPROVED"
  | "PUBLISHED"
  | "COMPLETED"
  | "CANCELLED";

export type PublicationStatus =
  | "UNPUBLISHED"
  | "PUBLISHED"
  | "UPDATED"
  | "WITHDRAWN";

export type SchedulingMode =
  | "FULL_UPFRONT"
  | "STAGE_WISE"
  | "HYBRID";

export type ScheduleVersionStatus =
  | "DRAFT"
  | "VALIDATED"
  | "APPROVED"
  | "PUBLISHED"
  | "SUPERSEDED";

export type PostponementScope =
  | "SINGLE_MATCH"
  | "MULTIPLE_MATCHES"
  | "ENTIRE_ROUND"
  | "ENTIRE_STAGE";

export type PostponementReason =
  | "RAIN"
  | "VENUE_UNAVAILABLE"
  | "COURT_MAINTENANCE"
  | "FLOODING"
  | "REFEREE_UNAVAILABLE"
  | "PLAYER_INJURY"
  | "TEAM_REQUEST"
  | "LOCAL_RESTRICTIONS"
  | "POWER_FAILURE"
  | "ORGANIZER_DECISION"
  | "PREVIOUS_MATCH_OVERTIME"
  | "PUBLIC_HOLIDAY"
  | "TRANSPORT_DISRUPTION"
  | "SAFETY_CONCERNS"
  | "INSUFFICIENT_LIGHT"
  | "OTHER";

export type MatchDisruptionStatus =
  | "SCHEDULED"
  | "CONFIRMED"
  | "CHECK_IN_OPEN"
  | "IN_PROGRESS"
  | "LIVE"
  | "SUSPENDED"
  | "RESUMED"
  | "POSTPONED"
  | "ABANDONED"
  | "NO_RESULT"
  | "COMPLETED"
  | "CANCELLED"
  | "FORFEITED"
  | "WALKOVER"
  | "UNDER_REVIEW";

export type ReserveDayType =
  | "TOURNAMENT_WIDE"
  | "STAGE_SPECIFIC"
  | "MATCH_SPECIFIC";

export type ReserveDayStatus =
  | "AVAILABLE"
  | "ACTIVATED"
  | "USED"
  | "RELEASED"
  | "EXPIRED";

export type QualificationStatus =
  | "PENDING"
  | "CALCULATED"
  | "AWAITING_RESOLUTION"
  | "CONFIRMED"
  | "DISPUTED";

// ─── Interfaces ─────────────────────────────────────────────────────────────

export interface TournamentStage {
  id: number;
  tournamentConfigId: number;
  stageName: string;
  stageType: StageType;
  stageOrder: number;
  stageStatus: StageStatus;
  schedulingMode: SchedulingMode;
  publicationStatus: PublicationStatus;
  publishedVersionId: number | null;
  qualificationRuleId: number | null;
  startDate: string | null;
  endDate: string | null;
  matchCount: number;
  completedMatchCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TournamentStageCreateRequest {
  tournamentConfigId: number;
  stageName: string;
  stageType: StageType;
  stageOrder: number;
  schedulingMode?: SchedulingMode;
  startDate?: string;
  endDate?: string;
}

export interface TournamentStageUpdateRequest {
  stageName?: string;
  stageOrder?: number;
  schedulingMode?: SchedulingMode;
  startDate?: string;
  endDate?: string;
}

export interface ScheduleVersion {
  id: number;
  tournamentConfigId: number;
  stageId: number | null;
  versionNumber: number;
  status: ScheduleVersionStatus;
  changeReason: string | null;
  changedMatchIds: number[];
  changedFields: Record<string, string>[];
  generatedBy: string | null;
  approvedBy: string | null;
  publishedBy: string | null;
  createdAt: string;
  approvedAt: string | null;
  publishedAt: string | null;
}

export interface StagePublicationRecord {
  id: number;
  stageId: number;
  versionId: number;
  publishedBy: string;
  publishedAt: string;
  notificationStatus: "PENDING" | "SENT" | "FAILED" | "PARTIAL";
  recipientCount: number;
}

export interface MatchPostponement {
  id: number;
  matchId: number;
  originalStartAt: string;
  proposedStartAt: string | null;
  newStartAt: string | null;
  reasonCode: PostponementReason;
  reasonDescription: string;
  scope: PostponementScope;
  requestedBy: string;
  approvedBy: string | null;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  reserveDayId: number | null;
  affectedMatchIds: number[];
  createdAt: string;
}

export interface ReserveDay {
  id: number;
  tournamentConfigId: number;
  stageId: number | null;
  reserveDate: string;
  venueId: number | null;
  venueName: string | null;
  courtId: number | null;
  courtName: string | null;
  startTime: string;
  endTime: string;
  reserveType: ReserveDayType;
  status: ReserveDayStatus;
  activatedAt: string | null;
  activatedBy: string | null;
}

export interface ReserveDayCreateRequest {
  tournamentConfigId: number;
  stageId?: number;
  reserveDate: string;
  venueId?: number;
  courtId?: number;
  startTime: string;
  endTime: string;
  reserveType: ReserveDayType;
}

export interface QualificationRule {
  id: number;
  stageId: number;
  qualifyCount: number;
  tieBreakers: string[];
  autoAdvance: boolean;
  requiresAdminConfirmation: boolean;
}

export interface ScheduleImpactAnalysis {
  proposedChange: {
    matchId: number;
    field: string;
    currentValue: string;
    proposedValue: string;
  };
  affectedItems: {
    matchId: number;
    matchName: string;
    currentValue: string;
    proposedValue: string;
    impactType: "REQUIRES_REVIEW" | "AUTO_ADJUSTABLE" | "NO_CHANGE";
    reason: string;
  }[];
  conflicts: {
    type: "REST_PERIOD" | "VENUE_CONFLICT" | "COURT_CONFLICT" | "STAGE_DEPENDENCY" | "TEAM_AVAILABILITY";
    description: string;
    severity: "WARNING" | "ERROR";
  }[];
  canAutoApply: boolean;
}

export interface BracketPlaceholder {
  matchId: number;
  slot: "HOME" | "AWAY";
  placeholderType: "GROUP_RANK" | "MATCH_WINNER" | "MATCH_LOSER";
  sourceGroupId?: number;
  sourceGroupName?: string;
  sourceRank?: number;
  sourceMatchId?: number;
  resolvedTeamId?: number;
  resolvedTeamName?: string;
}

export interface StageScheduleSummary {
  stageId: number;
  stageName: string;
  stageType: StageType;
  stageStatus: StageStatus;
  publicationStatus: PublicationStatus;
  totalMatches: number;
  completedMatches: number;
  postponedMatches: number;
  liveMatches: number;
  currentVersion: number | null;
  publishedVersion: number | null;
  lastPublishedAt: string | null;
  hasConflicts: boolean;
  reserveDayCount: number;
}

export interface TournamentScheduleDashboard {
  tournamentConfigId: number;
  tournamentName: string;
  schedulingMode: SchedulingMode;
  stages: StageScheduleSummary[];
  totalMatches: number;
  completedMatches: number;
  upcomingMatches: number;
  postponedMatches: number;
  liveMatches: number;
  pendingPublications: number;
  hasUnresolvedConflicts: boolean;
}
