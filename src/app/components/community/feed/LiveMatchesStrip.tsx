import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Radio, X, Trophy, Play, ExternalLink, Search, ChevronRight } from "lucide-react";
import { tournamentService, type FeedLiveMatch } from "../../../../services/sports/tournamentService";
import { stompClient } from "../../../../services/chat/stompClient";
import { getStoredUser } from "../../../../services/common/apiClient";
import { LiveMatchView } from "../../sports/LiveMatchView";
import { GenericLiveMatchView } from "../../sports/GenericLiveMatchView";

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

/**
 * "Live Now" strip for the community feed.
 * Placed at the top of FeedPage (above posts) as a live widget.
 * Shows matches flagged for the feed while LIVE (and during the post-match grace window).
 * Subscribes to /topic/match/{id}/state and /topic/sports/live for real-time score updates,
 * and re-fetches every 30s so cards are added and removed dynamically without stale feed posts.
 */
export function LiveMatchesStrip() {
  const navigate = useNavigate();
  const [matches, setMatches] = useState<FeedLiveMatch[]>([]);
  const [dismissed, setDismissed] = useState<number[]>(loadDismissed);
  const [showAll, setShowAll] = useState(false);
  const [watching, setWatching] = useState<FeedLiveMatch | null>(null);
  const [allMatchesModalOpen, setAllMatchesModalOpen] = useState(false);
  const [modalSearch, setModalSearch] = useState("");
  const [modalSportFilter, setModalSportFilter] = useState("ALL");
  const [modalStatusFilter, setModalStatusFilter] = useState<"ALL" | "LIVE_ONLY">("ALL");
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    try {
      const user = getStoredUser();
      const communityId = user?.communityId != null ? Number(user.communityId) : undefined;
      const combinedMap = new Map<number, FeedLiveMatch>();

      // 1. Fetch from /sports/live-feed
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
        // Backend live-feed endpoint may be unavailable or unconfigured; will continue to configs below
      }

      // 2. ALWAYS query tournament schedule configs to discover any active live matches in tournaments
      try {
        const configs = await tournamentService.getConfigs().catch(() => []);
        if (Array.isArray(configs) && configs.length > 0) {
          const matchPromises = configs.map(async (cfg) => {
            try {
              const cfgMatches = await tournamentService.getMatchesByConfigId(cfg.id);
              if (!Array.isArray(cfgMatches)) return [];
              return cfgMatches
                .filter((m: any) => {
                  if (!m || m.status === "BYE" || m.status === "AUTO_ADVANCED") return false;
                  if (m.showInFeed === false) return false;
                  const hasScores = Boolean(
                    (m.scoreTeamA && m.scoreTeamA !== "0" && m.scoreTeamA !== "—") ||
                    (m.scoreTeamB && m.scoreTeamB !== "0" && m.scoreTeamB !== "—") ||
                    (m.score1 && m.score1 !== "0") ||
                    (m.score2 && m.score2 !== "0")
                  );
                  return isLiveStatus(m.status, hasScores);
                })
                .map((m: any): FeedLiveMatch => {
                  const hasScores = Boolean(
                    (m.scoreTeamA && m.scoreTeamA !== "0" && m.scoreTeamA !== "—") ||
                    (m.scoreTeamB && m.scoreTeamB !== "0" && m.scoreTeamB !== "—") ||
                    (m.score1 && m.score1 !== "0") ||
                    (m.score2 && m.score2 !== "0")
                  );
                  const isLive = isLiveStatus(m.status) || hasScores;
                  return {
                    matchId: m.id || m.matchId,
                    configId: cfg.id,
                    sportName: cfg.sportName || cfg.eventName || "Sports",
                    tournamentName: cfg.tournamentName || "Tournament",
                    eventName: cfg.eventName,
                    roundName: m.roundName || m.round,
                    teamAName: m.teamAName || m.homeName || (/badminton|tennis|table|squash|chess|carrom/i.test(cfg.sportName || cfg.eventName || "") ? "Player 1" : "Team A"),
                    teamBName: m.teamBName || m.awayName || (/badminton|tennis|table|squash|chess|carrom/i.test(cfg.sportName || cfg.eventName || "") ? "Player 2" : "Team B"),
                    teamAFlat: m.teamAFlat || m.homeFlat,
                    teamBFlat: m.teamBFlat || m.awayFlat,
                    scoreTeamA: m.scoreTeamA ?? m.score1 ?? "",
                    scoreTeamB: m.scoreTeamB ?? m.score2 ?? "",
                    status: isLive ? (m.status === "COMPLETED" ? "COMPLETED" : "LIVE") : (m.status || "SCHEDULED"),
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
    }
  }, []);

  // 1. Initial load + periodic refresh (every 30s) to add new matches / drop finished ones
  useEffect(() => {
    load();
    const id = window.setInterval(load, POLL_MS);
    return () => window.clearInterval(id);
  }, [load]);

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
      // Cricket state updates
      unsubs.push(
        stompClient.subscribe(`/topic/match/${id}/state`, () => {
          if (refreshTimer.current) clearTimeout(refreshTimer.current);
          refreshTimer.current = setTimeout(load, 500);
        })
      );
      // Generic sports state updates (badminton, football, tennis, etc.)
      unsubs.push(
        stompClient.subscribe(`/topic/match/${id}/generic-state`, () => {
          if (refreshTimer.current) clearTimeout(refreshTimer.current);
          refreshTimer.current = setTimeout(load, 500);
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

  const visible = matches
    .filter((m) => !dismissed.includes(m.matchId))
    // LIVE matches first, then recently finished
    .sort((a, b) => Number(isLiveStatus(b.status)) - Number(isLiveStatus(a.status)));

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
    }).sort((a, b) => Number(isLiveStatus(b.status)) - Number(isLiveStatus(a.status)));
  }, [matches, modalStatusFilter, modalSportFilter, modalSearch]);

  if (visible.length === 0) {
    if (matches.length > 0) {
      return (
        <div className="flex items-center justify-between px-3.5 py-2.5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs text-xs animate-fade-in">
          <span className="text-slate-500 font-medium flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-indigo-500" />
            {matches.length} live match{matches.length > 1 ? "es" : ""} currently hidden.
          </span>
          <button
            type="button"
            onClick={() => {
              setDismissed([]);
              try { window.localStorage.removeItem(DISMISS_KEY); } catch {}
            }}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
          >
            Show Live Matches
          </button>
        </div>
      );
    }
    return null;
  }

  const shown = showAll ? visible : visible.slice(0, MAX_CARDS);
  const liveCount = visible.filter((m) => isLiveStatus(m.status)).length;
  const isCricket = (m: FeedLiveMatch) => /cricket/i.test(m.sportName || "");

  return (
    <section aria-label="Live sports matches" className="space-y-2.5">
      {/* Strip Header */}
      <div className="flex items-center justify-between px-0.5">
        <div className="flex items-center gap-2">
          <h5 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5 m-0">
            <Radio className="w-3.5 h-3.5 text-red-600 animate-pulse" />
            Live Now
          </h5>
          {liveCount > 0 && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
              {liveCount} {liveCount === 1 ? "match" : "matches"}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {visible.length > MAX_CARDS && (
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className="text-[11px] font-bold text-slate-500 hover:text-slate-800 hover:underline cursor-pointer"
            >
              {showAll ? "Show less" : `Carousel (${visible.length})`}
            </button>
          )}

          <button
            type="button"
            onClick={() => setAllMatchesModalOpen(true)}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer group"
            title="View all live matches in modal popup"
          >
            <span>All Live Matches</span>
            <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* Cards Horizontal Carousel */}
      <div className="flex gap-3 overflow-x-auto pb-1.5 pt-0.5 snap-x scrollbar-thin">
        {shown.map((m) => {
          const live = isLiveStatus(m.status);
          return (
            <div
              key={m.matchId}
              className="snap-start shrink-0 w-[270px] sm:w-[290px] rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Top Line: Sport, Status Badge, Dismiss */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50/90 px-2 py-0.5 rounded-md truncate max-w-[130px]">
                    <span>{getSportEmoji(m.sportName ?? undefined)}</span>
                    <span className="truncate">{m.sportName || "Sports"}</span>
                  </span>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {live ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-white bg-red-600 px-2 py-0.5 rounded-full shadow-2xs animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-white" /> LIVE
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full">
                        FINAL
                      </span>
                    )}

                    <button
                      type="button"
                      aria-label="Dismiss card"
                      title="Dismiss card"
                      onClick={() => dismiss(m.matchId)}
                      className="text-slate-300 hover:text-slate-500 hover:bg-slate-100 p-0.5 rounded transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Tournament / Event subtitle */}
                <p className="text-[11px] font-medium text-slate-400 truncate mb-2">
                  {[m.tournamentName, m.eventName].filter(Boolean).join(" · ")}
                </p>

                {/* Teams & Scores */}
                <div className="space-y-1.5 bg-slate-50/80 rounded-xl p-2.5 border border-slate-100">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-xs font-bold text-slate-900 truncate">{m.teamAName}</span>
                      {m.teamAFlat && (
                        <span className="text-[10px] font-semibold text-slate-500 bg-white border border-slate-200 px-1 py-0.2 rounded shrink-0">
                          {m.teamAFlat}
                        </span>
                      )}
                    </div>
                    <span className="text-xs sm:text-sm font-mono font-black text-slate-900 tracking-tight shrink-0">
                      {m.scoreTeamA || "0"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-xs font-bold text-slate-900 truncate">{m.teamBName}</span>
                      {m.teamBFlat && (
                        <span className="text-[10px] font-semibold text-slate-500 bg-white border border-slate-200 px-1 py-0.2 rounded shrink-0">
                          {m.teamBFlat}
                        </span>
                      )}
                    </div>
                    <span className="text-xs sm:text-sm font-mono font-black text-slate-900 tracking-tight shrink-0">
                      {m.scoreTeamB || "0"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Line: Details + "Watch" Link to Live View */}
              <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                {!live && m.winnerName ? (
                  <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1 truncate max-w-[150px]">
                    <Trophy className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{m.winnerName}</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-slate-400 truncate max-w-[150px]">
                    {m.roundName || m.venueName || "Live Action"}
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => setWatching(m)}
                  className="inline-flex items-center gap-1 text-xs font-extrabold text-indigo-600 hover:text-indigo-800 bg-indigo-50/90 hover:bg-indigo-100 active:scale-95 px-2.5 py-1 rounded-lg transition-all cursor-pointer shrink-0"
                >
                  <Play className="w-3 h-3 fill-indigo-600" />
                  <span>{live ? "Watch →" : "Scorecard →"}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live View Overlay / Modal */}
      {watching &&
        (isCricket(watching) ? (
          <LiveMatchView matchId={watching.matchId} onClose={() => setWatching(null)} />
        ) : (
          <GenericLiveMatchView matchId={watching.matchId} onClose={() => setWatching(null)} />
        ))}

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
                      : "There are currently no active live matches in your community."}
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
                    return (
                      <div
                        key={m.matchId}
                        className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
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
                            ) : (
                              <span className="inline-flex items-center text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full">
                                FINAL
                              </span>
                            )}
                          </div>

                          {/* Tournament / Event subtitle */}
                          <p className="text-[11px] font-medium text-slate-400 truncate mb-2">
                            {[m.tournamentName, m.eventName].filter(Boolean).join(" · ")}
                          </p>

                          {/* Teams & Scores */}
                          <div className="space-y-1.5 bg-slate-50/80 rounded-xl p-2.5 border border-slate-100">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="text-xs font-bold text-slate-900 truncate">{m.teamAName}</span>
                                {m.teamAFlat && (
                                  <span className="text-[10px] font-semibold text-slate-500 bg-white border border-slate-200 px-1 py-0.2 rounded shrink-0">
                                    {m.teamAFlat}
                                  </span>
                                )}
                              </div>
                              <span className="text-xs sm:text-sm font-mono font-black text-slate-900 tracking-tight shrink-0">
                                {m.scoreTeamA || "0"}
                              </span>
                            </div>

                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="text-xs font-bold text-slate-900 truncate">{m.teamBName}</span>
                                {m.teamBFlat && (
                                  <span className="text-[10px] font-semibold text-slate-500 bg-white border border-slate-200 px-1 py-0.2 rounded shrink-0">
                                    {m.teamBFlat}
                                  </span>
                                )}
                              </div>
                              <span className="text-xs sm:text-sm font-mono font-black text-slate-900 tracking-tight shrink-0">
                                {m.scoreTeamB || "0"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Bottom line: Watch Button */}
                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                          {!live && m.winnerName ? (
                            <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1 truncate max-w-[150px]">
                              <Trophy className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{m.winnerName}</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-slate-400 truncate max-w-[150px]">
                              {m.roundName || m.venueName || "Live Action"}
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setWatching(m);
                            }}
                            className="inline-flex items-center gap-1 text-xs font-extrabold text-indigo-600 hover:text-indigo-800 bg-indigo-50/90 hover:bg-indigo-100 active:scale-95 px-2.5 py-1 rounded-lg transition-all cursor-pointer shrink-0"
                          >
                            <Play className="w-3 h-3 fill-indigo-600" />
                            <span>{live ? "Watch Live →" : "Scorecard →"}</span>
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
    </section>
  );
}

export default LiveMatchesStrip;
