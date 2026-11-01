import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarDays,
  ChevronDown,
  CircleDollarSign,
  Crown,
  Loader2,
  RefreshCw,
  Search,
  Shield,
  Trophy,
  Users,
} from 'lucide-react';
import { auctionService } from '../../../../services/sports/auctionService';
import type { AuctionConfigResponse, AuctionTeam } from '../../../../types/api';
import { TeamCardRich } from './TeamCardRich';
import { TeamSquadRosterView } from './TeamSquadRosterView';
import type { PlayerRoleType, SquadMember, TeamProfile } from './TeamHubTypes';

interface TeamsHubShowcaseProps {
  className?: string;
}

const TEAM_COLORS = ['#4f46e5', '#0891b2', '#059669', '#d97706', '#db2777', '#7c3aed'];

function parseRole(value?: string | null): PlayerRoleType {
  const normalized = value?.trim().toUpperCase().replace(/[\s-]+/g, '_');
  const aliases: Record<string, PlayerRoleType> = {
    BAT: 'BATSMAN', BATTER: 'BATSMAN', BATSMAN: 'BATSMAN',
    BOWL: 'BOWLER', BOWLER: 'BOWLER',
    ALLROUNDER: 'ALL_ROUNDER', ALL_ROUNDER: 'ALL_ROUNDER',
    WICKETKEEPER: 'WICKET_KEEPER', WICKET_KEEPER: 'WICKET_KEEPER', KEEPER: 'WICKET_KEEPER',
    FORWARD: 'FORWARD', MIDFIELDER: 'MIDFIELDER', DEFENDER: 'DEFENDER', GOALKEEPER: 'GOALKEEPER',
    SINGLES: 'SINGLES', DOUBLES: 'DOUBLES',
  };
  return (normalized && aliases[normalized]) || 'PLAYER';
}

function mapTeam(team: AuctionTeam, config: AuctionConfigResponse, index: number): TeamProfile {
  const players = (team.players ?? []) as Array<{
    id?: number | string;
    playerId?: number | string;
    userId?: number | string;
    name?: string;
    playerName?: string;
    role?: string;
    playerRole?: string;
    category?: string;
    soldPrice?: number;
    status?: string;
    jerseyNumber?: number | string;
    flatNumber?: string;
  }>;
  const name = team.teamName || team.name || `Team ${index + 1}`;
  const squad: SquadMember[] = players
    .filter((player) => (player.name || player.playerName)?.trim())
    .map((player, playerIndex) => ({
      id: player.id ?? player.playerId ?? player.userId ?? `${team.id}-${playerIndex}`,
      name: (player.name || player.playerName || '').trim(),
      role: parseRole(player.role || player.playerRole || player.category),
      category: player.category || undefined,
      jerseyNumber: player.jerseyNumber,
      acquiredPrice: player.soldPrice,
      status: player.status === 'CAPTAIN' || player.status === 'VICE_CAPTAIN' || player.status === 'RETAINED' || player.status === 'DRAFT' || player.status === 'UNSOLD'
        ? player.status
        : 'AUCTION_BUY',
      flatNumber: player.flatNumber,
    }));

  const totalBudget = team.totalBudget ?? team.budget ?? config.budgetPerTeam;
  const spentBudget = team.spent;
  const remainingBudget = team.remainingBudget ?? (totalBudget != null && spentBudget != null
    ? Math.max(0, totalBudget - spentBudget)
    : undefined);

  return {
    id: team.id,
    name,
    shortName: name.slice(0, 3).toUpperCase(),
    colorHex: team.colorHex || team.color || TEAM_COLORS[index % TEAM_COLORS.length],
    emoji: team.emoji || '🛡️',
    ownerName: team.ownerName || team.ownerUser?.fullName || undefined,
    captainName: team.captainUser?.fullName || undefined,
    captainId: team.captainUser?.id,
    captainConfirmed: team.captainConfirmation,
    sportName: config.sportName,
    tournamentName: config.eventName || config.seasonName,
    season: config.seasonName,
    totalBudget,
    spentBudget,
    remainingBudget,
    maxSquadSize: undefined,
    squad,
  };
}

export const TeamsHubShowcase: React.FC<TeamsHubShowcaseProps> = ({ className = '' }) => {
  const [configs, setConfigs] = useState<AuctionConfigResponse[]>([]);
  const [selectedConfigId, setSelectedConfigId] = useState<number | null>(null);
  const [teams, setTeams] = useState<TeamProfile[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<TeamProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [configsLoading, setConfigsLoading] = useState(true);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setConfigsLoading(true);
    setError(null);

    auctionService.getAllCommunityConfigs()
      .then((nextConfigs) => {
        if (!active) return;
        const sorted = [...nextConfigs].sort((a, b) => {
          const aTime = a.updatedAt || a.createdAt || '';
          const bTime = b.updatedAt || b.createdAt || '';
          return bTime.localeCompare(aTime);
        });
        setConfigs(sorted);
        setSelectedConfigId((current) => current && sorted.some((config) => config.id === current)
          ? current
          : sorted[0]?.id ?? null);
      })
      .catch(() => {
        if (active) setError('We could not load tournament and auction details. Please try again.');
      })
      .finally(() => {
        if (active) setConfigsLoading(false);
      });

    return () => { active = false; };
  }, [reloadKey]);

  const selectedConfig = configs.find((config) => config.id === selectedConfigId) ?? null;

  useEffect(() => {
    if (!selectedConfigId) {
      setTeams([]);
      return;
    }

    let active = true;
    setTeamsLoading(true);
    setError(null);
    setTeams([]);
    setSelectedTeam(null);

    auctionService.getTeamsSummary(selectedConfigId)
      .then((result) => {
        if (active) setTeams(result.map((team, index) => mapTeam(team, selectedConfig!, index)));
      })
      .catch(() => {
        if (active) setError('Teams for this tournament could not be loaded. Please retry.');
      })
      .finally(() => {
        if (active) setTeamsLoading(false);
      });

    return () => { active = false; };
  }, [selectedConfigId, selectedConfig, reloadKey]);

  const filteredTeams = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return teams;
    return teams.filter((team) => team.name.toLowerCase().includes(query)
      || team.captainName?.toLowerCase().includes(query)
      || team.ownerName?.toLowerCase().includes(query)
      || team.squad.some((player) => player.name.toLowerCase().includes(query)));
  }, [teams, searchQuery]);

  const metrics = useMemo(() => ({
    teams: teams.length,
    players: teams.reduce((count, team) => count + team.squad.length, 0),
    captains: teams.filter((team) => team.captainName).length,
  }), [teams]);

  return (
    <div className={`mx-auto w-full max-w-[1600px] rounded-[28px] border border-slate-200/90 bg-slate-100/75 p-2.5 text-left shadow-sm sm:rounded-[32px] sm:p-4 lg:p-5 ${className}`}>
      <div className="space-y-4 sm:space-y-5">
      <section className="relative overflow-hidden rounded-2xl border border-indigo-200/70 bg-gradient-to-br from-slate-950 via-indigo-950 to-indigo-800 p-5 text-white shadow-md shadow-indigo-950/10 sm:rounded-3xl sm:p-7">
        <div className="pointer-events-none absolute -right-12 -top-20 h-56 w-56 rounded-full bg-indigo-400/20 blur-3xl" />
        <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-gradient-to-l from-white/[0.035] to-transparent lg:block" />
        <div className="relative flex justify-center">
          <div className="grid w-full max-w-5xl grid-cols-3 gap-1.5 rounded-2xl border border-white/10 bg-white/[0.08] p-2 shadow-inner sm:gap-2">
            {[
              { label: 'Teams', value: metrics.teams, icon: Shield },
              { label: 'Squad players', value: metrics.players, icon: Users },
              { label: 'Captains named', value: metrics.captains, icon: Crown },
            ].map((metric) => {
              const Icon = metric.icon;
              return (
                <div key={metric.label} className="rounded-xl border border-white/[0.06] bg-white/[0.035] px-2 py-2.5 text-center">
                  <Icon className="mx-auto mb-1.5 h-4 w-4 text-indigo-200" />
                  <strong className="block text-xl font-extrabold leading-none">{metric.value}</strong>
                  <span className="mt-1.5 block text-[9px] font-bold uppercase tracking-wide text-indigo-100/65">{metric.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white bg-white p-4 shadow-sm ring-1 ring-slate-200/80 sm:rounded-3xl sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <label className="block w-full lg:max-w-md">
            <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Tournament / season</span>
            <span className="relative block">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-500" />
              <select
                value={selectedConfigId ?? ''}
                onChange={(event) => setSelectedConfigId(Number(event.target.value) || null)}
                disabled={configsLoading || configs.length === 0}
                aria-label="Select tournament or season"
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-9 text-sm font-semibold text-slate-800 outline-none transition hover:border-indigo-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-60 [&>option]:text-slate-900"
              >
                {configs.length === 0 && <option value="">No auction seasons available</option>}
                {configs.map((config) => (
                  <option key={config.id} value={config.id}>
                    {[config.eventName || config.seasonName, config.sportName, config.seasonName].filter(Boolean).join(' · ')}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </span>
          </label>

          <label className="relative block w-full lg:w-72">
            <span className="sr-only">Search teams or players</span>
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search a team, captain or player"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
            />
          </label>
        </div>

        {selectedConfig && (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-bold text-indigo-700">
              <Shield className="h-3 w-3" /> {selectedConfig.sportName}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600">
              <CalendarDays className="h-3 w-3" /> {selectedConfig.seasonName}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
              <CircleDollarSign className="h-3 w-3" /> {selectedConfig.status}
            </span>
            <span className="ml-auto text-[11px] font-medium text-slate-500">
              {teamsLoading ? 'Loading teams…' : `${teams.length} ${teams.length === 1 ? 'team' : 'teams'}`}
            </span>
          </div>
        )}
      </section>

      {error ? (
        <div role="alert" className="flex flex-col items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5 text-rose-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
          <button type="button" onClick={() => setReloadKey((key) => key + 1)} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100">
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </button>
        </div>
      ) : configsLoading || teamsLoading ? (
        <div className="flex min-h-56 items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-500"><Loader2 className="h-5 w-5 animate-spin text-indigo-600" /> Loading real team data…</div>
        </div>
      ) : configs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600"><Trophy className="h-6 w-6" /></div>
          <h3 className="mt-3 text-base font-bold text-slate-900">No auction seasons yet</h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">Teams and squads will appear here after an auction season is set up for this community.</p>
        </div>
      ) : teams.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600"><Users className="h-6 w-6" /></div>
          <h3 className="mt-3 text-base font-bold text-slate-900">No teams in this season</h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">There are no team records for {selectedConfig?.seasonName || 'this auction'} yet. Select another tournament or season above.</p>
        </div>
      ) : filteredTeams.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-12 text-center">
          <Search className="mx-auto h-7 w-7 text-slate-300" />
          <p className="mt-2 text-sm font-semibold text-slate-700">No teams match “{searchQuery}”</p>
          <button type="button" onClick={() => setSearchQuery('')} className="mt-2 text-xs font-bold text-indigo-600 hover:text-indigo-800">Clear search</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-3 xl:gap-4">
          {filteredTeams.map((team) => (
            <TeamCardRich key={team.id} team={team} onViewRoster={setSelectedTeam} />
          ))}
        </div>
      )}

      {selectedTeam && (
        <TeamSquadRosterView team={selectedTeam} onClose={() => setSelectedTeam(null)} isModal />
      )}
      </div>
    </div>
  );
};
