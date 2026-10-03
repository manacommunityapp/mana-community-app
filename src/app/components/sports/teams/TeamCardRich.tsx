import React from 'react';
import {
  Crown,
  Users,
  Trophy,
  Wallet,
  ChevronRight,
  Shield,
  Zap,
  Crosshair,
  Building,
} from 'lucide-react';
import type { TeamProfile } from './TeamHubTypes';

interface TeamCardRichProps {
  team: TeamProfile;
  onViewRoster: (team: TeamProfile) => void;
  className?: string;
}

export const TeamCardRich: React.FC<TeamCardRichProps> = ({
  team,
  onViewRoster,
  className = '',
}) => {
  const color = team.colorHex || '#4f46e5';
  const squad = team.squad || [];
  const squadSize = squad.length;
  const spent = team.spentBudget ?? 0;
  const budget = team.totalBudget ?? 100000;
  const remaining = budget - spent;
  const spentPct = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;

  // Role counters
  const batsmenCount = squad.filter((p) => p.role === 'BATSMAN').length;
  const bowlersCount = squad.filter((p) => p.role === 'BOWLER').length;
  const allRoundersCount = squad.filter((p) => p.role === 'ALL_ROUNDER').length;
  const keepersCount = squad.filter((p) => p.role === 'WICKET_KEEPER').length;

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between text-left hover:-translate-y-1 ${className}`}
      style={{
        borderTop: `4px solid ${color}`,
      }}
    >
      {/* Background Ambient Glow */}
      <div
        className="absolute -top-16 -right-16 w-36 h-36 rounded-full blur-2xl opacity-15 pointer-events-none group-hover:opacity-30 transition-opacity"
        style={{ background: color }}
      />

      {/* Team Header Row */}
      <div className="p-4 sm:p-5 space-y-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Team Logo / Badge */}
            <div
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-2xl font-black text-white shadow-md shrink-0 transition-transform group-hover:scale-105"
              style={{
                background: `linear-gradient(135deg, ${color}, ${team.secondaryColor || color}dd)`,
              }}
            >
              {team.emoji || team.name.slice(0, 2).toUpperCase()}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {team.shortName || 'TEAM'}
                </span>
                {team.season && (
                  <span className="text-[10px] text-slate-400 font-semibold">• {team.season}</span>
                )}
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate mt-0.5">
                {team.name}
              </h3>
              {team.motto && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 italic truncate">
                  "{team.motto}"
                </p>
              )}
            </div>
          </div>

          {/* Quick Badges: Titles / Win Ratio */}
          <div className="flex flex-col items-end gap-1 shrink-0">
            {team.titlesCount !== undefined && team.titlesCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-2xs">
                <Trophy className="w-3 h-3" />
                <span>{team.titlesCount} {team.titlesCount === 1 ? 'Title' : 'Titles'}</span>
              </span>
            )}
            {team.winLossRatio && (
              <span className="text-[10px] font-semibold text-slate-400">
                {team.winLossRatio}
              </span>
            )}
          </div>
        </div>

        {/* Owner & Captain Spotlight Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {team.captainName && (
            <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 shadow-2xs"
                style={{ background: color }}
              >
                <Crown className="w-3.5 h-3.5 text-amber-300" />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">
                  Captain
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block">
                  {team.captainName.split('(')[0].trim()}
                </span>
              </div>
            </div>
          )}

          {team.ownerName && (
            <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80">
              <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Building className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">
                  Owner
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block">
                  {team.ownerName}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Purse Budget Breakdown & Progress Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Wallet className="w-3.5 h-3.5 text-slate-400" />
              <span>Purse Spent</span>
            </span>
            <span className="text-slate-900 dark:text-white font-bold">
              ₹{spent.toLocaleString('en-IN')}{' '}
              <span className="text-slate-400 text-[11px] font-normal">
                / ₹{budget.toLocaleString('en-IN')}
              </span>
            </span>
          </div>

          {/* Budget Progress Bar */}
          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${spentPct}%`,
                background:
                  spentPct > 90
                    ? '#ef4444' // Red warning
                    : spentPct > 70
                    ? '#f59e0b' // Amber
                    : color,
              }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
            <span>{spentPct}% utilized</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              ₹{remaining.toLocaleString('en-IN')} remaining
            </span>
          </div>
        </div>

        {/* Role Counters Pill Strip */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          {batsmenCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 text-[10px] font-bold border border-orange-500/20">
              <span>🏏</span>
              <span>{batsmenCount} Bat</span>
            </span>
          )}
          {bowlersCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold border border-blue-500/20">
              <Crosshair className="w-2.5 h-2.5" />
              <span>{bowlersCount} Bowl</span>
            </span>
          )}
          {allRoundersCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
              <Zap className="w-2.5 h-2.5" />
              <span>{allRoundersCount} AR</span>
            </span>
          )}
          {keepersCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-bold border border-purple-500/20">
              <Shield className="w-2.5 h-2.5" />
              <span>{keepersCount} WK</span>
            </span>
          )}
        </div>
      </div>

      {/* Card Footer with Squad Avatars & Action */}
      <div className="px-4 py-3 bg-slate-50/80 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
        {/* Squad Avatar Preview Stack */}
        <div className="flex items-center gap-1.5">
          <div className="flex -space-x-2 overflow-hidden">
            {squad.slice(0, 4).map((p, idx) => (
              <div
                key={idx}
                className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-slate-900 bg-slate-200 dark:bg-slate-700 text-[9px] font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center"
                title={`${p.name} (${p.role})`}
              >
                {p.name[0]}
              </div>
            ))}
          </div>
          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
            {squadSize} / {team.maxSquadSize} Players
          </span>
        </div>

        {/* Open Squad Roster Button */}
        <button
          type="button"
          onClick={() => onViewRoster(team)}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-xs transition-all cursor-pointer group-hover:scale-105 active:scale-95 shrink-0"
          style={{ background: color }}
        >
          <span>Squad Roster</span>
          <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  );
};
