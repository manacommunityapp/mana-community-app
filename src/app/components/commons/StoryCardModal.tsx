import React, { useEffect, useRef, useState, useCallback } from "react";
import { X, Download, Share2, Copy, Check, Sparkles, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

export interface StoryCardData {
  type: "MATCH" | "EVENT" | "PIN" | "OFFER";
  communityName: string;
  category?: string;
  title: string;
  subtitle?: string;
  statusBadge?: string;
  badgeColor?: string;
  stats?: Array<{ label: string; value: string }>;
  highlights?: string[];
  footerNote?: string;
  dateStr?: string;
  authorInfo?: string;
  accentColor?: string;
}

interface StoryCardModalProps {
  open: boolean;
  onClose: () => void;
  data: StoryCardData | null;
}

const CANVAS_WIDTH = 1080;
const CANVAS_HEIGHT = 1350;

export function StoryCardModal({ open, onClose, data }: StoryCardModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const drawCard = useCallback(() => {
    if (!data || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 1. Clear & Background Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    bgGrad.addColorStop(0, "#090D16");
    bgGrad.addColorStop(0.5, "#0F172A");
    bgGrad.addColorStop(1, "#080E1A");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 2. Ambient Accent Glow
    const accent = data.accentColor || "#10B981"; // Emerald default
    const glow = ctx.createRadialGradient(CANVAS_WIDTH * 0.8, 200, 50, CANVAS_WIDTH * 0.8, 200, 600);
    glow.addColorStop(0, hexToRgba(accent, 0.25));
    glow.addColorStop(1, "transparent");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const glow2 = ctx.createRadialGradient(200, CANVAS_HEIGHT * 0.75, 40, 200, CANVAS_HEIGHT * 0.75, 500);
    glow2.addColorStop(0, hexToRgba(accent, 0.15));
    glow2.addColorStop(1, "transparent");
    ctx.fillStyle = glow2;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 3. Decorative Border Frame
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = 4;
    roundRect(ctx, 40, 40, CANVAS_WIDTH - 80, CANVAS_HEIGHT - 80, 40);
    ctx.stroke();

    // 4. Header: Logo & Community Branding
    let currentY = 110;
    ctx.textAlign = "left";

    // Community Brand Badge
    ctx.fillStyle = "rgba(255, 255, 255, 0.07)";
    roundRect(ctx, 80, currentY - 32, 420, 64, 32);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // App Pin Icon Dot
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(112, currentY, 12, 0, Math.PI * 2);
    ctx.fill();

    // App & Community Name
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 26px sans-serif";
    const headerTitle = (data.communityName || "Mana Community").toUpperCase();
    ctx.fillText(truncateText(ctx, headerTitle, 340), 136, currentY + 8);

    // Category Pill (Right Aligned)
    if (data.category) {
      const catText = data.category.toUpperCase();
      ctx.font = "bold 22px sans-serif";
      const catWidth = ctx.measureText(catText).width + 48;
      const catX = CANVAS_WIDTH - 80 - catWidth;
      ctx.fillStyle = hexToRgba(accent, 0.18);
      roundRect(ctx, catX, currentY - 32, catWidth, 64, 32);
      ctx.fill();
      ctx.strokeStyle = hexToRgba(accent, 0.4);
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = accent;
      ctx.fillText(catText, catX + 24, currentY + 8);
    }

    currentY += 120;

    // 5. Status Badge (if available)
    if (data.statusBadge) {
      const badgeText = data.statusBadge.toUpperCase();
      ctx.font = "bold 24px sans-serif";
      const badgeWidth = ctx.measureText(badgeText).width + 56;
      ctx.fillStyle = data.badgeColor || hexToRgba(accent, 0.9);
      roundRect(ctx, 80, currentY - 24, badgeWidth, 54, 27);
      ctx.fill();

      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(badgeText, 108, currentY + 12);
      currentY += 80;
    }

    // 6. Main Title (multiline wrapping)
    ctx.fillStyle = "#F8FAFC";
    ctx.font = "bold 56px sans-serif";
    const wrappedTitle = wrapText(ctx, data.title, CANVAS_WIDTH - 160, 4);
    for (const line of wrappedTitle) {
      ctx.fillText(line, 80, currentY);
      currentY += 72;
    }

    // 7. Subtitle
    if (data.subtitle) {
      currentY += 10;
      ctx.fillStyle = "#94A3B8";
      ctx.font = "34px sans-serif";
      const wrappedSub = wrapText(ctx, data.subtitle, CANVAS_WIDTH - 160, 2);
      for (const line of wrappedSub) {
        ctx.fillText(line, 80, currentY);
        currentY += 46;
      }
    }

    currentY += 40;

    // 8. Stats Cards Grid (e.g. Scores / Details)
    if (data.stats && data.stats.length > 0) {
      const cardGap = 20;
      const totalWidth = CANVAS_WIDTH - 160;
      const cardWidth = (totalWidth - (data.stats.length - 1) * cardGap) / data.stats.length;
      const cardHeight = 150;

      data.stats.forEach((st, idx) => {
        const cardX = 80 + idx * (cardWidth + cardGap);
        // Card Background
        ctx.fillStyle = "rgba(30, 41, 59, 0.7)";
        roundRect(ctx, cardX, currentY, cardWidth, cardHeight, 24);
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Label
        ctx.fillStyle = "#94A3B8";
        ctx.font = "bold 22px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(st.label.toUpperCase(), cardX + cardWidth / 2, currentY + 46);

        // Value
        ctx.fillStyle = "#38BDF8";
        ctx.font = "bold 44px sans-serif";
        ctx.fillText(truncateText(ctx, st.value, cardWidth - 20), cardX + cardWidth / 2, currentY + 108);
      });

      currentY += cardHeight + 40;
    }

    // 9. Highlights Box (e.g. Top Batsman, Venue, or Pin Content)
    if (data.highlights && data.highlights.length > 0) {
      ctx.textAlign = "left";
      const boxHeight = Math.min(260, 50 + data.highlights.length * 48);
      ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
      roundRect(ctx, 80, currentY, CANVAS_WIDTH - 160, boxHeight, 24);
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx.lineWidth = 2;
      ctx.stroke();

      let itemY = currentY + 46;
      data.highlights.forEach((hl) => {
        // Bullet dot
        ctx.fillStyle = accent;
        ctx.beginPath();
        ctx.arc(114, itemY - 8, 7, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#E2E8F0";
        ctx.font = "26px sans-serif";
        ctx.fillText(truncateText(ctx, hl, CANVAS_WIDTH - 240), 140, itemY);
        itemY += 48;
      });
      currentY += boxHeight + 40;
    }

    // 10. Footer Section (Pinned to bottom)
    const footerY = CANVAS_HEIGHT - 120;

    // Divider
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(80, footerY - 40);
    ctx.lineTo(CANVAS_WIDTH - 80, footerY - 40);
    ctx.stroke();

    // Footer Left: App Branding
    ctx.textAlign = "left";
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 28px sans-serif";
    ctx.fillText("Mana Community", 80, footerY);

    ctx.fillStyle = "#64748B";
    ctx.font = "22px sans-serif";
    ctx.fillText(data.footerNote || "Hyperlocal Living • Sports • Events • Bazaar", 80, footerY + 34);

    // Footer Right: Timestamp / Author
    ctx.textAlign = "right";
    ctx.fillStyle = "#94A3B8";
    ctx.font = "bold 22px sans-serif";
    const metaStr = data.dateStr || new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    ctx.fillText(metaStr, CANVAS_WIDTH - 80, footerY);

    if (data.authorInfo) {
      ctx.fillStyle = "#64748B";
      ctx.font = "20px sans-serif";
      ctx.fillText(truncateText(ctx, data.authorInfo, 300), CANVAS_WIDTH - 80, footerY + 32);
    }
  }, [data]);

  useEffect(() => {
    if (open && data) {
      setIsGenerating(true);
      setTimeout(() => {
        drawCard();
        setIsGenerating(false);
      }, 50);
    }
  }, [open, data, drawCard]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const link = document.createElement("a");
    const safeTitle = (data?.title || "story-card").toLowerCase().replace(/[^a-z0-9]+/g, "-");
    link.download = `mana-${safeTitle}-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    toast.success("Story Card downloaded! Ready for WhatsApp Status & Instagram.");
  };

  const handleCopy = async () => {
    if (!canvasRef.current) return;
    try {
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
        setCopied(true);
        toast.success("Image copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
      });
    } catch {
      handleDownload();
    }
  };

  const handleShare = async () => {
    if (!canvasRef.current || !data) return;
    try {
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) {
          handleWhatsAppShare();
          return;
        }
        const fileName = `mana-${(data.title || "story-card").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`;
        const file = new File([blob], fileName, { type: "image/png" });

        if (typeof navigator !== "undefined" && navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: data.title,
              text: buildStoryCardShareText(data),
            });
            toast.success("Shared successfully!");
            return;
          } catch (e: any) {
            if (e.name === "AbortError") return;
          }
        }
        // Fallback for desktop / unsupported mobile browsers
        handleWhatsAppShare();
      });
    } catch {
      handleWhatsAppShare();
    }
  };

  const handleWhatsAppShare = () => {
    handleDownload();
    const shareText = encodeURIComponent(
      `*${data?.title}*\n${data?.subtitle ? data.subtitle + "\n" : ""}${data?.communityName ? "📍 " + data.communityName : ""}\n\nShared via Mana Community App`
    );
    window.open(`https://wa.me/?text=${shareText}`, "_blank");
  };

  if (!open || !data) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="relative flex flex-col md:flex-row items-center max-w-4xl w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-full transition-colors"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Side: Story Card Preview */}
        <div className="w-full md:flex-1 flex justify-center items-center p-4 sm:p-6 bg-slate-950/60 border-b md:border-b-0 md:border-r border-slate-800/80">
          <div className="relative shadow-2xl rounded-2xl overflow-hidden border border-slate-700/50 w-[240px] h-[300px] sm:w-[280px] sm:h-[350px]">
            {isGenerating && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
                <Sparkles className="w-8 h-8 text-emerald-400 animate-spin" />
              </div>
            )}
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        {/* Right Side: Export Options & CTAs */}
        <div className="w-full md:flex-1 p-5 sm:p-8 flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs sm:text-sm mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Viral Story Card</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white mb-1.5">Share to WhatsApp & Instagram</h3>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              Export high-resolution (1080 × 1350) branded graphics optimized for WhatsApp Status, Stories, and Society groups.
            </p>
          </div>

          <div className="space-y-2.5 sm:space-y-3">
            <button
              onClick={handleShare}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-900/30 transition-all hover:scale-[1.01] active:scale-[0.99] text-sm"
            >
              <Share2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              <span>Share to WhatsApp & Stories</span>
            </button>

            <button
              onClick={handleDownload}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-700/50 text-emerald-200 font-medium rounded-xl transition-colors text-xs sm:text-sm"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Download Image (1080 × 1350)</span>
            </button>

            <button
              onClick={handleCopy}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-medium rounded-xl transition-colors text-xs sm:text-sm"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? "Copied to Clipboard!" : "Copy Image to Clipboard"}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-3 border-t border-slate-800">
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Standard 4:5 vertical aspect ratio for Instagram Stories & WhatsApp</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ──

export function buildStoryCardShareText(data: StoryCardData): string {
  const lines: string[] = [];
  if (data.title) lines.push(`*${data.title}*`);
  if (data.subtitle) lines.push(data.subtitle);
  if (data.statusBadge) lines.push(`🏆 ${data.statusBadge}`);
  if (data.stats && data.stats.length > 0) {
    const statsStr = data.stats.map((s) => `${s.label}: ${s.value}`).join(" | ");
    lines.push(statsStr);
  }
  if (data.communityName) lines.push(`📍 ${data.communityName}`);
  lines.push("\nShared via Mana Community App");
  return lines.join("\n");
}

export function hexToRgba(hex: string, alpha: number): string {
  let c = hex.replace("#", "");
  if (c.length === 3) c = c.split("").map((x) => x + x).join("");
  const num = parseInt(c, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function truncateText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let str = text;
  while (str.length > 0 && ctx.measureText(str + "...").width > maxWidth) {
    str = str.slice(0, -1);
  }
  return str + "...";
}

export function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(testLine).width <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
      if (lines.length === maxLines - 1) {
        break;
      }
    }
  }
  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine);
  }
  return lines;
}
