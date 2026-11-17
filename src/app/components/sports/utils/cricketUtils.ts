export function ballColor(ball: string): string {
  if (ball === "W" || ball.startsWith("W+")) return "bg-rose-500 text-white border-rose-600 font-bold shadow-xs";
  if (ball === "4") return "bg-emerald-500 text-white border-emerald-600 font-bold shadow-xs";
  if (ball === "6") return "bg-purple-600 text-white border-purple-700 font-black shadow-xs";
  if (ball.toLowerCase().includes("wd") || ball.toLowerCase().includes("nb")) return "bg-amber-400 text-amber-950 border-amber-500 font-bold";
  if (ball === "0" || ball === "•") return "bg-slate-800 text-slate-300 border-slate-700";
  return "bg-indigo-600 text-white border-indigo-700 font-semibold";
}

export function remainingBalls(currentOvers: string, maxOvers?: number): number {
  const parts = currentOvers.split(".");
  const overs = parseInt(parts[0]) || 0;
  const balls = parseInt(parts[1]) || 0;
  const bowled = overs * 6 + balls;
  const total = (maxOvers ?? 20) * 6;
  return Math.max(0, total - bowled);
}

export function requiredRunRate(target: number, currentRuns: number, currentOvers: string, maxOvers?: number): string {
  const remaining = remainingBalls(currentOvers, maxOvers);
  if (remaining <= 0) return "-";
  const needed = target - currentRuns;
  if (needed <= 0) return "0.00";
  return (needed / (remaining / 6)).toFixed(2);
}

/**
 * Haptic vibration feedback for scorers on mobile devices
 */
export function vibrateScorer(type: "dot" | "run" | "boundary" | "wicket" | "extra") {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      if (type === "wicket") navigator.vibrate([35, 45, 35]);
      else if (type === "boundary") navigator.vibrate(35);
      else if (type === "extra") navigator.vibrate(25);
      else navigator.vibrate(15);
    } catch {}
  }
}

/**
 * Calculates how many legal balls have been bowled in the current over
 */
export function getLegalBallsInCurrentOver(currentOvers: string): number {
  if (!currentOvers) return 0;
  const parts = currentOvers.split(".");
  return parts.length > 1 ? parseInt(parts[1], 10) || 0 : 0;
}

export interface HouseRulesConfig {
  enabled?: boolean;
  noExtraRuns: boolean;
  noFreeHits: boolean;
  oversLimit?: number;
  ballsPerOver?: number;
  maxOversPerBowler?: number;
}

/**
 * Determines whether a Free Hit is active based on the last delivery being a No-Ball.
 * If the match house rule disables free hits (`noFreeHits: true`), returns false.
 */
export function isFreeHitActive(
  thisOver?: string[],
  recentBalls?: Array<{ extrasType?: string; commentary?: string }>,
  noFreeHits?: boolean
): boolean {
  if (noFreeHits) return false;
  if (thisOver && thisOver.length > 0) {
    const last = thisOver[thisOver.length - 1].toLowerCase();
    if (last.includes("nb") || last.includes("noball") || last.includes("no-ball")) return true;
  }
  if (recentBalls && recentBalls.length > 0) {
    const last = recentBalls[recentBalls.length - 1];
    if (last.extrasType === "NO_BALL" || (last.commentary && last.commentary.toLowerCase().includes("no ball"))) {
      return true;
    }
  }
  return false;
}

/**
 * Builds a WhatsApp/Telegram-friendly scorecard message
 */
export function formatMatchShareText(params: {
  teamAName: string;
  teamBName: string;
  scoreA?: string;
  scoreB?: string;
  currentInnings?: number;
  target?: number | null;
  oversLimit?: number;
  winnerSummary?: string;
  matchUrl?: string;
}): string {
  const { teamAName, teamBName, scoreA, scoreB, currentInnings, target, oversLimit, winnerSummary, matchUrl } = params;
  const lines: string[] = ["🏏 *Mana Community Cricket Live*"];

  if (winnerSummary) {
    lines.push(`🏆 ${winnerSummary}`);
  } else if (currentInnings === 2 && target) {
    lines.push(`🎯 Target: ${target} runs from ${oversLimit || 20} overs`);
  }

  lines.push("");
  lines.push(`• *${teamAName}*: ${scoreA || "0/0"}`);
  lines.push(`• *${teamBName}*: ${scoreB || "Yet to bat"}`);

  if (matchUrl) {
    lines.push("");
    lines.push(`Follow ball-by-ball: ${matchUrl}`);
  }

  return lines.join("\n");
}

/**
 * Triggers the native Web Share API, falling back to clipboard copy
 */
export async function shareMatchScore(shareText: string): Promise<"shared" | "copied" | "failed"> {
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({
        title: "Cricket Match Scorecard",
        text: shareText,
      });
      return "shared";
    } catch (e: any) {
      if (e?.name === "AbortError") return "failed";
    }
  }

  if (typeof navigator !== "undefined" && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(shareText);
      return "copied";
    } catch {}
  }

  return "failed";
}

/**
 * Checks if the browser supports sharing image files via Web Share API
 */
export function canShareFiles(file?: File): boolean {
  if (typeof navigator === "undefined" || !navigator.share || !navigator.canShare) {
    return false;
  }
  try {
    const testFile = file || new File(["test"], "test.png", { type: "image/png" });
    return navigator.canShare({ files: [testFile] });
  } catch {
    return false;
  }
}

/**
 * Shares a match scorecard image file via navigator.share, falling back to download
 */
export async function shareMatchCardImage(
  imageBlob: Blob,
  fileName: string = "match-scorecard.png",
  shareText?: string
): Promise<"shared" | "downloaded" | "failed"> {
  const file = new File([imageBlob], fileName, { type: "image/png" });

  if (canShareFiles(file)) {
    try {
      await navigator.share({
        title: "Cricket Match Scorecard",
        text: shareText || "Live Cricket Scorecard",
        files: [file],
      });
      return "shared";
    } catch (e: any) {
      if (e?.name === "AbortError") return "failed";
    }
  }

  // Fallback: trigger download
  try {
    const url = URL.createObjectURL(imageBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return "downloaded";
  } catch {
    return "failed";
  }
}
