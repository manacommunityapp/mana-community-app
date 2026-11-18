import React from "react";
import {
  Trophy,
  Target,
  ArrowRight,
  Undo2,
  Share2,
  X,
  Coffee,
  Sparkles,
  Flame,
  ShieldCheck,
} from "lucide-react";
import type { LiveMatchStateData } from "../../../services/sports/tournamentService";
import { remainingBalls, requiredRunRate } from "./utils/cricketUtils";

interface InningsBreakDashboardProps {
  state: LiveMatchStateData;
  teamAName?: string;
  teamBName?: string;
  oversLimit?: number;
  onStartSecondInnings: () => void;
  onFixInnings1: () => void;
  onShareCard: () => void;
  onClose: () => void;
}

export function InningsBreakDashboard({
  state,
  teamAName,
  teamBName,
  oversLimit = 20,
  onStartSecondInnings,
  onFixInnings1,
  onShareCard,
  onClose,
}: InningsBreakDashboardProps) {
  const nameA = state.teamAName || teamAName || "Team A";
  const nameB = state.teamBName || teamBName || "Team B";
  const inn1 = state.innings1;
  const inn2 = state.innings2;

  const battingTeam1Name = inn1?.battingTeamName || nameA;
  const chasingTeamName = inn2?.battingTeamName || (battingTeam1Name === nameA ? nameB : nameA);

  const target = state.target || (inn1 ? inn1.totalRuns + 1 : 1);
  const ballsTotal = (state.oversLimit || oversLimit) * 6;
  const rrr = (target / ((state.oversLimit || oversLimit))).toFixed(2);

  // Top performers from Innings 1
  const sortedBatters = [...(inn1?.batters || [])].sort((a, b) => b.runs - a.runs);
  const topBatter = sortedBatters[0];

  const sortedBowlers = [...(inn1?.bowlers || [])].sort((a, b) => {
    if (b.wickets !== a.wickets) return b.wickets - a.wickets;
    return a.runs - b.runs;
  });
  const topBowler = sortedBowlers[0];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 text-white space-y-5">
      {/* Header Banner */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Coffee className="w-5 h-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
                Innings Break
              </span>
              <span className="text-xs text-slate-400 font-medium">Mid-Match Equation</span>
            </div>
            <h2 className="text-base sm:text-lg font-black tracking-tight text-white mt-0.5">
              1st Innings Concluded
            </h2>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
          title="Close break view"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Split-Screen Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Card: 1st Innings Summary */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">
              <span>1st Innings · Batting</span>
              <span className="text-indigo-400">Completed</span>
            </div>
            <div className="text-lg font-black text-white">{battingTeam1Name}</div>

            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-4xl sm:text-5xl font-black font-mono text-white tracking-tight">
                {inn1 ? inn1.totalRuns : 0}
              </span>
              <span className="text-2xl font-bold text-slate-500 font-mono">/</span>
              <span className="text-3xl font-extrabold font-mono text-rose-400">
                {inn1 ? inn1.totalWickets : 0}
              </span>
              <span className="text-xs sm:text-sm font-semibold text-slate-400 ml-2">
                ({inn1 ? inn1.totalOvers : "0.0"} / {state.oversLimit || oversLimit} ov)
              </span>
            </div>

            <div className="mt-2 text-xs font-semibold text-emerald-400">
              Run Rate: {inn1 ? inn1.runRate : "0.00"}
            </div>
          </div>

          {/* Innings 1 Key Performers */}
          <div className="border-t border-slate-800/80 pt-3 space-y-2 text-xs">
            {topBatter && (
              <div className="flex items-center justify-between text-slate-300">
                <span className="truncate text-slate-400">🏏 Top Batter:</span>
                <span className="font-bold text-slate-200">
                  {topBatter.playerName} · <strong className="text-white">{topBatter.runs}</strong> ({topBatter.balls}b)
                </span>
              </div>
            )}
            {topBowler && (
              <div className="flex items-center justify-between text-slate-300">
                <span className="truncate text-slate-400">🎯 Top Bowler:</span>
                <span className="font-bold text-slate-200">
                  {topBowler.playerName} · <strong className="text-white">{topBowler.wickets}/{topBowler.runs}</strong> ({topBowler.overs} ov)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Card: 2nd Innings Target Equation */}
        <div className="bg-gradient-to-br from-indigo-950/40 via-slate-950/80 to-purple-950/40 border border-indigo-500/30 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4 shadow-lg shadow-indigo-950/50">
          <div>
            <div className="flex items-center justify-between text-xs text-indigo-300 font-semibold uppercase tracking-wider mb-2">
              <span>2nd Innings · Chase</span>
              <span className="inline-flex items-center gap-1 text-amber-400 font-bold">
                <Target className="w-3.5 h-3.5" /> Target
              </span>
            </div>
            <div className="text-lg font-black text-white">{chasingTeamName}</div>

            <div className="flex items-baseline gap-3 mt-2">
              <span className="text-4xl sm:text-5xl font-black font-mono text-amber-400 tracking-tight">
                {target}
              </span>
              <span className="text-xs sm:text-sm font-semibold text-slate-300">
                runs needed to win
              </span>
            </div>

            <div className="mt-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 font-bold">
              🎯 Equation: Need {target} runs from {ballsTotal} balls
            </div>
          </div>

          <div className="border-t border-indigo-500/20 pt-3 flex items-center justify-between text-xs">
            <span className="text-slate-400">Required Run Rate (RRR):</span>
            <span className="font-mono font-bold text-base text-amber-300">{rrr} rpo</span>
          </div>
        </div>
      </div>

      {/* Action Row */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-800">
        <button
          type="button"
          onClick={onFixInnings1}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold border border-slate-700 transition active:scale-95"
          title="Undo last delivery of 1st innings to correct an error"
        >
          <Undo2 className="w-4 h-4 text-amber-400" />
          <span>Fix 1st Innings Error</span>
        </button>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={onShareCard}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold border border-slate-700 transition active:scale-95"
            title="Share mid-match scorecard to WhatsApp"
          >
            <Share2 className="w-4 h-4 text-indigo-400" />
            <span>Share Mid-Match</span>
          </button>

          <button
            type="button"
            onClick={onStartSecondInnings}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-600/30 transition active:scale-95"
          >
            <span>Start 2nd Innings</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
