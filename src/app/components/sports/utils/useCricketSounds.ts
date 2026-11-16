import { useCallback, useRef } from "react";

type SoundType = "four" | "six" | "wicket" | "dot";

function beep(ctx: AudioContext, freq: number, dur: number, type: OscillatorType = "sine", vol = 0.3) {
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + dur);
  } catch {}
}

function playFour(ctx: AudioContext) {
  beep(ctx, 523, 0.12, "triangle", 0.25);
  setTimeout(() => beep(ctx, 659, 0.12, "triangle", 0.25), 100);
  setTimeout(() => beep(ctx, 784, 0.2,  "triangle", 0.3),  200);
}

function playSix(ctx: AudioContext) {
  beep(ctx, 523,  0.09, "triangle", 0.3);
  setTimeout(() => beep(ctx, 659,  0.09, "triangle", 0.3),  70);
  setTimeout(() => beep(ctx, 784,  0.09, "triangle", 0.3),  140);
  setTimeout(() => beep(ctx, 1047, 0.28, "triangle", 0.35), 210);
}

function playWicket(ctx: AudioContext) {
  beep(ctx, 784, 0.14, "sawtooth", 0.2);
  setTimeout(() => beep(ctx, 659, 0.14, "sawtooth", 0.18), 120);
  setTimeout(() => beep(ctx, 523, 0.14, "sawtooth", 0.15), 240);
  setTimeout(() => beep(ctx, 440, 0.32, "sawtooth", 0.12), 360);
}

function playDot(ctx: AudioContext) {
  beep(ctx, 330, 0.07, "square", 0.08);
}

export function useCricketSounds() {
  const ctxRef = useRef<AudioContext | null>(null);

  const getCtx = useCallback((): AudioContext | null => {
    try {
      if (!ctxRef.current || ctxRef.current.state === "closed") {
        ctxRef.current = new AudioContext();
      }
      if (ctxRef.current.state === "suspended") {
        ctxRef.current.resume().catch(() => {});
      }
      return ctxRef.current;
    } catch {
      return null;
    }
  }, []);

  const play = useCallback((type: SoundType) => {
    const ctx = getCtx();
    if (!ctx) return;
    if (type === "four")   playFour(ctx);
    else if (type === "six")    playSix(ctx);
    else if (type === "wicket") playWicket(ctx);
    else if (type === "dot")    playDot(ctx);
  }, [getCtx]);

  return { play };
}
