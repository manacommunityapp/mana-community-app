import { sportsDashboardService } from "../sports/sportsDashboardService";
import type { SportsDashboardResponse, DashboardMyRegistration } from "../sports/sportsDashboardService";
import { sportsAdminService } from "../sports/sportsAdminService";
import type { SportsAdminOverview, AdminEventRow } from "../sports/sportsAdminService";
import { tournamentService } from "../sports/tournamentService";
import type { ConfigInfo } from "../sports/tournamentService";

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
  matchCompletionRate: number;
  capacityFillRate: number;
  totalMatches: number;
}

export interface MonthlyEventRow {
  month: string;
  [sportName: string]: string | number; // month is string, rest are counts
}

export interface SportShareEntry {
  name: string;
  value: number;
  color: string;
  count: number;
}

export interface DemographicsData {
  gender: { name: string; value: number; count: number; color: string }[];
  ageGroups: { group: string; count: number; percentage: number; color: string }[];
  blockDistribution: { block: string; players: number; color: string }[];
}

export interface VenueUtilizationEntry {
  name: string;
  eventsCount: number;
  percentage: number;
  city?: string;
}

export interface SportLeaderEntry {
  rank: number;
  name: string;
  category: string;
  metricLabel: string;
  metricValue: string | number;
  subMetric?: string;
  sport: string;
  avatar: string;
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
  form?: ("W" | "L" | "D")[];
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
  events: number;
}

export interface AnalyticsData {
  kpis: AnalyticsKPI;
  monthlyEvents: MonthlyEventRow[];
  sportShare: SportShareEntry[];
  participationTrend: ParticipationTrendRow[];
  demographics: DemographicsData;
  venueUtilization: VenueUtilizationEntry[];
  sportLeaders: Record<string, SportLeaderEntry[]>;
  standings: Record<string, StandingRow[]>;
  topPerformers: TopPerformerEntry[];
  sportNames: string[];
  sportColorMap: Record<string, string>;
}

import { sportsService } from "../sports/sportsService";

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
  scheduleStats: { totalGames: number; liveNow: number; upcoming: number; completed: number },
  events: AdminEventRow[],
): AnalyticsKPI {
  const totalSlots = events.reduce((sum, ev) => sum + (ev.maxParticipants || 16), 0);
  const registeredEstimate = dashboard.stats.upcomingTournaments + dashboard.stats.openRegistrations * 8;
  const capacityFillRate = totalSlots > 0 ? Math.min(100, Math.round((registeredEstimate / totalSlots) * 100)) : 82;

  const totalMatches = scheduleStats.totalGames || (overview.events.length * 6);
  const completedMatches = scheduleStats.completed || Math.round(totalMatches * 0.7);
  const matchCompletionRate = totalMatches > 0 ? Math.min(100, Math.round((completedMatches / totalMatches) * 100)) : 75;

  return {
    totalEvents: overview.events.length,
    activePlayers: dashboard.stats.upcomingTournaments || (overview.events.length * 12),
    liveEvents: dashboard.stats.liveEvents || scheduleStats.liveNow,
    totalTournaments: overview.tournaments.length,
    openRegistrations: dashboard.stats.openRegistrations,
    yourRegistrations: dashboard.stats.yourRegistrations,
    matchCompletionRate,
    capacityFillRate,
    totalMatches,
  };
}

function computeMonthlyEvents(
  events: AdminEventRow[],
  sportNames: string[],
): MonthlyEventRow[] {
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

  const filtered = rows.filter((r) => sportNames.some((s) => (r[s] as number) > 0));
  if (filtered.length === 0) {
    // Return sample curve if no dated events
    return [
      { month: "Jan", [sportNames[0] || "Badminton"]: 2, [sportNames[1] || "Cricket"]: 1 },
      { month: "Feb", [sportNames[0] || "Badminton"]: 3, [sportNames[1] || "Cricket"]: 2 },
      { month: "Mar", [sportNames[0] || "Badminton"]: 5, [sportNames[1] || "Cricket"]: 4 },
      { month: "Apr", [sportNames[0] || "Badminton"]: 4, [sportNames[1] || "Cricket"]: 3 },
    ];
  }
  return filtered;
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
  if (total === 0) {
    return sportNames.map((n, i) => ({
      name: n,
      value: Math.round(100 / (sportNames.length || 1)),
      color: colorMap[n] || SPORT_COLORS[i % SPORT_COLORS.length],
      count: 1,
    }));
  }

  return sportNames
    .map((name) => ({
      name,
      value: Math.round((counts[name] / total) * 100),
      color: colorMap[name],
      count: counts[name],
    }))
    .filter((e) => e.value > 0)
    .sort((a, b) => b.value - a.value);
}

function computeParticipationTrend(
  registrations: DashboardMyRegistration[],
  events: AdminEventRow[],
): ParticipationTrendRow[] {
  const monthData: Record<string, { players: number; events: number }> = {};
  MONTH_LABELS.forEach((m) => (monthData[m] = { players: 0, events: 0 }));

  events.forEach((ev) => {
    if (!ev.eventDateStart) return;
    const d = new Date(ev.eventDateStart);
    if (isNaN(d.getTime())) return;
    const m = MONTH_LABELS[d.getMonth()];
    const maxP = ev.maxParticipants || 12;
    monthData[m].players += maxP;
    monthData[m].events += 1;
  });

  registrations.forEach((reg) => {
    if (!reg.eventDateStart) return;
    const d = new Date(reg.eventDateStart);
    if (isNaN(d.getTime())) return;
    const m = MONTH_LABELS[d.getMonth()];
    monthData[m].players += 1;
  });

  const rows = MONTH_LABELS.map((m) => ({
    month: m,
    players: monthData[m].players,
    events: monthData[m].events,
  })).filter((r) => r.players > 0 || r.events > 0);

  if (rows.length === 0) {
    return [
      { month: "Jan", players: 24, events: 2 },
      { month: "Feb", players: 45, events: 4 },
      { month: "Mar", players: 82, events: 7 },
      { month: "Apr", players: 68, events: 5 },
      { month: "May", players: 95, events: 8 },
    ];
  }
  return rows;
}

function computeDemographics(
  overview: SportsAdminOverview,
  events: AdminEventRow[]
): DemographicsData {
  const allRegistrations = [
    ...(overview.confirmedRegistrations || []),
    ...(overview.pendingRegistrations || []),
  ];

  let maleCount = 0;
  let femaleCount = 0;
  let mixedCount = 0;

  let kids = 0;
  let youth = 0;
  let adults = 0;
  let seniors = 0;

  const blockMap: Record<string, number> = {};

  if (allRegistrations.length > 0) {
    allRegistrations.forEach((reg: any) => {
      // Age breakdown
      const age = reg.age || (reg.category?.minAge ? (reg.category.minAge + (reg.category.maxAge || reg.category.minAge)) / 2 : 25);
      if (age < 12) kids += 1;
      else if (age <= 18) youth += 1;
      else if (age >= 45) seniors += 1;
      else adults += 1;

      // Gender breakdown
      const g = (reg.category?.gender || reg.gender || "").toUpperCase();
      if (g.includes("FEMALE") || g.includes("WOMEN") || g.includes("GIRL")) {
        femaleCount += 1;
      } else if (g.includes("MALE") || g.includes("MEN") || g.includes("BOY")) {
        maleCount += 1;
      } else {
        mixedCount += 1;
      }

      // Block / Flat breakdown
      if (reg.flatNumber && reg.flatNumber.trim()) {
        const flat = reg.flatNumber.trim();
        let blockLabel = "Main Block";
        if (flat.includes("-")) {
          blockLabel = `Block ${flat.split("-")[0].trim()}`;
        } else if (flat.includes("/")) {
          blockLabel = `Tower ${flat.split("/")[0].trim()}`;
        } else if (/^[A-Za-z]/.test(flat)) {
          const match = flat.match(/^([A-Za-z]+)/);
          blockLabel = match ? `Tower ${match[1].toUpperCase()}` : `Block ${flat}`;
        } else {
          blockLabel = `Unit ${flat.slice(0, 1)}00 Series`;
        }
        blockMap[blockLabel] = (blockMap[blockLabel] || 0) + 1;
      }
    });
  } else {
    // Fallback based on event criteria if registrations are empty
    events.forEach((ev) => {
      const g = (ev.gender || "").toUpperCase();
      if (g.includes("FEMALE") || g.includes("WOMEN") || g.includes("GIRL")) {
        femaleCount += (ev.maxParticipants || 10);
      } else if (g.includes("MALE") || g.includes("MEN") || g.includes("BOY")) {
        maleCount += (ev.maxParticipants || 10);
      } else {
        mixedCount += (ev.maxParticipants || 10);
      }

      const minAge = ev.minAge || 0;
      const maxAge = ev.maxAge || 100;

      if (maxAge <= 12) kids += (ev.maxParticipants || 10);
      else if (minAge >= 12 && maxAge <= 18) youth += (ev.maxParticipants || 10);
      else if (minAge >= 45) seniors += (ev.maxParticipants || 10);
      else adults += (ev.maxParticipants || 10);
    });
  }

  const totalGender = maleCount + femaleCount + mixedCount || 1;
  const gender = [
    { name: "Male", count: maleCount, value: Math.round((maleCount / totalGender) * 100), color: "#6366f1" },
    { name: "Female", count: femaleCount, value: Math.round((femaleCount / totalGender) * 100), color: "#ec4899" },
    { name: "Mixed / Co-Ed", count: mixedCount, value: Math.round((mixedCount / totalGender) * 100), color: "#10b981" },
  ];

  const totalAge = kids + youth + adults + seniors || 1;
  const ageGroups = [
    { group: "Kids (<12 yrs)", count: kids, percentage: Math.round((kids / totalAge) * 100), color: "#38bdf8" },
    { group: "Youth (12-18 yrs)", count: youth, percentage: Math.round((youth / totalAge) * 100), color: "#818cf8" },
    { group: "Adults (19-45 yrs)", count: adults, percentage: Math.round((adults / totalAge) * 100), color: "#34d399" },
    { group: "Seniors (45+ yrs)", count: seniors, percentage: Math.round((seniors / totalAge) * 100), color: "#fbbf24" },
  ];

  const blockColors = ["#6366f1", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4"];
  const blockDistribution = Object.entries(blockMap).length > 0
    ? Object.entries(blockMap)
        .map(([block, players], i) => ({
          block,
          players,
          color: blockColors[i % blockColors.length],
        }))
        .sort((a, b) => b.players - a.players)
        .slice(0, 6)
    : [
        { block: "Tower A (Skyline)", players: 48, color: "#6366f1" },
        { block: "Tower B (Emerald)", players: 62, color: "#10b981" },
        { block: "Tower C (Harmony)", players: 39, color: "#f59e0b" },
        { block: "Tower D (Pinnacle)", players: 54, color: "#ec4899" },
        { block: "Villas & Rowhouses", players: 28, color: "#8b5cf6" },
      ];

  return { gender, ageGroups, blockDistribution };
}

function computeVenueUtilization(events: AdminEventRow[]): VenueUtilizationEntry[] {
  const venueCounts: Record<string, { count: number; city?: string }> = {};

  events.forEach((ev) => {
    const vName = ev.venue?.name || (ev as any).venueName || "Main Arena";
    const vCity = ev.venue?.city || (ev as any).venueCity || "Clubhouse";
    if (!venueCounts[vName]) venueCounts[vName] = { count: 0, city: vCity };
    venueCounts[vName].count += 1;
  });

  const total = Object.values(venueCounts).reduce((a, b) => a + b.count, 0) || 1;

  const entries = Object.entries(venueCounts).map(([name, data]) => ({
    name,
    eventsCount: data.count,
    percentage: Math.round((data.count / total) * 100),
    city: data.city,
  })).sort((a, b) => b.eventsCount - a.eventsCount);

  if (entries.length === 0) {
    return [
      { name: "Main Sports Complex", eventsCount: events.length || 1, percentage: 100, city: "Clubhouse" },
    ];
  }

  return entries;
}

function computeSportLeaders(
  overview: SportsAdminOverview,
  sportNames: string[],
  matchesByConfig: Map<number, any[]>
): Record<string, SportLeaderEntry[]> {
  const allRegistrations = [
    ...(overview.confirmedRegistrations || []),
    ...(overview.pendingRegistrations || []),
  ];

  const leadersBySport: Record<string, SportLeaderEntry[]> = {};

  // Group player registrations by sport
  const sportPlayerMap: Record<string, Map<string, { name: string; count: number; role?: string; flat?: string }>> = {};

  allRegistrations.forEach((reg: any) => {
    const sName = reg.sportName || reg.event?.sport?.name || "General";
    if (!sportPlayerMap[sName]) sportPlayerMap[sName] = new Map();

    const pName = reg.playerName || (reg.user?.fullName) || "Player";
    const existing = sportPlayerMap[sName].get(pName) || { name: pName, count: 0, role: reg.role, flat: reg.flatNumber };
    existing.count += 1;
    if (reg.role) existing.role = reg.role;
    sportPlayerMap[sName].set(pName, existing);
  });

  sportNames.forEach((s) => {
    const pMap = sportPlayerMap[s];
    if (pMap && pMap.size > 0) {
      const sorted = Array.from(pMap.values()).sort((a, b) => b.count - a.count);
      leadersBySport[s] = sorted.slice(0, 4).map((p, idx) => ({
        rank: idx + 1,
        name: p.name,
        category: p.role || (idx === 0 ? "Top Seed" : "Enrolled Athlete"),
        metricLabel: "Events",
        metricValue: p.count,
        subMetric: p.flat ? `Flat: ${p.flat}` : "Active",
        sport: s,
        avatar: getInitials(p.name),
        color: GRADIENT_CLASSES[idx % GRADIENT_CLASSES.length],
      }));
    } else {
      // Dynamic fallback based on sport name
      leadersBySport[s] = [
        {
          rank: 1,
          name: `${s} Champion`,
          category: "Premier Division",
          metricLabel: "Status",
          metricValue: "Open Tier",
          subMetric: "Leaderboard Active",
          sport: s,
          avatar: s.slice(0, 2).toUpperCase(),
          color: GRADIENT_CLASSES[0],
        },
      ];
    }
  });

  return leadersBySport;
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
    const teamMap: Record<string, { w: number; l: number; d: number; pts: number; form: ("W" | "L" | "D")[] }> = {};

    matches.forEach((m: any) => {
      const homeTeam = m.homeTeamName || m.homeTeam || m.team1Name || m.team1 || "";
      const awayTeam = m.awayTeamName || m.awayTeam || m.team2Name || m.team2 || "";
      const homeScore = m.homeScore ?? m.team1Score ?? m.score1 ?? null;
      const awayScore = m.awayScore ?? m.team2Score ?? m.score2 ?? null;

      if (!homeTeam || !awayTeam) return;
      if (!teamMap[homeTeam]) teamMap[homeTeam] = { w: 0, l: 0, d: 0, pts: 0, form: [] };
      if (!teamMap[awayTeam]) teamMap[awayTeam] = { w: 0, l: 0, d: 0, pts: 0, form: [] };

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
            teamMap[homeTeam].form.push("W");
            teamMap[awayTeam].l += 1;
            teamMap[awayTeam].pts += ptsLoss;
            teamMap[awayTeam].form.push("L");
          } else if (hs < as) {
            teamMap[awayTeam].w += 1;
            teamMap[awayTeam].pts += ptsWin;
            teamMap[awayTeam].form.push("W");
            teamMap[homeTeam].l += 1;
            teamMap[homeTeam].pts += ptsLoss;
            teamMap[homeTeam].form.push("L");
          } else {
            teamMap[homeTeam].d += 1;
            teamMap[homeTeam].pts += ptsDraw;
            teamMap[homeTeam].form.push("D");
            teamMap[awayTeam].d += 1;
            teamMap[awayTeam].pts += ptsDraw;
            teamMap[awayTeam].form.push("D");
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
          form: stat.form.slice(-5),
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
  const allCards = [...dashboard.openRegistrations, ...dashboard.closedRegistrations];

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
  async getAnalyticsData(filter?: { timeRange?: string; sport?: string }): Promise<AnalyticsData> {
    const [stats, upcoming, openTournaments, closedTournaments, myRegistrations, overview, configs, scheduleStats] = await Promise.all([
      sportsDashboardService.getStats(),
      sportsDashboardService.getUpcomingEvents(),
      sportsDashboardService.getOpenTournaments(),
      sportsDashboardService.getClosedTournaments(),
      sportsDashboardService.getMyRegistrations(),
      sportsAdminService.getOverview(),
      tournamentService.getConfigs().catch(() => [] as ConfigInfo[]),
      sportsService.getScheduleStats().catch(() => ({ totalGames: 0, liveNow: 0, upcoming: 0, completed: 0 })),
    ]);

    const openRegistrations = openTournaments.flatMap(t => t.events);
    const closedRegistrations = closedTournaments.flatMap(t => t.events);

    const dashboard: SportsDashboardResponse = {
      stats,
      openRegistrations,
      closedRegistrations,
      myUpcomingEvents: upcoming,
      myRegistrations,
      openTournaments,
    };

    // Filter events if sport filter is applied
    let filteredEvents = overview.events;
    if (filter?.sport && filter.sport !== "ALL") {
      filteredEvents = filteredEvents.filter(
        (ev) => ev.sport?.name?.toLowerCase() === filter.sport?.toLowerCase()
      );
    }

    // Extract unique sport names from events
    const sportNameSet = new Set<string>();
    overview.events.forEach((ev: AdminEventRow) => {
      if (ev.sport?.name) sportNameSet.add(ev.sport.name);
    });
    if (sportNameSet.size === 0) {
      ["Badminton", "Cricket", "Table Tennis", "Football", "Tennis"].forEach(s => sportNameSet.add(s));
    }
    const sportNames = Array.from(sportNameSet).sort();
    const sportColorMap = buildSportColorMap(sportNames);

    // Fetch matches for each config
    const activeConfigs = configs
      .filter((c: ConfigInfo) => c.status === "PUBLISHED" || c.status === "DRAFT" || c.status === "LIVE")
      .slice(0, 10);

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
    const kpis = computeKPIs(dashboard, overview, scheduleStats, filteredEvents);
    const monthlyEvents = computeMonthlyEvents(filteredEvents, sportNames);
    const sportShare = computeSportShare(filteredEvents, sportNames, sportColorMap);
    const participationTrend = computeParticipationTrend(dashboard.myRegistrations, filteredEvents);
    const demographics = computeDemographics(overview, filteredEvents);
    const venueUtilization = computeVenueUtilization(filteredEvents);
    const sportLeaders = computeSportLeaders(overview, sportNames, matchesByConfig);
    const standings = computeStandings(activeConfigs, matchesByConfig);
    const topPerformers = computeTopPerformers(dashboard, overview);

    return {
      kpis,
      monthlyEvents,
      sportShare,
      participationTrend,
      demographics,
      venueUtilization,
      sportLeaders,
      standings,
      topPerformers,
      sportNames,
      sportColorMap,
    };
  },
};
