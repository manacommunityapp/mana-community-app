import React, { useRef, useEffect } from "react";

interface ConfettiCanvasProps {
  primaryColor?: string;
  secondaryColor?: string;
  durationMs?: number;
  onComplete?: () => void;
  className?: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  tilt: number;
  tiltAngle: number;
  tiltAngleIncrement: number;
  opacity: number;
  shape: "rect" | "circle";
}

export function ConfettiCanvas({
  primaryColor = "#10b981",
  secondaryColor = "#fbbf24",
  durationMs = 6000,
  onComplete,
  className = "fixed inset-0 pointer-events-auto z-[80]",
}: ConfettiCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let isRunning = true;
    const startTime = performance.now();

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Color palette incorporating winning team colors + metallic golds
    const palette = [
      primaryColor,
      secondaryColor,
      "#ffffff",
      "#f59e0b",
      "#6366f1",
      "#ec4899",
      "#38bdf8",
      "#10b981",
    ];

    const particles: Particle[] = [];

    const createParticle = (x?: number, y?: number): Particle => {
      const angle = (Math.random() * Math.PI) - (Math.PI / 2); // mostly upwards
      const speed = Math.random() * 12 + 6;
      return {
        x: x ?? Math.random() * canvas.width,
        y: y ?? (Math.random() * 0.4 + 0.6) * canvas.height,
        vx: Math.cos(angle) * speed * (Math.random() > 0.5 ? 1 : -1),
        vy: -Math.abs(Math.sin(angle) * speed) - 4,
        size: Math.random() * 8 + 6,
        color: palette[Math.floor(Math.random() * palette.length)],
        tilt: Math.random() * 10 - 10,
        tiltAngle: Math.random() * Math.PI,
        tiltAngleIncrement: Math.random() * 0.08 + 0.04,
        opacity: 1,
        shape: Math.random() > 0.3 ? "rect" : "circle",
      };
    };

    // Initial burst of 160 particles
    for (let i = 0; i < 160; i++) {
      particles.push(createParticle());
    }

    // Interactive burst on click or tap
    const handleClick = (e: MouseEvent | TouchEvent) => {
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      for (let i = 0; i < 45; i++) {
        const p = createParticle(clientX, clientY);
        const speed = Math.random() * 14 + 4;
        const angle = Math.random() * Math.PI * 2;
        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed - 3;
        particles.push(p);
      }
    };

    canvas.addEventListener("click", handleClick);
    canvas.addEventListener("touchstart", handleClick, { passive: true });

    const render = (currentTime: number) => {
      if (!isRunning) return;
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / durationMs);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.vy += 0.22; // gravity
        p.vx *= 0.99; // drag
        p.x += p.vx;
        p.y += p.vy;
        p.tiltAngle += p.tiltAngleIncrement;
        p.tilt = Math.sin(p.tiltAngle) * 12;

        if (progress > 0.65) {
          p.opacity = Math.max(0, 1 - (progress - 0.65) / 0.35);
        }

        if (p.opacity <= 0 || p.y > canvas.height + 20) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;

        if (p.shape === "circle") {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.tiltAngle);
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        }
        ctx.restore();
      }

      if (particles.length > 0 && progress < 1) {
        animationFrameId = requestAnimationFrame(render);
      } else {
        isRunning = false;
        onComplete?.();
      }
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("click", handleClick);
      canvas.removeEventListener("touchstart", handleClick);
    };
  }, [primaryColor, secondaryColor, durationMs, onComplete]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ pointerEvents: "auto", cursor: "pointer" }}
      title="Tap anywhere for more celebration confetti!"
    />
  );
}
