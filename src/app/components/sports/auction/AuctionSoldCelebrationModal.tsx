import React, { useEffect, useRef } from 'react';
import { Gavel, Sparkles, Trophy, X, Crown, CheckCircle2 } from 'lucide-react';
import { auctionAudio } from './AuctionAudioEffects';

interface AuctionSoldCelebrationModalProps {
  playerName: string;
  playerRole?: string;
  category?: string;
  soldPrice: number;
  teamName: string;
  teamEmoji?: string;
  teamColor?: string;
  onClose: () => void;
}

export const AuctionSoldCelebrationModal: React.FC<AuctionSoldCelebrationModalProps> = ({
  playerName,
  playerRole = 'Player',
  category,
  soldPrice,
  teamName,
  teamEmoji = '🏆',
  teamColor = '#f59e0b',
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Play hammer sold sound and fire confetti particles on mount
  useEffect(() => {
    auctionAudio.playHammerSold();

    // Auto-dismiss after 4.5 seconds
    const dismissTimer = setTimeout(() => {
      onClose();
    }, 4500);

    // Canvas Confetti Particles Simulation
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = [teamColor, '#f59e0b', '#10b981', '#6366f1', '#ec4899', '#ffffff'];
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      rotation: number;
      rotationSpeed: number;
      alpha: number;
    }> = [];

    // Spawn 120 confetti particles from center/top
    for (let i = 0; i < 120; i++) {
      particles.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * 200,
        y: canvas.height * 0.35 + (Math.random() - 0.5) * 100,
        vx: (Math.random() - 0.5) * 16,
        vy: (Math.random() - 1.2) * 14 - 3,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2,
        alpha: 1,
      });
    }

    let animationFrameId: number;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let activeCount = 0;

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.35; // gravity
        p.vx *= 0.98; // air resistance
        p.rotation += p.rotationSpeed;
        p.alpha -= 0.005;

        if (p.alpha > 0) {
          activeCount++;
          ctx.save();
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
          ctx.restore();
        }
      });

      if (activeCount > 0) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      clearTimeout(dismissTimer);
      cancelAnimationFrame(animationFrameId);
    };
  }, [teamColor, onClose]);

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300"
      onClick={onClose}
    >
      {/* Canvas Confetti Layer */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-10 w-full h-full"
      />

      {/* Celebration Spotlight Card */}
      <div
        className="relative z-20 max-w-lg w-full bg-slate-950 text-white rounded-3xl p-6 sm:p-8 text-center border-2 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 space-y-6 select-none"
        style={{
          borderColor: teamColor,
          boxShadow: `0 0 80px ${teamColor}55`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-3xl opacity-35 pointer-events-none"
          style={{ background: teamColor }}
        />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hammer Strike Marquee */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-600/30 border border-red-500/50 text-red-400 text-xs font-black uppercase tracking-widest animate-pulse">
            <Gavel className="w-4 h-4 text-amber-400 rotate-12" />
            <span>HAMMER DOWN • SOLD!</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white uppercase drop-shadow-md">
            {playerName}
          </h2>
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-300">
            <span>{playerRole}</span>
            {category && <span>• {category}</span>}
          </div>
        </div>

        {/* Final Price Callout Box */}
        <div
          className="py-4 px-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 space-y-1"
        >
          <span className="text-[11px] uppercase font-bold text-amber-300 tracking-wider">
            Final Winning Bid
          </span>
          <div className="text-3xl sm:text-4xl font-black text-white tracking-tight" style={{ color: teamColor }}>
            ₹{soldPrice.toLocaleString('en-IN')}
          </div>
        </div>

        {/* Winning Franchise Badge */}
        <div
          className="p-4 rounded-2xl flex items-center justify-center gap-3 border shadow-inner"
          style={{
            background: `linear-gradient(135deg, ${teamColor}33, #0f172a)`,
            borderColor: `${teamColor}66`,
          }}
        >
          <span className="text-3xl">{teamEmoji}</span>
          <div className="text-left min-w-0">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Acquired By Franchise
            </span>
            <strong className="text-base sm:text-lg font-black text-white truncate block">
              {teamName}
            </strong>
          </div>
        </div>

        {/* Dismiss prompt */}
        <p className="text-[11px] text-slate-400 animate-pulse">
          Click anywhere or wait to continue next player draft
        </p>
      </div>
    </div>
  );
};
