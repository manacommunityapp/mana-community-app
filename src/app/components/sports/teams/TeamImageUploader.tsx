import React, { useState, useRef } from "react";
import {
  Upload,
  Camera,
  X,
  Sparkles,
  Loader2,
  CheckCircle2,
  Image as ImageIcon,
  Palette,
  RefreshCw,
} from "lucide-react";
import {
  validateTeamImageFile,
  compressAndCropTeamImage,
  setCachedTeamLogo,
} from "./teamImageUtils";
import { mediaService } from "../../../../services/files/mediaService";
import { toast } from "sonner";

export interface TeamImageUploaderProps {
  imageUrl?: string;
  emoji?: string;
  colorHex?: string;
  teamName?: string;
  communityId?: number;
  eventId?: number;
  onChange: (meta: { imageUrl?: string; emoji?: string; colorHex?: string }) => void;
  className?: string;
}

const DEFAULT_EMOJIS = [
  "🏏", "⚡", "🔥", "🦁", "🐯", "🦅", "🐍", "🎯",
  "💪", "🏆", "⭐", "🌟", "🎖️", "🛡️", "⚔️", "🐺"
];

const JERSEY_COLORS = [
  { name: "Indigo", hex: "#4f46e5" },
  { name: "Gold", hex: "#d97706" },
  { name: "Emerald", hex: "#059669" },
  { name: "Rose", hex: "#e11d48" },
  { name: "Purple", hex: "#7c3aed" },
  { name: "Cyan", hex: "#0891b2" },
  { name: "Orange", hex: "#ea580c" },
  { name: "Slate", hex: "#475569" },
];

export function TeamImageUploader({
  imageUrl,
  emoji = "🏏",
  colorHex = "#4f46e5",
  teamName,
  communityId,
  eventId,
  onChange,
  className = "",
}: TeamImageUploaderProps) {
  const [activeTab, setActiveTab] = useState<"image" | "emoji">(imageUrl ? "image" : "emoji");
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    const val = validateTeamImageFile(file);
    if (!val.valid) {
      toast.error(val.error || "Invalid file");
      return;
    }

    setUploading(true);
    try {
      // 1. Client-side canvas compression & square crop
      const compressedDataUrl = await compressAndCropTeamImage(file, 512, 0.85);

      let finalUrl = compressedDataUrl;

      // 2. Attempt backend S3 mediaService upload if community context is available
      if (communityId) {
        try {
          const res = await mediaService.upload(file, {
            module: "SPORTS",
            moduleId: String(eventId || 0),
            communityId,
            subContext: "TEAM_LOGO",
            caption: teamName ? `${teamName} Team Logo` : "Team Logo",
          });
          if (res && res.url) {
            finalUrl = res.url;
          }
        } catch {
          // Fallback gracefully to compressed data URL
        }
      }

      // 3. Cache logo locally
      if (teamName) {
        setCachedTeamLogo(teamName, finalUrl);
      }

      onChange({
        imageUrl: finalUrl,
        emoji,
        colorHex,
      });

      setActiveTab("image");
      toast.success("Team logo updated!");
    } catch {
      toast.error("Failed to process team image");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleClearImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange({
      imageUrl: undefined,
      emoji: emoji || "🏏",
      colorHex,
    });
    if (teamName) {
      setCachedTeamLogo(teamName, null);
    }
    setActiveTab("emoji");
    toast.info("Image removed. Switched to emoji icon.");
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Hidden native file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
          }
        }}
      />

      {/* Main Preview & Mode Selection */}
      <div className="flex items-center gap-4 rounded-xl border border-slate-200/90 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-900/60">
        {/* Logo Badge Preview */}
        <div className="relative group shrink-0">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl flex items-center justify-center text-3xl font-black text-white shadow-md cursor-pointer overflow-hidden border-2 border-white/80 dark:border-slate-800 transition-transform active:scale-95 hover:shadow-lg"
            style={{
              background: imageUrl
                ? "#0f172a"
                : `linear-gradient(135deg, ${colorHex}, ${colorHex}dd)`,
            }}
            title="Click to change team logo image"
          >
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={teamName || "Team Logo"}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{emoji}</span>
            )}

            {/* Hover Camera Overlay */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity rounded-2xl gap-0.5">
              <Camera className="w-5 h-5 text-white drop-shadow-sm" />
              <span className="text-[9px] font-bold tracking-wider uppercase">Upload</span>
            </div>
          </div>

          {/* Remove image button if present */}
          {imageUrl && (
            <button
              type="button"
              onClick={handleClearImage}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center hover:bg-rose-600 transition shadow-xs cursor-pointer z-10"
              title="Remove custom image"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Tab Selector & Status */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Team Badge & Identity
            </span>
            {imageUrl && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3 h-3" /> Custom Logo Active
              </span>
            )}
          </div>

          {/* Mode Switcher Tabs */}
          <div className="inline-flex p-0.5 rounded-lg bg-slate-200/70 dark:bg-slate-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab("image")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] transition cursor-pointer ${
                activeTab === "image"
                  ? "bg-white text-indigo-600 shadow-xs dark:bg-slate-700 dark:text-white"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
              }`}
            >
              <ImageIcon className="w-3 h-3" />
              <span>Upload Image</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("emoji")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] transition cursor-pointer ${
                activeTab === "emoji"
                  ? "bg-white text-indigo-600 shadow-xs dark:bg-slate-700 dark:text-white"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
              }`}
            >
              <Palette className="w-3 h-3" />
              <span>Emoji & Color</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab 1: Image Upload Dropzone */}
      {activeTab === "image" && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
            isDragging
              ? "border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/20"
              : "border-slate-300 hover:border-indigo-400 bg-white hover:bg-slate-50/50 dark:border-slate-700 dark:bg-slate-800/40"
          }`}
        >
          {uploading ? (
            <div className="flex flex-col items-center justify-center py-2 text-indigo-600 dark:text-indigo-400">
              <Loader2 className="w-6 h-6 animate-spin mb-1.5" />
              <span className="text-xs font-bold">Optimizing & Uploading Team Logo...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-1">
              <div className="w-9 h-9 rounded-full bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-1.5">
                <Upload className="w-4 h-4" />
              </div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 m-0">
                {imageUrl ? "Click or drag to replace team image" : "Click or drag team crest / logo here"}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 m-0">
                PNG, JPG, WEBP, or SVG • Up to 5MB • Auto-cropped to square
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Mascot Emoji & Jersey Color Palette */}
      {activeTab === "emoji" && (
        <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-800/60 space-y-3">
          {/* Emojis */}
          <div>
            <div className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Choose Mascot / Emblem
            </div>
            <div className="grid grid-cols-8 gap-1.5 sm:gap-2">
              {DEFAULT_EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() =>
                    onChange({
                      imageUrl: undefined,
                      emoji: e,
                      colorHex,
                    })
                  }
                  className={`h-9 w-9 rounded-lg text-lg flex items-center justify-center transition cursor-pointer active:scale-95 ${
                    emoji === e && !imageUrl
                      ? "bg-indigo-100 dark:bg-indigo-950 border-2 border-indigo-500 scale-105"
                      : "bg-slate-50 hover:bg-slate-100 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Jersey Color Swatches */}
          <div>
            <div className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Jersey / Accent Color
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {JERSEY_COLORS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() =>
                    onChange({
                      imageUrl,
                      emoji,
                      colorHex: c.hex,
                    })
                  }
                  className={`w-7 h-7 rounded-full transition-transform cursor-pointer relative flex items-center justify-center ${
                    colorHex.toLowerCase() === c.hex.toLowerCase()
                      ? "ring-2 ring-offset-2 ring-indigo-500 scale-110"
                      : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                >
                  {colorHex.toLowerCase() === c.hex.toLowerCase() && (
                    <span className="w-2 h-2 rounded-full bg-white shadow-xs" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
