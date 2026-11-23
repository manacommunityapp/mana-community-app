import { isByeMatch, isPlaceholderOrTbd } from "./sportsValidationUtils";

export type TournamentStageKey =
  | "ALL"
  | "GROUP"
  | "ROUND_OF_64"
  | "ROUND_OF_32"
  | "ROUND_OF_16"
  | "QUARTER_FINAL"
  | "SEMI_FINAL"
  | "FINAL"
  | "THIRD_PLACE";

export type ConcreteStageKey = Exclude<TournamentStageKey, "ALL">;

export interface StageMeta {
  key: ConcreteStageKey;
  label: string;
  shortLabel: string;
  order: number;
  badgeClass: string;
  activePillClass: string;
}

export const STAGE_ORDER: ConcreteStageKey[] = [
  "GROUP",
  "ROUND_OF_64",
  "ROUND_OF_32",
  "ROUND_OF_16",
  "QUARTER_FINAL",
  "SEMI_FINAL",
  "THIRD_PLACE",
  "FINAL",
];

const STAGE_META_MAP: Record<ConcreteStageKey, StageMeta> = {
  GROUP: {
    key: "GROUP",
    label: "Group Stage",
    shortLabel: "Groups",
    order: 1,
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
    activePillClass: "bg-slate-700 text-white border-slate-700",
  },
  ROUND_OF_64: {
    key: "ROUND_OF_64",
    label: "Round of 64",
    shortLabel: "R64",
    order: 2,
    badgeClass: "bg-sky-50 text-sky-700 border-sky-200",
    activePillClass: "bg-sky-600 text-white border-sky-600",
  },
  ROUND_OF_32: {
    key: "ROUND_OF_32",
    label: "Round of 32",
    shortLabel: "R32",
    order: 3,
    badgeClass: "bg-cyan-50 text-cyan-700 border-cyan-200",
    activePillClass: "bg-cyan-600 text-white border-cyan-600",
  },
  ROUND_OF_16: {
    key: "ROUND_OF_16",
    label: "Round of 16",
    shortLabel: "R16",
    order: 4,
    badgeClass: "bg-teal-50 text-teal-700 border-teal-200",
    activePillClass: "bg-teal-600 text-white border-teal-600",
  },
  QUARTER_FINAL: {
    key: "QUARTER_FINAL",
    label: "Quarter-Finals",
    shortLabel: "Quarters",
    order: 5,
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
    activePillClass: "bg-blue-600 text-white border-blue-600",
  },
  SEMI_FINAL: {
    key: "SEMI_FINAL",
    label: "Semi-Finals",
    shortLabel: "Semis",
    order: 6,
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
    activePillClass: "bg-purple-600 text-white border-purple-600",
  },
  THIRD_PLACE: {
    key: "THIRD_PLACE",
    label: "3rd Place",
    shortLabel: "3rd Place",
    order: 7,
    badgeClass: "bg-orange-50 text-orange-700 border-orange-200",
    activePillClass: "bg-orange-600 text-white border-orange-600",
  },
  FINAL: {
    key: "FINAL",
    label: "Final",
    shortLabel: "Final",
    order: 8,
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
    activePillClass: "bg-amber-500 text-white border-amber-500",
  },
};

export function getStageMeta(stage: TournamentStageKey): StageMeta {
  if (stage === "ALL") {
    return STAGE_META_MAP.GROUP;
  }
  return STAGE_META_MAP[stage] || STAGE_META_MAP.GROUP;
}

/** Determines which tournament stage a match belongs to. */
export function getMatchStage(m: any): TournamentStageKey {
  const roundStr = String(m?.round || m?.roundName || m?.roundType || "").trim().toUpperCase();
  const stageStr = String(m?.stage || "").trim().toUpperCase();
  const groupStr = String(m?.groupName || "").trim().toUpperCase();

  // 1. Group Stage / League Matches (checked early to protect against tournament/event names)
  if (
    roundStr === "GROUP_STAGE" ||
    roundStr === "LEAGUE_MATCH" ||
    stageStr === "GROUP" ||
    stageStr === "ROUND_ROBIN" ||
    groupStr.startsWith("GROUP") ||
    groupStr.startsWith("POOL")
  ) {
    return "GROUP";
  }

  // 2. Third Place Match
  if (
    roundStr === "THIRD_PLACE" ||
    roundStr.includes("THIRD") ||
    roundStr.includes("3RD") ||
    roundStr.includes("BRONZE") ||
    groupStr.includes("THIRD") ||
    groupStr.includes("3RD") ||
    groupStr.includes("BRONZE")
  ) {
    return "THIRD_PLACE";
  }

  // 3. Final / Grand Final (strict: exact match or clean word boundary, never loose substring)
  if (
    roundStr === "FINAL" ||
    roundStr === "GRAND_FINAL" ||
    roundStr === "SUPER_FINAL" ||
    roundStr === "FINALS" ||
    /^(GRAND[\s_-]?|SUPER[\s_-]?)?FINALS?$/i.test(roundStr) ||
    /^(GRAND[\s_-]?|SUPER[\s_-]?)?FINALS?$/i.test(groupStr)
  ) {
    return "FINAL";
  }

  // 4. Semi-Finals
  if (
    roundStr === "SEMI_FINAL" ||
    roundStr.includes("SEMI") ||
    /\bSF\b/i.test(roundStr) ||
    groupStr.includes("SEMI") ||
    /\bSF\b/i.test(groupStr)
  ) {
    return "SEMI_FINAL";
  }

  // 5. Quarter-Finals
  if (
    roundStr === "QUARTER_FINAL" ||
    roundStr.includes("QUARTER") ||
    /\bQF\b/i.test(roundStr) ||
    groupStr.includes("QUARTER") ||
    /\bQF\b/i.test(groupStr)
  ) {
    return "QUARTER_FINAL";
  }

  // 6. Round of 64
  if (
    roundStr === "ROUND_OF_64" ||
    roundStr.includes("ROUND OF 64") ||
    roundStr.includes("R64") ||
    roundStr.includes("1/32") ||
    /\b64\b/.test(roundStr) ||
    groupStr.includes("ROUND OF 64") ||
    /\b64\b/.test(groupStr)
  ) {
    return "ROUND_OF_64";
  }

  // 7. Round of 32
  if (
    roundStr === "ROUND_OF_32" ||
    roundStr.includes("ROUND OF 32") ||
    roundStr.includes("R32") ||
    roundStr.includes("1/16") ||
    /\b32\b/.test(roundStr) ||
    groupStr.includes("ROUND OF 32") ||
    /\b32\b/.test(groupStr)
  ) {
    return "ROUND_OF_32";
  }

  // 8. Round of 16 / Pre-Quarters
  if (
    roundStr === "ROUND_OF_16" ||
    roundStr.includes("ROUND OF 16") ||
    roundStr.includes("R16") ||
    roundStr.includes("1/8") ||
    roundStr.includes("PRE-QUARTER") ||
    /\b16\b/.test(roundStr) ||
    groupStr.includes("ROUND OF 16") ||
    groupStr.includes("PRE-QUARTER") ||
    /\b16\b/.test(groupStr)
  ) {
    return "ROUND_OF_16";
  }

  // Generic "Round 1" of a knockout bracket
  if (
    roundStr === "ROUND 1" ||
    roundStr === "ROUND_1" ||
    /ROUND[\s_-]*1\b/i.test(groupStr) ||
    /ROUND[\s_-]*1\b/i.test(roundStr)
  ) {
    const matchNum = Number(m?.matchNumber || m?.matchId || 0);
    const bracketSlot = Number(m?.bracketSlot || 0);
    if (matchNum > 16 || bracketSlot > 32) return "ROUND_OF_64";
    if (matchNum > 8 || bracketSlot > 16) return "ROUND_OF_32";
    return "ROUND_OF_16";
  }

  // Default fallback
  if (stageStr === "KNOCKOUT" || stageStr === "PLAYOFF") {
    return "ROUND_OF_16";
  }

  return "GROUP";
}

/**
 * Formats a concise human-readable label for a match's stage/round.
 */
export function formatRoundStageLabel(
  roundName?: string | null,
  groupName?: string | null,
  fallbackStage?: TournamentStageKey
): string {
  const stage = fallbackStage && fallbackStage !== "ALL"
    ? fallbackStage
    : (getMatchStage({ roundName, groupName }) as ConcreteStageKey);
  if (stage === "GROUP" && groupName && /^(group|pool)\b/i.test(groupName.trim())) {
    return groupName.trim();
  }
  return getStageMeta(stage).label;
}

export type StageProgressStatus = "COMPLETED" | "LIVE" | "IN_PROGRESS" | "UPCOMING";

export interface StageProgressItem {
  key: ConcreteStageKey;
  label: string;
  shortLabel: string;
  order: number;
  badgeClass: string;
  activePillClass: string;
  totalMatches: number;
  completedMatches: number;
  liveMatches: number;
  scheduledMatches: number;
  hasAssignedParticipants: boolean;
  status: StageProgressStatus;
  matches: any[];
}

export interface StageProgressionSummary {
  stages: StageProgressItem[];
  currentStage: StageProgressItem | null;
  isTournamentCompleted: boolean;
  championName: string | null;
  headline: string;
}

function getParticipantNames(m: any): { a: string; b: string } {
  const a = String(m?.teamAName || m?.homeName || m?.team1 || m?.teamA?.name || "").trim();
  const b = String(m?.teamBName || m?.awayName || m?.team2 || m?.teamB?.name || "").trim();
  return { a, b };
}

function resolveWinnerName(m: any): string | null {
  const direct = String(m?.winnerName || m?.winnerTeamName || "").trim();
  if (direct && !isPlaceholderOrTbd(direct)) return direct;
  if (m?.winnerTeamId != null) {
    const aId = m?.teamAId ?? m?.homeTeamId ?? m?.homeId;
    const bId = m?.teamBId ?? m?.awayTeamId ?? m?.awayId;
    const { a, b } = getParticipantNames(m);
    if (aId != null && String(m.winnerTeamId) === String(aId) && a && !isPlaceholderOrTbd(a)) return a;
    if (bId != null && String(m.winnerTeamId) === String(bId) && b && !isPlaceholderOrTbd(b)) return b;
  }
  return null;
}

/**
 * Computes ordered stage progression (Group Stage -> Round of 16 -> Quarter-Finals -> Semi-Finals -> Final)
 * from a list of matches for a tournament/event configuration.
 */
export function computeStageProgression(
  matches: any[],
  options?: { includeDrafts?: boolean }
): StageProgressionSummary {
  const includeDrafts = Boolean(options?.includeDrafts);
  const grouped = new Map<ConcreteStageKey, any[]>();

  for (const m of matches || []) {
    const rawStatus = String(m?.status || "").trim().toUpperCase();
    if (!includeDrafts && rawStatus === "DRAFT") continue;
    if (rawStatus === "BYE" || rawStatus === "AUTO_ADVANCED" || rawStatus === "CANCELLED" || isByeMatch(m)) {
      continue;
    }

    const stageKey = getMatchStage(m);
    const concreteKey: ConcreteStageKey = stageKey === "ALL" ? "GROUP" : stageKey;
    if (!grouped.has(concreteKey)) grouped.set(concreteKey, []);
    grouped.get(concreteKey)!.push(m);
  }

  const stages: StageProgressItem[] = [];

  for (const key of STAGE_ORDER) {
    const stageMatches = grouped.get(key);
    if (!stageMatches || stageMatches.length === 0) continue;

    let completedMatches = 0;
    let liveMatches = 0;
    let scheduledMatches = 0;
    let hasAssignedParticipants = false;

    for (const m of stageMatches) {
      const status = String(m?.status || "").trim().toUpperCase();
      if (status === "LIVE" || status === "IN_PROGRESS") {
        liveMatches += 1;
      } else if (
        status === "COMPLETED" ||
        status === "FINISHED" ||
        status === "WALKOVER" ||
        status === "FORFEITED"
      ) {
        completedMatches += 1;
      } else {
        scheduledMatches += 1;
      }

      const { a, b } = getParticipantNames(m);
      if ((a && !isPlaceholderOrTbd(a)) || (b && !isPlaceholderOrTbd(b))) {
        hasAssignedParticipants = true;
      }
    }

    const totalMatches = stageMatches.length;
    let status: StageProgressStatus = "UPCOMING";
    if (liveMatches > 0) {
      status = "LIVE";
    } else if (completedMatches === totalMatches) {
      status = "COMPLETED";
    } else if (completedMatches > 0) {
      status = "IN_PROGRESS";
    }

    const meta = getStageMeta(key);
    stages.push({
      ...meta,
      totalMatches,
      completedMatches,
      liveMatches,
      scheduledMatches,
      hasAssignedParticipants,
      status,
      matches: stageMatches,
    });
  }

  if (stages.length === 0) {
    return {
      stages: [],
      currentStage: null,
      isTournamentCompleted: false,
      championName: null,
      headline: "No matches scheduled yet",
    };
  }

  const liveStages = stages.filter((s) => s.status === "LIVE");
  const inProgressStages = stages.filter((s) => s.status === "IN_PROGRESS");
  const upcomingAssignedStages = stages.filter((s) => s.status === "UPCOMING" && s.hasAssignedParticipants);
  const allCompleted = stages.every((s) => s.status === "COMPLETED");

  let currentStage: StageProgressItem;
  if (liveStages.length > 0) {
    currentStage = liveStages[liveStages.length - 1];
  } else if (inProgressStages.length > 0) {
    currentStage = inProgressStages[inProgressStages.length - 1];
  } else if (upcomingAssignedStages.length > 0) {
    currentStage = upcomingAssignedStages[0];
  } else if (allCompleted) {
    currentStage = stages[stages.length - 1];
  } else {
    currentStage = stages.find((s) => s.status === "UPCOMING") || stages[0];
  }

  const finalStage = stages.find((s) => s.key === "FINAL");
  const championName =
    finalStage && finalStage.status === "COMPLETED"
      ? resolveWinnerName(finalStage.matches[0])
      : null;

  let headline = `${currentStage.label} (${currentStage.completedMatches}/${currentStage.totalMatches})`;
  if (allCompleted) {
    headline = championName ? `Completed · Champion: ${championName}` : "Tournament Completed";
  } else if (currentStage.status === "LIVE") {
    headline = `Live in ${currentStage.label}`;
  } else if (currentStage.status === "IN_PROGRESS") {
    headline = `${currentStage.label} (${currentStage.completedMatches}/${currentStage.totalMatches} done)`;
  } else if (currentStage.hasAssignedParticipants) {
    headline = `Up Next: ${currentStage.label}`;
  } else {
    headline = `Upcoming: ${currentStage.label}`;
  }

  return {
    stages,
    currentStage,
    isTournamentCompleted: allCompleted,
    championName,
    headline,
  };
}
