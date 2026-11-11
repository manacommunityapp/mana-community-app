import { useCallback, useEffect, useRef, useState } from "react";
import { Radio, X, Trophy, Play } from "lucide-react";
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

/**
 * "Live Now" strip for the community feed.
 * Placed at the top of FeedPage (above posts) as a live widget.
 * Shows matches flagged for the feed while LIVE (and during the post-match grace window).
 * Subscribes to /topic/match/{id}/state and /topic/sports/live for real-time score updates,
 * and re-fetches every 30s so cards are added and removed dynamically without stale feed posts.
 */
export function LiveMatchesStrip() {
  const [matches, setMatches] = useState<FeedLiveMatch[]>([]);
  const [dismissed, setDismissed] = useState<number[]>(loadDismissed);
  const [showAll, setShowAll] = useState(false);
  const [watching, setWatching] = useState<FeedLiveMatch | null>(null);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    try {
      const user = getStoredUser();
      const communityId = user?.communityId != null ? Number(user.communityId) : undefined;
      setMatches(await tournamentService.getLiveFeedMatches(communityId));
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
  const liveIdsKey = matches.filter((m) => m.status === "LIVE").map((m) => m.matchId).join(",");
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
    .sort((a, b) => Number(b.status === "LIVE") - Number(a.status === "LIVE"));

  if (visible.length === 0) return null;

  const shown = showAll ? visible : visible.slice(0, MAX_CARDS);
  const liveCount = visible.filter((m) => m.status === "LIVE").length;
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

        {visible.length > MAX_CARDS && (
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
          >
            {showAll ? "Show less" : `See all (${visible.length})`}
          </button>
        )}
      </div>

      {/* Cards Horizontal Carousel */}
      <div className="flex gap-3 overflow-x-auto pb-1.5 pt-0.5 snap-x scrollbar-thin">
        {shown.map((m) => {
          const live = m.status === "LIVE";
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
    </section>
  );
}

export default LiveMatchesStrip;
