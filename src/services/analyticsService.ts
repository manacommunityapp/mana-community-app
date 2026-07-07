import { sportsDashboardService } from "./sportsDashboardService";
import type { SportsDashboardResponse, DashboardMyRegistration } from "./sportsDashboardService";
import { sportsAdminService } from "./sportsAdminService";
import type { SportsAdminOverview, AdminEventRow } from "./sportsAdminService";
import { tournamentService } from "./tournamentService";
import type { ConfigInfo } from "./tournamentService";

// ── Palette for dynamic sport colors ─────────────────────────────────────────

const SPORT_COLORS = [
  "#818cf8", // indigo
  "#34d399", // emerald
  "#a78bfa", // violet
  "#f472b6", // pink
  "#fbbf24", // amber
  "#38bdf8", // sky
  "#fb923c", // orange
  "#4ade80", // green
  "#e879f9", // fuchsia
  "#2dd4bf", // teal
];

const GRADIENT_CLASSES = [
  "from-indigo-400 to-violet-500",
  "from-emerald-400 to-teal-500",
  "from-violet-400 to-purple-500",
  "from-pink-400 to-rose-500",
  "from-amber-400 to-orange-500",
  "from-sky-400 to-blue-500",
  "from-orange-400 to-red-500",
  "from-green-400 to-emerald-500",
  "from-fuchsia-400 to-pink-500",
  "from-teal-400 to-cyan-500",
];

// ── Types ────────────────────────────────────────────────────────────────────

export interface AnalyticsKPI {
  totalEvents: number;
  activePlayers: number;
  liveEvents: number;
  totalTournaments: number;
  openRegistrations: number;
  yourRegistrations: number;
}

export interface MonthlyEventRow {
  month: string;
  [sportName: string]: string | number; // month is string, rest are counts
}

export interface SportShareEntry {
  name: string;
  value: number;
  color: string;
}

export interface StandingRow {
  rank: number;
  team: string;
  w: number;
  l: number;
  d: number;
  pts: number;
  pct: number;
}

export interface TopPerformerEntry {
  rank: number;
  name: string;
  eventName: string;
  sport: string;
  eventsCount: number;
  label: string;
  avatar: string;
  color: string;
}

export interface ParticipationTrendRow {
  month: string;
  players: number;
}

export interface AnalyticsData {
  kpis: AnalyticsKPI;
  monthlyEvents: MonthlyEventRow[];
  sportShare: SportShareEntry[];
  participationTrend: ParticipationTrendRow[];
  standings: Record<string, StandingRow[]>;
  topPerformers: TopPerformerEntry[];
  sportNames: string[];
  sportColorMap: Record<string, string>;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function buildSportColorMap(sportNames: string[]): Record<string, string> {
  const map: Record<string, string> = {};
  sportNames.forEach((name, i) => {
    map[name] = SPORT_COLORS[i % SPORT_COLORS.length];
  });
  return map;
}

// ── Compute functions ────────────────────────────────────────────────────────

function computeKPIs(
  dashboard: SportsDashboardResponse,
  overview: SportsAdminOverview,
): AnalyticsKPI {
  return {
    totalEvents: overview.events.length,
    activePlayers: dashboard.stats.communityPlayers,
    liveEvents: dashboard.stats.liveEvents,
    totalTournaments: overview.tournaments.length,
    openRegistrations: dashboard.stats.openRegistrations,
    yourRegistrations: dashboard.stats.yourRegistrations,
  };
}

function computeMonthlyEvents(
  events: AdminEventRow[],
  sportNames: string[],
): MonthlyEventRow[] {
  // Build 12-month template
  const rows: MonthlyEventRow[] = MONTH_LABELS.map((m) => {
    const row: MonthlyEventRow = { month: m };
    sportNames.forEach((s) => (row[s] = 0));
    return row;
  });

  events.forEach((ev) => {
    if (!ev.eventDateStart || !ev.sport?.name) return;
    const date = new Date(ev.eventDateStart);
    if (isNaN(date.getTime())) return;
    const monthIdx = date.getMonth();
    const sportName = ev.sport.name;
    if (sportNames.includes(sportName)) {
      (rows[monthIdx][sportName] as number) += 1;
    }
  });

  // Only return months that have at least one event across any sport
  return rows.filter((r) =>
    sportNames.some((s) => (r[s] as number) > 0),
  );
}

function computeSportShare(
  events: AdminEventRow[],
  sportNames: string[],
  colorMap: Record<string, string>,
): SportShareEntry[] {
  const counts: Record<string, number> = {};
  sportNames.forEach((s) => (counts[s] = 0));

  events.forEach((ev) => {
    const name = ev.sport?.name;
    if (name && name in counts) counts[name] += 1;
  });

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  if (total === 0) return sportNames.map((n) => ({ name: n, value: 0, color: colorMap[n] }));

  return sportNames
    .map((name) => ({
      name,
      value: Math.round((counts[name] / total) * 100),
      color: colorMap[name],
    }))
    .filter((e) => e.value > 0)
    .sort((a, b) => b.value - a.value);
}

function computeParticipationTrend(
  registrations: DashboardMyRegistration[],
  events: AdminEventRow[],
): ParticipationTrendRow[] {
  // Approach: count events per month as a proxy for participation when we
  // don't have global registration timestamps.
  const monthCounts: Record<string, number> = {};
  MONTH_LABELS.forEach((m) => (monthCounts[m] = 0));

  // Count from admin events (event dates)
  events.forEach((ev) => {
    if (!ev.eventDateStart) return;
    const d = new Date(ev.eventDateStart);
    if (isNaN(d.getTime())) return;
    const maxP = ev.maxParticipants || 10; // estimate participants per event
    monthCounts[MONTH_LABELS[d.getMonth()]] += maxP;
  });

  // Also incorporate user's own registrations
  registrations.forEach((reg) => {
    if (!reg.eventDateStart) return;
    const d = new Date(reg.eventDateStart);
    if (isNaN(d.getTime())) return;
    monthCounts[MONTH_LABELS[d.getMonth()]] += 1;
  });

  const rows = MONTH_LABELS.map((m) => ({ month: m, players: monthCounts[m] }));
  // Only return months that have data
  return rows.filter((r) => r.players > 0);
}

function computeStandings(
  configs: ConfigInfo[],
  matchesByConfig: Map<number, any[]>,
): Record<string, StandingRow[]> {
  const standings: Record<string, StandingRow[]> = {};

  configs.forEach((cfg) => {
    const matches = matchesByConfig.get(cfg.id) || [];
    if (matches.length === 0) return;

    const label = cfg.tournamentName || cfg.eventName || `Tournament #${cfg.id}`;
    const teamMap: Record<string, { w: number; l: number; d: number; pts: number }> = {};

    matches.forEach((m: any) => {
      const homeTeam = m.homeTeamName || m.homeTeam || m.team1Name || m.team1 || "";
      const awayTeam = m.awayTeamName || m.awayTeam || m.team2Name || m.team2 || "";
      const homeScore = m.homeScore ?? m.team1Score ?? m.score1 ?? null;
      const awayScore = m.awayScore ?? m.team2Score ?? m.score2 ?? null;

      if (!homeTeam || !awayTeam) return;
      if (!teamMap[homeTeam]) teamMap[homeTeam] = { w: 0, l: 0, d: 0, pts: 0 };
      if (!teamMap[awayTeam]) teamMap[awayTeam] = { w: 0, l: 0, d: 0, pts: 0 };

      if (homeScore !== null && awayScore !== null) {
        const hs = Number(homeScore);
        const as = Number(awayScore);
        if (!isNaN(hs) && !isNaN(as)) {
          const ptsWin = cfg.pointsForWin ?? 3;
          const ptsDraw = cfg.pointsForDraw ?? 1;
          const ptsLoss = cfg.pointsForLoss ?? 0;

          if (hs > as) {
            teamMap[homeTeam].w += 1;
            teamMap[homeTeam].pts += ptsWin;
            teamMap[awayTeam].l += 1;
            teamMap[awayTeam].pts += ptsLoss;
          } else if (hs < as) {
            teamMap[awayTeam].w += 1;
            teamMap[awayTeam].pts += ptsWin;
            teamMap[homeTeam].l += 1;
            teamMap[homeTeam].pts += ptsLoss;
          } else {
            teamMap[homeTeam].d += 1;
            teamMap[homeTeam].pts += ptsDraw;
            teamMap[awayTeam].d += 1;
            teamMap[awayTeam].pts += ptsDraw;
          }
        }
      }
    });

    const rows: StandingRow[] = Object.entries(teamMap)
      .map(([team, stat]) => {
        const total = stat.w + stat.l + stat.d;
        return {
          rank: 0,
          team,
          w: stat.w,
          l: stat.l,
          d: stat.d,
          pts: stat.pts,
          pct: total > 0 ? stat.w / total : 0,
        };
      })
      .sort((a, b) => b.pts - a.pts || b.pct - a.pct)
      .map((r, i) => ({ ...r, rank: i + 1 }));

    if (rows.length > 0) {
      standings[label] = rows;
    }
  });

  return standings;
}

function computeTopPerformers(
  dashboard: SportsDashboardResponse,
  overview: SportsAdminOverview,
): TopPerformerEntry[] {
  // Build a map of player names to their registration counts across events
  const playerMap: Record<
    string,
    { name: string; events: Set<string>; sports: Set<string>; latestEvent: string; latestSport: string }
  > = {};

  // From user's own registrations
  dashboard.myRegistrations.forEach((reg: DashboardMyRegistration) => {
    // We don't have individual player names from dashboard registrations
    // but we can use event-level data
  });

  // From open + closed event cards, build event info
  const allCards = [...dashboard.openRegistrations, ...dashboard.closedRegistrations];

  // Since we cannot fetch all registrations for all events without N+1 API calls,
  // we'll show the most active events as "top performers"
  // listing events with most participants as a proxy
  const eventPerformers: TopPerformerEntry[] = allCards
    .filter((c) => c.maxParticipants && c.maxParticipants > 0)
    .sort((a, b) => (b.maxParticipants || 0) - (a.maxParticipants || 0))
    .slice(0, 5)
    .map((card, i) => ({
      rank: i + 1,
      name: card.name,
      eventName: card.sportName || "Event",
      sport: card.sportName || "Sports",
      eventsCount: card.maxParticipants || 0,
      label: "Max Players",
      avatar: getInitials(card.name),
      color: GRADIENT_CLASSES[i % GRADIENT_CLASSES.length],
    }));

  // If we have myRegistrations, show top events user participated in
  if (eventPerformers.length === 0 && dashboard.myRegistrations.length > 0) {
    return dashboard.myRegistrations.slice(0, 5).map((reg: DashboardMyRegistration, i: number) => ({
      rank: i + 1,
      name: reg.eventName || "Event",
      eventName: reg.sportName || "Sport",
      sport: reg.sportName || "Sports",
      eventsCount: 1,
      label: reg.status || "Registered",
      avatar: getInitials(reg.eventName || "EV"),
      color: GRADIENT_CLASSES[i % GRADIENT_CLASSES.length],
    }));
  }

  return eventPerformers;
}

// ── Main aggregation ─────────────────────────────────────────────────────────

export const analyticsService = {
  async getAnalyticsData(): Promise<AnalyticsData> {
    // Fetch all data sources in parallel (dashboard split into granular requests)
    const [stats, upcoming, openTournaments, closedTournaments, myRegistrations, overview, configs] = await Promise.all([
      sportsDashboardService.getStats(),
      sportsDashboardService.getUpcomingEvents(),
      sportsDashboardService.getOpenTournaments(),
      sportsDashboardService.getClosedTournaments(),
      sportsDashboardService.getMyRegistrations(),
      sportsAdminService.getOverview(),
      tournamentService.getConfigs().catch(() => [] as ConfigInfo[]),
    ]);

    const openRegistrations = openTournaments.flatMap(t => t.events);
    const closedRegistrations = closedTournaments.flatMap(t => t.events);

    const dashboard: SportsDashboardResponse = {
      stats,
      openRegistrations,
      closedRegistrations,
      myUpcomingEvents: upcoming,
      myRegistrations,
      openTournaments
    };

    // Extract unique sport names from events
    const sportNameSet = new Set<string>();
    overview.events.forEach((ev: AdminEventRow) => {
      if (ev.sport?.name) sportNameSet.add(ev.sport.name);
    });
    const sportNames = Array.from(sportNameSet).sort();
    const sportColorMap = buildSportColorMap(sportNames);

    // Fetch matches for each config (limit to active/recent ones to avoid too many calls)
    const activeConfigs = configs
      .filter((c: ConfigInfo) => c.status === "PUBLISHED" || c.status === "DRAFT" || c.status === "LIVE")
      .slice(0, 10); // cap at 10 to avoid excessive API calls

    const matchResults = await Promise.all(
      activeConfigs.map((c: ConfigInfo) =>
        tournamentService
          .getMatchesByConfigId(c.id)
          .then((matches) => [c.id, matches] as [number, any[]])
          .catch(() => [c.id, []] as [number, any[]]),
      ),
    );
    const matchesByConfig = new Map<number, any[]>(matchResults);

    // Compute all analytics
    const kpis = computeKPIs(dashboard, overview);
    const monthlyEvents = computeMonthlyEvents(overview.events, sportNames);
    const sportShare = computeSportShare(overview.events, sportNames, sportColorMap);
    const participationTrend = computeParticipationTrend(dashboard.myRegistrations, overview.events);
    const standings = computeStandings(activeConfigs, matchesByConfig);
    const topPerformers = computeTopPerformers(dashboard, overview);

    return {
      kpis,
      monthlyEvents,
      sportShare,
      participationTrend,
      standings,
      topPerformers,
      sportNames,
      sportColorMap,
    };
  },
};
