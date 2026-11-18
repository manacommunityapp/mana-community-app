import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  X,
  Share2,
  Download,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Trophy,
  Flame,
  Radio,
  Eye,
  Loader2,
} from "lucide-react";
import type { LiveMatchStateData } from "../../../services/sports/tournamentService";
import {
  ballColor,
  remainingBalls,
  requiredRunRate,
  formatMatchShareText,
  shareMatchCardImage,
  canShareFiles,
} from "./utils/cricketUtils";
import { getCachedTeamLogo } from "./teams/teamImageUtils";
import { toast } from "sonner";

interface MatchShareCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchId: number;
  state: LiveMatchStateData;
  teamAName?: string;
  teamBName?: string;
  tournamentName?: string;
}

export function MatchShareCardModal({
  isOpen,
  onClose,
  matchId,
  state,
  teamAName,
  teamBName,
  tournamentName = "Mana Community Cricket Championship",
}: MatchShareCardModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [hasFileShareSupport, setHasFileShareSupport] = useState(false);

  useEffect(() => {
    setHasFileShareSupport(canShareFiles());
  }, []);

  const nameA = state.teamAName || teamAName || "Team A";
  const nameB = state.teamBName || teamBName || "Team B";
  const inn1 = state.innings1;
  const inn2 = state.innings2;
  const currentInn = state.currentInnings === 1 ? inn1 : inn2;
  const oversLimit = state.oversLimit || 20;

  // Format team scores
  const scoreA = inn1
    ? `${inn1.totalRuns}/${inn1.totalWickets} (${inn1.totalOvers} ov)`
    : "0/0 (0.0 ov)";
  const scoreB = inn2 && (inn2.totalRuns > 0 || inn2.totalWickets > 0 || inn2.totalOvers !== "0.0")
    ? `${inn2.totalRuns}/${inn2.totalWickets} (${inn2.totalOvers} ov)`
    : state.currentInnings === 1
      ? "Yet to bat"
      : "0/0 (0.0 ov)";

  // Target and equation
  const isSecondInnings = state.currentInnings === 2;
  const target = state.target;
  const isCompleted = state.status === "COMPLETED";

  const ballsRem = isSecondInnings && inn2 ? remainingBalls(inn2.totalOvers, oversLimit) : 0;
  const runsRem = target && inn2 ? Math.max(0, target - inn2.totalRuns) : 0;
  const rrr = target && inn2 ? requiredRunRate(target, inn2.totalRuns, inn2.totalOvers, oversLimit) : null;

  let winnerText = "";
  if (isCompleted) {
    if (inn1 && inn2) {
      if (inn1.totalRuns > inn2.totalRuns) {
        winnerText = `${nameA} won by ${inn1.totalRuns - inn2.totalRuns} runs`;
      } else if (inn2.totalRuns > inn1.totalRuns) {
        winnerText = `${nameB} won by ${10 - inn2.totalWickets} wickets`;
      } else {
        winnerText = "Match Tied!";
      }
    } else {
      winnerText = "Match Completed";
    }
  }

  // Active Players
  const striker = currentInn?.batters?.find((b) => b.playerId === state.batsmanOnStrikeId) ||
    currentInn?.batters?.find((b) => !b.isOut);
  const nonStriker = currentInn?.batters?.find((b) => b.playerId === state.batsmanNonStrikeId);
  const bowler = currentInn?.bowlers?.find((b) => b.playerId === state.currentBowlerId) ||
    currentInn?.bowlers?.[currentInn.bowlers.length - 1];

  const thisOver = currentInn?.thisOver || [];
  const matchUrl = typeof window !== "undefined"
    ? `${window.location.origin}/sports/match/${matchId}`
    : `https://hub.manacommunity.com/sports/match/${matchId}`;

  // Render high-DPI canvas
  const generateCanvasImage = useCallback(() => {
    if (!canvasRef.current) return;
    setGenerating(true);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setGenerating(false);
      return;
    }

    const width = 1200;
    const height = 675;
    canvas.width = width;
    canvas.height = height;

    // 1. Background with deep stadium dark gradients
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, "#030712"); // slate-950
    bgGrad.addColorStop(0.5, "#0f172a"); // slate-900
    bgGrad.addColorStop(1, "#1e1b4b"); // indigo-950
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Decorative pitch glow lines
    ctx.strokeStyle = "rgba(99, 102, 241, 0.15)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, 380, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "rgba(16, 185, 129, 0.12)";
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, 220, 0, Math.PI * 2);
    ctx.stroke();

    // Subtle outer border
    ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
    ctx.lineWidth = 2;
    ctx.strokeRect(16, 16, width - 32, height - 32);

    // 2. Header
    // Tournament name
    ctx.font = "bold 20px 'Segoe UI', system-ui, sans-serif";
    ctx.fillStyle = "#818cf8"; // indigo-400
    ctx.fillText(tournamentName.toUpperCase(), 48, 64);

    // Status Badge
    const statusText = isCompleted
      ? "🏆 MATCH FINISHED"
      : `🔴 LIVE · INNINGS ${state.currentInnings}`;
    const statusBg = isCompleted ? "#059669" : "#e11d48";
    ctx.font = "bold 15px 'Segoe UI', system-ui, sans-serif";
    const statusWidth = ctx.measureText(statusText).width + 24;

    ctx.fillStyle = statusBg;
    roundRect(ctx, width - statusWidth - 48, 42, statusWidth, 30, 15);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.fillText(statusText, width - statusWidth - 36, 62);

    // Format & Overs Limit
    ctx.font = "600 15px 'Segoe UI', system-ui, sans-serif";
    ctx.fillStyle = "#94a3b8";
    ctx.fillText(`Limited Overs · ${oversLimit} Overs Per Side`, 48, 92);

    // Divider
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(48, 114);
    ctx.lineTo(width - 48, 114);
    ctx.stroke();

    // 3. Teams & Scores Section
    // Team A Box (Left)
    ctx.fillStyle = "rgba(15, 23, 42, 0.65)";
    roundRect(ctx, 48, 136, 520, 150, 16);
    ctx.fill();
    ctx.strokeStyle = state.innings1.battingTeamId === state.teamAId ? "rgba(99, 102, 241, 0.5)" : "rgba(255, 255, 255, 0.08)";
    ctx.stroke();

    // Team A Badge
    ctx.save();
    ctx.fillStyle = "rgba(99, 102, 241, 0.25)";
    roundRect(ctx, 72, 152, 34, 34, 8);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 14px 'Segoe UI', system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(nameA.slice(0, 2).toUpperCase(), 89, 169);
    ctx.restore();

    ctx.font = "bold 24px 'Segoe UI', system-ui, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "left";
    ctx.fillText(nameA, 116, 178);

    ctx.font = "900 48px 'Segoe UI', system-ui, sans-serif";
    ctx.fillStyle = "#f8fafc";
    ctx.fillText(inn1 ? `${inn1.totalRuns}/${inn1.totalWickets}` : "0/0", 72, 238);

    ctx.font = "600 20px 'Segoe UI', system-ui, sans-serif";
    ctx.fillStyle = "#38bdf8";
    ctx.fillText(`(${inn1 ? inn1.totalOvers : "0.0"} / ${oversLimit} ov)`, 280, 238);

    ctx.font = "500 15px 'Segoe UI', system-ui, sans-serif";
    ctx.fillStyle = "#94a3b8";
    ctx.fillText(`CRR: ${inn1 ? inn1.runRate : "0.00"}`, 72, 268);

    // VS Badge in Center
    ctx.fillStyle = "rgba(30, 41, 59, 0.9)";
    ctx.beginPath();
    ctx.arc(width / 2, 211, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.stroke();
    ctx.font = "900 16px 'Segoe UI', system-ui, sans-serif";
    ctx.fillStyle = "#cbd5e1";
    ctx.textAlign = "center";
    ctx.fillText("VS", width / 2, 217);
    ctx.textAlign = "left";

    // Team B Box (Right)
    ctx.fillStyle = "rgba(15, 23, 42, 0.65)";
    roundRect(ctx, width - 568, 136, 520, 150, 16);
    ctx.fill();
    ctx.strokeStyle = state.innings2?.battingTeamId === state.teamBId ? "rgba(99, 102, 241, 0.5)" : "rgba(255, 255, 255, 0.08)";
    ctx.stroke();

    // Team B Badge
    ctx.save();
    ctx.fillStyle = "rgba(245, 158, 11, 0.25)";
    roundRect(ctx, width - 544, 152, 34, 34, 8);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 14px 'Segoe UI', system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(nameB.slice(0, 2).toUpperCase(), width - 527, 169);
    ctx.restore();

    ctx.font = "bold 24px 'Segoe UI', system-ui, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "left";
    ctx.fillText(nameB, width - 500, 178);

    ctx.font = "900 48px 'Segoe UI', system-ui, sans-serif";
    ctx.fillStyle = "#f8fafc";
    ctx.fillText(inn2 && isSecondInnings ? `${inn2.totalRuns}/${inn2.totalWickets}` : isSecondInnings ? "0/0" : "Yet to bat", width - 544, 238);

    if (isSecondInnings && inn2) {
      ctx.font = "600 20px 'Segoe UI', system-ui, sans-serif";
      ctx.fillStyle = "#38bdf8";
      ctx.fillText(`(${inn2.totalOvers} / ${oversLimit} ov)`, width - 340, 238);

      ctx.font = "500 15px 'Segoe UI', system-ui, sans-serif";
      ctx.fillStyle = "#94a3b8";
      ctx.fillText(`CRR: ${inn2.runRate}`, width - 544, 268);
    }

    // 4. Match Equation Banner / Target Bar
    ctx.fillStyle = "rgba(30, 41, 59, 0.85)";
    roundRect(ctx, 48, 304, width - 96, 54, 12);
    ctx.fill();
    ctx.strokeStyle = isCompleted ? "rgba(16, 185, 129, 0.4)" : "rgba(245, 158, 11, 0.35)";
    ctx.stroke();

    let bannerText = "";
    if (isCompleted) {
      bannerText = `🏆 ${winnerText}`;
      ctx.fillStyle = "#34d399";
    } else if (isSecondInnings && target) {
      bannerText = `🎯 Target: ${target} runs  •  Need ${runsRem} runs from ${ballsRem} balls  •  Required Run Rate: ${rrr || "0.00"}`;
      ctx.fillStyle = "#fbbf24";
    } else {
      bannerText = `🏏 1st Innings in progress  •  Current Run Rate: ${inn1 ? inn1.runRate : "0.00"}`;
      ctx.fillStyle = "#93c5fd";
    }
    ctx.font = "bold 18px 'Segoe UI', system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(bannerText, width / 2, 338);
    ctx.textAlign = "left";

    // 5. In-play Snapshot (Batters, Bowler & This Over)
    // Left Box: Current Batsmen
    ctx.fillStyle = "rgba(15, 23, 42, 0.5)";
    roundRect(ctx, 48, 376, 520, 190, 16);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.stroke();

    ctx.font = "bold 14px 'Segoe UI', system-ui, sans-serif";
    ctx.fillStyle = "#94a3b8";
    ctx.fillText("BATTERS ON CREASE", 68, 404);

    if (striker) {
      ctx.font = "bold 18px 'Segoe UI', system-ui, sans-serif";
      ctx.fillStyle = "#38bdf8";
      ctx.fillText(`${striker.playerName} *`, 68, 438);

      ctx.font = "bold 20px 'Segoe UI', system-ui, sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(`${striker.runs} `, 360, 438);

      ctx.font = "500 15px 'Segoe UI', system-ui, sans-serif";
      ctx.fillStyle = "#94a3b8";
      ctx.fillText(`(${striker.balls}b) • 4s: ${striker.fours}  6s: ${striker.sixes}  SR: ${striker.strikeRate}`, 68, 464);
    } else {
      ctx.font = "15px 'Segoe UI', system-ui, sans-serif";
      ctx.fillStyle = "#64748b";
      ctx.fillText("No batter recorded", 68, 442);
    }

    if (nonStriker) {
      ctx.font = "bold 17px 'Segoe UI', system-ui, sans-serif";
      ctx.fillStyle = "#e2e8f0";
      ctx.fillText(nonStriker.playerName, 68, 508);

      ctx.font = "bold 18px 'Segoe UI', system-ui, sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(`${nonStriker.runs} `, 360, 508);

      ctx.font = "500 14px 'Segoe UI', system-ui, sans-serif";
      ctx.fillStyle = "#94a3b8";
      ctx.fillText(`(${nonStriker.balls}b) • SR: ${nonStriker.strikeRate}`, 68, 532);
    }

    // Right Box: Bowler & Recent Balls
    ctx.fillStyle = "rgba(15, 23, 42, 0.5)";
    roundRect(ctx, width - 568, 376, 520, 190, 16);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.stroke();

    ctx.font = "bold 14px 'Segoe UI', system-ui, sans-serif";
    ctx.fillStyle = "#94a3b8";
    ctx.fillText("CURRENT BOWLER & OVER", width - 548, 404);

    if (bowler) {
      ctx.font = "bold 18px 'Segoe UI', system-ui, sans-serif";
      ctx.fillStyle = "#f43f5e";
      ctx.fillText(bowler.playerName, width - 548, 438);

      ctx.font = "600 16px 'Segoe UI', system-ui, sans-serif";
      ctx.fillStyle = "#e2e8f0";
      ctx.fillText(`${bowler.overs} ov • ${bowler.runs} runs • ${bowler.wickets} wkts`, width - 548, 466);
    } else {
      ctx.font = "15px 'Segoe UI', system-ui, sans-serif";
      ctx.fillStyle = "#64748b";
      ctx.fillText("Bowler not selected", width - 548, 442);
    }

    // This Over Balls Strip
    ctx.font = "600 13px 'Segoe UI', system-ui, sans-serif";
    ctx.fillStyle = "#94a3b8";
    ctx.fillText("THIS OVER:", width - 548, 506);

    const startX = width - 460;
    const ballY = 502;
    if (thisOver.length > 0) {
      thisOver.forEach((ball, idx) => {
        const x = startX + idx * 42;
        let color = "#3b82f6";
        let textCol = "#ffffff";
        if (ball === "W" || ball.startsWith("W+")) color = "#f43f5e";
        else if (ball === "4") color = "#10b981";
        else if (ball === "6") color = "#9333ea";
        else if (ball.toLowerCase().includes("wd") || ball.toLowerCase().includes("nb")) {
          color = "#fbbf24";
          textCol = "#0f172a";
        } else if (ball === "0" || ball === "•") {
          color = "#334155";
        }

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, ballY, 15, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = "bold 11px 'Segoe UI', system-ui, sans-serif";
        ctx.fillStyle = textCol;
        ctx.textAlign = "center";
        ctx.fillText(ball, x, ballY + 4);
        ctx.textAlign = "left";
      });
    } else {
      ctx.font = "italic 13px 'Segoe UI', system-ui, sans-serif";
      ctx.fillStyle = "#64748b";
      ctx.fillText("Over just starting...", startX, ballY + 4);
    }

    // 6. Footer Watermark & URL
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(48, 590);
    ctx.lineTo(width - 48, 590);
    ctx.stroke();

    ctx.font = "bold 14px 'Segoe UI', system-ui, sans-serif";
    ctx.fillStyle = "#6366f1";
    ctx.fillText("🏏 MANA COMMUNITY SPORTS HUB", 48, 626);

    ctx.font = "500 13px 'Segoe UI', system-ui, sans-serif";
    ctx.fillStyle = "#94a3b8";
    ctx.fillText("Real-time live cricket scoring & community tournaments", 310, 626);

    ctx.font = "600 13px 'Segoe UI', system-ui, sans-serif";
    ctx.fillStyle = "#38bdf8";
    ctx.textAlign = "right";
    ctx.fillText(matchUrl.replace(/^https?:\/\//, ""), width - 48, 626);
    ctx.textAlign = "left";

    // Export as Blob
    canvas.toBlob(
      (blob) => {
        if (blob) {
          setImageBlob(blob);
          const url = URL.createObjectURL(blob);
          setImageUrl(url);
        }
        setGenerating(false);
      },
      "image/png",
      0.95
    );
  }, [
    matchId,
    state,
    nameA,
    nameB,
    inn1,
    inn2,
    oversLimit,
    isSecondInnings,
    target,
    isCompleted,
    ballsRem,
    runsRem,
    rrr,
    winnerText,
    striker,
    nonStriker,
    bowler,
    thisOver,
    matchUrl,
    tournamentName,
  ]);

  useEffect(() => {
    if (isOpen) {
      // Allow DOM canvas to mount then render
      const timer = setTimeout(() => {
        generateCanvasImage();
      }, 80);
      return () => clearTimeout(timer);
    } else {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
        setImageUrl(null);
        setImageBlob(null);
      }
    }
  }, [isOpen, generateCanvasImage]);

  if (!isOpen) return null;

  const shareText = formatMatchShareText({
    teamAName: nameA,
    teamBName: nameB,
    scoreA,
    scoreB,
    currentInnings: state.currentInnings,
    target,
    oversLimit,
    winnerSummary: isCompleted ? winnerText : undefined,
    matchUrl,
  });

  const handleShareImage = async () => {
    if (!imageBlob) {
      toast.error("Generating scorecard image, please try again...");
      return;
    }
    const result = await shareMatchCardImage(
      imageBlob,
      `match-${matchId}-scorecard.png`,
      shareText
    );
    if (result === "shared") toast.success("Scorecard image shared!");
    else if (result === "downloaded") toast.success("Scorecard image downloaded!");
    else toast.error("Could not share image");
  };

  const handleDownload = () => {
    if (!imageBlob) return;
    const url = URL.createObjectURL(imageBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `match-${matchId}-scorecard.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Scorecard image downloaded!");
  };

  const handleWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(matchUrl);
      setCopiedLink(true);
      toast.success("Match link copied to clipboard!");
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopiedText(true);
      toast.success("Formatted scorecard text copied!");
      setTimeout(() => setCopiedText(false), 2500);
    } catch {
      toast.error("Failed to copy text");
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700/80 rounded-2xl sm:rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden text-white flex flex-col my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold tracking-tight">
                Match Share Card
              </h2>
              <p className="text-[11px] text-slate-400">
                Share visual scorecard image directly to WhatsApp, Instagram & Telegram
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Card Preview Container */}
        <div className="p-4 sm:p-6 space-y-4">
          <div className="relative rounded-2xl overflow-hidden border border-slate-800 shadow-xl bg-slate-950 flex items-center justify-center min-h-[220px]">
            {generating && !imageUrl ? (
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                <span className="text-xs">Synthesizing high-DPI scorecard...</span>
              </div>
            ) : imageUrl ? (
              <img
                src={imageUrl}
                alt="Match Scorecard Card Preview"
                className="w-full h-auto object-cover rounded-xl"
              />
            ) : (
              <div className="py-12 text-xs text-slate-500">Preparing preview...</div>
            )}

            {/* Hidden canvas element for image synthesis */}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Quick Share Action Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
            <button
              onClick={handleShareImage}
              disabled={generating || !imageBlob}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs shadow-md shadow-indigo-600/25 transition active:scale-95 disabled:opacity-50"
              title="Share scorecard image via native mobile share sheet"
            >
              <Share2 className="w-4 h-4" />
              <span>{hasFileShareSupport ? "Share Image" : "Share Score"}</span>
            </button>

            <button
              onClick={handleDownload}
              disabled={generating || !imageBlob}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs border border-slate-700 transition active:scale-95 disabled:opacity-50"
              title="Download high-resolution PNG image"
            >
              <Download className="w-4 h-4" />
              <span>Download PNG</span>
            </button>

            <button
              onClick={handleWhatsApp}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition active:scale-95"
              title="Share formatted message to WhatsApp"
            >
              <ExternalLink className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={handleCopyText}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs border border-slate-700 transition active:scale-95"
              title="Copy formatted text to clipboard"
            >
              {copiedText ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedText ? "Copied!" : "Copy Text"}</span>
            </button>
          </div>

          {/* Formatted Text Preview */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto">
            {shareText}
          </div>

          {/* Bottom Bar: Link Copy */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 flex-wrap">
            <span className="truncate max-w-[280px] sm:max-w-md">🔗 {matchUrl}</span>
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? "Link Copied" : "Copy Link"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Helper to draw rounded rectangle on Canvas 2D
 */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number
) {
  const r = Math.min(radius, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
