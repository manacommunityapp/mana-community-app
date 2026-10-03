import React, { useState, useEffect, useMemo } from 'react';
import {
  Shield,
  Trophy,
  Users,
  Wallet,
  Search,
  Sparkles,
  TrendingUp,
  Filter,
  Loader2,
  Calendar,
} from 'lucide-react';
import { TeamCardRich } from './TeamCardRich';
import { TeamSquadRosterView } from './TeamSquadRosterView';
import { SAMPLE_TOURNAMENT_TEAMS } from './sampleTeamsData';
import type { TeamProfile } from './TeamHubTypes';
import { auctionService } from '../../../../services/sports/auctionService';

interface TeamsHubShowcaseProps {
  tournamentId?: number;
  tournamentName?: string;
  season?: string;
  className?: string;
}

export const TeamsHubShowcase: React.FC<TeamsHubShowcaseProps> = ({
  tournamentId,
  tournamentName = 'PHF Premier League',
  season = 'Season 5',
  className = '',
}) => {
  const [teams, setTeams] = useState<TeamProfile[]>(SAMPLE_TOURNAMENT_TEAMS);
  const [selectedTeam, setSelectedTeam] = useState<TeamProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Attempt to load live backend teams if auction config exists
  useEffect(() => {
    let isMounted = true;
    const loadLiveTeams = async () => {
      try {
        setLoading(true);
        // Check for auction configs
        const configs = await auctionService.getAllCommunityConfigs();
        if (configs && configs.length > 0) {
          const activeCfg = tournamentId
            ? configs.find((c) => c.sportId === tournamentId || c.id === tournamentId) || configs[0]
            : configs[0];

          if (activeCfg) {
            const liveTeams = await auctionService.getTeamsSummary(activeCfg.id);
            if (liveTeams && liveTeams.length > 0 && isMounted) {
              const mappedTeams: TeamProfile[] = liveTeams.map((lt, idx) => {
                const sample = SAMPLE_TOURNAMENT_TEAMS[idx % SAMPLE_TOURNAMENT_TEAMS.length];
                const budgetVal = lt.totalBudget ?? lt.budget ?? 100000;
                const spentVal = lt.spent ?? 0;
                return {
                  id: lt.id,
                  name: lt.teamName || lt.name || `Team ${idx + 1}`,
                  shortName: (lt.teamName || lt.name || `T${idx + 1}`).slice(0, 3).toUpperCase(),
                  colorHex: lt.colorHex || lt.color || sample.colorHex,
                  secondaryColor: sample.secondaryColor,
                  emoji: lt.emoji || sample.emoji,
                  ownerName: lt.ownerName || lt.ownerUser?.fullName || sample.ownerName,
                  captainName: lt.captainUser?.fullName || sample.captainName,
                  captainConfirmed: lt.captainConfirmation ?? true,
                  motto: sample.motto,
                  sportName: 'Cricket',
                  tournamentName: activeCfg.sportName || tournamentName,
                  season: season,
                  totalBudget: budgetVal,
                  spentBudget: spentVal,
                  remainingBudget: budgetVal - spentVal,
                  maxSquadSize: 12,
                  titlesCount: sample.titlesCount,
                  winLossRatio: sample.winLossRatio,
                  squad:
                    lt.players && lt.players.length > 0
                      ? lt.players.map((p, pIdx) => ({
                          id: `${lt.id}-${pIdx}`,
                          name: p.name,
                          role: (p.category?.toUpperCase().includes('BOWL')
                            ? 'BOWLER'
                            : p.category?.toUpperCase().includes('ALL')
                            ? 'ALL_ROUNDER'
                            : p.category?.toUpperCase().includes('KEEP')
                            ? 'WICKET_KEEPER'
                            : 'BATSMAN') as any,
                          category: p.category || 'Open',
                          jerseyNumber: pIdx + 1,
                          acquiredPrice: p.soldPrice || 5000,
                          status: 'AUCTION_BUY' as const,
                          isCommunityResident: true,
                        }))
                      : sample.squad,
                };
              });

              setTeams(mappedTeams);
            }
          }
        }
      } catch (err) {
        // Gracefully use seed sample teams
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadLiveTeams();
    return () => {
      isMounted = false;
    };
  }, [tournamentId, tournamentName, season]);

  // Filtered teams
  const filteredTeams = useMemo(() => {
    return teams.filter((t) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        (t.shortName && t.shortName.toLowerCase().includes(q)) ||
        (t.captainName && t.captainName.toLowerCase().includes(q)) ||
        (t.ownerName && t.ownerName.toLowerCase().includes(q)) ||
        t.squad.some((p) => p.name.toLowerCase().includes(q))
      );
    });
  }, [teams, searchQuery]);

  // Aggregated tournament metrics
  const tournamentMetrics = useMemo(() => {
    const totalTeams = teams.length;
    const totalPlayers = teams.reduce((acc, t) => acc + (t.squad?.length || 0), 0);
    const totalSpent = teams.reduce((acc, t) => acc + (t.spentBudget || 0), 0);
    const totalPurse = teams.reduce((acc, t) => acc + (t.totalBudget || 100000), 0);

    return { totalTeams, totalPlayers, totalSpent, totalPurse };
  }, [teams]);

  return (
    <div className={`space-y-6 text-left ${className}`}>
      {/* ── Top Header Banner ───────────────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-3xl p-5 sm:p-7 text-white shadow-xl border border-indigo-500/20"
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)',
        }}
      >
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 shadow-2xs inline-flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-300" />
                Tournament Teams & Squads
              </span>
              <span className="text-xs text-indigo-200 font-semibold">• {season}</span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white">
              Franchise Hub & Squad Rosters
            </h1>
            <p className="text-xs sm:text-sm text-indigo-200/85 leading-relaxed">
              Explore participating community franchises, leadership lineups, squad breakdown by roles, and purse utilization.
            </p>
          </div>

          {/* Tournament Quick Metrics Pill Box */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white/5 backdrop-blur-md p-3 sm:p-3.5 rounded-2xl border border-white/10 shrink-0">
            <div className="text-center px-2">
              <span className="text-[10px] uppercase font-bold text-indigo-200/70 block">Franchises</span>
              <strong className="text-sm sm:text-lg font-black text-white">{tournamentMetrics.totalTeams} Teams</strong>
            </div>
            <div className="text-center px-2 border-l border-white/10">
              <span className="text-[10px] uppercase font-bold text-indigo-200/70 block">Drafted</span>
              <strong className="text-sm sm:text-lg font-black text-white">{tournamentMetrics.totalPlayers} Players</strong>
            </div>
            <div className="text-center px-2 border-l border-white/10">
              <span className="text-[10px] uppercase font-bold text-indigo-200/70 block">Purse Spent</span>
              <strong className="text-sm sm:text-lg font-black text-amber-300">
                ₹{(tournamentMetrics.totalSpent / 1000).toFixed(0)}k
              </strong>
            </div>
            <div className="text-center px-2 border-l border-white/10">
              <span className="text-[10px] uppercase font-bold text-indigo-200/70 block">Avg Squad</span>
              <strong className="text-sm sm:text-lg font-black text-emerald-300">
                {tournamentMetrics.totalTeams > 0
                  ? Math.round(tournamentMetrics.totalPlayers / tournamentMetrics.totalTeams)
                  : 0}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* ── Search & Filter Bar ──────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-white">
            Participating Teams ({filteredTeams.length})
          </h3>
        </div>

        <div className="relative w-64 max-w-full">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search teams or players..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-indigo-500 font-medium transition-colors"
          />
        </div>
      </div>

      {/* ── Teams Cards Grid ────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      ) : filteredTeams.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
          <Shield className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
            No teams match your search
          </p>
          <p className="text-xs text-slate-400">
            Try searching for a different team name, captain, or squad player.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredTeams.map((team) => (
            <TeamCardRich
              key={team.id}
              team={team}
              onViewRoster={(t) => setSelectedTeam(t)}
            />
          ))}
        </div>
      )}

      {/* ── Squad Roster Modal ───────────────────────────────────── */}
      {selectedTeam && (
        <TeamSquadRosterView
          team={selectedTeam}
          onClose={() => setSelectedTeam(null)}
          isModal={true}
        />
      )}
    </div>
  );
};
