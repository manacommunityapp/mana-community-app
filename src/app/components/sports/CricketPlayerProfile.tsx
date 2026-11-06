import { useState } from "react";
import {
  ShieldCheck, X, Trophy, Star, Zap, TrendingUp,
  MapPin, Calendar, Award, ChevronRight,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────
export type PlayerRole = "Batsman" | "Bowler" | "All-rounder" | "WK-Batsman";
export type BatHand  = "Right-hand bat" | "Left-hand bat";
export type BowlArm  = "Right-arm" | "Left-arm";
export type BowlStyle = "Fast" | "Medium-fast" | "Off-spin" | "Leg-spin" | "Slow left-arm";

export interface CricketPlayerDetail {
  id: string;
  name: string;
  community: string;
  role: PlayerRole;
  batHand: BatHand;
  bowlArm?: BowlArm;
  bowlStyle?: BowlStyle;
  verified: boolean;
  rank: number;
  rankScope: "Local" | "Global";
  since: string; // "2022"
  batting: {
    matches: number; innings: number; notOuts: number;
    runs: number; highScore: number; avg: number; sr: number;
    hundreds: number; fifties: number; fours: number; sixes: number;
  };
  bowling: {
    overs: number; wickets: number; runs: number;
    avg: number; economy: number; sr: number;
    fiveWickets: number; best: string;
  } | null;
  milestones: Milestone[];
}

export interface Milestone {
  label: string;
  date: string;
  icon: "runs" | "wickets" | "century" | "fifty" | "hattrick" | "five-for" | "debut" | "mvp";
  highlight?: boolean;
}

// ── Demo player catalogue ────────────────────────────────────────────────────
export const PLAYER_PROFILES: Record<string, CricketPlayerDetail> = {
  "V. Kohli": {
    id: "vk18", name: "V. Kohli", community: "Block A", role: "Batsman",
    batHand: "Right-hand bat", verified: true, rank: 1, rankScope: "Local", since: "2021",
    batting: { matches: 34, innings: 32, notOuts: 4, runs: 1510, highScore: 112, avg: 53.9, sr: 132.0, hundreds: 4, fifties: 11, fours: 142, sixes: 38 },
    bowling: null,
    milestones: [
      { label: "Debut", date: "Mar 2021", icon: "debut" },
      { label: "First fifty", date: "Apr 2021", icon: "fifty" },
      { label: "First century", date: "Sep 2021", icon: "century", highlight: true },
      { label: "500 runs", date: "Jan 2022", icon: "runs" },
      { label: "1000 runs", date: "Nov 2022", icon: "runs", highlight: true },
      { label: "Season MVP", date: "Mar 2023", icon: "mvp", highlight: true },
      { label: "1500 runs", date: "Oct 2024", icon: "runs", highlight: true },
    ],
  },
  "R. Sharma": {
    id: "rs45", name: "R. Sharma", community: "Block B", role: "Batsman",
    batHand: "Right-hand bat", verified: true, rank: 2, rankScope: "Local", since: "2021",
    batting: { matches: 34, innings: 33, notOuts: 1, runs: 1420, highScore: 98, avg: 44.4, sr: 138.2, hundreds: 3, fifties: 9, fours: 128, sixes: 52 },
    bowling: null,
    milestones: [
      { label: "Debut", date: "Mar 2021", icon: "debut" },
      { label: "First fifty", date: "May 2021", icon: "fifty" },
      { label: "First century", date: "Dec 2021", icon: "century", highlight: true },
      { label: "500 runs", date: "Mar 2022", icon: "runs" },
      { label: "1000 runs", date: "Feb 2023", icon: "runs", highlight: true },
    ],
  },
  "J. Bumrah": {
    id: "jb93", name: "J. Bumrah", community: "Block B", role: "Bowler",
    batHand: "Right-hand bat", bowlArm: "Right-arm", bowlStyle: "Fast", verified: true, rank: 6, rankScope: "Local", since: "2022",
    batting: { matches: 34, innings: 18, notOuts: 10, runs: 48, highScore: 12, avg: 6.0, sr: 90.6, hundreds: 0, fifties: 0, fours: 4, sixes: 1 },
    bowling: { overs: 112, wickets: 76, runs: 694, avg: 18.4, economy: 6.2, sr: 17.6, fiveWickets: 4, best: "5/18" },
    milestones: [
      { label: "Debut", date: "Jan 2022", icon: "debut" },
      { label: "First wicket", date: "Jan 2022", icon: "wickets" },
      { label: "First 5-for", date: "Apr 2022", icon: "five-for", highlight: true },
      { label: "50 wickets", date: "Mar 2023", icon: "wickets", highlight: true },
      { label: "Best figures 5/18", date: "Sep 2023", icon: "five-for", highlight: true },
    ],
  },
  "H. Pandya": {
    id: "hp11", name: "H. Pandya", community: "Block A", role: "All-rounder",
    batHand: "Right-hand bat", bowlArm: "Right-arm", bowlStyle: "Medium-fast", verified: false, rank: 4, rankScope: "Local", since: "2022",
    batting: { matches: 28, innings: 24, notOuts: 6, runs: 580, highScore: 76, avg: 32.2, sr: 148.7, hundreds: 0, fifties: 4, fours: 44, sixes: 28 },
    bowling: { overs: 68, wickets: 32, runs: 604, avg: 29.4, economy: 8.9, sr: 19.8, fiveWickets: 0, best: "3/22" },
    milestones: [
      { label: "Debut", date: "Apr 2022", icon: "debut" },
      { label: "First fifty", date: "Jun 2022", icon: "fifty" },
      { label: "First 3-for", date: "Aug 2022", icon: "wickets" },
      { label: "Match-winning all-round", date: "Nov 2023", icon: "mvp", highlight: true },
    ],
  },
  "R. Ashwin": {
    id: "ra99", name: "R. Ashwin", community: "Block D", role: "All-rounder",
    batHand: "Right-hand bat", bowlArm: "Right-arm", bowlStyle: "Off-spin", verified: true, rank: 5, rankScope: "Local", since: "2021",
    batting: { matches: 30, innings: 22, notOuts: 8, runs: 310, highScore: 48, avg: 22.1, sr: 115.2, hundreds: 0, fifties: 2, fours: 28, sixes: 10 },
    bowling: { overs: 94, wickets: 55, runs: 667, avg: 22.8, economy: 7.1, sr: 19.3, fiveWickets: 2, best: "5/24" },
    milestones: [
      { label: "Debut", date: "Mar 2021", icon: "debut" },
      { label: "First 5-for", date: "Oct 2021", icon: "five-for", highlight: true },
      { label: "50 wickets", date: "Dec 2023", icon: "wickets", highlight: true },
    ],
  },
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const ROLE_COLOR: Record<PlayerRole, string> = {
  "Batsman":    "bg-blue-500/15 text-blue-600 border-blue-200/60",
  "Bowler":     "bg-emerald-500/15 text-emerald-700 border-emerald-200/60",
  "All-rounder":"bg-violet-500/15 text-violet-700 border-violet-200/60",
  "WK-Batsman": "bg-amber-500/15 text-amber-700 border-amber-200/60",
};

const AVATAR_COLOR: Record<PlayerRole, string> = {
  "Batsman":    "from-blue-500 to-indigo-600",
  "Bowler":     "from-emerald-500 to-teal-600",
  "All-rounder":"from-violet-500 to-purple-600",
  "WK-Batsman": "from-amber-500 to-orange-600",
};

const MILESTONE_ICON: Record<Milestone["icon"], string> = {
  debut: "🏏", runs: "🔢", wickets: "🎯", century: "💯",
  fifty: "⭐", hattrick: "🎩", "five-for": "🔥", mvp: "🏆",
};

function initials(name: string) {
  return name.split(" ").map(p => p[0]).join("").toUpperCase().slice(0, 2);
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-muted/40 rounded-xl px-3 py-2.5 text-center">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="text-sm font-black text-foreground mt-0.5">{value}</p>
      {sub && <p className="text-[9px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

// ── Profile modal ─────────────────────────────────────────────────────────────
export function CricketPlayerProfileModal({
  player, onClose,
}: { player: CricketPlayerDetail; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-slate-950/60 p-0 sm:p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto bg-card border border-border rounded-t-3xl sm:rounded-2xl shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="relative px-5 pt-4 pb-5 border-b border-border/60">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className={`relative flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br ${AVATAR_COLOR[player.role]} flex items-center justify-center shadow-lg`}>
              <span className="text-lg font-black text-white">{initials(player.name)}</span>
              {player.verified && (
                <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-blue-500 border-2 border-card flex items-center justify-center shadow-sm"
                  title="Verified player — identity confirmed by community admin">
                  <ShieldCheck className="w-3 h-3 text-white" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-black text-foreground">{player.name}</h2>
                {player.verified && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 border border-blue-200/60">
                    <ShieldCheck className="w-2.5 h-2.5" />Verified
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${ROLE_COLOR[player.role]}`}>
                  {player.role}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
                  <MapPin className="w-2.5 h-2.5" />{player.community}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
                  <Calendar className="w-2.5 h-2.5" />Since {player.since}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600">
                  <Trophy className="w-2.5 h-2.5" />#{player.rank} {player.rankScope}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5">
                {player.batHand}{player.bowlArm ? ` · ${player.bowlArm} ${player.bowlStyle ?? ""}` : ""}
              </p>
            </div>
          </div>

          {!player.verified && (
            <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/50 border border-dashed border-border text-[10px] text-muted-foreground">
              <ShieldCheck className="w-3 h-3 flex-shrink-0" />
              Player identity not yet verified. Community admin can issue a Verified badge.
            </div>
          )}
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-5">

          {/* Batting stats */}
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
              <TrendingUp className="w-3 h-3" />Batting
            </h4>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              <StatCard label="M"   value={player.batting.matches} />
              <StatCard label="Inn" value={player.batting.innings} />
              <StatCard label="Runs" value={player.batting.runs.toLocaleString()} />
              <StatCard label="HS"  value={player.batting.highScore} />
              <StatCard label="Avg" value={player.batting.avg.toFixed(1)} />
              <StatCard label="SR"  value={player.batting.sr.toFixed(1)} />
              <StatCard label="100s" value={player.batting.hundreds} />
              <StatCard label="50s"  value={player.batting.fifties} />
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <StatCard label="Fours" value={player.batting.fours} sub="boundaries" />
              <StatCard label="Sixes" value={player.batting.sixes} sub="maximums" />
            </div>
          </div>

          {/* Bowling stats */}
          {player.bowling && (
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
                <Zap className="w-3 h-3" />Bowling
              </h4>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                <StatCard label="Overs" value={player.bowling.overs} />
                <StatCard label="Wkts"  value={player.bowling.wickets} />
                <StatCard label="Runs"  value={player.bowling.runs} />
                <StatCard label="Avg"   value={player.bowling.avg.toFixed(1)} />
                <StatCard label="Econ"  value={player.bowling.economy.toFixed(1)} />
                <StatCard label="SR"    value={player.bowling.sr.toFixed(1)} />
                <StatCard label="5W"    value={player.bowling.fiveWickets} />
                <StatCard label="Best"  value={player.bowling.best} />
              </div>
            </div>
          )}

          {/* Milestones */}
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
              <Award className="w-3 h-3" />Career Milestones
            </h4>
            <div className="relative pl-4">
              {/* Timeline line */}
              <div className="absolute left-1.5 top-2 bottom-2 w-px bg-border/60" />

              <div className="space-y-3">
                {player.milestones.map((m, i) => (
                  <div key={i} className="relative flex items-start gap-3">
                    {/* Dot */}
                    <div className={`absolute -left-[11px] top-1 w-3 h-3 rounded-full border-2 border-card flex-shrink-0 ${m.highlight ? "bg-primary" : "bg-muted-foreground/40"}`} />

                    <div className={`flex-1 flex items-center justify-between gap-2 px-3 py-2 rounded-xl transition ${m.highlight ? "bg-primary/5 border border-primary/20" : "bg-muted/30"}`}>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm">{MILESTONE_ICON[m.icon]}</span>
                        <span className={`text-xs font-semibold truncate ${m.highlight ? "text-primary" : "text-foreground"}`}>{m.label}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-medium flex-shrink-0">{m.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// ── Trigger hook: returns [open fn, modal JSX] ───────────────────────────────
export function useCricketPlayerProfile() {
  const [active, setActive] = useState<CricketPlayerDetail | null>(null);

  const open = (name: string) => {
    const p = PLAYER_PROFILES[name];
    if (p) setActive(p);
  };

  const modal = active ? (
    <CricketPlayerProfileModal player={active} onClose={() => setActive(null)} />
  ) : null;

  return { open, modal };
}
