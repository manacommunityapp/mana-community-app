import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  LineChart, Line, ResponsiveContainer, Legend,
} from "recharts";
import { Activity, Target, TrendingUp, User, Zap, Medal, Trophy, BarChart2, Globe, MapPin, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { useState } from "react";

// ── Shared tooltip/axis styles (match SportsAnalytics) ─────────────────────
const TOOLTIP_STYLE = {
  background: "#12132d", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "14px",
  color: "#e8eaf6", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.5)", padding: "10px 14px",
};
const TOOLTIP_LABEL = { color: "#e8eaf6", fontWeight: 700, marginBottom: "4px" };
const AXIS_TICK = { fill: "#8b8fc8", fontSize: 11, fontWeight: 500 };

// ── Types ───────────────────────────────────────────────────────────────────
export interface BallEvent {
  over: number;
  ball: number;
  runs: number;
  isWicket: boolean;
  isWide: boolean;
  isNoBall: boolean;
  shotAngleDeg: number;   // 0=straight, 90=square off, -90=square leg
  shotDistance: number;   // 0–1 (0=infield, 1=boundary)
  pitchX: number;         // -1..1 (off=negative, leg=positive)
  pitchY: number;         // 0..1 (0=stumps, 1=batsman end, 0.3=good length)
}

export interface CricketMatchData {
  team1: string;
  team2: string;
  balls: BallEvent[];
  players: PlayerCareer[];
}

export interface PlayerCareer {
  name: string;
  matches: number;
  battingRuns: number;
  battingAvg: number;
  strikeRate: number;
  hundreds: number;
  fifties: number;
  wickets: number;
  bowlingAvg: number;
  economy: number;
}

// ── Demo data generator (used until live scoring API is wired) ──────────────
function seedRng(seed: number) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
}

export function generateDemoData(seed = 42): CricketMatchData {
  const rng = seedRng(seed);
  const balls: BallEvent[] = [];
  let over = 1;
  let ballInOver = 1;
  for (let i = 0; i < 120; i++) {
    const r = rng();
    const isWide = r < 0.04;
    const isNoBall = r > 0.96;
    const isWicket = !isWide && !isNoBall && rng() < 0.055;
    let runs = 0;
    if (!isWide && !isNoBall) {
      const p = rng();
      runs = p < 0.35 ? 0 : p < 0.60 ? 1 : p < 0.73 ? 2 : p < 0.82 ? 3 : p < 0.92 ? 4 : 6;
    } else {
      runs = 1;
    }
    const shotAngleDeg = (rng() * 180 - 90) * (isWicket ? 0.4 : 1);
    const shotDistance = isWicket ? rng() * 0.4 : runs >= 6 ? 1.0 : runs === 4 ? 0.85 + rng() * 0.15 : 0.2 + rng() * 0.55;
    const pitchX = (rng() * 0.5 - 0.25) * (over > 10 ? 1.3 : 1);
    const pitchY = rng() < 0.15 ? 0.1 + rng() * 0.1 : rng() < 0.5 ? 0.25 + rng() * 0.15 : rng() < 0.8 ? 0.45 + rng() * 0.2 : 0.65 + rng() * 0.2;
    balls.push({ over, ball: ballInOver, runs, isWicket, isWide, isNoBall, shotAngleDeg, shotDistance, pitchX, pitchY });
    if (!isWide && !isNoBall) {
      ballInOver++;
      if (ballInOver > 6) { over++; ballInOver = 1; }
    }
  }
  const players: PlayerCareer[] = [
    { name: "R. Sharma", matches: 34, battingRuns: 1420, battingAvg: 44.4, strikeRate: 138.2, hundreds: 3, fifties: 9, wickets: 0, bowlingAvg: 0, economy: 0 },
    { name: "V. Kohli", matches: 34, battingRuns: 1510, battingAvg: 50.3, strikeRate: 132.0, hundreds: 4, fifties: 11, wickets: 0, bowlingAvg: 0, economy: 0 },
    { name: "S. Gill", matches: 28, battingRuns: 920, battingAvg: 36.8, strikeRate: 142.1, hundreds: 2, fifties: 6, wickets: 0, bowlingAvg: 0, economy: 0 },
    { name: "J. Bumrah", matches: 34, battingRuns: 48, battingAvg: 8.0, strikeRate: 90.6, hundreds: 0, fifties: 0, wickets: 76, bowlingAvg: 18.4, economy: 6.2 },
    { name: "R. Ashwin", matches: 30, battingRuns: 310, battingAvg: 22.1, strikeRate: 115.2, hundreds: 0, fifties: 2, wickets: 55, bowlingAvg: 22.8, economy: 7.1 },
    { name: "H. Pandya", matches: 28, battingRuns: 580, battingAvg: 32.2, strikeRate: 148.7, hundreds: 0, fifties: 4, wickets: 32, bowlingAvg: 29.4, economy: 8.9 },
  ];
  return { team1: "Team Alpha", team2: "Team Beta", balls, players };
}

// ── Manhattan chart: runs per over ─────────────────────────────────────────
export function ManhattanChart({ balls, team1, team2 }: { balls: BallEvent[]; team1: string; team2: string }) {
  // Split at ~over 10 to simulate two innings view; first 10 overs = team1, rest = team2
  const innings1: Record<number, number> = {};
  const innings2: Record<number, number> = {};
  balls.forEach(b => {
    if (b.over <= 10) innings1[b.over] = (innings1[b.over] || 0) + b.runs;
    else innings2[b.over] = (innings2[b.over] || 0) + b.runs;
  });
  const overs = Array.from({ length: 20 }, (_, i) => i + 1);
  const data = overs.map(o => ({
    over: `${o}`,
    [team1]: innings1[o] ?? null,
    [team2]: innings2[o] ?? null,
  }));
  return (
    <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <div className="h-7 w-7 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center"><Activity className="h-3.5 w-3.5" /></div>
        <h3 className="text-xs font-bold text-foreground">Manhattan Chart</h3>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600">Runs per Over</span>
      </div>
      <p className="text-xs text-muted-foreground mb-4">Run rate progression — each bar shows runs scored in that over</p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} barGap={2} barCategoryGap="20%" margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.08)" vertical={false} />
          <XAxis dataKey="over" tick={AXIS_TICK} axisLine={false} tickLine={false} label={{ value: "Over", position: "insideBottom", offset: -2, fill: "#8b8fc8", fontSize: 10 }} />
          <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL} labelFormatter={(v) => `Over ${v}`} formatter={(val: any, name: string) => [val ?? "—", name]} />
          <Legend wrapperStyle={{ fontSize: "11px", color: "#8b8fc8", paddingTop: "8px" }} />
          <Bar dataKey={team1} fill="#6366f1" radius={[3, 3, 0, 0]} maxBarSize={18} />
          <Bar dataKey={team2} fill="#f59e0b" radius={[3, 3, 0, 0]} maxBarSize={18} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Worm chart: cumulative runs ─────────────────────────────────────────────
export function WormChart({ balls, team1, team2 }: { balls: BallEvent[]; team1: string; team2: string }) {
  const runsPerOver: Record<number, number> = {};
  balls.forEach(b => { runsPerOver[b.over] = (runsPerOver[b.over] || 0) + b.runs; });
  let cum1 = 0, cum2 = 0;
  const data = Array.from({ length: 20 }, (_, i) => {
    const o = i + 1;
    if (o <= 10) { cum1 += runsPerOver[o] ?? 0; return { over: `${o}`, [team1]: cum1, [team2]: null }; }
    else { cum2 += runsPerOver[o] ?? 0; return { over: `${o}`, [team1]: null, [team2]: cum2 }; }
  });
  return (
    <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center"><TrendingUp className="h-3.5 w-3.5" /></div>
        <h3 className="text-xs font-bold text-foreground">Worm Chart</h3>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">Cumulative Runs</span>
      </div>
      <p className="text-xs text-muted-foreground mb-4">Running total of runs — steeper slope = faster scoring rate</p>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.08)" vertical={false} />
          <XAxis dataKey="over" tick={AXIS_TICK} axisLine={false} tickLine={false} label={{ value: "Over", position: "insideBottom", offset: -2, fill: "#8b8fc8", fontSize: 10 }} />
          <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL} labelFormatter={(v) => `Over ${v}`} formatter={(val: any, name: string) => [val ?? "—", name]} />
          <Legend wrapperStyle={{ fontSize: "11px", color: "#8b8fc8", paddingTop: "8px" }} />
          <Line connectNulls dataKey={team1} stroke="#6366f1" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
          <Line connectNulls dataKey={team2} stroke="#f59e0b" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Wagon Wheel: shot placement SVG ─────────────────────────────────────────
const FIELD_LABELS = [
  { label: "Long On", angle: -20 }, { label: "Mid On", angle: -35 },
  { label: "Mid Off", angle: 35 }, { label: "Long Off", angle: 20 },
  { label: "Cover", angle: 55 }, { label: "Point", angle: 75 },
  { label: "Sq Leg", angle: -75 }, { label: "Fine Leg", angle: -95 },
  { label: "3rd Man", angle: 95 },
];

function shotColor(runs: number, isWicket: boolean) {
  if (isWicket) return "#ef4444";
  if (runs === 6) return "#7c3aed";
  if (runs === 4) return "#2563eb";
  if (runs >= 2) return "#059669";
  if (runs === 1) return "#ca8a04";
  return "#94a3b8";
}

export function WagonWheel({ balls }: { balls: BallEvent[] }) {
  const cx = 150, cy = 155, r = 115;
  const dots = balls.filter(b => !b.isWide).slice(0, 80).map((b, i) => {
    const angleRad = (b.shotAngleDeg * Math.PI) / 180;
    const dist = r * b.shotDistance * 0.95;
    return {
      x: cx + dist * Math.sin(angleRad),
      y: cy - dist * Math.cos(angleRad),
      color: shotColor(b.runs, b.isWicket),
      runs: b.runs,
      isWicket: b.isWicket,
      key: i,
    };
  });

  return (
    <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <div className="h-7 w-7 rounded-lg bg-violet-500/10 text-violet-500 flex items-center justify-center"><Target className="h-3.5 w-3.5" /></div>
        <h3 className="text-xs font-bold text-foreground">Wagon Wheel</h3>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-600">Shot Placement</span>
      </div>
      <p className="text-xs text-muted-foreground mb-3">Each dot = one delivery. Direction shows where shot was played.</p>
      <div className="flex justify-center">
        <svg viewBox="0 0 300 310" className="w-full max-w-[280px]" role="img" aria-label="Wagon wheel showing shot placement">
          {/* Outer oval */}
          <ellipse cx={cx} cy={cy} rx={r} ry={r * 0.72} fill="#166534" fillOpacity={0.08} stroke="#16a34a" strokeWidth={1.5} strokeOpacity={0.4} />
          {/* Inner circle (30-yard) */}
          <ellipse cx={cx} cy={cy} rx={r * 0.52} ry={r * 0.52 * 0.72} fill="none" stroke="#16a34a" strokeWidth={1} strokeDasharray="4 3" strokeOpacity={0.3} />
          {/* Pitch rectangle */}
          <rect x={cx - 7} y={cy - 28} width={14} height={56} fill="#ca8a04" fillOpacity={0.18} rx={2} />
          {/* Crease lines */}
          <line x1={cx - 10} y1={cy - 20} x2={cx + 10} y2={cy - 20} stroke="#fff" strokeWidth={1} strokeOpacity={0.5} />
          <line x1={cx - 10} y1={cy + 20} x2={cx + 10} y2={cy + 20} stroke="#fff" strokeWidth={1} strokeOpacity={0.5} />
          {/* Stump dots */}
          {[-4, 0, 4].map(ox => (
            <circle key={ox} cx={cx + ox} cy={cy + 20} r={1.5} fill="#fff" fillOpacity={0.7} />
          ))}
          {/* Sector lines from centre */}
          {[-90, -60, -30, 0, 30, 60, 90].map((angle) => {
            const rad = (angle * Math.PI) / 180;
            return (
              <line key={angle}
                x1={cx} y1={cy}
                x2={cx + r * Math.sin(rad)} y2={cy - r * Math.cos(rad) * 0.72}
                stroke="#94a3b8" strokeWidth={0.5} strokeOpacity={0.2}
              />
            );
          })}
          {/* Shot dots */}
          {dots.map(d => (
            <circle key={d.key} cx={d.x} cy={d.y} r={d.isWicket ? 4.5 : d.runs >= 4 ? 4 : 3}
              fill={d.color} fillOpacity={0.85}
              stroke={d.isWicket ? "#fef2f2" : d.runs >= 4 ? "#fff" : "none"}
              strokeWidth={d.isWicket || d.runs >= 4 ? 0.8 : 0}
            />
          ))}
          {/* Field position labels */}
          {FIELD_LABELS.map(({ label, angle }) => {
            const rad = (angle * Math.PI) / 180;
            const lx = cx + (r + 14) * Math.sin(rad);
            const ly = cy - (r + 14) * Math.cos(rad) * 0.72;
            return <text key={label} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fontSize="7" fill="#94a3b8" fontFamily="system-ui">{label}</text>;
          })}
        </svg>
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-3 justify-center text-[10px] text-muted-foreground font-medium">
        {[{ color: "#94a3b8", label: "Dot" }, { color: "#ca8a04", label: "1 run" }, { color: "#059669", label: "2–3" }, { color: "#2563eb", label: "4" }, { color: "#7c3aed", label: "6" }, { color: "#ef4444", label: "Wicket" }].map(l => (
          <span key={l.label} className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: l.color }} />{l.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Pitch Map: bowler landing zones ────────────────────────────────────────
function pitchDotColor(b: BallEvent) {
  if (b.isWicket) return "#ef4444";
  if (b.pitchY < 0.18) return "#7c3aed"; // yorker / full toss
  if (b.pitchY < 0.35) return "#2563eb"; // good length
  if (b.pitchY < 0.55) return "#059669"; // back of length
  return "#f59e0b"; // short / bouncer
}

export function PitchMap({ balls }: { balls: BallEvent[] }) {
  const W = 90, H = 220, px = 10; // pitch dimensions in SVG units
  const bowlingBalls = balls.filter(b => !b.isWide).slice(0, 80);
  return (
    <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <div className="h-7 w-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center"><Zap className="h-3.5 w-3.5" /></div>
        <h3 className="text-xs font-bold text-foreground">Pitch Map</h3>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600">Bowler Zones</span>
      </div>
      <p className="text-xs text-muted-foreground mb-3">Where the ball pitched — colored by delivery length</p>
      <div className="flex justify-center">
        <svg viewBox={`0 0 ${W + px * 2} ${H + px * 2}`} className="w-full max-w-[180px]" role="img" aria-label="Pitch map showing delivery landing zones">
          {/* Pitch background */}
          <rect x={px} y={px} width={W} height={H} fill="#854d0e" fillOpacity={0.12} rx={4} stroke="#ca8a04" strokeWidth={1} strokeOpacity={0.4} />
          {/* Zone bands */}
          {[
            { y: 0.0, h: 0.18, fill: "#7c3aed", label: "Yorker/Full" },
            { y: 0.18, h: 0.17, fill: "#2563eb", label: "Good length" },
            { y: 0.35, h: 0.20, fill: "#059669", label: "Back of length" },
            { y: 0.55, h: 0.45, fill: "#f59e0b", label: "Short pitch" },
          ].map(z => (
            <rect key={z.label} x={px} y={px + z.y * H} width={W} height={z.h * H}
              fill={z.fill} fillOpacity={0.07} />
          ))}
          {/* Crease lines */}
          <line x1={px} y1={px + 0.09 * H} x2={px + W} y2={px + 0.09 * H} stroke="#fff" strokeWidth={1} strokeOpacity={0.5} />
          <line x1={px} y1={px + 0.91 * H} x2={px + W} y2={px + 0.91 * H} stroke="#fff" strokeWidth={1} strokeOpacity={0.5} />
          {/* Stumps */}
          {[-8, 0, 8].map(ox => (
            <line key={ox} x1={px + W / 2 + ox} y1={px + 0.84 * H} x2={px + W / 2 + ox} y2={px + 0.93 * H}
              stroke="#e5e7eb" strokeWidth={2} strokeOpacity={0.7} />
          ))}
          {/* Zone labels */}
          {[
            { y: 0.09, label: "Yorker" },
            { y: 0.265, label: "Good length" },
            { y: 0.455, label: "Back of length" },
            { y: 0.70, label: "Short pitch" },
          ].map(z => (
            <text key={z.label} x={px + W / 2} y={px + z.y * H} textAnchor="middle" dominantBaseline="middle"
              fontSize="6.5" fill="#94a3b8" fontFamily="system-ui">{z.label}</text>
          ))}
          {/* Delivery dots */}
          {bowlingBalls.map((b, i) => {
            const dotX = px + W / 2 + b.pitchX * W * 0.42;
            const dotY = px + b.pitchY * H;
            return (
              <circle key={i} cx={dotX} cy={dotY} r={b.isWicket ? 4 : 2.8}
                fill={pitchDotColor(b)} fillOpacity={0.8}
                stroke={b.isWicket ? "#fef2f2" : "none"} strokeWidth={0.8}
              />
            );
          })}
        </svg>
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-2 justify-center text-[10px] text-muted-foreground font-medium">
        {[{ color: "#7c3aed", label: "Yorker/Full" }, { color: "#2563eb", label: "Good length" }, { color: "#059669", label: "Back of length" }, { color: "#f59e0b", label: "Short pitch" }, { color: "#ef4444", label: "Wicket" }].map(l => (
          <span key={l.label} className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: l.color }} />{l.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Player Career Stats ──────────────────────────────────────────────────────
export function PlayerCareerStats({ players }: { players: PlayerCareer[] }) {
  return (
    <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <div className="h-7 w-7 rounded-lg bg-pink-500/10 text-pink-500 flex items-center justify-center"><User className="h-3.5 w-3.5" /></div>
        <h3 className="text-xs font-bold text-foreground">Player Career Stats</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4">Career batting and bowling performance across all matches</p>

      {/* Batting */}
      <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Batting</h4>
      <div className="overflow-x-auto rounded-xl border border-border/60 mb-4">
        <table className="w-full min-w-[500px] text-left text-xs">
          <thead className="bg-muted/60 text-[10px] uppercase tracking-wide text-muted-foreground">
            <tr>
              {["Player", "M", "Runs", "Avg", "SR", "100s", "50s"].map(h => (
                <th key={h} className="px-3 py-2 font-bold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {players.sort((a, b) => b.battingRuns - a.battingRuns).map(p => (
              <tr key={p.name} className="hover:bg-muted/20">
                <td className="px-3 py-2 font-semibold text-foreground">{p.name}</td>
                <td className="px-3 py-2 text-muted-foreground">{p.matches}</td>
                <td className="px-3 py-2 font-bold text-primary">{p.battingRuns}</td>
                <td className="px-3 py-2">{p.battingAvg > 0 ? p.battingAvg.toFixed(1) : "—"}</td>
                <td className="px-3 py-2">{p.strikeRate > 0 ? p.strikeRate.toFixed(1) : "—"}</td>
                <td className="px-3 py-2 text-amber-600 font-bold">{p.hundreds || "—"}</td>
                <td className="px-3 py-2 text-emerald-600 font-bold">{p.fifties || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bowling */}
      <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Bowling</h4>
      <div className="overflow-x-auto rounded-xl border border-border/60">
        <table className="w-full min-w-[500px] text-left text-xs">
          <thead className="bg-muted/60 text-[10px] uppercase tracking-wide text-muted-foreground">
            <tr>
              {["Player", "M", "Wickets", "Avg", "Economy"].map(h => (
                <th key={h} className="px-3 py-2 font-bold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {players.filter(p => p.wickets > 0).sort((a, b) => b.wickets - a.wickets).map(p => (
              <tr key={p.name} className="hover:bg-muted/20">
                <td className="px-3 py-2 font-semibold text-foreground">{p.name}</td>
                <td className="px-3 py-2 text-muted-foreground">{p.matches}</td>
                <td className="px-3 py-2 font-bold text-primary">{p.wickets}</td>
                <td className="px-3 py-2">{p.bowlingAvg > 0 ? p.bowlingAvg.toFixed(1) : "—"}</td>
                <td className="px-3 py-2">{p.economy > 0 ? p.economy.toFixed(1) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Ranking / leaderboard types ─────────────────────────────────────────────
interface RankedPlayer {
  rank: number;
  prevRank: number;
  name: string;
  community: string;
  sport: string;
  score: number;
  matches: number;
  highlight?: boolean;
}

interface LeaderboardEntry {
  rank: number;
  name: string;
  team: string;
  runs?: number;
  avg?: number;
  sr?: number;
  wickets?: number;
  economy?: number;
  bowlAvg?: number;
  matches: number;
}

interface PerformanceIndex {
  name: string;
  battingIdx: number;
  bowlingIdx: number;
  allRounderIdx: number;
  matches: number;
}

// ── Demo data for new sections ───────────────────────────────────────────────
const LOCAL_RANKINGS: RankedPlayer[] = [
  { rank: 1, prevRank: 2, name: "V. Kohli",  community: "Block A", sport: "Cricket", score: 892, matches: 34 },
  { rank: 2, prevRank: 1, name: "R. Sharma", community: "Block B", sport: "Cricket", score: 874, matches: 34 },
  { rank: 3, prevRank: 3, name: "S. Gill",   community: "Block C", sport: "Cricket", score: 741, matches: 28 },
  { rank: 4, prevRank: 6, name: "H. Pandya", community: "Block A", sport: "Cricket", score: 698, matches: 28, highlight: true },
  { rank: 5, prevRank: 4, name: "R. Ashwin", community: "Block D", sport: "Cricket", score: 672, matches: 30 },
  { rank: 6, prevRank: 5, name: "J. Bumrah", community: "Block B", sport: "Cricket", score: 655, matches: 34 },
  { rank: 7, prevRank: 8, name: "K. Rahul",  community: "Block C", sport: "Cricket", score: 589, matches: 25 },
  { rank: 8, prevRank: 7, name: "Y. Singh",  community: "Block A", sport: "Cricket", score: 541, matches: 22 },
];

const GLOBAL_RANKINGS: RankedPlayer[] = [
  { rank: 1, prevRank: 1, name: "V. Kohli",        community: "Mana Community", sport: "Cricket", score: 1240, matches: 34 },
  { rank: 2, prevRank: 3, name: "S. Patel",        community: "Green Valley",   sport: "Cricket", score: 1198, matches: 41 },
  { rank: 3, prevRank: 2, name: "R. Sharma",       community: "Mana Community", sport: "Cricket", score: 1162, matches: 34 },
  { rank: 4, prevRank: 5, name: "A. Kumar",        community: "Sunrise Apt",    sport: "Cricket", score: 1055, matches: 38 },
  { rank: 5, prevRank: 4, name: "M. Ali",          community: "City Heights",   sport: "Cricket", score: 1032, matches: 36 },
  { rank: 6, prevRank: 7, name: "S. Gill",         community: "Mana Community", sport: "Cricket", score: 988,  matches: 28, highlight: true },
  { rank: 7, prevRank: 6, name: "P. Krishnaswamy", community: "Palm Grove",     sport: "Cricket", score: 971,  matches: 44 },
  { rank: 8, prevRank: 8, name: "D. Nair",         community: "River View",     sport: "Cricket", score: 944,  matches: 29 },
];

const BATTING_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, name: "V. Kohli",  team: "Team Alpha", runs: 1510, avg: 50.3, sr: 132.0, matches: 34 },
  { rank: 2, name: "R. Sharma", team: "Team Beta",  runs: 1420, avg: 44.4, sr: 138.2, matches: 34 },
  { rank: 3, name: "S. Gill",   team: "Team Alpha", runs: 920,  avg: 36.8, sr: 142.1, matches: 28 },
  { rank: 4, name: "H. Pandya", team: "Team Beta",  runs: 580,  avg: 32.2, sr: 148.7, matches: 28 },
  { rank: 5, name: "K. Rahul",  team: "Team Alpha", runs: 540,  avg: 30.0, sr: 125.6, matches: 25 },
];

const BOWLING_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, name: "J. Bumrah", team: "Team Alpha", wickets: 76, bowlAvg: 18.4, economy: 6.2, matches: 34 },
  { rank: 2, name: "R. Ashwin", team: "Team Beta",  wickets: 55, bowlAvg: 22.8, economy: 7.1, matches: 30 },
  { rank: 3, name: "H. Pandya", team: "Team Alpha", wickets: 32, bowlAvg: 29.4, economy: 8.9, matches: 28 },
  { rank: 4, name: "K. Yadav",  team: "Team Beta",  wickets: 28, bowlAvg: 25.2, economy: 7.6, matches: 24 },
  { rank: 5, name: "M. Shami",  team: "Team Alpha", wickets: 24, bowlAvg: 27.1, economy: 7.9, matches: 20 },
];

const PERFORMANCE_INDICES: PerformanceIndex[] = [
  { name: "V. Kohli",  battingIdx: 94, bowlingIdx: 2,  allRounderIdx: 48, matches: 34 },
  { name: "R. Sharma", battingIdx: 88, bowlingIdx: 3,  allRounderIdx: 46, matches: 34 },
  { name: "H. Pandya", battingIdx: 71, bowlingIdx: 58, allRounderIdx: 65, matches: 28 },
  { name: "R. Ashwin", battingIdx: 42, bowlingIdx: 79, allRounderIdx: 61, matches: 30 },
  { name: "J. Bumrah", battingIdx: 8,  bowlingIdx: 95, allRounderIdx: 52, matches: 34 },
  { name: "S. Gill",   battingIdx: 76, bowlingIdx: 4,  allRounderIdx: 40, matches: 28 },
];

// ── Small helpers ────────────────────────────────────────────────────────────
function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-400/20 text-amber-500 text-[10px] font-black">1</span>;
  if (rank === 2) return <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-400/20 text-slate-500 text-[10px] font-black">2</span>;
  if (rank === 3) return <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-400/20 text-orange-600 text-[10px] font-black">3</span>;
  return <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-muted text-muted-foreground text-[10px] font-bold">{rank}</span>;
}

function RankDelta({ curr, prev }: { curr: number; prev: number }) {
  const delta = prev - curr;
  if (delta > 0) return <span className="flex items-center gap-0.5 text-emerald-600 text-[9px] font-bold"><ArrowUp className="w-2.5 h-2.5" />{delta}</span>;
  if (delta < 0) return <span className="flex items-center gap-0.5 text-red-500 text-[9px] font-bold"><ArrowDown className="w-2.5 h-2.5" />{Math.abs(delta)}</span>;
  return <span className="text-muted-foreground"><Minus className="w-2.5 h-2.5" /></span>;
}

function IndexBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="flex-1 h-1.5 rounded-full bg-muted/60 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="text-[10px] font-bold w-6 text-right" style={{ color }}>{value}</span>
    </div>
  );
}

// ── Global / Local Rankings ──────────────────────────────────────────────────
export function PlayerRankings() {
  const [scope, setScope] = useState<"local" | "global">("local");
  const rows = scope === "local" ? LOCAL_RANKINGS : GLOBAL_RANKINGS;

  return (
    <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-1 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center"><Medal className="h-3.5 w-3.5" /></div>
          <h3 className="text-xs font-bold text-foreground">Player Rankings</h3>
        </div>
        <div className="flex rounded-xl overflow-hidden border border-border text-[10px] font-bold">
          <button onClick={() => setScope("local")}
            className={`flex items-center gap-1 px-3 py-1.5 transition ${scope === "local" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted"}`}>
            <MapPin className="w-2.5 h-2.5" />Local
          </button>
          <button onClick={() => setScope("global")}
            className={`flex items-center gap-1 px-3 py-1.5 transition ${scope === "global" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted"}`}>
            <Globe className="w-2.5 h-2.5" />Global
          </button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        {scope === "local" ? "Top players within your community this season" : "Top players across all registered communities"}
      </p>
      <div className="space-y-1.5">
        {rows.map(p => (
          <div key={p.name} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${p.highlight ? "bg-primary/5 border border-primary/20" : "hover:bg-muted/30"}`}>
            <RankBadge rank={p.rank} />
            <div className="w-8"><RankDelta curr={p.rank} prev={p.prevRank} /></div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-bold truncate ${p.highlight ? "text-primary" : "text-foreground"}`}>
                {p.name}{p.highlight && <span className="ml-1.5 text-[9px] font-semibold text-primary/70">you</span>}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">{p.community}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-black text-foreground">{p.score.toLocaleString()}</p>
              <p className="text-[9px] text-muted-foreground">{p.matches}M · pts</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Tournament Leaderboard ───────────────────────────────────────────────────
export function TournamentLeaderboard() {
  const [tab, setTab] = useState<"batting" | "bowling">("batting");

  return (
    <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <div className="h-7 w-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center"><Trophy className="h-3.5 w-3.5" /></div>
        <h3 className="text-xs font-bold text-foreground">Tournament Leaderboard</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4">Top performers in the current tournament</p>

      <div className="flex rounded-xl overflow-hidden border border-border text-[10px] font-bold mb-4 w-fit">
        <button onClick={() => setTab("batting")}
          className={`px-4 py-1.5 transition ${tab === "batting" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted"}`}>
          Batting
        </button>
        <button onClick={() => setTab("bowling")}
          className={`px-4 py-1.5 transition ${tab === "bowling" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted"}`}>
          Bowling
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border/60">
        {tab === "batting" ? (
          <table className="w-full min-w-[420px] text-left text-xs">
            <thead className="bg-muted/60 text-[10px] uppercase tracking-wide text-muted-foreground">
              <tr>{["#", "Player", "Team", "Runs", "Avg", "SR", "M"].map(h => <th key={h} className="px-3 py-2 font-bold">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {BATTING_LEADERBOARD.map(r => (
                <tr key={r.name} className="hover:bg-muted/20">
                  <td className="px-3 py-2.5"><RankBadge rank={r.rank} /></td>
                  <td className="px-3 py-2.5 font-semibold text-foreground">{r.name}</td>
                  <td className="px-3 py-2.5 text-muted-foreground text-[10px]">{r.team}</td>
                  <td className="px-3 py-2.5 font-black text-primary">{r.runs}</td>
                  <td className="px-3 py-2.5">{r.avg?.toFixed(1)}</td>
                  <td className="px-3 py-2.5">{r.sr?.toFixed(1)}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{r.matches}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full min-w-[420px] text-left text-xs">
            <thead className="bg-muted/60 text-[10px] uppercase tracking-wide text-muted-foreground">
              <tr>{["#", "Player", "Team", "Wkts", "Avg", "Econ", "M"].map(h => <th key={h} className="px-3 py-2 font-bold">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {BOWLING_LEADERBOARD.map(r => (
                <tr key={r.name} className="hover:bg-muted/20">
                  <td className="px-3 py-2.5"><RankBadge rank={r.rank} /></td>
                  <td className="px-3 py-2.5 font-semibold text-foreground">{r.name}</td>
                  <td className="px-3 py-2.5 text-muted-foreground text-[10px]">{r.team}</td>
                  <td className="px-3 py-2.5 font-black text-primary">{r.wickets}</td>
                  <td className="px-3 py-2.5">{r.bowlAvg?.toFixed(1)}</td>
                  <td className="px-3 py-2.5">{r.economy?.toFixed(1)}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{r.matches}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ── Performance Index ────────────────────────────────────────────────────────
export function PerformanceIndices() {
  const [view, setView] = useState<"batting" | "bowling" | "allrounder">("allrounder");

  const sorted = [...PERFORMANCE_INDICES].sort((a, b) => {
    if (view === "batting")   return b.battingIdx - a.battingIdx;
    if (view === "bowling")   return b.bowlingIdx - a.bowlingIdx;
    return b.allRounderIdx - a.allRounderIdx;
  });

  const barData = sorted.map(p => ({
    name: p.name.split(".")[1]?.trim() ?? p.name,
    Batting: p.battingIdx,
    Bowling: p.bowlingIdx,
    "All-round": p.allRounderIdx,
  }));

  return (
    <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-1 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-cyan-500/10 text-cyan-500 flex items-center justify-center"><BarChart2 className="h-3.5 w-3.5" /></div>
          <h3 className="text-xs font-bold text-foreground">Performance Index</h3>
        </div>
        <div className="flex rounded-xl overflow-hidden border border-border text-[10px] font-bold">
          {(["batting", "bowling", "allrounder"] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-3 py-1.5 capitalize transition ${view === v ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted"}`}>
              {v === "allrounder" ? "All-round" : v}
            </button>
          ))}
        </div>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Composite 0–100 index combining runs, strike rate, wickets & economy
      </p>

      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={barData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }} barCategoryGap="20%">
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.08)" vertical={false} />
          <XAxis dataKey="name" tick={AXIS_TICK} axisLine={false} tickLine={false} />
          <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} domain={[0, 100]} />
          <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL} />
          {view === "allrounder" ? (
            <>
              <Bar dataKey="Batting"   fill="#6366f1" radius={[3,3,0,0]} maxBarSize={16} />
              <Bar dataKey="Bowling"   fill="#06b6d4" radius={[3,3,0,0]} maxBarSize={16} />
              <Bar dataKey="All-round" fill="#f59e0b" radius={[3,3,0,0]} maxBarSize={16} />
              <Legend wrapperStyle={{ fontSize: "11px", color: "#8b8fc8", paddingTop: "8px" }} />
            </>
          ) : view === "batting" ? (
            <Bar dataKey="Batting" fill="#6366f1" radius={[3,3,0,0]} maxBarSize={28} />
          ) : (
            <Bar dataKey="Bowling" fill="#06b6d4" radius={[3,3,0,0]} maxBarSize={28} />
          )}
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-4 space-y-3">
        {sorted.map(p => (
          <div key={p.name} className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 items-center">
            <p className="text-xs font-semibold text-foreground col-span-2 mb-0.5">
              {p.name} <span className="text-[10px] text-muted-foreground font-normal">· {p.matches}M</span>
            </p>
            <span className="text-[10px] text-muted-foreground">Batting</span>
            <IndexBar value={p.battingIdx} color="#6366f1" />
            <span className="text-[10px] text-muted-foreground">Bowling</span>
            <IndexBar value={p.bowlingIdx} color="#06b6d4" />
            <span className="text-[10px] text-muted-foreground">All-round</span>
            <IndexBar value={p.allRounderIdx} color="#f59e0b" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main exported section ────────────────────────────────────────────────────
export function CricketAnalyticsSection() {
  const demo = generateDemoData(42);
  return (
    <section className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            🏏 Cricket Analytics
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Advanced match visualizations — connect to live scoring for real match data
          </p>
        </div>
        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 border border-amber-200/60">
          Demo data
        </span>
      </div>

      {/* Rankings + Leaderboard side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <PlayerRankings />
        <TournamentLeaderboard />
      </div>

      {/* Performance Index full width */}
      <PerformanceIndices />

      {/* Manhattan + Worm side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ManhattanChart balls={demo.balls} team1={demo.team1} team2={demo.team2} />
        <WormChart balls={demo.balls} team1={demo.team1} team2={demo.team2} />
      </div>

      {/* Wagon Wheel + Pitch Map side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <WagonWheel balls={demo.balls} />
        <PitchMap balls={demo.balls} />
      </div>

      {/* Player Career Stats full width */}
      <PlayerCareerStats players={demo.players} />
    </section>
  );
}
