import { sportsAdminService, type AdminEventRow, type AdminRegistrationRow } from "../sports/sportsAdminService";
import { sportsEventService } from "../sports/sportsEventService";
import { tournamentService, type ConfigInfo } from "../sports/tournamentService";
import { tournamentPaymentService, type TournamentPaymentsSource, type TournamentPlayerPayment } from "../sports/tournamentPaymentService";
import { auctionService } from "../sports/auctionService";
import type { EventRegistration, SportsEvent, AuctionConfigResponse, AuctionTeam } from "../../types/api";

const SPORT_COLORS = ["#818cf8", "#34d399", "#a78bfa", "#f472b6", "#fbbf24", "#38bdf8", "#fb923c", "#4ade80"];
const GRADIENT_CLASSES = ["from-indigo-400 to-violet-500", "from-emerald-400 to-teal-500", "from-violet-400 to-purple-500", "from-pink-400 to-rose-500"];

export interface AnalyticsKPI { totalEvents: number; activePlayers: number; liveEvents: number; totalTournaments: number; openRegistrations: number; yourRegistrations: number; tournamentRegistrants: number; eventPlayerEntries: number; paymentCollectedAmount: number; paidTournamentPlayers: number; waivedTournamentPlayers: number; matchCompletionRate: number; capacityFillRate: number; capacityTracked: boolean; totalMatches: number }
export interface MonthlyEventRow { month: string; [sportName: string]: string | number }
export interface SportShareEntry { name: string; value: number; color: string; count: number }
export interface DemographicsData { gender: { name: string; value: number; count: number; color: string }[]; ageGroups: { group: string; count: number; percentage: number; color: string }[]; blockDistribution: { block: string; players: number; color: string }[] }
export interface VenueUtilizationEntry { name: string; eventsCount: number; percentage: number; city?: string }
export interface SportLeaderEntry { rank: number; name: string; category: string; metricLabel: string; metricValue: string | number; subMetric?: string; sport: string; avatar: string; color: string }
export interface StandingRow { rank: number; team: string; w: number; l: number; d: number; pts: number; pct: number; form?: ("W" | "L" | "D")[] }
export interface SportsAnalyticsEventRow { id: number; tournament: string; name: string; sport: string; date: string; venue: string; status: string; capacity: number | null; registered: number; confirmed: number; pending: number }
export interface SportsAnalyticsTournamentRow { id: number; name: string; status: string; startDate: string | null; endDate: string | null; sports: string[]; eventCount: number; registrations: number; registeredUsers: number }
export interface SportsAnalyticsPaymentRow { id: number | string; tournamentId: number; tournament: string; playerKey: string; playerName: string; flatNumber: string; paymentStatus: "PAID" | "WAIVED"; amount: number; paymentMode: string; transactionRef: string; paidAt: string; markedBy: string; source: TournamentPaymentsSource }
export interface SportsAnalyticsRegistrationRow { id: number; participant: string; relation: string; event: string; tournament: string; sport: string; category: string; status: string; flat: string; registeredAt: string }
export interface SportsAnalyticsMatchRow { id: number | string; tournament: string; event: string; sport: string; stage: string; homeTeam: string; awayTeam: string; score: string; winner: string; scheduledAt: string; venue: string; status: string; isFinal: boolean; isCompleted: boolean }
export interface SportsAnalyticsTeamRow { id: number; team: string; tournament: string; event: string; sport: string; captain: string; players: string[]; playerCount: number }
export interface ParticipationTrendRow { month: string; players: number; events: number }
export interface AnalyticsData {
  kpis: AnalyticsKPI; monthlyEvents: MonthlyEventRow[]; sportShare: SportShareEntry[]; participationTrend: ParticipationTrendRow[];
  demographics: DemographicsData; venueUtilization: VenueUtilizationEntry[]; sportLeaders: Record<string, SportLeaderEntry[]>;
  standings: Record<string, StandingRow[]>; sportNames: string[]; sportColorMap: Record<string, string>;
  tournamentOptions: { id: number; name: string }[]; availableYears: number[];
  eventInventory: SportsAnalyticsEventRow[]; tournamentInventory: SportsAnalyticsTournamentRow[]; paymentInventory: SportsAnalyticsPaymentRow[];
  registrationInventory: SportsAnalyticsRegistrationRow[]; matchInventory: SportsAnalyticsMatchRow[]; teamInventory: SportsAnalyticsTeamRow[];
  dataWarnings: string[];
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const label = (value?: string | null) => value?.trim() || "—";
const cleanScheduleTitle = (value?: string | null) => String(value || "").trim().replace(/\s+(?:(?:fixture|match)\s+)?schedule(?:\s+(?:config|configuration))?$/i, "").trim();
const validScoreValue = (...values: unknown[]): string | null => {
  for (const value of values) {
    if (value == null || (typeof value === "number" && !Number.isFinite(value))) continue;
    const normalized = String(value).trim();
    if (!normalized || /^(nan|undefined|null)$/i.test(normalized)) continue;
    return normalized;
  }
  return null;
};
const statusIs = (value: string | null | undefined, ...statuses: string[]) => statuses.includes(String(value || "").toUpperCase());
const initials = (name: string) => name.split(/\s+/).map((part) => part[0]).join("").toUpperCase().slice(0, 2);

function inDateRange(raw: string | null | undefined, range: string | undefined, now: Date): boolean {
  if (!raw || !range || range === "ALL") return true;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return false;
  if (range === "THIS_YEAR") return date.getFullYear() === now.getFullYear();
  return date.getTime() >= now.getTime() - 30 * 86400000 && date.getTime() <= now.getTime();
}

function makeStandings(configs: ConfigInfo[], matchesByConfig: Map<number, any[]>, getTournamentName: (eventId: number, fallback?: string) => string): Record<string, StandingRow[]> {
  const result: Record<string, StandingRow[]> = {};
  configs.forEach((config) => {
    const teams = new Map<string, { w: number; l: number; d: number; pts: number; form: ("W" | "L" | "D")[] }>();
    (matchesByConfig.get(config.id) || []).forEach((match: any) => {
      const home = match.homeTeamName || match.homeTeam?.name || match.teamA?.name || match.team1Name || "";
      const away = match.awayTeamName || match.awayTeam?.name || match.teamB?.name || match.team2Name || "";
      const hs = match.homeScore ?? match.team1Score ?? match.scoreTeamA ?? match.scoreA;
      const as = match.awayScore ?? match.team2Score ?? match.scoreTeamB ?? match.scoreB;
      if (!home || !away || hs == null || as == null || !statusIs(match.status, "COMPLETED", "FINISHED", "RESULT_RECORDED")) return;
      if (!teams.has(home)) teams.set(home, { w: 0, l: 0, d: 0, pts: 0, form: [] });
      if (!teams.has(away)) teams.set(away, { w: 0, l: 0, d: 0, pts: 0, form: [] });
      const h = teams.get(home)!; const a = teams.get(away)!;
      if (Number(hs) > Number(as)) { h.w++; h.pts += config.pointsForWin ?? 3; h.form.push("W"); a.l++; a.pts += config.pointsForLoss ?? 0; a.form.push("L"); }
      else if (Number(hs) < Number(as)) { a.w++; a.pts += config.pointsForWin ?? 3; a.form.push("W"); h.l++; h.pts += config.pointsForLoss ?? 0; h.form.push("L"); }
      else { h.d++; a.d++; h.pts += config.pointsForDraw ?? 1; a.pts += config.pointsForDraw ?? 1; h.form.push("D"); a.form.push("D"); }
    });
    const rows = [...teams.entries()].map(([team, row]) => ({ rank: 0, team, ...row, pct: row.w + row.l + row.d ? row.w / (row.w + row.l + row.d) : 0, form: row.form.slice(-5) }))
      .sort((a, b) => b.pts - a.pts || b.pct - a.pct).map((row, index) => ({ ...row, rank: index + 1 }));
    if (rows.length) result[getTournamentName(Number(config.eventId), config.tournamentName || config.eventName || `Tournament ${config.id}`)] = rows;
  });
  return result;
}

export const analyticsService = {
  async getAnalyticsData(filter?: { timeRange?: string; sport?: string; tournamentId?: number | string; year?: number | string }): Promise<AnalyticsData> {
    const [overview, configResult, auctionResult, eventPageResult] = await Promise.all([
      sportsAdminService.getOverview(),
      tournamentService.getConfigsForAnalytics().then((configs) => ({ configs, available: true })).catch(() => ({ configs: [] as ConfigInfo[], available: false })),
      auctionService.getAllCommunityConfigs().then((configs) => ({ configs, available: true })).catch(() => ({ configs: [] as AuctionConfigResponse[], available: false })),
      sportsEventService.getAllSportsEventsPaged().then((events) => ({ events, available: true })).catch(() => ({ events: [] as SportsEvent[], available: false })),
    ]);
    const now = new Date();
    const dataWarnings: string[] = [];
    const configs = configResult.configs;
    const auctionConfigs = auctionResult.configs;
    const pagedEvents = eventPageResult.events;
    const completeEventListAvailable = eventPageResult.available && (pagedEvents.length > 0 || !(overview.events || []).length);
    if (!completeEventListAvailable) dataWarnings.push("Could not load the full paginated sports event list. The dashboard is using the admin overview, which may omit venue details and is limited to 100 events.");
    if (!configResult.available) dataWarnings.push("Tournament schedule configurations could not be loaded. Match and standings sections may be incomplete.");
    if (!auctionResult.available) dataWarnings.push("Auction configurations could not be loaded. Team and squad records may be incomplete.");
    // The admin overview intentionally returns lean registration rows with eventName/sportName,
    // while the full event endpoint includes venue details and is paginated (the overview caps at 100).
    const sourceEvents: AdminEventRow[] = pagedEvents.length ? pagedEvents.map((event) => {
      const fullEvent = event as SportsEvent & { tournamentId?: number | null };
      return {
        id: event.id, name: event.name, eventDateStart: event.eventDateStart || null, eventDateEnd: event.eventDateEnd || null,
        format: event.format || null, tournamentType: typeof event.tournamentType === "string" ? event.tournamentType : null,
        gender: event.gender || null, minAge: event.minAge ?? null, maxAge: event.maxAge ?? null, maxParticipants: event.maxParticipants ?? null,
        registrationStatus: (event as any).registrationStatus || (event as any).status || event.tournament?.registrationStatus || null, auctionStatus: event.auctionStatus || null,
        sport: event.sport ? { name: event.sport.name || event.sportName || null, icon: event.sport.icon || null, iconUrl: event.sport.iconUrl || null } : event.sportName ? { name: event.sportName, icon: null, iconUrl: null } : null,
        tournamentId: fullEvent.tournamentId ?? event.tournament?.id ?? null,
        venue: event.venue ? { name: event.venue.name, city: event.venue.city } : event.venueName ? { name: event.venueName } : null,
      };
    }) : overview.events || [];
    const registrationSource = Array.isArray(overview.registrations)
      ? overview.registrations
      : [...(overview.confirmedRegistrations || []), ...(overview.pendingRegistrations || [])];
    const summaryRegistrations: AdminRegistrationRow[] = registrationSource
      .filter((registration) => statusIs(registration.status, "PENDING", "REGISTERED", "CONFIRMED"));
    const normalize = (value: string | null | undefined) => String(value || "").trim().toLowerCase();
    const summaryKey = (name: string | null | undefined, sport: string | null | undefined) => `${normalize(name)}|${normalize(sport)}`;
    const eventGroups = new Map<string, AdminEventRow[]>();
    sourceEvents.forEach((event) => { const key = summaryKey(event.name, event.sport?.name); eventGroups.set(key, [...(eventGroups.get(key) || []), event]); });
    const ambiguousKeys = new Set([...eventGroups.entries()].filter(([, grouped]) => grouped.length > 1).map(([key]) => key));
    const registrationRowsNeedNameMatching = summaryRegistrations.some((registration) => registration.eventId == null);
    const ambiguousEvents = registrationRowsNeedNameMatching
      ? sourceEvents.filter((event) => ambiguousKeys.has(summaryKey(event.name, event.sport?.name)))
      : [];
    // When an older backend response has no eventId, use event-specific lookups for
    // duplicate event/sport names to preserve the correct registration association.
    const detailedRegistrationResults = await Promise.all(ambiguousEvents.map(async (event) => {
      try { return { eventId: event.id, rows: await sportsEventService.getEventRegistrations(event.id), loaded: true }; }
      catch { return { eventId: event.id, rows: [] as EventRegistration[], loaded: false }; }
    }));
    const detailedEventIds = new Set(detailedRegistrationResults.filter((result) => result.loaded).map((result) => result.eventId));
    const fullyLoadedAmbiguousKeys = new Set([...eventGroups.entries()]
      .filter(([key, grouped]) => ambiguousKeys.has(key) && grouped.every((event) => detailedEventIds.has(event.id)))
      .map(([key]) => key));
    const fullyLoadedAmbiguousEventIds = new Set([...fullyLoadedAmbiguousKeys].flatMap((key) => (eventGroups.get(key) || []).map((event) => event.id)));
    const summaryRowsMapped: EventRegistration[] = summaryRegistrations.flatMap((registration) => {
      const key = summaryKey(registration.eventName, registration.sportName);
      const candidates = eventGroups.get(key) || [];
      const matchingEvent = registration.eventId != null
        ? sourceEvents.find((event) => Number(event.id) === Number(registration.eventId))
        : candidates[0] || sourceEvents.filter((event) => normalize(event.name) === normalize(registration.eventName)).slice(0, 1)[0];
      if (fullyLoadedAmbiguousKeys.has(key)) return [];
      return [{
        id: registration.id, playerName: registration.participantName || registration.playerName || undefined, email: registration.email || undefined,
        flatNumber: registration.flatNumber || undefined, relation: registration.relation || undefined, age: registration.age ?? undefined,
        role: registration.role || undefined, status: (registration.status || "UNKNOWN") as EventRegistration["status"],
        registeredAt: registration.registeredAt || undefined,
        user: registration.userId != null ? { id: registration.userId, fullName: registration.participantName || registration.playerName || undefined, gender: registration.gender || undefined } as unknown as EventRegistration["user"] : undefined,
        familyMember: registration.familyMemberId != null ? { id: registration.familyMemberId, name: registration.participantName || registration.playerName || undefined, relation: registration.relation || undefined, age: registration.age ?? undefined, gender: registration.gender || undefined } as any : undefined,
        event: matchingEvent ? { id: matchingEvent.id, name: matchingEvent.name, sport: matchingEvent.sport ? { name: matchingEvent.sport.name } : undefined } as EventRegistration["event"] : undefined,
        category: registration.categoryName || registration.role ? { name: registration.categoryName || registration.role || undefined } as NonNullable<EventRegistration["category"]> : undefined,
      } as EventRegistration];
    });
    const detailedRows = detailedRegistrationResults.filter((result) => fullyLoadedAmbiguousEventIds.has(result.eventId)).flatMap((result) => result.rows);
    const unmatchedRegistrationCount = summaryRowsMapped.filter((registration) => !registration.event?.id).length;
    if (unmatchedRegistrationCount) dataWarnings.push(`${unmatchedRegistrationCount} registration record(s) could not be linked to an event in the loaded event list.`);
    if (summaryRegistrations.length && summaryRowsMapped.some((registration) => !(registration as any).familyMember && !(registration.user as any)?.gender)) dataWarnings.push("Some registered participant records do not include gender or family-member details, so demographic breakdowns may be incomplete.");
    if (registrationRowsNeedNameMatching && [...ambiguousKeys].some((key) => !fullyLoadedAmbiguousKeys.has(key))) dataWarnings.push("Some events share the same name and sport. Event-specific registration lookup was unavailable for one or more of them, so registration matching may be incomplete.");
    const allRegistrations: EventRegistration[] = [...summaryRowsMapped, ...detailedRows]
      .filter((registration) => !statusIs(registration.status, "WITHDRAWN", "REJECTED"));
    const allSports = Array.from(new Set(sourceEvents.map((event) => event.sport?.name).filter((name): name is string => Boolean(name)))).sort();
    const colorMap = Object.fromEntries(allSports.map((sport, index) => [sport, SPORT_COLORS[index % SPORT_COLORS.length]]));
    const matchesSport = (sport?: string | null) => !filter?.sport || filter.sport === "ALL" || String(sport || "").toLowerCase() === filter.sport.toLowerCase();
    const tournamentIdByEventId = new Map<number, number>();
    const tournamentNameById = new Map<number, string>();
    (overview.tournaments || []).forEach((tournament) => tournamentNameById.set(Number(tournament.id), String(tournament.name || "").trim()));
    (overview.tournaments || []).forEach((tournament) => (tournament.events || []).forEach((event) => {
      tournamentIdByEventId.set(Number(event.id), Number(tournament.id));
    }));
    sourceEvents.forEach((event) => {
      if (event.tournamentId != null) tournamentIdByEventId.set(Number(event.id), Number(event.tournamentId));
    });
    const getTournamentName = (eventId: number, fallback?: string) => {
      const tournamentId = tournamentIdByEventId.get(Number(eventId));
      const actualName = tournamentId == null ? "" : tournamentNameById.get(tournamentId) || "";
      return actualName || cleanScheduleTitle(fallback) || `Tournament ${tournamentId ?? eventId}`;
    };
    const selectedTournamentId = filter?.tournamentId && filter.tournamentId !== "ALL" ? Number(filter.tournamentId) : null;
    const selectedYear = filter?.year && filter.year !== "ALL" ? Number(filter.year) : null;
    const eventYear = (raw?: string | null) => {
      const match = String(raw || "").match(/^(\d{4})/);
      return match ? Number(match[1]) : null;
    };
    const sourceYears = [...sourceEvents.map((event) => eventYear(event.eventDateStart)), ...(overview.tournaments || []).flatMap((tournament) => [eventYear(tournament.eventDateStart), eventYear(tournament.eventDateEnd)])]
      .filter((year): year is number => year != null);
    const availableYears = [...new Set(sourceYears)].sort((a, b) => b - a);
    const tournamentOptions = (overview.tournaments || []).map((tournament) => ({ id: Number(tournament.id), name: tournament.name }));
    const events = sourceEvents.filter((event) => matchesSport(event.sport?.name)
      && (selectedTournamentId == null || tournamentIdByEventId.get(Number(event.id)) === selectedTournamentId)
      && (selectedYear == null || eventYear(event.eventDateStart) === selectedYear)
      && inDateRange(event.eventDateStart, filter?.timeRange, now));
    const eventIds = new Set(events.map((event) => Number(event.id)));
    const eventMap = new Map(sourceEvents.map((event) => [Number(event.id), event]));
    const eventBelongsToTournament = (event: AdminEventRow, tournamentId: number) => tournamentIdByEventId.get(Number(event.id)) === Number(tournamentId);
    const registrations = allRegistrations.filter((row) => eventIds.has(Number(row.event?.id)));
    const participantKey = (row: EventRegistration) => {
      const registration = row as EventRegistration & { familyMemberId?: number; participantUserId?: number; familyMember?: { id?: number }; user?: { id?: number } };
      if (registration.familyMember?.id ?? registration.familyMemberId) return `family:${registration.familyMember?.id ?? registration.familyMemberId}`;
      if (registration.participantUserId ?? registration.user?.id) return `user:${registration.participantUserId ?? registration.user?.id}`;
      const playerName = String(row.playerName || "").trim().toLocaleLowerCase();
      return playerName ? `name:${playerName}` : `registration:${row.id}`;
    };
    const uniquePlayersByTournament = new Map<number, Set<string>>();
    registrations.forEach((registration) => {
      const eventId = Number(registration.event?.id);
      const tournamentId = tournamentIdByEventId.get(eventId);
      if (tournamentId == null) return;
      const participants = uniquePlayersByTournament.get(tournamentId) || new Set<string>();
      participants.add(participantKey(registration));
      uniquePlayersByTournament.set(tournamentId, participants);
    });
    const registrationsByEvent = new Map<number, EventRegistration[]>();
    allRegistrations.forEach((row) => { const id = Number(row.event?.id); registrationsByEvent.set(id, [...(registrationsByEvent.get(id) || []), row]); });
    const tournaments = (overview.tournaments || []).filter((tournament) => (selectedTournamentId == null || Number(tournament.id) === selectedTournamentId)
      && (events.some((event) => tournamentIdByEventId.get(Number(event.id)) === Number(tournament.id)) || (!filter?.sport || filter.sport === "ALL") && (!filter?.timeRange || filter.timeRange === "ALL") && selectedYear == null));
    const paymentTournaments = (overview.tournaments || []).filter((tournament) =>
      (selectedTournamentId == null || Number(tournament.id) === selectedTournamentId)
      && ((!filter?.sport || filter.sport === "ALL")
        || tournament.events?.some((event) => matchesSport(event.sport?.name))
        || sourceEvents.some((event) => matchesSport(event.sport?.name) && tournamentIdByEventId.get(Number(event.id)) === Number(tournament.id)))
    );
    const paymentResults = await Promise.all(paymentTournaments.map(async (tournament) => {
      try {
        const result = await tournamentPaymentService.getPaymentsWithSource(tournament.id);
        return { tournament, ...result };
      } catch {
        return { tournament, payments: {} as Record<string, TournamentPlayerPayment>, source: "LOCAL" as const, serverPlayerKeys: [] as string[] };
      }
    }));
    if (paymentResults.some((result) => result.source !== "SERVER")) {
      dataWarnings.push("The payments API was unavailable for one or more tournaments. Browser-local payment rows are shown as unverified and excluded from collected totals.");
    }
    const paymentInventory: SportsAnalyticsPaymentRow[] = paymentResults.flatMap(({ tournament, payments, serverPlayerKeys }) =>
      Object.entries(payments).map(([playerKey, payment]) => ({
        id: payment.id || `${tournament.id}-${playerKey}`,
        tournamentId: tournament.id,
        tournament: tournament.name,
        playerKey,
        playerName: payment.playerName || "Participant",
        flatNumber: payment.flatNumber || "",
        paymentStatus: payment.paymentStatus as "PAID" | "WAIVED",
        amount: Number.isFinite(Number(payment.amount)) ? Number(payment.amount) : 0,
        paymentMode: payment.paymentMode || "—",
        transactionRef: payment.transactionRef || "",
        paidAt: payment.paidAt || payment.createdAt || "",
        markedBy: payment.markedByUserName || "—",
        source: serverPlayerKeys.includes(playerKey) ? "SERVER" as const : "LOCAL" as const,
      }))
    ).filter((payment) => ["PAID", "WAIVED"].includes(payment.paymentStatus)
      && ((!filter?.timeRange || filter.timeRange === "ALL") || Boolean(payment.paidAt && inDateRange(payment.paidAt, filter.timeRange, now)))
      && (selectedYear == null || eventYear(payment.paidAt) === selectedYear));
    const collectedPaymentRows = paymentInventory.filter((payment) => payment.source === "SERVER" && payment.paymentStatus === "PAID");
    const paymentCollectedAmount = collectedPaymentRows.reduce((sum, payment) => sum + Math.max(0, payment.amount), 0);
    const paidTournamentPlayers = new Set(collectedPaymentRows.map((payment) => `${payment.tournamentId}:${payment.playerKey}`)).size;
    const waivedTournamentPlayers = new Set(paymentInventory.filter((payment) => payment.source === "SERVER" && payment.paymentStatus === "WAIVED").map((payment) => `${payment.tournamentId}:${payment.playerKey}`)).size;
    const tournamentInventory: SportsAnalyticsTournamentRow[] = tournaments.map((tournament) => {
      const relatedEvents = events.filter((event) => eventBelongsToTournament(event, tournament.id));
      return { id: tournament.id, name: tournament.name, status: label(tournament.registrationStatus), startDate: tournament.eventDateStart, endDate: tournament.eventDateEnd,
        sports: [...new Set(relatedEvents.map((event) => event.sport?.name).filter((name): name is string => Boolean(name)))], eventCount: relatedEvents.length,
        registrations: relatedEvents.reduce((sum, event) => sum + (registrationsByEvent.get(Number(event.id))?.length || 0), 0),
        registeredUsers: uniquePlayersByTournament.get(Number(tournament.id))?.size || 0 };
    });
    const eventInventory: SportsAnalyticsEventRow[] = events.map((event) => {
      const entries = registrationsByEvent.get(Number(event.id)) || [];
      return { id: event.id, tournament: tournaments.find((tournament) => eventBelongsToTournament(event, tournament.id))?.name || "—", name: event.name,
        sport: label(event.sport?.name), date: label(event.eventDateStart), venue: label(event.venue?.name), status: label(event.registrationStatus), capacity: event.maxParticipants,
        registered: entries.length, confirmed: entries.filter((row) => statusIs(row.status, "REGISTERED", "CONFIRMED")).length, pending: entries.filter((row) => statusIs(row.status, "PENDING")).length };
    });
    const registrationInventory: SportsAnalyticsRegistrationRow[] = registrations.map((registration) => {
      const event = eventMap.get(Number(registration.event?.id));
      return { id: registration.id, participant: label(registration.playerName || (registration as any).familyMember?.name || registration.user?.fullName), relation: label(registration.relation || (registration as any).familyMember?.relation), event: label(event?.name),
        tournament: event ? tournaments.find((row) => eventBelongsToTournament(event, row.id))?.name || "—" : "—", sport: label(event?.sport?.name), category: label(registration.category?.name || registration.role),
        status: registration.status, flat: label(registration.flatNumber), registeredAt: label(registration.registeredAt) };
    });

    const relatedConfigs = configs.filter((config) => matchesSport(config.sportName || eventMap.get(Number(config.eventId))?.sport?.name) &&
      (eventIds.has(Number(config.eventId)) || (!filter?.sport || filter.sport === "ALL") && (!filter?.timeRange || filter.timeRange === "ALL") && selectedTournamentId == null && selectedYear == null));
    const matchResults = await Promise.all(relatedConfigs.map(async (config) => {
      try { return { configId: config.id, matches: await tournamentService.getMatchesByConfigIdForAnalytics(config.id), loaded: true }; }
      catch { return { configId: config.id, matches: [] as any[], loaded: false }; }
    }));
    if (matchResults.some((result) => !result.loaded)) dataWarnings.push("One or more saved match schedules could not be loaded from the tournament service.");
    const matchesByConfig = new Map<number, any[]>(matchResults.map((result) => [result.configId, result.matches]));
    const scopedMatches = relatedConfigs.flatMap((config) => (matchesByConfig.get(config.id) || []).filter((match: any) => {
      const scheduledAt = match.scheduledAt || match.startTime || match.matchDate;
      return inDateRange(scheduledAt, filter?.timeRange, now) && (selectedYear == null || eventYear(scheduledAt) === selectedYear);
    }).map((match: any) => ({ config, match })));
    const isCompletedMatch = (match: any) => statusIs(match.status, "COMPLETED", "FINISHED", "RESULT_RECORDED");
    const getStage = (match: any) => String(match.stage || match.roundName || match.round || match.matchType || "").replace(/[_-]/g, " ").trim();
    const isFinalMatch = (match: any) => /\bfinal\b/i.test(getStage(match)) && !/\b(semi|quarter|preliminary)\b/i.test(getStage(match));
    const finalMatchesNeedingDetails = scopedMatches.filter(({ match }: any) => isCompletedMatch(match) && isFinalMatch(match)
      && !String(match.winnerName || match.winnerTeamName || match.winner?.name || "").trim()
      && Number.isFinite(Number(match.id ?? match.matchId)));
    const finalDetailResults = await Promise.all(finalMatchesNeedingDetails.map(async ({ match }: any) => {
      try { return { id: String(match.id ?? match.matchId), detail: await tournamentService.getMatchDetailForAnalytics(Number(match.id ?? match.matchId)) }; }
      catch { return { id: String(match.id ?? match.matchId), detail: null }; }
    }));
    const finalDetailsByMatchId = new Map(finalDetailResults.map(({ id, detail }) => [id, detail]));
    const matchInventory: SportsAnalyticsMatchRow[] = scopedMatches.map(({ config, match }: any) => {
      const event = eventMap.get(Number(config.eventId));
      const detail = finalDetailsByMatchId.get(String(match.id ?? match.matchId));
      const homeTeam = match.homeTeamName || match.homeTeam?.name || match.teamA?.name || match.team1Name || detail?.teamA?.name;
      const awayTeam = match.awayTeamName || match.awayTeam?.name || match.teamB?.name || match.team2Name || detail?.teamB?.name;
      const homeScore = validScoreValue(match.homeScore, match.team1Score, match.scoreTeamA, match.scoreA, detail?.scoreTeamA);
      const awayScore = validScoreValue(match.awayScore, match.team2Score, match.scoreTeamB, match.scoreB, detail?.scoreTeamB);
      const homeNumeric = Number(homeScore);
      const awayNumeric = Number(awayScore);
      const explicitWinner = String(match.winnerName || match.winnerTeamName || match.winner?.name || detail?.winnerName || "").trim();
      const scoreWinner = homeScore != null && awayScore != null && Number.isFinite(homeNumeric) && Number.isFinite(awayNumeric)
        ? homeNumeric === awayNumeric ? "Draw" : homeNumeric > awayNumeric ? String(homeTeam || "") : String(awayTeam || "")
        : "";
      const stage = getStage(match);
      return { id: match.id ?? match.matchId ?? `${config.id}-${match.matchNumber ?? "match"}`, tournament: getTournamentName(Number(config.eventId), config.tournamentName), event: label(config.eventName || event?.name), sport: label(config.sportName || event?.sport?.name),
        stage: label(stage), homeTeam: label(homeTeam), awayTeam: label(awayTeam), score: homeScore != null || awayScore != null ? `${homeScore ?? "—"} – ${awayScore ?? "—"}` : "—",
        winner: explicitWinner || scoreWinner, scheduledAt: label(match.scheduledAt || match.startTime || match.matchDate), venue: label(match.venueName || match.venue?.name || detail?.venueName), status: label(match.status),
        isFinal: isFinalMatch(match), isCompleted: isCompletedMatch(match) };
    });
    const relatedAuctions = auctionConfigs.filter((config) => matchesSport(config.sportName) && (eventIds.has(Number(config.eventId)) || (!filter?.sport || filter.sport === "ALL") && (!filter?.timeRange || filter.timeRange === "ALL") && selectedTournamentId == null && selectedYear == null));
    const teamResults = await Promise.all(relatedAuctions.map(async (config) => {
      try { return { config, teams: await auctionService.getTeamsSummary(config.id), loaded: true }; }
      catch { return { config, teams: [] as AuctionTeam[], loaded: false }; }
    }));
    if (teamResults.some((result) => !result.loaded)) dataWarnings.push("One or more auction team rosters could not be loaded.");
    const teamInventory: SportsAnalyticsTeamRow[] = teamResults.flatMap(({ config, teams }) => teams.map((team, index) => ({ id: team.id || config.id * 10000 + index, team: label(team.teamName || team.name),
      tournament: label(config.seasonName), event: label(config.eventName || eventMap.get(Number(config.eventId))?.name), sport: label(config.sportName),
      captain: label(team.captainUser?.fullName || team.ownerName || team.ownerUser?.fullName), players: (team.players || []).map((player) => player.name || player.playerName).filter((name): name is string => Boolean(name)), playerCount: (team.players || []).length })));

    const sportNames = filter?.sport && filter.sport !== "ALL" ? [filter.sport] : allSports;
    const eventsBySport: Record<string, number> = {}; sportNames.forEach((sport) => eventsBySport[sport] = 0);
    events.forEach((event) => { if (event.sport?.name) eventsBySport[event.sport.name] = (eventsBySport[event.sport.name] || 0) + 1; });
    const eventTotal = events.length;
    const sportShare = sportNames.map((name) => ({ name, count: eventsBySport[name] || 0, value: eventTotal ? Math.round((eventsBySport[name] || 0) / eventTotal * 100) : 0, color: colorMap[name] || SPORT_COLORS[0] })).filter((row) => row.count > 0).sort((a, b) => b.count - a.count);
    const monthlyActivity = new Map<string, { events: number; players: Set<string>; sports: Record<string, number> }>();
    const monthActivity = (date: Date) => {
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (!monthlyActivity.has(key)) monthlyActivity.set(key, { events: 0, players: new Set(), sports: Object.fromEntries(sportNames.map((sport) => [sport, 0])) });
      return monthlyActivity.get(key)!;
    };
    events.forEach((event) => { if (!event.eventDateStart || !event.sport?.name) return; const date = new Date(event.eventDateStart); if (!Number.isNaN(date.getTime())) { const activity = monthActivity(date); activity.events++; activity.sports[event.sport.name] = (activity.sports[event.sport.name] || 0) + 1; } });
    registrations.forEach((row) => { if (!row.registeredAt || !inDateRange(row.registeredAt, filter?.timeRange, now)) return; const date = new Date(row.registeredAt); if (Number.isNaN(date.getTime())) return; monthActivity(date).players.add(String((row as any).familyMemberId ?? (row as any).participantUserId ?? row.user?.id ?? row.playerName ?? row.id)); });
    const monthlyEvents: MonthlyEventRow[] = [...monthlyActivity.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, activity]) => {
      const [year, month] = key.split("-").map(Number);
      return { month: `${MONTHS[month - 1]} ${year}`, ...activity.sports };
    });
    const participationTrend = [...monthlyActivity.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, activity]) => {
      const [year, month] = key.split("-").map(Number);
      return { month: `${MONTHS[month - 1]} ${year}`, players: activity.players.size, events: activity.events };
    });
    const venueCounts = new Map<string, { count: number; city?: string }>();
    events.forEach((event) => { if (!event.venue?.name) return; const existing = venueCounts.get(event.venue.name); venueCounts.set(event.venue.name, { count: (existing?.count || 0) + 1, city: event.venue.city || existing?.city }); });
    const venueUtilization = [...venueCounts].map(([name, value]) => ({ name, eventsCount: value.count, percentage: eventTotal ? Math.round(value.count / eventTotal * 100) : 0, city: value.city })).sort((a, b) => b.eventsCount - a.eventsCount);
    const genderCounts = new Map<string, number>(); const ageCounts = [0, 0, 0, 0]; const flatCounts = new Map<string, number>();
    registrations.forEach((row) => {
      const gender = String((row as any).familyMember?.gender || (row.user as any)?.gender || "").toUpperCase();
      if (!gender) return;
      const genderLabel = gender.includes("FEMALE") || gender.includes("WOMEN") ? "Female" : gender.includes("MALE") || gender.includes("MEN") ? "Male" : gender.includes("MIXED") || gender === "ALL" ? "Mixed / all" : gender ? "Other" : "Not provided";
      genderCounts.set(genderLabel, (genderCounts.get(genderLabel) || 0) + 1);
      const age = Number(row.age);
      const participantAge = row.age ?? (row as any).familyMember?.age;
      if (participantAge != null && Number.isFinite(Number(participantAge)) && Number(participantAge) >= 0) ageCounts[Number(participantAge) <= 12 ? 0 : Number(participantAge) <= 18 ? 1 : Number(participantAge) < 45 ? 2 : 3]++;
      if (row.flatNumber?.trim()) flatCounts.set(row.flatNumber.trim(), (flatCounts.get(row.flatNumber.trim()) || 0) + 1);
    });
    const genderPalette = ["#6366f1", "#ec4899", "#10b981", "#94a3b8"];
    const totalGender = [...genderCounts.values()].reduce((sum, value) => sum + value, 0);
    const demographics: DemographicsData = {
      gender: [...genderCounts].map(([name, count], index) => ({ name, count, value: totalGender ? Math.round(count / totalGender * 100) : 0, color: genderPalette[index % genderPalette.length] })),
      ageGroups: ["0–12", "13–18", "19–44", "45+"].map((group, index) => ({ group, count: ageCounts[index], percentage: ageCounts.reduce((sum, value) => sum + value, 0) ? Math.round(ageCounts[index] / ageCounts.reduce((sum, value) => sum + value, 0) * 100) : 0, color: ["#38bdf8", "#818cf8", "#34d399", "#fbbf24"][index] })).filter((item) => item.count > 0),
      blockDistribution: [...flatCounts].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([block, players], index) => ({ block, players, color: ["#6366f1", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4"][index] })),
    };
    const leaders: Record<string, SportLeaderEntry[]> = {};
    sportNames.forEach((sport) => { const people = new Map<string, { name: string; count: number; flat?: string }>(); registrations.filter((row) => (eventMap.get(Number(row.event?.id))?.sport?.name || row.event?.sport?.name) === sport).forEach((row) => { const name = row.playerName || row.user?.fullName; if (!name) return; const item = people.get(name) || { name, count: 0, flat: row.flatNumber }; item.count++; people.set(name, item); }); leaders[sport] = [...people.values()].sort((a, b) => b.count - a.count).slice(0, 5).map((person, index) => ({ rank: index + 1, name: person.name, category: "Registered participant", metricLabel: "registrations", metricValue: person.count, subMetric: person.flat ? `Flat ${person.flat}` : undefined, sport, avatar: initials(person.name), color: GRADIENT_CLASSES[index % GRADIENT_CLASSES.length] })); });
    const totalGames = matchInventory.length; const completed = matchInventory.filter((match) => statusIs(match.status, "COMPLETED", "FINISHED", "RESULT_RECORDED")).length;
    const participants = new Set(registrations.map((row) => String((row as any).familyMember?.id ?? (row as any).familyMemberId ?? (row as any).participantUserId ?? row.user?.id ?? row.playerName ?? row.id)));
    const capacityEvents = events.filter((event) => Number(event.maxParticipants) > 0); const capacity = capacityEvents.reduce((sum, event) => sum + Number(event.maxParticipants || 0), 0);
    const capacityFillRate = capacity ? Math.min(100, Math.round(capacityEvents.reduce((sum, event) => sum + (registrationsByEvent.get(Number(event.id))?.length || 0), 0) / capacity * 100)) : 0;
    return {
      kpis: { totalEvents: events.length, activePlayers: participants.size, liveEvents: matchInventory.filter((match) => statusIs(match.status, "LIVE", "IN_PROGRESS")).length, totalTournaments: tournamentInventory.length,
        openRegistrations: events.filter((event) => statusIs(event.registrationStatus, "OPEN", "REGISTRATION_OPEN")).length, yourRegistrations: registrations.length,
        tournamentRegistrants: tournamentInventory.reduce((sum, tournament) => sum + tournament.registeredUsers, 0), eventPlayerEntries: registrations.length,
        paymentCollectedAmount, paidTournamentPlayers, waivedTournamentPlayers,
        matchCompletionRate: totalGames ? Math.round(completed / totalGames * 100) : 0, capacityFillRate, capacityTracked: capacity > 0, totalMatches: totalGames },
      monthlyEvents, sportShare, participationTrend, demographics, venueUtilization, sportLeaders: leaders,
      standings: makeStandings(relatedConfigs, matchesByConfig, getTournamentName), sportNames, sportColorMap: colorMap, tournamentOptions, availableYears, eventInventory, tournamentInventory, paymentInventory, registrationInventory, matchInventory, teamInventory, dataWarnings,
    };
  },
};
