import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Radio, X, Trophy, Play, Activity, ExternalLink, Search, ChevronRight, ChevronLeft, Flame, CheckCircle2, RotateCw, Loader2, Calendar, Clock, Sliders, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { tournamentService, type FeedLiveMatch, type LiveMatchStateData, type GenericMatchState, type ScoringConfig, type TossDecision } from "../../../../services/sports/tournamentService";
import { stompClient } from "../../../../services/chat/stompClient";
import { apiClient, getStoredUser } from "../../../../services/common/apiClient";
import { useAuth } from "../../../../contexts/AuthContext";
import { CREATE_EDIT_SPORTS_MAIN } from "../../../../constants/permissions";
import { LiveMatchView } from "../../sports/LiveMatchView";
import { GenericLiveMatchView } from "../../sports/GenericLiveMatchView";
import { LiveScoringPanel } from "../../sports/LiveScoringPanel";
import { GenericLiveScoringPanel, isIndividualSport } from "../../sports/GenericLiveScoringPanel";
import { RaceScoringPanel } from "../../sports/RaceScoringPanel";
import { MatchScoringRulesModal } from "../../sports/MatchScoringRulesModal";
import { MatchScoringSetupModal } from "../../sports/MatchScoringSetupModal";
import type { HouseRulesConfig } from "../../sports/utils/cricketUtils";
import { getSportType, isCricketSport, isTimeSport } from "../../sports/utils/sportScoringConstants";

const POLL_MS = 30_000;
const MAX_CARDS = 3;
const DISMISS_KEY = "feedLiveStripDismissed";

function loadDismissed(): number[] {
  try {
    const raw = window.localStorage.getItem(DISMISS_KEY);
    return raw ? (JSON.parse(raw) as number[]) : [];
  } catch {
    return [];
  }
}

function getSportEmoji(sport?: string): string {
  if (!sport) return "🏆";
  const s = sport.toLowerCase();
  if (s.includes("cricket")) return "🏏";
  if (s.includes("badminton")) return "🏸";
  if (s.includes("football") || s.includes("soccer")) return "⚽";
  if (s.includes("tennis")) return "🎾";
  if (s.includes("table tennis") || s.includes("tt") || s.includes("ping pong")) return "🏓";
  if (s.includes("basketball")) return "🏀";
  if (s.includes("volleyball")) return "🏐";
  if (s.includes("carrom")) return "🎯";
  if (s.includes("chess")) return "♟️";
  if (s.includes("pickleball")) return "🏓";
  if (s.includes("swimming")) return "🏊";
  return "🏆";
}

function getRoundStageLabel(roundName?: string | null): string | null {
  if (!roundName?.trim()) return null;
  const value = roundName.trim().toUpperCase().replace(/[\s-]+/g, "_");
  if (/THIRD_PLACE|3RD_PLACE/.test(value)) return "3RD PLACE";
  if (/(^|_)GRAND_FINAL($|_)/.test(value)) return "GRAND FINAL";
  if (/(^|_)SUPER_FINAL($|_)/.test(value)) return "SUPER FINAL";
  if (/(^|_)ELIMINATOR($|_)/.test(value)) return "ELIMINATOR";
  const qualifierMatch = value.match(/(^|_)QUALIFIER_?(\d)?($|_)/);
  if (qualifierMatch) return qualifierMatch[2] ? `QUALIFIER ${qualifierMatch[2]}` : "QUALIFIER";
  if (/SEMI.?FINAL|(^|_)SF($|_)/.test(value)) return "SEMI-FINAL";
  if (/QUARTER.?FINAL|(^|_)QF($|_)/.test(value)) return "QUARTER-FINAL";
  if (/(^|_)FINAL($|_)/.test(value) || value === "F") return "FINAL";
  const roundMatch = value.match(/ROUND_OF_(\d+)|^R(\d+)$/);
  if (roundMatch) return `ROUND OF ${roundMatch[1] || roundMatch[2]}`;
  return null;
}

function formatCompletedTime(iso?: string | null): string {
  if (!iso) return "Completed";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "Completed";
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24 && d.getDate() === now.getDate()) {
      return `Today, ${d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
    }
    if (diffHours < 48) {
      return `Yesterday, ${d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
    }
    return d.toLocaleDateString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  } catch {
    return "Completed";
  }
}

const isLiveStatus = (status?: string, hasScores?: boolean) => {
  const s = String(status || "").toUpperCase().trim();
  if (
    s === "LIVE" ||
    s === "IN_PROGRESS" ||
    s === "INPROGRESS" ||
    s === "ACTIVE" ||
    s === "ONGOING" ||
    s === "STARTED" ||
    s === "MATCHES_RUNNING"
  ) {
    return true;
  }
  // Matches with recorded points/scores that haven't concluded or been cancelled
  if (hasScores && s !== "COMPLETED" && s !== "CANCELLED" && s !== "DRAFT" && s !== "BYE") {
    return true;
  }
  return false;
};

const isUpcomingStatus = (status?: string, hasScores?: boolean) => {
  if (isLiveStatus(status, hasScores)) return false;
  const s = String(status || "").toUpperCase().trim();
  if (s === "COMPLETED" || s === "CANCELLED" || s === "BYE" || s === "AUTO_ADVANCED") {
    return false;
  }
  return true;
};

function formatScheduledDateTime(iso?: string | null): string {
  if (!iso) return "Upcoming";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "Upcoming";
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = d.toDateString() === tomorrow.toDateString();

    const timeStr = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    if (isToday) return `Today, ${timeStr}`;
    if (isTomorrow) return `Tomorrow, ${timeStr}`;
    return d.toLocaleDateString([], { month: "short", day: "numeric" }) + `, ${timeStr}`;
  } catch {
    return "Upcoming";
  }
}

/**
 * "Live Now" strip for the community feed.
 * Placed at the top of FeedPage (above posts) as a live widget.
 * Shows matches flagged for the feed while LIVE (and during the post-match grace window).
 * Subscribes to /topic/match/{id}/state and /topic/sports/live for real-time score updates,
 * and re-fetches every 30s so cards are added and removed dynamically without stale feed posts.
 */
// ── Cricbuzz-Style Format Helpers ──────────────────────────────────────────

function formatCricketScore(score?: string | null): string {
  if (!score || score === "0" || score === "—") return "—";
  const s = String(score).trim();
  // If already formatted like "142/3 (18.2 ov)" or "142/3"
  if (s.includes("/") || s.includes("ov")) return s;
  return s;
}

function extractCricketScores(state: LiveMatchStateData, match: FeedLiveMatch): { scoreA: string; scoreB: string; isWicket: boolean } {
  let isWicket = false;
  if (state.recentBalls && state.recentBalls.length > 0) {
    isWicket = Boolean(state.recentBalls[0]?.isWicket);
  }

  const inn1 = state.innings1;
  const inn2 = state.innings2;

  let scoreA = match.scoreTeamA || "";
  let scoreB = match.scoreTeamB || "";

  const inn1ScoreStr = inn1 && inn1.totalRuns != null
    ? `${inn1.totalRuns}/${inn1.totalWickets ?? 0} (${inn1.totalOvers || "0.0"} ov)`
    : "";
  const inn2ScoreStr = inn2 && inn2.totalRuns != null && (inn2.totalRuns > 0 || inn2.totalWickets > 0 || (inn2.totalOvers && inn2.totalOvers !== "0.0"))
    ? `${inn2.totalRuns}/${inn2.totalWickets ?? 0} (${inn2.totalOvers || "0.0"} ov)`
    : "";

  const isTeamABattingFirst = Boolean(
    (inn1?.battingTeamId && (inn1.battingTeamId === state.teamAId || (match.teamAId && inn1.battingTeamId === match.teamAId))) ||
    (inn1?.battingTeamName && match.teamAName && inn1.battingTeamName.toLowerCase().includes(match.teamAName.toLowerCase())) ||
    (inn1?.battingTeamName && state.teamAName && inn1.battingTeamName.toLowerCase().includes(state.teamAName.toLowerCase()))
  );

  if (isTeamABattingFirst) {
    if (inn1ScoreStr) scoreA = inn1ScoreStr;
    if (inn2ScoreStr) scoreB = inn2ScoreStr;
  } else {
    if (inn1ScoreStr) scoreB = inn1ScoreStr;
    if (inn2ScoreStr) scoreA = inn2ScoreStr;
  }

  return { scoreA, scoreB, isWicket };
}

function extractGenericScores(state: GenericMatchState, match: FeedLiveMatch): { scoreA: string; scoreB: string } {
  const isSetSport = /badminton|tennis|table|volleyball|squash/i.test(state.sportType || match.sportName || "");
  if (isSetSport && (state.periodsWonA > 0 || state.periodsWonB > 0)) {
    const scoreA = `${state.periodsWonA} (${state.scoreTeamA ?? 0})`;
    const scoreB = `${state.periodsWonB} (${state.scoreTeamB ?? 0})`;
    return { scoreA, scoreB };
  }

  const scoreA = state.scoreTeamA != null ? String(state.scoreTeamA) : (match.scoreTeamA || "0");
  const scoreB = state.scoreTeamB != null ? String(state.scoreTeamB) : (match.scoreTeamB || "0");
  return { scoreA, scoreB };
}

function getMatchContextNarrative(m: FeedLiveMatch, isLive: boolean): { text: string; highlight?: boolean } {
  if (!isLive) {
    if (m.winnerName) {
      return { text: `Winner: ${m.winnerName}`, highlight: true };
    }
    return { text: "Match Concluded", highlight: false };
  }

  const isCricket = /cricket/i.test(m.sportName || "");
  if (isCricket) {
    if (m.scoreTeamB && m.scoreTeamB !== "0" && m.scoreTeamB !== "—" && m.scoreTeamA && m.scoreTeamA !== "0") {
      return { text: "2nd Innings in progress · Chase on", highlight: true };
    }
    if (m.scoreTeamA && m.scoreTeamA !== "0" && (!m.scoreTeamB || m.scoreTeamB === "0" || m.scoreTeamB === "—")) {
      return { text: "1st Innings in progress", highlight: false };
    }
    return { text: "Live Action · In Progress", highlight: false };
  }

  // Badminton / Tennis / Table Tennis / Pickleball
  if (/badminton|tennis|pickleball|table|squash/i.test(m.sportName || "")) {
    return { text: "", highlight: false };
  }

  // Football / Basketball / Volleyball
  return { text: "", highlight: false };
}

export function LiveMatchesStrip() {
  const navigate = useNavigate();
  const { hasPermission, isAdmin, isSuperAdmin, isSportsAdmin } = useAuth();
  const canManageMatches = Boolean(isAdmin || isSuperAdmin || isSportsAdmin || hasPermission(CREATE_EDIT_SPORTS_MAIN));
  const [matches, setMatches] = useState<FeedLiveMatch[]>([]);
  const [dismissed, setDismissed] = useState<number[]>(loadDismissed);
  const [watching, setWatching] = useState<FeedLiveMatch | null>(null);
  const [scoringMatch, setScoringMatch] = useState<FeedLiveMatch | null>(null);
  const [scoreSetupMatch, setScoreSetupMatch] = useState<FeedLiveMatch | null>(null);
  const [scoreSetupConfig, setScoreSetupConfig] = useState<ScoringConfig | null>(null);
  const [scoreSetupConfigSource, setScoreSetupConfigSource] = useState<"match" | "default" | null>(null);
  const [scoreSetupNeedsCricketConfig, setScoreSetupNeedsCricketConfig] = useState(false);
  const [showScoreRules, setShowScoreRules] = useState(false);
  const [startingMatchId, setStartingMatchId] = useState<number | null>(null);
  const [allMatchesModalOpen, setAllMatchesModalOpen] = useState(false);
  const [modalSearch, setModalSearch] = useState("");
  const [modalSportFilter, setModalSportFilter] = useState("ALL");
  const [modalStatusFilter, setModalStatusFilter] = useState<"ALL" | "LIVE_ONLY" | "UPCOMING_ONLY">("ALL");
  const [recentResultsModalOpen, setRecentResultsModalOpen] = useState(false);
  const [recentMatches, setRecentMatches] = useState<FeedLiveMatch[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);
  const [recentSearch, setRecentSearch] = useState("");
  const [recentSportFilter, setRecentSportFilter] = useState("ALL");
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const isFetchingRef = useRef(false);
  const [flashingMatchIds, setFlashingMatchIds] = useState<Record<number, "score" | "wicket">>({});
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  const scrollByAmount = (amount: number) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: amount, behavior: "smooth" });
    }
  };

  const promoteMatchToLive = async (match: FeedLiveMatch) => {
    if (!match.matchId) throw new Error("This fixture is not linked to a saved match record.");
    if (!isLiveStatus(match.status)) {
      await apiClient.put(`/sports/matches/${match.matchId}/status`, { status: "LIVE" });
      setMatches(previous => previous.map(item =>
        item.matchId === match.matchId ? { ...item, status: "LIVE" } : item
      ));
    }
  };

  const handleStartMatch = async (match: FeedLiveMatch) => {
    setStartingMatchId(match.matchId);
    try {
      await promoteMatchToLive(match);
      toast.success(`${match.teamAName} vs ${match.teamBName} is now live.`);
    } catch (error: any) {
      toast.error(error?.message || "Could not start this match.");
    } finally {
      setStartingMatchId(null);
    }
  };

  const handleScoreMatch = async (match: FeedLiveMatch) => {
    setStartingMatchId(match.matchId);
    try {
      const sportName = match.sportName || match.eventName || "Sports";
      const sportType = getSportType(sportName) || "DEFAULT";
      const [matchConfig, defaultConfig] = await Promise.all([
        tournamentService.getMatchScoringConfig(match.matchId).catch(() => null),
        tournamentService.getDefaultScoringConfig(sportType).catch(() => null),
      ]);
      const isCricketMatch = isCricketSport(sportName);
      // The service's match-config endpoint returns a response even when it had to
      // construct an empty/default config. For cricket, an innings-over value is the
      // signal that a tournament or match format was actually configured.
      const effectiveConfig = isCricketMatch
        ? (matchConfig?.oversPerInnings && matchConfig.oversPerInnings > 0 ? matchConfig : null)
        : matchConfig || defaultConfig;
      const supportsScoringRules = isCricketSport(sportName) || isTimeSport(sportName) || [
        "BADMINTON", "TENNIS", "TABLE_TENNIS", "PICKLEBALL", "SQUASH", "VOLLEYBALL", "BEACH_VOLLEYBALL", "GRASS_VOLLEYBALL", "THROWBALL",
        "CARROM", "FOOSBALL", "DART", "POOL", "BILLIARDS", "SNOOKER",
      ].includes(sportType);

      // Sports with configurable rules must resolve an effective configuration before
      // scoring starts. Keep the fixture scheduled if configuration cannot be loaded.
      if (supportsScoringRules && !effectiveConfig && !isCricketMatch) {
        throw new Error("Scoring rules could not be loaded. The match has not been started.");
      }

      setScoreSetupConfig(effectiveConfig);
      setScoreSetupConfigSource(effectiveConfig ? (matchConfig ? "match" : "default") : null);
      setScoreSetupNeedsCricketConfig(isCricketMatch && !effectiveConfig);
      setShowScoreRules(false);
      setScoreSetupMatch(match);
    } catch (error: any) {
      toast.error(error?.message || "Could not load scoring rules. The match has not been started.");
    } finally {
      setStartingMatchId(null);
    }
  };

  const handleConfirmScoreSetup = async (params: {
    oversLimit?: number;
    ballsPerOver?: number;
    maxOversPerBowler?: number;
    houseRules?: HouseRulesConfig;
    tossWinnerTeamId?: number;
    tossDecision?: TossDecision;
  }) => {
    if (!scoreSetupMatch) return;
    const match = scoreSetupMatch;
    setStartingMatchId(match.matchId);
    try {
      const sportName = match.sportName || match.eventName || "Sports";
      if (isCricketSport(sportName)) {
        const overs = params.oversLimit || 20;
        const bowlerMax = params.maxOversPerBowler || Math.ceil(overs / 5);
        const balls = params.ballsPerOver || 6;

        // 1. Save match config override to backend
        const savedConfig = await tournamentService.updateMatchConfigOverride(match.matchId, {
          sportType: "CRICKET",
          periodsCount: 2,
          mustWinByTwo: false,
          hasOvertime: false,
          hasPenaltyShootout: false,
          oversPerInnings: overs,
          maxOversPerBowler: bowlerMax,
          ballsPerOver: balls,
          noExtraRuns: params.houseRules?.enabled !== false && !!params.houseRules?.noExtraRuns,
          noFreeHits: params.houseRules?.enabled !== false && !!params.houseRules?.noFreeHits,
        });
        setScoreSetupConfig(savedConfig);
        setScoreSetupConfigSource("match");
        setScoreSetupNeedsCricketConfig(false);

        // 2. Save house rules to localStorage
        if (params.houseRules && typeof localStorage !== "undefined") {
          try {
            localStorage.setItem(
              `mc-match-${match.matchId}-house-rules`,
              JSON.stringify(params.houseRules)
            );
          } catch {}
        }
      }

      // 3. Record toss if selected
      if (params.tossWinnerTeamId && params.tossDecision) {
        try {
          await tournamentService.recordMatchToss(match.matchId, {
            tossWinnerTeamId: params.tossWinnerTeamId,
            tossDecision: params.tossDecision,
          });
        } catch {
          // Non-blocking if toss API fails
        }
      }

      // 4. Promote match to live
      await promoteMatchToLive(match);
      setScoreSetupMatch(null);
      setShowScoreRules(false);
      setScoringMatch({ ...match, status: "LIVE" });
    } catch (error: any) {
      toast.error(error?.message || "Could not start scoring for this match.");
    } finally {
      setStartingMatchId(null);
    }
  };

  const load = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      const user = getStoredUser();
      const communityId = user?.communityId != null ? Number(user.communityId) : undefined;
      const combinedMap = new Map<number, FeedLiveMatch>();

      // 1. Fetch from /sports/live-feed and /sports/upcoming-feed
      try {
        let feedMatches = await tournamentService.getLiveFeedMatches(communityId);
        // Fallback: If community-scoped query returns no matches, check across all communities
        if ((!feedMatches || feedMatches.length === 0) && communityId) {
          feedMatches = await tournamentService.getLiveFeedMatches(undefined);
        }
        if (Array.isArray(feedMatches)) {
          feedMatches.forEach((m) => {
            if (m && m.matchId) combinedMap.set(m.matchId, m);
          });
        }
      } catch {
        // Backend live-feed endpoint may be unavailable or unconfigured; will continue below
      }

      try {
        let upcomingFeed = await tournamentService.getUpcomingFeedMatches(communityId);
        if ((!upcomingFeed || upcomingFeed.length === 0) && communityId) {
          upcomingFeed = await tournamentService.getUpcomingFeedMatches(undefined);
        }
        if (Array.isArray(upcomingFeed)) {
          upcomingFeed.forEach((m) => {
            if (m && m.matchId && !combinedMap.has(m.matchId)) combinedMap.set(m.matchId, m);
          });
        }
      } catch {
        // Continue below
      }

      // 2. Query tournament schedule configs to discover any active live & upcoming matches in tournaments
      try {
        const configs = await tournamentService.getConfigs().catch(() => []);
        const relevantConfigs = Array.isArray(configs)
          ? configs.filter((c) => {
              const st = String(c?.status || "").toUpperCase();
              return ["PUBLISHED", "ACTIVE", "LIVE", "IN_PROGRESS", "COMPLETED"].includes(st);
            })
          : [];
        if (relevantConfigs.length > 0) {
          const matchPromises = relevantConfigs.map(async (cfg) => {
            try {
              const cfgMatches = await tournamentService.getMatchesByConfigId(cfg.id);
              if (!Array.isArray(cfgMatches)) return [];
              return cfgMatches
                .filter((m: any) => {
                  if (!m || m.status === "BYE" || m.status === "AUTO_ADVANCED" || m.status === "CANCELLED") return false;
                  if (m.showInFeed === false) return false;
                  return true;
                })
                .map((m: any): FeedLiveMatch => {
                  const hasScores = Boolean(
                    (m.scoreTeamA && m.scoreTeamA !== "0" && m.scoreTeamA !== "—") ||
                    (m.scoreTeamB && m.scoreTeamB !== "0" && m.scoreTeamB !== "—") ||
                    (m.score1 && m.score1 !== "0") ||
                    (m.score2 && m.score2 !== "0")
                  );
                  const isLive = isLiveStatus(m.status, hasScores);
                  const isCompleted = m.status === "COMPLETED";
                  return {
                    matchId: m.id || m.matchId,
                    configId: cfg.id,
                    sportName: cfg.sportName || cfg.eventName || "Sports",
                    tournamentName: cfg.tournamentName || "Tournament",
                    eventName: cfg.eventName,
                    roundName: m.roundName || m.round,
                    teamAName: m.teamAName || m.homeName || (/badminton|tennis|table|squash|chess|carrom/i.test(cfg.sportName || cfg.eventName || "") ? "Player 1" : "Team A"),
                    teamBName: m.teamBName || m.awayName || (/badminton|tennis|table|squash|chess|carrom/i.test(cfg.sportName || cfg.eventName || "") ? "Player 2" : "Team B"),
                    teamAId: m.teamAId || m.homeTeamId || m.teamA?.id || null,
                    teamBId: m.teamBId || m.awayTeamId || m.teamB?.id || null,
                    teamAFlat: m.teamAFlat || m.homeFlat,
                    teamBFlat: m.teamBFlat || m.awayFlat,
                    scoreTeamA: m.scoreTeamA ?? m.score1 ?? "",
                    scoreTeamB: m.scoreTeamB ?? m.score2 ?? "",
                    status: isLive ? "LIVE" : (isCompleted ? "COMPLETED" : (m.status || "SCHEDULED")),
                    winnerName: m.winnerName,
                    scheduledAt: m.scheduledAt,
                    venueName: m.venueName || m.courtName,
                  };
                });
            } catch {
              return [];
            }
          });
          const nested = await Promise.all(matchPromises);
          nested.flat().forEach((m) => {
            if (m && m.matchId) {
              const existing = combinedMap.get(m.matchId);
              if (!existing) {
                combinedMap.set(m.matchId, m);
              } else {
                combinedMap.set(m.matchId, {
                  ...m,
                  ...existing,
                  scoreTeamA: existing.scoreTeamA || m.scoreTeamA || "",
                  scoreTeamB: existing.scoreTeamB || m.scoreTeamB || "",
                });
              }
            }
          });
        }
      } catch {
        // Keep current state on error
      }

      setMatches(Array.from(combinedMap.values()));
    } catch {
      // The strip is optional; fail silently and keep the last known state.
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  // 1. Initial load + periodic refresh (every 30s) to add new matches / drop finished ones
  useEffect(() => {
    load();
    const id = window.setInterval(load, POLL_MS);
    return () => window.clearInterval(id);
  }, [load]);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll, matches]);

  // 2. Global live lifecycle topic: listen for tournament/event match start/finish broadcasts
  useEffect(() => {
    const unsub = stompClient.subscribe("/topic/sports/live", () => {
      load();
    });
    return () => {
      unsub();
    };
  }, [load]);

  // 3. Real-time score updates: per-match websocket subscriptions for active live matches
  const liveIdsKey = matches.filter((m) => isLiveStatus(m.status)).map((m) => m.matchId).join(",");
  useEffect(() => {
    if (!liveIdsKey) return;
    const matchIds = liveIdsKey.split(",");
    const unsubs: (() => void)[] = [];

    matchIds.forEach((id) => {
      // Cricket state updates: instantly patch score in local React state
      unsubs.push(
        stompClient.subscribe(`/topic/match/${id}/state`, (body: any) => {
          if (!body) return;
          const matchNum = Number(id);
          const stateData = body as LiveMatchStateData;

          // 1. Immediately patch the card in local state (0ms latency!)
          setMatches((prev) =>
            prev.map((m) => {
              if (m.matchId !== matchNum) return m;
              const { scoreA, scoreB } = extractCricketScores(stateData, m);
              return {
                ...m,
                scoreTeamA: scoreA || m.scoreTeamA,
                scoreTeamB: scoreB || m.scoreTeamB,
                status: stateData.status || "LIVE",
              };
            })
          );

          // 2. Trigger instant visual flash indicator
          const isWicket = Boolean(
            stateData.recentBalls?.[0]?.isWicket ||
            (typeof body === "string" && body.includes("WICKET"))
          );
          setFlashingMatchIds((prev) => ({ ...prev, [matchNum]: isWicket ? "wicket" : "score" }));
          setTimeout(() => {
            setFlashingMatchIds((prev) => {
              const copy = { ...prev };
              delete copy[matchNum];
              return copy;
            });
          }, 1200);

          // 3. Only if match completed or moved away from LIVE, reconcile structure in background
          if (stateData.status === "COMPLETED") {
            if (refreshTimer.current) clearTimeout(refreshTimer.current);
            refreshTimer.current = setTimeout(load, 2000);
          }
        })
      );

      // Generic sports state updates (badminton, football, tennis, etc.)
      unsubs.push(
        stompClient.subscribe(`/topic/match/${id}/generic-state`, (body: any) => {
          if (!body) return;
          const matchNum = Number(id);
          const stateData = body as GenericMatchState;

          // 1. Immediately patch the card in local state (0ms latency!)
          setMatches((prev) =>
            prev.map((m) => {
              if (m.matchId !== matchNum) return m;
              const { scoreA, scoreB } = extractGenericScores(stateData, m);
              return {
                ...m,
                scoreTeamA: scoreA || m.scoreTeamA,
                scoreTeamB: scoreB || m.scoreTeamB,
                status: stateData.status || "LIVE",
              };
            })
          );

          // 2. Trigger instant visual flash indicator
          setFlashingMatchIds((prev) => ({ ...prev, [matchNum]: "score" }));
          setTimeout(() => {
            setFlashingMatchIds((prev) => {
              const copy = { ...prev };
              delete copy[matchNum];
              return copy;
            });
          }, 1200);

          // 3. Only if match completed, reconcile structure in background
          if (stateData.status === "COMPLETED") {
            if (refreshTimer.current) clearTimeout(refreshTimer.current);
            refreshTimer.current = setTimeout(load, 2000);
          }
        })
      );
    });

    return () => {
      unsubs.forEach((u) => u());
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    };
  }, [liveIdsKey, load]);

  const dismiss = (matchId: number) => {
    const next = [...dismissed, matchId];
    setDismissed(next);
    try {
      window.localStorage.setItem(DISMISS_KEY, JSON.stringify(next.slice(-100)));
    } catch {
      /* ignore storage errors */
    }
  };

  const visible = useMemo(() => {
    return matches.filter((m) => !dismissed.includes(m.matchId));
  }, [matches, dismissed]);

  const liveMatches = useMemo(() => {
    return visible.filter((m) => isLiveStatus(m.status));
  }, [visible]);

  const upcomingMatches = useMemo(() => {
    return visible
      .filter((m) => isUpcomingStatus(m.status))
      .sort((a, b) => {
        const tA = a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0;
        const tB = b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0;
        return tA - tB;
      });
  }, [visible]);

  const completedMatches = useMemo(() => {
    return visible.filter((m) => m.status === "COMPLETED");
  }, [visible]);

  // Combined ordered matches:
  // 1. All LIVE matches come first.
  // 2. Next UPCOMING matches follow immediately (filling empty slots or in carousel).
  // 3. Recently COMPLETED matches come last.
  const orderedMatches = useMemo(() => {
    return [...liveMatches, ...upcomingMatches, ...completedMatches];
  }, [liveMatches, upcomingMatches, completedMatches]);

  const availableSports = useMemo(() => {
    const set = new Set<string>();
    matches.forEach((m) => {
      if (m.sportName?.trim()) set.add(m.sportName.trim());
    });
    return Array.from(set).sort();
  }, [matches]);

  const filteredModalMatches = useMemo(() => {
    return matches.filter((m) => {
      if (modalStatusFilter === "LIVE_ONLY" && !isLiveStatus(m.status)) return false;
      if (modalStatusFilter === "UPCOMING_ONLY" && !isUpcomingStatus(m.status)) return false;
      if (modalSportFilter !== "ALL" && (m.sportName || "").toLowerCase() !== modalSportFilter.toLowerCase()) return false;
      if (modalSearch.trim()) {
        const q = modalSearch.toLowerCase().trim();
        const text = [
          m.teamAName,
          m.teamBName,
          m.teamAFlat,
          m.teamBFlat,
          m.sportName,
          m.tournamentName,
          m.eventName,
          m.roundName,
          m.venueName,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    }).sort((a, b) => {
      const aLive = isLiveStatus(a.status);
      const bLive = isLiveStatus(b.status);
      if (aLive && !bLive) return -1;
      if (!aLive && bLive) return 1;
      const tA = a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0;
      const tB = b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0;
      return tA - tB;
    });
  }, [matches, modalStatusFilter, modalSportFilter, modalSearch]);

  const loadRecentMatches = useCallback(async () => {
    setLoadingRecent(true);
    try {
      const user = getStoredUser();
      const communityId = user?.communityId != null ? Number(user.communityId) : undefined;
      let data = await tournamentService.getRecentCompletedMatches(communityId, 40).catch(() => []);
      if ((!data || data.length === 0) && communityId) {
        data = await tournamentService.getRecentCompletedMatches(undefined, 40).catch(() => []);
      }
      const combined = new Map<number, FeedLiveMatch>();
      if (Array.isArray(data)) {
        data.forEach((m) => {
          if (m && m.matchId) combined.set(m.matchId, m);
        });
      }
      matches.forEach((m) => {
        if (m && m.matchId && m.status === "COMPLETED" && !combined.has(m.matchId)) {
          combined.set(m.matchId, m);
        }
      });
      if (combined.size === 0) {
        try {
          const configs = await tournamentService.getConfigs().catch(() => []);
          const relevantConfigs = Array.isArray(configs)
            ? configs.filter((c) => {
                const st = String(c?.status || "").toUpperCase();
                return ["PUBLISHED", "ACTIVE", "COMPLETED"].includes(st);
              })
            : [];
          if (relevantConfigs.length > 0) {
            const nested = await Promise.all(
              relevantConfigs.map((cfg) =>
                tournamentService.getMatchesByConfigId(cfg.id).catch(() => [] as any[])
              )
            );
            nested.forEach((cfgMatches, idx) => {
              const cfg = relevantConfigs[idx];
              if (Array.isArray(cfgMatches)) {
                cfgMatches
                  .filter((m: any) => m && m.status === "COMPLETED")
                  .forEach((m: any) => {
                    const matchId = m.id || m.matchId;
                    if (matchId && !combined.has(matchId)) {
                      combined.set(matchId, {
                        matchId,
                        configId: cfg.id,
                        sportName: cfg.sportName || cfg.eventName || "Sports",
                        tournamentName: cfg.tournamentName || "Tournament",
                        eventName: cfg.eventName,
                        roundName: m.roundName || m.round,
                        teamAName: m.teamAName || m.homeName || "Team A",
                        teamBName: m.teamBName || m.awayName || "Team B",
                        teamAFlat: m.teamAFlat || m.homeFlat,
                        teamBFlat: m.teamBFlat || m.awayFlat,
                        scoreTeamA: m.scoreTeamA ?? m.score1 ?? "",
                        scoreTeamB: m.scoreTeamB ?? m.score2 ?? "",
                        status: "COMPLETED",
                        winnerName: m.winnerName,
                        scheduledAt: m.scheduledAt,
                        completedAt: m.completedAt,
                        venueName: m.venueName || m.courtName,
                      });
                    }
                  });
              }
            });
          }
        } catch {
          // Ignore fallback errors
        }
      }
      setRecentMatches(Array.from(combined.values()));
    } catch {
      // Keep existing matches if load fails
    } finally {
      setLoadingRecent(false);
    }
  }, [matches]);

  const openRecentResultsModal = () => {
    setRecentResultsModalOpen(true);
    loadRecentMatches();
  };

  const recentAvailableSports = useMemo(() => {
    const set = new Set<string>();
    recentMatches.forEach((m) => {
      if (m.sportName?.trim()) set.add(m.sportName.trim());
    });
    return Array.from(set).sort();
  }, [recentMatches]);

  const filteredRecentMatches = useMemo(() => {
    return recentMatches.filter((m) => {
      if (recentSportFilter !== "ALL" && (m.sportName || "").toLowerCase() !== recentSportFilter.toLowerCase()) return false;
      if (recentSearch.trim()) {
        const q = recentSearch.toLowerCase().trim();
        const text = [
          m.teamAName,
          m.teamBName,
          m.teamAFlat,
          m.teamBFlat,
          m.winnerName,
          m.sportName,
          m.tournamentName,
          m.eventName,
          m.roundName,
          m.venueName,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });
  }, [recentMatches, recentSportFilter, recentSearch]);

  if (visible.length === 0) {
    if (matches.length > 0) {
      return (
        <div className="flex items-center justify-between px-3.5 py-2.5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs text-xs animate-fade-in">
          <span className="text-slate-500 font-medium flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-indigo-500" />
            {matches.length} match{matches.length > 1 ? "es" : ""} currently hidden.
          </span>
          <button
            type="button"
            onClick={() => {
              setDismissed([]);
              try { window.localStorage.removeItem(DISMISS_KEY); } catch {}
            }}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
          >
            Show Matches
          </button>
        </div>
      );
    }
    return null;
  }

  const shown = orderedMatches.slice(0, MAX_CARDS);
  const liveCount = liveMatches.length;
  const isCricket = (m: FeedLiveMatch) => /cricket/i.test(m.sportName || "");

  return (
    <section aria-label="Live sports matches" className="space-y-2">
      {/* Strip Header */}
      <div className="flex items-center justify-between gap-1 px-0.5 sm:gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <h5 className="m-0 flex min-w-0 items-center gap-1.5 whitespace-nowrap text-[11px] font-black uppercase tracking-wider text-slate-800 sm:text-xs">
            {liveCount > 0 ? (
              <>
                <Radio className="w-3.5 h-3.5 text-red-600 animate-pulse" />
                Live Now
              </>
            ) : (
              <>
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                <span className="sm:hidden">Upcoming</span>
                <span className="hidden sm:inline">Upcoming Matches</span>
              </>
            )}
          </h5>

          {liveCount > 0 && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 animate-pulse">
              {liveCount}
            </span>
          )}

        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => setAllMatchesModalOpen(true)}
            className="group inline-flex min-h-8 items-center gap-1 rounded-lg border border-indigo-100 bg-indigo-50/80 px-2 text-[10px] font-bold text-indigo-700 transition hover:border-indigo-200 hover:bg-indigo-100 hover:text-indigo-800 cursor-pointer sm:min-h-0 sm:px-2.5 sm:text-[11px]"
            title="View all matches in modal popup"
          >
            <span className="sm:hidden">Matches</span>
            <span className="hidden sm:inline">{liveCount > 0 ? "All Matches" : "All Upcoming Matches"}</span>
            <ExternalLink className="hidden h-3 w-3 transition-transform group-hover:translate-x-0.5 sm:block" />
          </button>

          <button
            type="button"
            onClick={openRecentResultsModal}
            className="group inline-flex min-h-8 items-center gap-1 rounded-lg border border-amber-100 bg-amber-50/80 px-2 text-[10px] font-bold text-amber-700 transition hover:border-amber-200 hover:bg-amber-100 hover:text-amber-800 cursor-pointer sm:min-h-0 sm:px-2.5 sm:text-[11px]"
            title="View recently completed matches and results"
          >
            <Trophy className="h-3 w-3 text-amber-500 transition-transform group-hover:scale-110" />
            <span className="sm:hidden">Results</span>
            <span className="hidden sm:inline">Recent Results</span>
            <ExternalLink className="hidden h-3 w-3 transition-transform group-hover:translate-x-0.5 sm:block" />
          </button>
        </div>
      </div>

      {/* Cards Horizontal Carousel with Cricbuzz Desktop Nav Chevrons */}
      <div className="relative group/carousel">
        {/* Left Floating Chevron (Desktop) */}
        {canScrollLeft && (
          <button
            type="button"
            aria-label="Scroll left"
            onClick={() => scrollByAmount(-300)}
            className="hidden sm:flex absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/95 hover:bg-white text-slate-700 shadow-md border border-slate-200 items-center justify-center transition-all hover:scale-105 cursor-pointer backdrop-blur-xs"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        {/* Right Floating Chevron (Desktop) */}
        {canScrollRight && (
          <button
            type="button"
            aria-label="Scroll right"
            onClick={() => scrollByAmount(300)}
            className="hidden sm:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/95 hover:bg-white text-slate-700 shadow-md border border-slate-200 items-center justify-center transition-all hover:scale-105 cursor-pointer backdrop-blur-xs"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        <div
          ref={scrollContainerRef}
          className="flex snap-x snap-mandatory gap-2.5 overflow-x-auto pb-2 pt-0.5 scrollbar-none scroll-smooth sm:gap-3 sm:snap-x sm:scrollbar-thin"
        >
          {shown.map((m) => {
            const live = isLiveStatus(m.status);
            const isCompleted = m.status === "COMPLETED";
            const isUpcoming = !live && !isCompleted;
            const isCricketMatch = isCricket(m);
            const narrative = getMatchContextNarrative(m, live);
            const flashType = flashingMatchIds[m.matchId];
            const roundStageLabel = getRoundStageLabel(m.roundName);

            const isTeamAWinner = Boolean(
              isCompleted &&
              m.winnerName &&
              (m.winnerName.toLowerCase() === m.teamAName.toLowerCase() ||
               m.winnerName.toLowerCase().includes(m.teamAName.toLowerCase()))
            );
            const isTeamBWinner = Boolean(
              isCompleted &&
              m.winnerName &&
              (m.winnerName.toLowerCase() === m.teamBName.toLowerCase() ||
               m.winnerName.toLowerCase().includes(m.teamBName.toLowerCase()))
            );

            return (
              <div
                key={m.matchId}
                onClick={() => {
                  if (isUpcoming) {
                    if (m.configId) {
                      navigate(`/sports/schedule?configId=${m.configId}`);
                    } else {
                      navigate("/sports/schedule");
                    }
                  } else {
                    setWatching(m);
                  }
                }}
                className={`group w-[min(86vw,310px)] shrink-0 snap-start rounded-xl border transition-all duration-300 flex flex-col justify-between cursor-pointer select-none relative overflow-hidden sm:w-[310px] sm:rounded-2xl ${
                  flashType === "wicket"
                    ? "border-rose-400 bg-rose-50/40 shadow-rose-100 ring-2 ring-rose-400"
                    : flashType === "score"
                    ? "border-emerald-400 bg-emerald-50/40 shadow-emerald-100 ring-2 ring-emerald-400"
                    : isCompleted
                    ? "border-amber-300/80 bg-gradient-to-br from-amber-50/40 via-white to-emerald-50/30 hover:border-amber-400 hover:shadow-md hover:-translate-y-0.5"
                    : isUpcoming
                    ? "border-slate-200/90 bg-white hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5"
                    : "border-slate-200/90 bg-white hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5"
                } p-2.5 sm:p-3.5 shadow-2xs`}
              >
                <div>
                  {/* Top Line: Sport, Status Badge, Dismiss */}
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-1">
                      <span className="inline-flex min-w-0 items-center gap-1.5 text-[11px] font-bold text-indigo-700 bg-indigo-50/90 px-2 py-0.5 rounded-md truncate max-w-[120px]">
                        <span>{getSportEmoji(m.sportName ?? undefined)}</span>
                        <span className="truncate">{m.sportName || "Sports"}</span>
                      </span>
                      {roundStageLabel && (
                        <span
                          title={roundStageLabel}
                          className={`inline-flex shrink-0 items-center rounded-md border px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide ${
                            roundStageLabel === "FINAL"
                              ? "border-amber-200 bg-amber-50 text-amber-800"
                              : "border-violet-200 bg-violet-50 text-violet-800"
                          }`}
                        >
                          {roundStageLabel}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {live ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-white bg-red-600 px-2 py-0.5 rounded-full shadow-2xs animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-white" /> LIVE
                        </span>
                      ) : isCompleted ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-amber-900 bg-gradient-to-r from-amber-100 to-yellow-100 border border-amber-300/80 px-2 py-0.5 rounded-full shadow-2xs">
                          <Trophy className="w-2.5 h-2.5 text-amber-600 fill-amber-500" /> FINAL
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded-full">
                          <Clock className="w-2.5 h-2.5 text-blue-600" /> UPCOMING
                        </span>
                      )}

                      <button
                        type="button"
                        aria-label="Dismiss card"
                        title="Dismiss card"
                        onClick={(e) => {
                          e.stopPropagation();
                          dismiss(m.matchId);
                        }}
                        className="-mr-1 inline-flex min-h-8 min-w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 cursor-pointer sm:mr-0 sm:min-h-6 sm:min-w-6"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Tournament / Event subtitle */}
                  <p className="mb-1 truncate text-[10px] font-medium text-slate-400 sm:mb-1.5 sm:text-[11px]">
                    {[m.tournamentName, m.eventName, roundStageLabel ? null : m.roundName].filter(Boolean).join(" · ")}
                  </p>

                  {/* Teams & Scores (Cricbuzz Bold Layout with Winner Accent) */}
                  <div className="space-y-1 rounded-xl border border-slate-100 bg-slate-50/90 p-2 group-hover:border-indigo-100 group-hover:bg-indigo-50/30 transition-colors sm:space-y-1.5 sm:p-2.5">
                    {/* Team A */}
                    <div className={`flex items-center justify-between gap-2 p-1 rounded-lg transition-colors ${
                      isTeamAWinner ? "bg-amber-100/70 border border-amber-300/60" : ""
                    }`}>
                      <div className="flex items-center gap-1.5 min-w-0">
                        {isTeamAWinner && (
                          <Trophy className="w-3.5 h-3.5 text-amber-500 fill-amber-400 shrink-0" />
                        )}
                        <span className={`text-xs truncate ${
                          isTeamAWinner ? "font-black text-slate-900" : "font-bold text-slate-900 group-hover:text-indigo-950"
                        }`}>
                          {m.teamAName}
                        </span>
                        {m.teamAFlat && (
                          <span className="text-[9px] font-semibold text-slate-500 bg-white border border-slate-200 px-1 py-0.2 rounded shrink-0">
                            {m.teamAFlat}
                          </span>
                        )}
                      </div>
                      <span className={`text-xs sm:text-sm font-mono tracking-tight shrink-0 transition-colors ${
                        isTeamAWinner
                          ? "text-emerald-700 font-black scale-105"
                          : flashType
                          ? "text-emerald-600 font-extrabold scale-105"
                          : (isUpcoming ? "text-slate-400 font-semibold" : "text-slate-900 font-black")
                      }`}>
                        {isUpcoming ? "—" : (isCricketMatch ? formatCricketScore(m.scoreTeamA) : (m.scoreTeamA || "0"))}
                      </span>
                    </div>

                    {/* Team B */}
                    <div className={`flex items-center justify-between gap-2 p-1 rounded-lg transition-colors ${
                      isTeamBWinner ? "bg-amber-100/70 border border-amber-300/60" : ""
                    }`}>
                      <div className="flex items-center gap-1.5 min-w-0">
                        {isTeamBWinner && (
                          <Trophy className="w-3.5 h-3.5 text-amber-500 fill-amber-400 shrink-0" />
                        )}
                        <span className={`text-xs truncate ${
                          isTeamBWinner ? "font-black text-slate-900" : "font-bold text-slate-900 group-hover:text-indigo-950"
                        }`}>
                          {m.teamBName}
                        </span>
                        {m.teamBFlat && (
                          <span className="text-[9px] font-semibold text-slate-500 bg-white border border-slate-200 px-1 py-0.2 rounded shrink-0">
                            {m.teamBFlat}
                          </span>
                        )}
                      </div>
                      <span className={`text-xs sm:text-sm font-mono tracking-tight shrink-0 transition-colors ${
                        isTeamBWinner
                          ? "text-emerald-700 font-black scale-105"
                          : flashType
                          ? "text-emerald-600 font-extrabold scale-105"
                          : (isUpcoming ? "text-slate-400 font-semibold" : "text-slate-900 font-black")
                      }`}>
                        {isUpcoming ? "—" : (isCricketMatch ? formatCricketScore(m.scoreTeamB) : (m.scoreTeamB || "0"))}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Cricbuzz-Style Contextual Dynamic Narrative & Action CTA */}
                <div className="border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-[10px] font-medium sm:text-[11px] ${
                      isUpcoming
                        ? "text-blue-700 font-semibold"
                        : isCompleted
                        ? "text-emerald-700 font-black"
                        : (narrative.highlight ? "text-indigo-600 font-bold" : "text-slate-500")
                    }`}>
                      {isUpcoming ? `🗓️ ${formatScheduledDateTime(m.scheduledAt)}` : (isCompleted ? `🏆 ${narrative.text}` : narrative.text)}
                      {m.venueName && <span className="font-normal text-slate-400">{narrative.text ? " · " : ""}📍 {m.venueName}</span>}
                    </p>
                  </div>

                  {canManageMatches && !isCompleted && m.matchId ? (
                    <div className="flex shrink-0 items-center gap-1.5">
                      {isUpcoming && (
                        <button
                          type="button"
                          disabled={startingMatchId === m.matchId}
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleStartMatch(m);
                          }}
                          className="inline-flex min-h-8 items-center justify-center gap-1 rounded-lg bg-rose-600 px-2 text-[10px] font-extrabold text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-wait disabled:opacity-60 sm:px-2.5 sm:text-[11px]"
                          title="Start this match and mark it live"
                        >
                          {startingMatchId === m.matchId ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3 fill-current" />}
                          <span className="sm:hidden">Start</span>
                          <span className="hidden sm:inline">Start Match</span>
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={startingMatchId === m.matchId}
                        onClick={(event) => {
                          event.stopPropagation();
                          void handleScoreMatch(m);
                        }}
                        className="inline-flex min-h-8 items-center justify-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2 text-[10px] font-extrabold text-indigo-700 transition hover:bg-indigo-100 disabled:cursor-wait disabled:opacity-60 sm:px-2.5 sm:text-[11px]"
                        title="Open the scorer for this match"
                      >
                        {startingMatchId === m.matchId ? <Loader2 className="h-3 w-3 animate-spin" /> : <Activity className="h-3 w-3" />}
                        Score
                      </button>
                    </div>
                  ) : (
                    <span className={`inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-lg transition-colors shrink-0 ${
                      isUpcoming
                        ? "text-blue-700 group-hover:text-blue-800 bg-blue-50 group-hover:bg-blue-100"
                        : "text-indigo-600 group-hover:text-indigo-700 bg-indigo-50/90 group-hover:bg-indigo-100"
                    }`}>
                      {isUpcoming ? (
                        <>
                          <Calendar className="w-2.5 h-2.5 text-blue-600" />
                          <span>Fixture</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-2.5 h-2.5 fill-indigo-600" />
                          <span>{live ? "Watch" : "Card"}</span>
                        </>
                      )}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live View Overlay / Modal */}
      {watching &&
        (isCricket(watching) ? (
          <LiveMatchView matchId={watching.matchId} onClose={() => setWatching(null)} />
        ) : (
          <GenericLiveMatchView matchId={watching.matchId} onClose={() => setWatching(null)} />
        ))}

      {scoreSetupMatch && (
        <MatchScoringSetupModal
          isOpen={Boolean(scoreSetupMatch)}
          onClose={() => {
            setScoreSetupMatch(null);
            setShowScoreRules(false);
          }}
          match={scoreSetupMatch}
          initialConfig={scoreSetupConfig}
          configSource={scoreSetupConfigSource}
          isStarting={startingMatchId === scoreSetupMatch.matchId}
          onConfirmStart={handleConfirmScoreSetup}
          onOpenRulesModal={() => setShowScoreRules(true)}
        />
      )}

      {scoreSetupMatch && (
        <MatchScoringRulesModal
          isOpen={showScoreRules}
          onClose={() => setShowScoreRules(false)}
          matchId={scoreSetupMatch.matchId}
          sportType={getSportType(scoreSetupMatch.sportName || scoreSetupMatch.eventName || "Sports") || "DEFAULT"}
          matchName={`${scoreSetupMatch.teamAName} vs ${scoreSetupMatch.teamBName}`}
          onSaved={(updatedConfig) => {
            setScoreSetupConfig(updatedConfig);
            setScoreSetupConfigSource("match");
          }}
        />
      )}

      {scoringMatch && (() => {
        const sportName = scoringMatch.sportName || scoringMatch.eventName || "Sports";
        const sportType = getSportType(sportName) || "DEFAULT";
        const playerA = scoringMatch.teamAName || (isIndividualSport(sportType) ? "Player 1" : "Team A");
        const playerB = scoringMatch.teamBName || (isIndividualSport(sportType) ? "Player 2" : "Team B");

        if (isCricketSport(sportName)) {
          return (
            <LiveScoringPanel
              matchId={scoringMatch.matchId}
              configId={scoringMatch.configId ?? undefined}
              teamAName={playerA}
              teamBName={playerB}
              onClose={() => setScoringMatch(null)}
            />
          );
        }
        if (isTimeSport(sportName)) {
          return <RaceScoringPanel matchId={scoringMatch.matchId} sportType={sportType} onClose={() => setScoringMatch(null)} />;
        }
        return (
          <GenericLiveScoringPanel
            matchId={scoringMatch.matchId}
            sportType={sportType}
            onClose={() => setScoringMatch(null)}
            teamA={{ id: scoringMatch.teamAId || 1, name: playerA, color: "#6366f1" }}
            teamB={{ id: scoringMatch.teamBId || 2, name: playerB, color: "#f97316" }}
          />
        );
      })()}

      {/* All Live Matches Modal Popup */}
      {allMatchesModalOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 flex items-center justify-center p-2 sm:p-4 animate-fade-in"
          onClick={() => setAllMatchesModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center">
                  <Radio className="w-4 h-4 text-red-600 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight m-0">
                      All Live Matches
                    </h3>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-700">
                      {matches.length} Total
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 m-0">
                    Real-time match scores and spectator broadcasts across all sports
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAllMatchesModalOpen(false);
                    navigate("/sports/schedule");
                  }}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 transition-all cursor-pointer"
                  title="Navigate to full sports schedule page"
                >
                  <span>Sports Schedule</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setAllMatchesModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Filter & Search Toolbar */}
            <div className="p-3 sm:px-5 border-b border-slate-100 bg-white space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={modalSearch}
                    onChange={(e) => setModalSearch(e.target.value)}
                    placeholder="Search by team, sport, or tournament..."
                    className="w-full pl-8 pr-8 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                  {modalSearch && (
                    <button
                      type="button"
                      onClick={() => setModalSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Status Filter */}
                <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-[11px] font-bold shrink-0">
                  <button
                    type="button"
                    onClick={() => setModalStatusFilter("ALL")}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      modalStatusFilter === "ALL" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    All ({matches.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalStatusFilter("LIVE_ONLY")}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                      modalStatusFilter === "LIVE_ONLY" ? "bg-white text-red-600 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                    Live ({matches.filter((m) => isLiveStatus(m.status)).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalStatusFilter("UPCOMING_ONLY")}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                      modalStatusFilter === "UPCOMING_ONLY" ? "bg-white text-blue-700 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <Clock className="w-3 h-3 text-blue-600" />
                    Upcoming ({matches.filter((m) => isUpcomingStatus(m.status)).length})
                  </button>
                </div>
              </div>

              {/* Sport Category Pills */}
              {availableSports.length > 1 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 hide-scrollbar">
                  <button
                    type="button"
                    onClick={() => setModalSportFilter("ALL")}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer border ${
                      modalSportFilter === "ALL"
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    All Sports
                  </button>
                  {availableSports.map((sport) => {
                    const isSelected = modalSportFilter.toLowerCase() === sport.toLowerCase();
                    const count = matches.filter((m) => (m.sportName || "").toLowerCase() === sport.toLowerCase()).length;
                    return (
                      <button
                        key={sport}
                        type="button"
                        onClick={() => setModalSportFilter(sport)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer border ${
                          isSelected
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <span>{getSportEmoji(sport)}</span>
                        <span>{sport}</span>
                        <span className={`text-[10px] ml-0.5 ${isSelected ? "text-indigo-200" : "text-slate-400"}`}>
                          ({count})
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Matches List */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3">
              {filteredModalMatches.length === 0 ? (
                <div className="text-center py-12 px-4 space-y-2">
                  <Trophy className="w-10 h-10 text-slate-300 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-700 m-0">No matches found</h4>
                  <p className="text-xs text-slate-400 m-0">
                    {modalSearch || modalSportFilter !== "ALL" || modalStatusFilter !== "ALL"
                      ? "Try adjusting your search query or sport filter."
                      : "There are currently no active live or scheduled matches in your community."}
                  </p>
                  {(modalSearch || modalSportFilter !== "ALL" || modalStatusFilter !== "ALL") && (
                    <button
                      type="button"
                      onClick={() => {
                        setModalSearch("");
                        setModalSportFilter("ALL");
                        setModalStatusFilter("ALL");
                      }}
                      className="mt-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                    >
                      Reset Filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredModalMatches.map((m) => {
                    const live = isLiveStatus(m.status);
                    const isCompleted = m.status === "COMPLETED";
                    const isUpcoming = !live && !isCompleted;
                    const isModalTeamAWinner = Boolean(
                      isCompleted &&
                      m.winnerName &&
                      (m.winnerName.toLowerCase() === m.teamAName.toLowerCase() ||
                       m.winnerName.toLowerCase().includes(m.teamAName.toLowerCase()))
                    );
                    const isModalTeamBWinner = Boolean(
                      isCompleted &&
                      m.winnerName &&
                      (m.winnerName.toLowerCase() === m.teamBName.toLowerCase() ||
                       m.winnerName.toLowerCase().includes(m.teamBName.toLowerCase()))
                    );

                    return (
                      <div
                        key={m.matchId}
                        className={`rounded-xl border p-3.5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between ${
                          isCompleted
                            ? "border-amber-300/80 bg-gradient-to-br from-amber-50/40 via-white to-emerald-50/30"
                            : "border-slate-200/90 bg-white"
                        }`}
                      >
                        <div>
                          {/* Card Header: Sport, Status */}
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50/90 px-2 py-0.5 rounded-md truncate max-w-[150px]">
                              <span>{getSportEmoji(m.sportName ?? undefined)}</span>
                              <span className="truncate">{m.sportName || "Sports"}</span>
                            </span>

                            {live ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-white bg-red-600 px-2 py-0.5 rounded-full shadow-2xs animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-white" /> LIVE
                              </span>
                            ) : isCompleted ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-amber-900 bg-gradient-to-r from-amber-100 to-yellow-100 border border-amber-300/80 px-2 py-0.5 rounded-full shadow-2xs">
                                <Trophy className="w-2.5 h-2.5 text-amber-600 fill-amber-500" /> FINAL
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded-full">
                                <Clock className="w-2.5 h-2.5 text-blue-600" /> UPCOMING
                              </span>
                            )}
                          </div>

                          {/* Tournament / Event subtitle */}
                          <p className="text-[11px] font-medium text-slate-400 truncate mb-2">
                            {[m.tournamentName, m.eventName, m.roundName].filter(Boolean).join(" · ")}
                          </p>

                          {/* Teams & Scores */}
                          <div className="space-y-1.5 bg-slate-50/80 rounded-xl p-2.5 border border-slate-100">
                            <div className={`flex items-center justify-between gap-2 p-1 rounded-lg transition-colors ${
                              isModalTeamAWinner ? "bg-amber-100/70 border border-amber-300/60" : ""
                            }`}>
                              <div className="flex items-center gap-1.5 min-w-0">
                                {isModalTeamAWinner && (
                                  <Trophy className="w-3.5 h-3.5 text-amber-500 fill-amber-400 shrink-0" />
                                )}
                                <span className={`text-xs truncate ${
                                  isModalTeamAWinner ? "font-black text-slate-900" : "font-bold text-slate-900"
                                }`}>
                                  {m.teamAName}
                                </span>
                                {m.teamAFlat && (
                                  <span className="text-[10px] font-semibold text-slate-500 bg-white border border-slate-200 px-1 py-0.2 rounded shrink-0">
                                    {m.teamAFlat}
                                  </span>
                                )}
                              </div>
                              <span className={`text-xs sm:text-sm font-mono tracking-tight shrink-0 ${
                                isModalTeamAWinner ? "text-emerald-700 font-black scale-105" : "text-slate-900 font-bold"
                              }`}>
                                {isUpcoming ? "—" : (m.scoreTeamA || "0")}
                              </span>
                            </div>

                            <div className={`flex items-center justify-between gap-2 p-1 rounded-lg transition-colors ${
                              isModalTeamBWinner ? "bg-amber-100/70 border border-amber-300/60" : ""
                            }`}>
                              <div className="flex items-center gap-1.5 min-w-0">
                                {isModalTeamBWinner && (
                                  <Trophy className="w-3.5 h-3.5 text-amber-500 fill-amber-400 shrink-0" />
                                )}
                                <span className={`text-xs truncate ${
                                  isModalTeamBWinner ? "font-black text-slate-900" : "font-bold text-slate-900"
                                }`}>
                                  {m.teamBName}
                                </span>
                                {m.teamBFlat && (
                                  <span className="text-[10px] font-semibold text-slate-500 bg-white border border-slate-200 px-1 py-0.2 rounded shrink-0">
                                    {m.teamBFlat}
                                  </span>
                                )}
                              </div>
                              <span className={`text-xs sm:text-sm font-mono tracking-tight shrink-0 ${
                                isModalTeamBWinner ? "text-emerald-700 font-black scale-105" : "text-slate-900 font-bold"
                              }`}>
                                {isUpcoming ? "—" : (m.scoreTeamB || "0")}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Bottom line: Watch Button */}
                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                          {!live && m.winnerName ? (
                            <span className="text-[11px] font-black text-emerald-700 flex items-center gap-1 truncate max-w-[150px]">
                              <Trophy className="w-3.5 h-3.5 text-amber-500 fill-amber-400 shrink-0" />
                              <span className="truncate">{m.winnerName}</span>
                            </span>
                          ) : isUpcoming ? (
                            <span className="text-[11px] font-semibold text-blue-700 truncate max-w-[170px]">
                              🗓️ {formatScheduledDateTime(m.scheduledAt)}
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-slate-400 truncate max-w-[150px]">
                              {m.roundName || m.venueName || "Live Action"}
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              if (isUpcoming) {
                                setAllMatchesModalOpen(false);
                                if (m.configId) {
                                  navigate(`/sports/schedule?configId=${m.configId}`);
                                } else {
                                  navigate("/sports/schedule");
                                }
                              } else {
                                setWatching(m);
                              }
                            }}
                            className="inline-flex items-center gap-1 text-xs font-extrabold text-indigo-600 hover:text-indigo-800 bg-indigo-50/90 hover:bg-indigo-100 active:scale-95 px-2.5 py-1 rounded-lg transition-all cursor-pointer shrink-0"
                          >
                            {isUpcoming ? (
                              <>
                                <Calendar className="w-3 h-3 text-indigo-600" />
                                <span>Fixture →</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-3 h-3 fill-indigo-600" />
                                <span>{live ? "Watch Live →" : "Scorecard →"}</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 sm:px-5 border-t border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
              <span>
                Showing {filteredModalMatches.length} of {matches.length} matches
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAllMatchesModalOpen(false);
                    navigate("/sports/schedule");
                  }}
                  className="px-3 py-1.5 rounded-xl font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>Go to Sports Schedule</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setAllMatchesModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recently Completed Matches Modal Popup */}
      {recentResultsModalOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 flex items-center justify-center p-2 sm:p-4 animate-fade-in"
          onClick={() => setRecentResultsModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-amber-50/40">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-100/80 border border-amber-200/80 flex items-center justify-center">
                  <Trophy className="w-4 h-4 text-amber-700" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight m-0">
                      Recent Match Results
                    </h3>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                      {recentMatches.length} Completed
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 m-0">
                    Final scores, winning margins, and scorecards for finished matches
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={loadRecentMatches}
                  disabled={loadingRecent}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer disabled:opacity-50"
                  title="Refresh results"
                >
                  <RotateCw className={`w-4 h-4 ${loadingRecent ? "animate-spin text-amber-600" : ""}`} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRecentResultsModalOpen(false);
                    navigate("/sports/schedule");
                  }}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-800 bg-amber-100/70 hover:bg-amber-100 border border-amber-200 transition-all cursor-pointer"
                  title="Navigate to sports schedule"
                >
                  <span>Sports Schedule</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setRecentResultsModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Filter & Search Toolbar */}
            <div className="p-3 sm:px-5 border-b border-slate-100 bg-white space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={recentSearch}
                    onChange={(e) => setRecentSearch(e.target.value)}
                    placeholder="Search by team, player, winner, sport, or tournament..."
                    className="w-full pl-8 pr-8 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                  />
                  {recentSearch && (
                    <button
                      type="button"
                      onClick={() => setRecentSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Sport Category Pills */}
              {recentAvailableSports.length > 1 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 hide-scrollbar">
                  <button
                    type="button"
                    onClick={() => setRecentSportFilter("ALL")}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer border ${
                      recentSportFilter === "ALL"
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    All Sports
                  </button>
                  {recentAvailableSports.map((sport) => {
                    const isSelected = recentSportFilter.toLowerCase() === sport.toLowerCase();
                    const count = recentMatches.filter((m) => (m.sportName || "").toLowerCase() === sport.toLowerCase()).length;
                    return (
                      <button
                        key={sport}
                        type="button"
                        onClick={() => setRecentSportFilter(sport)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer border ${
                          isSelected
                            ? "bg-amber-600 text-white border-amber-600 shadow-2xs"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <span>{getSportEmoji(sport)}</span>
                        <span>{sport}</span>
                        <span className={`text-[10px] ml-0.5 ${isSelected ? "text-amber-200" : "text-slate-400"}`}>
                          ({count})
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Matches List */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3">
              {loadingRecent && recentMatches.length === 0 ? (
                <div className="text-center py-12 px-4 space-y-2">
                  <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
                  <p className="text-xs text-slate-500">Loading recently completed matches...</p>
                </div>
              ) : filteredRecentMatches.length === 0 ? (
                <div className="text-center py-12 px-4 space-y-2">
                  <Trophy className="w-10 h-10 text-slate-300 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-700 m-0">No completed matches found</h4>
                  <p className="text-xs text-slate-400 m-0">
                    {recentSearch || recentSportFilter !== "ALL"
                      ? "Try adjusting your search query or sport filter."
                      : "No recently completed match results are available yet."}
                  </p>
                  {(recentSearch || recentSportFilter !== "ALL") && (
                    <button
                      type="button"
                      onClick={() => {
                        setRecentSearch("");
                        setRecentSportFilter("ALL");
                      }}
                      className="mt-2 text-xs font-bold text-amber-600 hover:text-amber-800 underline cursor-pointer"
                    >
                      Reset Filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredRecentMatches.map((m) => {
                    const isCricketMatch = isCricket(m);
                    const roundStageLabel = getRoundStageLabel(m.roundName);
                    const isChampionshipFinal = ["FINAL", "GRAND FINAL", "SUPER FINAL"].includes(roundStageLabel || "");
                    const isTeamAWinner = Boolean(
                      m.winnerName &&
                      (m.winnerName.toLowerCase() === m.teamAName.toLowerCase() ||
                        m.winnerName.toLowerCase().includes(m.teamAName.toLowerCase()))
                    );
                    const isTeamBWinner = Boolean(
                      m.winnerName &&
                      (m.winnerName.toLowerCase() === m.teamBName.toLowerCase() ||
                        m.winnerName.toLowerCase().includes(m.teamBName.toLowerCase()))
                    );

                    return (
                      <div
                        key={m.matchId}
                        className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
                      >
                        <div>
                          {/* Card Header: Sport, Completed Status, Time */}
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50/90 px-2 py-0.5 rounded-md truncate max-w-[150px]">
                              <span>{getSportEmoji(m.sportName ?? undefined)}</span>
                              <span className="truncate">{m.sportName || "Sports"}</span>
                            </span>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[10px] font-medium text-slate-400">
                                {formatCompletedTime(m.completedAt || m.scheduledAt)}
                              </span>
                              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full">
                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> FINAL
                              </span>
                            </div>
                          </div>

                          {/* Tournament / Event subtitle */}
                          <div className="mb-2 flex min-w-0 items-center gap-1.5">
                            <p className="m-0 min-w-0 flex-1 truncate text-[11px] font-medium text-slate-400">
                              {[m.tournamentName, m.eventName, isChampionshipFinal ? null : m.roundName].filter(Boolean).join(" · ")}
                            </p>
                            {isChampionshipFinal && (
                              <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-100 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-amber-800">
                                <Sparkles className="h-3 w-3 animate-pulse motion-reduce:animate-none" /> Championship Final
                              </span>
                            )}
                          </div>

                          {/* Teams & Scores */}
                          <div className="space-y-1.5 bg-slate-50/80 rounded-xl p-2.5 border border-slate-100">
                            {/* Team A */}
                            <div className={`flex items-center justify-between gap-2 p-1 rounded-lg transition-colors ${
                              isTeamAWinner ? "bg-emerald-50/80" : ""
                            }`}>
                              <div className="flex items-center gap-1.5 min-w-0">
                                {isTeamAWinner && (isChampionshipFinal ? (
                                  <span className="relative inline-flex h-5 w-5 shrink-0 items-center justify-center" aria-label="Final winner">
                                    <Trophy className="h-4 w-4 animate-[bounce_2.4s_ease-in-out_infinite] text-amber-500 motion-reduce:animate-none" />
                                    <Sparkles className="absolute -right-1 -top-1 h-2.5 w-2.5 animate-pulse text-yellow-400 motion-reduce:animate-none" />
                                  </span>
                                ) : (
                                  <Trophy className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                ))}
                                <span className={`text-xs truncate ${
                                  isTeamAWinner ? "font-black text-slate-900" : "font-medium text-slate-600"
                                }`}>
                                  {m.teamAName}
                                </span>
                                {m.teamAFlat && (
                                  <span className="text-[10px] font-semibold text-slate-500 bg-white border border-slate-200 px-1 py-0.2 rounded shrink-0">
                                    {m.teamAFlat}
                                  </span>
                                )}
                              </div>
                              <span className={`text-xs sm:text-sm font-mono font-black tracking-tight shrink-0 ${
                                isTeamAWinner ? "text-emerald-700 font-extrabold" : "text-slate-700"
                              }`}>
                                {isCricketMatch ? formatCricketScore(m.scoreTeamA) : (m.scoreTeamA || "—")}
                              </span>
                            </div>

                            {/* Team B */}
                            <div className={`flex items-center justify-between gap-2 p-1 rounded-lg transition-colors ${
                              isTeamBWinner ? "bg-emerald-50/80" : ""
                            }`}>
                              <div className="flex items-center gap-1.5 min-w-0">
                                {isTeamBWinner && (isChampionshipFinal ? (
                                  <span className="relative inline-flex h-5 w-5 shrink-0 items-center justify-center" aria-label="Final winner">
                                    <Trophy className="h-4 w-4 animate-[bounce_2.4s_ease-in-out_infinite] text-amber-500 motion-reduce:animate-none" />
                                    <Sparkles className="absolute -right-1 -top-1 h-2.5 w-2.5 animate-pulse text-yellow-400 motion-reduce:animate-none" />
                                  </span>
                                ) : (
                                  <Trophy className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                ))}
                                <span className={`text-xs truncate ${
                                  isTeamBWinner ? "font-black text-slate-900" : "font-medium text-slate-600"
                                }`}>
                                  {m.teamBName}
                                </span>
                                {m.teamBFlat && (
                                  <span className="text-[10px] font-semibold text-slate-500 bg-white border border-slate-200 px-1 py-0.2 rounded shrink-0">
                                    {m.teamBFlat}
                                  </span>
                                )}
                              </div>
                              <span className={`text-xs sm:text-sm font-mono font-black tracking-tight shrink-0 ${
                                isTeamBWinner ? "text-emerald-700 font-extrabold" : "text-slate-700"
                              }`}>
                                {isCricketMatch ? formatCricketScore(m.scoreTeamB) : (m.scoreTeamB || "—")}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Bottom line: Winner Badge & Scorecard CTA */}
                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                          {m.winnerName ? (
                            <span
                              className={`flex max-w-[170px] items-center gap-1 truncate text-[11px] font-extrabold ${isChampionshipFinal ? "text-amber-800" : "text-emerald-700"}`}
                              title={`Winner: ${m.winnerName}`}
                            >
                              <span className={`rounded px-1.5 py-0.5 text-[10px] font-black uppercase ${isChampionshipFinal ? "bg-amber-100 text-amber-900" : "bg-emerald-100/70 text-emerald-800"}`}>
                                {isChampionshipFinal ? "CHAMPION" : "WON"}
                              </span>
                              <span className="truncate">{m.winnerName}</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-slate-400 truncate max-w-[150px]">
                              {m.venueName || "Match Concluded"}
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => setWatching(m)}
                            className="inline-flex items-center gap-1 text-xs font-extrabold text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 active:scale-95 px-2.5 py-1 rounded-lg border border-amber-200/60 transition-all cursor-pointer shrink-0"
                          >
                            <Play className="w-3 h-3 fill-amber-700" />
                            <span>Scorecard →</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 sm:px-5 border-t border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
              <span>
                Showing {filteredRecentMatches.length} of {recentMatches.length} completed matches
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setRecentResultsModalOpen(false);
                    navigate("/sports/schedule");
                  }}
                  className="px-3 py-1.5 rounded-xl font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>Go to Sports Schedule</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setRecentResultsModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default LiveMatchesStrip;
