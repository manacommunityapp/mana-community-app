import React, { useState, useEffect } from "react";

export const COIN_HEADS_IMAGE = "/coin-heads.png";
export const COIN_TAILS_IMAGE = "/coin-tails.png";
export const LOCAL_COIN_TAILS_FALLBACK = "/coin-tails.png";

export interface TossCoin3DProps {
  isFlipping?: boolean;
  result?: "heads" | "tails" | null;
  onFlip?: () => void;
  sportType?: string;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  activeFace?: "heads" | "tails" | "auto";
  onFaceChange?: (face: "heads" | "tails") => void;
  className?: string;
}

export const getSportEmoji = (sport: string): string => {
  const s = sport.toUpperCase();
  if (s.includes("CRICKET")) return "🏏";
  if (s.includes("BADMINTON")) return "🏸";
  if (s.includes("TABLE_TENNIS") || s.includes("TABLE TENNIS") || s.includes("PING")) return "🏓";
  if (s.includes("PICKLEBALL")) return "🏓";
  if (s.includes("TENNIS")) return "🎾";
  if (s.includes("FOOTBALL") || s.includes("SOCCER") || s.includes("FUTSAL")) return "⚽";
  if (s.includes("BASKETBALL")) return "🏀";
  if (s.includes("VOLLEYBALL")) return "🏐";
  if (s.includes("KABADDI")) return "⚡";
  if (s.includes("HOCKEY")) return "🏑";
  return "🏆";
};

export function TossCoin3D({
  isFlipping = false,
  result = null,
  onFlip,
  sportType = "CRICKET",
  size = "md",
  interactive = true,
  activeFace = "auto",
  onFaceChange,
  className = "",
}: TossCoin3DProps) {
  const [internalFace, setInternalFace] = useState<"heads" | "tails">("heads");
  const [headsImageLoaded, setHeadsImageLoaded] = useState(true);
  const [tailsImageLoaded, setTailsImageLoaded] = useState(true);

  // Sync internal face when result or activeFace changes
  useEffect(() => {
    if (result) {
      setInternalFace(result);
    } else if (activeFace !== "auto") {
      setInternalFace(activeFace);
    }
  }, [result, activeFace]);

  const handleManualFaceToggle = (face: "heads" | "tails") => {
    if (isFlipping) return;
    setInternalFace(face);
    if (onFaceChange) onFaceChange(face);
  };

  const sportEmoji = getSportEmoji(sportType);

  // Dimension classes based on size
  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24 sm:w-28 sm:h-28",
    lg: "w-32 h-32 sm:w-36 sm:h-36",
  }[size];

  const emojiSize = {
    sm: "text-2xl",
    md: "text-4xl",
    lg: "text-5xl",
  }[size];

  // Rotation angles for 3D simulation
  // 0deg = Heads facing front, 180deg = Tails facing front
  const flipsEndsDeg = result === "tails" ? 1980 : result === "heads" ? 1800 : internalFace === "tails" ? 180 : 0;

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {/* 3D Perspective Container */}
      <div
        className={`relative ${sizeClasses} my-1 cursor-pointer select-none transition-transform active:scale-95`}
        style={{ perspective: "700px" }}
        onClick={interactive && onFlip && !isFlipping ? onFlip : undefined}
        title={interactive ? "Click to flip coin" : undefined}
        role="button"
        tabIndex={0}
      >
        <style>{`
          @keyframes toss-coin-3d-spin {
            0%   { transform: rotateY(0deg) translateY(0px) scale(1); }
            20%  { transform: rotateY(540deg) translateY(-28px) scale(1.12); }
            50%  { transform: rotateY(1080deg) translateY(-14px) scale(1.06); }
            75%  { transform: rotateY(1620deg) translateY(-6px) scale(1.02); }
            100% { transform: rotateY(${flipsEndsDeg}deg) translateY(0px) scale(1); }
          }
        `}</style>

        <div
          className="w-full h-full relative"
          style={{
            transformStyle: "preserve-3d",
            animation: isFlipping
              ? "toss-coin-3d-spin 1.5s cubic-bezier(0.25, 0.9, 0.4, 1) forwards"
              : "none",
            transform: !isFlipping ? `rotateY(${flipsEndsDeg}deg)` : undefined,
            transition: !isFlipping ? "transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)" : undefined,
          }}
        >
          {/* FRONT FACE: HEADS (Using Attached Official Coin Heads Asset) */}
          <div
            className="absolute inset-0 rounded-full flex flex-col items-center justify-center shadow-xl ring-4 ring-amber-500/30 overflow-hidden"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              background: "radial-gradient(circle at 35% 35%, #fef08a 0%, #f59e0b 55%, #b45309 100%)",
            }}
          >
            {headsImageLoaded ? (
              <img
                src={COIN_HEADS_IMAGE}
                alt="Heads side of the toss coin"
                className="absolute inset-0 h-full w-full rounded-full object-cover transition-opacity duration-300"
                onError={() => setHeadsImageLoaded(false)}
              />
            ) : (
              /* Fallback if heads image fails */
              <div className="text-center">
                <div className={`${emojiSize} leading-none`}>🪙</div>
                <div className="text-[10px] font-black text-amber-900 uppercase tracking-widest mt-0.5">
                  Heads
                </div>
              </div>
            )}

            {/* Sleek Heads Badge overlay */}
            <span className="absolute bottom-1.5 z-10 rounded-full bg-amber-950/75 px-2 py-0.5 text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-amber-200 shadow-sm backdrop-blur-xs">
              Heads
            </span>
          </div>

          {/* BACK FACE: TAILS (Using Attached Official Coin Tails Asset) */}
          <div
            className="absolute inset-0 rounded-full flex flex-col items-center justify-center shadow-xl ring-4 ring-slate-400/30 overflow-hidden"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              background: "radial-gradient(circle at 35% 35%, #e2e8f0 0%, #94a3b8 55%, #475569 100%)",
            }}
          >
            {tailsImageLoaded ? (
              <img
                src={COIN_TAILS_IMAGE}
                alt="Tails side of the toss coin"
                className="absolute inset-0 h-full w-full rounded-full object-cover transition-opacity duration-300"
                onError={() => setTailsImageLoaded(false)}
              />
            ) : (
              /* Fallback if all image assets fail */
              <div className="text-center">
                <div className={`${emojiSize} leading-none`}>🪙</div>
                <div className="text-[10px] font-black text-slate-800 uppercase tracking-widest mt-0.5">
                  Tails
                </div>
              </div>
            )}

            {/* Sleek Tails Badge overlay */}
            <span className="absolute bottom-1.5 z-10 rounded-full bg-slate-950/75 px-2 py-0.5 text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-white shadow-sm backdrop-blur-xs">
              Tails
            </span>
          </div>
        </div>
      </div>

      {/* Manual Face Preview Selector Chips */}
      <div className="mt-2 flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => handleManualFaceToggle("heads")}
          disabled={isFlipping}
          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider transition cursor-pointer ${
            internalFace === "heads"
              ? "bg-amber-500 text-slate-950 shadow-xs ring-1 ring-amber-600"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Heads
        </button>
        <button
          type="button"
          onClick={() => handleManualFaceToggle("tails")}
          disabled={isFlipping}
          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider transition cursor-pointer ${
            internalFace === "tails"
              ? "bg-slate-800 text-white shadow-xs ring-1 ring-slate-900"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Tails
        </button>
      </div>
    </div>
  );
}
