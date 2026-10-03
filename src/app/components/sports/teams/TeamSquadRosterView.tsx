import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Users,
  Trophy,
  Crown,
  Wallet,
  Zap,
  Crosshair,
  Shield,
  Star,
  Activity,
  Award,
  Hash,
  Filter,
} from 'lucide-react';
import type { TeamProfile, SquadMember, PlayerRoleType } from './TeamHubTypes';

interface TeamSquadRosterViewProps {
  team: TeamProfile;
  onClose?: () => void;
  isModal?: boolean;
}

export const TeamSquadRosterView: React.FC<TeamSquadRosterViewProps> = ({
  team,
  onClose,
  isModal = true,
}) => {
  const [selectedRole, setSelectedRole] = useState<'ALL' | PlayerRoleType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const color = team.colorHex || '#4f46e5';
  const squad = team.squad || [];

  // Filter squad
  const filteredSquad = useMemo(() => {
    return squad.filter((player) => {
      const matchesRole = selectedRole === 'ALL' || player.role === selectedRole;
      const matchesSearch =
        searchQuery.trim() === '' ||
        player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (player.flatNumber && player.flatNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (player.category && player.category.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesRole && matchesSearch;
    });
  }, [squad, selectedRole, searchQuery]);

  // Role counters
  const roleCounts = useMemo(() => {
    return {
      ALL: squad.length,
      BATSMAN: squad.filter((p) => p.role === 'BATSMAN').length,
      BOWLER: squad.filter((p) => p.role === 'BOWLER').length,
      ALL_ROUNDER: squad.filter((p) => p.role === 'ALL_ROUNDER').length,
      WICKET_KEEPER: squad.filter((p) => p.role === 'WICKET_KEEPER').length,
    };
  }, [squad]);

  // Highest buy player
  const marqueeBuy = useMemo(() => {
    if (squad.length === 0) return null;
    return [...squad].sort((a, b) => (b.acquiredPrice || 0) - (a.acquiredPrice || 0))[0];
  }, [squad]);

  const content = (
    <div className="space-y-5 text-left">
      {/* ── Team Hero Header ────────────────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-2xl p-5 sm:p-6 text-white shadow-lg"
        style={{
          background: `linear-gradient(135deg, ${color}dd 0%, #0f172a 100%)`,
        }}
      >
        {/* Glow & Pattern */}
        <div
          className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ background: color }}
        />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl font-black bg-white/10 backdrop-blur-md border border-white/20 shadow-xl shrink-0"
            >
              {team.emoji || team.name.slice(0, 2).toUpperCase()}
            </div>

            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-md bg-white/20 backdrop-blur-sm text-[10px] font-extrabold uppercase tracking-wider">
                  {team.shortName || 'SQUAD'}
                </span>
                {team.tournamentName && (
                  <span className="text-xs text-white/80 font-medium">
                    • {team.tournamentName} {team.season ? `(${team.season})` : ''}
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight truncate">
                {team.name}
              </h2>
              {team.motto && (
                <p className="text-xs text-white/75 italic">
                  "{team.motto}"
                </p>
              )}
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-black/30 backdrop-blur-md p-3 rounded-xl border border-white/10 shrink-0">
            <div className="text-center px-2">
              <span className="text-[10px] uppercase font-bold text-white/60 block">Squad Size</span>
              <strong className="text-sm sm:text-base font-black text-white">
                {squad.length} / {team.maxSquadSize}
              </strong>
            </div>
            <div className="text-center px-2 border-x border-white/10">
              <span className="text-[10px] uppercase font-bold text-white/60 block">Purse Spent</span>
              <strong className="text-sm sm:text-base font-black text-amber-300">
                ₹{(team.spentBudget || 0).toLocaleString('en-IN')}
              </strong>
            </div>
            <div className="text-center px-2 col-span-2 sm:col-span-1">
              <span className="text-[10px] uppercase font-bold text-white/60 block">Remaining</span>
              <strong className="text-sm sm:text-base font-black text-emerald-400">
                ₹{(team.remainingBudget || 0).toLocaleString('en-IN')}
              </strong>
            </div>
          </div>
        </div>

        {/* Leadership Strip (Captain & Owner) */}
        <div className="mt-4 pt-4 border-t border-white/15 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {team.captainName && (
            <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-sm px-3 py-2 rounded-xl border border-white/10">
              <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                <Crown className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] uppercase font-bold text-white/60 block">Team Captain</span>
                <strong className="text-xs font-bold text-white truncate block">
                  {team.captainName}
                </strong>
              </div>
            </div>
          )}

          {team.ownerName && (
            <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-sm px-3 py-2 rounded-xl border border-white/10">
              <div className="w-8 h-8 rounded-lg bg-indigo-400 text-slate-950 flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                <Award className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] uppercase font-bold text-white/60 block">Team Owner / Franchise</span>
                <strong className="text-xs font-bold text-white truncate block">
                  {team.ownerName} {team.ownerCompany ? `(${team.ownerCompany})` : ''}
                </strong>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Filters & Search Bar ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        {/* Role Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { key: 'ALL' as const, label: 'All Squad', count: roleCounts.ALL, icon: Users },
            { key: 'BATSMAN' as const, label: 'Batsmen', count: roleCounts.BATSMAN, icon: null, emoji: '🏏' },
            { key: 'BOWLER' as const, label: 'Bowlers', count: roleCounts.BOWLER, icon: Crosshair },
            { key: 'ALL_ROUNDER' as const, label: 'All-Rounders', count: roleCounts.ALL_ROUNDER, icon: Zap },
            { key: 'WICKET_KEEPER' as const, label: 'Keepers', count: roleCounts.WICKET_KEEPER, icon: Shield },
          ].map((tab) => {
            const isActive = selectedRole === tab.key;
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setSelectedRole(tab.key)}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {tab.emoji && <span>{tab.emoji}</span>}
                {Icon && <Icon className="w-3 h-3" />}
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    isActive ? 'bg-white/20 dark:bg-black/20 text-current' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Box */}
        <div className="relative min-w-[200px] sm:w-64 shrink-0">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search player or flat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-indigo-500 transition-colors font-medium"
          />
        </div>
      </div>

      {/* ── Squad Player Cards Grid ─────────────────────────────── */}
      {filteredSquad.length === 0 ? (
        <div className="py-12 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
          <Users className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
            No players found matching your criteria
          </p>
          <p className="text-[11px] text-slate-400">
            Try adjusting your role filter or search query.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredSquad.map((player, idx) => {
            const isCaptain = player.status === 'CAPTAIN';
            const isViceCaptain = player.status === 'VICE_CAPTAIN';

            return (
              <div
                key={player.id || idx}
                className="relative overflow-hidden rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-3.5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-3 group"
              >
                {/* Top Row: Jersey, Name, Status */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Jersey Badge */}
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm text-white shrink-0 shadow-2xs"
                      style={{ background: color }}
                    >
                      {player.jerseyNumber ?? idx + 1}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <strong className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {player.name}
                        </strong>
                        {isCaptain && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 text-[9px] font-black uppercase tracking-wider flex items-center gap-0.5 shadow-2xs">
                            <Crown className="w-2.5 h-2.5" /> C
                          </span>
                        )}
                        {isViceCaptain && (
                          <span className="px-1.5 py-0.2 rounded bg-indigo-500 text-white text-[9px] font-black uppercase tracking-wider">
                            VC
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        {player.flatNumber && (
                          <span>Flat {player.flatNumber}</span>
                        )}
                        {player.category && (
                          <span>• {player.category}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Price Tag Badge */}
                  <div className="text-right shrink-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      Acquired
                    </span>
                    <strong className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                      ₹{player.acquiredPrice.toLocaleString('en-IN')}
                    </strong>
                  </div>
                </div>

                {/* Role Pill & Acquisition Status */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px] uppercase tracking-wider">
                    {player.role === 'BATSMAN' && '🏏 Batsman'}
                    {player.role === 'BOWLER' && '🎯 Bowler'}
                    {player.role === 'ALL_ROUNDER' && '⚡ All-Rounder'}
                    {player.role === 'WICKET_KEEPER' && '🧤 Wicket Keeper'}
                    {!['BATSMAN', 'BOWLER', 'ALL_ROUNDER', 'WICKET_KEEPER'].includes(player.role) && player.role}
                  </span>

                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {player.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Player Key Stats (if present) */}
                {player.stats && (
                  <div className="grid grid-cols-3 gap-1 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg text-center text-[10px]">
                    {player.stats.runs !== undefined && (
                      <div>
                        <span className="text-slate-400 block font-semibold">Runs</span>
                        <strong className="text-slate-800 dark:text-slate-200 font-black">{player.stats.runs}</strong>
                      </div>
                    )}
                    {player.stats.wickets !== undefined && (
                      <div>
                        <span className="text-slate-400 block font-semibold">Wickets</span>
                        <strong className="text-slate-800 dark:text-slate-200 font-black">{player.stats.wickets}</strong>
                      </div>
                    )}
                    {player.stats.strikeRate !== undefined && (
                      <div>
                        <span className="text-slate-400 block font-semibold">SR</span>
                        <strong className="text-slate-800 dark:text-slate-200 font-black">{player.stats.strikeRate}</strong>
                      </div>
                    )}
                    {player.stats.economy !== undefined && player.stats.strikeRate === undefined && (
                      <div>
                        <span className="text-slate-400 block font-semibold">Econ</span>
                        <strong className="text-slate-800 dark:text-slate-200 font-black">{player.stats.economy}</strong>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  if (isModal) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto"
        onClick={onClose}
      >
        <div
          className="relative max-w-4xl w-full bg-slate-100 dark:bg-slate-950 rounded-3xl p-4 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 my-8 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Close Button */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/40 text-slate-800 dark:text-white transition-colors cursor-pointer z-20"
              title="Close Roster"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {content}
        </div>
      </div>
    );
  }

  return content;
};
