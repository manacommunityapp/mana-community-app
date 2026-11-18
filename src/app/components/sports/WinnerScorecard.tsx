import React, { useState } from "react";
import {
  Trophy,
  Crown,
  Sparkles,
  Star,
  MapPin,
  Calendar,
  Share2,
  PartyPopper,
  Flame,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import type { FeedScorecard } from "../../../types/sportsSocial";

interface WinnerScorecardProps {
  scorecard: FeedScorecard;
  sport?: string;
  onCheer?: (winningTeam: string) => void;
  onShare?: () => void;
}

function getSportEmoji(sport?: string): string {
  if (!sport) return "🏆";
  const s = sport.toLowerCase();
  if (s.includes("cricket")) return "🏏";
  if (s.includes("badminton")) return "🏸";
  if (s.includes("football") || s.includes("soccer")) return "⚽";
  if (s.includes("tennis")) return "🎾";
  if (s.includes("table tennis") || s.includes("tt") || s.includes("ping pong")) return "🏓";
  if (s.includes("volleyball")) return "🏐";
  if (s.includes("basketball")) return "🏀";
  return "🏆";
}

/**
 * Robust winner detection: checks explicit winner field, winnerName,
 * result string keyword match, or numeric scores.
 */
function resolveWinner(sc: FeedScorecard): {
  winnerSide: "A" | "B" | "TIE" | "UNKNOWN";
  winningName: string;
  runnerUpName: string;
  winningScore: string;
  runnerUpScore: string;
  isTie: boolean;
} {
  const normWinner = sc.winner?.toUpperCase().trim();
  const teamA = sc.teamA || "Team A";
  const teamB = sc.teamB || "Team B";
  const res = (sc.result || "").toLowerCase();

  let side: "A" | "B" | "TIE" | "UNKNOWN" = "UNKNOWN";

  if (normWinner === "A") side = "A";
  else if (normWinner === "B") side = "B";
  else if (normWinner === "TIE" || res.includes("tied") || res.includes("draw")) side = "TIE";
  else if (sc.winnerName) {
    if (sc.winnerName.toLowerCase().includes(teamA.toLowerCase())) side = "A";
    else if (sc.winnerName.toLowerCase().includes(teamB.toLowerCase())) side = "B";
  } else if (res) {
    const aInResult = res.includes(teamA.toLowerCase());
    const bInResult = res.includes(teamB.toLowerCase());
    const hasWinWord = /won|defend|beat|victory|claim/.test(res);
    if (aInResult && hasWinWord && !bInResult) side = "A";
    else if (bInResult && hasWinWord && !aInResult) side = "B";
  }

  // Fallback: simple numeric scores (e.g. football "3" vs "1")
  if (side === "UNKNOWN") {
    const numA = parseInt(sc.scoreA, 10);
    const numB = parseInt(sc.scoreB, 10);
    if (!isNaN(numA) && !isNaN(numB) && !sc.scoreA.includes("/") && !sc.scoreB.includes("/")) {
      if (numA > numB) side = "A";
      else if (numB > numA) side = "B";
      else if (numA === numB) side = "TIE";
    }
  }

  if (side === "B") {
    return {
      winnerSide: "B",
      winningName: teamB,
      runnerUpName: teamA,
      winningScore: sc.scoreB,
      runnerUpScore: sc.scoreA,
      isTie: false,
    };
  }

  if (side === "TIE") {
    return {
      winnerSide: "TIE",
      winningName: teamA,
      runnerUpName: teamB,
      winningScore: sc.scoreA,
      runnerUpScore: sc.scoreB,
      isTie: true,
    };
  }

  // Default to A as winner or fallback
  return {
    winnerSide: side === "A" ? "A" : "UNKNOWN",
    winningName: teamA,
    runnerUpName: teamB,
    winningScore: sc.scoreA,
    runnerUpScore: sc.scoreB,
    isTie: false,
  };
}

export function WinnerScorecard({ scorecard, sport, onCheer, onShare }: WinnerScorecardProps) {
  const [cheersCount, setCheersCount] = useState<number>(0);
  const [hasCheered, setHasCheered] = useState<boolean>(false);

  const { winnerSide, isTie } = resolveWinner(scorecard);
  const isWinnerA = winnerSide === "A";
  const isWinnerB = winnerSide === "B";

  const winnerName = isWinnerA ? scorecard.teamA : isWinnerB ? scorecard.teamB : null;

  const handleCheerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCheersCount((prev) => prev + 1);
    setHasCheered(true);
    const celebrationTarget = winnerName || "the players";
    toast.success(`🎉 Cheered for ${celebrationTarget}!`, {
      description: "Celebration reaction sent to community feed.",
    });
    if (onCheer && winnerName) {
      onCheer(winnerName);
    }
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onShare) {
      onShare();
      return;
    }
    const text = `🏆 Match Result: ${scorecard.teamA} (${scorecard.scoreA}) vs ${scorecard.teamB} (${scorecard.scoreB}) • ${scorecard.result}`;
    if (navigator.clipboard) {
      void navigator.clipboard.writeText(text);
      toast.success("Match summary copied to clipboard!");
    } else {
      toast.info(text);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-300/80 dark:border-amber-500/30 bg-gradient-to-br from-amber-50/70 via-white to-emerald-50/50 dark:from-slate-900 dark:via-slate-900/95 dark:to-emerald-950/25 p-3.5 sm:p-4 shadow-sm hover:shadow-md transition-all">
      {/* Subtle Background Glow Accents */}
      <div className="pointer-events-none absolute -top-12 -right-12 w-32 h-32 rounded-full bg-amber-400/15 blur-2xl dark:bg-amber-500/10" />
      <div className="pointer-events-none absolute -bottom-12 -left-12 w-32 h-32 rounded-full bg-emerald-400/15 blur-2xl dark:bg-emerald-500/10" />

      {/* Top Banner: Sport & Stage, Venue & Date */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-amber-900 dark:text-amber-200 bg-amber-100/90 dark:bg-amber-950/70 border border-amber-300/60 dark:border-amber-700/60 px-2 py-0.5 rounded-full shrink-0">
            <span>{getSportEmoji(sport)}</span>
            <span className="tracking-wide uppercase text-[9px] font-black">
              {scorecard.stage || "MATCH COMPLETED"}
            </span>
          </span>
          {winnerName && !isTie && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/60 border border-emerald-300/60 dark:border-emerald-700/60 px-2 py-0.5 rounded-full truncate">
              <Crown className="w-3 h-3 text-amber-500 fill-amber-400 shrink-0" />
              <span>{winnerName} VICTORY</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-[10px] font-medium text-slate-500 dark:text-slate-400 shrink-0">
          {scorecard.date && (
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              <span>{scorecard.date}</span>
            </span>
          )}
          {scorecard.venue && (
            <span className="hidden xs:inline-flex items-center gap-0.5 truncate max-w-[130px]" title={scorecard.venue}>
              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate">{scorecard.venue}</span>
            </span>
          )}
        </div>
      </div>

      {/* Head-to-Head Winner vs Runner-up Podium Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5 mb-3">
        {/* Team A Card */}
        <div
          className={`relative rounded-xl p-3 border transition-all ${
            isWinnerA
              ? "bg-gradient-to-br from-amber-100/60 via-emerald-50/40 to-white dark:from-amber-950/40 dark:via-emerald-950/30 dark:to-slate-800/90 border-amber-300 dark:border-amber-500/50 shadow-xs ring-1 ring-amber-400/20"
              : isTie
              ? "bg-slate-50/90 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
              : "bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 opacity-90"
          }`}
        >
          <div className="flex items-center justify-between gap-1.5 mb-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              {isWinnerA ? (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 to-emerald-600 text-white shadow-2xs">
                  <Crown className="w-3 h-3 fill-amber-200" />
                  <span>WINNER</span>
                </span>
              ) : isTie ? (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  TIED
                </span>
              ) : (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  RUNNER-UP
                </span>
              )}
            </div>
            {isWinnerA && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                <Sparkles className="w-3 h-3" />
                <span>CHAMPION</span>
              </span>
            )}
          </div>

          <div className="flex items-end justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h4
                className={`text-sm truncate leading-tight ${
                  isWinnerA
                    ? "font-black text-slate-900 dark:text-white"
                    : "font-bold text-slate-700 dark:text-slate-300"
                }`}
                title={scorecard.teamA}
              >
                {scorecard.teamA}
              </h4>
            </div>
            <div
              className={`text-right font-mono font-black shrink-0 tabular-nums ${
                isWinnerA
                  ? "text-xl sm:text-2xl text-emerald-600 dark:text-emerald-400"
                  : "text-base sm:text-lg text-slate-600 dark:text-slate-400"
              }`}
            >
              {scorecard.scoreA || "—"}
            </div>
          </div>
        </div>

        {/* Team B Card */}
        <div
          className={`relative rounded-xl p-3 border transition-all ${
            isWinnerB
              ? "bg-gradient-to-br from-amber-100/60 via-emerald-50/40 to-white dark:from-amber-950/40 dark:via-emerald-950/30 dark:to-slate-800/90 border-amber-300 dark:border-amber-500/50 shadow-xs ring-1 ring-amber-400/20"
              : isTie
              ? "bg-slate-50/90 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
              : "bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 opacity-90"
          }`}
        >
          <div className="flex items-center justify-between gap-1.5 mb-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              {isWinnerB ? (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 to-emerald-600 text-white shadow-2xs">
                  <Crown className="w-3 h-3 fill-amber-200" />
                  <span>WINNER</span>
                </span>
              ) : isTie ? (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  TIED
                </span>
              ) : (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  RUNNER-UP
                </span>
              )}
            </div>
            {isWinnerB && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                <Sparkles className="w-3 h-3" />
                <span>CHAMPION</span>
              </span>
            )}
          </div>

          <div className="flex items-end justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h4
                className={`text-sm truncate leading-tight ${
                  isWinnerB
                    ? "font-black text-slate-900 dark:text-white"
                    : "font-bold text-slate-700 dark:text-slate-300"
                }`}
                title={scorecard.teamB}
              >
                {scorecard.teamB}
              </h4>
            </div>
            <div
              className={`text-right font-mono font-black shrink-0 tabular-nums ${
                isWinnerB
                  ? "text-xl sm:text-2xl text-emerald-600 dark:text-emerald-400"
                  : "text-base sm:text-lg text-slate-600 dark:text-slate-400"
              }`}
            >
              {scorecard.scoreB || "—"}
            </div>
          </div>
        </div>
      </div>

      {/* Prominent Victory Ribbon Banner */}
      <div className="mb-3 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500/10 via-emerald-500/15 to-amber-500/10 border border-emerald-500/20 text-center">
        <Trophy className="w-4 h-4 text-amber-500 fill-amber-400 shrink-0" />
        <span className="text-xs font-black text-emerald-900 dark:text-emerald-200 tracking-tight">
          {scorecard.result || (winnerName ? `${winnerName} won the match!` : "Match Completed")}
        </span>
      </div>

      {/* Player of the Match / MVP Showcase (if available) */}
      {scorecard.playerOfMatch && (
        <div className="mb-3 flex items-center justify-between gap-2 p-2 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-300/60 dark:border-amber-600/40">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center text-white text-xs font-black shadow-xs ring-2 ring-white dark:ring-slate-900 shrink-0">
              <Star className="w-4 h-4 fill-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-300">
                  PLAYER OF THE MATCH
                </span>
                {scorecard.playerOfMatchTeam && (
                  <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 truncate">
                    ({scorecard.playerOfMatchTeam})
                  </span>
                )}
              </div>
              <div className="text-xs font-black text-slate-900 dark:text-white truncate">
                {scorecard.playerOfMatch}
              </div>
            </div>
          </div>

          {scorecard.playerOfMatchStats && (
            <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-white/90 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-emerald-200/80 dark:border-emerald-800/80 shrink-0 shadow-2xs">
              {scorecard.playerOfMatchStats}
            </span>
          )}
        </div>
      )}

      {/* Interactive Celebrations Footer */}
      <div className="pt-2 border-t border-amber-200/50 dark:border-slate-800/80 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={handleCheerClick}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer shadow-2xs active:scale-95 ${
            hasCheered
              ? "bg-emerald-600 text-white hover:bg-emerald-700"
              : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
          }`}
          title="Cheer and send congratulatory confetti to the community"
        >
          <PartyPopper className="w-3.5 h-3.5" />
          <span>{hasCheered ? "Cheered!" : "Cheer Champion"}</span>
          {cheersCount > 0 && (
            <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-black/20 text-[10px]">
              +{cheersCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={handleShareClick}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700 transition cursor-pointer"
          title="Share victory summary"
        >
          <Share2 className="w-3 h-3 text-slate-400" />
          <span className="hidden xs:inline">Share Result</span>
        </button>
      </div>
    </div>
  );
}
